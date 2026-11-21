import { promises as fs } from 'fs';

/**
 * .what = the names of the org dirs under a git root; empty when the root is absent
 * .why = trees live at `<gitRoot>/<org>/...`; a tree lookup walks each org, and the read of the
 *        root is a filesystem boundary the domain names, never inlines
 */
export const getAllGitOrgNames = async (input: {
  gitRoot: string;
}): Promise<string[]> => {
  const dirents = await fs
    .readdir(input.gitRoot, { withFileTypes: true })
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return [];
      throw error;
    });
  return dirents
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
};
