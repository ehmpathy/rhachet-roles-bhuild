#!/usr/bin/env bash
######################################################################
# ductwork.pane — what a pane IS: idle, crashed, a husk, parked on a picker
#
# 🔴 .a PART of ductwork.sh — sourced, never executed, and only BY ductwork.sh.
#     a caller sources ductwork.sh, which loads every part. see
#     __duct_load_parts there for why the lib is cut into parts at all.
#
# .holds = the classifiers that read a pane capture for its STATE —
#          __duct_pane_command, __duct_pane_is_idle, __duct_pane_crash_badge,
#          __duct_pane_is_husk, __duct_pane_is_picker_parked, and the send
#          receipt test __duct_keys_are_not_a_receipt
######################################################################

######################################################################
# .what = the command that holds a duct's pane right now
#
# .why  = `send-keys` is a KEYSTROKE, not a queued command. it goes wherever the
#         pane's foreground process reads stdin. at a prompt that is the shell,
#         which runs it. mid-`apt` that is apt, which swallows it.
#
#         so a duct has two states a caller must tell apart, and tmux already
#         knows which: `pane_current_command` IS the foreground command.
#
# echoes: the command name (e.g. `bash`, `apt`, `nvim`), or empty if unreadable
######################################################################
__duct_pane_command() {
  if __duct_is_remote; then
    ssh -n "$DUCT_HOST" "$(__duct_tmux_cmd)display-message -p -t '$DUCT_SESSION' '#{pane_current_command}'" 2>/dev/null
  else
    __duct_tmux display-message -p -t "$DUCT_SESSION" '#{pane_current_command}' 2>/dev/null
  fi
}

# .what = is the pane sat at a shell prompt, ready to RUN what it is sent?
# .why  = the shells are the closed set that read a line and execute it. every
#         other command reads stdin for its OWN purpose, so a send reaches it as
#         input rather than as a command. a login shell may report `-bash`
__duct_pane_is_idle() {
  case "${1:-}" in
    bash|-bash|zsh|-zsh|sh|-sh|dash|ksh|fish) return 0 ;;
    *) return 1 ;;
  esac
}

# .what = is this a HUSK — claude is GONE from this pane, whatever chrome it
#         left behind? three arms, one per way a clone departs:
#           arm 1  it EXITED clean   -> the "Resume this session with:" banner
#           arm 2  it never opened   -> the "Resume Session" picker, parked
#           arm 3  it CRASHED        -> a shell prompt with a nonzero exit badge
#         arms 1 and 3 both demand NO live ❯ box below their anchor; a caret
#         there means claude restarted and the pane is genuinely live.
# .why  = a husk still shows the STALE ❯ box claude drew BEFORE it died, so it
#         would otherwise classify below as a live box (covered/prefilled) and a
#         DEAD mechanic reads as ALIVE — svc-reservations sat 8h as `😴 unread` after
#         a 💥143, invisible to the tick. the discriminator is heal's own
#         (crewwork.sh __crew_heal_one): the banner is present AND no ❯ sits
#         AFTER it. a ❯ after the banner means claude RESTARTED (genuinely live),
#         so this must NOT fire there — the awk anchors on the banner and only a
#         caret below it counts.
# in: $1 = the flattened pane text (escapes stripped). echoes naught; rc only.
# .note = extracted from duct.poll's inline arm so it is clampable in isolation
#         — a discriminator with a clamp that bites is worth more than one buried
#         in a loop (rule.require.clamp-edge-cases).
######################################################################
# .what = the CRASH arm's discriminator, alone: a shell prompt that holds a
#         nonzero exit badge, with no live ❯ below it. emits the badge's
#         EXIT CODE on a hit, and naught on a miss.
#
# .why  = two callers need this one verdict, and they need different halves
#         of it:
#           __duct_pane_is_husk  — the boolean, for arm 3
#           __crew_heal_husk     — the boolean AND the code, which its own
#                                  render already prints (`husk (exit N)`)
#
# 🔴 .why it is EXTRACTED rather than copied
#         measured 2026-09-18, one tick after arm 3 landed: the poll said
#         `mechanic:husk` on sdk-aws-lambda.beav.feat-input-only-validation
#         -and-hydration and, in the very same breath, heal said "a live
#         claude box is up — not a husk, absent any move to make". the poll
#         routed through this file; heal ran a PRIVATE chain that greps the
#         banner and then a whole-window ❯, and it has no crash arm at all.
#         ⇒ so the emitted cure line was inert, and the `--healable` row it
#           came from was a term=false-report — the tool named a tree
#           healable and then refused to heal it
#           (define.invariant.crew.husk.discriminator-parity).
#
# ⚠️ .the ORDER test, and why it is not optional
#         a ❯ BELOW the badge means claude RESTARTED into this pane and is
#         genuinely live — the badge is then ordinary scrollback from a run
#         that already ended. to fire there would reboot a healthy clone
#         (rule.forbid.byhand-fix-that-burns-the-live-proof).
######################################################################
__duct_pane_crash_badge() {
  local flat="${1:-}" badge=""

  # 🔴 .the BADGE alone — no prompt glyph. this read `💥[0-9]+ ➜`, and that
  #   `➜` is a prompt-THEME property rather than a property of the crash. the
  #   fleet runs two themes (`➜` on the grove, `❮` on local), so every crash
  #   class that leaves NO DUMP was invisible on the local box:
  #     kernel SIGKILL -> no dump, `💥137 ❮`      SIGTERM -> no dump, `💥143 ❮`
  #   and the exposure is measured: `git.grove.saturation local` reports 7
  #   kernel OOM kills in 17.4d, guard none — all SIGKILL, all 137 — on a box
  #   that runs crews. ⇒ same term=partial-audit the `➜`-only enumeration one
  #   function down already had to admit.
  badge="$(printf '%s\n' "$flat" | grep -oaE '💥[0-9]+' | tail -n 1 || true)"
  [[ -z "$badge" ]] && return 1

  # ⚠️ .the ORDER test, DELEGATED — a badge in a live clone's scrollback is
  #   ordinary text, so the badge alone must never fire. this held a private
  #   awk keyed on the same `➜`, which is the SAME glyph set written twice; a
  #   widened `[➜❮]` here would merely duplicate the drift rather than remove
  #   it. the shared test already reads both glyphs AND the node dump, and it
  #   keys on the last CARET — which is the stale one a dead process drew
  #   (rule.always.entool-the-skills-you-touch: one detector, one home).
  __duct_pane_has_returned_shell "$flat" || return 1

  printf '%s\n' "$badge" | grep -oaE '[0-9]+'
  return 0
}

######################################################################
# .what = has a SHELL PROMPT returned BELOW the last claude caret? rc only.
#
# .why  = `a bare ❯ is not evidence of a live box` — crewwork names that root
#         cause in its own comment, and it had been patched around TWICE with a
#         literal each (the `💥N ➜` badge arm, then the picker arm) before this
#         existed. a crashed pane keeps the whole UI claude drew before it died,
#         caret included, so any test that reads that caret as liveness calls a
#         dead mechanic alive.
#
# 🔴 .why not the EXIT BADGE, which the arm above already reads
#         because the badge is a property of the SHELL'S `$?`, never of the
#         crash. measured on ONE tree, ONE crash class, ONE day apart —
#         sdk-aws-lambda.beav.feat-input-only-validation-and-hydration:
#           2026-09-18  V8 heap OOM -> `💥134 ➜`  (red prompt,   $? = 134)
#           2026-09-19  V8 heap OOM -> bare `➜`   (green prompt, $? = 0)
#         starship draws its `status` module ONLY on a nonzero `$?`, so the
#         badge vanished while the dump, the native trace, and the returned
#         prompt all stayed. ⇒ the arm above says the badge is "the one token
#         all three print, because the SHELL prints it rather than the program";
#         that is refuted — the shell prints it CONDITIONALLY. the prompt
#         CHARACTER is the token every departure prints
#         (rule.require.enumerate-before-you-name).
#
# 🔴 .and the clause directly above is ITSELF refuted — 2026-09-20, by the same
#         crash class on a DIFFERENT BOX. the prompt character is not one token;
#         it is whatever that host's prompt theme draws:
#           grove-sandpine-v20260901   V8 heap OOM -> `➜`   (starship, cloud)
#           local / laptop           V8 heap OOM -> `❮`   (starship, local)
#         ⇒ the enumeration that named `➜` was drawn from a GROVE-ONLY corpus,
#         so it was complete over the set it sampled and silent about the rest
#         (term=partial-audit). `heal` then graded the local pane a SUSPECTED
#         WEDGE and recommended a reboot — a live-clone cure aimed at a corpse.
#
# ✅ .the durable anchor is the DUMP, never any prompt glyph.
#         `----- Native stack trace -----` is printed by NODE, on its way out.
#         no shell, no theme, no `$?` takes part, so it cannot vary by host the
#         way a prompt character does. the glyph arm is kept as a widened
#         fallback and is admitted INCOMPLETE by construction; the dump arm is
#         the one that generalizes.
#
# ⚠️ .ORDER, never presence — and that IS the discriminator.
#         this repo's own fixtures and source carry `➜` in plain text, so a LIVE
#         clone that reads one holds a shell prompt in its scrollback. to fire
#         there would reboot a healthy clone
#         (rule.forbid.byhand-fix-that-burns-the-live-proof). a RETURNED prompt
#         sits BELOW the last caret; a QUOTED one sits above it. so the test is
#         the two line numbers, never a grep for the glyph.
#
# ⚠️ .a tie reads as NOT returned. same-line is ambiguous, and the safe default
#         on an ambiguous pane is to leave the clone alone.
#
# in: $1 = the flattened pane text (escapes stripped). echoes naught; rc only.
######################################################################
__duct_pane_has_returned_shell() {
  printf '%s\n' "${1:-}" | awk '
    /❯/                                { caret  = NR }
    /➜/ || /❮/                         { prompt = NR }
    /----- Native stack trace -----/   { dump   = NR }
    END {
      # either proof, and BOTH are read as order against the last caret
      exit ((prompt && prompt > caret) || (dump && dump > caret)) ? 0 : 1
    }
  '
}

__duct_pane_is_husk() {
  local flat="${1:-}"

  # arm 1 — the BANNER shape. claude exited and left `Resume this session
  # with:`; the husk is real only where no ❯ sits BELOW that banner.
  #
  # ⚠️ .the arm does NOT short-circuit on a negative, and that is the whole
  #   point of its shape. a POSITIVE claims the pane; a negative FALLS THROUGH
  #   to the arms below, exactly as arm 3's own guard was removed for.
  #
  # 🔴 .measured 2026-09-20 — rhachet-roles-bhrain.beav.feat-review-cost-meter,
  #   a sponsored star. the clone died `💥143` mid-turn and left this banner; a
  #   revive then typed `claude --resume 'mechanic' cont` and PARKED at the
  #   `Resume Session` picker. the picker draws its own row highlight as
  #   `❯ mechanic` — which sits BELOW the banner, so the order test below read
  #   "claude RESTARTED, genuinely live", and the old unconditional `return`
  #   denied arm 2 the one pane it was written for:
  #     crew.poll  → `😶 inflight`, the seat rendered `🙋ask?`
  #     --healable → `no tree to heal … none a husk`
  #   verbatim pane: work/.test/.assets/pane.husk.revive-parked-at-picker-read-as-an-ask.log
  #
  # ⇒ third instance of ONE root cause — `a bare ❯ is not evidence of a live
  #   box` — after the badge arm and the picker arm. the order test itself is
  #   RIGHT and stays: a genuine restart below a stale banner must not fire
  #   here (rule.forbid.byhand-fix-that-burns-the-live-proof). what was wrong
  #   was the `return` that made arm 1's NO the whole ladder's no.
  if printf '%s\n' "$flat" | grep -qa 'Resume this session with:' \
    && ! printf '%s\n' "$flat" \
      | awk 'f && /❯/ { print; exit } /Resume this session with:/ { f=1 }' \
      | grep -qa '❯'; then
    return 0
  fi

  # arm 3 — the CRASH shape. claude ABORTED, so it never printed the banner arm
  # 1 keys on, and the pane keeps the whole stale UI it drew before it died — a
  # live-looking spinner frame, a ❯ box, a statusline. what sits BELOW all of
  # that is a SHELL prompt with a nonzero exit badge.
  #
  # 🔴 .measured 2026-09-18 — sdk-aws-lambda.beav.feat-input-only-validation-and
  #   -hydration. claude died of a V8 heap OOM after a 4d14h run:
  #     FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
  #     node::OOMErrorHandler(...)   ->   exit 134 (SIGABRT)
  #   and the pane STILL rendered a spinner frame on a 4h 33m clock, above an
  #   `❯` box and a `🗿 5.1.execution.from_vision, review.peer, l1@i003 🔍` line.
  #   so `crew.poll` read the seat as `😶 at work`, `--healable --all` named the
  #   tree NOT AT ALL, and a human found it by eye 4 days in.
  #   ⇒ the verbatim pane is clamped at
  #     work/.test/.assets/pane.husk.crashed-under-stale-ui.log
  #
  # ⚠️ .why the EXIT BADGE, never the crash text
  #   (rule.require.enumerate-before-you-name). the class this must cover is
  #   EVERY abnormal return, and the dump text differs per cause:
  #     V8 heap OOM    -> `FATAL ERROR: Reached heap limit`  + 💥134
  #     kernel SIGKILL -> no dump at all                     + 💥137
  #     SIGTERM        -> no dump at all                     + 💥143   (the
  #                       svc-reservations case arm 1's own .why already records)
  #   ⇒ a detector keyed on the dump would catch ONE of the three. the badge is
  #     the one token all three print, because the SHELL prints it rather than
  #     the program — so it survives a cause that leaves no dump at all.
  #
  # ⚠️ .and it is POSITIVE evidence, never an absence — a returned shell prompt
  #   is a token the pane HAS
  #   (define.invariant.crew.husk.discriminator-parity). the order test is arm
  #   1's, for arm 1's reason: a ❯ BELOW the badge means claude RESTARTED and is
  #   genuinely live, so this must not fire there.
  # ⇒ the test itself lives in __duct_pane_crash_badge, one home, because HEAL
  #   needs the same verdict AND the badge's number for its render. a private
  #   copy there is precisely how arm 1 and the picker arm fell out of step
  #   (rule.always.entool-the-skills-you-touch: one detector, one home).
  # ⚠️ .the guard is GONE, and the arm no longer short-circuits on a negative.
  #   it read `💥[0-9]+ ➜` — a second copy of the glyph set the badge test
  #   itself held, so a `❮` badge never reached the test that could grade it.
  #   the badge test already greps its own badge, so a guard here buys naught
  #   and can only fall out of step with it. ⇒ a POSITIVE claims the pane; a
  #   negative falls through, so a pane that carries a badge and is really
  #   PARKED at the picker still reaches arm 2.
  if [[ -n "$(__duct_pane_crash_badge "$flat" || true)" ]]; then
    return 0
  fi

  # arm 4 — the CRASH shape whose shell came back CLEAN. arm 3 keys on the
  # badge, and a badge is drawn only where the re-drawn prompt saw a nonzero
  # `$?`. a shell that reaped the crash and then returned 0 draws no badge at
  # all, so arm 3 is silent over a pane that holds a full node death dump.
  #
  # 🔴 .measured 2026-09-20 — infrastructure.beav.feat-camp-git-backup-bucket,
  #   a LOCAL duct, third consecutive tick. the pane held a V8 heap OOM dump
  #   above a returned `❮` prompt, no badge, no banner, no picker — so every
  #   arm above was silent and the chrome arm below read the STALE pre-crash
  #   `❯` as a live box. the split that followed:
  #     crew.poll → `mechanic:empty` → `🧊 SUSPECTED WEDGE` → `--what wedge`
  #     crew.heal → `💀 … no live claude box — a husk or plain shell`
  #   heal was right, and it already held this very arm
  #   (crewwork.sh: `husk (crashed — a node fatal dump, and the shell came
  #   back with NO exit badge)`). so this RESTORES parity; it widens no class
  #   (define.invariant.crew.husk.discriminator-parity).
  #
  # 🔴 .the harm was not one missed row. `empty` drove `__crew_heal_axis` to
  #   `wedge`, and wedge is OPT-IN — never part of heal's default `all` — so
  #   the emitted `--what wedge` line refused every tick it ran. detect → cure
  #   → identical state → detect (rule.forbid.remedies-that-mimic-the-defect).
  #
  # ✅ .why the DUMP and never a prompt glyph. a prompt character is a theme
  #   property: the same crash class drew `➜` on the grove and `❮` here, so
  #   any enumeration of them is a term=partial-audit by construction. node
  #   prints `----- Native stack trace -----` on its way out — no shell, no
  #   theme, no `$?` takes part — so it is the one token this class cannot
  #   vary. ⇒ the ORDER test is delegated, exactly as arm 3 delegates its
  #   badge: this repo's own source and fixtures carry that dump in plain
  #   text, so a LIVE clone that reads one holds it in scrollback, and a
  #   presence test would reboot a healthy clone
  #   (rule.forbid.byhand-fix-that-burns-the-live-proof).
  #
  # ⚠️ .it does NOT short-circuit on a negative. a pane that quotes a dump
  #   above its caret may still be PARKED at the picker, which is arm 2's
  #   verdict — an unconditional `return` here would hide it.
  if printf '%s\n' "$flat" | grep -qa -- '----- Native stack trace -----' \
    && __duct_pane_has_returned_shell "$flat"; then
    return 0
  fi

  # arm 5 — the CLEAN-EXIT shape, and the GENERAL case the four above are each
  # a special case of. claude simply ENDED — turn done, alt-screen torn down,
  # shell back at 0 — so it printed no banner, no badge, no dump, and drew no
  # picker. every arm above pairs the returned shell with a token that proves a
  # DEPARTURE, and this class prints not one of them.
  #
  # 🔴 .measured 2026-09-20 — infrastructure.beav.feat-camp-git-backup-bucket,
  #   the SAME tree arm 4 was written for that same day, dead now of a different
  #   cause. the spinner froze at `1h 10m 38s`; the shell below it reports
  #   `took 1h11m10s` — one process, departed. the split that followed:
  #     crew.poll → `🧊 frozen` → --healable emitted `--what wedge`
  #     crew.heal → `💀 … no live claude box — a husk or plain shell`
  #   and `wedge` is OPT-IN, never part of heal's default `all`, so the emitted
  #   line REFUSED every tick it ran — detect → cure → identical state → detect
  #   (rule.forbid.remedies-that-mimic-the-defect). heal was right, and it held
  #   this verdict already; this restores parity
  #   (define.invariant.crew.husk.discriminator-parity).
  #
  # ✅ .why a CARET is required, and why that is the whole bound
  #   `__duct_pane_has_returned_shell` reads `prompt > caret` with an UNSET
  #   caret as 0, so a prompt alone satisfies it. that is correct for arms 3
  #   and 4, which each carry a second token, and it is NOT safe unpaired: a
  #   live clone whose box scrolled out of the read window has no caret and
  #   may quote a `➜` from this repo's own fixtures, and would be rebooted
  #   mid-read (verbatim pane: pane.box.live-claude-with-no-caret-in-window.log,
  #   rule.forbid.byhand-fix-that-burns-the-live-proof).
  #   ⇒ so the pairing here is the STALE CHROME itself: the pane must hold a
  #     caret AND a prompt strictly below it. a live box draws its caret LAST,
  #     so no output of its own sits under it, and the shape is unreachable for
  #     a clone that is alive. the token is not a cause of death — there is none
  #     to read — it is the corpse's own chrome.
  #
  # ⚠️ .it does NOT short-circuit on a negative, for arm 2's sake.
  if printf '%s\n' "$flat" | grep -qa '❯' \
    && __duct_pane_has_returned_shell "$flat"; then
    return 0
  fi

  # arm 2 — the PICKER shape. a DIFFERENT dead state under the same word:
  # claude is up but sits PRE-conversation at its interactive `Resume Session`
  # picker, parked on a selection nobody makes.
  #
  # 🔴 .measured 2026-09-18 — infrastructure.beav.feat-camp-git-backup-bucket
  #   sat 3494m (58h) here, and the two instruments SPLIT on it:
  #     crew.heal → `💀 husk … safe to heal`, with a cure plan
  #     crew.poll → `❔unread`, and `--healable` named it NOT AT ALL
  #   that is define.invariant.crew.husk.discriminator-parity, inverted — and
  #   heal was the one that was right. so this arm RESTORES parity; it does not
  #   widen the class. the cure path already exists (crewwork.sh drives the
  #   picker with `--keys Enter`); the poll never routed here to reach it.
  #
  # 🔴 .the harm is worse than one missed row. `❔unread` prescribes "re-read
  #   the duct" — and a re-read settles naught, because the pane reads in full
  #   and the second read repeats the first. so the one seat state whose guide
  #   is a DEAD END was also the one the actionable set omitted
  #   (rule.require.a-cure-path-for-every-named-husk-shape).
  #
  # ⚠️ .why BOTH literals, never either alone — the two false positives are
  #   real and they point opposite ways (rule.require.enumerate-before-you-name):
  #     the TITLE alone — `Resume Session` is prose in this repo's own briefs
  #       and tests, so a LIVE clone that reads one carries it in its pane. a
  #       title-only match reboots that clone mid-read
  #       (rule.forbid.byhand-fix-that-burns-the-live-proof)
  #     the FOOTER alone — claude's other pickers (model, file) draw the same
  #       help line, so a footer-only match calls a live clone mid-choice dead
  #   ⇒ neither literal discriminates; the PAIR does.
  # ⇒ the test itself lives in __duct_pane_is_picker_parked, one home, for the
  #   reason arm 3 states one branch up: HEAL needs the same verdict, and a
  #   private `❯` chain there is precisely how the two fall out of step
  #   (rule.always.entool-the-skills-you-touch: one detector, one home).
  __duct_pane_is_picker_parked "$flat"
}

# .what = is this pane PARKED at claude's interactive `Resume Session` picker,
#         pre-conversation, on a selection nobody makes?
#
# .why  = it is the husk shape HEAL could not see. `__crew_heal_one` runs a
#         private chain that reads a bare `❯` as "a live claude box is up" —
#         and the picker draws its OWN row highlight as `❯ $who`. so a parked
#         pane walked that chain, met no rate-limit and no cap, and returned 3:
#         healthy, no move to make. the POLL, which reads the arm above, called
#         the same pane a husk and emitted a cure line for it.
#
# 🔴 .measured 2026-09-19 — rhachet.beav.fix-keyrack-daemon-orphan and
#    rhachet.beav.fix-test-tempdir-leak. `--healable` named both, both emitted
#    lines ran verbatim, and heal answered `😶 a live claude box is up` for
#    each. the panes came back byte-identical: detect → heal → same → detect
#    (rule.forbid.remedies-that-mimic-the-defect), and the split is exactly
#    define.invariant.crew.husk.discriminator-parity, inverted — this time the
#    POLL was the one that was right.
#    verbatim pane: work/.test/.assets/pane.husk.picker-with-a-row-read-as-a-live-box.log
#
# ⚠️ .why BOTH literals, never either alone — the two false positives are real
#    and they point opposite ways (rule.require.enumerate-before-you-name):
#      the TITLE alone — `Resume Session` is prose in this repo's own briefs
#        and tests, so a LIVE clone that reads one carries it in its pane
#      the FOOTER alone — claude's other pickers (model, file) draw the same
#        help line, so a footer-only match calls a live clone mid-choice dead
#    ⇒ neither literal discriminates; the PAIR does.
#
# ⚠️ .this says PARKED, never which cure. a picker with a ROW holds a live
#    transcript one Enter from cured (revive); a picker with ZERO rows is a
#    FLAP whose transcript is gone (hatch). same chrome, opposite cures —
#    __duct_picker_has_no_rows is what parts them.
__duct_pane_is_picker_parked() {
  local flat="${1:-}"
  printf '%s\n' "$flat" | grep -qa 'Resume Session' \
    && printf '%s\n' "$flat" | grep -qa 'Esc to cancel'
}

# .what = did the `Resume Session` picker draw with ZERO sessions to pick?
#
# .why  = a picker with no rows is a FLAP — the named conversation is GONE, so a
#         resume can never cure it and a re-heal is the same failed remedy
#         (rule.forbid.remedies-that-mimic-the-defect). a picker WITH a row is a
#         live clone one keystroke from cured. same chrome, opposite cures.
#
# 🔴 .the gap this closes — claude reports "no such session" by TWO surfaces, and
#    crewwork only ever read one of them:
#      NON-interactive  → the verbatim sentence `No conversations found to
#                         resume`, which __crew_heal_revive's flap arm greps for
#      INTERACTIVE      → a NAME was given and matched naught, so claude opens
#                         the picker with that name pre-filled as a SEARCH and
#                         draws an empty list. no sentence is printed at all
#
#    ⇒ so a flap that wears the picker's face fell past the flap arm, hit the
#      picker-did-not-clear guard, and returned "verify manually" — a
#      term=volunteered-diagnosis: the state reported UNKNOWN while the pane
#      states the cause outright.
#
#    measured 2026-09-18 over three consecutive ticks, one seat
#    (infrastructure.beav.feat-camp-git-backup-bucket): `--healable` emitted its
#    heal line each tick, the line ran verbatim, and the pane came back
#    byte-identical. detect → heal → same state → detect, without bound.
#    verbatim pane: .test/.assets/pane.flap.picker-with-zero-rows.log
#
# ⚠️ .the discriminator is POSITIONAL, never a literal — the picker prints no
#    "no results" text to grep for. what it prints is the section header
#    `current worktree` followed by rows, and with zero rows the next non-blank
#    line is the FOOTER keybind block. so: read the first non-blank line after
#    the header, and ask whether it is the footer.
#
# 🔴 .an unreadable pane answers NO, never yes. where the header is absent
#    (another picker layout, a clipped capture) this cannot see the list at all,
#    and a guess routed to the hatch would ABANDON a live transcript on a read
#    that never happened (rule.forbid.failhide).
__duct_picker_has_no_rows() {
  local flat="${1:-}"
  local after_hdr
  after_hdr="$(printf '%s\n' "$flat" \
    | awk 'f && NF { print; exit } /current worktree/ { f=1 }')"

  # header absent, or naught after it — unreadable, so make no claim
  [[ -n "$after_hdr" ]] || return 1

  # the FOOTER sits where a session row would ⇒ the list drew empty
  [[ "$after_hdr" == *Ctrl+* ]]
}

# .what = print the bound a `keys sent` line does NOT carry on its own.
#
# .why  = `tmux send-keys` exits 0 once the key is DELIVERED to the pane. it
#         says naught about whether the TUI that holds the pane CONSUMED it.
#         so `🔧 <uri> keys sent: 1` is a true claim about the instrument that
#         a reader takes as a claim about the world — the term=false-report
#         shape, reader-inference family.
#
# 🔴 .the measured recurrence — a supervisor answered six modals in one tick,
#    every send reported `keys sent: 1`, and TWO left the pane byte-identical
#    with the same modal still drawn. a re-send cleared each. the same class is
#    already on record one surface over: ductwork.verbs.integration.test.ts [case18][t1]
#    captures a `keys sent: Enter` whose payload never arrived, verified
#    byte-identical twice.
#
# ⚠️ .why the render is the cure rather than an in-tool retry — a blind retry
#    would answer whatever modal is drawn NEXT, and the clone often raises one
#    the instant the first clears. an unasked-for second approval is a worse
#    defect than an unverified first. so the tool states its bound and leaves
#    the verify to the caller, who alone knows which prompt they meant to
#    answer (rule.require.verify-after-send).
__duct_keys_are_not_a_receipt() {
  echo "   └─ ⚠️ delivered, never CONSUMED — tmux placed the key; the TUI may have dropped it"
  echo "      read the box back before you call this answered (rule.require.verify-after-send)"
}
