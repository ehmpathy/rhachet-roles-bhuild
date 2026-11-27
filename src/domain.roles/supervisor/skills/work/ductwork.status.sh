#!/usr/bin/env bash
######################################################################
# ductwork.status — the STATUS BAR part: each duct owns its own bar
#
# 🔴 .a PART of ductwork.sh — sourced, never executed, and only BY ductwork.sh.
#
# .what = the duct's home anchor (`@home_cwd`), the probe that derives what a
#         duct's bar SHOULD read, and the stamp that pins the bar to it
#
# .why  = the bar (` #{@repo} ` left, ` #{@branch} ` right, per tmux.conf)
#         shows whatever last wrote those two pane options — and the most
#         frequent writer is the human's zsh hook, which runs `tmux set -p
#         @repo … @branch …` with NO -t on every prompt, from whatever cwd that
#         shell sits in. so a seat shell that `cd`s into another repo relabels
#         its duct, and a seat whose shell never wrote at all draws a blank bar.
#
#         ⇒ so the duct OWNS its bar. it writes SESSION options of its own
#           (`@duct_repo` / `@duct_branch`), which no shell hook names, and pins
#           its session's `status-left` / `status-right` to read them. a hook
#           that writes `@repo` writes an option the bar no longer reads.
#
#         ⇒ session scope, never pane: tmux resolves a format option pane →
#           window → session, so every pane of the duct, a split a human opened
#           included, reads the one pair. a pane copy left by an older stamp
#           would shadow it, so each write unsets the pane copy.
#
# .why the bar is static = it changes only when a duct verb stamps it, so a
#         `git switch` inside a seat shows on the next `duct.refresh`. the
#         prompt hook that once kept it live is the one that relabelled ducts
#         by the shell's cwd; a static bar that says the duct's own tree beats
#         a live one that says whatever the shell last visited.
#
# .when = the stamp sits inside the duct verbs every seat raise passes, so no
#         crew verb has to remember it:
#           - duct.open    (created and found: hire, boot, --resume, a move)
#           - duct.reboot  (crew.reboot; the pin survives respawn-pane, the
#                           repaint covers a duct opened before the pin)
#           - duct.refresh (crew.refresh, heal's wedge read)
#
# .bound = cosmetic: a stamp that fails is SAID, never fatal to the caller
#
# 🔴 a PART of ductwork.sh: sourced by it, never alone (see __duct_load_parts)
######################################################################

######################################################################
# .what = the GROVE-SIDE probe of duct status bars, as a bash procedure
#         run on the duct's own grove (locally, or via ssh)
#
# .why  = the bar a human reads is drawn by the tmux server on the grove the duct
#         lives on. a grove seat's bar is painted by the GROVE's tmux, from the
#         GROVE's pane options, so the derivation must run there.
#
# .derivation = the duct's home anchor (`@home_cwd`), else the session's start
#         dir (`#{session_path}`, the `new-session -c` it was born with) —
#         never the pane's live path, which wanders with every `cd`. for a
#         linked worktree, repo = the main checkout's dir name. otherwise repo = the toplevel's basename minus its `.<branch>` suffix (the
#         worktree dir convention), branch = the short symbolic ref, else the
#         short sha. outside a repo both are empty.
#
# exits 3 when the tmux server does not answer, so a caller never reads an
# unread server as one with no ducts
#
# emits, one line per duct session (a `tree/role` name), split by the ASCII
# unit separator (\037) — never a tab, which `read` treats as whitespace and so
# collapses an empty field into its neighbour:
#   session · shown-left · shown-right · want-repo · want-branch · pinned(1|0)
#   · home (the dir the derivation read) · home-state (present|absent)
#
# args: $1 = one session to probe ('' = every duct session on the server)
######################################################################
__duct_status_box_probe_proc() {
  local only="$1"
  printf 'ONLY=%q\n' "$only"
  printf 'T() { %s"$@"; }\n' "$(__duct_tmux_cmd)"
  cat <<'PROBE'
want() {
  local cwd="$1" top="" branch="" repo="" main=""
  if [ -n "$cwd" ]; then top="$(git -C "$cwd" rev-parse --show-toplevel 2>/dev/null)" || top=""; fi
  if [ -n "$top" ]; then
    branch="$(git -C "$cwd" symbolic-ref --short HEAD 2>/dev/null || git -C "$cwd" rev-parse --short HEAD 2>/dev/null)"
    # a linked worktree is named for the main checkout it hangs from, so a `git switch` inside it never
    # changes the repo. only a checkout that is its own main falls back to the dir name minus `.<branch>`
    main="$(cd "$cwd" 2>/dev/null && cd "$(git rev-parse --git-common-dir 2>/dev/null)" 2>/dev/null && pwd -P)" || main=""
    if [ "${main%/.git}" != "$main" ] && [ "${main%/.git}" != "$top" ]; then
      repo="${main%/.git}"
      repo="${repo##*/}"
    else
      repo="${top##*/}"
      repo="${repo%".${branch//\//.}"}"
    fi
  fi
  printf '%s\037%s' "${repo//[[:cntrl:]]/}" "${branch//[[:cntrl:]]/}"
}
TAB="$(printf '\t')"
# a server that does not answer is UNREAD, never an empty server: exit 3 says so
SESSIONS="$(T list-sessions -F '#{session_name}' 2>/dev/null)" || { echo "the tmux server did not answer" >&2; exit 3; }
printf '%s\n' "$SESSIONS" | while IFS= read -r s; do
  [ -n "$s" ] || continue
  # one session asked: that one only. none asked: every duct session (`<tree>/<role>`)
  if [ -n "$ONLY" ] && [ "$s" != "$ONLY" ]; then continue; fi
  if [ -z "$ONLY" ]; then case "$s" in */*) ;; *) continue ;; esac; fi
  # the anchor resolves pane → session, so an anchor an older stamp left on the pane still reads
  home="$(T display-message -p -t "$s" '#{@home_cwd}' 2>/dev/null)"
  [ -n "$home" ] || home="$(T display-message -p -t "$s" '#{session_path}' 2>/dev/null)"
  shown="$(T display-message -p -t "$s" "#{E:status-left}${TAB}#{E:status-right}" 2>/dev/null)"
  left="${shown%%"$TAB"*}"; right="${shown#*"$TAB"}"
  pinval="$(T show-options -t "$s" -v status-left 2>/dev/null)"
  pinned=0
  case "$pinval" in *@duct_repo*) pinned=1 ;; esac
  # a home dir that is gone (a dropped twin, a mistyped --home) is said apart from a dir that holds no repo
  hstate=present
  [ -d "$home" ] || hstate=absent
  printf '%s\037%s\037%s\037%s\037%s\037%s\037%s\n' "$s" "$left" "$right" "$(want "$home")" "$pinned" "${home//[[:cntrl:]]/}" "$hstate"
done
PROBE
}

# .what = run the probe on the duct's grove; echo its rows
# .why  = base64 over the wire, so the remote login shell (zsh, bash, aught)
#         never re-parses the probe's quotes
# args: $1 = the grove's ssh name ('' = this grove), $2 = one session ('' = all)
__duct_status_box_probe() {
  local host="$1" only="$2"
  __duct_bash_on_grove "$host" "$(__duct_status_box_probe_proc "$only")"
}

# .note = __duct_bash_on_grove and __duct_grove_of_duct live in ductwork.host.sh,
#         the transport part, so every part may ride them

######################################################################
# .what = write the duct's home anchor at birth, from the --cwd its session
#         was just created with
#
# .why  = the stamp must read the duct's OWN tree, never the live cwd: a seat
#         shell that `cd`d into another repo would otherwise be stamped with
#         that repo. a pane option written once, from the same dir
#         `new-session -c` used, is immune to the wander.
#
# .note = findsert: a found duct keeps the anchor it was born with. only
#         `duct.refresh --home` (a derived authority) may overwrite a live one;
#         an anchor whose dir the grove says is gone yields to the live --cwd
#
# needs: __duct_parse_uri already run (DUCT_HOST / DUCT_SESSION set)
# args: $1 = the --cwd ('' = none, a no-op)
######################################################################
__duct_home_anchor_birth() {
  local cwd="$1" now="" err="" rc=0
  [[ -n "$cwd" ]] || return 0
  # a relative --cwd resolves against whichever dir later reads it (this box's,
  # or the grove's $HOME over ssh), so the bar could name another repo: never anchored
  if [[ "$cwd" != /* ]]; then
    echo "🟡 home anchor NOT set — --cwd '$cwd' is not an absolute path; the bar reads the session's birth dir until \`duct.refresh --home <absolute dir>\` sets it"
    return 0
  fi
  now="$(__duct_home_anchor_read)" || rc=$?
  # unreadable: never overwrite what may be a good anchor. say so, and go on
  if [[ $rc -ne 0 ]]; then
    echo "🟡 home anchor NOT checked — tmux could not read it (rc $rc); the bar reads the session's birth dir until \`duct.refresh --home\` sets it"
    return 0
  fi
  # a found anchor is kept (findsert), unless the dir it names is gone and a live
  # --cwd is in hand: then the anchor can name no tree, so the --cwd replaces it
  if [[ -n "$now" ]]; then
    __duct_home_dir_is_gone "$now" || return 0
    err="$(__duct_home_anchor_write "$cwd")" || rc=$?
    if [[ $rc -ne 0 ]]; then
      echo "🟡 home anchor NOT corrected — it names $now, which is gone, and tmux refused the new one (rc $rc): ${err:-no reason given}"
      return 0
    fi
    echo "🏠 home anchor CORRECTED — it named a dir that is gone"
    echo "   ├─ was: $now"
    echo "   └─ now: $cwd"
    return 0
  fi
  err="$(__duct_home_anchor_write "$cwd")" || rc=$?
  if [[ $rc -ne 0 ]]; then
    echo "🟡 home anchor NOT set — tmux refused it (rc $rc): ${err:-no reason given}; the bar reads the session's birth dir until \`duct.refresh --home\` sets it"
  fi
  return 0
}

# .what = is the dir an anchor names gone, on the duct's grove?
# .why  = only a dir the grove says is ABSENT may be replaced. a grove that did
#         not answer (rc 255, or aught but 0/1) keeps the anchor: an unread is no verdict
# rc: 0 = gone · 1 = present, or unread
__duct_home_dir_is_gone() {
  local rc=0
  __duct_bash_on_grove "$(__duct_grove_of_duct)" "[ -d $(printf '%q' "$1") ]" 2>/dev/null || rc=$?
  [[ $rc -eq 1 ]]
}

# .what = read the duct's home anchor
# .why  = a format read resolves pane → session, so an anchor an older stamp
#         left on the pane still reads. an unset option reads empty with rc 0,
#         so a nonzero rc means tmux itself could not answer (no server, no
#         session, no reach). a caller must never read that as "unset": it
#         would overwrite a good anchor, or report one absent that is set
# rc: 0 = read ('' when unset) · nonzero = unreadable
__duct_home_anchor_read() {
  local t s
  t="$(__duct_tmux_cmd)"
  s="$(printf '%q' "$DUCT_SESSION")"
  __duct_bash_on_grove "$(__duct_grove_of_duct)" "${t}display-message -p -t $s '#{@home_cwd}'" 2>/dev/null
}

# .what = write the duct's home anchor at session scope, and drop a pane copy
#         that would shadow it; tmux's complaint on stdout, rc kept
__duct_home_anchor_write() {
  local t s h
  t="$(__duct_tmux_cmd)"
  s="$(printf '%q' "$DUCT_SESSION")"
  h="$(printf '%q' "$1")"
  __duct_bash_on_grove "$(__duct_grove_of_duct)" "${t}set-option -t $s @home_cwd $h && ${t}set-option -q -p -u -t $s @home_cwd" 2>&1
}

######################################################################
# .what = upsert the home anchor from a DERIVED home, said out loud
#
# .why  = the one caller that derives a home is crew.refresh, from the crew's
#         worktree convention (`__crew_role_cwd`). that is the authority. the
#         anchor duct.open wrote is only the --cwd the session happened to be
#         born in, and a seat born in the wrong dir carries a wrong anchor for
#         life — so a disagreement is CORRECTED, and said with both paths.
#
# .why a failed write is loud: an anchor this verb claims and did not set would
#      leave the bar on the live cwd while the output says it is cured
#
# needs: __duct_parse_uri already run
# args: $1 = the derived home dir; $2 = the uri, for the message
# rc: 0 = set, kept, or corrected · 1 = tmux could not read or write it
######################################################################
__duct_home_anchor_upsert() {
  local home="$1" uri="$2" now="" err="" rc=0
  now="$(__duct_home_anchor_read)" || rc=$?
  if [[ $rc -ne 0 ]]; then
    echo "💥 MalfunctionError: could not read the home anchor on '$uri' (rc $rc)" >&2
    echo "   └─ fix: check the duct is live (rhx duct.read --on '$uri'), then run this again" >&2
    return 1
  fi
  if [[ "$now" == "$home" ]]; then
    return 0
  fi
  err="$(__duct_home_anchor_write "$home")" || rc=$?
  if [[ $rc -ne 0 ]]; then
    echo "💥 MalfunctionError: could not set the home anchor on '$uri' (rc $rc)" >&2
    if [[ -n "$now" ]]; then echo "   ├─ it reads: $now" >&2; fi
    echo "   ├─ tmux said: ${err:-no reason given}" >&2
    echo "   └─ fix: check the duct is live (rhx duct.read --on '$uri'), then run this again" >&2
    return 1
  fi
  if [[ -z "$now" ]]; then
    echo "   ├─ 🏠 home anchor set: $home"
    echo "   │  └─ the status bar now reads this duct's own tree, wherever its pane roams"
    return 0
  fi
  echo "   ├─ 🏠 home anchor CORRECTED — it named a dir that is not this seat's tree"
  echo "   │  ├─ was: $now"
  echo "   │  └─ now: $home"
}

# .what = write `@duct_repo`/`@duct_branch` at session scope (and the legacy
#         pane `@repo`/`@branch`), drop the pane copies an older stamp left,
#         then pin the session's status-left/right to the duct-owned pair
# .why  = one procedure for both grove kinds, each value `%q`-quoted, so a
#         branch or repo name is a value on the grove and never a command
# args: $1 = repo, $2 = branch · rc: tmux's (or ssh's) on the first refusal
__duct_stamp_options_set() {
  local t s r b
  t="$(__duct_tmux_cmd)"
  s="$(printf '%q' "$DUCT_SESSION")"
  r="$(printf '%q' "$1")"
  b="$(printf '%q' "$2")"
  __duct_bash_on_grove "$(__duct_grove_of_duct)" "$(
    printf '%s && ' \
      "${t}set-option -t $s @duct_repo $r" \
      "${t}set-option -t $s @duct_branch $b" \
      "${t}set-option -q -p -u -t $s @duct_repo" \
      "${t}set-option -q -p -u -t $s @duct_branch" \
      "${t}set-option -p -t $s @repo $r" \
      "${t}set-option -p -t $s @branch $b" \
      "${t}set-option -t $s status-left ' #{@duct_repo} '"
    printf '%s' "${t}set-option -t $s status-right ' #{@duct_branch} '"
  )"
}

######################################################################
# .what = stamp AND PIN a duct pane's status bar to its own tree
#
# .derivation = `__duct_status_box_probe`, the one place that says what a bar
#         SHOULD read. `duct.bar.probe` derives naught: it reads what each bar
#         DRAWS and whether it is pinned, so it audits the stamp's result and
#         never holds a second derivation that could drift from this one
#
# .note = `@repo` / `@branch` are still written, for any reader that keys on
#         them; they are simply no longer what the bar draws
#
# needs: __duct_parse_uri already run (DUCT_HOST / DUCT_SESSION set)
# args: $1 = the line prefix (default '   ├─ ', a branch under a tree;
#       duct.open passes '' — its lines are flat, and a caller indents them)
######################################################################
__duct_stamp_status_box() {
  local pre="${1-   ├─ }"
  local rows="" row="" repo="" branch="" set_rc=0 set_err="" probe_rc=0 host=""
  host="$(__duct_grove_of_duct)"

  # derive what the bar should read, from the home anchor
  rows="$(__duct_status_box_probe "$host" "$DUCT_SESSION" 2>/dev/null)" || probe_rc=$?
  row="${rows%%$'\n'*}"

  # a probe that failed, or that never saw the session, leaves the bar as it is.
  # only a probe that RAN on this session may stamp an empty `(no repo)`
  if [[ $probe_rc -ne 0 ]]; then
    echo "${pre}🟡 status box NOT stamped — the probe could not read ${host:-this grove} (rc $probe_rc)"
    return 0
  fi
  if [[ -z "$row" ]]; then
    echo "${pre}🟡 status box NOT stamped — the probe found no session '$DUCT_SESSION' on ${host:-this grove}"
    return 0
  fi
  local home="" hstate=""
  IFS=$'\037' read -r _ _ _ repo branch _ home hstate <<< "$row"

  # a home that is gone would stamp `(no repo)` under a success line: the blank bar, said as cured.
  # leave the bar as it is, and name the cure
  if [[ "$hstate" == absent ]]; then
    echo "${pre}🟡 status box NOT stamped — the duct's home ${home:-(none)} is gone on ${host:-this grove}"
    echo "${pre%├─ }   └─ fix: repaint it from the crew's own tree: rhx git.crew.refresh --tree ${DUCT_NAME%/*} (or: rhx duct.refresh --on 'duct://${DUCT_HOST}/${DUCT_NAME:-$DUCT_SESSION}' --home <tree dir>)"
    return 0
  fi

  # write the duct's own options, then pin the session bar to them
  set_err="$(__duct_stamp_options_set "$repo" "$branch" 2>&1)" || set_rc=$?

  # cosmetic: say the outcome, never fail the caller. tmux's own words name the cure (a dead socket, a gone session)
  if [[ $set_rc -ne 0 ]]; then
    echo "${pre}🟡 status box NOT stamped — tmux refused the pane option (rc $set_rc): ${set_err:-no reason given}"
    return 0
  fi
  echo "${pre}🏷️  status box — ${repo:-(no repo)} · ${branch:-(no branch)} (pinned to the duct)"
}

######################################################################
# .what = count the bars a stamp output left unpainted
#
# .why  = a crew seat's bar must name its tree, so a miss is any stamp line
#         that did not pin a repo: each `NOT stamped`, and each `(no repo)` pin
#         (the blank bar under a success line). the counter sits beside the
#         lines it reads, so a reword of one is a red test of the other
#         (ductwork.status case13), never a summary that goes silent
#
# args: $1 = a file that holds stamp output · stdout: the count
# rc: 0 = counted · 2 = the file could not be read (no count is a verdict)
######################################################################
__duct_stamp_misses_count() {
  local n=0 rc=0
  n="$(grep -c -e 'status box NOT stamped' -e 'status box — (no repo)' -- "$1")" || rc=$?
  [[ $rc -le 1 ]] || return 2
  printf '%s' "${n:-0}"
}
