#!/usr/bin/env bash
######################################################################
# .what = walk the radio promise gate by hand, in a scratch consumer
#         repo, against a stub gh, and print each command and its output
#
# .why  = a route's verification owes a real runthrough of its critical
#         paths, pasted, never a snapshot excerpt; this repo's skills need
#         a consumer repo, an isolated home, and a gh that can read PUBLIC
#         - the scratch repo is a fresh dir under .temp/, removed at the end
#         - the build in dist/ is what runs: run `npm run build` first
#
# usage:
#   radio.walk.promise.sh            # walk paths A–H (the playtest: 5.5.playtest.yield.md)
#   radio.walk.promise.sh --help
#
# paths:
#   A a text push into a public repo: nudge, then the printed command sends
#   B a text push into a private repo: sent, no nudge
#   C a public push held at a shut gate: plain drain holds it, drain --promise sends
#   D a status-only update into a public repo: sent, no visibility read
#   E a wrong --promise value: refused, no request
#   F a repo whose visibility cannot be read: nudged as public
#   G a held public record scrubbed via queue set, then vouched; another dropped
#   H both --help outputs name --promise
#   I an internal repo, and a private push with a stray --promise: both sent, no nudge
#   J an --exid text edit into a public repo: nudged, then the promised re-run edits once
#   K os.fileops into the public repo, no promise: no gate, no gh call
#   L a promise rides on a held record: a plain drain sends it
#   M a private push flushes a backlog that holds an unvouched public record: the public one waits
#   N a rate limit on the visibility read: the drain halts, the record stays queued, naught sent
#   O a nudged push re-run with a scrubbed title: sent, and no stale record lingers
#   P a body piped via --description @stdin: the nudge says re-pipe; the re-piped run sends the body
#   Q a body with a quote, dollar, backtick, newline: the printed line, run as typed, sends it intact
#   R a rejected token on the read: the nudge offers --auth as-human first
#   S a bare --promise (push and drain), and an empty body: each refused, no request
#
# guarantee:
#   - no real github call: gh is a stub, first on PATH, that logs each call
#   - no write into this repo: the records land in the scratch repo
#   - each step prints `$ <command>`, its output, and `> exit <code>`
######################################################################
set -uo pipefail

while [[ $# -gt 0 ]]; do
  case $1 in
    # rhachet passes these - ignore them
    --skill|--repo|--role)
      shift 2
      ;;
    --case10)
      CASE10=1
      shift
      ;;
    --help|-h)
      sed -n '2,41p' "$0"
      exit 0
      ;;
    *)
      echo "✋ ConstraintError: unknown argument: $1 (see --help)" >&2
      exit 2
      ;;
  esac
done

REPO_ROOT="$(git rev-parse --show-toplevel)"
SKILLS="$REPO_ROOT/src/domain.roles/dispatcher/skills"
if [[ ! -f "$REPO_ROOT/dist/index.js" ]]; then
  echo "✋ ConstraintError: dist/ is absent; run \`npm run build\` first" >&2
  exit 2
fi

# scratch consumer repo: git, the package resolvable, an isolated home with the sandpine gate open
mkdir -p "$REPO_ROOT/.temp"
SCRATCH="$(mktemp -d "$REPO_ROOT/.temp/radio-walk-promise.XXXX")"
trap 'rm -rf "$SCRATCH"' EXIT
STUB="$SCRATCH/.stub-gh"
METER="$SCRATCH/.home/.rhachet/storage/repo=bhuild/role=dispatcher/.meter"
mkdir -p "$SCRATCH/node_modules" "$METER" "$STUB"
git -C "$SCRATCH" init -q -b feat/walk
git -C "$SCRATCH" -c user.email=bert@example.com -c user.name=bert commit -q --allow-empty -m init
ln -s "$REPO_ROOT" "$SCRATCH/node_modules/rhachet-roles-bhuild"
echo '{"orgs":{"sandpine":"allowed"}}' > "$METER/radio.uses.org.jsonc"

# stub gh: answers `repo view` per repo from a mode file, logs every call
cat > "$STUB/gh" <<'STUB_GH'
#!/usr/bin/env bash
verb="$1 $2"
if [ "$verb" = "repo view" ]; then
  repo="$(printf '%s' "$3" | tr '/' '_')"
else
  repo="$(printf '%s' "$*" | grep -oE -- '--repo [^ ]+' | cut -d' ' -f2 | tr '/' '_')"
fi
echo "$1 $2 $repo" >> "$STUB_GH_DIR/calls.log"
n="$(wc -l < "$STUB_GH_DIR/calls.log" | tr -d ' ')"
prev=""
for arg in "$@"; do
  if [ "$prev" = "--body-file" ]; then mkdir -p "$STUB_GH_DIR/bodies"; cp "$arg" "$STUB_GH_DIR/bodies/$n"; fi
  prev="$arg"
done
case "$verb" in
  "api user") echo "stubbot" ;;
  "repo view")
    mode="PRIVATE"
    if [ -f "$STUB_GH_DIR/visibility.$repo" ]; then mode="$(cat "$STUB_GH_DIR/visibility.$repo")"; fi
    if [ "$mode" = "garbage" ]; then echo "not json at all"; exit 0; fi
    if [ "$mode" = "unauthorized" ]; then echo "HTTP 401: Bad credentials (https://api.github.com/graphql)" >&2; exit 1; fi
    if [ "$mode" = "ratelimit" ]; then echo "HTTP 403: API rate limit exceeded for user ID 1" >&2; exit 1; fi
    echo "{\"visibility\":\"$mode\"}" ;;
  "issue view")
    echo "{\"number\":$3,\"title\":\"🎙️ task - list wetsuit sizes\",\"body\":\"**description**\\\\n\\\\nadd the size chart\",\"state\":\"OPEN\",\"assignees\":[],\"createdAt\":\"2026-10-20\",\"author\":{\"login\":\"stubbot\"}}" ;;
  "issue list") echo "[]" ;;
  "issue create") echo "https://github.com/stub/stub/issues/$((700 + n))" ;;
  "issue edit"|"issue close") echo "https://github.com/stub/stub/issues/1" ;;
  *) echo "stub gh: unexpected call: $*" >&2; exit 1 ;;
esac
STUB_GH
chmod +x "$STUB/gh"
: > "$STUB/calls.log"
echo PUBLIC > "$STUB/visibility.sandpine_spot-forecast-widget"
echo PRIVATE > "$STUB/visibility.sandpine_svc-lessons"
echo garbage > "$STUB/visibility.sandpine_tide-feed"
echo INTERNAL > "$STUB/visibility.sandpine_infrastructure"
echo ratelimit > "$STUB/visibility.sandpine_swell-feed"

export HOME="$SCRATCH/.home" STUB_GH_DIR="$STUB" PATH="$STUB:$PATH" RADIO_WALK_TOKEN=stub-token
AUTH='as-robot:env(RADIO_WALK_TOKEN)'
cd "$SCRATCH" || exit 1

# print a step as a human would type it, run it, print its exit code
step() {
  local skill="$1"
  shift
  echo
  printf '$ rhx %s' "$skill"
  printf ' %q' "$@"
  printf '\n'
  # stderr joins stdout, so a refusal shows in place, in order
  bash "$SKILLS/$skill.sh" "$@" 2>&1
  echo "> exit $?"
}
calls() { echo "--- gh calls so far:"; sed 's/^/    /' "$STUB/calls.log"; }

# --case10: the via-gh-issues [case10] pair, as ci runs it — default auth (the keyrack key, here
# granted from the env), the demo repo read PUBLIC; prints the bytes its masked snap must hold
if [[ "${CASE10:-}" == "1" ]]; then
  echo '{"orgs":{"ehmpathy":"allowed"}}' > "$METER/radio.uses.org.jsonc"
  echo PUBLIC > "$STUB/visibility.ehmpathy_rhachet-roles-bhuild-demo"
  export EHMPATH_BEAVER_GITHUB_TOKEN=ghp_radioWalkStubToken0000000000000000
  step radio.task.push --via gh.issues --into ehmpathy/rhachet-roles-bhuild-demo --title "public nudge test 1700000000000" --description "acceptance test of the promise gate on a real public repo"
  step radio.task.push --via gh.issues --into ehmpathy/rhachet-roles-bhuild-demo --title "public nudge test 1700000000000" --description "acceptance test of the promise gate on a real public repo" --promise task-to-public-repo-is-anonymized
  calls
  exit 0
fi

echo "=== path A: a text push into a public repo, then the printed command ==="
step radio.task.push --via gh.issues --into sandpine/spot-forecast-widget --title "add a swell height legend" --description "show the legend under the chart" --auth "$AUTH"
calls
step radio.task.push --via gh.issues --into sandpine/spot-forecast-widget --title "add a swell height legend" --description "show the legend under the chart" --auth "$AUTH" --promise task-to-public-repo-is-anonymized
calls

echo
echo "=== path B: a text push into a private repo, unchanged ==="
step radio.task.push --via gh.issues --into sandpine/svc-lessons --title "remind surfers of their lesson" --description "a text the night before" --auth "$AUTH"

echo
echo "=== path C: a public push held at a shut gate, then a drain, then a vouch ==="
echo '{"orgs":{"sandpine":"blocked"}}' > "$METER/radio.uses.org.jsonc"
step radio.task.push --via gh.issues --into sandpine/spot-forecast-widget --title "list wetsuit sizes" --description "add the size chart to the rentals page" --auth "$AUTH"
echo '{"orgs":{"sandpine":"allowed"}}' > "$METER/radio.uses.org.jsonc"
step radio.task.queue drain
step radio.task.queue get
step radio.task.queue drain --promise task-to-public-repo-is-anonymized
calls

echo
echo "=== path D: a status-only update into a public repo ==="
: > "$STUB/calls.log"
step radio.task.push --via gh.issues --into sandpine/spot-forecast-widget --exid 5 --status CLAIMED --auth "$AUTH"
calls

echo
echo "=== path E: a wrong --promise value ==="
: > "$STUB/calls.log"
step radio.task.push --via gh.issues --into sandpine/spot-forecast-widget --title "add a tide table" --description "under the chart" --auth "$AUTH" --promise yes
calls

echo
echo "=== path F: a repo whose visibility cannot be read ==="
step radio.task.push --via gh.issues --into sandpine/tide-feed --title "audit the tide feed" --description "check the feed each hour" --auth "$AUTH"

echo
echo "=== path G: two held public records: one scrubbed then vouched, one dropped ==="
echo '{"orgs":{"sandpine":"blocked"}}' > "$METER/radio.uses.org.jsonc"
step radio.task.push --via gh.issues --into sandpine/spot-forecast-widget --title "coach notes" --description "SECRET-DETAIL in the raw note" --auth "$AUTH"
step radio.task.push --via gh.issues --into sandpine/spot-forecast-widget --title "wetsuit count" --description "SECRET-DETAIL in the count" --auth "$AUTH"
echo '{"orgs":{"sandpine":"allowed"}}' > "$METER/radio.uses.org.jsonc"
KEY_SCRUB="$(grep -l '"title": "coach notes"' .behavior/.radio/record.*.json | sed -E 's/.*record\.([a-f0-9]+)\.json/\1/')"
KEY_DROP="$(grep -l '"title": "wetsuit count"' .behavior/.radio/record.*.json | sed -E 's/.*record\.([a-f0-9]+)\.json/\1/')"
printf 'a scrubbed coach note\n' | step radio.task.queue set --uuid "$KEY_SCRUB" --description @stdin
step radio.task.queue del --uuid "$KEY_DROP" --why "text not safe to publish"
rm -rf "$STUB/bodies"
: > "$STUB/calls.log"
step radio.task.queue drain --promise task-to-public-repo-is-anonymized
calls
echo "--- the bodies this drain sent:"
cat "$STUB"/bodies/* 2>/dev/null | sed 's/^/    /'
echo
echo "--- any sent body holds SECRET-DETAIL? (expect: no)"
if grep -rq SECRET-DETAIL "$STUB/bodies" 2>/dev/null; then echo "    yes"; else echo "    no"; fi

echo
echo "=== path H: both --help outputs name --promise ==="
step radio.task.push --help
step radio.task.queue --help

echo
echo "=== path I: an internal repo, and a private push with a stray --promise ==="
: > "$STUB/calls.log"
step radio.task.push --via gh.issues --into sandpine/infrastructure --title "rotate the board-rental keys" --description "rotate them each quarter" --auth "$AUTH"
step radio.task.push --via gh.issues --into sandpine/svc-lessons --title "lesson waitlist" --description "open a waitlist when full" --auth "$AUTH" --promise task-to-public-repo-is-anonymized
calls

echo
echo "=== path J: an --exid text edit into a public repo ==="
: > "$STUB/calls.log"
step radio.task.push --via gh.issues --into sandpine/spot-forecast-widget --exid 41 --title "lesson reminder retry" --description "retry once, then report" --auth "$AUTH"
calls
step radio.task.push --via gh.issues --into sandpine/spot-forecast-widget --exid 41 --title "lesson reminder retry" --description "retry once, then report" --auth "$AUTH" --promise task-to-public-repo-is-anonymized
calls

echo
echo "=== path K: os.fileops into the public repo, no promise ==="
: > "$STUB/calls.log"
step radio.task.push --via os.fileops --into sandpine/spot-forecast-widget --title "board wax order" --description "order the wax"
calls

echo
echo "=== path L: a promise rides on a held record ==="
: > "$STUB/calls.log"
echo '{"orgs":{"sandpine":"blocked"}}' > "$METER/radio.uses.org.jsonc"
step radio.task.push --via gh.issues --into sandpine/spot-forecast-widget --title "rash guard sizes" --description "add rash guards to the size chart" --auth "$AUTH" --promise task-to-public-repo-is-anonymized
echo '{"orgs":{"sandpine":"allowed"}}' > "$METER/radio.uses.org.jsonc"
step radio.task.queue drain
calls

echo
echo "=== path M: a private push flushes a backlog that holds an unvouched public record ==="
: > "$STUB/calls.log"
echo '{"orgs":{"sandpine":"blocked"}}' > "$METER/radio.uses.org.jsonc"
step radio.task.push --via gh.issues --into sandpine/spot-forecast-widget --title "retry lesson reminders" --description "retry a failed reminder once" --auth "$AUTH"
echo '{"orgs":{"sandpine":"allowed"}}' > "$METER/radio.uses.org.jsonc"
step radio.task.push --via gh.issues --into sandpine/svc-lessons --title "tide chart refresh" --description "refresh the chart at dawn" --auth "$AUTH"
calls
KEY_WAIT="$(grep -l '"title": "retry lesson reminders"' .behavior/.radio/record.*.json | sed -E 's/.*record\.([a-f0-9]+)\.json/\1/')"
step radio.task.queue del --uuid "$KEY_WAIT" --why "walk cleanup"

echo
echo "=== path N: a rate limit on the visibility read ==="
: > "$STUB/calls.log"
echo '{"orgs":{"sandpine":"blocked"}}' > "$METER/radio.uses.org.jsonc"
step radio.task.push --via gh.issues --into sandpine/swell-feed --title "swell feed audit" --description "audit the swell feed" --auth "$AUTH"
echo '{"orgs":{"sandpine":"allowed"}}' > "$METER/radio.uses.org.jsonc"
step radio.task.queue drain
calls
KEY_LIMIT="$(grep -l '"title": "swell feed audit"' .behavior/.radio/record.*.json | sed -E 's/.*record\.([a-f0-9]+)\.json/\1/')"
step radio.task.queue del --uuid "$KEY_LIMIT" --why "walk cleanup"

echo
echo "=== path O: a nudged push re-run with a scrubbed title ==="
: > "$STUB/calls.log"
step radio.task.push --via gh.issues --into sandpine/spot-forecast-widget --title "surf-ops coach notes" --description "a coach note" --auth "$AUTH"
step radio.task.push --via gh.issues --into sandpine/spot-forecast-widget --title "coach notes" --description "a coach note" --auth "$AUTH" --promise task-to-public-repo-is-anonymized
step radio.task.queue get
calls

echo
echo "=== path P: a body piped via --description @stdin into a public repo ==="
: > "$STUB/calls.log"
rm -rf "$STUB/bodies"
printf 'add a\nswell legend\n' | step radio.task.push --via gh.issues --into sandpine/spot-forecast-widget --title "swell legend" --description @stdin --auth "$AUTH"
calls
printf 'add a\nswell legend\n' | step radio.task.push --via gh.issues --into sandpine/spot-forecast-widget --title "swell legend" --description @stdin --auth "$AUTH" --promise task-to-public-repo-is-anonymized
calls
echo "--- the body this push sent:"
cat "$STUB"/bodies/* 2>/dev/null | sed 's/^/    /'
echo

echo
echo "=== path Q: a body with a quote, a dollar, a backtick, and a newline; the printed line, run as typed ==="
: > "$STUB/calls.log"
rm -rf "$STUB/bodies"
BODY_Q="it's \$HOME and \`tick\` and \"quotes\"
second line"
echo
printf '$ rhx radio.task.push --via gh.issues --into sandpine/spot-forecast-widget --title %q --description %q --auth %q\n' "quote probe" "$BODY_Q" "$AUTH"
OUT_Q="$(bash "$SKILLS/radio.task.push.sh" --via gh.issues --into sandpine/spot-forecast-widget --title "quote probe" --description "$BODY_Q" --auth "$AUTH" 2>&1)"
CODE_Q=$?
printf '%s\n' "$OUT_Q"
echo "> exit $CODE_Q"
LINE_Q="${OUT_Q##*rhx radio.task.push }"
echo
echo "\$ rhx radio.task.push $LINE_Q"
eval "bash \"\$SKILLS/radio.task.push.sh\" $LINE_Q" 2>&1
echo "> exit $?"
echo "--- the body on the wire ends with the original, byte for byte? (expect: yes)"
if [[ "$(cat "$STUB"/bodies/*)" == *"$BODY_Q" ]]; then echo "    yes"; else echo "    no"; fi

echo
echo "=== path R: a rejected token on the visibility read ==="
echo unauthorized > "$STUB/visibility.sandpine_wave-feed"
: > "$STUB/calls.log"
step radio.task.push --via gh.issues --into sandpine/wave-feed --title "wave feed audit" --description "audit the wave feed" --auth "$AUTH"
calls

echo
echo "=== path S: a bare --promise, and an empty body ==="
: > "$STUB/calls.log"
step radio.task.push --via gh.issues --into sandpine/spot-forecast-widget --title "add a tide table" --description "under the chart" --auth "$AUTH" --promise
step radio.task.queue drain --promise
step radio.task.push --via gh.issues --into sandpine/spot-forecast-widget --title "add a tide table" --description "" --auth "$AUTH"
calls
