#!/usr/bin/env npx tsx

import { BehaviorPersisted } from '../../../domain.objects/BehaviorPersisted';
import { computeContextConsumption } from './computeContextConsumption';

/**
 * .what = CLI entry point for computeContextConsumption
 * .why = enables shell scripts to call this operation via npx tsx
 */
const main = async (): Promise<void> => {
  // parse args (expects --behavior-path and --behavior-name)
  const args = process.argv.slice(2);
  let behaviorPath: string | undefined;
  let behaviorName: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--behavior-path' && args[i + 1]) {
      behaviorPath = args[i + 1];
      i++;
    }
    if (args[i] === '--behavior-name' && args[i + 1]) {
      behaviorName = args[i + 1];
      i++;
    }
  }

  // validate
  if (!behaviorPath || !behaviorName) {
    console.error(
      'usage: computeContextConsumption.cli.ts --behavior-path <path> --behavior-name <name>',
    );
    process.exit(1);
  }

  // construct domain object
  const behavior = new BehaviorPersisted({
    name: behaviorName,
    path: behaviorPath,
  });

  // compute
  const result = await computeContextConsumption({ behavior });

  // output as JSON
  console.log(JSON.stringify(result, null, 2));
};

main().catch((err) => {
  console.error('error:', err.message);
  process.exit(1);
});
