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
#   claude.statusline.probe.sh --exe <path>   # scan this binary (it is not run)
#   claude.statusline.probe.sh --help
#
# guarantee:
#   - read-only: scans /proc and the binary, writes naught
#   - a key the binary lacks reads 0, never an abort
#   - exit 0 = probed, 2 = no live claude seat on this grove
######################################################################
set -euo pipefail

EXE_GIVEN=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --skill|--repo|--role) shift 2 ;;
    --exe)
      [[ $# -ge 2 ]] || { echo "✋ ConstraintError: --exe needs a path" >&2; exit 2; }
      EXE_GIVEN="$2"; shift 2 ;;
    --help|-h)
      echo "usage:"
      echo "  rhx claude.statusline.probe               scan the live claude binary for the rate_limits field"
      echo "  rhx claude.statusline.probe --exe <path>  scan this binary, in place of a live seat's"
      exit 0 ;;
    *) echo "✋ ConstraintError: unknown argument '$1' (see --help)" >&2; exit 2 ;;
  esac
done

# .what = the binary of one live claude seat, or empty
get_seat_exe() {
  local p comm exe
  for p in /proc/[0-9]*; do
    comm=$(cat "$p/comm" 2>/dev/null || true)
    [[ "$comm" == "claude" || "$comm" == "claude.exe" ]] || continue
    exe=$(readlink -f "$p/exe" 2>/dev/null || true)
    [[ "$exe" == *claude* ]] && { echo "$exe"; return 0; }
  done
  return 0
}

# .what = how many times a key occurs in the binary; 0 where it never does
# .note = grep exits 1 on no match, which pipefail would turn into an abort
get_key_hits() {
  { grep -a -o "$1" "$2" || true; } | wc -l
}

if [[ -n "$EXE_GIVEN" ]]; then
  [[ -f "$EXE_GIVEN" && -r "$EXE_GIVEN" ]] || { echo "✋ ConstraintError: --exe is not a readable file: $EXE_GIVEN" >&2; exit 2; }
  exe="$EXE_GIVEN"
else
  exe=$(get_seat_exe)
fi
[[ -n "$exe" ]] || { echo "✋ ConstraintError: no live claude seat found" >&2; exit 2; }

# report the version and the hits per key
echo "binary: $exe"
[[ -n "$EXE_GIVEN" ]] || "$exe" --version 2>/dev/null | head -1 | sed 's/^/version: /' || true
for key in rate_limits five_hour seven_day used_percentage resets_at; do
  echo "$key: $(get_key_hits "$key" "$exe")"
done

# .what = one labeled section; `<label>: none` where the scan found no match
# .why  = a bare label over no body reads as a broken render
put_section() {
  local label="$1" body="$2"
  [[ -n "$body" ]] || { echo "$label: none"; return 0; }
  echo "$label:"
  echo "$body"
}

# show the code that builds the field, the plan tier field, and the source of the rate_limits object
put_section context "$({ grep -a -o '.\{120\}rate_limits.\{200\}' "$exe" || true; } | head -5)"
put_section plan "$({ grep -a -o '.\{300\}subscription type (.\{400\}' "$exe" || true; } | head -2)"
put_section source "$({ grep -a -o '.\{600\}(ht.five_hour||ht.seven_day' "$exe" || true; } | head -1)"
