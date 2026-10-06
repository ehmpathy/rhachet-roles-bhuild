#!/usr/bin/env bash
######################################################################
# .what = fell a worktree and its ducts (inverse of git.tree.duct)
#
# .why  = git.tree.duct / git.tree.behavior spin UP a worktree with one
#         duct per crew role and a terminal. this skill is the exact
#         inverse: it fells the whole setup in one call.
#           1. `git tree del --this`, run IN the worktree — the safety
#              gate refuses if the branch has unmerged or unstaged work,
#              so we never drop live work
#           2. once the tree is confirmed gone, stop EVERY duct the tree
#              still carries — the role set is DISCOVERED from live tmux,
#              never named, because a felled tree is exactly where an OLD
#              crewset lingers (see __tree_del_teardown_ducts)
#           3. close the kitty tabs too (term.stop) — a stopped duct
#              otherwise leaves its tab attached to a dead session
#
#         --this is used on purpose: it is run from INSIDE the worktree,
#         so --this fells the correct tree no matter which branch the
#         checkout was switched to. a bare `git tree del` cannot infer a
#         branch once the checkout has moved (e.g. after a deleted-branch
#         recovery), which is the trap this avoids.
#
# .the ducts are TORN DOWN here, never DEPENDED ON
#         a crew's ducts are an output of this skill, not an input. the
#         gate runs against the worktree directly, so a tree whose crew
#         is DOWN — the most common thing you ever fell — is felled just
#         as cleanly as one whose crew is live. see the long note at the
#         `treedir` derivation for the incident that forced this.
#
# usage:
#   rhx git.tree.del --name domain-objects-metadata.beav.fix-extract-primitive-arrays
#   rhx git.tree.del --name $tree --stash --why 'merged + shipped; yields are memo only'
#   rhx git.tree.del --name $tree --grove grove-sandpine-v20260901
#
# args:
#   --name   treename slug (the same slug used as the duct prefix)
#   --stash  set live work aside before the fell (optional)
#   --why    REQUIRED with --stash — why the stash is safe for THIS tree
#   --grove  run the gate ON THAT BOX, over ssh (default: this machine)
#
# .why --grove, and why it re-execs THIS SAME FILE on the remote box rather
#   than a second copy of the gate/stash/husk logic
#   this skill was structurally localhost-only: it hardcodes `duct:///$name/
#   <role>` (three slashes = this machine) and derives the worktree from
#   THIS box's `$HOME`. a fell aimed at a grove tree found no worktree here,
#   called it "already gone", and dropped the caller's ledger row over a
#   tree that still stood (`git.crew.fell`'s own refusal text named this
#   arrear verbatim: "owed: a --grove on git.tree.del").
#
#   a second copy of the gate would drift from this one the first time
#   either is touched. instead, `--grove` pipes THIS FILE's own bytes over
#   ssh (`ssh $alias bash -s -- ... < "$0"`) and lets the remote bash run
#   them, with an internal `--tree-only` flag so the remote run stops once
#   the tree is confirmed gone and never reaches the duct-teardown section —
#   ducts are addressed from the CONTROL machine, never from a box under
#   fell. `$HOME` resolves correctly on each side purely because the same
#   bytes run in each shell's own env.
#
# .why --stash must pay a --why toll
#   the safety gate refuses a tree that holds live work, and that refusal is
#   the entire point: it is the one check between a shipped branch and lost
#   work. an escape hatch with no toll decays into the default, and the gate
#   then guards naught. so the hatch costs a sentence — name why the work is
#   safe to set aside — and that sentence rides INTO the stash message, where
#   whoever finds the stash later reads the reason it was made.
#
# .why a stash, and never a discard
#   `git stash` writes to refs/stash in the COMMON git dir, not in the
#   worktree, so the stash OUTLIVES the worktree it came from: after the fell,
#   `git stash list` from the main checkout still shows it. a discard
#   (`checkout --` / `clean -fd`) has no recovery at all. so this skill offers
#   the reversible move and deliberately does not offer the destructive one.
#   -u is passed so untracked files come along; the gate refuses on those too,
#   and a stash that left them behind would not clear it.
#
# guarantee:
#   - fells the tree via `git tree del --this`, run IN the worktree — the
#     same gate, with NO dependency on a live foreman duct
#   - a tree whose worktree is already gone is an idempotent no-op (exit 0),
#     because the filesystem — not a duct — is what answers that question
#   - stops BOTH ducts ONLY after the tree is confirmed gone, and the proof
#     is the dir's absence, never a grep over a pane's text
#   - closes the kitty tabs too (best-effort; a miss never fails teardown)
#   - if the gate refuses (unmerged / unstaged), leaves the ducts UP and
#     reports why — never a silent drop of live work
#   - --stash without --why fail-fasts (exit 2); the toll is not skippable
#   - a stash that cannot be CONFIRMED halts the teardown rather than fells on
#     top of it — an unverified stash plus a felled tree is silent loss
#   - the skill never discards; the sole escape hatch it offers is reversible
#   - --grove runs the identical gate over ssh, on the box that holds the
#     tree; the local run then tears down the grove-qualified ducts once the
#     remote run confirms the tree is gone (never before)
#   - fail-fast on errors
######################################################################

set -euo pipefail

# parse args
name=""
stash=0
why=""
grove=""
tree_only=0
while [[ $# -gt 0 ]]; do
  case $1 in
    --name)
      name="$2"
      shift 2
      ;;
    --stash)
      stash=1
      shift
      ;;
    --why)
      why="$2"
      shift 2
      ;;
    --grove)
      grove="$2"
      shift 2
      ;;
    --tree-only)
      # internal — set by THIS SAME FILE when it re-execs itself over ssh
      # for --grove (see the .why block above). never pass this by hand.
      tree_only=1
      shift
      ;;
    --help|-h)
      # the peer pattern (git.crew.poll.sh): dump the file's own header
      # comment, found by its own terminator rather than a pinned line
      # number — a literal bound goes stale on the next edit, silently.
      awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"
      exit 0
      ;;
    --repo|--role|--skill)
      # reserved by rhachet, ignore
      shift 2
      ;;
    *)
      echo "error: unknown arg: $1" >&2
      exit 2
      ;;
  esac
done

# validate
if [[ -z "$name" ]]; then
  echo "error: --name required" >&2
  exit 2
fi

# the toll: no --why, no stash. a hatch that opens for free becomes the door.
if [[ "$stash" -eq 1 && -z "$why" ]]; then
  echo "✋ --stash requires --why '<why the stash is safe for this tree>'" >&2
  echo "" >&2
  echo "   the gate refuses trees that hold live work. to step past it, name" >&2
  echo "   why that work is safe to set aside — the reason rides into the" >&2
  echo "   stash message, so whoever finds the stash reads it there." >&2
  echo "" >&2
  echo "   e.g. --stash --why 'merged + shipped as v1.44.6; yields are memo only'" >&2
  exit 2
fi

# a --why with no --stash reads as a granted justification that never applied
if [[ -n "$why" && "$stash" -eq 0 ]]; then
  echo "✋ --why has no effect without --stash" >&2
  exit 2
fi

# .what = close the kitty tab(s) and stop EVERY duct a felled tree still has
# .why  = shared by the local path (below) and the --grove path (above it),
#   so the ORDER — tabs first, while the window still exists so term.stop can
#   match it; ducts stopped after — is declared once and cannot drift between
#   the two invocation shapes.
#
# 🔴 .the role set is DISCOVERED, never named — and a roster would not do
#
#   this stopped a literal `mechanic` + `foreman` for its whole life, then
#   printed `ducts stopped: mechanic + foreman 🌊`. a hardcoded subject set does
#   not fail; it UNDER-REPORTS, and the report reads complete (term=partial-audit
#   — the seventeenth instance, and `crew.heal` already carries the same repair).
#
#   measured 2026-09-13 on `rhachet.beav.fix-node-pty-install`: its worktree was
#   long gone and its ONE live duct was a `reflector`. the fell reported both
#   ducts stopped, dropped the ledger row, and left that reflector alive — now a
#   true orphan, because the row that named it is gone
#   (rule.forbid.failhide: the verdict was about a subject set it chose itself).
#
#   ⚠️ .and CREWWORK_ROLES_DEFAULT would NOT have caught it either
#      a felled tree is precisely where an OLD crewset lingers. `reflector`
#      post-dates most of this fleet; the bare `reviewer` pre-dates the
#      take/give split. so a roster names today's seats and a felled tree
#      carries yesterday's — the two are different sets by construction.
#
#   ⇒ so it enumerates the LIVE sessions for this tree and stops each. that
#     cannot under-report, and it needs no edit the next time the roster moves.
#
# ⚠️ the discovery needs crewwork, which the REMOTE re-exec does not carry — and
#    this function runs only on the control machine, so that is fine. where it
#    is genuinely unavailable it FAILS LOUD with the command to run by hand,
#    rather than a quiet stop of naught.
__tree_del_teardown_ducts() {
  local host="$1" name="$2" slug_tmux="$3"
  local libdir; libdir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work"

  if source "$libdir/termwork.sh" 2>/dev/null; then
    if term.stop --via kitty --on "$slug_tmux" 2>/dev/null; then
      echo "   ├─ tabs closed: kitty window for $slug_tmux"
    else
      echo "   ├─ tabs: no live kitty window for $slug_tmux (already closed)"
    fi
  else
    echo "   ├─ tabs: termwork unavailable — close the kitty window by hand"
  fi

  if ! source "$libdir/crewwork.sh" 2>/dev/null; then
    echo "   └─ ✋ crewwork unavailable — the duct set could NOT be discovered." >&2
    echo "      no duct was stopped. list and stop them by hand:" >&2
    echo "        rhx git.crew.list" >&2
    echo "        rhx duct.stop --on 'duct://${host:-}/$name/<role>'" >&2
    return 1
  fi

  # 🔴 .the HOST set is discovered too — a grove crew is SPLIT ACROSS TWO BOXES
  #
  #   the role-discovery above cured the ROLE axis of this sweep and left the
  #   HOST axis exactly as it was: one probe, of one box. that is the identical
  #   `term=partial-audit` one dimension over — a verdict complete over a subject
  #   set the instrument chose itself, and it reads the same either way.
  #
  #   a grove tree does NOT keep its whole crew on the grove. `git.tree.duct`
  #   boots foreman, mechanic, and reflector on the grove and `reviewer.give` +
  #   `reviewer.take` on the CONTROL machine, where the review brains and their
  #   credentials live. `rhx duct.list` shows the split on every grove tree in
  #   the fleet, so this is the shape, never an accident of one tree.
  #
  #   ⇒ measured 2026-09-17, felling svc-reservations.beav.feat-spot-forecast-widget
  #     on grove-sandpine-v20260901:
  #       ducts stopped: foreman mechanic reflector 🌊     <- the report
  #       duct:///svc-reservations.beav.feat-spot-forecast-widget/reviewer.give
  #       duct:///svc-reservations.beav.feat-spot-forecast-widget/reviewer.take
  #     two live local sessions, on a tree whose worktree was gone. the poll then
  #     read the crew `😶 at work — reviewer.give reviewer.take`, so it was NOT a
  #     phantom, so `--healable`'s no-duct screen never fired and the tick was
  #     handed a wedge probe for a tree that no longer exists.
  #
  #   ⚠️ the harm is the SAME one the role fix names, and worse by one step: the
  #     ledger row is dropped, so the two survivors become orphans no row names
  #     — and meanwhile they keep the felled tree looking alive to every sweep.
  #
  # ⇒ so probe the grove AND the control machine, and stop what either answers.
  #   a local duct's uri carries an EMPTY host (`duct:///<tree>/<role>`), so the
  #   host each session was found on rides with it to the stop.
  local canon session probe_host role_host roles=() uris=()
  canon="$(__crew_canon_name "$name")"
  local probe_hosts=("${host:-localhost}")
  [[ -n "$host" ]] && probe_hosts+=("localhost")
  for probe_host in "${probe_hosts[@]}"; do
    role_host="$host"
    [[ "$probe_host" == "localhost" ]] && role_host=""
    while IFS= read -r session; do
      [[ "$session" == */* ]] || continue
      [[ "$(__crew_canon_name "${session%/*}")" == "$canon" ]] || continue
      roles+=("$(__crew_canon_name "${session##*/}")")
      uris+=("duct://${role_host}/$name/$(__crew_canon_name "${session##*/}")")
    done < <(__duct_list_host_sessions "$probe_host")
  done

  # ⚠️ an EMPTY live set is not an empty duct set — a stopped crew leaves
  #    registry rows a `duct.stop` still clears. fall back to the roster there,
  #    and SAY that is what happened rather than report a silent zero
  #    ⇒ the fallback sweeps BOTH hosts too, for the same reason the probe does:
  #      a grove tree's registry rows are split across the grove and this box.
  local role
  if [[ ${#roles[@]} -eq 0 ]]; then
    __crew_roles_into roles "$CREWWORK_ROLES_DEFAULT"
    for probe_host in "${probe_hosts[@]}"; do
      role_host="$host"
      [[ "$probe_host" == "localhost" ]] && role_host=""
      for role in "${roles[@]}"; do uris+=("duct://${role_host}/$name/$role"); done
    done
    echo "   ├─ ducts: none live — the roster's registry rows get the sweep"
  fi

  local uri
  for uri in "${uris[@]}"; do
    rhx duct.stop --on "$uri" || true
  done
  echo "   └─ ducts stopped: ${roles[*]} 🌊"
}

# ── --grove: re-exec THIS FILE on the remote box, tree-only ──────────────
# the design is documented in full at the top `.why --grove` block; this is
# the mechanical half of it. every branch below EXITS — none falls through
# to the local-only logic that follows.
if [[ -n "$grove" && "$grove" != "local" ]]; then
  REGISTRY="${GIT_FOREST_DIR:-$HOME/.git.forest}/groves/$grove.json"
  if [[ ! -f "$REGISTRY" ]]; then
    echo "✋ grove '$grove' is not registered" >&2
    echo "   list them: rhx git.grove.list" >&2
    exit 2
  fi
  SSH_ALIAS=$(jq -r '.sshAlias // .name' "$REGISTRY")

  echo "🦫 fell tree: $name (on $grove)"

  remote_args=(--name "$name" --tree-only)
  (( stash == 1 )) && remote_args+=(--stash)
  [[ -n "$why" ]] && remote_args+=(--why "$why")

  # 🔴 .every arg is RE-QUOTED for the remote shell, and the local array
  #    quotes do not do that job
  #    `ssh host bash -s -- a b c` does NOT deliver a b c as three argv
  #    entries. ssh JOINS its command words with spaces into ONE string and
  #    hands that to the remote login shell, which then re-parses it. so
  #    `"${remote_args[@]}"` protects the args on the way INTO ssh and not one
  #    step further — every space inside an arg becomes a word boundary on the
  #    far side.
  #
  #    ⚠️ the defect this caused was SILENT for every arg that holds no space.
  #    `--name <slug>` and `--tree-only` carry none, so `--grove` worked for
  #    its whole life; the first arg with a space in it was the FIRST one to
  #    break. measured 2026-09-17, on a fell of svc-reservations with a real `--why`:
  #      error: unknown arg: +
  #    — the `+` from "merged + shipped" arrived as its own argv entry, and the
  #    tree was left to stand.
  #
  #    🔴 and `--why` is the one arg that is PROSE by contract. the toll block
  #    above demands a sentence; a sentence is spaces. so the single flag this
  #    skill requires a caller to write is the single flag the ssh hop could
  #    not carry — the escape hatch was unreachable on every grove tree.
  #
  #    ⇒ `printf %q` quotes each arg for a bash re-parse, and the remote IS
  #      bash (`bash -s`), so %q is exactly the right dialect.
  printf -v remote_argv '%q ' "${remote_args[@]}"

  echo "   ├─ 🌲 tree — delegated over ssh to $grove (same gate, run where the tree is)"
  remote_rc=0
  # ⚠️ NO `-n` on this ssh, and it is the whole mechanism of the hop — THIS
  #    SKILL'S OWN BYTES are the stdin. `bash -s` reads its program from
  #    stdin, so `< "$0"` is what puts this skill on the grove. a `-n` would
  #    hand the remote bash an empty program, which exits 0 with the tree
  #    untouched — a false report, and a silent one.
  #
  #    every other ssh in this repo carries -n because an inherited stdin is a
  #    defect there; here it is the payload. and it is safe for the identical
  #    reason: the redirect REPLACES stdin rather than inherits it, so no
  #    caller's `while read` loop can be drained through it — which is the one
  #    hazard work.surface [case21] exists to catch.
  # stdin: forwarded on purpose
  ssh "$SSH_ALIAS" "bash -s -- $remote_argv" < "$0" 2>&1 | sed 's/^/   │  /' || remote_rc=$?

  if [[ "$remote_rc" -ne 0 ]]; then
    echo "   └─ ✋ tree NOT felled on $grove (remote exit $remote_rc)"
    echo ""
    echo "🛑 ducts left UP so no live work is lost."
    exit "$remote_rc"
  fi
  echo "   ├─ tree removed ✨ (on $grove)"

  # ducts are addressed from the CONTROL machine, never from the box under
  # fell — the grove-qualified uri carries the host, per term=duct.
  __tree_del_teardown_ducts "$grove" "$name" "${name//./_}"
  exit 0
fi

# .why the duct:/// prefix carries weight, and is not decoration
#   every duct call below (stop) routes through ductwork, which accepts ONLY a
#   duct uri. a bare `$name/foreman` reaches it as
#   `rhachet_beav_fix-keyrack-daemon-leak/foreman` — dots already swapped for
#   underscores by duct.send — and ductwork rejects it as unresolvable. that
#   killed the skill at exit 2 BEFORE the safety gate ever ran, so a tree that
#   was perfectly safe to fell looked like a tool malfunction instead.
#   local takes THREE slashes: an empty host means this machine.
#
# .note = the two per-role variables that sat here are gone with the hardcoded
#   role pair. __tree_del_teardown_ducts builds each uri from a DISCOVERED role
#   and keeps this three-slash rule at the one place it is still needed.

# .why the gate no longer rides the FOREMAN DUCT, and this is the whole fix
#   the gate used to be typed into the foreman's pane (`duct.send --what 'git
#   tree del --this'`) and its verdict read back by a 60s poll that grepped
#   that pane's text. that bound the TREE layer to a LIVE CREW, and the bond
#   runs backwards:
#
#     a crew that is DOWN has no foreman duct
#       -> the gate cannot run
#       -> the tree cannot be felled, at all
#
#   and a down crew whose work has MERGED is the most common case you ever want
#   to fell. `git.crew.poll` renders exactly that state as "💀 down — clean
#   fell, no conversation to end" — so the poll RECOMMENDED the fell while the
#   verb was structurally unable to perform it. measured 2026-08-25 on
#   rhachet-brains-fireworksai.beav.fix-deepseek-v4-flash-model-id (pr #15
#   merged, crew down):
#       rhx git.crew.fell --tree <it>
#         -> "✋ foreman duct unreachable — the safety gate did NOT run", exit 2
#
#   a duct is a KEYBOARD. it is a fine way to let a human watch a command; it
#   is a terrible way for a program to invoke one, because a pane returns no
#   exit code — only wrapped, clip-prone text that scrolls. every defect the
#   old poll's comments catalogue (stale scrollback matched, the false
#   "refused" on an already-removed tree, the 60-line window for a 5-line
#   block) is downstream of that one choice. to read a pane for a verdict is a
#   PROXY (term=false-report._.choice._.md, the proxy cause).
#
#   so the gate now runs where it always belonged: in the worktree, directly.
#   the subshell `cd` below puts the command in the SAME cwd the foreman sat in,
#   so `--this` resolves identically — the gate's semantics are unchanged, byte
#   for byte. only the transport changed, and with it we gain an exit code and
#   drop a dependency on a live crew.
#
# .why the worktree path is derived here rather than borrowed from crewwork
#   `__crew_tree_dir` in work/crewwork.sh is the twin of this loop. it is NOT
#   sourced, on purpose: crew is the layer ABOVE tree (git.crew.fell delegates
#   DOWN to this skill), so for the tree layer to reach up into crewwork would
#   invert the order this file's header promises — "git.tree is USED here, and
#   stays independent". eight duplicated lines is the cheaper price.
treedir=""
for candidate in \
  "$HOME"/git/*/_worktrees/"${name//_/.}" \
  "$HOME"/git/*/_worktrees/"$name"; do
  if [[ -d "$candidate" ]]; then
    treedir="$candidate"
    break
  fi
done

echo "🦫 fell tree: $name"

# set live work aside first, when the caller paid the --why toll.
#
# .why this runs BEFORE the del rather than as a retry after a refusal
#   a stash on an already-clean tree is a no-op ("No local changes to save"),
#   so an unconditional stash costs the clean case exactly one message and
#   spares this skill a second copy of the poll below. the caller who typed
#   --why has already decided; the skill does not need to re-derive that from
#   a refusal it could just as well avoid.
if [[ "$stash" -eq 1 && -n "$treedir" ]]; then
  echo "   ├─ stash first — why: $why"

  # the why rides into the stash message, where whoever finds the stash reads
  # the reason it was made. it is passed as a single argv element now — no
  # shell line, no pane — so quotes in it are safe and are NOT stripped.
  stash_rc=0
  stash_out="$(cd "$treedir" && git stash push -u -m "git.tree.del: $name — $why" 2>&1)" || stash_rc=$?

  # confirm the stash before the fell. an unverified stash + a successful fell
  # equals silent data loss, which is the one outcome this whole flag exists to
  # avoid — so a stash that cannot be confirmed halts the teardown.
  #
  # .why a STATE check rather than a match on git's output text
  #   the old path grepped the pane for "Saved ..." / "No local changes to
  #   save". those are git's human strings: they are localized, they reword
  #   between versions, and in a pane they wrap. worse, a text match answers
  #   "did git SAY it stashed?" when the question is "IS the tree clean?" —
  #   a proxy for the fact, where the fact itself is one cheap command away.
  #   an empty --porcelain is the fact, and it is true in BOTH good cases:
  #   work was stashed, or there was none to stash.
  left_rc=0
  left="$(cd "$treedir" && git status --porcelain 2>&1)" || left_rc=$?

  # .why the EXIT CODE is reported, and an empty capture is named as empty
  #   this path once printed `$stash_out` alone. where git wrote to neither
  #   stream the operator got a BLANK GAP where the reason belonged — the
  #   report said the stash failed and withheld the one fact that says why,
  #   so the failure read as unexplainable rather than merely unexplained.
  #   a stash that exits non-zero in silence is a real state (a git that dies
  #   before it can speak, or a cwd that is not the tree), and the rc is the
  #   only evidence left of it. so the rc is always shown, and an empty
  #   capture is LABELLED rather than echoed — an absence a reader can see
  #   beats an absence they must infer from whitespace.
  if [[ "$stash_rc" -ne 0 || "$left_rc" -ne 0 || -n "$left" ]]; then
    echo "   └─ ✋ stash NOT confirmed — tree untouched, ducts left UP"
    echo ""
    echo "   stash: exit $stash_rc   ·   status: exit $left_rc   ·   in: ${treedir:-<unresolved>}"
    if [[ -n "$stash_out" ]]; then
      echo "$stash_out" | tail -12
    else
      echo "   (git printed no output on stdout or stderr)"
    fi
    [[ -n "$left" ]] && { echo ""; echo "   still dirty:"; echo "$left" | tail -12; }
    echo ""
    echo "🛑 refused to fell on an unverified stash — that would be silent loss."
    exit 2
  fi

  echo "   ├─ stash: tree is clean 🟢 — recover it with 'git stash list' from the repo"
fi

# .why an ABSENT worktree is now an honest idempotent no-op
#   the old code could not tell "already felled" from "the duct died with the
#   tree still on disk", because its only witness was the duct — and both look
#   like an unreachable duct from there. so it had to refuse both, and a plain
#   re-run of a completed fell exited 2.
#
#   the filesystem answers that question outright, and it is the subject the
#   claim is actually about. an absent dir means the tree is gone, whatever the
#   ducts are doing. so: skip the gate (there is naught left to gate) and fall
#   through to the teardown, which is the part still owed.
if [[ -z "$treedir" ]]; then
  echo "   ├─ tree already gone — no worktree on disk, idempotent no-op"

# .why "is it a worktree at all" is asked BEFORE "is it dirty"
#   an earlier form of the pre-check read a nonzero `git status` rc as "holds
#   live work" and refused. that conflates two opposite states: a tree full of
#   unsaved work, and a dir that is not a git worktree at all. the second
#   renders as `fatal: not a git repository`, which carries no work to lose and
#   no branch to gate — so to refuse it strands the very litter this skill
#   exists to clear, under a message that names the opposite cause.
#
#   measured 2026-08-25 on rhachet-roles-ghlitch.beav.fix-provision-declastruct-
#   auth: a `worktree remove --force` dropped the admin entry, then died on a
#   permission wall part way through the delete. the dir survived as a husk —
#   no .git, no index, a few dirs — and the check called it live work.
#
#   so: classify first, grade second. a nonzero rc is a CLASS, not a verdict.
elif ! (cd "$treedir" && git rev-parse --is-inside-work-tree >/dev/null 2>&1); then
  echo "   ├─ ⚠️  dir is not a git worktree — an orphan husk, not a tree"
  echo "   │     (a partial removal, or a worktree whose admin entry is gone)"

  if [[ "$treedir" != *"/_worktrees/"* ]]; then
    echo "   └─ ✋ refused — path is not inside a _worktrees dir: $treedir"
    exit 2
  fi

  # _worktrees/ is a managed namespace: every legitimate entry in it is a
  # REGISTERED worktree. one that is not registered holds no branch, no index,
  # and no route back through git to anything inside it — so it is litter by
  # definition, and a direct remove is the only move that clears it. the chmod
  # is for the same read-only pnpm store that stalled the removal to begin with.
  chmod -R u+rwX "$treedir" || true
  rm -rf "$treedir"

  if [[ -d "$treedir" ]]; then
    echo "   └─ ✋ could not clear the husk"
    echo ""
    echo "   fix: sudo rm -rf '$treedir', then retry"
    exit 2
  fi
  echo "   ├─ husk cleared ✨ — no gate to run, there was no tree left to gate"

else
  # .the PRE-CHECK, and why it grades the tree the gate cannot see
  #   `git tree del` does NOT locate a worktree; it COMPUTES one from the
  #   branch name:
  #       worktree_path="$worktrees_dir/$repo_name.$sanitized"
  #   so it presumes `<dir> == <repo>.<sanitized branch>`. when a checkout has
  #   moved — the dir keeps the slug it was sprouted with while HEAD points at
  #   another branch — that path does not exist, and the alias takes its
  #   "no worktree found" arm: it deletes the branch, leaves the worktree
  #   entirely alone, and exits 0.
  #
  #   measured 2026-08-25 on rhachet-brains-fireworksai.beav.fix-deepseek-v4-
  #   flash-model-id, whose HEAD was refs/heads/beav/fix-please-release-
  #   injection-3 (pr #15, merged):
  #       "🍂 beav/fix-please-release-injection-3
  #          └─ branch deleted (local + remote)"
  #     ... and the worktree still on disk, still registered, still populated.
  #
  #   the old code matched success on /status: removed|branch deleted/, so that
  #   arm read as a clean fell: it reported "tree removed ✨", stopped both
  #   ducts and closed the tabs, over a tree that was never touched. that is
  #   how worktrees orphan silently, and it is the likely source of the ratio
  #   git.crew.poll cites — 142 trees on disk against 14 that ever had a crew.
  #
  #   so the gate's verdict is about a subject that may not be THIS tree
  #   (term=partial-audit, the wrong-instance mechanism). we grade the real dir
  #   ourselves, BEFORE the gate runs, because the alias deletes the branch on
  #   that arm regardless — and a branch deleted out from under dirty work is
  #   the one loss this whole skill exists to prevent.
  #
  # .note = a nonzero rc here can ONLY mean dirty, never "not a worktree" — the
  #   husk case was classified out by the elif above, so this arm may grade.
  pre_rc=0
  pre="$(cd "$treedir" && git status --porcelain 2>&1)" || pre_rc=$?
  if [[ "$pre_rc" -ne 0 || -n "$pre" ]]; then
    echo "   └─ ✋ tree holds live work — gate not run, branch untouched"
    echo ""
    echo "$pre" | tail -12
    echo ""
    echo "🛑 ducts left UP so no live work is lost."
    echo "   fix: commit it, or re-run with --stash --why '<why it is safe>'"
    exit 2
  fi

  echo "   ├─ git tree del --this (safety gate, in $treedir)"

  # run the gate in the worktree, exactly where the foreman sat.
  #
  # .why a subshell `cd` and not `git -C`
  #   `git tree` is a `!` alias that shells out, so it reads its own $PWD. a
  #   subshell cd reproduces the foreman's cwd precisely, which keeps `--this`
  #   resolved as it always has. the parent shell's cwd is untouched, so the
  #   dir under removal is never pulled out from under this skill.
  gate_rc=0
  result="$(cd "$treedir" && git tree del --this 2>&1)" || gate_rc=$?

  # the --this flag is unknown to this git-tree version
  if echo "$result" | grep -q "usage: git tree del"; then
    echo "   └─ ✋ this git-tree has no --this flag — pass the branch by hand"
    echo ""
    echo "   fix: cd '$treedir' && git tree del <branch>"
    exit 2
  fi

  # .why BOTH the exit code and the dir check, and why the dir wins
  #   a nonzero rc is a strong signal, but `git tree del` also cds out of the
  #   tree it removes, so a benign trailing error can ride along a SUCCESSFUL
  #   removal. the removal itself is the fact we care about, and it is directly
  #   observable — so the dir check adjudicates and the rc only colors the
  #   report. this is the pair the pane could never offer: a code AND a state,
  #   in place of a grep over prose.
  if [[ -d "$treedir" ]]; then
    # the gate REFUSED — it named a reason, so honor it and stop.
    reason="$(echo "$result" | grep -oiE "has untracked files|has unstaged changes|has unmerged commits|not fully merged" | tail -1 || true)"
    if [[ -n "$reason" ]]; then
      echo "   └─ ✋ tree NOT removed — safety gate refused: $reason"
      echo ""
      echo "$result" | tail -12
      echo ""
      echo "🛑 ducts left UP so no live work is lost. fix it, then retry."
      exit 2
    fi

    # the gate did NOT name a reason and did NOT exit 0 — an unknown refusal.
    # do not guess at it, and above all do not remove a tree over it.
    if [[ "$gate_rc" -ne 0 ]]; then
      echo "   └─ ✋ tree NOT removed — gate failed with no named reason (rc=$gate_rc)"
      echo ""
      echo "$result" | tail -12
      echo ""
      echo "🛑 ducts left UP so no live work is lost. diagnose, then retry."
      exit 2
    fi

    # the gate reported SUCCESS and the dir is still here — the name-derivation
    # arm described in the pre-check note. the alias cannot reach this worktree,
    # so we remove it, and we say plainly that we did.
    #
    # this is safe on exactly the evidence the pre-check gathered: --porcelain
    # was empty on THIS dir, moments ago, so there is no tracked or untracked
    # work to lose. --force covers only ignored litter (node_modules, dist,
    # .log), which `git worktree remove` otherwise refuses to step over.
    echo "   ├─ ⚠️  gate left the worktree behind — its path derivation missed it"
    echo "   │     (dir name and branch have diverged; see the .why above)"

    # .the path guard — the last line before a destructive step
    #   $treedir can only have come from the glob above, so it is already under
    #   $HOME/git/*/_worktrees/. this re-asserts it regardless, because the next
    #   two commands are the only ones in this file that destroy bytes, and a
    #   guard that costs one comparison is cheaper than the outcome it prevents.
    #   the alias keeps the same guard at its own removal site, for the same
    #   reason.
    if [[ "$treedir" != *"/_worktrees/"* ]]; then
      echo "   └─ ✋ refused — path is not inside a _worktrees dir: $treedir"
      exit 2
    fi

    common="$(cd "$treedir" && git rev-parse --git-common-dir 2>/dev/null || true)"
    mainrepo="${common%/.git}"
    wt_rc=0
    wt_out="$(git -C "$mainrepo" worktree remove "$treedir" --force 2>&1)" || wt_rc=$?

    # .why a chmod retry, and why it is not a workaround
    #   pnpm builds node_modules out of a content-addressable store whose dirs
    #   land read-only, so `worktree remove` dies on "Permission denied" over
    #   litter it was told to force past. measured 2026-08-25 on
    #   rhachet-roles-ghlitch.beav.fix-provision-declastruct-auth: rc=255.
    #   the alias meets the same wall and answers it the same way (chmod, then
    #   remove) — so this is the established treatment, not an invention here.
    if [[ -d "$treedir" ]]; then
      echo "   ├─ retry: relax read-only litter (pnpm store perms)"
      chmod -R u+rwX "$treedir" || true
      wt_rc=0
      wt_out="$(git -C "$mainrepo" worktree remove "$treedir" --force 2>&1)" || wt_rc=$?
    fi

    if [[ -d "$treedir" ]]; then
      echo "   └─ ✋ tree NOT removed — could not remove the worktree (rc=$wt_rc)"
      echo ""
      echo "$wt_out" | tail -12
      echo ""
      echo "   fix: sudo chmod -R u+rwX '$treedir', then retry"
      echo ""
      echo "🛑 ducts left UP. fix it, then retry."
      exit 2
    fi

    git -C "$mainrepo" worktree prune || true
    echo "   ├─ tree removed ✨ (by this skill, after the gate missed it)"
  else
    echo "   ├─ tree removed ✨"
  fi
fi

# .why this exit sits HERE and not at the top
#   `--tree-only` is set only when THIS FILE is re-exec'd on a remote box by
#   the `--grove` branch above (see the top `.why --grove` block). the tree
#   is confirmed gone at this exact point, which is precisely what the
#   calling (local, control-machine) invocation is waiting on — ducts are
#   addressed from THAT machine, never from inside the box just felled, so
#   a remote run must stop here rather than fall into the local tab/duct
#   teardown below.
if [[ "$tree_only" -eq 1 ]]; then
  exit 0
fi

# ORDER MATTERS in the teardown: tabs first, while the windows still exist so
# term.stop can actually match and close them. if the ducts were stopped
# first, kitty would auto-close each window the instant its `tmux attach`
# child exits, and term.stop would then have no window to match (a false
# "already closed"). closing a window only DETACHES its tmux client — the
# session persists — so duct.stop still cleans the sessions up after.
# git.tree.duct opened a tab per role under the tmux-safe terminal slug, so
# term.stop --on <slug> closes the whole window (every role tab) in one call.
# best-effort: a tab-close miss must not fail the teardown (tree is already
# gone) — report and move on. the ORDER and the best-effort contract live
# once, in __tree_del_teardown_ducts above — as does the DISCOVERY of which
# roles this tree actually carries, which is why no role is named here.
__tree_del_teardown_ducts "" "$name" "${name//./_}"
