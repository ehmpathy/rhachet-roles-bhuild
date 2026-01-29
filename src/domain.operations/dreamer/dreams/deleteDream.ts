import { existsSync, unlinkSync } from 'fs';

import type { DreamArtifact } from '../../../domain.objects/dreamer/DreamArtifact';

/**
 * .what = deletes a dream file from disk
 * .why = enables cleanup for fuzzy match recovery
 */
export const deleteDream = (input: { dream: DreamArtifact }): void => {
  // idempotent: skip if already deleted
  if (!existsSync(input.dream.path)) return;

  unlinkSync(input.dream.path);
};
