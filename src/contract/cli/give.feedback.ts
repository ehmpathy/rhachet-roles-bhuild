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
 *
 * guarantee:
 *   - fail-fast if artifact not found
 *   - fail-fast if feedback file already exists
 *   - fail-fast if template not found
 */

import { z } from 'zod';

import { giveFeedback as giveFeedbackOp } from '@src/domain.operations/behavior/feedback/giveFeedback';
import { getCliArgs } from '@src/infra/cli';

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
  const { named } = getCliArgs({ schema: schemaOfArgs });

  const result = giveFeedbackOp({
    against: named.against,
    behavior: named.behavior,
    version: named.version,
    template: named.template,
    force: named.force,
  });

  console.log(`✓ feedback created: ${result.feedbackFile}`);
  console.log(`  against: ${result.artifactFile}`);
};
