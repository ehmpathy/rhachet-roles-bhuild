/**
 * .what = catch a dream via findsert to .dream/ folder
 * .how  = TypeScript implementation for catch.dream.sh skill
 *
 * see src/domain.roles/dreamer/skills/catch.dream.sh for full documentation
 */

import { relative } from 'path';
import { z } from 'zod';

import { runCatchDream } from '@src/domain.operations/dreamer/catch/runCatchDream';
import { getCliArgs } from '@src/infra/cli';

// ────────────────────────────────────────────────────────────────────
// schema
// ────────────────────────────────────────────────────────────────────

const schemaOfArgs = z.object({
  named: z.object({
    // skill-specific args
    name: z.string(),
    open: z.string().optional(),
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

export const catchDream = (): void => {
  const { named } = getCliArgs({ schema: schemaOfArgs });
  const cwd = process.cwd();

  // validate --name is provided
  if (!named.name || named.name.trim() === '') {
    console.error('⛈️  error: --name is required');
    console.error('');
    console.error('please specify what dream to catch. for example:');
    console.error('  --name "config-reload"');
    console.error('  --name "async-queue-batch"');
    process.exit(1);
  }

  // validate --open has a value if provided
  if (named.open !== undefined && named.open.trim() === '') {
    console.error('⛈️  error: --open requires an editor name');
    console.error('');
    console.error('please specify what editor to open with. for example:');
    console.error('  --open codium');
    console.error('  --open vim');
    console.error('  --open zed');
    console.error('  --open code');
    process.exit(1);
  }

  // run the catch dream operation
  const result = runCatchDream({
    name: named.name,
    open: named.open,
    cwd,
  });

  // compute relative path for display
  const dreamPathRel = relative(cwd, result.dream.path) || result.dream.path;

  // render output
  const dim = '\x1b[2m';
  const reset = '\x1b[0m';

  const outcomeLabel =
    result.outcome === 'caught' ? 'dream caught' : 'dream found';
  console.log(`🌙 ${outcomeLabel}`);
  console.log(`   ├─ ${dreamPathRel}`);

  // render opener result
  if (result.openerResult) {
    if (result.openerResult.success) {
      console.log(`   └─ opened in ${named.open}`);
    } else {
      console.log(`   └─ ⚠️  ${result.openerResult.error}`);
    }
  } else {
    console.log(
      `   └─ ${dim}tip: use --open to open the dream automatically${reset}`,
    );
  }

  // render fuzzy match candidates if any
  if (result.candidates.length > 0) {
    console.log('');
    console.log('💭 related dreams from past week');
    result.candidates.forEach((candidate, index) => {
      // all candidates use ├─ since tip line follows
      console.log(
        `   ├─ ${index + 1}. ${candidate.dream.name} (${candidate.dream.date.replace(/_/g, '-')})`,
      );
    });
    console.log(`   └─ ${dim}reuse? run again with one of those names${reset}`);
  }
};
