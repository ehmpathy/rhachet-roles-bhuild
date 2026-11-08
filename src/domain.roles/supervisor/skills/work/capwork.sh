#!/usr/bin/env bash
######################################################################
# capwork — the cap ledger contract: where it lives, what a row holds,
#           when a row is new, and how its instants read
#
# 🔴 .a LIB: sourced, never executed. its writer is the statusline
#     command (`claude.statusline.caplog`), its reader `rhx git.crew.tokens
#     calibrate`.
#
# .what = one owner for the ledger the pool calibration (F8) reads:
#         - CAPWORK_LEDGER_REL     the ledger dir, relative to a repo or worktree root
#         - CAPWORK_JQ_DEFS        caprow, capkey, capepoch
#         - CAPWORK_JQ_CALIBRATE   cappairs, calverdict, caplatest, calpool
#         - get_cap_rows           every cap row on a grove; capwork_payload_lib
#                                  prints it as text a grove probe embeds
#
# .why  = the writer and the reader each held their own copy of the path
#         and the row shape, and the reader guessed at the writer's
#         instant format. a change on one side would empty the other's
#         read, and the calibration would print ⚪ as if no seat were wired
#
# usage:
#   source "$SKILL_DIR/work/capwork.sh"
#   jq -c "$CAPWORK_JQ_DEFS"' caprow($account; $confdir; $at)' <<<"$statusline_input"
#
# guarantee:
#   - defines variables only; runs no command
#   - capepoch reads `resets_at` as epoch seconds or an iso string; else null
#   - capkey is the change key: (session, account, 5h %, 7d %)
######################################################################

# shellcheck disable=SC2034 # read by the verbs that source this lib
CAPWORK_LEDGER_REL=".log/role=any/skill=claude.statusline.caplog"

# shellcheck disable=SC2034
CAPWORK_JQ_DEFS='
  def capepoch: if type == "number" then . elif type == "string" then (sub("\\.[0-9]+"; "") | sub("\\+00:00$"; "Z") | fromdateiso8601) else null end;
  def caprow($account; $confdir; $at): {
      at: $at, account: $account, confdir: $confdir,
      session: .session_id, version: .version, model: .model.id,
      five_hour: .rate_limits.five_hour, seven_day: .rate_limits.seven_day,
      spend_limit: .rate_limits.spend_limit,
      rate_limits_present: (.rate_limits != null) };
  def capkey: [.session, .account, .five_hour.used_percentage, .seven_day.used_percentage];
'

######################################################################
# the calibration — the pool's tokens per %, per cap window (F2, F8)
#
#   tokens per % = fleet weighted burn between two instants
#                ÷ Σ over every account of the % it rose between them
#
# .what = CAPWORK_JQ_CALIBRATE (needs CAPWORK_JQ_DEFS ahead of it):
#   calburn · calburned           a span forest record → its burn, and the accounts that burned
#   cappairs($span5; $span7)      cap rows → per window, the read pair per account
#   calverdict($burn; $burned)    a pair + the burn between it → calibrated | uncalibrated, and why
#   caplatest                     cap rows → the latest read per account
#   calpool($latest; $now)        a window → the burn rate the pool's headroom sustains now
#
# .note = a refusal is never a number: a partial pool, a pre-span gap, or a
#         reset inside the span would overstate tokens per %, so each reads ⚪
######################################################################
# shellcheck disable=SC2034
CAPWORK_JQ_CALIBRATE='
  # .what = a span forest record → the burn calverdict judges, and the accounts that burned in it
  def calburn: {weighted: .fleet.weighted, partial: .partial, unreached: .unreached, unread: .unread};
  def calburned: [.groves[] | select(.record) | .record.crews[] | select(.weighted > 0) | .accounts[]] | unique;

  def cappairs($span5; $span7):
    map(. + {t: (.at | capepoch)}) as $rows
    | ([$rows[].t] | max // null) as $t2
    | [ {window: "five_hour", span: $span5}, {window: "seven_day", span: $span7} ]
    | map(. as $w | (if $t2 then ($t2 - $w.span * 60) else null end) as $t1
        | ($rows | map(select(.[$w.window].used_percentage? != null)) | group_by(.account)
           | map(sort_by(.t) as $rs
               | ($rs | map(select(.t <= $t1)) | last) as $r1
               | ($rs | map(select(.t <= $t2)) | last) as $r2
               | { account: $rs[0].account,
                   # how far each read sits from the span end it stands for, in minutes
                   off_before_min: (if $r1 then (($t1 - $r1.t) / 60 | floor) else null end),
                   off_after_min: (if $r2 then (($t2 - $r2.t) / 60 | floor) else null end),
                   used_before: ($r1[$w.window].used_percentage // null),
                   used_after: ($r2[$w.window].used_percentage // null),
                   resets_before: ($r1[$w.window].resets_at // null | capepoch),
                   resets_after: ($r2[$w.window].resets_at // null | capepoch) })) as $accounts
        | { window: $w.window, span_min: $w.span,
            # every account the ledger holds a row for, whether or not that row names this window
            logged: ($rows | map(.account) | unique),
            t1: (if $t2 then ($t1 | todate) else null end), t2: (if $t2 then ($t2 | todate) else null end),
            accounts: $accounts });

  def calverdict($burn; $burned):
    ([.accounts[].account]) as $read
    | ([$burned[] | select(. as $a | $read | index($a) | not)]) as $absent
    # a seat that logs rows but no figure for this window is wired; its claude code hands none over
    | ((.logged // []) as $logged | [$absent[] | select(. as $a | $logged | index($a) | not)]) as $unwired
    | ([$absent[] | select(. as $a | $unwired | index($a) | not)]) as $nofigure
    | ([.accounts[] | select(.used_before == null)] | map(.account)) as $nobefore
    | ([.accounts[] | select(.resets_before != null and .resets_after != null and .resets_before != .resets_after)] | map(.account)) as $straddled
    # the burn is read over [t1, t2]; a rise read over a span far from it would divide one span by another
    | ([.span_min * 0.1, 5] | max) as $tol
    | ([.accounts[] | select(.used_before != null and ((.off_before_min // 0) > $tol or (.off_after_min // 0) > $tol)) | .account]) as $offspan
    | ([.accounts[] | select(.used_before != null and .used_after != null) | (.used_after - .used_before)] | add // 0) as $rise
    | . + { burn: $burn, rise_pct: $rise,
            verdict: (
              if .t2 == null then {state: "uncalibrated", why: "the cap ledger holds no rows — wire `claude.statusline.caplog` on each seat, then restart it"}
              elif ($burn == null) then {state: "uncalibrated", why: "no span to read burn over"}
              elif ($burn.partial) then {state: "uncalibrated", why: "the burn read is partial (unreached: \($burn.unreached | join(", ")); unread: \($burn.unread | length)) — a partial burn would understate tokens per %"}
              elif ($unwired | length) > 0 then {state: "uncalibrated", why: "accounts burned in the span with no cap read: \($unwired | join(", ")) — wire their seats, or the pool overstates tokens per %"}
              elif ($nofigure | length) > 0 then {state: "uncalibrated", why: "accounts whose cap reads carry no \({five_hour: "5h", seven_day: "7d"}[.window] // .window) figure: \($nofigure | join(", ")) — their claude code hands none to the statusline; see rhx claude.statusline.probe"}
              elif ($nobefore | length) > 0 then {state: "uncalibrated", why: "accounts with no cap read before the span: \($nobefore | join(", ")) — retake after one more read"}
              elif ($straddled | length) > 0 then {state: "uncalibrated", why: "the window reset inside the span for \($straddled | join(", ")) — retake the pair after the reset"}
              elif ($offspan | length) > 0 then {state: "uncalibrated", why: "the reads of \($offspan | join(", ")) sit more than \($tol | floor) min off the span ends, so their rise spans other time than the burn — retake once each seat logs near both ends"}
              elif ($rise <= 0 or $burn.weighted <= 0) then {state: "uncalibrated", why: "no burn between the reads — retake after real work"}
              else {state: "calibrated", tokens_per_pct: ($burn.weighted / $rise | floor)} end) };

  def caplatest:
    map(. + {t: (.at | capepoch)}) | group_by(.account) | map(sort_by(.t) | last)
    | map({account, at, five_hour, seven_day});

  # .note = the time to reset is floored at 0.25h: a window about to reset
  #         would otherwise divide its headroom by ~0 and read as boundless
  # .note = a read is stale if its window already reset (or names no reset), or if it is older than
  #         the tolerance calverdict uses ($tol): a seat that has not logged since may have spent
  #         the headroom it reported. a stale read is left out, so the pool errs low, and the
  #         count of such reads is named
  def calpool($latest; $now):
    . as $w
    | ([$w.span_min * 0.1, 5] | max) as $tol
    | ([ $latest[] | (.at | capepoch) as $t | .[$w.window]
         | select(. != null and .used_percentage != null) | . + {age_min: (if $t then (($now - $t) / 60) else null end)} ]) as $reads
    | ($reads | map(select(((.resets_at | capepoch) // 0) > $now and .age_min != null and .age_min <= $tol))) as $fresh
    | . + { pool: (if .verdict.state != "calibrated" then null else
        { accounts: ($latest | length),
          reads_stale: (($reads | length) - ($fresh | length)),
          sustainable_per_hour: ([ $fresh[]
              | ((100 - .used_percentage) * $w.verdict.tokens_per_pct)
                / ([(((.resets_at | capepoch) - $now) / 3600), 0.25] | max) ] | add // 0 | floor) } end) };
'

# .what = every cap row on this grove, as one json array
# .note = the ledger sits under each repo and worktree root, so the glob is that root set
get_cap_rows() {
  local f
  for f in "$HOME"/git/*/_worktrees/*/"$CAPWORK_LEDGER_REL"/caps.jsonl \
           "$HOME"/git/*/*/"$CAPWORK_LEDGER_REL"/caps.jsonl; do
    [[ -r "$f" ]] && jq -R -c 'fromjson? | select(type == "object") | {at, account, five_hour, seven_day}' "$f"
  done | jq -s -c '.'
}

# .what = the reader lib as source text, for a grove probe to embed
capwork_payload_lib() {
  declare -p CAPWORK_LEDGER_REL
  declare -f get_cap_rows
}
