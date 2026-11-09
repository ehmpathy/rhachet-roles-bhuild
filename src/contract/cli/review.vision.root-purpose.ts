/**
 * .what = the depth lane of the 1.vision guard: reads a vision yield's root purpose
 * .how  = TypeScript implementation for review.vision.root-purpose.sh skill
 *
 * see src/domain.roles/behaver/skills/review.vision.root-purpose.sh for full documentation
 */

import { ConstraintError } from 'helpful-errors';
import { z } from 'zod';

import { getOneVisionRootPurposeVerdict } from '@src/domain.operations/behavior/vision/getOneVisionRootPurposeVerdict';
import { getCliArgs } from '@src/infra/cli';

const schemaOfArgs = z.object({
  named: z.object({
    // skill-specific args; optional here so its absence is refused below as exit 2, never
    // as the schema's generic exit 1 (the vision contract: "exit 2 when --vision is absent")
    vision: z.string().optional(),
    // rhachet passthrough args (optional, ignored)
    repo: z.string().optional(),
    role: z.string().optional(),
    skill: z.string().optional(),
    s: z.string().optional(),
  }),
  ordered: z.array(z.string()).default([]),
});

/**
 * .what = prints the depth lane's verdict for one vision yield
 * .why  = the guard tallies the stdout; exit 0 carries any verdict, blockers included,
 *         so a red vision reads as a rejection and never as a malfunction
 */
export const reviewVisionRootPurpose = (): void => {
  const { named } = getCliArgs({ schema: schemaOfArgs });

  // refuse an absent --vision; the guard always names the yield
  if (!named.vision)
    throw new ConstraintError('--vision is required', {
      hint: "rhx review.vision.root-purpose --vision '$route/1.vision.yield.md'",
    });

  // read the verdict, then print it for the guard to tally
  const verdict = getOneVisionRootPurposeVerdict(
    { vision: named.vision },
    { cwd: process.cwd() },
  );
  console.log(verdict.stdout);
};
