#!/usr/bin/env bash
######################################################################
# pollwork.gather — derive the crew set, and the per-role facts every render reads
#
# 🔴 .a PART of pollwork.sh — sourced, never executed, and only BY pollwork.sh.
#     git.crew.poll.sh sources pollwork.sh, which loads every part. see
#     __poll_load_parts there for why the poll is cut into parts at all.
#
# .holds = __crew_gather_boxes, the __crew_record_* pane classifiers, the host
#          reach test, the session derivation, and the __poll_gather_crews stage
######################################################################

######################################################################
# --boxes: fold each live role's INPUT-BOX state into its crew row
######################################################################
#
# .why the flag exists at all
#   without it, this poll says WHICH roles are live and never what they
#   AWAIT — so a supervisor that needs a box state drops to one
#   `duct.read` per duct and hand-simulates this very sweep. that is the
#   byhand loop `rule.require.bulk-over-byhand` forbids, and the absent
#   render is what forced it. measured 2026-08-30: a babysit tick ran 5
#   sequential reads against a 16-crew fleet before the operator caught it.
#
# .why it DELEGATES to duct.poll rather than detect the box itself
#   the detector is ~80 lines of subtle state logic in `duct.poll.sh`, and
#   its most delicate branch separates a human's typed text from an
#   autocomplete GHOST by a single sgr attribute. a second copy of that
#   would be two detectors that drift — and a drift there fabricates a
#   human instruction (rule.require.distinguish-prefilled-from-suggested),
#   which is the one direction that must never fail.
#
#   so: ONE detector, one owner. this joins its output.
#
# .why ONE call, never one per duct
#   `duct.poll` already reads the whole fleet in parallel and derives its
#   own subject set. to call it per-crew would rebuild, inside the bulk
#   instrument, the very N+1 loop the flag exists to remove.
#
# .the cost, stated
#   one extra call per sweep, off by default. a caller who wants only the
#   tree half never pays it.
__crew_gather_boxes() {
  local out uri uri_block box
  # --brief keeps the verdict lines and drops the pane bodies (~30KB/sweep)
  out="$(rhx duct.poll --brief 2>/dev/null)" || return 0

  uri=""
  while IFS= read -r line; do
    case "$line" in
      # .why these are matched ABOVE the child arm, and on a COLON
      #   duct.poll's SUMMARY lines wear the same `   ├─ ` prefix as its
      #   per-duct children, so the child arm below would swallow them. they
      #   are told apart by content, never by position (the r1/r2 lesson):
      #   a per-duct verdict reads `🌊 changed`, the summary `🌊 changed: 3`.
      #   the colon is the discriminator, and it belongs to the tally alone.
      *'🌊 changed: '*)   DUCT_CHANGED="${line##*: }"; continue ;;
      *'🧊 unchanged: '*) DUCT_STILL="${line##*: }";   continue ;;
      *'🔭 duct://'*)
        # a uri still set here means the PRIOR block named no box we know.
        # flush it loud rather than drop the role — see the omission note below
        __crew_record_box "$uri" "❔unknown"
        # duct://<host>/<tree>/<role> or duct:///<tree>/<role>
        uri="${line#*duct://}"
        uri="${uri%%[[:space:]]*}"
        # .why a SECOND copy that the box arm never clears
        #   `uri` is deliberately emptied the instant a box is recorded, to
        #   drive the ❔unknown flush. duct.poll renders the stone AFTER the
        #   box, so by then `uri` is empty and the stone would be dropped —
        #   silently, as "this crew has no stone". `uri_block` lives from one
        #   header to the next, so the stone keys on the block it sits in.
        uri_block="$uri"
        ;;
      # .why the key is the box line's CONTENT, never its POSITION
      #   two prior rounds keyed on position and each cost a live regression:
      #
      #     r1  keyed on the ⌨️ glyph -> dropped every 🚧 PROMPT row, because
      #         a PROMPT renders its own header and carries no keyboard glyph.
      #         so the ONE state a tick most needs — a mechanic stalled at a
      #         keyboard nobody watches — was the one state the flag omitted,
      #         and it omitted it as "this role is not live"
      #     r2  keyed on the 3-space `└─`, on the claim that the box line is
      #         duct.poll's LAST child. it was, until `empty` grew a second
      #         line for the stone — then `└─` held the STONE, matched no
      #         token, and every idle crew fell through to ❔unknown
      #
      #   both are one defect: a join that reads its neighbour's LAYOUT is a
      #   join its neighbour breaks the next time it renders. so match any
      #   child line and test what it SAYS; a line that names no box state is
      #   skipped rather than mis-scored, and a block that names none at all
      #   is flushed ❔unknown at the next header. fail loud, never by omission.
      #
      #   the deeper `      ├─` option lines of a PROMPT sit at 6 spaces, so
      #   they cannot match; and the report's own header/summary lines are
      #   guarded by the uri check, which is empty outside a block.
      '   ├─ '*|'   └─ '*)
        # .why the STONE is matched ABOVE the `-n "$uri"` guard
        #   see the uri_block note at the header arm: the box arm clears
        #   `uri` when it records, and duct.poll renders the stone AFTER the
        #   box — so the guard below would drop every stone, and drop it as
        #   an absence rather than an error. keyed on CONTENT (`🗿`), never
        #   on which child line it is; that is the r1/r2 lesson below.
        case "$line" in
          *'🗿'*)
            [[ -n "$uri_block" ]] || continue
            __crew_record_stone "$uri_block" "$line"
            continue ;;
          # .why the PER-DUCT motion is carried too, and only the STILL half
          #   the tick's route rule for an idle clone reads "empty AND
          #   unchanged A WHILE" — two conjuncts, and this join used to supply
          #   only the first. so a supervisor could see `mechanic:empty` across
          #   the fleet and had no way to tell a parked clone from a busy one
          #   without a per-duct read, which is the byhand loop the flag exists
          #   to remove (rule.require.bulk-over-byhand).
          #
          #   the fleet TALLY does not answer it either: "7 of 12 moved" says
          #   the fleet is alive and names not one of them.
          #
          #   ⚠️ only `🧊 unchanged` is recorded. a `🌊 changed` is the ordinary
          #   case and would add a row per live duct for no decision — and the
          #   age is the whole datum, since "unchanged" with no duration cannot
          #   part a clone idle 2 minutes from one idle 2 hours.
          *'🧊 unchanged'*)
            [[ -n "$uri_block" ]] || continue
            __crew_record_motion "$uri_block" "$line"
            continue ;;
          # .why the PLEA is joined here, on `uri_block`, exactly as the stone is
          #   duct.poll renders it AFTER the box, so `uri` is already cleared and
          #   the guard below would drop it — silently, as "this crew has no plea".
          #
          # .what it carries: the clone PRINTED the grant command a human must run
          #   (`route.stone.set … --as approved`). the stone cannot report this — a
          #   stone records the last SETTLED transition, and what clears an approval
          #   IS the human command, so a converged clone renders whatever gate it
          #   stopped at, indefinitely. see term=duct.pane.plea.
          #
          # ⚠️ .why it must reach this join at all, and not merely be emitted
          #   the detector shipped one round WITHOUT this arm, and duct.poll's own
          #   row fell to `*) continue` below — so it wrote a fact no reader ever
          #   saw. an unjoined detector is worse than an absent one: it reads as
          #   coverage from the layer that emits it and provides none at the layer
          #   that decides. found by a dogfood re-poll against a duct whose pane
          #   provably held a plea, 2026-09-03.
          # ⚠️ `"$line"` rides along, same as the cap arm below: the row carries
          #   the grant command verbatim, and the recorder is what keeps it. the
          #   prior form passed `$uri_block` alone and the command died here
          #   (see __crew_record_plea's own note).
          *'plea SEEN'*)
            [[ -n "$uri_block" ]] || continue
            __crew_record_plea "$uri_block" "$line"
            continue ;;
          # .why joined on `uri_block`, same as the plea arm above — and it
          #   needs its own arm for the same reason it needs its own detector:
          #   a fulcrum council prints NO grant command, so the plea arm's
          #   marker never matches it and the row would fall to `*) continue`.
          #   an unjoined detector reads as coverage and provides none.
          *'council SEEN'*)
            [[ -n "$uri_block" ]] || continue
            __crew_record_councilask "$uri_block" "$line"
            continue ;;
          # .why joined on `uri_block`, same reason as the plea arm above:
          #   duct.poll renders this row AFTER the box, so `uri` is already
          #   cleared and the guard below would drop it silently.
          #
          # .what it carries: the clone declared the TREE itself ready to
          #   fell. no other signal reports this — a stone tracks the ROUTE,
          #   never the worktree, and a fell-ready declaration is orthogonal
          #   to route state (task #16).
          *'fell-ready SEEN'*)
            [[ -n "$uri_block" ]] || continue
            __crew_record_fellready "$uri_block"
            continue ;;
          # .why joined on `uri_block`, same as plea/fellready: duct.poll renders
          #   the cap row AFTER the box, so `uri` is already cleared. an unjoined
          #   cap is exactly the emitted-but-unconsumed defect the plea arm warns
          #   of — measured 2026-09-13, a rate-limited clone read `at work`.
          *'cap SEEN'*)
            [[ -n "$uri_block" ]] || continue
            __crew_record_cap "$uri_block" "$line"
            continue ;;
          # 🔴 .the STILL term of the cap join, and it must be gathered even
          #   though it names no status of its own — its whole job is to REFUTE
          #   the arm above. an emitted fact with no recorder is the
          #   unjoined-detector defect every neighbour here warns of, and this
          #   one was owed from the day the cap row wrote its own contract:
          #   `join to reset-vs-now + still to judge`.
          *'TURN LIVE SEEN'*)
            [[ -n "$uri_block" ]] || continue
            __crew_record_turnlive "$uri_block"
            continue ;;
          # .why joined on `uri_block`, same as cap/plea: duct.poll renders the
          #   wedge row AFTER the box, so `uri` is already cleared. an unjoined
          #   wedge is the emitted-but-unconsumed defect — the very shape that
          #   left rate-limited clones read as `at work`, invisible to the tick.
          *'RATE-LIMITED SEEN'*)
            [[ -n "$uri_block" ]] || continue
            __crew_record_ratelimit "$uri_block"
            continue ;;
          # 🔴 .what it carries: the clone GAVE UP and asked for a human, in its
          #   own words — `stuck on stone <X> after <N> attempts`.
          # .why joined on `uri_block`, same as every SEEN arm above: duct.poll
          #   renders it AFTER the box, so `uri` is already cleared and the guard
          #   below would drop it silently — the emitted-but-unconsumed defect
          #   this whole case block exists to avoid.
          # 🔴 .why it must reach the crew status and not merely the actions list
          #   the pane renders like health, so without this the row read
          #   `😶 inflight` over a clone that had stopped and asked for a human.
          #   three trees, one tick, 2026-09-15.
          *'ESCALATION SEEN'*)
            [[ -n "$uri_block" ]] || continue
            __crew_record_escalation "$uri_block" "$line"
            continue ;;
          # .what it carries: how much context the clone has LEFT, per its own
          #   status line — a WATCH signal, not a gate.
          # .why joined on `uri_block`, same as every arm above: duct.poll
          #   renders it AFTER the box, so `uri` is already cleared.
          # 🔴 .why it does NOT touch the crew status
          #   a clone near auto-compact is still at work, and the compact is a
          #   thing that HAPPENS TO it, never a stop. to override `😶 at work`
          #   here would put a human in front of a tree that needs no human —
          #   the exact fabrication the plea arm's own cure just removed.
          *'CONTEXT LOW — '*)
            [[ -n "$uri_block" ]] || continue
            __crew_record_compact "$uri_block" "$line"
            continue ;;
          # .what it carries: the stone claims a peer review is in flight, and
          #   the spawn of that review FAILED in the same pane.
          # .why joined on `uri_block`, same as every arm above: duct.poll
          #   renders it AFTER the box, so `uri` is already cleared.
          # 🔴 .why it does NOT touch the crew status either, and for the
          #   OPPOSITE reason to the compact arm above
          #   that arm holds back because the clone is genuinely at work. this
          #   one holds back because the sweep CANNOT TELL — the contradiction
          #   says the stone is untrustworthy here, never what the true state
          #   is. to mint a status off it would trade one confident wrong
          #   verdict for another (rule.forbid.overzealous-blockers).
          *'STONE vs PANE — the stone says a peer review is in flight'*)
            [[ -n "$uri_block" ]] || continue
            __crew_record_arrivefail "$uri_block" "$line"
            continue ;;
          # 🔴 .what it carries: the clone's last turn has ENDED. a FACT, read
          #   off one pane in one pass — never a verdict. duct.poll fires it
          #   unconditionally, and every judgment about what it MEANS is made
          #   here, in the ladder.
          # .why joined on `uri_block`, same as every arm above: duct.poll
          #   renders it AFTER the box, so `uri` is already cleared.
          # 🔴 .why it MUST reach the crew status
          #   it refutes exactly two `inflight` claims, and no others: the
          #   `📬queued` arm ("a queued box means the clone is busy") and the
          #   MOTION arm ("an on-defect stone whose bearer moved is mid-turn").
          #   both reason about a turn in flight; both are false the moment one
          #   ends. measured 2026-09-16 on feat-dispute-or-concede-review-budget:
          #   `😶 inflight` over a clone whose turn had been over 6m 15s, with
          #   the human's own answer sat in front of it.
          *'TURN ENDED SEEN — '*)
            [[ -n "$uri_block" ]] || continue
            __crew_record_turnended "$uri_block" "$line"
            continue ;;
          # 🔴 a turn that stopped on a DECLINED modal. filed apart from the
          #   row above because claude prints NO epilogue after a decline, so
          #   the turn-ended detector cannot see this shape at all — the one
          #   halt that parks a clone most reliably was the one the ladder had
          #   no witness for.
          *'DECLINE PARKED SEEN — '*)
            [[ -n "$uri_block" ]] || continue
            __crew_record_declined "$uri_block" "$line"
            continue ;;
          # 🔴 a message SUBMITTED and not yet consumed. it is filed apart from
          #   the box state on purpose: the box's own `queued` arm keys on
          #   claude's footer hint, which claude prints only while a turn RUNS.
          #   so after a turn ends — the one state where a queue stops to
          #   drain — the box says `empty` and this fact is the only witness.
          *'QUEUED SEEN — '*)
            [[ -n "$uri_block" ]] || continue
            __crew_record_queuedrow "$uri_block" "$line"
            continue ;;
          # 🔴 the CAUSE behind a perm modal that returns on every file write.
          #   filed apart from the box state because it outlives the modal: key
          #   this one and the next `Update` draws another. the cure is the
          #   MODE, and only this fact names it.
          *'MODE LOST — '*)
            [[ -n "$uri_block" ]] || continue
            __crew_record_modelost "$uri_block" "$line"
            continue ;;
        esac
        [[ -n "$uri" ]] || continue
        # the state duct.poll renders: empty | queued | prefilled | suggested
        # | none | unknown, or the ASK / PROMPT header
        case "$line" in
          # .why ASK is matched FIRST, and why it is its own token
          #   a `prompt` is TWO states with OPPOSITE moves. a permission modal
          #   is the supervisor's to judge; a design question was put to the
          #   HUMAN, and a key there records a decision in their name. the tick
          #   contract cannot route what the sweep does not part, so the split
          #   duct.poll draws must survive this join — a token that collapses
          #   them here would undo the whole fix one layer up.
          # .why `ASK?` is its own token and is matched FIRST
          #   duct.poll fails CLOSED: a modal whose kind it could not determine
          #   renders `🙋 ASK?` and takes the ask MOVE (send no keys). the join
          #   must carry that uncertainty rather than round it to either
          #   neighbour — rounded to `ask` it would read as a determination we
          #   never made; rounded to `prompt` it would say "press a key", which
          #   is the one direction this whole split exists to prevent
          # .why SURVEY is matched FIRST too, same reason as ASK/ASK? below:
          #   claude's own product check-in shares the numbered-choice shape
          #   of a real permission modal one layer down (task #24). joined
          #   into `🚧prompt` it reads `blocked:on-supervisor` — a false
          #   stall that costs a keystroke filed under the human's name.
          *'SURVEY —'*)   box="🙋survey" ;;
          *'ASK? —'*)     box="🙋ask?" ;;
          *'ASK —'*)      box="🙋ask" ;;
          *'PROMPT'*)     box="🚧prompt" ;;
          *'box empty'*)  box="empty" ;;
          *'QUEUED'*)     box="📬queued" ;;
          *'PREFILLED'*)  box="✍️prefilled" ;;
          *'SUGGESTED'*)  box="👻ghost" ;;
          *'no input box'*) box="shell" ;;
          # a dead-claude husk WITH its resume banner (a 💥143 / crash), distinct
          # from a banner-less bare shell. duct.poll parts them; the husk status
          # arm below consumes BOTH `mechanic:shell` and `mechanic:husk`.
          #
          # 🔴 a husk is a DEAD BRAIN, and only the mechanic runs one. every other
          #    role is a SEAT — a bare shell with no clone in it (term=crew) — so a
          #    💥143 there is a dead ad-hoc occupant the human chose to enroll, not
          #    a crew defect to heal. a seat's husk classifies as a plain shell, so
          #    the husk breakdown AND the crew_status husk arm both fire ONLY on the
          #    mechanic (define.invariant.crew.husk.discriminator-parity: the test
          #    is scoped to the claude role; a foreman shell is never a husk).
          *'💀 HUSK'*)
            if [[ "${uri##*/}" == "mechanic" ]]; then box="husk"; else box="shell"; fi
            ;;
          # .why UNREAD is matched BEFORE unknown, and why it must be matched
          #   at all: a verdict this case names not falls to `continue`, so
          #   its block ends up flushed `❔unknown` at the next header — the
          #   split would be erased at the very layer the babysit tick reads.
          #   that is the caution at the head of this join, come true: a join
          #   that reads its neighbour's render is one the neighbour breaks.
          #   the two are not synonyms — `unread` says re-read the duct,
          #   `unknown` says read the text already on the row.
          *'box UNREAD'*)   box="❔unread" ;;
          # .why COVERED is carried, and never left to fall through
          #   it DID fall through once — 2026-09-04, the same tick that added
          #   it one layer down — and landed on `❔unknown`, which is safe (it
          #   never submits) and wrong (it sends a reader to fix a ladder that
          #   is correct). that is the caution four lines up, come true a
          #   second time, on the very rule that records it.
          #   ⇒ a render arm and its join arm are ONE change, never two.
          *'box COVERED'*)  box="🪟covered" ;;
          # 🔴 .the THIRD instance of the caution above — caught before it shipped
          #   `absent` was coined one layer down on 2026-09-17, and its join arm
          #   is written in the SAME change rather than a later one, because the
          #   two notes above record this identical miss, twice over.
          #   left out, an absent seat falls to `*) continue`, its block flushes
          #   `❔unknown` at the next header, and the split is erased at the one
          #   layer the babysit tick reads.
          # .why it is NOT a synonym of `unread`, and cannot share its arm
          #   `unread` says the state is unknown, so read again. `absent` says
          #   the host ANSWERED and holds no such session — so the cure is a
          #   fell or a boot, and a re-read can only fail. 🪦 is this repo's
          #   extant glyph for RESIDUE (a retired grove, a dead tab row, a term
          #   that outlived its window); an absent seat is that same concept, so
          #   the glyph is reused rather than newly claimed.
          *'seat ABSENT'*) box="🪦absent" ;;
          *'box UNKNOWN'*)  box="❔unknown" ;;
          *) continue ;;   # a verdict line, a stone line — not a box line
        esac
        __crew_record_box "$uri" "$box"
        uri=""
        ;;
    esac
  done <<< "$out"

  # the final block, if it named no box we know
  __crew_record_box "$uri" "❔unknown"
}

# .what = file one role as a PLEA-bearer under its tree, WITH the command it printed
#
# .why  = keyed the same way as the box and motion maps, so the render can join
#         all three on one canon tree key with no second derivation to drift.
#
# 🔴 .why the COMMAND TEXT rides along, rather than stays at the duct layer
#   duct.poll extracts the grant command and renders it verbatim:
#     └─ 🙋 plea SEEN — "rhx route.stone.set --stone 5.1 --as overruled" (scrollback; …)
#   this recorder took `$uri` alone and dropped that string. so the fleet row
#   said a human gate was seen and refused to say WHICH — and the one question a
#   supervisor must answer about a plea is "is this ask still LIVE?", which the
#   command's own `--stone` settles against the stone rendered two lines above it.
#
#   ⇒ so every plea cost a full `crew.read` round trip to adjudicate, and a plea
#     is a proxy with a KNOWN false-positive rate (term=false-report):
#       2026-09-12 — 7 of 7 flagged pleas in one tick were already resolved
#       2026-09-14 — 2 more, both foreman panes, both grants for a stone 5.1 the
#                    mechanic had already left (it was on 5.3.verification)
#     the round trip is paid on every one, true and false alike. with the command
#     on the row, the 2026-09-14 pair is refutable at a glance: `--stone 5.1`
#     beside a rendered stone of `5.3.verification` is stale by construction.
#
# ⚠️ the datum was ALREADY READ and ALREADY PARSED one layer down. to drop it here
#   is the shape this file guards against elsewhere — a verdict rendered without
#   the evidence its renderer holds (term=partial-audit). `__crew_record_cap`
#   directly below takes `"$line"` for exactly this reason, so this is that
#   precedent applied to its neighbour, never a new mechanism.
#
# ⚠️ an extraction that yields NO COMMAND still records the role. the plea is the
#   signal and the command is the annotation, so a row shape this cannot parse
#   must degrade to the prior render rather than drop a human gate. the fail-safe
#   direction is SHOW.
__crew_record_plea() {
  local uri="$1" line="${2:-}" role tree cmd
  [[ -n "$uri" ]] || return 0
  role="${uri##*/}"
  tree="${uri%/*}"
  tree="${tree##*/}"            # drops the host segment, if any
  [[ -n "$tree" && -n "$role" ]] || return 0
  # duct.poll renders:  └─ 🙋 plea SEEN — "…" (scrollback; the clone named …)
  # the marker is tested on the ROW first: a bare `${line#*…}` on a row that
  # holds no marker returns the row whole, which would render the advisory
  # prose as though it were the clone's own command
  cmd=""
  case "$line" in
    *'plea SEEN — '*)
      cmd="${line#*plea SEEN — }"
      cmd="${cmd%% (scrollback*}"   # drop the advisory tail
      ;;
  esac
  # .why NEWLINE-delimited, like the stone and cap maps: the command holds
  #   spaces (`--stone 5.1 --as overruled`), so a space-split map would shred it
  CREW_PLEA["$(__crew_canon "$tree")"]+="${role}=${cmd}"$'\n'
}

# .what = file one role as a FULCRUM COUNCIL bearer under its tree, WITH the
#         clause the clone printed — `waits on four wisher calls`, or its own
#         `when you rule` sentence.
# .why  = a council is a HUMAN gate that carries no grant command, so the plea
#         recorder above can never see it: every arm of that chain anchors on
#         `route.stone.set … --as approved|overruled`, and a council prints a
#         TABLE of open calls instead. the two are peers, never one shape.
# 🔴 .the cost of no recorder, measured 2026-09-21 on
#         `rhachet-roles-bhrain.beav.feat-acceptance-under-5min`: 256m rendered
#         `✋ blocked:on-defect` — the driver's own — while four wisher calls
#         sat open, F10 a stated SAFETY question.
__crew_record_councilask() {
  local uri="$1" line="${2:-}" role tree clause
  [[ -n "$uri" ]] || return 0
  role="${uri##*/}"
  tree="${uri%/*}"
  tree="${tree##*/}"            # drops the host segment, if any
  [[ -n "$tree" && -n "$role" ]] || return 0
  # duct.poll renders:  └─ 🗳️ council SEEN — "…" (scrollback; a FULCRUM …)
  # the marker is tested on the ROW first, for the identical reason the plea
  # recorder gives: a bare `${line#*…}` on an unmarked row returns it whole
  clause=""
  case "$line" in
    *'council SEEN — '*)
      clause="${line#*council SEEN — }"
      clause="${clause%% (scrollback*}"   # drop the advisory tail
      ;;
  esac
  CREW_COUNCILASK["$(__crew_canon "$tree")"]+="${role}=${clause}"$'\n'
}

# .what = file one role as an ESCALATION bearer under its tree, WITH the clause
#         the clone printed — `stuck on stone <X> after <N> attempts`.
# .why  = keyed identically to the plea map above, for the same reason — one
#         canon key the render joins with no second derivation to drift.
# 🔴 .why the CLAUSE rides, and does not merely the role
#         the stone and the count are what make the row actionable: the stone
#         says WHERE it gave up, and the count says how long its instrument has
#         been broken. a row that carried only the role would put a reader back
#         on a `crew.read` round trip to learn either — the exact cost the plea
#         arm's own note measures at 7-of-7 wasted drill-ins in one tick.
__crew_record_escalation() {
  local uri="$1" line="${2:-}" role tree clause=""
  [[ -n "$uri" ]] || return 0
  role="${uri##*/}"
  tree="${uri%/*}"
  tree="${tree##*/}"            # drops the host segment, if any
  [[ -n "$tree" && -n "$role" ]] || return 0
  case "$line" in
    *'ESCALATION SEEN — '*)
      clause="${line#*ESCALATION SEEN — }"
      clause="${clause%% — the clone gave up*}"   # drop the advisory tail
      clause="${clause#\"}"                       # duct.poll already quoted it,
      clause="${clause%\"}"                       # and our own row quotes again
      ;;
  esac
  # NEWLINE-delimited, like the plea map: the clause holds spaces
  CREW_ESCALATION["$(__crew_canon "$tree")"]+="${role}=${clause}"$'\n'
}

# .what = file one role's context-left percentage under its tree
# .why  = keyed like the escalation map above, one canon key, no second
#         derivation to drift.
# ⚠️ .the PERCENT rides, never a bare flag. a reader cannot rank two trees on
#         "low" alone, and the number is the whole content of the signal — a
#         tree at 2% and a tree at 9% are not the same subject.
__crew_record_compact() {
  local uri="$1" line="${2:-}" role tree pct=""
  [[ -n "$uri" ]] || return 0
  role="${uri##*/}"
  tree="${uri%/*}"
  tree="${tree##*/}"            # drops the host segment, if any
  [[ -n "$tree" && -n "$role" ]] || return 0
  case "$line" in
    *'CONTEXT LOW — '*)
      pct="${line#*CONTEXT LOW — }"
      pct="${pct%%\% until auto-compact*}"
      ;;
  esac
  [[ -n "$pct" ]] || return 0
  CREW_COMPACT["$(__crew_canon "$tree")"]+="${role}=${pct}"$'\n'
}

# .what = file one role whose 🔍 stone outlived a FAILED arrive, under its tree
# .why  = keyed identically to the maps above, for the same reason — one canon
#         key the render joins, with no second derivation to drift.
# 🔴 .why it is named for the OBSERVATION and not for a state
#         `phantom` was the first reach and it is already taken — it names a
#         RECORD WHOSE SUBJECT IS GONE (a registry row that outlives its tree),
#         and its `👻` glyph carries an open dispute of its own. so this map is
#         named for the fact it holds — an arrive that failed — which coins no
#         noun and overloads none (rule.forbid.domain-term-ambiguity).
# 🔴 .why the FAILED LINE rides in the value rather than a bare flag
#         the row's whole claim is a CONTRADICTION between two halves, so a
#         reader who cannot see which arrive failed cannot settle it. `role=1`
#         would say "this crew is off" and leave the read unguided — exactly
#         the classify-without-guide shape the footer exists to avoid.
__crew_record_arrivefail() {
  local uri="$1" line="${2:-}" role tree what=""
  [[ -n "$uri" ]] || return 0
  role="${uri##*/}"
  tree="${uri%/*}"
  tree="${tree##*/}"            # drops the host segment, if any
  [[ -n "$tree" && -n "$role" ]] || return 0
  case "$line" in
    *'the spawn of it FAILED here: "'*)
      what="${line#*the spawn of it FAILED here: \"}"
      what="${what%%\"*}"
      ;;
  esac
  [[ -n "$what" ]] || return 0
  CREW_ARRIVEFAIL["$(__crew_canon "$tree")"]+="${role}=${what}"$'\n'
}

# .what = file one role whose last TURN has ENDED — a fact, never a verdict
# .why  = keyed identically to the maps above, one canon key, no second
#         derivation to drift.
# 🔴 .why the CLAUSE rides rather than a bare flag
#         the whole content of this signal is HOW LONG the turn has been over.
#         `role=1` says "this crew is between turns" and leaves a reader unable
#         to rank it — a turn ended 40 seconds ago is a clone about to pick its
#         queue up; one ended 40 minutes ago is a tree no one drives.
__crew_record_turnended() {
  local uri="$1" line="${2:-}" role tree clause=""
  [[ -n "$uri" ]] || return 0
  role="${uri##*/}"
  tree="${uri%/*}"
  tree="${tree##*/}"            # drops the host segment, if any
  [[ -n "$tree" && -n "$role" ]] || return 0
  case "$line" in
    *'TURN ENDED SEEN — "'*)
      clause="${line#*TURN ENDED SEEN — \"}"
      clause="${clause%%\"*}"
      ;;
  esac
  [[ -n "$clause" ]] || return 0
  CREW_TURNENDED["$(__crew_canon "$tree")"]+="${role}=${clause}"$'\n'
}

# .what = file one role as a clone whose turn stopped on a DECLINED modal
# .why  = keyed identically to its peers, one canon key the render joins with
#         no second derivation to drift. the CLAUSE rides rather than a bare
#         flag, for its peers' reason: a reader who cannot see WHAT was refused
#         cannot judge whether the refusal still stands.
__crew_record_declined() {
  local uri="$1" line="${2:-}" role tree clause=""
  [[ -n "$uri" ]] || return 0
  role="${uri##*/}"
  tree="${uri%/*}"
  tree="${tree##*/}"            # drops the host segment, if any
  [[ -n "$tree" && -n "$role" ]] || return 0
  case "$line" in
    *'DECLINE PARKED SEEN — "'*)
      clause="${line#*DECLINE PARKED SEEN — \"}"
      clause="${clause%%\"*}"
      ;;
  esac
  [[ -n "$clause" ]] || return 0
  CREW_DECLINED["$(__crew_canon "$tree")"]+="${role}=${clause}"$'\n'
}

# .what = file one role as the bearer of a QUEUED, unconsumed message
# .why  = keyed identically to its peers above — one canon key the render joins
#         with no second derivation to drift. the TEXT rides rather than a bare
#         flag, for the same reason the turn-ended clause does: a reader who
#         cannot see WHAT waits cannot rank it, and the whole point of the row
#         is that the message is often a human's own answer.
__crew_record_queuedrow() {
  local uri="$1" line="${2:-}" role tree text=""
  [[ -n "$uri" ]] || return 0
  role="${uri##*/}"
  tree="${uri%/*}"
  tree="${tree##*/}"            # drops the host segment, if any
  [[ -n "$tree" && -n "$role" ]] || return 0
  case "$line" in
    *'QUEUED SEEN — "'*)
      text="${line#*QUEUED SEEN — \"}"
      text="${text%%\"*}"
      ;;
  esac
  [[ -n "$text" ]] || return 0
  CREW_QUEUEDROW["$(__crew_canon "$tree")"]+="${role}=${text}"$'\n'
}

# .what = file one role as MODE LOST under its tree — it dropped
#         `--permission-mode acceptEdits`, so every file write draws a modal.
#
# 🔴 .why = it is a CAUSE, filed apart from the modal it causes. the box ladder
#         already names the modal; what it cannot say is that the next write
#         draws another one. so a supervisor keys the tree, the tick closes, and
#         the same tree is at a modal on the next tick — measured 2026-09-18 at
#         six keys in one window before anyone asked why.
#
#         keyed identically to its peers above — one canon key the render joins,
#         with no second derivation to drift. the OFFER text rides rather than a
#         bare flag, because it is claude's own words and it is what proves the
#         claim to a reader who doubts it.
__crew_record_modelost() {
  local uri="$1" line="${2:-}" role tree text=""
  [[ -n "$uri" ]] || return 0
  role="${uri##*/}"
  tree="${uri%/*}"
  tree="${tree##*/}"            # drops the host segment, if any
  [[ -n "$tree" && -n "$role" ]] || return 0
  case "$line" in
    *'MODE LOST — '*)
      text="${line#*MODE LOST — }"
      text="${text%%. *}"
      ;;
  esac
  [[ -n "$text" ]] || return 0
  CREW_MODELOST["$(__crew_canon "$tree")"]+="${role}=${text}"$'\n'
}

# .what = file one role as a RATE-LIMIT-WEDGE bearer under its tree
# .why  = keyed identically to the plea map above, for the same reason — one
#         canon key the render joins with no second derivation to drift.
__crew_record_ratelimit() {
  local uri="$1" role tree
  [[ -n "$uri" ]] || return 0
  role="${uri##*/}"
  tree="${uri%/*}"
  tree="${tree##*/}"            # drops the host segment, if any
  [[ -n "$tree" && -n "$role" ]] || return 0
  CREW_RATELIMIT["$(__crew_canon "$tree")"]+="${role}"$'\n'
}

# .what = file one role as a FELL-READY-bearer under its tree
# .why  = keyed identically to the plea map above, for the same reason
__crew_record_fellready() {
  local uri="$1" role tree
  [[ -n "$uri" ]] || return 0
  role="${uri##*/}"
  tree="${uri%/*}"
  tree="${tree##*/}"            # drops the host segment, if any
  [[ -n "$tree" && -n "$role" ]] || return 0
  CREW_FELLREADY["$(__crew_canon "$tree")"]+="${role}"$'\n'
}

# .what = file one role's usage-cap NOTICE under its tree, verbatim
#
# .why a capped clone is ALIVE but BLOCKED, and no classifier saw it
#   a clone that shows "hit your limit … resets HH:MM" keeps its input box
#   drawn, so the box arm reads it `at work` and the fleet sweep rendered it
#   healthy. duct.poll emits the notice (`🔋 cap SEEN`) but NO crew arm consumed
#   it — the exact unjoined-detector defect the plea arm warns of. measured
#   2026-09-13: rate-limited clones read `at work`, invisible to the tick.
#
# .why NEWLINE-delimited, like the stone map: the cap text holds spaces (the
#   reset time), so the space-split boxes map would shred it.
__crew_record_cap() {
  local uri="$1" line="$2" role tree cap
  [[ -n "$uri" ]] || return 0
  role="${uri##*/}"
  tree="${uri%/*}"
  tree="${tree##*/}"            # drops the host segment, if any
  [[ -n "$tree" && -n "$role" ]] || return 0
  # duct.poll renders:  └─ 🔋 cap SEEN — "…" (scrollback; join …)
  cap="${line#*cap SEEN — }"
  cap="${cap%% (scrollback*}"   # drop the advisory tail
  [[ -n "$cap" ]] || return 0
  CREW_CAP["$(__crew_canon "$tree")"]+="${role}=${cap}"$'\n'
}

# .what = file one role as MID-WORK — its pane draws a live turn frame
#
# 🔴 .why  = the STILL term of the cap join, and the cap row has asked for it
#         by name since it was written: `(scrollback; join to reset-vs-now +
#         still to judge)`. the crew layer joined reset-vs-now and a live BOX
#         and stopped there, so a clone whose cap banner had scrolled into
#         history WHILE IT WORKED graded `🚫 limited` and took a nudge.
#
# ⚠️ .why not the extant motion maps: every one of them (CREW_MOTION, the
#         `✋ BOX UNMOVED` age, `CLONE QUIET`) keys on the BOX between two
#         captures. a clone mid-turn holds an EMPTY box that STAYS empty, so
#         each reads "unchanged" and is correct to. the TURN is a different
#         subject than the BOX.
#
# .why keyed identically to the cap map above — one canon key the render
#         joins, with no second derivation to drift.
__crew_record_turnlive() {
  local uri="$1" role tree
  [[ -n "$uri" ]] || return 0
  role="${uri##*/}"
  tree="${uri%/*}"
  tree="${tree##*/}"            # drops the host segment, if any
  [[ -n "$tree" && -n "$role" ]] || return 0
  CREW_TURNLIVE["$(__crew_canon "$tree")"]+="${role}"$'\n'
}

# .what = file one role's box state under its tree, if the uri names both
__crew_record_box() {
  local uri="$1" box="$2" role tree
  [[ -n "$uri" ]] || return 0
  role="${uri##*/}"
  tree="${uri%/*}"
  tree="${tree##*/}"            # drops the host segment, if any
  [[ -n "$tree" && -n "$role" ]] || return 0
  CREW_BOXES["$(__crew_canon "$tree")"]+=" ${role}:${box}"
}

# .what = file one role's route STONE under its tree, verbatim
#
# .why VERBATIM, and why this renders no verdict of its own
#   a stone read observes WHICH stone a clone sits on and WHERE in its review
#   ladder. it observes NOTHING about whether that clone still advances — a
#   6h peer-review turn and a dead session render the identical line.
#
#   so this deliberately does NOT compute `stale`, `stalled`, `blocked`, or
#   `idle`. such a word would be a DIAGNOSIS printed in a MEASUREMENT's voice,
#   fused into one line where a reader cannot part the observed half from the
#   reasoned half (term=volunteered-diagnosis). duct.poll already shipped that
#   defect twice — `📬 QUEUED — input waits; mechanic busy, will consume it`
#   asserts a future no pane read can establish.
#
#   the sweep is where the WHOLE FLEET is read, so a fused verdict here costs
#   most. the change axis (🌊/🧊) is the honest liveness signal and it already
#   has an owner; this column answers only "where on the route".
__crew_record_stone() {
  local uri="$1" line="$2" role tree stone
  [[ -n "$uri" ]] || return 0
  role="${uri##*/}"
  tree="${uri%/*}"
  tree="${tree##*/}"            # drops the host segment, if any
  [[ -n "$tree" && -n "$role" ]] || return 0
  # 🔴 .why the prefix is stripped by the TREE GLYPH and not by the 🗿 marker
  #   this read `stone="${line#*🗿 }"` for the life of the sweep — a strip that
  #   NAMES ONE 🗿 in a line that can hold TWO
  #   (`rule.require.enumerate-before-you-name`, the eighth instance on record).
  #
  #   duct.poll's relic row carries its own marker INSIDE its message:
  #     `   └─ relic — no live clone in this pane; a stale 🗿 line sits in
  #      scrollback, not current route state`
  #   so the shortest-match ate up to the EMBEDDED marker and stored
  #   `line sits in scrollback, not current route state` — a fragment whose
  #   first word is neither `relic` nor a stone name, so the tally's `relic*)`
  #   arm could never fire and the catch-all swallowed all 20 of them into
  #   `🔍 in review` (measured 2026-09-16, star scope: the row read `🔍 23`
  #   where the render showed ONE).
  #
  # ⚠️ the strip must key on the TREE GLYPH, which every consumed line carries
  #   exactly once (the call site matches `'   ├─ '*|'   └─ '*`). `─` is
  #   U+2500; the relic message's `—` is U+2014, so a shortest match cannot
  #   reach past the prefix. THEN drop the marker, only if this line bears one.
  stone="${line#*─ }"
  stone="${stone#🗿 }"
  # drop the tail terminal chrome — duct.poll pads a right-aligned notice
  # (e.g. `0% until auto-compact`) onto the same row, behind a run of spaces
  stone="${stone%%"  "*}"
  stone="${stone%"${stone##*[![:space:]]}"}"   # rtrim
  [[ -n "$stone" ]] || return 0
  # .why NEWLINE-delimited, where CREW_BOXES is space-delimited
  #   a box value is one token (`mechanic:empty`), so the boxes map can lean
  #   on word-splitting. a STONE holds spaces and commas
  #   (`5.1.execution.from_vision, review.peer, l3@i003`), so the same
  #   unquoted expansion would shred it into fragments and render one row per
  #   word. the delimiter must not occur in the value.
  CREW_STONES["$(__crew_canon "$tree")"]+="${role}=${stone}"$'\n'
}

# .what = file one role's STILL age under its tree — how long its pane has not moved
#
# .why the AGE and not a flag
#   duct.poll's own comment says it: the baseline is refreshed only when the
#   pane MOVED, so the hash file's mtime dates the last motion rather than the
#   last poll. that makes `(23m)` a real duration, and it is the whole datum —
#   "unchanged" with no age cannot part a clone idle two minutes from one idle
#   two hours, and the tick's rule turns on exactly that ("unchanged A WHILE").
#
# .why this renders no verdict either
#   same refusal as the stone recorder above. an age is an OBSERVATION; `stale`,
#   `stalled`, and `idle` are DIAGNOSES, and a pane that has not moved in 40m may
#   hold a clone mid-tool-call that is perfectly healthy. the reader joins the age
#   to the box and the stone and decides — this column does not decide for them
#   (term=volunteered-diagnosis).
#
# ⚠️ .the caveat a reader MUST carry: a SHARED age dates an EVENT, not idleness
#   the age is the mtime of a hash file, and that file is rewritten whenever the
#   duct moved. so N ducts that read the SAME figure did not independently fall
#   still at the same instant — something at that instant touched all N.
#
#   observed on this column's first live run: five ducts at `3m`, two at `16m`,
#   two at `133m`. that is a cluster, and a cluster is a history of events (a
#   prior sweep, a resize, a terminal attach), never nine separate stall clocks.
#
#   so the sound read is COMPARATIVE, never absolute: within one poll, a duct
#   whose age stands ALONE and is LARGE is the one worth a drill-in. a figure
#   shared with its neighbours says only "we were all touched then".
#
#   this is `rule.require.nudge-parked-clones` mute #4, and it applies to this
#   column exactly as it applies to the raw duct.poll figures it is derived
#   from — the join inherits its source's caveats along with its data.
__crew_record_motion() {
  local uri="$1" line="$2" role tree age
  [[ -n "$uri" ]] || return 0
  role="${uri##*/}"
  tree="${uri%/*}"
  tree="${tree##*/}"            # drops the host segment, if any
  [[ -n "$tree" && -n "$role" ]] || return 0
  # `   ├─ 🧊 unchanged (23m)` -> `23m`; a bare `unchanged` with no age yields ""
  case "$line" in
    *'('*')'*) age="${line#*(}"; age="${age%%)*}" ;;
    *)         age="" ;;
  esac
  [[ -n "$age" ]] || return 0
  CREW_MOTION["$(__crew_canon "$tree")"]+="${role}=${age}"$'\n'
}

# .what = did this host refuse to answer on this sweep?
#
# .why  = a crew whose grove we could not ask is NOT down. `down` says a crew
#         died and its tree stands — a claim about the world. this says only
#         that we could not look, which is a claim about the INSTRUMENT, and
#         the two take opposite cures: a boot versus a wake.
#
#      🔴 they are byte-identical from here. a grove that answers nought and a
#         grove that genuinely holds no session both yield an empty list, so
#         the ONLY thing that parts them is whether the list call FAILED — and
#         that fact lives here and nowhere else.
__crew_host_unreached() {
  local h="$1" u
  [[ -n "$h" ]] || return 1
  for u in "${HOSTS_UNREACHED[@]}"; do
    [[ "$u" == "$h" ]] && return 0
  done
  return 1
}

__crew_derive_sessions() {
  local host="$1" rc=0 sessions="" session __c
  sessions=$(__duct_list_host_sessions "$host") || rc=$?
  if (( rc != 0 )); then
    HOSTS_UNREACHED+=("$host")
    return 0
  fi
  while IFS= read -r session; do
    [[ -n "$session" ]] || continue
    [[ "$session" == */* ]] || continue
    __c="$(__crew_canon "${session%/*}")"
    # .why a bare branch name is never a crew tree — task #46, measured
    #   2026-09-13: a raw tmux session named `main/mechanic` sat on the
    #   grove (a plain shell that a tool OUTSIDE the crew layer set up,
    #   to run grove.reply commands) and this loop picked it up on every
    #   poll, unconditionally — the only prior filter was `*/*`.
    #
    # ⚠️ the test itself now lives in crewwork.sh as `__crew_is_crew_tree`,
    #   because it is a rule about the NAME and THREE arms of this
    #   derivation yield a name. it was inline here for a day, so arm 3
    #   (the duct registry, below) could not share it and silently did
    #   not — see that predicate's header for the seven-tick cost.
    [[ -n "$(__crew_is_crew_tree "$__c")" ]] || continue
    # ⚠️ the ROLE takes the same undo as the tree above. tmux underscores EVERY
    #    '.', so a dotted role surfaces in `crew_who` as `reviewer_take` — the
    #    substrate's form, printed where a human reads a name they may re-type
    CREW_ROLES["$__c"]="${CREW_ROLES[$__c]:-} $(__crew_canon "${session##*/}")"
    # 🔴 DISPLAY is a LIVENESS SET, and its VALUE is never a label
    #   the name is misleading and the map is real: what it stores is tmux's own
    #   session name (`a_b_c`), filed under the canonical key (`a.b.c`). so its
    #   value is the SUBSTRATE's form of a name the domain spells differently,
    #   and `--tree` speaks only the canonical one.
    #   ⇒ its ONE honest consumer is `[[ -v DISPLAY["$t"] ]]` in the unsponsored
    #     sweep below: a membership test that asks "does this tree hold a live
    #     tmux session?" and reads no value at all.
    #   ⇒ every RENDER names a tree by its canon key. clamped at [case48]; the
    #     measured cost of the twelve dereferences that preceded it is recorded
    #     above the ACTIONS block (one render, two names for one tree)
    DISPLAY["$__c"]="${session%/*}"
    __duct_host_is_here "$host" && CREW_HOST["$__c"]="" || CREW_HOST["$__c"]="$host"
    SEEN["$__c"]=1
  done <<< "$sessions"
}

######################################################################
# __poll_gather_crews — the state, then the arms that derive the crew set
######################################################################
#
# .note = the body is the poll's own top-level code, moved VERBATIM and left
#         unindented, so `git diff --color-moved` and `git blame -C` trace
#         every line to its origin. a `declare` here carries `-g`: at top
#         level it was global, and a stage that shares its maps with the
#         stages after it must keep them so.
__poll_gather_crews() {
declare -gA CREW_BOXES=()   # canon -> " role:box role:box"
declare -gA CREW_STONES=()  # canon -> " role=stone role=stone"
declare -gA CREW_MOTION=()  # canon -> "role=age\n" — STILL ducts only

# .what the delegated poll's OWN motion tally, carried through rather than dropped
#
# .why it needs no flag of its own
#   `rule.require.pause-babysit-cron-after-idle-streak` counts a no-change tick,
#   and the only instrument that answers "did the fleet move?" is duct.poll's
#   content-hash compare. `--boxes` ALREADY pays for that call and already
#   receives the answer — it simply parsed the box line and let the tally go.
#
#   so a tick that wanted the streak had to run a SECOND full duct sweep. that
#   is two sweeps for one question, and the second one is the expensive kind:
#   it reads every duct again, and for any duct that moved in the first call it
#   reports `unchanged` — because duct.poll refreshes the baseline on a mover.
#   so the second sweep is not merely redundant, it is LESS TRUE than the first.
#
#   this is the same shape `--stones` closed: the datum was fetched and thrown
#   away, and the caller paid twice to get it back. carried here for free.
DUCT_CHANGED=""
DUCT_STILL=""

declare -gA CREW_PLEA=()    # canon -> "role=grantcmd\n" per role whose pane held a plea
declare -gA CREW_COUNCILASK=()  # canon -> "role=clause\n" per role halted on a FULCRUM COUNCIL — a human gate that carries NO grant command, so the plea map is blind to it
declare -gA CREW_ESCALATION=()  # canon -> "role=clause\n" per role that GAVE UP and asked for a human
declare -gA CREW_COMPACT=()     # canon -> "role=pct\n" per role near auto-compact (WATCH, never a gate)
declare -gA CREW_ARRIVEFAIL=()  # canon -> "role=failedcmd\n" per role whose 🔍 stone outlived a failed arrive
declare -gA CREW_TURNENDED=()   # canon -> "role=clause\n" per role whose last turn has ENDED (a FACT — the JOIN that makes it actionable is made at each read site)
declare -gA CREW_DECLINED=()    # canon -> "role=clause\n" per role whose turn stopped on a DECLINED modal (a FACT, and the one turn-end claude prints no epilogue for)
declare -gA CREW_QUEUEDROW=()   # canon -> "role=text\n" per role whose pane holds a SUBMITTED, unconsumed message (a FACT, and the only witness once the turn has ended — the box's own `queued` arm goes blind there)
declare -gA CREW_MODELOST=()    # canon -> "role=offer\n" per role whose pane proves it lost --permission-mode acceptEdits (a FACT, and the CAUSE behind a perm modal that returns on every file write — a key clears one write, never the mode)
declare -gA CREW_FELLREADY=()  # canon -> "role\n" for each role whose pane declared fell-ready
declare -gA CREW_CAP=()     # canon -> "role=captext\n" for each role whose pane held a usage cap
declare -gA CREW_RATELIMIT=()  # canon -> "role\n" for each role whose pane held a rate-limit wedge
declare -gA CREW_TURNLIVE=()   # canon -> "role\n" for each role whose pane draws a LIVE turn frame
declare -gA CREW_ROLES=()   # canon -> " role role"
declare -gA SEEN=()         # canon -> 1
declare -gA DISPLAY=()      # canon -> the tmux-form name (for duct uris)

# 1. live tmux sessions — the only proof a crew is AT WORK.
#    a crew duct is <tree>/<role>; a one-segment duct is a human's own
#    shell and names no tree (term=duct._.choice._.md)
#
#    ⚠️ .why EVERY host, and not `localhost` alone
#       `crew.boot --grove cloud://<g>` puts a crew's ducts on that grove, so
#       the WRITE side has spoken grove since it shipped. this READ side asked
#       localhost and nought else — so a live grove crew missed this arm, fell
#       through to the registry-row arm below, and rendered `👻 phantom`: a
#       verdict which says its tree AND its ducts are both gone, said of a
#       crew at work on a box we never asked (term=phantom, term=false-report).
#
#       the BOX half never carried this gap — __crew_gather_boxes shells out
#       to duct.poll, which derives from duct.list and spans hosts. so one row
#       could carry a true box verdict beside a phantom crew verdict, from two
#       derivations of unequal reach inside a single report.
#
#    ⚠️ an unreachable host is REPORTED, never absorbed. a hibernated grove
#       answers nought, and silence there is byte-identical to "this grove
#       holds no crews" — so an absorbed failure would restore the exact
#       phantom defect above, one layer in (term=partial-audit: an instrument
#       owes its reader the subject set it could not read).
declare -gA CREW_HOST=()          # canon -> the grove it runs on ('' = here)
declare -ga HOSTS_UNREACHED=()

__crew_derive_sessions localhost
while IFS= read -r __h; do
  [[ -n "$__h" ]] && __crew_derive_sessions "$__h"
done < <(__duct_host_list)

# 2. the crew LEDGER — the durable trace, and the SUBJECT SET proper.
#    it holds one row per tree a crew was ever booted on, written by
#    crew.boot and never removed by crew.stop, so it survives a crash,
#    a stop, and a whole machine death.
#
#    ⚠️ .why NOT worktrees on disk, which this once used
#       disk enumerates TREES, and a tree is not a crew. measured on a
#       real fleet: 142 trees on disk against 14 that ever had a crew.
#       so a disk derivation reported ~128 crews that were NEVER BORN,
#       each rendered `💀 down — rhx git.crew.boot` — a verdict which
#       says a crew DIED where none ever existed (term=false-report).
#
#       it is EXHAUSTIVE (a crew cannot exist without a tree) and it is
#       not PRECISE, and a poll owes both. the list of every tree on the
#       machine is a different question with its own instrument:
#           git tree status --repo @all
#
#    🔴 .why the GROVE is read here too, and not the tree name alone
#       step 1 learns a host from a LIVE session, so a crew that is down
#       learns its host nowhere — and `__poll_one_tree` then reads THIS
#       disk for a tree that sits on a grove, finds nought, and the render
#       calls it `👻 phantom — tree is gone`.
#
#       measured 2026-09-02 on `demo-grove-dispatch`: rendered phantom with
#       the grove AWAKE and the worktree plainly present on it. so the
#       defect is not hibernation — a grove asleep merely makes it louder.
#       `phantom` asserts a tree is GONE, and that claim may only be drawn
#       from the box that OWNS the tree (term=phantom: reach for it only
#       where a second source says the subject is gone).
while IFS=$'\t' read -r t g; do
  [[ -n "$t" ]] || continue
  __c="$(__crew_canon "$t")"
  SEEN["$__c"]=1

  # ⚠️ `-v`, never `:-`. a LOCAL crew's host is the empty string, which is a
  #    legitimate VALUE and not an absence — so a `:-` guard would re-derive
  #    it from the ledger on every sweep and quietly outrank step 1, the one
  #    source that reads the world as it is NOW.
  if [[ ! -v CREW_HOST["$__c"] ]]; then
    CREW_HOST["$__c"]="$(__crew_grove_host "$g" 2>/dev/null || printf '')"
  fi
done < <(__crew_ledger_rows)

# 3. registry rows — a crew whose tree AND ducts are both gone still has
#    rows, and those rows are the litter a fell leaves behind. they are
#    reported 👻 rather than omitted, because a phantom you cannot see is
#    a phantom nobody cleans
#    🔴 .and it takes the SAME crew-tree test arm 1 takes, for the same reason
#       this arm minted a crew from any dir name under `ducts/`, unconditionally
#       — one statement, no screen. so leftover keyrack-probe rows
#       (`ducts/main/{keyprobe,keytest,keytest2}.json`) minted a crew named
#       `main` on every sweep, and no other arm could veto it: arm 1 screens a
#       dotless canon, arm 2 held no row for it, and a SEEN key from any arm is
#       enough. `--healable` then emitted a heal line for it across SEVEN
#       consecutive ticks, and every run cured naught at exit 0.
#
#    ⚠️ the litter is LOCAL registry rows, never the live grove tmux session of
#       the same name — arm 1 already screens that one out. two artifacts, one
#       name; a cure aimed at the tmux arm would have changed no verdict.
#       see `__crew_is_crew_tree` in work/crewwork.sh for the full record.
DUCTWORK_DIR="${DUCTWORK_DIR:-$HOME/.ductwork}"
if [[ -d "$DUCTWORK_DIR/ducts" ]]; then
  while IFS= read -r row; do
    [[ -n "$row" ]] || continue
    __c="$(__crew_canon "$(basename "$(dirname "$row")")")"
    [[ -n "$(__crew_is_crew_tree "$__c")" ]] || continue
    SEEN["$__c"]=1
  done < <(find "$DUCTWORK_DIR/ducts" -mindepth 2 -maxdepth 2 -name '*.json' 2>/dev/null)
fi

declare -ga TREES=()
while IFS= read -r t; do
  [[ -n "$t" ]] && TREES+=("$t")
done < <(printf '%s\n' "${!SEEN[@]}" | sort)

if [[ -n "$ONLY" ]]; then
  declare -ga KEPT=()
  for t in "${TREES[@]}"; do
    [[ "$t" == *"$ONLY"* ]] && KEPT+=("$t")
  done
  TREES=("${KEPT[@]}")
fi

# ── star scope: the DEFAULT — scope to the ⭐ SPONSORED trees, off eco.priority ─
#
# .why  a stars question answered by a fleet read is a wrong-AXIS miss: the fleet
#       poll ranks by MOTION, the human asked about the FUNDED set
#       (rule.always.read-stars-as-sponsored-priorities). so the DEFAULT read
#       joins the crew set to the sponsored rows of `rhx eco.priority` by tree
#       name — the common supervisor read, "how do the funded stars fare?", IS
#       the bare poll, not a 40-crew sweep the eye then filters. `--all` widens
#       to every crew; the fell/heal sweeps widen too (both decided above).
#
# .the join  each sponsored priority carries `.refTree[]` (dotted, e.g.
#            `rhachet-roles-bhrain.beav.feat-x`). TREES holds the same dotted form
#            (__crew_canon: `_`→`.`), so an exact full-line match is the join.
#
# .the invariant  an inflight tree SHOULD be sponsored
#                 (define.invariant.crew.inflight-implies-sponsored). so a non-star
#                 crew hidden here is either idle (correct to hide) or an off-budget
#                 slot — the footer counts them, never hides them silent
#                 (rule.forbid.clipped-sweeps): a hidden count is declared, and
#                 `--all` restores every crew.
STAR_HIDDEN=0
STAR_ANOMALY=0
declare -ga STAR_ANOMALY_TREES=()
if [[ "$STAR" == "true" ]]; then
  # extract ONLY the json line (the render wraps it in a mascot banner + footer;
  # the body is one line that starts with `{"verb"`). grep isolates it so jq never
  # meets the banner. if eco cannot be read, FAIL LOUD — a silent fall-through to
  # the full fleet would answer the wrong question under the right flag.
  #
  # 🔴 the read goes through a FILE, never a pipe — `__crew_eco_json_read` owns
  #    that, and it is the CURE for the 64 KiB cut rather than a guard against
  #    it. measured 1-in-8 truncations through a pipe, 0-in-8 through a file.
  __eco_json="$(__crew_eco_json_read)"
  # 🔴 the CLASSIFICATION is a pure predicate in crewwork.sh, clamped there
  #    directly against a captured truncated body (the case14 pattern). this
  #    file owns only what to DO about each verdict — so the guard that hands
  #    back fell commands for funded work cannot regress unclamped.
  __eco_verdict="$(__crew_eco_star_verdict "$__eco_json")"
  if [[ "$__eco_verdict" == "unreadable" ]]; then
    echo "🦫 tail slap — the star scope could not read the sponsored set from eco.priority" >&2
    echo "   └─ run \`rhx eco.priority get\` to diagnose; pass --all to poll the whole fleet" >&2
    exit 1
  fi
  # 🔴 a line that STARTS with `{` is not a line that PARSES — and the measured
  #    failure is exactly that gap.
  #
  #    measured 2026-09-16, six captured renders on a 96%-cpu grove: four came back
  #    70510 bytes, two came back 65606 — the body cut mid-token, at `"opine":{"s`.
  #    a TRUNCATED json body still begins with `{`, so the unreadable-branch above
  #    passes it through, and then every jq below fails silently under 2>/dev/null.
  #
  # 🔴 the harm is the confident wrong verdict, never a blank screen. with jq dead,
  #    the sponsored set reads EMPTY, so every funded star is re-classified an
  #    unsponsored INFLIGHT anomaly — and each anomaly row emits a RUNNABLE
  #    `rhx git.crew.fell --tree <t>`. a truncated read therefore hands the
  #    supervisor a list of commands to fell FUNDED work, with no tell that the
  #    verdict is wrong (term=false-report).
  #
  # ⚠️ this guard is what the row-count precondition below CANNOT be: on a
  #    truncated read `.priorities | length` fails too, so the count reads 0 and a
  #    `rows > 0` test excludes the very case it was written to catch. parse first,
  #    THEN count. bias to DETECT — a false halt costs one re-run; a miss costs the
  #    funded fleet (surgoal.polish-the-supervisor-and-prioritizer-tools).
  if [[ "$__eco_verdict" == "truncated" ]]; then
    echo "🦫 tail slap — the star scope read a TRUNCATED sponsored set from eco.priority" >&2
    echo "   ├─ the body began with \`{\` but does not parse — $(printf '%s' "$__eco_json" | wc -c) bytes, cut mid-token" >&2
    echo "   ├─ 🔴 do NOT act on an anomaly list from this poll: with the store unparseable" >&2
    echo "   │     every funded star falls out and re-renders as an off-budget tree with a" >&2
    echo "   │     runnable \`git.crew.fell\` beside it" >&2
    echo "   ├─ re-run the poll — the read is intermittent, and it fails more under grove load" >&2
    echo "   ├─ 🔴 a cut at exactly 65536 is a SHORT WRITE to the pipe, never a bad store:" >&2
    echo "   │     64 KiB is the pipe buffer, so the producer exited before its drain" >&2
    echo "   └─ the cause is eco.priority's final write — not this join, and not the store:" >&2
    echo "      .dream/v2026_09_16.fix.the-star-scope-flaps-and-hands-back-a-fell-command.md" >&2
    exit 1
  fi
  __eco_rows="${__eco_verdict#rows=}"

  __star_trees="$(printf '%s' "$__eco_json" | jq -r '.priorities[] | select(.sponsored) | .refTree[]?' 2>/dev/null)"

  # 🔴 an EMPTY star set over a NON-EMPTY store is the dangerous shape — confirm it.
  #
  #    measured 2026-09-16: two polls, one minute apart, one store, opposite
  #    verdicts — `0 shown / 28 anomaly` then `6 shown / 22 anomaly`. the store
  #    read 6 sponsored throughout. so the join FLAPS, and the flap is silent:
  #    the branch above fires only when the json is unreadable, and here the json
  #    parsed fine while every row came back `sponsored: false`.
  #
  # 🔴 the harm is not a blank screen. every star that falls out is re-classified
  #    an unsponsored INFLIGHT anomaly, and each anomaly line emits a RUNNABLE
  #    `rhx git.crew.fell --tree <t>`. so a flapped poll hands the supervisor a
  #    command to fell FUNDED work, with no tell that the verdict is wrong
  #    (term=false-report). bias to DETECT: a false halt costs one re-run; a miss
  #    costs the funded fleet (surgoal.polish-the-supervisor-and-prioritizer-tools).
  #
  # ⚠️ a star-less fleet is LEGITIMATE, so this must not refuse it. the second
  #    read is the discriminator, never a retry that hides the defect:
  #      - both empty  → the store agrees. render `0 shown`, correct
  #      - they differ → the join flapped. FAIL LOUD and name it
  #    and it costs naught in the normal case — the second read runs ONLY when
  #    the first came back empty.
  if [[ -z "$__star_trees" && "$__eco_rows" -gt 0 ]]; then
    __eco_json2="$(__crew_eco_json_read)"
    __star_trees2="$(printf '%s' "$__eco_json2" | jq -r '.priorities[] | select(.sponsored) | .refTree[]?' 2>/dev/null)"
    if [[ -n "$__star_trees2" ]]; then
      echo "🦫 tail slap — the star scope FLAPPED: read 1 saw 0 sponsored, read 2 saw $(printf '%s\n' "$__star_trees2" | grep -c .)" >&2
      echo "   ├─ the store holds ${__eco_rows} row(s), so 0 sponsored is not a verdict — it is a bad read" >&2
      echo "   ├─ 🔴 do NOT act on an anomaly list from a flapped poll: every star that falls out" >&2
      echo "   │     is re-rendered an off-budget tree with a runnable \`git.crew.fell\` beside it" >&2
      echo "   ├─ re-run the poll — the second read already agreed with the store" >&2
      echo "   └─ the cause is the eco store's rebuild, not this join:" >&2
      echo "      .dream/v2026_09_14.fix.the-store-is-concurrency-safe-by-accident.md" >&2
      exit 1
    fi
  fi

  declare -ga KEPT=()
  for t in "${TREES[@]}"; do
    if printf '%s\n' "$__star_trees" | grep -qxF "$t"; then
      KEPT+=("$t")
    else
      STAR_HIDDEN=$(( STAR_HIDDEN + 1 ))

      # 🔴 an excluded tree that is INFLIGHT is an ANOMALY, never a hidden row.
      #    the invariant's contrapositive is ¬sponsored ⟹ ¬inflight, and its
      #    tool clause is explicit: an unsponsored tree that is INFLIGHT
      #    "is surfaced as an anomaly — a row flagged ⚠️ — to settle"
      #    (define.invariant.crew.inflight-implies-sponsored). that clause went
      #    unimplemented, so idle and inflight folded into one count alike.
      #
      #    measured 2026-09-15: rhachet-roles-ehmpathy.beav.feat-require-commit-
      #    sponsor held 6 live ducts, carried a HUMAN GATE (`--as overruled`),
      #    and appeared in NO default poll and in no anomaly line. the harm is
      #    not a wrong verdict — it is an ABSENT one the tally reports as
      #    health, so the gate went unrelayed on every tick (term=partial-audit).
      #
      # ⚠️ the discriminator is LIVENESS, never membership. every tree in this
      #    sweep sits in the ledger, so a membership test flags all of them.
      #    `DISPLAY` is written by arm 1 ALONE — the live-tmux derivation — so
      #    a key here means the tree holds a live session, which is exactly the
      #    invariant's own .why: "every slot an unfunded tree holds is one a
      #    funded star cannot have".
      if [[ -v DISPLAY["$t"] ]]; then
        STAR_ANOMALY=$(( STAR_ANOMALY + 1 ))
        STAR_ANOMALY_TREES+=("$t")
      fi
    fi
  done
  TREES=("${KEPT[@]}")
fi

}
