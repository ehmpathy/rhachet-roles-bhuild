/**
 * .what = cli entry point for radio.task.queue skill: get | set | del | drain
 * .why  = a clone can read, amend, drop, and deliver the records held for the radio in
 *         this worktree, so no held record ever needs a hand move of its file (#604)
 *
 * usage:
 *   radio.task.queue get                                  what waits: key · task · reason · fix
 *   radio.task.queue get --when hook.onStop               one-line stop reminder (naught when none)
 *   radio.task.queue set   --key K --auth as-human        amend one held record (or --description)
 *   radio.task.queue del   --key K --why "superseded"     drop one, its body and why kept
 *   radio.task.queue drain [--auth as-human]              deliver now; a fault sets one record aside
 *
 * guarantee:
 *   - get reads local records + radio.uses only; no network, no send
 *   - set and del send naught; they run under the drain lock, so never mid-send
 *   - drain meets each record's own radio.uses gate; a shut gate delivers naught and says so
 *   - drain exits 2 while any record still waits
 *   - hook.onStop never blocks the stop (never exit 2)
 */

import { BadRequestError } from 'helpful-errors';
import { z } from 'zod';

import { asGithubAuthMode } from '@src/domain.operations/radio/auth/asGithubAuthMode';
import { asRadioAmendOutput } from '@src/domain.operations/radio/record/asRadioAmendOutput';
import { asRadioDrainOutput } from '@src/domain.operations/radio/record/asRadioDrainOutput';
import { asRadioDropOutput } from '@src/domain.operations/radio/record/asRadioDropOutput';
import { asRadioHeldOutput } from '@src/domain.operations/radio/record/asRadioHeldOutput';
import { getAllRadioTaskRecordsHeld } from '@src/domain.operations/radio/record/getAllRadioTaskRecordsHeld';
import { getAllRadioTaskRecordsHeldWithLift } from '@src/domain.operations/radio/record/getAllRadioTaskRecordsHeldWithLift';
import { setRadioTaskRecordAmended } from '@src/domain.operations/radio/record/setRadioTaskRecordAmended';
import { setRadioTaskRecordDropped } from '@src/domain.operations/radio/record/setRadioTaskRecordDropped';
import { setRadioTaskRecordsDrained } from '@src/domain.operations/radio/record/setRadioTaskRecordsDrained';
import { getCliArgs } from '@src/infra/cli';
import { getOneStdinText } from '@src/infra/cli/getOneStdinText';
import { withStopHookNeverBlocks } from '@src/infra/cli/withStopHookNeverBlocks';
import { shx } from '@src/infra/shell/shx';

const schemaOfArgs = z.object({
  named: z.object({
    // help flag
    help: z.boolean().optional(),
    h: z.boolean().optional(),

    // get: hook mode
    when: z.enum(['hook.onStop']).optional(),

    // set | del: the record to act on
    key: z.string().optional(),

    // set | drain: the auth to send under
    auth: z.string().optional(),

    // set: the new body (supports @stdin)
    description: z.string().optional(),

    // set: a title is refused (it is a create's identity); read so it is never dropped silently
    title: z.string().optional(),

    // del: why the record is dropped
    why: z.string().optional(),

    // rhachet passthrough args (optional, ignored)
    repo: z.string().optional(),
    role: z.string().optional(),
    skill: z.string().optional(),
    s: z.string().optional(),
  }),
  ordered: z.array(z.string()).default([]),
});

const HELP_TEXT = `
🦫 let's check the meter...

🎙️ radio.task.queue --help
   ├─ usage
   │  ├─ radio.task.queue get                               what waits: key · task · reason · fix
   │  ├─ radio.task.queue get --when hook.onStop            one-line stop reminder (naught when none)
   │  ├─ radio.task.queue set   --key K --auth as-human     amend one held record (or --description)
   │  ├─ radio.task.queue del   --key K --why "superseded"  drop one, its body and why kept
   │  └─ radio.task.queue drain [--auth as-human]           deliver now; a fault sets one record aside
   │
   ├─ the line
   │  ├─ a rate limit or a github outage halts the drain; the rest wait in order
   │  └─ any other fault sets its one record aside; the rest still deliver
   │
   └─ options
      ├─ --key          the record key \`get\` prints (set, del)
      ├─ --auth         as-robot:via-keyrack(owner) | as-robot:env(VAR) | as-robot:shx(cmd) | as-human
      ├─ --description  the new body (set; supports @stdin)
      ├─ --why          why the record is dropped (del, required)
      ├─ --when         hook.onStop (get)
      └─ --help, -h     show this help
`.trim();

/**
 * .what = an --auth value, checked against the auth grammar, or null when absent
 * .why  = an unknown mode stored on a record would fault on every later drain; refuse it now
 */
const asAuthFromArg = (input: { raw: string | undefined }): string | null => {
  if (input.raw === undefined) return null;
  if (asGithubAuthMode({ auth: input.raw }).kind === 'unknown')
    throw new BadRequestError(
      `--auth "${input.raw}" is not an auth mode; use as-human, as-robot:via-keyrack(owner), as-robot:env(VAR), or as-robot:shx(cmd)`,
    );
  return input.raw;
};

/**
 * .what = the --key value, or a constraint that names how to find one
 * .why  = set and del act on one record; the key is how the caller names it
 */
const asKeyFromArg = (input: { raw: string | undefined }): string => {
  if (input.raw) return input.raw;
  throw new BadRequestError(
    '--key is required; run `rhx radio.task.queue get` to list the keys',
  );
};

const _cliRadioTaskQueue = async (): Promise<void> => {
  const { named, ordered } = getCliArgs({ schema: schemaOfArgs });

  // handle --help flag, or no verb
  const verb = ordered[0];
  if (named.help || named.h || verb === undefined) {
    console.log(HELP_TEXT);
    return;
  }
  const context = {
    cwd: process.cwd(),
    homeDir: process.env.HOME,
    env: process.env,
    shx,
  };

  // get: the queue, or the one-line stop reminder
  if (verb === 'get') {
    const mode = named.when === 'hook.onStop' ? 'hook.onStop' : 'list';
    const held = await getAllRadioTaskRecordsHeldWithLift({}, context);
    const output = asRadioHeldOutput({ held, mode });
    if (mode === 'list') return void console.log(output);
    if (output === null) return;
    return void console.log(JSON.stringify({ systemMessage: output }));
  }

  // set: amend the auth or body of one held record
  if (verb === 'set') {
    if (named.title !== undefined)
      throw new BadRequestError(
        '--title cannot be amended: a title names a create; `queue del` it and re-push to retitle',
      );
    const amended = await setRadioTaskRecordAmended(
      {
        key: asKeyFromArg({ raw: named.key }),
        auth: asAuthFromArg({ raw: named.auth }),
        description:
          named.description === '@stdin'
            ? getOneStdinText()
            : (named.description ?? null),
      },
      context,
    );
    return void console.log(asRadioAmendOutput(amended));
  }

  // del: drop one held record, with a why
  if (verb === 'del') {
    const dropped = await setRadioTaskRecordDropped(
      { key: asKeyFromArg({ raw: named.key }), why: named.why ?? '' },
      context,
    );
    return void console.log(asRadioDropOutput(dropped));
  }

  // drain: deliver every held record whose gate is open; exit 2 while any still waits
  if (verb === 'drain') {
    const { fates } = await setRadioTaskRecordsDrained(
      {},
      { ...context, authOverride: asAuthFromArg({ raw: named.auth }) },
    );
    const backlog = getAllRadioTaskRecordsHeld({}, context).length;
    console.log(asRadioDrainOutput({ fates, backlog }));
    if (backlog > 0) process.exitCode = 2;
    return;
  }

  // any other verb: name the four
  throw new BadRequestError(
    `"${verb}" is not a queue verb; use get, set, del, or drain (see --help)`,
  );
};

export const cliRadioTaskQueue = withStopHookNeverBlocks(_cliRadioTaskQueue);
