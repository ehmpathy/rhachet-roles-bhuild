#!/usr/bin/env bash
######################################################################
# crewwork.fell — crew.fell: clear a finished tree's crew for good
#
# 🔴 .a PART of crewwork.sh — sourced, never executed, and only BY crewwork.sh.
#     a caller sources crewwork.sh, which loads every part. see
#     __crew_load_parts there for why the lib is cut into parts at all.
#
# .holds = crew.fell, and the residue sweep beneath it — every seat the
#          duct registry still holds for a felled tree.
######################################################################

######################################################################
# crew.fell — end the crew for good: its tree AND its record
#
# .what = the terminal verb. crew.stop turns the work off and leaves
#         the crew on the books; fell ends it — the tree goes, and the
#         ledger row goes with it.
#
# .why a THIRD off-verb, beside stop and hide
#         the three off-verbs act on three different lifetimes, and
#         each costs a different amount:
#
#           hide   the VIEW      free, reversible with crew.show
#           stop   the WORK      ends a conversation for good
#           fell   the CREW      ends the tree, the branch, the record
#
#         stop is not the inverse of boot in the way hide is of show:
#         a stopped crew can be re-booted onto the same tree, so it is
#         a pause. fell is what has no re-boot, and it earns its own
#         word for exactly that reason.
#
# .why `fell` and not `del`
#         the domain already speaks in forestry: a tree is SPROUTED
#         (term=sprout) and a tree is FELLED. every poll verdict in
#         this repo reads "fell it", never "del it". so fell is the
#         symmetric inverse of the creation verb already paved
#         (rule.prefer.symmetric-term-pairs), and `del` is reserved
#         for the mechanical row-removal one layer down.
#
# .why it DELEGATES to git.tree.del rather than fells the tree itself
#         the tree layer owns the safety gate, and it must keep
#         owning it. crew.fell adds exactly one thing on top: the
#         removal of the crew record, and only once the tree layer
#         reports the tree is genuinely gone.
#
# .the ORDER carries the whole safety property
#         tree FIRST, record LAST. if the gate refuses — unmerged,
#         unstaged, untracked work — the ledger row STAYS, because a
#         crew whose tree still stands is still a crew, and a row
#         removed early makes it invisible to every sweep. that is
#         precisely the blindness the ledger exists to close, so the
#         one thing this verb must never do is re-open it.
######################################################################

# .what = every seat the DUCT REGISTRY still holds for a tree, as
#         `<host>\t<role>` lines — deduped, over both spellings of the name
#
# 🔴 .why = it is the ONLY per-host record in the fleet, and a crew can span
#   TWO BOXES. the ledger carries one `grove` for a whole tree; the registry
#   carries a `.host` PER SEAT. so the ledger cannot express the shape that
#   `define.usecase.review-a-grove-tree-locally` prescribes — a grove tree
#   whose `reviewer.take` / `reviewer.give` seats live on THIS box — and every
#   verb that derives its box from the ledger is blind to half of such a crew.
#
# ⚠️ .BOTH name forms are read, and that is not belt-and-braces
#   tmux forbids '.' in a session name, so a seat registered through the
#   substrate lands under the '_' form while one keyed at the crew layer lands
#   under the dotted form. to read one is to find half a crew and report the
#   count with a confident face (term=partial-audit).
__crew_residue_seats() {
  local tree="$1"
  local dir="${DUCTWORK_DIR:-$HOME/.ductwork}/ducts"

  local canon tmux
  canon="$(__crew_canon_name "$tree")"
  tmux="$(__crew_tmux_name "$tree")"

  local -a forms=("$canon")
  [[ "$tmux" != "$canon" ]] && forms+=("$tmux")

  {
    local form file role host
    for form in "${forms[@]}"; do
      [[ -d "$dir/$form" ]] || continue
      for file in "$dir/$form"/*.json; do
        [[ -f "$file" ]] || continue
        role="$(basename "$file" .json)"
        host="$(jq -r '.host // ""' "$file" 2>/dev/null)"
        printf '%s\t%s\n' "$host" "$role"
      done
    done
  } | sort -u
}

######################################################################
# .what = tear down every seat the registry still holds for a felled tree,
#         on whatever box each one sits, then VERIFY and say what is left
#
# 🔴 .why — the wisher, 2026-09-17: "fell should ensure to leave no crew
#   member behind." measured the same tick, on a fleet whose fells had each
#   printed `🦫 timber! crew felled`:
#
#     rhachet-roles-bhrain_beav_feat-peer-review-parallelism
#       🖥️ reviewer.give — tab open (pid 1173246)
#       🖥️ reviewer.take — tab open (pid 1173246)
#
# .the cause = `git.tree.del --grove X` pipes its whole body over ssh, so its
#   duct teardown and tab close run ENTIRELY ON THE GROVE. a local reviewer
#   seat is outside its reach by construction, never by oversight — and no
#   flag on tree.del can fix that, because tree.del holds no ledger and so
#   cannot know a crew spans two boxes. this layer can.
#
# 🔴 .why it VERIFIES rather than reports what it attempted
#   the line this replaced read `tree, branch, ducts, tabs, and record 🌊`.
#   it named four teardowns and checked none, so a teardown that failed and
#   one that succeeded printed the identical sentence (rule.forbid.failhide).
#   ⇒ that is why the residue was found by a human's eye rather than by the
#     tool that produced it. a re-read of the registry costs one stat call.
#
# .why it REUSES crew.stop rather than calls duct.stop itself
#   crew.stop already owns the order (tabs before ducts, or a duct dies under
#   a live tab and leaves a phantom), the tmux name form, the host prefix on
#   the term slug, and the subset rule that closes tabs without the window.
#   every one of those is a defect somebody already paid for.
#
# args: $1 = tree   $2 = the grove git.tree.del was aimed at (for the report)
# exit: 0 = no seat left behind   1 = a seat SURVIVED, and is named
######################################################################
__crew_fell_sweep_residue() {
  local tree="$1"
  local grove_felled="${2:-local}"

  local host_felled=""
  host_felled="$(__crew_grove_host "$grove_felled" 2>/dev/null)" || host_felled=""

  local -a seats=()
  local line
  while IFS= read -r line; do
    [[ -n "$line" ]] && seats+=("$line")
  done < <(__crew_residue_seats "$tree")

  # .why SILENT on the empty case: an idempotent re-fell and a crew whose
  #   ducts were already stopped are both ordinary, and a residue line under
  #   every clean fell teaches a reader to skip the line that matters.
  (( ${#seats[@]} == 0 )) && return 0

  echo "   ├─ 🧹 residue — ${#seats[@]} seat(s) still on the duct registry"

  # 🔴 keyed by GROVE, never by the raw host — a LOCAL seat records its host
  #    as the empty string, and `arr[""]=x` is a bad array subscript in bash.
  #    the grove form is non-empty by construction ('local' or 'cloud://<x>'),
  #    and it is the word crew.stop takes anyway.
  local -A by_grove=()
  local host role grove
  for line in "${seats[@]}"; do
    host="${line%%$'\t'*}"
    role="${line#*$'\t'}"
    case "$host" in
      ""|local|localhost) grove="local" ;;
      *) grove="cloud://$host" ;;
    esac
    if [[ -n "${by_grove[$grove]:-}" ]]; then
      by_grove["$grove"]="${by_grove[$grove]},$role"
    else
      by_grove["$grove"]="$role"
    fi
  done

  local mark ghost
  for grove in "${!by_grove[@]}"; do
    ghost="$(__crew_grove_host "$grove" 2>/dev/null)" || ghost=""
    # ⚠️ the mark is the whole diagnosis in one word: a seat on the box
    #    tree.del already ran on is a straggler; one on ANY other box is the
    #    defect this sweep exists for, and it would otherwise be invisible.
    mark=""
    [[ "$ghost" != "$host_felled" ]] && mark="  ← beyond the felled box"
    echo "   │  ├─ $grove — ${by_grove[$grove]}$mark"
    crew.stop --tree "$tree" --grove "$grove" --roles "${by_grove[$grove]}" 2>&1 \
      | sed 's/^/   │  │  /' || true
  done

  # 🔴 .the LEGACY-FORM pass — without it the two halves of this function
  #   disagree about what a seat IS, and the disagreement is permanent.
  #
  #   `__crew_residue_seats` reads BOTH name forms on purpose (its own header
  #   says so: to read one is to find half a crew). the pass above delegates to
  #   `crew.stop`, and every crew verb canonicalizes `--tree` at its boundary
  #   (__crew_canon_name, and the note at its declaration) — so that pass can
  #   only ever address the DOTTED row.
  #
  #   ⇒ a seat keyed under the tmux form is FOUND by the scan and REACHED by no
  #     sweep. the re-scan below re-finds it and this verb returns 1, every run,
  #     for as long as the row exists.
  #
  # ⚠️ .the cost is the RECOMMENDATION, not the exit code. the survivor branch
  #   prints `⇒ rhx git.crew.stop --tree <t>`, which canonicalizes too — so the
  #   cure the tool teaches is one the tool has already proven cannot work. a
  #   supervisor obeys it, no row moves, and the next poll reports the same
  #   phantom (rule.forbid.remedies-that-mimic-the-defect).
  #
  # .measured 2026-09-20, on two phantoms the poll emitted a fell line for:
  #   `~/.ductwork/ducts/rhachet-brains-anthropic_beav_feat-frontier-claude-models`
  #   the fell ran twice with byte-identical output — five dotted `duct.stop`
  #   rows cleared, then `✋ 2 seat(s) SURVIVED the sweep`.
  #
  # .why it reuses duct.stop rather than remove the file
  #   the row is one half of a registered duct; duct.stop owns the other half
  #   and the teardown order. an `rm` here would be a second teardown path
  #   beside a serviceable one, and it would skip the remote probe a grove-held
  #   legacy row still needs.
  local form_tmux form_canon
  form_canon="$(__crew_canon_name "$tree")"
  form_tmux="$(__crew_tmux_name "$tree")"
  if [[ "$form_tmux" != "$form_canon" ]]; then
    local dir_ducts="${DUCTWORK_DIR:-$HOME/.ductwork}/ducts"
    if [[ -d "$dir_ducts/$form_tmux" ]]; then
      local file_seat role_seat host_seat
      for file_seat in "$dir_ducts/$form_tmux"/*.json; do
        [[ -f "$file_seat" ]] || continue
        role_seat="$(basename "$file_seat" .json)"
        host_seat="$(jq -r '.host // ""' "$file_seat" 2>/dev/null)"
        echo "   │  ├─ legacy row — ${form_tmux}/${role_seat}"
        duct.stop --on "duct://${host_seat}/${form_tmux}/${role_seat}" 2>&1 \
          | sed 's/^/   │  │  /' || true
      done
      # only ever succeeds once empty, so it can never take a live seat with it
      rmdir "$dir_ducts/$form_tmux" 2>/dev/null || true
    fi
  fi

  local -a left=()
  while IFS= read -r line; do
    [[ -n "$line" ]] && left+=("$line")
  done < <(__crew_residue_seats "$tree")

  if (( ${#left[@]} == 0 )); then
    echo "   │  └─ ✅ swept — the registry holds no seat for this tree"
    return 0
  fi

  echo "   │  └─ ✋ ${#left[@]} seat(s) SURVIVED the sweep — a crew member is left behind:"
  for line in "${left[@]}"; do
    host="${line%%$'\t'*}"
    role="${line#*$'\t'}"
    echo "   │     ├─ ${host:-local} / $role"
  done
  echo "   │     └─ ⇒ rhx git.crew.stop --tree $tree   ·   read it: rhx term.audit"
  return 1
}

crew.fell() {
  local tree=""
  local stash=0
  local why=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --tree) tree="$2"; shift 2 ;;
      --stash) stash=1; shift ;;
      --why) why="$2"; shift 2 ;;
      --help|-h) awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "${BASH_SOURCE[0]}"; return 0 ;;
      *) echo "✋ crew.fell: unknown arg '$1'" >&2; return 2 ;;
    esac
  done

  if [[ -z "$tree" ]]; then
    echo "✋ crew.fell: --tree required" >&2
    echo "   e.g. crew.fell --tree rhachet-roles-ghlitch.beav.fix-provision-declastruct-auth" >&2
    return 2
  fi

  echo "🦫 chew on it"
  echo ""
  echo "🪵 crew.fell --tree $tree"

  # ── 0. WHICH BOX ───────────────────────────────────────────────────
  # 🔴 .measured 2026-09-07, and it cost a real crew its record.
  #    `git.tree.del` is structurally LOCALHOST-ONLY: it hardcodes
  #    `duct:///$name/<role>` (three slashes = this machine) and runs its
  #    gate by a local `cd` into a locally-derived worktree path. it holds
  #    no --grove and no ssh arm.
  #
  #    so a fell aimed at a GROVE crew looked here, found no worktree, and
  #    answered `tree already gone — idempotent no-op`, exit 0. that is the
  #    honest answer to the question it asked, and the question was about
  #    the wrong box (term=partial-audit). the caller then read exit 0 as a
  #    confirmed removal and dropped the ledger row.
  #
  #    ⇒ the outcome is the exact state the ledger exists to prevent: the
  #      tree still on the grove, both clones still live, and the crew
  #      INVISIBLE to every sweep derived from the record. worse than a
  #      failed fell, because it reports success.
  #
  # .why the guard lives HERE and not in git.tree.del
  #    tree.del cannot know it was handed a grove tree — it has no ledger,
  #    by the layer split this file's header promises. THIS function has
  #    one. so the layer that can tell is the layer that must refuse.
  #
  # ✅ .THE ARREAR IS PAID — 2026-09-17
  #    the block above closed with `owed: a --grove on git.tree.del, so its
  #    gate runs where the tree is`, and a loud refusal was correct until it
  #    grew one. it has: `git.tree.del --grove <grove>` pipes its own bytes
  #    over ssh (`ssh $alias bash -s -- … < "$0"`) and runs the IDENTICAL
  #    gate on the box that holds the tree.
  #
  #    ⇒ so the refusal now blocks a cure the tool can perform, and its own
  #      4-step byhand recipe is exactly the unauditable hand-cure
  #      `rule.forbid.byhand-heal` forbids. what replaced it is one flag.
  #
  # .why this still does not re-implement anything
  #    the layer split above holds unchanged: tree.del cannot know it was
  #    handed a grove tree, because it has no ledger. THIS function has one.
  #    the layer that can tell is still the layer that must say — it now
  #    says WHERE rather than a halt because it knew.
  local grove
  grove="$(__crew_ledger_grove_of "$tree")"
  grove="${grove:-local}"

  # ── 1. the tree ────────────────────────────────────────────────────
  # delegate wholesale. the tree layer holds the safety gate, the stash
  # hatch and its --why toll, the duct teardown and the tab close. none
  # of that is re-implemented here, so none of it can drift.
  echo "   ├─ 🌲 tree — delegated to git.tree.del (its gate, its rules)"
  local -a del_args=(--name "$tree")
  # 🔴 the grove rides along, or the gate runs on the WRONG BOX. a fell aimed
  #    at this machine over a grove tree finds no worktree, answers
  #    `tree already gone — idempotent no-op`, and exits 0 — true about
  #    localhost, false about the world (term=partial-audit). the caller then
  #    drops the ledger row over a tree that stands.
  #
  # ⚠️ the two layers spell a grove DIFFERENTLY, and the mismatch is silent.
  #    the ledger holds `cloud://<name>` (term=grove's uri form); tree.del
  #    keys straight into `groves/<name>.json`, so it wants the bare name. to
  #    hand it the uri yields `grove 'cloud://x' is not registered` — loud, at
  #    least, but only because the registry lookup is a file test. that is why
  #    it goes through __crew_grove_host rather than a bare interpolation.
  [[ "$grove" != "local" ]] && del_args+=(--grove "$(__crew_grove_host "$grove")")
  (( stash == 1 )) && del_args+=(--stash)
  [[ -n "$why" ]] && del_args+=(--why "$why")

  if ! rhx git.tree.del "${del_args[@]}" 2>&1 | sed 's/^/   │  /'; then
    echo "   └─ ✋ tree NOT felled — the ledger row STAYS"
    echo ""
    echo "🛑 a crew whose tree still stands is still a crew. the record is"
    echo "   kept so the sweep can still see it. fix the gate's reason, retry."
    return 2
  fi

  # ── 2. the seats tree.del could not reach ──────────────────────────
  # 🔴 a crew CAN SPAN TWO BOXES. `git.tree.del --grove X` runs its whole
  #    body on the grove, so a LOCAL reviewer seat on a grove tree is outside
  #    its reach — and the fell then printed a clean-teardown line over live
  #    tabs. the wisher, 2026-09-17: "fell should ensure to leave no crew
  #    member behind." see __crew_fell_sweep_residue for the measurement.
  #
  # .the ORDER, for the same reason the record's order matters
  #    AFTER tree.del, because a refused gate must leave the ducts alone —
  #    a crew whose tree still stands is still at work. BEFORE the row is
  #    dropped, because the row is what a later reader would need to find
  #    the crew again if this sweep leaves anything behind.
  local swept=0
  __crew_fell_sweep_residue "$tree" "$grove" || swept=$?

  # ── 3. the record ──────────────────────────────────────────────────
  # LAST, and only here. the tree is confirmed gone, so the crew is over
  # and its row is now litter rather than evidence.
  __crew_ledger_del "$tree"
  echo "   ├─ 📒 ledger: row dropped — the crew is off the books"

  echo ""
  # 🔴 what this reports is VERIFIED, and its predecessor was not. the old
  #    line read `tree, branch, ducts, tabs, and record 🌊` — four teardowns
  #    named, none checked, and the identical sentence printed whether or not
  #    a seat survived (rule.forbid.failhide). that is why a human's eye
  #    found the residue rather than the tool that made it.
  if (( swept != 0 )); then
    echo "🛑 tree felled — but the crew is NOT whole off the books"
    echo "   └─ the seats named above outlived the sweep. clear them, then re-read."
    return 1
  fi
  echo "🦫 timber! crew felled — $tree"
  echo "   └─ tree and branch gone · duct registry bare · record dropped 🌊"
  return 0
}
