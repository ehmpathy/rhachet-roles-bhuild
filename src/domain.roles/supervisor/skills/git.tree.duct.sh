#!/usr/bin/env bash
######################################################################
# .what = create worktree with duct sessions in one operation
#
# .why  = combines common steps:
#         1. create one duct session per role in CREWWORK_ROLES_DEFAULT
#            (mechanic = worker, foreman = supervisor, reflector = the look
#             back at the round)
#         2. create worktree, and cd EVERY duct into it
#         3. open ONE terminal window per tree, one tab per role:
#              - base tab = the FIRST role, attached to its duct
#              - one +tab per later role, likewise
#
#         one window per tree = clean supervisor view; alt-1 / alt-2 / alt-3
#         flips between roles. enables human to watch work, close window,
#         reopen later without loss of session state.
#
#         ⚠️ the roster is NOT spelled in this file. it is read from
#         CREWWORK_ROLES_DEFAULT (work/crewwork.sh), so a seat added there
#         reaches a SPROUT and a crew.boot alike rather than one of the two.
#
#         this skill is GENERIC — it only sets up the worktree + ducts.
#         to boot a behavior on top, use git.tree.behavior (which wraps
#         this skill and layers init.behavior). see
#         rule.require.behaviors-over-adhoc.
#
# usage:
#   rhx git.tree.duct --into ehmpathy/sdk-config --name bert/upgrade-cache
#   rhx git.tree.duct --into ehmpathy/sdk-config --name bert/upgrade-cache --slug sdk-config
#   rhx git.tree.duct --into ehmpathy/sdk-config --name bert/upgrade-cache --grove cloud://grove-1
#
# args:
#   --into        org/repo path (e.g., ehmpathy/sdk-config)
#   --name        branch name to create (e.g., bert/upgrade-cache)
#   --feat-why    the capability a `feat-` name ADDS   [required if feat]
#   --grove       local (default) | cloud://<groveslug>
#   --slug        duct session slug (optional, defaults to treename)
#   --defer-view  do NOT open tabs; leave the view to the caller
#
# .note on --feat-why
#   the branch convention is `beav/<fix|feat>-<slug>`, and `fix` is its default
#   half. `feat` is a CLAIM — that this adds a capability a human can ask for
#   which did not exist — so a `feat-` name fails fast (exit 2) unless it
#   carries --feat-why '<reason>'.
#
#   ⚠️ a name outside that convention (a human's `bert/upgrade-cache`) is never
#   gated. this verb takes an arbitrary branch name on purpose, and the rule
#   governs the fix/feat vocabulary rather than every branch.
#
#   see rule.require.justify-a-feat-classification.
#
# .why --grove exists — a tree could not be SPROUTED anywhere but here
#   every rung above this one already travelled: crew.boot takes a --grove,
#   crew.show takes a --grove, and duct.send has addressed duct://<grove>/…
#   since ducts learned to. only rung one — MAKE the worktree — was pinned to
#   this box by three uses of $HOME, and $HOME is /home/bert here and
#   /home/camper on a grove.
#
#   so a grove sprout took eight commands by hand, twice, on 2026-09-03. and
#   the by-hand path was not a shortcut a caller chose — it was the only path
#   left: this is a `repo=.this` skill, so `rhx git.tree.behavior` ON a grove
#   answers `no skill "git.tree.behavior" found in any linked role`. two closed
#   doors, and this flag opens the one that could be opened.
#   see rule.always.entool-the-skills-you-touch.
#
# .why the grove's $HOME is asked for, never assumed
#   $HOME expands HERE, so any path built from it is a local answer to a remote
#   question — the exact defect __crew_tree_dir_on_grove was written to end
#   (it carried /home/bert to a box whose user is `camper` and reported a
#   plainly-present tree as absent). so the cloud arm resolves the grove's own
#   root ONCE, over ssh, and every path below is built from that.
#
# .why --defer-view exists — a stolen focus must not halt a boot
#   a kitty tab STEALS keyboard focus the moment it opens. so a human who is
#   mid-sentence anywhere on the machine has their in-flight keystrokes land in
#   the pane kitty just focused — and the next command a caller sends into that
#   duct arrives PREFIXED by them.
#
#   observed live 2026-08-13: a boot command reached a fresh mechanic as
#     ➜  the fix{ [ -f pnpm-lock.yaml ] && pnpm install || npm install; } && ...
#     zsh: parse error near `}'
#   `the fix` was the human's own keystrokes. the boot halted.
#
#   the ORDER is the cure, not a kitty flag: open no tab until every command a
#   caller means to send has already landed. then a stolen focus costs a
#   nuisance rather than a failed boot.
#
#   so a caller that sends work after this skill (git.tree.behavior does) passes
#   --defer-view, sends, and THEN opens the view with `rhx git.crew.show`.
#
# guarantee:
#   - creates one duct session per role in CREWWORK_ROLES_DEFAULT
#   - ALWAYS creates AND enters the worktree, idempotently:
#       - worktree dir extant     -> reuse it
#       - branch extant, no tree  -> add a worktree for that branch
#       - neither                 -> fresh branch + worktree off the default
#   - creation runs synchronously in THIS process (checkable exit code)
#   - --grove cloud://<g> puts the worktree, every duct, and the window on
#     that grove; the local arm is unchanged
#   - PARALLEL-SAFE: a per-repo flock mutex serializes the worktree-create
#     critical section, so many calls can run at once without a git-lock race
#   - verifies the worktree dir exists before ducts enter it
#   - EVERY duct is cd'd into the worktree, never only the first
#   - opens ONE window per tree via term.open --for: base tab = the first role,
#     +tab per later role; each tab shows the clean role, attaches its role duct
#   - fail-fast on errors
######################################################################

set -euo pipefail

# source crewwork, which loads ductwork + termwork itself (__crew_load_peers).
#
# .why the CREW lib and not ductwork alone: the grove-aware pieces this skill
#      needs — __crew_grove_host to read a --grove, __crew_duct_uri to address a
#      duct on one, __crew_ledger_set to record it — are the crew layer's, and
#      each carries a defect it was written to end. to re-derive any of them
#      here would be a second path beside a serviceable one
#      (rule.always.reuse-pavement-before-improvise).
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/crewwork.sh"

# parse args
into=""
name=""
slug=""
feat_why=""
grove="local"
defer_view=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --into)
      into="$2"
      shift 2
      ;;
    --name)
      name="$2"
      shift 2
      ;;
    --grove)
      grove="$2"
      shift 2
      ;;
    --slug)
      slug="$2"
      shift 2
      ;;
    --feat-why)
      feat_why="$2"
      shift 2
      ;;
    --defer-view)
      defer_view="yes"
      shift
      ;;
    --repo|--role|--skill)
      # reserved by rhachet, ignore
      shift 2
      ;;
    --help|-h)
      # ⚠️ this arm was ABSENT, so `--help` fell to the `unknown arg` line
      #    below and exited 1 — on the verb that sprouts every worktree in the
      #    fleet. a human who asks a tool to explain itself must never be told
      #    they typed a bad flag (rule.require.help-on-demand).
      #    bounded by the banner that shuts the header, never a line number, so
      #    it cannot truncate as the header grows.
      awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"
      exit 0
      ;;
    *)
      # a bad flag is a CONSTRAINT, never a malfunction — see `git.tree.del`,
      # which has always exited 2 here (rule.require.exit-code-semantics)
      echo "error: unknown arg: $1" >&2
      exit 2
      ;;
  esac
done

# validate
if [[ -z "$into" ]]; then
  echo "error: --into required" >&2
  exit 1
fi

if [[ -z "$name" ]]; then
  echo "error: --name required" >&2
  exit 1
fi

# is a `feat-` name earned? gated HERE as well as in git.tree.behavior, because
# this is a birth path in its own right — a caller may sprout a tree straight
# through this verb, and a gate that lives only in the layer above is a gate
# with a door beside it. behavior forwards its own --feat-why down, so the
# justification is asked once and answered once.
__crew_guard_feat_level "$name" "$feat_why" || exit 2

# which grove — '' is the canonical "this machine" host, the same zero value a
# local duct uri already carries (duct:///<tree>/<role>)
host="$(__crew_grove_host "$grove")" || exit 2

# 🔴 and is it a grove a crew may LIVE on? a lab grove is tagged deletable in
#    ec2, so a worktree booted there is thrown away with the box. this is the
#    ONE choke point every tree verb passes through — git.tree.behavior and
#    git.tree.achievement both delegate here — so the gate belongs here rather
#    than in each of them. see __crew_grove_assert_bootable.
__crew_grove_assert_bootable "$host" "$grove" || exit 2

# derive worktree folder name for duct name
# pattern: $repo.$branch_slug (e.g., sdk-config.beav.fix-cache)
branch_slug="${name//\//.}"
treename="${into##*/}.${branch_slug}"

# derive slugs from treename if not provided
if [[ -z "$slug" ]]; then
  slug="$treename"
fi

# duct names follow rule.require.duct-name-pattern: $treename/$role — built per
# role at the point of use, from CREWWORK_ROLES_DEFAULT. a per-role `slug_$role`
# variable stood here for the two hardcoded roles; it could not survive a third,
# and every consumer already had $slug and the role in hand.

# tmux-compatible TERMINAL slug (treename only, no role) for term.open --for.
# --for <role> derives the duct as <terminal>/<role> with NO dot conversion,
# so we must hand it the already-underscored treename to match the real
# tmux sessions ($slug_tmux/<role>).
slug_tmux="${slug//./_}"

# ── the git root, on the machine that owns it ──────────────────────────
# THE one line that pinned this skill to this box. $HOME expands HERE, so a
# grove path built from it names /home/bert on a machine whose user is
# `camper` — a local answer to a remote question. so the cloud arm asks the
# grove, once, and every path below is built from what it answered.
if [[ -z "$host" ]]; then
  git_root="$HOME/git"
else
  if ! git_root="$(ssh -n "$host" 'printf "%s/git" "$HOME"')"; then
    echo "error: could not reach grove '$host'" >&2
    echo "       wake it: rhx git.grove.wake $host" >&2
    exit 1
  fi
fi

# build path
repo_path="$git_root/$into"

# .why the check is split by host rather than skipped for a grove: an
#      unverifiable check is worse than an absent one, but this one IS
#      verifiable — by the box that owns the disk. a clone absent on the grove
#      is the likeliest failure of a first cloud sprout, and it must name that
#      rather than surface later as a git error inside a worktree add.
if [[ -z "$host" ]]; then
  repo_found=$([[ -d "$repo_path" ]] && echo yes || echo no)
else
  repo_found=$(ssh -n "$host" "test -d '$repo_path' && echo yes || echo no")
fi
if [[ "$repo_found" != "yes" ]]; then
  echo "error: repo not found: $repo_path${host:+ (on $host)}" >&2
  [[ -n "$host" ]] && echo "       clone it there first" >&2
  exit 1
fi

# derive worktree path for later
worktree_path="$git_root/${into%/*}/_worktrees/${treename}"

# ⚠️ the role list is READ from CREWWORK_ROLES_DEFAULT, never spelled here.
#    this held two hardcoded roles across five sites — the plan echo, the ducts,
#    the cd sends, the ledger row, and the tabs — beside a constant whose whole
#    job is to name the crew once. so a third seat added to the constant reached
#    crew.boot and left a SPROUT with two, and the two paths that both birth a
#    crew would have disagreed about what a crew is (the ledger row records the
#    disagreement, which is how it outlives the run that made it).
crew_roles=()
__crew_roles_into crew_roles "$CREWWORK_ROLES_DEFAULT"

# fail-fast on an empty roster. this file runs `set -u`, so an empty array would
# not merely make a crewless tree — `${crew_roles[0]}` at the focus step would
# abort AFTER the worktree and ledger row were on disk, which is the half-booted
# state the hooks-off note above exists to prevent. cheaper to refuse up front.
if [[ ${#crew_roles[@]} -eq 0 ]]; then
  echo "error: CREWWORK_ROLES_DEFAULT named no role — a tree with no crew is not a tree" >&2
  echo "       it is set in .agent/repo=bhuild/role=supervisor/skills/work/crewwork.sh" >&2
  exit 2
fi

echo "🐢 radical!"
echo ""
echo "🐚 git.tree.duct"
echo "   ├─ into: $into"
echo "   ├─ name: $name"
echo "   ├─ grove: $grove"
echo "   ├─ ducts"
for role in "${crew_roles[@]}"; do
  echo "   │  ├─ $role: $slug/$role"
done
echo "   └─ worktree: $worktree_path"
echo ""

# 1-2. create a duct session per role (starts in repo, cd'd to the worktree below)
#    note: rhx duct.* verbs take a duct URI, never a bare name. local = THREE
#    slashes (empty host = this machine); the bare slug stays for termwork below.
#
# ⚠️ the --cwd is PER ROLE, never per tree — the same seam crew.boot crosses.
#    a local-only seat (reviewer.take / reviewer.give) opens on THIS box, so its
#    cwd must be this box's mirror dir. the grove's worktree path does not exist
#    here, and one shared --cwd hands it that path and strands the seat.
#
# 🔴 .this loop had the HOST seam and not the CWD seam, and shipped that way
#
#    __crew_duct_uri gave every role its right box; the cwd stayed flat. so a
#    cloud sprout opened three grove ducts, then handed the LOCAL reviewer the
#    grove's `/home/camper/...` path and died on "is not a directory" — AFTER
#    the first three ducts and the worktree were already on disk. a half-booted
#    crew, from a verb that reported each step as it succeeded.
#
#    ⇒ the identical shape as the LEDGER defect two blocks below: a crew is born
#      on TWO paths (a sprout here, a re-boot in crew.boot), and knowledge taught
#      to one path alone makes the other lie. crew.boot carried the per-role cwd
#      rule, in a comment, for its whole life — and this loop never learned it.
#      see rule.always.teach-both-crew-birth-paths.
#
#    ⚠️ the grove is HINTED rather than looked up: the ledger row is written
#      BELOW this loop (a row asserts the ducts are up), so the seam cannot read
#      it yet. we know the grove; we say so.
for role in "${crew_roles[@]}"; do
  uri_role="$(__crew_duct_uri "$host" "$slug" "$role")"
  cwd_role="$(__crew_role_cwd "$repo_path" "$slug" "$role" "$grove")"
  echo "├─ duct.open --on $uri_role --cwd $cwd_role"
  rhx duct.open --on "$uri_role" --cwd "$cwd_role"
done

# 2b. record the crew in the LEDGER — this is a crew's BIRTH
#
# .why here, and not only in crew.boot
#   a crew is born on TWO paths: a sprout (this skill, via git.tree.behavior)
#   and a re-boot onto an extant tree (crew.boot). the ledger row must be
#   written on BOTH, or the record answers for one path and lies about the
#   other — a sprouted crew would be absent from every sweep that derives
#   from it, which is the exact blindness the ledger exists to close.
#
#   this was found the hard way: the ledger shipped with the write in
#   crew.boot alone, and the very first sprout after it went unrecorded.
#   see term=ledger._.choice.reason.md.
#
# .why AFTER both ducts, never before — the row asserts "a crew was booted
#   here", and that is only true once the ducts are up.
#
# ⚠️ the grove is RECORDED, never hardcoded. this wrote the literal "local" for
#    every sprout, which was true while a sprout could only land here and
#    became a false report the moment one could not. the ledger's whole job is
#    to remember where a crew is — a row that names the wrong machine sends
#    every sweep derived from it to the wrong box (term=false-report).
__crew_ledger_set "$slug" "$grove" "$CREWWORK_ROLES_DEFAULT"
echo "├─ 📒 ledger: recorded — this tree is a crew, and stays one"

# 3. create the worktree SYNCHRONOUSLY in this process (idempotent)
#    why synchronous (not fire-and-forget into the duct):
#      - exit code is checked here, so real failures fail-fast
#    why flock-guarded:
#      - several git.tree.* calls may run in PARALLEL against one repo
#      - git worktree creation grabs the repo's index/worktree lock
#      - concurrent creators collide -> some fail -> stuck in main
#      - flock serializes ONLY this critical section, per repo, so
#        parallel callers wait their turn here then proceed concurrently
#    idempotent branches:
#      - worktree dir extant      -> reuse
#      - branch extant, no tree   -> add a worktree for that branch
#      - neither                  -> fresh branch + worktree via git tree set
lockfile="${repo_path}/.git/.rhx-tree-create.lock"
create_worktree() {
  if [[ -d "$worktree_path" ]]; then
    echo "├─ worktree extant, reuse..."
  elif git -C "$repo_path" show-ref --verify --quiet "refs/heads/$name"; then
    echo "├─ branch extant, add worktree..."
    # hooks-off: see create_worktree_on_grove's note. same exposure here
    git -c core.hooksPath=/dev/null -C "$repo_path" worktree add "$worktree_path" "$name"
  else
    echo "├─ create worktree (git tree set)..."
    # ⚠️ this arm reaches a dev-env-setup ALIAS, so the hooks-off flag cannot
    #    be injected. it carries the same husky exposure, unguarded — the
    #    local spawn clones happen to keep their deps, which is luck, not a
    #    guarantee. owed: a flag on the alias, or drop to the two raw lines
    #    the grove arm uses
    ( cd "$repo_path" && git tree set --from main --init "$name" )
  fi
}

# the SAME three-way idempotence, run by the grove's own shell.
#
# .why it rides ssh's STDIN as `sh -s`, never as an argument: an argument would
#      nest this whole block inside one shell string with every quote escaped
#      twice — the shape that makes a remote command unreadable and, worse,
#      unreviewable. stdin carries it verbatim. the same choice
#      git.grove.send's --file arm makes, for the same reason.
#
# .why `sh -s` rather than the login shell: a grove's login shell is zsh, and
#      zsh differs from sh where it matters here — it errors on an unmatched
#      glob rather than leave it literal. sh is the one dialect both boxes
#      agree on. see __crew_tree_dir_on_grove, which learned this first.
#
# .why plain `worktree add` rather than the local arm's `git tree set`: that is
#      a shell ALIAS from dev-env-setup, not a binary, so a non-interactive
#      remote sh does not have it. the two lines below are what it amounts to
#      for our purpose, and they are the exact pair verified by hand on
#      2026-09-03 when this flag did not yet exist.
#
# .why origin/HEAD rather than the literal `main`: the default branch is a
#      property of the repo, and `git tree set --from main` only ever worked
#      because ours all happen to use it. the grove can be asked.
#
# the heredoc is UNQUOTED, so paths derived here interpolate; a `\$` defers a
# variable to the grove's own shell.
#
# .why this ssh takes NO `-n`, alone among the calls in this file
#      `-n` binds ssh's stdin to /dev/null, which is right for every ssh that
#      merely QUERIES a grove — it stops the call from a swallow of a caller's
#      loop input. here stdin IS the payload: `sh -s` reads the program off it,
#      so `-n` would hand the grove an empty program and the worktree would
#      silently not be created.
#
#      ⇒ the exemption is opt-in and marked, so a reviewer sees it in the diff
#        beside the line it excuses. see [case21] in work.surface.
#
# 🔴 .why `-c core.hooksPath=/dev/null` on every worktree add
#      a `worktree add` fires the repo's own post-checkout hook. husky points
#      core.hooksPath at .husky/, and every husky hook opens with a `.` of
#      .husky/_/husky.sh — a shim `npm install` generates. the SPAWN clone
#      (~/git/$org/$repo, the one worktrees are cut from) never has its deps
#      installed, because this skill installs into the WORKTREE at step 2. so
#      the shim is absent, the hook exits non-zero, and `set -e` kills the
#      whole sprout AFTER the worktree is already on disk — a half-booted tree
#      with live ducts and no behavior.
#
#      measured 2026-09-06, ehmpathy/declastruct-aws on grove-sandpine-v20260901:
#        .husky/post-checkout: 2: .: cannot open .../.husky/_/husky.sh
#
#      ⚠️ it is INTERMITTENT by nature, which is what makes it worth the note:
#      a peer worktree of the same repo (feat-ssm-document) sprouted clean days
#      earlier, so the clone HAD the shim then and lost it. any act that prunes
#      node_modules from a spawn clone re-arms it, silently.
#
#      ⇒ the repair is to not run the hook at all. a post-checkout hook serves
#      a DEVELOPER's checkout; this add is an infrastructure act by a skill,
#      and it has no business in a repo's lint/format lifecycle. hooks-off is
#      the fix at cause — deps in the spawn clone would only paper it over
#      until the next prune.
create_worktree_on_grove() {
  # stdin: forwarded on purpose
  ssh "$host" sh -s <<EOF
set -e
if [ -d "$worktree_path" ]; then
  echo "├─ worktree extant, reuse..."
elif git -C "$repo_path" show-ref --verify --quiet "refs/heads/$name"; then
  echo "├─ branch extant, add worktree..."
  git -c core.hooksPath=/dev/null -C "$repo_path" worktree add "$worktree_path" "$name"
else
  echo "├─ create worktree (fresh branch off the default)..."
  git -C "$repo_path" fetch origin --quiet
  def=\$(git -C "$repo_path" symbolic-ref --short refs/remotes/origin/HEAD | sed 's|^origin/||')
  git -c core.hooksPath=/dev/null -C "$repo_path" worktree add "$worktree_path" -b "$name" "origin/\$def"
fi
EOF
}

if [[ -n "$host" ]]; then
  # .why no flock on the cloud arm: the lock guards THIS box's parallel
  #      callers, and its file would have to live on the grove to guard the
  #      grove's. a lock on the wrong machine guards naught and reads as
  #      though it guards something — so it is left out, named here rather
  #      than implied. parallel cloud sprouts into one repo are the open case.
  create_worktree_on_grove
elif command -v flock >/dev/null 2>&1; then
  # guard the critical section with flock when available; degrade gracefully if not
  exec 9>"$lockfile"
  flock 9
  create_worktree
  flock -u 9
  exec 9>&-
else
  create_worktree
fi

# 4. verify the worktree exists before any duct enters it
if [[ -z "$host" ]]; then
  tree_found=$([[ -d "$worktree_path" ]] && echo yes || echo no)
else
  tree_found=$(ssh -n "$host" "test -d '$worktree_path' && echo yes || echo no")
fi
if [[ "$tree_found" != "yes" ]]; then
  echo "error: worktree not created: $worktree_path${host:+ (on $host)}" >&2
  exit 1
fi

# 5-6. enter the worktree in EVERY duct (dir guaranteed to exist)
#    --on takes a duct URI (local = THREE slashes), and --await lets the pane's
#    prompt settle so the busy-guard does not reject the send. see duct.open.sh.
#
# 🔴 .this loop carries weight, and is never cosmetic. a duct that misses its cd
#    stays in the REPO ROOT rather than the worktree, and reports no error — the
#    same "wrong directory, silently" defect the --cwd note at step 1/2 records.
#    so a role added to the constant and missed here would come up on main's
#    tree and look, from every instrument, exactly like a healthy crew member.
for role in "${crew_roles[@]}"; do
  echo "├─ enter worktree ($role)..."
  duct.send --on "$(__crew_duct_uri "$host" "$slug_tmux" "$role")" --await 30 --what "cd '$worktree_path'"
done

# 7-8. open the VISIBLE window with one tab per role. this is COSMETIC — the real
#    work (worktree + every duct) is already done above. a window/tab that fails
#    to open (e.g. a fresh-kitty socket race on the second --for) must NEVER abort
#    this skill, or a caller that chains work after it (git.tree.behavior boots the
#    behavior right after this) would be aborted by set -e over a cosmetic hiccup.
#    so each open is best-effort: warn on failure, then proceed. the tab can always
#    be re-opened later with `rhx term.open --via kitty --on $slug --for <role>`.
#
#    term.open --for <role> ≡ --tab <role> --duct <terminal>/<role>:
#      - the tab bar shows the clean role, not the long duct slug
#      - the tab attaches the role duct ($slug_tmux/<role>, from step 1/2)
#    the FIRST --for on a fresh terminal becomes its base tab, so mechanic first.

# helper: try a term.open, retry once (covers the fresh-window socket race),
#         never fatal — a failed window is a nuisance, not a reason to abort.
#
# the terminal's slug carries the HOST, so one form serves both groves:
#   local  ->  <tmuxname>
#   cloud  ->  <grove>:<tmuxname>
# term.open parses it back into (host, session) and picks its attach command
# from the host — an ssh -t on a grove, a login shell here. exactly as
# crew.show does it, and for the same reason: below this line there is no
# local arm and no cloud arm.
term_slug="$slug_tmux"
[[ -n "$host" ]] && term_slug="$host:$slug_tmux"

try_term_open_for() {
  local role="$1"
  term.open --via kitty --on "$term_slug" --for "$role" && return 0
  echo "   ⚠️  term.open --for $role failed once, retry..." >&2
  term.open --via kitty --on "$term_slug" --for "$role" && return 0
  echo "   ⚠️  term.open --for $role failed; duct is live, re-open later with:" >&2
  echo "        rhx term.open --via kitty --on $term_slug --for $role" >&2
  return 0
}

# --defer-view: the caller has work to send into these ducts, and a tab that
# opens first steals focus into the very pane that work lands in. so we stop at
# the WORK axis and hand the VIEW back to the caller (see the header).
if [[ -n "$defer_view" ]]; then
  echo ""
  echo "🐢 cowabunga! ducts ready — view deferred"
  for role in "${crew_roles[@]}"; do
    echo "   ├─ $role: $slug/$role"
  done
  echo "   └─ open the view once your sends have landed:"
  echo "      rhx git.crew.show --tree $slug_tmux --grove $grove"
  exit 0
fi

# the FIRST role takes the window's base tab; each later one adds a +tab. that
# order is the constant's, so it is read from the constant rather than restated.
for role in "${crew_roles[@]}"; do
  echo "├─ term.open --via kitty --on $term_slug --for $role"
  try_term_open_for "$role"
done

# 9. focus back on the MECHANIC. kitty leaves focus wherever the last open
#    landed, so a fresh tree lands the human on the foreman — the observer,
#    never the worker. the mechanic is the tab worth a look: it is where the
#    behavior boots and where the route drives.
#
#    a findsert, not a fresh capability: term.open on an extant tab focuses it
#    and returns 0. best-effort like every other tab op here — a focus that
#    fails leaves every tab open and every duct live, so it must not abort a
#    skill whose real work (worktree + ducts) is already done.
#
#    the target is the FIRST role, which is the base tab and, by the constant's
#    order, the mechanic. named positionally so a re-order of the constant
#    carries the focus with it rather than strands it on a middle tab.
crew_role_first="${crew_roles[0]}"
echo "└─ term.open --via kitty --on $term_slug --for $crew_role_first (focus back)"
term.open --via kitty --on "$term_slug" --for "$crew_role_first" >/dev/null 2>&1 || \
  echo "   ⚠️  could not focus the $crew_role_first tab; every tab is open" >&2

echo ""
echo "🐢 cowabunga! worktree ready — 1 window, ${#crew_roles[@]} tabs"
tab_n=0
for role in "${crew_roles[@]}"; do
  tab_n=$((tab_n + 1))
  # ⚠️ an `if`, never `[[ … ]] && x=…`. this file runs under `set -e`, where a
  #    bare `&&` list whose test is FALSE returns 1 and aborts the run — so the
  #    last-row check would kill every sprout on rows 1..n-1, after the real
  #    work was already done. caught in review of this very hunk.
  branch="├─"
  if [[ $tab_n -eq ${#crew_roles[@]} ]]; then branch="└─"; fi
  base=""
  focus=""
  if [[ $tab_n -eq 1 ]]; then base=" (base)"; focus="  👁️  focused"; fi
  echo "   $branch tab $tab_n$base: $role — $slug/$role$focus"
done