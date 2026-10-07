#!/usr/bin/env bash
######################################################################
# pollwork.summary — the footer: crew and tree tallies, boxes, stones, motion
#
# 🔴 .a PART of pollwork.sh — sourced, never executed, and only BY pollwork.sh.
#     git.crew.poll.sh sources pollwork.sh, which loads every part. see
#     __poll_load_parts there for why the poll is cut into parts at all.
#
# .holds = the __poll_render_summary stage
######################################################################

######################################################################
# __poll_render_summary — the crew summary, then each folded dimension
######################################################################
#
# .note = the body is the poll's own top-level code, moved VERBATIM and left
#         unindented, so `git diff --color-moved` and `git blame -C` trace
#         every line to its origin. a `declare` here carries `-g`: at top
#         level it was global, and a stage that shares its maps with the
#         stages after it must keep them so.
__poll_render_summary() {
# the CREW summary leads, because the crew is the subject. the tree
# tally follows as the dimension it carries
ATWORK=${CREWTALLY[at work]:-0}
DOWN=${CREWTALLY[down]:-0}
PHANTOM=${CREWTALLY[phantom]:-0}
ASLEEP=${CREWTALLY[asleep]:-0}

# .why `asleep` rides in the headline rather than a footnote: it is the count
#      of crews this sweep DID NOT READ, and a reader who takes the other three
#      as a total is owed that number in the same breath (term=partial-audit —
#      an instrument owes its reader the subject set it could not reach).
CREWSUM="$ATWORK at work, $DOWN down, $PHANTOM phantom"
(( ASLEEP > 0 )) && CREWSUM+=", $ASLEEP asleep"
echo "🦫 $ROWS crew(s) — $CREWSUM"

SUMMARY=""
for k in merged green awaited failed behind blocked draft "no pr" unpushed "in flight" "no work" closed "on grove" unknown timeout; do
  n=${TALLY[$k]:-0}
  (( n > 0 )) && SUMMARY+="$n $k, "
done
echo "   ├─ 🌲 trees — ${SUMMARY%, }"

# 🔴 .the DENOMINATOR for every tally below — the star scope's own bound
#
# .why it rides HERE rather than only in the ⭐ header
#   the header 1800 lines up already declares "N non-star crew(s) hidden", and
#   that declaration satisfies `rule.forbid.clipped-sweeps` for the CREW ROWS.
#   it does NOT reach the tallies: by the time a reader arrives at
#   `🙋 0 await approval` the header is ~30 render-lines behind them, and a
#   count reads as a claim about the FLEET because that is what a count is.
#
#   this file already learned that exact lesson one axis over, ~30 lines down:
#   "measured 2026-09-16: a supervisor read `34 … hidden` beside `0 … hidden`
#    as a self-contradiction … the render was correct; the word carried two
#    senses." a tally whose denominator the reader must reconstruct is a tally
#    that will be misread. the denominator must sit WITH the tally.
#
# 🔴 .measured 2026-09-17 — the babysit tick this was written from
#   one tick, two renders of the same fleet, eight counts apart:
#
#     tally                      star scope      --all      hidden
#     🙋 await approval          0               9          9
#     ✋ blocked                 0               7          7
#     🔍 in review               1               3          2
#     🌴 complete                0               1          1
#     🚧prompt                   1               4          3
#     🙋ask                      1               2          1
#     🪦absent                   1               4          3
#     🚦 status                  3 buckets       6 buckets  —
#
#   `🙋 0 await approval` is the sharpest: the babysit contract names that
#   very tally — "read the tallies: 🙋 await approval (the human's — surface
#   once)" — so a supervisor who obeys the contract reads 0, surfaces none of
#   them, and NINE human gates sit unsurfaced for another tick. captured
#   verbatim, beside its `--all` twin:
#   work/.test/.assets/render.poll.star-scope-tallies-omit-their-denominator.log
#
# ⚠️ .why ONE line rather than a bound per tally
#   all eight counts above are computed over the same filtered `TREES[@]`, so
#   they share one denominator. a per-tally bound would repeat that fact eight
#   times and still miss the ninth tally somebody adds tomorrow — the same
#   instance-not-class repair `rule.require.clamp-edge-cases` forbids, and the
#   same one the box tally below took THREE tries to stop making. keyed to the
#   scope rather than to any named tally, a count added tomorrow is bound the
#   day it ships.
if [[ "$STAR" == "true" ]] && (( STAR_HIDDEN > 0 )); then
  echo "   ├─ ⭐ every tally below counts the ${#TREES[@]} star(s) shown — NOT the ${STAR_HIDDEN} hidden"
  echo "   │   so a 0 here reads \"0 among the FUNDED\", never \"0 in the fleet\" — rhx git.crew.poll --all"
fi

# 🔴 .the TWIN bound, for the opposite scope — and the sharper of the two
#   the line above bounds a read that is DEEP and NARROW: every axis derived,
#   over 8 of 38 crews. this one bounds the read a supervisor reaches for to
#   escape that — `--all`, which widens to all 38 and, at :602, turns the box
#   and stone axes OFF to pay for it.
#
#   ⇒ so the two scopes are blind in opposite ways, and a supervisor who runs
#     BOTH still sees no modal on an unsponsored crew. one hides the tree; the
#     other hides the box.
#
# 🔴 .why the render owes this, in this file's OWN words (:581-601)
#   "gather neither and the enum finds no prompt, no `👋`, no `exhausted`, no
#    plea — so every arm falls through to its optimistic tail and the whole
#    fleet renders `inflight`" … "every row was wrong"
#   that argument was accepted and applied to the DENSE render, and `--all`
#   was carved out of the very cure it justifies. the carve-out is a COST
#   decision, never a claim the verdict got safer: `--all` is ~38 trees × ~5
#   roles of ssh pane reads against 8, so to force the axes on would make the
#   widest read the slowest, and a supervisor would stop to run it.
#
#   ⇒ the cost stands. what does NOT stand is a per-row verdict rendered over
#     evidence nobody gathered (term=false-report), from an instrument that
#     chose its own evidence set and left no trace of the choice
#     (term=partial-audit). so the scope is kept and the MARK is added.
#
# 🔴 .measured 2026-09-20 — the tick that wrote this
#   a supervisor ran `--star --stones`, `--healable`, and `--fellable`, and
#   saw ONE modal. `--all --stones` named NINE, seven of them idle 47–57m.
#   the human found one by hand and asked why it was halted:
#     --star --stones  box axis ON  · 30 of 38 crews hidden
#     --healable       fleet scope  · a modal is not a heal axis
#     --fellable       fleet scope  · merged trees only
#     --all            fleet scope  · box axis OFF        ← the hole
#   ⇒ not one read in the babysit contract names a modal on an unsponsored
#     crew. the two lines below are what tell a supervisor to reach for the
#     one combination that does.
if [[ "$ALL" == "true" ]] && [[ "$STONES" != "true" ]]; then
  echo "   ├─ ⚠️  SCOPE WIDE, EVIDENCE THIN — the BOX and STONE axes are NOT derived in this view"
  echo "   │   so every \`crew: at work\` below is an absence of evidence, never a state: no pane was read,"
  echo "   │   so no modal, plea, gate, or husk could be seen at all — rhx git.crew.poll --all --stones"
fi

# .what = the status tally, and the DECLARATION of everything the prune folded
#
# .why it is not optional
#   `rule.forbid.clipped-sweeps` permits a narrower scope ONLY where the render
#   states it. these two lines are the whole basis on which the idle prune is
#   legal: without them the default would be a `| tail` with better manners —
#   a fleet that reads complete while a third of it is absent.
#
#   ⚠️ so this prints even at zero. "0 hidden" is a measurement; an absent line
#   is indistinguishable from a sweep that never pruned, and the reader cannot
#   tell those apart at the moment it matters.
STATUSSUM=""
for k in husk limited inflight blocked:on-supervisor blocked:on-human blocked:on-defect frozen unread; do
  n=${STATUS_TALLY[$k]:-0}
  (( n > 0 )) && STATUSSUM+="$n $k · "
done
[[ -n "$STATUSSUM" ]] && echo "   ├─ 🚦 status — ${STATUSSUM% · }"

if [[ "$ALL" != "true" && "$IDLE_MINS" -gt 0 ]]; then
  HIDDEN_TOTAL=$(( HIDDEN_IDLE + HIDDEN_NOCLONE ))
  __idle_h=$(( IDLE_MINS / 60 ))
  # 🔴 named `cut`, NEVER `hidden`, and the denominator is stated.
  #    the ⭐ header 188 lines up already says "N non-star crew(s) hidden", so
  #    a second "hidden" here overloads one word onto two concepts
  #    (rule.forbid.domain-term-ambiguity) — and the two counts have DIFFERENT
  #    DENOMINATORS: the star line cuts from the whole fleet, this one cuts
  #    only from what survived the star filter.
  #
  #    measured 2026-09-16: a supervisor read `34 … hidden` beside `0 … hidden`
  #    as a self-contradiction, and reported it to a human as one. the render
  #    was correct; the word carried two senses. a tally whose denominator the
  #    reader must re-derive is a false report that only awaits a quote.
  #
  # 🔴 .and the cure for THAT collision walked into the next one — 2026-09-18
  #
  #    `cut` dodged the ⭐ header's `hidden`, and landed on the one verb that
  #    DEFINES the stone bucket two rows below. the declared cure table reads
  #      ✂️  clipped  judged, the TAIL was cut  -> widen the pane, then re-poll
  #    so this row shipped `✂️ … cut` two rows above `✂️ N clipped`. one glyph
  #    AND one verb, over two concepts of OPPOSITE valence:
  #      🗂️  folded   the tool CHOSE to elide a row — benign, `--all` widens
  #      ✂️  clipped  the tool COULD NOT READ a datum — a defect, owed a cure
  #
  #    ⇒ conflate them and a deliberate elision reads as an unreadable datum,
  #      which is the `partial-audit` shape exactly: a render that cannot say
  #      whether it chose to show less or failed to see.
  #
  # ⚠️ .this file already paid for this lesson once and did not generalize it:
  #    the `clipped` note calls out that its own shipped glyph `❓` was "a
  #    near-twin of `❔` … one concept, one symbol". the SAME collision sat two
  #    rows up, un-noticed, because the fix was applied to the glyph in hand
  #    rather than to the palette (rule.require.enumerate-before-you-name).
  #
  # ✅ .`folded` is NOT a coinage — it is this file's own word for this exact
  #    count, in the prose that describes it (:113, :2107, :3484 — the footer's
  #    own DECLARATION of what the prune folded). only the RENDER had drifted
  #    off it, so the repair is a conform, never a rename
  #    (rule.forbid.domain-term-inconsistency). and it keeps what the 09-16
  #    decision bought: it is not `hidden`, so the ⭐ header stays unambiguous.
  echo "   ├─ 🗂️  $HIDDEN_TOTAL of the ${#TREES[@]} shown folded — $HIDDEN_NOCLONE with no live clone, $HIDDEN_IDLE still > ${__idle_h}h — rhx git.crew.poll --all"
fi

# .why the motion tally rides here rather than behind a flag of its own
#   it costs NAUGHT to print — the delegated `duct.poll --brief` already
#   measured it, and this sweep already paid for that call. the alternative
#   the babysit tick was left with was a whole SECOND duct sweep, which is
#   both dearer and less true (a mover's baseline is refreshed by the first
#   call, so the second reports it unchanged).
#
#   ⚠️ it is a DUCT count, never a crew count — one crew holds several ducts,
#   and a foreman shell moves on its own. say so on the line, or a reader
#   will bank it as "N crews moved" (term=false-report, the reader-inference
#   family). the streak the pause rule counts is "did the fleet move at all",
#   which this answers exactly.
if [[ "$BOXES" == "true" && -n "$DUCT_CHANGED" ]]; then
  echo "   ├─ 🌊 ducts moved — $DUCT_CHANGED changed, ${DUCT_STILL:-?} unchanged (since the prior poll)"
fi

# .what = tally every live stone by WHO owns the halt it names
#
# .why  = the per-crew rows say where each tree SITS; they do not answer the
#         question a tick opens with — how many halts are the DRIVER's to work
#         and how many are the human's. a reader had to open every block and
#         sort them by hand, which is the byhand loop one layer up
#         (rule.require.bulk-over-byhand). it costs naught: --boxes already
#         gathered the stones, so this is arithmetic over data in hand.
#
# ⚠️ .why the key is the PHASE token, and NEVER the route's own ✋/👋 glyph
#   the glyph spans both owners, so it cannot carry the split:
#
#     1.vision, judge, approved? 👋           -> the HUMAN's
#     review.peer, l3@i003, exhausted 👋      -> the DRIVER's
#
#   both wear 👋. a tally keyed on it would score an exhausted reviewer as
#   "human" and put a driver-owned halt in front of a human — the exact
#   misroute rule.require.nudge-parked-clones:83 names, committed here in the
#   SWEEP's voice and over the whole fleet at once.
#
#   `judge, approved?` is determinate: `--as approved` is human-only by
#   rule.forbid.self-grant-human-gates. every review.peer / review.self /
#   yield state is the driver's, budget included. that is a CONTENT key,
#   which is the r1/r2 lesson this file already carries at its box arm.
#
# .note = it counts a halt's OWNER, never whether a clone is stuck. a stone is
#         the route's last SETTLED state, so a tree mid-re-arrive still reads
#         `blocked` — observed, this very sweep, on fix-node-pty-install. join
#         it to the 🧊 still age before you act; the count is an observation
#         and renders no verdict (term=volunteered-diagnosis).
# 🔴 .why a CLIPPED stone gets its own bucket, and never the catch-all
#   the verdict word sits at the END of a stone (`…, l3@i009, blocked ✋`), so a
#   narrow pane truncates the one token this tally keys on and leaves the phase
#   token — the part it does not key on — intact.
#
#   the catch-all then did the damage. `*)` means "no halt word matched", which
#   is TRUE of a healthy in-review stone and equally true of a stone whose halt
#   word was cut off. so an unreadable stone was not dropped; it was counted as
#   `🔍 in review` — the benign bucket — and the tally read as though the fleet
#   were healthier than it was.
#
#   measured 2026-09-03. `rhachet.beav.fix-keyrack-all-skips-manifest` rendered
#   `🗿 mechanic: 5.3.verification, re…` against a 27-column pane. it was halted
#   on API 500/529 and had not moved in 167m. the tally scored it `in review`,
#   the sweep reported `✋ 2 blocked`, and the human — who read the pane direct,
#   at full width — asked why a third halt went unflagged.
#
#   ⚠️ the ORDER carries weight. a stone cut AFTER its verdict word
#   (`…, l3@i009, blocked ✋…`) is still readably blocked, so the halt arms must
#   match first and the ellipsis arm sits between them and the catch-all.
#
#   ⇒ `term=false-report`: the arithmetic was correct over the strings it held,
#     and the sentence it rendered was untrue of the fleet. the cure is the one
#     this file already applies elsewhere — never let an unreadable datum inherit
#     a healthy verdict; give it a bucket that says it was unreadable.
#
# 🔴 .why the bucket is CLIPPED and never `unread`
#   this bucket shipped as `❓ N unread`, and that was an overload — caught the
#   same session, by the term sweep, before it left the branch.
#
#   `unread` is already declared at `term=duct.box.unread`, and it means, wholly,
#   THE CAPTURE CAME BACK EMPTY, so no pane was judged. that is the opposite of
#   this bucket: here the capture came back FINE, the pane WAS judged, and the
#   source stone exists in full — only the surface that rendered it was too narrow
#   to carry the tail.
#
#   the tell is the CURE, which is the same test `unread` itself uses to part from
#   `unknown` and from `asleep`:
#
#     ❔ unread   the capture was empty        -> re-read the duct
#     ❔ unknown  judged, no arm matched       -> read the text on the row
#     🔎 unread   the tree could not be read   -> drill in by name
#     ✂️  clipped  judged, the TAIL was cut     -> widen the pane, then re-poll
#
#   four cures, and `unread` held three of them. worse, the shipped glyph was `❓`
#   — a near-twin of `❔`, which is `duct.box.unread`'s. one concept, one symbol:
#   a near-identical glyph for a different concept is the collision the glyph
#   catalog exists to refuse.
#
#   `clipped` is the render word. to clip is to cut the part of a render that
#   falls outside the viewport; the source is untouched. that is precisely the
#   fact here. `truncated` was weighed and set aside — it reads as an operation
#   performed ON the datum, and the datum was never altered.
# 🔴 .why a 🙋 is joined to MOTION before it is called a gate
#   a stone is the route's last SETTLED state, and a live turn is not a
#   transition — so a clone mid-drive still renders the gate it last stopped at.
#   the 🙋 arm therefore counts two populations that take opposite moves:
#
#     parked at the gate  -> the human's. surface it, once per state change
#     mid-turn, gate stale -> nobody's. leave it. a surfaced gate here spends
#                             the human's attention on a clone that is at work
#
#   🟢 the discriminator costs no new read: CREW_MOTION holds ONLY ducts that
#   did not move this poll, so a role ABSENT from it took a turn — and a clone
#   that just took a turn is not parked. one lookup, already measured.
#
#   measured 2026-09-03, three consecutive ticks on
#   `rhachet-roles-bhrain.beav.feat-peer-review-parallelism`: its status line
#   read `1.vision, judge, approved? 👋` on every one, while its pane showed a
#   climbing timer and `.taken.by_self` files under active write. three ticks,
#   three drill-ins, one answer — the exact byhand loop the sweep exists to
#   retire (rule.require.bulk-over-byhand). on the same ticks its peer
#   `fix-exhausted-level-unlocks-next` rendered the identical string and WAS
#   genuinely parked, having said so in words.
#
# ⚠️ .note = the split narrows the drill-in; it never replaces it. a clone may
#         legitimately drive work BELOW a gate that is also real — observed on
#         `feat-subconscious-term-distill`, which moved AND was parked. so a
#         mover is "do not surface yet", never "no gate exists".
if [[ "$BOXES" == "true" && "${#CREW_STONES[@]}" -gt 0 ]]; then
  STONE_HUMAN=0; STONE_STUCK=0; STONE_INWORK=0; STONE_CLIPPED=0; STONE_HUMAN_MOVED=0
  STONE_RELIC=0; STONE_DONE=0
  STONE_CLIPPED_WHO=""
  for __st in "${!CREW_STONES[@]}"; do
    while IFS= read -r __sr; do
      [[ -n "$__sr" ]] || continue
      case "${__sr#*=}" in
        *'judge, approved?'*)
          (( STONE_HUMAN++ ))
          # absent from the still-map => this duct moved => not parked
          if ! printf '%s\n' "${CREW_MOTION[$__st]:-}" | grep -qa "^${__sr%%=*}="; then
            (( STONE_HUMAN_MOVED++ ))
          fi
          ;;
        *blocked*|*exhausted*|*malfunction*)  (( STONE_STUCK++ ))   ;;
        # 🔴 a RELIC is not a stone at all, and it was the largest share of the
        #   `🔍 in review` bucket for the life of this tally.
        #
        #   duct.poll emits this exact text where `box == none || husk` — no
        #   live clone sits in that pane, so its 🗿 line records a state that
        #   has PASSED (term=duct.pane.relic, whose whole subject is a line
        #   true as a record and false when a reader takes it as current).
        #
        #   ⇒ to count it `in review` asserts a clone is mid-review in a seat
        #     that holds no clone. and it is the NORM, never an edge case: a
        #     crew's foreman, reflector, and two reviewer seats are bare shells
        #     by design, so 4 of every 5 rows are relics.
        #
        #   measured 2026-09-16, star scope, 5 crews: the tally read
        #   `🔍 23 in review` where the render showed ONE stone in review — 20
        #   relics and 2 `route complete` made up the other 22.
        #
        # ⚠️ it is EXCLUDED from the tally rather than given a bucket of its
        #   own: a count that is always ~80% and never actionable is noise on
        #   the one row a supervisor reads every tick. the exclusion is STATED
        #   on the row, so it is not a silent omission (term=partial-audit).
        relic*)                               (( STONE_RELIC++ ))   ;;
        # 🔴 `route complete 🌴🤙` is DONE — the exact opposite of in review,
        #   and the most actionable state in the whole tally: it awaits a
        #   HUMAN's commit quota and release auth. folded into `🔍 in review`
        #   it read as a crew still at work, so the gate went unsurfaced.
        *'route complete'*)                   (( STONE_DONE++ ))    ;;
        # 🔴 the clipped stone is NAMED, never merely counted
        #
        #    the cure is "widen the pane, then re-poll" — and a pane is widened
        #    one duct at a time, so a bare count is an instruction with no
        #    subject. measured 2026-09-11: `✂️ 1 clipped` shipped beside 43
        #    crews and named none of them, so the only way to act on it was to
        #    re-scan the whole sweep by eye for a `…` at a line's end.
        #
        # ⚠️ this is the `rule.forbid.clipped-sweeps` shape turned on the render
        #    itself: a tally that reports a defect it will not locate leaves the
        #    reader to redo the scan the sweep already performed.
        # 🔴 `🔍 in review` keys on its OWN glyph, never on "no other arm matched"
        #
        #    every genuine in-review stone the route prints carries 🔍:
        #      review.peer, l3@i016 🔍   ·   review.self, r2/r5 🔍
        #    so the verdict has a token, and the arm can name it. it did not —
        #    it was the ladder's DEFAULT, which made `🔍` mean "unmatched".
        #
        # ⇒ rule.require.enumerate-before-you-name: an arm named for a catch-all
        #    where it meant ONE verdict, so every malformed stone landed in it.
        #    the same shape duct.poll.sh:1168 records for the `empty` box arm.
        *'🔍'*)                               (( STONE_INWORK++ ))  ;;
        # 🔴 `yield 🌾` is 🔍's DECLARED PEER, and for the life of this ladder it
        #   had no arm — so it fell to the clipped default and read as a DEFECT
        #
        #   this file already names the pair twice, in its own prose:
        #     :2664  "the stone reads whatever it read before the wall —
        #             `🔍` or `yield 🌾`"
        #     crewwork.pane.integration.test.ts
        #            "so it reads `🔍` or `yield 🌾`, which routes to the DRIVER"
        #
        #   ⇒ one action, two glyphs: the driver is at work and the supervisor
        #     sends naught. so it belongs in the driver's bucket.
        #
        # 🔴 .measured 2026-09-18, two consecutive ticks on
        #   `rhachet-roles-bhrain.beav.feat-acceptance-under-5min`:
        #     🗿 5.1.execution.from_vision, yield 🌾
        #   the row is COMPLETE — ONE SGR run, no second run mid-row — and the
        #   `crew.refresh` the clipped row emits repainted at 189 cols and
        #   returned it byte-identical. BOTH causes that row enumerates are
        #   refuted: not WRAPPED (the pane is wide), not OVERWRITTEN (one run).
        #
        # ⚠️ .this INVERTS the bias note below. that note argues a false clip is
        #   cheap — "one glance and one crew.refresh" — and it holds for a shape
        #   nobody enumerated ONCE. this shape recurs on EVERY tick a driver sits
        #   mid-yield, so the glance and the null call are charged per tick while
        #   the tally reports a defect over a healthy fleet (term=false-report).
        #
        # ⚠️ .the known nitpick: `🔍 N in review` now counts a stone that emits a
        #   YIELD rather than one under review. the precise repair is a widened
        #   label, and that would edit a CAPTURED production render
        #   (work/.test/.assets/render.poll.star-scope-tallies-omit-their-
        #   denominator.log:46). a captured asset is evidence, never a draft —
        #   so the imprecision is recorded rather than taken silently.
        #
        # ⇒ rule.require.enumerate-before-you-name, the same shape the `🔍` arm
        #   above was cured for — one verdict further down the same ladder.
        *'🌾'*)                               (( STONE_INWORK++ ))  ;;
        # 🔴 the clipped arm is the DEFAULT, because by construction it is exact
        #
        #    every verdict arm runs above this one, so a stone that reaches here
        #    reached NO verdict — which is precisely what `clipped` means:
        #    "judged, the TAIL was cut". the trailing `…` was one SYMPTOM of that,
        #    and it keyed on the symptom rather than the condition.
        #
        # 🔴 .why the symptom is not enough — measured 2026-09-17, feat-telepath-role
        #    claude draws its statusline as ONE terminal row: the stone at the left,
        #    a usage/context banner at the right. on a pane too narrow to hold both,
        #    the stone is cut and the banner is drawn over the cut point — so the
        #    `…` the route would have printed never survives:
        #
        #      🗿 5.1.execution.from_vision, review.peer, l3You've used 81% of
        #                                                 └─ the banner, where the
        #                                                    verdict and the `…` were
        #
        #    that row ends in `of`, so `*'…'` missed it and `*)` counted it
        #    `🔍 in review`. the crew was NOT in review — it was unreadable — and
        #    `✂️ 0 clipped` shipped beside it, which the note below calls "a positive
        #    assertion that every stone was read to its end". it was false.
        #    the `rhx git.crew.refresh` cure this arm emits went unsurfaced.
        #
        #    captured verbatim, both measured rows in one file:
        #    work/.test/.assets/pane.stone.statusline-banner-overwrites-the-clip-marker.log
        #
        # ⚠️ .why the banner is not CUT at the source instead
        #    that was the first cure drafted, and the capture refuted it. the seam
        #    looks like a colour change and is not: claude wraps EVERY WORD in its
        #    own SGR pair, and on the second measured row the stone's `✋` and the
        #    banner's `new task?` share ONE run at ONE colour —
        #      [38;5;246mblocked[39m [38;5;246m✋new task? [38;5;153m/clear
        #    so a cut at the first SGR after 🗿 yields `🗿…`. there is no structural
        #    seam to cut on, and a phrase blocklist would drift with every status
        #    item claude adds. ⇒ so the fact is recovered where it is EXACT —
        #    at the verdict, which the ladder above already enumerates in full.
        #
        # ⚠️ .the bias, and it is deliberate: a stone shape nobody enumerated now
        #    reads `clipped` rather than `in review`. a false clip costs one glance
        #    and one `crew.refresh` — which is non-destructive by construction
        #    (crewwork.sh:2868). a false `in review` hides a stuck crew, which is
        #    the harm measured above. the asymmetry runs one way.
        *)
          (( STONE_CLIPPED++ ))
          STONE_CLIPPED_WHO+="${__st}/${__sr%%=*}"$'\n'
          ;;
      esac
    done < <(sort -u <<< "${CREW_STONES[$__st]}")
  done
  # 🔴 .the seat that holds a LIVE clone and files NO stone row — counted nowhere
  #
  #   `__crew_record_stone` returns early where the 🗿 line could not be parsed
  #   (:1237, `[[ -n "$stone" ]] || return 0`), so such a seat files no row at
  #   all. the ladder above walks CREW_STONES, so it never sees the seat — and
  #   the `✂️ clipped` default arm cannot catch it either: clipped grades a row
  #   that EXISTS whose tail was cut, and here there is no row to grade.
  #
  #   ⇒ the seat falls out of BOTH the buckets and the `hold no clone`
  #     parenthetical, so the tally's denominator silently shrinks.
  #
  # 🔴 measured 2026-09-17, star scope, 4 crews: the row read
  #   `🙋 0 await approval` while `feat-acceptance-under-5min/mechanic` held a
  #   live clone whose pane printed `route.stone.set --stone 1.vision --as
  #   approved` — a HUMAN-only grant. an ask widget covered its statusline, so
  #   no 🗿 line was emitted, so the seat was counted nowhere, and the one row a
  #   supervisor reads every tick asserted that no gate awaited them.
  #
  # ⚠️ .why this is STATED rather than given a bucket or a glyph of its own
  #   it is the relic parenthetical's exact argument (:3795 below), applied to
  #   the symmetric case: neither a stone state nor an anomaly, but a count a
  #   reader needs to check the arithmetic against the render above
  #   (term=partial-audit). and it takes NO new word — `clipped`, `relic`,
  #   `unread`, and `covered` are each spoken for, and a fifth sense hung on any
  #   of them is the one-word-two-concepts defect this file cured on 2026-09-17
  #   one row up (rule.forbid.domain-term-ambiguity).
  #
  # 🔴 .why the count is SPLIT by whether the grove answered — measured 2026-09-20
  #   this block emits a `crew.read` per seat as its cure, and a read needs a box
  #   to answer it. on a tree whose grove is UNREACHED there is none: the boxes
  #   this loop walks come from the local duct REGISTRY (arm 3, :1613), which
  #   records what the LAST successful poll saw — so a seat on an unreached grove
  #   carries a box that reads live, with no live read behind it.
  #
  #   the render then said three things at once about one tree, four lines apart:
  #     ├─ ⚠️  UNREACHED: grove-sandpine-v20260901 …      ← we could not look
  #     ├─ 😴 unread — …feat-acceptance-under-5min      ← we could not look
  #     │    🗿 reviewer.take: relic — no live clone in this pane
  #     │  └─ 🤐 a live clone whose 🗿 line never rendered — an overlay …
  #   `relic` and `🤐` are contradictory claims about the same unread tree, and
  #   NEITHER is earned, because no pane was read (term=false-report).
  #
  # ⚠️ and the cost is a DECISION, never a cosmetic one. the 🤐 guide reads
  #   "read each seat before you trust a 0", so a supervisor runs the lines it
  #   emits. measured: 4 of 4 `crew.read` calls exited 1 with
  #   `cannot reach 'grove-sandpine-v20260901' … fix: rhx git.grove.wake` — the
  #   cure was named by the header the whole time, one screen up.
  #
  # ⚠️ .why SPLIT rather than SKIPPED. to drop these seats would shrink the
  #   tally's denominator with no trace, which is the exact partial-audit this
  #   parenthetical exists to prevent (term=partial-audit). both populations are
  #   counted; they differ only in the claim made about them and the cure emitted.
  STONE_NOSTONE=0; STONE_NOSTONE_WHO=""
  STONE_NOSTONE_ASLEEP=0; STONE_NOSTONE_ASLEEP_WHO=""
  for __ns_t in "${!CREW_BOXES[@]}"; do
    # 🔴 the at-work gate, as at :3996 — a box row under a crew that is NOT at
    #   work is a record of a pane that has passed, so to count it here would
    #   sweep dead crews into a live-seat count. that is defect #3 of [case17],
    #   whose whole subject is this exact class ("a partial audit whose every
    #   repair was itself one") — and its structural walk caught this loop on
    #   the day it landed, which is what it was built to do.
    [[ -n "${CREW_ROLES[$__ns_t]:-}" ]] || continue
    for __ns_rb in ${CREW_BOXES[$__ns_t]}; do
      __ns_role="${__ns_rb%%:*}"; __ns_box="${__ns_rb#*:}"
      # a seat with no live clone belongs to the RELIC count, never to this one
      case "$__ns_box" in shell|husk|'🪦absent') continue ;; esac
      if printf '%s\n' "${CREW_STONES[$__ns_t]:-}" | grep -qa "^${__ns_role}="; then continue; fi
      # 🔴 the grove join, off the LEDGER — never off CREW_HOST
      #
      #   the first cut of this read `CREW_HOST[canon]`, which is the map the
      #   render layer reaches for everywhere else. it went INERT in prod: a
      #   probe on 2026-09-20 showed the key PRESENT for every grove tree and
      #   its value the EMPTY STRING, which this arm reads as "here". so every
      #   seat fell to the live bucket and the render came back byte-identical
      #   to the defect it was built to cure.
      #
      #   ⚠️ CREW_HOST is a CORRELATE of the grove, and it has two writers:
      #      arm 1 sets it from a LIVE tmux list, which never runs for a grove
      #      that refused to answer, and arm 2 backfills from the ledger. the
      #      ledger row is the AUTHORITY under both. so read the authority.
      #
      #   `''` = here. `__crew_host_unreached ''` is false anyway, so a local
      #   seat lands in the reachable arm as it should.
      __ns_grove="$(__crew_ledger_grove_of "$__ns_t")"
      __ns_host="$(__crew_grove_host "${__ns_grove:-local}" 2>/dev/null || printf '')"
      if [[ -n "$__ns_host" ]] && __crew_host_unreached "$__ns_host"; then
        (( STONE_NOSTONE_ASLEEP++ ))
        STONE_NOSTONE_ASLEEP_WHO+="${__ns_t}/${__ns_role}=${__ns_host}"$'\n'
        continue
      fi
      (( STONE_NOSTONE++ ))
      STONE_NOSTONE_WHO+="${__ns_t}/${__ns_role}"$'\n'
    done
  done
  if (( STONE_HUMAN + STONE_STUCK + STONE_INWORK + STONE_CLIPPED + STONE_DONE + STONE_NOSTONE + STONE_NOSTONE_ASLEEP > 0 )); then
    # .why the label reads "read to see who", never "the driver's"
    #   `blocked:on-defect` is a stone whose review ladder rendered `blocked ✋`
    #   — a fact about the STONE, not a claim about who cures it. measured
    #   2026-09-13: of 4 such rows read in one tick, every one needed a human
    #   decision (a cross-repo value only they hold, a fulcrum verdict, a
    #   branch choice, a privilege grant) — none converged at the supervisor's
    #   own hand. to label the row "(the driver's)" is the same fused
    #   diagnosis-in-a-measurement this file already forbids at the stone
    #   read itself (term=volunteered-diagnosis) — it just moved to the tally.
    # .why the relic count rides in a PARENTHETICAL rather than as a bucket
    #   it is neither a stone state nor an anomaly — it is the count of seats
    #   with no clone, which is ~80% of every fleet by design. as a bucket it
    #   would dominate the row it sits on; omitted entirely it would be a
    #   silent exclusion, and a reader could not check the arithmetic against
    #   the render above (term=partial-audit). stated, it is neither.
    # .why the asleep term rides the SAME parenthetical rather than its own row
    #   it is the third member of one family — seats the stone tallies above do
    #   not hold — so a reader checks the arithmetic in one place. and it is
    #   stated even at 0 the moment any of the three is non-zero, for the reason
    #   `✂️ 0 clipped` is stated below: an elided term cannot be told apart from
    #   a term that was never computed.
    __ns_paren="+$STONE_RELIC seat(s) hold no clone, +$STONE_NOSTONE live seat(s) rendered no stone"
    (( STONE_NOSTONE_ASLEEP > 0 )) && __ns_paren+=", +$STONE_NOSTONE_ASLEEP seat(s) on an UNREACHED grove — NOT read"
    echo "   ├─ 🗿 stones — 🙋 $STONE_HUMAN await approval · ✋ $STONE_STUCK blocked (read to see who) · 🔍 $STONE_INWORK in review · 🌴 $STONE_DONE complete · ✂️ $STONE_CLIPPED clipped  ($__ns_paren)"
    # 🔴 a live seat that rendered no stone is the one bucket whose members are
    #   NAMED, because its cure is a read and a read needs a subject. the count
    #   alone would say "the tallies above are short" and leave the reader to
    #   find by hand which seat went silent (rule.require.bulk-over-byhand).
    # 🔴 the row once named ONE cause — "an overlay (ask widget, modal, survey)
    #   covers the statusline" — and the counter cannot see that. it knows only
    #   that a live box rendered no 🗿. WHY is not a fact this sweep holds, so
    #   the clause was a volunteered diagnosis in the tool's own voice.
    #
    #   measured 2026-09-20, star scope: the row named 3 seats, all 3 were read
    #   --raw, and NOT ONE carried an overlay. each returned a clean box — prose,
    #   a bare ❯, and the mode line with no 🗿 above it. the decisive seat is an
    #   ACHIEVEMENT tree, which carries no route by construction, so it can never
    #   render a stone and no overlay is ever involved.
    #
    # ⇒ the cost was a HUNT: one read per seat to learn there was no modal —
    #   the null call rule.require.poll-recommends-every-cure-heal-has grades a
    #   defect, and the same shape the ✂️ row below already fixed for itself.
    #
    # ✅ the MOVE is unchanged. "read each seat" stayed right under both causes
    #   (those 3 reads surfaced 2 commit-quota gates). only the promise of what
    #   the read would SHOW was wrong, so this states both and hands over the
    #   discriminator rather than a verdict.
    if (( STONE_NOSTONE > 0 )); then
      echo "   │  └─ 🤐 a live clone whose 🗿 line never rendered — two causes, and only ONE hides a gate"
      echo "   │     ├─ OVERLAID — an ask widget, modal, or survey drew over the statusline, so the"
      echo "   │     │  seat may hold a gate nobody has answered"
      echo "   │     └─ UNDRAWN — the clone rendered no stone at all: a route complete or unbound (an"
      echo "   │        achievement tree has none by construction), or a turn that ended with no redraw"
      echo "   │        ⇒ tell them apart: read --raw. an overlay is VISIBLE in the pane; an undrawn"
      echo "   │        stone leaves a CLEAN box — the mode line, and no 🗿 above it"
      echo "   │     ⇒ either way its stone is absent from EVERY tally above, so a 🙋/✋ count is a"
      echo "   │       floor here, never a total. read each seat before you trust a 0"
      while IFS= read -r __nw; do
        [[ -n "$__nw" ]] || continue
        echo "   │     └─ ${__nw%%/*} / ${__nw##*/} — rhx git.crew.read --tree ${__nw%%/*} --who ${__nw##*/} --raw --lines 40"
      done <<< "$STONE_NOSTONE_WHO"
    fi
    # 🔴 the UNREACHED arm. it makes NO claim about the clone and emits NO read —
    #   the box behind these seats is a registry record of the last poll that
    #   succeeded, so `live` is unearned and a `crew.read` here exits 1. the one
    #   cure is the grove's, and the header named it already.
    if (( STONE_NOSTONE_ASLEEP > 0 )); then
      echo "   │  └─ 😴 a seat on a grove that did not ANSWER — its box is the duct registry's"
      echo "   │     record of the last poll that reached it, never a live read. so it is absent"
      echo "   │     from EVERY tally above and not one line here is a claim about the clone:"
      echo "   │     present and absent are both possible. ⛔ a crew.read exits 1 — wake first"
      while IFS= read -r __na; do
        [[ -n "$__na" ]] || continue
        __na_seat="${__na%%=*}"; __na_grove="${__na##*=}"
        echo "   │     └─ ${__na_seat%%/*} / ${__na_seat##*/} — rhx git.grove.wake ${__na_grove}"
      done <<< "$STONE_NOSTONE_ASLEEP_WHO"
    fi
    # the zero is stated rather than elided, on purpose: `✂️ 0 clipped` is a
    # positive assertion that every stone was read to its end. an elided term
    # would be indistinguishable from a term that was never computed.
    # a full `if` rather than `(( )) && echo`: the arithmetic form returns 1 on
    # a zero count, and as the last statement of this block that would abort the
    # whole sweep the day somebody adds `set -e` to line 215.
    if (( STONE_HUMAN_MOVED > 0 )); then
      echo "   │  ├─ ⚠️  $STONE_HUMAN_MOVED of the 🙋 MOVED this poll — a route records only settled"
      echo "   │  │   transitions, so a clone mid-turn still renders its last gate. read before you surface"
    fi
    if (( STONE_CLIPPED > 0 )); then
      # 🔴 the clip has TWO causes, and only ONE of them a refresh cures
      #
      #    this row read "the pane is too narrow. widen it, then re-poll" and
      #    named `crew.refresh` as the whole cure. measured 2026-09-17 on
      #    rhachet-roles-bhrain.beav.feat-telepath-role, that recommendation was
      #    a NULL CALL — the refresh repainted at 93 cols and the row came back
      #    byte-identical, because the pane was never narrow:
      #
      #      ESC[37m🗿 5.1.execution.from_vision, review.peer, l3ESC[93mYou've used 81% of ESC[39m
      #
      #    two SGR runs on ONE unwrapped row — the stone in 37, a statusline
      #    banner in 93 drawn straight over the stone's own cells. a repaint
      #    faithfully reproduces an overwrite, so refresh cannot reach it.
      #
      # ⇒ rule.require.poll-recommends-every-cure-heal-has: a detector that
      #   names one cure for a class with two causes sends the supervisor to
      #   spend a tick on a move that cannot work, and the row still reads
      #   `✂️` next tick with no hint that the cure was the wrong one.
      #
      # ⚠️ the discriminator is cheap, so the row states it rather than guess:
      #   a WRAPPED tail on the next line is geometry (refresh cures it); a
      #   SECOND SGR run mid-row is an overwrite (it does not).
      echo "   │  └─ ✂️ a stone cut off before its verdict — two causes, and a refresh cures only one"
      echo "   │     ├─ WRAPPED — the pane is too narrow, so the tail spilled. widen it, then re-poll"
      echo "   │     └─ OVERWRITTEN — a statusline banner drew over the row. a refresh is a NULL CALL"
      echo "   │        here; the row stays unreadable until the clone redraws it, so re-poll next tick"
      echo "   │        ⇒ tell them apart: read --raw. a second SGR run MID-ROW is an overwrite"
      while IFS= read -r __cw; do
        [[ -n "$__cw" ]] || continue
        echo "   │     └─ ${__cw%%/*} / ${__cw##*/} — if WRAPPED: rhx git.crew.refresh --tree ${__cw%%/*}"
      done <<< "$STONE_CLIPPED_WHO"
    fi
  fi
fi

# .what = tally every role whose box is NOT empty, one line per box state
#
# ⚠️ .why it is not a term of the stone line, and why its absence was a defect
#   a role whose box is not `empty` renders NO stone row, and that is duct.poll's
#   deliberate design rather than an accident of its layout:
#
#     "the stone rides ONLY on `empty`: every other verdict already names its
#      own move. `empty` names none"                        (duct.poll.sh:585)
#
#   so the stone tally's subject set is "roles whose box is empty", while the
#   line reads as the whole fleet: on 2026-09-01 it summed to 5 against 7
#   at-work crews, and the 2 it dropped were both 🚧prompt.
#
#   that is a partial audit in the sweep's own voice (term=partial-audit,
#   mechanism 2 — the instrument chose the subject set and the verdict carried
#   no trace of what it excluded). worse, it dropped the ONE state a tick is
#   most owed: a modal is a clone stopped at a keyboard nobody watches.
#
#   the cure is an honest line per box state rather than one merged count. a
#   box state is not a stone, so it does not belong as a term OF the stone line
#   — it is counted from the BOX map, which is the artifact that records it.
#
# ⚠️ .the FIRST cure was itself a partial audit — the same defect, one state over
#   it counted `🚧` ALONE. every other non-empty state suppresses the stone
#   identically, so ~4h later the same line read 3+0+2 = 5 against 7 at work
#   again — and this time the 2 it dropped were both 📬queued.
#
#   the repair had reached the INSTANCE and not the CLASS, which is the exact
#   move rule.require.clamp-edge-cases forbids: "clamp the boundary, not just
#   the one value that broke". the boundary is `empty`; the class is its whole
#   complement. so this keys on NOT-empty rather than on a named state, and a
#   box state duct.poll adds tomorrow is counted the day it ships.
#
# .note = `shell` is excluded, and it is not an exception to the class: a plain
#         shell holds no claude session, so it never held a stone to suppress.
#         to count it would post a row per idle foreman that names no work.
#
# ⚠️ .the SECOND cure over-counted — the subject set was wrong the OTHER way
#   keyed on NOT-empty alone, it swept every key in CREW_BOXES — `down` and
#   `phantom` crews among them, whose rows the fleet never renders. it reported
#   `❔unknown × 2` where exactly ONE at-work role held that box, so a reader
#   could not reconcile the count against a row on screen.
#
#   this file already carried the rule that forbids it, ~170 lines up at the
#   crew line's own bound: under `down` or `phantom` the boxes "name registry
#   rows, never live roles, so the premise fails and so does the substitution."
#   a registry row is not a role at a keyboard, and only a role can hold a stone
#   to suppress.
#
#   ⇒ so THREE cures in a row each got the subject set wrong, in three
#     directions: the stone tally dropped live roles, the 🚧 fix dropped live
#     states, and this one swept in dead crews. that is a partial audit whose
#     every repair was itself one — and it is what a bound stated in prose
#     rather than in code buys you.
#
#   the cure is to SHARE the bound rather than restate it: the tally now gates
#   on `CREW_ROLES[$tree]` non-empty, which is the very expression the crew line
#   derives `at work` from. the two cannot drift, because there is only one.
#
# .note = each row states WHAT was excluded and renders no move, because the
#         moves differ per state by design (see `.the BOX verdicts` above) and
#         one line cannot carry six. the state token is the reader's key, and
#         a single wrong prescription would cost more than the absent one.
#
# .also = the same walk joins the box to its MOTION, and that join is an ACTION
#
# ⚠️ .why a non-empty box that did NOT move is the row that costs dead time
#   the sweep already held both halves and rendered them APART: the box state on
#   the crew line, the still age two rows below it. a reader had to join them by
#   eye to see the one state nobody is on.
#
#   observed 2026-09-01. a human typed into a mechanic's box and walked away
#   without a submit. the box read `❔unknown`, the duct read `still, 14m`, and
#   the two facts sat in the SAME crew row, unjoined. the clone was parked the
#   whole interval on a message already written to it — and the human believed
#   they had answered. a `--raw` check found the text at normal intensity in the
#   live box, so one `--keys Enter` cleared it.
#
#   every non-empty box earns the join, and each for its own reason:
#     🚧prompt     a modal nobody answered
#     ✍️prefilled  text typed and never submitted
#     📬queued     a queue that is not drained
#     ❔unknown    unreadable AND inert
#
#   so no threshold is needed and none is invented: STILL is itself the signal,
#   because a duct that moved is a duct somebody is on.
#
# ⚠️ .the join is the ACTION — never a diagnosis of it
#   WHY a box did not move is unknowable from here, and the four causes above
#   take four different moves. so this names the ONE move that is correct under
#   every one of them — a read — and renders no verdict about which case it is
#   (`term=volunteered-diagnosis`: emit the observable, withhold the reasoned).
if [[ "$BOXES" == "true" && "${#CREW_BOXES[@]}" -gt 0 ]]; then
  declare -gA BOX_TALLY=()
  declare -gA BOX_WHO=()
  STALLED_BOXES=()
  for __bt in "${!CREW_BOXES[@]}"; do
    # the at-work gate, shared with the crew line rather than restated
    [[ -n "${CREW_ROLES[$__bt]:-}" ]] || continue
    for __br in $(printf '%s\n' ${CREW_BOXES[$__bt]} | sort -u); do
      __bs="${__br#*:}"
      case "$__bs" in empty|shell|'') continue ;; esac
      BOX_TALLY["$__bs"]=$(( ${BOX_TALLY["$__bs"]:-0} + 1 ))
      __brole="${__br%%:*}"

      # 🔴 the tallied roles are NAMED, never only counted
      #
      #    a state token is the reader's key, and the row below prescribes no
      #    move on purpose — the moves differ per state. but a reader who knows
      #    the move still cannot take it, because the count names no subject.
      #
      #    measured 2026-09-11: `🚧prompt × 3` on a 43-crew fleet. a modal is a
      #    clone stopped at a keyboard nobody watches — the single most costly
      #    row a tick can hold — and to act on it a supervisor had to re-scan
      #    every crew row by eye for a `🚧`, which is the scan the sweep just did.
      #
      # ⚠️ the `BOX UNMOVED` join below names a role only where it did NOT move.
      #    a modal raised THIS poll moves, so it is absent there by construction —
      #    ⇒ the costliest state is exactly the one that stays anonymous.
      BOX_WHO["$__bs"]="${BOX_WHO["$__bs"]:-}${__bt}/${__brole} "

      __bage="$(printf '%s\n' "${CREW_MOTION[$__bt]:-}" \
        | grep -a "^${__brole}=" | head -n 1 | sed 's/^[^=]*=//')"
      # ⚠️ carry the FULL duct uri, host and all — never `$tree/$role`.
      #
      # .why = the action line below turns this into a `duct.read --on` hint, and
      #        it built that as `duct:///<tree>/<role>` — an EMPTY authority,
      #        which is the canonical "this machine" form. so for a crew on a
      #        grove the hint named a duct on the laptop: a supervisor who pastes
      #        it reads a duct that does not exist, and is told `(none)` about a
      #        pane that is plainly live elsewhere.
      #
      #        the row above it in the same report already says the crew is on a
      #        grove, so the hint contradicts its own report — and it is the
      #        cheaper half to get wrong, because a hint is copied rather than
      #        read (term=false-report: a tool's suggestion is a CLAIM).
      __bhost="${CREW_HOST[$(__crew_canon "$__bt")]:-}"
      [[ -n "$__bage" ]] && STALLED_BOXES+=("duct://${__bhost}/${__bt}/${__brole} $__bs, still $__bage")
    done
  done
  for __bs in $(printf '%s\n' "${!BOX_TALLY[@]}" | sort); do
    # .why it names the STATE and not the pane. it read "box not empty",
    #   which a reader takes as a claim about the captured bytes — and that
    #   claim is false for `❔unread`, whose whole sense IS an empty
    #   capture. so the sentence speaks about the STATE, never the bytes.
    #
    # 🔴 .why it no longer says "so no stone renders for these roles"
    #   that clause was TRUE when written and became FALSE on 2026-09-16,
    #   when duct.poll hoisted the stone onto its own row — orthogonal to the
    #   box, exactly as `cap` and `ratelimit` already were. a ghost, a covered
    #   box, a survey now each render their stone, and the census denied it
    #   three lines below the render that plainly showed one.
    #
    #   ⇒ that is the `term=false-report` shape this very comment was written
    #     to cure, committed a second time by the same line: a claim accurate
    #     about a past mechanism, left in place as a claim about now. a census
    #     row is READ rather than re-derived, so it is exactly the place a
    #     stale claim survives longest.
    #
    #   what the row honestly says is what it always measured: a tally of the
    #   non-`empty` box states, each of which names its own move on its row
    #   above. the reader's cue is to go read that row, never to conclude the
    #   stone is unknown.
    #
    # 🔴 .and the clause "each names its own move on its row above" was FALSE —
    #   task #39, the THIRD time this one line has carried a stale claim.
    #
    #   the per-tree box line renders under ONE status: `blocked:on-supervisor`
    #   (the `🚧 ${__bx% }` arm ~740 lines up, whose own comment says it "rides
    #   ONLY the prompt row" — a deliberate scope, and correct). but BOX_TALLY
    #   counts a non-empty box on EVERY tree, whatever its status. so the moment
    #   a tree carries some other status, the census points a reader at a row
    #   that renders no box at all.
    #
    #   .measured 2026-09-17, one tick apart, on the same tree:
    #     tick A  blocked:on-supervisor -> `🚧 … reviewer:🪦absent` rendered
    #     tick B  the modal was answered -> 😶 inflight -> box line SUPPRESSED,
    #             and `🪦absent × 1` still read "names its own move on its row
    #             above". the row above named no move (term=false-report).
    #
    #   ⇒ the cure is the one every peer row here already took: the row CARRIES
    #     the move (`rule.require.poll-recommends-every-cure-heal-has`), rather
    #     than a defer to a render that may not have run.
    echo "   ├─ $__bs × ${BOX_TALLY[$__bs]} — a non-\`empty\` box; each row below carries its own move"

    # 🔴 the roll is CAPPED, and the cap is stated rather than silent
    #
    #    a count with no subject cannot be acted on; a 44-row roll buries the
    #    3-row one beside it. so the naming is bounded, and the bound announces
    #    itself — an elided remainder that says naught is the clipped sweep this
    #    file forbids (`rule.forbid.clipped-sweeps`).
    #
    # ⚠️ the cap is on the COUNT, never on a list of blessed states. three prior
    #    repairs here each got the subject set wrong by a named-state guess
    #    (see the three-cures note above); a numeric bound cannot make that error,
    #    and a box state duct.poll adds tomorrow is bounded the day it ships.
    #
    # .why 8: a state worth a per-role move is rare by nature — a modal, an
    #      unsubmitted line, an undrained queue. a state that fires past 8 at once
    #      is a FLEET condition, and the fleet rows above already carry it.
    __bn=0
    for __bw in ${BOX_WHO[$__bs]:-}; do
      (( __bn++ ))
      if (( __bn > 8 )); then
        echo "   │     └─ … and $(( ${BOX_TALLY[$__bs]} - 8 )) more — a state this wide is a fleet condition, not a per-role move"
        break
      fi
      __bwt="${__bw%%/*}"; __bwr="${__bw##*/}"
      # 🔴 the move rides the row. 🪦absent is the one state whose cure is NOT a
      #   read: its own join arm records that "the host ANSWERED and holds no
      #   such session — so the cure is a fell or a boot, and a re-read can only
      #   fail". to hand a reader a read there is to hand them a call that is
      #   guaranteed to return naught.
      # 🔴 .and the boot carries `--roles $__bwr`, or it cures NAUGHT — 2026-09-18
      #
      #   `crew.boot` with no `--roles` ensures `CREWWORK_ROLES_DEFAULT`
      #   (crewwork.sh:151) — `mechanic,foreman,reflector,reviewer.take,
      #   reviewer.give`. that set does NOT hold `reviewer`, nor any seat a
      #   route adds beyond the default five.
      #
      #   ⇒ so the emitted line, run verbatim against the row that named
      #     `<tree> / reviewer` absent, re-ensures five seats that are already
      #     live, never touches the sixth, and exits 0 reporting the crew up.
      #     the 🪦absent row then renders identically on the next tick, and the
      #     one before that.
      #
      # 🔴 .measured 2026-09-18 — rhachet-roles-bhrain.beav.feat-prescribed-
      #   brain-per-stone / reviewer. the census named the seat; the command
      #   beside it could not reach it.
      #
      # ⚠️ .the shape is SILENT-POSITIVE, which is what makes it expensive: an
      #   idempotent boot that skips the absent seat is indistinguishable from
      #   one that restored it, so there is no cue to re-check
      #   (term=false-report — the same shape the `--grove`-less fell took,
      #   which answered `idempotent no-op` about the wrong box).
      #
      #   and this row's own note above argues the move must ride the row so a
      #   reader is not handed "a call that is guaranteed to return naught".
      #   it then handed them one — the verb was right and the SUBJECT was
      #   dropped, one field over from the `<tree>` placeholder this view
      #   already grades "the defect at its sharpest".
      #
      # .the grove needs NO flag: crew.boot derives it from the ledger
      #   (crewwork.sh:5022 — "derive the grove from the ledger, never default
      #   to `local`"). its `--help` still advertises `local (default)`, which
      #   is stale against its own code.
      #
      # 🔴 .the UNREACHED arm — the THIRD case, and it is the same defect twice
      #
      #   measured 2026-09-20. this census rendered `❔unread × 12` and emitted
      #   12 reads. 4 of 4 run exited 1 with, verbatim:
      #     ✋ duct.read: cannot reach 'grove-sandpine-v20260901'
      #        fix:  rhx git.grove.wake <grove>
      #   and the poll's OWN header, one screen above, already carried
      #   `⚠️ UNREACHED: grove-sandpine-v20260901 …`. so the cure was in the
      #   report and the row beside the subject named a different one.
      #
      #   ⚠️ it is the `🪦absent` argument exactly — "a read cannot settle it" —
      #      re-derived for a second cause and never generalized. that row keys
      #      on a host that ANSWERED and held no session; this one keys on a
      #      host that said nought at all. both make a read futile, and only
      #      the first had an arm.
      #
      #   the grove comes off the LEDGER, never off `CREW_HOST`: that map holds
      #   the empty string for a grove tree whose session list never returned,
      #   which reads as `here` (see the stone-tally join above, where the same
      #   correlate made a cure go inert).
      __bw_grove="$(__crew_ledger_grove_of "$__bwt")"
      __bw_host="$(__crew_grove_host "${__bw_grove:-local}" 2>/dev/null || printf '')"
      if [[ -n "$__bw_host" ]] && __crew_host_unreached "$__bw_host"; then
        echo "   │     └─ $__bwt / $__bwr — its grove did not answer; a read exits 1 — rhx git.grove.wake $__bw_host"
      elif [[ "$__bs" == "🪦absent" ]]; then
        echo "   │     └─ $__bwt / $__bwr — the host holds no such session; a read cannot settle it — rhx git.crew.boot --tree $__bwt --roles $__bwr"
      else
        echo "   │     └─ $__bwt / $__bwr — rhx git.crew.read --tree $__bwt --who $__bwr"
      fi
    done
  done
fi

# .what = the EMPTY box's own stall test — a long age that stands ALONE
#
# 🔴 .why the `BOX UNMOVED` join above cannot cover this, by its own design
#   that join skips `empty` on purpose (`case "$__bs" in empty|shell|'')`), and
#   its reason is sound: for a NON-empty box, still IS the signal, because
#   something is written that nobody drained. for an `empty` box it is not — a
#   clone deep in a long tool call has an empty box and a still pane, and that
#   is the ordinary case, not a stall. so it invented no threshold, correctly.
#
#   but the consequence went unstated: `empty` was then left with NO test at
#   all. that is the hole a halted clone falls through, and it was the second
#   of two filters that dropped `rhachet.beav.fix-keyrack-all-skips-manifest`
#   on 2026-09-03 — its stone was truncated (so the stone tally scored it
#   `🔍 in review`) AND its box was `empty` (so this arm skipped it). two
#   exclusions, neither of which left a trace, on a clone that had been halted
#   on API 500/529 for 167 minutes.
#
# 🟢 .the discriminator this file ALREADY held, at __crew_record_motion
#   `empty` needs a different key than bare stillness, and the answer was
#   written ~900 lines up and wired to no caller:
#
#     "the sound read is COMPARATIVE, never absolute: within one poll, a duct
#      whose age stands ALONE and is LARGE is the one worth a drill-in. a
#      figure shared with its neighbours says only 'we were all touched then'."
#
#   so the test is LARGE and ALONE, both. on the 2026-09-03 sweep that names
#   exactly one row — 167m, reported by no other duct — while the four ducts at
#   886m are a cluster, i.e. one past event that touched all four, and stay
#   unflagged. the prose was already right; only the wire was absent.
#
# .note = it renders a READ, never a diagnosis. an empty-and-still box has many
#         causes — a vendor 5xx, a usage cap, a finished turn nobody answered —
#         and they take different moves (term=volunteered-diagnosis).
STALLED_QUIET=()
if [[ "$BOXES" == "true" && "${#CREW_MOTION[@]}" -gt 0 ]]; then
  __stall_mins="${STALL_MINS:-60}"
  declare -gA __age_seen=()
  # pass 1 — how many ducts fleet-wide report each age. this is what makes the
  # test comparative; it cannot be done per-crew, because a cluster spans crews
  for __qt in "${!CREW_MOTION[@]}"; do
    while IFS= read -r __qr; do
      [[ -n "$__qr" ]] || continue
      __age_seen["${__qr#*=}"]=$(( ${__age_seen["${__qr#*=}"]:-0} + 1 ))
    done < <(sort -u <<< "${CREW_MOTION[$__qt]}")
  done
  # pass 2 — flag an empty box whose age is both large and unshared
  for __qt in "${!CREW_MOTION[@]}"; do
    [[ -n "${CREW_ROLES[$__qt]:-}" ]] || continue   # the at-work gate, as above
    while IFS= read -r __qr; do
      [[ -n "$__qr" ]] || continue
      __qrole="${__qr%%=*}"; __qage="${__qr#*=}"
      # only the EMPTY box: every other state is the join above's subject, and
      # a row rendered by both arms would read as two stalls
      case " ${CREW_BOXES[$__qt]:-} " in *" ${__qrole}:empty "*) ;; *) continue ;; esac
      [[ "$__qage" == *m ]] || continue
      __qn="${__qage%m}"
      [[ "$__qn" =~ ^[0-9]+$ ]] || continue
      (( __qn >= __stall_mins )) || continue
      (( ${__age_seen["$__qage"]:-0} == 1 )) || continue
      # 🔴 .the CREW join — a still role whose PEER moved is an OBSERVER
      #
      # .why  the two tests above are per-DUCT, and a duct is the wrong unit for
      #       this question. the unit of work is the CREW: our standard crew is a
      #       mechanic that drives and a foreman that watches, so a quiet foreman
      #       beside a mechanic at work is the healthy shape of a live crew, never
      #       a stall. the prior form flagged it anyway, because a foreman's age is
      #       LARGE (it has no reason to move) and ALONE (no peer shares it) — the
      #       exact two properties the test keys on. so the row did not merely
      #       misfire; it fired hardest on the most benign subject there is.
      #
      #       measured 2026-09-03: `rhachet.beav.fix-node-pty-install/foreman`
      #       fired three consecutive ticks at 152m, 164m, and 164m. each read
      #       found a foreman mid-analysis, box empty, stone `l3@i026 🔍`, and its
      #       MECHANIC absent from the still-map every time — i.e. moved, every
      #       tick. three reads, three benign answers, one unchanged subject.
      #
      # ⚠️ .why this belongs HERE and could not live in duct.poll
      #       the delegate reads one duct and cannot see a peer. `who else is on
      #       this crew, and did they move?` is a fact only the crew layer holds —
      #       so this is the join the two layers exist to make, not a filter that
      #       could have been pushed down (rule.require.speak-at-the-supervisor-layer).
      #
      # ⚠️ .what it deliberately does NOT suppress
      #       a role parked on a MODAL never reaches this arm — the `:empty` gate
      #       above routes that to 🚧prompt, which is untouched. and a crew whose
      #       every role is still keeps its row, which is the case that loses time.
      #       what is dropped is only: an empty box, on a crew demonstrably at work.
      #       the cost of that drop is bounded — the crew progresses through the
      #       peer, so no work waits on the quiet one.
      __qmoved=false
      for __qpeer in ${CREW_ROLES[$__qt]:-}; do
        # CREW_MOTION lists STILL ducts only, so absence from it IS the motion
        case $'\n'"${CREW_MOTION[$__qt]:-}" in
          *$'\n'"${__qpeer}="*) ;;
          *) __qmoved=true ;;
        esac
      done
      [[ "$__qmoved" == "false" ]] || continue
      __qhost="${CREW_HOST[$(__crew_canon "$__qt")]:-}"
      STALLED_QUIET+=("duct://${__qhost}/${__qt}/${__qrole} still $__qage")
    done < <(sort -u <<< "${CREW_MOTION[$__qt]}")
  done
fi
}
