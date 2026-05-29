/**
 * .what = cli entry point for radio.task.push skill
 * .why  = enables task dispatch to radio channels from shell
 *
 * options:
 *   --via         channel: gh.issues or os.fileops (required)
 *   --into        target repo as "owner/name" (default: current git repo)
 *   --title       task title (required for new tasks)
 *   --description task description
 *   --exid        external id for updates
 *   --status      task status: QUEUED, CLAIMED, DELIVERED
 *   --idem        idempotency mode: findsert or upsert
 *   --auth        auth mode: "as-human" or "as-robot:ENV_VAR_NAME"
 *
 * usage:
 *   radio.task.push --via gh.issues --title "..." --description "..."
 *   radio.task.push --via gh.issues --into owner/repo --title "..."
 *   radio.task.push --via os.fileops --exid 123 --status CLAIMED
 */

import { z } from 'zod';

import { IdempotencyMode } from '@src/domain.objects/IdempotencyMode';
import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';
import { asPushTaskFromArgs } from '@src/domain.operations/radio/cli/asPushTaskFromArgs';
import { asTaskDetailOutput } from '@src/domain.operations/radio/cli/asTaskDetailOutput';
import { getOneRadioContextFromCliArgs } from '@src/domain.operations/radio/cli/getOneRadioContextFromCliArgs';
import { getOneRadioTaskRepoFromCliArg } from '@src/domain.operations/radio/cli/getOneRadioTaskRepoFromCliArg';
import { radioTaskPush } from '@src/domain.operations/radio/task/push/radioTaskPush';
import { getCliArgs } from '@src/infra/cli';
import { shx } from '@src/infra/shell/shx';

import { outputRadioResult } from './outputRadioResult';

// ────────────────────────────────────────────────────────────────────
// schema
// ────────────────────────────────────────────────────────────────────

const schemaOfArgs = z.object({
  named: z.object({
    // required: channel
    via: z.nativeEnum(RadioChannel),

    // optional: auth mode (required for gh.issues if GITHUB_TOKEN not set)
    // supports: "as-human" or "as-robot:ENV_VAR_NAME"
    auth: z.string().optional(),

    // optional: target repo (e.g., "owner/name")
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

export const cliRadioTaskPush = async (): Promise<void> => {
  const { named } = getCliArgs({ schema: schemaOfArgs });

  // derive repo from --into arg or git context
  const repo = await getOneRadioTaskRepoFromCliArg({
    arg: named.into ?? null,
    argName: '--into',
    errorContext: {
      notFoundMessage:
        '--into required (not in a git repo); specify --into owner/repo or run from a git repository',
      hint: 'provide --into owner/repo or run from within a git repository',
    },
  });

  // validate and transform task args
  const task = asPushTaskFromArgs({
    repo,
    exid: named.exid ?? null,
    title: named.title ?? null,
    description: named.description ?? null,
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
      task: {
        repo: task.repo,
        ...(task.exid !== null && { exid: task.exid }),
        ...(task.title !== null && { title: task.title }),
        ...(task.description !== null && { description: task.description }),
        ...(task.status !== null && { status: task.status }),
      },
    },
    context,
  );

  // output result
  outputRadioResult({
    message: asTaskDetailOutput({
      task: result.task,
      via: named.via,
      outcome: result.outcome,
      cached: null,
    }),
  });
};
