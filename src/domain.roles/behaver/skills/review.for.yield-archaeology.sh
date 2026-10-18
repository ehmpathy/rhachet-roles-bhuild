#!/usr/bin/env bash
######################################################################
# .what = locate archaeology left inline in a stage yield, and grade it
#
# .why  = `rule.require.archaeology-in-notes` offers a third verdict —
#         MOVE — where cut and keep both lose. a reviewer can STATE that
#         verdict; only a lint can NAME the line, so the repair becomes an
#         edit rather than an argument.
#
#         each marker below asserts a fact only the author's process can
#         explain — a retraction, an attempt trail, a confidence that moved,
#         a review round, a deliberation. a reader who wants the decision
#         cannot act on any of them.
#
# usage:
#   review.for.yield-archaeology.sh --route .behavior/my-feature
#   review.for.yield-archaeology.sh --route .behavior/my-feature --stone 1.vision
#   review.for.yield-archaeology.sh --help
#
# options:
#   --route   the route dir whose yields to read (required)
#   --stone   read only yields whose name starts with this prefix
#   --help    show the usage guide and exit
#
# the markers:
#   🔴 retraction             a claim the artifact made and withdrew
#   🔴 attempt-trail          the paths tried before the one that held
#   🔴 confidence-trajectory  a confidence that moved (`62% → 91%`)
#   🔴 iteration-ref          a reference to a review round
#   🔴 decision-process       the deliberation behind a decision
#   🟡 temporal-deixis        a word whose referent is a moment, so it rots
#   🟡 process-narration      the doc narrates its own edit
#
# 🟡 an APPENDIX is never read — archaeology BELONGS there, so a lint over
#    it would fine the driver for the ejection the lint exists to demand.
#
# 🟡 it grades PLACE, never prose. a clean run says naught about whether the
#    prose that remains is dense — that is the `dense` lanes' subject.
#
# guarantee:
#   - reads only $route/*.yield.md; writes no file
#   - exempts fenced blocks and blockquotes; a verbatim quote is never tidied
#   - emits the `contract.reviewer-output` pair on every path, so a guard
#     lane can read its verdict
#   - fails loud: a filter that matches zero yields throws (exit 2). a lint
#     that read no file and reported `0 blockers` is indistinguishable from
#     a lint every file cleared
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhuild').then(m => m.cli.reviewForYieldArchaeology())" -- "$@"
