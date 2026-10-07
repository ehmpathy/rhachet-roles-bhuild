#!/usr/bin/env bash
######################################################################
# ductwork.host — the HOSTS: which machines hold ducts, and what each one holds
#
# 🔴 .a PART of ductwork.sh — sourced, never executed, and only BY ductwork.sh.
#     a caller sources ductwork.sh, which loads every part. see
#     __duct_load_parts there for why the lib is cut into parts at all.
#
# .holds = the host canon and per-host session sweep, duct.list over them,
#          and duct.host.add / del / list
######################################################################

######################################################################
# .what = is this host string THIS machine?
#
# .why  = "this machine" had TWO spellings, and they disagreed on behavior:
#           ""           the uri's empty authority (duct:///x)
#           "localhost"  the registry + refresh token (duct.open wrote this)
#
#         so `duct.list` printed `duct://localhost/x` for a duct opened as
#         `duct:///x`. that is not merely a cosmetic mismatch — it breaks the
#         one rule the uri exists to keep, that what you READ is what you TYPE.
#         pasted back, `duct://localhost/x` has a non-empty authority, so it
#         takes the SSH path (`ssh localhost`) rather than the direct tmux
#         path. same duct, different code path, and the difference is invisible.
#
#         the canonical form is EMPTY, because that is what the uri grammar
#         already declares. `localhost` is still ACCEPTED — a human may type
#         `--host localhost`, and the extant registry is full of it — but it is
#         cast to the canonical form on the way in, and never written out.
######################################################################
__duct_host_is_here() {
  [[ -z "$1" || "$1" == "localhost" ]]
}

# .what = cast any form of a host to its canonical one
# .why  = one caster, so every read/compare/write site agrees. an inline test at
#         each site is how the two forms diverged in the first place
__duct_as_host_canonical() {
  if __duct_host_is_here "$1"; then echo ""; else echo "$1"; fi
}

######################################################################
# .what = list the live tmux sessions a host holds
#
# .return 0 = the host ANSWERED; stdout holds its sessions, maybe zero of them
#         3 = the host was never reached; stdout says nought about its ducts
#
# .why 3 here but 2 at the verb: this is an INTERNAL signal, and it needs a code
#      that tmux's own exits cannot collide with — tmux uses 1 for "no server".
#      the VERBS translate it to exit 2, the declared constraint code, because
#      the caller is the one who fixes it (wake the grove)
#
# .why a distinct code: this used to be one `ssh … 2>/dev/null`, so an empty
#      stdout meant BOTH "this grove holds no ducts" and "the tunnel is down".
#      no caller could tell the two apart — and `__duct_refresh_host` reads an
#      empty list as "every registered duct is stale" and DELETES them. so a
#      single blink of a tunnel silently wiped the registry for a grove whose
#      ducts were all still running, and `duct.list` reported a confident
#      `(none)` about a machine it never spoke to (rule.forbid.failhide).
#
# .how ssh reserves exit 255 for its OWN failures — dns, connect, auth. a
#      remote `tmux list-sessions` exits 0 with sessions or 1 with none, and
#      never 255, so 255 says unambiguously "the box was never reached".
#
# .note a LOCAL probe always answers: tmux with no server exits 1, which is an
#       answer of zero ducts, not a failure to ask
######################################################################
__duct_list_host_sessions() {
  local host="$1"
  if __duct_host_is_here "$host"; then
    __duct_tmux list-sessions -F "#{session_name}" 2>/dev/null
    return 0
  fi
  # NOT named `status`: zsh reserves `status` as a READ-ONLY special parameter
  # (its alias for `$?`), so `local status=0` dies with `read-only variable`.
  # bash has no such reservation, so the name passes there and fails only in
  # the human's shell — the same dialect trap as `${!a[@]}` and `${~want}`
  local out="" exitcode=0
  # `|| exitcode=$?` — a bare assignment here dies under the wrappers' `set -e`
  # and carries ssh's 255 out as the process exit, so the `return 3` below (and
  # every caller's unreachable branch) is dead code. see the probe's header
  # .why ConnectTimeout — a poll must be BOUNDED per subject (term=poll). a
  #      hibernated grove whose tunnel HANGS (rather than refuses) would
  #      otherwise stall every caller until tcp gives up, which is minutes,
  #      and git.crew.poll now asks one of these per registered host on every
  #      babysit tick. a slow box must never hide a live fleet.
  # ⚠️ `-n` carries weight, and its absence is invisible in this function.
  #
  # .why = ssh READS STDIN by default, to forward it to the remote command. so
  #        when a caller drives this from a `while read` loop —
  #
  #          while IFS= read -r h; do __crew_derive_sessions "$h"; done \
  #            < <(__duct_host_list)
  #
  #        — the first ssh DRAINS the loop's own input, and the loop ends after
  #        one iteration. `git.crew.poll` enumerates one host per registered
  #        grove exactly that way.
  #
  #        measured 2026-09-02, six registered hosts: the loop visited TWO
  #        (localhost, then whichever `find` happened to yield first) and
  #        stopped. so a live grove crew was never asked about, rendered
  #        `👻 phantom` — "its tree AND its ducts are gone" — while its ducts
  #        were up and its panes answered `duct.read` in the same minute.
  #
  #        it is a `term=false-report` twice over. the verdict is untrue, and
  #        the UNREACHED header stayed SILENT — because a host the loop never
  #        reached is a host that never failed, so the one caveat that exists to
  #        name an unread subject could not fire (term=partial-audit: the
  #        subject set was cut by the transport, and the instrument could not
  #        see its own gap).
  #
  #        worse, it is NON-DETERMINISTIC: which grove survives the cut depends
  #        on `find` order, so the same fleet renders differently run to run and
  #        the defect reads as flake.
  #
  # .how = `-n` redirects ssh's stdin from /dev/null. it changes nought about
  #        the remote command, which takes no input, and it costs the caller no
  #        discipline — the alternative is a `< /dev/null` at every call site,
  #        one of which will be forgotten, which is the same class of trap as
  #        the absent space in __duct_tmux_cmd.
  out=$(ssh -n -o ConnectTimeout=8 "$host" "$(__duct_tmux_cmd)list-sessions -F '#{session_name}'" 2>/dev/null) || exitcode=$?
  [[ "$exitcode" == 255 ]] && return 3
  [[ -n "$out" ]] && printf '%s\n' "$out"
  return 0
}

__duct_refresh_host() {
  local host="$1"
  __duct_ensure_dirs

  # cast first, so a refresh never re-writes the `localhost` form back into the
  # registry it is meant to clean
  host="$(__duct_as_host_canonical "$host")"

  # update host lastSeen
  if [[ -n "$host" ]]; then
    __duct_register_host "$host"
  fi

  ####################################################################
  # get live sessions
  #
  # .why the guard: everything below treats the live list as the TRUTH — a
  #      registered duct absent from it is reaped. that is only sound when the
  #      host actually answered. an unreachable host yields the same empty
  #      list, so without this guard a dropped tunnel reaped every duct the
  #      grove still held, and the loss was silent and permanent
  ####################################################################
  local sessions="" reached=0
  sessions=$(__duct_list_host_sessions "$host") || reached=$?
  if [[ "$reached" != 0 ]]; then
    echo "✋ duct: could not reach '$host' — its ducts are left exactly as they were" >&2
    echo "   └─ fix: wake it — rhx git.grove.wake $host" >&2
    return 2
  fi

  # register each session
  local session
  while IFS= read -r session; do
    [[ -z "$session" ]] && continue
    __duct_register_duct "$session" "$host"
  done <<< "$sessions"

  # remove stale ducts for this host
  # recurse: ducts may be nested (ducts/tree/role.json) when session holds a
  # slash; derive session as the path relative to ducts/ so the tree prefix is
  # kept and the grep comparison against live sessions matches
  local f duct_session duct_host
  while IFS= read -r f; do
    [[ -f "$f" ]] || continue
    # cast before the compare: `host` is canonical (empty for here), but a row
    # written earlier may say `localhost`. without this, a stale LOCAL duct
    # never matched its own host and so was never reaped
    duct_host="$(__duct_as_host_canonical "$(jq -r '.host // ""' "$f" 2>/dev/null)")"
    [[ "$duct_host" != "$host" ]] && continue
    duct_session="${f#"$DUCTWORK_DIR"/ducts/}"
    duct_session="${duct_session%.json}"
    if ! echo "$sessions" | grep -qxF "$duct_session"; then
      rm -f "$f"
      rmdir --ignore-fail-on-non-empty "$(dirname "$f")" 2>/dev/null || true
    fi
  done < <(find "$DUCTWORK_DIR/ducts" -type f -name '*.json' 2>/dev/null)
}

######################################################################
# .what = list ducts, optionally narrowed to a duct URI SCOPE
#
#   duct.list                                every duct, from cache
#   duct.list --on duct://grove-1            every duct on a grove
#   duct.list --on duct://ubuntu@host        userinfo is part of the authority
#   duct.list --on duct:///                  every duct on THIS machine
#   duct.list --on duct://grove-1/main       every role in one tree
#   duct.list --on duct://grove-1/main/mechanic   one duct
#   duct.list --refresh                      re-read live state first
#
# .why a URI, not a bare host
#       `--on` takes a duct URI in every other verb. an earlier draft gave list
#       its own `--host <machine>` flag, on the claim that "list narrows by
#       MACHINE, a different kind of value". that claim was wrong: a machine is
#       not a different kind of value, it is a duct URI with the session part
#       left off. `duct://grove-1` says that outright, and it composes — the
#       same address narrows to a tree (`/main`) with no new flag.
#
# .why no `*`
#       a draft between the two demanded `duct://grove-1/*`. the star earned
#       its keep nowhere: `duct://grove-1` had no second sense it needed
#       disambiguated from, so the star was a token to remember AND to quote
#       against your own shell's globber — friction for zero clarity. the
#       address is simply a PREFIX now: name as much as you know.
#
#       (a trailing `*` or `/` is still accepted, so habit costs no error.)
######################################################################
duct.list() {
  local scope=""
  local refresh=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --on) scope="$2"; shift 2 ;;
      --host)
        echo "✋ duct.list: --host is retired; --on takes a duct URI" >&2
        echo "   └─ fix: duct.list --on duct://${2:-<host>}" >&2
        return 2
        ;;
      --refresh) refresh="1"; shift ;;
      *) echo "✋ duct.list: unknown arg '$1'" >&2; return 2 ;;
    esac
  done

  __duct_ensure_dirs

  # if a scope was given, query that machine live
  if [[ -n "$scope" ]]; then
    # a list reads its address as a SCOPE — as much as the human knew to name
    __duct_parse_uri_scope "$scope" || return 2
    local host="$DUCT_HOST" want="$DUCT_SCOPE"

    if [[ -n "$refresh" ]]; then
      __duct_refresh_host "$host"
    fi

    ##################################################################
    # a scope matches a duct that IS it, or that lives UNDER it
    #
    # .why the `/` in the second test: a bare prefix would let the scope
    #       `main` match a duct named `mainline/x`, since the text does start
    #       with `main`. an address names whole segments, so only a `/` may
    #       follow — `main` covers `main/mechanic`, never `mainline/…`
    #
    # .why no glob compare: `[[ "$name" == $want ]]` — an unquoted variable on
    #       the right — pattern-matches in bash but NOT in zsh, which reads a
    #       substituted value as literal text unless written `${~want}`. so the
    #       compare matched no duct at all in the human's shell and every list
    #       came back `(none)`. that was the SAME dialect defect as the
    #       `${!a[@]}` one repaired in this very function, re-made ten lines
    #       later. the cure is syntax that needs no dialect: here the `/` and
    #       the `*` sit in the SOURCE TEXT, and the variable stays quoted.
    ##################################################################
    local sessions="" found=0 reached=0
    sessions=$(__duct_list_host_sessions "$host") || reached=$?
    if [[ -z "$host" ]]; then echo "📡 (this machine)"; else echo "📡 $host"; fi

    # a machine we never reached gets NO verdict about its ducts. `(none)` here
    # would be a claim we cannot back — the grove may hold a dozen
    if [[ "$reached" != 0 ]]; then
      echo "   └─ ✋ unreachable — cannot say which ducts it holds"
      echo "      fix: wake it — rhx git.grove.wake $host"
      return 2
    fi

    while IFS= read -r name; do
      [[ -n "$name" ]] || continue
      if [[ -n "$want" ]]; then
        [[ "$name" == "$want" || "$name" == "$want"/* ]] || continue
      fi
      echo "   ├─ duct://${host}/${name}"
      found=1
    done <<< "$sessions"
    [[ "$found" == 1 ]] || echo "   └─ (none)"
    return
  fi

  # refresh all hosts if requested
  if [[ -n "$refresh" ]]; then
    # refresh this machine (empty host = here)
    __duct_refresh_host ""
    ##################################################################
    # refresh remote hosts
    #
    # .why its own names: zsh's `local` IS `typeset`, and `typeset name` with
    #       no value, for a name that ALREADY holds one, PRINTS it. so a second
    #       `local f` further down this function echoed `f=/…/grove-1.json`
    #       into the duct list — debug noise nobody wrote, on the `--refresh`
    #       path only, since the plain path never set `f` first.
    #
    #       the rule that kills it for good: declare each name exactly ONCE per
    #       function. bash tolerates the re-declare silently; zsh narrates it.
    ##################################################################
    #
    # .why `find`, not a `for … *.json` glob: when the glob matches NO file,
    #      bash leaves it as literal text (so `[[ -f ]]` skips it) but zsh's
    #      default `nomatch` makes it a HARD ERROR that aborts the whole
    #      function. a grove holds zero remote hosts, so `duct.list --refresh`
    #      died on a grove under zsh — it emitted not one duct, local or
    #      remote — while it passed on a laptop, which has a host file.
    #      `find` emits no line for no match, in every shell, with no option
    #      to set
    local host_file host_name
    while IFS= read -r host_file; do
      [[ -f "$host_file" ]] || continue
      host_name=$(basename "$host_file" .json)
      __duct_refresh_host "$host_name"
    done < <(find "$DUCTWORK_DIR/hosts" -type f -name '*.json' 2>/dev/null)
  fi

  ####################################################################
  # collect one `host|session` row per duct, then sort + group
  #
  # .why a PIPE delimiter, not a tab: a LOCAL duct's host is the EMPTY string
  #       (the uri's empty authority), so its row leads with the delimiter. a
  #       tab is IFS *whitespace* — `read` collapses leading runs of it — so
  #       `read -r h s` on "<TAB>dev" handed back h=dev, s="", and the
  #       `[[ -n "$s" ]]` guard then skipped EVERY local duct. bare `duct.list`
  #       printed no ducts and not even `(none)`, because the rows existed and
  #       were each dropped one by one.
  #
  #       a pipe is not IFS whitespace, so an empty leading field survives. no
  #       host or session may hold one — a host is authority text (alnum, `.`,
  #       `-`, `@`) and a session is `<tree>/<role>`.
  #
  # .why no associative array: the grouped-by-host shape begs for one, and this
  #       did use one — walked with `${!host_ducts[@]}`. that is BASH-ONLY
  #       syntax; zsh reads `${!x}` as an indirect expansion it does not support
  #       and dies with `bad substitution`. this file is sourced by an
  #       interactive ZSH, so `duct.list` was broken for every human who ran it
  #       while it passed in every bash check — a dialect split that hid in
  #       plain sight because the test shell was not the human's shell.
  #
  #       the tempting fix was a dialect branch (`${(k)a[@]}` vs `${!a[@]}`).
  #       a sort+group over plain rows needs NO branch at all, and the data is
  #       one line per duct — a scale at which a hash buys no speed. solved at
  #       cause: the array was the only reason a dialect mattered.
  #
  # .note recurse: ducts may be nested (ducts/tree/role.json) when a session
  #       holds a slash; the session is the path relative to ducts/, so the tree
  #       prefix is kept
  ####################################################################
  local rows="" f duct_host duct_session
  while IFS= read -r f; do
    [[ -f "$f" ]] || continue
    # a LOCAL duct records the EMPTY host, which is exactly the uri's empty
    # authority. the registry still holds `localhost` rows written before that
    # was settled, so they are cast on READ — an old row must not print an
    # address that behaves differently than the one it names
    duct_host="$(__duct_as_host_canonical "$(jq -r '.host // ""' "$f" 2>/dev/null)")"
    duct_session="${f#"$DUCTWORK_DIR"/ducts/}"
    duct_session="${duct_session%.json}"
    rows="${rows}${duct_host}|${duct_session}
"
  done < <(find "$DUCTWORK_DIR/ducts" -type f -name '*.json' 2>/dev/null)

  if [[ -z "$rows" ]]; then
    echo "📡 (none)"
    return
  fi

  # one pass over the sorted rows: a new host opens a group, the rest fall under
  # it. each duct prints as the URI you would type back into --on
  #
  # .why LC_ALL=C: the group depends on every row of one host sorted TOGETHER,
  #      which needs the delimiter to sort as a real character. a default
  #      locale collates punctuation as IGNORABLE on the first pass, so `|65`
  #      compared as `65` and `grove-1|main` as `grove1main` — the rows sorted
  #      by SESSION name and the hosts interleaved. the list then printed
  #      `📡 (this machine)` twice, once on each side of `📡 grove-1`, as if a
  #      duct had two homes. `LC_ALL=C` is a byte sort, where `|` is simply
  #      0x7C, so a host's rows are contiguous by construction
  local host_last="__unset__" h s
  printf '%s' "$rows" | LC_ALL=C sort | while IFS='|' read -r h s; do
    [[ -n "$s" ]] || continue
    if [[ "$h" != "$host_last" ]]; then
      if [[ -z "$h" ]]; then echo "📡 (this machine)"; else echo "📡 $h"; fi
      host_last="$h"
    fi
    echo "   ├─ duct://${h}/${s}"
  done
}

duct.host.add() {
  local host="$1"
  if [[ -z "$host" ]]; then
    echo "✋ duct.host.add: host required" >&2
    return 2
  fi
  __duct_register_host "$host"
  echo "📡 host $host added"
}

duct.host.del() {
  local host="$1"
  if [[ -z "$host" ]]; then
    echo "✋ duct.host.del: host required" >&2
    return 2
  fi
  __duct_ensure_dirs

  # remove host
  __duct_unregister_host "$host"

  # remove ducts for this host
  # recurse so nested ducts (ducts/tree/role.json) are found too
  local f duct_host
  while IFS= read -r f; do
    [[ -f "$f" ]] || continue
    duct_host=$(jq -r '.host // ""' "$f" 2>/dev/null)
    if [[ "$duct_host" == "$host" ]]; then
      rm -f "$f"
      rmdir --ignore-fail-on-non-empty "$(dirname "$f")" 2>/dev/null || true
    fi
  done < <(find "$DUCTWORK_DIR/ducts" -type f -name '*.json' 2>/dev/null)

  echo "📡 host $host removed"
}

duct.host.list() {
  __duct_ensure_dirs

  local found=0
  local f h lastSeen ts

  # always show localhost
  echo "📡 localhost (local)"
  found=1

  # .why `find`, not a glob: an unmatched `*.json` is literal text in bash but
  #      a HARD ERROR in zsh (`nomatch`), which aborts the function. a machine
  #      with no remote host registered is the COMMON case here, so the glob
  #      form fails exactly when the list is most needed
  while IFS= read -r f; do
    [[ -f "$f" ]] || continue
    h=$(basename "$f" .json)
    lastSeen=$(jq -r '.lastSeen // 0' "$f" 2>/dev/null)
    ts=$(date -d "@$((lastSeen / 1000))" "+%Y-%m-%d %H:%M" 2>/dev/null || echo "unknown")
    echo "📡 $h (last seen: $ts)"
    found=1
  done < <(find "$DUCTWORK_DIR/hosts" -type f -name '*.json' 2>/dev/null)

  if [[ $found -eq 0 ]]; then
    echo "📡 (no hosts)"
  fi
}
