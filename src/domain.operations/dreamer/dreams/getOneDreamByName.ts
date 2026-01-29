import { existsSync, readdirSync } from 'fs';
import { UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';

import { DreamArtifact } from '../../../domain.objects/dreamer/DreamArtifact';

/**
 * .what = finds a dream artifact by its name, regardless of date
 * .why = enables reuse of prior dreams via findsert pattern
 */
export const getOneDreamByName = (input: {
  name: string;
  dreamDir: string;
}): DreamArtifact | null => {
  // handle dir not present
  if (!existsSync(input.dreamDir)) return null;

  // read directory and filter for dreams with this name
  const files = readdirSync(input.dreamDir);
  const pattern = new RegExp(
    `^\\d{4}_\\d{2}_\\d{2}\\.${escapeRegex(input.name)}\\.dream\\.md$`,
  );
  const matches = files.filter((file) => pattern.test(file));

  // handle no match
  if (matches.length === 0) return null;

  // handle multiple matches - unexpected
  if (matches.length > 1) {
    throw new UnexpectedCodePathError('multiple dreams with same name found', {
      name: input.name,
      matches,
    });
  }

  // parse the match to extract date
  const filename = matches[0]!;
  const date = filename.split('.')[0]!; // YYYY_MM_DD

  return new DreamArtifact({
    path: path.join(input.dreamDir, filename),
    name: input.name,
    date,
    filename,
  });
};

/**
 * .what = escape special regex characters in a string
 * .why = enables safe use of dream names in regex patterns
 */
const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
