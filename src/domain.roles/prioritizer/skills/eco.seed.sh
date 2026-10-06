#!/usr/bin/env bash
######################################################################
# .what = find the records that TRACK a priority — get
#
# .why  = a priority in this store is a claim that something matters.
#         it is not a task, and nobody works it. the work lives in a gh
#         issue, a garden seed, or a live tree — elsewhere, always.
#
#         so "is this actually queued anywhere?" is the one question a
#         rank cannot answer about itself, and it is exactly the question
#         that let the braid form: a ~$300/mo bleed named out loud that
#         appeared in no queue at all.
#
# 🔴 .why it exists as a SKILL rather than a habit
#
#         this was run by hand, five times, on 2026-09-13 — a `gh issue
#         list` here, a `gh search issues` there, a `git.repo.get` for
#         the gardens. it produced a finding stated with confidence that
#         was not safe:
#
#             "two of three are tracked nowhere"
#
#         ⛔ `gh issue list` prints an empty set when a repo holds no
#           issues, AND when the token cannot read them. the robot
#           integration returns `Resource not accessible by integration`
#           on the very repo that was declared empty. an absence and a
#           blindness are byte-identical at the caller.
#
#         ⇒ that is `term=partial-audit`: a read complete over the scope
#           it could see, reported as a verdict about the world.
#
# 🔴 .the one thing this skill is FOR
#
#         it reports THREE states per source, never two:
#
#           🟢 found N     — read succeeded, N records match
#           ⚪ none        — read SUCCEEDED, and no record matched
#           ⚠️ unreadable  — the read FAILED. this is not "none"
#
#         a tool that collapses the last two into "none" is the defect
#         this replaces. the discriminator IS the value.
#
# .why it calls SKILLS and never raw `gh`
#         `radio.task.pull` is the paved verb for a gh issue read, and
#         `git.repo.get` for a file read. the by-hand version dropped
#         below both and improvised — which is how the silent empty got
#         in (rule.always.entool-the-layer-you-drop-below).
#
# 🔴 .the second verb — `gen`, which CLOSES the loop `get` opens
#
#         `get` answers "who else knows about this?" and stops. the answer
#         is routinely ⚪ none, and then a human does three steps by hand:
#         author an issue body from the row, push it, and paste the new
#         `owner/repo#N` back onto the row as a --ref-task.
#
#         ⇒ step three is the one that gets skipped, and its absence is
#           invisible: the work IS tracked, the row says it is not, and
#           the next `get` reports ⚪ none over a queue that holds it. a
#           `term=partial-audit` the store inflicts on itself.
#
#         `gen` is a FINDSERT, never a create. it is safe to re-run:
#         `radio.task.push --idem findsert` returns the extant issue where
#         the title already exists, and the crossref is an idempotent set.
#         ⇒ so the cure for a half-done seed is to run it again.
#
# ⚠️ .why `gen` and not `set`
#         a `set` would push a fresh issue on every call, so a re-run
#         after a failed crossref would duplicate the task. the operation
#         must converge (rule.require.idempotent-operations), and `gen`
#         is the verb that names convergence (rule.require.get-set-gen-verbs)
#
# usage:
#   rhx eco.seed get --for <slug>
#   rhx eco.seed get --for <slug> --in sandpine/svc-lessons
#   rhx eco.seed get --all --in sandpine/svc-lessons
#   rhx eco.seed get --for <slug> --gardens 'myorg/briefs-*'
#
#   rhx eco.seed gen --for <slug> --into sandpine/svc-lessons              # plan
#   rhx eco.seed gen --for <slug> --into sandpine/svc-lessons --mode apply # push + crossref
#
# args:
#   --for <slug>    the priority to hunt for
#   --all           every priority in the store, one report each
#                   ⚠️ `get` only. a bulk seed writes to a foreign repo
#                   once per row, and `gen` refuses it on purpose
#   --into <repo>   `gen` only — the repo to seed the task INTO
#   --mode <m>      `gen` only — plan (default) or apply.
#                   🔴 plan is the default because a seed writes to a repo
#                   this store does not own. a preview costs a glance; an
#                   unwanted issue in someone else's queue costs a human
#                   (rule.require.safe-by-default)
#   --in <repo>     repeatable — a gh repo to read issues from.
#                   ⚠️ with none given, the gh source reports
#                   `⚪ not asked`, never `⚪ none` — this skill does not
#                   guess which repo owns a priority
#   --gardens <g>   repo glob for garden-seed files, e.g. 'myorg/briefs-*'
#                   ⚠️ with none given, the gardens source reports
#                   `⚪ not asked` — this package names no org's gardens
#   --words <word>  what to SEARCH for (default: the slug)
#                   🔴 the slug is a default, never a law. a slug names the
#                   WORK ('sms-tune'); a garden names the NEED
#                   ('sms-savings'). measured 2026-09-13: the slug search
#                   returned ⚪ none while the seed sat in the garden under
#                   its need-name — a read that succeeded and concluded
#                   falsely, which is the very defect this skill exists for
#   --auth <mode>   passed through to `radio.task.pull` (default: as-human)
#                   ⚠️ the DEFAULT matters. under robot auth a private repo
#                   returns `Resource not accessible by integration`, which
#                   this skill correctly reports as ⚠️ UNREADABLE — a true
#                   verdict, and a useless one. a prioritizer read is driven
#                   by a human at a terminal, so `as-human` is the read that
#                   answers the question rather than declines it
#
# .what it reads, in order
#   1. the ROW — its own --ref-task and --ref-tree. always readable,
#      so this source carries only two states
#   2. gh.issues — via `radio.task.pull`, per --in repo
#   3. gardens — via `git.repo.get files --words`, per --gardens glob
#
# .what `gen` writes, in order
#   1. the ISSUE — via `radio.task.push --idem findsert`
#   2. the CROSSREF — via `eco.priority set --ref-task '<repo>#<exid>'`
#   3. the VERIFY — a read-back that the ref actually landed on the row
#
#   🔴 step 3 is not ceremony. steps 1 and 2 cross a process boundary
#   each, so "the command exited 0" is a claim about a correlate rather
#   than about the record (rule.require.verify-after-send)
#
# guarantee:
#   - a failed read reports as ⚠️ UNREADABLE, with the reason, and NEVER
#     as an absence
#   - exit 2 when any source was unreadable — a caller must not read a
#     partial report as a complete one
#   - `gen` is idempotent: a re-run findserts the issue and re-sets the
#     same ref, so a half-done seed is cured by another run
#   - `gen` in plan mode writes naught, anywhere
#   - exit 0 = every source read cleanly, 1 = malfunction, 2 = a source
#     could not be read (the answer is unknown, rather than "none")
######################################################################

# ⚠️ no `-e`, on purpose. this skill must SURVIVE a failed read to report it
#    as ⚠️ UNREADABLE. under `-e` + `pipefail`, a reason-extract whose grep
#    matches naught (the GH_WHY line below) aborts the run before its own
#    fallback line can fire — so a blind source would exit mid-report rather
#    than name itself. every failure path here is guarded by hand instead.
set -uo pipefail

__SEED_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for arg in "$@"; do
  if [[ "$arg" == "--help" || "$arg" == "-h" ]]; then
    awk '/^#####+$/ { seen++; next } seen == 1' "$0" | sed 's/^# \{0,1\}//'
    exit 0
  fi
done

ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo|--role|--skill) shift 2 ;;
    *) ARGS+=("$1"); shift ;;
  esac
done
set -- "${ARGS[@]+"${ARGS[@]}"}"

# ⚠️ a flag in the first slot is not a verb. without this, `eco.seed --for x`
#   reads `--for` as the verb and refuses with "verb '--for' is not one of:
#   get" — an error that names the wrong defect and hides the real one
VERB="get"
if [[ "${1:-}" != "" && "${1:-}" != --* ]]; then VERB="$1"; shift; fi

FOR="" ALL="false" GARDENS="" AUTH="as-human" WORDS=""
INTO="" MODE="plan"
REPOS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --for)     FOR="${2:-}"; shift 2 ;;
    --all)     ALL="true"; shift 1 ;;
    --in)      REPOS+=("${2:-}"); shift 2 ;;
    --gardens) GARDENS="${2:-}"; shift 2 ;;
    --auth)    AUTH="${2:-}"; shift 2 ;;
    --words)   WORDS="${2:-}"; shift 2 ;;
    --into)    INTO="${2:-}"; shift 2 ;;
    --mode)    MODE="${2:-}"; shift 2 ;;

    # 🔴 REFUSE an unknown token. it used to `shift` — silently.
    #
    #   every flag here has a default, so a dropped one does not fail. it
    #   falls back, and the fallback is almost always WIDER:
    #
    #     --in  typo'd  -> REPOS empty  -> searches the default repo set
    #     --for typo'd  -> FOR empty    -> filters by naught
    #
    #   ⚠️ the result is a superset, and a superset holds the rows you
    #   wanted, so it reads like an answer (`term=false-report`). the same
    #   defect was measured in `eco.priority get` on 2026-09-14, where a
    #   typo'd `--slg` returned the whole store as `count: 29`.
    #
    #   🟡 `--mode` fails SAFE by luck rather than by design — its default
    #   is `plan`, so a typo'd `--mode apply` merely plans. do not read that
    #   as the pattern; `--in` writes to whatever repo it lands on
    *)
      if [[ "$1" == -* ]]; then
        echo "✋ eco.seed: '$1' is not a flag this tool takes" >&2
        echo "   run \`rhx eco.seed --help\` for the full set" >&2
        echo "   ⇒ it used to be dropped in silence, and every flag here" >&2
        echo "     has a default — so a typo WIDENS rather than refuses" >&2
      else
        echo "✋ eco.seed: unexpected argument '$1'" >&2
        echo "   every input is a named flag — e.g. --for '$1'" >&2
        echo "   ⇒ a bare value here is usually a flag whose quotes broke" >&2
      fi
      exit 2 ;;
  esac
done

if [[ "$VERB" != "get" && "$VERB" != "gen" ]]; then
  echo "✋ eco.seed: verb '$VERB' is not one of: get gen" >&2
  exit 2
fi

if [[ -z "$FOR" && "$ALL" != "true" ]]; then
  echo "✋ eco.seed: name a priority with --for <slug>, or sweep them all with --all" >&2
  exit 2
fi

# 🔴 a bulk seed would push one issue per row into ONE foreign repo, which
#   is almost never the intent and is unreversible per issue. refused at the
#   argument layer rather than caught mid-loop (rule.prefer.prevent-over-correct)
if [[ "$VERB" == "gen" && "$ALL" == "true" ]]; then
  echo "✋ eco.seed gen: --all is for 'get'. a seed writes to a repo this store does not own," >&2
  echo "   so it takes ONE row at a time. name it with --for <slug>" >&2
  exit 2
fi

if [[ "$VERB" == "gen" && -z "$INTO" ]]; then
  echo "✋ eco.seed gen: name the repo to seed into with --into <org/repo>" >&2
  echo "   this skill does not guess which repo owns a priority" >&2
  exit 2
fi

if [[ "$VERB" == "gen" && "$MODE" != "plan" && "$MODE" != "apply" ]]; then
  echo "✋ eco.seed gen: --mode '$MODE' is not one of: plan apply" >&2
  exit 2
fi

ECO_DB="${ECOWORK_DB:-.eco/priority.db}"
PATH_ECOWORK_DB="$__SEED_DIR/work/ecowork.db.mjs"
ERRFILE="$(mktemp)"
trap 'rm -f "$ERRFILE"' EXIT

rows="$(printf '%s' '{}' | node "$PATH_ECOWORK_DB" get "$ECO_DB")" || {
  echo "💥 eco.seed: could not read the store at $ECO_DB" >&2
  exit 1
}

# ⚠️ keep the WHOLE store before the filter narrows it. a gated row names its
#    gaters by SLUG, and the task that tracks a gater lives on the gater's own
#    row — so the dispatch body cannot name a gate without the other rows
rowsall="$rows"

if [[ -n "$FOR" ]]; then
  rows="$(jq -c --arg slug "$FOR" '{ priorities: [.priorities[] | select(.slug == $slug)] }' <<<"$rows")"
  if [[ "$(jq -r '.priorities | length' <<<"$rows")" == "0" ]]; then
    echo "✋ eco.seed: no priority holds the slug '$FOR'" >&2
    exit 2
  fi
fi

# ── gen — findsert the tracking issue, then crossref it back ─────────
if [[ "$VERB" == "gen" ]]; then
  row="$(jq -c '.priorities[0]' <<<"$rows")"
  slug="$(jq -r '.slug' <<<"$row")"
  what="$(jq -r '.what' <<<"$row")"
  why="$(jq -r '.why // "—"' <<<"$row")"
  sev="$(jq -r '.opine.sev' <<<"$row")"
  urg="$(jq -r '.opine.urg' <<<"$row")"
  # ⚠️ there is no `goal` local, and there is no `| goal |` row in the body.
  #   it read `.goal` off the row, which the store retired on 2026-09-21 — so
  #   it would have printed `— (serves no stated objective)` into every seeded
  #   issue, on a store where every row states one. and even filled it was a
  #   duplicate: the slug IS the goal uri, and `.the backref` below already
  #   names it. one value under two headings reads as two facts
  gain="$(jq -r '.quant.gain.cashTotal // "❔ unmeasured"' <<<"$row")"
  work="$(jq -r '.quant.cost.time // "❔ to be graded"' <<<"$row")"

  # 🔴 a row with open PARTS is a ROLL-UP, and a roll-up is not the work — its
  #   leaves are (rule.require.aim-a-gate-at-the-work). to dispatch one hands a
  #   crew N deliverables under one slug, which `rule.require.one-pr-per-worktree`
  #   forbids outright, and which `howto.find-the-serialization-a-rank-hides`
  #   names as the third serializer: the folded row. the roll-up needs no dispatch
  #   of its own — the block reaches it up the tree once its parts close
  #   (define.invariant.eco.a-part-gates-its-whole)
  #
  #   ⚠️ it refuses in PLAN too, on purpose. a refusal that fired only on apply
  #   would let a human read a clean preview, judge the dispatch sound, and meet
  #   the halt after they had already decided
  #
  #   measured 2026-09-18: `gen --for route-efficiency` previewed a clean body
  #   over 20 open parts and warned about not one of them
  if [[ "$(jq -r '(.partsOpen // []) | length' <<<"$row")" != "0" ]]; then
    partcount="$(jq -r '(.partsOpen // []) | length' <<<"$row")"
    partfirst="$(jq -r '(.partsOpen // [])[0]' <<<"$row")"
    {
      echo "✋ eco.seed: '$slug' is a ROLL-UP — $partcount rows sit beneath it, each open"
      echo ""
      echo "   a part gates its whole, so this row cannot close until every one of"
      echo "   them does. to dispatch it hands ONE crew $partcount deliverables under"
      echo "   one slug — which rule.require.one-pr-per-worktree forbids."
      echo ""
      echo "   the open parts:"
      jq -r '(.partsOpen // [])[] | "     · " + .' <<<"$row"
      echo ""
      echo "   the fix — seed a LEAF, which is where the work actually is:"
      echo "     rhx eco.seed gen --for '$partfirst' --into <org/repo>"
    } >&2
    exit 2
  fi

  # the title carries the SLUG, so a later `get` can find this issue by the
  # same term it searches with, and a human who reads the queue can trace the
  # row it came from (rule.always.carry-the-slug-in-a-dispatch-title)
  TITLE="🔦 priority - $slug — $what"

  # 🔴 a gate is named by the SLUG of the row it waits on, and a slug means
  #   naught in the repo this issue lands in. so each gate is rendered as the
  #   ISSUE that tracks it — `owner/repo#N`, which github turns into a live
  #   link that carries the gate's own state. a reader who lands here cold can
  #   then see what blocks them and click through, rather than read `held` and
  #   have no way to learn what it is held ON
  #
  #   ⚠️ a gater with no task on its row is rendered by slug, marked untracked.
  #   the alternative is to omit it, which would under-report the gate — and a
  #   gate list that reads complete while it hides a row is worse than absent
  #   ⚠️ the store rides STDIN, never `--argjson`. the whole store as one argv
  #   element exceeds ARG_MAX once the row count grows — measured 2026-09-18 as
  #   `jq: Argument list too long`, which bash reports on stderr while the
  #   assignment still exits 0, so the gate list silently came back EMPTY. a
  #   `<<<` redirect writes to a pipe rather than argv, so it has no such bound
  gates="$(jq -r --arg slug "$slug" '
    (.priorities // []) as $all
    | ($all | map(select(.slug == $slug)) | first) as $row
    | ($row.gatedBy // [])
    | map(
        . as $gslug
        | ($all | map(select(.slug == $gslug)) | first) as $g
        | {
            open: ((($row.gatedByOpen // []) | index($gslug)) != null),
            task: ((($g.refTask // []) | first) // null),
            what: (($g.what // "— (no row in the store)"))
          }
        | "| \(if .open then "🔴 open" else "✅ closed" end) "
          + "| \(if .task then .task else "⚠️ untracked — `" + $gslug + "`" end) "
          + "| \(.what) |"
      )
    | join("\n")
  ' <<<"$rowsall")"

  GATES=""
  if [[ -n "$gates" ]]; then
    GATES="$(
      printf '%s\n' \
        "## .the gates — 🔴 this work is HELD until they close" \
        "" \
        "| state | the gate | what it is |" \
        "|---|---|---|" \
        "$gates" \
        "" \
        "⚠️ the state above is a snapshot. each gate is rendered as the ISSUE that" \
        "tracks it, so the link carries what holds NOW — read the link, not the row."
    )"
  fi

  # 🔴 the body states the opine AS an opine. a sev pasted into a foreign
  #   queue with no owner reads as that repo's own grade, and it is not —
  #   it is this store's human judgment, and only they may move it
  #   (rule.forbid.fabricated-opines)
  BODY="$(
    printf '%s\n' \
      "## .what" \
      "" \
      "$what" \
      "" \
      "## .why" \
      "" \
      "$why" \
      "" \
      "## .the opine — ⚠️ this store's, not this repo's" \
      "" \
      "| | |" \
      "|---|---|" \
      "| sev | \`$sev\` |" \
      "| urg | \`$urg\` |" \
      "| gain | $gain |" \
      "| work | $work |" \
      "" \
      "🔴 \`sev\` and \`urg\` are authored by a human in the \`eco.priority\` store." \
      "they are carried here so a reader knows what the ask is worth **to the asker**." \
      "⇒ they are NOT a claim on this repo's own queue order, and a re-rank here" \
      "does not reach the store." \
      "" \
      "$GATES" \
      "" \
      "## .the backref" \
      "" \
      "this task is tracked as priority \`$slug\`. to read the live row:" \
      "" \
      '```sh' \
      "rhx eco.priority get --slug $slug" \
      '```' \
      "" \
      "---" \
      "" \
      "dispatched by human + beaver 🦫"
  )"

  echo "🦫 lets get this on someone's list"
  echo ""
  echo "🔦 eco.seed gen --for $slug --into $INTO --mode $MODE"
  echo "   ├─ store: $ECO_DB"
  echo "   ├─ auth: $AUTH"
  echo "   ├─ title: $TITLE"
  echo "   └─ refs on the row today"
  echo "         └─ ref-task: $(jq -r '.refTask | if length == 0 then "— (tracked nowhere the row knows of)" else join(" · ") end' <<<"$row")"
  echo ""

  if [[ "$MODE" != "apply" ]]; then
    echo "   ┌─ the body it WOULD push"
    printf '%s\n' "$BODY" | sed 's/^/   │  /'
    echo "   └─"
    echo ""
    echo "🦫 plan only — naught was written"
    echo "   └─ run again with --mode apply to push it and crossref the row"
    exit 0
  fi

  # 1. the ISSUE. --idem findsert is what makes a re-run safe: where the
  #    title already exists it returns the extant exid rather than a twin
  pushed="$(printf '%s\n' "$BODY" | rhx radio.task.push \
    --via gh.issues --into "$INTO" --title "$TITLE" --description @stdin \
    --idem findsert --auth "$AUTH" 2>"$ERRFILE")" || {
    echo "💥 eco.seed gen: the push failed, so no issue exists and the row is untouched" >&2
    echo "   └─ $(tr '\n' ' ' <"$ERRFILE" | cut -c1-200)" >&2
    exit 1
  }
  printf '%s\n' "$pushed" | sed 's/^/   │  /'
  echo ""

  # ⚠️ the exid is parsed off stdout because radio.task.push emits no json.
  #   so an absent exid is a REAL possibility, and it must halt rather than
  #   crossref an empty string onto the row
  exid="$(grep -o 'exid: [0-9][0-9]*' <<<"$pushed" | head -1 | grep -o '[0-9][0-9]*')"
  if [[ -z "$exid" ]]; then
    echo "💥 eco.seed gen: the push reported success, and no exid could be read from it" >&2
    echo "   ├─ 🔴 the issue may well EXIST. this halts before the crossref rather" >&2
    echo "   │  than write a ref nobody can follow" >&2
    echo "   └─ read the repo, then crossref by hand:" >&2
    echo "      rhx eco.priority set --slug $slug --ref-task '$INTO#<N>'" >&2
    exit 1
  fi

  REF="$INTO#$exid"

  # 2. the CROSSREF. an omitted flag preserves, so this adds the ref and
  #    touches no other field on the row
  if ! crossref="$(rhx eco.priority set --slug "$slug" --ref-task "$REF" --output json 2>"$ERRFILE")"; then
    echo "💥 eco.seed gen: the issue landed as $REF, and the crossref FAILED" >&2
    echo "   ├─ $(tr '\n' ' ' <"$ERRFILE" | cut -c1-200)" >&2
    echo "   └─ 🔴 re-run this same command — the push findserts, so it will not duplicate" >&2
    exit 1
  fi

  # 3. the VERIFY. two process boundaries were crossed above, and an exit
  #    code is a correlate of the record rather than the record itself
  after="$(printf '%s' '{}' | node "$PATH_ECOWORK_DB" get "$ECO_DB" \
    | jq -r --arg slug "$slug" --arg ref "$REF" \
        '[.priorities[] | select(.slug == $slug) | .refTask[] | select(. == $ref)] | length')"
  if [[ "$after" != "1" ]]; then
    echo "💥 eco.seed gen: the crossref reported success, and the row does NOT hold $REF" >&2
    echo "   └─ 🔴 re-run this same command. do not record this priority as tracked" >&2
    exit 1
  fi

  echo "🦫 dam fine! $slug is on the list"
  echo "   ├─ issue: $REF"
  echo "   ├─ ref-task: 🟢 verified on the row, read back from the store"
  echo "   └─ a later 'eco.seed get --for $slug --in $INTO' now finds it from both ends"
  exit 0
fi

# ── the gh source, read ONCE per repo rather than once per row ───────
#
# 🔴 the three states live here. `radio.task.pull` exits non-zero when
#   the token cannot read, and THAT is the property which makes the
#   discriminator possible at all — a raw `gh issue list` exits 0 and
#   prints naught, so no caller can part that from an empty queue
declare -A GH_BODY GH_STATE GH_WHY
UNREADABLE=0

for repo in "${REPOS[@]+"${REPOS[@]}"}"; do
  if pulled="$(rhx radio.task.pull --via gh.issues --from "$repo" --list --auth "$AUTH" 2>"$ERRFILE")"; then
    GH_STATE["$repo"]="read"
    GH_BODY["$repo"]="$pulled"
  else
    GH_STATE["$repo"]="unreadable"
    GH_WHY["$repo"]="$(tr '\n' ' ' <"$ERRFILE" | sed 's/  */ /g' | grep -o 'Resource not accessible[^"]*\|error[^"]*' | head -1 | cut -c1-140)"
    [[ -z "${GH_WHY[$repo]}" ]] && GH_WHY["$repo"]="the pull exited non-zero; see stderr"
    UNREADABLE=1
  fi
done

# ── the report ───────────────────────────────────────────────────────
echo "🦫 who else knows about this?"
echo ""
echo "🔦 eco.seed get${FOR:+ --for $FOR}"
echo "   ├─ store: $ECO_DB"
echo "   ├─ sources: row · gh.issues · gardens"
echo "   └─ auth: $AUTH"
echo ""

count="$(jq -r '.priorities | length' <<<"$rows")"
for i in $(seq 0 $((count - 1))); do
  row="$(jq -c ".priorities[$i]" <<<"$rows")"
  slug="$(jq -r '.slug' <<<"$row")"

  # 🔴 the SEARCH TERM is not the slug by nature — it merely defaults to it.
  #   a slug names the WORK ('sms-tune'); a garden names the NEED
  #   ('sms-savings'). the two rarely share a string, so a slug search
  #   returns a ⚪ that read cleanly and concluded falsely
  term="${WORDS:-$slug}"
  what="$(jq -r '.what' <<<"$row")"
  tasks="$(jq -r '.refTask | if length == 0 then "—" else join(" · ") end' <<<"$row")"
  trees="$(jq -r '.refTree | if length == 0 then "—" else join(" · ") end' <<<"$row")"

  echo "   ├─ $slug"
  echo "   │     ├─ what: $what"
  echo "   │     ├─ declared on the row"
  echo "   │     │     ├─ ref-task: $tasks"
  echo "   │     │     └─ ref-tree: $trees"
  echo "   │     ├─ gh.issues"

  if [[ ${#REPOS[@]} -eq 0 ]]; then
    echo "   │     │     └─ ⚪ NOT ASKED — name a repo with --in <org/repo>"
    echo "   │     │        this skill does not guess which repo owns a priority"
  else
    for repo in "${REPOS[@]}"; do
      if [[ "${GH_STATE[$repo]}" == "unreadable" ]]; then
        echo "   │     │     ├─ $repo  ⚠️ UNREADABLE"
        echo "   │     │     │     ├─ ${GH_WHY[$repo]}"
        echo "   │     │     │     └─ 🔴 this is NOT 'none'. the answer is unknown"
      else
        hits="$(grep -ci -- "$term" <<<"${GH_BODY[$repo]}" || true)"
        if [[ "$hits" == "0" ]]; then
          echo "   │     │     ├─ $repo  ⚪ none — read ok, no line holds '$term'"
        else
          echo "   │     │     ├─ $repo  🟢 $hits line(s) hold '$term'"
        fi
      fi
    done
  fi

  # ⚪ no garden glob named — same stance as --in: this skill does not guess
  #   whose gardens hold a seed, so an unnamed source reports NOT ASKED
  if [[ -z "$GARDENS" ]]; then
    echo "   │     └─ gardens"
    echo "   │           └─ ⚪ NOT ASKED — name a garden glob with --gardens <org/repo-*>"
    continue
  fi

  echo "   │     └─ gardens ($GARDENS)"
  if garden="$(rhx git.repo.get files --repos "$GARDENS" --words "$term" 2>"$ERRFILE")"; then
    hits="$(grep -c 'seed.md' <<<"$garden" || true)"
    if [[ "$hits" == "0" ]]; then
      echo "   │           ├─ ⚪ none — read ok, no seed holds '$term'"
      echo "   │           └─ 🟡 a garden names a seed for the NEED, never the"
      echo "   │              slug. widen with --words <word> before you"
      echo "   │              record 'untracked'"
    else
      echo "   │           └─ 🟢 $hits seed file(s) hold '$term'"
    fi
  else
    echo "   │           ├─ ⚠️ UNREADABLE — $(tr '\n' ' ' <"$ERRFILE" | cut -c1-140)"
    echo "   │           └─ 🔴 this is NOT 'none'. the answer is unknown"
    UNREADABLE=1
  fi
done

echo ""
if [[ $UNREADABLE -eq 1 ]]; then
  echo "⚠️ at least one source could not be read"
  echo "   ├─ ⚪ none means the read SUCCEEDED and no record matched"
  echo "   └─ ⚠️ UNREADABLE means the answer is UNKNOWN — do NOT record"
  echo "      'tracked nowhere' off this report"
  exit 2
fi

echo "🦫 every source read clean"
exit 0
