/**
 * .what = decompose a behavior into focused sub-behaviors
 * .how  = TypeScript implementation for decompose.behavior.sh skill
 *
 * see src/domain.roles/decomposer/skills/decompose.behavior.sh for full documentation
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import { z } from 'zod';

import { BehaviorPersisted } from '@src/domain.objects/BehaviorPersisted';
import { getBehaviorDir } from '@src/domain.operations/behavior';
import { applyPlan } from '@src/domain.operations/behavior/decompose/applyPlan';
import { computePlanFromFile } from '@src/domain.operations/behavior/decompose/computePlanFromFile';
import { imaginePlan } from '@src/domain.operations/behavior/decompose/imaginePlan';
import { invokeBrainRepl } from '@src/infra/brain/invokeBrainRepl';
import { loadBriefs } from '@src/infra/brain/loadBriefs';
import { getCliArgs } from '@src/infra/cli';

// ────────────────────────────────────────────────────────────────────
// schema
// ────────────────────────────────────────────────────────────────────

const schemaOfArgs = z.object({
  named: z.object({
    // skill-specific args
    of: z.string(),
    mode: z.enum(['plan', 'apply']),
    plan: z.string().optional(),
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
// mode: plan
// ────────────────────────────────────────────────────────────────────

const modePlan = async (
  behaviorDir: string,
  behaviorName: string,
): Promise<void> => {
  const behaviorDirRel = path.relative(process.cwd(), behaviorDir);

  console.log('');
  console.log("🦫 let's decompose!");
  console.log('');
  console.log('🍄 decompose.behavior --mode plan');
  console.log(`├── behavior = ${behaviorDirRel}`);
  console.log('├── criteria = found');
  console.log('└── status = plan in progress...');
  console.log('');

  // construct behavior domain object
  const behavior = new BehaviorPersisted({
    name: behaviorName,
    path: behaviorDir,
  });

  // load decompose briefs
  const roleDir = path.join(__dirname, '../../domain.roles/decomposer');
  const briefs = await loadBriefs({
    roleDir,
    skillName: 'decompose',
  });
  const role = { briefs };

  // construct context with brain.repl
  const context = {
    brain: {
      repl: {
        imagine: (input: {
          prompt: string;
          role: { briefs: Array<{ name: string; content: string }> };
          outputFormat: 'json' | 'text';
        }) =>
          invokeBrainRepl({
            prompt: input.prompt,
            role: input.role,
            outputFormat: input.outputFormat,
          }),
      },
    },
  };

  // invoke imaginePlan
  const plan = await imaginePlan({ behavior, role }, context);

  // write plan to file
  const planOutput = path.join(behaviorDir, 'z.plan.decomposition.v1.json');
  writeFileSync(planOutput, JSON.stringify(plan, null, 2));
  const planOutputRel = path.relative(process.cwd(), planOutput);

  // output summary
  console.log('🌲 plan generated');
  console.log(`├── file = ${planOutputRel}`);
  console.log(`├── behaviors proposed = ${plan.behaviorsProposed.length}`);
  console.log(
    `├── context window = ${plan.contextAnalysis.usage.window.percentage}%`,
  );
  console.log(`└── recommendation = ${plan.contextAnalysis.recommendation}`);

  console.log('');
  console.log('🌲 proposed behaviors');
  plan.behaviorsProposed.forEach((b, i) => {
    const deps = b.dependsOn.length === 0 ? 'none' : b.dependsOn.join(', ');
    const prefix = i === plan.behaviorsProposed.length - 1 ? '└──' : '├──';
    console.log(`${prefix} ${b.name} (depends on: ${deps})`);
  });

  console.log('');
  console.log('🌲 next step');
  console.log('├── review the plan');
  console.log(
    `└── decompose.behavior --of ${behaviorName} --mode apply --plan ${planOutputRel}`,
  );
  console.log('');
};

// ────────────────────────────────────────────────────────────────────
// mode: apply
// ────────────────────────────────────────────────────────────────────

const modeApply = async (
  behaviorDir: string,
  planFile: string,
): Promise<void> => {
  const behaviorDirRel = path.relative(process.cwd(), behaviorDir);

  console.log('');
  console.log("🦫 let's decompose!");
  console.log('');
  console.log('🍄 decompose.behavior --mode apply');
  console.log(`├── behavior = ${behaviorDirRel}`);
  console.log(`├── plan = ${planFile}`);
  console.log('└── status = apply in progress...');
  console.log('');

  // load plan from file
  const plan = await computePlanFromFile({ planPath: planFile });

  // apply the plan
  const result = await applyPlan({ plan });

  // output summary
  console.log('🌲 plan applied');
  console.log(`├── behaviors created = ${result.behaviorsCreated.length}`);
  console.log(`└── marker = ${result.decomposedMarkerPath}`);

  console.log('');
  console.log('🌲 created behaviors');
  result.behaviorsCreated.forEach((behaviorPath, i) => {
    const prefix = i === result.behaviorsCreated.length - 1 ? '└──' : '├──';
    console.log(`${prefix} ${path.basename(behaviorPath)}`);
  });

  console.log('');
  console.log('🌲 next steps');
  console.log('├── define criteria for each sub-behavior');
  console.log('└── execute each sub-behavior independently');
  console.log('');
};

// ────────────────────────────────────────────────────────────────────
// exported CLI entry point
// ────────────────────────────────────────────────────────────────────

export const decomposeBehavior = async (): Promise<void> => {
  const { named } = getCliArgs({ schema: schemaOfArgs });
  const behaviorName = named.of;
  const mode = named.mode;
  const planFile = named.plan ?? '';
  const targetDir = named.dir ?? process.cwd();

  // validate apply mode requires plan
  if (mode === 'apply' && !planFile) {
    console.error('error: --plan required for apply mode');
    console.error('hint: produce one via --mode plan first');
    process.exit(1);
  }

  if (mode === 'apply' && planFile && !existsSync(planFile)) {
    console.error(`error: plan file not found: ${planFile}`);
    process.exit(1);
  }

  // get behavior directory
  const behaviorDir = getBehaviorDir({ name: behaviorName, targetDir });
  const behaviorDirRel = path.relative(process.cwd(), behaviorDir);

  // criteria validation
  const filesInDir = readdirSync(behaviorDir);
  const criteriaFile = filesInDir.find((f) => f.endsWith('.criteria.md'));
  if (!criteriaFile) {
    console.error('error: criteria required for decomposition');
    console.error(`behavior: ${behaviorDirRel}`);
    console.error('hint: run behaver bind.criteria first');
    process.exit(1);
  }

  // already decomposed check
  const decomposedFile = path.join(behaviorDir, 'z.decomposed.md');
  if (existsSync(decomposedFile)) {
    if (mode === 'plan') {
      console.log('warn: behavior already decomposed');
      console.log(`behavior: ${behaviorDirRel}`);
      console.log('');
      console.log('peer sub-behaviors:');
      const content = readFileSync(decomposedFile, 'utf-8');
      const lines = content.split('\n').filter((l) => l.startsWith('- '));
      lines.forEach((l) => console.log(`  ${l}`));
      console.log('');
      console.log('hint: remove z.decomposed.md to re-decompose');
      process.exit(0);
    } else {
      console.error('error: behavior already decomposed');
      console.error(`behavior: ${behaviorDirRel}`);
      console.error('hint: remove z.decomposed.md to re-decompose');
      process.exit(1);
    }
  }

  // dispatch to mode
  if (mode === 'plan') {
    await modePlan(behaviorDir, behaviorName);
  } else {
    await modeApply(behaviorDir, planFile);
  }
};
