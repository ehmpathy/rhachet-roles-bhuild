#!/usr/bin/env bash
######################################################################
# pollwork.sweeps — the --fellable and --healable views, each a complete answer
#
# 🔴 .a PART of pollwork.sh — sourced, never executed, and only BY pollwork.sh.
#     git.crew.poll.sh sources pollwork.sh, which loads every part. see
#     __poll_load_parts there for why the poll is cut into parts at all.
#
# .holds = the __poll_render_sweeps stage
######################################################################

######################################################################
# __poll_render_sweeps — the release tallies, then the fell and heal sweeps
######################################################################
#
# .note = the body is the poll's own top-level code, moved VERBATIM and left
#         unindented, so `git diff --color-moved` and `git blame -C` trace
#         every line to its origin. a `declare` here carries `-g`: at top
#         level it was global, and a stage that shares its maps with the
#         stages after it must keep them so.
__poll_render_sweeps() {
echo ""

MERGED=${TALLY[merged]:-0}
GREEN=${TALLY[green]:-0}
DIRTY=${TALLY[merged-dirty]:-0}
CLEAN=$(( MERGED - DIRTY ))

# the dirty set parts in two, because the two take different acts — see the
# tally site for the measurement. TOOL is closed by one `--stash --why`;
# WORK needs a commit or a human's decision.
DIRTY_TOOL=${TALLY[merged-dirty-tool]:-0}
DIRTY_WORK=$(( DIRTY - DIRTY_TOOL ))

# 🔴 the UNREACHED caveat rides EVERY actionable-set verdict below — task #81
#
#   `--fellable` and `--healable` each close with one verdict line, and on
#   those views it is the LAST line a reader meets. the sweep header names the
#   unreached groves ABOVE the report, so a reader who scrolls to the answer
#   meets the verdict WITHOUT it — and `no tree to fell — 39 polled, none
#   merged` then reads as a claim about the world rather than about the groves
#   that answered (term=partial-audit with a confident face).
#
#   measured 2026-09-14 (6 unreached) and again 2026-09-15 (4) — PERMANENT
#   while any grove sleeps. so the count rides the verdict
#   (rule.forbid.clipped-sweeps) and the guide carries the runnable wake
#   (rule.require.poll-recommends-every-cure-heal-has).
# 🔴 .why these read the PARTED arrays, never `${#HOSTS_UNREACHED[@]}`
#
#   the fused count is what the header stopped emitting; a footer that keeps it
#   puts two counts of one set in one report, and the reader cannot tell which
#   is the defect. worse, the GUIDE hands over `rhx git.grove.wake $grove` —
#   a command that exits 2 on a grove the forest does not hold, so a fused
#   `[0]` could name a retired grove and prescribe a cure that cannot run.
#
# ⇒ `UNREACHED_*` is now strictly the WAKEABLE population, which is the only
#   one the wake guide can serve. the retired half rides its own count, and
#   its own line.
UNREACHED_N=${#__unreached_asleep[@]}
UNREACHED_GROVE=${__unreached_asleep[0]:-<grove>}
RETIRED_N=${#__unreached_gone[@]}

# 🔴 the ON-GROVE caveat rides the FELL verdicts, and ONLY those
#
#   an UNREACHED grove did not answer AT ALL. an ON-GROVE tree sits on a grove
#   that may well have answered, and its own per-tree ssh came back empty.
#   two different omissions, so two different caveats.
#
# ⚠️ this paragraph read "answered fine — the tree half of this poll is local by
#    construction, so `__poll_one_tree` returns the declined verdict BEFORE any
#    release read runs" until 2026-09-18. that was retired by
#    `__poll_tree_facts_on_grove` on 2026-09-17: the grove arm sshs, and the
#    `🌐 on grove` verdict is now what a FAILED read renders.
#
#   .measured 2026-09-16: svc-reservations.beav.feat-rec-waitlist-capture
#   shipped to prod (PR #355 merged, v0.74.0 cut, deploy green) while this
#   view read `no tree to fell — 40 polled, none merged`. the unreached
#   caveat rode that line and named the wrong omission.
#
# ⚠️ it does NOT ride `--healable`. that view keys on `crew_status`, which IS
#    read cross-grove (the crew half asks the grove), so a grove tree's heal
#    verdict is a real judgment rather than a declined one. to caveat it
#    would be noise about a subject the view actually saw.
ONGROVE_N=${TALLY["on grove"]:-0}

if [[ "$FELLABLE" == "true" ]]; then
  if (( MERGED == 0 )); then
    # 🔴 the count rides through `__crew_fell_scope_phrase`, never raw — the
    #   caveat beside it disclaims a subject set, and a headline that quotes
    #   $ROWS asserts a release verdict over trees it never read. measured
    #   2026-09-16 on a STALLED grove, where an empty fell set is the exact
    #   input that escalates a provision ask.
    echo "🦫 no tree to fell — $(__crew_fell_scope_phrase "$ROWS" "$ONGROVE_N")$(__crew_ongrove_caveat "$ONGROVE_N")$(__crew_unreached_caveat "$UNREACHED_N" "$RETIRED_N")"
    # ⚠️ .this caveat NARROWED on 2026-09-17, and its old text is the reason it
    #   had to. it read "no instrument yet", which was true when written and
    #   false the moment __poll_tree_facts_on_grove landed — and a stale
    #   disclaimer is the exact mechanism that let the defect it disclosed
    #   survive four ticks: a declared bound reads as settled, so it was quoted
    #   back as a verdict rather than checked.
    #
    #   the decline is now a FAILURE path, never the whole grove path. so these
    #   trees are not "unread by design"; they are trees whose read did not
    #   answer — an asleep grove, a dropped tunnel, a worktree the glob missed.
    #   that names a fixable cause, and it hands over the fix.
    # 🔴 .the NARROWING the comment above claims was never applied to the STRING
    #   — 2026-09-18. the block above reads "this caveat NARROWED on 2026-09-17"
    #   and states the correct claim outright: "these trees are not 'unread by
    #   design'; they are trees whose read did not answer". the line beneath it
    #   kept the pre-repair text verbatim, so the comment and the render
    #   disagreed, and only the render reaches a reader.
    #
    #   three claims in that string went false the moment
    #   `__poll_tree_facts_on_grove` landed:
    #
    #     "the grove answered fine"        — asserted unconditionally. this is
    #                                        the FAILURE path; the ssh may not
    #                                        have answered at all
    #     "this poll reads TREES locally"  — retired 2026-09-17. the grove arm
    #                                        sshs (__poll_one_tree:1921)
    #     "unread, never absent"           — the REASON is wrong, so a reader
    #                                        concludes "by design, no act owed"
    #                                        where the truth is "a read failed"
    #
    # 🔴 .measured 2026-09-18 — TWO runs of `git.crew.poll --all --fellable`,
    #   minutes apart, same fleet, grove at runq 13:
    #
    #     run 1 → 9 ON GROVE · "none merged" · the merged tree ABSENT entirely
    #     run 2 → 6 ON GROVE · that same tree rendered `👌 merged — pr #38`
    #
    #   the tree was merged in both. a saturated grove drops the ssh, the tree
    #   falls into this bucket, and the footer told the reader it was never
    #   meant to be read. ⇒ `--fellable` — the one surface a babysit tick is
    #   told to DERIVE the fell set from — omitted a fellable tree and headlined
    #   a verdict over it (term=partial-audit, term=false-report).
    #
    # ⚠️ .and the handed-over fix could not settle what the line is about: it
    #   emitted `git.crew.read --tree … --who mechanic`, which reads a PANE. a
    #   pane holds no release state. the final clause of the comment above —
    #   "that names a fixable cause, and it hands over the fix" — went unmet.
    #
    # .the names ride too. ONGROVE_TREES holds every one and only [0] was
    #   rendered — the same discarded-name defect this file grades "the defect
    #   at its sharpest" two views over.
    #
    # 🔴 .the LOAD attribution is REFUTED, 2026-09-19 — and it was an n=2 law
    #
    #   the two runs recorded above (9 ON GROVE saturated, 6 lighter) are a
    #   sample of two, and they were shipped as a cause: "most often a grove
    #   too loaded to answer in time", plus a prescription built on it, "a
    #   re-run often settles it". three consecutive runs in one session:
    #
    #     run | grove runq        | UNREAD
    #     ----+-------------------+-------
    #      1  | 22 of 4 (stalled) |   7
    #      2  |  0    (idle 70%)  |  10
    #      3  |  0    (idle 70%)  |  12
    #
    #   ⇒ load fell to ZERO and the count nearly DOUBLED — the stated cause
    #     predicts the inverse. membership churned entirely between runs: a
    #     tree unread in run 2 read clean in run 3, and the reverse.
    #
    # ⚠️ the PRESCRIPTION is the sharper half. "a re-run often settles it" is
    #   a loop, each call costs one ssh per tree, and three did not converge.
    #   a forecast misleads; a prescription built on a forecast spends the
    #   fleet's ssh budget on a remedy nobody measured
    #   (rule.require.enumerate-before-you-name).
    #
    # 🟡 .no replacement cause is asserted, on purpose. a candidate is owed a
    #   CAPTURE, never a ship: the read fans one ssh per tree at a grove that
    #   already holds ~129 sshd sessions, and sshd MaxStartups drops beyond
    #   its threshold AT RANDOM — which fits load-independence, the churn, and
    #   why `--all` (42 trees) fares worse than the star scope. to ship that
    #   as the cause would repeat the very defect this cures
    #   (rule.always.capture-clamp-then-verify-in-prod, step 1).
    #
    # ⇒ this is the THIRD false reason retired from this one render — after
    #   "no instrument yet" and "unread, never absent". clamped at [case41].
    if (( ONGROVE_N > 0 )); then
      echo "   └─ 🌐 $ONGROVE_N tree(s) whose release state went UNREAD — one ssh per tree, and these came back empty.$(__crew_ongrove_reach_clause "$UNREACHED_N") what failed is each tree's own read — a FAILED read, never a scope declined by design, so the verdict above says NAUGHT about them. ⚠️ the cause is UNMEASURED, and it does NOT track grove load: measured 2026-09-19, 7 unread on a STALLED box (runq 22 of 4) and 12 on that same box IDLE (runq 0, 70% idle), with the membership churned between runs. ⇒ a re-run RESAMPLES an unstable read — the cheapest next move, and it settles naught on its own: rhx git.crew.poll --all --fellable"
      for __og in "${ONGROVE_TREES[@]:-}"; do
        [[ -n "$__og" ]] || continue
        echo "      ├─ 🌐 UNREAD — $__og"
      done
    fi
    __crew_unreached_guide "$UNREACHED_N" "$UNREACHED_GROVE" "$RETIRED_N"
  else
    # 🔴 this view exists to NAME the fell list, so a `<tree>` placeholder here
    #   is the defect at its sharpest — the dedicated flag denies the one
    #   question it was added to answer. name every clean tree with its own
    #   runnable command; fall back to the placeholder only when there is no
    #   clean tree to name (CLEAN 0 with DIRTY > 0).
    #
    # 🔴 .the printed count is ${#FELLABLE_TREES[@]}, never $CLEAN — task #33
    #   $CLEAN counts merged-and-not-dirty alone; the array also excludes a
    #   tree whose clone still holds the pane (crew_live_clone, above). a
    #   header that quoted $CLEAN here would over-count against its own list —
    #   the exact count/list mismatch this view was built to close.
    #   ⇒ and the FENCED set is now an ARRAY, never that subtraction — the row
    #     below names each tree it fenced (task #37). the count it prints is
    #     `${#LIVE_FENCED_TREES[@]}`, filed at the fence itself, so the count
    #     and the list are one derivation and can never disagree.
    # 🔴 .every fell row carries CONFIRM FIRST — task #34
    #
    # .what = the runnable command never travels alone. each row names the ask
    #   that must precede it, and a note under the list says what the safety
    #   gate can NOT check.
    #
    # .why = a bare `👌 <tree> — rhx git.tree.del --name <tree>` states a
    #   command and says naught about who may fire it, so a supervisor supplies
    #   the absent half from memory — and memory failed in BOTH directions
    #   inside one session:
    #
    #     ticks K-N  surfaced it under "gates, all yours" and waited for the
    #                human to type it. four ticks, a tree held a grove slot,
    #                and the human asked "how come this isnt felled still ?"
    #     tick  O    ran the next one with no ask at all. the human had asked
    #                for CONFIRMATION, and got autonomy.
    #
    #   ⇒ the reminder belongs in the RENDER, never in a supervisor's head.
    #
    # 🔴 .the distinction the note must carry, or it teaches the tick-O error
    #   `git tree del` already fails closed on unstaged commits and unmerged
    #   PRs, and a tree reaches this list only when it clears that bar. so the
    #   gate answers "is the WORK safe to lose" — a question about bytes. it
    #   cannot answer "does the human still want this tree gone" — a question
    #   about intent, which no tool holds. to read the first as the second is
    #   exactly what tick O did, and the note names the seam so the next reader
    #   cannot.
    #
    # .why BOTH sites carry it (here and the ACTIONS footer): the command is
    #   emitted twice, from independent code, and neither emit can be wrong —
    #   so a second copy is a second chance, never a duplicate
    #   (`rule.require.a-cue-is-not-a-claim`).
    if (( ${#FELLABLE_TREES[@]} > 0 )); then
      echo "🦫 dam fine! ${#FELLABLE_TREES[@]} to fell$(__crew_ongrove_caveat "$ONGROVE_N")$(__crew_unreached_caveat "$UNREACHED_N" "$RETIRED_N")"
      for __ct in "${FELLABLE_TREES[@]}"; do
        echo "   ├─ 👌 $__ct — CONFIRM FIRST, then: rhx git.crew.fell --tree $__ct"
      done
      echo "   ├─ 🙋 ASK THE HUMAN before each fell, and wait for the yes."
      echo "   │     the gate this list already cleared answers \"is the WORK safe to lose\""
      echo "   │     — merged PR, clean tree. it can NOT answer \"does the human still want"
      echo "   │     this tree gone\", which is a DECISION and is theirs. a mechanically safe"
      echo "   │     fell is still an unasked one"
    else
      echo "🦫 no tree to fell right now$(__crew_ongrove_caveat "$ONGROVE_N")$(__crew_unreached_caveat "$UNREACHED_N" "$RETIRED_N")"
    fi
    # ⚠️ .this caveat NARROWED on 2026-09-17, and its old text is the reason it
    #   had to. it read "no instrument yet", which was true when written and
    #   false the moment __poll_tree_facts_on_grove landed — and a stale
    #   disclaimer is the exact mechanism that let the defect it disclosed
    #   survive four ticks: a declared bound reads as settled, so it was quoted
    #   back as a verdict rather than checked.
    #
    #   the decline is now a FAILURE path, never the whole grove path. so these
    #   trees are not "unread by design"; they are trees whose read did not
    #   answer — an asleep grove, a dropped tunnel, a worktree the glob missed.
    #   that names a fixable cause, and it hands over the fix.
    # 🔴 .the NARROWING the comment above claims was never applied to the STRING
    #   — 2026-09-18. the block above reads "this caveat NARROWED on 2026-09-17"
    #   and states the correct claim outright: "these trees are not 'unread by
    #   design'; they are trees whose read did not answer". the line beneath it
    #   kept the pre-repair text verbatim, so the comment and the render
    #   disagreed, and only the render reaches a reader.
    #
    #   three claims in that string went false the moment
    #   `__poll_tree_facts_on_grove` landed:
    #
    #     "the grove answered fine"        — asserted unconditionally. this is
    #                                        the FAILURE path; the ssh may not
    #                                        have answered at all
    #     "this poll reads TREES locally"  — retired 2026-09-17. the grove arm
    #                                        sshs (__poll_one_tree:1921)
    #     "unread, never absent"           — the REASON is wrong, so a reader
    #                                        concludes "by design, no act owed"
    #                                        where the truth is "a read failed"
    #
    # 🔴 .measured 2026-09-18 — TWO runs of `git.crew.poll --all --fellable`,
    #   minutes apart, same fleet, grove at runq 13:
    #
    #     run 1 → 9 ON GROVE · "none merged" · the merged tree ABSENT entirely
    #     run 2 → 6 ON GROVE · that same tree rendered `👌 merged — pr #38`
    #
    #   the tree was merged in both. a saturated grove drops the ssh, the tree
    #   falls into this bucket, and the footer told the reader it was never
    #   meant to be read. ⇒ `--fellable` — the one surface a babysit tick is
    #   told to DERIVE the fell set from — omitted a fellable tree and headlined
    #   a verdict over it (term=partial-audit, term=false-report).
    #
    # ⚠️ .and the handed-over fix could not settle what the line is about: it
    #   emitted `git.crew.read --tree … --who mechanic`, which reads a PANE. a
    #   pane holds no release state. the final clause of the comment above —
    #   "that names a fixable cause, and it hands over the fix" — went unmet.
    #
    # .the names ride too. ONGROVE_TREES holds every one and only [0] was
    #   rendered — the same discarded-name defect this file grades "the defect
    #   at its sharpest" two views over.
    #
    # 🔴 .the LOAD attribution is REFUTED, 2026-09-19 — and it was an n=2 law
    #
    #   the two runs recorded above (9 ON GROVE saturated, 6 lighter) are a
    #   sample of two, and they were shipped as a cause: "most often a grove
    #   too loaded to answer in time", plus a prescription built on it, "a
    #   re-run often settles it". three consecutive runs in one session:
    #
    #     run | grove runq        | UNREAD
    #     ----+-------------------+-------
    #      1  | 22 of 4 (stalled) |   7
    #      2  |  0    (idle 70%)  |  10
    #      3  |  0    (idle 70%)  |  12
    #
    #   ⇒ load fell to ZERO and the count nearly DOUBLED — the stated cause
    #     predicts the inverse. membership churned entirely between runs: a
    #     tree unread in run 2 read clean in run 3, and the reverse.
    #
    # ⚠️ the PRESCRIPTION is the sharper half. "a re-run often settles it" is
    #   a loop, each call costs one ssh per tree, and three did not converge.
    #   a forecast misleads; a prescription built on a forecast spends the
    #   fleet's ssh budget on a remedy nobody measured
    #   (rule.require.enumerate-before-you-name).
    #
    # 🟡 .no replacement cause is asserted, on purpose. a candidate is owed a
    #   CAPTURE, never a ship: the read fans one ssh per tree at a grove that
    #   already holds ~129 sshd sessions, and sshd MaxStartups drops beyond
    #   its threshold AT RANDOM — which fits load-independence, the churn, and
    #   why `--all` (42 trees) fares worse than the star scope. to ship that
    #   as the cause would repeat the very defect this cures
    #   (rule.always.capture-clamp-then-verify-in-prod, step 1).
    #
    # ⇒ this is the THIRD false reason retired from this one render — after
    #   "no instrument yet" and "unread, never absent". clamped at [case41].
    if (( ONGROVE_N > 0 )); then
      echo "   └─ 🌐 $ONGROVE_N tree(s) whose release state went UNREAD — one ssh per tree, and these came back empty.$(__crew_ongrove_reach_clause "$UNREACHED_N") what failed is each tree's own read — a FAILED read, never a scope declined by design, so the verdict above says NAUGHT about them. ⚠️ the cause is UNMEASURED, and it does NOT track grove load: measured 2026-09-19, 7 unread on a STALLED box (runq 22 of 4) and 12 on that same box IDLE (runq 0, 70% idle), with the membership churned between runs. ⇒ a re-run RESAMPLES an unstable read — the cheapest next move, and it settles naught on its own: rhx git.crew.poll --all --fellable"
      for __og in "${ONGROVE_TREES[@]:-}"; do
        [[ -n "$__og" ]] || continue
        echo "      ├─ 🌐 UNREAD — $__og"
      done
    fi
    # 🔴 the dirty set is rendered in TWO lines, because it takes two acts
    #   `rule.require.poll-recommends-every-cure-heal-has`: a view that names a
    #   fenced tree owes the cure. for tool state the cure is one command, and
    #   the fused line hid it behind a phrase — "until the work is set aside" —
    #   that reads as a decision somebody must make.
    #
    # ⚠️ the `--why` rides as `<yours>`, never pre-filled. the stash is safe on
    #   the EVIDENCE this classifier gathered; that it is WANTED is a judgment,
    #   and a tool that authored the reason would put words in a human's mouth
    #   (rule.forbid.fabricated-opines, rule.require.distinguish-prefilled-from-suggested).
    (( DIRTY_WORK > 0 )) && echo "   └─ ✋ $DIRTY_WORK merged but DIRTY with WORK — the fell refuses until it is committed or set aside"
    if (( ${#DIRTY_TOOL_TREES[@]} > 0 )); then
      echo "   └─ 🧹 ${#DIRTY_TOOL_TREES[@]} merged, dirt is TOOL STATE only — a re-run restores it, so the stash loses naught"
      for __ct in "${DIRTY_TOOL_TREES[@]}"; do
        echo "      ├─ 🧹 $__ct — CONFIRM FIRST, then: rhx git.crew.fell --tree $__ct --stash --why '<yours>'"
      done
    fi
    # 🔴 it reports what the FENCE SAW, never what the clone is DOING — 2026-09-18
    #
    #   the prior line read "a clone is MID-TURN — it lifts on its own once the
    #   turn ends". both halves are claims the fence cannot support, and the
    #   second is a PROMISE.
    #
    #   `__crew_clones_idle` FAILS CLOSED by design (see its own note): a modal,
    #   a queue, an unread box, a read that timed out — any absent turn-end
    #   record keeps the fence shut. so the fence's true statement is "I did not
    #   see a turn-end for every live clone", and `mid-turn` converts that
    #   ABSENCE OF EVIDENCE into a positive assertion about a clone's state.
    #
    # 🔴 .measured 2026-09-18 — infrastructure.beav.feat-grove-reach-ehmpathy-demo
    #   this row held that tree for three consecutive ticks. its pane, read
    #   verbatim, carried claude's own epilogue `✻ Cogitated for 5m 21s`, an
    #   empty `❯`, `🗿 route complete 🌴🤙`, and an idle age of 712m. the turn had
    #   been over TWELVE HOURS. `__duct_pane_turn_ended`'s regex matches that
    #   epilogue — confirmed against the captured pane — so the detector was
    #   never the gap; the pane read had not landed on a grove at 358% load with
    #   a run queue of 7. minutes later, on a calmer grove, the same tree
    #   rendered fellable with no change to the tree whatever.
    #
    #   ⇒ so "it lifts on its own once the turn ends" named a lift that had
    #     ALREADY HAPPENED, and a supervisor who trusted it waited three ticks
    #     on a tree that was safe to fell the whole time. that is the same
    #     permanent-refusal-worded-as-temporary the fence above already paid
    #     for once (`rule.forbid.remedies-that-mimic-the-defect` — the prior
    #     repair replaced one unfalsifiable wait with another).
    #
    # ⚠️ .and the row must NAME the tree. `<tree>` was a placeholder because
    #   `live_excluded` was a bare subtraction that discarded every name — the
    #   defect the comment at the top of this branch calls "the defect at its
    #   sharpest", committed four lines below itself. a row that recommends a
    #   read owes the subject of that read.
    if (( ${#LIVE_FENCED_TREES[@]} > 0 )); then
      echo "   └─ 🐢 ${#LIVE_FENCED_TREES[@]} merged and clean, FENCED — the fence fails closed on a modal, a queue, an unread box, or a pane read that did not land, so it reports what it SAW and never what a clone does. settle each with ONE read:"
      for __ct in "${LIVE_FENCED_TREES[@]}"; do
        echo "      ├─ 🐢 FENCED — $__ct — no turn-end was seen for every live clone; settle it: rhx git.crew.read --tree $__ct --who mechanic --lines 40"
      done
    fi
    __crew_unreached_guide "$UNREACHED_N" "$UNREACHED_GROVE" "$RETIRED_N"
  fi
  exit 0
fi

if [[ "$HEALABLE" == "true" ]]; then
  # 🔴 this view exists to NAME the heal list, so a `<tree>` placeholder here
  #   is the defect at its sharpest — the dedicated flag denies the one
  #   question it was added to answer. name every healable tree with its own
  #   runnable command, so the supervisor heals in bulk THROUGH the tool
  #   rather than by hand off the sweep.
  #
  # 🔴 HEALABLE spans every state `git.crew.heal` can cure — the poll must
  #   recommend the cure it holds (rule.require.poll-recommends-every-cure-heal-has).
  #   FOUR axes, and each takes its OWN command:
  #     • a `limited` crew → a NUDGE: transient 429 (bare banner, no clock) or a
  #       stale cap (reset PASSED). a live/future cap is here too — its cure is
  #       an auth.swap, which heal picks (define.invariant.crew.ratelimit.
  #       live-cap-healable-via-swap).
  #     • a `husk` crew → a REVIVE: heal reboots + resumes the conversation
  #       (define.invariant.crew.husk.discriminator-parity). heal arbitrates the
  #       surface-only husk edge cases at run time.
  #     • a `frozen` crew WITH a parked queued row → a RELAY of that text.
  #     • 🔴 a `frozen` crew with NO queued row → a WEDGE PROBE. added
  #       2026-09-16. the wedge axis is opt-in (`--what wedge`) and never runs
  #       under the default, so while this set omitted it the axis was
  #       UNREACHABLE to any supervisor who derives the set through the tool —
  #       which the babysit tick mandates. the probe reads twice with a repaint
  #       between and NEVER auto-reboots; it names a suspect and hands the
  #       confirm to a human.
  if (( ${#HEALABLE_TREES[@]} > 0 )); then
    echo "🦫 dam fine! ${#HEALABLE_TREES[@]} to heal$(__crew_unreached_caveat "$UNREACHED_N" "$RETIRED_N")"
    for __ct in "${HEALABLE_TREES[@]}"; do
      __hg="🚫"
      [[ "${HEALABLE_STATUS[$__ct]:-}" == "husk" ]] && __hg="💀"
      [[ "${HEALABLE_STATUS[$__ct]:-}" == "frozen" ]] && __hg="🧊"
      # 🔴 the AXIS overrides the status for the glyph, and only here
      #    a husk BOX under an `at work` crew reaches `revive` with a status that
      #    reads healthy, so the two arms above would paint it 🚫 — a claim about
      #    a live-but-stuck crew, over a pane whose claude is dead. the glyph is
      #    what a supervisor scans, so a wrong one here mis-sorts the whole row.
      [[ "${HEALABLE_AXIS[$__ct]:-}" == "revive" ]] && __hg="💀"
      # the wedge axis is the one that needs a FLAG. every other axis is cured
      # by the default `--what all`, so a flat line would be right for them and
      # silently inert for this one.
      if [[ "${HEALABLE_AXIS[$__ct]:-}" == "mode" ]]; then
        # 🔴 the glyph is its OWN, because its status is the one that reads
        #   healthy. 🚫/💀/🧊 would each be a lie here — the clone IS at work,
        #   and it stops at a modal on every file write it makes.
        echo "   ├─ 🎛️ $__ct — rhx git.crew.heal --tree $__ct --who mechanic --what mode --mode apply"
        echo "   │     ├─ MODE LOST — it dropped --permission-mode acceptEdits. a --keys 1 clears ONE write; the next one draws another modal"
        # 🔴 .the ORDER decides the outcome, and it is the one fact a
        #   supervisor cannot derive from the row above. the cure READS the
        #   modal: the `shift+tab` affordance that restores acceptEdits is
        #   option 2 OF THE MODAL ITSELF. answer the prompt first and the
        #   evidence is consumed, so heal reports `the mode is intact — no
        #   acceptEdits offer on this pane` — TRUE about the pane, false about
        #   the clone (term=false-report).
        #
        # 🔴 .measured 2026-09-20 — rhachet-roles-bhrain.beav.feat-acceptance-
        #   under-5min, a ⭐ sponsored star, BOTH orders in one tick:
        #     answer → heal   = `mode is intact`, MODE LOST recurs on next write
        #     heal   → answer = `acceptEdits restored`, the loop broke
        #   the tick contract says "on a 🚧prompt, answer it" AND "run each
        #   emitted heal line verbatim". a row that is BOTH carried no stated
        #   order, so the two steps raced and the modal answer won
        #   (rule.forbid.remedies-that-mimic-the-defect).
        #
        # ✅ .and it is SAFE, never merely effective: the cure DECLINES the
        #   unresolved write and restores the mode the crew was BOOTED with.
        #   it grants naught a human did not already grant at boot
        #   (rule.forbid.self-grant-human-gates).
        echo "   │     └─ 🔴 run THIS before you answer the modal — the cure reads that prompt to find the shift+tab offer, and it DECLINES the write rather than grant it"
      elif [[ "${HEALABLE_AXIS[$__ct]:-}" == "wedge" ]]; then
        # 🔴 it carries --mode apply, and the sub-line no longer says "never a
        #   cure" — corrected 2026-09-18, the same tick the cure landed.
        #
        #   the wedge axis WAS probe-only, and this pair described it honestly.
        #   then heal's rc-4 arm gained the parked-clone nudge, so `--what wedge
        #   --mode apply` cures a clone that was restored and never told to go.
        #   the emitted line kept its plan-only form, and its sub-line still
        #   read "a PROBE, never a cure" — so a supervisor under the babysit
        #   contract ("run each emitted line verbatim") got a plan, read the
        #   sub-line, and believed no cure existed. that is the poll one rung
        #   short of the cure heal owns — rule.require.poll-recommends-every-
        #   cure-heal-has, and a `term=false-report` about the tool's own reach.
        #
        # ⚠️ the probe half is UNCHANGED and still the common outcome: a clone
        #   that MOVED between the two reads (rc 5) earns no nudge, and one
        #   mid-turn is left alone. apply acts only where the probe already
        #   proved live-box + no-active-frame, on a crew screened `frozen`.
        echo "   ├─ $__hg $__ct — rhx git.crew.heal --tree $__ct --who mechanic --what wedge --mode apply"
        echo "   │     └─ two reads with a repaint between. a clone that MOVED is left alone; one PARKED — live box, no active frame — is nudged to continue"
      else
        echo "   ├─ $__hg $__ct — rhx git.crew.heal --tree $__ct --who mechanic --mode apply"
      fi
    done
    # 🔴 the set is FLEET-scoped and UNRANKED — say so, or it reads as ordered.
    #
    # .why = the scope is correct and deliberate (see the STAR decision at the
    #   head of this file: a limited tree, or one at merge, is often unsponsored
    #   by the time it closes, so the heal sweep widens on purpose). what is
    #   ABSENT is the ⭐ mark per row — this view never reads the sponsored set
    #   at all, because that read is gated on `STAR == true` and --healable
    #   turns STAR off. so the rows arrive in tree-name order with no signal of
    #   which are funded.
    #
    # 🔴 .the harm, measured 2026-09-20 — a supervisor healed in PRINT order.
    #   the set held 4: two unsponsored trees sorted above the one ⭐ star, and
    #   the star was healed third. the human caught it: "you know this one is
    #   sponsored, right?" / "and we heal sponsored crews first?"
    #
    #   ⇒ an unranked list is read as a ranked one. that is the whole defect,
    #     and it costs the funded work first every time
    #     (rule.always.read-stars-as-sponsored-priorities).
    #
    # ⚠️ this line is the INTERIM. the cure is a ⭐ per row plus a sponsored-first
    #   sort, which needs the star-set READ split from the star-set FILTER — a
    #   block whose halt paths hand back fell commands for funded work if it
    #   goes wrong. caught rather than guessed at:
    #   .dream/2026_09_20.the-heal-set-is-unranked-against-sponsorship.dream.md
    # 🔴 .N capped rows, ONE cure — collapse the RENDER, never the SET
    #
    # .why the per-tree line is wrong for THIS axis alone
    #   every other heal axis is a per-PANE fact: a husk, a wedge, a lost mode,
    #   an undrained queue. each takes its own command because each names its
    #   own pane. a usage cap is not a pane fact at all — it is an ACCOUNT
    #   fact, so every capped crew on a grove shares ONE cap and ONE cure.
    #   heal states that in every one of the N identical verdicts it returns:
    #     "HEALABLE via auth.swap (unblocks now; global + hot,
    #      one swap heals the grove)"
    #
    # 🔴 .the cost the loop imposes, and who pays it
    #   the babysit contract says "run each emitted heal line VERBATIM" — the
    #   right default, and against this axis it buys N ssh round-trips for ONE
    #   fact. worse, the fact is a HUMAN gate: the swap needs a sign-in to an
    #   uncapped account, so no number of calls could have cured a row
    #   (rule.forbid.self-grant-human-gates). ⇒ the loop is pure waste, and
    #   `rule.require.bulk-over-byhand` already grades a loop a blocker.
    #
    # 🔴 .measured 2026-09-20 — 13 healable, 12 of them `limited`, every one
    #   reset at the same minute on one box. three probes — two sponsored, one
    #   not, so the read was not generalized off a sample that shares the trait
    #   that decides it — returned byte-identical verdicts and one cure.
    #
    # ✅ .the bound — the ROWS stay
    #   each capped tree keeps its own line above: a supervisor must still see
    #   WHICH trees are held, and an unsponsored one may be felled rather than
    #   waited out. what this adds is that the N rows share ONE remedy.
    # 🔴 the axis word is `nudge`, NOT `limited` — crewwork.sh:1676 reads
    #     [[ "$status" == "limited" ]] && { printf 'nudge\n'; return 0; }
    #   so the STATUS is `limited` and the AXIS it maps to is `nudge`, and
    #   `nudge` is the only arm that status can reach. to key this on the
    #   status word compiles, renders no banner, and fails silently — caught
    #   2026-09-20 by a prod run after a GREEN clamp, which is the whole
    #   reason `rule.always.capture-clamp-then-verify-in-prod` exists.
    # 🔴 .the CLOCK rides up with the count — it is what ranks the two options
    #   this banner offers a swap OR a wait, and only the distance to the reset
    #   sorts them: a swap costs a human a sign-in, a wait costs naught. with the
    #   clock dropped the banner reads the SAME at 4 minutes out and at 11 hours
    #   out, so a supervisor cannot weigh it and defaults to the human ask.
    #
    # 🔴 .measured 2026-09-20 — it cost a real misrank
    #   a tick surfaced the human-only swap as the fleet's #1 item against 12
    #   held crews. the reset was FOUR MINUTES away. the per-row lines already
    #   carry `· resets HH:MMxm (UTC)` (see the __cap_ann arm above), so the
    #   datum was derived and then dropped on the way up — the same shape this
    #   collapse was written to cure, one level higher (term=partial-audit).
    #
    # ⚠️ re-derived here, never inherited from the row loop. `__cap_reset` above
    #   is a loop-local that holds whatever the LAST row left in it, so to read
    #   it here would be right by accident and wrong the moment a non-capped row
    #   sorts last.
    # 🔴 .and the CLOCK decides the OWNER, so it is read, never merely printed
    #   `limited` maps to axis `nudge` on both sides of the reset, so this arm
    #   fires for a live cap and a stale one alike. the cure does not survive
    #   that flip, and neither does who owns it:
    #
    #     LIVE  → a nudge earns a fresh cap banner. the one real cure is an auth
    #             swap = credential provision = a HUMAN's, per
    #             rule.forbid.self-grant-human-gates
    #     STALE → every row is nudgeable now. the N heal lines above are each a
    #             true cure, and the DRIVER owns every one of them
    #
    # 🔴 .unsplit, it is a MISROUTE rather than a slip of phrase
    #   it reads `do NOT run N heals` and hands up a human-only command at the
    #   exact moment those N heals are correct and no human is owed — a fleet
    #   parked on a gate nobody needs to open
    #   (rule.always.spend-own-levers-before-escalation).
    #   measured 2026-09-20: 13 rows crossed their reset mid-tick and this
    #   banner did not move, while the per-row lines above it had already
    #   flipped to `⏰ reset PASSED`.
    __cap_n=0
    __cap_grove=""
    __cap_reset_at=""
    __cap_all_stale=1
    for __ct in "${HEALABLE_TREES[@]}"; do
      [[ "${HEALABLE_AXIS[$__ct]:-}" == "nudge" ]] || continue
      __cap_n=$(( __cap_n + 1 ))
      [[ -z "$__cap_grove" ]] && __cap_grove="${CREW_HOST[$__ct]:-}"
      __cap_c="${CREW_CAP[$(__crew_canon "$__ct")]:-}"
      __cap_c="${__cap_c%%$'\n'*}"; __cap_c="${__cap_c#*=}"
      # fail CLOSED on the owner: a row whose clock will not parse counts as
      # LIVE, so an unreadable cap never downgrades a human gate to a nudge
      __crew_cap_reset_passed "$__cap_c" || __cap_all_stale=""
      if [[ -z "$__cap_reset_at" && "$__cap_c" == *resets* ]]; then
        __cap_reset_at="${__cap_c#*resets }"
        __cap_reset_at="${__cap_reset_at%\"}"
      fi
    done
    if (( __cap_n > 1 )); then
      __cap_uri="cloud://${__cap_grove}"
      [[ -z "$__cap_grove" ]] && __cap_uri="local"
      if [[ -n "$__cap_all_stale" ]]; then
        echo "   ├─ ⏰ ${__cap_n} rows above share ONE cap on ${__cap_uri}, and its reset PASSED — every"
        echo "   │     one is nudgeable NOW, so DO run the ${__cap_n} heal lines above, each a true cure"
        echo "   │     ✅ no human is owed here: a stale cap needs no swap. the nudges are YOURS"
      else
        echo "   ├─ 🚫 ${__cap_n} rows above share ONE live cap on ${__cap_uri} — ONE swap heals every one of them,"
        echo "   │     so do NOT run ${__cap_n} heals: each would print this same verdict and cure naught"
        echo "   │     🙋 and the swap is HUMAN-only — it needs a sign-in to an UNCAPPED account:"
        echo "   │     rhx git.grove.auth ${__cap_uri} --brain claude --mech oauth"
        if [[ -n "$__cap_reset_at" ]]; then
          echo "   │     ⏳ or leave them — the cap resets ${__cap_reset_at}. rank the two by that clock:"
          echo "   │        a swap costs a human a sign-in; a reset near at hand costs naught"
        else
          # fail OPEN about the gap, never silent: a missed clock must read as
          # absent evidence, or the wait option looks weighed when it was not
          echo "   │     ⏳ or leave them — but the reset clock did NOT parse from the pane, so this"
          echo "   │        banner cannot rank the two. read a row above for its own · resets line"
        fi
        echo "   │     ⚠️ a swap applies only to a sponsored tree"
      fi
    fi
    echo "   ├─ ⭐ this set is FLEET-scoped and UNRANKED — no row here carries a sponsorship mark,"
    echo "   │     so print order is tree-name order, never priority. heal the FUNDED rows first:"
    echo "   │     rhx git.crew.poll --star    # the ⭐ set, to cross against the rows above"
  else
    echo "🦫 no tree to heal right now — none limited by a transient 429 or a cap, none a husk, none frozen$(__crew_unreached_caveat "$UNREACHED_N" "$RETIRED_N")"
  fi

  # 🔴 the ORPHAN set rides on `--healable` too — it is NOT a peer of the heal
  #    set, it is a MEMBER of the actionable set this flag promises to derive
  #
  #    a crew with no clone on a dirty tree is not healable BY CONSTRUCTION:
  #    heal works on a PANE, and an orphan has no pane to work on
  #    (crewwork.sh:1592). so it can never enter HEALABLE_TREES however the heal
  #    classifier is widened — the blindness is structural, exactly as the
  #    council's was to the plea.
  #
  # 🔴 .and it has its OWN runnable cure, which is what makes the omission cost
  #    real work rather than merely read thin: `rhx git.crew.boot --tree <t>`.
  #    the dense footer 1000 lines below already emits that line per tree. this
  #    path exits at the `exit 0` beneath, ABOVE that footer, so the one flag the
  #    babysit contract mandates, to derive the actionable set, was the one view
  #    that could not show it.
  #
  #    measured 2026-09-19: 5 crews sat frozen-with-no-duct while `--healable`
  #    printed `no tree to heal right now` — and `--all --healable` printed the
  #    same, which REFUTED the star-scope guess and left the render as the only
  #    cause that survived. the bare poll was never the defect; this exit was.
  #
  # ⚠️ .it fires on BOTH arms, and the EMPTY arm is the one that matters
  #    `no tree to heal right now` beside live orphaned work is a term=false-report
  #    in the direction that reads safe — true about the heal set, false about
  #    whether a tick owes an act. so the orphan block must survive the empty
  #    verdict, never ride only beside a non-empty one.
  #
  # .why it prints the COUNT row and the per-tree rows both, and in that order:
  #    the split the dense footer states at [case49] — the count answers HOW MANY
  #    and WHY it matters, the rows name the subjects, and a reader cannot act on
  #    either alone.
  if (( ORPHANED > 0 )); then
    echo ""
    echo "⚠️  $ORPHANED WORK ORPHANED — a crew with no clone, on a dirty tree. NOT healable (heal works on a pane; there is none), so this set is owed a BOOT:"
    while IFS= read -r __hw; do
      [[ -n "$__hw" ]] || continue
      echo "   ├─ $__hw"
      echo "   │     rhx git.crew.boot --tree $__hw"
    done <<< "$ORPHANED_WHO"
  fi

  __crew_unreached_guide "$UNREACHED_N" "$UNREACHED_GROVE" "$RETIRED_N"
  exit 0
fi
}
