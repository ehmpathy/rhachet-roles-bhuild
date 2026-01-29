import { join } from 'path';

import type { DreamArtifact } from '../../../domain.objects/dreamer/DreamArtifact';
import type { DreamCandidate } from '../../../domain.objects/dreamer/DreamCandidate';
import { OpenerUnavailableError } from '../../../infra/shell/OpenerUnavailableError';
import { openFileWithOpener } from '../../../infra/shell/openFileWithOpener';
import { genDreamDir } from '../dreams/genDreamDir';
import { getAllDreamsBySimilarity } from '../dreams/getAllDreamsBySimilarity';
import { normalizeDreamName } from '../dreams/normalizeDreamName';
import { setDream } from '../dreams/setDream';

/**
 * .what = catches a dream via findsert pattern
 * .why = enables transient idea capture without focus loss
 */
export const runCatchDream = (input: {
  name: string;
  open?: string;
  cwd: string;
}): {
  dream: DreamArtifact;
  outcome: 'caught' | 'found';
  candidates: DreamCandidate[];
  openerResult?: { success: boolean; error?: string };
} => {
  // normalize dream name to kebab-case
  const nameSafe = normalizeDreamName({ raw: input.name });

  // compute dream directory path
  const dreamDir = join(input.cwd, '.dream');

  // bootstrap .dream/ folder if absent
  genDreamDir({ repoRoot: input.cwd });

  // generate isodate in format YYYY_MM_DD
  const now = new Date();
  const isoDate = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}`;

  // findsert the dream
  const { dream, outcome } = setDream({
    findsert: {
      name: nameSafe,
      dreamDir,
      date: isoDate,
    },
  });

  // try opener if --open is provided
  let openerResult: { success: boolean; error?: string } | undefined;
  if (input.open) {
    try {
      openFileWithOpener({ opener: input.open, filePath: dream.path });
      openerResult = { success: true };
    } catch (error) {
      if (error instanceof OpenerUnavailableError) {
        openerResult = { success: false, error: error.message };
      } else {
        throw error;
      }
    }
  }

  // find similar dreams from past week
  const candidates = getAllDreamsBySimilarity({
    name: nameSafe,
    dreamDir,
  });

  return {
    dream,
    outcome,
    candidates,
    openerResult,
  };
};
