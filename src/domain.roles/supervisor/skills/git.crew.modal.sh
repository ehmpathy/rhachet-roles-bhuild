#!/usr/bin/env bash
######################################################################
# .what = read a crew's permission modal, parse its options, and —
#         only when told — answer it and verify, addressed by TREE
#
# .why  = rule.always.entool-the-permission-modal-cycle, PAID.
#
#         that rule names a four-step cycle — raw-read the pane, parse
#         which numbered option reads bare `Yes` vs `No`, send the key,
#         re-read to verify — and grades the THIRD hand-run in one
#         session a blocker. it also names the cure exactly: fold the
#         four steps into one call.
#
#         .measured 2026-09-17: the cycle ran by hand four times across
#         three babysit ticks, every one on the same tree, every one for
#         the same paved `rhx sedreplace`. correct in shape, forbidden
#         in method by a rule that was already booted.
#
# 🔴 .it never picks the answer, and that is deliberate
#    the same rule bounds itself: it governs the MECHANIC of the answer,
#    "never the JUDGMENT of which key to press — a judgment call (is this
#    command actually safe?) stays a driver decision every time."
#
#    ⇒ a bare call SENDS NAUGHT. it reads, parses, and reports what it
#      found. the key travels only under an explicit --answer.
#
# usage:
#   rhx git.crew.modal --tree <treeslug>                    # read + parse only
#   rhx git.crew.modal --tree <treeslug> --answer approve
#   rhx git.crew.modal --tree <treeslug> --answer decline
#   rhx git.crew.modal --tree <treeslug> --who reviewer.take --answer approve
#   rhx git.crew.modal --help
#
# args:
#   --tree    the tree slug, as git.crew.list prints it   (required)
#   --who     mechanic (default) — ONE role, never `all`
#   --answer  approve | decline. absent = read-only
#   --lines   how deep to read the pane (default 60)
#   --grove   local | cloud://<groveslug>
#             default: the box the LEDGER says this crew was booted on
#
# 🔴 .why the key is DERIVED rather than a constant
#    the hazard is option 2. on a TWO-option modal it reads `No` and
#    declines; on a THREE-option modal it reads `Yes, and don't ask
#    again` — a grant beyond this run, and never a supervisor's to give.
#    a hand-count gets that wrong under time pressure, so the count is
#    computed instead:
#
#      approve = the option whose text is EXACTLY `Yes`
#      decline = the option whose text starts `No` AND sits LAST
#
#    a `No` that is not last is REFUSED, never guessed.
#
# ⚠️ .it anchors on the modal FRAME, not on numbered lines
#    a clone's prose emits numbered lists constantly — a plea, a task
#    list, a set of next steps. the repo carries the case as a fixture:
#    `.test/.assets/pane.plea.prose-numbered-list-read-as-a-modal.log`
#    holds `1.` and `2.` in prose and is no modal at all. so options are
#    read only between the `Do you want to` prompt and the `Esc to
#    cancel` footer.
#
# ⚠️ .a consent / transcript prompt cannot be approved through this verb
#    it is neither a modal nor a survey. reject it explicitly; never
#    dismiss it with 0, which can read as assent.
#
# guarantee:
#   - a bare call is READ-ONLY; no keystroke leaves without --answer
#   - the key is computed from the parsed list, never assumed
#   - an unrecognised option shape is refused, never guessed
#   - every answer is verified by a read-back before it returns
#   - the grove is derived; you address a tree, never a host
#   - exit 0 = done, 1 = malfunction, 2 = constraint
######################################################################

set -uo pipefail

# source crewwork from the REPO's own lib (it loads ductwork + termwork)
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/crewwork.sh"

args=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skill|--repo|--role) shift 2 ;;
    --help|-h)
      # .why the end is FOUND, never a pinned line number: a literal
      #   bound goes stale on the next edit and stays SILENT when it
      #   does — a false report about the file it lives in.
      awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"
      exit 0
      ;;
    *) args+=("$1"); shift ;;
  esac
done

crew.modal "${args[@]}"
