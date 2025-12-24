#!/usr/bin/env npx tsx

import { flattenBranchName } from './flattenBranchName';

/**
 * .what = CLI entry point for flattenBranchName
 * .why  = enables shell scripts to call this operation via npx tsx
 */
const main = (): void => {
  const branchName = process.argv[2];
  if (!branchName) {
    console.error('usage: flattenBranchName.cli.ts <branchName>');
    process.exit(1);
  }

  const flattened = flattenBranchName({ branchName });
  console.log(flattened);
};

main();
