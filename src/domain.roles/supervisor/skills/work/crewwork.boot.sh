#!/usr/bin/env bash
######################################################################
# crewwork.boot — the WORK axis: crew.boot ↔ crew.stop, crew.open, crew.list
#
# 🔴 .a PART of crewwork.sh — sourced, never executed, and only BY crewwork.sh.
#     a caller sources crewwork.sh, which loads every part. see
#     __crew_load_parts there for why the lib is cut into parts at all.
#
# .holds = the tmux ducts a crew's clones live in. NOT free — crew.stop ends
#          every conversation in the crew for good. the VIEW axis lives in
#          crewwork.view.sh; crew.open is the one verb that reaches both.
######################################################################

######################################################################
# crew.boot  — turn the WORK on
######################################################################

# .the inverse is crew.stop
crew.boot() {
  local tree=""
  local grove=""
  local roles="$CREWWORK_ROLES_DEFAULT"
  local resume=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --tree) tree="$2"; shift 2 ;;
      --grove) grove="$2"; shift 2 ;;
      --roles) roles="$2"; shift 2 ;;
      --resume) resume="${2:-mechanic}"; shift 2 ;;
      --help|-h) awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "${BASH_SOURCE[0]}"; return 0 ;;
      *) echo "✋ crew.boot: unknown arg '$1'" >&2; return 2 ;;
    esac
  done

  if [[ -z "$tree" ]]; then
    echo "✋ crew.boot: --tree required" >&2
    echo "   e.g. crew.boot --tree declapract-typescript-ehmpathy_beav_fix-workflow-sha-pins" >&2
    return 2
  fi

  # ── derive the grove from the ledger, never default to `local` ──────
  # .why = boot was the LAST holdout of the defect __crew_ledger_grove_of
  #        was written to close on 2026-09-03. every peer verb — show,
  #        read, send, stop, refresh, fell — was converted; boot was
  #        missed, and kept `local` hardcoded as its initializer.
  #
  # 🔴 .measured 2026-09-05, and the cost is not merely an error string.
  #    `crew.boot --tree <a grove tree> --resume mechanic` read localhost,
  #    found no worktree, and answered:
  #
  #      💥 no worktree for '<tree>' under /home/bert/git/*/_worktrees/
  #         fix: boot it first —
  #           rhx git.tree.behavior --into $org/$repo --name beav/$slug …
  #
  #    three defects stacked in that one message, the same triple
  #    term=duct.reboot._.choice.reason.md records for the broken reboot:
  #      1. it reported a tree ABSENT that the ledger holds and that
  #         crew.read reads LIVE in the same minute
  #      2. its verdict was CONFIDENT — no hedge, no note that it had
  #         looked only at localhost (term=partial-audit)
  #      3. its named cure was to SPROUT A NEW TREE over a live one that
  #         held work parked on an unapproved human gate
  #
  #    ⇒ row 3 is worse than the reboot's was. that verb's bad cure cost a
  #      duct; this one's costs a branch, a worktree, two ducts, a
  #      terminal, an install, and a bound route (define.sprout-vs-seed) —
  #      the single most expensive misread the fleet affords.
  if [[ -z "$grove" ]]; then
    grove="$(__crew_ledger_grove_of "$tree")"
    if [[ -z "$grove" ]]; then
      grove="local"
      echo "🌙 crew.boot: no ledger row for '$tree' — fell back to grove=local" >&2
    fi
  fi

  local host
  host=$(__crew_grove_host "$grove") || return 2

  # 🔴 the second opener. git.tree.duct gates a SPROUT; this gates a re-boot,
  #    which can be aimed at a grove by hand or inherited from a ledger row
  #    written before the gate existed. a lab grove is deletable by design.
  __crew_grove_assert_bootable "$host" "$grove" || return 2

  local role_list; __crew_roles_into role_list "$roles"
  if [[ ${#role_list[@]} -eq 0 ]]; then
    echo "✋ crew.boot: --roles named no role" >&2
    return 2
  fi

  echo "🦫 chew on it"
  echo ""
  echo "🪵 crew.boot --tree $tree --grove $grove"

  # ── 1. tree ────────────────────────────────────────────────────────
  # a LOCAL tree is resolved here; a cloud tree is resolved ON THE GROVE.
  # both must answer, because the answer is the pane's --cwd — and a pane
  # with no cwd starts in $HOME, which is the wrong tree, silently.
  #
  # .why the cloud arm is NOT a pass-through: it used to be, with the note
  #      "we cannot stat it, so we pass the check and let the duct speak."
  #      the duct did not speak. it opened in /home/camper and reported
  #      success — see __crew_tree_dir_on_grove for the measurement. the
  #      premise was right (this box cannot stat it) and the conclusion was
  #      wrong (so ask the box that can, rather than skip the question).
  local tree_dir=""
  if [[ -z "$host" ]]; then
    if ! tree_dir=$(__crew_tree_dir "$tree"); then
      echo "   └─ 💥 no worktree for '$tree' under $CREWWORK_GIT_ROOT/*/_worktrees/" >&2
      echo "      fix: boot it first —" >&2
      echo "        rhx git.tree.behavior --into \$org/\$repo --name beav/\$slug --size nano --wish \$path" >&2
      return 2
    fi
    echo "   ├─ 🌲 tree: $tree_dir"
  else
    if ! tree_dir=$(__crew_tree_dir_on_grove "$host" "$tree"); then
      # ⚠️ the REMOTE root, never $CREWWORK_GIT_ROOT — that one holds THIS box's
      #    already-expanded $HOME (/home/bert), while the search that just
      #    failed ran under the grove's own `~` (/home/camper). to print the
      #    local path here names a directory nobody looked in, in the voice of
      #    the one we did, and sends the reader to the wrong machine to check.
      #    an error that misreports its own subject is a term=false-report with
      #    a `💥` on it — the glyph makes it likelier to be believed, not less.
      echo "   └─ 💥 no worktree for '$tree' on $host, under ${CREWWORK_GIT_ROOT_REMOTE:-~/git}/*/_worktrees/" >&2
      echo "      (or the grove is unreachable — check with: rhx git.grove.wake $host --mode plan)" >&2
      echo "      fix: make the tree there first, then re-boot" >&2
      return 2
    fi
    echo "   ├─ 🌲 tree: $tree_dir (on $host)"
  fi

  # ── 2. ducts ───────────────────────────────────────────────────────
  # FIRST, and with an explicit --cwd. term.open findserts a duct of its
  # own, so if a session were absent when the tab launched, the tab would
  # create it in the CALLER's directory. we get there first.
  #
  # .note = the --cwd is UNCONDITIONAL now. this branched on `-n "$tree_dir"`
  #         and fell through to a bare `duct.open` for a cloud tree, because
  #         the cloud arm above left tree_dir empty. that fallback is what put
  #         a grove crew in $HOME — so with the arm repaired, the branch has
  #         no live case left, and a dead branch that silently drops the one
  #         arg keeping a pane on its tree is worse than absent.
  #
  # ⚠️ the --cwd is PER ROLE, never per tree. a local-only seat (the reviewer)
  #    opens in this box's mirror dir, not in the grove's worktree path — that
  #    path does not exist here, so one shared --cwd would strand it in $HOME.
  #    __crew_role_cwd is the single seam; see its header for why a boot may
  #    open an EMPTY mirror.
  echo "   ├─ 🔧 ducts"
  local role uri rc cwd
  local failed=0
  for role in "${role_list[@]}"; do
    uri=$(__crew_duct_uri "$host" "$tree" "$role")
    cwd=$(__crew_role_cwd "$tree_dir" "$tree" "$role")
    duct.open --on "$uri" --cwd "$cwd" | sed 's/^/   │  ├─ /'
    rc=${PIPESTATUS[0]}
    if [[ $rc -ne 0 ]]; then
      echo "   │  └─ 💥 duct '$role' failed (rc=$rc)" >&2
      failed=$((failed + 1))
    fi
    [[ $rc -eq 0 ]] && __crew_provision_seat "$uri" "$role"
  done
  if (( failed > 0 )); then
    echo ""
    echo "🦫 tail slap — $failed duct(s) failed; no tabs opened" >&2
    return 1
  fi
  echo "   │  └─ ✔ ${#role_list[@]} duct(s) up"

  # ── 2b. ledger ─────────────────────────────────────────────────────
  # .why AFTER the ducts, never before: the ledger asserts "a crew was
  #      booted here", and that is only true once the ducts are up. a
  #      write ahead of the boot would record a crew that a failed
  #      duct.open never produced — a false report on the one instrument
  #      whose whole job is to remember.
  #
  # .why crew.stop does NOT remove it: this is the ONLY durable trace
  #      that a crew ever existed. duct.stop erases the duct registry
  #      row, so if the ledger were cleared too, a stopped crew would be
  #      indistinguishable from a tree that never had one — which is
  #      precisely the gap this exists to close. it is cleared by
  #      git.tree.del, when the tree itself is gone.
  __crew_ledger_set "$tree" "$grove" "$(IFS=,; echo "${role_list[*]}")"
  echo "   ├─ 📒 ledger: recorded — this tree is a crew, and stays one"

  # ── 3. terms ───────────────────────────────────────────────────────
  # NOT here. boot is the WORK axis; the view belongs to crew.show, and
  # crew.open is the verb that findserts both.
  #
  # .why = this used to open the tabs inline, which made boot and open
  #        produce the same end state — two words for one behavior, the
  #        overload rule.forbid.domain-term-synonyms forbids. it also
  #        made the 2x2 in term=crew._.choice._.md untrue of its own
  #        code: the table said boot=work while the code did work+view.
  #
  # .note = the asymmetry against crew.stop is deliberate, not an
  #         oversight. stop MUST close its tabs, because a tab attached
  #         to a killed session dies on its own and orphans a registry
  #         row. boot need not open one, because a duct with no tab is a
  #         normal live state — `term.audit --absent` exists to list
  #         exactly those. the substrate grounds the asymmetry.
  echo "   ├─ 🖥️  terms: none — boot is the work axis"
  echo "   │  └─ view it with: rhx git.crew.show --tree $tree"

  # ── 4. resume (optional) ───────────────────────────────────────────
  # .why --resume $role and NOT --continue: `--continue` is cwd-RECENCY, and a
  #      tree's mechanic and foreman share ONE worktree — so they share one
  #      claude project dir, and the foreman's `--continue` can hand back the
  #      MECHANIC's conversation. neither pane says so, and the operator reads
  #      the wrong transcript as the right one (term=false-report).
  #
  #      `--resume <name>` is deterministic instead: git.tree.behavior launches
  #      each clone with `--name $role`, so the role IS the handle. one word
  #      end to end — duct `$tree/mechanic`, session `mechanic`, resume
  #      `--resume mechanic` (rule.forbid.domain-term-synonyms).
  #
  # .why a BARE send (no --anyway): the busy-guard is the dead-clone detector,
  #      and it is deterministic — it reads tmux's `pane_current_command`, a
  #      process-table fact, never a pane scrape. a LIVE clone holds the pane,
  #      so the send refuses (rc=2) and interrupts no work; a DEAD one leaves a
  #      bare shell, so the resume lands. that is why this is safe to pass on
  #      every boot, where an `--anyway` resume would type over live work.
  #
  # .why --permission-mode acceptEdits: a permission mode is a LAUNCH flag,
  #      never a property of the conversation, so a resume restores the
  #      transcript and NOT the mode it ran under. git.tree.behavior boots
  #      every clone with acceptEdits; a resume that drops it hands back a
  #      clone that stalls on its own file writes, and the operator reads
  #      that stall as a wedge rather than as a mode it silently lost.
  #
  # 🟢 .observed 2026-09-02, on four real ducts after a reboot — this is the
  #    answer the prior `.unverified` note asked for, and it is NOT what the
  #    flag name implies. `claude --resume <name>` does not resume. it opens a
  #    SESSION PICKER, pre-filtered to <name>, with the one matched row already
  #    highlighted, and it WAITS on an Enter:
  #
  #      Resume Session
  #      ╭──────────────────────────╮
  #      │ ⌕ mechanic               │
  #      ╰──────────────────────────╯
  #        current worktree
  #      ❯ mechanic
  #        3 hours ago · beav/<branch> · 110.5MB
  #
  #    so the send lands, the skill reports `sent`, and the clone is NOT up.
  #    every word of that report is true, which is what made it costly: the
  #    caller reads `🪵 crew up: mechanic` and believes a clone is at the
  #    keyboard (term=volunteered-diagnosis — the measurement is honest, the
  #    conclusion beside it is the reader's).
  #
  # 🔴 .why the Enter is CONDITIONAL and not unconditional
  #    2 of the 4 resumed straight through with no picker at all. the cause is
  #    unestablished — do NOT infer one — but the consequence is settled: an
  #    unconditional Enter lands in an EMPTY INPUT BOX on those two, and the
  #    next poll then reports `✍️ PREFILLED` — a human-typed signal the tool
  #    manufactured itself (rule.require.babysit-cron-per-dispatch-fleet).
  #
  #    so the loop READS before it acts, and it reads for a POSITIVE marker —
  #    the picker's own header — never for an absence. an absence is shared by
  #    "the picker never drew" and "the picker drew and we missed it", so it
  #    discriminates neither (term=volunteered-diagnosis, the fifth instance).
  #
  # 🔴 .the ONE case where this flag is the wrong verb: a POISONED transcript.
  #    an `API Error: 400` that names the request BODY (a bad surrogate, invalid
  #    json) is terminal — the body IS the transcript, so it re-serializes every
  #    turn and a resume restores the defect. that clone is recovered by
  #    REPLACEMENT: a resume-less boot, then `rhx route.drive`. the route holds
  #    the work; the transcript holds only its memory.
  #    see rule.require.abandon-poisoned-conversations.
  if [[ -n "$resume" ]]; then
    uri=$(__crew_duct_uri "$host" "$tree" "$resume")
    echo "   ├─ 🧠 resume: $resume (by name, not by recency)"
    # .why `rhx enroll claude` and not a bare `claude`: enroll launches the same
    #      brain cli (every token it does not own passes through verbatim) and
    #      REGISTERS the clone, so a resumed conversation is addressable by
    #      `rhx clone get @:$resume` rather than readable only as a pane scrape.
    #      a resume that skipped enroll would restore the transcript and leave it
    #      unaddressable — the exact gap this boot closes.
    #      the slug is the role, per git.tree.behavior's own `--as` note: the
    #      registry is `<repoPath>/.agent/.actors` and a worktree is its own repo
    #      path, so `@:mechanic` is already tree-unique.
    #      ⚠️ this line read `claude --resume …` — a BARE claude — while the note
    #      above it described the enroll form, and `crew.heal` already sent the
    #      enroll form at its own call site. so the comment, the clamps, and one
    #      peer path all agreed, and the code alone did not. a prose intent is
    #      not a mechanism; the two clamps that caught it are.
    #      ⚠️ this resume PINS `--permission-mode acceptEdits`; heal's resume
    #      (`__crew_heal_revive`) OMITS it, on the claim that a resume restores the
    #      session's own mode. both paths are clamped, and no clamp can tell which
    #      claim holds — so read the pin as a guard, never as proof the claim is false.
    duct.send --on "$uri" --await 30 \
      --what "rhx enroll claude --as @:$resume --resume $resume --permission-mode acceptEdits" \
      | sed 's/^/   │  ├─ /'

    # drive the picker to completion, if one drew. bounded: a handful of
    # short reads, never a spin — a picker that never appears must cost the
    # caller a second, not a minute.
    #
    # ⚠️ the read's own failure is tracked APART from its result. a swallowed
    #    read error would make "the picker never drew" and "i could not look"
    #    the same verdict, and the caller would be told `resumed direct` over a
    #    clone still parked at a picker (rule.forbid.failhide, and
    #    term=volunteered-diagnosis — an absence discriminates neither).
    #
    # .why the interval is a VARIABLE: a clamp must exercise all three arms,
    #      and at 1s each that is ~6s of dead sleep per case — most of the
    #      suite's runtime, spent on a wait no clamp needs (rule.require.
    #      fast-tests). the default is the real one; only a test sets it to 0.
    local picker_seen=""
    local read_ok=""
    local pane=""
    local naptime="${CREW_RESUME_POLL_SECS:-1}"
    local attempt
    for attempt in 1 2 3 4 5 6; do
      [[ "$naptime" == "0" ]] || sleep "$naptime"
      pane=$(duct.read --on "$uri" --lines 20 2>/dev/null) || continue
      read_ok="yes"
      if grep -q 'Resume Session' <<< "$pane"; then
        picker_seen="yes"
        break
      fi
    done

    if [[ -n "$picker_seen" ]]; then
      duct.send --on "$uri" --anyway --keys Enter >/dev/null 2>&1
      echo "   │  └─ 🗝️  picker drew — Enter sent to select '$resume'"
    elif [[ -n "$read_ok" ]]; then
      # states the MEASUREMENT, never a conclusion about the clone
      echo "   │  └─ 🗝️  no 'Resume Session' seen in 6s — no picker to drive"
    else
      echo "   │  └─ ⚠️  could not read the duct — resume state UNKNOWN"
      echo "   │     └─ check it: rhx duct.read --on '$uri' --lines 20"
    fi
  fi

  echo "   └─ 🪵 crew up: ${role_list[*]}"
  echo ""
  echo "🦫 dam fine! crew of ${#role_list[@]} on $tree"
  return 0
}

######################################################################
# crew.open  — turn BOTH on, findsert each
######################################################################

# .what = ensure a crew is at work AND in view, in one verb
# .why  = boot and show are the two halves of "a crew i can work with",
#         and to pick between them you must first KNOW which half is
#         already up. that is a read the caller should not owe.
#
#         it cost a round to learn: a crew was asked for whose ducts
#         were live and whose tabs were closed. the verb choice took a
#         `term.audit` first — a lookup purely to answer "which of these
#         two words applies?". a findsert on both makes the question
#         moot, which is what a findsert is for
#         (rule.require.get-set-gen-verbs).
#
# .why `open`, when `open` is a forbidden synonym of `boot`
#         it was forbidden ON THE WORK AXIS, and the reason was that it
#         overlapped in sense with `show` — so an operator who wanted a
#         window reached for the verb that ends a conversation. a
#         composite dissolves that exact objection: reach for `open`
#         when you want a window and you GET the window, plus the work
#         if it was down. there is no longer a wrong outcome to reach
#         for. see the dated dispute in term=crew._.choice.reason.md.
#
# .why there is NO crew.close
#         the off-verbs have wildly unequal cost — hide is free and
#         reversible, stop ends a claude conversation for good. a
#         composite off would bundle the cheap act with the
#         irreversible one, which is the `--keep-ducts` defect the 2x2
#         was built to fix. the convenience is offered only in the
#         direction where it is free (rule.require.safe-by-default).
crew.open() {
  local tree=""
  local args=()

  # .note = every arg is forwarded to BOTH halves, so a caller learns
  #         one flag set. this stays a pass-through rather than a second
  #         arg parser that drifts from the two it fronts.
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --tree) tree="$2"; args+=("$1" "$2"); shift 2 ;;
      --help|-h) awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "${BASH_SOURCE[0]}"; return 0 ;;
      *) args+=("$1"); shift ;;
    esac
  done

  if [[ -z "$tree" ]]; then
    echo "✋ crew.open: --tree required" >&2
    return 2
  fi

  # ── 1. work ────────────────────────────────────────────────────────
  # boot FIRST, always. crew.show refuses a tree with no ducts, and a
  # tab opened against an absent session findserts that session in the
  # CALLER's directory — the 2026-08-09 defect that put reclaimed
  # mechanics in sandpine-notebook instead of their own worktrees.
  crew.boot "${args[@]}" || return $?

  echo ""

  # ── 2. view ────────────────────────────────────────────────────────
  # --resume is a boot-only flag; strip it so show's parser does not
  # reject an arg it never owned
  local show_args=()
  local i=0
  while (( i < ${#args[@]} )); do
    if [[ "${args[$i]}" == "--resume" ]]; then i=$((i + 2)); continue; fi
    show_args+=("${args[$i]}")
    i=$((i + 1))
  done
  crew.show "${show_args[@]}" || return $?

  return 0
}

######################################################################
# crew.stop  — turn the WORK off
######################################################################

# .what = kill every duct in the crew, and close its tabs
# .why  = the destructive verb, and it is named as one. a stopped clone
#         loses its shell and its claude conversation; no flag brings one
#         back. when you only want the window closed, that is crew.hide.
# .the inverse is crew.boot
crew.stop() {
  local tree=""
  local grove=""   # unset — derived from the ledger below, never assumed local
  local roles="$CREWWORK_ROLES_DEFAULT"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --tree) tree="$2"; shift 2 ;;
      --grove) grove="$2"; shift 2 ;;
      --roles) roles="$2"; shift 2 ;;
      --keep-ducts)
        # the old spelling of crew.hide. steer, never silently reinterpret —
        # a caller who typed this wants the safe act, and should learn its name
        echo "✋ crew.stop: --keep-ducts is now its own verb" >&2
        echo "   use: crew.hide --tree ${tree:-<slug>}" >&2
        return 2
        ;;
      --help|-h) awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "${BASH_SOURCE[0]}"; return 0 ;;
      *) echo "✋ crew.stop: unknown arg '$1'" >&2; return 2 ;;
    esac
  done

  if [[ -z "$tree" ]]; then
    echo "✋ crew.stop: --tree required" >&2
    return 2
  fi

  # ── derive the grove from the ledger, never default to `local` ──────
  # .why = the SECOND holdout of the 2026-09-03 sweep, and the sharper of
  #        the two. boot's miss produced a loud refusal a caller had to
  #        answer; this one is SILENT — it reads localhost, finds no ducts
  #        of that name, and the teardown's own `|| true` swallows the
  #        miss, so the verb reports a stop it never performed while the
  #        grove's ducts stay live (term=false-report, and over a
  #        DESTRUCTIVE verb, where a truthful report is load-bearing).
  #
  # 🔴 .the paved sequence walked straight into it. the teardown brief
  #    rule.require.tree-del-before-duct-close prints its final step as
  #    `rhx git.crew.stop --tree $tree` with NO --grove — so the
  #    documented, blessed teardown no-op'd on every grove crew it was
  #    ever run against, and reported success each time.
  #
  # ⚠️ .an open question this repair does NOT settle: whether the phantom
  #    recorded in term=phantom._.choice._.md ("crew.fell produced one")
  #    was in fact THIS defect — a stop that left the ducts live, then a
  #    fell that dropped the ledger row, leaving the poll's union
  #    (ledger ∪ registry ∪ live tmux) still holding it. two candidate
  #    causes, one measurement. do NOT collapse them without a second.
  if [[ -z "$grove" ]]; then
    grove="$(__crew_ledger_grove_of "$tree")"
    if [[ -z "$grove" ]]; then
      grove="local"
      echo "🌙 crew.stop: no ledger row for '$tree' — fell back to grove=local" >&2
    fi
  fi

  local host
  host=$(__crew_grove_host "$grove") || return 2

  local role_list; __crew_roles_into role_list "$roles"

  echo "🦫 chew on it"
  echo ""
  echo "🪵 crew.stop --tree $tree"

  # tabs first: a tab attached to a session we are about to kill would
  # otherwise die on its own and leave a registry row behind
  #
  # ⚠️ two defects rode this block, and both are the SAME defect twice:
  #    - it skipped the view entirely for a cloud crew, so a grove's tabs
  #      outlived their ducts and every one became a phantom row
  #    - it addressed the local case by the RAW dotted $tree, which tmux
  #      never carries — so term.stop looked up a slug no terminal is
  #      registered under, found naught, and the `|| true` swallowed it
  #
  #    the view is host-agnostic, so the slug carries its host and the
  #    call is unconditional. that is the whole of "zero difference".
  local term_slug
  term_slug="$(__crew_tmux_name "$tree")"
  [[ -n "$host" ]] && term_slug="$host:$term_slug"

  # 🔴 .a --roles SUBSET closes its own tabs, never the window
  #
  #   `term.stop --on <slug>` closes the terminal AND every tab in it. that is
  #   right for a whole-crew stop and wrong for a named subset: the caller asked
  #   to retire ONE seat and would lose every peer tab with it.
  #
  #   ⚠️ measured 2026-09-13, on the retirement of the legacy `reviewer` seat:
  #      `crew.stop --roles reviewer` reached for the whole window, which held a
  #      live `reviewer.take` and `reviewer.give`. kitty refused the close, so
  #      the loss did not land — the guard was luck, not design.
  #
  #   ⇒ so the scope of the view act follows the scope of the ASK. term.stop
  #     takes `--tab <role>` for exactly this (termwork's usage header).
  echo "   ├─ 🖥️  terms"
  local roster_all; __crew_roles_into roster_all "$CREWWORK_ROLES_DEFAULT"
  local term_rc=0 trc=0
  if [[ ${#role_list[@]} -lt ${#roster_all[@]} ]]; then
    local trole
    for trole in "${role_list[@]}"; do
      term.stop --via kitty --on "$term_slug" --tab "$trole" 2>&1 | sed 's/^/   │  ├─ /'
      trc=${PIPESTATUS[0]}
      if [[ $trc -ne 0 ]]; then term_rc=$trc; fi
    done
    echo "   │  └─ window kept — a --roles subset closes its own tabs only"
  else
    term.stop --via kitty --on "$term_slug" 2>&1 | sed 's/^/   │  └─ /'
    term_rc=${PIPESTATUS[0]}
  fi

  echo "   └─ 🔧 ducts"
  local role uri
  for role in "${role_list[@]}"; do
    uri=$(__crew_duct_uri "$host" "$tree" "$role")
    duct.stop --on "$uri" 2>&1 | sed 's/^/      ├─ /' || true
  done

  echo ""

  # propagate the tab MALFUNCTION — never sign off over a window still on
  # screen. rc 1 only; rc 2 is the idempotent case, and see below for why.
  #
  # .why = this line ended `|| true`, exactly as crew.hide's did before its
  #        2026-08-09 cure. the peer was repaired and clamped; this one was
  #        never checked against it, so the SAME failhide sat for a year on
  #        the verb where it costs more (rule.forbid.failhide).
  #
  # 🔴 .met in production 2026-09-20, on the freeze of
  #    rhachet-roles-bhrain.beav.feat-subconscious-term-distill. term.stop
  #    printed `terminal 1175938 is alive but its window would not close`,
  #    the `|| true` ate the rc, and the verb signed off `🦫 lodge closed`
  #    at exit 0 over a window still on the human's screen
  #    (term=false-report._.choice._.md — and over a DESTRUCTIVE verb,
  #    whose truthful report the whole teardown rests on).
  #
  # ⚠️ .the ducts still go down, on purpose. a wedged kitty may NOT hold a
  #    teardown hostage — the caller asked for the work off, and an abort
  #    here would trade a false report for an unstoppable crew. so the
  #    failure is REPORTED rather than undone.
  #
  # 🔴 .and the report may not name crew.hide, though that is the verb a
  #    reader reaches for. hide keys its terminal lookup on the DUCT, and
  #    the duct is gone by this line — so it answers `no terminal for duct`
  #    and the orphan stays. term.audit is what still finds the window,
  #    because it reads the terminal registry rather than the duct
  #    (rule.require.errors-name-the-fix).
  # 🔴 .and rc 2 is NOT this case — it is the idempotent one. termwork splits
  #    the two, and the first cut of this guard read `-ne 0` and flattened
  #    them:
  #
  #      rc 2 = CONSTRAINT — `no terminal for duct`, `terminal <pid> not
  #             found`. there is no window, so the teardown is COMPLETE, and
  #             this verb's own header promises `idempotent: a crew already
  #             stopped reports so and exits 0`.
  #      rc 1 = MALFUNCTION — a lock it could not take, a registry it could
  #             not read or write, a tab closed whose entry would not drop.
  #             THOSE leave a window nobody can address.
  #
  #    ⚠️ a window that was merely already GONE is rc 0 — termwork:1729-1736
  #       unregisters it and returns 0 on purpose. so rc 2 means the terminal
  #       record itself is absent, which is exactly the re-run case.
  #
  #    🔴 met in production 2026-09-20, ONE command after the cure above
  #       shipped: a `--roles reviewer` stop on an already-stopped crew read
  #       `✋ term.stop: no terminal for duct` and this guard cried ORPHANED
  #       over a screen with no such window on it — the cure for a false
  #       report, which emitted a false report of its own and broke the
  #       idempotency guarantee on top.
  if [[ $term_rc -eq 1 ]]; then
    echo "🦫 tail slap — the ducts are OFF, and the tabs would NOT close (rc=$term_rc)" >&2
    echo "   ├─ the work half is down; the view half is ORPHANED on the screen" >&2
    echo "   ├─ its duct is gone, so crew.hide cannot reach it — read the pid with:" >&2
    echo "   │     rhx term.audit" >&2
    echo "   └─ the tree and its branch are untouched either way — no work was lost" >&2
    return 1
  fi

  echo "🦫 lodge closed — crew off $tree"
  echo "   ├─ the ledger row STAYS — a stopped crew is still a crew"
  echo "   └─ the tree and its branch are untouched; end it for good with:"
  echo "      rhx git.crew.fell --tree $tree"
  return 0
}

######################################################################
# crew.list
######################################################################

# .what = show every tree that has a crew, and which roles are up
# .why  = duct.list reports ducts one per line, so a reader must assemble
#         the crews by eye. a crew is the unit we actually act on, so it
#         is the unit we should be able to read.
crew.list() {
  echo "🦫 chew on it"
  echo ""
  echo "🪵 crew.list"

  local -A CREW_ROLES
  local session tree role
  while IFS= read -r session; do
    [[ -n "$session" ]] || continue
    # a crew duct is <tree>/<role>; a one-segment duct is a human's own
    # shell, never a crew (see term=duct._.choice._.md)
    [[ "$session" == */* ]] || continue
    # ⚠️ canonicalized for DISPLAY. tmux underscores every '.', so a dotted role
    #    would print as `reviewer_take` — the substrate's form shown as the
    #    duct's name, which is not a word any human can type back at us
    role="$(__crew_canon_name "${session##*/}")"
    tree="${session%/*}"
    CREW_ROLES["$tree"]="${CREW_ROLES[$tree]:-} $role"
  done < <(__duct_list_host_sessions localhost)

  local trees=()
  while IFS= read -r t; do
    [[ -n "$t" ]] && trees+=("$t")
  done < <(printf '%s\n' "${!CREW_ROLES[@]}" | sort)

  local total=${#trees[@]}
  if (( total == 0 )); then
    echo "   └─ (no crews)"
    echo ""
    echo "🦫 the pond is still"
    return 0
  fi

  local i=0 glyph cont
  for tree in "${trees[@]}"; do
    i=$((i + 1))
    glyph="├─"; cont="│"
    if [[ $i -eq $total ]]; then glyph="└─"; cont=" "; fi
    local uniq
    uniq=$(printf '%s\n' ${CREW_ROLES[$tree]} | sort -u | tr '\n' ' ')
    echo "   $glyph $tree"
    echo "   $cont  └─ 👥 ${uniq% }"
  done

  echo ""
  echo "🦫 dam fine! $total crew(s)"
  return 0
}
