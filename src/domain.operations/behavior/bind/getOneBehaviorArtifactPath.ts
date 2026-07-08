import { existsSync } from 'fs';
import { join } from 'path';

/**
 * .what = find the `.yield.md` artifact file for a stone within a behavior dir
 * .why = the boot hook re-injects each stone's output on session start. every
 *        stone in the current behavior template emits `${stoneName}.yield.md`,
 *        so a found path is a direct existence check on that one name.
 *
 * .note = only the current behavior template is supported. the human input
 *         `0.wish.md` is the one fixed `.md` name; every other artifact is a
 *         driver-produced `.yield.md`. legacy `.md` behaviors are not found.
 */
export const getOneBehaviorArtifactPath = (input: {
  behaviorDir: string;
  stoneName: string;
}): string | null => {
  // the current template emits exactly one file per stone: `${stone}.yield.md`
  const artifactPath = join(input.behaviorDir, `${input.stoneName}.yield.md`);
  return existsSync(artifactPath) ? artifactPath : null;
};
