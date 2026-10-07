#!/usr/bin/env bash
######################################################################
# crewwork.view — the VIEW axis: crew.show ↔ crew.hide, and crew.refresh
#
# 🔴 .a PART of crewwork.sh — sourced, never executed, and only BY crewwork.sh.
#     a caller sources crewwork.sh, which loads every part. see
#     __crew_load_parts there for why the lib is cut into parts at all.
#
# .holds = the kitty tabs a human watches a crew through. free to rebuild,
#          so each verb here is safe to repeat. the WORK axis — the ducts,
#          which are not free — lives in crewwork.boot.sh.
######################################################################

######################################################################
# the VIEW check — one seam, read by both the audit and the gate
######################################################################

# .what = print one defect line per tab of ONE tree whose view cannot be
#         vouched for. exit 0 = every tab checks out, 1 = at least one does not
#
# 🔴 .why it exists as a FUNCTION rather than a section of term.audit:
#
#    a report that a human must read, and then act on, is a report that gets
#    skipped on the tick where it mattered. the wisher put it plainly
#    2026-09-13, after a crossed tab they had to notice themselves:
#
#      "why didnt your audit detect this automatically and fix it"
#      "or atleast force you to fix it after poll detected it"
#
#    ⇒ so the check is lifted out of the reporter and into a callable, and
#      `crew.show` runs it on what IT just produced. a verb that WRITES may not
#      report ✨ over a view it cannot vouch for — the verb that made the mess
#      is the one that must refuse to walk away from it.
#
# ⚠️ ONE implementation, two readers. a second copy in the audit would drift,
#    and the two would disagree about which tabs are sound — which is the
#    exact failure class this whole line of work exists to close.
#
# .the three verdicts, in the order they outrank each other:
#   1. UNRESOLVABLE — registered, and kitty will not answer. no other check can
#      hold for that tab, so whatever the window shows is unaudited
#   2. CROSSED      — the tab's live foreground names another tree, or none
#   3. MISHOSTED    — its recorded host is not the one __crew_role_host allows
# .what = grade ONE tab. echo a defect line if it is unsound; exit 1 if so.
#         exit 0 and print naught = that tab is vouched for.
#
# ⚠️ this is the atom the whole family shares — the fleet report, the crew.show
#    gate, and the heal's view axis all call it, so the three can never
#    disagree about what "sound" means
#    (rule.always.vouch-for-what-you-just-wrote, the one-implementation clause).
__crew_tab_defect() {
  local pid="$1" socket="$2" duct="$3" host="$4" slug="$5"
  local match attach want got

  # 🔴 a match this verb cannot DERIVE is a defect, never a pass. it read
  #    `|| return 0` — so a corrupt row, the one case where the tab is least
  #    knowable, was the one case graded sound (rule.forbid.failhide).
  if ! match=$(__term_tab_match "$pid" "$slug" 2>/dev/null); then
    echo "   ├─ 🔴 $slug — its registry row yields no handle at all"
    echo "   │     so this tab cannot be graded. that is a defect, not a pass"
    return 1
  fi

  if ! __term_probe_tab "$socket" "$match"; then
    echo "   ├─ 🔴 $slug — registered, and kitty will not answer for it"
    echo "   │     └─ its handle is stale, so what that window shows is UNAUDITED"
    return 1
  fi

  attach="$(__term_tab_attach "$socket" "$match")"
  if [[ -n "$attach" ]]; then
    [[ "$attach" == *"${duct#*:}"* ]] && return 0   # names THIS tree 🟢
    echo "   ├─ 🔴 $slug — the TAB names another tree, or none"
    echo "   │     └─ runs: $attach"
    return 1
  fi

  want="$(__crew_role_host "$host" "$slug")"
  got="$(__term_tab_host "$pid" "$slug" 2>/dev/null || echo '?')"
  if [[ "$got" == "?" ]]; then
    echo "   ├─ ⚠️  $slug — host unrecorded, owed '${want:-local}'"
    return 0   # a gap, never a violation — it self-corrects on the next relaunch
  fi
  if [[ "$got" != "$want" ]]; then
    echo "   ├─ 🔴 $slug — records '${got:-local}', authorized for '${want:-local}'"
    return 1
  fi
  return 0
}

# .what = the registry row for a tree's window: "<pid>\t<socket>\t<duct>",
#         or exit 1 where the tree has no live window
# .why   = three callers need this lookup; each had its own find+jq before
__crew_term_row() {
  local canon pidf pid duct socket
  canon="$(__crew_canon_name "$1")"
  __term_ensure_dir
  while IFS= read -r pidf; do
    [[ -f "$pidf" ]] || continue
    jq -e . "$pidf" >/dev/null 2>&1 || continue
    duct=$(jq -r '.duct // ""' "$pidf")
    [[ -n "$duct" ]] || continue
    [[ "$(__crew_canon_name "$duct")" == "$canon" ]] || continue
    pid=$(jq -r '.pid' "$pidf")
    kill -0 "$pid" 2>/dev/null || continue
    socket=$(jq -r '.socket // ""' "$pidf")
    [[ -n "$socket" ]] || continue
    printf '%s\t%s\t%s\n' "$pid" "$socket" "$duct"
    return 0
  done < <(find "$TERMWORK_DIR" -maxdepth 1 -name '*.json' 2>/dev/null)
  return 1
}

__crew_view_defects() {
  local tree="$1" grove="$2"
  local host pid socket duct slug rc=0

  host="${grove#cloud://}"
  if [[ "$host" == "local" ]]; then host=""; fi

  # 🔴 ensure the dir HERE, in this shell.
  #
  #    `__crew_term_row` calls `__term_ensure_dir`, and it ran inside a process
  #    SUBSTITUTION below — a subshell. so `TERMWORK_DIR` was set there and
  #    empty in this frame, the jq below read `/$pid.json`, found no file, and
  #    the loop graded ZERO tabs.
  #
  #    ⇒ an empty subject set then returned rc 0, and every reader of this
  #      check — the fleet report, crew.show's gate, the heal — printed a clean
  #      bill over a crew it never looked at. measured 2026-09-13 on
  #      sdk-config.beav.feat-org-scoped-param-derive: the registry claimed 5
  #      tabs, kitty held 3, and `🔐 every tab is vouched for` came back
  #      (term=partial-audit — a verdict over a subject set that was silently
  #      empty; rule.always.vouch-for-what-you-just-wrote, clause 2).
  __term_ensure_dir

  IFS=$'\t' read -r pid socket duct < <(__crew_term_row "$tree") || return 0
  [[ -n "$pid" ]] || return 0

  # 🔴 an unreadable registry is a DEFECT, never an empty tab list. this is the
  #    exact seam the failhide above hid behind, so it fails loud by name.
  local regfile="$TERMWORK_DIR/$pid.json"
  local slugs
  if ! slugs=$(jq -r '(.tabs // [])[].slug' "$regfile" 2>/dev/null); then
    echo "   ├─ 🔴 the window's registry is unreadable — $regfile"
    echo "   │     so NO tab was graded. this is not a clean bill"
    return 1
  fi

  while IFS= read -r slug; do
    [[ -n "$slug" ]] || continue
    __crew_tab_defect "$pid" "$socket" "$duct" "$host" "$slug" || rc=1
  done < <(printf '%s\n' "$slugs")

  return $rc
}

######################################################################
# crew.show  — turn the VIEW on
######################################################################

# .what = open a kitty tab per role, onto ducts that already exist
# .why  = the view is the cheap half of a crew: free to open, free to
#         close, and it never touches the work. crew.boot calls this for
#         its tab pass, and a human calls it directly to look again at a
#         crew they had hidden.
# .the inverse is crew.hide
crew.show() {
  local tree=""
  local grove=""   # unset — derived from the ledger below, never assumed local
  local roles="$CREWWORK_ROLES_DEFAULT"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --tree) tree="$2"; shift 2 ;;
      --grove) grove="$2"; shift 2 ;;
      --roles) roles="$2"; shift 2 ;;
      --quiet) shift ;;  # crew.boot prints its own frame
      --help|-h) awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "${BASH_SOURCE[0]}"; return 0 ;;
      *) echo "✋ crew.show: unknown arg '$1'" >&2; return 2 ;;
    esac
  done

  if [[ -z "$tree" ]]; then
    echo "✋ crew.show: --tree required" >&2
    return 2
  fi

  # an omitted --grove takes the box the ledger says this crew was booted on.
  # `local` is the FALLBACK, for a tree no ledger row has ever named — never
  # the assumption. see __crew_ledger_grove_of for the defect this closes.
  local grove_from_ledger=""
  if [[ -z "$grove" ]]; then
    grove_from_ledger="$(__crew_ledger_grove_of "$tree")"
    grove="${grove_from_ledger:-local}"
  fi

  local host
  host=$(__crew_grove_host "$grove") || return 2

  echo "🦫 chew on it"
  echo ""
  echo "🪵 crew.show --tree $tree"
  # name the box, and name WHERE the choice came from. a view opened on a box
  # the caller never named must say which box, or the next refusal reads as a
  # verdict about the crew rather than about the reach.
  [[ -n "$grove_from_ledger" ]] && echo "   ├─ 🌐 grove: $grove — per the ledger (no --grove given)"

  # the terminal's slug carries the host, so ONE form serves both groves:
  #   local  ->  <tmuxname>
  #   cloud  ->  <grove>:<tmuxname>
  # term.open parses it back into (host, session) and picks its attach command
  # from the host — an ssh -t on a grove, a login shell here. so from crew.show
  # down, there is no local arm and no cloud arm: one call, one path.
  #
  # ⚠️ this used to bail on a cloud crew with "tabs are local-only in v1". the
  #    bail was honest and it was a GAP: the substrate had attached remote ducts
  #    since v1, and only the tab path had gone unwritten. a human who dispatches
  #    to a grove wants a window on it for the same reason they want one here.
  local term_slug
  term_slug="$(__crew_tmux_name "$tree")"
  [[ -n "$host" ]] && term_slug="$host:$term_slug"

  if ! __crew_has_ducts "$tree" "$host"; then
    local where="on this box"
    [[ -n "$host" ]] && where="on $host"
    echo "   └─ 💥 no ducts for '$tree' $where — a view needs work to look at" >&2
    echo "      fix: rhx git.crew.boot --tree $tree --grove $grove" >&2
    return 2
  fi

  local role_list; __crew_roles_into role_list "$roles"
  local role rc
  local failed=0
  echo "   ├─ 🖥️  terms"
  local tmux_name; tmux_name="$(__crew_tmux_name "$tree")"
  for role in "${role_list[@]}"; do
    # term.open reaches tmux, so it takes the TMUX form. a caller may
    # hand us either, so convert here rather than demand one of them.
    # term_slug carries the grove host when there is one — see its derivation.
    #
    # 🔴 a LOCAL-ONLY seat takes the explicit --tab/--duct pair, never --for.
    #    --for is sugar for `--tab <role> --duct <on>/<role>`, and `<on>` is the
    #    WINDOW's slug — which carries the grove host. so the sugar would point
    #    the reviewer's tab at a grove session that does not exist, while its
    #    duct sits here. the tab still joins the crew's own window; only the
    #    session it attaches differs (term.open has taken a per-tab host since
    #    v1, which is why this needs a flag rather than a second window).
    #
    # 🔴 the --duct takes the TMUX form of BOTH halves; the --tab keeps the
    #    dotted one. they are two different namespaces and the split is load-
    #    bearing:
    #      --duct  a tmux session name, so it obeys tmux's '.' -> '_' rewrite.
    #              a dotted role here addresses a session that does not exist,
    #              and term.open answers `no tmux session ... create it first`
    #              about a duct that is plainly up (measured 2026-09-13, on the
    #              first crew.show of a `reviewer.take` seat)
    #      --tab   a kitty tab TITLE, and the key term.audit joins on. it stays
    #              dotted, because the audit canonicalizes the session's role
    #              back to dots before the lookup
    if __crew_role_is_local "$role"; then
      term.open --via kitty --on "$term_slug" \
        --tab "$role" --duct "local:$tmux_name/$(__crew_tmux_name "$role")" \
        --cwd "$(__crew_role_cwd "" "$tree" "$role")" 2>&1 | sed 's/^/   │  ├─ /'
    else
      term.open --via kitty --on "$term_slug" --for "$role" | sed 's/^/   │  ├─ /'
    fi
    rc=${PIPESTATUS[0]}
    if [[ $rc -ne 0 ]]; then
      echo "   │  ├─ ✋ tab '$role' failed (rc=$rc) — its duct is untouched" >&2
      failed=$((failed + 1))
    fi
  done

  # ── focus back on the FIRST role ───────────────────────────────────
  # kitty leaves focus wherever the LAST open landed, so a standard crew
  # lands the human on the FOREMAN — the observer, never the worker. the
  # mechanic is what a human opens a crew to watch, and the first role is
  # the crew's own declaration of which that is (it takes the base tab).
  #
  # this is a findsert, not a fresh capability: term.open on an extant tab
  # focuses it and returns 0. so the re-call costs one ipc round trip and
  # adds no verb to a lib slated to eject into bhrowser.
  #
  # best-effort by design — a focus that fails leaves every tab open and
  # every duct untouched, so it must never turn a good show into a failure
  # (rule.require.safe-by-default: the cheap act cannot cost the expensive one)
  #
  # ⚠️ .the TMUX form here too, and it is easy to miss: this call was left on
  #    the raw `$tree` when the loop above was converted, so it addressed a
  #    session name tmux does not carry and the focus silently never landed.
  #    it is best-effort with stderr discarded, so the miss was swallowed by
  #    the very design that makes it safe — a `failhide` this comment is the
  #    only guard against. any NEW term.open call takes __crew_tmux_name.
  #
  # ⚠️ and `--for` is the WRONG sugar when the first role is a LOCAL seat — it
  #    expands to `--duct <term_slug>/<role>`, and term_slug carries the grove
  #    host, so it addresses a grove session for a duct that lives here. that
  #    was invisible while every local seat sorted after a grove one; a
  #    `crew.show --roles reviewer.take,reviewer.give` puts one first, and the
  #    focus silently never lands. so the local case takes the explicit pair,
  #    exactly as the open loop above does (this is a findsert — term.open on an
  #    extant tab focuses it).
  local focus="${role_list[0]}"
  __crew_show_focus() {
    if __crew_role_is_local "$focus"; then
      term.open --via kitty --on "$term_slug" \
        --tab "$focus" --duct "local:$tmux_name/$(__crew_tmux_name "$focus")" \
        --cwd "$(__crew_role_cwd "" "$tree" "$focus")" >/dev/null 2>&1
      return $?
    fi
    term.open --via kitty --on "$term_slug" --for "$focus" >/dev/null 2>&1
  }
  if (( ${#role_list[@]} > 1 )); then
    if __crew_show_focus; then
      echo "   │  └─ ✔ ${#role_list[@]} tab(s) — 👁️  focus on $focus"
    else
      echo "   │  └─ ✔ ${#role_list[@]} tab(s) — ✋ could not focus $focus" >&2
    fi
  else
    echo "   │  └─ ✔ ${#role_list[@]} tab(s)"
  fi
  echo "   └─ 🔧 ducts: untouched"

  echo ""
  if (( failed > 0 )); then
    echo "🦫 tail slap — $failed tab(s) failed"
    return 1
  fi

  # 🔴 the POST-AUDIT — this verb vouches for what it just produced, or it
  # does not claim success.
  #
  # .why = every tab op above reports on its own call: opened, found, focused.
  #        not one of them reads the RESULT. so a crew.show that crossed a tab
  #        onto another tree, or adopted a window kitty will not answer for,
  #        printed `✔ 5 tab(s)` and `dam fine` over a view that watches no duct
  #        (term=false-report). the human found it; the verb never could.
  #
  # ⚠️ it grades the WHOLE tree, never just the roles this call touched. a
  #    --roles subset that leaves a peer tab crossed has still left the crew's
  #    view broken, and a per-call scope would report clean over it — the
  #    literal-subject-set defect, one rung up (rule: derive, never name).
  local defects
  if ! defects="$(__crew_view_defects "$tree" "$grove")"; then
    echo "🦫 tail slap — the view is drawn, and it cannot be vouched for"
    echo "$defects"
    echo "   ├─ heal it → rhx git.crew.heal --tree $tree --what view --mode apply"
    # ⚠️ a view heal refuses where the DUCT is down — a tab needs work to look
    #    at, and `💀 down` is crew.boot's verdict to render. so the second rung
    #    is named here rather than left for the human to infer from a refusal.
    echo "   └─ if that reports 💀 no live duct, the WORK axis is the defect →"
    echo "      rhx git.crew.boot --tree $tree --roles <role>"
    return 1
  fi
  [[ -n "$defects" ]] && echo "$defects"

  echo "🦫 dam fine! in view — every tab vouched for"
  return 0
}

######################################################################
# crew.hide  — turn the VIEW off
######################################################################

# .what = close a crew's kitty tabs and leave every clone at work
# .why  = "close the window" and "end the work" are two different
#         intents, and only one is reversible. a tab is a VIEW; a duct is
#         the work. to hide a crew is to stop the watch — the clone keeps
#         its tmux session, its shell, and its claude conversation.
# .the inverse is crew.show
crew.hide() {
  local tree=""
  local grove=""   # unset — derived from the ledger below, never assumed local

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --tree) tree="$2"; shift 2 ;;
      --grove) grove="$2"; shift 2 ;;
      --roles) shift 2 ;;  # accepted for symmetry; a hide closes the whole window
      --help|-h) awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "${BASH_SOURCE[0]}"; return 0 ;;
      *) echo "✋ crew.hide: unknown arg '$1'" >&2; return 2 ;;
    esac
  done

  if [[ -z "$tree" ]]; then
    echo "✋ crew.hide: --tree required" >&2
    return 2
  fi

  # the same derivation crew.show takes — an inverse that reads a different box
  # than its forward verb is not an inverse. see __crew_ledger_grove_of.
  if [[ -z "$grove" ]]; then
    grove="$(__crew_ledger_grove_of "$tree")"
    grove="${grove:-local}"
  fi

  local host
  host=$(__crew_grove_host "$grove") || return 2

  echo "🦫 chew on it"
  echo ""
  echo "🪵 crew.hide --tree $tree"

  # the SAME slug crew.show opened with — a hide that cannot address what a show
  # opened is not an inverse. see crew.show for the one-form derivation.
  #
  # ⚠️ TWO defects sat on this one line, and the second outlived the first:
  #    1. it bailed on a cloud crew ("no tabs to hide"), which was true only
  #       while crew.show refused to open them. it is now a false report.
  #    2. it passed the RAW dotted tree where term.open registers the TMUX form,
  #       and __term_find_by_duct matches by exact string — so a hide on any tree
  #       with a '.' in its name (i.e. every one of ours) addressed a terminal
  #       that does not exist. crew.show's own focus call carries a caution about
  #       this exact miss; the caution was written and the peer verb was never
  #       checked against it.
  local term_slug
  term_slug="$(__crew_tmux_name "$tree")"
  [[ -n "$host" ]] && term_slug="$host:$term_slug"

  echo "   ├─ 🖥️  terms"
  term.stop --via kitty --on "$term_slug" 2>&1 | sed 's/^/   │  └─ /'
  local rc=${PIPESTATUS[0]}
  echo "   └─ 🔧 ducts: untouched — the crew is still at work"
  echo ""

  # propagate the tab failure — never report a hide that did not happen.
  #
  # .why = this used to end `|| true`, so a term.stop that failed still
  #        printed "out of sight, still on the job". that is a FALSE REPORT
  #        in its most costly shape: the ordinary success format, over
  #        content that is untrue, from a run that exited 0. the human
  #        looks away from a window that is still on their screen.
  #        (rule.forbid.failhide; term=false-report._.choice._.md)
  if [[ $rc -ne 0 ]]; then
    echo "🦫 tail slap — the tabs would NOT close (rc=$rc); the crew is still in view" >&2
    echo "   └─ the ducts are untouched either way — no work was lost" >&2
    return 1
  fi

  echo "🦫 out of sight, still on the job"
  echo "   └─ look again: rhx git.crew.show --tree $tree"
  return 0
}

# .what = repaint a crew's terminals, and un-strand its geometry
#
# usage:
#   crew.refresh --tree <slug>                # both roles
#   crew.refresh --tree <slug> --who mechanic # one role
#
# .why = a supervisor must never type `duct.refresh`
#        (rule.always.entool-the-layer-you-drop-below). that rule's own
#        clause is the reason this exists: where its table names no crew
#        verb, the absence IS the gap, and it is closed in the same round
#        rather than worked around one layer down.
#
# 🔴 .why a supervisor needs it at all — the CLIPPED STONE
#        tmux sizes a window to its client, so a window stranded in
#        `window-size manual` no longer tracks its terminal and stays
#        narrow. a narrow pane wraps claude's chrome, and then:
#          - a stone clips before its verdict — `blocked ✋…`
#          - a modal option loses its shape — `2. Yes, and…` -> `2Yes, and…`
#            and the box detector reads a LIVE MODAL as an empty box
#        ⇒ the second is the dangerous one: the duct then goes unbabysat,
#          and the sweep reports it healthy (term=false-report).
#
#        the strand is not hypothetical — `git.grove.auth` sets `manual`
#        on purpose and restores it from a `trap … EXIT`, which does not
#        fire on SIGKILL. so the value outlives the run that wrote it.
#
# .note = non-destructive by construction: no program dies, no state is
#         lost. `window-size latest` is tmux's OWN default — this hands
#         geometry back to the terminal rather than takes it.
crew.refresh() {
  local tree="" grove="" who="all"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --tree) tree="$2"; shift 2 ;;
      --grove) grove="$2"; shift 2 ;;
      --who) who="$2"; shift 2 ;;
      --help|-h) awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "${BASH_SOURCE[0]}"; return 0 ;;
      *) echo "✋ crew.refresh: unknown arg '$1'" >&2; return 2 ;;
    esac
  done

  if [[ -z "$tree" ]]; then
    echo "✋ crew.refresh: --tree required" >&2
    echo "   └─ e.g. crew.refresh --tree test-fns.beav.feat-tempdir-autoprune" >&2
    return 2
  fi

  if [[ -z "$grove" ]]; then
    grove="$(__crew_ledger_grove_of "$tree")"
    grove="${grove:-local}"
  fi

  local host
  host=$(__crew_grove_host "$grove") || return 2

  # ⚠️ --who all IS safe here, unlike on crew.send. a repaint carries no
  #    payload and answers no prompt, so there is no keystroke to land on
  #    the wrong modal — the refusal crew.send makes has no cause here.
  #    ⇒ and `all` is the RIGHT default: a stranded geometry is a property
  #      of the tmux SESSION, so it strands every role at once.
  local roles
  if [[ "$who" == "all" ]]; then roles="mechanic foreman"; else roles="$who"; fi

  local rc=0 role uri
  for role in $roles; do
    uri="$(__crew_duct_uri "$host" "$tree" "$role")"
    duct.refresh --on "$uri" || rc=$?
  done
  return $rc
}
