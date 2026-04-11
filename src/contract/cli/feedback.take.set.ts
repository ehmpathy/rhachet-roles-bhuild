/**
 * .what = record a feedback response with hash verification
 *
 * .why  = enables clones to mark feedback as responded
 *         - validates path consistency
 *         - stores hash for stale detection
 *
 * usage:
 *   feedback.take.set.sh --from <given> --into <taken> --response <text>
 *   feedback.take.set.sh --from <given> --into <taken> --response @stdin
 *
 * guarantee:
 *   - fail-fast if paths are invalid
 *   - fail-fast if [given] file not found
 *   - writes [taken] file with givenHash in frontmatter
 */

import { readFileSync } from 'fs';
import { basename } from 'path';
import { z } from 'zod';

import { feedbackTakeSet as feedbackTakeSetOp } from '@src/domain.operations/behavior/feedback/feedbackTakeSet';
import { getCliArgs } from '@src/infra/cli';

// ────────────────────────────────────────────────────────────────────
// schema
// ────────────────────────────────────────────────────────────────────

const schemaOfArgs = z.object({
  named: z.object({
    // skill-specific args
    from: z.string(),
    into: z.string(),
    response: z.string(),
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

export const feedbackTakeSet = (): void => {
  const { named } = getCliArgs({ schema: schemaOfArgs });

  // handle @stdin for response
  let response: string;
  if (named.response === '@stdin') {
    response = readFileSync(0, 'utf-8').trim();
  } else {
    response = named.response;
  }

  // set feedback response
  const result = feedbackTakeSetOp({
    fromPath: named.from,
    intoPath: named.into,
    response,
  });

  // render output
  const dim = '\x1b[2m';
  const reset = '\x1b[0m';
  const green = '\x1b[32m';

  const givenFilename = basename(named.from);
  const takenFilename = basename(result.takenPath);
  const lines = [
    `🦫 mkurrr,`,
    '', // blank line between mascot and artifact
    `🌲 feedback.take.set --from ${givenFilename} --into ${takenFilename}`,
    `   ├─ ${green}✓${reset} ${takenFilename}`,
    `   └─ ${dim}hash: ${result.givenHash.slice(0, 8)}...${reset}`,
  ];

  console.log(lines.join('\n'));
};
