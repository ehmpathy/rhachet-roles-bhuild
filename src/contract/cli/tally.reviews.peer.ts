/**
 * .what = tally a route's peer reviews, by lane or by the rule each point cites
 * .how  = TypeScript implementation for the tally.reviews.peer.sh skill
 *
 * see src/domain.roles/behaver/skills/tally.reviews.peer.sh for full docs
 */

import { ConstraintError } from 'helpful-errors';
import { z } from 'zod';

import { asLaneSlugList } from '@src/domain.operations/tally.reviews.peer/asLaneSlugList';
import { genPeerReviewTallyStdout } from '@src/domain.operations/tally.reviews.peer/genPeerReviewTallyStdout';
import { getPeerReviewTally } from '@src/domain.operations/tally.reviews.peer/getPeerReviewTally';
import { getCliArgs } from '@src/infra/cli';

import { genTallyReviewsPeerHelp } from './genTallyReviewsPeerHelp';
import { getFlagCount } from './getFlagCount';

const schemaOfArgs = z.object({
  named: z.object({
    route: z.string().optional(),
    by: z.enum(['lane', 'rule']).default('lane'),
    // `-with` / `-wout`, the symmetric pair bhrain's `--paths-with` / `--paths-wout` set
    'lane-with': z.string().optional(),
    // comma-separated, since a repeated flag is last-wins in getCliArgs
    'lane-wout': z.string().optional(),
    help: z.boolean().optional(),
    // `-h`, the alias the guide advertises; getCliArgs maps it to `h`
    h: z.boolean().optional(),
    // rhachet passthrough args (optional, ignored)
    repo: z.string().optional(),
    role: z.string().optional(),
    skill: z.string().optional(),
    s: z.string().optional(),
  }),
  ordered: z.array(z.string()).default([]),
});

/**
 * .what = the cli entry point
 * .why  = parse the flags, refuse a malformed call loud, then read + render the tally
 */
export const tallyReviewsPeer = (options?: {
  argv?: string[];
  stdout?: (line: string) => void;
}): void => {
  // the parse owns its own default (it slices node + the entry path off process.argv);
  // the repeat count reads the same input, and a flag never sits in that sliced head
  const { named, ordered } = getCliArgs({
    schema: schemaOfArgs,
    argv: options?.argv,
  });
  const argv = options?.argv ?? process.argv;
  const emit = options?.stdout ?? ((line: string) => console.log(line));

  // --help or -h prints the guide and exits 0
  if (named.help === true || named.h === true) {
    emit(genTallyReviewsPeerHelp());
    return;
  }

  // a repeated --lane-wout is refused: getCliArgs keeps the last, which would drop the rest
  if (getFlagCount({ argv, flag: 'lane-wout' }) > 1)
    ConstraintError.throw('--lane-wout was given more than once', {
      hint: 'join the filters with commas: --lane-wout mech-,prose-of',
    });

  // a stray positional is refused, never read as a route
  if (ordered.length > 0)
    ConstraintError.throw('unexpected positional argument', {
      positional: ordered,
      hint: 'name the route with --route <dir>; run --help for the options',
    });

  // the route is required: an absent one exits 2, distinct from a clean tally
  const route =
    named.route ??
    ConstraintError.throw('--route is required', {
      hint: 'rhx tally.reviews.peer --route .behavior/<route>',
    });

  emit(
    genPeerReviewTallyStdout({
      tally: getPeerReviewTally({
        route,
        by: named.by,
        lane: named['lane-with'] ?? null,
        laneWout: asLaneSlugList({ raw: named['lane-wout'] ?? null }),
      }),
    }),
  );
};
