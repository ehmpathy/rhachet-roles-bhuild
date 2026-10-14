#!/bin/bash

# .what = block commit of files that embed a timestamp (T?HH:MM:SS{tz})
# .why  = timestamps in snapshots permadrift — they change every run, so the
#         snapshot can never be "correct" twice; mask them to keep it stable
# .how  = scan staged files (except .ts/.sh) for the pattern; halt with a
#         constraint error (exit 2) if any are found

# fail fast on errors and unbound vars (safe here: scan pipelines end in `head`
# so a no-match grep does not abort, and all vars are assigned before use)
set -eu

# the timestamp pattern: optional lead T, HH:MM:SS, optional timezone (Z, ±HH:MM, ±HHMM)
TIMESTAMP_PATTERN='T?[0-9][0-9]:[0-9][0-9]:[0-9][0-9](Z|[+-][0-9][0-9]:?[0-9][0-9])?'

# an iso-8601 DURATION is a fixed span, not an instant, so it cannot permadrift — it is a
# valid, stable value to assert on. a duration carries a lead `P` designator and a `T` with
# NO date part (PT12:30:00, P1DT02:15:30, P3Y6M4DT12:30:05), unlike a stamp
# (2026-08-08T14:30:00Z). strip durations before the timestamp scan, so a duration-only line
# falls through and a line with a real stamp still halts (the stamp survives the strip).
DURATION_PATTERN='P([0-9]+[YMWD])*T([0-9]+[HMS])*[0-9][0-9]:[0-9][0-9]:[0-9][0-9]'

# collect staged files (added/copied/modified); skip deletions
# note: quotepath=off keeps a non-ascii path raw, so `git show ":$file"` below can read it
#       (repo-local; declapract main lists the quoted form, which git show cannot find)
staged=$(git -c core.quotepath=off diff --cached --name-only --diff-filter=ACM)

# scan each staged file for a raw timestamp
# note: the here-doc feeds the loop in the current shell (no pipe subshell),
#       so `exit 2` halts the commit directly and a clean pass falls through
while IFS= read -r file; do
  # skip empty lines
  [ -n "$file" ] || continue

  # skip exempt code files (.ts and .sh legitimately carry time logic)
  # note: .eco/* is the prioritizer's plaintext data store, not a snapshot; its rows carry
  #       createdAt/updatedAt by design (repo-local addition; declapract main lacks it)
  case "$file" in
    *.ts | *.sh) continue ;;
    .eco/*) continue ;;
  esac

  # read the staged content; fail loud if git cannot read the staged blob
  # note: git's own stderr stays on stderr, so a git notice can never mix into the scanned
  #       content; it prints above the halt header (repo-local; declapract main captures 2>&1)
  if ! content=$(git show ":$file"); then
    # note: the class-qualified headers (here and below) are a repo-local addition; declapract main lacks them
    printf '💥 MalfunctionError: check.timestamps failed to read staged content for %s\n' "$file" >&2
    exit 1
  fi

  # halt if the staged content embeds a raw timestamp. strip iso durations first (sed is
  # line-by-line, so line numbers are preserved): a duration-only line loses its HH:MM:SS run
  # and falls through; a line that also holds a real stamp still matches (the stamp wins)
  match=$(printf '%s\n' "$content" | sed -E "s/$DURATION_PATTERN//g" | grep -nIE "$TIMESTAMP_PATTERN" | head -n 1)
  if [ -n "$match" ]; then
    # note: both halt branches print to stderr, and the words name every tracked file the scan
    #       covers, not only snapshots (repo-local; declapract main prints "in snapshots" to stdout)
    printf '✋ ConstraintError: timestamps are forbidden in tracked files. mask them to prevent permadrift\n' >&2
    # note: the halt names the fix and the rule, so a human need not hunt for either (repo-local)
    printf '   ├─ %s:%s\n' "$file" "$match" >&2
    printf '   ├─ fix: cut it to a datestamp (YYYY-MM-DD), or mask the time (THH:MM:SSZ); then stage again\n' >&2
    printf '   └─ why: .agent/repo=.this/role=any/briefs/rule.forbid.timestamps-in-tracked-files.md\n' >&2
    exit 2
  fi
done <<EOF
$staged
EOF
