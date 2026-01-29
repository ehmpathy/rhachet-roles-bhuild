import { existsSync, mkdirSync, writeFileSync } from 'fs';
import * as path from 'path';

const DREAM_README_TEMPLATE = `# .dream/ 🌙

this folder catches dreams — transient visions that strike in flow state.

## how to use

catch a dream:
\`\`\`sh
npx rhachet run --skill catch.dream --name "my-idea" --open codium
\`\`\`

review dreams: browse this folder

graduate to behavior: \`npx rhachet run --skill init.behavior --name "my-idea"\`

🌙
`;

/**
 * .what = creates .dream/ folder if absent, findserts readme
 * .why = bootstraps dream folder on first use without friction
 */
export const genDreamDir = (input: {
  repoRoot: string;
}): { dreamDir: string; readmeCreated: boolean } => {
  const dreamDir = path.join(input.repoRoot, '.dream');

  // create folder (idempotent)
  mkdirSync(dreamDir, { recursive: true });

  // findsert readme
  const readmePath = path.join(dreamDir, '.readme.md');
  const readmeCreated = !existsSync(readmePath);

  if (readmeCreated) {
    writeFileSync(readmePath, DREAM_README_TEMPLATE, 'utf-8');
  }

  return { dreamDir, readmeCreated };
};
