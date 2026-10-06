#!/usr/bin/env bash
######################################################################
# ductwork.signal — what a pane SAYS: caps, escalations, turns, queues, lost modes
#
# 🔴 .a PART of ductwork.sh — sourced, never executed, and only BY ductwork.sh.
#     a caller sources ductwork.sh, which loads every part. see
#     __duct_load_parts there for why the lib is cut into parts at all.
#
# .holds = the readers of the claude chrome a pane draws — rate limits,
#          cap lines, escalations, compaction, arrival failures, turn frames,
#          queued rows, a lost permission mode, a smeared plea — and
#          __duct_mark_pane_ghosts, which folds them over a sweep
######################################################################

# .what = is CLAUDE RUNNING in this pane, judged by chrome OTHER than its ❯ box?
# .why  = the box classifier's whole ladder keys on `❯`, and its last arm reads
#         the absence of one as "there is no claude here at all" — a plain shell
#         duct, which the crew fold then promotes to `💀 husk` for a MECHANIC.
#
#       🔴 that is a screen named for ONE MEMBER of a set. `❯` is one piece of
#         claude's chrome; the mode footer and the rhachet statusline are two
#         more, and either one alone proves the program is alive. a pane that
#         carries them and no caret is a LIVE clone the ladder called dead.
#
#         measured 2026-09-16 on
#         `rhachet-roles-ehmpathy.beav.feat-auto-review-permission-responses`:
#         30 captured lines, ZERO `❯`, and the last line reads
#         `⏵⏵ accept edits on (shift+tab to cycle)`. the poll rendered
#         `mechanic:shell` → `🚦 1 husk` → the `--healable` set, while
#         `crew.heal` read the same pane and answered "a live claude box is up
#         — not a husk". two instruments, one pane, opposite verdicts —
#         `define.invariant.crew.husk.discriminator-parity`, inverted.
#
#       🔴 .the harm is a REBOOT of a live conversation. `crew.heal --mode apply`
#         on a husk reboots + resumes. here heal refused only because a stale
#         `❯` happened to sit in ITS wider window; on a pane with no stale caret
#         both instruments agree on `husk` and the clone is killed mid-work
#         (rule.forbid.byhand-fix-that-burns-the-live-proof).
#
# ⚠️ .why the MODE FOOTER and not the `❯`
#         the footer is drawn by the live program on every repaint and depends
#         not at all on the box, which is the one part that can be overdrawn,
#         scrolled off, or simply not rendered. `git.grove.auth.sh` already reads
#         `shift+tab to cycle` as its claude-is-live tell — this adopts that
#         extant discriminator rather than coins a second one
#         (rule.always.reuse-pavement-before-improvise).
#
# ⚠️ .it says ALIVE, never HEALTHY. a husk's scrollback can hold this chrome
#         too, which is why the caller runs `__duct_pane_is_husk` FIRST: the
#         resume banner is the shell's own marker that the program above it
#         ended, and it outranks any chrome drawn before that.
#
# in: $1 = the flattened pane text (escapes stripped). echoes naught; rc only.
__duct_pane_has_claude_chrome() {
  local flat="${1:-}"
  printf '%s\n' "$flat" | grep -qaE 'shift\+tab to cycle|⏵⏵|for shortcuts|Welcome back'
}

# .what = does the pane show a rate-limit WEDGE — the literal
#         "API Error: Rate limit reached" among the last real output lines?
# .why  = a rate-limited clone is ALIVE (its ❯ box is up) but STOPPED on the
#         error, so it renders as a healthy box and the tick reads `😶 at work`
#         over an idle clone. scoped to the LAST REAL LINES so a banner claude
#         already retried PAST (up in scrollback) does not false-flag it — a
#         stale-banner hit is a term=false-report. the CALLER gates on box state
#         (a husk / a plain shell is never a wedge); this owns only the text
#         discriminator.
#       🔴 the window is REAL lines, never RAW lines. a tail-15 window measured
#         raw rows, so claude's own UI chrome — a 20-row todo list, the input
#         box, the stone line, a spinner — pushed the banner ~19 rows up and out
#         of view, and a live clone fell through to `😶 at work`. so it discards
#         the UI chrome that FOLLOWS the last real output, then reads the last
#         <=4 REAL lines for the banner.
#       🔴 the banner counts ONLY as the clone's OWN halt, never as tool DATA.
#         a genuine 429 renders the error as the LINE'S OWN content, anchored at
#         the line start (after an optional `⎿`): `⎿  API Error: Rate limit
#         reached`. the same text shows up as tool DATA two ways, both of which
#         carry a prefix so the banner is NOT anchored: a GREP MATCH prefixes a
#         `file:line:` locator (`⎿ src/x.ts:42:  ...API Error...`), and a SEARCH
#         ARG wraps it in `Search(pattern: "...")`. so the discriminator is pure
#         anchor: does the banner OWN the line, or sit embedded behind a prefix?
#       🔴 a bare halt CAN follow a Search line — a 429 fires mid-turn right after
#         a search returns — so to key on the line above is WRONG. it suppressed a
#         real halt at svc-reservations.beav.feat-spot-forecast-widget, measured
#         2026-09-14: the clone ran a Search, the api 429'd, and the bare banner
#         rendered under the Search line. the anchor alone tells a halt from an
#         embedded match, with no line-above heuristic.
# in: $1 = the flattened pane text. echoes naught; rc only.
__duct_pane_has_ratelimit() {
  local flat="${1:-}"
  # 🔴 claude renders the `⎿` result marker with a trailing NON-BREAKING space
  #    (U+00A0), so the banner reads `⎿␠\u00a0API Error: Rate limit reached`.
  #    `[[:space:]]` (and awk's default whitespace) does NOT match U+00A0, so
  #    is_banner failed to consume it, the optional `⎿[[:space:]]*` group ended
  #    at the ascii space, and the line was then swallowed by the `⎿`-chrome
  #    rule below — a live 429 wedge read as healthy. measured 2026-09-14 on
  #    svc-reservations.beav.feat-spot-forecast-widget (the SAME class as the
  #    prior misses, uncaught by the ascii-space fixture that had no teeth).
  #    fold nbsp → space up front, so every whitespace class below matches.
  local nbsp=$'\u00a0'
  flat="${flat//$nbsp/ }"
  printf '%s\n' "$flat" | awk '
    { line[NR] = $0 }
    function is_chrome(s) {
      if (s ~ /^[[:space:]]*$/)                                     return 1
      if (s ~ /──────/)                                            return 1
      if (s ~ /^[[:space:]]*❯/)                                    return 1
      if (s ~ /^[[:space:]]*🗿/)                                   return 1
      if (s ~ /^[[:space:]]*⏵⏵/)                                   return 1
      if (s ~ /^[[:space:]]*(✻|✽|✢|·|∗|⋆)[[:space:]]/)             return 1
      if (s ~ /^[[:space:]]*[0-9]+ tasks \(/)                      return 1
      if (s ~ /^[[:space:]]*(◼|◻|✔|☐|☑)/)                          return 1
      if (s ~ /(…|\.\.\.|⎿)[[:space:]]*\+[0-9]+ (completed|more)/) return 1
      if (s ~ /^[[:space:]]*⎿[[:space:]]*Tip:/)                    return 1
      # claude renders the interrupted turn AFTER the 429 halts the box: its ●
      # action markers (a tool call, an agent/background completion) and their ⎿
      # result continuations. these are cleanup of the SAME halted turn, never
      # new work, so they must NOT bury the banner. a genuine retry-past instead
      # emits plain output lines (non-chrome), which trip the window below.
      # measured 2026-09-14 on svc-reservations: 5 such ● lines pushed the banner out
      # of the tail and the wedge read healthy for HOURS (crewwork case17).
      if (s ~ /^[[:space:]]*●/)                                    return 1
      if (s ~ /^[[:space:]]*⎿/)                                    return 1
      return 0
    }
    # the banner is a genuine halt ONLY when the error OWNS its line — anchored
    # at line start, after an optional `⎿`. an embedded match carries a prefix
    # (a `file:line:` grep locator, or a `Search(pattern: "…")` wrapper), so it
    # never anchors. pure anchor test, no line-above heuristic.
    function is_banner(s) {
      return (s ~ /^[[:space:]]*(⎿[[:space:]]*)?API Error: Rate limit reached/)
    }
    END {
      # scan the tail upward. is_banner is checked BEFORE is_chrome so a
      # `⎿ API Error` line reads as the halt even though a bare `⎿` is chrome.
      # a genuine retry-past shows >=4 non-chrome plain-output lines below the
      # banner — those trip the window and leave the box healthy.
      real = 0
      for (i = NR; i >= 1; i--) {
        if (is_banner(line[i])) { found = 1; break }
        if (is_chrome(line[i])) continue
        real++
        if (real >= 4) break
      }
      exit found ? 0 : 1
    }
  '
}

# .what = echo the pane's usage-CAP banner line, if present — the INTERACTIVE
#         "You've hit your limit … resets <time>" / "out of extra usage …" that
#         claude code draws when the account budget is spent. echoes the last
#         match trimmed; echoes an empty string (rc 1) when absent.
# .why  = this is a DIFFERENT banner from __duct_pane_has_ratelimit's headless
#         "API Error: Rate limit reached". the interactive form is what a live
#         clone shows in the wild, and it is the one that left a whole grove of
#         capped clones reading `😴 unread` — measured 2026-09-14 on grove
#         v20260901, ~60 live sessions, many showing "hit your limit · resets
#         2:20am (UTC)" with a live ❯, all invisible to the sweep.
#       ⚠️ TZ-INDEPENDENT by construction: the reset time is UTC on a grove but
#         the LOCAL zone on local, so this NEVER anchors on "(UTC)" — it anchors
#         on the stable phrase and captures whatever time trails "resets ".
#       .note = extracted from duct.poll's inline arm so it is clampable in
#         isolation, the same move husk/ratelimit took (rule.require.clamp-edge-
#         cases). the CALLER owns the reset-passed / motion join; this owns only
#         the text discriminator + the verbatim cap line for that join to parse.
# in: $1 = the flattened pane text. echoes the cap line, or an empty string.
__duct_pane_cap_line() {
  local flat="${1:-}" line=""
  line="$(printf '%s\n' "$flat" \
    | grep -aoE "(hit your limit|out of extra usage)[^|]*resets[[:space:]]+[^|]*" \
    | tail -n 1 \
    | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"
  [[ -n "$line" ]] || return 1
  printf '%s\n' "$line"
}

# .what = echo the pane's ESCALATION line, if present — the clone's own
#         `stuck on stone <X> after <N> attempts. please tell a human …`.
#         echoes the matched stone+count clause trimmed; empty string (rc 1)
#         when absent.
#
# .why  = this is the one pane state where the clone has EXPLICITLY asked for a
#         human and no instrument carried it. the pane renders like health — a
#         live `❯`, a stone below it — so the sweep read `😶 at work` over a
#         clone that had stopped. measured 2026-09-15 across THREE trees in one
#         tick, at 23, 25 and 51 attempts.
#
# 🔴 .the attempt count is the INSTRUMENT'S cost, never the driver's fault.
#         every measured instance sits directly beneath
#           Stop hook error: … repo=bhrain/role=driver/skill=route.drive
#              └─ 💥 failed with an error
#         the stop hook that would have re-emitted the stone crashed instead, so
#         the driver re-entered and re-crashed, N times. the clone's own prose
#         above the crash is coherent in all three — it did not get lost.
#         ⇒ so a reader must not route this to the DRIVER. the count measures
#         how long the instrument has been broken.
#
# .why the anchor is `^[[:space:]]*stuck on stone`, never a bare phrase match
#         a clone may GREP for this text, or hold it in a source line it has
#         open, and BOTH forms carry a locator prefix — `Grep(pattern: "…`,
#         `src/hook.ts:12:`. a line-start anchor excludes every prefixed form
#         with no blocklist to maintain, which is the same move the ratelimit
#         detector above reached for after four false-positive shapes.
#
# .why BOTH halves are required in one row
#         `attempts` alone is ordinary prose and `stuck on stone` alone is a
#         phrase a driver brief quotes. the bounded `[^|]*` between them holds
#         the match to one rendered row, so a pane that carries the two words
#         far apart never pairs them.
#
# ⚠️ .note = SEEN, never STOPPED — the same bound cap/plea/ratelimit carry. this
#         asserts the pane CARRIES the line; whether the clone is halted RIGHT
#         NOW is a join downstream in git.crew.poll, off the motion signal.
#
# in: $1 = the flattened pane text. echoes the escalation clause, or empty.
__duct_pane_escalation_line() {
  local flat="${1:-}" line=""
  line="$(printf '%s\n' "$flat" \
    | grep -aoE "^[[:space:]]*stuck on stone[[:space:]]+[^|]*attempts" \
    | tail -n 1 \
    | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"
  [[ -n "$line" ]] || return 1
  printf '%s\n' "$line"
}

# .what = echo the percent of context a clone has LEFT before an auto-compact,
#         read off its own status line. echoes a bare integer; empty (rc 1)
#         when the pane carries no such line.
#
# .why  = the figure is printed on every claude status line and NOT ONE
#         instrument in the fleet reads it. so a ⭐ tree can be one turn from a
#         compact — across which a clone can lose the thread of its route — and
#         the sweep renders it healthy, because the box is healthy. measured
#         2026-09-15: a ⭐ tree at 2%, and #79 records a reviewer that
#         malfunctioned at 1%.
#
# 🔴 .the shape this REFUSES, and why that matters more than the shape it reads
#         claude draws TWO figures on that line, and they are different facts:
#
#           `N% until auto-compact`                — the context LEFT
#           `new task? /clear to save NNNK tokens` — the session's cumulative COST
#
#         the seeding task recorded them as one fact and proposed to relay the
#         second to a human as a gate. that is wrong twice over: 763K tokens
#         exceeds any context window, so the figure is SPEND rather than
#         remainder; and the line sits on plainly healthy panes — a live ❯, a
#         task list mid-progress, `⏵⏵ accept edits on`. a gate row keyed on it
#         would fire for every long-lived clone, which is a fabrication machine
#         on the surface where a fabrication is dearest (#103, paid once).
#
#         ⇒ this reads the EXHAUSTION shape only. the cost hint is deliberately
#           out of scope, and the clamp carries a tooth that keeps it out.
#
# .why the anchor is a WHITESPACE RUN plus END-OF-LINE, never the bare phrase
#         the status line is RIGHT-ALIGNED, so it trails a long run of spaces
#         and ends its row. prose that quotes the phrase — a task body, a brief
#         a clone has open — does neither. two cues off one geometry, and each
#         is free (rule.require.a-cue-is-not-a-claim).
#
# ⚠️ .this yields a NUMBER and renders no verdict. whether 2% is worth a row is
#         a THRESHOLD, and a threshold is the caller's — the same split
#         __duct_pane_cap_line takes, where the caller owns the reset-passed
#         join and this owns only the discriminator.
#
# in: $1 = the flattened pane text. echoes the percent, or an empty string.
__duct_pane_compact_percent() {
  local flat="${1:-}" pct=""
  pct="$(printf '%s\n' "$flat" \
    | grep -aoE "[[:space:]]{2,}[0-9]+% until auto-compact[[:space:]]*$" \
    | tail -n 1 \
    | grep -aoE '[0-9]+' \
    | head -n 1)"
  [[ -n "$pct" ]] || return 1
  printf '%s\n' "$pct"
}

# .what = did an `arrive` / `re-arrive` SPAWN fail in this pane?
#
# .why  = the 🗿 stone is a PROXY for the ROUTE's record, never for what runs
#         (see the note above the stone grep in duct.poll.sh). a stone that
#         reads `🔍` claims a peer review is in flight. when the background
#         command meant to spawn that very review exits non-zero, the two
#         halves disagree — and a sweep that renders the stone alone reports
#         the clone BUSY-IN-REVIEW while no review runs. the phantom.
#
#         measured 2026-09-15, FOUR captured panes carry both halves — three
#         cap panes and one husk — so the shape is not a cap artifact.
#
# .why the anchor is `rrive` rather than `Arrive`
#         both live shapes carry it: `Arrive 5.3.verification …` and
#         `Re-arrive i028 …`. one fragment covers the family, and it is narrow
#         enough that an unrelated command name does not wear it.
#
# ⚠️ .the KNOWN BOUND, stated rather than papered over: no capture in this
#         corpus shows a SUCCEEDED background command, so its render shape is
#         unknown and this cannot prove "no arrive ever landed." it proves "an
#         arrive FAILED here." ⇒ the caller must ANNOTATE the stone, never
#         replace it, and must say `verify` rather than assert the review is
#         absent. bias to DETECT: a false detect costs one read; a miss costs a
#         sponsored clone hours of phantom-busy.
#
# ⚠️ .the caller owns the JOIN. this yields only the failed line; whether it
#         matters is settled by the stone beside it — the same detector/caller
#         split __duct_pane_cap_line and __duct_pane_compact_percent take.
#
# in: $1 = the flattened pane text. echoes the LAST failed arrive line, or empty.
__duct_pane_arrive_failed() {
  local flat="${1:-}" hit=""
  hit="$(printf '%s\n' "$flat" \
    | grep -aoE 'Background command "[^"]*rrive[^"]*" failed with exit code [0-9]+' \
    | tail -n 1)"
  [[ -n "$hit" ]] || return 1
  printf '%s\n' "$hit"
}

# .what = has the clone's last TURN ENDED? echoes the spinner's own clause
#         (e.g. `Brewed for 6m 15s`) and returns 0; empty + rc 1 otherwise.
#
# .why  = `😶 inflight` asserts the clone is MID-TURN, and until this detector
#         not one signal in the sweep could check that claim. the only motion
#         tell was the duct-changed diff — which needs a SECOND poll and only
#         speaks after 90–150 minutes of stillness. so a clone whose turn ended
#         six minutes ago rendered exactly like one that still runs.
#
#         measured 2026-09-16 on `rhachet-roles-bhrain.beav.feat-dispute-or-
#         concede-review-budget`: the mechanic ended its turn with a question to
#         the human (`⭐ can you confirm: did the billing restore apply to the
#         account behind the test-env Fireworks key…`), the human's answer sat
#         in the box, and the tick rendered `😶 inflight`. the human read the
#         pane and asked outright: "this one is halted. how can you get your
#         crew.poll to detect this". the answer was on the pane the whole time,
#         one row above the box.
#
# 🔴 .the discriminator is the SHAPE, never the GLYPH. claude cycles
#         `✻ ✽ ✢ · ∗ ⋆` through BOTH states, so a glyph test parts them not at
#         all — the measured live pane `✻ Tinkering… (27m 50s · ↓ 26.4k tokens)`
#         wears the same `✻` as every ended turn below it:
#
#           LIVE   `✽ Frolicking… (2m 43s · ↑2.8k)`  gerund · `…` · live counter
#           ENDED  `✻ Brewed for 6m 15s`             participle · ` for ` · static
#
#         so the anchor is ` for <digits>` after a SINGLE capitalized word, with
#         no `…` and no `(` — which also excludes the third shape that rides the
#         same glyph, claude's own `✻ Conversation compacted (ctrl+o …)` notice.
#
# 🔴 .it folds SGR escapes ITSELF, and that carries weight. duct.poll hands it
#         an escape-stripped `flat`, but the live capture interleaves a run
#         between EVERY word — `…m✻…m Brewed…m for…m 6m…m 15s` — so a detector
#         that trusted its caller would match the verbatim corpus not at all,
#         and its clamp would then have to read a pane that never existed
#         (rule.always.clamp-the-verbatim-pane-your-classifier-judged).
#
# ⚠️ .TAIL-anchored — the LAST spinner is the current one. a pane routinely
#         carries a compaction notice far above a genuinely ended turn, so a
#         first-match read reports that pane backwards.
#
# ⚠️ .an ENDED TURN IS NOT A HALT on its own — every clone between instructions
#         has one. the CALLER owns that join: what makes it actionable is an
#         ended turn beside a box that holds an undrained message. this owns
#         only the text discriminator, the same bound cap/plea/escalation carry.
#
######################################################################
# .what = a turn that ended on a DECLINED permission modal. echoes the
#         declined clause (`update to <path>`, `bash command`, …), or naught.
#
# 🔴 .why it is its own discriminator, and not a case of turn_ended
#         __duct_pane_turn_ended keys on claude's epilogue — `✻ Cogitated for
#         12s`. claude prints NO epilogue after a decline. it prints the tool
#         result and stops. so the one shape whose turn most reliably ends is
#         the one shape that detector is structurally blind to.
#
# 🔴 .measured 2026-09-18 — rhachet-roles-bhrain.beav.feat-acceptance-under
#         -5min, on branch bert/feat-goal-init. the pane's last content:
#           ● Update(blackbox/driver.route.stack.acceptance.test.ts)
#             ⎿  User rejected update to blackbox/driver.route.stack.accept…
#         then an EMPTY ❯ box, `⏵⏵ accept edits on`, and no frame. the clone
#         had sat there since. every instrument called it healthy:
#           crew.poll → `😶 at work`, status `inflight`
#           crew.heal → `absent any move to make`
#           --healable → named it NOT AT ALL
#         a human found it by eye and asked "why is it still frozen?"
#         ⇒ clamped verbatim at
#           work/.test/.assets/pane.park.turn-ended-on-a-declined-edit.log
#
# ⚠️ .why the cure is SURFACE, never a nudge
#         a decline is a DELIBERATE verdict by a party who was at the
#         keyboard — a human, or a supervisor answering a modal under
#         rule.require.babysit-permission-approval. no detector can tell the
#         two apart, and neither may be overturned by a tool. so this names
#         the park and stops; the retry is the decliner's call
#         (rule.forbid.steer-a-clone-beyond-a-permission-key).
#         ⇒ the DEFECT was never the decline. it is that no instrument told
#           anyone the clone parked behind it.
#
# ⚠️ .this is a FACT, never a box verdict — the same `TURN ENDED SEEN` shape
#         its peer above carries. the JOIN (an empty box, no live frame) is
#         the caller's, because only the caller knows what it wants to do
#         about a decline under a turn that is still live.
#
# in: $1 = the pane text. echoes the declined clause, or an empty string.
__duct_pane_declined() {
  local flat="${1:-}" hit=""
  hit="$(printf '%s\n' "$flat" \
    | sed 's/\x1b\[[0-9;]*m//g' \
    | grep -aoE 'User rejected [a-z]+ to [^[:space:]]+|User rejected [a-z]+' \
    | tail -n 1 \
    | sed 's/^User rejected //; s/[[:space:]]*$//')"
  [[ -n "$hit" ]] || return 1
  printf '%s\n' "$hit"
}

# in: $1 = the pane text. echoes the ended-turn clause, or an empty string.
__duct_pane_turn_ended() {
  local flat="${1:-}" hit=""
  hit="$(printf '%s\n' "$flat" \
    | sed 's/\x1b\[[0-9;]*m//g' \
    | grep -aoE '(✻|✽|✢|·|∗|⋆)[[:space:]]+[A-Z][a-z]+[[:space:]]+for[[:space:]]+[0-9][^(…]*' \
    | tail -n 1 \
    | sed 's/^[^[:space:]]*[[:space:]]*//; s/[[:space:]]*$//')"
  [[ -n "$hit" ]] || return 1
  printf '%s\n' "$hit"
}

# 🔴 .what = the clone's turn is LIVE, RIGHT NOW — it is mid-work this instant.
#
# .why it is NOT the negation of its peer above, and that is the whole reason
#         it exists as its own detector. `turn_ended` absent has THREE causes:
#         a live turn · a husk whose spinner died with the process · a pane
#         that simply never drew one. a consumer that read "no ended turn" as
#         "mid-work" therefore claims a fact from an absence, which is the
#         shape `term=partial-audit` names. this ASSERTS the live frame.
#
# 🔴 .why the fleet owed it — a CAP row is judged on a three-fact join and the
#         crew layer only ever had two of them. duct.poll's own cap row states
#         the contract verbatim: `(scrollback; join to reset-vs-now + STILL to
#         judge)`. git.crew.poll joined reset-vs-now (`__cap_stale`) and a live
#         BOX, and never stillness — so a clone whose cap banner had scrolled
#         into history while it worked was graded `🚫 limited` and nudged.
#
#         measured 2026-09-18, two trees in one tick — both mid-turn, both
#         with a cap banner far up in scrollback, both rendered
#         `🚫 limited — ⏰ reset PASSED — healable, nudge to retry`. heal, on
#         the SAME tree in the SAME tick, answered "this clock has NOT
#         passed". two instruments, one pane, opposite verdicts, and the
#         poll's was the wrong one.
#
# ⚠️ .box motion is the WRONG stillness instrument here, and every extant one
#         keys on the box: `CLONE QUIET`, `✋ BOX UNMOVED`, the CREW_MOTION
#         ages. a clone mid-turn holds an EMPTY box that STAYS empty, so each
#         reads "unchanged" and is right to. the TURN is a different subject
#         than the BOX, and this is the instrument for the first.
#
# 🔴 .the anchor is the PARENTHESIZED TOKEN COUNTER, never the duration
#         an ENDED turn draws a duration in the identical shape:
#
#           ✻ Sauteed for 6m 20s                      ← the turn is OVER
#           ✻ Simmered… (6m 20s · ↓ 8.0k tokens)      ← the turn is LIVE
#
#         so `<n>m <n>s` alone matches both. the `(… · ↓/↑ <n> tokens` frame
#         is drawn only while a turn runs. this is the same anchor
#         `__crew_turn_stats` already carries one layer up — clamped there at
#         [case31] — stated here because duct.poll holds the pane and crew
#         does not.
#
# ⚠️ .it judges the LAST such frame in the pane. a pane holds scrollback, so
#         an older live frame can still be on screen under a newer state; the
#         last match is the newest.
#
# in: $1 = the pane text. echoes the live-turn clause, or an empty string.
__duct_pane_turn_live() {
  local flat="${1:-}" hit=""
  hit="$(printf '%s\n' "$flat" \
    | sed 's/\x1b\[[0-9;]*m//g' \
    | grep -aoE '\(([0-9]+h )?([0-9]+m )?[0-9]+s · [↓↑] [0-9.]+k? tokens' \
    | tail -n 1 \
    | sed 's/^(//; s/[[:space:]]*$//')"
  [[ -n "$hit" ]] || return 1
  printf '%s\n' "$hit"
}

# .what = a QUEUED message parked above the input box — a human's line, already
#         submitted, and NOT yet consumed. echoes the message text.
#
# 🔴 .why = the box ladder's own `queued` arm keys on claude's footer hint,
#         `to edit queued messages`. claude prints that hint only WHILE A TURN
#         RUNS. the moment the turn ends the hint goes and the queued row
#         stays — so the arm goes blind at exactly the moment the queue stops
#         to drain, which is the only moment the fact is actionable at all.
#
#         measured 2026-09-16 on `feat-dispute-or-concede-review-budget`, a ⭐
#         tree. its mechanic asked the human a ⭐ question about which Fireworks
#         account the restore had reached. the human answered
#         `fireworks is back now`. the turn had already ended, so the message
#         queued and never drained — it sat there across TWO full babysit ticks
#         while every poll classified that box `empty` and rendered no queued
#         row at all.
#
#         ⇒ a human's answer, lost in plain sight, on a tree whose stone was
#           BLOCKED on the very gate that answer opened.
#
# 🔴 .the discriminator is the BACKGROUND, never the caret. claude draws a
#         queued row as a highlight — a background SGR before its `❯`:
#
#           ESC[38;5;239m ESC[48;5;237m ❯ ESC[38;5;231m fireworks is back now
#                         └─ background ─┘
#
#         the input box's own caret, an autocomplete ghost, and a modal's
#         selected option each carry a FOREGROUND colour and no background at
#         all — so the test is structural rather than a phrase that moves with
#         claude's copy.
#
# .the second cue is free: the payload must be NON-EMPTY. a background with no
#         text after it is chrome, never a message (rule.require.a-cue-is-not-
#         a-claim — two nets, neither can be wrong, and a redundant one costs a
#         line).
#
# ⚠️ .this is a FACT, never a box verdict. it rides BESIDE the box so the stone
#         still renders — the `TURN ENDED SEEN` pattern. to set `box="queued"`
#         here would assert the pane is at a gate and suppress the route's own
#         record, which is the defect the survey dream names.
#
# in: $1 = the pane text, escapes INTACT. echoes the queued text, or empty.
__duct_pane_queued_row() {
  local flat="${1:-}" esc ln rest hit=""
  esc="$(printf '\033')"
  # the LAST highlighted row in the pane, by line number
  ln="$(printf '%s\n' "$flat" \
    | grep -an "${esc}\[48;[0-9;]*m[^❯]\{0,8\}❯" \
    | tail -n 1 | cut -d: -f1)"
  [[ -n "$ln" ]] || return 1

  # 🔴 .the THIRD cue, and the one that makes the other two safe: is the row
  #    still PARKED, or was it already CONSUMED?
  #
  #    the background highlight is NOT a queue marker. it is how claude renders
  #    a HUMAN TURN in its transcript, and it persists for every past turn for
  #    the life of the pane. so a bare background test fires on any pane where
  #    a human has ever spoken — which is nearly the whole fleet.
  #
  #    measured 2026-09-16 on `rhachet-brains-fireworksai.beav.fix-prompt-cache-
  #    affinity`: FIVE highlighted rows in one pane — `oh dude system prompt is
  #    perfect, nice`, `that is the prefix`, `lovely`, `amazing`, `amazing` —
  #    every one of them already answered. heal read the last, called the crew
  #    HALTED, and relayed `amazing` to a clone that had replied to it two turns
  #    earlier. a FALSE HEAL, and a duplicate message put in a human's mouth.
  #
  #    ⇒ what parts PARKED from CONSUMED is not the row. it is what FOLLOWS it.
  #      claude marks its own output with `●`, so an assistant bullet anywhere
  #      below the row proves the clone read it. a genuinely parked row has no
  #      line under it but the box chrome — the rules, the empty caret, and the
  #      mode footer.
  #
  #    ⚠️ this is the cue whose absence a green clamp cannot reveal. the first
  #      fixture was a REAL parked pane and the detector was right about it. the
  #      defect lives entirely in the panes the fixture did not hold
  #      (rule.require.enumerate-before-you-name: one instance confirms naught).
  rest="$(printf '%s\n' "$flat" | tail -n "+$((ln + 1))" | sed 's/\x1b\[[0-9;]*m//g')"
  printf '%s\n' "$rest" | grep -q '^[[:space:]]*●' && return 1

  hit="$(printf '%s\n' "$flat" | sed -n "${ln}p" \
    | sed 's/\x1b\[[0-9;]*m//g' \
    | sed 's/\xc2\xa0/ /g' \
    | sed 's/^[^❯]*❯//' \
    | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"
  [[ -n "$hit" ]] || return 1
  printf '%s\n' "$hit"
}

# .what = has this clone LOST `--permission-mode acceptEdits`? echoes the offer
#         line that proves it, and returns 0. empty + rc 1 otherwise.
#
# 🔴 .why = a permission mode is a LAUNCH FLAG, never a property of the
#         conversation. `git.tree.behavior` boots every clone with
#         `--permission-mode acceptEdits`, so a resume, a reboot, or a
#         hand-started clone that drops the flag comes back in DEFAULT mode —
#         alive, productive, and stopped at a permission modal for EVERY file
#         write it makes.
#
#         crewwork.sh already carries the hazard at two sites and ends with the
#         sentence this detector exists to refute: "the operator reads that
#         stall as a wedge rather than as a mode it silently lost". until now
#         not one instrument read the mode, so the hazard was documented and
#         undetectable at once.
#
#         measured 2026-09-18 on `rhachet-roles-bhrain.beav.feat-acceptance-
#         under-5min`: SIX supervisor keys in one window, one per `Update`, each
#         read as ordinary work. the human's verdict was "it is genuinely
#         frozen" — and the poll had named a modal every tick without once
#         naming its cause, so the cure routed to a keyboard rather than to the
#         tool (rule.forbid.byhand-heal).
#
# 🔴 .the discriminator is claude's OWN OFFER, never an ABSENCE
#         option 2 of an edit modal reads `Yes, allow all edits during this
#         session (shift+tab)`, and claude prints that offer ONLY when the mode
#         is off. so this is POSITIVE evidence of the fact.
#
#         the tempting test — the absent `⏵⏵ accept edits on` footer — is the
#         husk defect exactly: a footer goes absent on a narrow pane, a scrolled
#         capture, or any overlay, so its absence proves the READ rather than
#         the mode (define.invariant.crew.husk.discriminator-parity).
#
# ⚠️ .a BASH modal is NOT this. acceptEdits auto-accepts EDITS and no other act,
#         so a bash approval is the normal state of a healthy clone — its option
#         2 reads `Yes, and don't ask again for <cmd> commands in <dir>`, which
#         carries no `allow all edits`. a detector that fired there would name
#         the whole fleet mode-lost. clamped at [case32] [t3].
#
# ⚠️ .the BOUND — this reads the MODAL shape ALONE. a mode-lost clone parked at
#         a quiet box carries the same defect and draws no offer, so it is out
#         of reach here, and the absence-test that would reach it is the one
#         refused above. the gap is clamped at [case32] [t2] rather than papered
#         over (rule.require.enumerate-before-you-name).
#
# 🔴 .the SECOND cue — is the modal CURRENT, or answered scrollback?
#         a raw capture holds the transcript, so an offer from a modal already
#         answered can sit far above live work. claude marks its own output with
#         `●`, so a bullet BELOW the offer proves the clone moved on. that is
#         the parked-vs-consumed test __duct_pane_queued_row already runs,
#         reused verbatim.
#
# in: $1 = the pane text. echoes the offer line, or an empty string.
__duct_pane_mode_lost() {
  local flat="${1:-}" plain ln rest hit=""
  plain="$(printf '%s\n' "$flat" | sed 's/\x1b\[[0-9;]*m//g')"

  # the LAST offer in the pane, by line number — a pane may hold several
  ln="$(printf '%s\n' "$plain" | grep -an 'allow all edits' | tail -n 1 | cut -d: -f1)"
  [[ -n "$ln" ]] || return 1

  # answered already? then the clone moved on and this is scrollback
  rest="$(printf '%s\n' "$plain" | tail -n "+$((ln + 1))")"
  printf '%s\n' "$rest" | grep -q '^[[:space:]]*●' && return 1

  hit="$(printf '%s\n' "$plain" | sed -n "${ln}p" \
    | sed 's/\xc2\xa0/ /g' \
    | sed 's/^[[:space:]]*[0-9]\{1,2\}\.[[:space:]]*//' \
    | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"
  [[ -n "$hit" ]] || return 1
  printf '%s\n' "$hit"
}

# .what = is this extracted plea a SMEAR — text adjacent on screen that was
#         never one typed statement? exit 0 = smeared, so DROP it.
#
# .why  = the plea extractor folds the pane with `tr '\n' ' '` before it
#         matches, because a real grant command WRAPS on a narrow pane and a
#         row-wise pattern cannot cross that wrap. that fold is correct and it
#         has a cost: on a SPLIT pane, two columns sit on one physical row, so
#         after the fold the left column's text sits adjacent to the right
#         column's, and the extractor's 200-char gap spans both happily.
#
# 🔴 .the measured case — 2026-09-15, `feat-dispute-or-concede-review-budget`,
#         a ⭐ tree. its foreman held an nvim split over a test snapshot,
#         `driver.route.contemplated-help.acceptance.test.ts.snap`, whose
#         content is `route.stone.set --help` output — its `examples:` block
#         included. the poll rendered, as a HUMAN-only grant ask:
#
#           "route.stone.set --stone route.stone.set --stone 1.vision --as
#            passed │ │ ├  driver.route.peer-budget-rewound.acceptance.test.
#            ts.snap M route.stone.set --stone route.stone.set --stone
#            1.vision --as approved"
#
#         not one clone asked for a grant. the "command" is DOCUMENTATION in a
#         fixture, read by an editor, stitched across a column boundary.
#
#         ⇒ this is the worst grade a human-gate surface can earn: it does not
#         merely miss an ask, it FABRICATES one. #25 and #82 cured two other
#         plea false-positive shapes; this is the third, and the only one that
#         invents its own text rather than resurface a stale one.
#
# .the two cues, and they are NETS rather than claims
#         neither can be wrong — each fires or it does not — so two cost one
#         line and can only both-miss or one-catch (rule.require.a-cue-is-not-
#         a-claim). a redundant cue here carries no drift risk at all.
#
#         1. THE VERB TWICE. a typed command names `route.stone.set` exactly
#            once. two or more is a concatenation, full stop. unarguable, and
#            it catches every row of the measured pane — both columns carry
#            the verb, so any match off that pane names it 2+ times.
#         2. A BARE `│`. the skill's own grant banner draws `├─` and `└─`
#            (glyph + dash) and never a lone vertical, while a file tree, a
#            split gutter, and a status line each do.
#
# ⚠️ .the residual gap, recorded rather than papered over
#         a split whose columns happen to place ONE verb beside an unrelated
#         `--as approved`, with no vertical between them, still slips. cue 1
#         needs two verbs and cue 2 needs a glyph. a fuzzier anchor would
#         close it and would start to drop real pleas, which is the trade this
#         refuses — a missed plea still leaves the stone rendered above it,
#         while a fabricated one sends a human to run a command nobody asked
#         for.
__duct_plea_is_smeared() {
  local plea="${1:-}" verbs=0
  [[ -n "$plea" ]] || return 1
  # cue 1 — the verb named more than once
  verbs="$(printf '%s\n' "$plea" | grep -aoF 'route.stone.set' | wc -l | tr -d ' ')"
  [[ "${verbs:-0}" -gt 1 ]] && return 0
  # cue 2 — a bare vertical, which no grant banner draws
  [[ "$plea" == *'│'* ]] && return 0
  return 1
}

######################################################################
# .what = strip a pane's ANSI escapes for a human read, and FENCE any
#         autocomplete GHOST on the input-box line.
#
#         in  = a pane capture that carries ANSI escapes, on stdin
#         out = the same pane, escapes removed, each ghost run rendered as
#               `👻[ghost: <text>]`, plus one guidance line when any fenced
#
# .why  = the non-raw read used to capture with `-p` and NO `-e`, so the
#         dim/white distinction was destroyed AT CAPTURE. a shell-history
#         ghost then printed identically to a message a human composed.
#
# 🔴 .the cost is unlike every other defect in this file. the others spend
#         time; this one spends the HUMAN'S AUTHORITY. measured 2026-09-15 on
#         two ⭐ trees in one tick, and in BOTH the ghost completed to the
#         human-only grant that tree's own plea named — because that is what
#         sat in the shell's history. so the render invited a supervisor to
#         report a grant nobody gave, or to submit one with `--keys Enter`
#         (rule.forbid.self-grant-human-gates).
#
# ⚠️ .the arithmetic that hid it: reverse-video `o` + ghost `verrule it`
#         concatenate, escape-free, to `overrule it`. a whole word out of ONE
#         keystroke, and no glyph in the plain render marks the seam. a
#         supervisor had to remember `--raw` — and a check you must remember
#         is a defect in the TOOL (rule.always.upgrade-crew-tools-as-you-use-them).
#
# .SCOPE — the input-box line alone, keyed on the discriminator duct.poll
#         already paved at duct.poll.sh:354-358: the `❯` whose NEXT line
#         carries a `───` rule (rule.always.reuse-pavement-before-improvise).
#         claude paints dim runs across a whole pane — diff context, `(ctrl+o
#         to expand)`, status chrome — so a filter keyed on dimness ALONE
#         would fence all of it and rewrite every render in the fleet.
#
# ⚠️ .the fallback is deliberate, and it is the DETECT bias. where a `tail`
#         window cuts the box's own `───` chrome away, the box is
#         undetectable by the paved rule; we then fence the last `❯` line
#         instead. a false fence costs one spurious marker; a miss costs a
#         fabricated grant. the asymmetry runs entirely one way.
#
# 🔴 .the ONE dim run on the box line that is NOT a completion — claude's own
#         `Press up to edit queued messages` hint. measured 2026-09-17 on
#         rhachet-roles-bhrain.beav.feat-peer-review-parallelism/mechanic: a
#         supervisor's steer was QUEUED against a live turn, claude printed the
#         hint beneath it, and this filter fenced the hint and declared
#         `no one composed it`. both halves false — the supervisor composed it,
#         and claude wrote the hint.
#
#         ⚠️ the harm is an INVERTED state, not merely a wrong label. `👻 ghost`
#         and `📬 queued` prescribe the same act (do not press Enter), so the
#         render reads plausible — but they report opposite worlds. a ghost says
#         NO message awaits delivery; queued says one does. a supervisor who
#         trusts the ghost concludes its steer never landed and sends it a
#         second time, into a live clone.
#
#         ⇒ the eleventh instance of `rule.require.enumerate-before-you-name`:
#         the ghost arm enumerates DIM TEXT ON THE BOX LINE, and claude's own
#         hint carries that property exactly. the discriminator that parts them
#         was already declared in this file (__duct_pane_queued_row) and this
#         filter did not reach for it.
#
# .note = SGR intensity is a STATE, not a flag on the text: `ESC[0;2m` opens
#         dim, `ESC[39m`/`ESC[49m` do NOT close it, and only `0`/`22`/a bare
#         `ESC[m` do. a naive "is there a 2m on this line" test would fence
#         the real keystroke too, so this tracks the state across the line.
#         a 256-color grey (`ESC[38;5;246m`) is NOT dim and never fences.
__duct_mark_pane_ghosts() {
  awk '
    # the SGR state machine. returns the dim state AFTER this sequence.
    function next_dim(seq, dim,   body, n, i, parts) {
      if (seq !~ /m$/) return dim              # not an SGR seq — a cursor move, etc
      body = substr(seq, 3, length(seq) - 3)   # drop the ESC[ prefix and the m suffix
      if (body == "") return 0                 # ESC[m is ESC[0m — a full reset
      n = split(body, parts, ";")
      for (i = 1; i <= n; i++) {
        if (parts[i] == "" || parts[i] == "0" || parts[i] == "22") dim = 0
        else if (parts[i] == "2") dim = 1
      }
      return dim
    }
    function fence(text, dim) {
      if (text == "") return ""
      if (!dim) return text
      # 🔴 claudes own QUEUED-MESSAGES hint is dim chrome, never a completion.
      #    this file already declares the literal, 200 lines up: the box
      #    ladders `queued` arm keys on `to edit queued messages`
      #    (__duct_pane_queued_row). the fencer had no knowledge of it, so it
      #    named the one dim run on the box line that is claudes OWN text.
      if (index(text, "to edit queued messages") > 0) return text
      fenced = 1
      return "👻[ghost: " text "]"
    }
    function plain(s) { gsub(/\033\[[0-9;?]*[A-Za-z]/, "", s); return s }
    function marked(s,   res, dim, pre, seq) {
      res = ""; dim = 0
      while (match(s, /\033\[[0-9;?]*[A-Za-z]/)) {
        pre = substr(s, 1, RSTART - 1)
        seq = substr(s, RSTART, RLENGTH)
        res = res fence(pre, dim)
        s = substr(s, RSTART + RLENGTH)
        dim = next_dim(seq, dim)
      }
      return res fence(s, dim)
    }
    {
      buf[NR] = $0
      # the paved box rule: a ❯ line whose NEXT line carries a rule. the last
      # such pair wins, exactly as duct.poll.sh:355-357 takes the last.
      if (prev_caret && index($0, "───") > 0) box = NR - 1
      prev_caret = (index($0, "❯") > 0)
      if (prev_caret) caret_last = NR
    }
    END {
      # the detect-bias fallback — see the header
      if (!box) box = caret_last
      for (i = 1; i <= NR; i++) print (i == box ? marked(buf[i]) : plain(buf[i]))
      if (fenced) {
        print "⚠️  the box holds a GHOST — a shell-history completion, NOT typed text"
        print "   └─ do NOT submit it. no one composed it, so an Enter here fabricates a message"
      }
    }
  '
}
