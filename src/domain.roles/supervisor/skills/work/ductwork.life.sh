#!/usr/bin/env bash
######################################################################
# ductwork.life — the LIFECYCLE: duct.open ↔ duct.stop, duct.reboot, duct.refresh
#
# 🔴 .a PART of ductwork.sh — sourced, never executed, and only BY ductwork.sh.
#     a caller sources ductwork.sh, which loads every part. see
#     __duct_load_parts there for why the lib is cut into parts at all.
#
# .holds = the verbs that open a duct, end it, replace the program it
#          holds, and refresh one in place
######################################################################

duct.open() {
  local uri=""
  local mode="headless"
  local cwd=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --on) uri="$2"; shift 2 ;;
      --mode) mode="$2"; shift 2 ;;
      --cwd) cwd="$2"; shift 2 ;;
      *) echo "✋ duct.open: unknown arg '$1'" >&2; return 2 ;;
    esac
  done
  if [[ -z "$uri" ]]; then
    echo "✋ duct.open: --on required" >&2
    return 2
  fi

  # --cwd names the directory the session's first shell starts in.
  #
  # .why it must exist: the duct.open skill has documented --cwd as REQUIRED
  #      since it was written, while this function rejected it as an unknown arg
  #      and `tmux new-session` carried no -c at all. so every session started in
  #      whatever directory the CALLER happened to sit in. after the 2026-08-09
  #      reboot that put reclaimed mechanic shells in sandpine-notebook rather than in
  #      their own worktrees, and a `claude --continue` run from there resumes
  #      sandpine-notebook's session — the wrong conversation, in the wrong repo.
  #
  #      a documented arg that the code drops is worse than an absent one: the
  #      caller reads the doc, passes the value, and is told naught.
  # `|| return` propagates a bad URI. without it the parser's error printed and
  # the verb carried on with an empty host+session — a failhide that would ssh
  # nowhere and blame the session (rule.forbid.failhide)
  __duct_parse_uri "$uri" || return 2

  # ⚠️ the -d test is LOCAL, so it may only judge a LOCAL duct's cwd — and that
  #    is WHY it sits BELOW the parse rather than above it.
  #
  # .why = a `duct://<grove>/…` uri names a session on the GROVE, and its --cwd
  #        is a path on that grove's disk. this box cannot stat it. the test ran
  #        unconditionally, above the parse, until 2026-09-02 — so every remote
  #        open was refused with `--cwd '/home/camper' is not a directory`, of a
  #        directory that exists on the machine that matters.
  #
  #        that is a `term=false-report`: the tool did not fail (exit 2, its
  #        ordinary constraint shape) and its content was untrue. it is the same
  #        family as the crew-poll localhost pin repaired the same day — a check
  #        written when every duct was local, left in place when ducts learned
  #        to travel.
  #
  # .why it must exist at all, for a local duct: the duct.open skill has
  #      documented --cwd as REQUIRED since it was written, while this function
  #      rejected it as an unknown arg and `tmux new-session` carried no -c at
  #      all. so every session started in whatever directory the CALLER happened
  #      to sit in. after the 2026-08-09 reboot that put reclaimed mechanic
  #      shells in sandpine-notebook rather than in their own worktrees, and a
  #      `claude --continue` run from there resumes sandpine-notebook's session — the
  #      wrong conversation, in the wrong repo.
  #
  #      a documented arg that the code drops is worse than an absent one: the
  #      caller reads the doc, passes the value, and is told naught.
  #
  # ⚠️ a REMOTE cwd is unchecked here on purpose, and the cost is bounded: tmux
  #    on the grove refuses its own `-c` for an absent path, so the duct fails
  #    loud at the one boundary that CAN stat it. an unverifiable check is worse
  #    than an absent one — it refuses the true case and cannot catch the false.
  if [[ -n "$cwd" ]] && __duct_host_is_here "$DUCT_HOST" && [[ ! -d "$cwd" ]]; then
    echo "✋ duct.open: --cwd '$cwd' is not a directory" >&2
    return 2
  fi

  if __duct_is_remote; then
    # remote: ssh to create/attach.
    #
    # the unreachable case must be caught BEFORE the create branch. without the
    # split, an asleep grove failed the probe, fell through to `new-session`,
    # failed that too, and reported "failed to create remote session" — which
    # blames the session for a box that was never reached
    # `|| probe=$?` — see the probe's own header. a BARE call here is a failing
    # command under the wrappers' `set -e`, so the shell dies with ssh's 255
    # and this line never runs
    local probe=0
    __duct_probe_remote_session || probe=$?
    if [[ $probe -eq 255 ]]; then
      __duct_say_unreachable open
      return 1
    fi
    if [[ $probe -ne 0 ]]; then
      if ! ssh -n "$DUCT_HOST" "$(__duct_tmux_cmd)new-session -d -s '$DUCT_SESSION'${cwd:+ -c '$cwd'}"; then
        echo "💥 duct.open: reached '$DUCT_HOST', but could not create session '$uri'" >&2
        return 1
      fi
      echo "🔧 $uri created (cloud)"
    else
      echo "🔧 $uri found (cloud)"
    fi

    # register host + duct
    __duct_register_host "$DUCT_HOST"
    __duct_register_duct "$DUCT_NAME" "$DUCT_HOST"

    if [[ "$mode" == "headfull" ]]; then
      echo "🔧 $uri attach (ctrl+x d to detach)"
      ssh -t "$DUCT_HOST" "$(__duct_tmux_cmd)attach -t '$DUCT_SESSION'"
    fi
  else
    # local
    if ! __duct_tmux has-session -t "$DUCT_SESSION" 2>/dev/null; then
      if ! __duct_tmux new-session -d -s "$DUCT_SESSION" ${cwd:+-c "$cwd"}; then
        echo "💥 duct.open: failed to create session '$uri'" >&2
        return 1
      fi
      echo "🔧 $uri created (local)${cwd:+ in $cwd}"
    else
      echo "🔧 $uri found (local)"
    fi

    # register duct with the EMPTY host — the canonical "this machine" form,
    # matching the uri's empty authority. this once wrote "localhost", which
    # made `duct.list` print an address that took the ssh path when pasted back
    __duct_register_duct "$DUCT_NAME" ""

    if [[ "$mode" == "headfull" ]]; then
      echo "🔧 $uri attach (ctrl+x d to detach)"
      __duct_tmux attach -t "$DUCT_SESSION"
    fi
  fi
}

duct.stop() {
  local uri=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --on) uri="$2"; shift 2 ;;
      *) echo "✋ duct.stop: unknown arg '$1'" >&2; return 2 ;;
    esac
  done
  if [[ -z "$uri" ]]; then
    echo "✋ duct.stop: --on required" >&2
    return 2
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
      __duct_say_unreachable stop
      return 2
    fi
    if [[ $probe -ne 0 ]]; then
      # DELIBERATE behavior change: this used to `return 2` (a constraint error).
      # a stop whose target is already absent has REACHED its goal, so an error
      # is wrong — `rule.require.get-set-gen-verbs` puts stop/del in the
      # idempotent family ("remove if extant, no-op if absent"), and
      # `rule.require.idempotent-procedures` wants a re-run to be safe. a caller
      # that stops twice should not have to swallow an error to stay correct
      #
      # ⚠️ it must still UNREGISTER. an earlier revision returned right here,
      # before the row was removed — so the ONE case where the row is all that
      # remains was the ONE case it refused to clean, and a re-run could not
      # heal it either. that was the live cause of rows that read `💥
      # malfunction` on every poll against trees felled on purpose.
      #
      # the misread was of `no-op` itself: it means CONVERGE TO ABSENT, not
      # "do naught". a duct is a row AND a session, so both are state that
      # must converge (term=duct._.choice._.md).
      __duct_unregister_duct "$DUCT_NAME"
      echo "• duct.stop: session '$uri' was already absent; row cleared"
      return 0
    fi
    if ! ssh -n "$DUCT_HOST" "$(__duct_tmux_cmd)kill-session -t '$DUCT_SESSION'"; then
      echo "💥 duct.stop: failed to stop '$uri'" >&2
      return 1
    fi
  else
    # idempotent, same as the remote branch: an already-absent target means the
    # stop has reached its goal (rule.require.get-set-gen-verbs) — but the ROW
    # is half the duct, so it must still converge. see the remote branch above
    # for the full account of the phantom this used to manufacture.
    if ! __duct_tmux has-session -t "$DUCT_SESSION" 2>/dev/null; then
      __duct_unregister_duct "$DUCT_NAME"
      echo "• duct.stop: session '$uri' was already absent; row cleared"
      return 0
    fi
    if ! __duct_tmux kill-session -t "$DUCT_SESSION"; then
      echo "💥 duct.stop: failed to stop '$uri'" >&2
      return 1
    fi
  fi

  # unregister duct
  __duct_unregister_duct "$DUCT_NAME"

  echo "🔧 $uri stopped"
}

######################################################################
# duct.reboot — replace the program a duct's pane holds, keep the duct
#
# .what = kill whatever holds the pane and spawn a fresh shell in it. the
#         session, the window, the duct's name, and the cwd all survive; only
#         the wedged program is replaced.
#
# .why  = a duct can be BUSY with a program that will never finish — a hung
#         `pnpm --version`, an nvim that stopped repaint, a build with no
#         timeout. `duct.send` then rightly refuses (`term=duct.idle`), and the
#         only extant escape was `duct.stop` + `duct.open`, which throws away the
#         scrollback and the cwd along with the hang.
#
#         worse, the absence of this verb was used as an excuse: on 2026-07-29 a
#         robot hit a busy duct mid-diagnosis and reached for ~10 raw
#         `ssh grove-1 "…"` calls instead — the exact act
#         `rule.require.reach-a-grove-through-its-duct` forbids. the human's
#         answer was "if you ever have a duct stuck, just duct.reboot it".
#         **an absent escape hatch does not license a rule violation; it licenses
#         the escape hatch.**
#
# .why NOT idempotent, deliberately: `stop` is idempotent because an absent
#         target means the goal is reached. a reboot of an ABSENT duct has no
#         goal to reach — there is no pane to respawn, and to silently open one
#         would make `reboot` a second spelling of `open`. so it fails and names
#         `duct.open` as the fix (rule.require.errors-name-the-fix).
#
# .why capture the cwd FIRST: `respawn-pane` without `-c` lands the fresh shell
#         in the pane's ORIGINAL cwd, not its current one. a duct that has been
#         `cd`'d into a worktree would silently jump back to $HOME, and the next
#         command sent would run in the wrong tree. read `pane_current_path`
#         before the kill, and hand it back after.
#
#         adopted from sandpine-notebook's `duct.reboot`, with the remote branch added —
#         sandpine-notebook's is local-only because it has no grove to reach.
#
# usage:
#   duct.reboot --on duct:///main/mechanic
#   duct.reboot --on duct://grove-1/main/mechanic
######################################################################
duct.reboot() {
  local uri=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --on) uri="$2"; shift 2 ;;
      *) echo "✋ duct.reboot: unknown arg '$1'" >&2; return 2 ;;
    esac
  done
  if [[ -z "$uri" ]]; then
    echo "✋ duct.reboot: --on required" >&2
    echo "   └─ e.g. duct.reboot --on duct://grove-1/main/mechanic" >&2
    return 2
  fi

  __duct_parse_uri "$uri" || return 2

  # NOT named `status`: zsh reserves `status` as a READ-ONLY special parameter
  local pane_cwd=""

  if __duct_is_remote; then
    # `|| probe=$?` — see the probe's own header. a BARE call here is a failing
    # command under the wrappers' `set -e`, so the shell dies with ssh's 255
    # and this line never runs
    local probe=0
    __duct_probe_remote_session || probe=$?
    if [[ $probe -eq 255 ]]; then
      __duct_say_unreachable reboot
      return 2
    fi
    if [[ $probe -ne 0 ]]; then
      echo "✋ duct.reboot: '$uri' is absent — there is no pane to reboot" >&2
      echo "   └─ fix: duct.open --on $uri" >&2
      return 2
    fi
    # `|| true` + ConnectTimeout: bare, this dies under `set -e` like the probe
    # did. the value is optional here — the probe above already proved the box
    # reachable, so an empty answer is an honest "tmux told us nought"
    pane_cwd=$(ssh -n -o ConnectTimeout=8 "$DUCT_HOST" "$(__duct_tmux_cmd)display-message -p -t '$DUCT_SESSION' '#{pane_current_path}'" 2>/dev/null) || true
    if [[ -n "$pane_cwd" ]]; then
      ssh -n "$DUCT_HOST" "$(__duct_tmux_cmd)respawn-pane -k -c '$pane_cwd' -t '$DUCT_SESSION'" || {
        echo "💥 duct.reboot: respawn failed on '$uri'" >&2; return 1; }
    else
      ssh -n "$DUCT_HOST" "$(__duct_tmux_cmd)respawn-pane -k -t '$DUCT_SESSION'" || {
        echo "💥 duct.reboot: respawn failed on '$uri'" >&2; return 1; }
    fi
  else
    if ! __duct_tmux has-session -t "$DUCT_SESSION" 2>/dev/null; then
      echo "✋ duct.reboot: '$uri' is absent — there is no pane to reboot" >&2
      echo "   └─ fix: duct.open --on $uri" >&2
      return 2
    fi
    pane_cwd=$(__duct_tmux display-message -p -t "$DUCT_SESSION" '#{pane_current_path}' 2>/dev/null)
    if [[ -n "$pane_cwd" ]]; then
      __duct_tmux respawn-pane -k -c "$pane_cwd" -t "$DUCT_SESSION" || {
        echo "💥 duct.reboot: respawn failed on '$uri'" >&2; return 1; }
    else
      __duct_tmux respawn-pane -k -t "$DUCT_SESSION" || {
        echo "💥 duct.reboot: respawn failed on '$uri'" >&2; return 1; }
    fi
  fi

  echo "🔧 $uri rebooted"
  [[ -n "$pane_cwd" ]] && echo "   └─ fresh shell, cwd kept: $pane_cwd"
  return 0
}

######################################################################
# duct.refresh — force every attached client to repaint
#
# .what = make the WINDOW show the duct's truth again — restore its geometry,
#         then tell each attached terminal to redraw its whole screen.
#         kills no program, keeps every byte of state.
#
# .why  = a duct can be perfectly healthy while the WINDOW that shows it paints a
#         stale frame. the session is fine; the picture is not.
#
#         ⚠️ a picture goes stale two ways, and a repaint alone cures only one:
#
#         | what is stale | the cause | the cure |
#         |---|---|---|
#         | the CONTENT | a TUI exited mid-redraw, so the client's model is wrong | `refresh-client` |
#         | the GEOMETRY | the window is stranded in `window-size manual` | `window-size latest` |
#
#         ⇒ geometry is not an addition to this verb, it is a COMPLETION of it:
#         a repaint of a wrongly-sized window faithfully redraws the wrong size,
#         so without the geometry half `refresh` cannot meet its own goal on a
#         stranded duct — it reports a repair it did not make.
#
#         so this is the non-destructive twin of `duct.reboot`, and the pair
#         answers two different questions:
#
#         | symptom | verb | what dies |
#         |---------|------|-----------|
#         | the picture is wrong, the duct answers | `duct.refresh` | none |
#         | the duct will not answer, a program holds it | `duct.reboot` | that program |
#
#         reach for `refresh` FIRST: it is free and it cannot lose work. only
#         when the duct genuinely will not answer is `reboot` the right verb.
#
#         adopted from sandpine-notebook's `duct.refresh`, with the remote branch added.
#
# .why "no clients attached" is a SUCCESS, not an error: a headless duct on a
#         grove has no client by design (`--mode headless`). there is no picture
#         to fix, so the goal is already met — an error here would make the verb
#         unusable on exactly the machines this repo drives most.
#
# usage:
#   duct.refresh --on duct:///main/mechanic
######################################################################
duct.refresh() {
  local uri="" all=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --on) uri="$2"; shift 2 ;;
      --all) all=1; shift ;;
      *) echo "✋ duct.refresh: unknown arg '$1'" >&2; return 2 ;;
    esac
  done

  ####################################################################
  # --all — the FLEET form
  #
  # .why it exists: a stranded `window-size manual` is a FLEET condition,
  #       not a per-duct one. one `git.grove.auth` that died on a signal
  #       strands every session it had widened, and a caller who must then
  #       cure them one `--on` at a time is running the byhand loop
  #       `rule.require.bulk-over-byhand` forbids — the rule whose own
  #       remedy is "add a flag, never fall back to a loop".
  #
  # .why a refresh of a HEALTHY duct is free: the geometry branch fires
  #       only on `manual`, and a repaint is idempotent by construction.
  #       so the sweep needs no list of "which ducts are broken" — it IS
  #       the diagnostic, and it names each one it repaired.
  #
  # .why one bad duct must NOT abort the sweep: a single unreachable grove
  #       would otherwise hide every healthy duct behind it — the same
  #       failure `git.crew.poll` reports per-duct rather than throws
  ####################################################################
  if [[ -n "$all" ]]; then
    if [[ -n "$uri" ]]; then
      echo "✋ duct.refresh: --all and --on are exclusive" >&2
      echo "   └─ --all sweeps every registered duct; --on names one" >&2
      return 2
    fi
    __duct_ensure_dirs
    local swept=0 failed=0 f d_host d_session d_uri
    while IFS= read -r f; do
      [[ -f "$f" ]] || continue
      d_host="$(__duct_as_host_canonical "$(jq -r '.host // ""' "$f" 2>/dev/null)")"
      d_session="${f#"$DUCTWORK_DIR"/ducts/}"
      d_session="${d_session%.json}"
      d_uri="duct://${d_host}/${d_session}"
      if duct.refresh --on "$d_uri"; then
        swept=$(( swept + 1 ))
      else
        failed=$(( failed + 1 ))
      fi
    done < <(find "$DUCTWORK_DIR/ducts" -type f -name '*.json' 2>/dev/null | sort)
    echo "🔧 fleet refreshed — $swept duct(s) swept, $failed unreachable"
    return 0
  fi

  if [[ -z "$uri" ]]; then
    echo "✋ duct.refresh: --on required (or --all for the fleet)" >&2
    echo "   └─ e.g. duct.refresh --on duct:///main/mechanic" >&2
    echo "   └─ e.g. duct.refresh --all" >&2
    return 2
  fi

  __duct_parse_uri "$uri" || return 2

  local ttys="" count=0

  if __duct_is_remote; then
    # `|| probe=$?` — see the probe's own header. a BARE call here is a failing
    # command under the wrappers' `set -e`, so the shell dies with ssh's 255
    # and this line never runs
    local probe=0
    __duct_probe_remote_session || probe=$?
    if [[ $probe -eq 255 ]]; then
      __duct_say_unreachable refresh
      return 2
    fi
    if [[ $probe -ne 0 ]]; then
      echo "✋ duct.refresh: '$uri' is absent — there is no client to repaint" >&2
      echo "   └─ fix: duct.open --on $uri" >&2
      return 2
    fi
    # `|| true` + ConnectTimeout — see the pane_cwd read above; same shape,
    # same optional value, same `set -e` hazard when left bare
    ttys=$(ssh -n -o ConnectTimeout=8 "$DUCT_HOST" "$(__duct_tmux_cmd)list-clients -t '$DUCT_SESSION' -F '#{client_tty}'" 2>/dev/null) || true
  else
    if ! __duct_tmux has-session -t "$DUCT_SESSION" 2>/dev/null; then
      echo "✋ duct.refresh: '$uri' is absent — there is no client to repaint" >&2
      echo "   └─ fix: duct.open --on $uri" >&2
      return 2
    fi
    ttys=$(__duct_tmux list-clients -t "$DUCT_SESSION" -F '#{client_tty}' 2>/dev/null)
  fi

  ####################################################################
  # geometry BEFORE the repaint — a repaint of a wrongly-sized window
  # faithfully redraws the wrong size
  #
  # .why = `window-size manual` tells tmux to STOP snapping a window to its
  #        client's size. that is not a symptom of a terminal being ignored;
  #        it IS the terminal being ignored, by definition. the client can be
  #        resized all day and the pane will not follow it.
  #
  # .why it STRANDS: `git.grove.auth` sets `manual` on purpose, for the few
  #        seconds it needs a wide pane to read, and restores `latest` from a
  #        `trap … EXIT`. a trap does not fire on SIGKILL, and that restore is
  #        written `2>/dev/null || true` — so a restore that FAILS reports
  #        naught either. the setting outlives the run that set it, on a
  #        session no one knows is stranded.
  #
  # .why it is NOT cosmetic: tmux sizes a window to its client, so a stranded
  #        narrow window WRAPS claude's modal chrome, and a wrapped option
  #        loses its shape — `2. Yes, and…` renders as `2Yes, and…`. the box
  #        detector then reads a LIVE MODAL as an empty box, and the duct goes
  #        unbabysat. termwork.sh carries the same defect from the kitty end.
  #
  # .why restoring is safe, and does not break the "non-destructive" promise:
  #        `latest` is tmux's OWN default, and it is the least destructive
  #        geometry act available — it hands control back to the terminal
  #        rather than taking it. a concurrent `git.grove.auth` re-sets
  #        `manual` for its own few seconds and restores after, so the end
  #        state converges to `latest` either way.
  local wsize="" wsize_rc=0
  if __duct_is_remote; then
    wsize=$(ssh -n -o ConnectTimeout=8 "$DUCT_HOST" "$(__duct_tmux_cmd)show-options -t '$DUCT_SESSION' -v -w window-size" 2>&1) || wsize_rc=$?
  else
    wsize=$(__duct_tmux show-options -t "$DUCT_SESSION" -v -w window-size 2>&1) || wsize_rc=$?
  fi

  # .why a failed READ is loud, never a silent skip: an unreadable geometry is
  #      indistinguishable from a healthy one once swallowed, so a blind pass
  #      would report a repair this verb never made (rule.forbid.failhide)
  if [[ $wsize_rc -ne 0 ]]; then
    echo "✋ duct.refresh: could not read window-size on '$uri'" >&2
    echo "   ├─ tmux said: $wsize" >&2
    echo "   └─ the geometry check is NOT blind-passed; no repaint was attempted" >&2
    return 1
  fi

  if [[ "$wsize" == "manual" ]]; then
    local geo_err="" geo_rc=0
    if __duct_is_remote; then
      geo_err=$(ssh -n -o ConnectTimeout=8 "$DUCT_HOST" "$(__duct_tmux_cmd)set-option -t '$DUCT_SESSION' -w window-size latest" 2>&1) || geo_rc=$?
    else
      geo_err=$(__duct_tmux set-option -t "$DUCT_SESSION" -w window-size latest 2>&1) || geo_rc=$?
    fi
    # .why loud: this is the EXACT failhide git.grove.auth's restore commits. a
    #      geometry repair that silently fails leaves the duct unbabysat AND
    #      tells the caller it was fixed — the worse of the two outcomes
    if [[ $geo_rc -ne 0 ]]; then
      echo "✋ duct.refresh: could not restore window-size on '$uri'" >&2
      echo "   └─ tmux said: $geo_err" >&2
      return 1
    fi
    echo "   ├─ 📐 geometry was STRANDED in \`window-size manual\` — restored to \`latest\`"
    echo "   │  └─ the window tracks its terminal again"
  fi

  # 🔴 the width is read ABOVE the headless return, and the WARN below it is
  #    gated on a client. the two are split on purpose:
  #
  #      · the WIDTH is a fact about the pane either way, so a headless duct
  #        that reports no width is a report with a hole in it
  #      · the WARN is only actionable with a client — under `latest` and no
  #        client, tmux hands back a default size that the next attach will
  #        replace, so a warn there is a false alarm about a width nobody has
  local pane_w=""
  if __duct_is_remote; then
    pane_w=$(ssh -n -o ConnectTimeout=8 "$DUCT_HOST" "$(__duct_tmux_cmd)list-panes -t '$DUCT_SESSION' -F '#{pane_width}'" 2>/dev/null | head -1) || true
  else
    pane_w=$(__duct_tmux list-panes -t "$DUCT_SESSION" -F '#{pane_width}' 2>/dev/null | head -1) || true
  fi

  if [[ -z "$ttys" ]]; then
    echo "🔧 $uri — no client attached, so no repaint is owed (headless is normal, pane ${pane_w:-unread} cols)"
    return 0
  fi

  # .why a `while read` over a heredoc string, not `mapfile`: `mapfile` is a
  #      bash builtin that zsh does not carry, and this file is sourced by BOTH
  #      shells (rule.forbid.bare-globs-in-dual-shell-files names the same class
  #      of dialect split). a read loop is the portable form
  while IFS= read -r tty; do
    [[ -n "$tty" ]] || continue
    if __duct_is_remote; then
      ssh -n "$DUCT_HOST" "$(__duct_tmux_cmd)refresh-client -t '$tty'" 2>/dev/null
    else
      __duct_tmux refresh-client -t "$tty" 2>/dev/null
    fi
    echo "   ├─ repainted $tty"
    count=$(( count + 1 ))
  done <<EOF
$ttys
EOF

  ####################################################################
  # 🔴 the WIDTH, read back — because `refreshed` is a claim about the ACT
  #    and the harm is a property of the RESULT
  #
  # .why = everything above cures ONE cause of a narrow pane: a window
  #        stranded in `window-size manual`. there is a second, and this verb
  #        was blind to it — a genuinely narrow CLIENT under `latest`, which
  #        tmux then tracks faithfully down to 45 columns.
  #
  #        kitty caches a window size (`remember_window_size`), so one window
  #        closed small seeds every duct window booted after it. `term.open`
  #        now passes `remember_window_size=no`, but that fixes only the ones
  #        booted SINCE — every window opened before it carries the cache.
  #
  # ⚠️ measured 2026-09-13 on `grove-sandpine-v20260901`: six clones at 45-46
  #   columns beside nine at 93. `duct.refresh` repainted them, found no
  #   strand, and reported `refreshed` — truthfully about the repaint and
  #   silently about the pane (`term=false-report`, the reader-inference
  #   family: a true sentence from which the reader draws a false one).
  #
  # ⇒ so read the width back and PRINT it. the same lesson `git.grove.auth`
  #   paid for at its boot: a render that quotes its input is decoration; one
  #   that quotes the record is an instrument.
  #
  # 🟡 the 80 is a BEST GUESS, not a measured boundary. what is measured: 45,
  #   46, and 56 wrap claude's modal chrome; 93 and 140 do not. the true
  #   threshold sits somewhere between 56 and 93 and nobody has bisected it.
  #   80 is the classic terminal floor and errs toward a warn we can ignore
  #   rather than a defect we cannot see.
  #
  # ⚠️ `pane_w` is read ABOVE the headless return — see there for why the fact
  #    and the warn are split.
  ####################################################################
  echo "🔧 $uri refreshed ($count client(s), pane ${pane_w:-unread} cols)"

  # .why a WARN rather than a repair: the cure is at the terminal, never at
  #      tmux. to force a width here would set `window-size manual` — the very
  #      strand this verb exists to undo (rule.forbid.remedies-that-mimic-the-defect).
  #
  # 🔴 .why STDOUT, and this is not a style call: the refresh SUCCEEDS on a
  #    narrow pane — that is the whole defect — so it exits 0, and a caller
  #    that shows stderr only on failure never renders this. measured
  #    2026-09-13: written to stderr first, it printed nowhere on the one path
  #    it exists to cover. a condition that rides a SUCCESS belongs on stdout.
  if [[ -n "$pane_w" ]] && [[ "$pane_w" -lt 80 ]]; then
    echo "   └─ ⚠️  NARROW at ${pane_w} cols — claude's modal chrome wraps below ~80,"
    echo "      so \`2. Yes, and…\` renders \`2Yes, and…\` and the box detector reads"
    echo "      a LIVE MODAL as an empty box. the duct then goes unbabysat."
    # 🔴 the cure is `crew.show` ALONE — measured 2026-09-13, 45 cols -> 93.
    #
    # .why it needs no hide: `window-size latest` sizes the window to the MOST
    #      RECENTLY attached client, so a fresh correctly-sized tab wins the
    #      race the instant it attaches. the stale narrow client may stay.
    #
    # ⚠️ and a hide is not merely redundant, it FAILS: `crew.hide` on the same
    #   tree answered `term.stop: terminal is alive but its window would not
    #   close` (kitty remote control, `Error: EOF`). a hint that prescribes a
    #   broken step is worse than no hint — it routes the reader into a wall
    #   and they conclude the cure does not work.
    echo "      fix: the cure is at the TERMINAL, never at tmux. attach a fresh"
    echo "        client and it wins — \`rhx git.crew.show --tree <t>\` (no hide owed)"
  fi

  return 0
}
