/**
 * .what = review behavior for decomposition need
 * .how  = TypeScript implementation for decomposer/review.behavior.sh skill
 *
 * see src/domain.roles/decomposer/skills/review.behavior.sh for full documentation
 */

import { readdirSync } from 'fs';
import { basename, relative } from 'path';
import { z } from 'zod';

import { BehaviorPersisted } from '@src/domain.objects/BehaviorPersisted';
import { getBehaviorDir } from '@src/domain.operations/behavior';
import { computeContextConsumption } from '@src/domain.operations/behavior/decompose/computeContextConsumption';
import { getCliArgs } from '@src/infra/cli';

// ────────────────────────────────────────────────────────────────────
// schema
// ────────────────────────────────────────────────────────────────────

const schemaOfArgs = z.object({
  named: z.object({
    // skill-specific args
    of: z.string(),
    dir: z.string().optional(),
    // rhachet passthrough args (optional, ignored)
    repo: z.string().optional(),
    role: z.string().optional(),
    skill: z.string().optional(),
    s: z.string().optional(),
  }),
  ordered: z.array(z.string()).default([]),
});

// ────────────────────────────────────────────────────────────────────
// exported CLI entry point
// ────────────────────────────────────────────────────────────────────

export const reviewBehavior = async (): Promise<void> => {
  const { named } = getCliArgs({ schema: schemaOfArgs });
  const behaviorName = named.of;
  const targetDir = named.dir ?? process.cwd();

  // get behavior directory
  const behaviorDir = getBehaviorDir({ name: behaviorName, targetDir });
  const behaviorDirRel = relative(process.cwd(), behaviorDir);

  // criteria validation
  const filesInDir = readdirSync(behaviorDir);
  const criteriaFile = filesInDir.find((f) => f.endsWith('.criteria.md'));
  if (!criteriaFile) {
    console.error('error: criteria required for decomposition analysis');
    console.error(`behavior: ${behaviorDirRel}`);
    console.error('hint: run behaver bind.criteria first');
    process.exit(1);
  }

  // compute context consumption
  const behavior = new BehaviorPersisted({
    name: basename(behaviorDir),
    path: behaviorDir,
  });

  const analysis = await computeContextConsumption({ behavior });

  // emit results
  console.log('');
  console.log("🦫 let's review!");
  console.log('');
  console.log('🍄 review.behavior');
  console.log(`├── behavior = ${behaviorDirRel}`);
  console.log(`├── characters = ${analysis.usage.characters.quantity}`);
  console.log(`├── tokens = ${analysis.usage.tokens.estimate}`);
  console.log(`├── window = ${analysis.usage.window.percentage}%`);
  console.log(`└── recommendation = ${analysis.recommendation}`);

  // emit hazard if decomposition required
  if (analysis.recommendation === 'DECOMPOSE_REQUIRED') {
    console.log('');
    console.log('⛈️  HAZARD');
    console.log(
      `├── behavior artifacts consume >${analysis.usage.window.percentage}% of context window`,
    );
    console.log('└── threshold = 30%');
    console.log('');
    console.log('🌲 recommendation');
    console.log('├── decompose this behavior into focused sub-behaviors');
    console.log(`└── run decompose.behavior --of ${behaviorName} --mode plan`);
  }

  console.log('');
};
