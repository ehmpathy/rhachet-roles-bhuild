#!/bin/bash

# .what = block commit of files whose staged content holds a secret key shape
# .why  = a key committed once ships to every clone and fork, forever; a rotation is the
#         only repair. a key shape (a vendor prefix plus a long random tail) is cheap to
#         spot before the commit, and costly to chase after it
# .how  = scan each staged blob for known key shapes; halt with a constraint error
#         (exit 2) that names the file, the line, and the shape — never the key itself

# fail fast on errors and unbound vars (safe here: each grep's status is read by hand,
# so a no-match does not abort, and all vars are assigned before use)
set -eu

# the key shapes, one per line as `name|regex`. each regex starts at a word edge, so a
# vendor prefix inside a longer word (e.g. `disk-`) does not match. the first shape found
# names the halt, so a narrow prefix (`sk-ant-`) sits above the wide one it shares (`sk-`)
EDGE='(^|[^A-Za-z0-9_])'
SHAPES="aws access key id|${EDGE}(AKIA|ASIA)[0-9A-Z]{16}([^0-9A-Z]|\$)
private key block|-----BEGIN [A-Z ]*PRIVATE KEY-----
github token|${EDGE}(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,})
anthropic key|${EDGE}sk-ant-[A-Za-z0-9_-]{20,}
openai-style key|${EDGE}sk-(proj-)?[A-Za-z0-9_-]{20,}
xai key|${EDGE}xai-[A-Za-z0-9]{20,}
fireworks key|${EDGE}fw_[A-Za-z0-9]{20,}
slack token|${EDGE}xox[abposr]-[A-Za-z0-9-]{10,}
stripe secret key|${EDGE}(sk|rk)_live_[A-Za-z0-9]{16,}"

# collect staged files (added/copied/modified); skip deletions
# core.quotepath=off emits a non-ascii path raw, so `git show` below can read it
# fail loud if git cannot list them, never abort raw under `set -e`
if ! staged=$(git -c core.quotepath=off diff --cached --name-only --diff-filter=ACM); then
  printf '💥 MalfunctionError: check.secrets could not list the staged files\n' >&2
  printf '   └─ fix: run the commit inside a git repo whose index git can read\n' >&2
  exit 1
fi

# hold each staged blob as bytes in a temp file, so a NUL byte or a binary blob is scanned
# whole; a shell variable would drop every NUL. the file is removed on any exit
# repo-local: declapract's copy held the blob in a variable and passed binary blobs as clean
blob=$(mktemp)
trap 'rm -f "$blob"' EXIT

# scan each staged blob against each shape
# note: the here-docs feed the loops in the current shell (no pipe subshell),
#       so `exit 2` halts the commit directly and a clean pass falls through
while IFS= read -r file; do
  # skip empty lines
  [ -n "$file" ] || continue

  # read the staged blob; fail loud if git cannot read it
  if ! git show ":$file" >"$blob"; then
    printf '💥 MalfunctionError: check.secrets could not read the staged blob\n' >&2
    printf '   ├─ %s\n' "$file" >&2
    printf '   └─ fix: re-stage it (git add %s), then commit again\n' "$file" >&2
    exit 1
  fi

  # halt on the first shape found; print the line number only, so the key never echoes
  while IFS='|' read -r name regex; do
    [ -n "$name" ] || continue

    # read grep's own status: 0 = found, 1 = clean, 2+ = grep broke (a bad regex, say).
    # a broken grep must fail loud, never pass as clean (rule.forbid.failhide)
    # repo-local: declapract's copy read only the last command of a pipe, so it hid exit 2
    status=0
    # -a reads a binary blob as text, so a key past a NUL byte is still found
    matches=$(grep -naE -e "$regex" "$blob") || status=$?
    if [ "$status" -gt 1 ]; then
      printf '💥 MalfunctionError: check.secrets could not scan for a key shape\n' >&2
      printf '   ├─ shape: %s\n' "$name" >&2
      printf '   ├─ grep exit: %s\n' "$status" >&2
      printf '   └─ fix: repair the regex for this shape in .husky/check.secrets.sh\n' >&2
      exit 1
    fi
    line=$(printf '%s\n' "$matches" | head -n 1 | cut -d: -f1)
    if [ "$status" -eq 0 ]; then
      printf '✋ ConstraintError: a secret key shape is staged. remove it, and rotate the key if it ever left this machine\n' >&2
      printf '   ├─ shape: %s\n' "$name" >&2
      printf '   └─ %s:%s\n' "$file" "$line" >&2
      exit 2
    fi
  done <<SHAPES_EOF
$SHAPES
SHAPES_EOF
done <<EOF
$staged
EOF
