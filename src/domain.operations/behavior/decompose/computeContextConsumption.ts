import * as fs from 'fs/promises';
import * as path from 'path';

import { BehaviorDecompositionContextAnalysis } from '../../../domain.objects/BehaviorDecompositionContextAnalysis';
import type { BehaviorPersisted } from '../../../domain.objects/BehaviorPersisted';

/**
 * .what = computes token consumption of behavior artifacts
 * .why = quantifies whether decomposition is needed based on 30% threshold
 */
export const computeContextConsumption = async (input: {
  behavior: BehaviorPersisted;
}): Promise<BehaviorDecompositionContextAnalysis> => {
  // gather artifact files from behavior directory
  const behaviorPath = input.behavior.path;
  const filesInDir = await fs.readdir(behaviorPath);

  // measure total chars from criteria + research + distill
  let totalChars = 0;

  // criteria file
  const criteriaFile = filesInDir.find((f) => f.endsWith('.criteria.md'));
  if (criteriaFile) {
    const content = await fs.readFile(
      path.join(behaviorPath, criteriaFile),
      'utf-8',
    );
    totalChars += content.length;
  }

  // research files (3.1.research.*.md)
  const researchFiles = filesInDir.filter((f) => f.includes('.research.'));
  for (const file of researchFiles) {
    const content = await fs.readFile(path.join(behaviorPath, file), 'utf-8');
    totalChars += content.length;
  }

  // distill files (3.2.distill.*.md)
  const distillFiles = filesInDir.filter((f) => f.includes('.distill.'));
  for (const file of distillFiles) {
    const content = await fs.readFile(path.join(behaviorPath, file), 'utf-8');
    totalChars += content.length;
  }

  // estimate tokens (chars / 4)
  const tokensEstimate = Math.ceil(totalChars / 4);

  // context window = 200k tokens (claude opus 4)
  const contextWindow = 200000;
  const windowPercentage = Math.ceil((tokensEstimate * 100) / contextWindow);

  // threshold = 30%
  const recommendation =
    windowPercentage > 30
      ? ('DECOMPOSE_REQUIRED' as const)
      : ('DECOMPOSE_UNNEEDED' as const);

  return new BehaviorDecompositionContextAnalysis({
    usage: {
      characters: { quantity: totalChars },
      tokens: { estimate: tokensEstimate },
      window: { percentage: windowPercentage },
    },
    recommendation,
  });
};
