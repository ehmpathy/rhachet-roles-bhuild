#!/usr/bin/env bash
######################################################################
# .what = create worktree + ducts AND boot a clone onto a stated goal
#
# .why  = the middle rung of a three-verb ladder. each verb adds one
#         layer on top of the one before it:
#
#           git.tree.duct         worktree + ducts + tabs — no clone at all
#           git.tree.achievement  + a clone, driven by a GOAL  ← this
#           git.tree.behavior     + a bound behavior, stones + guards
#
#         the gap this closes: a behaviorless sprout came up with a live
#         shell in every seat and no clone in any of them, so a human had
#         to open the mechanic and type the ask by hand. that hand-typed
#         ask is the goal, and a goal is a thing a flag can carry.
#
#         ⚠️ the CLONE lands in the mechanic duct alone. every other role
#         (foreman, reflector) comes up as a bare shell on the same
#         worktree — a seat a human or supervisor takes without a second
#         conversation to keep alive.
#
# usage:
#   rhx git.tree.achievement \
#     --into sandpine/infrastructure \
#     --name beav/feat-camp-git-backup-bucket \
#     --goal 'provision the s3 bucket + iam role that rhx git.grove.backup writes to'
#
#   printf '%s' "$long_goal" | rhx git.tree.achievement \
#     --into ehmpathy/rhachet --name beav/fix-x --goal @stdin
#
# args:
#   --into   org/repo path (e.g., ehmpathy/sdk-config)        [required]
#   --name   branch name to create (e.g., beav/fix-cache)     [required]
#   --feat-why  the capability a `feat-` name ADDS            [required if feat]
#   --goal   what the clone is to accomplish, or @stdin       [required]
#   --grove  local (default) | cloud://<groveslug>
#   --slug   duct session slug (optional, defaults to treename)
#
# .note on --feat-why
#   `fix` is the default half of the branch convention; `feat` is a CLAIM —
#   that this adds a capability a human can ask for which did not exist. a
#   `feat-` name fails fast (exit 2) unless it carries --feat-why '<reason>'.
#   see rule.require.justify-a-feat-classification.
#
# .note on --goal vs --wish
#   a WISH is a document that boots a bound route: stones, guards, review
#   ladders, a yield. a GOAL is one statement of the outcome, handed to a
#   clone with no route beneath it.
#
#   ⇒ so reach for this verb when the work does NOT warrant a route, and
#     for git.tree.behavior when it does. an ad-hoc dispatch that SHOULD
#     have carried a behavior is a blocker
#     (rule.require.behaviors-over-adhoc) — this verb is not a way around
#     that rule, it is the honest name for the case the rule exempts.
#
# .note on the upgrade path
#   the `achiever` role owns a route of its own upstream. once it lands,
#   the boot line below gains one stage:
#
#     cat $goal | rhx achievement init --goal @stdin && claude ...
#
#   the goal already arrives as a FILE rather than a keystroke, precisely
#   so that stage drops in with no change to this verb's contract.
#
# guarantee:
#   - requires --goal (fail-fast if absent), so a clone is never booted
#     into a tree with no work to do
#   - delegates worktree + duct setup to git.tree.duct
#   - the goal rides as a file, never as keystrokes — a duct is one
#     keyboard, and tmux send-keys submits on every newline
#   - boots: install -> rhx upgrade -> claude, driven by the goal
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
goal=""
feat_why=""
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
    --goal)
      goal="$2"
      shift 2
      ;;
    --feat-why)
      feat_why="$2"
      shift 2
      ;;
    --repo|--role|--skill)
      # reserved by rhachet, ignore
      shift 2
      ;;
    --help|-h)
      # bounded by the banner that shuts the header, never a line number — the
      # same drift a hardcoded `3,65p` suffers the moment the header grows.
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

# is a `feat-` name earned? gated here for the same reason it is gated in
# git.tree.behavior and git.tree.duct: this is a birth path in its own right,
# and a gate on two of three paths is a gate with a door beside it.
__crew_guard_feat_level "$name" "$feat_why" || exit 2

# --goal required: a clone booted with no goal is an ad-hoc dispatch with extra
# steps. it would come up, greet the pane, and wait — which is exactly the state
# git.tree.duct already gives you, for less.
if [[ -z "$goal" ]]; then
  echo "error: --goal required (what the clone is to accomplish)" >&2
  echo "       pass a sentence, or '@stdin' for a longer statement" >&2
  echo "       if the work warrants a ROUTE, use git.tree.behavior --wish" >&2
  exit 1
fi

# @stdin: read the goal off the pipe, so a multi-paragraph goal needs no quoting
if [[ "$goal" == "@stdin" ]]; then
  goal="$(cat)"
fi

if [[ -z "${goal//[[:space:]]/}" ]]; then
  echo "error: --goal is empty" >&2
  exit 1
fi

# land the goal in a file HERE first. it travels as bytes from here on:
# a duct is one keyboard and tmux send-keys submits on every newline, so a
# multi-line goal cannot ride a duct at all.
goal_local="$(mktemp -t rhx-goal.XXXXXX.md)"
printf '%s\n' "$goal" > "$goal_local"

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
#    by them. the WORK lands first; the VIEW opens last (step 3), where a stolen
#    focus costs a nuisance and never a boot.
duct_args=(--into "$into" --name "$name" --grove "$grove" --defer-view)
if [[ "$slug" != "$treename" ]]; then
  duct_args+=(--slug "$slug")
fi
# forward the feat justification: the delegate gates independently, and a
# delegate that re-asks a question its caller already answered would make this
# verb unusable for every feat.
if [[ -n "$feat_why" ]]; then
  duct_args+=(--feat-why "$feat_why")
fi
rhx git.tree.duct "${duct_args[@]}"

# 1b. put the GOAL where the boot can read it
#
# ⚠️ the `~` sits OUTSIDE the quotes on purpose. a shell expands a tilde only
#    when it is UNQUOTED, so `cat '~/x.md'` reads a file inside a directory
#    literally named `~`. the local arm has an absolute path and needs no care.
if [[ -z "$host" ]]; then
  goal_src="'$goal_local'"
else
  goal_remote=".rhx/goal/${treename}.goal.md"
  echo ""
  echo "├─ ship the goal to $host..."
  rhx git.grove.send "$host" --file "$goal_local" --into "~/$goal_remote"
  goal_src="~/'$goal_remote'"
fi

# 2. boot the clone in the mechanic duct
#
# .why the install may run TWICE, with a build wedged between
#   a SELF-HOSTING repo cannot install from a fresh tree — `rhachet`'s own
#   `prepare` resolves to the tree's own `bin/run.jit`, which requires a
#   `dist/` that is built and never committed. so the first install always
#   dies on a tree fresh off origin/main. the sequence that breaks the cycle:
#   install (expected to fail), BUILD, then install again.
#
#   the `||` makes this SELF-SELECTING rather than a repo-name check: an
#   ordinary repo installs clean on the first try and never reaches the build.
#   a genuine failure still fails loud — the build fails too, the `&&` stops.
#
# .why the package manager is picked with an `if`, never with `&& ... || ...`
#   the ternary trap: when the lockfile IS present and `pnpm install` FAILS,
#   a `||` would fire `npm install` in a pnpm repo — a second, wrong package
#   manager over a pnpm store. the choice of manager and the response to a
#   failure are two decisions; one operator cannot carry both.
boot_install="{ if [ -f pnpm-lock.yaml ]; then pm=pnpm; else pm=npm; fi; \$pm install || { \$pm run build && \$pm install; }; }"

# .why --name mechanic: it makes the session ADDRESSABLE by role, so a crash is
#      recovered with `claude --resume mechanic` rather than `claude --continue`.
#      --continue is cwd-RECENCY, and a tree's roles share ONE worktree, so they
#      share one claude project dir — a foreman's --continue can hand back the
#      mechanic's conversation, and neither pane says so.
#
# .why `"$(cat ...)"` rather than a pipe: claude takes its opener as an ARGUMENT
#      when one is given, and a pipe would instead make the goal a stdin stream
#      the session consumes and closes — which ends the conversation the moment
#      the goal is read. the command substitution keeps the pane interactive.
#
# ⚠️ this line is the seam the `achiever` route drops into. when
#    `rhx achievement init` lands, it goes here, ahead of the claude call, and
#    reads the very same file.
boot_drive="claude --name mechanic --permission-mode acceptEdits \"\$(cat $goal_src)\""

echo ""
echo "├─ boot achievement..."
# --on takes a duct URI; the host is the grove's, empty for this box (so a
# local uri keeps its THREE slashes). --await lets the pane settle after
# git.tree.duct's own cd, so the busy-guard does not reject the boot.
rhx duct.send --on "$(__crew_duct_uri "$host" "$slug" mechanic)" --await 60 --what "$boot_install && rhx upgrade && $boot_drive"

# 3. NOW open the view — every send has landed, so a stolen focus is harmless
#    crew.show reads LIVE tmux sessions, which tmux writes with underscores, so
#    it takes the underscore form (see term=duct._.choice.reason.md — a dotted
#    --tree can never match its own session).
#
#    best-effort, and deliberately so: the real work (worktree + ducts + booted
#    clone) is already done above. a window that fails to open is a nuisance a
#    human re-opens in one call; it must never fail a boot that succeeded.
slug_tmux="${slug//./_}"
echo ""
if ! rhx git.crew.show --tree "$slug_tmux" --grove "$grove"; then
  echo "   ⚠️  view failed to open; the crew is at work regardless — re-open with:" >&2
  echo "      rhx git.crew.show --tree $slug_tmux --grove $grove" >&2
fi

goal_head="$(printf '%s' "$goal" | head -c 72)"
echo ""
echo "🦫 dam fine — achievement on the way 🏗️"
echo "   ├─ mechanic: $slug_mechanic"
echo "   ├─ grove: $grove"
echo "   └─ goal: $goal_head"
