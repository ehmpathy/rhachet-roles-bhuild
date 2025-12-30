import path from 'path';

import type { RefByUnique } from 'domain-objects';
import type { GitFile } from 'rhachet-artifact-git';

/**
 * .what = resolves brief file reference by role and brief name
 * .why = provides portable brief path resolution for brain.repl operations
 *
 * // todo: rhachet should make this easy
 */
export const getBrief = (input: {
  role: { name: string };
  brief: { name: string };
}): RefByUnique<typeof GitFile> => {
  // resolve brief path relative to this file's location
  const briefPath = path.join(
    __dirname,
    `../../domain.roles/${input.role.name}/briefs/practices/measure/${input.brief.name}`,
  );

  return { uri: briefPath };
};
