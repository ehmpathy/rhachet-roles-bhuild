/**
 * .what = locate archaeology left inline in a stage yield, and grade it
 * .how  = TypeScript implementation for the review.for.yield-archaeology.sh skill
 *
 * see src/domain.roles/behaver/skills/review.for.yield-archaeology.sh for full docs
 */

import { z } from 'zod';

import { genYieldArchaeologyStdout } from '@src/domain.operations/review.for.yield-archaeology/genYieldArchaeologyStdout';
import { getAllArchaeologyMarkers } from '@src/domain.operations/review.for.yield-archaeology/getAllArchaeologyMarkers';
import { getAllYieldsOnRoute } from '@src/domain.operations/review.for.yield-archaeology/getAllYields';
import { getCliArgs } from '@src/infra/cli';

const schemaOfArgs = z.object({
  named: z.object({
    route: z.string().optional(),
    stone: z.string().optional(),
    help: z.boolean().optional(),
    // rhachet passthrough args (optional, ignored)
    repo: z.string().optional(),
    role: z.string().optional(),
    skill: z.string().optional(),
    s: z.string().optional(),
  }),
  ordered: z.array(z.string()).default([]),
});

/**
 * .what = the CLI entry point
 */
export const reviewForYieldArchaeology = (options?: {
  argv?: string[];
  stdout?: (line: string) => void;
}): void => {
  const { named, ordered } = getCliArgs({
    schema: schemaOfArgs,
    argv: options?.argv,
  });
  const emit = options?.stdout ?? ((line: string) => console.log(line));

  if (named.help === true) {
    emit(genYieldArchaeologyHelp());
    return;
  }

  // the route may ride as --route or as the first positional
  const route = named.route ?? ordered[0];
  if (!route) {
    emit(genYieldArchaeologyHelp());
    return;
  }

  const yields = getAllYieldsOnRoute({ route, stone: named.stone ?? null });

  emit(
    genYieldArchaeologyStdout({
      paths: yields.map((found) => found.path),
      points: yields.flatMap((found) => getAllArchaeologyMarkers(found)),
    }),
  );
};

/**
 * .what = the usage guide printed on --help
 * .why = discovery of options and defaults without a trip to the docs
 */
const genYieldArchaeologyHelp = (): string => {
  // 🟡 the third cell is the full bracket text, never a bare default. `--route` has no
  //    default — it is required — and `[default: required]` is a label that reads two ways
  //    (`rule.forbid.ambiguous-labels`).
  const optionRows: Array<[string, string, string]> = [
    ['--route', 'the route dir whose yields to read', 'required'],
    [
      '--stone',
      'read only yields whose name starts with this',
      'default: every yield',
    ],
    ['--help', 'show this guide', ''],
  ];

  const flagWidth = Math.max(...optionRows.map(([flag]) => flag.length));
  const descWidth = Math.max(...optionRows.map(([, desc]) => desc.length));
  const optionLines = optionRows.map(([flag, desc, note]) =>
    `  ${flag.padEnd(flagWidth)}  ${desc.padEnd(descWidth)}  ${
      note ? `[${note}]` : ''
    }`.trimEnd(),
  );

  return [
    '🌲 review.for.yield-archaeology — does this yield state its own road?',
    '',
    'usage:',
    '  rhx review.for.yield-archaeology --route <dir> [--stone <prefix>]',
    '',
    'options:',
    ...optionLines,
    '',
    '🔴 `rule.require.archaeology-in-notes` offers a third verdict — MOVE — where cut and keep',
    '   both lose. a reviewer can state that verdict; only a lint can NAME the line, so the',
    '   repair is an edit rather than an argument.',
    '',
    '🟡 it grades PLACE, never prose. a well-written retraction is still a retraction, and a',
    '   clean run says naught about whether the prose that remains is dense.',
    '',
    '🔴 it fails loud: a filter that matches zero yields throws. a lint that read no file and',
    '   reported `0 blockers` is indistinguishable from a lint every file cleared.',
    '',
    '🟡 a fenced block and a blockquote are exempt — a verbatim quote may never be tidied.',
  ].join('\n');
};
