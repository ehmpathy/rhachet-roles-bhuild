import { appendFileSync } from 'fs';

import type { DreamArtifact } from '../../../domain.objects/dreamer/DreamArtifact';

/**
 * .what = appends content to a dream file
 * .why = enables merge when fuzzy match recovery chosen
 */
export const appendOntoDream = (input: {
  dream: DreamArtifact;
  content: string;
}): void => {
  // add separator before appended content
  const separator = '\n\n---\n\n';
  const contentWithSeparator = `${separator}${input.content}`;

  appendFileSync(input.dream.path, contentWithSeparator, 'utf-8');
};
