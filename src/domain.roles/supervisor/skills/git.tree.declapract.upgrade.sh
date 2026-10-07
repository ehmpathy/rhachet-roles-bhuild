#!/usr/bin/env bash
######################################################################
# .what = create worktree + ducts AND boot the declapract upgrade route
#
# .why  = the PEER of git.tree.behavior, for the one work that must NOT
#         boot a behavior.
#
#         `declapract.upgrade init` boots its OWN bound route — stones,
#         guards, hazard-detect, two reflection stones that feed defects
#         back to infrastructure. so a behavior on top would be a SECOND
#         route structure on one tree, and git.tree.behavior refuses a
#         `declapract` name outright for that reason.
#
#         ⚠️ but a refusal that names a path is not the same as a path.
#         `howto.dispatch-dependency-upgrades` prescribed TWO commands by
#         hand, and a hand-rolled dispatch skips every hazard the paved
#         verb already solved. this is that path, entooled.
#
# 🔴 .the four defects it cures, each measured in git.tree.behavior
#
#     1. THE TERNARY TRAP. the howto prescribes, verbatim:
#            { [ -f pnpm-lock.yaml ] && pnpm install || npm install; }
#        when the lockfile IS present and `pnpm install` FAILS, the `||`
#        fires and runs `npm install` in a pnpm repo — a second, wrong
#        package manager writing package-lock.json and a flat
#        node_modules over a pnpm store. the choice of manager and the
#        response to a failure are two decisions; one operator cannot
#        carry both. this uses an `if`.
#
#     2. THE SELF-HOSTING INSTALL. a repo whose `prepare` runs its own
#        cli cannot install from a cold tree — there is no dist/ yet. the
#        install dies, the `&&` chain aborts, and the crew comes up with
#        ducts, tabs, a worktree, and no route. measured 2026-08-30 on
#        rhachet. the cure is install -> build -> install, and it is
#        self-selecting: an ordinary repo installs clean and never
#        reaches the build.
#
#     3. THE FOCUS STEAL. a kitty tab steals the keyboard the instant it
#        opens, so a human mid-sentence has their in-flight keystrokes
#        land in the pane kitty just focused — and the boot command then
#        arrives PREFIXED by them. observed live 2026-08-13:
#            the fix{ [ -f pnpm-lock.yaml ] && ...   -> zsh: parse error
#        so the WORK lands first and the VIEW opens last (--defer-view).
#
#     4. THE UNADDRESSABLE CLONE. a bare `claude` leaves `rhx clone list`
#        empty, so the only window into the clone is a duct.read — which
#        reads the PANE: bounded by scrollback, unable to tell a user
#        turn from an assistant turn, and gone the moment the duct stops.
#        `rhx enroll claude` registers it, so the transcript on disk
#        becomes addressable (`rhx clone get @:mechanic --tail 40`).
#
# ⚠️ MEASURED 2026-09-18: a tree was sprouted for this work through
#    git.tree.behavior, felled minutes later, and re-sprouted by hand —
#    and the hand path carried defect 1 verbatim, because the brief
#    prescribes it. a brief cannot fix a command it recommends
#    (rule.always.entool-the-skills-you-touch).
#
# usage:
#   rhx git.tree.declapract.upgrade --into sandpine/svc-lessons
#   rhx git.tree.declapract.upgrade --into sandpine/svc-lessons --grove cloud://grove-sandpine-v20260901
#
# args:
#   --into   org/repo path (e.g., sandpine/svc-lessons)            [required]
#   --name   branch name  (default: beav/feat-declapract-upgrade)
#   --grove  local (default) | cloud://<groveslug>
#   --slug   duct session slug (optional, defaults to treename)
#
# .note on --name
#   it DEFAULTS, where git.tree.behavior requires. the branch name for
#   this work is a fleet convention already on record in three repos
#   (svc-reminders, sdk-weather, svc-lessons), so a caller who must
#   retype it each time is a caller who can get it wrong. override it
#   where a repo genuinely needs a second upgrade branch.
#
# .note on the ABSENT --wish and --size
#   a behavior needs a bounded scope, so it needs a wish; the upgrade
#   route IS its scope, and its stones are fixed. no scope is left for a
#   size to grade. see howto.dispatch-dependency-upgrades.
#
# .note on --feat-why
#   it is NOT an arg. `feat` is a claim, and for this one work the claim
#   is settled by fleet convention — the upgrade re-stamps the repo with
#   current declared practices, which adds cicd gates and test scaffolding
#   the repo cannot run today. so the reason is built in and rides into
#   the render, where a human can still veto it. see
#   rule.require.justify-a-feat-classification.
#
# guarantee:
#   - requires --into (fail-fast if absent)
#   - delegates worktree + duct setup to git.tree.duct, with --defer-view
#   - picks the package manager with an `if`, never a `&&`/`||` ternary
#   - survives a self-hosting repo (install -> build -> install)
#   - boots: install -> rhx upgrade -> rhx declapract.upgrade init
#     -> rhx enroll claude (an ADDRESSABLE clone)
#   - opens the view LAST, best-effort — a view that fails to open never
#     fails a boot that succeeded
#   - fail-fast on errors
######################################################################

set -euo pipefail

# crewwork carries the grove vocabulary (__crew_grove_host, __crew_duct_uri)
# and loads ductwork + termwork itself
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/crewwork.sh"

# parse args
into=""
name="beav/feat-declapract-upgrade"
slug=""
grove="local"

# the claim is settled by fleet convention, so it is stated here rather than
# asked of every caller. it still renders, so it is still vetoable.
# ⚠️ it names no repo. this text lands in the consumer's PR body, so a cited
#    precedent from one org's fleet would read there as a false provenance.
feat_why='declapract upgrade — the fleet convention for this upgrade. it re-stamps the repo with current declared practices, which adds cicd gates and test scaffolding the repo cannot run today: a capability at the repo surface'

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
    --repo|--role|--skill)
      # reserved by rhachet, ignore
      shift 2
      ;;
    --help|-h)
      # bounded by the BANNER that shuts the header, never by a line number —
      # a hardcoded range silently truncates the moment the header grows.
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
  # an absent arg is a CONSTRAINT, same as the unknown-arg arm above
  echo "error: --into required (e.g. myorg/svc-foo)" >&2
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
#    --defer-view: NO tabs yet — see defect 3 in the header. the WORK lands
#    first; the VIEW opens last, where a stolen focus costs a nuisance and
#    never a boot.
duct_args=(--into "$into" --name "$name" --grove "$grove" --defer-view --feat-why "$feat_why")
if [[ "$slug" != "$treename" ]]; then
  duct_args+=(--slug "$slug")
fi
rhx git.tree.duct "${duct_args[@]}"

# 2. boot the UPGRADE ROUTE in the mechanic duct
#
# ⚠️ every clause below is lifted from git.tree.behavior's boot, which paid for
#    each one with a measured failure. the hand-rolled path in the howto has
#    none of them. see the header.
boot_install="{ if [ -f pnpm-lock.yaml ]; then pm=pnpm; else pm=npm; fi; \$pm install || { \$pm run build && \$pm install; }; }"

# .why `rhx upgrade` before the route: the route's stones and the
#      declapract.upgrade skill itself both ship in the roles. a stale tool
#      runs a stale route.
boot_route="rhx declapract.upgrade init"

# .why enroll rather than a bare claude, and --name/--as mechanic: see defect 4
#      in the header. the slug is the duct's own role, which keeps one
#      vocabulary end to end — duct `$tree/mechanic`, session `mechanic`,
#      resume `--resume mechanic`, clone `@:mechanic`.
boot_drive="rhx enroll claude --as @:mechanic --name mechanic --permission-mode acceptEdits 'hi, please drive'"

echo ""
echo "├─ boot the declapract upgrade route..."
# --await lets the pane settle after git.tree.duct's own cd, so the busy-guard
# does not reject the boot.
rhx duct.send --on "$(__crew_duct_uri "$host" "$slug" mechanic)" --await 60 --what "$boot_install && rhx upgrade && $boot_route && $boot_drive"

# 3. NOW open the view — every send has landed, so a stolen focus is harmless.
#    crew.show reads LIVE tmux sessions, which tmux writes with underscores, so
#    it takes the underscore form.
#
#    best-effort, and deliberately so: the real work is already done above.
slug_tmux="${slug//./_}"
echo ""
if ! rhx git.crew.show --tree "$slug_tmux" --grove "$grove"; then
  echo "   ⚠️  view failed to open; the crew is at work regardless — re-open with:" >&2
  echo "      rhx git.crew.show --tree $slug_tmux --grove $grove" >&2
fi

echo ""
echo "🦫 dam fine — upgrade route on the way 🏗️"
echo "   ├─ mechanic: $slug_mechanic"
echo "   ├─ grove: $grove"
echo "   ├─ route: declapract.upgrade (its own stones + guards — no behavior)"
echo "   ├─ level: $(__crew_branch_level "$name") (why: $feat_why)"
echo "   └─ next: watch it with"
echo "         rhx git.crew.read --tree $slug --who mechanic"
