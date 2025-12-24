#!/usr/bin/env npx tsx

import { getBoundBehaviorByBranch } from './getBoundBehaviorByBranch';

/**
 * .what = CLI entry point for getBoundBehaviorByBranch
 * .why  = enables shell scripts to call this operation via npx tsx
 */
const main = (): void => {
  const branchName = process.argv[2]; // optional

  const result = getBoundBehaviorByBranch({
    branchName: branchName || undefined,
  });

  // output as JSON for shell parsing
  console.log(JSON.stringify(result));
};

main();
