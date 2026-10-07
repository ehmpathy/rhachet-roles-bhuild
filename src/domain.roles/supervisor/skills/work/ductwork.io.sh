#!/usr/bin/env bash
######################################################################
# ductwork.io — the STREAM: duct.send into a pane, duct.read out of it
#
# 🔴 .a PART of ductwork.sh — sourced, never executed, and only BY ductwork.sh.
#     a caller sources ductwork.sh, which loads every part. see
#     __duct_load_parts there for why the lib is cut into parts at all.
#
# .holds = duct.send and duct.read
######################################################################

duct.send() {
  local uri=""
  local what=""
  local keys=""      # raw TUI key(s), NO Enter appended — terminal control
  local await=0      # seconds to wait for the pane to fall idle
  local anyway=0     # send into a busy pane on purpose (answer a prompt)
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --on) uri="$2"; shift 2 ;;
      --what) what="$2"; shift 2 ;;
      --keys) keys="$2"; shift 2 ;;
      --await) await="${2:-300}"; shift 2 ;;
      --anyway) anyway=1; shift ;;
      *) echo "✋ duct.send: unknown arg '$1'" >&2; return 2 ;;
    esac
  done
  if [[ -z "$uri" ]]; then
    echo "✋ duct.send: --on required" >&2
    return 2
  fi
  if [[ -z "$what" && -z "$keys" ]]; then
    echo "✋ duct.send: one of --what or --keys required" >&2
    return 2
  fi
  if [[ -n "$what" && -n "$keys" ]]; then
    echo "✋ duct.send: --what and --keys are exclusive" >&2
    return 2
  fi

  ####################################################################
  # the --keys arm.
  #
  # ⚠️ this arm lived ONLY in duct.send.sh, the skill. the lib function
  #    took --on/--what/--await/--anyway and rejected --keys outright — so
  #    `crew.send --keys 2`, which calls THIS function, died on
  #    `unknown arg '--keys'` while the skill's own --help advertised it.
  #
  # .why it went unseen: the skill and the lib are two surfaces over one
  #      verb, and only the skill was ever driven by hand. the crew layer
  #      is the first caller to reach the lib's send with a keystroke, so
  #      the split surfaced the moment a supervisor answered a modal
  #      through `git.crew.send` rather than `duct.send`
  #      (rule.always.entool-the-layer-you-drop-below).
  #
  # ⚠️ --keys never reaches the BUSY guard below, and that is deliberate:
  #    a keystroke is aimed AT the program that holds the pane. a modal IS
  #    the busy state, so a guard here would refuse every approval.
  ####################################################################
  if [[ -n "$keys" ]]; then
    __duct_parse_uri "$uri" || return 2

    if __duct_is_remote; then
      if ! ssh -n "$DUCT_HOST" "$(__duct_tmux_cmd)has-session -t '$DUCT_SESSION'" 2>/dev/null; then
        echo "✋ duct.send: session '$DUCT_SESSION' is absent on '$DUCT_HOST'" >&2
        echo "   note: this asked the GROVE, not this box" >&2
        echo "   fix: confirm the grove is awake — rhx git.grove.wake $DUCT_HOST" >&2
        return 2
      fi
      # shellcheck disable=SC2086
      ssh -n "$DUCT_HOST" "$(__duct_tmux_cmd)send-keys -t '$DUCT_SESSION' $keys"
      echo "🔧 $uri keys sent: $keys"
      __duct_keys_are_not_a_receipt
      return 0
    fi

    if ! __duct_tmux has-session -t "$DUCT_SESSION" 2>/dev/null; then
      echo "✋ duct.send: session '$uri' is absent on this machine" >&2
      echo "   fix: open the duct first — duct.open --on '$uri'" >&2
      return 2
    fi
    # each space-separated token is its own key, and NO Enter is appended
    # shellcheck disable=SC2086
    __duct_tmux send-keys -t "$DUCT_SESSION" $keys
    echo "🔧 $uri keys sent: $keys"
    __duct_keys_are_not_a_receipt
    return 0
  fi

  # `|| return` propagates a bad URI. without it the parser's error printed and
  # the verb carried on with an empty host+session — a failhide that would ssh
  # nowhere and blame the session (rule.forbid.failhide)
  __duct_parse_uri "$uri" || return 2

  if __duct_is_remote; then
    # `|| probe=$?` — see the probe's own header. a BARE call here is a failing
    # command under the wrappers' `set -e`, so the shell dies with ssh's 255
    # and this line never runs
    local probe=0
    __duct_probe_remote_session || probe=$?
    if [[ $probe -eq 255 ]]; then
      __duct_say_unreachable send
      return 2
    fi
    if [[ $probe -ne 0 ]]; then
      echo "✋ duct.send: reached '$DUCT_HOST', but session '$uri' is absent" >&2
      echo "   fix: open the duct first —" >&2
      echo "     duct.open --on '$uri'" >&2
      return 2
    fi
  else
    if ! __duct_tmux has-session -t "$DUCT_SESSION" 2>/dev/null; then
      echo "✋ duct.send: session '$uri' is absent on this machine" >&2
      echo "   fix: open the duct first — duct.open --on '$uri'" >&2
      return 2
    fi
  fi

  ####################################################################
  # the BUSY guard.
  #
  # a send to a busy pane does not queue — it lands in the held program's
  # STDIN. observed live: a `true` sent to a duct mid-`apt` was eaten by apt,
  # and surfaced in the scrollback spliced into apt's own progress line.
  #
  # that instance was harmless. the shape is not: the same slip puts any text
  # into whatever holds the terminal — an editor, an `rm -i` prompt, a `sudo`
  # password read. and it is SILENT, because tmux reports a delivered keystroke
  # as success whoever consumed it.
  #
  # so refuse by default and name the two ways forward
  # (rule.prefer.prevent-over-correct: make the wrong act hard, not merely
  # documented; rule.require.errors-name-the-fix).
  ####################################################################
  if [[ "$anyway" -eq 0 ]]; then
    local held elapsed=0
    held=$(__duct_pane_command)

    # --await: the pane is busy for a REASON; wait it out rather than refuse
    while [[ "$await" -gt 0 ]] && ! __duct_pane_is_idle "$held"; do
      [[ "$elapsed" -ge "$await" ]] && break
      sleep 2
      elapsed=$(( elapsed + 2 ))
      held=$(__duct_pane_command)
    done

    if [[ -n "$held" ]] && ! __duct_pane_is_idle "$held"; then
      echo "✋ duct.send: '$uri' is BUSY — '$held' holds the pane" >&2
      echo "" >&2
      echo "   what: a send is a keystroke, not a queued command. it would land" >&2
      echo "         in $held's stdin, where tmux still reports it delivered" >&2
      echo "" >&2
      if [[ "$await" -gt 0 ]]; then
        echo "   note: waited ${elapsed}s and it is still busy" >&2
        echo "" >&2
      fi
      echo "   fix: wait for it, then send —" >&2
      echo "     duct.send --on '$uri' --await 600 --what '<cmd>'" >&2
      echo "" >&2
      echo "   or, to type INTO $held on purpose (answer its prompt) —" >&2
      echo "     duct.send --on '$uri' --anyway --what '<input>'" >&2
      return 2
    fi

    # an empty read means tmux could not be asked. do NOT treat that as idle —
    # that would be a failhide, and the send would be the very slip this guard
    # exists to prevent (rule.forbid.failhide)
    if [[ -z "$held" ]]; then
      echo "✋ duct.send: could not read what holds '$uri'" >&2
      echo "   what: tmux gave no pane_current_command, so BUSY and IDLE are" >&2
      echo "         both possible and a send may reach a program's stdin" >&2
      echo "   fix: look first — duct.read --on '$uri'" >&2
      echo "        then, if it is at a prompt — duct.send --on '$uri' --anyway ..." >&2
      return 2
    fi
  fi

  ####################################################################
  # 🔴 the payload is sent with `-l`, and the Enter is its OWN send.
  #
  # .why  `send-keys` looks each argument up in its KEY TABLE before it falls
  #       back to literal text. so a `--what` whose value happens to name a key
  #       is delivered AS THAT KEY, and the text is never typed at all.
  #
  # ⚠️ this contradicts the verb's own contract, one screen up: `--keys` is
  #    declared as keystrokes ("each space-separated token is its own key") and
  #    `--what` as text. both were then handed to the same parser, so one
  #    surface carried two senses with one implementation
  #    (rule.forbid.domain-term-ambiguity, in code rather than in a word).
  #
  # .the measurement, 2026-09-15 — `duct.send --what 'Up'` on a local pane:
  #
  #      ^[[A    : not found
  #
  #    `^[[A` is ESC [ A — the up-arrow. tmux resolved the word `Up` to that
  #    key and sent the escape sequence; the shell then tried to RUN it. a
  #    one-word reply to a clone is an ordinary steer, and `C-c` / `C-u` sit in
  #    the same class and are worse: a TEXT send that interrupts whatever
  #    program holds the pane.
  #
  # .the incident it cures, 2026-09-15 (#91) — a grove send whose payload held
  #    `⭐` and two em dashes exited 1 with tmux's own `not in a mode` printed
  #    six times, then left the pane to eat every keystroke, so the ASCII retry
  #    reported `sent` and vanished. ⚠️ that glyph payload does NOT reproduce on
  #    the local arm (clamped green at [case18]), so the specific byte that
  #    resolved to a mode key is UNNAMED. `-l` is correct regardless:
  #    it disables the lookup outright, which retires the class rather than one
  #    member of it — and a lookup that cannot fire cannot enter a mode, so the
  #    swallowed-keystroke half is PREVENTED rather than repaired
  #    (rule.prefer.prevent-over-correct, rung 1).
  #
  # .the precedent is already in this corpus: `git.grove.auth.sh` pastes a
  #    login code with `send-keys -l` and submits with a SEPARATE
  #    `send-keys Enter`, for the same reason, and it is clamped. this arm
  #    simply never got it.
  #
  # ⚠️ the Enter must NOT carry `-l` — it IS a key, and `-l` would type the
  #    five characters `Enter` into the pane.
  #
  # 🟡 KNOWN LIMIT: a payload that begins with `-` is still read as a tmux
  #    flag. `--` would close that, and tmux's support for it is undocumented
  #    per-command, so it is left unverified rather than guessed — recorded on
  #    #91 rather than papered over here.
  ####################################################################
  if __duct_is_remote; then
    ##################################################################
    # ⚠️ a REMOTE send crosses TWO shells, so the payload must be quoted
    #    for the far one BY US. the local arm below need not — it hands
    #    tmux an argv entry, and argv takes no quotes at all.
    #
    # .why it cost a mangled boot, 2026-09-02. the line read
    #
    #      ssh "$H" "... send-keys -t '$S' '$what' Enter"
    #
    #      so `$what` was pasted RAW inside single quotes. a payload that
    #      holds a `'` of its own therefore CLOSES that quote, and the
    #      remainder arrives at the grove unquoted — where the remote
    #      shell word-splits it and hands tmux one argv entry per word.
    #      tmux joins argv entries with NO separator, so
    #
    #        claude ... 'hi, please drive'   ->   hi,pleasedrive
    #
    #      the spaces vanish, the quotes vanish, and the comma survives.
    #      a clone booted with that prompt reads a word nobody sent it.
    #
    # .why it is not a term=false-report but a worse thing: `duct.send`
    #      reported `🔧 sent` and it HAD sent — the bytes it was handed
    #      went over, faithfully. the corruption happened in the layer
    #      BELOW its subject, so no read of the pane by this function
    #      would have caught it. `rule.require.verify-after-send` already
    #      names this shape one layer up (a payload eaten by the shell
    #      before the tool sees it); here the eater is the shell we
    #      ourselves construct, which makes it ours to PREVENT rather
    #      than ours to detect.
    #
    # .why the LOCAL arm is untouched and must stay so: it passes "$what"
    #      as one argv entry to tmux directly. to escape it there would
    #      inject literal backslashes into the keystroke.
    #
    # .how the escape: end the quote, emit a backslash-quote, reopen it —
    #      `'` becomes `'\''`. it is the one form safe for EVERY byte,
    #      since a single-quoted region in sh honors no other escape.
    ##################################################################
    local what_q="${what//\'/\'\\\'\'}"
    if ! ssh -n "$DUCT_HOST" "$(__duct_tmux_cmd)send-keys -t '$DUCT_SESSION' -l '$what_q' && $(__duct_tmux_cmd)send-keys -t '$DUCT_SESSION' Enter"; then
      echo "💥 duct.send: failed to send to '$uri'" >&2
      return 1
    fi
  else
    if ! __duct_tmux send-keys -t "$DUCT_SESSION" -l "$what" ||
      ! __duct_tmux send-keys -t "$DUCT_SESSION" Enter; then
      echo "💥 duct.send: failed to send to '$uri'" >&2
      return 1
    fi
  fi
  echo "🔧 $uri sent"
}

######################################################################
# .what = read a duct's pane, on EITHER host, with or without the escapes
#
# .why --raw is no longer local-only, and why that mattered
#      it was declared local-only on the grounds that "a remote raw read
#      is unsupported, and a plain fallback would hand you color-blind text
#      while it claims to be raw". the second half is right and the first
#      half was never true: `capture-pane -p -e` is the same flag over ssh
#      as it is here.
#
#      the cost of the false half was the whole cloud fleet's stall
#      detector. `duct.poll`'s box classifier needs the escapes, so it was
#      written to run ONLY when the host is empty — and every grove duct
#      fell to its `unknown` default. measured 2026-09-03: 11 of 11 grove
#      ducts read `❔unknown` while no local duct ever did. `unknown` means
#      "treat as a ghost", so a grove clone stalled on a live permission
#      modal could never report `🚧 PROMPT`, and its stone never rendered.
#      a human caught a halted grove crew by eye that the sweep was
#      structurally unable to see.
#
#      ⇒ that is a `term=false-report` in the instrument the babysit tick
#        is built on: the poll did not fail, and its claim was untrue.
#
# .the guarantee that is KEPT
#      a raw read still never falls back to a stripped one. it captures with
#      the escapes on both arms, or it fails — the lie the local-only guard
#      was written to prevent stays prevented, by the code rather than by a
#      refusal to run.
#
# .why --raw prints no header
#      it is machine-read. the `🔭 uri (local)` line is for a human, and a
#      classifier that greps a pane must not have to strip our own chrome.
######################################################################
duct.read() {
  local uri=""
  local lines=500
  local raw=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --on) uri="$2"; shift 2 ;;
      --lines) lines="$2"; shift 2 ;;
      --raw) raw=1; shift ;;
      *) echo "✋ duct.read: unknown arg '$1'" >&2; return 2 ;;
    esac
  done
  if [[ -z "$uri" ]]; then
    echo "✋ duct.read: --on required" >&2
    return 2
  fi

  # .what = drop the blank rows tmux pads BELOW a pane's last content line
  #
  # .why  = `capture-pane` pads its output to the full pane height. a BUSY pane
  #         ends at its last line, so a bare `tail -n N` is right. an IDLE pane
  #         does not — its prompt sits near the top with empty rows beneath, so
  #         the last N rows are ALL pad and the tail returns no signal.
  #
  #         measured 2026-09-03, on an idle foreman:
  #           duct.read --lines 20 --raw  → no signal at all
  #           duct.read --lines 60        → the prompt, plainly
  #
  #         that is not merely a thin read. `duct.poll` classifies the box from
  #         exactly this call (`duct.poll.sh:327`), and its ladder has no arm
  #         for an empty capture — it asserts "a capture-pane of a live session
  #         is never empty". so the box fell through to its `unread` default,
  #         and since no stone renders for a non-`empty` box, every idle clone
  #         ALSO lost its route position from the sweep.
  #
  # ⚠️ .why a bare `-z` test is not enough: under `--raw` the pad rows still
  #         carry ANSI color resets, so they are non-empty as STRINGS while they
  #         hold no printable char. the escapes must come off before the test —
  #         which is why the non-raw read looked healthy while `--raw` did not.
  __duct_strip_pane_pad() {
    awk '
      {
        buf[NR] = $0
        probe = $0
        gsub(/\033\[[0-9;?]*[A-Za-z]/, "", probe)
        gsub(/[[:space:]]/, "", probe)
        if (probe != "") last = NR
      }
      END { for (i = 1; i <= last; i++) print buf[i] }
    '
  }

  # `|| return` propagates a bad URI. without it the parser's error printed and
  # the verb carried on with an empty host+session — a failhide that would ssh
  # nowhere and blame the session (rule.forbid.failhide)
  __duct_parse_uri "$uri" || return 2

  if __duct_is_remote; then
    # `|| probe=$?` — see the probe's own header. a BARE call here is a failing
    # command under the wrappers' `set -e`, so the shell dies with ssh's 255
    # and this line never runs
    local probe=0
    __duct_probe_remote_session || probe=$?
    if [[ $probe -eq 255 ]]; then
      __duct_say_unreachable read
      return 2
    fi
    if [[ $probe -ne 0 ]]; then
      echo "✋ duct.read: session '$uri' is absent" >&2
      echo "   ├─ what: ssh REACHED '$DUCT_HOST'; tmux holds no session by that name" >&2
      echo "   └─ fix:  rhx git.grove.send <grove> --what 'tmux list-sessions'" >&2
      return 2
    fi
    if [[ -n "$raw" ]]; then
      ssh -n "$DUCT_HOST" "$(__duct_tmux_cmd)capture-pane -t '$DUCT_SESSION' -p -e -S '-$lines'" \
        | __duct_strip_pane_pad | tail -n "$lines"
      return
    fi
    echo "🔭 $uri (cloud)"
    # ⚠️ `-e` even for the NON-raw read, on purpose. without it tmux emits no
    #    escapes at all, so the dim/white distinction is destroyed AT CAPTURE
    #    and a ghost renders as typed text. __duct_mark_pane_ghosts strips the
    #    escapes itself, so this read stays escape-free for a human — VERIFIED
    #    byte-equal to the old plain capture on a live 21-line claude pane,
    #    2026-09-15 (see the filter's header for what the ghost cost).
    ssh -n "$DUCT_HOST" "$(__duct_tmux_cmd)capture-pane -t '$DUCT_SESSION' -p -e -S '-$lines'" \
      | __duct_strip_pane_pad | tail -n "$lines" | __duct_mark_pane_ghosts
  else
    if ! __duct_tmux has-session -t "$DUCT_SESSION" 2>/dev/null; then
      echo "✋ duct.read: session '$uri' is absent on this machine" >&2
      echo "   ├─ what: tmux holds no session by that name" >&2
      echo "   └─ fix:  tmux list-sessions   # what this machine holds" >&2
      return 2
    fi
    if [[ -n "$raw" ]]; then
      __duct_tmux capture-pane -t "$DUCT_SESSION" -p -e -S "-$lines" \
        | __duct_strip_pane_pad | tail -n "$lines"
      return
    fi
    echo "🔭 $uri (local)"
    # `-e` for the same reason as the cloud arm above — see that comment
    __duct_tmux capture-pane -t "$DUCT_SESSION" -p -e -S "-$lines" \
      | __duct_strip_pane_pad | tail -n "$lines" | __duct_mark_pane_ghosts
  fi
}
