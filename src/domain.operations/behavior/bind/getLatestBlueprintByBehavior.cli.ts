#!/usr/bin/env npx tsx

import { getLatestBlueprintByBehavior } from './getLatestBlueprintByBehavior';

/**
 * .what = CLI entry point for getLatestBlueprintByBehavior
 * .why  = enables shell scripts to call this operation via npx tsx
 */
const main = (): void => {
  const behaviorDir = process.argv[2];
  if (!behaviorDir) {
    console.error('usage: getLatestBlueprintByBehavior.cli.ts <behaviorDir>');
    process.exit(1);
  }

  const result = getLatestBlueprintByBehavior({ behaviorDir });

  // output the path or empty string if none
  console.log(result ?? '');
};

main();
