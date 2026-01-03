import { existsSync, readdirSync } from 'fs';
import { BadRequestError } from 'helpful-errors';
import { join } from 'path';

/**
 * .what = get a behavior directory by name (fuzzy match)
 *
 * .why  = allows users to specify partial behavior names for convenience
 *
 * @throws BadRequestError if not found or ambiguous
 */
export const getBehaviorDir = (input: {
  name: string;
  targetDir?: string;
}): string => {
  const targetDir = input.targetDir ?? process.cwd();
  const behaviorRoot = join(targetDir, '.behavior');

  if (!existsSync(behaviorRoot)) {
    throw new BadRequestError('.behavior/ directory not found');
  }

  // find matching behavior directories
  const allBehaviors = readdirSync(behaviorRoot, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  const matches = allBehaviors
    .filter((name) => name.includes(input.name))
    .map((name) => join(behaviorRoot, name));

  if (matches.length === 0) {
    const availableList = allBehaviors.map((b) => `  ${b}`).join('\n');
    throw new BadRequestError(
      `no behavior found matching '${input.name}'\navailable behaviors:\n${availableList}`,
    );
  }

  if (matches.length > 1) {
    const matchList = matches.map((m) => `  ${m}`).join('\n');
    throw new BadRequestError(
      `multiple behaviors match '${input.name}'\nmatches:\n${matchList}`,
    );
  }

  return matches[0]!;
};
