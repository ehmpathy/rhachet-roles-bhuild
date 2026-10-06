#!/usr/bin/env bash
######################################################################
# pollwork.rows — one block per crew, in stable order, and the tallies behind them
#
# 🔴 .a PART of pollwork.sh — sourced, never executed, and only BY pollwork.sh.
#     git.crew.poll.sh sources pollwork.sh, which loads every part. see
#     __poll_load_parts there for why the poll is cut into parts at all.
#
# .holds = the __poll_render_rows stage
######################################################################

######################################################################
# print, in stable order
######################################################################

######################################################################
# __poll_render_rows — print, in stable order
######################################################################
#
# .note = the body is the poll's own top-level code, moved VERBATIM and left
#         unindented, so `git diff --color-moved` and `git blame -C` trace
#         every line to its origin. a `declare` here carries `-g`: at top
#         level it was global, and a stage that shares its maps with the
#         stages after it must keep them so.
__poll_render_rows() {
declare -gA TALLY=()
declare -gA CREWTALLY=()
ROWS=0
ORPHANED=0
# 🔴 the ORPHANED trees, BY NAME — the arrear this file recorded three times
#
#   the count above shipped alone, and three separate comments in this very file
#   grade that as the defect: the FAILED_TREES collector below calls it "the
#   identical defect this file records at the orphan row", the `--live` exemption
#   records "a `--live` run reported `⚠️ 3 WORK ORPHANED` and named not ONE of
#   them", and the no-clone fold records "footer read `7 WORK ORPHANED`, exactly
#   1 row named it".
#
#   ⚠️ two filter EXEMPTIONS were added on the strength of those notes, so an
#   orphan ROW survives `--live` and the fold. neither reached the FOOTER, which
#   is the surface a babysit tick actually acts from — so the arrear was
#   half-paid and read as paid, and the footer stayed anonymous for five days.
#
#   measured 2026-09-18: `⚠️  5 WORK ORPHANED`, five trees that hold uncommitted
#   work, and no way to learn which five but a second wider sweep read by eye —
#   the exact habit rule.always.poll-the-fell-and-heal-sets forbids.
#
# .why newline-joined rather than an array: it mirrors STONE_CLIPPED_WHO, the
#   nearest peer in this file, and the footer walks it with the same read loop.
# ⇒ clamped at [case49] in work/work.surface.rows.integration.test.ts
ORPHANED_WHO=""
# the FAILED trees, by name. a count alone sends the reader back for a second,
# wider sweep to learn which tree it named — the defect this file already
# records at the orphan row, unapplied to this bucket until 2026-09-05
FAILED_TREES=()
# the FELLABLE trees, by name — merged and clean. same reason as above, and a
# sharper one: `git.crew.fell --tree <tree>` cannot be run without the name, so
# the cure line was a placeholder the reader had to go fill in elsewhere
#
# 🔴 .no grove map rides beside this set — the EMIT no longer carries one
#   this view emitted `git.tree.del --name <t> --grove <g>` for its whole life,
#   and kept a per-tree grove map to feed that flag. `git.tree.del` is the HALF
#   that removes the worktree and leaves the crew on the books, so the ledger
#   row survived every fell run off this render — and the next poll read that
#   orphaned row as `💀 NO DUCT` and recommended a `crew.boot` onto a worktree
#   that was gone.
#
#   `git.crew.fell` is the whole verb: it delegates the tree to `git.tree.del`
#   and drops the ledger row on top, and it DERIVES the grove from the ledger
#   itself (`__crew_ledger_grove_of`). so the wrong-box hazard the map existed
#   to close is now closed by construction rather than by an appended flag, and
#   the caller can no longer pass a grove that disagrees with the record.
FELLABLE_TREES=()
# the merged trees whose dirt is TOOL STATE alone — fenced from the fell by
# the same gate, but by dirt a re-run restores rather than by work. named for
# the same reason the fellable set is: a fenced tree owes its name and a
# runnable cure, never a bare count.
DIRTY_TOOL_TREES=()
# 🔴 the merged-and-clean trees the LIVE-CLONE fence held back, BY NAME — and
#   the name is the whole point of this array, task #37.
#
#   the excluded count was a bare subtraction (`CLEAN - ${#FELLABLE_TREES[@]}`),
#   so every name was discarded and both emit sites printed the literal
#   `--tree <tree>`. that is the identical defect the comment 300 lines below
#   grades "the defect at its sharpest" for the fell list itself — committed one
#   line under it, for the fenced list, by the same hand.
#
#   ⇒ a fenced tree owes a name and a runnable read, exactly as a fellable one
#     owes a name and a runnable fell (`rule.require.poll-recommends-every-cure-
#     heal-has`). a reader handed `<tree>` must re-derive the subject from a
#     40-row census to run the one command the row recommends.
LIVE_FENCED_TREES=()
# the ON-GROVE trees, by name — the subject set `--fellable` declines to read.
# named rather than merely counted, so its guide can hand over a real command.
ONGROVE_TREES=()
# the DOWN crews, by name. the footer's cure is `git.crew.boot --tree <tree>`,
# which cannot run without one — and the row is often CUT, so this array is the
# only path by which the name survives to the footer.
DOWN_TREES=()
# the PHANTOM crews, by name. a phantom is a felled tree's stale registry rows,
# and its cure is `git.crew.fell --tree <tree>` — the one verb that drops the
# row. it needs the name, exactly as the down cure does.
#
# 🔴 .measured 2026-09-17: `👻 phantom` was the ONE state the footer named with
#   no runnable line at all — `💀 down` emitted a boot, the merged set emitted a
#   fell per tree, and phantom emitted prose. so the only way to act on a
#   phantom was to copy a tree name off the render by eye, which is the exact
#   move `rule.always.poll-the-fell-and-heal-sets` grades a blocker. the tool
#   made its own mandate unfollowable.
#
# ⚠️ a phantom is LOCAL by construction — the arm that sets it requires
#   `-z "$crew_host"` — so the cure carries no `--grove`, and must not.
PHANTOM_TREES=()
# the HEALABLE trees, by name — a `limited` crew whose cure is a NUDGE (a
# transient 429, or a stale cap whose reset PASSED). same reason as FELLABLE:
# `git.crew.heal --tree <tree>` needs the name, and a supervisor heals the set
# in bulk through the tool, never a hand-copied list (rule.require.bulk-over-byhand).
HEALABLE_TREES=()
# the per-tree cure status, keyed by tree name. a healable tree cures by one of two
# axes: a `limited` crew by a NUDGE, a `husk` crew by a REVIVE. the render reads this
# to print a truthful glyph (🚫 limited / 💀 husk) beside each heal command.
declare -gA HEALABLE_STATUS=()
# the per-tree heal AXIS, keyed by tree name — `revive` | `nudge` | `relay` |
# `wedge`. the status alone cannot pick the command: two crews both `frozen`
# take different heal calls, and the wedge one is opt-in (`--what wedge`), never
# reached by the default. __crew_heal_axis (crewwork.sh) is the pure decision.
declare -gA HEALABLE_AXIS=()
# the idle-prune counters. they exist so the footer can DECLARE what folded —
# a prune nobody reports is a clipped sweep with better manners
# (rule.forbid.clipped-sweeps)
HIDDEN_IDLE=0
HIDDEN_NOCLONE=0
declare -gA STATUS_TALLY=()

# gathered AFTER the tree reads and BEFORE the render, so the one extra
# call runs once per sweep rather than once per row
[[ "$BOXES" == "true" ]] && __crew_gather_boxes

# ── prune the footer aggregate maps to the RENDERED scope ────────────────────
#
# .why  __crew_gather_boxes (just above) fills the CREW_* maps from the FULL
#   duct sweep. the per-tree render below honors TREES, but the footer tallies
#   (stones, box states, ESCALATION, CONTEXT LOW, PLEA SEEN, BOX UNMOVED, CLONE
#   QUIET) iterate the maps directly by `${!MAP[@]}` — so without this prune a
#   scoped poll renders a scoped body over a whole-fleet footer. that is the
#   clipped-sweep defect turned inside out: it reports crews the scope EXCLUDED
#   (rule.forbid.clipped-sweeps). prune every footer-iterated map to the kept
#   keys once, here — after gather populates them, before any read of them —
#   and every footer loop honors the scope with no per-loop edit.
#
# 🔴 .the gate is keyed on TREES, never on a FLAG — measured 2026-09-15.
#   it read `$STAR == true && $BOXES == true`, so `--only <tree> --all` (which
#   narrows TREES but leaves STAR false) pruned not one map: a ONE-tree body
#   followed by ~23 ACTIONS rows about 12 trees the human had just excluded.
#   ⇒ `TREES` IS the rendered set, so a prune keyed on it is correct for star
#   scope, for `--only`, for both together, and for any scope flag added later
#   with no edit here. a full-fleet poll prunes to the full fleet — a no-op.
#
# ⚠️ .the mismatch was HALF-correct, which is why it survived: the `🚦 status`
#   line honored the scope while the ACTIONS footer did not, so a reader who
#   checked one and trusted the other found no seam.
#
# 🟡 .the arrear NAMED, not smuggled: `--live` filters per-row INSIDE the body
#   loop below (a `continue` on crew_state), so TREES still holds the trees it
#   skips and the footer can still speak about them. the repair moves that
#   filter up into TREES, which ripples into the render loop — deferred rather
#   than half-done here (rule.always.fix-forward-under-scouts-honor).
#
#   the keys are canon-dotted (__crew_canon); TREES holds the same canon form,
#   so a kept-set keyed by TREES matches map keys exactly. each loop is guarded
#   by a count so an empty map never trips `set -u` on key-expansion.
if [[ "$BOXES" == "true" ]]; then
  declare -gA __kept_tree=()
  for t in "${TREES[@]}"; do __kept_tree["$t"]=1; done
  if (( ${#CREW_STONES[@]} ));     then for __k in "${!CREW_STONES[@]}";     do [[ -v __kept_tree["$__k"] ]] || unset 'CREW_STONES[$__k]';     done; fi
  if (( ${#CREW_BOXES[@]} ));      then for __k in "${!CREW_BOXES[@]}";      do [[ -v __kept_tree["$__k"] ]] || unset 'CREW_BOXES[$__k]';      done; fi
  if (( ${#CREW_MOTION[@]} ));     then for __k in "${!CREW_MOTION[@]}";     do [[ -v __kept_tree["$__k"] ]] || unset 'CREW_MOTION[$__k]';     done; fi
  if (( ${#CREW_PLEA[@]} ));       then for __k in "${!CREW_PLEA[@]}";       do [[ -v __kept_tree["$__k"] ]] || unset 'CREW_PLEA[$__k]';       done; fi
  if (( ${#CREW_COUNCILASK[@]} )); then for __k in "${!CREW_COUNCILASK[@]}"; do [[ -v __kept_tree["$__k"] ]] || unset 'CREW_COUNCILASK[$__k]'; done; fi
  if (( ${#CREW_FELLREADY[@]} ));  then for __k in "${!CREW_FELLREADY[@]}";  do [[ -v __kept_tree["$__k"] ]] || unset 'CREW_FELLREADY[$__k]';  done; fi
  if (( ${#CREW_ARRIVEFAIL[@]} )); then for __k in "${!CREW_ARRIVEFAIL[@]}"; do [[ -v __kept_tree["$__k"] ]] || unset 'CREW_ARRIVEFAIL[$__k]'; done; fi
  if (( ${#CREW_ESCALATION[@]} )); then for __k in "${!CREW_ESCALATION[@]}"; do [[ -v __kept_tree["$__k"] ]] || unset 'CREW_ESCALATION[$__k]'; done; fi
  if (( ${#CREW_COMPACT[@]} ));    then for __k in "${!CREW_COMPACT[@]}";    do [[ -v __kept_tree["$__k"] ]] || unset 'CREW_COMPACT[$__k]';    done; fi
  if (( ${#CREW_TURNENDED[@]} ));  then for __k in "${!CREW_TURNENDED[@]}";  do [[ -v __kept_tree["$__k"] ]] || unset 'CREW_TURNENDED[$__k]';  done; fi
  if (( ${#CREW_DECLINED[@]} ));   then for __k in "${!CREW_DECLINED[@]}";   do [[ -v __kept_tree["$__k"] ]] || unset 'CREW_DECLINED[$__k]';   done; fi
  if (( ${#CREW_QUEUEDROW[@]} ));  then for __k in "${!CREW_QUEUEDROW[@]}";  do [[ -v __kept_tree["$__k"] ]] || unset 'CREW_QUEUEDROW[$__k]';  done; fi
  # 🟡 .CREW_CAP and CREW_RATELIMIT are absent above on purpose, and it is NOT
  #   an arrear: both are read by per-tree key lookup from INSIDE the body loop
  #   (`${CREW_CAP[$(__crew_canon "$tree")]}`), so they are scoped by
  #   construction and a prune would buy naught.
  #
  #   ⚠️ this comment once claimed both "iterate the footer" — named off memory
  #   rather than off the iteration sites, which would have sent the next
  #   reader to prune two maps that need no prune
  #   (rule.require.enumerate-before-you-name). the set is DERIVED in
  #   crewwork [case26] t1, so a map added to the footer with no prune entry
  #   reddens that clamp rather than sitting unnoticed here.
fi

for tree in "${TREES[@]}"; do
  row="$(cat "$WORK/$(printf '%s' "$tree" | tr '/' '_').row" 2>/dev/null)"
  [[ -n "$row" ]] || row="$(printf '%s\t💥\tunknown\tno record emitted\t-' "$tree")"
  IFS=$'\t' read -r t glyph verdict detail ref <<< "$row"

  # ── the CREW half ────────────────────────────────────────────────
  # read from tmux, which is the ONLY source that proves a crew is at
  # work. a registry row proves it once WAS; a worktree proves only that
  # a crew could be booted onto it
  # .why `😶` and not `👥`
  #   `👥` is busts-in-silhouette — it says HUMANS. a crew is a set of CLONES,
  #   and rhachet already fixed `😶` as the org-wide clone domain-root: a
  #   mouthless face the roles give a voice (its etymology is written up at
  #   rhachet's own `choice.clone-glyph.md`). so `👥` was a second glyph for a
  #   concept that already had one — synonym drift at the emoji layer, which
  #   `rule.require.ubiqlang` forbids and `rule.prefer.emoji-language` calls
  #   out by name as a cross-vocabulary borrow.
  #
  #   plurality is no objection: the row already names the roles beside it, and
  #   rhachet's own list header is `😶 clones` — singular glyph, plural noun.
  crew_glyph="💀"; crew_state="down"; crew_who="no live duct — rhx git.crew.boot"
  crew_host="${CREW_HOST[$(__crew_canon "$tree")]:-}"
  if [[ -n "${CREW_ROLES[$tree]:-}" ]]; then
    crew_glyph="😶"; crew_state="at work"
    crew_who="$(printf '%s\n' ${CREW_ROLES[$tree]} | sort -u | tr '\n' ' ')"
    crew_who="${crew_who% }"
  elif __crew_host_unreached "$crew_host"; then
    # 🔴 we did not LOOK. every other verdict on this axis is a claim about
    #    the crew; this one is a claim about the read, and it is the only
    #    honest thing to say of a box that answered nought.
    #
    #    it sits ABOVE `down` on purpose. an unreached grove yields an empty
    #    session list, which is byte-identical to a grove holding no crew —
    #    so with no arm here every crew on a hibernated grove renders `down`,
    #    and `down` promises a `crew.boot` that would fail on a box that is
    #    not up. the cure is one step earlier: wake it, THEN judge it.
    crew_glyph="😴"; crew_state="asleep"
    crew_who="grove did not answer — rhx git.grove.wake $crew_host"
  elif [[ -z "$crew_host" && "$verdict" == "unknown" && "$detail" == *"no worktree"* ]]; then
    # no duct, no tree — the rows are litter a fell left behind
    #
    # ⚠️ `-z "$crew_host"` is load-bearing, and it is the whole repair. every
    #    read that produces `no worktree` is LOCAL, so this verdict may only
    #    be drawn about a crew that lives HERE. asserted over a cloud crew it
    #    said `tree is gone` about a grove nobody asked — measured, awake,
    #    with the worktree present (term=phantom, term=false-report).
    crew_glyph="👻"; crew_state="phantom"; crew_who="stale registry rows, tree is gone"
  fi

  ROWS=$((ROWS + 1))
  TALLY["$verdict"]=$(( ${TALLY[$verdict]:-0} + 1 ))
  CREWTALLY["$crew_state"]=$(( ${CREWTALLY[$crew_state]:-0} + 1 ))

  # 🔴 the ON-GROVE trees are NAMED, not merely counted — task #35
  #
  # .why = `--fellable` closes an empty verdict with a guide that reads
  #   "read its pane, or ask its foreman". every PEER guide on this view hands
  #   over a runnable line — the unreached guide emits `rhx git.grove.wake
  #   <grove>` with a real grove in it. this one emitted prose, over a subject
  #   set of 24 trees it never named, so a reader had to compose the command
  #   AND guess the tree.
  #
  #   .measured 2026-09-17: `…feat-dispute-or-concede-review-budget` shipped to
  #   prod (PR #511 merged, v0.36.0 published) while this view read `no tree to
  #   fell — 16 of 40 read, none merged`. the caveat named the omission
  #   correctly and handed over no way to close it, so the fell candidate was
  #   found by a hand-composed read rather than by the tool
  #   (`rule.require.poll-recommends-every-cure-heal-has`).
  #
  # ⚠️ the count stays TALLY-derived and is NOT recomputed from this array.
  #   two counts of one set in one report is the defect the unreached caveat
  #   already records; the array exists to NAME, never to re-tally.
  [[ "$verdict" == "on grove" ]] && ONGROVE_TREES+=("$tree")

  # 🔴 the DOWN crews are NAMED, not merely counted — task #37
  #
  # .why = the footer emits `💀 $DOWN down — rhx git.crew.boot --tree <tree>`,
  #   a placeholder the reader has to go fill in elsewhere. task #33 graded
  #   exactly this shape on the fell list — "this view exists to NAME the
  #   list, so a `<tree>` placeholder here is the defect at its sharpest" —
  #   and the down footer kept it.
  #
  # 🔴 .and here the row is CUT, so no path through this view names it
  #   the HIDDEN_NOCLONE fold below drops a cloneless crew's row entirely.
  #   the comment there records the same defect for ORPHANED and exempts
  #   orphans (`-z "$orphaned"`) — a plain `down` crew was never exempted,
  #   so it is counted, then cut, and its cure is a placeholder. three
  #   independent ways to lose the name, and the reader meets a bare count.
  #
  #   .measured 2026-09-17: a bare star poll read `5 crew(s) — 4 at work,
  #   1 down`, rendered 4 rows, and closed with `💀 1 down — rhx
  #   git.crew.boot --tree <tree>`. `--all` was the only way to learn which
  #   (term=partial-audit — the count survives the filter, the subject does
  #   not; `rule.require.poll-recommends-every-cure-heal-has`).
  #
  # ⚠️ appended HERE, at the tally chokepoint, so it is filled BEFORE any
  #   filter or fold can drop the row. a name collected after the cut is a
  #   name the cut already took.
  [[ "$crew_state" == "down" ]] && DOWN_TREES+=("$tree")
  # the same chokepoint, for the same reason — a phantom row is subject to the
  # identical folds, so a name gathered later is a name a fold already took.
  [[ "$crew_state" == "phantom" ]] && PHANTOM_TREES+=("$tree")

  # a MERGED tree that is dirty is NOT fellable — git.tree.del's safety
  # gate refuses uncommitted work. count the two apart, or the summary
  # promises a fell the fell itself will refuse
  if [[ "$verdict" == "merged" && "$detail" == *"✋ dirty"* ]]; then
    TALLY[merged-dirty]=$(( ${TALLY[merged-dirty]:-0} + 1 ))
    # 🔴 and count the TOOL-STATE half apart from the work half — they take
    #   different acts. work needs a commit or a human's call; tool state is
    #   a cache a re-run restores, so one `--stash --why` closes it. a single
    #   count fuses "someone must decide" with "one command, no loss", and a
    #   reader who meets the fused number reaches for the slower of the two.
    #
    #   .measured 2026-09-17: one tree sat merged-and-dirty for two ticks on
    #   ` M .radio` alone, and the fused line read the same as it would for
    #   seven uncommitted source files.
    [[ "$detail" == *"tool state only"* ]] \
      && TALLY[merged-dirty-tool]=$(( ${TALLY[merged-dirty-tool]:-0} + 1 ))
  fi

  # the loudest row in the fleet: work exists, and nobody is on it. no
  # prior instrument reported this — crew.list sees only the live, and
  # release.poll derived from crews, so it went blind on exactly these
  # .why this tests the VERDICT as well as the detail marker
  #   `✋ dirty` is a SUFFIX the tree renderer appends — and it appends it to
  #   every verdict but one. the `in flight` branch omits it deliberately, because
  #   that verdict ALREADY means uncommitted work ("work uncommitted, no commit
  #   yet"), so the suffix would read as redundant.
  #
  #   the two facts together are a trap: `in flight` is emitted ONLY from inside
  #   `if [[ -n "$dirty" ]]`, so it is dirty BY CONSTRUCTION — the one verdict that
  #   cannot exist without work on disk — and it was the one verdict this gate
  #   could not see. so the loudest row in the fleet went silent over exactly the
  #   subset most certain to qualify.
  #
  #   measured 2026-08-31: 9 down crews, every one on an `in flight` tree,
  #   `ORPHANED=0`, and not one alarm rendered.
  #
  #   ⚠️ the general form, and it is why the fix keys on MEANING rather than on a
  #   marker: a reader that keys on a STRING ITS SOURCE RENDERS is a reader that
  #   source breaks whenever it re-words — silently, and into the direction that
  #   reads as safe. same species as the `--boxes` join's two breaks (see below).
  # .why the gate keys on the CLONE, never on the duct
  #
  #   `down` means "no live duct". that was taken as the whole of "no crew at
  #   work", and it is not. a duct OUTLIVES its clone: claude exits, or was
  #   never launched, and the shell it sat in stays up. the poll already sees
  #   this — the box classifier renders `mechanic:shell` — but the gate read
  #   only `crew_state`, so the crew rendered `at work` and its work went
  #   uncounted.
  #
  #   measured 2026-09-03: `rhachet.beav.fix-keyrack-daemon-orphan` and
  #   `rhachet.beav.fix-test-tempdir-leak` — both `mechanic:shell`, both still
  #   325m, both on a dirty tree, and NEITHER in `⚠️ 9 WORK ORPHANED`. the
  #   tally undercounted by 2, in the direction that reads safe.
  #
  #   d1 — did the tool fail? no: exit 0, a verdict rendered. d2 — untrue? yes:
  #   `at work` of a crew with no clone. term=false-report, and a partial-audit
  #   besides — the gate chose `down` as its subject set, and the verdict
  #   carried no trace of what that excluded.
  #
  #   the FOREMAN is exempt by contract: a foreman is a bare shell by design,
  #   so only the mechanic's box can testify that a clone is absent.
  #
  #   `asleep` stays exempt too. an unreached grove is a claim about the READ,
  #   and to call it orphaned would be the very false report this arm repairs.
  #
  # ⚠️ two residuals, recorded rather than swept:
  #   1. the row still reads `crew: at work` beside `⚠️ WORK ORPHANED`. that is
  #      true of the DUCT and false of the crew. the honest repair is a
  #      crew_state of its own, which ripples into the header tally and the
  #      --live filter. the adjacent `mechanic:shell` token tells a reader why
  #      the marker fired, so the row is legible meanwhile.
  #   2. this arm needs CREW_BOXES, so a poll run WITHOUT --boxes/--stones
  #      falls back to the old, narrower count — a tally that varies by flag,
  #      silently. the babysit tick always passes --stones, so the sweep that
  #      matters is covered; a bare `git.crew.poll` is not.
  # .why the check reads EVERY non-foreman role, not just the mechanic
  #
  #   the elif below once fired on `mechanic:shell` alone. that missed a real
  #   crew shape: the mechanic sits at a bare shell while a REFLECTOR (or
  #   reviewer) holds a live conversation on that same tree — a clone is
  #   plainly present, doing work, and this arm called the crew orphaned
  #   anyway because it never looked past the one role it named.
  #
  #   measured 2026-09-13: `svc-reminders.beav.feat-declapract-upgrade`
  #   rendered `⚠️ WORK ORPHANED` while its reflector sat mid-PLEA, stone
  #   `3.2.reflect.test.defects, judge, approved? 👋` — a live clone, an
  #   active ask, and the fleet's loudest marker on it regardless.
  #
  #   the foreman stays exempt, per the comment above this arm: a bare shell
  #   by design, so its box proves naught either way.
  orphaned=""
  crew_cloneless=""
  if [[ "$crew_state" == "down" ]]; then
    crew_cloneless=1
  elif [[ "$crew_state" == "at work" && -n "${CREW_BOXES[$tree]:-}" ]]; then
    __ob_seen_nonforeman=""
    __ob_any_nonshell=""
    for __ob_rb in ${CREW_BOXES[$tree]}; do
      __ob_role="${__ob_rb%%:*}"
      __ob_box="${__ob_rb#*:}"
      [[ "$__ob_role" == "foreman" ]] && continue
      __ob_seen_nonforeman=1
      [[ "$__ob_box" == "shell" ]] || __ob_any_nonshell=1
    done
    if [[ -n "$__ob_seen_nonforeman" && -z "$__ob_any_nonshell" ]]; then
      crew_cloneless=1
    fi
  fi
  if [[ -n "$crew_cloneless" ]] \
     && [[ "$detail" == *"✋ dirty"* || "$verdict" == "in flight" ]]; then
    orphaned=" ⚠️ WORK ORPHANED"
    ORPHANED=$((ORPHANED + 1))
    # 🔴 the NAME is collected HERE, at the gate — above both filters
    #   the same argument the FAILED_TREES collector states directly below: a
    #   name gathered after a filter is a name that filter already took, and the
    #   two filters this row meets are precisely the two whose exemptions were
    #   earned by this defect. to collect below either would re-open it.
    # 🔴 and it is `$tree`, never DISPLAY[$tree] — DISPLAY holds tmux's
    #   underscored session name, which `--tree` resolves to no tree.
    ORPHANED_WHO+="$tree"$'\n'
  fi

  # .why a FAILED tree is collected BY NAME, and here — above both filters
  #   the tree tally renders `🌲 trees — 1 failed`, and a count with no subject
  #   is not actionable: the reader must re-run the sweep WIDER to learn which
  #   tree it meant. that is the identical defect this file records at the
  #   orphan row (see the `--live` exemption below) — recorded there, never
  #   applied here.
  #
  #   measured 2026-09-05. a tick read `🌲 trees — 1 failed, 14 in flight`,
  #   which was new and actionable, and the poll named no tree. the drill-in
  #   was a second `--all` sweep over 29 crews, read by eye, to find one row.
  #   the subject was `test-fns.beav.feat-tempdir-autoprune`, pr #67.
  #
  # ⚠️ .why it must sit ABOVE the filters, never below
  #   a failed tree whose crew has since gone down is MORE urgent, not less —
  #   ci failed and nobody is on it. to collect after the `--live` filter would
  #   drop exactly that row, and the babysit contract mandates `--live`
  #   (rule.require.babysit-cron-per-dispatch-fleet). same argument, same
  #   place, as the orphan exemption.
  # 🔴 .the name here is `$tree`, and NEVER `DISPLAY[$tree]`
  #   DISPLAY holds the raw tmux SESSION name (`a_b_c`), and `$tree` holds the
  #   canonical slug (`a.b.c`). every other line of this render — the crew row
  #   headers, the duct uris — carries the dotted slug, and `--tree` accepts
  #   only that form.
  #
  #   measured 2026-09-05, in this row's own first draft: it emitted
  #   `--tree test-fns_beav_feat-tempdir-autoprune`, which resolves to no tree.
  #   the row read plausibly and the command could not run — worse than a bare
  #   count, because a count admits it is not a cure (term=false-report).
  if [[ "$verdict" == "failed" ]]; then
    FAILED_TREES+=("$tree|$ref")
  fi

  # .why the FELLABLE list is collected on the SAME argument
  #   measured 2026-09-05, one tick after the failed-tree row landed: the footer
  #   read `👌 1 to fell — rhx git.tree.del --name <tree>` and named no tree.
  #
  # 🔴 and `--fellable` — the flag whose WHOLE PURPOSE is to render the fell
  #   list — printed that same placeholder in its own summary. so the dedicated
  #   view did not answer the question it exists to answer.
  #
  #   this cure is the stronger case of the two: `git.tree.del --name <tree>`
  #   cannot be RUN without the name, so the line was never a cure at all — it
  #   was a prompt to go find the name somewhere else.
  #
  # ⚠️ dirty is excluded here for the reason stated at the merged-dirty tally:
  #   the fell's own safety gate refuses uncommitted work, so to name a dirty
  #   tree here would promise a fell that will refuse.
  #
  # 🔴 .and a LIVE clone is excluded too — task #33, measured 2026-09-08
  #   `--fellable` named a tree `rhachet.beav.fix-node-pty-install` safe while
  #   its mechanic sat 2m42s into `rhx git.release --into prod --mode apply
  #   --watch`, spinner live, 40m timeout. the babysit contract pre-authorizes
  #   "fell what --fellable names" on a 🔴 saturation gate — so a supervisor
  #   who trusted the flag, as instructed, would have killed a prod release
  #   in flight.
  #
  #   the root cause: `verdict` reads git/PR state — a CORRELATE of "work
  #   complete" — never whether a clone is at work, which is the record
  #   (another instance of the correlate-vs-record law, task #22). a tree can
  #   merge on github while its own crew still holds the pane, mid-turn, on
  #   the release that merge enabled.
  #
  #   `crew_cloneless` is already computed just above, from the same box
  #   scan the orphan check uses, so this reuses it rather than re-derive:
  #   `at work` + NOT cloneless means a real claude session holds this tree,
  #   at work on real work, right now — never safe to fell regardless of
  #   what git says.
  # 🔴 .and `at work` is NOT `at work on real work, right now` — 2026-09-17
  #
  #   the paragraph above states that inference outright, and it does not
  #   follow. `at work` means a claude session EXISTS. a clone that delivered
  #   its final report twelve minutes ago and sits at an empty box satisfies
  #   it, and satisfies it forever after.
  #
  #   ⚠️ so the fence's own render — `wait for it to finish` — named a wait
  #   THAT NEVER ENDS. permanent, and worded as temporary, which is the worse
  #   of the two: a supervisor waits tick after tick rather than looks.
  #
  #   measured: `rhachet-brains-fireworksai.beav.fix-prompt-cache-affinity`
  #   carried that line for three consecutive ticks. the human read the pane
  #   themselves and asked "fellable?".
  #
  # 🔴 the discriminator was ALREADY DERIVED IN THIS FILE. `CREW_TURNENDED`
  #   is filed per role by `__crew_record_turnended`, and the join note at
  #   `__has_turnended` below says it "refutes exactly two `inflight`
  #   claims". this fence is a THIRD, and it never reached for it
  #   (`rule.require.enumerate-before-you-name` — the fence enumerates LIVE
  #   CLONES where the set it meant is CLONES AT WORK).
  #
  # ⚠️ `__crew_clones_idle` FAILS CLOSED, and task #33 is exactly why: a
  #   modal, a queue, an unread box, or any absent turnended keeps the fence
  #   shut. it lifts only where every live pane proves the turn is over.
  #   the judgment lives in crewwork so it is clampable with no fleet.
  crew_live_clone=""
  if [[ "$crew_state" == "at work" && -z "$crew_cloneless" ]]; then
    crew_live_clone=1
    __crew_clones_idle \
      "${CREW_BOXES[$tree]:-}" \
      "${CREW_TURNENDED[$(__crew_canon "$tree")]:-}" \
      && crew_live_clone=""
  fi
  # 🔴 the fenced set is NAMED here, at the one site that knows which tree the
  #   fence held — task #37. it is merged, clean, and held back by the live-clone
  #   fence alone, which is exactly the row both emit sites render.
  if [[ "$verdict" == "merged" && "$detail" != *"✋ dirty"* && -n "$crew_live_clone" ]]; then
    LIVE_FENCED_TREES+=("$tree")
  fi
  if [[ "$verdict" == "merged" && "$detail" != *"✋ dirty"* && -z "$crew_live_clone" ]]; then
    FELLABLE_TREES+=("$tree")
    # 🔴 .the wrong-box hazard is closed by the VERB, never by a flag this view
    #   appends — 2026-09-20
    #
    #   this site once bound a per-tree grove so the emit could append
    #   `--grove <g>` to a `git.tree.del`. that flag was the right cure for a
    #   REAL defect (a fell aimed at this box over a grove tree exits 0 on
    #   `tree already gone — idempotent no-op`, which is TRUE about localhost
    #   and FALSE about the world — term=false-report, measured 2026-09-17).
    #
    #   `git.crew.fell` closes the same hazard one layer up, and closes a
    #   second one the flag never touched: it DERIVES the grove from the
    #   ledger, so no caller can pass a grove that disagrees with the record,
    #   and it drops the ledger row after the tree is confirmed gone.
    #
    # ⇒ so the bind is retired rather than lost. what guards the box now is
    #   `__crew_ledger_grove_of` inside the verb, which is the authority this
    #   map was a copy of.
  fi

  # 🔴 a merged tree whose dirt is TOOL STATE is NAMED, never counted
  #   the fenced-tree rule is the same one the fellable list obeys: a view that
  #   fences a tree owes the tree's NAME and a runnable cure, or the reader
  #   meets a bare count and the subject is lost to the filter
  #   (term=partial-audit; rule.require.poll-recommends-every-cure-heal-has).
  #
  # ⚠️ no grove bind rides here, for the same reason it no longer rides the
  #   fellable emit: `git.crew.fell` reads the grove off the ledger itself.
  #   see the block at the fellable site above.
  #
  # .why it is collected at the SAME chokepoint, above every filter and fold:
  #   a name gathered after the cut is a name the cut already took.
  if [[ "$verdict" == "merged" && "$detail" == *"tool state only"* ]]; then
    DIRTY_TOOL_TREES+=("$tree")
  fi

  if [[ "$FELLABLE" == "true" && "$verdict" != "merged" ]]; then continue; fi

  # .why an ORPHAN is EXEMPT from the live filter
  #   an orphan is `down` BY CONSTRUCTION — that is half its definition — so
  #   `--live` and "show me the orphans" are in direct conflict, and the orphan
  #   is the more important of the two.
  #
  #   the tally already survived the filter (it increments above), and that is
  #   what made this hard to see: a `--live` run reported `⚠️ 3 WORK ORPHANED`
  #   and named not ONE of them. a count with no subject reads as a report and
  #   is not actionable — you must re-run unfiltered to learn which trees, and
  #   a supervisor mid-tick will read the number and move on.
  #
  #   ⚠️ and `--live` is not some rare flag here: the babysit tick contract
  #   MANDATES it (rule.require.babysit-cron-per-dispatch-fleet). so the ONE
  #   invocation that most needs orphan names was the one guaranteed not to
  #   get them. the exemption is owed whether or not --live is the default.
  if [[ "$LIVE_ONLY" == "true" && "$crew_state" != "at work" && -z "$orphaned" ]]; then continue; fi

  # ── the STATUS verdict — one word per crew, and WHOSE move it is ──
  #
  # .why a status enum at all
  #   the full block is six lines per crew, so a 29-crew fleet renders ~180.
  #   a supervisor reads every one of them to answer ONE question — "which of
  #   these need me?" — so the row should answer that question outright.
  #
  # .the enum, and why it is FIVE rather than four
  #   `blocked` alone is not actionable: the cure is decided by the OWNER, and
  #   two of the owners are different people.
  #
  #     inflight               nobody   at work — mid-turn, or a lane in review
  #     blocked:on-supervisor  the sup  a modal. ONE keystroke
  #     blocked:on-human       a human  stone approval, quota, release, a cred
  #     blocked:on-defect      unclear  ✋ a stone's ladder rendered blocked;
  #                                     read it — often a human's cure, not
  #                                     the sup's alone (measured 2026-09-13)
  #     frozen                 the sup  still, and nobody waits on it
  #     unread                 —        we could not look. NOT a state claim
  #
  #   🔴 `blocked:on-supervisor` must NOT fold into `blocked:on-human`. a modal
  #      is one keystroke and it is the supervisor's; a stone approval is the
  #      human's and cannot be. merged, every prompt lands in the human queue
  #      and stalls there — measured 2026-09-04: three prompts on one bhrain
  #      mechanic, each answered by the supervisor inside ten minutes.
  #
  #   🔴 `unread` must NOT fold into `frozen`. an unreached grove never had its
  #      activity measured at all, so to call it idle asserts a fact from a
  #      failed read — the exact false report `term=asleep` exists to refuse.
  #
  # ⚠️ every derivation below leans to SHOW. an unparsed age, an unknown state,
  #    a crew with no motion data — each renders. a hidden row and an absent row
  #    read identically, so doubt must never land on silence.

  # the crew's stillness = the LEAST still age among its live roles. a role that
  # moved emits no motion row, so a crew is still only when every role reports
  # one. an age that will not parse yields "", which shows the crew
  crew_idle=""
  if [[ -n "${CREW_MOTION[$tree]:-}" && -n "${CREW_ROLES[$tree]:-}" ]]; then
    __live_n="$(printf '%s\n' ${CREW_ROLES[$tree]} | sort -u | wc -l)"
    __moti_n=0; __min=""
    while IFS= read -r __rm; do
      [[ -n "$__rm" ]] || continue
      __moti_n=$(( __moti_n + 1 ))
      __age="${__rm#*=}"; __age="${__age//[!0-9]/}"
      [[ -n "$__age" ]] || { __min=""; break; }
      if [[ -z "$__min" || "$__age" -lt "$__min" ]]; then __min="$__age"; fi
    done < <(sort -u <<< "${CREW_MOTION[$tree]}")
    [[ -n "$__min" && "$__moti_n" -ge "$__live_n" ]] && crew_idle="$__min"
  fi

  # 🔴 the box read states its OWN precondition, rather than inherit one
  #   the at-work `continue` sits 50 lines up and fires only under --live, and
  #   the CREW_ROLES liveness test sits 13 lines up in the idle block. both are
  #   real, and neither is LOCAL — so a reader here cannot see what makes this
  #   read safe, and [case17]'s walk (which looks 8 lines up) reported it
  #   ungated on 2026-09-19. behaviour is unchanged: CREW_ROLES is the liveness
  #   set, and a tree absent from it has no duct that rendered a box either.
  __boxes_s=""
  [[ -n "${CREW_ROLES[$tree]:-}" ]] && __boxes_s="${CREW_BOXES[$tree]:-}"
  __stones_s="${CREW_STONES[$tree]:-}"
  __cap_s="${CREW_CAP[$(__crew_canon "$tree")]:-}"
  # has the cap's reset clock already PASSED? a stale cap is HEALABLE (nudge to
  # retry), a future cap is a real wait — tz-aware, fail-closed on unparseable
  __cap_stale=""
  if [[ -n "$__cap_s" ]]; then
    __cap_first_line="${__cap_s%%$'\n'*}"; __cap_first_line="${__cap_first_line#*=}"
    __crew_cap_reset_passed "$__cap_first_line" && __cap_stale=1
  fi
  crew_status="inflight"
  # 🔴 `exhausted 👋` is the DRIVER's, and it wears the human's glyph
  #
  #   the stone renders `👋` for two unrelated halts: `approved?` — which only a
  #   human may clear — and `exhausted` — a spent review budget, which the
  #   DRIVER tops up with `rhx route.guard.budget --for review --add N`.
  #
  #   ⚠️ so the glyph cannot decide the owner, and `exhausted` must be tested
  #   FIRST or it falls into the human bucket and stalls there. that misread has
  #   a rule of its own already (rule.always.spend-own-levers-before-escalation)
  #   precisely because it is the easy one to make: the guard prints "increase
  #   budget" and "approve as-is" as two peer branches, and only the second is
  #   a human's.
  #
  #   the glyph is owed a split. until it gets one, the WORD settles the owner.
  # 🔴 the PLEA is a SECOND source for `blocked:on-human`, and the row must ask
  #
  #   a stone records a route gate. a plea is a clone that PRINTED a human-only
  #   grant command into its pane, which is the only witness for a gate the
  #   route never models — a credential, an sso unlock, a release auth.
  #
  #   this sweep already derives `CREW_PLEA` for its footer, and the row did not
  #   consult it. so two crews rendered a status that was measurably wrong:
  #
  #     fix-node-pty-install            `frozen`             awaits an sso unlock
  #     fix-keyrack-all-skips-manifest  `blocked:on-defect`  awaits `--as overruled`
  #
  #   ⚠️ same shape as the husk beneath a plea (term=duct.pane.husk): the datum
  #   was measured, and the verdict that needed it never received it.
  __has_plea=""
  [[ -n "${CREW_PLEA[$(__crew_canon "$tree")]:-}" ]] && __has_plea=1

  # 🔴 the COUNCIL is the plea's PEER, and it is the half the plea cannot carry
  #
  #   a plea is a clone that printed a runnable grant command. a FULCRUM COUNCIL
  #   is a clone that tabled its open calls and stopped — no command at all, by
  #   design, because what it awaits is a wisher's JUDGMENT rather than a grant.
  #   so the plea chain is blind to it from its anchor outward, and that blind
  #   spot is structural rather than an anchor drawn a shade too tight.
  #
  #   measured 2026-09-21 on `rhachet-roles-bhrain.beav.feat-acceptance-under-5min`: 256m at
  #   `blocked:on-defect` — the DRIVER's own — with four wisher calls open, F10
  #   a stated SAFETY question. the row was honest and named the wrong owner.
  __has_councilask=""
  [[ -n "${CREW_COUNCILASK[$(__crew_canon "$tree")]:-}" ]] && __has_councilask=1

  # 🔴 the ESCALATION is a THIRD source for `blocked:on-human`, and the STRONGEST
  #
  #   a stone records a route gate; a plea is a clone that printed the grant
  #   command. an escalation is the clone's own plain statement that it has
  #   STOPPED and wants a human — `stuck on stone <X> after <N> attempts.
  #   please tell a human what you saw`.
  #
  #   ⚠️ it needs its own source because the other two miss it in opposite ways:
  #     - the STONE is stale by construction here. the clone never advanced, so
  #       the stone reads whatever it read before the wall — `🔍` or `yield 🌾`
  #       — which routes to the DRIVER, the one owner it is not
  #     - the PLEA finds naught. the clone printed no grant command, because
  #       there is no gate to grant — its INSTRUMENT crashed
  #
  #   measured 2026-09-15, three trees in one tick (23 / 25 / 51 attempts). all
  #   three rendered `😶 inflight` over a clone that had asked for a human, and
  #   two of the three were ⭐ sponsored.
  __has_escalation=""
  [[ -n "${CREW_ESCALATION[$(__crew_canon "$tree")]:-}" ]] && __has_escalation=1
  # the clone's last turn has ENDED — a fact, read off one pane in one pass. it
  # refutes exactly two `inflight` claims and asserts no gate of its own: the
  # MOTION arm (a delta proves a turn RAN, never that one runs NOW) and the
  # `📬queued` arm (a queued box means busy only while a turn runs). see the
  # notes at each.
  __has_turnended=""
  [[ -n "${CREW_TURNENDED[$(__crew_canon "$tree")]:-}" ]] && __has_turnended=1

  # a turn that stopped on a DECLINED modal — and the ONLY witness to it. claude
  # prints no epilogue after a decline, so `__has_turnended` above is blind here
  # by construction rather than by oversight.
  __has_declined=""
  [[ -n "${CREW_DECLINED[$(__crew_canon "$tree")]:-}" ]] && __has_declined=1

  # a message SUBMITTED and unconsumed — the second witness to a queue, and the
  # only one that survives the end of a turn (see the ACTIONS join below; the
  # two read the same fact on purpose, so they can never disagree).
  __has_queuedrow=""
  [[ -n "${CREW_QUEUEDROW[$(__crew_canon "$tree")]:-}" ]] && __has_queuedrow=1

  # 🔴 a clone that lost `--permission-mode acceptEdits`. it is NOT a box state:
  #   the clone is alive and productive, and it stops at a modal on every file
  #   write it makes. so the tick reads it as ordinary work, keys it, and meets
  #   it again next tick — the cost routes to a human keyboard forever while the
  #   tool holds the fact in hand (rule.forbid.byhand-heal).
  __has_modelost=""
  [[ -n "${CREW_MODELOST[$(__crew_canon "$tree")]:-}" ]] && __has_modelost=1

  # a rate-limit WEDGE: claude is alive, drew its box, and stopped on
  # `API Error: Rate limit reached`. surfaced 🚫 limited so the tick catches it.
  __has_ratelimit=""
  [[ -n "${CREW_RATELIMIT[$(__crew_canon "$tree")]:-}" ]] && __has_ratelimit=1

  # 🔴 the STILL term. ANY role on this crew that draws a live turn frame is
  #   mid-work right now, so a limit banner anywhere on the crew is scrollback.
  __has_turnlive=""
  [[ -n "${CREW_TURNLIVE[$(__crew_canon "$tree")]:-}" ]] && __has_turnlive=1

  # 🔴 an ALL-UNREAD box set is a failed read, and must not read as `frozen`
  #
  #   `unread` fired only for an unreached GROVE. one layer down, a crew whose
  #   every box classified `❔unread` is in exactly the same position — we could
  #   not look — and it fell through to `frozen`, which asserts stillness.
  #
  #   the demotion is silent and total: an `❔unread` box renders no stone (the
  #   poll says so on its own line) and registers no plea, so a human-gated crew
  #   loses BOTH witnesses at once and reads as a crew nobody waits on.
  #
  #   measured 2026-09-04. `declastruct-aws.beav.feat-ssm-document` rendered
  #   `🙋 blocked:on-human` with a plea, was read live and terminal, and one poll
  #   later rendered `🧊 frozen` with no stone and no plea. the pane was
  #   byte-identical across both. ⇒ the crew never moved; the classifier did.
  # 🔴 NO box data AT ALL is a failed read, exactly like an all-unread set
  #   the arm at the top of this file now defaults BOXES on for the dense
  #   render, so this should be unreachable. it is kept because the one tick
  #   it WAS reachable, the fleet rendered 18/18 `inflight` over 5 live human
  #   gates, with no tell of any kind. an arm that costs one line is cheaper
  #   than trust that no future path recreates it.
  #   ⇒ the fail-safe direction is SHOW, never reassure.
  __all_unread=""
  [[ -z "$__boxes_s" ]] && __all_unread=1
  if [[ -n "$__boxes_s" ]]; then
    __bx_known="$(printf '%s\n' $__boxes_s | grep -v ':❔unread$' || true)"
    [[ -z "$__bx_known" ]] && __all_unread=1
  fi

  # 🔴 ANY unread box hides a stone — so `all` was the wrong quantifier
  #
  #   a stone is carried by ONE role. a box is read per role. so a crew with a
  #   read foreman and an unread mechanic has `__all_unread=""` — yet its ONLY
  #   stone-bearer went unread, and the stone it would have rendered is gone.
  #   the crew then falls past every stone arm to `frozen`.
  #
  #   ⚠️ this is the SAME defect the arm above cures, at a quantifier the cure
  #   did not cover. `all` reads as the cautious choice and is the narrow one:
  #   it fires only when the whole crew went dark, which is the case where a
  #   supervisor would already suspect a bad read.
  #
  #   measured 2026-09-04, two ticks apart. `feat-absorb-handler-invoke-test-util`
  #   was read live and verified CORRECTLY parked at `1.vision, approved? 👋` —
  #   every driver lever spent, both lanes 0/0. one poll later it rendered
  #   `🧊 frozen · still 408m` off a byte-identical pane, because its mechanic
  #   box classified `❔unread` while its foreman's did not.
  #
  #   ⇒ so the honest condition is not "we read no box" — it is "we may have
  #     missed the box that decides." any unread box means exactly that, and
  #     the fail-safe direction is SHOW.
  __any_unread=""
  [[ "$__boxes_s" == *"❔unread"* ]] && __any_unread=1

  if   [[ "$crew_state" == "asleep" ]];                    then crew_status="unread"
  elif [[ "$__boxes_s" == *"🚧prompt"* ]];                 then crew_status="blocked:on-supervisor"
  # 💀 a MECHANIC at a bare shell is a HUSK — a live tmux duct sits where claude
  #   should be. it classifies `mechanic:shell` (duct.poll's `no input box`), and
  #   with no arm here it fell past every stone to `😶 at work`, so a dead
  #   mechanic read as alive across ticks (task #42).
  # .why it sits HERE — below asleep + prompt, above the stone arms
  #   below asleep: an unreached grove is a failed read, never a husk claim.
  #   below prompt: a live prompt means claude is up, so not a husk.
  #   above the stone arms: a husk's stone is read from DEAD scrollback and is
  #   stale — "the mechanic is dead" outranks "its last stone said blocked".
  # .why the role guard — a FOREMAN at a shell is correct BY DESIGN
  #   (ductwork's foreman is a bare shell), so `foreman:shell` must NOT trip
  #   this. the match keys on `mechanic:` so only a dead MECHANIC is named.
  # ⚠️ this catches every LOCAL husk (pane read → `shell`). a GROVE husk whose
  #   ssh capture came back EMPTY renders `unread` at duct.poll.sh:449 — an
  #   honest "could not read", a SEPARATE capture defect, not this arm's gap.
  elif [[ "$__boxes_s" == *"mechanic:shell"* || "$__boxes_s" == *"mechanic:husk"* ]]; then crew_status="husk"
  # 🔴 a RATE-LIMIT WEDGE — claude is ALIVE (its box is drawn) but stopped on
  #   `API Error: Rate limit reached`. it renders identically to health: a live
  #   box, a stale stone. so it must win OVER the stone arms below (its stone is
  #   the last gate it drove before it wedged), the same way husk and the
  #   moved-discriminator do. surfaced 🚫 limited; cure is a retry or auth.swap,
  #   NEVER a reboot (that burns the live conversation).
  # .why below husk: a dead mechanic outranks a wedged one (a husk has no box).
  #   above the stone arms: a wedge's stone is stale, so it wins over exhausted/
  #   blocked ✋ — but it does NOT touch on-human (approved?/👋), which sits below.
  elif [[ -n "$__has_ratelimit" ]];                        then crew_status="limited"
  # 🔴 a VENDOR USAGE CAP on a LIVE clone — `You've hit your limit · resets HH:MM`
  #   with its ❯ box still drawn. this is the interactive account-budget cap, the
  #   most expensive state the fleet holds: the clone is alive, idle, and cannot
  #   proceed until the reset passes (retry) or its auth is swapped. NEVER a reboot
  #   — that burns the live conversation.
  # .why the guard is `crew_state == "at work"`, NOT `!= "at work"` (the bug this
  #   fixes, measured 2026-09-14, v20260901 telepath grove mechanic): a capped
  #   clone KEEPS its input box drawn, so `crew_state` reads `at work` on every
  #   poll. the old `!= "at work"` guard therefore NEVER fired for an interactive
  #   cap — the wire was dead, and ~24 capped grove crews fell through to
  #   `unread`/`frozen`, invisible to the sweep while `0034.cap` proved detection
  #   worked. a live box IS the precondition, not the disqualifier.
  # .why it sits HERE — beside ratelimit, above the stone arms
  #   both are "alive but blocked on a limit". above the stone arms: the cap is
  #   the CURRENT blocker, so it wins over the last (stale) stone the clone drove
  #   before it capped — the telepath's `exhausted 👋` is scrollback, the cap is now.
  #   below husk: a dead mechanic (no box → crew_state != at work) never trips this.
  #
  # 🔴 .the THIRD term — `-z "$__has_turnlive"` — added 2026-09-18, and the arm
  #   was WRONG without it in a way the two extant terms cannot catch.
  #
  #   duct.poll's cap row has stated its own join contract from the day it was
  #   written: `(scrollback; join to reset-vs-now + STILL to judge)`. three
  #   facts. this arm joined two — the cap text, and a live BOX — and the STILL
  #   half had no emitter at all, so there was naught to join it to.
  #
  #   ⇒ and the two terms it DID have cannot stand in for the third, because a
  #   clone that is at work satisfies both: its box is drawn (`at work`), and a
  #   cap banner it hit hours ago is still in its scrollback. so the arm asked
  #   "is a cap visible on a live clone?" where the question is "is this clone
  #   STOPPED on a cap?" — and those differ on exactly the case that costs.
  #
  #   measured 2026-09-18, two trees in ONE tick, both mid-turn, both rendered
  #   `🚫 limited — ⏰ reset PASSED — healable, nudge to retry`:
  #     feat-telepath-role/mechanic     a live turn frame + a live test run
  #     fix-budget-grant-…/mechanic     a live turn frame + a live test run
  #   and `git.crew.heal`, on the SAME tree in the SAME tick, answered "this
  #   clock has NOT passed, so the nudge below is a PROBE, never a verdict".
  #   ⇒ two instruments, one pane, opposite verdicts — and the poll's drove a
  #   nudge into a clone that had not stopped.
  #
  # ⚠️ .why the guard is the TURN and not any extant motion instrument
  #   every one of them — CREW_MOTION, `✋ BOX UNMOVED`, `CLONE QUIET` — keys on
  #   the BOX across two captures. a clone mid-turn holds an EMPTY box that
  #   STAYS empty, so each reads "unchanged" and is right to. the TURN is a
  #   different subject than the BOX, and `__duct_pane_turn_live` is the first
  #   instrument the fleet has had for the first.
  #
  # ⚠️ .it does NOT weaken the 2026-09-14 cure above. a genuinely capped clone
  #   draws NO turn frame — its turn is precisely what the cap stopped — so the
  #   `at work` term still carries every real cap. this term subtracts only the
  #   panes where the banner is history.
  #
  # ⚠️ .and it does not touch `__has_ratelimit` one arm up, on purpose: a
  #   rate-limit WEDGE is an ERROR STRING in the tail, not a scrollback banner,
  #   and a wedged clone has already stopped. the two failure shapes differ, so
  #   a guard copied across would suppress a real wedge.
  #
  # ⇒ clamped at [case55] (the detector, ductwork) and [case56] (this join).
  elif [[ -n "$__cap_s" && "$crew_state" == "at work" && -z "$__has_turnlive" ]];  then crew_status="limited"
  # 🔴 a stale ON-DEFECT stone whose bearer MOVED this poll is mid-turn, not blocked
  #   the moved-discriminator the 🙋 tally already uses (STONE_HUMAN_MOVED, below),
  #   applied to the per-crew status. a role that renders `exhausted`/`blocked ✋` and
  #   is ABSENT from the still-map took a turn, so its on-defect stone is the last
  #   gate it drove PAST, not a live halt — render `inflight` (task #58).
  # .why it sits HERE — below husk, above the stone arms
  #   below husk: a dead mechanic never moves, so a husk claim outranks a motion one.
  #   above the stone arms: a mover's on-defect label is stale, so it must win over
  #   the very `exhausted`/`blocked ✋` arms it would otherwise fall into.
  # ⚠️ ON-DEFECT ONLY, and the helper enforces it: an on-human gate (approved?/👋/
  #   route complete/plea) that moved is NOT promoted here — it falls to its own arm
  #   below and stays the human's. a clone may drive work BENEATH a real human gate,
  #   so a mover there is "do not surface yet", never "no gate" (the 🙋 note, ~2058).
  # 🔴 the ESCALATION arm, and it sits ABOVE the motion arm on purpose
  #   the clone SAID it stopped and wants a human. that is a first-party claim,
  #   and it outranks every inference below it.
  #   ⚠️ above the motion arm specifically: a crashed stop hook RE-FIRES, so the
  #   pane changes between polls and `__crew_ondefect_moved` reads that churn as
  #   progress. left below, the row would render `inflight` over a clone whose
  #   only motion is its own instrument failing again — the measured defect.
  #   ⚠️ below husk, which stays above it: a dead clone's escalation is
  #   scrollback, and its cure is `crew.heal`, never a human. the detector's own
  #   box guard already excludes a husk, so this is belt and braces.
  elif [[ -n "$__has_escalation" ]];                       then crew_status="blocked:on-human"
  # 🔴 .why the `! $__has_turnended` guard, added 2026-09-16
  #   the motion arm's whole claim is "this clone is MID-TURN, so its on-defect
  #   stone is the gate it drove PAST." motion is a DELTA — the pane differs
  #   between two polls — and a clone that drove, then stopped, produces the
  #   identical delta. so the delta proves a turn RAN, and says naught about
  #   whether a turn runs NOW.
  #   ⇒ the ended-turn tense answers exactly that, off one pane, in one pass.
  #     where it holds, the promotion is withdrawn and the row falls to its own
  #     stone arm below — `blocked ✋` stays `blocked ✋`, which is what it is.
  #   measured on feat-dispute-or-concede-review-budget: `😶 inflight` came from
  #   THIS arm, never from the queued arm below (the box classified `empty`).
  #   the first cure keyed on the queued arm alone, went green, and moved naught
  #   (rule.always.capture-clamp-then-verify-in-prod).
  elif [[ -z "$__has_turnended" && -n "$(__crew_ondefect_moved "$__stones_s" "${CREW_MOTION[$tree]:-}")" ]]; then crew_status="inflight"
  # 🔴 FROZEN, proven off the PANE rather than off a clock — the clone is
  #   STOPPED, and it is the one wedge that wears a healthy face. claude is
  #   alive, its box is drawn, no prompt, no husk, no cap, no 429. its turn has
  #   ENDED and a message is still parked in the queued row above its box. a
  #   queue drains at a TURN BOUNDARY, so with no turn there is no boundary,
  #   and the message never arrives.
  #
  # 🔴 .why `frozen` and NOT a word of its own
  #   the verdict table above already declares frozen as "still, and the sup
  #   owns it" — which is this state exactly. a second word for it would be a
  #   synonym, and the glossary forbids one (rule.forbid.domain-term-synonyms).
  #   a first cure did coin `halted`; the human struck it in four words —
  #   "isnt that frozen / use that emoji here" — and they were right.
  #   ⇒ what this arm adds is not a STATE. it is a WITNESS. the two arms at the
  #     bottom prove frozen from an absent clone or from an idle CLOCK, so both
  #     need time to pass. this one proves it off a single pane, on the first
  #     poll, with the cause named.
  #
  # 🔴 .why it sits HERE — above every STONE arm, below every PANE arm
  #   this is the placement two cures got wrong, and the reason both went green
  #   and moved naught.
  #
  #   a stone arm reads the ROUTE's record — `blocked ✋` says a driver halted
  #   at a gate. this reads the CLONE's liveness. the two are orthogonal, and
  #   the stillness is strictly the more urgent of the pair: a gated clone that
  #   RUNS needs no supervisor, while a gated clone stopped in front of the very
  #   answer that opens its gate needs one now.
  #   ⇒ and the population is not an edge case — it is the NORM. a clone ends
  #     its turn to ask a human precisely when it is gated, so almost every
  #     crew this arm exists for carries `blocked ✋` on its stone. placed
  #     below, the arm is unreachable for exactly the crews it was written for.
  #
  #   measured 2026-09-16 on
  #   `rhachet-roles-bhrain.beav.feat-dispute-or-concede-review-budget`: the
  #   cure was written, wired, clamped, and shipped BELOW the stone arms. the
  #   row rendered `✋ blocked:on-defect` and the human read the pane and said
  #   it outright: "it is NOT inflight / it is just halted".
  #
  # ⚠️ it stays below the PANE arms — a prompt, a husk, a cap, an escalation.
  #   each of those is also read off the pane and each names a sharper cure, so
  #   this must never overturn one (rule.forbid.overzealous-blockers).
  elif [[ -n "$__has_turnended" && ( "$__boxes_s" == *"📬queued"* || -n "$__has_queuedrow" ) ]]; then crew_status="frozen"
  # 🔴 a turn that stopped on a DECLINED modal, above an EMPTY box. the clone
  #   is parked and no party knows it: claude prints no epilogue after a
  #   decline, so the arm directly above cannot see this at all, and with an
  #   empty box there is no queued row to pair with either.
  #
  # 🔴 .measured 2026-09-18 — rhachet-roles-bhrain.beav.feat-acceptance-under
  #   -5min @ bert/feat-goal-init. the pane: `⎿ User rejected update to
  #   blackbox/driver.route.stack.acceptance.test.ts`, then an empty ❯ box,
  #   `⏵⏵ accept edits on`, no frame. it fell past every arm here to
  #   `inflight`, heal said "absent any move to make", `--healable` named it
  #   NOT AT ALL — and a human found it by eye and asked why it was frozen.
  #
  # ⚠️ it is `on-human`, never `on-defect`. a decline is a DELIBERATE verdict
  #   by whoever held that keyboard, and no instrument can tell a human's from
  #   a supervisor's. so the row SURFACES and prescribes no nudge — to resume
  #   is the decliner's call
  #   (rule.forbid.steer-a-clone-beyond-a-permission-key).
  #   ⇒ the defect was never the decline. it is that the fleet read a parked
  #     clone as `😶 at work` for as long as it sat there.
  #
  # ⚠️ it sits BELOW the queued arm on purpose: a decline with a message
  #   already queued behind it drains on the relay, which is the sharper cure
  #   (rule.forbid.overzealous-blockers).
  # 🔴 .and it holds only while the decline is FRESH — corrected 2026-09-18
  #   `__has_declined` is read off the PANE, and a resumed clone REPLAYS its
  #   transcript into that pane. so a decline answered before a crash is
  #   re-rendered after the restore and reads as though it just happened.
  #
  #   ⇒ the misread does not merely mislabel. `blocked:on-human` prescribes NO
  #     nudge, so it SUPPRESSES the one cure that works — permanently, because
  #     no part of a replayed line ever expires.
  #
  #   measured the same day, on the very tree the arm above was written from:
  #   `feat-acceptance-under-5min` rendered `🙋 blocked:on-human · still 190m`
  #   and `⛔ DECLINE PARKED — NO nudge`, while `--healable` named it NOT AT
  #   ALL and three peers at 529m/196m/516m were named 🧊 frozen and reachable.
  #   the human: "its frozen because it was resumed from a crash and never told
  #   to 'go'". every PEER seat on that crew read `relic` — a crew that died.
  #
  # 🟢 the discriminator is RECENCY and needs no new read: `crew_idle` is
  #   already computed ~300 lines up. past STALL_MINS the arm stands aside and
  #   the crew falls to `frozen` below — which heal CAN reach, so the nudge
  #   becomes available (define.invariant.crew.revive-is-incomplete-without-a-nudge).
  #
  # ⚠️ a FRESH decline is untouched: while the verdict is live, to resume is the
  #   decliner's call (rule.forbid.steer-a-clone-beyond-a-permission-key).
  #
  # ⇒ clamped at [case53] in work.surface.heal.integration.test.ts
  elif [[ -n "$__has_declined" && "$__boxes_s" != *"📬queued"* && -z "$__has_queuedrow" ]] \
       && [[ -z "$crew_idle" || "$crew_idle" -lt "$STALL_MINS" ]]; then crew_status="blocked:on-human"
  elif [[ "$__stones_s" == *"exhausted"* ]];               then crew_status="blocked:on-defect"
  # 🔴 `malfunction` is the THIRD member of the stuck-stone family, and it sat
  #   unscreened here for the life of this ladder while the `🗿 stones` tally
  #   below already counted all three as one set:
  #
  #     *blocked*|*exhausted*|*malfunction*)  (( STONE_STUCK++ ))
  #
  #   ⇒ so ONE instrument graded one fact two ways: the tally said stuck, the
  #     ladder fell through to `frozen` — whose declared sense is "still, and
  #     nobody waits on it." a malfunctioned crew then entered `--healable`
  #     every tick for a wedge probe that correctly answered "not wedged."
  #
  #   measured 2026-09-16 on `rhachet-roles-bhuild.beav.feat-behavior-route-upgrades`:
  #     🧊 frozen · still 388m
  #     🗿 mechanic: 1.vision, review.peer, l1@i023, malfunction 💥
  #
  # ⚠️ it is `on-defect`, never `on-human` — a malfunctioned reviewer is the
  #   DRIVER's to diagnose (rule.always.diagnose-reviewer-malfunctions); it
  #   reaches a human only after that diagnosis names a human-owned lever.
  elif [[ "$__stones_s" == *"malfunction"* ]];             then crew_status="blocked:on-defect"
  elif [[ "$__stones_s" == *"👋"* ]];                      then crew_status="blocked:on-human"
  elif [[ "$__stones_s" == *"route complete"* ]];          then crew_status="blocked:on-human"
  # .why an explicit `blocked ✋` OUTRANKS a plea rather than yields to it
  #   the two disagree only where a clone printed a human command while its
  #   stone records a driver halt, and the safe error is the one that lands on
  #   ME: a misfiled supervisor row is read every tick and re-routed cheaply,
  #   where a misfiled human row waits on the scarcest party in the loop.
  #   ⇒ so the plea does not overturn the stone — it ANNOTATES the row (below),
  #     which keeps both true signals rather than compresses them to one.
  elif [[ "$__stones_s" == *"blocked ✋"* ]];               then crew_status="blocked:on-defect"
  # a plea rescues what would otherwise read `frozen` or `inflight` — there is
  # no stone to contradict it, so the pane is the only witness there is
  elif [[ -n "$__has_plea" ]];                             then crew_status="blocked:on-human"
  # a COUNCIL rescues the same set a plea does, and by the same argument: there
  # is no stone to contradict it, so the pane is the only witness there is.
  # ⚠️ it sits BELOW `blocked ✋` for the reason stated there — the safe error is
  #   the one that lands on ME — so on that stone it ANNOTATES rather than
  #   overturns, exactly as the plea does.
  elif [[ -n "$__has_councilask" ]];                       then crew_status="blocked:on-human"
  # 🔴 the DOWN check outranks the unread check — an absent box is not a
  #   failed read when we already know there is no clone behind it
  #   measured 2026-09-04: with `unread` above this arm, every down crew
  #   promoted from `frozen` to `unread` (it has no box, by definition), the
  #   idle prune stopped firing on them — hidden fell 11 -> 2 — and 9
  #   genuinely-known states were relabelled "we could not look."
  #   ⇒ `unread` is a claim about the READ. where `crew_state` already
  #     answered, there was no failed read to report.
  elif [[ "$crew_state" != "at work" ]];                   then crew_status="frozen"
  # 🔴 a 📬queued box REFUTES `unread` on its own tree — the poll may not
  #   contradict itself inside ONE render
  #
  #   `unread` is a claim about the READ (term=duct.box.unread — "the capture
  #   came back empty"). a `📬queued` box is a message the poll READ: already
  #   submitted, held for a busy clone to drain (term=duct.box.inflight).
  #   ⇒ so the two cannot both hold. a queued box is the ONE box state that
  #     cannot be unread, because it says outright that we saw it.
  #
  #   measured 2026-09-15 on
  #   `rhachet-roles-bhrain.beav.feat-dispute-or-concede-review-budget`: ONE
  #   render carried BOTH `😴 unread — …dispute-or-concede` and
  #   `📬queued × 1 — …dispute-or-concede / mechanic`. verified minutes later,
  #   the queue HAD drained and the clone was live, at work on the very file the
  #   queued message named. so the crew never slept; the classifier did.
  #
  #   the harm: the label erases the one distinction a babysit tick acts on.
  #   `😴 unread` invites a drill-in and a nudge, while the tick contract says of
  #   a queued box "⛔ leave it, the clone drains it" — an Enter there lands in
  #   the EMPTY box beneath the queued row, a recorded harm.
  #
  # .why THIS is the cheapest cure on task #49
  #   the contradiction is between two values this pass ALREADY computed. no
  #   pane parse, no token counter, no tense read, no second poll to diff. and
  #   unlike the stone-iteration delta it has no blind spot: a static iteration
  #   says naught about liveness, while the box state is read every pass.
  #
  # .why it sits HERE — below every positive verdict, above the unread arms
  #   a queued box says only "the clone is busy". that must never overturn a
  #   prompt, a husk, a cap, a stone gate, or a plea — a clone may drive work
  #   BENEATH a real gate, so "busy beneath a gate" is still the gate's. it sits
  #   above the unread arms because those assert we could not look, and here we
  #   demonstrably did.
  # 🔴 and a turn that ENDED refutes the queued box in turn — the same move, one
  #   layer deeper. the arm below reasons "a queued box means the clone is
  #   BUSY", and that word is an INFERENCE, never a read. it holds while a turn
  #   runs and is false the moment one ends: no turn runs, so no turn drains the
  #   queue. the clone is STOPPED with a message in front of it.
  #
  #   measured 2026-09-16 on
  #   `rhachet-roles-bhrain.beav.feat-dispute-or-concede-review-budget`: the
  #   mechanic ended its turn with a question to the human (`⭐ can you confirm:
  #   did the billing restore apply to the account behind the test-env Fireworks
  #   key…`), the human answered it INTO the box, and the row rendered
  #   `😶 inflight` off that very queued message. the human read the pane and
  #   asked outright: "this one is halted. how can you get your crew.poll to
  #   detect this". the tell was one row above the box the whole time.
  #
  # 🔴 .why the JOIN and not the tense alone — the guard that keeps this honest
  #   duct.poll reports the ended turn UNCONDITIONALLY, because it is a fact and
  #   a fact row cannot be wrong about a precondition it never asserts. but
  #   EVERY clone between instructions has an ended turn — that is the ordinary
  #   idle state, and the stone already routes it by owner. so a bare
  #   `turnended ⇒ blocked:on-human` arm would put a human in front of most of
  #   the fleet (rule.forbid.overzealous-blockers).
  #   ⇒ the JOIN is what is actionable, and it is made HERE rather than in the
  #     detector: a queued box AND no turn to drain it.
  #
  # .why `blocked:on-supervisor` and not on-human
  #   the message is already IN the box — a human has said their piece. what is
  #   absent is the submit, and a key into a pane is the supervisor's own move
  #   (rule.require.babysit-permission-approval). to file it as a human's would
  #   park it behind the scarcest party in the loop for a keystroke I hold.
  #   ⚠️ read the pane FIRST: the box may hold a GHOST rather than a typed
  #   message (term=duct.box.ghost), and an Enter on a ghost submits a payload
  #   no human authored.
  # 🔴 the second disjunct is the whole cure. `📬queued` is the BOX state, and
  #   that state keys on claude's footer hint — printed only while a turn runs.
  #   so on the very clone this arm exists for, one whose turn has ENDED, the
  #   box reads `empty` and the first disjunct never fires. `__has_queuedrow`
  #   reads the highlight on the parked row itself, which outlives the turn.
  # 🔴 the turn-ended JOIN is graded ABOVE, as `halted`, and deliberately not
  #   here. it lived at this rung for two cures and was unreachable both times:
  #   every crew it targets carries `blocked ✋` on its stone, and that arm sits
  #   between. what remains here is the LIVE half of the same pair — a queued
  #   box under a turn that has not ended, which is simply a busy clone.
  elif [[ "$__boxes_s" == *"📬queued"* ]];                  then crew_status="inflight"
  # ⚠️ both unread arms sit BELOW every positive verdict on purpose. a crew with
  #   a prompt, a stone, or a plea was read well enough to grade, whatever its
  #   other boxes did — so `unread` never overturns a verdict we HAVE.
  #   ⇒ but it must outrank every arm that asserts STILLNESS, because those are
  #     claims about the world and this is a claim about the read.
  elif [[ -n "$__all_unread" || -n "$__any_unread" ]];     then crew_status="unread"
  elif [[ -n "$crew_cloneless" ]];                         then crew_status="frozen"
  elif [[ -n "$crew_idle" && "$crew_idle" -ge "$STALL_MINS" ]]; then crew_status="frozen"
  fi
  STATUS_TALLY[$crew_status]=$(( ${STATUS_TALLY[$crew_status]:-0} + 1 ))

  # the HEALABLE set — a crew git.crew.heal can cure, on EITHER axis:
  #   - a `limited` crew whose cure is a NUDGE: a transient 429 (bare banner, no
  #     clock — __has_ratelimit) OR a stale cap (reset PASSED — __cap_stale). a
  #     LIVE cap (a future reset) is excluded — it owes a wait or an auth.swap.
  #   - a `husk` whose cure is a REVIVE: a mechanic at a dead box.
  # .why it sits HERE, not beside the --fellable continue (~1560): healable keys
  #   on crew_status, computed just above; fellable keys on the verdict, known
  #   earlier. this is the twin of that filter, one status-compute later.
  # the decision is a PURE predicate in crewwork.sh, clamped there directly (the
  # case14 pattern) — so the false-heal hazard (a LIVE cap nudged for naught) is
  # guarded by a test, not by this inline conjunction.
  # 🔴 the 5th arg is the NO-DUCT screen. a crew with no tmux session has no
  #    pane, so no heal axis can read it — and this same row already printed its
  #    real cure. without the screen the render carried two recommendations for
  #    one tree and only the crew-row one was real.
  #
  # 🔴 .it read `== "down"` for a day, and that was one state short
  #    the property is "no session". `crew_state` has four values and TWO carry
  #    it — `down` (no duct, tree on disk) and `phantom` (no duct, no tree
  #    here). the ladder above sends BOTH to `frozen` through one arm,
  #    `!= "at work"` (~line 2487), so they arrive at this call indistinguishable
  #    — and a screen written for one of them let the other straight through.
  #
  #    measured 2026-09-16 over four ticks: three trees rendered
  #    `👻 phantom — stale registry rows, tree is gone` beside a wedge line that
  #    named `--who mechanic` on a tree with no worktree on any box. each run
  #    answered `😴 no pane read`. a phantom's cure is the fell the crew row
  #    names, never a heal.
  #
  # ⚠️ `asleep` is deliberately NOT screened. an unreached grove and a crewless
  #    box answer with the same empty list, so `asleep` is a claim about the
  #    READ (term=asleep) — to screen it would assert an absent duct from a
  #    failed look. the predicate's header carries the full four-value table.
  # 🔴 the 7th arg is the husk BOX — a per-SEAT fact the aggregate status hides
  #
  #    `crew_status` is derived over every seat, so one dead mechanic beside four
  #    live `shell` seats resolves to `at work` and the predicate's status arms
  #    never meet the husk. `__boxes_s` is the per-seat census (` role:box …`),
  #    already bound ~480 lines up, and it holds the fact heal itself reads.
  #
  #    measured 2026-09-18 on feat-prescribed-brain-per-stone: `--healable --all`
  #    said `no tree to heal right now` in the same tick that
  #    `crew.heal --who mechanic` said `husk (exit 143) — safe to heal`, and the
  #    poll's own `husk × 1` footer named the tree AND the seat on that same run.
  #    ⇒ the datum was measured and the derived set never received it
  #      (rule.require.poll-recommends-every-cure-heal-has).
  __has_huskbox=""
  case " $__boxes_s " in *":husk "*) __has_huskbox=1 ;; esac
  __healable="$(__crew_is_healable "$crew_status" "$__has_ratelimit" "$__cap_stale" "$__has_queuedrow" "$([[ "$crew_state" == "down" || "$crew_state" == "phantom" ]] && printf 1)" "$__has_modelost" "$__has_huskbox")"
  if [[ -n "$__healable" ]]; then
    HEALABLE_TREES+=("$tree")
    # 🔴 the AXIS, never merely the status. two frozen crews take two different
    #    heal commands — a relay (`--what work`, the default) and a wedge probe
    #    (`--what wedge`, opt-in and NEVER run under `all`). to key the render on
    #    the status alone would hand a wedge candidate the default line, which
    #    reports "a live claude box is up, absent any move to make" and cures
    #    naught — a named tree with its cure still hidden.
    HEALABLE_AXIS["$tree"]="$(__crew_heal_axis "$crew_status" "$__has_queuedrow" "$__has_modelost" "$__has_huskbox")"
    HEALABLE_STATUS["$tree"]="$crew_status"   # for a truthful per-tree glyph in the render
  fi
  # the --healable focused view — mirror of --fellable: render ONLY the nudge
  # candidates, so a supervisor heals the derived set in bulk through the tool
  # rather than transcribe names by hand (rule.require.bulk-over-byhand).
  if [[ "$HEALABLE" == "true" && -z "$__healable" ]]; then continue; fi

  # the IDLE PRUNE. only `frozen` folds, and only past --idle-mins. every
  # blocked:*, every inflight, and every unread renders whatever its age
  #
  # .why an ORPHAN is EXEMPT here too, not only at the --live filter above
  #   the --live exemption a few lines up already argues this once: an orphan
  #   is the fleet's loudest row, and a tally with no subject is not
  #   actionable. that argument does not stop at --live — a crew_cloneless
  #   orphan on a dirty/inflight tree falls to crew_status="frozen" (the
  #   line above), and a frozen crew with no live duct hits HIDDEN_NOCLONE
  #   unconditionally, no idle-time check at all. so the tally counted it
  #   (ORPHANED, above) and this fold hid it in the same breath — a reader
  #   sees "N WORK ORPHANED" in the footer and not one of their names,
  #   even on a bare (non---all) run. same defect, one filter later.
  #   measured 2026-09-13: footer read `7 WORK ORPHANED`, exactly 1 row
  #   named it — the other 6 were `down` crews folded here.
  if [[ "$ALL" != "true" && "$IDLE_MINS" -gt 0 && "$crew_status" == "frozen" && -z "$orphaned" ]]; then
    if [[ "$crew_state" != "at work" ]]; then
      HIDDEN_NOCLONE=$(( HIDDEN_NOCLONE + 1 )); continue
    elif [[ -n "$crew_idle" && "$crew_idle" -ge "$IDLE_MINS" ]]; then
      HIDDEN_IDLE=$(( HIDDEN_IDLE + 1 )); continue
    fi
  fi

  # the DENSE render — one line per crew, plus the stone rows that carry a
  # verdict. the tree verdict and the ref drop out on purpose: neither decides
  # a babysit act, and both are one `--all` away
  if [[ "$ALL" != "true" ]]; then
    case "$crew_status" in
      husk)                  __sg="💀" ;;
      limited)               __sg="🚫" ;;
      blocked:on-supervisor) __sg="🚧" ;;
      blocked:on-human)      __sg="🙋" ;;
      blocked:on-defect)     __sg="✋" ;;
      frozen)                __sg="🧊" ;;
      unread)                __sg="😴" ;;
      *)                     __sg="😶" ;;
    esac
    __age_s=""; [[ -n "$crew_idle" ]] && __age_s=" · still ${crew_idle}m"
    # the plea ANNOTATION — carried wherever the status did not already absorb
    # it, so a row that is truly both never has to pick one of its two truths
    __plea_s=""
    [[ -n "$__has_plea" && "$crew_status" != "blocked:on-human" ]] && __plea_s=" · 🙋plea"
    # the COUNCIL annotation — the same contract as the plea's, and it is what
    # makes the `blocked ✋` outrank above survivable: the stone keeps the row,
    # and the human gate beside it stays visible rather than compressed away.
    [[ -n "$__has_councilask" && "$crew_status" != "blocked:on-human" ]] && __plea_s+=" · 🗳️council"
    # the cap ANNOTATION — for a limited crew, compare the reset clock to now and
    # say which cure the reader owes: a PASSED reset is a stale banner over an
    # idle-but-live box (HEALABLE — nudge to retry), a future reset is a real
    # wait (or auth.swap). the tz-aware comparison rides __cap_stale (above).
    __cap_ann=""
    if [[ "$crew_status" == "limited" && -n "$__cap_s" ]]; then
      __cap_first="${__cap_s%%$'\n'*}"; __cap_first="${__cap_first#*=}"
      __cap_reset="${__cap_first#*resets }"
      if [[ -n "$__cap_stale" ]]; then
        __cap_ann=" · ⏰ reset PASSED — healable, nudge to retry"
      else
        __cap_ann=" · resets ${__cap_reset%\"}"
      fi
    fi
    echo "   ├─ $__sg $crew_status — $t$orphaned$__age_s$__cap_ann$__plea_s"
    if [[ "$STONES" == "true" && -n "$__stones_s" ]]; then
      while IFS= read -r __rs; do
        [[ -n "$__rs" ]] || continue
        # the label rides through the OWNER-glyph assignment: the route prints 👋
        # for both `judge, approved?` (a human's) and `exhausted` (the driver's
        # spent budget), so the raw glyph would point a reader at a human for a
        # lever no human owns (task #88, crewwork.sh __crew_stone_owner_glyph).
        echo "   │    🗿 ${__rs%%=*}: $(__crew_stone_owner_glyph "${__rs#*=}")"
      done < <(sort -u <<< "$__stones_s")
    fi
    # the box list rides ONLY the prompt row — it is what names the role whose
    # keyboard is held, and that is the one row a supervisor acts on at once
    if [[ "$crew_status" == "blocked:on-supervisor" ]]; then
      __bx="$(printf '%s\n' $__boxes_s | sort -u | tr '\n' ' ')"
      echo "   │    🚧 ${__bx% }"
    fi
    continue
  fi

  echo "   ├─ $t$orphaned"
  # .why the box list may replace crew_who ONLY while the crew is AT WORK
  #
  #   the two halves of this row come from DIFFERENT sources:
  #     crew_state  <- live tmux sessions   (the only proof of `at work`)
  #     CREW_BOXES  <- duct.poll's output   (derived from the duct REGISTRY)
  #
  #   they can disagree, and the replacement used to hide it. observed
  #   2026-08-31, nine rows at once:
  #
  #       💀 crew: down — foreman:shell mechanic:shell
  #
  #   said out loud that reads *"this crew has no live duct — here are its two
  #   ducts' pane states."* one of the halves must be false, and the row gives
  #   a reader no way to tell which. worse, the overwrite spent the one
  #   ACTIONABLE cure the down branch had to offer — `rhx git.crew.boot` — on
  #   a box list that implies the opposite move.
  #
  #   the replacement's own justification is what bounds it: the comment below
  #   says the boxes may stand in for the role list because *"the roles are
  #   already named in it."* that holds only where the boxes ARE the crew's
  #   live roles — i.e. `at work`. under `down` or `phantom` the boxes name
  #   registry rows, never live roles, so the premise fails and so does the
  #   substitution.
  if [[ "$BOXES" == "true" && "$crew_state" == "at work" && -n "${CREW_BOXES[$tree]:-}" ]]; then
    # the box line sits UNDER the crew line, because a box is a property of
    # a role and a role is a property of a crew. it replaces the role list
    # rather than sits beside it — the roles are already named in it
    boxes="$(printf '%s\n' ${CREW_BOXES[$tree]} | sort -u | tr '\n' ' ')"
    echo "   │  ├─ $crew_glyph crew: $crew_state — ${boxes% }"
    # the stone sits UNDER the crew line, one row per role that named one.
    # a role with no stone (a bare shell, a felled duct) prints no row —
    # absent is absent, and a placeholder would invite a verdict about it.
    if [[ "$STONES" == "true" && -n "${CREW_STONES[$tree]:-}" ]]; then
      while IFS= read -r __rs; do
        [[ -n "$__rs" ]] || continue
        # same OWNER-glyph assignment as the compact block above — both render
        # sites must route through it, or one of the two keeps the human marker.
        # the clamp is DERIVED over every render site (crewwork [case27] t4).
        echo "   │  │  🗿 ${__rs%%=*}: $(__crew_stone_owner_glyph "${__rs#*=}")"
      done < <(sort -u <<< "${CREW_STONES[$tree]}")
    fi
    # the STILL age rides with --boxes rather than a flag of its own: the
    # delegated call already measured it, so the column is free. only ducts
    # that have NOT moved print — a mover is the ordinary case and would add
    # a row per live duct for no decision.
    if [[ -n "${CREW_MOTION[$tree]:-}" ]]; then
      while IFS= read -r __rm; do
        [[ -n "$__rm" ]] || continue
        echo "   │  │  🧊 ${__rm%%=*}: still, ${__rm#*=}"
      done < <(sort -u <<< "${CREW_MOTION[$tree]}")
    fi
  else
    echo "   │  ├─ $crew_glyph crew: $crew_state — $crew_who"
  fi
  echo "   │  ├─ $glyph tree: $verdict — $detail"
  echo "   │  └─ $ref"
done
}
