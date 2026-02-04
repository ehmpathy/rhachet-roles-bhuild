/**
 * .what = pull tasks from a radio channel
 * .how  = TypeScript implementation for radio.task.pull.sh skill
 *
 * usage:
 *   radio.task.pull --via gh.issues --list
 *   radio.task.pull --via os.fileops --exid 123
 *   radio.task.pull --via gh.issues --list --status QUEUED
 */

import { z } from 'zod';

import type { ContextDispatchRadio } from '@src/access/daos/daoRadioTask';
import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';
import { getGithubTokenByAuthArg } from '@src/domain.operations/radio/auth/getGithubTokenByAuthArg';
import {
  radioTaskPullAll,
  radioTaskPullOne,
} from '@src/domain.operations/radio/task/pull/radioTaskPull';
import { getCliArgs } from '@src/infra/cli';
import { getRepoFromGitContext } from '@src/infra/git/getRepoFromGitContext';
import { shx } from '@src/infra/shell/shx';

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

    // optional: target repo
    repo: z.string().optional(),

    // mode: list or single
    list: z.boolean().optional(),
    exid: z.string().optional(),
    title: z.string().optional(),

    // optional: list filter
    status: z.nativeEnum(RadioTaskStatus).optional(),
    limit: z.coerce.number().optional(),

    // rhachet passthrough args (optional, ignored)
    role: z.string().optional(),
    skill: z.string().optional(),
    s: z.string().optional(),
  }),
  ordered: z.array(z.string()).default([]),
});

// ────────────────────────────────────────────────────────────────────
// helpers
// ────────────────────────────────────────────────────────────────────

/**
 * .what = parse "owner/name" string into RadioTaskRepo
 * .why = cli receives repo as string, domain expects object
 */
const parseRepo = (repoStr: string): RadioTaskRepo => {
  const [owner, name] = repoStr.split('/');
  if (!owner || !name) {
    throw new Error(
      `invalid repo format: "${repoStr}" (expected "owner/name")`,
    );
  }
  return new RadioTaskRepo({ owner, name });
};

// ────────────────────────────────────────────────────────────────────
// exported CLI entry point
// ────────────────────────────────────────────────────────────────────

export const cliRadioTaskPull = async (): Promise<void> => {
  const { named } = getCliArgs({ schema: schemaOfArgs });

  // resolve repo from cli arg or git context
  const repo = named.repo
    ? parseRepo(named.repo)
    : await getRepoFromGitContext();
  if (!repo) {
    console.error('⛈️  error: --repo required (not in a git repo)');
    process.exit(1);
  }

  // build context based on channel
  const context: ContextDispatchRadio<typeof named.via> =
    named.via === RadioChannel.GH_ISSUES
      ? {
          github: {
            auth: await getGithubTokenByAuthArg(
              { auth: named.auth },
              { env: process.env, shx },
            ),
          },
          git: { repo },
        }
      : { git: { repo } };

  // determine mode: list or single
  const isListMode = named.list === true;
  const isSingleMode = named.exid !== undefined || named.title !== undefined;

  if (!isListMode && !isSingleMode) {
    console.error('⛈️  error: specify --list or --exid/--title');
    process.exit(1);
  }

  if (isListMode && isSingleMode) {
    console.error('⛈️  error: cannot use --list with --exid/--title');
    process.exit(1);
  }

  // handle list mode
  if (isListMode) {
    const result = await radioTaskPullAll(
      {
        via: named.via,
        repo,
        filter: named.status ? { status: named.status } : undefined,
        limit: named.limit,
      },
      context,
    );

    console.log(`🎙️ tasks on ${named.via}:`);

    if (result.tasks.length === 0) {
      console.log('   └─ (no tasks found)');
      return;
    }

    for (let i = 0; i < result.tasks.length; i++) {
      const task = result.tasks[i]!;
      const isLast = i === result.tasks.length - 1;
      const prefix = isLast ? '└─' : '├─';
      console.log(`   ${prefix} [${task.status}] ${task.exid}: ${task.title}`);
    }
    return;
  }

  // handle single mode
  const ref = named.exid ? { exid: named.exid } : { title: named.title! };
  const result = await radioTaskPullOne(
    {
      via: named.via,
      repo,
      ref,
    },
    context,
  );

  console.log(`🎙️ task - ${result.task.title}`);
  console.log(`   ├─ exid: ${result.task.exid}`);
  console.log(`   ├─ status: ${result.task.status}`);
  console.log(`   ├─ repo: ${result.task.repo.owner}/${result.task.repo.name}`);
  console.log(`   ├─ pushedBy: ${result.task.pushedBy}`);
  console.log(`   ├─ pushedAt: ${result.task.pushedAt}`);

  if (result.task.claimedBy) {
    console.log(`   ├─ claimedBy: ${result.task.claimedBy}`);
    console.log(`   ├─ claimedAt: ${result.task.claimedAt}`);
  }

  if (result.task.branch) {
    console.log(`   ├─ branch: ${result.task.branch}`);
  }

  if (result.cached) {
    console.log(`   └─ 📥 cached to local .radio/`);
  } else {
    console.log(`   └─ via: ${named.via}`);
  }

  console.log('');
  console.log('description:');
  console.log(result.task.description);
};
