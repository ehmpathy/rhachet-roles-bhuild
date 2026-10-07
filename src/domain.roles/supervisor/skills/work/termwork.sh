#!/usr/bin/env bash
######################################################################
# .what = termwork — terminal window management via kitty IPC
# .why  = open visible terminals for humans, composable with ductwork
#
# 🔴 .a LIB: sourced, never executed. rhachet scans `skills/` RECURSIVELY,
#     so this file is dispatchable as `rhx termwork` — and a sourced-only
#     file run directly defines its functions, says naught, and exits 0.
#     the verbs that source it are `rhx term.<open|list|audit>`.
#
# usage:
#   term.open --via kitty                     # open kitty with shell
#   term.open --via kitty --cwd /path         # open in directory
#   term.open --via kitty --on work           # attach to local duct
#   term.open --via kitty --on user@host:work # attach to remote duct (cloud)
#   term.open --via kitty --pid 12345         # focus terminal
#   term.stop --via kitty --on work           # stop terminal by duct name
#   term.stop --via kitty --on user@host:work # stop terminal by remote duct
#   term.stop --via kitty --pid 12345         # stop terminal by pid
#   term.read --via kitty --on work           # read terminal by duct name
#   term.read --via kitty --on user@host:work # read terminal by remote duct
#   term.read --via kitty --pid 12345         # read terminal by pid
#   term.send --via kitty --on work --what "cmd"           # send by duct name
#   term.send --via kitty --on user@host:work --what "cmd" # send to remote duct
#   term.send --via kitty --pid 12345 --what "cmd"         # send by pid
#   term.list --via kitty                     # list open terminals
#
# roles (the ergonomic interface — one duct per role at <terminal>/<role>):
#   term.open --via kitty --on worktree --for mechanic  # open worktree, base tab 'mechanic' (worktree/mechanic)
#   term.open --via kitty --on worktree --for foreman   # add tab 'foreman' (worktree/foreman)
#   term.read --via kitty --on worktree --for foreman   # read the foreman tab
#   term.send --via kitty --on worktree --for foreman --what cmd
#   term.stop --via kitty --on worktree --for foreman   # close only the foreman tab
#   term.stop --via kitty --on worktree                 # close worktree + all its role tabs
#
#   - --for <role> = --tab <role> --duct <terminal>/<role> (clean title, role-scoped duct)
#   - the FIRST --for on a fresh terminal is its base tab; a later --for adds a tab
#   - the terminal identity stays <terminal> (--on), so --on finds it for every role
#   - --for is local-only in v1
#
# tabs (the low-level primitives that --for is built on):
#   term.open --via kitty --on dev --tab aux            # add tab 'aux' (attaches session 'aux')
#   term.open --via kitty --on dev --tab aux --duct srv # add tab 'aux' that attaches session 'srv'
#   term.read --via kitty --on dev --tab aux            # read tab 'aux'
#   term.send --via kitty --on dev --tab aux --what cmd # send to tab 'aux'
#   term.stop --via kitty --on dev --tab aux            # close only tab 'aux'
#   term.stop --via kitty --on dev                      # close terminal + all its tabs
#
#   - a tab slug is unique within its terminal; address is (--on <terminal>, --tab <slug>)
#   - --tab <slug> = the tab's title AND addressable id; commands key off this id
#   - the FIRST --tab for a not-yet-open terminal labels its base tab
#   - a later --tab adds a tab; --duct <session> overrides the session it attaches
#     (defaults to <slug>), so the clean label never leaks the real session name
#   - absent --tab/--for = base tab named 'main' (or TERMWORK_BASE_TAB); prior callers unchanged
#   - --pid addresses a terminal, never a tab
#
# remote ducts:
#   - use ductwork to create remote session: duct.open --on duct://grove-1/main/mechanic
#   - use termwork to attach local window:   term.open --via kitty --on user@host:work
#
#   .note ductwork's `--on` takes a duct URI (`duct://<host>/<tree>/<role>`), which is a
#         DIFFERENT vocabulary than termwork's `--on`, which names a terminal. the two
#         are not interchangeable; do not copy one into the other
#   - kitty runs locally, ssh tunnels to remote tmux session
#   - ctrl+x d detaches locally, remote session continues
#
# namespaces:
#   duct.* = session management (tmux, local or cloud)
#   term.* = window management (kitty, always local)
#
# requires: kitty (sudo apt install kitty)
######################################################################

######################################################################
# the two seams
######################################################################

# .what = TERMWORK_DIR       — the REGISTRY: one json row per terminal
#         TERMWORK_SOCKET_DIR — where kitty's listen sockets are bound
#
# .why  = a term has the same two parts a duct has — a ROW that says it exists
#         and a SUBSTRATE that serves it — so it needs a seam on each, and one
#         alone is not enough:
#
#           TERMWORK_DIR alone  → a test writes rows to its own dir, then binds
#                                 a socket in the SHARED /tmp. two runs of one
#                                 test collide there, and a test whose slug
#                                 happens to match a live tree would reach the
#                                 operator's own window.
#           both               → a private world, addressable and disposable
#
#         this is the kitty analogue of DUCTWORK_TMUX_SOCKET, and it is what
#         makes termwork testable at all. it is also what a bhrowser play needs
#         beyond the tests: a way to address a terminal that is definitely not
#         the operator's own (rule.require.hermetic-tests).
#
# .note = the socket dir must be BOTH the bind target and the lookup root. a
#         seam threaded through the bind alone would spawn into the private
#         world and then hunt for it in the shared one — an idempotency branch
#         that never finds its own window, which is the shape of defect #4 all
#         over again.
__term_ensure_dir() {
  TERMWORK_DIR="${TERMWORK_DIR:-$HOME/.termwork}"
  TERMWORK_SOCKET_DIR="${TERMWORK_SOCKET_DIR:-/tmp}"
  mkdir -p "$TERMWORK_DIR" "$TERMWORK_SOCKET_DIR"
}

# .what = cap a socket slug so the final bound path can never exceed sun_path
#
# .why  = a unix socket path is bounded by `sun_path`, 108 bytes INCLUDING the
#         NUL — a kernel ABI limit, not a kitty one. hand kitty a longer value
#         and it prints `Invalid listen_on=…`, drops it, and 🔴 LAUNCHES THE
#         WINDOW ANYWAY, with no control socket bound.
#
#    🔴 that failure is the worst shape available: the window is ALIVE and
#       UNREACHABLE. every crew verb addresses a term through its socket, so
#       none can read it, close it, or even see it — the registry row is
#       written after the socket answers, so an orphan never registers and
#       `term.audit` reports it nowhere. only a human, by hand, can close it.
#
#         measured 2026-09-08 — the tree
#         `rhachet-roles-bhrain.beav.feat-dispute-or-concede-review-budget` on
#         grove-sandpine-v20260901 derives a 110-char path:
#
#           /tmp/kitty-duct-grove-sandpine-v20260901_rhachet-roles-bhrain_beav_feat-dispute-or-concede-review-budget-1437516
#           └─ 16 ─┘└──── 23 ────┘└──────────────── 63 ────────────────┘└─ 8 ─┘
#
#         it is DETERMINISTIC, so every retry spawned one more unreachable
#         window. a long-but-legal repo + branch pair is all it takes.
#
# ⇒ so the slug is bounded HERE, at the one seam where it is derived, and the
#   overflow case keeps a readable head plus a hash of the WHOLE slug — two
#   trees that share a long prefix must not collide on the truncation.
__term_sock_slug_bounded() {
  local slug="$1"
  local dir="${TERMWORK_SOCKET_DIR:-/tmp}"

  # 107 usable chars (108 less the NUL), less the "<dir>/kitty-" prefix, less 9
  # reserved for the "-<pid>" kitty APPENDS to every listen_on it accepts (a
  # linux pid is at most 7 digits; see __term_lookup_socket)
  local budget=$(( 107 - ${#dir} - 7 - 9 ))
  (( budget < 24 )) && budget=24   # a floor, so a deep socket dir still yields a usable name

  if (( ${#slug} <= budget )); then
    printf '%s' "$slug"
    return 0
  fi

  local hash
  hash=$(printf '%s' "$slug" | sha256sum | cut -c1-8)
  printf '%s-%s' "${slug:0:$(( budget - 9 ))}" "$hash"
}

# .what = print usage for one term.* verb (to stdout; exit 0)
# .why  = every verb honors --help/-h with real docs, not an "unknown arg" error
__term_usage() {
  local verb="$1"
  case "$verb" in
    term.open)
      cat <<'EOF'
term.open — open or focus a kitty terminal, or add a role tab

  --via kitty            (required) terminal backend
  --on <terminal>        attach to a duct/terminal by slug (local or user@host:sess)
  --for <role>            role tab at <terminal>/<role> (= --tab <role> --duct <terminal>/<role>)
  --cwd <path>           open in a directory
  --pid <pid>            focus an extant terminal by pid
  --tab <slug>           label the base tab (first open) or add/focus a tab
  --duct <session>       tmux session an added --tab attaches (default: the --tab slug)
  --shell <path>         shell to launch (default: $SHELL)
  --help, -h             show this help

  --for <role> is the ergonomic interface: a role's duct lives at <terminal>/<role>.
  the FIRST --for on a fresh terminal is its base tab; a later --for adds a tab. the
  terminal identity stays <terminal> (--on), so --on finds it for every role. --for
  is local-only and must not be combined with --tab/--duct.

  low-level: --tab <slug> is the tab's title AND addressable id; --duct <session>
  overrides the session it attaches (default: the slug), so the clean label never
  leaks the session name. the FIRST --tab on a not-yet-open terminal becomes its base
  tab (which attaches its --duct, default the slug); a later --tab adds a tab.

  absent --tab/--for = the terminal's base tab (named 'main' by default; override
  with the TERMWORK_BASE_TAB env var). the base tab's label is independent of the
  window title (which the shell keeps as repo:branch). --tab/--for require --on.
EOF
      ;;
    term.stop)
      cat <<'EOF'
term.stop — close a terminal (and all its tabs), or one tab

  --via kitty            (required) terminal backend
  --on <terminal>        the terminal by slug
  --pid <pid>            the terminal by pid
  --for <role>           close only the role's tab (= --tab <role>)
  --tab <slug>           close only that tab (last tab → terminal closes)
  --help, -h             show this help

  no --tab/--for = close the terminal + all its tabs. --tab/--for require --on.
EOF
      ;;
    term.read)
      cat <<'EOF'
term.read — print a terminal's (or tab's) text to stdout

  --via kitty            (required) terminal backend
  --on <terminal>        the terminal by slug
  --pid <pid>            the terminal by pid
  --for <role>           read only the role's tab (= --tab <role>)
  --tab <slug>           read only that tab
  --help, -h             show this help

  --tab/--for require --on.
EOF
      ;;
    term.send)
      cat <<'EOF'
term.send — send text (+Enter) to a terminal or tab

  --via kitty            (required) terminal backend
  --on <terminal>        the terminal by slug
  --pid <pid>            the terminal by pid
  --what <text>          (required) the text to send
  --for <role>           send only to the role's tab (= --tab <role>)
  --tab <slug>           send only to that tab
  --help, -h             show this help

  --tab/--for require --on.
EOF
      ;;
    term.list)
      cat <<'EOF'
term.list — list open terminals, with their tabs nested

  --via kitty            (required) terminal backend
  --help, -h             show this help
EOF
      ;;
  esac
}

# parse duct slug into host and session
# e.g., "user@host:work" -> TERM_HOST="user@host", TERM_SESSION="work"
# e.g., "work" -> TERM_HOST="", TERM_SESSION="work"
# e.g., "local:work" -> TERM_HOST="", TERM_SESSION="work"   (explicitly THIS box)
#
# 🔴 .why `local:` is a host that means "no host"
#
#   an absent host and "this box" read the same here, and downstream they are
#   NOT the same: a tab with no host of its own inherits its TERMINAL's host
#   (see the --tab path). that inheritance is right for every tab but one.
#
#   a tab that must stay local INSIDE a grove window therefore has no way to
#   say so — an empty host is read as "unspecified" and filled in with the
#   grove. `local:` is the word that distinguishes them, and it is not a new
#   one: `--grove local`, `--from local`, and the ledger's own rows already
#   use it for exactly this sense (rule.require.ubiqlang — one word, one sense).
#
# 🔴 TERM_HOST_EXPLICIT is the whole mechanism, and an empty TERM_HOST is not.
#
#   the tab path fills an empty host from the TERMINAL's host, so a parser that
#   merely blanks `local:` is undone one line later — the marker is erased
#   before any caller can read it. measured 2026-09-11: the reviewer tab asked
#   for `local:` and was told "no tmux session … ON grove-sandpine-v20260901".
#
#   so the parser reports TWO facts, never one: what the host is, and whether
#   the caller SAID so. only the second can stop an inheritance.
__term_parse_duct_slug() {
  local slug="$1"
  TERM_HOST_EXPLICIT="no"
  if [[ "$slug" == *:* ]]; then
    TERM_HOST="${slug%:*}"
    TERM_SESSION="${slug#*:}"
    TERM_HOST_EXPLICIT="yes"
    [[ "$TERM_HOST" == "local" ]] && TERM_HOST=""
  else
    TERM_HOST=""
    TERM_SESSION="$slug"
  fi
}

__term_is_remote() {
  [[ -n "$TERM_HOST" ]]
}

__term_register() {
  local pid="$1"
  local socket="$2"
  local cwd="$3"
  local duct="$4"
  local host="$5"
  __term_ensure_dir
  cat > "$TERMWORK_DIR/$pid.json" <<EOF
{
  "pid": $pid,
  "socket": "$socket",
  "cwd": "$cwd",
  "duct": "$duct",
  "host": "$host",
  "tabs": [],
  "startedAt": $(date +%s)000
}
EOF
}

# .what = register a terminal WITHOUT loss of the tabs already recorded for it
# .why  = __term_register always writes "tabs": [], which is right for a fresh
#         spawn and wrong for a re-register of a terminal that is already up.
#         term.open's idempotency branch re-registers on every re-run, so a
#         second `--for mechanic` used to erase the foreman entry written by the
#         first `--for foreman` — a re-run that destroyed a peer tab's record
#         instead of a no-op (rule.require.idempotent-procedures).
#         so: carry the extant tabs across, and write fresh only when absent.
__term_register_keep_tabs() {
  local pid="$1"
  local socket="$2"
  local cwd="$3"
  local duct="$4"
  local host="$5"
  __term_ensure_dir
  local f="$TERMWORK_DIR/$pid.json"

  # no prior record (or an unreadable one) — a fresh write is correct
  if [[ ! -f "$f" ]] || ! jq -e . "$f" >/dev/null 2>&1; then
    __term_register "$pid" "$socket" "$cwd" "$duct" "$host"
    return $?
  fi

  local tmp
  tmp=$(mktemp)
  if ! jq --argjson pid "$pid" \
        --arg socket "$socket" \
        --arg cwd "$cwd" \
        --arg duct "$duct" \
        --arg host "$host" \
        '.pid = $pid | .socket = $socket | .cwd = $cwd | .duct = $duct | .host = $host' \
        "$f" > "$tmp"; then
    rm -f "$tmp"
    echo "💥 __term_register_keep_tabs: could not rewrite registry for pid $pid" >&2
    return 1
  fi
  mv "$tmp" "$f"
}

# .what = findsert a tab entry (slug + kittyId + host) into a terminal's record
# .why  = tabs are tracked per-terminal so stop-all / list / match can find
#         them; findsert keeps re-open idempotent (no duplicate slug). the
#         kittyId is the robust window handle captured at launch (null if the
#         launch printed no numeric id — the match then falls back to title)
#
# 🔴 .why the HOST is stored, added 2026-09-13
#
#    a tab's attach program is baked in at LAUNCH (__term_attach_program): a
#    host makes it `ssh -t <host> "tmux attach ..."`, its absence makes it a
#    plain local `tmux attach`. no op reconciles that afterward.
#
#    so a tab keyed by SLUG ALONE cannot be told apart from a tab of the same
#    name attached to a different box. term.open's findsert found such a tab,
#    focused it, re-labelled it ☘️ local, printed `✨`, and left an ssh to the
#    grove alive underneath — a green report over a tab in a permanent
#    `no sessions` retry loop (term=false-report).
#
#    ⇒ measured 2026-09-13 on every `reviewer` tab of a cloud tree: the seat's
#      duct is LOCAL, the tab was launched before that split and inherited its
#      window's grove, and no repair verb could see the mismatch — because the
#      registry did not record the one field that differed.
#
#    🔴 the general law: a findsert must converge every field its KEY omits, or
#       it is not a findsert — it is a lookup that lies. store the field, and
#       the comparison becomes possible; omit it, and no amount of care in the
#       callers can recover it.
#
# ⚠️ an absent `.host` on a legacy row means UNKNOWN, never local. the reader
#    (__term_tab_host) says so, and the findsert treats unknown as a mismatch —
#    a relaunch costs a tab redraw, and a wrong guess costs a silent ssh loop.
#
# .lock = precondition: caller must hold the terminal lock (see __term_lock_path);
#         this op is a read-modify-write on the tabs array
__term_register_tab() {
  local pid="$1"
  local slug="$2"
  local kittyid="$3"
  local host="${4-}"
  __term_ensure_dir
  local f="$TERMWORK_DIR/$pid.json"
  # the caller holds the lock and has verified the terminal is alive, so an
  # absent record here is an invalid state — fail loud, never drop the tab
  if [[ ! -f "$f" ]]; then
    echo "💥 __term_register_tab: no registry for pid $pid (terminal record vanished?)" >&2
    return 1
  fi
  local tmp
  tmp=$(mktemp)
  # replace any extant tab with the same slug (findsert), then append fresh
  # fail loud on a jq error (a corrupt record) rather than swallow it
  if ! jq --arg slug "$slug" --arg host "$host" --argjson kittyid "${kittyid:-null}" \
    '.tabs = ((.tabs // []) | map(select(.slug != $slug))) + [{"slug": $slug, "kittyId": $kittyid, "host": $host}]' \
    "$f" > "$tmp"; then
    rm -f "$tmp"
    echo "💥 __term_register_tab: failed to update registry for pid $pid (corrupt $f?)" >&2
    return 1
  fi
  # fail loud if the atomic swap fails (disk full, permission) rather than leak
  # the temp file and let the caller believe the tab was recorded
  if ! mv "$tmp" "$f"; then
    rm -f "$tmp"
    echo "💥 __term_register_tab: failed to commit registry for pid $pid" >&2
    return 1
  fi
}

# .what = print a tab's recorded attach host, or the literal `?` when unknown
#
# .why  = the findsert needs to compare where a tab IS attached against where
#         it SHOULD be. three states, and they are not two:
#           ""   the tab attaches this box        (a local tmux attach)
#           <h>  the tab ssh's to <h>             (a remote attach)
#           ?    the row predates the host field  (UNKNOWN — never assume)
#
# ⚠️ the third is why this cannot return an empty string for "absent". an
#    unrecorded host and a local host are the same bytes, and to conflate them
#    reads every legacy row as local — which would leave the exact ssh-loop
#    tabs this field exists to catch, untouched and reported whole.
__term_tab_host() {
  local pid="$1" slug="$2"
  __term_ensure_dir
  local f="$TERMWORK_DIR/$pid.json"
  if [[ ! -f "$f" ]]; then
    echo "💥 __term_tab_host: no registry for pid $pid (terminal record vanished?)" >&2
    return 1
  fi
  # `has("host")` — never `.host // ""`. a row that stored "" (local) and a row
  # that stored no key at all both yield "" under the // operator, and telling
  # them apart is this reader's entire job.
  if ! jq -r --arg slug "$slug" \
    'first(.tabs[]? | select(.slug == $slug)) as $t
     | if $t == null then "?" elif ($t | has("host")) then $t.host else "?" end' "$f"; then
    echo "💥 __term_tab_host: failed to read registry for pid $pid (corrupt $f?)" >&2
    return 1
  fi
}

# .what = print all registered tab slugs for a terminal (one per line)
# .why  = stop-all closes each tab window; term.list nests them
__term_list_tab_slugs() {
  local pid="$1"
  __term_ensure_dir
  local f="$TERMWORK_DIR/$pid.json"
  # an absent record is an invalid state for a live terminal — fail loud
  if [[ ! -f "$f" ]]; then
    echo "💥 __term_list_tab_slugs: no registry for pid $pid (terminal record vanished?)" >&2
    return 1
  fi
  if ! jq -r '(.tabs // [])[].slug' "$f"; then
    echo "💥 __term_list_tab_slugs: failed to read registry for pid $pid (corrupt $f?)" >&2
    return 1
  fi
}

# .what = report tab-slug state: exit 0 = registered, 1 = absent, 2 = unreadable
# .why  = read/send/stop guard against a typo slug → fail clear, not silent no-op.
#         the three-state exit lets callers tell "no such tab" (caller fixes)
#         apart from "corrupt/vanished record" (malfunction) — see __term_require_tab
__term_has_tab() {
  local pid="$1"
  local slug="$2"
  __term_ensure_dir
  local f="$TERMWORK_DIR/$pid.json"
  # an absent record for a live terminal is a malfunction, not "tab absent" —
  # surface it as exit 2 (unreadable) so it is never read as a plain miss
  if [[ ! -f "$f" ]]; then
    echo "💥 __term_has_tab: no registry for pid $pid (terminal record vanished?)" >&2
    return 2
  fi
  local found
  # fail loud (exit 2) on a jq error so a corrupt record is not read as "absent"
  if ! found=$(jq -r --arg slug "$slug" '(.tabs // []) | any(.slug == $slug)' "$f"); then
    echo "💥 __term_has_tab: failed to read registry for pid $pid (corrupt $f?)" >&2
    return 2
  fi
  [[ "$found" == "true" ]]
}

# .what = guard that a tab slug is registered; propagate a clean exit code
# .why  = read/send/stop share one guard so the "absent" (exit 2, caller fixes)
#         vs "unreadable record" (exit 1, malfunction) distinction is made once,
#         not re-derived — and mis-derived — at each call site (failhide hazard).
#         usage: __term_require_tab "$pid" "$slug" "$duct" "term.read" || return $?
__term_require_tab() {
  local pid="$1"
  local slug="$2"
  local duct="$3"
  local verb="$4"
  # `|| rc=$?` — a BARE call that returns non-zero is a command that fails
  # under the wrappers' `set -e`, so the shell dies here and the branches
  # below never run. the same defect made ductwork's whole unreachable-grove
  # diagnosis dead code; clamped by work.surface [case19]
  local rc=0
  __term_has_tab "$pid" "$slug" || rc=$?
  # exit 2 = unreadable record; __term_has_tab already reported it → malfunction
  if [[ $rc -eq 2 ]]; then
    return 1
  fi
  # any other non-zero = the slug is genuinely absent; the caller must fix it
  if [[ $rc -ne 0 ]]; then
    echo "✋ $verb: no tab '$slug' in terminal '$duct'" >&2
    return 2
  fi
  return 0
}

# .what = print the stored kittyId for a tab slug (empty if the slug has none)
# .why  = per-tab ops prefer the robust window id (--match id:N) over the title
__term_get_tab_kittyid() {
  local pid="$1"
  local slug="$2"
  __term_ensure_dir
  local f="$TERMWORK_DIR/$pid.json"
  # an absent record for a live terminal is a malfunction — fail loud, never
  # let the caller silently fall back to a title match on a vanished record
  if [[ ! -f "$f" ]]; then
    echo "💥 __term_get_tab_kittyid: no registry for pid $pid (terminal record vanished?)" >&2
    return 1
  fi
  if ! jq -r --arg slug "$slug" \
    'first(.tabs[]? | select(.slug == $slug) | .kittyId) // empty' "$f"; then
    echo "💥 __term_get_tab_kittyid: failed to read registry for pid $pid (corrupt $f?)" >&2
    return 1
  fi
}

# .what = exit 0 if the value is a clean positive integer (a usable kitty id)
# .why  = names the "did launch yield a real window id?" check so callers read as
#         narrative, not an inline regex; reused by term.open + __term_tab_match
__term_is_kitty_id() {
  [[ "$1" =~ ^[0-9]+$ ]]
}

# .what = echo an ANCHORED kitten @ title selector for a tab slug
#
# 🔴 .why = `title:X` is a kitty REGEX SEARCH, never an equality test. so a
#    slug that is a PREFIX of a peer slug matches the peer's window, and kitty
#    answers with a straight face.
#
#    ⇒ measured 2026-09-13, and it cost a full fleet's worth of tabs: the
#      legacy bare `reviewer` seat is a prefix of `reviewer.take` and
#      `reviewer.give`. every adopt-probe for `reviewer` matched a `.take`
#      window, adopted it with a null id, and left BOTH rows pointed at one
#      window — so `reviewer.take` vanished from its own crew's view while
#      `reviewer` claimed a window it never owned. 12 rows unresolvable.
#
#    a `.` is a regex metacharacter too, so `reviewer.take` would match
#    `reviewerXtake` — harmless today, and free to close here.
#
# ⚠️ the tail is anchored and the HEAD is not, on purpose: __term_tab_label
#    prefixes a ☁️/☘️ glyph to the visible title, so a head anchor would match
#    no real tab at all.
__term_title_match() {
  local slug="$1"
  local escaped
  escaped=$(printf '%s' "$slug" | sed 's/[.[\*^$()+?{}|\\]/\\&/g')
  printf 'title:%s$' "$escaped"
}

# .what = echo the kitten @ --match selector for a tab (prefer id, else title)
# .why  = the stored kittyId is the robust handle; title is the fallback when
#         the launch did not yield a numeric id
__term_tab_match() {
  local pid="$1"
  local slug="$2"
  local kid
  kid=$(__term_get_tab_kittyid "$pid" "$slug") || return 1
  local match
  match="$(__term_title_match "$slug")"
  __term_is_kitty_id "$kid" && match="id:$kid"
  echo "$match"
}

# .what = drop one tab entry (by slug) from a terminal's record
# .why  = term.stop --tab removes just that tab; terminal + other tabs survive
# .lock = precondition: caller must hold the terminal lock (see __term_lock_path);
#         this op is a read-modify-write on the tabs array
__term_unregister_tab() {
  local pid="$1"
  local slug="$2"
  __term_ensure_dir
  local f="$TERMWORK_DIR/$pid.json"
  # the caller holds the lock and has verified the terminal is alive, so an
  # absent record here is an invalid state — fail loud, not a silent no-op
  if [[ ! -f "$f" ]]; then
    echo "💥 __term_unregister_tab: no registry for pid $pid (terminal record vanished?)" >&2
    return 1
  fi
  local tmp
  tmp=$(mktemp)
  if ! jq --arg slug "$slug" '.tabs = ((.tabs // []) | map(select(.slug != $slug)))' \
    "$f" > "$tmp"; then
    rm -f "$tmp"
    echo "💥 __term_unregister_tab: failed to update registry for pid $pid (corrupt $f?)" >&2
    return 1
  fi
  # fail loud if the atomic swap fails rather than leave a stale tab entry while
  # the caller believes the tab was dropped
  if ! mv "$tmp" "$f"; then
    rm -f "$tmp"
    echo "💥 __term_unregister_tab: failed to commit registry for pid $pid" >&2
    return 1
  fi
}

__term_unregister() {
  __term_ensure_dir
  local pid="$1"
  rm -f "$TERMWORK_DIR/$pid.json"
}

# .what = echo the per-terminal lock file path for a terminal pid
# .why  = the tabs array is mutated read-modify-write; every op that touches a
#         terminal's registry (open/read/send/stop --tab and whole-terminal stop)
#         locks on this path so concurrent writes cannot interleave or lose an
#         update (behavior hazard). keyed by pid — the terminal's stable identity —
#         so the --pid and --on paths share one lock. term.open takes it after its
#         (unlocked) duct lookup, then re-verifies the record inside the lock.
__term_lock_path() {
  local pid="$1"
  __term_ensure_dir
  echo "$TERMWORK_DIR/.lock.$pid"
}

__term_find_by_duct() {
  local slug="$1"
  __term_ensure_dir

  # parse the slug to match against stored duct+host
  __term_parse_duct_slug "$slug"
  local want_host="$TERM_HOST"
  local want_session="$TERM_SESSION"

  local f d h pid
  while IFS= read -r -d '' f; do
    [[ -f "$f" ]] || continue
    # surface a corrupt record on stderr and skip just that file, rather than
    # swallow the jq error — a single bad record must not abort the whole scan
    if ! d=$(jq -r '.duct // ""' "$f") || ! h=$(jq -r '.host // ""' "$f"); then
      echo "⚠️  __term_find_by_duct: skipped unreadable record $f (corrupt?)" >&2
      continue
    fi
    if [[ "$d" == "$want_session" && "$h" == "$want_host" ]]; then
      # surface a corrupt record rather than swallow the pid read (failhide)
      if ! pid=$(jq -r '.pid' "$f"); then
        echo "⚠️  __term_find_by_duct: skipped unreadable record $f (corrupt?)" >&2
        continue
      fi
      # check if process still alive
      if kill -0 "$pid" 2>/dev/null; then
        echo "$pid"
        return 0
      else
        # stale entry, clean up
        rm -f "$f"
      fi
    fi
  done < <(find "$TERMWORK_DIR" -maxdepth 1 -name '*.json' -print0 2>/dev/null)
  # return 0 even when not found — empty output is valid, not an error
  # (return 1 breaks scripts with set -euo pipefail)
  return 0
}

__term_get_socket() {
  __term_ensure_dir
  local pid="$1"
  local f="$TERMWORK_DIR/$pid.json"
  if [[ -f "$f" ]]; then
    jq -r '.socket' "$f" 2>/dev/null
  fi
}

# .what = print the stored remote host for a terminal ("" = local)
# .why  = term.open --tab guards remote terminals (tabs are local-only in v1)
__term_get_host() {
  __term_ensure_dir
  local pid="$1"
  local f="$TERMWORK_DIR/$pid.json"
  # an absent record for a live terminal is a malfunction — fail loud so the
  # remote-guard never reads a vanished record as an empty (local) host
  if [[ ! -f "$f" ]]; then
    echo "💥 __term_get_host: no registry for pid $pid (terminal record vanished?)" >&2
    return 1
  fi
  if ! jq -r '.host // ""' "$f"; then
    echo "💥 __term_get_host: failed to read registry for pid $pid (corrupt $f?)" >&2
    return 1
  fi
}

# ── kitty ipc communicators ──────────────────────────────────────────────────
# each wraps one raw `kitten @` call so the verb orchestrators read as narrative
# and the i/o boundary (auth-free unix socket) lives in one named place. exit
# code propagates from kitten; callers decide how to react.
#
# note: --to is a GLOBAL `kitten @` option (before the subcommand); --match is a
# SUBCOMMAND option (after it). kitty rejects --match placed before the subcommand
# with "Unknown option: --match", so every matched op puts --match after the verb.

# .what = focus a tab window by its match selector (exit 0 = focused)
__term_focus_tab() {
  local socket="$1"
  local match="$2"
  kitten @ --to "$socket" focus-window --match "$match" >/dev/null
}

# .what = focus a terminal's base window (exit 0 = focused)
__term_focus_base() {
  local socket="$1"
  kitten @ --to "$socket" focus-window >/dev/null
}

# .what = probe whether a matched window still exists (exit 0 = present)
# .why  = tells a transient focus failure (window present) from a stale entry
__term_probe_tab() {
  local socket="$1"
  local match="$2"
  kitten @ --to "$socket" ls --match "$match" >/dev/null 2>&1
}

# .what = print the command a matched tab ACTUALLY executes — its deepest
#         foreground process, as one space-joined command line
#
# 🔴 .why = every other reader of a tab grades a RECORD of it: the registry's
#    slug, its kittyId, its stored host. all three are claims the tab itself
#    never confirms, and the tab is the only party that knows the truth.
#
#    the attach command is baked in at LAUNCH — `ssh -t <host> tmux attach …`
#    for a grove seat, a plain `tmux attach …` for a local one — and no later
#    verb reconciles it. so a tab can carry the right title, the right id, and
#    the right recorded host while it attaches an entirely different tree, and
#    every record-level check passes it (term=false-report).
#
#    ⇒ measured 2026-09-13: a window registered for `sdk-config…` held tabs
#      whose shells sat in the `svc-reservations…` mirror. the registry agreed with
#      the ledger on every field. only the foreground process disagreed.
#
# ⚠️ it prints the DEEPEST process, never the shallowest: a tab that dropped
#    through its ctrl-c hatch shows the fresh login shell, which is exactly the
#    signal a caller wants — a shell where a tmux attach is owed.
__term_tab_attach() {
  local socket="$1"
  local match="$2"
  kitten @ --to "$socket" ls --match "$match" 2>/dev/null \
    | jq -r 'first(.[].tabs[].windows[]?
             | select((.foreground_processes // []) | length > 0))
             | .foreground_processes[-1].cmdline | join(" ")' 2>/dev/null
}

# .what = launch a new tab titled by $title, attached to tmux session $session,
#         and print the new kitty window id
# .why  = title and session are decoupled: the tab bar shows a clean human label
#         ($title) while the tab attaches a possibly-uglier globally-unique session
#         ($session). callers that pass one slug for both get today's behavior.
#
# .the HOST is the 6th arg, and it selects the ATTACH COMMAND — never the tab
#   a local tab attaches through an interactive login shell; a remote tab
#   attaches through `ssh -t`. everything else about a tab — its title, its
#   registry row, its findsert, its close — is identical, which is exactly
#   why the host belongs HERE and nowhere else. a caller that opens a view
#   should not know which machine the work is on.
# .what = print the shell program a duct tab runs: attach, and SURVIVE a drop
# .why  = a tab's child used to BE the raw `ssh -t host tmux attach`. so when a
#         tunnel died, ssh exited, kitty's child was gone, and kitty closed the
#         window — every grove tab on the box, at once. measured twice on
#         2026-09-08; the second time the cause was an orphan process that held
#         port 36903 mute while the box and NAT stayed up the whole time.
#
# .why the close is NEEDLESS, which is what makes it a defect
#   tmux holds the session AND its scrollback ON THE GROVE. a term tab is a
#   pure viewport onto state that lives elsewhere, so a dead transport should
#   blank the view for seconds — never destroy the window. on reconnect
#   `tmux attach` hands back the full inner contents with no loss.
#
#   ⇒ this names a THIRD axis the work/view split never had. `term=crew`
#     declares WORK (the duct) and VIEW (the tab); the TRANSPORT (the tunnel)
#     is neither, and the view was welded to it. a tab's lifetime belongs to
#     the human's intent alone.
#
# .the exit contract — only a CLEAN detach closes the tab
#   | how the attach ended        | rc  | what happens        |
#   | a human detached (prefix-d) | 0   | exit 0 → tab closes |
#   | the transport dropped       | ≠0  | retry every 5s      |
#   | the session is absent       | ≠0  | retry every 5s      |
#   ⚠️ ctrl-c while it waits drops to an interactive shell rather than closes,
#     so a tab is never lost while a human reads what went wrong.
#
# .note = it does NOT call `git.grove.wake` on failure, on purpose. 14 crews ×
#   3 tabs would stampede one box with 42 concurrent wakes. ONE wake heals every
#   tab on its next retry, which is the same repair at 1/42 the cost.
__term_attach_program() {
  local shell="$1"
  local session="$2"
  local host="${3:-}"
  local attach

  if [[ -n "$host" ]]; then
    attach="ssh -t $(printf '%q' "$host") \"tmux attach-session -t '${session}'\""
  else
    attach="tmux attach-session -t '${session}'"
  fi

  # ⚠️ the trap, not a `sleep || exec`, is what makes ctrl-c safe. a SIGINT
  #   reaches the whole foreground process group, so it kills this shell too —
  #   an `||` on the sleep would never run, and the tab would close on the one
  #   keystroke a human reaches for when they want it to STAY.
  printf '%s\n' \
    "trap 'exec $(printf '%q' "$shell") -l -i' INT" \
    'while true; do' \
    "  if ${attach}; then exit 0; fi" \
    '  printf "\n🦫 duct lost — the work is safe on the grove; only this view dropped.\n"' \
    '  printf "   retry in 5s  ·  ctrl-c for a shell (this tab stays open either way)\n"' \
    '  sleep 5' \
    'done'
}

# .what = the DISPLAY label for a tab — its slug, prefixed by where it runs
# .why  = a tab's host is invisible once it is drawn. that cost naught while
#         every tab in a window shared one host, and it stopped to be free the
#         moment a LOCAL tab could sit beside cloud ones (the reviewer seat).
#         a human who cannot see which is which runs a command on the wrong
#         box and is told naught (term=false-report).
#
# ⚠️ the label is DISPLAY ONLY — the registry keeps the clean slug, because
#    every lookup (__term_has_tab, __term_tab_match, term.stop, term.read)
#    keys on it. the `title:` fallback in __term_tab_match still matches,
#    since kitty matches a title by UNANCHORED regex.
#
# .the pair = ☁️ sky · ☘️ ground. one axis, two ends, so a reader never has to
#             recall which is which — they are opposites on sight.
#
# .why ☘️ over the other green candidates — TWO reasons, the second the wisher's
#
#   1. WIDTH. ☘️ is a base char + VS16, exactly as ☁️ is, so the two occupy the
#      same cell class. every other candidate (herb, sheaf, clover, potted
#      plant) is a full-width emoji, which makes a tab bar of mixed hosts
#      JITTER between its entries — the one surface whose whole job is to be
#      scanned at a glance.
#      .note = those candidates are named in words on purpose. the herb glyph
#              is a BANNED character package-wide (it was the prioritizer's
#              retired artifact), and a rejected-candidate list is not worth
#              a carve-out in a guard that is otherwise a clean grep.
#
#   2. SENSE. the wisher's, on the day it was chosen:
#
#        "☘️ is nice, because it implies you have to get lucky that your
#         machine doesnt have defects"
#
#      ⇒ a local box is not a SAFER box. it is merely YOURS, with its own
#        failures — a stale gitdir, a held lock, a hook that wants a shim it
#        does not have. the glyph carries that, where a house or a mountain
#        would imply a solidity the local box does not possess.
#
# ⚠️ rejected, each for a reason worth a note: 🏠 named a BUILDING (a place,
#    not a ground), which left the pair with no shared axis. ⛺/🏕️ collide on
#    CONCEPT — `camp` is a declared term (an aws account that holds groves,
#    sandpine/infrastructure). 🍄 is taken by init.behavior's stdout, 🌍 by
#    git.grove.keyrack.sh (`env`), 🌱 by the `sprout` term, 🪵 by the beaver's
#    work-item, 🍂 by term.audit's felled-tree row.
#
# ⚠️ checked by grep across skills + briefs — this repo has no glyph catalog,
#    so a grep is the strongest instrument available, and it proves a glyph
#    UNUSED, never unclaimed.
# 🔴 .the ONE site that spells the pair — every other reader calls this
#
#    a second site drifted in on 2026-09-19 (term.list's `where` column, two
#    arms) and the clamp caught it. the two uses are NOT the same shape —
#    a tab title is `<glyph> <slug>`, the where column is `<glyph>  <word>` —
#    so a caller that wants only the MARK had no seam to reach, and spelled it.
#
#    ⇒ the seam is therefore the GLYPH, never the label. a label is one
#      composition of it; the where column is another; the next one is free.
__term_host_glyph() {
  local host="${1:-}"
  if [[ -n "$host" ]]; then printf '☁️'; else printf '☘️'; fi
}

__term_tab_label() {
  local slug="$1" host="${2:-}"
  printf '%s %s' "$(__term_host_glyph "$host")" "$slug"
}

__term_launch_tab() {
  local socket="$1"
  local title="$2"
  local cwd="$3"
  local shell="$4"
  local session="$5"
  local host="${6:-}"
  local label
  label="$(__term_tab_label "$title" "$host")"
  if [[ -n "$host" ]]; then
    kitten @ --to "$socket" launch \
      --type=tab \
      --tab-title "$label" \
      --cwd "$cwd" \
      -- "$shell" -c "$(__term_attach_program "$shell" "$session" "$host")"
    return
  fi
  kitten @ --to "$socket" launch \
    --type=tab \
    --tab-title "$label" \
    --cwd "$cwd" \
    -- "$shell" -l -i -c "$(__term_attach_program "$shell" "$session")"
}

# .what = set an explicit title on the active tab (exit 0 = set)
# .why  = an explicit tab title overrides tab_title_template "{title}", so the tab
#         label is decoupled from the shell's OSC-2 window title (repo:branch stays
#         in the titlebar; the tab bar shows this label instead)
__term_set_tab_title() {
  local socket="$1"
  local title="$2"
  kitten @ --to "$socket" set-tab-title "$title"
}

# .what = print the id of a terminal's base (first) window, empty on failure
# .why  = the base terminal is spawned with the `kitty` binary (not `launch`), so
#         no id is printed; query it here to store as the base tab's robust handle
__term_get_base_window_id() {
  local socket="$1"
  kitten @ --to "$socket" ls 2>/dev/null | jq -r 'first(.[].tabs[].windows[].id) // empty' 2>/dev/null
}

# .what = poll a socket until it answers `ls`, up to ~2s (exit 0 = ready)
# .why  = a fresh kitty creates its listen socket asynchronously; the base-tab
#         title/id calls must not fire against a not-yet-ready (or already dead)
#         socket, which would leak a raw "connect: no such file" error
__term_await_socket() {
  local socket="$1"
  # 60 x 0.1s = ~6s. was 20 (~2s), which is fine for a warm kitty but too tight
  # for the FIRST launch after a boot, where font-cache + gpu init dominate. the
  # extra budget is free on the happy path — the loop returns the instant the
  # socket answers — and is only ever spent on a genuine failure.
  local tries=60
  while (( tries-- > 0 )); do
    kitten @ --to "$socket" ls >/dev/null 2>&1 && return 0
    sleep 0.1
  done
  return 1
}

# .what = look up the live socket uri behind a socket PREFIX (echoes the uri)
# .why  = kitty APPENDS its own pid to `listen_on` unless the value holds the
#         {kitty_pid} placeholder. so `listen_on=unix:/tmp/kitty-duct-foo` does
#         not create /tmp/kitty-duct-foo — it creates /tmp/kitty-duct-foo-121881.
#         verified 2026-08-09 by a direct read of /tmp after a spawn.
#
#         that is why the caller must never construct the final path. it picks a
#         unique PREFIX (stable, per-duct, known before the spawn) and then asks
#         here for whatever kitty actually bound. a glob on a unique prefix is
#         unambiguous; a pid guess is not.
#
#         a stale socket FILE can outlive its kitty, so a candidate is accepted
#         only once it ANSWERS `ls` — the file proves naught, the reply proves a
#         live window (rule.forbid.failhide).
__term_lookup_socket() {
  local prefix="$1"
  local f
  for f in "$prefix" "$prefix"-*; do
    [[ -S "$f" ]] || continue
    if kitten @ --to "unix:$f" ls >/dev/null 2>&1; then
      printf 'unix:%s' "$f"
      return 0
    fi
  done
  return 1
}

# .what = poll a socket PREFIX until one behind it answers, ~6s (echoes the uri)
# .why  = the prefix twin of __term_await_socket, for the spawn path where the
#         final path is kitty's to choose. same budget, same fail-loud contract.
__term_await_socket_prefix() {
  local prefix="$1"
  local tries=60
  local found
  while (( tries-- > 0 )); do
    if found=$(__term_lookup_socket "$prefix"); then
      printf '%s' "$found"
      return 0
    fi
    sleep 0.1
  done
  return 1
}

# .what = report whether a tmux session exists (exit 0 = present)
# .why  = a duct terminal runs `tmux attach-session -t <s>`; if the session is
#         absent the shell exits and the kitty dies instantly — guard first and
#         fail clear instead of a window that vanishes
#
# ⚠️ .the HOST is an argument, never an assumption
#   this took `session` alone and called LOCAL tmux, so a guard on a REMOTE
#   terminal asked this box about a session that lives on a grove — and local
#   tmux answered truthfully about a machine the question was not about. that
#   is the sixth instance of one family in this fleet (crew.poll's localhost
#   pin, duct.open's -d cwd test, crew.boot's skipped cloud tree lookup,
#   duct.send --keys' tmux call, and a grove-lookup error that named the
#   local root for a search under the grove's own ~).
#
#   the cure is the same each time and it is not a smarter check: the host is
#   DATA the caller already holds, so it rides in as an argument. an empty
#   host is local — the same zero value a duct uri uses (duct:///).
__term_has_tmux_session() {
  local session="$1"
  local host="${2:-}"
  if [[ -n "$host" ]]; then
    ssh -n "$host" "tmux has-session -t '$session'" 2>/dev/null
    return
  fi
  tmux has-session -t "$session" 2>/dev/null
}

# .what = close one window by its match selector (exit 0 = closed)
__term_close_window_matched() {
  local socket="$1"
  local match="$2"
  kitten @ --to "$socket" close-window --match "$match"
}

# .what = close a terminal's base window (exit 0 = closed)
__term_close_window_base() {
  local socket="$1"
  kitten @ --to "$socket" close-window
}

# .what = print a matched window's text to stdout (exit 0 = read)
__term_get_text() {
  local socket="$1"
  local match="$2"
  kitten @ --to "$socket" get-text --match "$match"
}

# .what = print a terminal's (base window) text to stdout (exit 0 = read)
__term_get_text_base() {
  local socket="$1"
  kitten @ --to "$socket" get-text
}

# .what = send text + Enter to a matched window (exit 0 = sent)
__term_send_text() {
  local socket="$1"
  local match="$2"
  local what="$3"
  printf '%s\r' "$what" | kitten @ --to "$socket" send-text --match "$match" --stdin
}

# .what = send text + Enter to a terminal's base window (exit 0 = sent)
__term_send_text_base() {
  local socket="$1"
  local what="$2"
  printf '%s\r' "$what" | kitten @ --to "$socket" send-text --stdin
}

term.open() {
  local via=""
  local cwd=""
  local duct=""
  local pid=""
  local tab=""
  local tab_duct=""
  local role=""
  local base_label=""
  local shell="${SHELL:-/bin/bash}"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --via) via="$2"; shift 2 ;;
      --cwd) cwd="$2"; shift 2 ;;
      --on) duct="$2"; shift 2 ;;
      --pid) pid="$2"; shift 2 ;;
      --tab) tab="$2"; shift 2 ;;
      --duct) tab_duct="$2"; shift 2 ;;
      --for) role="$2"; shift 2 ;;
      --shell) shell="$2"; shift 2 ;;
      --help|-h) __term_usage term.open; return 0 ;;
      *) echo "✋ term.open: unknown arg '$1'" >&2; return 2 ;;
    esac
  done

  if [[ -z "$via" ]]; then
    echo "✋ term.open: --via required (e.g., --via kitty)" >&2
    return 2
  fi

  if [[ "$via" != "kitty" ]]; then
    echo "✋ term.open: unknown terminal '$via' (supported: kitty)" >&2
    return 2
  fi

  # --for <role> is role-scoped sugar: it expands to --tab <role> --duct <slug>/<role>,
  # so a role's duct is found at <terminal>/<role>. a fresh terminal's first --for
  # becomes its base tab (which attaches slug/role); a later --for adds a tab. the tab
  # bar shows the clean <role>, never the longer slug/role session name.
  if [[ -n "$role" ]]; then
    if [[ -z "$duct" ]]; then
      echo "✋ term.open: --for requires --on <terminal>" >&2
      return 2
    fi
    if [[ -n "$tab" || -n "$tab_duct" ]]; then
      echo "✋ term.open: --for is shorthand for --tab/--duct; do not combine them" >&2
      return 2
    fi
    # role ducts live at <slug>/<role>, and that holds on EITHER side of the
    # host boundary: a local `tree` yields `tree/mechanic`, a remote
    # `grove:tree` yields `grove:tree/mechanic`. __term_parse_duct_slug splits
    # on the first ':' , so the second form parses back to host=grove,
    # session=tree/mechanic — the exact pair a remote attach needs.
    #
    # this used to refuse a remote --on outright. the refusal was honest and it
    # was a GAP, not a design: the base-open path has attached remote ducts by
    # ssh since v1, so the substrate was never the obstacle — only the tab path
    # had gone unwritten. a human who dispatches to a grove wants a window on it
    # for the same reason they want one locally, and the view axis is free to
    # lose (term=term), so there is no cost that would justify the asymmetry.
    tab="$role"
    tab_duct="$duct/$role"
  fi

  # --tab addresses a tab within a terminal's namespace; --pid names a terminal
  if [[ -n "$tab" && -n "$pid" ]]; then
    echo "✋ term.open: --pid addresses a terminal; use --on <terminal> --tab <slug> for a tab" >&2
    return 2
  fi

  # --duct sets the session an added --tab attaches; it is meaningless without --tab
  if [[ -n "$tab_duct" && -z "$tab" ]]; then
    echo "✋ term.open: --duct sets the session for --tab; it requires --tab <slug>" >&2
    return 2
  fi

  # --tab <slug>: label the base tab (first open) or add/focus a tab in --on terminal
  if [[ -n "$tab" ]]; then
    if [[ -z "$duct" ]]; then
      echo "✋ term.open: --tab requires --on <terminal>" >&2
      return 2
    fi
    cwd="${cwd:-$(pwd)}"

    # find the host terminal by duct (unlocked). the record is re-verified inside
    # the lock below, so a concurrent stop between here and the lock is caught.
    local host_pid
    host_pid=$(__term_find_by_duct "$duct")

    # terminal not open yet → this first --tab/--for becomes its base tab. carry the
    # label in base_label and fall through to the base-open flow below, where the base
    # attaches the tab's duct (tab_duct, default: the slug).
    if [[ -z "$host_pid" ]]; then
      base_label="$tab"
    fi

    # terminal already open → add (or focus) a tab under the per-terminal lock.
    # serialize check→launch→register under the lock (keyed by pid, shared with
    # every other op on this terminal). the brace group holds fd 9 for its
    # duration; return tears it down (unlocks). single-digit fd keeps the redirect
    # parseable when this file is sourced into zsh as well as bash.
    if [[ -n "$host_pid" ]]; then
    local lockpath
    lockpath=$(__term_lock_path "$host_pid")
    {
      if ! flock 9; then
        echo "💥 term.open: could not lock terminal '$duct'" >&2
        return 1
      fi

      # re-verify the terminal still exists (it may have been stopped between the
      # unlocked lookup and here); an empty socket means the record is gone
      local host_socket
      host_socket=$(__term_get_socket "$host_pid")
      if [[ -z "$host_socket" ]]; then
        echo "✋ term.open: terminal '$duct' stopped before the tab could be added" >&2
        return 2
      fi

      # the terminal's HOST — carried down to the session guard and the launch,
      # so a tab lands on the same machine its terminal already attached.
      #
      # ⚠️ fail loud on a corrupt read rather than treat an unreadable host as
      #    local: an empty string is the LOCAL value, so a swallowed error would
      #    silently aim a remote tab at this box (rule.forbid.failhide).
      local host_remote
      if ! host_remote=$(__term_get_host "$host_pid"); then
        echo "💥 term.open: could not read terminal '$duct' (corrupt registry?)" >&2
        return 1
      fi

      # the tab attaches the tmux session named by --duct (default: the slug — so
      # title==session stays today's behavior). the title stays the clean slug even
      # when the session is a longer unique name.
      #
      # the value may carry a host (`grove:tree/mechanic`), so parse it: the SESSION
      # is what tmux is asked about on the far side, never the whole slug.
      #
      # ⚠️ this parse runs BEFORE the findsert, not just before the launch: the
      #    findsert re-labels the tab it finds, and the label names the host.
      local tab_session tab_host tab_host_explicit
      __term_parse_duct_slug "${tab_duct:-$tab}"
      tab_host="$TERM_HOST"
      tab_session="$TERM_SESSION"
      tab_host_explicit="$TERM_HOST_EXPLICIT"
      # the terminal's own host wins where the tab slug named NONE — a tab
      # lands on the machine its terminal attached, unless it says otherwise.
      #
      # ⚠️ "named none" and "named local" are different, and the difference is
      #    the reason this reads TERM_HOST_EXPLICIT rather than emptiness. an
      #    explicitly-local tab in a grove window is the review seat, and it
      #    must NOT inherit the grove — that inheritance is the stall the seat
      #    exists to dodge (define.usecase.review-a-grove-tree-locally).
      [[ -z "$tab_host" && "$tab_host_explicit" != "yes" ]] && tab_host="$host_remote"

      # findsert: focus an extant live tab (no dup); heal a truly stale entry
      # `|| has_rc=$?` — see the guard above; a bare call dies under `set -e`
      local has_rc=0
      __term_has_tab "$host_pid" "$tab" || has_rc=$?
      if [[ $has_rc -eq 2 ]]; then
        # unreadable record — __term_has_tab already reported it (malfunction)
        return 1
      fi
      if [[ $has_rc -eq 0 ]]; then
        local match
        if ! match=$(__term_tab_match "$host_pid" "$tab"); then
          echo "💥 term.open: could not derive match for tab '$tab' (corrupt registry?)" >&2
          return 1
        fi

        # 🔴 CONVERGE THE ATTACH, never merely the label.
        #
        #    the attach program is baked in at launch — `ssh -t <host> tmux
        #    attach` or a plain local `tmux attach` — and no later op rewrites
        #    it. so a tab whose recorded host differs from the one computed for
        #    THIS call is not a tab to focus; it is a tab pointed at the wrong
        #    machine, and its slug is the only thing about it that still fits.
        #
        #    ⇒ measured 2026-09-13: a `reviewer` tab launched before the local
        #      seat split inherited its window's grove. after the split it was
        #      found here, focused, re-labelled ☘️ local, and reported `✨` —
        #      while the ssh underneath asked the grove for a session that only
        #      ever existed on this box. `no sessions`, retried every 5s,
        #      forever, under a green report (term=false-report).
        #
        # ⚠️ `?` (an unrecorded host) counts as a MISMATCH on purpose. the two
        #    costs are not comparable: a needless relaunch redraws one tab,
        #    while a wrong assume-local leaves a silent ssh loop no verb can
        #    see. so the unknown is spent, once, per legacy tab.
        local tab_host_was
        if ! tab_host_was=$(__term_tab_host "$host_pid" "$tab"); then
          return 1
        fi
        if [[ "$tab_host_was" != "$tab_host" ]]; then
          local was_where="$tab_host_was" now_where="$tab_host"
          [[ "$tab_host_was" == "" ]] && was_where="this box"
          [[ "$tab_host_was" == "?" ]] && was_where="unrecorded (pre-dates the host field)"
          [[ -z "$now_where" ]] && now_where="this box"
          echo "♻️  term.open: tab '$tab' attaches $was_where, but its duct runs on $now_where"
          echo "   └─ its attach is baked in at launch, so it is replaced rather than re-labelled"
          # close it, drop the row, and fall through to the launch below. a
          # close that fails means the window was already gone, which is the
          # same outcome we want — so only the ROW write is fatal here.
          __term_close_window_matched "$host_socket" "$match" || true
          if ! __term_unregister_tab "$host_pid" "$tab"; then
            echo "💥 term.open: could not drop the stale-host row for tab '$tab'" >&2
            return 1
          fi
          has_rc=1
        fi
      fi

      if [[ $has_rc -eq 0 ]]; then
        if __term_focus_tab "$host_socket" "$match"; then
          # 🔴 a findsert CONVERGES the tab, it does not merely locate one.
          #
          #   the ☁️/☘️ label is what makes a window of mixed hosts readable,
          #   and a label applied only at LAUNCH reaches no tab that already
          #   exists — which, on the day it shipped, was every tab in the
          #   fleet. so the feature would have read as built and been inert.
          #
          #   the re-label is safe on a tab that already carries it (the label
          #   is a pure function of slug+host), and it is the reason a plain
          #   `crew.show` now backfills every tab it touches.
          #
          # ⚠️ no --match: the focus above made this the ACTIVE tab, which is
          #    what set-tab-title addresses. a window-id match would target
          #    the wrong grain (__term_tab_match yields a WINDOW selector).
          if ! __term_set_tab_title "$host_socket" "$(__term_tab_label "$tab" "$tab_host")"; then
            echo "⚠️  term.open: tab '$tab' found, but its label could not be set" >&2
          fi
          echo "🖥️  term://$duct tab '$tab' found (in pid $host_pid)"
          return 0
        fi
        # focus failed — probe before we heal: a still-present window means a
        # transient failure (fail loud, never dup); an absent one is stale (heal)
        if __term_probe_tab "$host_socket" "$match"; then
          echo "💥 term.open: tab '$tab' exists but could not be focused (transient error?)" >&2
          return 1
        fi
        # heal the stale entry; fail loud if the registry write itself fails,
        # so we never launch a fresh tab over an inconsistent record
        if ! __term_unregister_tab "$host_pid" "$tab"; then
          echo "💥 term.open: could not heal stale tab '$tab' entry (registry write failed)" >&2
          return 1
        fi
      fi

      # the ROW may be absent while the TAB is live — adopt, never duplicate.
      #
      # .why = __term_has_tab reads the REGISTRY, and a registry row can be
      #        lost while the window it named lives on (a crash, a reboot, or
      #        an earlier op that rewrote the record with "tabs": []). trust
      #        the row alone and we launch a SECOND tab titled the same as the
      #        first — two views of one duct, and the human left to guess which
      #        is which. so before a launch we ask kitty itself.
      #
      #        this is the row-vs-substrate split a duct already has: the row
      #        says what we believe, the socket says what IS. when they
      #        disagree, the substrate wins and the row is healed to match.
      # ⚠️ ANCHORED (__term_title_match). a bare `title:$tab` is a regex search,
      #    so the legacy `reviewer` slug matched a `reviewer.take` window and
      #    adopted it — the crossing that emptied a crew's view of its own seat.
      if __term_probe_tab "$host_socket" "$(__term_title_match "$tab")"; then
        # ⚠️ an ADOPTED tab's host is a guess — kitty knows the window, never
        #    what its shell attached. record the computed host rather than `?`:
        #    it is the best claim available, and a wrong one self-corrects on
        #    the next findsert, which will see the mismatch and relaunch.
        if ! __term_register_tab "$host_pid" "$tab" "null" "$tab_host"; then
          echo "💥 term.open: found live tab '$tab' but could not record it" >&2
          return 1
        fi
        __term_focus_tab "$host_socket" "$(__term_title_match "$tab")"
        echo "🖥️  term://$duct tab '$tab' found (adopted — was live but unrecorded)"
        return 0
      fi

      # guard: a tab attaches a tmux session; if it is absent the shell exits
      # and the tab dies instantly. fail clear before we spawn (matches base-open).
      if ! __term_has_tmux_session "$tab_session" "$tab_host"; then
        local where="on this box"
        [[ -n "$tab_host" ]] && where="on $tab_host"
        echo "✋ term.open: no tmux session '$tab_session' $where — create it first (tmux new-session -d -s '$tab_session')" >&2
        return 2
      fi

      # wait for the listen socket to answer before we drive it — when a terminal
      # was opened moments ago its kitty socket may not yet be ready, so a tab
      # launch that fires too soon leaks a raw "connect: no such file" error and
      # fails. mirror base-open: await the socket, fail loud if it never answers.
      if ! __term_await_socket "$host_socket"; then
        echo "💥 term.open: terminal '$duct' socket never answered for tab '$tab'" >&2
        return 1
      fi

      # launch the tab; capture the new kitty window id printed on stdout (robust handle)
      local tab_id
      if ! tab_id=$(__term_launch_tab "$host_socket" "$tab" "$cwd" "$shell" "$tab_session" "$tab_host"); then
        echo "💥 term.open: failed to open tab '$tab' in terminal '$duct'" >&2
        return 1
      fi

      # store the id only if launch printed a clean integer, else null (title match)
      local kitty_id="null"
      __term_is_kitty_id "$tab_id" && kitty_id="$tab_id"

      # the host is recorded from the SAME variable the launch just consumed
      # (__term_launch_tab took "$tab_host"), so the row cannot drift from the
      # program it describes — the one property that makes the findsert's
      # comparison above trustworthy.
      if ! __term_register_tab "$host_pid" "$tab" "$kitty_id" "$tab_host"; then
        echo "💥 term.open: tab '$tab' launched but could not be registered" >&2
        return 1
      fi
      echo "🖥️  term://$duct tab '$tab' opened (in pid $host_pid)"
      return 0
    } 9>"$lockpath"
    fi
  fi

  # if --pid given, focus that terminal
  if [[ -n "$pid" ]]; then
    local socket
    socket=$(__term_get_socket "$pid")
    if [[ -z "$socket" ]]; then
      echo "✋ term.open: terminal $pid not found" >&2
      return 2
    fi
    if ! __term_focus_base "$socket"; then
      echo "💥 term.open: failed to focus $pid" >&2
      return 1
    fi
    echo "🖥️  term $pid focused"
    return 0
  fi

  # default cwd to current directory
  cwd="${cwd:-$(pwd)}"

  # if duct specified, check for extant terminal
  if [[ -n "$duct" ]]; then
    local extant_pid
    extant_pid=$(__term_find_by_duct "$duct")
    if [[ -n "$extant_pid" ]]; then
      echo "🖥️  term://$duct found (pid $extant_pid)"
      # propagate the focus exit — a stale socket / dead window must not be
      # reported as a successful open (same fail-loud contract as the tab paths)
      term.open --via kitty --pid "$extant_pid"
      return $?
    fi
  fi

  # parse duct slug for remote support
  local duct_host=""
  local duct_session=""
  if [[ -n "$duct" ]]; then
    __term_parse_duct_slug "$duct"
    duct_host="$TERM_HOST"
    duct_session="$TERM_SESSION"
  fi

  # the base tab's attached session: a --tab/--for on this first open (base_label
  # set) attaches the tab's own duct (e.g. slug/role for --for), while the terminal's
  # identity stays duct_session (the --on value) — so a later --on <slug> still finds
  # it. absent base_label, the base attaches the terminal's own duct (today).
  #
  # ⚠️ this is derived as a SLUG and parsed once, so the host rides with it. it used
  #    to be a bare session name plus a separate refusal for a remote --tab/--for,
  #    and that split is what made the view axis local-only: two values that must
  #    agree, with the second one dropped on the remote arm.
  local base_slug="$duct"
  [[ -n "$base_label" ]] && base_slug="${tab_duct:-$tab}"

  local attach_host="" attach_session=""
  if [[ -n "$base_slug" ]]; then
    __term_parse_duct_slug "$base_slug"
    attach_host="$TERM_HOST"
    attach_session="$TERM_SESSION"
  fi

  # guard: a duct attaches to a tmux session; if that session is absent the attach
  # fails, the shell exits, and the kitty dies within ~0.3s (leaving no window and
  # a confusing dead-socket error). fail clear before we spawn — on EITHER host.
  if [[ -n "$duct" ]]; then
    if ! __term_has_tmux_session "$attach_session" "$attach_host"; then
      local where="on this box"
      [[ -n "$attach_host" ]] && where="on $attach_host"
      echo "✋ term.open: no tmux session '$attach_session' $where — create it first (tmux new-session -d -s '$attach_session')" >&2
      return 2
    fi
  fi

  # the socket path is DERIVED, never guessed.
  #
  # .why = this used to spawn with `listen_on=unix:/tmp/kitty-{kitty_pid}` (kitty
  #        expands {kitty_pid} to ITS pid) and then recover the pid with
  #        `pgrep -n kitty` — "the newest kitty on the box". those two are not the
  #        same process: --detach forks, and any concurrent spawn wins the -n race.
  #        observed 2026-08-09 — kitty held /tmp/kitty-116382 while the caller
  #        registered and polled /tmp/kitty-116409, so every open reported
  #        "socket never came up" against a live, healthy window. 10 parallel
  #        spawns failed 10/10; a serial retry failed too, because the race is
  #        structural rather than load-borne.
  #
  #        so we name the socket ourselves, from the duct slug — stable across
  #        runs, unique per terminal, and knowable BEFORE the spawn. no pid takes
  #        part in the handshake at all.
  local sock_slug
  if [[ -n "$duct" ]]; then
    sock_slug="duct-$(printf '%s' "$duct" | tr -c 'A-Za-z0-9_.-' '_')"
  else
    sock_slug="adhoc-$$-${RANDOM}"
  fi
  # the socket dir is the SEAM — see __term_ensure_dir. every bind and every
  # lookup must agree on it, so it is read once, here, and carried onward.
  __term_ensure_dir
  # ⚠️ bound the slug AFTER the dir is settled — the budget depends on it. this
  # is the one seam where the slug is derived, so the bind, the live lookup, and
  # the pgrep below all inherit the same capped value (__term_sock_slug_bounded)
  sock_slug="$(__term_sock_slug_bounded "$sock_slug")"
  local sockpath="${TERMWORK_SOCKET_DIR}/kitty-${sock_slug}"
  local socket="unix:${sockpath}"

  # idempotency, probed LIVE rather than read from the registry.
  #
  # .why = a registry row can outlive the window it names (the same row-vs-substrate
  #        split a duct has). the socket cannot: if it answers `ls`, a terminal is
  #        genuinely up. so a re-open of an extant terminal focuses it and returns
  #        0 — findsert semantics, safe to re-run (rule.require.idempotent-procedures).
  local socket_live
  if socket_live=$(__term_lookup_socket "$sockpath"); then
    local pid_extant
    pid_extant=$(pgrep -f -- "listen_on=unix:${sockpath}" | head -1)
    # keep_tabs, never register: a re-run must not erase a peer role's tab entry
    __term_register_keep_tabs "${pid_extant:-0}" "$socket_live" "$cwd" "$duct_session" "$duct_host"
    # the base tab carries a role too — record it so term.audit can see it.
    # its host is the TERMINAL's host: the base tab is the window's own attach.
    [[ -n "$base_label" ]] && __term_register_tab "${pid_extant:-0}" "$base_label" "null" "$duct_host"
    __term_focus_base "$socket_live"
    echo "🖥️  term://${duct:-$sock_slug} found (already open)"
    return 0
  fi

  # clear stale socket FILES — the lookup above already proved that no live kitty
  # sits behind any of them, and a leftover file can block a fresh bind
  local stale
  for stale in "$sockpath" "$sockpath"-*; do
    [[ -S "$stale" ]] && rm -f -- "$stale"
  done

  ####################################################################
  # .what = the size override every duct window is launched with
  #
  # .why  = a duct window must NOT inherit a remembered size
  #
  #   kitty's `remember_window_size` defaults to YES, and while it is on it
  #   OVERRIDES `initial_window_width`/`initial_window_height`. so a conf
  #   that plainly declares `initial_window_width 140c` is silently ignored,
  #   and kitty reuses the size of the last window the human closed instead.
  #
  #   that makes the size CACHED STATE rather than a declared option. one
  #   window closed small — a drag, a half-screen snap, a wm that tiles — and
  #   every duct window booted after it inherits that size, indefinitely. no
  #   code changed, so no diff explains it, and the conf reads correct the
  #   whole time. measured 2026-09-03: a duct's kitty client sat at 56x26
  #   under a conf that asked for 140x74.
  #
  # .why it is not merely cosmetic — it corrupts the box detector
  #   tmux sizes a window to its client (`window-size latest`), so a small
  #   client shrinks the pane. a narrow pane WRAPS claude's modal chrome, and
  #   a wrapped option loses its shape — "2. Yes, and…" renders as "2Yes,
  #   and…". `duct.poll`'s classifier keys on that chrome. so a size cached
  #   from an unrelated window quietly degrades the fleet's stall detector.
  #
  # .why we set it HERE, not only in the human's kitty.conf
  #   the conf is another repo's business and another machine's. a duct
  #   window's size is OUR contract, and it must hold on a box whose conf we
  #   do not own. the flag rides the same `-o` list that already carries
  #   `allow_remote_control`, for the same reason.
  #   ⇒ the conf still owes `remember_window_size no`, so a human's OWN
  #     windows honor the size they declare. that is a dev-env-setup change.
  ####################################################################
  local size_opts=(-o "remember_window_size=no")

  # spawn kitty with remote control, on the socket path we just chose
  if [[ -n "$duct" ]]; then
    if [[ -n "$attach_host" ]]; then
      # remote duct: ssh to host and attach to tmux session.
      # ⚠️ the child is the RETRY PROGRAM, never the bare ssh — a dead tunnel
      #    must blank this window, not close it (see __term_attach_program)
      kitty \
        -o "allow_remote_control=yes" \
        -o "listen_on=${socket}" \
        "${size_opts[@]}" \
        --detach \
        --directory "$cwd" \
        -e "$shell" -c "$(__term_attach_program "$shell" "$attach_session" "$attach_host")"
    else
      # local duct: attach to tmux session via interactive login shell
      kitty \
        -o "allow_remote_control=yes" \
        -o "listen_on=${socket}" \
        "${size_opts[@]}" \
        --detach \
        --directory "$cwd" \
        -e "$shell" -l -i -c "$(__term_attach_program "$shell" "$attach_session")"
    fi
  else
    kitty \
      -o "allow_remote_control=yes" \
      -o "listen_on=${socket}" \
      "${size_opts[@]}" \
      --detach \
      --directory "$cwd" \
      -e "$shell"
  fi

  # wait for the listen socket to answer before we drive it — a fresh kitty
  # creates the socket asynchronously; without this the base-tab calls below can
  # fire against a not-ready socket and leak a raw "connect: no such file" error
  if ! socket=$(__term_await_socket_prefix "$sockpath"); then
    # rule.require.safe-by-default + rule.forbid.failhide (task #34): kitty,
    # handed an invalid listen_on, prints "Invalid listen_on=…" and LAUNCHES
    # THE WINDOW ANYWAY with no control socket — so a failed await here does
    # not mean naught happened, it means an unreachable window is alive right
    # now: no crew verb can read/close/focus it (every op addresses the
    # socket), and term.audit cannot see it (its registry row is written only
    # AFTER the socket answers, which this window never did). it compounds
    # under retry — measured ~50 accumulated before a human noticed, because
    # the failure report never killed what it had just spawned. the pid is
    # derivable the same way the success path derives it two lines below: the
    # listen_on VALUE is in the spawned process's own cmdline whether or not
    # kitty honored it.
    local orphan_pid
    orphan_pid=$(pgrep -f -- "listen_on=unix:${sockpath}" | head -1)
    if [[ -n "$orphan_pid" ]]; then
      kill "$orphan_pid" 2>/dev/null
      echo "💥 term.open: kitty spawned but no socket at ${sockpath}-* answered — killed the orphaned window (pid $orphan_pid)" >&2
    else
      echo "💥 term.open: kitty spawned but no socket at ${sockpath}-* answered" >&2
    fi
    return 1
  fi

  # the pid is DERIVED from the unique listen_on we chose, so it names the right
  # process. it is a record only — every later op addresses the socket, not the pid.
  local pid
  pid=$(pgrep -f -- "listen_on=unix:${sockpath}" | head -1)

  __term_register "${pid:-0}" "$socket" "$cwd" "$duct_session" "$duct_host"

  # give the base (first) tab an explicit title so the tab bar shows a short
  # label ("main" by default) instead of the shell's repo:branch window title —
  # the two are separate: the window title (OSC-2, titlebar) stays repo:branch,
  # this only names the tab. register it so it shows in term.list and is
  # addressable as --tab <label>. precedence: an explicit --tab on this first open
  # (base_label) wins, else TERMWORK_BASE_TAB, else 'main'.
  local base_tab="${base_label:-${TERMWORK_BASE_TAB:-main}}"
  # the base tab takes the same ☁️/☘️ prefix its siblings do — the whole point
  # is that a human can sort the tab BAR at a glance, and a bare base tab
  # beside prefixed ones would read as a third, unlabelled kind.
  __term_set_tab_title "$socket" "$(__term_tab_label "$base_tab" "$duct_host")"
  local base_id
  base_id=$(__term_get_base_window_id "$socket")
  __term_is_kitty_id "$base_id" || base_id="null"
  # the base tab IS the window's own attach, so its host is the terminal's
  __term_register_tab "$pid" "$base_tab" "$base_id" "$duct_host"

  if [[ -n "$duct" ]]; then
    if [[ -n "$duct_host" ]]; then
      echo "🖥️  term://$duct opened (pid $pid, cloud)"
    else
      echo "🖥️  term://$duct opened (pid $pid, local)"
    fi
  else
    echo "🖥️  term://shell opened (pid $pid)"
  fi
}

term.stop() {
  local via=""
  local pid=""
  local duct=""
  local tab=""
  local role=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --via) via="$2"; shift 2 ;;
      --pid) pid="$2"; shift 2 ;;
      --on) duct="$2"; shift 2 ;;
      --tab) tab="$2"; shift 2 ;;
      --for) role="$2"; shift 2 ;;
      --help|-h) __term_usage term.stop; return 0 ;;
      *) echo "✋ term.stop: unknown arg '$1'" >&2; return 2 ;;
    esac
  done

  if [[ -z "$via" ]]; then
    echo "✋ term.stop: --via required" >&2
    return 2
  fi

  if [[ "$via" != "kitty" ]]; then
    echo "✋ term.stop: unknown terminal '$via'" >&2
    return 2
  fi

  # --for <role> addresses the role's tab (titled <role>); shorthand for --tab <role>
  if [[ -n "$role" ]]; then
    if [[ -z "$duct" ]]; then
      echo "✋ term.stop: --for requires --on <terminal>" >&2
      return 2
    fi
    if [[ -n "$tab" ]]; then
      echo "✋ term.stop: --for is shorthand for --tab; do not combine them" >&2
      return 2
    fi
    tab="$role"
  fi

  # --tab addresses a tab within a terminal; --pid names a terminal
  if [[ -n "$tab" && -n "$pid" ]]; then
    echo "✋ term.stop: --pid addresses a terminal; use --on <terminal> --tab <slug> for a tab" >&2
    return 2
  fi

  # a tab lives inside a named terminal, so --tab needs --on to name it
  if [[ -n "$tab" && -z "$duct" ]]; then
    echo "✋ term.stop: --tab requires --on <terminal>" >&2
    return 2
  fi

  # lookup pid from duct name
  if [[ -n "$duct" && -z "$pid" ]]; then
    pid=$(__term_find_by_duct "$duct")
    if [[ -z "$pid" ]]; then
      # keep the tab in the message so a supervisor sees which target was meant
      local for_tab=""
      [[ -n "$tab" ]] && for_tab=" (needed for --tab '$tab')"
      echo "✋ term.stop: no terminal for duct '$duct'$for_tab" >&2
      return 2
    fi
  fi

  if [[ -z "$pid" ]]; then
    echo "✋ term.stop: --pid or --on required" >&2
    return 2
  fi

  local socket
  socket=$(__term_get_socket "$pid")
  if [[ -z "$socket" ]]; then
    echo "✋ term.stop: terminal $pid not found" >&2
    return 2
  fi

  # --tab <slug>: close only that tab; the terminal and other tabs survive.
  # serialize the check+close+unregister under the per-terminal lock (keyed by
  # pid) so a concurrent term.open/term.stop of the same terminal cannot
  # interleave registry writes. the brace group holds fd 9; return unlocks.
  if [[ -n "$tab" ]]; then
    local lockpath
    lockpath=$(__term_lock_path "$pid")
    {
      if ! flock 9; then
        echo "💥 term.stop: could not lock terminal '$duct'" >&2
        return 1
      fi

      __term_require_tab "$pid" "$tab" "$duct" "term.stop" || return $?
      local match
      if ! match=$(__term_tab_match "$pid" "$tab"); then
        echo "💥 term.stop: could not derive match for tab '$tab' (corrupt registry?)" >&2
        return 1
      fi
      # if close-window fails the window was already gone; drop the entry and say so
      # truthfully rather than claim "stopped" (fail clear / succeed completely)
      if ! __term_close_window_matched "$socket" "$match"; then
        if ! __term_unregister_tab "$pid" "$tab"; then
          echo "💥 term.stop: tab '$tab' window gone but its entry could not be dropped" >&2
          return 1
        fi
        echo "🖥️  term://$duct tab '$tab' was already gone (unregistered)"
        return 0
      fi
      if ! __term_unregister_tab "$pid" "$tab"; then
        echo "💥 term.stop: tab '$tab' closed but its entry could not be dropped" >&2
        return 1
      fi

      # that close may have taken the terminal's last window down — kitty exits an
      # os window when its final tab closes, so the instance is now gone. detect
      # that (dead pid) and drop the whole record, else a stale entry lingers.
      # the base tab keeps the pid alive, so this fires only on a true last-tab
      # close (honors the vision's "last tab → close terminal").
      if ! kill -0 "$pid" 2>/dev/null; then
        __term_unregister "$pid"
        echo "🖥️  term://$duct tab '$tab' stopped (last tab — terminal closed)"
        return 0
      fi
      echo "🖥️  term://$duct tab '$tab' stopped"
      return 0
    } 9>"$lockpath"
  fi

  # no --tab: close the whole terminal — every terminal is its own kitty
  # instance (one socket), so close each registered tab window, then the base
  # window; the instance exits when its last window closes. with zero tabs this
  # is exactly today's single `close-window` path (backward compatible).
  # held under the same per-terminal lock so a concurrent tab op cannot register
  # or close a tab mid-teardown (behavior hazard: a lost tab or a double close).
  local lockpath
  lockpath=$(__term_lock_path "$pid")
  {
    if ! flock 9; then
      echo "💥 term.stop: could not lock terminal '$pid'" >&2
      return 1
    fi

    # read the tab slugs up front so an unreadable registry fails loud here,
    # rather than a process-substitution that swallows the non-zero exit (failhide)
    local slugs
    if ! slugs=$(__term_list_tab_slugs "$pid"); then
      echo "💥 term.stop: could not read tabs for terminal '$pid' (corrupt registry?)" >&2
      return 1
    fi

    # shut every registered tab window — this now includes the base 'main' tab,
    # so once all are shut the instance exits. a tab window already gone is an
    # expected teardown case (continue), but surface the failure on stderr (fail
    # loud). match by the robust selector (stored id, else title). feed the loop
    # via process substitution on printf — no here-string, which leaks in zsh.
    local slug match
    while IFS= read -r slug; do
      [[ -n "$slug" ]] || continue
      if ! match=$(__term_tab_match "$pid" "$slug"); then
        echo "⚠️  term.stop: could not derive match for tab '$slug' (corrupt registry?)" >&2
        continue
      fi
      if ! __term_close_window_matched "$socket" "$match"; then
        echo "⚠️  term.stop: could not close tab window '$slug' (already gone?)" >&2
      fi
    done < <(printf '%s\n' "$slugs")

    # if the instance is gone (its last window just shut), the teardown is done
    if ! kill -0 "$pid" 2>/dev/null; then
      __term_unregister "$pid"
      echo "🖥️  term $pid stopped"
      return 0
    fi

    # still alive — either an older record with no tabs registered, or a window
    # that would not shut. shut the base window as a fallback; a live instance
    # that still refuses is a real malfunction (fail loud).
    if ! __term_close_window_base "$socket"; then
      if kill -0 "$pid" 2>/dev/null; then
        echo "💥 term.stop: terminal $pid is alive but its window would not close" >&2
        return 1
      fi
      __term_unregister "$pid"
      echo "🖥️  term $pid stopped"
      return 0
    fi

    __term_unregister "$pid"
    echo "🖥️  term $pid stopped"
    return 0
  } 9>"$lockpath"
}

term.read() {
  local via=""
  local pid=""
  local duct=""
  local tab=""
  local role=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --via) via="$2"; shift 2 ;;
      --pid) pid="$2"; shift 2 ;;
      --on) duct="$2"; shift 2 ;;
      --tab) tab="$2"; shift 2 ;;
      --for) role="$2"; shift 2 ;;
      --help|-h) __term_usage term.read; return 0 ;;
      *) echo "✋ term.read: unknown arg '$1'" >&2; return 2 ;;
    esac
  done

  if [[ -z "$via" ]]; then
    echo "✋ term.read: --via required" >&2
    return 2
  fi

  if [[ "$via" != "kitty" ]]; then
    echo "✋ term.read: unknown terminal '$via'" >&2
    return 2
  fi

  # --for <role> addresses the role's tab (titled <role>); shorthand for --tab <role>
  if [[ -n "$role" ]]; then
    if [[ -z "$duct" ]]; then
      echo "✋ term.read: --for requires --on <terminal>" >&2
      return 2
    fi
    if [[ -n "$tab" ]]; then
      echo "✋ term.read: --for is shorthand for --tab; do not combine them" >&2
      return 2
    fi
    tab="$role"
  fi

  # --tab addresses a tab within a terminal; --pid names a terminal
  if [[ -n "$tab" && -n "$pid" ]]; then
    echo "✋ term.read: --pid addresses a terminal; use --on <terminal> --tab <slug> for a tab" >&2
    return 2
  fi

  # a tab lives inside a named terminal, so --tab needs --on to name it
  if [[ -n "$tab" && -z "$duct" ]]; then
    echo "✋ term.read: --tab requires --on <terminal>" >&2
    return 2
  fi

  # lookup pid from duct name
  if [[ -n "$duct" && -z "$pid" ]]; then
    pid=$(__term_find_by_duct "$duct")
    if [[ -z "$pid" ]]; then
      # keep the tab in the message so a supervisor sees which target was meant
      local for_tab=""
      [[ -n "$tab" ]] && for_tab=" (needed for --tab '$tab')"
      echo "✋ term.read: no terminal for duct '$duct'$for_tab" >&2
      return 2
    fi
  fi

  if [[ -z "$pid" ]]; then
    echo "✋ term.read: --pid or --on required" >&2
    return 2
  fi

  local socket
  socket=$(__term_get_socket "$pid")
  if [[ -z "$socket" ]]; then
    echo "✋ term.read: terminal $pid not found" >&2
    return 2
  fi

  # --tab <slug>: read only that tab's window. hold the per-terminal lock across
  # the check→read so a concurrent term.stop --tab cannot close+unregister the
  # tab between the guard and the get-text (TOCTOU race on shared state).
  if [[ -n "$tab" ]]; then
    local lockpath
    lockpath=$(__term_lock_path "$pid")
    {
      if ! flock 9; then
        echo "💥 term.read: could not lock terminal '$duct'" >&2
        return 1
      fi
      __term_require_tab "$pid" "$tab" "$duct" "term.read" || return $?
      local match
      if ! match=$(__term_tab_match "$pid" "$tab"); then
        echo "💥 term.read: could not derive match for tab '$tab' (corrupt registry?)" >&2
        return 1
      fi
      if ! __term_get_text "$socket" "$match"; then
        echo "💥 term.read: failed to read tab '$tab' in terminal '$duct' (stale window?)" >&2
        return 1
      fi
      return 0
    } 9>"$lockpath"
  fi

  # no --tab: read the terminal's base window; fail loud on a stale socket
  if ! __term_get_text_base "$socket"; then
    echo "💥 term.read: failed to read terminal '$pid' (stale socket?)" >&2
    return 1
  fi
}

term.send() {
  local via=""
  local pid=""
  local duct=""
  local what=""
  local tab=""
  local role=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --via) via="$2"; shift 2 ;;
      --pid) pid="$2"; shift 2 ;;
      --on) duct="$2"; shift 2 ;;
      --what) what="$2"; shift 2 ;;
      --tab) tab="$2"; shift 2 ;;
      --for) role="$2"; shift 2 ;;
      --help|-h) __term_usage term.send; return 0 ;;
      *) echo "✋ term.send: unknown arg '$1'" >&2; return 2 ;;
    esac
  done

  if [[ -z "$via" ]]; then
    echo "✋ term.send: --via required" >&2
    return 2
  fi

  if [[ "$via" != "kitty" ]]; then
    echo "✋ term.send: unknown terminal '$via'" >&2
    return 2
  fi

  # --for <role> addresses the role's tab (titled <role>); shorthand for --tab <role>
  if [[ -n "$role" ]]; then
    if [[ -z "$duct" ]]; then
      echo "✋ term.send: --for requires --on <terminal>" >&2
      return 2
    fi
    if [[ -n "$tab" ]]; then
      echo "✋ term.send: --for is shorthand for --tab; do not combine them" >&2
      return 2
    fi
    tab="$role"
  fi

  # --tab addresses a tab within a terminal; --pid names a terminal
  if [[ -n "$tab" && -n "$pid" ]]; then
    echo "✋ term.send: --pid addresses a terminal; use --on <terminal> --tab <slug> for a tab" >&2
    return 2
  fi

  # a tab lives inside a named terminal, so --tab needs --on to name it
  if [[ -n "$tab" && -z "$duct" ]]; then
    echo "✋ term.send: --tab requires --on <terminal>" >&2
    return 2
  fi

  # lookup pid from duct name
  if [[ -n "$duct" && -z "$pid" ]]; then
    pid=$(__term_find_by_duct "$duct")
    if [[ -z "$pid" ]]; then
      # keep the tab in the message so a supervisor sees which target was meant
      local for_tab=""
      [[ -n "$tab" ]] && for_tab=" (needed for --tab '$tab')"
      echo "✋ term.send: no terminal for duct '$duct'$for_tab" >&2
      return 2
    fi
  fi

  if [[ -z "$pid" ]]; then
    echo "✋ term.send: --pid or --on required" >&2
    return 2
  fi

  if [[ -z "$what" ]]; then
    echo "✋ term.send: --what required" >&2
    return 2
  fi

  local socket
  socket=$(__term_get_socket "$pid")
  if [[ -z "$socket" ]]; then
    echo "✋ term.send: terminal $pid not found" >&2
    return 2
  fi

  # --tab <slug>: send only to that tab's window. hold the per-terminal lock
  # across the check→send so a concurrent term.stop --tab cannot close+unregister
  # the tab between the guard and the send-text (TOCTOU race on shared state).
  if [[ -n "$tab" ]]; then
    local lockpath
    lockpath=$(__term_lock_path "$pid")
    {
      if ! flock 9; then
        echo "💥 term.send: could not lock terminal '$duct'" >&2
        return 1
      fi
      __term_require_tab "$pid" "$tab" "$duct" "term.send" || return $?
      local match
      if ! match=$(__term_tab_match "$pid" "$tab"); then
        echo "💥 term.send: could not derive match for tab '$tab' (corrupt registry?)" >&2
        return 1
      fi
      if ! __term_send_text "$socket" "$match" "$what"; then
        echo "💥 term.send: failed to send to tab '$tab' in terminal '$duct' (stale window?)" >&2
        return 1
      fi
      return 0
    } 9>"$lockpath"
  fi

  # no --tab: send to the terminal's base window; fail loud on a stale socket
  if ! __term_send_text_base "$socket" "$what"; then
    echo "💥 term.send: failed to send to terminal '$pid' (stale socket?)" >&2
    return 1
  fi
}

# .what = print a terminal's tabs as an indented tree branch (│ ├─ / │ └─)
# .why  = keeps term.list declarative — the count/glyph render detail lives here,
#         not inline in the orchestrator; the final tab closes with └─
__term_print_tab_tree() {
  local pid="$1"
  local slugs
  if ! slugs=$(__term_list_tab_slugs "$pid"); then
    echo "💥 __term_print_tab_tree: failed to read tabs for pid $pid" >&2
    return 1
  fi
  [[ -n "$slugs" ]] || return 0

  echo "   ├─ tabs"
  local total seen slug glyph where
  # count non-empty lines via process substitution (no here-string, which leaks
  # a `var=$'...'` line in zsh); grep -c . counts the tab slugs
  total=$(printf '%s\n' "$slugs" | grep -c .)
  seen=0
  while IFS= read -r slug; do
    [[ -n "$slug" ]] || continue
    seen=$((seen + 1))
    glyph="├─"
    [[ $seen -eq $total ]] && glyph="└─"
    # 🔴 the ATTACH host, printed per tab. it is the field a stale tab differs
    #    by, and for its whole life it was recorded nowhere and shown nowhere —
    #    so an ssh loop and a healthy local tab rendered identically here, and
    #    a human debugging one had no instrument but a raw jq of the registry.
    where="$(__term_tab_host "$pid" "$slug" 2>/dev/null || echo '?')"
    case "$where" in
      '')  where="$(__term_host_glyph)  local" ;;
      '?') where="⚠️  host unrecorded — a findsert will relaunch it" ;;
      *)   where="$(__term_host_glyph "$where")  $where" ;;
    esac
    echo "   │  $glyph $slug   — $where"
  done < <(printf '%s\n' "$slugs")
}

term.list() {
  local via="" only=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --via) via="$2"; shift 2 ;;
      # ⚠️ --on takes a SUBSTRING of the window slug, never an exact key. a
      #    caller who knows the exact key does not need a list; a caller who is
      #    debugging knows a tree name and wants every window that carries it,
      #    on any grove. an exact match would send them back to `| grep`, which
      #    is the drop this flag exists to close.
      --on) only="$2"; shift 2 ;;
      --help|-h) __term_usage term.list; return 0 ;;
      *) echo "✋ term.list: unknown arg '$1'" >&2; return 2 ;;
    esac
  done

  if [[ -z "$via" ]]; then
    echo "✋ term.list: --via required" >&2
    return 2
  fi

  if [[ "$via" != "kitty" ]]; then
    echo "✋ term.list: unknown terminal '$via'" >&2
    return 2
  fi

  __term_ensure_dir

  local found=0
  local f pid cwd duct host started socket ts slug

  while IFS= read -r -d '' f; do
    [[ -f "$f" ]] || continue

    # validate the record is readable json; a corrupt one fails loud and skips
    if ! jq -e . "$f" >/dev/null 2>&1; then
      echo "⚠️  term.list: skipped unreadable record $f (corrupt?)" >&2
      continue
    fi
    # read one field per line via process substitution — no here-string and no
    # array subscript, both of which are shell-dialect traps (a here-string fed to
    # a brace group leaked a `record=$'...'` line in zsh; array subscripts are
    # 0-based in bash but 1-based in zsh). empty fields are preserved this way.
    {
      IFS= read -r pid
      IFS= read -r cwd
      IFS= read -r duct
      IFS= read -r host
      IFS= read -r started
      IFS= read -r socket
    } < <(jq -r '.pid, .cwd, (.duct // ""), (.host // ""), .startedAt, .socket' "$f")

    # check if process still alive
    if ! kill -0 "$pid" 2>/dev/null; then
      rm -f "$f"
      continue
    fi

    # the --on narrow, applied AFTER the liveness reap so a filtered run still
    # cleans stale records — a filter must never change what the registry holds
    if [[ -n "$only" && "$host:$duct" != *"$only"* && "$duct" != *"$only"* ]]; then
      continue
    fi

    found=1
    # only do epoch math when startedAt is all digits, else show it raw — a
    # defensive guard so a malformed value can never throw a bad-math error again
    if [[ "$started" =~ ^[0-9]+$ ]]; then
      ts=$(date -d "@$((started / 1000))" "+%Y-%m-%d %H:%M" 2>/dev/null || echo "$started")
    else
      ts="$started"
    fi

    # reconstruct full slug for display
    if [[ -n "$host" ]]; then
      slug="$host:$duct"
    else
      slug="$duct"
    fi

    echo ""
    if [[ -n "$duct" ]]; then
      echo "🖥️  term://$slug"
    else
      echo "🖥️  term://shell"
    fi
    echo "   ├─ pid: $pid"
    echo "   ├─ cwd: $cwd"
    if [[ -n "$duct" ]]; then
      echo "   ├─ duct: $slug"
      if [[ -n "$host" ]]; then
        echo "   ├─ host: $host (cloud)"
      else
        echo "   ├─ host: localhost (local)"
      fi
    fi

    # nest any tabs as a branch, then close with `opened:` as the final leaf so a
    # caller that parses the tree sees the same last line whether or not tabs exist
    __term_print_tab_tree "$pid"
    echo "   └─ opened: $ts"
  done < <(find "$TERMWORK_DIR" -maxdepth 1 -name '*.json' -print0 2>/dev/null)

  if [[ $found -eq 0 ]]; then
    echo "🖥️  (none)"
  fi
}