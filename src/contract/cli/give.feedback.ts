/**
 * .what = create or find a feedback file for a behavior artifact
 *
 * .why  = enables structured feedback on any behavior artifact
 *         with placeholder substitution and version support
 *
 * usage:
 *   give.feedback.sh --against <name>                     # open latest or create v1
 *   give.feedback.sh --against <name> --behavior <name>   # explicit behavior
 *   give.feedback.sh --against <name> --version 2         # open or create v2
 *   give.feedback.sh --against <name> --version ++        # create next version
 *   give.feedback.sh --against <name> --open codium       # open in editor
 *   give.feedback.sh --against <name> --template <path>   # custom template
 *
 * guarantee:
 *   - fail-fast if artifact not found
 *   - fail-fast if template not found
 *   - findsert: if feedback exists, open it
 */

import { basename } from 'path';
import { z } from 'zod';

import { giveFeedback as giveFeedbackOp } from '@src/domain.operations/behavior/feedback/giveFeedback';
import { computeFeedbackOutput } from '@src/domain.operations/behavior/render/computeFeedbackOutput';
import { getCliArgs } from '@src/infra/cli';
import { OpenerUnavailableError } from '@src/infra/shell/OpenerUnavailableError';
import { openFileWithOpener } from '@src/infra/shell/openFileWithOpener';

// ────────────────────────────────────────────────────────────────────
// schema
// ────────────────────────────────────────────────────────────────────

const schemaOfArgs = z.object({
  named: z.object({
    // skill-specific args
    against: z.string(),
    behavior: z.string().optional(),
    version: z.union([z.coerce.number(), z.literal('++')]).optional(),
    template: z.string().optional(),
    force: z.boolean().optional(),
    open: z.string().optional(),
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
  const context = { cwd: process.cwd() };

  // validate --open has a value if provided
  if (named.open !== undefined && named.open.trim() === '') {
    console.error('⛈️  error: --open requires an editor name');
    console.error('');
    console.error('please specify what editor to open with. for example:');
    console.error('  --open codium');
    console.error('  --open vim');
    console.error('  --open zed');
    console.error('  --open code');
    process.exit(1);
  }

  // create or find feedback file
  const result = giveFeedbackOp(
    {
      against: named.against,
      behavior: named.behavior,
      version: named.version,
      template: named.template,
      force: named.force,
    },
    context,
  );

  // extract just the filename (not full path)
  const feedbackFilename = basename(result.feedbackFile);

  // try opener if --open is provided
  let openerUsed: string | undefined;
  if (named.open) {
    try {
      openFileWithOpener({ opener: named.open, filePath: result.feedbackFile });
      openerUsed = named.open;
    } catch (error) {
      if (error instanceof OpenerUnavailableError) {
        console.log(`⚠️  ${error.message}`);
        console.log('');
      } else {
        throw error;
      }
    }
  }

  // render output
  const output = computeFeedbackOutput({
    feedbackFilename,
    opener: openerUsed,
  });
  console.log(output);
};
