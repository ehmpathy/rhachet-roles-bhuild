import { readdirSync } from 'fs';
import { join } from 'path';

/**
 * .what = resolve the latest blueprint version from a behavior directory
 * .why  = both hooks and review.deliverable need this logic
 *
 * .note = version precedence:
 *         - v3.i2 > v2.i3 (major version wins)
 *         - v2.i3 > v2.i1 (latest iteration within major)
 */
export const getLatestBlueprintByBehavior = (input: {
  behaviorDir: string;
}): string | null => {
  // find all blueprint files matching pattern: *.blueprint.v*.i*.md
  const blueprintPattern = /\.blueprint\.v(\d+)\.i(\d+)\.md$/;

  let files: string[];
  try {
    files = readdirSync(input.behaviorDir);
  } catch {
    return null;
  }

  // parse version info from each matching file
  const blueprints: Array<{
    path: string;
    majorVersion: number;
    iteration: number;
  }> = [];

  for (const file of files) {
    const match = file.match(blueprintPattern);
    const majorVersionStr = match?.[1];
    const iterationStr = match?.[2];
    if (match && majorVersionStr && iterationStr) {
      blueprints.push({
        path: join(input.behaviorDir, file),
        majorVersion: parseInt(majorVersionStr, 10),
        iteration: parseInt(iterationStr, 10),
      });
    }
  }

  if (blueprints.length === 0) return null;

  // sort by major version (descending), then by iteration (descending)
  blueprints.sort((a, b) => {
    if (a.majorVersion !== b.majorVersion)
      return b.majorVersion - a.majorVersion;
    return b.iteration - a.iteration;
  });

  // return the path to the latest blueprint
  const latestBlueprint = blueprints[0];
  return latestBlueprint?.path ?? null;
};
