/**
 * .what = create a feedback file for a behavior artifact
 *
 * .why  = enables structured feedback on any behavior artifact
 *         with placeholder substitution and version support
 *
 * usage:
 *   give.feedback.sh --against <name>   # create feedback for artifact
 *   give.feedback.sh --against <name> --behavior <name>   # explicit behavior
 *   give.feedback.sh --against <name> --version 2   # create v2 feedback
 *   give.feedback.sh --against <name> --template <path>   # custom template
 *   give.feedback.sh --against <name> --open codium   # open file in editor
 *   give.feedback.sh --against <name> --talk   # interactive repl mode
 *
 * guarantee:
 *   - findsert semantics (find or create)
 *   - fail-fast if artifact not found
 *   - fail-fast if template not found
 */

import { relative } from 'path';
import { z } from 'zod';

import { computeFeedbackOutputTree } from '@src/domain.operations/behavior/feedback/computeFeedbackOutputTree';
import { giveFeedback as giveFeedbackOp } from '@src/domain.operations/behavior/feedback/giveFeedback';
import { runFeedbackRepl } from '@src/domain.operations/behavior/feedback/repl/runFeedbackRepl';
import { getCliArgs } from '@src/infra/cli';
import { openFileWithOpener } from '@src/infra/shell/openFileWithOpener';

// ────────────────────────────────────────────────────────────────────
// schema
// ────────────────────────────────────────────────────────────────────

const schemaOfArgs = z.object({
  named: z.object({
    // skill-specific args
    against: z.string(),
    behavior: z.string().optional(),
    version: z.coerce.number().optional(),
    template: z.string().optional(),
    force: z.boolean().optional(),
    open: z.string().optional(),
    talk: z.boolean().optional(),
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

export const giveFeedback = (): void => {
  const { named } = getCliArgs({
    schema: schemaOfArgs,
    usage: {
      command: 'give.feedback.sh --against <name> [--behavior <name>]',
      examples: [
        'give.feedback.sh --against execution',
        'give.feedback.sh --against criteria.blackbox --behavior my-feature',
        'give.feedback.sh --against execution --open codium',
        'give.feedback.sh --against execution --talk',
      ],
    },
  });
  const cwd = process.cwd();

  // create or find feedback file
  const result = giveFeedbackOp({
    against: named.against,
    behavior: named.behavior,
    version: named.version,
    template: named.template,
    force: named.force,
  });

  // compute relative path for display
  const feedbackPathRel = relative(cwd, result.feedbackFile);

  // open file if --open flag provided
  if (named.open) {
    openFileWithOpener({ opener: named.open, filePath: result.feedbackFile });
  }

  // output tree-style result
  const output = computeFeedbackOutputTree({
    feedbackPathRel,
    found: result.found,
    opener: named.open,
    version: named.version ?? 1,
  });
  console.log('\n' + output); // newline before beaver

  // launch repl if --talk flag provided
  if (named.talk) {
    console.log('\n🎤 talk mode: enter feedback (ctrl+c to exit)\n');
    runFeedbackRepl({ feedbackFile: result.feedbackFile });
  }
};
