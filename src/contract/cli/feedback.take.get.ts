/**
 * .what = list all feedback for a behavior with their response status
 *
 * .why  = enables clones to see what feedback needs response
 *         - normal mode: list all feedback with status
 *         - hook.onStop mode: exit 2 if unresponded feedback exists
 *
 * usage:
 *   feedback.take.get.sh                              # list all feedback
 *   feedback.take.get.sh --behavior <name>            # explicit behavior
 *   feedback.take.get.sh --when hook.onStop           # exit 2 if unresponded
 *
 * guarantee:
 *   - fail-fast if behavior not found (unless --force)
 *   - exit 0 if all feedback responded
 *   - exit 2 if unresponded feedback in hook.onStop mode
 */

import { z } from 'zod';

import { feedbackTakeGet as feedbackTakeGetOp } from '@src/domain.operations/behavior/feedback/feedbackTakeGet';
import { computeFeedbackTakeGetOutput } from '@src/domain.operations/behavior/render/computeFeedbackTakeGetOutput';
import { getCliArgs } from '@src/infra/cli';

import { basename } from 'node:path';

// ────────────────────────────────────────────────────────────────────
// schema
// ────────────────────────────────────────────────────────────────────

const schemaOfArgs = z.object({
  named: z.object({
    // skill-specific args
    behavior: z.string().optional(),
    when: z.enum(['hook.onStop']).optional(),
    force: z.boolean().optional(),
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

export const feedbackTakeGet = (): void => {
  const { named } = getCliArgs({ schema: schemaOfArgs });
  const context = { cwd: process.cwd() };

  // get feedback status
  const result = feedbackTakeGetOp(
    {
      behavior: named.behavior,
      force: named.force,
    },
    context,
  );

  // determine mode
  const mode = named.when === 'hook.onStop' ? 'hook.onStop' : 'list';

  // render output (null = silent per vision for hook.onStop passed)
  const behavior = basename(result.behaviorDir);
  const output = computeFeedbackTakeGetOutput({ result, mode, behavior });
  if (output !== null) {
    console.log(output);
  }

  // exit 2 if hook.onStop mode and unresponded feedback exists
  if (mode === 'hook.onStop') {
    const openCount = result.unresponded + result.stale;
    if (openCount > 0) {
      process.exit(2);
    }
  }
};
