#!/usr/bin/env bash
######################################################################
# .what = patch a dependency in place via pnpm patch, from a repo-local edit dir
#
# .why  = a defect in a dependency is fixed at source here, with a clamp,
#         while the upstream fix is dispatched; raw `pnpm patch` is not paved
#         - the edit dir stays inside the repo, under .temp/pnpm.patch/
#         - the commit step writes patches/ and the pnpm patchedDependencies entry
#
# usage:
#   pnpm.patch.sh begin --package test-fns@1.15.7     # open the edit dir
#   pnpm.patch.sh commit --package test-fns@1.15.7    # write the patch from it
#   pnpm.patch.sh sync                                # install against the extant lock
#   pnpm.patch.sh sync --frozen                       # prove the lock installs as ci does
#
# guarantee:
#   - --package must be an exact name@version
#   - the edit dir is .temp/pnpm.patch/<name@version>, inside the repo
#   - begin refuses if the edit dir already exists (commit or remove it first)
#   - fail-fast on errors
######################################################################
set -euo pipefail

SUBCOMMAND=""
PACKAGE=""
FROZEN="false"

while [[ $# -gt 0 ]]; do
  case $1 in
    # rhachet passes these - ignore them
    --skill|--repo|--role)
      shift 2
      ;;
    --package)
      PACKAGE="$2"
      shift 2
      ;;
    --frozen)
      FROZEN="true"
      shift
      ;;
    --help|-h)
      sed -n '2,19p' "$0"
      exit 0
      ;;
    begin|commit|sync)
      SUBCOMMAND="$1"
      shift
      ;;
    *)
      echo "✋ ConstraintError: unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

# sync needs no package: install against the extant lock, which keeps every
# resolution the lock already holds and adds only what package.json now asks
if [[ "$SUBCOMMAND" == "sync" ]]; then
  # --frozen proves the lock already matches package.json + patches, as ci installs it
  if [[ "$FROZEN" == "true" ]]; then
    pnpm install --frozen-lockfile
    echo "🐢 the lock installs frozen, as ci installs it"
    exit 0
  fi
  pnpm install
  echo "🐢 synced against the extant lock"
  exit 0
fi

# reject an absent or inexact package
if [[ ! "$PACKAGE" =~ ^(@[a-z0-9._-]+/)?[a-z0-9._-]+@[0-9]+\.[0-9]+\.[0-9]+([-.+][a-z0-9.-]+)?$ ]]; then
  echo "✋ ConstraintError: --package must be an exact name@version, got: '${PACKAGE}'" >&2
  exit 2
fi

# compute the repo-local edit dir
GIT_ROOT="$(git rev-parse --show-toplevel)"
EDIT_DIR="${GIT_ROOT}/.temp/pnpm.patch/${PACKAGE}"

case "$SUBCOMMAND" in
  begin)
    # refuse to clobber an open edit dir
    if [[ -e "$EDIT_DIR" ]]; then
      echo "✋ ConstraintError: edit dir already open: ${EDIT_DIR}" >&2
      echo "   fix: commit it (pnpm.patch.sh commit --package ${PACKAGE}) or remove it" >&2
      exit 2
    fi
    pnpm patch "$PACKAGE" --edit-dir "$EDIT_DIR"
    echo "🐢 edit dir open: ${EDIT_DIR}"
    echo "   then: pnpm.patch.sh commit --package ${PACKAGE}"
    ;;
  commit)
    # refuse a commit with no edit dir
    if [[ ! -d "$EDIT_DIR" ]]; then
      echo "✋ ConstraintError: no edit dir at ${EDIT_DIR}" >&2
      echo "   fix: pnpm.patch.sh begin --package ${PACKAGE}" >&2
      exit 2
    fi
    pnpm patch-commit "$EDIT_DIR"

    # pnpm 10 records the patch in pnpm-workspace.yaml, and creates that file if
    # absent. in a repo that is no workspace, the file's mere presence flips peer
    # resolution to the workspace root (a peer silently downgraded). so when the
    # file holds only patchedDependencies, move them into package.json and drop it
    WORKSPACE_FILE="${GIT_ROOT}/pnpm-workspace.yaml"
    if [[ -f "$WORKSPACE_FILE" ]] && ! grep -qvE '^(patchedDependencies:|  [^ ].*: .*)?$' "$WORKSPACE_FILE"; then
      node -e '
        const fs = require("node:fs");
        const [pathWorkspace, pathPackage] = process.argv.slice(1);
        const patched = Object.fromEntries(
          fs.readFileSync(pathWorkspace, "utf8").split("\n")
            .map((line) => line.match(/^  ([^ ].*): (.*)$/))
            .filter(Boolean)
            .map(([, name, path]) => [name, path]),
        );
        const pkg = JSON.parse(fs.readFileSync(pathPackage, "utf8"));
        pkg.pnpm = { ...pkg.pnpm, patchedDependencies: { ...pkg.pnpm?.patchedDependencies, ...patched } };
        fs.writeFileSync(pathPackage, JSON.stringify(pkg, null, 2) + "\n");
      ' "$WORKSPACE_FILE" "${GIT_ROOT}/package.json"
      rm "$WORKSPACE_FILE"
      pnpm install
      echo "🐢 moved patchedDependencies from pnpm-workspace.yaml into package.json (no workspace)"
    fi

    echo "🐢 patch written for ${PACKAGE}"
    ;;
  *)
    echo "✋ ConstraintError: subcommand must be begin or commit, got: '${SUBCOMMAND}'" >&2
    exit 2
    ;;
esac
