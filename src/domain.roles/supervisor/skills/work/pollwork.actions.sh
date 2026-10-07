#!/usr/bin/env bash
######################################################################
# pollwork.actions — the ACTIONS list: every row a supervisor can act on
#
# 🔴 .a PART of pollwork.sh — sourced, never executed, and only BY pollwork.sh.
#     git.crew.poll.sh sources pollwork.sh, which loads every part. see
#     __poll_load_parts there for why the poll is cut into parts at all.
#
# .holds = the __poll_render_actions stage
######################################################################

######################################################################
# __poll_render_actions — collect every actionable row, then print them
######################################################################
#
# .note = the body is the poll's own top-level code, moved VERBATIM and left
#         unindented, so `git diff --color-moved` and `git blame -C` trace
#         every line to its origin. a `declare` here carries `-g`: at top
#         level it was global, and a stage that shares its maps with the
#         stages after it must keep them so.
__poll_render_actions() {
# the orphan line sits FIRST among the actions, because it is the one
# state that loses work. every other row is a decision; this one is a
# countdown — a dirty crewless tree is work that exists and that nobody
# is on, and no prior instrument named it
ACTIONS=()
# 🔴 the COUNT row states the class; the per-tree rows name the subjects
#
#   neither substitutes for the other — the same split [case39] holds for the
#   👻 phantom row, and [case44] for ✂️ clipped. the count answers HOW MANY and
#   WHY it matters; a reader cannot act on either without the other.
#
# .why the move is a BOOT and not a fell: the tree is DIRTY by the gate's own
#   predicate, so `git.tree.del` would refuse it — the same reason the fellable
#   collector excludes dirty trees. a boot puts a clone back on the work; to set
#   it aside is the human's call, and it needs the name just as much.
(( ORPHANED > 0 )) && ACTIONS+=("⚠️  $ORPHANED WORK ORPHANED — a crew with no clone, on a dirty tree. boot it or set the work aside")
while IFS= read -r __ow; do
  [[ -n "$__ow" ]] || continue
  ACTIONS+=("⚠️  ORPHANED — $__ow — work with nobody on it; boot a crew back onto it: rhx git.crew.boot --tree $__ow")
done <<< "$ORPHANED_WHO"

# 🔴 .the MODAL row — the ONE action in this footer whose actor is the READER
#
#   every peer below names work for somebody else: a mechanic to steer, a human
#   to ask, a foreman to tell. a 🚧prompt is a clone stopped at a keyboard the
#   supervisor itself holds, and its cure is one keystroke — so it sits second,
#   under the orphan row alone, and above every row a supervisor must delegate.
#
# 🔴 .why it was absent, and why the absence was invisible
#   it was the only member of the NAMED family — PLEA SEEN, FELL-READY SEEN,
#   BOX UNMOVED, CLONE QUIET, CI FAILED, ESCALATION — with no row of its own.
#   the box census ~370 lines up already grades the gap, in its own words:
#
#     > a modal is a clone stopped at a keyboard nobody watches — the single
#     > most costly row a tick can hold … the `BOX UNMOVED` join names a role
#     > only where it did NOT move. a modal raised THIS poll moves, so it is
#     > absent there by construction ⇒ the costliest state is exactly the one
#     > that stays anonymous.
#
#   measured 2026-09-16, two consecutive babysit ticks: `🚧prompt × 1` in the
#   census, `✨ naught to act on` in the footer directly beneath it. it was
#   answered both times only because a supervisor re-scanned the census rows by
#   EYE — the exact habit `rule.always.poll-the-fell-and-heal-sets` forbids, and
#   the one this footer exists to make unnecessary.
#
# 🔴 .it names a READ, never a key
#   the option COUNT is unknowable from here, and decline is always the LAST
#   option. so a prescribed `--keys 2` would send "yes, and don't ask again" on
#   every three-option modal — a grant beyond this run, and never the
#   supervisor's to give (rule.forbid.self-grant-human-gates).
#   ⇒ same discipline the ESCALATION row above states outright: name the read.
#   ⇒ and the gap is not the modal's alone. the census names roles for FOUR box
#     states; exactly TWO of them are the supervisor's own act, and neither had
#     a row. the other two are correctly silent and stay so:
#
#       🚧prompt     the supervisor's  — answer it
#       ✍️prefilled  the supervisor's  — submit it
#       📬queued     NOT ours — already submitted; the clone drains it
#       ❔unread     NOT ours — unreadable AND inert; the UNMOVED join has it
#
# 🔴 .the prefilled row names a --raw read, and the flag is the whole point
#   a box's text is EITHER typed or an autocomplete ghost, and a plain read is
#   colour-blind to the difference. an Enter on a ghost SUBMITS A WORD NO HUMAN
#   WROTE (term=duct.box.ghost) — so the raw check is the act, and the Enter is
#   what follows it.
if [[ "$BOXES" == "true" ]]; then
  for __mw in ${BOX_WHO["🚧prompt"]:-}; do
    [[ -n "$__mw" ]] || continue
    __mtree="${__mw%%/*}"; __mrole="${__mw#*/}"
    # ⚠️ the name is the CANON key, never DISPLAY's value — see the block above
    #    `for __et in` below, and git.crew.poll.sh's own rule at the FAILED_TREES
    #    collector: DISPLAY holds tmux's underscored session name
    __mname="$__mtree"
    ACTIONS+=("🚧 MODAL — ${__mname}/${__mrole} is stopped at a prompt nobody answered — read it, COUNT its options, then answer: rhx git.crew.read --tree ${__mname} --who ${__mrole} --lines 40")
  done
  for __mw in ${BOX_WHO["✍️prefilled"]:-}; do
    [[ -n "$__mw" ]] || continue
    __mtree="${__mw%%/*}"; __mrole="${__mw#*/}"
    __mname="$__mtree"
    ACTIONS+=("✍️  UNSENT — ${__mname}/${__mrole} holds text nobody submitted — read it RAW first, a ghost is not typed text: rhx git.crew.read --tree ${__mname} --who ${__mrole} --raw --lines 20")
  done
fi

# 🔴 the ESCALATION rows sit ABOVE the pleas, and they are the only rows here
#   that carry a clone's OWN request rather than a supervisor's inference.
#   every other action line is derived; this one is quoted.
#
# 🔴 .the row GUIDES rather than classifies, and the guidance is counter-intuitive
#   the obvious read of `stuck after 51 attempts` is "this driver is lost, tell it
#   what to do" — and that read is wrong in all three measured instances. the
#   driver's own prose above the crash is coherent; what failed is `route.drive`
#   inside the stop hook, so the count measures the INSTRUMENT's age, never the
#   driver's confusion. a supervisor who routes it to the driver spends a turn on
#   a clone that is not confused — and `rule.forbid.steer-a-clone-beyond-a-
#   permission-key` forbids that turn outright.
#   ⇒ so the row says what the count means, and names the read rather than a send
#   (rule.require.poll-recommends-every-cure-heal-has).
#
######################################################################
# 🔴 EVERY ACTIONS row below names a tree by its CANON key — never DISPLAY
######################################################################
#
# .what = the loop variables here (`$__et`, `$__tt`, `$__ct`, …) ARE the
#   canonical dotted slug, because every map they walk is keyed by
#   `__crew_canon`. so the bare variable is the name to print, and
#   `${DISPLAY[$x]:-$x}` is strictly worse than a plain read of it.
#
# 🔴 .why — DISPLAY is a LIVENESS SET whose value is never a label
#   `DISPLAY["$__c"]="${session%/*}"` stores tmux's own session name, and tmux
#   forbids '.' so it writes '_'. the map therefore holds `a_b_c` under the key
#   `a.b.c` — the SUBSTRATE's form, filed under the domain's. its one honest
#   consumer is the `[[ -v DISPLAY["$t"] ]]` membership test in the unsponsored
#   sweep, which reads no value at all.
#
# ⚠️ .this file already stated the rule, and it reached ONE row
#   the FAILED_TREES collector carries it verbatim — "the name here is `$tree`,
#   and NEVER `DISPLAY[$tree]`" — written 2026-09-05 after an emitted
#   `--tree test-fns_beav_feat-tempdir-autoprune` resolved to no tree. the rule
#   was true and its blast radius was one line; twelve dereferences survived it.
#
# 🔴 .measured 2026-09-18 — ONE poll, ONE render, TWO names for one tree:
#       tree row    — rhachet-roles-bhrain.beav.feat-acceptance-under-5min
#       ACTIONS row — rhachet-roles-bhrain_beav_feat-acceptance-under-5min
#   a supervisor cannot tell those are the same crew, and the CONTEXT LOW row
#   carried the identical split in the same output — so this was never a slip in
#   one row, it was the shape every row inherited (term=false-report: the render
#   is internally inconsistent about the identity of its own subject).
#
# ⇒ clamped whole-file at [case48] in work.surface.poll.integration.test.ts, because
#   a per-row fixture goes green on the one cured row and says naught about the
#   rest — which is exactly how the 2026-09-05 rule failed to spread.
######################################################################
for __et in "${!CREW_ESCALATION[@]}"; do
  while IFS= read -r __eline; do
    [[ -n "$__eline" ]] || continue
    __erole="${__eline%%=*}"
    __eclause="${__eline#*=}"
    ACTIONS+=("🙋 ESCALATION — ${__et}/${__erole} GAVE UP and asked for a human: \"${__eclause}\" — the count is its INSTRUMENT's (a crashed route.drive stop hook), never the driver's fault. read it: rhx git.crew.read --tree ${__et} --who ${__erole} --lines 60")
  done < <(sort -u <<< "${CREW_ESCALATION[$__et]}")
done
# 🔴 .why a TURN-ENDED row, beside the escalation rows above
#   both name a clone that has STOPPED and renders like health. they differ in
#   who says so: an escalation is the clone's own words, and this is the pane's
#   own arithmetic — a turn that is over, beside a box that still holds a
#   message no turn will drain.
#
# .the CLAUSE rides so a reader can RANK. a turn ended 40 seconds ago is a clone
#   about to pick the queue up; one ended 40 minutes ago is a tree no one drives,
#   and the row is worth acting on at once.
#
# ⚠️ .it names a READ first, never a bare Enter. the box may hold a ghost rather
#   than a typed message (term=duct.box.ghost), and an Enter on a ghost submits
#   a payload no human authored — the recorded harm that
#   `rule.require.distinguish-prefilled-from-suggested` exists to prevent. so
#   the row sends a reader to the pane, and names the submit as the move AFTER.
#
# 🔴 .the `:queued` guard is what makes this a ROW rather than noise
#   `CREW_TURNENDED` holds every clone BETWEEN turns, which on an idle fleet is
#   most of them — the detector reports a fact, and a fact is not an action. the
#   JOIN is the action, and it is made here, per role, off that role's own box.
#   ⇒ the same join the ladder arm makes, so the two can never disagree.
#   ⚠️ a fleet-wide row on the bare tense would train a reader to skip the
#     whole ACTIONS block (rule.forbid.overzealous-blockers), which costs more
#     than the row could ever buy.
for __tt in "${!CREW_TURNENDED[@]}"; do
  while IFS= read -r __tline; do
    [[ -n "$__tline" ]] || continue
    __trole="${__tline%%=*}"
    __tclause="${__tline#*=}"
    # 🔴 TWO witnesses, and the second is the one that matters here. the box's
    #   `queued` state keys on claude's footer hint, which claude prints only
    #   WHILE A TURN RUNS — so on the very clone this row exists for, one whose
    #   turn has ENDED, the box reads `empty` and the first witness is silent.
    #   `CREW_QUEUEDROW` reads the highlight on the parked row itself, which
    #   survives the turn. measured 2026-09-16: two full ticks of silence over a
    #   human's own answer (rule.require.a-cue-is-not-a-claim — two nets, neither
    #   can be wrong, and they can only both-miss or one-catch).
    # the gate, stated locally — CREW_TURNENDED is built from live panes, so a
    # dead crew has no row here at all. that is an INHERITED guarantee, and an
    # inherited one is what [case17] exists to refuse: it cannot be read at the
    # dereference, so it cannot be checked there either.
    [[ -n "${CREW_ROLES[$__tt]:-}" ]] || continue
    __tqueued=""
    case " ${CREW_BOXES[$__tt]:-} " in *" ${__trole}:queued "*) __tqueued=1 ;; esac
    case "${CREW_QUEUEDROW[$__tt]:-}" in *"${__trole}="*) __tqueued=1 ;; esac
    [[ -n "$__tqueued" ]] || continue
    ACTIONS+=("🛑 TURN ENDED — ${__tt}/${__trole} finished its turn (\"${__tclause}\") and a message still sits in its box. no turn runs, so no turn will drain it — this clone is STOPPED, not busy. read it FIRST (the box may hold a ghost, never a typed message): rhx git.crew.read --tree ${__tt} --who ${__trole} --raw --lines 60")
  done < <(sort -u <<< "${CREW_TURNENDED[$__tt]}")
done
# 🔴 .the DECLINE-PARKED row — the twin of the one above, for the turn-end that
#   prints no epilogue. its join is the INVERSE: the row above fires on a box
#   that still holds a message, and this one fires on a box that holds naught.
#   a decline with a queued message behind it is the row above's, and the relay
#   is the sharper cure there (rule.forbid.overzealous-blockers).
#
# 🔴 .why it names a READ and no cure. a decline is a deliberate verdict by
#   whoever held that keyboard, and no detector can tell a human's from a
#   supervisor's answer to a modal. to nudge would overturn a decision
#   (rule.forbid.steer-a-clone-beyond-a-permission-key), so the row hands the
#   reader the pane and the fact, and stops there.
#   ⇒ the same shape the CONTEXT-LOW row below takes, and for the same reason:
#     `rule.require.poll-recommends-every-cure-heal-has` asks a row to surface
#     the cure that EXISTS, and where none does, to say so out loud.
for __tt in "${!CREW_DECLINED[@]}"; do
  while IFS= read -r __dline; do
    [[ -n "$__dline" ]] || continue
    __drole="${__dline%%=*}"
    __dclause="${__dline#*=}"
    # the same local gate as the TURN-ENDED row above, and for the same reason
    [[ -n "${CREW_ROLES[$__tt]:-}" ]] || continue
    __dqueued=""
    case " ${CREW_BOXES[$__tt]:-} " in *" ${__drole}:queued "*) __dqueued=1 ;; esac
    case "${CREW_QUEUEDROW[$__tt]:-}" in *"${__drole}="*) __dqueued=1 ;; esac
    [[ -z "$__dqueued" ]] || continue
    ACTIONS+=("⛔ DECLINE PARKED — ${__tt}/${__drole} had a modal REFUSED (\"${__dclause}\") and its turn stopped there, above an empty box. claude prints no epilogue after a decline, so this reads as healthy everywhere else. NO nudge is prescribed — a decline is a deliberate verdict and a tool may not overturn one. read it, then decide: rhx git.crew.read --tree ${__tt} --who ${__drole} --raw --lines 60")
  done < <(sort -u <<< "${CREW_DECLINED[$__tt]}")
done
# .why a CONTEXT-LOW row at all, when no lever rides with it
#   the compact is silent and unprompted: the clone loses the middle of its own
#   conversation and keeps typing, so the first visible symptom is a coherence
#   drop with no cause on the pane. a supervisor who saw the number BEFORE the
#   drop reads the drop correctly; one who did not diagnoses a confused driver.
#   ⇒ the value is the WARNING, and a warning is a real thing for a row to carry.
#
# 🔴 .why it names NO command, deliberately
#   `/clear` and `/compact` are both steers beyond a permission key
#   (rule.forbid.steer-a-clone-beyond-a-permission-key), and either would destroy
#   the conversation the row exists to protect. so the row states the cost and
#   stops. `rule.require.poll-recommends-every-cure-heal-has` asks a row to
#   surface the cure that EXISTS — and here there is none, which the row says
#   out loud rather than implies by omission.
#
# ⚠️ .it is NOT `/clear to save NNNK tokens`. that line reports cumulative SPEND
#   (763K measured, past any window) and rides on healthy panes. the two were
#   filed as one fact and are two (task #86, claim refuted 2026-09-15); the
#   discriminator is clamped in `__duct_pane_compact_percent`.
for __ct in "${!CREW_COMPACT[@]}"; do
  while IFS= read -r __cline; do
    [[ -n "$__cline" ]] || continue
    __crole="${__cline%%=*}"
    __cpct="${__cline#*=}"
    ACTIONS+=("🧠 CONTEXT LOW — ${__ct}/${__crole} is at ${__cpct}% until auto-compact. it will lose the middle of its own conversation, unprompted. NO lever is owed — the compact fires itself, and /clear or /compact from a supervisor would destroy what this warns about. expect a coherence drop, and do NOT read it as a confused driver")
  done < <(sort -u <<< "${CREW_COMPACT[$__ct]}")
done
# 🔴 .why a STONE-vs-PANE row outranks the two above in what it costs to miss
#   every other row here adds a fact to a read. this one SUBTRACTS a false one:
#   the sweep's own `🔍` says a peer review is in flight, which is the single
#   verdict that tells a supervisor to leave a crew alone. so the miss does not
#   merely withhold — it actively routes attention away from the tree that needs
#   it. measured 2026-09-15 on FOUR captured panes.
#
# 🔴 .why the row carries a READ and never a cure
#   there IS no cure verb for this. the fix is a re-arrive, which is the
#   DRIVER's act on its own route — a supervisor who sent one would steer a
#   clone past a permission key (rule.forbid.steer-a-clone-beyond-a-permission-key).
#   what a supervisor owes is to look, and to stop treating the tree as busy.
#   ⇒ so the runnable line is the read, and the row says so rather than fake a
#   lever (rule.require.poll-recommends-every-cure-heal-has: the cure a row owes
#   is the cure that EXISTS).
#
# 🔴 .why the row names no new STATE, and reuses the generic ⚠️
#   the first draft read `👻 PHANTOM?`. `term=phantom` is already a record whose
#   subject is GONE, and `👻` is its glyph — with an open dispute against
#   `duct.box.ghost` besides. so this row describes the contradiction and coins
#   naught; the extant family is `term=false-report`, reader-inference.
#   ⚠️ the collision was caught by a PEER CLAMP, never by the glyph read that
#   should have preceded the choice (work.surface [case26] pins the ACTIONS
#   order by `indexOf('ACTIONS+=("👻')`, so a second 👻 above it silently took
#   the index the test meant for phantom).
for __at in "${!CREW_ARRIVEFAIL[@]}"; do
  while IFS= read -r __aline; do
    [[ -n "$__aline" ]] || continue
    __arole="${__aline%%=*}"
    __awhat="${__aline#*=}"
    ACTIONS+=("⚠️ STONE vs PANE — ${__at}/${__arole} shows a 🔍 stone (peer review in flight) and the spawn of it FAILED in the same pane: \"${__awhat}\". a 🗿 is the ROUTE's record, never proof a review runs — do NOT read this crew as busy. read it: rhx git.crew.read --tree ${__at} --who ${__arole} --lines 60")
  done < <(sort -u <<< "${CREW_ARRIVEFAIL[$__at]}")
done
# .why the PLEA rows sit high among the actions — a clone that printed its own
#   grant command is the most certain human gate the sweep can find, and the ONLY
#   one whose stone may report a wholly different state. measured 2026-09-03: a
#   stone read `review.peer, l1@i004, blocked ✋` — which routes to the DRIVER —
#   while the pane carried "eight rounds, two independent brains, 0 blockers
#   throughout" and the literal `--as approved`. a supervisor routed by the stone
#   asked it why it could not get l1 to agree, and cost it a turn on a block closed
#   four iterations earlier. see term=duct.pane.plea.
#
# ⚠️ it renders SEEN, never AWAITS. the line lives in SCROLLBACK, so a clone whose
#   gate was granted an hour ago still carries it, and the driver briefs quote the
#   command as prose. this is a READ to act on, never a verdict to trust
#   (term=false-report).
#
# 🔴 the COMMAND rides the row, so the one question a plea raises is answerable
#   from the sweep alone. the row named a human gate and withheld the single
#   field that DATES it — the `--stone` — so a supervisor had to `crew.read` the
#   pane to learn whether the ask was live. that round trip was paid on every
#   plea, and the majority are stale (see __crew_record_plea's measurements).
#   ⇒ with the command rendered, a `--stone 5.1` beside a stone of
#     `5.3.verification` two rows up is refuted with no drill-in at all.
# ⚠️ it still renders SEEN, and the advice still ends `never self-grant`. this
#   adds EVIDENCE to the row; it does not upgrade the proxy to a verdict.
for __pt in "${!CREW_PLEA[@]}"; do
  [[ -n "${CREW_PLEA[$__pt]:-}" ]] || continue
  while IFS= read -r __pr; do
    [[ -n "$__pr" ]] || continue
    __prole="${__pr%%=*}"
    __pcmd="${__pr#*=}"
    # 🔴 the FRESHNESS verdict — the tool holds BOTH facts, so the TOOL does the compare
    #
    #   the row renders the plea's `--stone`, and CREW_STONES holds the stone this
    #   tree renders NOW. until 2026-09-18 the row handed a supervisor both and said
    #   "check its --stone against the stone rendered above" — a string compare,
    #   performed BY EYE, against a census that runs ~500 lines on a full fleet, once
    #   per plea, every tick. and the comment 15 lines up already states the stakes:
    #   the majority of pleas are STALE, so that compare IS the decision — a fresh
    #   plea is a human's to grant, a stale one is scrollback with a command in it.
    #
    # ⇒ the same defect the healable row carried until this same date: a verdict the
    #   tool can compute and does not print is a verdict re-derived by hand, per row,
    #   forever (rule.require.poll-recommends-every-cure-heal-has). the instruction
    #   to compare was itself the tell — a step the caller finishes by hand after the
    #   call is a defect in the TOOL (rule.always.entool-the-skills-you-touch).
    #
    # ⚠️ it does NOT upgrade the proxy to a grant. FRESH says the ask is LIVE, never
    #   that it is RIGHT, so the row still ends `never self-grant` on every branch.
    __pstone="" __prendered="" __pverdict=""
    if [[ "$__pcmd" == *"--stone "* ]]; then
      __pstone="${__pcmd#*--stone }"; __pstone="${__pstone%% *}"
      __pstone="${__pstone%\"}"; __pstone="${__pstone#\"}"
      __pstone="${__pstone%\'}"; __pstone="${__pstone#\'}"
    fi
    while IFS= read -r __ps; do
      [[ "$__ps" == "${__prole}="* ]] || continue
      # the stored label is `<stone>, <phase>, <state>` — the stone is field one
      __prendered="${__ps#*=}"; __prendered="${__prendered%%,*}"
      __prendered="${__prendered#"${__prendered%%[![:space:]]*}"}"
      __prendered="${__prendered%"${__prendered##*[![:space:]]}"}"
      break
    done < <(sort -u <<< "${CREW_STONES[$__pt]:-}")
    if [[ -z "$__pstone" || -z "$__prendered" ]]; then
      __pverdict="❔ unsettled — no stone to compare from this sweep, so it cannot be dated. drill in before you relay"
    elif [[ "$__pstone" == "$__prendered" ]]; then
      __pverdict="✅ FRESH — \`${__pstone}\` IS the stone this tree renders now, so the gate is live and the human's to grant"
    else
      __pverdict="⚠️ STALE — it asks for \`${__pstone}\`; this tree now renders \`${__prendered}\`, so that gate was already passed. do NOT relay"
    fi
    # a row whose command could not be parsed degrades to the prior form —
    # a plea is never dropped for lack of its annotation
    if [[ -n "$__pcmd" && "$__pcmd" != "$__prole" ]]; then
      ACTIONS+=("🙋 PLEA SEEN — ${__pt}/${__prole} printed a HUMAN-only grant: ${__pcmd} — ${__pverdict}. never self-grant")
    else
      ACTIONS+=("🙋 PLEA SEEN — ${__pt}/${__prole} printed a HUMAN-only grant command. read it, then relay — never self-grant")
    fi
  done < <(sort -u <<< "${CREW_PLEA[$__pt]}")
done
# .why COUNCIL sits beside PLEA rather than inside it
#   both name a human gate the route cannot model. they part on what the clone
#   printed: a plea prints a runnable grant COMMAND, a council prints a TABLE of
#   open calls and no command at all. so the plea's whole freshness machine —
#   parse `--stone`, compare it to the rendered stone, verdict FRESH or STALE —
#   has naught to key on here, and a council row must not fake one.
#
# 🔴 .so the freshness test it CAN offer is the drill-in, named outright. the row
#   says what the clone asked and tells the reader how to date it, rather than
#   print a verdict it cannot compute (rule.forbid.fabricated-opines' shape: a
#   value the tool does not hold is not a value the tool may author).
#
# ⚠️ SEEN, never AWAITS — the identical claim every peer row makes. the clause
#   lives in SCROLLBACK, so a council the wisher ruled on an hour ago still
#   carries it (term=false-report).
for __ct in "${!CREW_COUNCILASK[@]}"; do
  [[ -n "${CREW_COUNCILASK[$__ct]:-}" ]] || continue
  while IFS= read -r __cr; do
    [[ -n "$__cr" ]] || continue
    __crole="${__cr%%=*}"
    __cclause="${__cr#*=}"
    if [[ -n "$__cclause" && "$__cclause" != "$__crole" ]]; then
      # ⚠️ the clause arrives ALREADY quoted — duct.poll renders it as
      #   `council SEEN — "…"` and the recorder keeps the quotes with it. a
      #   second pair here renders `""waits on four wisher calls""`, which is
      #   what prod printed on the cure's first run. the plea row has the same
      #   shape and takes `${__pcmd}` bare, for this reason.
      ACTIONS+=("🗳️ COUNCIL SEEN — ${__ct}/${__crole} halted on a FULCRUM COUNCIL: ${__cclause} — it awaits a wisher VERDICT, never a grant command. read the pane for the open calls, then relay to the human")
    else
      ACTIONS+=("🗳️ COUNCIL SEEN — ${__ct}/${__crole} halted on a FULCRUM COUNCIL — it awaits a wisher VERDICT, never a grant command. read the pane for the open calls, then relay to the human")
    fi
  done < <(sort -u <<< "${CREW_COUNCILASK[$__ct]}")
done
# .why FELL-READY sits beside PLEA, same shape — a clone printed a signal that
#   no other instrument carries, and it lives only in scrollback until a
#   supervisor reads it. the ssm-document mechanic's own line sat unread for
#   hours because no join carried it to the fleet tally (task #16).
# ⚠️ SEEN, never READY-NOW, for the identical reason PLEA is SEEN not AWAITS.
for __ft in "${!CREW_FELLREADY[@]}"; do
  [[ -n "${CREW_FELLREADY[$__ft]:-}" ]] || continue
  while IFS= read -r __fr; do
    [[ -n "$__fr" ]] || continue
    ACTIONS+=("🌲 FELL-READY SEEN — ${__ft}/${__fr} declared the tree ready to fell. tell the foreman")
  done < <(sort -u <<< "${CREW_FELLREADY[$__ft]}")
done
# second among the actions, and for the orphan row's own reason one rung down:
# an orphan loses WORK, a stalled box loses TIME — and unlike every row below
# it, neither party knows. the clone waits on a box it cannot read itself, and
# whoever filled that box believes it was delivered.
for __sb in "${STALLED_BOXES[@]:-}"; do
  [[ -n "$__sb" ]] || continue
  # the SUBJECT stays the full duct uri, host and all — it names the box
  # precisely, and a box is what stalled. the CURE is a crew verb, because a
  # cure we print is a cure we teach (__crew_uri_address).
  ACTIONS+=("✋ BOX UNMOVED — ${__sb%% *} ${__sb#* } — read it: rhx git.crew.read $(__crew_uri_address "${__sb%% *}") --raw --lines 20")
done
# the quiet-clone row sits directly beneath its non-empty sibling, because the
# two are one question asked of two box states, and a reader who meets them
# apart will take the pair above as the whole of "who is not moving".
#
# ⚠️ it is NOT `--raw`. the raw flag exists for the box-colour read (prefilled
# vs a suggested ghost), and an EMPTY box has no text to colour — so raw here
# would spend escapes on a pane whose answer is in its BODY, not its box.
# 🔴 .the uniqueness claim is SCOPE-RELATIVE, and the row must say so
#   `__age_seen`'s denominator is CREW_MOTION — only the trees THIS poll
#   scoped. the bare poll counts over the ⭐ set; `--all --healable` counts
#   over every tree, because --healable turns boxes on at EVERY scope. so the
#   same duct earns a row under one and loses it under the other — and the
#   WIDER read holds MORE ages, so more collisions, so FEWER rows. scale buys
#   silence about stalls, which is the expensive direction to be wrong in.
#   (term=false-report: true of the polled set, dressed as a fleet fact.)
#
#   [case42] bound the three TALLY blocks to state their denominator, keyed on
#   the scope so a tally added tomorrow is bound the day it ships. this claim
#   rides in a row BODY rather than a tally, so that bound never reached it.
#
# ⚠️ the cure is the CLAIM, never the filter. the comparative test stays as it
#   is — four ducts at 886m really are one past event. to drop the uniqueness
#   test is a separate, larger repair, recorded as owed in
#   `term=duct.box.quiet._.choice.reason.md`.
#
# ⇒ clamped at [case52] in work.surface.scope.integration.test.ts
__sq_unread=""
if [[ "$STAR" == "true" ]] && (( STAR_HIDDEN > 0 )); then
  __sq_unread=" — ⚠️ scoped: $STAR_HIDDEN tree(s) went unread, so a peer age there was never compared"
fi
for __sq in "${STALLED_QUIET[@]:-}"; do
  [[ -n "$__sq" ]] || continue
  ACTIONS+=("😴 CLONE QUIET — ${__sq%% *} ${__sq#* }, an age no other duct this poll read shares${__sq_unread} — read it: rhx git.crew.read $(__crew_uri_address "${__sq%% *}") --lines 40")
done
# .why FAILED sits among the NAMED rows and never with the counts below
#   the count rows carry a `<tree>` placeholder because their buckets run to
#   ten members and their cure is generic. a failed tree is neither: it is
#   rare, it is usually singular, and its cure must run IN that tree — so the
#   name is the actionable part, not an ornament on it.
#
#   ⇒ the legend at the head of this file has declared the cure since it was
#     written (`✋ failed  ci failed`). it never reached the footer, so a reader
#     met the count and not the remedy.
#
# 🔴 .the remedy is a READ the supervisor runs, never a SEND into the clone
#   this row emitted `rhx git.crew.send --tree $t --who mechanic --what 'rhx
#   show.gh.test.errors'` until 2026-09-21. that is a FREE-TEXT STEER, and the
#   channel to a clone carries exactly three sends — a permission KEY, "release
#   into prod", and the relay of a gate a human just granted
#   (rule.forbid.steer-a-clone-beyond-a-permission-key).
#
#   ⚠️ so the poll PRESCRIBED an act its own reader may not perform. worse than
#     a bare count: a count admits it is not a cure, where a runnable forbidden
#     command reads as sanctioned BY THE TOOL — the one authority a supervisor
#     cannot argue with mid-tick (term=false-report). measured 2026-09-21: a
#     tick met this row, and the decline cost a read of the rule to be sure the
#     TOOL was wrong rather than the reader.
#
# 🔴 and `rhx show.gh.test.errors` was never the supervisor's command either.
#   it reads the CWD's repo, and a failed tree is almost always in ANOTHER one,
#   so a supervisor who ran it here would get a confident answer about the
#   wrong repo. `$__fref` already holds `<org>/<repo>#<num>`, which is exactly
#   the two operands `gh pr checks` needs — so the honest read is free.
#
# ⚠️ .and the FAILURE itself is the driver's, not the supervisor's
#   the row is surfaced so a supervisor KNOWS, never so they act into the tree.
#   a route-complete tree whose ci failed is the one case that may owe a human
#   a decision, and that is a surface, never a send.
for __ft in "${FAILED_TREES[@]:-}"; do
  [[ -n "$__ft" ]] || continue
  __ftree="${__ft%%|*}"; __fref="${__ft#*|}"
  ACTIONS+=("✋ CI FAILED — $__ftree — $__fref — the DRIVER's to fix; do NOT send. read it yourself: gh pr checks ${__fref##*#} --repo ${__fref%%#*}")
done
# 🔴 .CONFIRM FIRST rides INSIDE the row, never on a line beneath it — task #34
#   an ACTIONS row is read one row at a time, and often quoted onward one row
#   at a time. a reminder on its own line is one a quote drops, which returns
#   the reader to the bare command that caused the two failures the `--fellable`
#   view's header records. fused into the row, the ask cannot be separated from
#   the command it governs.
for __ct in "${FELLABLE_TREES[@]:-}"; do
  [[ -n "$__ct" ]] || continue
  ACTIONS+=("👌 TO FELL — $__ct — CONFIRM FIRST with the human, then: rhx git.crew.fell --tree $__ct")
done
# the seam the safety gate cannot cover, stated once for the whole set. it is
# NOT a substitute for the per-row ask above — it says WHY the ask exists.
(( ${#FELLABLE_TREES[@]} > 0 )) \
  && ACTIONS+=("🙋 a fell is SAFE (merged, clean) yet UNASKED — safety is about bytes, the fell is a DECISION, and the decision is the human's")
# 🔴 .the FENCED set, one row PER TREE — task #37. the `--fellable` view's own
#   note carries the full measured record; the two emit sites must make the
#   same claim, or a reader who meets one and quotes the other carries a claim
#   the other never made.
#
#   what changed: the row no longer asserts `a clone is MID-TURN`, because the
#   fence cannot see that. `__crew_clones_idle` fails closed, so its true
#   statement is "no turn-end was seen", and a tree whose turn ended twelve
#   hours ago satisfies it whenever its pane read does not land. and the row
#   now names its tree — `<tree>` made a reader re-derive the subject of the
#   very read it recommends.
for __ct in "${LIVE_FENCED_TREES[@]:-}"; do
  [[ -n "$__ct" ]] || continue
  ACTIONS+=("🐢 FENCED — $__ct — merged and clean, held back because no turn-end was seen for every live clone. that is what the fence SAW, not proof a turn runs. settle it with one read: rhx git.crew.read --tree $__ct --who mechanic --lines 40")
done
(( DIRTY_WORK > 0 )) && ACTIONS+=("✋ $DIRTY_WORK merged but DIRTY with WORK — the fell refuses until it is committed or set aside")
# the tool-state half is NAMED per tree, for the reason the fellable rows above
# are: a `<tree>` placeholder denies the one question the row exists to answer.
# CONFIRM FIRST rides INSIDE the row, per the note above.
for __ct in "${DIRTY_TOOL_TREES[@]:-}"; do
  [[ -n "$__ct" ]] || continue
  ACTIONS+=("🧹 MERGED, dirt is TOOL STATE only — $__ct — a re-run restores it — CONFIRM FIRST, then: rhx git.crew.fell --tree $__ct --stash --why '<yours>'")
done
(( GREEN  > 0 ))   && ACTIONS+=("✋ $GREEN to ship   — tell its mechanic \"release into prod\"")
# 🔴 the cure NAMES a real tree — task #37. a `<tree>` placeholder cannot be
#   run, and the row that would have carried the name is often cut by the
#   HIDDEN_NOCLONE fold, so this array is the only path it survives by.
#
# 🔴 .and it emits ONE ROW PER TREE, never first-plus-remainder — 2026-09-19.
#   a down crew is cured one tree at a time: `git.crew.boot --tree` takes
#   exactly one. so the prior shape — a command for DOWN_TREES[0] and then
#   `💀 and N more down — ${DOWN_TREES[*]:1}` — handed a reader one runnable
#   line and N-1 bare names with no command beside them. the only path left
#   for those N-1 was a hand-copy off the render, which is the one move
#   `rule.always.poll-the-fell-and-heal-sets` grades a blocker.
#
#   ⚠️ the prior comment claimed the remainder cured this: "the REST are named
#     too, never left to `--all`". a NAME was half the debt. the other half is
#     a RUNNABLE line, and a reader cannot run a word.
#
#   🔴 the phantom cure below (~:5355) already wrote this argument out, and
#     named THIS row as the shape it refused:
#
#       "per-tree rather than first-plus-remainder (the `down` shape): each
#        phantom takes its OWN fell, so one command closes exactly one of
#        them, and a remainder line would name trees with no command beside
#        them."
#
#     every clause transfers verbatim. ⇒ the asymmetric-twin shape: one branch
#     of a concept cured, its twin left shipped, with the argument for the cure
#     three lines below the defect.
#
#   measured in a live babysit tick: `--all` footed `💀 4 down` plus three bare
#   names. one boot was runnable; three were transcribable only.
#
#   .the bound = the COUNT row survives and keeps its class, exactly as the
#     phantom ([case39]) and orphaned ([case49]) rows hold. it answers HOW
#     MANY; the per-tree rows answer WHICH. neither substitutes for the other.
#
#   ⇒ clamped at work.surface [case57]
#     ⚠️ [case50] is the ON-GROVE caveat, and it is cited by name from crewwork
#       and git.grove.saturation. this axis took 57 — the next free id after the
#       highest extant — rather than the `case55` gap, which a retired case's
#       citations may still point at.
(( DOWN   > 0 ))   && ACTIONS+=("💀 $DOWN down       — no live duct. each takes its OWN boot — one row per tree below")
for __dt in "${DOWN_TREES[@]:-}"; do
  [[ -n "$__dt" ]] || continue
  ACTIONS+=("💀 NO DUCT — $__dt — boot it: rhx git.crew.boot --tree $__dt")
done
# .why ABOVE phantom, and named with the grove: an asleep crew is the only
#      row here whose cure is on a DIFFERENT machine, and a reader who meets
#      it beneath the litter row will price it as litter
(( ASLEEP > 0 ))   && ACTIONS+=("😴 $ASLEEP asleep     — unread, not down — rhx git.grove.wake ${HOSTS_UNREACHED[0]:-<grove>}")
# 🔴 phantom NAMES its trees and emits a runnable cure per tree — task #38.
#   it was the last state in this footer whose line was PROSE: a count, a
#   description, and no command. every peer above hands over a line a reader
#   can run, and the mandate they serve
#   (`rule.always.poll-the-fell-and-heal-sets`) says to act on the emitted
#   line and never on a tree name copied by hand off the render. a prose row
#   leaves the hand-copy as the only path, so the tool forbade the one move
#   it permitted.
#
#   per-tree rather than first-plus-remainder (the `down` shape): each
#   phantom takes its OWN fell, so one command closes exactly one of them,
#   and a remainder line would name trees with no command beside them.
(( PHANTOM > 0 )) \
  && ACTIONS+=("👻 $PHANTOM phantom    — felled trees whose registry rows remain — the fell is safe: the tree is already gone")
for __pt in "${PHANTOM_TREES[@]:-}"; do
  [[ -n "$__pt" ]] || continue
  ACTIONS+=("👻 STALE ROWS — $__pt — drop the record: rhx git.crew.fell --tree $__pt")
done

# .why the drill-in line is CONDITIONAL now, and points elsewhere
#   it read, unconditionally, on every run:
#
#     └─ 🔎 drill in — run `rhx git.release` inside the tree for the authoritative read
#
#   three things wrong, and they compound:
#
#   1. it was the ONLY unconditional action line. every peer above fires on a
#      nonzero count and names the command for THAT state; this one named a
#      command for no state at all, on every run, forever.
#
#   2. it UNDERCUT the poll's own verdicts. `term=poll` says a poll renders a
#      verdict per subject — a footer that defers to another tool for "the
#      authoritative read" says those verdicts are provisional. if they were,
#      the sweep would be worth naught and the tick would be a lie.
#
#   3. ⚠️ it recommended the ANTI-PATTERN. `rule.require.bulk-over-byhand`'s
#      own instrument table reads:
#
#        | the whole fleet: crews + trees + prs | rhx git.crew.poll | never a
#        | `git.release` per tree |
#
#      so the poll's footer sent every reader into the exact per-tree loop the
#      poll exists to replace — and it is the loop that rule grades a blocker.
#
#   and the hedge was not even TRUE: the pr/ci half is read from
#   `gh pr list --json ... statusCheckRollup`, which IS the authoritative
#   source. `git.release` reads the same api. there was no deeper read to go get.
#
#   the honest drill-in is for the ONE state where this poll genuinely failed
#   to read a tree — `unknown` or `timeout`. there, and only there, a targeted
#   read is the paved path (bulk-over-byhand's last row: the sweep names the
#   subject, THEN you drill in).
#   ⚠️ and a PHANTOM must be subtracted, or this line is a false report.
#   `phantom` is set exactly when `verdict == unknown && detail == "no worktree"`
#   — so every phantom is ALSO an `unknown`, and a naive count double-reports
#   them one line below their own row. worse, it mislabels them: a phantom is
#   not UNREAD, it is GONE, and the two take different cures (a drill-in finds
#   naught; a registry clear is what it wants). caught on the first run of this
#   very block, which is why verify-after-send is not optional.
UNREAD=$(( ${TALLY[unknown]:-0} + ${TALLY[timeout]:-0} - PHANTOM ))
(( UNREAD > 0 )) && ACTIONS+=("🔎 $UNREAD unread — this poll could not read them. drill into those trees by name")

if (( ${#ACTIONS[@]} == 0 )); then
  echo "   └─ ✨ naught to act on"
else
  for i in "${!ACTIONS[@]}"; do
    if (( i == ${#ACTIONS[@]} - 1 )); then echo "   └─ ${ACTIONS[$i]}"; else echo "   ├─ ${ACTIONS[$i]}"; fi
  done
fi
}
