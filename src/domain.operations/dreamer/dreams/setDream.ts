import { writeFileSync } from 'fs';
import * as path from 'path';

import { DreamArtifact } from '../../../domain.objects/dreamer/DreamArtifact';
import { getOneDreamByName } from './getOneDreamByName';

/**
 * .what = finds prior dream or creates new one (findsert pattern)
 * .why = ensures dreams are not duplicated while it enables capture
 */
export const setDream = (input: {
  findsert: {
    name: string;
    dreamDir: string;
    date: string;
  };
}): { dream: DreamArtifact; outcome: 'caught' | 'found' } => {
  // check for prior dream
  const dreamFound = getOneDreamByName({
    name: input.findsert.name,
    dreamDir: input.findsert.dreamDir,
  });

  // return prior if found
  if (dreamFound) {
    return { dream: dreamFound, outcome: 'found' };
  }

  // create new dream
  const filename = `${input.findsert.date}.${input.findsert.name}.dream.md`;
  const dreamPath = path.join(input.findsert.dreamDir, filename);
  const content = 'dream = \n\n';

  writeFileSync(dreamPath, content, 'utf-8');

  const dreamCreated = new DreamArtifact({
    path: dreamPath,
    name: input.findsert.name,
    date: input.findsert.date,
    filename,
  });

  return { dream: dreamCreated, outcome: 'caught' };
};
