#!/usr/bin/env bash
######################################################################
# .what = ductwork — headless terminal streams via tmux
# .why  = start headless, attach later, send commands, read logs
#
# 🔴 .a LIB: sourced, never executed. rhachet scans `skills/` RECURSIVELY,
#     so this file is dispatchable as `rhx ductwork` — and a sourced-only
#     file run directly defines its functions, says naught, and exits 0.
#     the verbs that source it are `rhx duct.<open|list|send|read|…>`.
#
# the address: --on takes a duct URI, and that is the ONLY format
#   duct://<host>/<tree>/<role>    remote — the host is the authority
#   duct:///<tree>/<role>          local  — an EMPTY authority means this machine
#                                           (three slashes, exactly like file:///)
#
#   what you read back is what you type in: every message prints the same URI
#   the flag accepts, so an address can be copied from output to input
#
# usage:
#   duct.open --on duct:///worktree/mechanic              # local: findsert headless
#   duct.open --on duct:///worktree/mechanic --mode headfull  # local: + attach (ctrl+x d to detach)
#   duct.open --on duct://grove-1/main/mechanic           # remote: findsert headless
#   duct.open --on duct://grove-1/main/mechanic --mode headfull  # remote: ssh + attach
#   duct.send --on duct:///worktree/mechanic --what "npm run build"
#   duct.send --on duct://grove-1/main/mechanic --what "npm run build"
#   duct.read --on duct:///worktree/mechanic
#   duct.read --on duct://grove-1/main/mechanic
#   duct.stop --on duct:///worktree/mechanic              # kill session
#   duct.stop --on duct://grove-1/main/mechanic
#   duct.list                                # list all ducts (from cache)
#   duct.list --on 'duct://grove-1/*'        # narrow by uri pattern (quote it!)
#   duct.list --on 'duct:///*'               # every duct on THIS machine
#   duct.list --on 'duct://grove-1/main/*'   # every role in one tree
#   duct.list --refresh                      # refresh cache from all hosts
#   duct.host.add user@host                  # register a host
#   duct.host.del user@host                  # unregister a host
#   duct.host.list                           # list hosts
#
# requires: tmux (sudo apt install tmux)
######################################################################

######################################################################
# the tmux seam
######################################################################

# .what = the tmux SERVER this ductwork talks to. empty = tmux's default.
#
# .why  = a test must be able to create, drive, and kill ducts with NO chance
#         it reaches the live fleet. tmux already has the mechanism: `-L
#         <name>` picks a socket, and each socket is its own server with its
#         own, entirely separate, session namespace.
#
#         without this seam a test has only one server to work on — the same
#         one the real fleet lives on, in the same namespace. a test that
#         created `main/mechanic` would collide with a real duct of that name,
#         and a teardown that killed it would end real work with a real claude
#         conversation inside. so the tests could not be written at all.
#
#         set it and EVERY tmux call in this file is redirected, local and
#         remote alike. no path escapes to the default server — that
#         completeness IS the guarantee, since one missed call is one way for
#         a test to reach live work (rule.require.hermetic-tests).
#
# usage:
#   DUCTWORK_TMUX_SOCKET=ductwork-test-$$ duct.open --on duct:///t/mechanic --cwd /tmp
DUCTWORK_TMUX_SOCKET="${DUCTWORK_TMUX_SOCKET:-}"

# .what = run tmux against the seam's server (local calls)
__duct_tmux() {
  if [[ -n "$DUCTWORK_TMUX_SOCKET" ]]; then
    command tmux -L "$DUCTWORK_TMUX_SOCKET" "$@"
    return $?
  fi
  command tmux "$@"
}

# .what = the tmux command PREFIX for a remote call
# .why  = a remote invocation is text handed to ssh, not an argv we control,
#         so the seam has to enter it as text. expanded locally, on purpose.
#
# .note = it emits its own TRAILING SPACE, because it is a prefix that call
#         sites concatenate directly: "$(__duct_tmux_cmd)has-session -t ...".
#         a caller who added the space instead would have to remember it at
#         all 13 call sites, and the one they forgot would produce
#         `tmuxhas-session` — a command not found, at a remote, under ssh,
#         which is the worst place to debug a missing space.
__duct_tmux_cmd() {
  if [[ -n "$DUCTWORK_TMUX_SOCKET" ]]; then
    printf "tmux -L '%s' " "$DUCTWORK_TMUX_SOCKET"
    return 0
  fi
  printf 'tmux '
}

######################################################################
# registry: ~/.ductwork/hosts/{host}.json and ~/.ductwork/ducts/{session}.json
######################################################################

__duct_ensure_dirs() {
  DUCTWORK_DIR="${DUCTWORK_DIR:-$HOME/.ductwork}"
  mkdir -p "$DUCTWORK_DIR/hosts"
  mkdir -p "$DUCTWORK_DIR/ducts"
}

__duct_register_host() {
  local host="$1"
  __duct_ensure_dirs
  local file="$DUCTWORK_DIR/hosts/$host.json"
  local now
  now=$(date +%s)
  cat > "$file" <<EOF
{
  "lastSeen": ${now}000
}
EOF
}

__duct_unregister_host() {
  local host="$1"
  __duct_ensure_dirs
  rm -f "$DUCTWORK_DIR/hosts/$host.json"
}

# .what = the REMOTE hosts this machine has registered, one name per line
#
# .why  = the `find $DUCTWORK_DIR/hosts` idiom was open-coded at three sites,
#         and each site had to re-learn the same two traps:
#           - `for f in "$dir"/*.json` yields the LITERAL pattern when it
#             matches nought, so a grove (which registers no remote hosts)
#             iterated once over a path that does not exist
#           - `local f` under zsh is `typeset f`, which PRINTS a name that
#             already holds a value — debug noise nobody wrote
#         one helper, so a fourth caller inherits both cures rather than
#         rediscovers them.
#
# .note = localhost is NOT in this list. it is always present and never
#         registered, so each caller adds it itself — which keeps the
#         local/remote split visible at the call site rather than hidden here.
__duct_host_list() {
  __duct_ensure_dirs
  local host_file host_name
  while IFS= read -r host_file; do
    [[ -n "$host_file" ]] || continue
    host_name=$(basename "$host_file" .json)
    [[ -n "$host_name" ]] && printf '%s\n' "$host_name"
  done < <(find "$DUCTWORK_DIR/hosts" -type f -name '*.json' 2>/dev/null)
}

# .what = write the duct's registry ROW, and keep the fields it does not own
#
# .why  = duct.open is a FINDSERT, and it calls this on the FOUND path too —
#         so this runs on every crew.boot, not merely at creation. an earlier
#         revision wrote the row with a fixed heredoc, which meant a find
#         DESTROYED every field the row carried beyond these two.
#
#         that is a findsert that erases on find, which is the opposite of the
#         verb's promise (rule.require.get-set-gen-verbs: gen keeps what it
#         finds). it went unseen while the row held only `host` + `createdAt`,
#         both of which this function re-derives — so the clobber was
#         invisible, and would have stayed invisible until the first field
#         somebody needed to SURVIVE a reboot. `sessionId` is that field.
#
# .what = the lock file that serializes read-modify-write on ONE registry row
#
# .why  = a duct row is updated by a read → jq merge → write, and two writers
#         that interleave lose one update entirely. the field that makes this
#         load-critical is `sessionId`: a clone's identity, and the only lever
#         that makes a crash recoverable (`claude --resume <uuid>`). a boot
#         that races a session-bind drops it, and the loss is SILENT — the row
#         stays valid json, merely absent the one field nobody will look for
#         until a crash.
#
# .how  = one lock per ROW, never one global lock. two ducts are independent,
#         so a shared lock would serialize the whole fleet's boot for no gain.
#
# .note = `tr '/' '_'` because a session name may be nested (`treename/role`),
#         and a lock must be ONE flat file — a nested lock path would need its
#         own mkdir, which is the very race this guards.
#
# .note = `flock` is already a dependency of this corpus (`termwork.sh` holds
#         five call sites), so this adds no new host requirement.
__duct_lock_path() {
  local key="$1"
  __duct_ensure_dirs
  mkdir -p "$DUCTWORK_DIR/.locks"
  printf '%s\n' "$DUCTWORK_DIR/.locks/$(printf '%s' "$key" | tr '/' '_').lock"
}

# .how  = merge onto whatever the row already holds. `createdAt` is kept too,
#         since a findsert that re-stamps a creation time reports the age of
#         the last boot rather than of the duct.
#
# .lock = the read AND the write are both inside the lock, so there is no
#         stale-read window to re-verify. that is stronger than the
#         read-then-lock-then-re-verify shape `termwork.sh` uses, and it is
#         available here only because this row is read for no purpose other
#         than to merge onto it.
__duct_register_duct() {
  local session="$1"
  local host="$2"
  __duct_ensure_dirs
  local file="$DUCTWORK_DIR/ducts/$session.json"
  # session may contain a slash (e.g. treename/role) -> nested path;
  # create the parent dir so the registry write does not fail
  mkdir -p "$(dirname "$file")"
  local now lockpath
  now=$(date +%s)
  lockpath=$(__duct_lock_path "duct.$session")

  {
    if ! flock 9; then
      echo "💥 MalfunctionError: duct.register could not lock the row for '$session'" >&2
      echo "   fix: retry; if it persists, check for a stale lock at $lockpath" >&2
      return 1
    fi

    local prior='{}'
    if [[ -f "$file" ]]; then
      prior=$(jq -c '.' "$file" 2>/dev/null) || prior='{}'
      [[ -z "$prior" ]] && prior='{}'
    fi

    local next
    next=$(printf '%s' "$prior" | jq \
      --arg host "$host" \
      --argjson now "${now}000" \
      '. + { host: $host, createdAt: (.createdAt // $now) }') || return 1
    printf '%s\n' "$next" > "$file"
  } 9>"$lockpath"
}

# .what = read the claude session id a duct is bound to ('' if none)
# .why  = a duct that hosts a clone carries that clone's IDENTITY, so a crash
#         is recoverable: `claude --resume <uuid>` addresses the exact
#         conversation. without it the only lever is `--continue`, which
#         resolves by cwd-recency — and a mechanic and a foreman SHARE one
#         worktree, so "the most recent conversation in this directory" is a
#         race between the two roles, decided by whoever spoke last.
#
#         the absence of this field carries weight too: a duct with no
#         sessionId is a bare shell BY DESIGN (a foreman), so a reviver knows
#         to leave it alone rather than type a claude into it.
__duct_get_duct_session_id() {
  local session="$1"
  __duct_ensure_dirs
  local file="$DUCTWORK_DIR/ducts/$session.json"
  if [[ -f "$file" ]]; then
    jq -r '.sessionId // ""' "$file" 2>/dev/null
  fi
}

# .what = bind a duct to a claude session id
#
# .lock = the SAME row key as `__duct_register_duct`, deliberately — these two
#         are the pair that actually races. duct.open is a findsert, so a
#         re-boot calls register while a live clone may be mid-bind; a lock
#         private to each function would serialize each against itself and
#         leave the cross-pair race wide open.
#
#         ⇒ the key names the ROW, never the operation. that is what makes two
#           different mutations of one row mutually exclusive.
__duct_set_duct_session_id() {
  local session="$1"
  local id="$2"
  __duct_ensure_dirs
  local file="$DUCTWORK_DIR/ducts/$session.json"
  mkdir -p "$(dirname "$file")"
  local lockpath
  lockpath=$(__duct_lock_path "duct.$session")

  {
    if ! flock 9; then
      echo "💥 MalfunctionError: duct.session.set could not lock the row for '$session'" >&2
      echo "   fix: retry; if it persists, check for a stale lock at $lockpath" >&2
      return 1
    fi

    local prior='{}'
    if [[ -f "$file" ]]; then
      prior=$(jq -c '.' "$file" 2>/dev/null) || prior='{}'
      [[ -z "$prior" ]] && prior='{}'
    fi

    local next
    next=$(printf '%s' "$prior" | jq --arg id "$id" '. + { sessionId: $id }') || return 1
    printf '%s\n' "$next" > "$file"
  } 9>"$lockpath"
}

__duct_unregister_duct() {
  local session="$1"
  __duct_ensure_dirs
  local file="$DUCTWORK_DIR/ducts/$session.json"
  rm -f "$file"
  # session may be nested (treename/role) -> remove the now-empty parent dir
  rmdir --ignore-fail-on-non-empty "$(dirname "$file")" 2>/dev/null || true
}

__duct_get_duct_host() {
  local session="$1"
  __duct_ensure_dirs
  local file="$DUCTWORK_DIR/ducts/$session.json"
  if [[ -f "$file" ]]; then
    jq -r '.host // ""' "$file" 2>/dev/null
  fi
}

######################################################################
# the parts
######################################################################

# .what = load every part of this lib — ALWAYS, and all of them
# .why  = ductwork outgrew the window a reviewer reads in one pass (3.4k
#         lines, 173KB), so no lens could grade it whole. the parts cut it
#         along the subjects its own verbs and prefixes already named.
#
#         the list is EXPLICIT, never a glob: the set of parts is the claim.
#         a glob would load a stray file as silently as it would skip a
#         renamed one. `shellLibParts.integration.test.ts` holds this list
#         equal to the files on disk, so a part added or dropped fails loud.
#
#         each part holds only function definitions, so the load order among
#         them is free — a call resolves at run time, never at source time.
#         they load LAST so every core definition and constant — the tmux
#         seam above all — is in place.
#
# 🔴 a caller sources ductwork.sh, never a part. a part sourced alone is a
#    half-defined lib that fails on its first call into the core.
DUCTWORK_PARTS=(uri life pane signal io host)
__duct_load_parts() {
  local here part
  here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  for part in "${DUCTWORK_PARTS[@]}"; do
    if [[ ! -f "$here/ductwork.$part.sh" ]]; then
      echo "💥 MalfunctionError: ductwork part absent: $here/ductwork.$part.sh" >&2
      return 1
    fi
    source "$here/ductwork.$part.sh"
  done
}
__duct_load_parts || return 1
