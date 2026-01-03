import type { RefByUnique } from 'domain-objects';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { GitFile } from 'rhachet-artifact-git';

/**
 * .what = enumerates brief file refs from a role's skill directory
 * .why = enables CLI to construct brain.repl context with domain knowledge
 *
 * @note returns file refs, content is loaded lazily by invokeBrainRepl
 */
export const loadBriefs = async (input: {
  roleDir: string;
  skillName: string;
}): Promise<RefByUnique<typeof GitFile>[]> => {
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

  // return file refs (content loaded lazily by invokeBrainRepl)
  return briefFiles.map((file) => ({
    uri: path.join(briefsDir, file),
  }));
};
