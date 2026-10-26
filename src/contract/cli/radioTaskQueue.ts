/**
 * .what = cli entry point for radio.task.queue skill: get | set | del | drain
 * .why  = a clone can read, amend, drop, and deliver the records held for the radio in
 *         this worktree, so no held record ever needs a hand move of its file (#604)
 *
 * usage:
 *   radio.task.queue get                                  what waits: key · task · reason · fix
 *   radio.task.queue get --when hook.onStop               one-line stop reminder (naught when none)
 *   radio.task.queue set   --key <key> --auth as-human    amend one held record (or --description)
 *   radio.task.queue del   --key <key> --why "<why>"      drop one, its body and why kept
 *   radio.task.queue drain [--auth as-human]              deliver now; a fault sets one record aside
 *
 * guarantee:
 *   - get reads local records + radio.uses only; no network, no send
 *   - set and del send naught; they run under the drain lock, so never mid-send
 *   - drain meets each record's own radio.uses gate; a shut gate delivers naught and says so
 *   - drain sends updates to one issue in order: a later one waits behind an earlier one held
 *   - drain exits 2 while any record still waits, or when it refused any record
 *   - a flag or a positional a verb does not read is refused before it acts
 *   - hook.onStop never blocks the stop (never exit 2)
 */

import { ConstraintError } from 'helpful-errors';
import { z } from 'zod';

import { asGithubAuthMode } from '@src/domain.operations/radio/auth/asGithubAuthMode';
import { asRadioAmendOutput } from '@src/domain.operations/radio/record/asRadioAmendOutput';
import { asRadioDrainAuthNotice } from '@src/domain.operations/radio/record/asRadioDrainAuthNotice';
import { asRadioDrainOutput } from '@src/domain.operations/radio/record/asRadioDrainOutput';
import { asRadioDropOutput } from '@src/domain.operations/radio/record/asRadioDropOutput';
import { asRadioHeldOutput } from '@src/domain.operations/radio/record/asRadioHeldOutput';
import { asRadioLockWaitNotice } from '@src/domain.operations/radio/record/asRadioLockWaitNotice';
import { getAllRadioQueueFlagsUnread } from '@src/domain.operations/radio/record/getAllRadioQueueFlagsUnread';
import { getAllRadioTaskRecordsHeld } from '@src/domain.operations/radio/record/getAllRadioTaskRecordsHeld';
import { getAllRadioTaskRecordsHeldWithLift } from '@src/domain.operations/radio/record/getAllRadioTaskRecordsHeldWithLift';
import { setRadioTaskRecordAmended } from '@src/domain.operations/radio/record/setRadioTaskRecordAmended';
import { setRadioTaskRecordDropped } from '@src/domain.operations/radio/record/setRadioTaskRecordDropped';
import { setRadioTaskRecordsDrained } from '@src/domain.operations/radio/record/setRadioTaskRecordsDrained';
import { getCliArgs } from '@src/infra/cli';
import { getOneArgOrStdinText } from '@src/infra/cli/getOneArgOrStdinText';
import { withStopHookNeverBlocks } from '@src/infra/cli/withStopHookNeverBlocks';
import { shx } from '@src/infra/shell/shx';

const schemaOfArgs = z.object({
  named: z
    .object({
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
    })
    // keep unknown flags, so a verb can refuse the ones it would ignore (never strip them)
    .loose(),
  ordered: z.array(z.string()).default([]),
});

const HELP_TEXT = `
🦫 let's check the meter...

🎙️ radio.task.queue --help
   ├─ usage
   │  ├─ rhx radio.task.queue get                                   what waits: key · task · reason · fix
   │  ├─ rhx radio.task.queue get --when hook.onStop                one-line stop reminder (naught when none)
   │  ├─ rhx radio.task.queue set   --key <key> --auth as-human     amend one held record (or --description)
   │  ├─ rhx radio.task.queue del   --key <key> --why "<why>"       drop one, its body and why kept
   │  └─ rhx radio.task.queue drain [--auth as-human]               deliver now; a fault sets one record aside
   │
   ├─ the line
   │  ├─ a rate limit or a github outage halts the drain; the rest wait in order
   │  ├─ any other fault sets its one record aside; the rest still deliver
   │  └─ a later update to the same issue waits behind it, unsent, until it lands or is dropped
   │
   ├─ exit codes
   │  ├─ drain
   │  │  ├─ 0  naught waits, naught refused
   │  │  └─ 2  a record still waits, or this drain refused one (its why is in the output)
   │  └─ get, set, del
   │     └─ 0  done, even with records held; 2 only on a bad call
   │
   └─ options
      ├─ --key          the record key \`get\` prints (set, del)
      ├─ --auth         as-robot:via-keyrack(owner) | as-robot:env(VAR) | as-robot:shx(cmd) | as-human
      │  ├─ set:   amends the one record --key names
      │  └─ drain: sends every held record under this auth, this drain only
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
    throw new ConstraintError(
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
  throw new ConstraintError(
    '--key is required; run `rhx radio.task.queue get` to list the keys',
  );
};

/**
 * .what = refuse a flag the verb would ignore, before the verb acts
 * .why  = an ignored flag is a silent surprise: `drain --key K` sends the whole line, and
 *         `drain --mode plan` sends for real; the caller hears it before any send
 */
const assertRadioQueueFlagsRead = (input: {
  verb: 'get' | 'set' | 'del' | 'drain';
  named: Record<string, unknown>;
}): void => {
  const flags = Object.keys(input.named).filter(
    (flag) => input.named[flag] !== undefined,
  );
  const { unread, accepted } = getAllRadioQueueFlagsUnread({
    verb: input.verb,
    flags,
  });
  if (unread.length === 0) return;

  // name the next move: drop the flag; a --key on drain means the caller wanted one record
  const hintOneRecord = unread.includes('key')
    ? ' to act on one record, run `rhx radio.task.queue set --key <key>` or `rhx radio.task.queue del --key <key>`.'
    : '';
  throw new ConstraintError(
    `${input.verb} does not read ${unread.map((flag) => `--${flag}`).join(', ')}. drop it, then run again. ${input.verb} reads ${accepted.map((flag) => `--${flag}`).join(', ')} (see --help).${hintOneRecord}`,
  );
};

/**
 * .what = refuse a positional after the verb, before the verb acts
 * .why  = `drain <key>` reads as "drain this one" yet would send every held record; a verb
 *         names its record by --key, never by position, so a positional is always a mistake
 */
const assertRadioQueuePositionalsAbsent = (input: {
  verb: 'get' | 'set' | 'del' | 'drain';
  ordered: string[];
}): void => {
  const positionals = input.ordered.slice(1);
  if (positionals.length === 0) return;
  throw new ConstraintError(
    `${input.verb} takes no positional (got: ${positionals.join(' ')}); name one record by --key with set or del, or run \`rhx radio.task.queue get\` to list the keys`,
  );
};

/**
 * .what = the --description value, read from the arg or stdin, never blank
 * .why  = a blank body would overwrite the held task's description with naught
 */
const asDescriptionFromArg = (input: {
  raw: string | undefined;
}): string | null => {
  const description = getOneArgOrStdinText({ raw: input.raw ?? null });
  if (description === null) return null;
  if (description.trim().length > 0) return description;
  throw new ConstraintError(
    '--description is empty; pass the new body, e.g. --description "reminder: lesson at 9am", or pipe it via @stdin',
  );
};

/**
 * .what = read the verb, then run get, set, del, or drain
 * .why  = one skill entry for the queue; each verb is a short paragraph over its domain op
 */
const _cliRadioTaskQueue = async (): Promise<void> => {
  const { named, ordered } = getCliArgs({ schema: schemaOfArgs });

  // handle --help flag, or no verb
  const verb = ordered[0];
  if (named.help || named.h || verb === undefined) {
    console.log(HELP_TEXT);
    return;
  }

  // refuse a flag or a positional the verb would ignore (an unknown verb is refused below, by name)
  if (verb === 'get' || verb === 'set' || verb === 'del' || verb === 'drain') {
    assertRadioQueueFlagsRead({ verb, named });
    assertRadioQueuePositionalsAbsent({ verb, ordered });
  }
  const context = {
    cwd: process.cwd(),
    homeDir: process.env.HOME,
    env: process.env,
    shx,
    // a verb blocked on another drain says so once, on stdout: rhachet drops stderr on exit 0
    onLockWait: () => console.log(asRadioLockWaitNotice()),
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
      throw new ConstraintError(
        '--title cannot be amended: the title is what the push creates; to retitle, run `rhx radio.task.queue del --key <key>` and push again',
      );
    const amended = await setRadioTaskRecordAmended(
      {
        key: asKeyFromArg({ raw: named.key }),
        auth: asAuthFromArg({ raw: named.auth }),
        description: asDescriptionFromArg({ raw: named.description }),
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

  // drain: deliver every held record whose gate is open; exit 2 while any still waits, or if any was refused
  if (verb === 'drain') {
    const authOverride = asAuthFromArg({ raw: named.auth });
    const { fates } = await setRadioTaskRecordsDrained(
      {},
      { ...context, authOverride },
    );
    const backlog = getAllRadioTaskRecordsHeld({}, context).length;

    // an override reaches every record this drain sends, so the output names it
    const notice = asRadioDrainAuthNotice({ fates, authOverride });
    if (notice) console.log(notice);
    console.log(asRadioDrainOutput({ fates, backlog, authOverride }));
    // a refused record is closed, not held, so the backlog alone would read it as success
    const isAnyRefused = fates.some((fate) => fate.fate === 'refused');
    if (backlog > 0 || isAnyRefused) process.exitCode = 2;
    return;
  }

  // any other verb: name the four
  throw new ConstraintError(
    `"${verb}" is not a queue verb; use get, set, del, or drain (see --help)`,
  );
};

export const cliRadioTaskQueue = withStopHookNeverBlocks(_cliRadioTaskQueue);
