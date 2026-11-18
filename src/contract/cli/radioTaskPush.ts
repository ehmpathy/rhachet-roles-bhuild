/**
 * .what = cli entry point for radio.task.push skill
 * .why  = enables task dispatch to radio channels from shell
 *
 * .note = every push is transcribed into $route/.radio/ (or .behavior/.radio/ when
 *         no single route is bound) before the gate. a shut gate holds it QUEUED
 *         (exit 2); an open gate delivers the held backlog first, then this push
 *
 * .note = cwd is the repo root, by contract (rule.forbid.cwd-override): the route
 *         bind and `.behavior/` are read from cwd, never walked up to. a push run
 *         from a subdir finds no route there, so it records in that subdir's
 *         `.behavior/.radio/`, and a held push names that home in its output
 *
 * options:
 *   --via         channel: gh.issues or os.fileops (required)
 *   --into        target repo: @this (current git repo) or owner/name (required)
 *   --title       task title (required for new tasks)
 *   --description task description (required for new tasks; supports @stdin)
 *   --exid        external id for updates
 *   --status      task status: QUEUED, CLAIMED, DELIVERED
 *   --idem        idempotency mode: findsert or upsert
 *   --auth        as-human | as-robot:via-keyrack(owner) | as-robot:env(VAR) | as-robot:shx(cmd)
 *   --help        show usage and exit
 *
 * usage:
 *   radio.task.push --via gh.issues --into @this --title "..." --description "..."
 *   radio.task.push --via os.fileops --into @this --exid 123 --status CLAIMED
 *   radio.task.push --via gh.issues --into owner/repo --exid 599 --status CLAIMED --auth as-human
 *   echo "detailed task" | radio.task.push --via gh.issues --into @this --title "..." --description @stdin
 */

import { ConstraintError } from 'helpful-errors';
import { z } from 'zod';

import { IdempotencyMode } from '@src/domain.objects/IdempotencyMode';
import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';
import { asPushTaskFromArgs } from '@src/domain.operations/radio/cli/asPushTaskFromArgs';
import { getOneRadioTaskRepoFromCliArg } from '@src/domain.operations/radio/cli/getOneRadioTaskRepoFromCliArg';
import { setRadioTaskRecordFromPush } from '@src/domain.operations/radio/record/setRadioTaskRecordFromPush';
import { getCliArgs } from '@src/infra/cli';
import { getOneArgOrStdinText } from '@src/infra/cli/getOneArgOrStdinText';

import { setRadioTaskRecordThenDrain } from './setRadioTaskRecordThenDrain';

// ────────────────────────────────────────────────────────────────────
// schema
// ────────────────────────────────────────────────────────────────────

const schemaOfArgs = z.object({
  named: z.object({
    // help flag
    help: z.boolean().optional(),
    h: z.boolean().optional(),

    // required: channel
    via: z.nativeEnum(RadioChannel).optional(),

    // optional: auth mode (required for gh.issues if GITHUB_TOKEN not set)
    // supports: "as-human" or "as-robot:ENV_VAR_NAME"
    auth: z.string().optional(),

    // required: target repo (@this or owner/name)
    into: z.string().optional(),
    exid: z.string().optional(),

    // optional: task data
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.nativeEnum(RadioTaskStatus).optional(),

    // optional: idempotency mode
    idem: z.nativeEnum(IdempotencyMode).optional(),

    // a flag of radio.task.comment; declared so it is refused, never dropped
    comment: z.string().optional(),

    // rhachet passthrough args (optional, ignored)
    repo: z.string().optional(),
    role: z.string().optional(),
    skill: z.string().optional(),
    s: z.string().optional(),
  }),
  ordered: z.array(z.string()).default([]),
});

// ────────────────────────────────────────────────────────────────────
// exported CLI entry point
// ────────────────────────────────────────────────────────────────────

const HELP_TEXT = `
🦫 let's check the meter...

🎙️ radio.task.push --help
   ├─ usage
   │  ├─ rhx radio.task.push --via gh.issues --into owner/repo --title "..." --description "..."
   │  ├─ rhx radio.task.push --via os.fileops --into @this --exid 123 --status CLAIMED
   │  ├─ rhx radio.task.push --via gh.issues --into owner/repo --exid 599 --status CLAIMED --auth as-human
   │  └─ echo "details" | rhx radio.task.push --via gh.issues --into @this --title "..." --description @stdin
   │
   ├─ held, never lost
   │  ├─ every push is recorded first, into $route/.radio/ (or .behavior/.radio/)
   │  ├─ a shut gate or an upstream fault holds it QUEUED, exit 2
   │  ├─ the next push that gets through delivers the backlog first, oldest first
   │  ├─ see what waits: rhx radio.task.queue get
   │  └─ lift a shut gate (human): rhx radio.uses allow
   │
   └─ options
      ├─ --via         channel: gh.issues or os.fileops (required)
      ├─ --into        target: @this (current repo) or owner/repo (required)
      ├─ --title       task title (required for new tasks)
      ├─ --description task description (required for new tasks; supports @stdin)
      ├─ --exid        external id for updates
      ├─ --status      status: QUEUED, CLAIMED, DELIVERED
      ├─ --idem        idempotency: findsert or upsert
      ├─ --auth        mode: as-robot:via-keyrack(owner) | as-robot:env(VAR) | as-robot:shx(cmd) | as-human
      └─ --help, -h    show this help
`.trim();

export const cliRadioTaskPush = async (): Promise<void> => {
  const { named } = getCliArgs({ schema: schemaOfArgs });

  // handle --help flag
  if (named.help || named.h) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  // refuse a comment flag: a silent drop would leave an empty update that reads as done
  if (named.comment !== undefined)
    throw new ConstraintError(
      `--comment is not read by radio.task.push, which changes a task's title, body, or status; to comment on a task, issue, or pr, use rhx radio.task.comment --via ${named.via ?? '<via>'} --into ${named.into ?? '<into>'} --exid ${named.exid ?? '<n>'} --comment @stdin`,
    );

  // validate required --via arg (not validated by schema to allow --help without it)
  // .note = the fix rides in the message, never in metadata — helpful-errors prints metadata as a raw json block
  if (!named.via)
    throw new ConstraintError(
      '--via is required; specify a channel: --via gh.issues or --via os.fileops',
    );

  // validate required --into arg, the same way, so the fix reads in the header line
  if (!named.into)
    throw new ConstraintError(
      '--into is required; use --into @this (current git repo) or --into owner/name',
    );

  // derive repo from --into arg (required)
  const repo = await getOneRadioTaskRepoFromCliArg({
    arg: named.into ?? null,
    argName: '--into',
    errorContext: {
      notFoundMessage: '--into is required',
      hint: 'use --into @this (current git repo) or --into owner/name',
    },
  });

  // read the push whole before the gate: the record needs its body
  const description = getOneArgOrStdinText({
    raw: named.description ?? null,
  });
  const task = asPushTaskFromArgs({
    repo,
    exid: named.exid ?? null,
    title: named.title ?? null,
    description,
    status: named.status ?? null,
  });

  // transcribe, then meet the gate and drain, via the path every radio write shares
  const via = named.via;
  await setRadioTaskRecordThenDrain({
    transcribe: (home) =>
      setRadioTaskRecordFromPush(
        {
          push: {
            ...task,
            via,
            auth: named.auth ?? null,
            idem: named.idem ?? null,
          },
        },
        home,
      ),
    authTyped: named.auth ?? null,
  });
};
