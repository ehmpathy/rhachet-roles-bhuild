#!/usr/bin/env bash
######################################################################
# .what = tally a route's peer reviews, by lane or by the rule each point cites
#
# .why  = a guard cannot answer two questions about itself, and both decide
#         whether a lane or a rule earns its place:
#         - by lane: which lanes found blockers, and which only cost a budget
#           round? a lane with many reports and zero blockers is theater
#         - by rule: where does the gate actually spend its attention? a rule
#           can be enrolled, blocker-graded, and cited ZERO times
#
# usage:
#   tally.reviews.peer.sh --route .behavior/my-feature
#   tally.reviews.peer.sh --route .behavior/my-feature --by rule
#   tally.reviews.peer.sh --route .behavior/my-feature --by rule --lane prose-of-
#   tally.reviews.peer.sh --route .behavior/my-feature --by rule \
#     --lane-wout 'dimensional-decomposition,experience-coverage'
#   tally.reviews.peer.sh --help
#
# options:
#   --route       the route dir to tally (required)
#   --by          lane | rule; default lane
#   --lane        narrow to reports whose filename holds this string
#   --lane-wout   drop reports whose filename holds any of these, comma-separated
#   --help        show the usage guide and exit
#
# 🔴 --lane-wout is COMMA-SEPARATED, never repeatable. getCliArgs.ts:41 last-wins on a
#    repeated flag, so `--lane-wout a --lane-wout b` would silently drop `a` — the same
#    shape as bhrain's repeated --paths-with. one flag, one explicit split.
#
# guarantee:
#   - reads only $route/.reviews/peer/*.report.md; writes no file
#   - fails loud: an empty corpus throws (exit 2), and a report whose points
#     do not pair 1:1 with their **rule**: lines throws. a silent zero is
#     indistinguishable from a clean gate, which is the defect this forbids
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhuild').then(m => m.cli.tallyReviewsPeer())" -- "$@"
