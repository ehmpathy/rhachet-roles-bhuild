#!/usr/bin/env npx tsx

import * as path from 'path';

import { BehaviorPersisted } from '../../../domain.objects/BehaviorPersisted';
import { invokeBrainRepl } from '../../../infra/brain/invokeBrainRepl';
import { loadBriefs } from '../../../infra/brain/loadBriefs';
import { imaginePlan } from './imaginePlan';

/**
 * .what = CLI entry point for imaginePlan
 * .why = enables shell scripts to call this operation via npx tsx
 */
const main = async (): Promise<void> => {
  // parse args
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
      'usage: imaginePlan.cli.ts --behavior-path <path> --behavior-name <name>',
    );
    process.exit(1);
  }

  // construct domain object
  const behavior = new BehaviorPersisted({
    name: behaviorName,
    path: behaviorPath,
  });

  // load decompose briefs
  const roleDir = path.join(__dirname, '../../../domain.roles/decomposer');
  const briefs = await loadBriefs({
    roleDir,
    skillName: 'decompose',
  });
  const role = { briefs };

  // construct context with brain.repl
  const context = {
    brain: {
      repl: {
        imagine: invokeBrainRepl,
      },
    },
  };

  // invoke imaginePlan
  const plan = await imaginePlan({ behavior, role }, context);

  // output as JSON
  console.log(JSON.stringify(plan, null, 2));
};

main().catch((err) => {
  console.error('error:', err.message);
  process.exit(1);
});
