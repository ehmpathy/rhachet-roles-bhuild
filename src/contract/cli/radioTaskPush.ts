/**
 * .what = cli entry point for radio.task.push skill
 * .why  = enables task dispatch to radio channels from shell
 *
 * options:
 *   --via         channel: gh.issues or os.fileops (required)
 *   --into        target repo: @this (current git repo) or owner/name (required)
 *   --title       task title (required for new tasks)
 *   --description task description (supports @stdin to read from pipe)
 *   --exid        external id for updates
 *   --status      task status: QUEUED, CLAIMED, DELIVERED
 *   --idem        idempotency mode: findsert or upsert
 *   --auth        auth mode: "as-human" or "as-robot:ENV_VAR_NAME"
 *   --help        show usage and exit
 *
 * usage:
 *   radio.task.push --via gh.issues --into @this --title "..." --description "..."
 *   radio.task.push --via gh.issues --into owner/repo --title "..."
 *   radio.task.push --via os.fileops --into @this --exid 123 --status CLAIMED
 *   echo "detailed task" | radio.task.push --via gh.issues --into @this --title "..." --description @stdin
 */

import { readFileSync } from 'fs';
import { BadRequestError } from 'helpful-errors';
import { z } from 'zod';

import { IdempotencyMode } from '@src/domain.objects/IdempotencyMode';
import { RadioChannel } from '@src/domain.objects/RadioChannel';
import type { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';
import { asPushTaskFromArgs } from '@src/domain.operations/radio/cli/asPushTaskFromArgs';
import { asTaskDetailOutput } from '@src/domain.operations/radio/cli/asTaskDetailOutput';
import { getOneRadioContextFromCliArgs } from '@src/domain.operations/radio/cli/getOneRadioContextFromCliArgs';
import { getOneRadioTaskRepoFromCliArg } from '@src/domain.operations/radio/cli/getOneRadioTaskRepoFromCliArg';
import { getOneRadioUsagePermissionDecision } from '@src/domain.operations/radio/permission/getOneRadioUsagePermissionDecision';
import { radioTaskPush } from '@src/domain.operations/radio/task/push/radioTaskPush';
import { getCliArgs } from '@src/infra/cli';
import { shx } from '@src/infra/shell/shx';

import { outputRadioResult } from './outputRadioResult';

// ────────────────────────────────────────────────────────────────────
// transformers
// ────────────────────────────────────────────────────────────────────

/**
 * .what = derive permission hint command from block level
 * .why  = extract decode-friction from orchestrator
 */
const asPermissionHintCommand = (input: {
  level: 'global' | 'org' | 'local' | 'default';
  repoOwner: string;
}): string => {
  if (input.level === 'global')
    return 'npx rhachet run --skill radio.uses --global allow';
  if (input.level === 'org')
    return `npx rhachet run --skill radio.uses --org ${input.repoOwner} allow`;
  // for 'local' or 'default', suggest local permission
  return 'npx rhachet run --skill radio.uses allow';
};

/**
 * .what = derive description from arg, @stdin sentinel becomes stdin content
 * .why  = extract decode-friction from orchestrator
 */
const asDescriptionFromArg = (input: { raw: string | null }): string | null => {
  if (input.raw === '@stdin') return readFileSync(0, 'utf-8').trim();
  return input.raw;
};

/**
 * .what = build task payload with only non-null fields
 * .why  = extract conditional spread decode-friction from orchestrator
 */
const asTaskPayload = (input: {
  repo: RadioTaskRepo;
  exid: string | null;
  title: string | null;
  description: string | null;
  status: RadioTaskStatus | null;
}): {
  repo: RadioTaskRepo;
  exid?: string;
  title?: string;
  description?: string;
  status?: RadioTaskStatus;
} => ({
  repo: input.repo,
  ...(input.exid !== null && { exid: input.exid }),
  ...(input.title !== null && { title: input.title }),
  ...(input.description !== null && { description: input.description }),
  ...(input.status !== null && { status: input.status }),
});

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
   │  ├─ radio.task.push --via gh.issues --into owner/repo --title "..." --description "..."
   │  ├─ radio.task.push --via gh.issues --into @this --title "..."
   │  └─ echo "details" | radio.task.push --via gh.issues --into @this --title "..." --description @stdin
   │
   └─ options
      ├─ --via         channel: gh.issues or os.fileops (required)
      ├─ --into        target: @this (current repo) or owner/repo (required)
      ├─ --title       task title (required for new tasks)
      ├─ --description task description (supports @stdin)
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
  if (!named.via)
    throw new BadRequestError('--via is required', {
      hint: 'specify a channel: --via gh.issues  or  --via os.fileops',
    });

  // derive repo from --into arg (required)
  const repo = await getOneRadioTaskRepoFromCliArg({
    arg: named.into ?? null,
    argName: '--into',
    errorContext: {
      notFoundMessage: '--into is required',
      hint: 'use --into @this (current git repo) or --into owner/name',
    },
  });

  // check permission to push to this repo.
  // honor $HOME for the global-meter lookup (standard CLI convention): the op
  // otherwise falls back to os.homedir(), which reads the OS passwd entry and so
  // cannot be isolated in-process. a threaded process.env.HOME keeps the gate
  // deterministic and lets callers (and tests) scope the radio config cleanly.
  const permission = await getOneRadioUsagePermissionDecision(
    {
      targetRepo: `${repo.owner}/${repo.name}`,
      sourceCwd: process.cwd(),
    },
    { homeDir: process.env.HOME },
  );
  if (!permission.allowed) {
    const hintCommand = asPermissionHintCommand({
      level: permission.level,
      repoOwner: repo.owner,
    });
    throw new BadRequestError(`radio.task.push blocked: ${permission.reason}`, {
      hint: `ask your human to grant:\n  $ ${hintCommand}`,
    });
  }

  // derive description from arg
  const description = asDescriptionFromArg({ raw: named.description ?? null });

  // validate and transform task args
  const task = asPushTaskFromArgs({
    repo,
    exid: named.exid ?? null,
    title: named.title ?? null,
    description,
    status: named.status ?? null,
  });

  // assemble context for channel (may involve auth)
  const context = await getOneRadioContextFromCliArgs(
    {
      via: named.via,
      repo,
      auth: named.auth ?? null,
    },
    { env: process.env, shx },
  );

  // dispatch to domain operation
  const result = await radioTaskPush(
    {
      via: named.via,
      idem: named.idem,
      task: asTaskPayload(task),
    },
    context,
  );

  // output result with beaver header
  console.log('🦫 onto the pile!\n');
  outputRadioResult({
    message: asTaskDetailOutput({
      task: result.task,
      via: named.via,
      outcome: result.outcome,
      cached: null,
    }),
  });
};
