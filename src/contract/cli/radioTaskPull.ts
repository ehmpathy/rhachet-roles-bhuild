/**
 * .what = cli entry point for radio.task.pull skill
 * .why  = enables task retrieval from radio channels via shell
 *
 * options:
 *   --via     channel: gh.issues or os.fileops (required)
 *   --from    source repo as "owner/name" (default: current git repo)
 *   --list    list all tasks
 *   --exid    fetch specific task by external id
 *   --title   fetch specific task by title
 *   --status  filter by status: QUEUED, CLAIMED, DELIVERED
 *   --limit   max number of tasks to return
 *   --auth    auth mode: "as-human" or "as-robot:ENV_VAR_NAME"
 *
 * usage:
 *   radio.task.pull --via gh.issues --list
 *   radio.task.pull --via gh.issues --from owner/repo --list
 *   radio.task.pull --via os.fileops --exid 123
 *   radio.task.pull --via gh.issues --list --status QUEUED
 */

import { z } from 'zod';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';
import { asPullModeFromArgs } from '@src/domain.operations/radio/cli/asPullModeFromArgs';
import { asTaskDetailOutput } from '@src/domain.operations/radio/cli/asTaskDetailOutput';
import { asTaskListOutput } from '@src/domain.operations/radio/cli/asTaskListOutput';
import { getOneRadioContextFromCliArgs } from '@src/domain.operations/radio/cli/getOneRadioContextFromCliArgs';
import { getOneRadioTaskRepoFromCliArg } from '@src/domain.operations/radio/cli/getOneRadioTaskRepoFromCliArg';
import {
  radioTaskPullAll,
  radioTaskPullOne,
} from '@src/domain.operations/radio/task/pull/radioTaskPull';
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

    // optional: source repo (e.g., "owner/name")
    from: z.string().optional(),

    // mode: list or single
    list: z.boolean().optional(),
    exid: z.string().optional(),
    title: z.string().optional(),

    // optional: list filter
    status: z.nativeEnum(RadioTaskStatus).optional(),
    limit: z.coerce.number().optional(),

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

export const cliRadioTaskPull = async (): Promise<void> => {
  const { named } = getCliArgs({ schema: schemaOfArgs });

  // derive repo from --from arg or git context
  const repo = await getOneRadioTaskRepoFromCliArg({
    arg: named.from ?? null,
    argName: '--from',
    errorContext: {
      notFoundMessage:
        '--from required (not in a git repo); specify --from owner/repo or run from a git repository',
      hint: 'provide --from owner/repo or run from within a git repository',
    },
  });

  // determine pull mode from args
  const mode = asPullModeFromArgs({
    list: named.list ?? null,
    exid: named.exid ?? null,
    title: named.title ?? null,
    status: named.status ?? null,
    limit: named.limit ?? null,
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

  // handle list mode
  if (mode.kind === 'list') {
    const result = await radioTaskPullAll(
      {
        via: named.via,
        repo,
        ...(mode.filter !== null && { filter: mode.filter }),
        ...(mode.limit !== null && { limit: mode.limit }),
      },
      context,
    );

    outputRadioResult({
      message: asTaskListOutput({ tasks: result.tasks, via: named.via }),
    });
    return;
  }

  // handle single mode
  const result = await radioTaskPullOne(
    {
      via: named.via,
      repo,
      ref: mode.ref,
    },
    context,
  );

  outputRadioResult({
    message: asTaskDetailOutput({
      task: result.task,
      via: named.via,
      outcome: null,
      cached: result.cached,
    }),
  });
};
