/**
 * .what = push a task to a radio channel
 * .how  = TypeScript implementation for radio.task.push.sh skill
 *
 * usage:
 *   radio.task.push --via gh.issues --title "..." --description "..."
 *   radio.task.push --via os.fileops --exid 123 --status CLAIMED
 */

import { z } from 'zod';

import type { ContextDispatchRadio } from '@src/access/daos/daoRadioTask';
import { IdempotencyMode } from '@src/domain.objects/IdempotencyMode';
import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';
import { getGithubTokenByAuthArg } from '@src/domain.operations/radio/auth/getGithubTokenByAuthArg';
import { radioTaskPush } from '@src/domain.operations/radio/task/push/radioTaskPush';
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

    // optional: task reference
    repo: z.string().optional(),
    exid: z.string().optional(),

    // optional: task data
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.nativeEnum(RadioTaskStatus).optional(),

    // optional: idempotency mode
    idem: z.nativeEnum(IdempotencyMode).optional(),

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

export const cliRadioTaskPush = async (): Promise<void> => {
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

  // dispatch to domain operation
  const result = await radioTaskPush(
    {
      via: named.via,
      idem: named.idem,
      task: {
        repo,
        exid: named.exid,
        title: named.title,
        description: named.description,
        status: named.status,
      },
    },
    context,
  );

  // format output
  const repoSlug = `${result.task.repo.owner}/${result.task.repo.name}`;
  console.log(`🎙️ ${result.outcome}: ${result.task.title}`);
  console.log(`   ├─ exid: ${result.task.exid}`);
  console.log(`   ├─ status: ${result.task.status}`);
  console.log(`   ├─ repo: ${repoSlug}`);

  if (named.via === RadioChannel.GH_ISSUES) {
    console.log(
      `   ├─ url: https://github.com/${repoSlug}/issues/${result.task.exid}`,
    );
  }

  if (result.task.branch) {
    console.log(`   ├─ 🌲 branch: ${result.task.branch}`);
  }

  console.log(`   └─ via: ${named.via}`);
};
