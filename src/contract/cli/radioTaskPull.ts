/**
 * .what = cli entry point for radio.task.pull skill
 * .why  = enables task retrieval from radio channels via shell
 *
 * options:
 *   --via     channel: gh.issues or os.fileops (required)
 *   --from    source repo: @this (current git repo) or owner/name (required)
 *   --list    list all tasks
 *   --exid    fetch specific task by external id
 *   --title   fetch specific task by title
 *   --status  filter by status: QUEUED, CLAIMED, DELIVERED
 *   --limit   max number of tasks to return
 *   --auth    auth mode: "as-human" or "as-robot:ENV_VAR_NAME"
 *   --help    show usage and exit
 *
 * usage:
 *   radio.task.pull --via gh.issues --from @this --list
 *   radio.task.pull --via gh.issues --from owner/repo --list
 *   radio.task.pull --via os.fileops --from @this --exid 123
 *   radio.task.pull --via gh.issues --from @this --list --status QUEUED
 */

import { BadRequestError } from 'helpful-errors';
import { z } from 'zod';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import type { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
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
// transformers
// ────────────────────────────────────────────────────────────────────

/**
 * .what = build pull-all request with only non-null filter fields
 * .why  = extract conditional spread decode-friction from orchestrator
 */
const asPullAllRequest = (input: {
  via: RadioChannel;
  repo: RadioTaskRepo;
  filter: { status: RadioTaskStatus } | null;
  limit: number | null;
}): {
  via: RadioChannel;
  repo: RadioTaskRepo;
  filter?: { status: RadioTaskStatus };
  limit?: number;
} => ({
  via: input.via,
  repo: input.repo,
  ...(input.filter !== null && { filter: input.filter }),
  ...(input.limit !== null && { limit: input.limit }),
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

    // required: source repo (@this or owner/name)
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

const HELP_TEXT = `
🦫 lets check the meter...

🎙️ radio.task.pull --help
   ├─ usage
   │  ├─ radio.task.pull --via gh.issues --from @this --list
   │  ├─ radio.task.pull --via gh.issues --from owner/repo --list
   │  ├─ radio.task.pull --via os.fileops --from @this --exid 123
   │  └─ radio.task.pull --via gh.issues --from @this --list --status QUEUED
   │
   └─ options
      ├─ --via       channel: gh.issues or os.fileops (required)
      ├─ --from      source: @this (current repo) or owner/repo (required)
      ├─ --list      list all tasks
      ├─ --exid      fetch specific task by external id
      ├─ --title     fetch specific task by title
      ├─ --status    filter by status: QUEUED, CLAIMED, DELIVERED
      ├─ --limit     max number of tasks to return
      ├─ --auth      auth mode: "as-human" or "as-robot:ENV_VAR_NAME"
      └─ --help, -h  show this help
`.trim();

export const cliRadioTaskPull = async (): Promise<void> => {
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

  // derive repo from --from arg (required)
  const repo = await getOneRadioTaskRepoFromCliArg({
    arg: named.from ?? null,
    argName: '--from',
    errorContext: {
      notFoundMessage: '--from is required',
      hint: 'use --from @this (current git repo) or --from owner/name',
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
      asPullAllRequest({
        via: named.via,
        repo,
        filter: mode.filter,
        limit: mode.limit,
      }),
      context,
    );

    console.log('🦫 back in the river!\n');
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

  console.log('🦫 back in the river!\n');
  outputRadioResult({
    message: asTaskDetailOutput({
      task: result.task,
      via: named.via,
      outcome: null,
      cached: result.cached,
    }),
  });
};
