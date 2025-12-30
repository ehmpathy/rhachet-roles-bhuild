#!/usr/bin/env npx tsx

import { applyPlan } from './applyPlan';
import { computePlanFromFile } from './computePlanFromFile';

/**
 * .what = CLI entry point for applyPlan
 * .why = enables shell scripts to call this operation via npx tsx
 */
const main = async (): Promise<void> => {
  // parse args
  const args = process.argv.slice(2);
  let planPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--plan-path' && args[i + 1]) {
      planPath = args[i + 1];
      i++;
    }
  }

  // validate
  if (!planPath) {
    console.error('usage: applyPlan.cli.ts --plan-path <path>');
    process.exit(1);
  }

  // load plan from file
  const plan = await computePlanFromFile({ planPath });

  // apply the plan
  const result = await applyPlan({ plan });

  // output as JSON
  console.log(JSON.stringify(result, null, 2));
};

main().catch((err) => {
  console.error('error:', err.message);
  process.exit(1);
});
