import * as fs from 'fs/promises';
import * as path from 'path';

import type { BrainReplBrief } from './BrainReplContext';

/**
 * .what = loads brief files from a role's skill directory
 * .why = enables CLI to construct brain.repl context with domain knowledge
 * .todo = liftout generalized into rhachet repo
 */
export const loadBriefs = async (input: {
  roleDir: string;
  skillName: string;
}): Promise<BrainReplBrief[]> => {
  const briefsDir = path.join(input.roleDir, 'briefs', input.skillName);

  // check if directory exists
  const dirExists = await fs
    .stat(briefsDir)
    .then((s) => s.isDirectory())
    .catch(() => false);
  if (!dirExists) return [];

  // find all markdown files in briefs directory
  const files = await fs.readdir(briefsDir);
  const briefFiles = files.filter((f) => f.endsWith('.md'));

  // load each brief
  const briefs: BrainReplBrief[] = [];
  for (const file of briefFiles) {
    const content = await fs.readFile(path.join(briefsDir, file), 'utf-8');
    briefs.push({
      name: file.replace('.md', ''),
      content,
    });
  }

  return briefs;
};
