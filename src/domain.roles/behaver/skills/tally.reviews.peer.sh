#!/usr/bin/env bash
######################################################################
# .what = tally a route's peer reviews, by lane or by the rule each point cites
#
# .why  = no guard output reports two counts that decide whether a lane or a
#         rule earns its place:
#         - by lane: reports and blockers per lane. a lane with many reports and
#           0 blockers spends budget rounds and finds no defect
#         - by rule: points per cited rule. a rule can be enrolled,
#           blocker-graded, and cited 0 times in the corpus read
#
# usage:
#   tally.reviews.peer.sh --route .behavior/my-feature
#   tally.reviews.peer.sh --route .behavior/my-feature --by rule
#   tally.reviews.peer.sh --route .behavior/my-feature --by rule --lane-with prose-of-
#   tally.reviews.peer.sh --route .behavior/my-feature --by rule \
#     --lane-wout 'dimensional-decomposition,experience-coverage'
#   tally.reviews.peer.sh --help
#
# options:
#   `--help` is the authoritative flag list; it sits beside the parser it describes
#   (src/contract/cli/genTallyReviewsPeerHelp.ts), so a copy here would drift.
#
# 🔴 --lane-wout is comma-separated and given once: getCliArgs.ts:41 is last-wins on
#    a repeated flag, so `--lane-wout a --lane-wout b` is refused, exit 2.
#
# guarantee:
#   - reads only $route/.reviews/peer/*.report.md; writes no file
#   - fails loud: an absent --route, a stray positional, a repeated --lane-wout,
#     or an empty corpus exits 2; a report whose summary counts, point blocks,
#     **rule**: lines, or filename lane disagree with the guard's shape exits 1.
#     a silent zero reads as a clean gate
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhuild').then(m => m.cli.tallyReviewsPeer())" -- "$@"
