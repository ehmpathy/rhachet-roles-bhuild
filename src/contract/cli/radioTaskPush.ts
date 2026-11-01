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
import { getBranchBehaviorBind } from '@src/domain.operations/behavior/bind/getBranchBehaviorBind';
import { asPushTaskFromArgs } from '@src/domain.operations/radio/cli/asPushTaskFromArgs';
import { getOneRadioTaskRepoFromCliArg } from '@src/domain.operations/radio/cli/getOneRadioTaskRepoFromCliArg';
import { asRadioLockWaitNotice } from '@src/domain.operations/radio/record/asRadioLockWaitNotice';
import { asRadioPushOutput } from '@src/domain.operations/radio/record/asRadioPushOutput';
import { asRadioPushSavedNotice } from '@src/domain.operations/radio/record/asRadioPushSavedNotice';
import { asRadioTaskRecordHomeFromCwd } from '@src/domain.operations/radio/record/asRadioTaskRecordHomeFromCwd';
import { getOneRadioPushDrainWithBacklog } from '@src/domain.operations/radio/record/getOneRadioPushDrainWithBacklog';
import { getOneRadioTaskRecordHome } from '@src/domain.operations/radio/record/getOneRadioTaskRecordHome';
import { isRadioPushDelivered } from '@src/domain.operations/radio/record/isRadioPushDelivered';
import { setRadioTaskRecordFromPush } from '@src/domain.operations/radio/record/setRadioTaskRecordFromPush';
import { getCliArgs } from '@src/infra/cli';
import { getOneArgOrStdinText } from '@src/infra/cli/getOneArgOrStdinText';
import { withFaultNotice } from '@src/infra/cli/withFaultNotice';
import { isGitRepoAt } from '@src/infra/git/isGitRepoAt';
import { shx } from '@src/infra/shell/shx';

// ────────────────────────────────────────────────────────────────────
// arg readers
// ────────────────────────────────────────────────────────────────────

/**
 * .what = the route bind of this branch, or null outside a git repo
 * .why  = the contract composes the behavior context's bind with the radio context's
 *         record home, so neither domain reaches into the other
 */
const getOneBranchBindForRecord = (input: {
  cwd: string;
}): { behaviorDir: string | null; binds: string[] } | null => {
  // outside a git repo, no branch can bind a route
  if (!isGitRepoAt({ dir: input.cwd })) return null;
  return getBranchBehaviorBind({}, { cwd: input.cwd });
};

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

  // transcribe first: once recorded, this push is never lost.
  // homeDir honors $HOME for the global-meter lookup (standard CLI convention):
  // os.homedir() reads the OS passwd entry and cannot be isolated in-process
  const context = {
    cwd: process.cwd(),
    homeDir: process.env.HOME,
    env: process.env,
    shx,
    // a push blocked on another drain says so once, on stdout: rhachet drops stderr on exit 0
    onLockWait: () => console.log(asRadioLockWaitNotice()),
  };
  const bind = getOneBranchBindForRecord({ cwd: context.cwd });
  const home = getOneRadioTaskRecordHome({ bind }, context);
  const { record, dir } = setRadioTaskRecordFromPush(
    {
      push: {
        ...task,
        via: named.via,
        auth: named.auth ?? null,
        idem: named.idem ?? null,
      },
    },
    { dir: home.dir, cwd: context.cwd },
  );

  // name where the record lives: a re-push after a bind stays where it was first held
  const homeOfRecord = asRadioTaskRecordHomeFromCwd(
    { home: { ...home, dir } },
    context,
  );

  // hold at a shut gate, or drain the backlog through an open one, then count what still waits;
  // a fault in either (an unreadable record, a bad gate config) first says the push is saved
  const { pushed, others, backlog } = await withFaultNotice({
    logic: () =>
      getOneRadioPushDrainWithBacklog(
        { record, dir, authTyped: named.auth ?? null },
        context,
      ),
    notice: asRadioPushSavedNotice({ record, dir: homeOfRecord.dir }),
  });

  // report the fate of this push, and of the backlog it carried
  console.log(
    asRadioPushOutput({
      pushed,
      others,
      home: homeOfRecord,
      backlog: backlog.length,
    }),
  );

  // exit 2 unless this push landed: a held or refused push was not delivered
  if (!isRadioPushDelivered({ pushed })) process.exitCode = 2;
};
