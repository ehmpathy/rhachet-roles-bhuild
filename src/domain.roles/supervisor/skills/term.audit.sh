#!/usr/bin/env bash
######################################################################
# .what = audit which ducts have a kitty term tab — live AND lost
#
# .why  = duct.list shows tmux sessions; term.list shows kitty tabs —
#         but neither answers "which duct has NO visible term tab?".
#         a foreman whose tab was closed (or died) still has a live
#         duct, so it vanishes from view yet stays live. this skill
#         joins the two: per tree, per role, it reports tab present vs
#         absent, so a supervisor can spot a tree with no term and
#         reopen it.
#
# 🔴 .it also answers the question a DEAD terminal raises
#
#    when a kitty dies — a tunnel drop, a crash, a human close — its
#    registry row OUTLIVES it, and that row names the tree, the grove,
#    and every role tab it held. the live join skips those rows on
#    sight (the pid is gone), so for the life of this skill the one
#    record that survives a terminal's death was read and discarded on
#    the same line.
#
#    ⇒ measured 2026-09-08: 25 registry rows, ~5 live kitties. 20 rows
#      named exactly which crew each closed term held, and no verb
#      consumed one — so "which crew was in that term?" was answered by
#      a hand-typed `cat ~/.termwork/*.json | jq`.
#
# ⚠️ .the LIVE half is localhost-only, and now says so out loud
#
#    the duct scan reads `__duct_list_host_sessions localhost`, so a
#    GROVE crew's duct sits outside its subject set — a partial audit
#    (term=partial-audit). the LOST half carries no such bound: it
#    reads the registry, which stores `.host`, so a grove term that
#    died is reported by name.
#
# usage:
#   rhx term.audit             # every duct, plus every term that died
#   rhx term.audit --absent    # only ducts with NO term tab
#   rhx term.audit --help
#
# guarantee:
#   - read-only: no open, no close, no kill, and above all no REAP
#   - joins live tmux sessions against the termwork registry
#   - flags each tree/role: 🖥️ tab open | ✋ no tab
#   - reports every dead terminal's row, and parts a crew that lost
#     its view (tree still in the ledger) from debris left behind by
#     a felled tree (no ledger row)
#   - fail-fast on errors
######################################################################

set -euo pipefail

# source ductwork + termwork functions
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/ductwork.sh"
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/termwork.sh"
# crewwork carries the LEDGER, which is what parts a crew that lost its view
# from debris a felled tree left behind. it is the only source that outlives a
# session, and it is cross-grove by construction (term=ledger)
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/crewwork.sh"

# parse args (filter out rhachet internal flags)
only_absent=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --absent) only_absent="1"; shift ;;
    --skill|--repo|--role) shift 2 ;;  # skip rhachet internal flags
    --help|-h)
      awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"
      exit 0
      ;;

    # ⚠️ FAIL LOUD — never `shift` an unknown flag away (rule.forbid.failhide).
    -*) echo "✋ term.audit: unknown flag '$1'" >&2
        echo "   known: --absent --help" >&2
        exit 2 ;;
    *) shift ;;
  esac
done

TERMWORK_DIR="${TERMWORK_DIR:-$HOME/.termwork}"

# ── collect live term tabs: key "tree/role" -> pid ───────────────────
# .why probe, not trust: a terminal's pid stays alive while ANY of its tabs
# lives, but the registry keeps every tab slug in .tabs[] even after that
# tab's window is gone. so a pid-alive check alone false-reports a dead tab
# as open. probe each tab against live kitty (__term_probe_tab) so a stale
# entry (window gone, a peer tab keeps the pid up) reads as NO tab.
declare -A TAB_PID
declare -A TAB_ATTACH   # "duct/slug" -> the command that tab actually executes
LOST=()        # one "duct|host|pid|roles" per terminal whose process is gone
LIVE_TABS=()   # one "duct|pid|slug" per registered tab of a LIVE terminal
if [[ -d "$TERMWORK_DIR" ]]; then
  while IFS= read -r f; do
    [[ -f "$f" ]] || continue
    jq -e . "$f" >/dev/null 2>&1 || continue
    pid=$(jq -r '.pid' "$f")
    duct=$(jq -r '.duct // ""' "$f")
    [[ -n "$duct" ]] || continue

    # 🔴 a DEAD terminal is not a dead end. its row is the ONLY surviving
    # record of which crew that window held, and of which roles it showed —
    # the tmux session it watched may be alive on a grove with no local
    # trace at all. capture the row; never skip past it.
    if ! kill -0 "$pid" 2>/dev/null; then
      host=$(jq -r '.host // ""' "$f")
      roles=$(jq -r '[(.tabs // [])[].slug] | join(" ")' "$f")
      LOST+=("$duct|$host|$pid|$roles")
      continue
    fi

    socket=$(jq -r '.socket // ""' "$f")
    [[ -n "$socket" ]] || continue
    while IFS= read -r slug; do
      [[ -n "$slug" ]] || continue
      # 🔴 collect the tab BEFORE the probe, and collect it unconditionally.
      #
      # .why = the MIX check below grades a tab's recorded ATTACH HOST against
      #        the host its role is authorized to sit on. that is a registry ×
      #        ledger question, so it holds for a grove crew exactly as well as
      #        a local one — while every line beneath it is bounded by a
      #        localhost tmux scan. to gate this collection on the probe, or on
      #        the scan, would inherit a bound the check does not have.
      LIVE_TABS+=("$duct|$pid|$slug")
      # derive the robust match (id:N, else title:slug), then probe live kitty
      match=$(__term_tab_match "$pid" "$slug" 2>/dev/null) || continue
      __term_probe_tab "$socket" "$match" || continue  # stale entry → skip
      TAB_PID["$duct/$slug"]="$pid"
      # 🔴 and ask the TAB what it actually runs. the probe above proves a
      # window answers to that match; it proves naught about which tree that
      # window watches (__term_tab_attach). this is the one fact no record
      # holds, so it is read here and graded in the ATTACH section below.
      TAB_ATTACH["$duct/$slug"]="$(__term_tab_attach "$socket" "$match")"
    done < <(jq -r '(.tabs // [])[].slug' "$f")
  done < <(find "$TERMWORK_DIR" -maxdepth 1 -name '*.json' 2>/dev/null)
fi

# ── collect the ledger: tree -> grove ────────────────────────────────
# .why the ledger, not tmux: `__duct_list_host_sessions localhost` cannot see a
# grove crew, and most lost terms watched one. the ledger holds every tree a
# crew was booted on, whatever box it sits on, and `crew.fell` drops the row —
# so presence in the ledger is what parts a LIVE crew that lost its view from
# DEBRIS a felled tree left behind.
declare -A LEDGER_GROVE
while IFS=$'\t' read -r ltree lgrove; do
  [[ -n "$ltree" ]] && LEDGER_GROVE["$ltree"]="$lgrove"
done < <(__crew_ledger_rows)

# ── collect live ducts (tmux sessions), keyed by tree ────────────────
# raw tmux session names are ground truth (dedupes the dotted alias)
declare -A TREE_ROLES   # tree -> space-joined roles
declare -A SEEN
while IFS= read -r session; do
  [[ -n "$session" ]] || continue
  # a role duct is tree/role; skip a bare session with no role
  [[ "$session" == */* ]] || continue
  # ⚠️ the ROLE is canonicalized, not merely the tree. tmux rewrites EVERY '.'
  #    in a session name to '_', so a dotted role (`reviewer.take`) arrives here
  #    as `reviewer_take` while the TAB slug crew.show registered is the dotted
  #    form. keyed raw, TAB_PID misses and every such seat reports `✋ NO term
  #    tab` about a tab that is open (term=false-report).
  role="$(__crew_canon_name "${session##*/}")"
  tree="${session%/*}"
  key="$tree|$role"
  [[ -n "${SEEN[$key]:-}" ]] && continue
  SEEN[$key]=1
  TREE_ROLES["$tree"]="${TREE_ROLES[$tree]:-} $role"
done < <(__duct_list_host_sessions localhost)

# ── report ───────────────────────────────────────────────────────────
echo "🦫 chew on it — ducts vs kitty tabs"
echo ""
echo "🪵 term.audit${only_absent:+ --absent}"

any_absent=0
trees=()
while IFS= read -r t; do
  [[ -n "$t" ]] && trees+=("$t")
done < <(printf '%s\n' "${!TREE_ROLES[@]}" | sort)

total=${#trees[@]}
i=0
for tree in "${trees[@]}"; do
  i=$((i + 1))
  tglyph="├─"; [[ $i -eq $total ]] && tglyph="└─"
  cont="│"; [[ $i -eq $total ]] && cont=" "

  # dedupe + sort roles for this tree
  roles=()
  while IFS= read -r r; do
    [[ -n "$r" ]] && roles+=("$r")
  done < <(printf '%s\n' ${TREE_ROLES[$tree]} | sort -u)

  # does this tree have any absent tab?
  tree_absent=0
  for role in "${roles[@]}"; do
    [[ -z "${TAB_PID[$tree/$role]:-}" ]] && tree_absent=1
  done
  [[ -n "$only_absent" && $tree_absent -eq 0 ]] && continue

  echo "   $tglyph $tree"
  rn=${#roles[@]}; ri=0
  for role in "${roles[@]}"; do
    ri=$((ri + 1))
    rglyph="├─"; [[ $ri -eq $rn ]] && rglyph="└─"
    if [[ -n "${TAB_PID[$tree/$role]:-}" ]]; then
      echo "   $cont  $rglyph 🖥️  $role — tab open (pid ${TAB_PID[$tree/$role]})"
    else
      any_absent=1
      # the cure a SUPERVISOR runs is a crew verb, addressed by tree — never
      # term.open (rule.always.entool-the-layer-you-drop-below). crew.show
      # takes no --who: it restores every role tab this tree is owed
      echo "   $cont  $rglyph ✋ $role — NO term tab → rhx git.crew.show --tree $tree"
    fi
  done
done

# ── report: the terms that DIED ──────────────────────────────────────
# every row here is a window that is gone. the row it left behind names the
# crew it watched — which is the only place that fact still lives once the
# kitty, the tunnel, and the local tmux trace are all gone.
echo ""
if [[ ${#LOST[@]} -eq 0 ]]; then
  echo "🪦 no lost terms — every registry row still has a live terminal"
else
  lost_sorted=()
  while IFS= read -r row; do
    [[ -n "$row" ]] && lost_sorted+=("$row")
  done < <(printf '%s\n' "${LOST[@]}" | sort -u)

  echo "🪦 terms that DIED — ${#lost_sorted[@]} row(s) outlived their window"
  ln=${#lost_sorted[@]}; li=0
  for row in "${lost_sorted[@]}"; do
    li=$((li + 1))
    lglyph="├─"; [[ $li -eq $ln ]] && lglyph="└─"
    lcont="│";   [[ $li -eq $ln ]] && lcont=" "

    IFS='|' read -r l_duct l_host l_pid l_roles <<< "$row"
    canon="$(__crew_canon_name "$l_duct")"
    grove="${LEDGER_GROVE[$canon]:-}"

    if [[ -n "$grove" ]]; then
      echo "   $lglyph 🫥 $canon"
      echo "   $lcont  ├─ held: ${l_roles:-?}   (term pid $l_pid, host ${l_host:-local})"
      # ⚠️ a ledger row proves the crew was BOOKED on that grove — never that
      # it is at work. this skill reads no session off-box, so it must not
      # dress a ledger row up as liveness (term=partial-audit)
      echo "   $lcont  ├─ books: $grove — booked, liveness unread here"
      echo "   $lcont  └─ view → rhx git.crew.show --tree $canon"
      # the registry's host and the ledger's grove are two records of one
      # fact, so a disagreement means one of them is stale — say which
      # ⚠️ an `if`, never `[[ … ]] && want=""` — under `set -e` a false test
      # makes that compound return 1 and takes the whole skill down with it
      want="${grove#cloud://}"
      if [[ "$want" == "local" ]]; then want=""; fi
      if [[ "$want" != "${l_host}" ]]; then
        echo "   $lcont     ⚠️ host disagrees — row says '${l_host:-local}', ledger says '$grove'"
      fi
    else
      echo "   $lglyph 🍂 $canon"
      echo "   $lcont  ├─ held: ${l_roles:-?}   (term pid $l_pid, host ${l_host:-local})"
      echo "   $lcont  └─ books: no ledger row — a felled tree, or test debris"
    fi
  done
fi

# ── report: tabs attached to a host their role is NOT authorized for ──
#
# 🔴 .the invariant, stated by the wisher 2026-09-13:
#
#      "cloud groves are only authorized to have local reviewer tabs"
#      "never mix cloud and local mechanic tabs"
#      "thats just a giant footgun"
#
#    a cloud tree's mechanic, foreman, and reflector attach the GROVE. only
#    the reviewer seats are local, and they are local BY DESIGN — they cwd
#    into the tree's mirror, which lives on this box (__crew_mirror_dir).
#
#    ⇒ so the authorized host is not a preference a caller passes in. it is
#      DERIVED: __crew_role_host <the tree's grove> <role>. that function is
#      the single seam, and this section is the first reader to grade against
#      it (rule.require.trust-but-verify).
#
# 🔴 .why a LOCAL mechanic tab is the costly one, and reads as harmless
#    its attach is baked in at LAUNCH and no later verb reconciles it, so a
#    tab that attaches the wrong box does not error — it finds no local
#    session, drops through its ctrl-c hatch into a fresh login shell, and
#    sits at a prompt in whatever cwd it inherited. a human reads a live
#    shell and a correct tab title and concludes the crew is watched. it is
#    not watched at all (term=false-report), and a keystroke typed there
#    lands in a shell no duct owns.
#
# ⚠️ .this check needs NO tmux, on any box. it joins the registry against the
#    ledger, and both are cross-host by construction — so unlike every line
#    above it, a grove crew is fully in its scope.
# 🔴 .ONE implementation, two readers — this section DELEGATES
#
#    the same check gates `crew.show` (which refuses to report ✨ over a view
#    it cannot vouch for). a second copy here would drift from that one, and
#    then the reporter and the gate would disagree about which tabs are sound
#    — the exact failure class this whole line of work exists to close
#    (rule.always.vouch-for-what-you-just-wrote).
#
# ⚠️ the subject set is the LEDGER, never a tmux scan. that is what puts a
#    grove crew fully in scope here while every line above it is bounded to
#    localhost.
echo ""
mix=()
for m_tree in "${!LEDGER_GROVE[@]}"; do
  if ! rows="$(__crew_view_defects "$m_tree" "${LEDGER_GROVE[$m_tree]}")"; then
    mix+=("$m_tree")
  fi
  [[ -n "$rows" ]] && printf '%s\n' "$rows" | sed "s|├─|├─ $m_tree/|"
done

if [[ ${#mix[@]} -eq 0 ]]; then
  echo "🔐 every tab is vouched for — attach and host both check out"
else
  echo "🔐 crews whose view could NOT be vouched for — ${#mix[@]}"
  for m_tree in "${mix[@]}"; do
    echo "   └─ heal → rhx git.crew.heal --tree $m_tree --what view --mode apply"
  done
fi
echo ""
if [[ $any_absent -eq 0 ]]; then
  echo "🌊 every live local duct has a term tab"
else
  echo "🛟 reopen a flagged tab with the shown rhx git.crew.show command"
fi
echo "⚠️ the live half reads localhost only — a grove crew's duct is out of its scope"