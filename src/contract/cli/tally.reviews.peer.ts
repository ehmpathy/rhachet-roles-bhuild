/**
 * .what = tally a route's peer reviews, by lane or by the rule each point cites
 * .how  = TypeScript implementation for the tally.reviews.peer.sh skill
 *
 * see src/domain.roles/behaver/skills/tally.reviews.peer.sh for full docs
 */

import { z } from 'zod';

import { genPeerReviewTallyStdout } from '@src/domain.operations/tally.reviews.peer/genPeerReviewTallyStdout';
import { getPeerReviewTally } from '@src/domain.operations/tally.reviews.peer/getPeerReviewTally';
import { getCliArgs } from '@src/infra/cli';

const schemaOfArgs = z.object({
  named: z.object({
    route: z.string().optional(),
    by: z.enum(['lane', 'rule']).default('lane'),
    lane: z.string().optional(),
    // 🔴 comma-separated, NOT repeatable. getCliArgs.ts:41 last-wins on a repeated flag —
    //    the same silent-drop shape as bhrain's --paths-with. one flag, explicit split
    'lane-wout': z.string().optional(),
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
export const tallyReviewsPeer = (options?: {
  argv?: string[];
  stdout?: (line: string) => void;
}): void => {
  const { named, ordered } = getCliArgs({
    schema: schemaOfArgs,
    argv: options?.argv,
  });
  const emit = options?.stdout ?? ((line: string) => console.log(line));

  if (named.help === true) {
    emit(genTallyReviewsPeerHelp());
    return;
  }

  // the route may ride as --route or as the first positional
  const route = named.route ?? ordered[0];
  if (!route) {
    emit(genTallyReviewsPeerHelp());
    return;
  }

  emit(
    genPeerReviewTallyStdout({
      tally: getPeerReviewTally({
        route,
        by: named.by,
        lane: named.lane ?? null,
        laneWout: (named['lane-wout'] ?? '')
          .split(',')
          .map((part) => part.trim())
          .filter((part) => part.length > 0),
      }),
    }),
  );
};

/**
 * .what = the usage guide printed on --help
 * .why = discovery of options and defaults without a trip to the docs
 */
const genTallyReviewsPeerHelp = (): string => {
  const optionRows: Array<[string, string, string]> = [
    ['--route', 'the route dir to tally', 'required'],
    [
      '--by',
      'lane (which lanes earn their place) | rule (where attention goes)',
      'lane',
    ],
    [
      '--lane',
      'narrow the corpus to reports whose filename holds this string',
      'all lanes',
    ],
    [
      '--lane-wout',
      'drop reports whose filename holds any of these (comma-separated)',
      'none',
    ],
    ['--help', 'show this guide', ''],
  ];

  const flagWidth = Math.max(...optionRows.map(([flag]) => flag.length));
  const descWidth = Math.max(...optionRows.map(([, desc]) => desc.length));
  const optionLines = optionRows.map(([flag, desc, def]) =>
    `  ${flag.padEnd(flagWidth)}  ${desc.padEnd(descWidth)}  ${
      def ? `[default: ${def}]` : ''
    }`.trimEnd(),
  );

  return [
    '🌲 tally.reviews.peer — what did this route’s peer lanes actually find?',
    '',
    'usage:',
    '  rhx tally.reviews.peer --route <dir> [--by lane|rule] [--lane <filter>]',
    '                         [--lane-wout <a,b,c>]',
    '',
    'options:',
    ...optionLines,
    '',
    'a lane with many reports and zero blockers costs a budget round and moves no stone.',
    'a rule bound and never cited is a rule the gate does not enforce.',
    '',
    '🔴 it fails loud: an empty corpus throws, and a report whose points do not pair with',
    '   their **rule**: lines throws. a silent zero reads as a clean gate.',
  ].join('\n');
};
