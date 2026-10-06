#!/usr/bin/env bash
######################################################################
# crewwork.heal — crew.heal: detect a curable crew, and apply its cure
#
# 🔴 .a PART of crewwork.sh — sourced, never executed, and only BY crewwork.sh.
#     a caller sources crewwork.sh, which loads every part. see
#     __crew_load_parts there for why the lib is cut into parts at all.
#
# .holds = the cure per heal axis — revive, nudge, drain, wedge, tab, seat —
#          and crew.heal, which routes a crew to them. the PREDICATES that
#          decide a crew is healable (__crew_is_healable, __crew_heal_axis)
#          stay in the core, since the poll reads them without a heal.
######################################################################

######################################################################
# crew.heal — detect a husk (claude exited, chrome still drawn) and
#             revive it: crew.reboot the pane, then resume the session
######################################################################

# .what = detect a `term=duct.pane.husk` on ONE duct, and — for the
#         signature that names its cause — revive it: `crew.reboot` the
#         pane (clears the dead program's leftover frame), then
#         `crew.send --what 'rhx enroll claude --as @:<role> --resume <role>'`
#         (a rebooted claude does not resume itself, and a clone that comes
#         back unenrolled comes back unaddressable).
#
# .why  = the discriminator and the two opposite cures are already
#         recorded, in full, at `term=duct.pane.husk._.choice._.md` —
#         this is that brief made into a callable verb.
#
#         a husk's last rendered row belongs to the SHELL, never to
#         claude — no `❯` anywhere in the tail, and the leftover
#         `Resume this session with:` banner sits above it. that state
#         is invisible to `crew.reboot`'s own caller: absent this verb,
#         no instrument reads a pane, decides it is a husk, and acts — a
#         supervisor either misses it (it renders as `😴 unread` /
#         `🧊 frozen`, never as a dedicated verdict) or, having found it
#         by eye, performs the two-call cure BY HAND.
#
# 🔴 .what killed it decides whether THIS verb may act at all
#      the husk brief is explicit: the shell prints its OWN exit
#      indicator on the very row that names a husk, and the two shapes
#      take opposite cures —
#
#        `💥<code> ➜`   a signal killed the process (SIGTERM = 143 is
#                       this fleet's own earlyoom guard). absent that
#                       keyboard was anyone since. SAFE to heal.
#
#        `^C%` / `^C$`  a HUMAN typed the interrupt. they may have run
#                       something after it that no poll can see —
#                       possibly the very grant this husk was parked on.
#                       this verb REFUSES to act and surfaces instead.
#
#      an unreadable close (neither shape, or the resume banner has
#      scrolled out of the read window) is treated the same as `^C` —
#      the safe default is to surface, never to guess.
#
# usage:
#   rhx git.crew.heal --tree <treeslug>                 # mechanic, plan
#   rhx git.crew.heal --tree <treeslug> --who foreman
#   rhx git.crew.heal --tree <treeslug> --mode apply     # actually heal
#   rhx git.crew.heal --all --mode apply                 # sweep the fleet
#
# args:
#   --tree   the tree slug, as git.crew.list prints it   (--tree or --all)
#   --who    mechanic | foreman | reflector — ONE role, never `all`
#            (default: mechanic)
#   --all    sweep every tree the ledger has ever booted, every role
#            (mechanic, foreman, reflector) — exclusive with --tree
#   --mode   plan (default) | apply — plan only REPORTS what it found;
#            apply performs the reboot + resume. `rule.require.safe-by-
#            default`: a destructive act (a reboot ends a program, even
#            a dead one's frame) takes a deliberate extra step
#   --lines  how much scrollback to read for the discriminator (default
#            60 — generous, so the resume banner is still in the window
#            on a duct with a lot of subsequent shell activity)
#
# guarantee:
#   - never touches a duct whose tail still shows a live claude `❯` box
#   - never acts on a `^C`-closed husk, or a close it cannot read — it
#     surfaces those, per the term brief's own warning
#   - `--all` is a READ sweep first: every tree is reported before any
#     apply-mode action runs, so one bad row cannot hide the rest
#   - exit 0 = ran (see per-row verdicts for what happened), 2 = bad args
__crew_heal_one() {
  local tree="$1" grove="$2" who="$3" mode="$4" lines="$5"

  local host
  host=$(__crew_grove_host "$grove") || { echo "💥 $tree/$who: unresolvable grove '$grove'" >&2; return 1; }

  local uri
  uri="$(__crew_duct_uri "$host" "$tree" "$who")"

  local raw
  raw="$(duct.read --on "$uri" --lines "$lines" --raw 2>/dev/null)"
  if [[ -z "$raw" ]]; then
    echo "⏳ $tree/$who: unread (no capture) — skipped, not a verdict"
    return 1
  fi

  # strip sgr codes so the discriminator reads plain text, same as the
  # box classifier does before it tests for a ❯
  local plain
  plain="$(printf '%s' "$raw" | sed 's/\x1b\[[0-9;]*m//g')"

  # 🔴 the ❯ check is scoped to AFTER the resume banner, never the whole
  #    window. a crashed pane's scrollback still shows the LIVE claude box
  #    it drew before it died — that ❯ is real, and it is stale. only a ❯
  #    on or after the banner's own line means claude is live NOW, since
  #    the banner is the shell's own marker that the program above it ended.
  #    measured 2026-09-13 on feat-telepath-role: a whole-window grep read a
  #    crash as `blocked ✋` (still driving), because the pre-crash ❯ from
  #    the dead session outranked the crash banner printed beneath it.
  # 🔴 the CRASH arm, BEFORE the ❯ test — and it must come first, because the
  #    ❯ it would meet is STALE. claude aborted without a resume banner, so it
  #    left its whole UI drawn as though live: a spinner frame, a ❯ box, a
  #    statusline. the shell then returned and printed a `💥N ➜` badge BELOW
  #    all of it. the old chain met that stale ❯, found no rate-limit and no
  #    cap, and fell to `return 3` — healthy.
  #
  # 🔴 .measured 2026-09-18, one tick after the poll learned this shape:
  #    sdk-aws-lambda.beav.feat-input-only-validation-and-hydration rendered
  #    `mechanic:husk` in the poll and, from the SAME pane, `😶 a live claude
  #    box is up — not a husk, absent any move to make` in heal. the poll
  #    emitted a cure line for it; that line was INERT.
  #    ⇒ a `--healable` row whose cure refuses to fire is a term=false-report,
  #      and it is the exact split define.invariant.crew.husk.discriminator
  #      -parity forbids.
  #
  # ⚠️ share the ductwork discriminator, never a local copy — the private
  #    chain below IS how the two fell out of step, twice now
  #    (rule.always.entool-the-skills-you-touch: one detector, one home).
  if ! printf '%s' "$plain" | grep -q 'Resume this session with:'; then
    # ⚠️ it sits INSIDE the no-banner branch, and first within it. a pane that
    #    HAS a banner is arm 1's, and arm 1's render is the richer of the two —
    #    it names a 143 as this fleet's own earlyoom kill and points at the
    #    grove read. measured 2026-09-18: with this arm hoisted above the
    #    banner test, [case45] went red on all three of those assertions,
    #    because a clean-exit pane carries BOTH a banner and a badge and this
    #    arm claimed it first (rule.forbid.overzealous-blockers).
    local __crashcode
    __crashcode="$(__duct_pane_crash_badge "$plain" || true)"
    if [[ -n "$__crashcode" ]]; then
      # the ^C carve-out is the banner arm's, for the banner arm's reason: a
      # human at this keyboard is a decision, never a defect. 130 = SIGINT.
      if [[ "$__crashcode" == "130" ]]; then
        echo "🙋 $tree/$who: husk ended by ^C — a HUMAN was at this keyboard"
        echo "   └─ heal sends no keys here. ask them before any reboot" >&2
        return 6
      fi
      echo "💀 $tree/$who: husk (exit $__crashcode, crashed under its own stale UI) — claude aborted, safe to heal"
      __crew_heal_revive "$tree" "$grove" "$who" "$uri" "$mode"
      return
    fi

    # 🔴 THE PICKER ARM, and it must sit ABOVE the ❯ chain below — because the
    #    picker's own row highlight IS `❯ $who`. a pane parked pre-conversation
    #    at claude's `Resume Session` walked that whole chain, met no
    #    rate-limit and no cap, and fell to `return 3` — healthy, no move.
    #
    # 🔴 .measured 2026-09-19 on rhachet.beav.fix-keyrack-daemon-orphan and
    #    rhachet.beav.fix-test-tempdir-leak. the POLL called both `mechanic:husk`
    #    and `--healable` emitted a cure line for each; the lines ran verbatim
    #    and heal answered `😶 a live claude box is up — not a husk`. the panes
    #    came back byte-identical, tick after tick
    #    (rule.forbid.remedies-that-mimic-the-defect). that is the SECOND time
    #    this private chain split from the shared discriminator, and the third
    #    site of one root cause: a bare ❯ is not evidence of a live box.
    #
    # ⚠️ the CURE splits on the row count, never on the chrome: a picker with a
    #    ROW holds a live transcript one Enter from cured, so it REVIVES — and
    #    revive's own picker-drive finishes it. a picker with ZERO rows is a
    #    FLAP, and revive routes it to the hatch from inside
    #    (__duct_picker_has_no_rows). so both shapes enter here, and revive
    #    parts them — one door, never two half-doors.
    if __duct_pane_is_picker_parked "$plain"; then
      echo "💀 $tree/$who: husk (parked at claude's 'Resume Session' picker) — pre-conversation, safe to heal"
      __crew_heal_revive "$tree" "$grove" "$who" "$uri" "$mode"
      return
    fi

    # 🔴 the ❯ test is ANCHORED, never a bare presence — and this is the cure to
    #    the root cause the two arms above only patched around.
    #
    #    a crashed pane keeps the WHOLE UI claude drew before it died, caret
    #    included. the badge arm catches that where the shell printed a `💥N`;
    #    the picker arm catches it where claude parked pre-conversation. a crash
    #    that fits NEITHER literal walks straight past both, meets this caret,
    #    finds no rate-limit and no cap, and falls to `return 3` — healthy.
    #
    # 🔴 .measured 2026-09-19 on sdk-aws-lambda.beav.feat-input-only-validation
    #    -and-hydration, ~40s apart and on ONE pane:
    #      crew.poll --healable → `💀 husk … ⚠️ WORK ORPHANED`, and a cure line
    #      crew.heal (that line, verbatim) → `😶 a live claude box is up`
    #    claude had died of a V8 heap OOM; the pane held the dump, the native
    #    trace, and a RETURNED starship prompt — under a stale ❯ box, a stale
    #    stone line, and a spinner frozen at 5h38m. the emitted cure was inert,
    #    so the `--healable` row was a term=false-report — the exact split
    #    define.invariant.crew.husk.discriminator-parity forbids, for the THIRD
    #    time and from the ONE root cause this comment chain has named twice.
    #
    # ⇒ so the repair is NOT a fourth literal. the durable arm already sits ~226
    #   lines below, unreached: a mechanic at a bare shell IS a husk, banner or
    #   no banner — the poll's own `mechanic:shell` rule. all this caret needed
    #   was an anchor, so stale chrome cannot claim a pane the shell took back.
    if printf '%s' "$plain" | grep -q '❯' && ! __duct_pane_has_returned_shell "$plain"; then
      # 🔴 a RATE-LIMIT WEDGE — claude is ALIVE (its ❯ box is drawn, and no crash
      #    banner sits above it) but it stopped on `API Error: Rate limit reached`
      #    and idled. this is NOT a husk: claude did not exit, so a reboot would
      #    BURN the live conversation (rule.forbid.byhand-fix-that-burns-the-live-
      #    proof). detect + SURFACE it, never reboot. the cure is a retry (a
      #    transient throughput cap resets on its own) or an auth.swap (the
      #    account budget is spent — global + hot, term=auth.swap); a reboot
      #    forecloses both.
      #
      #    scope the banner to the LAST REAL LINES: the same error higher in
      #    scrollback belongs to a turn claude already retried past, and to flag
      #    that is a term=false-report. this branch already requires no resume
      #    banner and a live ❯, so a crashed husk (which prints its resume banner)
      #    never reaches here, and a dead pane with the error only in old
      #    scrollback falls through to return 3 (healthy) rather than a false
      #    rate-limit.
      #    ⚠️ share the ductwork discriminator (sourced at top) rather than a
      #    private tail-15 copy — a raw-line window let claude's own UI chrome
      #    push the banner out of view and read a wedged clone as healthy
      #    (rule.always.entool-the-skills-you-touch: one detector, one home).
      if __duct_pane_has_ratelimit "$plain"; then
        echo "🚫 $tree/$who: rate-limited — claude is ALIVE, stopped on 'API Error: Rate limit reached'"
        # the CURE is a nudge, and heal OWNS it — a supervisor never sends it by
        # hand (rule.forbid.byhand-heal). plan surfaces the move; apply makes it.
        __crew_heal_nudge "$tree" "$grove" "$who" "$uri" "$mode"
        return 7
      fi

      # 🔴 a STALE USAGE-CAP WEDGE — a live ❯ box under a `You've hit your limit ·
      #    resets HH:MM` banner whose reset clock has already PASSED. the api
      #    lifted the cap at the reset time; only the pane text is stale, so the
      #    box is a healthy claude that idled at a dead banner. it heals EXACTLY
      #    as a transient 429 does — a nudge to retry, never a reboot, never an
      #    auth.swap (the cap is already gone). a FUTURE reset is a LIVE cap:
      #    leave it (a real wait, or an auth.swap the human/auth owns) — this
      #    branch fires ONLY on the passed clock, gated by __crew_cap_reset_passed
      #    (define.invariant.crew.ratelimit.healable-transient — the stale-cap row).
      local __capline
      __capline="$(__duct_pane_cap_line "$plain" || true)"
      if [[ -n "$__capline" ]] && __crew_cap_reset_passed "$__capline"; then
        echo "🚫 $tree/$who: stale usage cap — reset PASSED, claude is ALIVE at a dead '$__capline'"
        __crew_heal_nudge "$tree" "$grove" "$who" "$uri" "$mode" \
          "your usage cap has reset — the 'You've hit your limit' banner above is now stale."
        return 7
      fi

      # 🔴 a LIVE USAGE-CAP WEDGE — a live ❯ box under a 'You've hit your limit ·
      #    resets HH:MM' banner whose reset clock is in the FUTURE. the account's
      #    budget is spent, so a NUDGE would land on a wall — but the cap is
      #    HEALABLE by an auth.swap to an uncapped account: global + hot, it
      #    unblocks NOW rather than at the future reset (term=auth.swap). a swap
      #    needs a human browser leg, so heal GUIDES it — it never silently
      #    returns "no move", which let a sponsored star sit capped for days
      #    (define.invariant.crew.ratelimit.live-cap-healable-via-swap). measured
      #    2026-09-14 on feat-rec-waitlist-capture: resets Sep 20, halted
      #    mid-turn, read as a passive wait across 6 ticks. the account budget is
      #    grove-wide, so ONE swap heals every clone on the grove at once.
      # 🔴 BEFORE the swap guidance: is this cap banner even LIVE? AUTH IS
      #    GROVE-WIDE, so ONE active clone on this grove refutes EVERY cap banner
      #    on it — a capped clone cannot emit tokens, so an active peer proves the
      #    account has budget and the banner is STALE SCROLLBACK, frozen in a
      #    halted pane that draws no new frame. the reset CLOCK cannot tell us
      #    this: it says when the cap would lift ON ITS OWN, never whether a
      #    reset, a swap, or an /extra-usage grant already lifted it.
      #
      #    ⇒ so a future clock is necessary but NOT sufficient for a swap. read
      #      the GROVE before the pane, and on an active grove the cure is a
      #      NUDGE — the supervisor's own, owed EVERY tick until the tree moves.
      #
      #    measured 2026-09-14: three trees rendered `🚫 limited · resets Sep 20`
      #    beside four clones at work on the same grove, for three ticks, with an
      #    auth.swap gate relayed to the human each time — a browser leg spent on
      #    a cap already gone, while the trees stayed parked for want of a nudge
      #    (define.invariant.crew.ratelimit.one-active-clone-refutes-every-cap-on-its-grove).
      #
      # 🔴 …UNLESS the pane already records that inference FAILING. a nudge we
      #   sent, answered by the cap, settles the question against the peer —
      #   see __crew_cap_nudge_refuted for the measured case and the loop it
      #   ends. checked FIRST, so a refuted grove falls to the swap guidance
      #   below rather than draw one more wasted turn per tick until reset.
      if [[ -n "$__capline" ]] && __crew_cap_nudge_refuted "$plain"; then
        echo "🚫 $tree/$who: LIVE cap — a prior NUDGE was answered with '$__capline'"
        echo "   └─ a peer clone may be at work, but THIS clone retried and was refused — the banner is not scrollback"
        echo "   └─ HEALABLE via auth.swap (unblocks now; global + hot, one swap heals the grove):"
        echo "      rhx git.grove.auth $grove --brain claude --mech oauth"
        echo "      then --code '…' after sign-in to an UNCAPPED account (sign out / private window first — a same-account swap lands naught)"
        echo "   └─ or leave it for the reset. a swap applies only to a sponsored tree."
        return 7
      fi

      if [[ -n "$__capline" ]] && __crew_grove_has_active_clone "$grove"; then
        # 🔴 a PROBE, never a verdict — and the label must say so.
        #    this branch fires with the reset clock in the FUTURE (the passed
        #    clock was caught above). the peer-active inference is strong — a
        #    token counter that climbs is present-tense and cannot be faked —
        #    but it is INDIRECT, and the clock directly contradicts it. so the
        #    nudge is an experiment worth one turn, never a settled verdict.
        #
        #    measured 2026-09-16: this printed `STALE cap … this banner is
        #    scrollback` about a cap whose clock sat 19 MINUTES in the future,
        #    and a supervisor quoted that word to a human as fact. the ACTION
        #    was right and the CLAIM was not — a confident verdict over a state
        #    the tool cannot see (term=false-report). the prior tick had already
        #    refuted the same inference on this grove, one clone over.
        #
        #    ⇒ name the evidence on both sides and let the nudge settle it.
        #      a refusal is caught next tick by __crew_cap_nudge_refuted, which
        #      switches this grove to the swap guidance below.
        echo "🚫 $tree/$who: LIVE clock vs ACTIVE peer — '$__capline', and a peer clone on $grove is AT WORK"
        echo "   └─ auth is GROVE-WIDE and a token counter that climbs is present-tense, so the peer suggests budget remains"
        echo "   └─ ⚠️ but this clock has NOT passed, so the nudge below is a PROBE, never a verdict"
        echo "   └─ if it comes back refused, the next tick names a LIVE cap and guides an auth.swap"
        __crew_heal_nudge "$tree" "$grove" "$who" "$uri" "$mode" \
          "a clone on this grove is at work right now, so the account may still have budget — retry once and report what you get."
        return 7
      fi

      if [[ -n "$__capline" ]]; then
        echo "🚫 $tree/$who: LIVE usage cap — claude is ALIVE at '$__capline', budget spent till reset"
        echo "   └─ the grove is QUIET — no peer clone at work, so the banner's clock stands"
        echo "   └─ HEALABLE via auth.swap (unblocks now; global + hot, one swap heals the grove):"
        echo "      rhx git.grove.auth $grove --brain claude --mech oauth"
        echo "      then --code '…' after sign-in to an UNCAPPED account (sign out / private window first — a same-account swap lands naught)"
        echo "   └─ or leave it for the reset. a swap applies only to a sponsored tree."
        return 7
      fi

      # 🔴 an ORPHANED QUEUE — the clone is HALTED, and it is the one wedge that
      #    wears a perfectly healthy face. claude is alive, its box is drawn, no
      #    banner, no 429, no cap. and its turn has ENDED with a message still
      #    parked in the queued row above the box.
      #
      #    a queued row drains at a TURN BOUNDARY. no turn runs, so no boundary
      #    comes, so the queue never drains — the clone sits stopped in front of
      #    a message a human already typed and already submitted.
      #
      #    measured 2026-09-16 on
      #    `rhachet-roles-bhrain.beav.feat-dispute-or-concede-review-budget`: the
      #    mechanic ended its turn to ask the human a gate question, the human
      #    answered `fireworks is back now` INTO the box, and it sat orphaned
      #    across TWO full babysit ticks. heal saw a live ❯, fell to `return 3`
      #    — "absent any move to make" — and the supervisor cured it BY HAND
      #    (rule.forbid.byhand-heal: the cure belongs here, in the tool).
      #
      # 🔴 .the cure is a RELAY, never an authorship
      #    an Enter alone does NOT drain an orphaned queue — measured the same
      #    day: the queued row kept its highlight and the Enter opened a fresh
      #    empty turn. what drains it is the queued TEXT, re-submitted. so heal
      #    reads that text off the pane and sends it back verbatim. it invents
      #    no word and it relays only what a human already submitted once.
      #
      # ⚠️ .why a GHOST cannot reach this arm
      #    a ghost is an autocomplete suggestion drawn INSIDE the input box with
      #    a dim FOREGROUND and no background (term=duct.box.ghost). the queued
      #    row is a distinct row above the box, and its discriminator is the
      #    BACKGROUND highlight claude paints on submitted-and-parked text. so
      #    the two are disjoint by construction, and this arm can never submit
      #    a payload no human authored.
      #
      # ⚠️ .why it requires the ENDED turn, and is not a bare queued check
      #    a queued row under a LIVE turn is the ordinary, healthy case — that
      #    turn will drain it on its own, and to re-send would double a human's
      #    message into a clone that was about to read it anyway. the JOIN is
      #    the whole cure (rule.forbid.overzealous-blockers).
      local __qrow __tended
      __qrow="$(__duct_pane_queued_row "$raw" || true)"
      __tended="$(__duct_pane_turn_ended "$plain" || true)"
      if [[ -n "$__qrow" && -n "$__tended" ]]; then
        # 🔴 .an ASK WIDGET holds the input — SURFACE, never relay
        #
        #   duct.poll classifies this same pane `box_kind=ask` off exactly the
        #   grep below (duct.poll.sh: `Chat about this|(Recommended)|Tab/Arrow
        #   keys`), and its own row for that kind reads, verbatim:
        #     "🙋 ASK — a DESIGN question, put to the HUMAN. not yours"
        #     "send NO keys. verify its merits, then surface it with what you found"
        #   it states the asymmetry too: "an ask misread as a permission modal
        #   costs a decision recorded in the HUMAN's name, and that does not undo."
        #
        # 🔴 .measured 2026-09-17 on `rhachet-roles-bhrain.beav.feat-acceptance-under-5min`
        #   ONE poll render carried BOTH `🙋ask × 1` for this tree/role AND,
        #   from the `--healable` derivation, `rhx git.crew.heal --tree … --mode
        #   apply` for the very same one. the babysit contract mandates every
        #   emitted heal line be run VERBATIM — so the tool told a supervisor to
        #   send keys into the one box it had just told them to send no keys into.
        #   the pane held a 3-tab AskUserQuestion widget (`☐ f6 gap · ☐ #349 ·
        #   ☐ PR scope`) whose footer reads `Enter to select`, cursor at option 1.
        #   captured verbatim: .test/.assets/pane.ask.widget-holds-input-over-a-queued-row.log
        #
        # ⚠️ .the queued row is REAL, and both guards above are honestly met —
        #   background highlight present, turn ended. what neither can see is
        #   WHO HOLDS THE INPUT. the widget does, so a relay's text+Enter reaches
        #   the WIDGET rather than the box. the relay is not merely inert here:
        #   it is a design fork answered in the human's name, and it does not undo.
        #
        # ⇒ so this takes the same "surface, never auto-heal" the ^C arms below
        #   already take when a human was at the keyboard, and it returns their
        #   same code. an ask IS that signal — the human is not merely absent
        #   from this keyboard, they are the party the clone awaits.
        if printf '%s\n' "$plain" | grep -qaE 'Chat about this|\(Recommended\)|Tab/Arrow keys'; then
          echo "🙋 $tree/$who: queued message parked, but an ASK WIDGET holds the input"
          echo "   └─ a relay would send its text + Enter to the WIDGET, never the box — a design answer in the HUMAN's name, and it does not undo"
          echo "   └─ send NO keys. read it, then surface it: rhx git.crew.read --tree $tree --who $who --raw --lines 60" >&2
          return 5
        fi
        echo "🛑 $tree/$who: HALTED — turn ended (\"$__tended\") with a message still queued: \"$__qrow\""
        echo "   └─ no turn runs, so no turn will drain it. the cure is a RELAY of that same text"
        __crew_heal_drain "$tree" "$grove" "$who" "$uri" "$mode" "$__qrow"
        return 7
      fi

      # 🔴 THE POISON, on the LIVE arm — and this is the half that BLINDS the
      #    fleet, because it is where a poisoned clone comes to rest.
      #
      #    a poisoned box is live by every measure this chain takes: it paints a
      #    caret, it holds no plea, it carries no cap and no queued row. so it
      #    falls to the `return 3` below and heal answers "absent any move to
      #    make" — over a clone that answers every single turn with a 400.
      #
      #    measured 2026-09-21 on rhachet-roles-bhrain.beav.feat-review-cost-meter,
      #    in the SAME tick that taught the revive path this shape: the revive
      #    reported `✨ revived`, the box came up live, and the very next heal
      #    said `😶 not a husk, absent any move to make`. one cure at the husk
      #    gate alone is INERT the moment the box is up (rule.always.capture-
      #    clamp-then-verify-in-prod: a green clamp proves the detector, never
      #    the render).
      #
      # ⚠️ .why a CURED clone can never trip this on stale scrollback
      #    the only cure for poison is the hatch, and the hatch REBOOTS the pane
      #    before it launches — so the scrollback that carried the rejections is
      #    gone with it. a live box that still shows them is therefore still the
      #    poisoned session, never a repaired one wearing its history.
      if __crew_pane_has_poison "$plain"; then
        echo "🧪 $tree/$who: POISONED — the box is live, and every turn it takes is rejected"
        echo "   └─ why: an API Error 400 faults the request BODY, and that body IS the transcript"
        echo "   └─ proof: the same rejection under 2+ distinct request_ids — it rebuilds every turn"
        __crew_heal_hatch "$tree" "$grove" "$who" "$uri" "$mode"
        return 8
      fi

      return 3   # a live claude box is present — not a husk, absent any move to make
    fi

    # 🔴 no claude box AND no resume banner. the banner is NOT durable — claude
    #    draws it in an alternate screen, which the terminal tears down on exit,
    #    so a mechanic that died cleanly (or whose banner scrolled off) shows a
    #    BARE SHELL and no banner at all. the OLD code returned 4 here ("plain
    #    shell duct") and refused to heal — a mechanic the poll itself renders
    #    `💀 husk` off `mechanic:shell` sat dead, uncured.
    #
    #    the DURABLE discriminator is role+box, exactly the poll's
    #    (git.crew.poll.sh: `mechanic:shell → husk`): a mechanic RUNS claude, so
    #    a mechanic at a bare shell IS a husk, banner or no banner. a foreman is
    #    a bare shell BY DESIGN, so it stays a non-verdict
    #    (define.invariant.crew.husk.discriminator-parity).
    if [[ "$who" != "mechanic" ]]; then
      return 4   # a non-mechanic bare shell (foreman by design, a seat) is legitimate
    fi

    # a ^C in the tail means a HUMAN typed the interrupt — they may have acted
    # on what parked it. surface, never auto-heal (same guard the banner path
    # holds, applied here where the banner is gone).
    if printf '%s' "$plain" | tail -n 6 | grep -qE '\^C'; then
      echo "🙋 $tree/$who: husk ended by ^C — a HUMAN was at this keyboard"
      echo "   └─ read before you decide: rhx git.crew.read --tree $tree --who $who --raw --lines 40" >&2
      return 5
    fi

    # 🔴 name the CRASH DUMP where the pane holds one. the durable arm's own
    #    render says only "bare shell, no banner" — true, and it drops the one
    #    fact the tick needed: claude died of a heap OOM, which is a MEMORY
    #    signal about the BOX rather than about this clone
    #    (surgoal.squeeze-the-grove). a verdict that hides it sends the operator
    #    to read the pane by hand, which is the drill-in a verdict exists to
    #    spare them.
    # ⚠️ the dump is a RENDER detail only — it decides naught. the husk verdict
    #    above it is already settled by role + a returned shell, so a dump whose
    #    text we cannot parse costs the operator a sentence, never a cure.
    if printf '%s\n' "$plain" | grep -qa -- '----- Native stack trace -----'; then
      local __fatal
      __fatal="$(printf '%s\n' "$plain" | grep -oaE 'FATAL ERROR: .*' | tail -n1)"
      echo "💀 $tree/$who: husk (crashed — a node fatal dump, and the shell came back with NO exit badge)"
      echo "   ├─ ${__fatal:-a native stack trace sits above a returned shell prompt}"
      echo "   ├─ ⚠️ the badge is absent because starship draws it only on a nonzero \$?; the DUMP is the evidence, not the badge"
      echo "   └─ ⚠️ a heap OOM grades the BOX, never just this clone — read it: rhx git.grove.saturation"
    else
      echo "💀 $tree/$who: husk (bare shell, no banner) — a mechanic sits where claude belongs, safe to heal"
    fi
    __crew_heal_revive "$tree" "$grove" "$who" "$uri" "$mode"
    return $?
  fi

  # 🔴 THE PICKER, UNDER A BANNER — and it must be read BEFORE the order test
  #    below, because that test is exactly what misreads it.
  #
  #    the picker arm ~290 lines up sits INSIDE the no-banner branch, so a pane
  #    that carries BOTH a banner and a picker never reaches it. this is that
  #    arm's other door, and the shape is STRUCTURAL rather than literal — no
  #    fifth literal would have closed it.
  #
  # 🔴 .measured 2026-09-20 — rhachet-roles-bhrain.beav.feat-review-cost-meter,
  #    a SPONSORED star. the clone died `💥143` mid-turn (SIGTERM, this fleet's
  #    own earlyoom) and left the banner; a revive then typed
  #    `claude --resume 'mechanic' cont` and PARKED at the picker.
  #      crew.poll --healable → `💀 husk`, and a cure line
  #      crew.heal (that line, verbatim) → `😶 a live claude box is up`
  #    the pane was re-read seconds later, byte-identical. so the emitted cure
  #    was INERT — a term=false-report, and the exact split
  #    define.invariant.crew.husk.discriminator-parity forbids, for the FOURTH
  #    time and from the ONE root cause this file names twice already:
  #    a bare ❯ is not evidence of a live box. the picker's own row highlight
  #    IS `❯ $who`, so the token that proves the seat DEAD reads as proof it is
  #    alive.
  #    verbatim pane: .test/.assets/pane.husk.revive-parked-at-picker-read-as-an-ask.log
  #
  # ⚠️ .revive parts the two cures from here, exactly as the no-banner arm
  #    relies on: a picker with a ROW holds a live transcript one Enter from
  #    cured; a picker with ZERO rows is a FLAP, and revive routes that to the
  #    hatch from inside (__duct_picker_has_no_rows). one door, never two
  #    half-doors.
  if __duct_pane_is_picker_parked "$plain"; then
    echo "💀 $tree/$who: husk (parked at claude's 'Resume Session' picker, under a resume banner) — a revive that stalled, safe to heal"
    __crew_heal_revive "$tree" "$grove" "$who" "$uri" "$mode"
    return
  fi

  # ⚠️ the order test itself is RIGHT and stays: a clone that genuinely
  #    restarted below its own stale banner is LIVE, and to fire there would
  #    reboot a healthy clone
  #    (rule.forbid.byhand-fix-that-burns-the-live-proof). what it could not do
  #    is part a restart's caret from the picker's — so the picker is claimed
  #    above, and only then does a ❯ below the banner mean what this reads it
  #    to mean.
  local banner_line
  banner_line="$(printf '%s\n' "$plain" | grep -n 'Resume this session with:' | tail -n1 | cut -d: -f1)"
  if printf '%s\n' "$plain" | tail -n "+$((banner_line + 1))" | grep -q '❯'; then
    return 3   # claude restarted AFTER the banner printed — genuinely live
  fi

  local last
  last="$(printf '%s\n' "$plain" | grep -v '^[[:space:]]*$' | tail -n1)"

  if printf '%s' "$plain" | tail -n 6 | grep -qE '\^C'; then
    echo "🙋 $tree/$who: husk ended by ^C — a HUMAN was at this keyboard"
    echo "   └─ they may have already acted on what parked it. read before you" >&2
    echo "      decide: rhx git.crew.read --tree $tree --who $who --raw --lines 40" >&2
    return 5
  fi

  local code=""
  if [[ "$last" =~ 💥([0-9]+) ]]; then
    code="${BASH_REMATCH[1]}"
  fi

  # 🔴 an ABSENT exit code is not an unreadable close. the `💥NNN` above is a
  #    SHELL PROMPT segment, and a `%` / `$` prompt renders it ONLY on a
  #    non-zero exit — so a claude that ended at 0 leaves the resume banner and
  #    a bare prompt, and the old code called that "unreadable" and refused.
  #
  #    the code names HOW it died. the BANNER names WHETHER, and the banner is
  #    right here. both safety guards above already ran and did not fire:
  #      - no `^C` in the tail       ⇒ no human was at this keyboard
  #      - no `❯` below the banner   ⇒ claude did not restart
  #    so the evidence for a husk is complete, and only a cosmetic number is
  #    absent. bias to DETECT (surgoal.polish-the-supervisor-and-prioritizer-
  #    tools): a false revive resumes a conversation, which `claude --resume`
  #    makes benign; a miss parks a ⭐ tree without bound.
  #
  #    measured 2026-09-15 on
  #    rhachet-roles-ehmpathy.beav.feat-auto-review-permission-responses —
  #    parked at 3.3.1.blueprint.product after 24 attempts, `💀 husk · still
  #    104m`, PERMANENT in --healable across every tick, refused on every one.
  #    a row that can never leave an actionable set trains a reader to skip the
  #    whole set — the same harm rule.forbid.clipped-sweeps names.
  #
  # ⚠️ the mechanic gate is the SAME discriminator the no-banner path holds at
  #    the top of this operation: a mechanic RUNS claude, so a mechanic behind a
  #    resume banner IS a husk; a foreman is an empty seat BY DESIGN, and to
  #    revive one would put a clone where none belongs
  #    (define.invariant.crew.husk.discriminator-parity).
  if [[ -z "$code" ]]; then
    if [[ "$who" != "mechanic" ]]; then
      echo "🙋 $tree/$who: husk detected, but its close is unreadable — surface it"
      echo "   └─ read it: rhx git.crew.read --tree $tree --who $who --raw --lines 40" >&2
      return 6
    fi

    echo "💀 $tree/$who: husk (banner present, no exit code) — claude exited and left a resumable session, safe to heal"
    echo "   └─ the shell renders 💥NNN only on a NON-ZERO exit, so a clean close shows none" >&2
    __crew_heal_revive "$tree" "$grove" "$who" "$uri" "$mode"
    return $?
  fi

  echo "💀 $tree/$who: husk (exit $code) — killed by signal, safe to heal"

  # 🔴 .143 is not merely A signal — it is THE one this fleet's own box sends
  #    128+15 = SIGTERM, and the header of this very operation already says
  #    "SIGTERM = 143 is this fleet's own earlyoom guard". that knowledge sat
  #    in a COMMENT and reached no render, so every 143 healed as a plain husk
  #    and the reader moved on.
  #
  # ⚠️ .the two exits demand OPPOSITE second acts
  #    a clone that exited owes a resume, and naught else. a clone the BOX
  #    killed owes a resume AND a look at the grove — because the kill is
  #    evidence the box is oversubscribed, and a revive alone puts the same
  #    heavy process back on the same full box, to be culled again.
  #
  # 🔴 .and it is the ONLY evidence there is
  #    `git.grove.saturation`'s oom row counts KERNEL kills via the cgroup
  #    counter. earlyoom TERMs FIRST, so a successful earlyoom cull never
  #    reaches that counter — the row says so itself: "its journal is
  #    unreadable here, so its TERMs are UNCOUNTED". a reader who checks the
  #    counter for corroboration finds it unmoved and concludes wrongly.
  #
  #    .measured 2026-09-17 on
  #    rhachet-roles-bhrain.beav.feat-prescribed-brain-per-stone: TERMed
  #    1h17m into a turn while grove-901 sat at 85% committed. the box
  #    recovered 4.7G; the kernel counter never moved off 2.
  #
  #    .measured again 2026-09-19 on rhachet.beav.feat-boot-manifest-and-
  #    budget — and this one is the stronger datum, because the render
  #    PREDICTED it rather than merely fit it. a 143 husk, 1m old, while
  #    grove-901 read ram 🔴 at 7.8G of 31G (25% available, 75% committed)
  #    with 22 claude peers on 21G of it. the kernel counter was STILL 2 —
  #    unmoved from the 09-17 datum, exactly as the arm says it will be.
  #
  # 🟡 .so the hedge STAYS at n=2, on purpose
  #    `most likely` is the honest word and must not harden into a claim.
  #    a SIGTERM has other senders — a human at the keyboard, a crew.stop, a
  #    systemd stop — and this arm reads an exit code, never a sender. the
  #    cure for that is not a firmer word; it is the earlyoom journal, which
  #    cannot be read from here. ⇒ the arm's prescription is a READ
  #    (`rhx git.grove.saturation`), never a ban, so whoever follows it
  #    lands on the evidence and can overturn the attribution themselves.
  #    that is what parts this from a forecast that shuts a hunt down.
  #
  # ⇒ rung 2 of .dream/v2026_09_10.fix.the-grove-culls-clones-and-the-counter-
  #   is-blind.md, which asks for exactly this: "a crew whose clone died on
  #   143 should render as a distinct verdict, never as a plain husk."
  if [[ "$code" == "143" ]]; then
    echo "   ├─ 🔴 143 = SIGTERM — the BOX killed this clone, most likely its earlyoom guard"
    echo "   ├─ ⚠️  a cull is UNCOUNTED by the oom row (it tallies kernel kills; earlyoom TERMs first)"
    echo "   └─ ⇒ a revive alone puts the same heavy clone back on the same full box — read it: rhx git.grove.saturation"
  fi

  __crew_heal_revive "$tree" "$grove" "$who" "$uri" "$mode"
  return $?
}

# .what = reboot a husk's pane, then resume claude into it — the shared CURE
#
# .why  = the reboot+resume was inline in __crew_heal_one's crash-banner path
#         ONLY, so a husk detected by any OTHER discriminator (a bare-shell
#         mechanic whose banner scrolled off with claude's alt-screen) had no
#         cure to reach. one detector, one cure, no divergence
#         (define.invariant.crew.husk.discriminator-parity).
#
# .what = the FLAP's cure — reboot a husk's pane, then launch a FRESH clone into
#         it. the twin of __crew_heal_revive, and it differs in exactly one way:
#         it does NOT pass --resume, because no conversation is left.
#
# 🔴 .why a verb of its own, and why neither extant verb will do
#    a flap is a husk whose TRANSCRIPT IS GONE (claude says so verbatim: "No
#    conversations found to resume"). so the three cures already on the table
#    each fail, and each fails SILENTLY:
#
#      crew.boot    findsert on the DUCT axis. the husk's duct is alive, so it
#                   reports `duct found` and touches the dead program not at all
#      crew.reboot  replaces the program with a FRESH SHELL — which is the husk
#                   state it was summoned to leave
#      revive       sends --resume, and --resume is the one flag that cannot work
#
#    ⇒ measured 2026-09-15: the flap arm shipped `crew.boot` as its cure, the
#      operator ran the emitted line verbatim, and it printed
#      `🔧 duct found (local) · ✔ 1 duct(s) up · 🦫 dam fine!` over a tree that
#      was still a dead husk. a cure that reports SUCCESS and cures naught is
#      worse than one that errors — an error at least halts the operator
#      (rule.forbid.failhide).
#
#    ⇒ so `rule.require.a-cure-path-for-every-named-husk-shape` was unmet the
#      moment the flap was NAMED: to classify a shape and hand it a cure that
#      cannot cure it is to classify, never to guide.
#
# .how the launch form is `git.tree.behavior.sh`'s own boot_drive, verbatim but
#      for the role — the one form proven to land a clone that drives:
#        rhx enroll claude --as @:<role> --name <role> \
#          --permission-mode acceptEdits 'hi, please drive'
#
#      ⚠️ --permission-mode acceptEdits is REQUIRED here and absent from revive.
#         a resume restores the session's own mode; a fresh clone has no session
#         to restore one from, so with no flag it comes back in default mode and
#         stalls on its first edit (define.invariant.crew.revive-is-incomplete-
#         without-a-nudge, one notch earlier in the lifecycle).
#
# ⚠️ the plan/apply gate lives HERE too, and it is the STRICTER of the pair: a
#    revive restores a conversation, while this one ABANDONS it. on a flap that
#    abandonment is free (the transcript is already gone) — but the gate must
#    not depend on that read proving right.
__crew_heal_hatch() {
  local tree="$1" grove="$2" who="$3" uri="$4" mode="$5"
  if [[ "$mode" != "apply" ]]; then
    echo "         plan: would crew.reboot, then launch a FRESH clone — rerun with --mode apply"
    return 0
  fi

  if ! crew.reboot --tree "$tree" --grove "$grove" --who "$who" >/dev/null 2>&1; then
    echo "         💥 reboot failed — hatch aborted for $tree/$who" >&2
    return 1
  fi

  # --await 30, never a blind sleep: the reboot restarts the pane's shell, and a
  # send that races its init lands in a shell not yet ready (the same race the
  # revive send was cured for).
  if ! duct.send --on "$uri" --await 30 \
      --what "rhx enroll claude --as @:$who --name $who --permission-mode acceptEdits 'hi, please drive'" \
      >/dev/null 2>&1; then
    echo "         💥 launch send failed — pane rebooted but no clone was started" >&2
    return 1
  fi

  echo "         ✨ hatched — a fresh clone now drives; its prior conversation is gone"
  echo "         verify: rhx git.crew.read --tree $tree --who $who"
  return 0
}

# 🔴 THE POISON DISCRIMINATOR — is this transcript ITSELF rejected?
#
#    a poisoned conversation is one whose REQUEST BODY the api refuses. that
#    body is re-serialized from the transcript on every turn, so the defect is
#    not in the attempt — it is in the state the attempt is built from. a retry
#    constructs the identical bytes and receives the identical rejection,
#    forever (rule.require.abandon-poisoned-conversations).
#
# ⚠️ .this is NOT the rate-limit arm, and NOT a transient. that rule's table:
#      a 400 that names the BODY     -> terminal. every turn resends it
#      429 / "hit your limit"        -> a vendor cap, a different cure entirely
#      5xx / overloaded / a timeout  -> transient. a retry is correct
#      a 400 seen ONCE               -> not yet. a second request_id settles it
#
# 🔴 .the SECOND request_id is the discriminator, and it is the whole arm.
#    one 400 can be a fluke of one request. the SAME rejection under a
#    DIFFERENT request_id proves the body is rebuilt identically, which is
#    precisely what makes it terminal. so BOTH counts are required, and neither
#    fires alone:
#      - `API Error: 400` at least TWICE   (two rejections, never one wrapped)
#      - at least TWO distinct `req_…` ids (two different requests)
#
# ⚠️ .the pair is what survives line WRAP. a wrapped body can split an id token
#    and inflate the id count on a SINGLE error — but a wrap never repeats the
#    literal `API Error: 400`, so the hit count holds that inflation in check.
#    an id count alone would fire on one wrapped rejection, which the rule's own
#    table calls "not yet".
__crew_pane_has_poison() {
  local pane="$1"

  # arm 1 — the error CLASS. a 400 that names the request body, never a cap
  printf '%s' "$pane" | grep -q 'API Error: 400' || return 1
  printf '%s' "$pane" | grep -q 'invalid_request_error' || return 1

  # arm 2 — at least two REJECTIONS, never one body wrapped across lines
  local hits
  hits=$(printf '%s' "$pane" | grep -c 'API Error: 400')
  [[ "$hits" -ge 2 ]] || return 1

  # arm 3 — under DISTINCT request ids, which is what proves it re-serializes
  local ids
  ids=$(printf '%s' "$pane" | grep -oE 'req_[A-Za-z0-9]{6,}' | sort -u | grep -c .)
  [[ "$ids" -ge 2 ]]
}

# ⚠️ the plan/apply gate lives HERE, so every caller honors safe-by-default: a
#    reboot ends a program (even a dead frame), so it takes --mode apply.
__crew_heal_revive() {
  local tree="$1" grove="$2" who="$3" uri="$4" mode="$5"
  if [[ "$mode" != "apply" ]]; then
    echo "   └─ plan: would crew.reboot, then resume claude — rerun with --mode apply"
    return 0
  fi

  if ! crew.reboot --tree "$tree" --grove "$grove" --who "$who" >/dev/null 2>&1; then
    echo "   └─ 💥 reboot failed — heal aborted for $tree/$who" >&2
    return 1
  fi

  # .why `rhx enroll claude`: a healed husk must come back ADDRESSABLE, exactly
  #      as a booted one is. enroll passes every token it does not own through to
  #      the same brain cli, and registers the clone as `@:$who`, so
  #      `rhx clone get @:$who` reads the revived conversation. a heal that
  #      restored the pane but not the registration would leave the one clone a
  #      supervisor most needs to read the least readable.
  #
  # 🔴 .why `--await 30`, NOT `sleep 2` then a blind send — the reboot restarts
  #    the pane's shell, and its init (dotfiles, prompt) takes a moment. a send
  #    that races it lands its keystrokes in a shell not yet ready to read them,
  #    so the resume is LOST and the pane sits at a bare prompt — the exact state
  #    heal was summoned to cure. a FIXED `sleep 2` cannot fix this: on a
  #    saturated grove the shell takes far longer than 2s to settle, so the send
  #    is lost anyway and the mechanic stays dead. measured 2026-09-13,
  #    grove-sandpine-v20260901: load 871% (34.85/4), runq 22 — heal rebooted the
  #    husk, blind-sent the resume into the un-ready shell, and left a bare
  #    prompt with NO enroll echoed. crew.boot's proven resume path (below) uses
  #    `duct.send --await`, which POLLS for the shell prompt and sends only once
  #    ready, bounded at 30s. mirror it here — one cure, no divergence
  #    (define.invariant.crew.husk.discriminator-parity). heal is internal
  #    crewwork, so a duct.* call here is substrate, not a supervisor layer drop
  #    (rule.always.entool-the-layer-you-drop-below); the picker loop below
  #    already reads/sends on this same $uri.
  #
  # 🔴 .why `--resume "$who" continue`, the EXACT form — corrected by the human
  #    2026-09-14. two prior forms were WRONG:
  #      - `--resume $who` (bare) opens claude's interactive `Resume Session`
  #        picker and waits on an Enter a send does not reliably dismiss.
  #      - `--as @:$who --continue` does NOT reuse the session. `--continue` is
  #        cwd-RECENCY: it reattaches whatever session ran most recently in the
  #        cwd, not deterministically the NAMED one — so on a tree that has run
  #        more than one session it silently resumes the wrong transcript, or
  #        none. the human, verbatim: "otherwise, it does not reuse the sesion
  #        ... use the command i gave you verbatum going forward."
  #    the correct form gives claude the session NAME plus a PROMPT after it.
  #    `claude --resume "$who" continue` resumes the named session
  #    deterministically — a name is given, so NO picker draws — AND submits
  #    "continue" as its first turn, which IS the nudge the revive owes
  #    (define.invariant.crew.revive-is-incomplete-without-a-nudge). so resume +
  #    nudge land in ONE send: no picker, and no separate nudge below. claude's
  #    resume restores the session's own permission mode, so no `--permission-mode`
  #    flag is owed.
  if ! duct.send --on "$uri" --await 30 --what "rhx enroll claude --resume \"$who\" continue" >/dev/null 2>&1; then
    echo "   └─ 💥 resume send failed — pane rebooted but claude was not restarted" >&2
    return 1
  fi

  # 🔴 FALLBACK — DRIVE A PICKER IF ONE STILL DRAWS. `--continue` (above) should
  #    resume with NO picker, but if claude ever opens the `Resume Session`
  #    picker anyway, heal must send that Enter ITSELF — a hand-sent Enter is the
  #    exact workaround rule.forbid.byhand-fix-that-burns-the-live-proof forbids,
  #    and it consumed the only field repro on 2026-09-13.
  #
  #    this loop mirrors crew.boot's proven resume path, and cures TWO defects
  #    the prior naive `sleep 3` + one-read + plain-Enter carried — both
  #    measured 2026-09-13 on a live husk that stayed parked at the picker:
  #    1. a fixed `sleep 3` RACES the picker draw. the read lands before the
  #       picker paints, the grep misses, and no Enter is ever sent. so POLL
  #       for the picker's own header, never a single timed read.
  #    2. the Enter MUST carry --anyway. the picker pane holds a LIVE claude, so
  #       a plain keystroke hits the busy-guard and is silently dropped — which
  #       is why the prior send never landed. --anyway sends into a busy pane on
  #       purpose (rule.require.verify-after-send — the read never confirmed a
  #       cure the send never made).
  #
  #    the poll interval is a variable so a clamp can set it to 0 and exercise
  #    every arm without ~6s of dead sleep per case (rule.require.fast-tests).
  local naptime="${CREW_RESUME_POLL_SECS:-1}"
  local picker_seen="" read_ok="" after="" attempt
  for attempt in 1 2 3 4 5 6; do
    [[ "$naptime" == "0" ]] || sleep "$naptime"
    after="$(duct.read --on "$uri" --lines 20 2>/dev/null)" || continue
    read_ok="yes"
    if printf '%s' "$after" | grep -q 'Resume Session'; then
      picker_seen="yes"
      break
    fi
  done

  # a picker drew → send its Enter WITH --anyway, then poll for the picker
  # chrome to CLEAR before we trust a cure.
  if [[ -n "$picker_seen" ]]; then
    duct.send --on "$uri" --anyway --keys Enter >/dev/null 2>&1
    for attempt in 1 2 3 4; do
      [[ "$naptime" == "0" ]] || sleep "$naptime"
      after="$(duct.read --on "$uri" --lines 20 2>/dev/null)" || continue
      printf '%s' "$after" | grep -q 'Resume Session' || break
    done
  fi

  # 🔴 the read's OWN failure is tracked apart from its result — a swallowed
  #    read error would make "no picker" and "could not look" the same verdict
  #    (rule.forbid.failhide, term=volunteered-diagnosis).
  if [[ -z "$read_ok" ]]; then
    echo "   └─ ⚠️ could not read the duct after resume — state UNKNOWN. verify:" >&2
    echo "      rhx git.crew.read --tree $tree --who $who --lines 20" >&2
    return 1
  fi

  # 🔴 VERIFY THE PICKER IS GONE, THEN a live claude box. the picker's own
  #    highlight is also `❯ $who`, so a bare `❯` grep is a false floor that
  #    reads the picker itself as a cured clone — require the chrome GONE first.
  if printf '%s' "$after" | grep -q 'Resume Session'; then
    # 🔴 A PICKER WITH ZERO ROWS IS A FLAP, and it must route to the HATCH —
    #    never to the fail-out below, and never back to another resume.
    #
    #    claude reports "no such session" by TWO surfaces. the flap arm further
    #    down greps its NON-interactive sentence (`No conversations found to
    #    resume`). this is its INTERACTIVE twin: a NAME was given, matched
    #    naught, so claude opened the picker with that name pre-filled as a
    #    search and drew an EMPTY list — the same fact, and no sentence to grep.
    #
    #    ⇒ so a flap fell through here and got "verify manually", which is a
    #      term=volunteered-diagnosis: the state reported UNKNOWN while the pane
    #      states the cause outright. the operator then re-heals every tick, and
    #      the pane comes back byte-identical — detect → heal → same → detect.
    #
    #    measured 2026-09-18, three consecutive ticks on
    #    infrastructure.beav.feat-camp-git-backup-bucket. the emitted heal line
    #    ran verbatim each tick and cured naught
    #    (rule.forbid.remedies-that-mimic-the-defect).
    #
    # ⚠️ the classifier answers NO on a pane it cannot read, so an unreadable
    #    picker still reaches the manual fail-out below rather than the hatch —
    #    a hatch on a guess would ABANDON a live transcript (rule.forbid.failhide).
    if __duct_picker_has_no_rows "$after"; then
      echo "   └─ 🪫 flap — the picker drew with NO session to pick, so the named"
      echo "      ├─ conversation is GONE. a resume can never cure this"
      echo "      ├─ do NOT re-heal — a second revive is the same failed remedy"
      echo "      └─ cure: a FRESH clone (the transcript is already lost, so naught more goes)"
      __crew_heal_hatch "$tree" "$grove" "$who" "$uri" "$mode"
      return 8
    fi
    # 🔴 stdout, for the reason the caret branch below states in full: every
    #    other terminal branch here renders its verdict on stdout, and a
    #    give-up that speaks only on stderr leaves the operator with a husk
    #    DIAGNOSIS and no outcome. the twin hole, one branch over — to cure
    #    one and leave this one is rule.forbid.clipped-sweeps.
    echo "   └─ 🕗 resume opened the session picker and it did not clear — outcome UNCONFIRMED"
    echo "      └─ settle it with ONE read: rhx git.crew.read --tree $tree --who $who --lines 20"
    return 1
  fi
  # 🔴 NOW POLL FOR THE BOX, exactly as we polled for the picker — do NOT trust
  #    the read we inherited. the picker loop exits the moment the picker is
  #    GONE, or after its whole budget when none ever drew, and at that instant a
  #    box that has not yet PAINTED reads identical to a box that never will.
  #
  #    measured 2026-09-16, svc-reservations.beav.feat-spot-forecast-widget: on a
  #    saturated grove claude took longer than the picker budget to draw, so the
  #    caret grep below false-negatived and the verdict went to STDERR as "no
  #    claude box seen yet". heal rendered three diagnostic lines and NO outcome
  #    line, on a revive that in fact worked — a crew.read one second later
  #    showed a live box, a live stone, and PR #357.
  #
  #    ⇒ the poll admits BOTH terminal shapes, a live caret and a flap, so a flap
  #      costs one interval rather than the whole budget. it sits AFTER the
  #      picker-chrome guard on purpose: the picker's own highlight is also `❯`,
  #      so to poll the caret before that guard would exit on the picker itself.
  #
  # 🔴 .and EVERY read here RE-APPLIES the picker guard above, because that
  #    guard is a ONE-SHOT against a snapshot and this loop REPLACES it. a
  #    picker that draws AFTER the detect budget was never seen by the guard,
  #    and the picker's own row highlight IS `❯ $who` — so a bare caret grep
  #    breaks out on the picker itself and renders `✨ revived` over a pane
  #    parked at `Resume Session`. the guard's PLACEMENT is necessary and NOT
  #    sufficient: a guard is only as good as the read it saw.
  #
  #    measured 2026-09-19, two seats healed in one tick —
  #    rhachet.beav.fix-keyrack-daemon-orphan and
  #    ehmpathy-cicd.beav.fix-test-tempdir-leak. heal printed `✨ revived` for
  #    both; a crew.read seconds later showed both still at the picker with
  #    `❯ mechanic` highlighted (term=false-report: the claim was true of the
  #    caret it matched and false of the world).
  #    verbatim pane: .test/.assets/pane.husk.parked-at-the-resume-session-picker.log
  #
  # ⇒ so a LATE picker is DRIVEN here, never accepted — one Enter, once, and
  #   the poll continues. the caret break is reachable only on a pane whose
  #   chrome is already gone.
  local picker_driven="$picker_seen"
  for attempt in 1 2 3 4 5 6; do
    if printf '%s' "$after" | grep -q 'Resume Session'; then
      if [[ -z "$picker_driven" ]]; then
        duct.send --on "$uri" --anyway --keys Enter >/dev/null 2>&1
        picker_driven="yes"
      fi
    elif printf '%s' "$after" | grep -qE '❯|No conversations? found to (resume|continue)'; then
      break
    fi
    [[ "$naptime" == "0" ]] || sleep "$naptime"
    after="$(duct.read --on "$uri" --lines 20 2>/dev/null)" || continue
    read_ok="yes"
  done

  # 🔴 THE PICKER GUARD, AGAIN — on what the poll LAST read. its twin above
  #    judged a read this loop has since replaced up to six times over, and to
  #    carry that verdict down here is to answer with a stale fact. same arms,
  #    same order: a zero-row picker is a flap and routes to the HATCH; any
  #    other chrome is an UNCONFIRMED outcome, never a cure.
  if printf '%s' "$after" | grep -q 'Resume Session'; then
    if __duct_picker_has_no_rows "$after"; then
      echo "   └─ 🪫 flap — the picker drew with NO session to pick, so the named"
      echo "      ├─ conversation is GONE. a resume can never cure this"
      echo "      ├─ do NOT re-heal — a second revive is the same failed remedy"
      echo "      └─ cure: a FRESH clone (the transcript is already lost, so naught more goes)"
      __crew_heal_hatch "$tree" "$grove" "$who" "$uri" "$mode"
      return 8
    fi
    echo "   └─ 🕗 resume opened the session picker and it did not clear — outcome UNCONFIRMED"
    echo "      └─ settle it with ONE read: rhx git.crew.read --tree $tree --who $who --lines 20"
    return 1
  fi

  # 🔴 THE FLAP — a husk whose CONVERSATION IS GONE. claude says so verbatim:
  #    "No conversations found to resume." / "No conversation found to continue".
  #    this is NOT a revivable husk, and the distinction is the whole point:
  #      - a 143-husk (SIGTERM/earlyoom) keeps its transcript ⇒ revive cures it
  #      - a FLAP has no transcript left ⇒ revive can NEVER cure it, and to
  #        re-run one is rule.forbid.remedies-that-mimic-the-defect
  #
  #    without this arm the flap fell through to the generic "no claude box seen
  #    yet — verify manually" below, which is a volunteered-diagnosis
  #    (term=volunteered-diagnosis): it reports the state UNKNOWN while the pane
  #    states the cause explicitly, so the operator re-heals a tree that cannot
  #    be revived, every tick, forever.
  #
  #    measured 2026-09-14, BOTH orphaned husks on the fleet:
  #      - rhachet-roles-bhuild.beav.feat-factory-upgrade-collection
  #        "No conversations found to resume." (the repaired --resume form)
  #      - svc-coachbook.bert.wt-1.1-cert-ingest
  #        "No conversation found to continue"  (the prior --continue form)
  #    verbatim pane: .test/.assets/pane.flap.resume-finds-no-conversation.log
  #
  #    ⇒ return 8, a code of its own, so --healable can stop to offer a revive
  #      for a flap (rule.require.a-cure-path-for-every-named-husk-shape: every
  #      named husk shape owes a cure, and a flap's cure is a FRESH boot — the
  #      transcript is already lost, so a boot forfeits naught).
  if printf '%s' "$after" | grep -qE 'No conversations? found to (resume|continue)'; then
    echo "   └─ 🪫 flap — the conversation is GONE, so a revive can never cure this"
    echo "      ├─ why: claude reports no transcript left to resume"
    echo "      ├─ do NOT re-heal — a second revive is the same failed remedy"
    echo "      └─ cure: a FRESH clone (the transcript is already lost, so naught more goes)"
    __crew_heal_hatch "$tree" "$grove" "$who" "$uri" "$mode"
    return 8
  fi

  # 🔴 THE POISON — a husk whose TRANSCRIPT IS REJECTED. this arm must outrank
  #    the caret arm below, and that ORDER carries the whole value: a poisoned
  #    box is LIVE. it paints a `❯`, it takes a keystroke, and it answers every
  #    turn with the same 400. so the caret arm fires on it and renders
  #    `✨ revived` over a clone that can never take another turn — true about
  #    the box it measured, false about the world (term=false-report).
  #
  #    measured 2026-09-21 on rhachet-roles-bhrain.beav.feat-review-cost-meter:
  #    crew.heal classified it `husk (exit 134)`, revived it, and reported
  #    `✨ revived — claude box is live again`. the pane held FIVE `API Error:
  #    400` rejections under five distinct request_ids, each one a complaint
  #    about the BODY (`messages.7.content.297: thinking blocks cannot be
  #    modified`). the revive worked mechanically and cured naught.
  #    verbatim pane:
  #      .test/.assets/pane.poison.body-defect-400-repeats-under-new-request-ids.log
  #
  # ⚠️ .the cure is the HATCH, as a flap's is — but the TRADE differs, and that
  #    is worth stated rather than assumed. a flap's transcript is already GONE,
  #    so to abandon it forfeits naught. a poisoned transcript still EXISTS and
  #    the hatch destroys it. that is acceptable here because the ROUTE holds
  #    the work — stones, guards, yields, the review ledger, every `.given` and
  #    `.taken` — and the transcript holds only its memory. a fresh clone
  #    resumes at the same stone for the cost of one `route.drive`.
  if __crew_pane_has_poison "$after"; then
    echo "   └─ 🧪 poison — the transcript ITSELF is rejected, so a revive can never cure this"
    echo "      ├─ why: an API Error 400 faults the request BODY, and that body IS the transcript"
    echo "      ├─ proof: the same rejection under 2+ distinct request_ids — it rebuilds every turn"
    echo "      ├─ do NOT re-heal — a second revive restores the same poisoned bytes"
    echo "      └─ cure: a FRESH clone (the route holds the work; the transcript held only its memory)"
    __crew_heal_hatch "$tree" "$grove" "$who" "$uri" "$mode"
    return 8
  fi

  if printf '%s' "$after" | grep -q '❯'; then
    # 🔴 the nudge is ALREADY sent — the resume command's "continue" prompt IS the
    #    nudge (define.invariant.crew.revive-is-incomplete-without-a-nudge).
    #    `--resume "$who" continue` restores the transcript AND submits "continue"
    #    as the first turn, so the clone drives its route without a second send. a
    #    SECOND nudge here would be a false-positive double-nudge (that invariant's
    #    own enforcement: "a NUDGE cure given a SECOND nudge after the revive = a
    #    false positive"). so verify the live box and report — do NOT re-nudge.
    echo "   └─ ✨ revived — claude box is live again, resumed with a 'continue' nudge"
    return 0
  fi
  # 🔴 THE OUTCOME GOES TO STDOUT, and that stream is the whole cure here.
  #    every other terminal branch of this operation renders its verdict on
  #    stdout — `✨ revived`, and both flap verdicts. this branch alone spoke
  #    only on stderr, so a caller that reads stdout saw heal print a husk
  #    DIAGNOSIS and no outcome whatever. silence there reads as "it did
  #    naught", and the operator pays a drill-in read to learn otherwise.
  #
  # ⚠️ .and the budget is NOT the lever — that was tried, and it recurred
  #    2026-09-16 the caret poll above was added for this exact symptom, with
  #    its own comment: "heal rendered three diagnostic lines and NO outcome
  #    line, on a revive that in fact worked". it bounded the race at 6×1s.
  #    2026-09-18 it reproduced verbatim on declastruct-aws.beav.feat-s3-
  #    backup-store-properties: heal printed the 💀 husk line and no outcome;
  #    a crew.read seconds later showed `❯ continue` landed and the box mid
  #    auto-compaction, on a grove at 215% load.
  #    ⇒ a resume that lands in compaction outruns ANY fixed budget, so to
  #      turn that screw a second time is rule.forbid.remedies-that-mimic-the-
  #      defect. what a longer budget cannot fix, an honest verdict can.
  #
  # 🔴 .and the verdict must say UNCONFIRMED, never FAILED
  #    the send landed; only the confirm timed out. to render this as a
  #    failure would invert the arm the other way — the operator re-heals a
  #    live clone, which is a second revive on a healthy box.
  echo "   └─ 🕗 resume SENT, outcome UNCONFIRMED — the caret never painted inside the poll budget"
  echo "      ├─ this is NOT a failed revive: the send landed, and only the confirm ran out of time"
  echo "      └─ settle it with ONE read: rhx git.crew.read --tree $tree --who $who --lines 20"
  return 1
}

# .what = is this ONE clone a SUSPECTED wedge — alive, not a plea, not a
#         husk, and stuck mid-work with a frame that does not move
#
# .why  = term=duct.program.wedge: a wedge is ALIVE and does not ANSWER, and it
#         renders 🧊 frozen — the token a park, a husk, an orphan, and an idle
#         clone all share. no read alone confirms it (the address that would
#         confirm it mutates a live crew), so this NARROWS to a candidate set
#         and hands the confirm to a human. it NEVER auto-reboots.
#
# 🔴 .a PLEA is NOT a wedge — the boundary this function must hold
#    a permission modal is alive and ready to answer: one key moves it, and the
#    decision needs a brain (approve/decline) or a human (a human-only grant).
#    that is a plea, cured by a keystroke, NEVER a reboot. so a live modal is
#    excluded up front — a reboot on a plea kills a clone that needed a key.
#
# ⚠️ .read the FRAME, never the clock (term=duct.program.wedge row 61) — a timer
#    climbs on a wedged program as it does on a live one, so the compare STRIPS
#    the elapsed/token line and tests whether the substantive content moved.
#
# return: 0 suspected-wedge · 2 unread · 3 plea · 4 at-rest · 5 moved · 6 husk/shell
# .what = restore `--permission-mode acceptEdits` on a clone that lost it.
#         rc 0 = cured (or planned) · 2 = no pane read · 4 = mode intact ·
#         5 = the modal would not clear · 6 = the mode would not take ·
#         7 = mode restored, but the resume nudge parked in the box.
#
# 🔴 .why an AXIS of its own, and why it is the only cure that fits
#         a mode-lost clone is ALIVE and PRODUCTIVE. every other heal axis is
#         aimed at a clone that stopped: revive at a dead box, nudge at a cap,
#         relay at an orphaned queue, wedge at a frame that held. not one of
#         them describes a clone whose only fault is that it asks permission for
#         its own file writes — so for the life of this tool the cure was a
#         human keystroke, once per write, forever (rule.forbid.byhand-heal).
#
# 🔴 .why NOT the hatch, which is right there and already correct
#         __crew_heal_hatch relaunches with the flag, and it ends the
#         conversation. a mode-lost clone is mid-review with a transcript worth
#         more than the mode is — so a reboot would cure the cheap fault and
#         burn the expensive asset
#         (rule.forbid.byhand-fix-that-burns-the-live-proof).
#
# 🔴 .why NOT option 2 of the modal, which would do it in one key
#         option 2 approves THIS write and sets the mode in the same keystroke.
#         the babysit contract forbids a supervisor to send it, and that forbid
#         is about the GRANT half rather than the mode half — so a tool that
#         sent it under another name would route around the rule rather than
#         obey it.
#
#         ⇒ so the sequence separates the two halves that key fuses:
#             Escape  — decline THIS write, and the clone's TURN ENDS on it
#             BTab    — cycle the permission mode at the now-quiet box
#             nudge   — resume the clone, because the Escape parked it
#           and it VERIFIES each half by re-read rather than by assumption
#           (rule.require.verify-after-send: a key send exits 0 on DELIVERY).
#
# 🔴 .why the NUDGE is part of the cure, never a courtesy
#         this header once read "the clone keeps its turn and retries", and the
#         plan text said the same. MEASURED FALSE 2026-09-18 on
#         feat-prescribed-brain-per-stone: after the Escape the pane held an
#         empty ❯ box with no frame. the turn had ENDED. the mode was restored
#         and the clone sat idle.
#
#         🔴 and the poll then named it NOWHERE. the 🎛️ row cleared, the crew
#           read `at work`, and --healable dropped the tree — so a cure that
#           stopped at the mode would PARK a clone and report ✅ over it, which
#           is the one outcome no later tick can find
#           (define.invariant.crew.revive-is-incomplete-without-a-nudge — the
#           same invariant the revive axis already obeys at its own `❯` branch).
#
# ⚠️ .the cost, stated: the Escape declines one edit, and the clone can read that
#         as a HUMAN's verdict on its content and re-plan around it. so the nudge
#         carries the one fact that corrects it — the decline was MECHANICAL —
#         and not one word about the work
#         (rule.forbid.steer-a-clone-beyond-a-permission-key: a cure may restore
#         a capability the tool took away; it may never steer the work).
__crew_heal_mode() {
  local tree="$1" grove="$2" who="$3" mode="${4:-plan}"

  local host
  host=$(__crew_grove_host "$grove") || { echo "💥 $tree/$who: unresolvable grove '$grove'" >&2; return 1; }
  local uri
  uri="$(__crew_duct_uri "$host" "$tree" "$who")"

  local raw
  raw="$(duct.read --on "$uri" --lines 60 --raw 2>/dev/null)"
  [[ -z "$raw" ]] && return 2

  local offer
  offer="$(__duct_pane_mode_lost "$raw" || true)"
  [[ -z "$offer" ]] && return 4

  echo "🎛️ $tree/$who: MODE LOST — \"$offer\""
  echo "   ├─ claude prints that offer ONLY when acceptEdits is off, so every file write draws a modal"
  if [[ "$mode" != "apply" ]]; then
    echo "   ├─ PLAN — no keys sent. --mode apply would:"
    echo "   │  ├─ Escape  — decline THIS write, and the clone's TURN ENDS on it"
    echo "   │  ├─ BTab    — cycle the permission mode back to accept edits, then verify by re-read"
    echo "   │  └─ nudge   — resume the clone, because the Escape parked it"
    echo "   └─ run: rhx git.crew.heal --tree $tree --who $who --what mode --mode apply"
    return 0
  fi

  # 1 — clear the modal. Escape declines this one write; it never grants
  duct.send --on "$uri" --keys Escape --anyway >/dev/null 2>&1 || true
  sleep 1
  raw="$(duct.read --on "$uri" --lines 60 --raw 2>/dev/null)"
  if [[ -n "$(__duct_pane_mode_lost "$raw" || true)" ]]; then
    echo "   └─ 💥 the modal did not clear on Escape — read it and decide by hand" >&2
    return 5
  fi
  echo "   ├─ ✅ modal cleared — this write was declined, never granted"

  # 2 — cycle the mode at the quiet box, and VERIFY. the cycle is short, so a
  #     bounded retry is honest where an open-loop send is a false report
  local i=0 plain="" box=""
  while (( i < 3 )); do
    duct.send --on "$uri" --keys BTab --anyway >/dev/null 2>&1 || true
    sleep 1
    raw="$(duct.read --on "$uri" --lines 60 --raw 2>/dev/null)"
    plain="$(printf '%s' "$raw" | sed 's/\x1b\[[0-9;]*m//g')"
    if printf '%s' "$plain" | grep -qa 'accept edits on'; then
      echo "   ├─ ✅ acceptEdits restored — the clone writes without a modal from here"

      # 3 — RESUME. the Escape ENDED the turn, so the mode alone leaves a parked
      #     clone, and the poll then names it NOWHERE — the 🎛️ row clears and the
      #     crew reads `at work`
      #     (define.invariant.crew.revive-is-incomplete-without-a-nudge).
      #
      #     ⚠️ the box is EMPTY and QUIET right here, and we know that by re-read
      #        rather than by assumption — the safest moment a send ever gets.
      #        the text carries ONE fact and no instruction about the work
      #        (rule.forbid.steer-a-clone-beyond-a-permission-key).
      duct.send --on "$uri" \
        --what 'your last file write was declined by a MODE CURE, never by a human. acceptEdits had dropped off this clone, so every write drew a modal; it is restored now. retry that write as it was and carry on.' \
        --anyway >/dev/null 2>&1 || true
      sleep 1

      # .why VERIFY rather than trust: a --what send exits 0 on DELIVERY, so the
      #   only proof it took is that the BOX no longer holds it. read 6 lines —
      #   the box region alone — because a SUBMITTED message echoes into the
      #   transcript far above, and a wider read would match its own echo and
      #   report a park that never happened
      #   (rule.require.verify-after-send: compare, never confirm).
      box="$(duct.read --on "$uri" --lines 6 2>/dev/null || true)"
      if [[ "$box" == *'MODE CURE'* || "$box" == *'Pasted text'* ]]; then
        sleep 2
        duct.send --on "$uri" --keys Enter --anyway >/dev/null 2>&1 || true
        sleep 1
        box="$(duct.read --on "$uri" --lines 6 2>/dev/null || true)"
      fi
      if [[ "$box" == *'MODE CURE'* || "$box" == *'Pasted text'* ]]; then
        echo "   └─ ⚠️ mode restored, but the nudge PARKED in the box — submit it by hand:" >&2
        echo "      rhx git.crew.send --tree $tree --who $who --keys Enter" >&2
        return 7
      fi
      echo "   └─ ✅ nudged — the Escape ended its turn, so the cure resumes it"
      return 0
    fi
    i=$((i + 1))
  done

  echo "   └─ 💥 the mode would not take after 3 cycles — read the pane and set it by hand" >&2
  return 6
}

__crew_heal_wedge_one() {
  local tree="$1" grove="$2" who="$3" lines="$4" confirm="${5:-0}"

  local host
  host=$(__crew_grove_host "$grove") || { echo "💥 $tree/$who: unresolvable grove '$grove'" >&2; return 1; }
  local uri
  uri="$(__crew_duct_uri "$host" "$tree" "$who")"

  local raw1
  raw1="$(duct.read --on "$uri" --lines "$lines" --raw 2>/dev/null)"
  [[ -z "$raw1" ]] && return 2
  local p1
  p1="$(printf '%s' "$raw1" | sed 's/\x1b\[[0-9;]*m//g')"

  # ALIVE gate: a wedge holds a live claude box. no ❯ box → a husk or a plain
  # shell, which is heal --what work's axis, never a wedge.
  #
  # 🔴 .the caret must be ANCHORED — the FOURTH site of one root cause, and the
  #   comment directly above already states it: "no ❯ box → a husk". a crashed
  #   pane KEEPS the whole UI claude drew before it died, caret included, so a
  #   bare grep reads a corpse as alive (see __duct_pane_has_returned_shell).
  #
  # ⚠️ .and this arm is NOT protected by the gates below it. the next gate asks
  #   __crew_turn_stats for a live work-frame — but a pane frozen mid-turn keeps
  #   its spinner line, duration and token count intact on screen forever, which
  #   is the exact shape that gate reads as "alive, mid-work". the frame then
  #   holds byte-identical across both reads BECAUSE the program is dead, so
  #   every gate past this one CONFIRMS the wedge rather than refutes it.
  #
  # 🔴 .measured 2026-09-20 on infrastructure.beav.feat-camp-git-backup-bucket:
  #   a V8 heap-OOM corpse graded `🧊 SUSPECTED WEDGE`, then `CONFIRMED WEDGE`
  #   through the Escape probe, with `crew.reboot` recommended — a live-clone
  #   cure aimed at a program that had already exited. a wedge verdict on a
  #   husk is the split define.invariant.crew.husk.discriminator-parity forbids.
  { printf '%s' "$p1" | grep -q '❯' && ! __duct_pane_has_returned_shell "$p1"; } || return 6

  # PLEA gate: a live modal is a decision, not a fault. exclude it up front —
  # a reboot on a plea kills a clone that only needed a keystroke. the four
  # modal shapes, and why each arm is shaped as it is, live with the helper.
  if __crew_pane_has_plea "$p1"; then
    return 3
  fi

  # the active-work frame: a LIVE turn drives an elapsed/token line while claude
  # works. absent it, the clone is at REST (idle at its box) — never a wedge.
  #
  # 🔴 .why this asks __crew_turn_stats rather than a duration regex
  #   it was `([0-9]+m[[:space:]]+[0-9]+s|↓[[:space:]]*[0-9].*token)` until
  #   2026-09-16 — a bare `<n>m <n>s` anywhere in the pane. an ENDED turn draws
  #   its own duration in that exact shape:
  #
  #       ✻ Sautéed for 6m 20s        ← the turn is OVER
  #       ✻ Blanching… (6m 20s · ↓ 8.0k tokens)   ← the turn is LIVE
  #
  #   so a clone idle at an empty box, with an ended-turn line still on screen,
  #   passed the mid-work gate and was graded a SUSPECTED WEDGE. measured on
  #   rhachet-roles-bhuild.beav.feat-behavior-route-upgrades, which was neither
  #   at work nor wedged — it was halted, and owed a human two gates.
  #
  # ⇒ the parenthesized `· ↓/↑ <n> tokens` anchor is what parts the two, and
  #   __crew_turn_stats already carries it — clamped both ways at [case31].
  __crew_turn_stats "$p1" >/dev/null || return 4

  # a second read, a repaint between — the repaint proves the VIEW is intact,
  # so a static frame is the program's silence, not a mangled pane.
  duct.refresh --on "$uri" >/dev/null 2>&1 || true
  sleep 2
  local raw2
  raw2="$(duct.read --on "$uri" --lines "$lines" --raw 2>/dev/null)"
  local p2
  p2="$(printf '%s' "$raw2" | sed 's/\x1b\[[0-9;]*m//g')"

  # strip the clock/token line from both, then compare the CONTENT. content that
  # moves = the program advanced = healthy. content held byte-identical beneath a
  # present work-frame = the candidate this axis exists to name.
  local c1 c2
  c1="$(printf '%s\n' "$p1" | grep -avE "$wl")"
  c2="$(printf '%s\n' "$p2" | grep -avE "$wl")"
  [[ "$c1" != "$c2" ]] && return 5

  echo "🧊 $tree/$who: SUSPECTED WEDGE — alive, mid-work, and the frame held byte-identical across 2 reads (view repainted)"
  echo "   ├─ a wedge is ALIVE and does not ANSWER; a slow tool/API await reads the same from outside, so CONFIRM before you cure"

  # 🔴 .the CONFIRM probe — entooled 2026-09-20. the rc 4 arm below is the
  #   precedent, verbatim from its own note: it "used to dead-end on 'heal has
  #   NO cure for idle'", was corrected because it "would re-nominate it
  #   forever", and the human's verdict was "heal exclusively via tool".
  #
  #   🔴 THIS arm carried the identical dead-end, one rc over. it detected, then
  #   printed a THREE-STEP byhand cycle — send Escape → re-read → compare →
  #   reboot — and returned. so `--healable` counted `1 to heal` and heal
  #   delivered 0 cures, which is a false promise by the poll and a job the
  #   caller finishes by hand (rule.always.entool-the-skills-you-touch).
  #
  #   measured on infrastructure.beav.feat-camp-git-backup-bucket, on two
  #   consecutive babysit ticks: 73m, then 85m, with a byte-identical hand-back
  #   both times and no progress in between. that loop is exactly
  #   rule.forbid.remedies-that-mimic-the-defect — detect, hand back, detect.
  #
  # ⚠️ what it folds is the PROBE, and ONLY the probe. the reboot stays the
  #   caller's act on purpose (rule.forbid.bind-a-costly-act-to-a-cheap-one):
  #   an Escape is cheap and reversible — it ends a turn a wedged clone does
  #   not advance anyway — while a reboot ENDS A CONVERSATION and cannot be
  #   undone, which this file already grades a footgun at the --all note below.
  #   to ride both on one flag would sell the costly act on the cheap one's
  #   safety. this is the seam `crew.modal` draws: it derives and sends the
  #   key, and never picks approve-vs-decline.
  if [[ "$confirm" != "1" ]]; then
    echo "   └─ confirm it — a probe key mutates a live crew, so it is NOT sent unasked:"
    echo "        rhx git.crew.heal --tree $tree --who $who --what wedge --mode apply --confirm"
    echo "        by hand: rhx git.crew.send --tree $tree --who $who --keys Escape ; then re-read"
    echo "        a frame still identical = wedge → cure: rhx git.crew.reboot --tree $tree --who $who"
    return 0
  fi

  echo "   ├─ 🔧 --confirm: probe with Escape, then re-read"
  if ! duct.send --on "$uri" --keys Escape --anyway >/dev/null 2>&1; then
    echo "   └─ ✋ the probe send failed — the duct may have dropped. verdict UNCHANGED: still suspected" >&2
    return 8
  fi
  duct.refresh --on "$uri" >/dev/null 2>&1 || true
  sleep 2
  local raw3 p3 c3
  raw3="$(duct.read --on "$uri" --lines "$lines" --raw 2>/dev/null)"
  p3="$(printf '%s' "$raw3" | sed 's/\x1b\[[0-9;]*m//g')"
  c3="$(printf '%s\n' "$p3" | grep -avE "$wl")"

  # the probe's whole job is to part a WEDGE from a slow await. an await that
  # was merely slow ANSWERS an Escape — its frame moves. a wedge does not.
  if [[ "$c3" != "$c2" ]]; then
    echo "   └─ ✅ REFUTED — the frame moved under the probe. that was a slow await, never a wedge; leave it be"
    return 10
  fi

  echo "   └─ 🧊 CONFIRMED WEDGE — the frame held through a probe key as well"
  echo "      ├─ ⚠️ the cure ENDS THIS CONVERSATION and cannot be undone, so it stays YOURS:"
  echo "      └─ rhx git.crew.reboot --tree $tree --who $who"
  return 9
}

# .what = append every slug this tree's window REGISTRY holds to a role array,
#         skipping any the array already carries
#
# .why  = the roster names what a crew should hold. a defect can sit on a slug
#         it does not name — a decommissioned seat, a hand-opened tab, a slug a
#         later release renamed. the union is the real subject set.
#
# ⚠️ nameref, so the caller's array is extended in place. bash 4.3+.
__crew_heal_who_add_registry_slugs() {
  local -n __dst="$1"
  local tree="$2" grove="$3"
  local host tmux_name term_slug pid slug seen

  host=$(__crew_grove_host "$grove") || return 0
  tmux_name="$(__crew_tmux_name "$tree")"
  term_slug="$tmux_name"
  [[ -n "$host" ]] && term_slug="$host:$tmux_name"

  pid=$(__term_find_by_duct "$term_slug") || return 0
  [[ -n "$pid" ]] || return 0

  while IFS= read -r slug; do
    [[ -n "$slug" ]] || continue
    seen=""
    local r
    for r in "${__dst[@]}"; do [[ "$r" == "$slug" ]] && { seen=1; break; }; done
    [[ -n "$seen" ]] || __dst+=("$slug")
  done < <(__term_list_tab_slugs "$pid" 2>/dev/null)
}

# .what = nudge a rate-limit-wedged clone to retry its failed turn — the CURE
#         for a transient-429 wedge, and the ONLY cure this repo permits for it.
#
# .why a NUDGE, never a reboot: the wedge is a LIVE conversation (its ❯ box is
#      drawn) whose one turn failed on a transient 429. the 429 clears on its
#      own, so a single retry recovers the whole turn at the cost of one message.
#      a reboot would BURN the live conversation
#      (rule.forbid.byhand-fix-that-burns-the-live-proof).
#
# .why through the TOOL, never by hand: a byhand crew.send nudge is unauditable,
#      leans on the supervisor's in-the-moment words, and is the exact recurrence
#      rule.forbid.byhand-heal forbids. one cure, one home — so heal OWNS the
#      nudge and a supervisor never types it.
#
# ⚠️ the send carries --anyway: the wedged pane holds a LIVE claude box, so a
#    plain keystroke hits the busy-guard and is silently dropped. --anyway sends
#    into a busy pane on purpose (same as the picker-drive fallback in revive).
__crew_heal_nudge() {
  local tree="$1" grove="$2" who="$3" uri="$4" mode="$5"
  # $6 = the reason clause, so the nudge reads honestly for the wedge it cures —
  # a bare 429 by default, a stale usage cap when the caller passes one. both
  # heal identically (retry the failed turn), so only the lead clause differs.
  local reason="${6:-a transient API rate limit (429) failed your last turn — it has cleared.}"
  if [[ "$mode" != "apply" ]]; then
    echo "   └─ plan: would NUDGE to retry the failed turn (never reboot) — rerun with --mode apply"
    return 0
  fi
  local nudge="$reason retry the turn that failed and continue to drive your route autonomously."
  # 🔴 the failure report rides STDOUT, and the send's own diagnosis rides with
  #    it — corrected 2026-09-18, and both halves were measured the same tick.
  #
  #    this line used to read `duct.send … >/dev/null 2>&1` with a `💥` on
  #    STDERR. so a nudge that never landed produced, to its caller:
  #      · no stdout line at all
  #      · a stderr line that rhachet drops on an exit-0 run
  #      · exit 0
  #    ⇒ heal announced "cures it with a nudge", cured naught, and reported a
  #      clean run. that is rule.forbid.failhide, and it is worse here than
  #      elsewhere because the ROW ABOVE already promised the cure.
  #
  #    measured: a parked clone on a GROVE took four consecutive applies, each
  #    byte-identical to its own plan, before a pane read caught that no nudge
  #    had ever arrived (rule.require.verify-after-send). the send failed every
  #    time on a malformed uri, and the uri was in the swallowed stream.
  #
  # ⚠️ .why stdout rather than stderr, against the usual split: this verb's
  #    per-row verdicts ARE stdout — `🌊 nudged` is stdout, and so is every
  #    axis verdict in the caller's `case`. a verdict split across two channels
  #    is the defect above; one channel is what makes success and failure
  #    comparable at a glance.
  local __send_out=""
  if ! __send_out=$(duct.send --on "$uri" --anyway --what "$nudge" 2>&1); then
    echo "   └─ 💥 nudge send FAILED — the clone is STILL parked, and heal cured naught"
    echo "      ├─ uri: $uri"
    echo "      └─ why: $(printf '%s' "$__send_out" | tail -n 3 | tr '\n' ' ')"
    return 1
  fi
  echo "   └─ 🌊 nudged to retry — verify it resumed: rhx git.crew.read --tree $tree --who $who"
  return 0
}

# .what = the HALT's cure — re-submit the text that is parked in an orphaned
#         queued row, so the clone consumes the message it was already given.
#
# 🔴 .why it is a RELAY and never an authorship, and why that matters here more
#    than anywhere else in this file
#    every other cure in heal sends words the TOOL wrote — a nudge composes its
#    own sentence, a revive composes `continue`. this one must not. the payload
#    is a HUMAN's, already typed and already submitted once, and heal's whole
#    job is to make it arrive. so the text rides in from the caller, read off
#    the pane verbatim, and this verb adds not one word to it.
#    ⇒ that is what keeps it inside the closed channel a supervisor may use: it
#      relays a gate a human just granted, which is the one send permitted
#      beside a permission key (rule.forbid.steer-a-clone-beyond-a-permission-key).
#
# 🔴 .why an Enter alone is NOT the cure, though it looks like the obvious one
#    an orphaned queue does not await a keystroke — it awaits a turn boundary
#    that will never come. measured 2026-09-16: an Enter into the box beneath
#    the parked row opened a FRESH empty turn and left the highlight exactly
#    where it was. the queued row is inert; only its text moves.
#
# ⚠️ .the caller owns the JOIN, this verb owns the SEND
#    it does not re-read the pane and it asserts no precondition. the arm that
#    calls it has already proven turn-ended AND queued, which is the pair that
#    makes the relay correct. a bare call on a live turn would double a human's
#    message, so do not reach for this verb outside that join.
__crew_heal_drain() {
  local tree="$1" grove="$2" who="$3" uri="$4" mode="$5" text="$6"
  if [[ -z "$text" ]]; then
    echo "   └─ 💥 no queued text to relay — the halt stands" >&2
    return 1
  fi
  if [[ "$mode" != "apply" ]]; then
    echo "   └─ plan: would RELAY the parked message verbatim (never a word of its own) — rerun with --mode apply"
    return 0
  fi
  # --anyway because a live claude holds the pane; the Enter goes as its own
  # keystroke because a multi-line payload arrives as a paste and swallows the
  # newline that would have followed it (the --submit contract, one layer up in
  # git.crew.send).
  if ! duct.send --on "$uri" --anyway --what "$text" >/dev/null 2>&1; then
    echo "   └─ 💥 relay send failed — the halt stands" >&2
    return 1
  fi
  if ! duct.send --on "$uri" --anyway --keys Enter >/dev/null 2>&1; then
    echo "   └─ 💥 relay submit failed — the text sits UNSENT in the box" >&2
    return 1
  fi
  echo "   └─ 🌊 relayed the parked message — verify it moved: rhx git.crew.read --tree $tree --who $who"
  return 0
}

# .what = the VIEW axis: every live seat in an OPEN crew window has a tab, and
#         every such tab can be vouched for. two defects, one cure —
#           ABSENT    no tab holds the seat            -> open one
#           UNSOUND   a tab holds it and lies about it -> replace it
#
# .why  = 🔴 a crew has two axes (term=crew), and crew.heal read only ONE of
#         them for the whole of its life. it hunted a husk — a defect on the
#         WORK axis — and could not see a seat that is perfectly healthy at
#         work and unreachable by a human.
#
#         that gap is not theoretical. `crew.boot` opens NO tab, on purpose,
#         so EVERY freshly booted seat starts in exactly this state. a fleet
#         sweep that boots 18 reviewers hands back 18 ducts a human cannot
#         open, and both instruments agree the fleet is well:
#
#           crew.poll   reads the work axis  -> 😶 at work
#           term.audit  reads localhost ONLY -> a grove crew is out of scope
#
#         ⇒ so the one verb named for crew HEALTH must carry it. measured
#           2026-09-13: a human found 17 tabless seats before any tool did,
#           and the supervisor opened tabs BY HAND — twice
#           (rule.always.fix-the-verb-that-left-you-the-gap).
#
# .note = the cure is `crew.show --roles <role>`, which is per-role by
#         construction and "reopens no tab they closed on purpose". so this
#         adds the one absent seat and never rebuilds a human's window.
#
# returns: 0 = a defect found (acted, in apply) · 3 = whole, no move
#          2 = the duct itself is down (crew.boot's business, never this)
__crew_heal_tab() {
  local tree="$1" grove="$2" role="$3" mode="$4"

  local host
  host=$(__crew_grove_host "$grove") || return 1

  # 🔴 TWO hosts, and they differ for exactly one seat. the reviewer is
  #    LOCAL-only (CREWWORK_ROLES_LOCAL), so its DUCT is on this box while its
  #    crew's WINDOW is keyed to the grove:
  #      duct_host  — where the clone actually runs   (__crew_role_host)
  #      host       — where the crew's window is keyed (the grove)
  #    a check that uses `host` for both looks on the grove for a duct that was
  #    never there and reports `💀 down` about a live seat — which is the very
  #    false-report this function exists to catch, committed by this function.
  local duct_host
  duct_host="$(__crew_role_host "$host" "$role")"

  local tmux_name term_slug
  tmux_name="$(__crew_tmux_name "$tree")"
  term_slug="$tmux_name"
  [[ -n "$host" ]] && term_slug="$host:$tmux_name"

  local pid slugs
  pid=$(__term_find_by_duct "$term_slug")

  # the WORK half must be live for a tab to be OPENED — a tab onto a dead duct
  # is a window onto an empty room, and `💀 down` is crew.boot's verdict to
  # render (rule.require.errors-name-the-fix: one cause, one fix).
  if ! __crew_duct_has_role "$tree" "$role" "$duct_host"; then
    # 🔴 but a PHANTOM ROW is this verb's business even so, and it was a dead
    #    end before this clause: the gate flags a row kitty will not answer for,
    #    names this heal as the cure, and the heal returned `💀 down` untouched
    #    — so the crew could never be vouched for, by any command, ever.
    #
    #    a row whose window is gone AND whose duct is down is a claim about
    #    naught. to drop it opens no tab and closes no tab; it merely stops the
    #    registry from a claim of a view that does not exist. that is the whole
    #    repair, and it is the one the decommissioned bare `reviewer` seats need
    #    — they will never boot again, so a relaunch is not the cure.
    #
    # ⚠️ BOTH halves must be broken. a live tab whose duct merely failed to
    #    answer keeps its row; only the pair settles it.
    if [[ -n "$pid" ]]; then
      local dsock ddefect
      dsock=$(__term_get_socket "$pid")
      if [[ -n "$dsock" ]] \
         && printf '%s\n' "$(__term_list_tab_slugs "$pid" 2>/dev/null)" | grep -qx -- "$role" \
         && ! ddefect="$(__crew_tab_defect "$pid" "$dsock" "$term_slug" "$host" "$role")"; then
        echo "🪦 $tree/$role: a row claims a tab, and BOTH the window and the duct are gone"
        printf '%s\n' "$ddefect"
        if [[ "$mode" != "apply" ]]; then
          echo "   └─ plan: would drop the row — rerun with --mode apply"
          return 0
        fi
        if ! __term_unregister_tab "$pid" "$role"; then
          echo "   └─ 💥 could not drop the phantom row" >&2
          return 1
        fi
        echo "   └─ ✨ row dropped — the registry no longer claims a view it lacks"
        return 0
      fi
    fi
    return 2
  fi

  # 🔴 ALL OR NAUGHT. the defect is a PARTIALLY visible crew, never an
  #    invisible one.
  #
  #    no window at all = a crew a human has not opened, and that is the
  #    EXPECTED state most of the fleet sits in — most crews are watched by
  #    nobody, most of the time. to open a window unasked decides for the
  #    human, and it is the loud, wrong, hundred-tab read of "a live duct
  #    with no tab".
  #
  #    a window that EXISTS states the human's intent plainly: they watch this
  #    crew. so a live seat absent from that window is the gap — they asked to
  #    see the crew and were shown part of it.
  [[ -n "$pid" ]] || return 3

  slugs=$(__term_list_tab_slugs "$pid" 2>/dev/null) || slugs=""
  if printf '%s\n' "$slugs" | grep -qx -- "$role"; then
    # 🔴 a ROW is not a TAB. for this verb's whole life the presence of a
    #    registry row read as "whole" — so a tab crossed onto another tree, or
    #    one kitty will no longer answer for, was reported healthy by the only
    #    verb named for crew health. and `crew.show`'s post-audit prints THIS
    #    command as the cure, so the paved path led to a verb that refused to
    #    act (rule.always.vouch-for-what-you-just-wrote, clause 1).
    #
    # ⇒ so ask the TAB, through the one check the reporter and the gate share.
    local socket defect
    socket=$(__term_get_socket "$pid")
    if [[ -z "$socket" ]]; then
      return 3   # no socket to ask — term.stop's business, never this one's
    fi
    if defect="$(__crew_tab_defect "$pid" "$socket" "$term_slug" "$host" "$role")"; then
      return 3   # the tab itself vouches for the seat — whole
    fi

    echo "🩹 $tree/$role: a tab holds this seat, and it cannot be vouched for"
    printf '%s\n' "$defect"
    if [[ "$mode" != "apply" ]]; then
      echo "   └─ plan: would close it and reopen — rerun with --mode apply"
      return 0
    fi

    # the attach is baked in at LAUNCH, so an unsound tab is REPLACED rather
    # than re-pointed — the same move term.open's host findsert makes. a close
    # that fails means the window was already gone, which is the state we want;
    # only the ROW write is fatal, since a stale row re-adopts the wrong window.
    local match
    if match=$(__term_tab_match "$pid" "$role" 2>/dev/null); then
      __term_close_window_matched "$socket" "$match" || true
    fi
    if ! __term_unregister_tab "$pid" "$role"; then
      echo "   └─ 💥 could not drop the unsound row — the tab is untouched" >&2
      return 1
    fi
    if ! crew.show --tree "$tree" --grove "$grove" --roles "$role" >/dev/null 2>&1; then
      echo "   └─ 💥 crew.show failed — the seat now has NO tab" >&2
      echo "      look: rhx git.crew.show --tree $tree --roles $role" >&2
      return 1
    fi
    echo "   └─ ✨ tab replaced — it watches this tree again"
    return 0
  fi

  echo "🫥 $tree/$role: the crew's window is OPEN and this LIVE seat has no tab"
  echo "   ├─ held: $(printf '%s' "$slugs" | tr '\n' ' ')"
  if [[ "$mode" != "apply" ]]; then
    echo "   └─ plan: would crew.show --roles $role — rerun with --mode apply"
    return 0
  fi

  if ! crew.show --tree "$tree" --grove "$grove" --roles "$role" >/dev/null 2>&1; then
    echo "   └─ 💥 crew.show failed — the duct is untouched" >&2
    echo "      look: rhx git.crew.show --tree $tree --roles $role" >&2
    return 1
  fi
  echo "   └─ ✨ tab opened — the seat is reachable"
  return 0
}

# .what = the SEAT axis: a local seat carries the one verb it exists to use
#
# .why  = `__crew_provision_seat` defines `git.tree.sync` at BOOT, so every seat
#         booted before that provision existed has a shell that never heard of
#         it — and a boot is not re-run to pick up a new provision.
#
#         🔴 that gap does not announce itself. `crew.poll` grades work,
#         `crew.heal --what view` grades tabs, and NEITHER can see that the
#         seat's shell is short a function. the human finds out by typing the
#         verb and getting a `command not found` — or, before the rename,
#         by typing `sync` and getting a silent coreutils flush.
#
# ⚠️ .no probe, on purpose. to ASK a pane whether a function is defined costs a
#    send, a read, and a parse of lossy pane text. to DEFINE it costs one send
#    and is idempotent — a function defined twice is the same function. so this
#    verb re-provisions rather than detects, and its count reports seats
#    provisioned rather than defects found (rule.forbid.failhide: it must never
#    report a defect count it did not measure).
#
# returns: 0 acted · 1 refused/unavailable · 2 duct down · 3 naught owed
__crew_heal_seat() {
  local tree="$1" grove="$2" role="$3" mode="$4"

  # only a LOCAL seat is owed one. every other role cwd's into the crew's own
  # tree, where the `rhx` on PATH already resolves this repo's skills.
  __crew_role_is_local "$role" || return 3

  local host duct_host
  host=$(__crew_grove_host "$grove") || return 1
  duct_host="$(__crew_role_host "$host" "$role")"
  __crew_duct_has_role "$tree" "$role" "$duct_host" || return 2

  local skill
  skill="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/git.tree.sync.sh"
  [[ -f "$skill" ]] || return 1

  local shim="${CREWWORK_SEAT_BIN:-$HOME/.local/bin}/git.tree.sync"

  # 🟢 the check is a FILE, not a probe of a pane. that is the whole win of the
  #    install rewrite: the seat's capacity is now a fact on disk rather than a
  #    guess about one process's memory, so this axis can REPORT rather than
  #    re-send-and-hope (the old note "no probe, on purpose" described a cost
  #    the install removed).
  if [[ -x "$shim" ]]; then
    return 3
  fi

  echo "🪑 $tree/$role: a local seat — it is owed \`git.tree.sync\`"
  if [[ "$mode" != "apply" ]]; then
    echo "   └─ plan: would install $shim — rerun with --mode apply"
    return 0
  fi

  # ⚠️ NO duct.send. a busy pane cannot refuse a file write, and a shell restart
  #    cannot lose one — which is why the seat axis no longer touches the duct
  #    at all. $uri and $skill are unused here on purpose.
  if ! __crew_install_seat_verb; then
    echo "   └─ 💥 could not install $shim — check the dir is writable"
    return 1
  fi
  echo "   └─ ✨ git.tree.sync installed at $shim — on PATH for every shell, forever"
  return 0
}

crew.heal() {
  local tree="" grove="" who="" mode="plan" lines=60 what="all" confirm=0

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --tree) tree="$2"; shift 2 ;;
      --grove) grove="$2"; shift 2 ;;
      --who) who="$2"; shift 2 ;;
      --what) what="$2"; shift 2 ;;
      --mode) mode="$2"; shift 2 ;;
      --lines) lines="$2"; shift 2 ;;
      --confirm) confirm=1; shift ;;
      --help|-h) awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "${BASH_SOURCE[0]}"; return 0 ;;
      *) echo "✋ crew.heal: unknown arg '$1'" >&2; return 2 ;;
    esac
  done

  if [[ "$mode" != "plan" && "$mode" != "apply" ]]; then
    echo "✋ crew.heal: --mode must be plan or apply, got '$mode'" >&2
    return 2
  fi

  # 🔴 --what exists because the axes carry VERY different costs, and a single
  #    --mode apply over all of them is a footgun (rule.require.safe-by-default):
  #      work — reboots a husk and restarts claude. it ends a conversation
  #      view — opens a kitty tab. free and reversible (term=crew)
  #      seat — defines git.tree.sync in a local seat's shell. free and idempotent
  #    a human who wants every partial crew made whole must not have to reboot
  #    a clone to get it.
  case "$what" in
    all|work|view|seat|wedge|mode) : ;;
    *) echo "✋ crew.heal: --what must be all, work, view, seat, wedge, or mode — got '$what'" >&2
       echo "   ├─ work  — husks: reboot + resume claude (ends a conversation)" >&2
       echo "   ├─ view  — partial crews: open the absent tab (free, reversible)" >&2
       echo "   ├─ seat  — local seats: define git.tree.sync in the shell (free, idempotent)" >&2
       echo "   ├─ wedge — SURFACE suspected wedges (alive, mid-work, frame held); --confirm probes one" >&2
       echo "   └─ mode  — restore --permission-mode acceptEdits on a clone that lost it" >&2
       return 2 ;;
  esac

  # 🔴 --confirm is bound to ONE axis and ONE mode, and refuses anywhere else.
  #   it SENDS A KEY into a live pane, so it must never ride a `--what all`
  #   sweep, and it must never fire from a plan read — a plan that mutates is
  #   the defect `rule.require.safe-by-default` exists to stop.
  #   ⚠️ the refusal names the fix rather than merely rejecting
  #   (rule.require.errors-name-the-fix).
  if [[ "$confirm" == "1" ]]; then
    if [[ "$what" != "wedge" ]]; then
      echo "✋ crew.heal: --confirm is the WEDGE axis's probe, and --what is '$what'" >&2
      echo "   └─ name the axis: rhx git.crew.heal --tree <t> --who <role> --what wedge --mode apply --confirm" >&2
      return 2
    fi
    if [[ "$mode" != "apply" ]]; then
      echo "✋ crew.heal: --confirm SENDS a probe key, so it cannot ride --mode plan" >&2
      echo "   └─ say so out loud: rhx git.crew.heal --tree <t> --who <role> --what wedge --mode apply --confirm" >&2
      return 2
    fi
    if [[ -z "$who" ]]; then
      echo "✋ crew.heal: --confirm probes ONE clone, so --who is required" >&2
      echo "   └─ a roster sweep would send a key to every seat on the tree — name the one:" >&2
      echo "      rhx git.crew.heal --tree <t> --who mechanic --what wedge --mode apply --confirm" >&2
      return 2
    fi
  fi

  # 🔴 wedge is opt-in ONLY — it is NOT part of `all`. each candidate costs a
  #    second read plus a `sleep 2`, so a fleet sweep under `all` would stall on
  #    every busy clone. name it deliberately: `--what wedge`.

  # 🔴 --all was ripped out (2026-09-13). a fleet-wide `--mode apply` over the
  #    WORK axis reboots every husk it finds in one blind pass, and a reboot
  #    ends a conversation — so a single mis-detection burns live work with no
  #    per-crew trace of what it touched. the fleet's defect set now comes from
  #    `git.crew.poll` (which SURFACES husks + wedges per crew); heal is aimed
  #    at ONE tree at a time, so every cure is observable and reversible-by-choice
  #    (rule.require.safe-by-default; the human: "targetted heals... so we can
  #    see wtf it does per poll detected defect").
  if [[ -z "$tree" ]]; then
    echo "✋ crew.heal: --tree required — heal is targeted, one tree at a time" >&2
    echo "   └─ find the defect set with \`rhx git.crew.poll --live\`, then heal each --tree" >&2
    return 2
  fi

  if [[ "$who" == "all" ]]; then
    echo "✋ crew.heal: --who all is refused — same reason as crew.reboot" >&2
    echo "   └─ the roles are never husked at once; name the role, or omit --who to sweep this tree's roster" >&2
    return 2
  fi

  echo "🦫 chew on it"
  echo ""
  echo "🪵 crew.heal --mode $mode"

  # ⚠️ a tree the LEDGER does not name falls back to `local`, and that fallback
  #    is SILENT. a heal aimed at a box that holds no such crew prints three
  #    true lines and exits 0 — `rule.forbid.failhide` exactly:
  #
  #      ⏳ <t>/mechanic: unread (no capture) — skipped, not a verdict
  #      💀 <t>/mechanic: no live duct — a tab needs work to look at
  #      🪑 <t>/mechanic: not a local seat — its cwd already resolves this repo's rhx
  #      EXIT=0
  #
  #    ⇒ measured SEVEN consecutive ticks, 2026-09-14 → 2026-09-15, byte-identical
  #      each time, on the phantom tree `main`. a supervisor under the tick
  #      contract ("run each emitted line verbatim") reads that 0 as a clean run.
  #
  # 🔴 .and the two verbs DISAGREE about one subject. `crew.read` says
  #    `🌐 no ledger row for '<t>' — falls back to local`; heal says naught. one
  #    of the two is wrong, and the silent one is the one an automation believes.
  #
  # ⚠️ .a naive REFUSAL here is NOT the cure, measured 2026-09-15: a `return 2`
  #    under this branch reddened SIXTEEN hermetic heal tests, each of which
  #    boots a real local session for a fixture tree the harness never writes a
  #    ledger row for. so `local` is a legitimate resolution for a rowless tree
  #    whose session is genuinely local — the defect is the SILENCE, never the
  #    fallback.
  #
  # ✅ .and that is SETTLED, not merely asserted: `crew.ledger --backfill` seeds
  #    rows from live tmux ∪ duct registry, states "the ledger begins empty",
  #    and resolves every recovered tree to `local` itself. so a rowless tree
  #    with a live local session is an acknowledged PRODUCTION state, and the
  #    fixtures model it correctly (they are NOT the defect).
  #
  # 🔴 .THE CURE IS IN TWO HALVES, and they are independent on purpose:
  #      1. the LINE is unconditional — heal now says what its five peers say,
  #         so the silence is over for every rowless tree, reachable or not
  #      2. the REFUSAL keys on REACHED-NAUGHT, never on rowless — see the
  #         `reached` tally in the axis loop and the gate at the end of this
  #         function. that is what parts the legitimate fallback from the
  #         failhide, and it is why the sixteen fixtures stay green
  #    ⇒ clamped by crewwork.heal.integration.test.ts [case28]; t1 is the arm that
  #      goes red if the refusal ever drifts back onto `rowless`.
  local rowless=""
  if [[ -z "$grove" ]]; then
    grove="$(__crew_ledger_grove_of "$tree")"
    if [[ -z "$grove" ]]; then
      grove="local"
      rowless=1
      # ⚠️ the SAME sentence crew.read (:1980) and crew.send (:3391) print,
      #    verbatim. one concept, one phrase (rule.require.ubiqlang) — a
      #    paraphrase here would read as a different fact to a human who
      #    sweeps two verbs in one tick.
      echo "🌐 no ledger row for '$tree' — falls back to local. ⚠️ THREE causes fit and this line parts none of them: the tree is GONE (felled after merge, or a mistyped name) · it lives on a grove and its row is absent · it is local and unlisted. ONE read settles which, and it is the read that just failed: rhx git.crew.ledger names every tree, cross-grove. absent there too = GONE, and no --grove and no --backfill will find it. listed on a grove = pass --grove cloud://<name>. live but unlisted = rhx git.crew.ledger --backfill" >&2
    fi
  fi

  # 🔴 an absent --who sweeps the ROSTER. it used to default to `mechanic`, and
  #    that default made the bare call UNABLE to do the very job it was asked for.
  #
  #    `crew.heal --tree <t> --what seat` is the obvious, correct-read
  #    invocation, and `mechanic` is a role __crew_heal_seat refuses BY
  #    CONSTRUCTION — the seat axis concerns local seats, and mechanic is never
  #    one. so the bare call graded exactly the one role that can never qualify,
  #    then printed `not a local seat`: a TRUE sentence about the wrong subject,
  #    which a reader takes for a clean bill (term=false-report, term=partial-audit).
  #
  #    measured 2026-09-13: a human in a reviewer.take seat typed
  #    `git.tree.sync` and got `command not found`. the heal that should have
  #    repaired it reported success over a subject set of one wrong role.
  #
  # ⚠️ the wider sweep is SAFE on the costly axis. __crew_heal_one acts on a HUSK
  #    only — a live claude returns 3 and is left untouched — so a roster sweep
  #    reboots the dead and never the alive. the `--all` path has swept the full
  #    roster the whole time; this closes an asymmetry, it adds no new cost.
  local -a heal_who=()
  if [[ -n "$who" ]]; then
    heal_who=("$who")
  else
    __crew_roles_into heal_who "$CREWWORK_ROLES_DEFAULT"
    # 🔴 the roster is what a crew SHOULD hold; the registry is what it DOES.
    #    a phantom row on a DECOMMISSIONED slug — the bare `reviewer`, split
    #    into .take/.give — sits outside the roster forever, so a roster-only
    #    sweep can never reach the one defect it was summoned to repair.
    #
    #    ⇒ measured 2026-09-13: two crews were flagged by the gate, named this
    #      heal as the cure, and the heal acted on neither. the slug at fault
    #      was `reviewer`, and no roster names it (rule: derive the subject set,
    #      never declare it).
    __crew_heal_who_add_registry_slugs heal_who "$tree" "$grove"
  fi

  # 🔴 the REACH tally — the half that makes heal's exit code refutable.
  #
  #    `probed`  = at least one axis that CAN reach a box actually ran
  #    `reached` = at least one of them found a duct or a pane to read
  #
  # .why the two are separate: `--what seat` runs no reaching axis at all, so
  #      without `probed` a seat-only heal on a rowless tree would refuse for
  #      lack of evidence it never went looking for.
  #
  # ⚠️ the SEAT axis is deliberately EXCLUDED from both. its rc 3 is
  #    overloaded — `__crew_role_is_local || return 3` fires BEFORE any box is
  #    touched (:3072), and `-x "$shim"` returns the same 3 AFTER a duct was
  #    found (:3091). so seat rc 3 cannot part a reach from an N/A, and to
  #    count it either way would be a guess dressed as a measurement. the
  #    measured defect's third line — `🪑 not a local seat` — is exactly that
  #    pre-reach rc 3, which is why it must never read as a reach.
  local probed="" reached=""

  local named=""; [[ -n "$who" ]] && named=1
  local w
  for w in "${heal_who[@]}"; do
    if [[ "$what" == "all" || "$what" == "work" ]]; then
      local rc=0
      __crew_heal_one "$tree" "$grove" "$w" "$mode" "$lines" || rc=$?
      probed=1
      # rc 1 is the ONE non-reach: an empty capture (`⏳ unread`, :2240) or an
      # unresolvable grove (:2233). every other code was rendered FROM a pane
      # it read, so it proves a box was there.
      [[ $rc -eq 1 ]] || reached=1
      case $rc in
        3) [[ -n "$named" ]] && echo "😶 $tree/$w: a live claude box is up — not a husk, absent any move to make" ;;
        4) [[ -n "$named" ]] && echo "🌙 $tree/$w: no claude box and no crash banner seen — likely a plain shell duct" ;;
      esac
    fi

    # the VIEW axis — independent of the verdict above (see __crew_heal_tab)
    if [[ "$what" == "all" || "$what" == "view" ]]; then
      local rct=0
      __crew_heal_tab "$tree" "$grove" "$w" "$mode" || rct=$?
      probed=1
      # rc 2 is `no live duct` (:2967) — the one non-reach on this axis
      [[ $rct -eq 2 ]] || reached=1
      case $rct in
        2) [[ -n "$named" ]] && echo "💀 $tree/$w: no live duct — a tab needs work to look at" ;;
        3) [[ -n "$named" ]] && echo "🖥️  $tree/$w: the view is whole — a tab holds this seat, or the crew has no window at all" ;;
      esac
    fi

    # the SEAT axis — likewise independent (see __crew_heal_seat)
    if [[ "$what" == "all" || "$what" == "seat" ]]; then
      local rcs=0
      __crew_heal_seat "$tree" "$grove" "$w" "$mode" || rcs=$?
      case $rcs in
        2) [[ -n "$named" ]] && echo "💀 $tree/$w: no live duct — a shell needs a process to hold it" ;;
        3) [[ -n "$named" ]] && echo "🪑 $tree/$w: not a local seat — its cwd already resolves this repo's rhx" ;;
      esac
    fi

    # the WEDGE axis — opt-in ONLY (never under `all`). the surfaced-wedge line
    # (rc 0) prints from inside the function; the no-wedge verdicts are
    # named-only, so a roster sweep is not buried under "not a wedge" rows.
    if [[ "$what" == "wedge" ]]; then
      local rcw=0
      __crew_heal_wedge_one "$tree" "$grove" "$w" "$lines" "$confirm" || rcw=$?
      probed=1
      # rc 2 is `no pane read — the duct is down or the capture came back
      # empty` — the one non-reach on this axis
      [[ $rcw -eq 2 ]] || reached=1
      case $rcw in
        2) [[ -n "$named" ]] && echo "😴 $tree/$w: no pane read — the duct is down or the capture came back empty" ;;
        3) [[ -n "$named" ]] && echo "🙋 $tree/$w: a live modal is up — that is a PLEA, cured by a key, never a reboot" ;;
        # 🔴 rc 4 is a PARKED clone, and heal owns its cure — corrected 2026-09-18
        #   this arm used to dead-end on "heal has NO cure for idle". but at this
        #   exact point the probe has already PROVEN the two facts a nudge needs:
        #   the box is LIVE, and no active-work frame runs. and the crew reached
        #   the wedge axis only by way of `frozen`, which requires crew_idle >=
        #   STALL_MINS. ⇒ live + idle + long-still = parked.
        #
        #   a parked clone's cure is a nudge — the same `__crew_heal_nudge` this
        #   file already spends on `limited`, and the third term of
        #   `define.invariant.crew.revive-is-incomplete-without-a-nudge`:
        #   reboot + resume + NUDGE. a revive that never said "go" lands here.
        #
        #   measured 2026-09-18: `feat-acceptance-under-5min` sat 200m while this
        #   line told the supervisor the tool had no cure and would re-nominate
        #   it forever. the human: "heal exclusively via tool".
        #
        # ⚠️ the nudge is bounded and it settles itself — one message into a live
        #   box, and the invariant's own counter-argument grants it: a clone with
        #   no work left "reports it has no work to do". authorized by
        #   rule.require.nudge-parked-clones, and it is NEVER a steer: heal sends
        #   it, not the supervisor
        #   (rule.forbid.steer-a-clone-beyond-a-permission-key).
        #
        # ⚠️ the REASON clause is the parked one, never the 429 default — a
        #   restored clone was never rate limited, and a nudge that says so is a
        #   false report in the one message the clone reads.
        #
        # ⇒ clamped at [case51] in work.surface.heal.integration.test.ts
        # ⚠️ the verdict stays on ONE line with its `$named` guard, because
        #   [case51] derives these arms from the shell with
        #   `/^\s*([2-6])\)(.*\$named.*)$/gm` — a multi-line arm is invisible to
        #   it, and an arm it cannot see is an arm it cannot grade. measured:
        #   the first draft of this cure split the arm and took five of that
        #   case's teeth red at once.
        #
        # 🔴 .the verdict is MODE-AWARE, and it was not — corrected 2026-09-19
        #   this line was unconditional while the apply block below it was
        #   gated. so `--mode apply` printed, verbatim:
        #
        #     😶 …: PARKED … heal cures it with a nudge: rhx git.crew.heal
        #        --tree … --what wedge --mode apply
        #        └─ 🌊 nudged to retry — verify it resumed: …
        #
        #   the remedy named on line 1 IS the invocation that printed it, and
        #   line 2 says it already ran. measured on a live tick: the clone
        #   `feat-review-cost-meter` resumed within the second, and the render
        #   still read as a move still owed.
        #
        # ⚠️ .the harm is a SECOND nudge. the babysit contract says "run each
        #   emitted heal line verbatim", and a supervisor who sweeps a render
        #   for `rhx git.crew.heal …` finds one HERE, in heal's own apply
        #   output. the clone has resumed by then, so the re-run is an Enter
        #   into a live box — the harm `term=duct.box.inflight` records.
        #
        # ⇒ so the remedy clause rides the PLAN branch, where it is a real next
        #   move, and the apply branch says what it did and refuses the re-run.
        #   the literal command stays in the line either way, which is what
        #   keeps [case51]'s next-move guarantee honest rather than defeated.
        4) [[ -n "$named" ]] && { local __atrest="😶 $tree/$w: at rest — a live box with no active-work frame is idle, not wedged. that is a PARKED clone, and heal cures it with a nudge"; if [[ "$mode" == "apply" ]]; then echo "$__atrest — SENT, see below. ⛔ do NOT re-run this verb on this row: the nudge already went, and a second one is an Enter into a box that has resumed"; else echo "$__atrest: rhx git.crew.heal --tree $tree --who $w --what wedge --mode apply"; fi; }
           if [[ "$mode" == "apply" ]]; then
             # 🔴 a HOST, never a GROVE — __crew_duct_uri takes the bare host and
             #   says so at :2158. the first draft of this cure passed `$grove`
             #   and built `duct://cloud://grove-…/<tree>/<role>`, a double
             #   scheme no duct answers. every one of the file's other eleven
             #   call sites resolves the host first; this is that same two-step.
             local __phost __puri
             if ! __phost=$(__crew_grove_host "$grove"); then
               echo "   └─ 💥 nudge NOT sent — no host derives from grove '$grove'. the clone is STILL parked"
             else
               __puri=$(__crew_duct_uri "$__phost" "$tree" "$w")
               __crew_heal_nudge "$tree" "$grove" "$w" "$__puri" "$mode" \
                 "your session is live but parked — it was restored, or its last turn ended, and no one told it to continue."
             fi
           fi
           ;;
        5) [[ -n "$named" ]] && echo "🌊 $tree/$w: the frame moved across two reads — the program advanced" ;;
        6) [[ -n "$named" ]] && echo "💀 $tree/$w: no live claude box — a husk or plain shell (that is heal --what work)" ;;
      esac
    fi

    # the MODE axis — opt-in ONLY, for the same reason wedge is: it sends keys
    # into a live pane, so it must never ride a fleet sweep under `all`.
    if [[ "$what" == "mode" ]]; then
      local rcm=0
      __crew_heal_mode "$tree" "$grove" "$w" "$mode" || rcm=$?
      probed=1
      [[ $rcm -eq 2 ]] || reached=1
      case $rcm in
        2) [[ -n "$named" ]] && echo "😴 $tree/$w: no pane read — the duct is down or the capture came back empty" ;;
        4) [[ -n "$named" ]] && echo "✅ $tree/$w: the mode is intact — no acceptEdits offer on this pane" ;;
      esac
    fi
  done

  # ⚠️ the no-op rows above are named-only on purpose. under a roster sweep a
  #    `not a local seat` row fires for every non-seat role, so the three rows
  #    that matter get buried under four that report naught happened.

  # 🔴 THE REFUTABLE EXIT — the measured failhide, closed.
  #
  #    rowless AND every reaching axis came back with naught = there was no
  #    crew to heal on ANY box heal could name, so a 0 here is the confident
  #    wrong verdict a supervisor read for seven straight ticks.
  #
  # ⚠️ it keys on all THREE conjuncts, and each one carries weight:
  #      rowless   — a NAMED grove that is merely down is a different defect
  #                  with a different cure; heal must not conflate the two
  #      probed    — `--what seat` runs no reaching axis, so it must not refuse
  #                  for want of evidence it never went looking for
  #      ! reached — the legitimate case. drop this conjunct and the sixteen
  #                  rowless-but-live fixtures go red, which is the measured
  #                  wrong cure (see the derivation block above)
  if [[ -n "$rowless" && -n "$probed" && -z "$reached" ]]; then
    echo "💥 crew.heal: no crew found for '$tree' — the ledger names no row, and the local fallback holds no duct either" >&2
    echo "   ├─ so every line above is about a box that holds no such crew. this is NOT a clean run" >&2
    echo "   ├─ on a GROVE?      rhx git.crew.heal --tree '$tree' --grove cloud://<name>" >&2
    echo "   ├─ booted pre-ledger? rhx git.crew.ledger --backfill" >&2
    echo "   └─ tree is gone?    rhx git.crew.ledger --del '$tree'" >&2
    return 2
  fi

  return 0
}
