#!/usr/bin/env bash
######################################################################
# crewwork.ledger — the LEDGER: the durable row per tree a crew was booted on
#
# 🔴 .a PART of crewwork.sh — sourced, never executed, and only BY crewwork.sh.
#     a caller sources crewwork.sh, which loads every part. see
#     __crew_load_parts there for why the lib is cut into parts at all.
#
# .holds = __crew_lock_path · __crew_ledger_{set,del,list,rows,grove_of}
#          · __crew_grove_has_active_clone · crew.ledger
######################################################################

# .what = the lock file that serializes read-modify-write on ONE ledger row
#
# .why  = this row is, by this file's own words, "the only record a crew ever
#         existed". the write below is a read of `bootedFirst` followed by an
#         unconditional truncate-and-rewrite, so two concurrent boots for one
#         tree (a boot that races a heal, or two clones that re-register one
#         tree) either lose the older `bootedFirst` or interleave into invalid
#         json that breaks EVERY later read of the row.
#
#         ⇒ a lost `bootedFirst` is silent and permanent: the fleet can no
#           longer be ordered by age, and no later boot can recover the value
#           because the only copy was the row itself.
#
# .how  = one lock per ROW, keyed on the canonical tree name. two crews are
#         independent, so a global lock would serialize the whole fleet's boot.
#
# .note = `flock` is already a dependency of this corpus (`termwork.sh` holds
#         five call sites), so this adds no new host requirement.
__crew_lock_path() {
  local key="$1"
  mkdir -p "$CREWWORK_DIR/.locks"
  printf '%s\n' "$CREWWORK_DIR/.locks/$(printf '%s' "$key" | tr '/' '_').lock"
}

# .lock = the read AND the write are both inside the lock, so there is no
#         stale-read window to re-verify — stronger than the
#         read-then-lock-then-re-verify shape `termwork.sh` uses, and available
#         here because `bootedFirst` is read for no purpose other than to carry
#         it forward into the very write that follows.
__crew_ledger_set() {
  local tree canon file roles grove now first lockpath
  tree="$1"; grove="$2"; roles="$3"
  canon="$(__crew_canon_name "$tree")"
  mkdir -p "$CREWWORK_DIR/crews"
  file="$CREWWORK_DIR/crews/$canon.json"
  now="$(date +%s)000"
  lockpath="$(__crew_lock_path "crew.$canon")"

  {
    if ! flock 9; then
      echo "💥 MalfunctionError: crew.ledger.set could not lock the row for '$canon'" >&2
      echo "   fix: retry; if it persists, check for a stale lock at $lockpath" >&2
      return 1
    fi

    # preserve the FIRST boot across re-boots; a ledger that forgets when
    # a crew was born cannot order the fleet by age
    first="$now"
    if [[ -f "$file" ]]; then
      first="$(jq -r '.bootedFirst // empty' "$file" 2>/dev/null)"
      [[ -n "$first" ]] || first="$now"
    fi

    cat > "$file" <<EOF
{
  "tree": "$canon",
  "grove": "$grove",
  "roles": "$roles",
  "bootedFirst": $first,
  "bootedLast": $now
}
EOF
  } 9>"$lockpath"
}

# .what = drop a tree's ledger row — the crew is over, for good
#
# .why  = the ONE sanctioned removal. crew.stop must never call it (a
#         stopped crew is still a crew), and no caller may call it that
#         has not FIRST confirmed the tree is gone. the row is the only
#         record a crew ever existed, so an early removal makes a live
#         crew invisible to every sweep — the exact blindness the
#         ledger was built to close.
__crew_ledger_del() {
  local canon
  canon="$(__crew_canon_name "$1")"
  rm -f "$CREWWORK_DIR/crews/$canon.json"
}

# .what = every tree that a crew was EVER booted on, canonical form
__crew_ledger_list() {
  [[ -d "$CREWWORK_DIR/crews" ]] || return 0
  find "$CREWWORK_DIR/crews" -maxdepth 1 -type f -name '*.json' 2>/dev/null \
    | while IFS= read -r f; do basename "$f" .json; done \
    | sort
}

# .what = every ledger row as `<tree>\t<grove>`, canonical form, sorted
#
# .why  = `__crew_ledger_list` yields the NAME alone, so a caller that must know
#         WHICH BOX a crew lives on has to re-open every row itself.
#
#    🔴 the grove is the half that matters once a crew is DOWN. a live tmux
#       session proves where a crew is at work; a down crew has no session, so
#       there is nought left to prove it — and the ledger is the only source
#       that outlives the session (term=ledger: existence outlives liveness).
#
#       measured 2026-09-02: `git.crew.poll` learned every host from live
#       sessions alone, so a STOPPED cloud crew learned its host nowhere. it
#       then read THIS disk for a tree that sits on a grove, found nought, and
#       rendered `👻 phantom — tree is gone` over a worktree plainly present on
#       the grove. one derivation, two reaches — the same shape the crew half
#       was repaired for one column over.
#
# .note the grove is emitted VERBATIM (`cloud://<g>` or `local`), never split.
#       a caller that wants a host runs it through `__crew_grove_host`, so the
#       one parse of that vocabulary stays in the one function that owns it.
__crew_ledger_rows() {
  [[ -d "$CREWWORK_DIR/crews" ]] || return 0
  find "$CREWWORK_DIR/crews" -maxdepth 1 -type f -name '*.json' 2>/dev/null \
    | sort \
    | while IFS= read -r f; do
        # a row that will not parse yields NOUGHT rather than a half-row: a
        # `<tree>\t` with an empty grove reads as `local`, which is precisely
        # the wrong guess for the crew this exists to place (fail-fast over a
        # default that is silently wrong for the cloud case)
        jq -r 'select(.tree != null) | [.tree, (.grove // "local")] | @tsv' "$f" 2>/dev/null
      done
}

# .what = the grove ONE tree's crew was booted on, per the ledger ('' = no row)
#
# .why  = every crew verb defaulted `--grove` to `local`, so a caller who
#         omitted the flag got a truthful answer about the WRONG BOX. the
#         ledger has held the grove per tree since it was written, so the
#         default was derivable the whole time.
#
#    🔴 measured 2026-09-03: `crew.show --tree <a grove tree>` refused with
#       `💥 no ducts for '<tree>' on this box` over a crew that was plainly at
#       work on `grove-sandpine-v20260901`, with BOTH tabs already open. the
#       refusal was not wrong about the box it read — it was wrong about which
#       box to read, and it named neither.
#
#       ⇒ that is `term=partial-audit`: the instrument chose its own subject
#         set, and its verdict carries no trace of what it excluded. the same
#         shape `term.audit` still carries (localhost hardcoded), and the same
#         shape the poll was repaired for one column over.
#
# .note a direct read of the one row, never a scan — the ledger keys its files
#       by canonical name, so the lookup is the filename. emits the grove
#       VERBATIM (`cloud://<g>` or `local`), per its source.
__crew_ledger_grove_of() {
  local canon file
  canon="$(__crew_canon_name "$1")"
  file="$CREWWORK_DIR/crews/$canon.json"
  [[ -f "$file" ]] || return 0
  jq -r '.grove // empty' "$file" 2>/dev/null
}

# .what = is ANY clone on this grove actively at work right now? (0 = yes)
#
# 🔴 .why = AUTH IS GROVE-WIDE. a usage cap is a fact about an ACCOUNT, and every
#    clone on a grove auths as that one account — which is exactly why an
#    auth.swap is global + hot, "one swap heals every clone on the grove"
#    (term=auth.swap). so cap state is a property of the GROVE, never of a clone.
#
#    ⇒ ONE clone observed at work REFUTES every cap banner on that grove. a
#      capped clone cannot emit tokens, so an active peer proves the account
#      has budget, which proves the banner is STALE SCROLLBACK — a record of a
#      cap that has since lifted, frozen in a halted pane that draws no new frame.
#
#    the two readings do not weigh the same, and that asymmetry is the whole rule:
#      - a cap banner is HISTORICAL, and durable past its cause
#      - a token counter that climbs is PRESENT-TENSE, and cannot be faked
#    ⇒ so activity wins over a banner, always. there is no symmetric case.
#
# 🔴 .the cost of its absence, measured 2026-09-14 on grove-sandpine-v20260901:
#    the poll rendered `🚫 limited · resets Sep 20` for THREE trees while FOUR
#    clones on that same grove were plainly at work in the same pass — two of
#    them revived by git.crew.heal in that very tick. the contradiction sat in
#    one render across two tally lines for THREE consecutive ticks, and an
#    auth.swap gate was relayed to the human on each. the human, verbatim:
#    "if any brain on that grove is active, they're all active" · "auth is grove
#    wide" · "you hsould try to heal those every time if anyone on that grove
#    has auth".
#    ⇒ three ticks of a human browser leg asked for a cap already lifted, while
#      three real trees sat parked for want of a nudge the supervisor owned.
#    (define.invariant.crew.ratelimit.one-active-clone-refutes-every-cap-on-its-grove)
#
# .how the discriminator: claude draws a live turn with a token counter that
#       climbs (`↓ 20.7k tokens`) and an `esc to interrupt` hint. both are drawn
#       per frame by a live turn, so neither survives a halt — unlike a banner.
#
# .note memoized per grove for the life of the process, and it SHORT-CIRCUITS on
#       the first active clone, so a busy grove costs one read. the memo is
#       per-invocation, never a prior tick's cache — a mid-tick cap onset must
#       be readable, which a stale cache would hide (that invariant's carve-out).
__crew_grove_has_active_clone() {
  local grove="$1" memo_var pane tree row_grove uri host
  [[ -n "$grove" ]] || return 1

  # memo key: the grove, with every non-alnum folded to `_` so it is a legal var
  memo_var="__CREW_GROVE_ACTIVE_$(printf '%s' "$grove" | tr -c '[:alnum:]' '_')"
  case "${!memo_var-}" in
    yes) return 0 ;;
    no)  return 1 ;;
  esac

  # 🔴 a HOST, never a grove. __crew_duct_uri takes the bare host and prints
  #    `duct://<host>/…`, so to hand it `cloud://grove-x` yields
  #    `duct://cloud://grove-x/…` — malformed, every read fails, and the
  #    `|| continue` below reads each failure as "this clone is idle".
  #
  #    ⇒ measured 2026-09-15, in THIS function, on its first live run: it
  #      reported `the grove is QUIET` about grove-sandpine-v20260901 while four
  #      clones were at work on it — a silent false negative on every grove
  #      tree, which is the exact defect class it was written to close. the
  #      host conversion is a seam with a verb (__crew_grove_host); to skip it
  #      is rule.always.entool-the-layer-you-drop-below one layer down.
  host="$(__crew_grove_host "$grove")" || return 1

  while IFS=$'\t' read -r tree row_grove; do
    [[ -n "$tree" ]] || continue
    [[ "$row_grove" == "$grove" ]] || continue
    uri="$(__crew_duct_uri "$host" "$tree" "mechanic")"
    # a read that fails is an AMBIGUOUS pane, never an idle one — an asleep
    # grove or a down duct simply does not count toward active(G). the
    # invariant needs only ONE unambiguous peer, so a miss here is safe in
    # the one direction that matters: it can never manufacture activity.
    pane="$(duct.read --on "$uri" --lines 30 2>/dev/null)" || continue
    if printf '%s' "$pane" | grep -qE '↓ [0-9.]+k? tokens|esc to interrupt'; then
      eval "$memo_var=yes"
      return 0
    fi
  done < <(__crew_ledger_rows)

  eval "$memo_var=no"
  return 1
}

######################################################################
# crew.ledger — read the ledger, or seed it from the evidence that
#               survives
#
# usage:
#   crew.ledger list           every tree a crew was ever booted on
#   crew.ledger backfill       seed from live tmux + the duct registry
#   crew.ledger del <tree>     drop one stale row, by hand (see below)
#
# ⚠️ .del is a LAST-RESORT manual instrument, never crew.fell's own path
#
#      crew.fell drops a row itself, but only after `git.tree.del`
#      confirms the tree is gone — and that skill is localhost-only, so
#      crew.fell REFUSES outright for a grove crew and prints a manual
#      recovery: fell the tree on the grove itself, then `crew.stop`
#      locally to close the view. `crew.stop` deliberately never drops
#      the row ("a stopped crew is still a crew"), so once that manual
#      path is done, no step was left to clear the record — until this
#      verb. use it ONLY after the tree is already confirmed gone.
#
# ⚠️ .the backfill is INCOMPLETE, and that is not repairable
#
#      the ledger begins empty, and the only evidence left of past
#      crews is what has NOT yet been erased:
#
#        live tmux sessions   -> a crew at work right now
#        duct registry rows   -> a crew whose ducts were opened and
#                                never stopped
#
#      every crew that was booted AND stopped before this ledger
#      existed is GONE. duct.stop rm -f'd its row, and no other
#      artifact recorded it. so the backfill recovers the crews that
#      happen to still be registered, and cannot recover the rest.
#
#      do NOT read a post-backfill ledger as a complete history. it is
#      complete only for crews booted from here on
#      (term=partial-audit — a subject set narrower than the claim).
######################################################################

crew.ledger() {
  # .why a FLAG rather than a positional verb
  #   `rhx git.crew.ledger list` never reached this function — rhx owns
  #   `list` as its own subcommand and ran that instead, so the call
  #   printed a skill catalogue and exited 0. success shape, wrong
  #   content: a false report the caller has no way to spot
  #   (term=false-report). a flag cannot collide, and a bare call now
  #   does the safe read (rule.require.safe-by-default).
  local verb="${1:-read}"
  case "$verb" in
    read)
      # 🔴 .why the GROVE rides along, never the tree name alone
      #
      #   the ledger is the ONE source that outlives a session, and the grove
      #   is the half that matters once a crew is DOWN: a live tmux session
      #   proves where a crew is at work, and a down crew has none, so nought
      #   is left to prove it. `__crew_ledger_rows` says exactly that in its
      #   own `.why`, one function above — and emits the column to say it with.
      #
      #   🔴 measured 2026-09-20, mid babysit tick. the poll named 4 `💀 NO
      #      DUCT` trees and, in the same render, `⚠️ RETIRED: grove-sandpine-
      #      v20260810 — crews named on it are ORPHANS on a box that is gone`.
      #      which cure each orphan takes is settled ENTIRELY by the box it
      #      names — a boot onto the retired grove exits 2, and a boot onto a
      #      grove at 14% free ram is a provision call a human owns. this read
      #      was the instrument for that question and answered a narrower one
      #      (term=partial-audit: a subject set narrower than the claim).
      #
      # .note the TREE stays column 1, verbatim and first, so a caller that
      #       read this list line-by-line is unbroken — the grove is ADDED
      #       beside it, never substituted for it.
      #
      # .note the grove prints VERBATIM from the row (`cloud://<g>` or `local`)
      #       and is never defaulted here. `__crew_ledger_rows` already yields
      #       NOUGHT for a row that will not parse, precisely so an empty grove
      #       cannot read as `local` — "the wrong guess for the crew this
      #       exists to place". a default here would re-open that hole.
      local __lr_rows __lr_w=0 __lr_tree __lr_grove
      __lr_rows="$(__crew_ledger_rows)"
      [[ -n "$__lr_rows" ]] || return 0
      # two passes so the column is aligned to the longest name actually
      # present — a fixed width ragged-wraps the long tree slugs this fleet
      # really carries (rule.require.treestruct-output: scannable at a glance)
      while IFS=$'\t' read -r __lr_tree __lr_grove; do
        (( ${#__lr_tree} > __lr_w )) && __lr_w=${#__lr_tree}
      done <<< "$__lr_rows"
      while IFS=$'\t' read -r __lr_tree __lr_grove; do
        printf '%-*s  %s\n' "$__lr_w" "$__lr_tree" "$__lr_grove"
      done <<< "$__lr_rows"
      ;;
    backfill)
      local -A FOUND=()
      local session canon row

      # 🔴 .why BOTH arms screen with `__crew_is_crew_tree`, measured 2026-09-16
      #   that predicate's header enumerates the POLL's three arms and names the
      #   seven-tick cost of the one that skipped it. it enumerates three, and
      #   these two are a FOURTH and FIFTH — they read a name, so the rule about
      #   the name binds them, and neither applied it.
      #
      #   ⚠️ and the damage here is strictly worse than the poll's, because this
      #   arm WRITES. the poll re-derives its subject set every sweep, so a
      #   phantom there dies with the process. a backfill mints a DURABLE ledger
      #   row — the one artifact built to survive a stop, a crash, and a machine
      #   death — and every later poll then reads that phantom back out of its
      #   arm 2, which the predicate's own header marks `✔ by construction`.
      #   ⇒ this is what breaks that construction.
      #
      #   measured: one `--backfill` call on a clean fleet seeded exactly one
      #   row, `📒 + main` — the same bare branch name task #46 (2026-09-13)
      #   wrote the predicate to reject — and it took a hand `--del main` to
      #   undo. a repair instrument that needs a hand repair after it runs.
      #
      #   the screen takes a CANON, never a raw session half (a raw tmux name
      #   holds no dot at all), so both arms canonicalize FIRST and screen after.

      # 1. live tmux — a session named <tree>/<role> is a crew at work
      while IFS= read -r session; do
        [[ -n "$session" ]] || continue
        [[ "$session" == */* ]] || continue
        canon="$(__crew_canon_name "${session%/*}")"
        [[ -n "$(__crew_is_crew_tree "$canon")" ]] || continue
        FOUND["$canon"]=1
      done < <(__duct_list_host_sessions localhost)

      # 2. duct registry — rows a duct.stop has not yet erased
      DUCTWORK_DIR="${DUCTWORK_DIR:-$HOME/.ductwork}"
      if [[ -d "$DUCTWORK_DIR/ducts" ]]; then
        while IFS= read -r row; do
          [[ -n "$row" ]] || continue
          canon="$(__crew_canon_name "$(basename "$(dirname "$row")")")"
          [[ -n "$(__crew_is_crew_tree "$canon")" ]] || continue
          FOUND["$canon"]=1
        done < <(find "$DUCTWORK_DIR/ducts" -mindepth 2 -maxdepth 2 -type f -name '*.json' 2>/dev/null)
      fi

      echo "🦫 chew on it"
      echo ""
      echo "🪵 crew.ledger backfill"
      echo "   ├─ from: live tmux ∪ duct registry"

      local added=0 held=0
      for canon in $(printf '%s\n' "${!FOUND[@]}" | sort); do
        if [[ -f "$CREWWORK_DIR/crews/$canon.json" ]]; then
          held=$((held + 1))
          continue
        fi
        __crew_ledger_set "$canon" "local" "unknown"
        echo "   ├─ 📒 + $canon"
        added=$((added + 1))
      done

      echo ""
      echo "🦫 dam fine! $added seeded, $held already held"
      echo "   └─ ⚠️  incomplete by construction — crews stopped before the"
      echo "         ledger existed left no trace to recover"
      ;;
    del)
      local tree_del="${2:-}"
      if [[ -z "$tree_del" ]]; then
        echo "✋ crew.ledger del: tree required — rhx git.crew.ledger --del <tree>" >&2
        return 2
      fi

      local canon; canon="$(__crew_canon_name "$tree_del")"
      if [[ ! -f "$CREWWORK_DIR/crews/$canon.json" ]]; then
        echo "🌙 crew.ledger del: no row for '$tree_del' — already off the books (idempotent)"
        return 0
      fi

      __crew_ledger_del "$tree_del"
      echo "🦫 dam fine! ledger row dropped — $tree_del is off the books"
      echo "   └─ ⚠️  this touches only the record — no tree, duct, or tab."
      echo "         use it after you already confirmed the tree is gone"
      echo "         (e.g. crew.fell refused a grove crew and you completed"
      echo "         its printed manual-recovery steps)."
      ;;
    *)
      echo "✋ crew.ledger: unknown verb '$verb' — want: read | backfill | del" >&2
      return 2
      ;;
  esac
}
