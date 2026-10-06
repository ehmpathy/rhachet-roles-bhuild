#!/usr/bin/env bash
######################################################################
# .what = create worktree + ducts AND boot a bound behavior
#
# .why  = layers behavior boot on top of the generic git.tree.duct:
#         1. git.tree.duct — worktree + one duct per crew role + terminal
#         2. install deps (pnpm if lockfile, else npm)
#         3. rhx upgrade — latest cli, briefs, skills
#         4. rhx init.behavior — boots a bound behavior from the wish
#         5. claude — drives the bound route
#
#         ⚠️ the CLONE lands in the mechanic duct alone. every other role
#         (foreman, reflector) comes up as a bare shell on the same worktree,
#         which is what makes it a seat a human or supervisor can take without
#         a second conversation to keep alive.
#
#         --size and --wish are REQUIRED so every behavior worktree
#         boots a bound behavior — no ad-hoc dispatch. see
#         rule.require.behaviors-over-adhoc.
#
# usage:
#   rhx git.tree.behavior \
#     --into ehmpathy/domain-objects-metadata \
#     --name beav/fix-extract-serializable-type \
#     --size nano \
#     --wish src/stream/2026.Q2/2026-06-30.dispatch.repo=domain-objects-metadata.behavior=fix-extract-serializable-type.wish.md
#
# args:
#   --into   org/repo path (e.g., ehmpathy/sdk-config)        [required]
#   --name   branch name to create (e.g., beav/fix-cache)     [required]
#   --feat-why  the capability a `feat-` name ADDS            [required if feat]
#   --size   behavior size: nano|mini|medi|mega|giga          [required]
#   --size-why  reason a non-nano size is warranted          [required if size>nano]
#   --wish   path (in THIS repo) to the wish file to boot     [required]
#   --grove  local (default) | cloud://<groveslug>
#   --slug   duct session slug (optional, defaults to treename)
#
# .note on --grove
#   this is the verb that does ALL of it — worktree, ducts, install, upgrade,
#   bound behavior, window — and --grove carries that whole chain to a remote
#   grove: git.tree.duct puts the tree and both ducts there, the wish is
#   SHIPPED across (a duct is a keystroke channel and cannot carry a
#   document), and crew.show opens the window over ssh.
#   see rule.always.entool-the-skills-you-touch.
#
#   ⚠️ --grove names WHERE THE TREE LANDS, never where this command runs. the
#   skill ships in the rhachet-roles-bhuild package, so it resolves from any
#   repo that links role=supervisor — a consumer, a grove, or here.
#
# .note on --size-why
#   nano is the default. a size above nano costs more (extra stones + review
#   gates), so it must be justified: a non-nano --size fails fast unless it
#   carries --size-why '<reason>', and the supervisor must confirm the size with
#   the human before boot. see rule.require.confirm-behavior-size-above-nano.
#
# .note on --feat-why
#   the same toll, on a second axis. `fix` is the default half of the branch
#   convention; `feat` is a CLAIM — that this adds a capability a human can ask
#   for which did not exist. a `beav/feat-*` name fails fast unless it carries
#   --feat-why '<reason>', and the reason then rides in the visible command and
#   into the boot render where a human can veto it before the tree exists.
#   see rule.require.justify-a-feat-classification.
#
# 🔴 .note on declapract — this verb REFUSES it
#   a `--name` that holds `declapract` fails fast (exit 2). that work boots its
#   OWN route via `declapract.upgrade init`, so a behavior on top is a SECOND
#   route structure on one tree. reach for the bare `git.tree.duct` primitive
#   and layer the upgrade route on it — the refusal prints both commands.
#   see howto.dispatch-dependency-upgrades, which declares the exception.
#
# .note on --wish
#   the wish file lives in THIS repo (e.g. sandpine-notebook) under the daily
#   stream, named like:
#     $date.dispatch.repo=$repo.behavior=$name.wish.md
#   its content is piped into `rhx init.behavior --wish @stdin` in the
#   worktree, so the booted behavior always carries the wish you wrote.
#
# guarantee:
#   - requires --size and --wish (fail-fast if absent, exit 2)
#   - a size above nano fail-fasts unless --size-why is given (exit 2), so an
#     expensive size is never booted without an explicit, human-visible reason
#   - a `feat-` branch fail-fasts unless --feat-why is given (exit 2), so a
#     fix is never shipped as a feature on the caller's say-so alone
#   - a `declapract` name fail-fasts (exit 2) and names the bare-duct path, so
#     a second route structure is never booted over one that boots its own
#   - --wish path must exist (fail-fast if not, exit 2)
#   - delegates worktree + duct setup to git.tree.duct
#   - boots behavior: install -> rhx upgrade -> rhx init.behavior
#     --wish @stdin -> claude drives the route
#   - fail-fast on errors
######################################################################

set -euo pipefail

# crewwork carries the grove vocabulary (__crew_grove_host, __crew_duct_uri)
# and loads ductwork + termwork itself
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/crewwork.sh"

# parse args
into=""
name=""
slug=""
size=""
size_why=""
feat_why=""
wish=""
grove="local"

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
    --size)
      size="$2"
      shift 2
      ;;
    --size-why)
      size_why="$2"
      shift 2
      ;;
    --feat-why)
      feat_why="$2"
      shift 2
      ;;
    --wish)
      wish="$2"
      shift 2
      ;;
    --repo|--role|--skill)
      # reserved by rhachet, ignore
      shift 2
      ;;
    --help|-h)
      # ⚠️ bounded by the BANNER that shuts the header, never by a line
      #    number. a hardcoded `3,66p` silently truncates the moment the
      #    header grows — and it had: the last 5 guarantee lines were already
      #    off the end before the --feat-why note was added. a marker cannot
      #    drift (rule.always.do-the-adjacent-fix-rather-than-dream-it). this
      #    is the form git.crew.boot.sh already uses.
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

# validate — every refusal below is a bad INPUT, so every one exits 2: the
# caller must fix the command, and a retry of the same one cannot help
# (rule.require.exit-code-semantics)
if [[ -z "$into" ]]; then
  echo "error: --into required (the org/repo the tree is cut from)" >&2
  echo "       e.g. --into ehmpathy/domain-objects" >&2
  exit 2
fi

if [[ -z "$name" ]]; then
  echo "error: --name required (the branch to create)" >&2
  echo "       e.g. --name beav/fix-extract-serializable-type" >&2
  echo "       fix is the default half; feat is a claim and costs --feat-why" >&2
  exit 2
fi

# 🔴 a declapract upgrade BRINGS ITS OWN ROUTE, so a behavior on top is a
#    SECOND route structure on one tree — two bound scopes, two guard sets, and
#    a driver that cannot tell which it owes.
#
#    `howto.dispatch-dependency-upgrades` declares the exception outright:
#    "this is a permitted exception to rule.require.behaviors-over-adhoc.
#     declapract.upgrade init boots its OWN bound route (stones + guards) — the
#     structured equivalent of a behavior. so we use the generic git.tree.duct
#     primitive and layer the upgrade route on top."
#
# ⚠️ MEASURED 2026-09-18: a tree was sprouted here for exactly this work, on a
#    grove, with a wish and a nano behavior — and felled minutes later. the
#    brief was correct, sat one glob away, and was read AFTER the sprout. a
#    rule that lives only in a brief binds whoever happened to load it
#    (rule.always.entool-the-skills-you-touch).
#
# ⇒ the check is on the SLUG rather than on a flag, because the caller who
#   needs it is precisely the caller who does not know the rule exists.
#
# ⚠️ it runs FIRST, ahead of the feat guard, on purpose. this refusal is about
#    the WHOLE COMMAND; the feat guard is about one flag on it. reversed, a
#    caller composes a --feat-why — real thought, spent on a claim — and is
#    only then told the verb was never the right one. measured 2026-09-18:
#    that is exactly what the first arrangement did.
if [[ "$name" == *declapract* ]]; then
  echo "✋ '$name' names a declapract upgrade, and that work boots its OWN route." >&2
  echo "   a behavior on top would be a SECOND route structure on one tree." >&2
  echo "" >&2
  echo "   reach for the paved verb for this one work:" >&2
  echo "     rhx git.tree.declapract.upgrade --into $into${grove:+ --grove $grove}" >&2
  echo "" >&2
  echo "   it takes no --wish and no --size (the upgrade route IS the scope), and" >&2
  echo "   it carries every boot hazard this skill already solved: a lockfile" >&2
  echo "   detect with no ternary, a repo whose prepare runs its own cli, a" >&2
  echo "   deferred view, and an ADDRESSABLE clone. a hand-rolled git.tree.duct" >&2
  echo "   dispatch carries none of them." >&2
  echo "" >&2
  echo "   see howto.dispatch-dependency-upgrades (the .why bare git.tree.duct" >&2
  echo "   section) and howto.upgrade-best-practices." >&2
  exit 2
fi

# `fix` is the default half of the convention; `feat` is a CLAIM. gate it the
# same way --size-why gates a non-nano size: fail fast (exit 2) unless the
# caller states the capability it ADDS, so a speedup is never shipped as a
# feature on the caller's say-so. see rule.require.justify-a-feat-classification.
__crew_guard_feat_level "$name" "$feat_why" || exit 2

# --size required: guarantees a behavior boots (rule.require.behaviors-over-adhoc)
if [[ -z "$size" ]]; then
  echo "error: --size required (nano|mini|medi|mega|giga)" >&2
  echo "       if unsure which size, ask the human before you dispatch" >&2
  exit 2
fi

case "$size" in
  nano|mini|medi|mega|giga) ;;
  *)
    echo "error: --size must be one of nano|mini|medi|mega|giga (got: $size)" >&2
    exit 2
    ;;
esac

# nano is the default; a larger size costs more (extra stones, extra review
# gates). gate it: a non-nano size MUST carry a --size-why justification, so the
# supervisor stops, articulates the cost, and surfaces it for a human ok before
# boot. see rule.require.confirm-behavior-size-above-nano.
if [[ "$size" != "nano" && -z "$size_why" ]]; then
  echo "✋ size '$size' is above nano (the default) — it costs more (extra" >&2
  echo "   stones + review gates). re-run with --size-why '<reason>' AND" >&2
  echo "   confirm the size with the human first." >&2
  echo "" >&2
  echo "   why: nano fits most single-concern tasks. only step up when the" >&2
  echo "   task truly needs it (blueprint, research, multi-phase)." >&2
  echo "   see rule.require.confirm-behavior-size-above-nano." >&2
  exit 2
fi

# --wish required: every behavior boots with a wish authored in THIS repo
if [[ -z "$wish" ]]; then
  echo "error: --wish required (path to wish file in this repo)" >&2
  echo "       e.g. src/stream/\$Q/\$date.dispatch.repo=\$repo.behavior=\$name.wish.md" >&2
  echo "       why: every tree boots a behavior, never adhoc work" >&2
  echo "            (rule.require.behaviors-over-adhoc)" >&2
  exit 2
fi

# derive an absolute wish path so the worktree (foreign repo) can read it
if [[ "$wish" = /* ]]; then
  wish_abs="$wish"
else
  wish_abs="$(pwd)/$wish"
fi

if [[ ! -f "$wish_abs" ]]; then
  echo "error: --wish file not found: $wish_abs" >&2
  echo "       author the wish in this repo first, then dispatch" >&2
  exit 2
fi

# which grove — '' is the canonical "this machine" host
host="$(__crew_grove_host "$grove")" || exit 2

# derive duct slug (must match git.tree.duct's derivation)
branch_slug="${name//\//.}"
treename="${into##*/}.${branch_slug}"
if [[ -z "$slug" ]]; then
  slug="$treename"
fi
slug_mechanic="${slug}/mechanic"

# 1. delegate worktree + duct setup to the generic skill
#    --defer-view: NO tabs yet. a kitty tab steals keyboard focus the instant it
#    opens, so a human mid-sentence has their in-flight keystrokes land in the
#    pane kitty just focused — and step 2's boot command then arrives PREFIXED
#    by them. observed live 2026-08-13: `the fix{ [ -f pnpm-lock.yaml ] && ...`
#    -> `zsh: parse error`, boot halted. the WORK lands first; the VIEW opens
#    last (step 3), where a stolen focus costs a nuisance and never a boot.
duct_args=(--into "$into" --name "$name" --grove "$grove" --defer-view)
if [[ "$slug" != "$treename" ]]; then
  duct_args+=(--slug "$slug")
fi
# forward the feat justification, so the delegate's OWN gate reads as satisfied.
# it is already satisfied here — but git.tree.duct gates independently (it is a
# birth path in its own right), and a delegate that re-asks a question its
# caller already answered would make this verb unusable for every feat.
if [[ -n "$feat_why" ]]; then
  duct_args+=(--feat-why "$feat_why")
fi
rhx git.tree.duct "${duct_args[@]}"

# 1b. put the WISH where the boot can read it
#
# .why a ship rather than a send: a duct is one addressable KEYBOARD, and
#      tmux send-keys lands every newline as a submit — so a multi-line
#      document cannot ride a duct at all. git.grove.send's --file arm exists
#      for exactly this, and it keeps content and command apart by
#      construction: the bytes ride stdin unparsed, so a wish that holds a
#      backtick stays a wish rather than a command.
#
# ⚠️ the `~` sits OUTSIDE the quotes on purpose. a shell expands a tilde only
#    when it is UNQUOTED, so `cat '~/x.md'` reads a file inside a directory
#    literally named `~`. measured live 2026-09-02, in git.grove.send, where
#    the byte-count check shared the same derivation and concurred with the
#    defect. the local arm has an absolute path and needs no such care.
if [[ -z "$host" ]]; then
  wish_src="'$wish_abs'"
else
  wish_remote=".rhx/wish/${treename}.wish.md"
  echo ""
  echo "├─ ship the wish to $host..."
  rhx git.grove.send "$host" --file "$wish_abs" --into "~/$wish_remote"
  wish_src="~/'$wish_remote'"
fi

# 2. boot the behavior in the mechanic duct
#    install (pnpm if lockfile, else npm) -> rhx upgrade
#    -> init.behavior with the wish piped in -> claude drives the route
behavior_name="${name##*/}"

# .why the install may run TWICE, with a build wedged between
#   a SELF-HOSTING repo cannot install from a fresh tree. `rhachet`'s own
#   package.json is the case in hand:
#     "prepare"         -> npm run prepare:husky && npm run prepare:rhachet
#     "prepare:rhachet" -> rhachet init --keys --hooks --roles ...
#   npm runs `prepare` as part of EVERY install, and `rhachet init` resolves to
#   the tree's own `bin/run.jit`, which requires `../dist/contract/cli/invoke`.
#   on a tree fresh off origin/main there is no `dist/` yet — it is built, never
#   committed — so the first install ALWAYS dies:
#     Error: Cannot find module '../dist/contract/cli/invoke'
#     ELIFECYCLE Command failed with exit code 1
#
#   measured 2026-08-30 on rhachet.beav.fix-test-tempdir-leak: the install died
#   there, so the `&&` chain aborted and `rhx upgrade`, `init.behavior` and
#   `claude` never ran. the crew came up with two ducts, two tabs, a worktree —
#   and no behavior. `git.tree.behavior` still printed `behavior on the way 🏗️`.
#
#   the sequence that breaks the cycle: install (expected to fail), BUILD, then
#   install again — by then `dist/` exists, so `prepare` resolves and completes.
#
#   the `||` makes this SELF-SELECTING rather than a repo-name check: an
#   ordinary repo installs clean on the first try and never reaches the build.
#   only a repo that cannot install from cold pays for the second pass. and a
#   genuine failure (a bad lockfile, no network, no build target) still fails
#   loud — the build fails too, the `&&` stops, and the chain aborts as before.
#
# .why the package manager is picked with an `if`, never with `&& ... || ...`
#   this read `[ -f pnpm-lock.yaml ] && pnpm install || npm install`, which is
#   the classic ternary trap: when the lockfile IS present and `pnpm install`
#   FAILS, the `||` fires and runs `npm install` in a pnpm repo. that is not a
#   fallback, it is a second, wrong package manager that writes a
#   package-lock.json and a flat node_modules over a pnpm store. the choice of
#   manager and the response to a failure are two decisions; one operator
#   cannot carry both.
boot_install="{ if [ -f pnpm-lock.yaml ]; then pm=pnpm; else pm=npm; fi; \$pm install || { \$pm run build && \$pm install; }; }"
boot_wish="cat $wish_src | rhx init.behavior --name '$behavior_name' --size '$size' --wish @stdin"
# .why --name mechanic: it makes the session ADDRESSABLE by role, so a crash is
#      recovered with `claude --resume mechanic` rather than `claude --continue`.
#      --continue is cwd-RECENCY, and a tree's mechanic and foreman share ONE
#      worktree, so they share one claude project dir — a foreman's --continue
#      can hand back the mechanic's conversation, and neither pane says so.
#      the name is the duct's own role (not a second word for it), per
#      rule.forbid.domain-term-synonyms: duct `$tree/mechanic`, session
#      `mechanic`, resume `--resume mechanic` — one vocabulary end to end.
#
# .why `rhx enroll claude` and not a bare `claude`: enroll launches the SAME
#      brain cli — every token it does not own passes through verbatim
#      (getBrainCliPassthroughArgs strips only --brain/--as/--roles/--no-socket/
#      --output/--reason) — and it additionally REGISTERS the clone on disk, so
#      the conversation becomes addressable after the fact:
#
#        rhx clone get @:mechanic --tail 40     # read the transcript
#        rhx clone say @:mechanic --what '…'    # reach it with no keyboard
#
#      a bare `claude` leaves `rhx clone list` empty, so the only window into a
#      clone is a duct.read — which reads the PANE: bounded by scrollback,
#      rendered as chrome rather than content, unable to tell a user turn from
#      an assistant turn, and gone the moment the duct stops. the transcript on
#      disk has none of those limits, and enroll is what addresses it.
#
# .why --as @:mechanic (the bare role, no tree segment): the clone registry is
#      per-repo — `<repoPath>/.agent/.actors` — and a worktree IS its own repo
#      path, so `@:mechanic` cannot collide with another tree's mechanic. the
#      slug is therefore the duct's own role, which keeps the one-vocabulary
#      chain above intact: duct `$tree/mechanic`, session `mechanic`, resume
#      `--resume mechanic`, clone `@:mechanic`.
#
# ⚠️ .a slug is bounded — `isSafeCloneSlug` caps it at 64 chars and allows only
#      `[a-z0-9][a-z0-9._-]*`. a role name clears both with room to spare; a
#      tree-scoped slug would NOT (`rhachet-roles-bhrain.beav.feat-dispute-or-
#      concede-review-budget.mechanic` is 72). that is the second reason the
#      segment is absent, and it is the one that would have failed loudly.
boot_drive="rhx enroll claude --as @:mechanic --name mechanic --permission-mode acceptEdits 'hi, please drive'"

echo ""
echo "├─ boot behavior (size=$size, wish=$wish_abs)..."
# --on takes a duct URI; the host is the grove's, empty for this box (so a
# local uri keeps its THREE slashes). --await lets the pane settle after
# git.tree.duct's own cd, so the busy-guard does not reject the boot.
rhx duct.send --on "$(__crew_duct_uri "$host" "$slug" mechanic)" --await 60 --what "$boot_install && rhx upgrade && $boot_wish && $boot_drive"

# 3. NOW open the view — every send has landed, so a stolen focus is harmless
#    crew.show reads LIVE tmux sessions, which tmux writes with underscores, so
#    it takes the underscore form (see term=duct._.choice.reason.md — a dotted
#    --tree can never match its own session).
#
#    best-effort, and deliberately so: the real work (worktree + ducts + booted
#    behavior) is already done above. a window that fails to open is a nuisance
#    a human re-opens in one call; it must never fail a boot that succeeded.
slug_tmux="${slug//./_}"
echo ""
if ! rhx git.crew.show --tree "$slug_tmux" --grove "$grove"; then
  echo "   ⚠️  view failed to open; the crew is at work regardless — re-open with:" >&2
  echo "      rhx git.crew.show --tree $slug_tmux --grove $grove" >&2
fi

echo ""
echo "🦫 dam fine — behavior on the way 🏗️"
echo "   ├─ mechanic: $slug_mechanic"
echo "   ├─ grove: $grove"
echo "   ├─ size: $size${size_why:+ (why: $size_why)}"
# the LEVEL, beside the size — the second justified axis, rendered the same way.
# a `feat` with its reason on screen is a claim a human can strike; a `feat`
# that renders as a bare branch name is one nobody ever reads.
echo "   ├─ level: $(__crew_branch_level "$name")${feat_why:+ (why: $feat_why)}"
echo "   └─ wish: $wish_abs"
