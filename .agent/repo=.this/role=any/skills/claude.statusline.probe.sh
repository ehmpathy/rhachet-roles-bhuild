#!/usr/bin/env bash
######################################################################
# .what = probe whether this grove's claude code hands rate_limits to
#         the statusline, by a scan of the live claude binary
#
# .why  = the cap ledger (F8) reads each account's cap % from the
#         statusline input; some versions drop the field (#45133)
#
# usage:
#   claude.statusline.probe.sh
#
# guarantee:
#   - read-only: scans /proc and the binary, writes naught
######################################################################
set -euo pipefail

# find the binary of one live claude seat
exe=""
for p in /proc/[0-9]*; do
  comm=$(cat "$p/comm" 2>/dev/null || true)
  [[ "$comm" == "claude" || "$comm" == "claude.exe" ]] || continue
  exe=$(readlink -f "$p/exe" 2>/dev/null || true)
  [[ "$exe" == *claude* ]] && break
  exe=""
done
[[ -n "$exe" ]] || { echo "✋ ConstraintError: no live claude seat found" >&2; exit 2; }

# report the version and the hits per key
echo "binary: $exe"
"$exe" --version 2>/dev/null | head -1 | sed 's/^/version: /' || true
for key in rate_limits five_hour seven_day used_percentage resets_at; do
  n=$(grep -a -o "$key" "$exe" | wc -l)
  echo "$key: $n"
done

# show the code that builds the field, if any
echo "context:"
grep -a -o '.\{120\}rate_limits.\{200\}' "$exe" | head -5 || true

# show the plan tier field and the source of the rate_limits object
echo "plan:"
grep -a -o '.\{300\}subscription type (.\{400\}' "$exe" | head -2 || true
echo "source:"
grep -a -o '.\{600\}(ht.five_hour||ht.seven_day' "$exe" | head -1 || true