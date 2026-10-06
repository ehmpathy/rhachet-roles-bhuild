#!/usr/bin/env bash
######################################################################
# ecowork — record and rank what is worth the spend
#
# 🔴 .a LIB: sourced, never executed. rhachet scans `skills/` RECURSIVELY,
#     so this file is dispatchable as `rhx ecowork` — and a sourced-only
#     file run directly defines its functions, says naught, and exits 0.
#     the verbs that source it are `rhx eco.priority` and `rhx eco.seed`.
#
# .what = an **eco.priority** is one ranked item, and it carries two
#         families of field that must never be confused:
#
#           quant.{gain,cost,asks}   MEASURED — a number a human would
#                                    defend, or one the store counted
#           opine.{sev,urg}          JUDGED — a human's claim
#
#         🔴 a quant INFORMS an opine. it never overwrites one.
#
#         so the rank order is opine-first, always, and every signal the
#         quants raise arrives as a PROMPT for a human to re-judge.
#
# .why `eco` = economy AND ecology, deliberately both. a priority ranks
#         what is worth the spend, and compute spent to re-derive
#         unranked work is power drawn and heat rejected as surely as it
#         is money (philosophy.pavement-saves-nature). `eco` names the
#         concept both words point at: the cost of a choice, counted
#         honestly.
#
# .why at all = the fleet had instruments for the CURRENT STATE —
#         crew.poll, grove.saturation, crew.ledger, radio.task.pull —
#         and not one for WHAT MATTERS NEXT. measured 2026-09-13: 511
#         open issues over four repos, 42 crews with 0 merged, and a
#         ~$300/mo cost bleed that appeared in no queue at all.
#
#         a queue with no rank orders itself by filename age. that is
#         how three dreams braided onto one `grepsafe` defect.
#
# .the three verbs
#
#         eco.priority set    upsert, keyed on --slug
#         eco.priority get    read, ranked; every filter optional
#         eco.priority del    drop, idempotent
#
#         set/get/del rather than create/list/remove, per
#         rule.require.get-set-gen-verbs. `set` is an upsert so a re-run
#         converges rather than duplicates; `del` on an absent slug is a
#         no-op that exits 0.
#
# .the layers
#   ecowork.sh       the human surface — args, render, exit codes  ← this file
#   ecowork.db.mjs   the sqlite store — json in, json out, renders naught
#   .eco/priority.db the store itself, per-repo (like .meter/ and .route/)
#
# usage:
#   eco.priority set --slug <slug> --sev <sev> --urg <urg> --what <what>
#                    [--why <why>]
#                    [--gain-cash <price>] [--gain-per <p>] [--gain-for <dur>]
#                    [--cost-cash <price>] [--cost-per <p>] [--cost-for <dur>]
#                    [--gain-time <work>] [--cost-time <work>]
#                    [--ref-task <ref>] [--ref-tree <ref>]
#                    [--status <s>] [--gates <slug>] [--gated-by <slug>]
#                    [--sponsor | --unsponsor]
#   eco.priority get [--slug <s>] [--sev <s>] [--urg <u>] [--status <s>]
#                    [--ready] [--ref-task <ref>] [--ref-tree <ref>]
#                    [--output json|rootstruct]
#   eco.priority del --slug <slug>
#
#   OPINE — a human's claim (PRIORITIZED: the org wants it)
#     --sev        p0 | p1 | p2 | p3 | p5     how bad if unfixed
#     --urg        1d | 3d | 1w | 1m          when it stops to be worth it
#
#   SPONSORED — a human authorized their budget on it (review time, cash
#     tokens + compute). orthogonal to opine, and it TOPS the rank + shows
#     a ⭐. prioritized = the org wants it; sponsored = a human paid for it
#     now (define.prioritized-vs-sponsored)
#     --sponsor    mark this row sponsored
#     --unsponsor  clear the flag
#     (omit both   preserves the prior flag)
#
#   QUANT — a measured or estimated number
#     --gain-cash  iso-price words, e.g. 'USD 150.00'
#     --gain-per   once | 1d | 1w | 1mo | 1y  how OFTEN (default: once)
#     --gain-for   how LONG it runs, e.g. '3mo' or '5y'  (default: 1y)
#     --cost-cash  iso-price words — what the fix itself costs in money
#     --cost-per   once | 1d | 1w | 1mo | 1y  how OFTEN (default: once)
#     --cost-for   how LONG it runs, e.g. '5y'           (default: 1y)
#     --gain-time  work the fix GIVES BACK, e.g. '2h'    (1d = 8h)
#     --cost-time  work to do it, e.g. '4h' or '2d'      (1d = 8h)
#     (asks)       never typed — the store counts every set
#
#   🔴 PER is how often · FOR is how long, and EACH SIDE owns its own
#      a USD 40.00/1mo vendor line that runs 5y against a gain that lasts
#      3mo is a NET LOSS, and one shared window cannot say so. the net
#      subtracts TOTALS, so no shared window is owed
#
#   ⇒ the rank signal is NET: (gain total - cost total) / hours of work.
#     a gross figure would put an USD 1800 win that spends USD 1700 of
#     vendor cash above an USD 500 win that spends naught
#
#   ORCHESTRATION — what must happen first, and what has happened
#     --status     enqueued | inflight | done | held   (default: enqueued)
#     --gates      repeatable — slug(s) this priority must PRECEDE
#     --gated-by   repeatable — slug(s) that must precede THIS one
#     --ready      on get — only rows that are enqueued with no unfinished
#                  gate before them. "what can i start right now"
#
#   🔴 a gate is ONE edge with two ends. `--gates x` on row A and
#      `--gated-by a` on row X write the same fact, so the store holds it
#      once — two json columns could disagree, and no query could say which
#      side was right
#
#   🔴 the two relations over these rows are ORTHOGONAL, and this is the
#      second one. the slug's uri PATH says what a row is PART OF
#      (decomposition, a tree); a gate says what must come FIRST
#      (orchestration, a timeline).
#      a piece is not a prerequisite: `paint` is part of a house and gates
#      naught, while `walls` gate `roof` and neither is part of the other.
#      ⇒ so a gate crosses branches freely. see
#        define.eco.decomposition-vs-orchestration
#
#   ⚠️ a cycle is REFUSED at write, not detected at read. A gates B gates C
#      gates A reads fine at every step and leaves a set where no row is
#      ever ready and no error ever fires
#
#   --ref-task  repeatable — the seeded radio issue(s) that serve it
#   --ref-tree  repeatable — the live tree(s) that work it
#   --output    tree (default) | json | rootstruct
#               rootstruct = the decomposition rolled up by root, sev·urg and
#               orchestration state per node; a leaf with no own cash inherits
#               its nearest priced ancestor, marked `↑ … (whole)`
#
# guarantee:
#   - set is an upsert: one slug, one row, a re-run adds no duplicate
#   - del is idempotent: an absent slug reports and exits 0
#   - a --what / --why carries arbitrary prose safely (stdin, never argv)
#   - cash arithmetic runs in integer cents, never a float
#   - exit 0 = ok, 1 = malfunction, 2 = constraint
######################################################################

# 🔴 .why this lib self-arms, where the four work libs deliberately do NOT
#   `workPrelude.integration.test.ts:5-9` states the family contract: a sourced
#   file that sets shell options mutates its caller's shell, and a library has
#   no business with that side effect. crewwork/ductwork/termwork/syncwork all
#   hold to it, and `workPrelude`'s own `LIBS_WORK` (:57) is scoped to those 4.
#
#   this file diverges, and the divergence is LOAD-BEARING rather than an
#   oversight. the difference is who sources it:
#
#   | the 4 work libs | this lib |
#   |---|---|
#   | sourced only by entrypoints that arm first | sourced BARE, 21 times |
#
#   ⇒ measured 2026-09-25. exactly one production caller sources this file —
#   `eco.priority.sh:550`, which arms at `:548`, two lines above. every OTHER
#   source site is `bash -c "source ecowork.sh; <verb>"` from
#   the `ecowork.*.integration.test.ts` parts (21 sites), and `bash -c` arms
#   no options of its own. so a removal here silently drops `-u` and
#   `pipefail` from 21 test invocations that assert exit codes.
#
#   ⚠️ and the peer that raised this at i004 read it the other way — it named
#   `eco.seed.sh:140` as a second caller that arms before it sources. it does
#   not source this file at all; its `:140` is its OWN arm, as an entrypoint,
#   and the shared line number is a coincidence. ⇒ the caller set is {1
#   production, 21 bare}, and the bare set is why the arm stays.
#
#   ⇒ so `LIBS_WORK`'s scope of 4 is CORRECT, not an oversight — this file is a
#   hybrid (a lib that its own harness drives as a surface), and the contract it
#   would join is written for the pure-lib shape.
set -uo pipefail

__ECO_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
__ECO_DB_MJS="$__ECO_LIB_DIR/ecowork.db.mjs"

######################################################################
# substrate
######################################################################

# .what = the repo this priority belongs to
# .why  = the db is per-repo, so it must key off the repo root rather
#         than the caller's cwd — a call from a subdir reads one store
__eco_repo_root() {
  git rev-parse --show-toplevel 2>/dev/null || pwd
}

# .what = where the store lives
__eco_db_path() {
  echo "${ECOWORK_DB:-$(__eco_repo_root)/.eco/priority.db}"
}

# .what = build a json array from N shell args; an empty set yields []
# .why  = --ref-task and --ref-tree are repeatable, and a hand-rolled
#         "a","b" join breaks the moment a ref holds a quote
__eco_json_array() {
  if [[ $# -eq 0 ]]; then printf '[]'; return 0; fi
  printf '%s\n' "$@" | jq -R . | jq -s -c .
}

# .what = hand a json payload to the store, return its json verdict
# .why  = the payload rides STDIN rather than argv, so a shell never
#         rewrites a --what that holds a backtick or a $
#         (rule.require.verify-after-send)
#
# 🟡 .the node:sqlite experimental notice is silenced IN THE MODULE, not
#   here. this is one of 13 places that spawn it — the suite holds 12
#   more — so a flag at any one call site leaves the other twelve loud
#   (rule.require.solve-at-cause). see `ecowork.db.mjs`.
__eco_db() {
  local verb="$1" payload="$2"
  printf '%s' "$payload" | node "$__ECO_DB_MJS" "$verb" "$(__eco_db_path)"
}

# .what = the store path, shown relative to the repo, for a render
__eco_db_shown() {
  local root; root="$(__eco_repo_root)"
  local db; db="$(__eco_db_path)"
  echo "${db#"$root"/}"
}

# .what = tell the caller to forward this render verbatim, never re-draw it
#
# .why  = a clone that runs this to answer a human then RE-RENDERS the rows
#         into a hand-built table. the human never sees this output — a tool
#         result is invisible from their seat — so the hand-built copy is the
#         only thing they read, and it drops the rollup, the ↑ marks, and the
#         alignment this render already computed.
#
#         measured 2026-09-14: a supervisor ran `get`, read a 2KB preview of a
#         42KB result, wrote a node program to re-draw the tree, and shipped
#         that. the human replied "why are things duplicated and not all branch
#         connected? and not all aligned?" — three defects, none of them in
#         this render. `--output rootstruct` was never reached for.
#
#         `rule.always.render-priorities-as-treestruct` already forbids it, and
#         it lives in role=prioritizer, which NO sessionstart hook boots — so
#         it has never been in a clone's context. a tip printed at the moment
#         of use needs no boot (rule.always.forward-a-skill-render-verbatim).
#
#   .note = the shape is this repo's tip idiom — one dim `└─ tip:` leaf, the
#           same as radio.uses.output.sh `print_tip`, catch.dream, and the
#           feedback footer
__eco_tip_forward_verbatim() {
  # \033[2m = dim, \033[0m = reset
  echo ""
  if [[ "${1:-}" == "--rank" ]]; then
    echo -e "   └─ \033[2mtip: this is the rank, not the board. for a human, run --output rootstruct and paste it verbatim\033[0m"
    return 0
  fi
  echo -e "   └─ \033[2mtip: paste this render verbatim into your reply. summarize after it, never instead of it\033[0m"
}

# .what = render one priority as a treestruct block
#
# .why the two families get their own lines
#   a human who reads a rank must be able to tell at a glance which
#   numbers they asserted and which the world did. one merged block of
#   fields hides exactly that, and it is the distinction the whole model
#   rests on
__eco_render_one() {
  local row="$1" lead="$2"

  # 🔴 the RAIL this row's own child lines hang from, derived from the lead.
  #
  #   a `├─` row has more rows below it, so its children hang off a live
  #   `│`. a `└─` row is the LAST, so a `│` under it dangles with naught
  #   below — the exact blemish rule.forbid.snapshot-visual-blemishes names,
  #   and it was baked into the acceptance snapshot until 2026-09-28
  #   because every child line hardcoded the pipe regardless of the lead.
  local rail; if [[ "$lead" == "└─" ]]; then rail=" "; else rail="│"; fi
  # ⚠️ `goal` stood in this list until 2026-09-21, declared and never once
  #    assigned — the row's `goal` column is retired, and the render had
  #    already dropped it. `kindmark` sat the other way round: assigned
  #    below, declared nowhere, so it leaked into the caller's scope
  local slug kindmark kind sev urg what why tasks trees asks rung climb flag measured star
  local gain_cash gain_per gain_for gain_total gain_time
  local cost_cash cost_per cost_for cost_total
  local cost_time cost_hours net_total per_hour
  local status status_shown gates gated_shut ready parts_open
  local sponsored until surgoals rolled_derived rolled_total

  # 🔴 ONE jq per row, never one per field. the render once spawned ~45 jq
  #   processes a row, so a 25-row store cost ~1,100 of them and crossed a
  #   30s budget under load. every field now rides one pass, joined by the
  #   unit separator (\037) and ended by the record separator (\036) — so a
  #   `what` or `why` that holds a newline survives the read intact
  #
  # 🔴 the KIND is spelled out in words, never left as a bare scheme
  #   `bigrock` and `altrock` differ by three letters and mean mainquest vs
  #   sidequest — a misread inverts what the row claims about itself. a
  #   SUBROCK names its ROOT beside it, because the child never names the
  #   root's kind. ⚠️ the KIND alone, never the uri: the slug already heads
  #   the row, and a second copy is the `goal:` line this render dropped
  #
  # 🔴 `gated_shut` holds the OPEN gates, never every gate — a finished gate
  #   is history. `parts_open` is the DERIVED half, on its own line: an edge
  #   somebody decided is dropped, a part that is not finished is finished
  IFS=$'\037' read -r -d $'\036' \
    slug what why sev urg kindmark kind asks rung climb measured \
    gain_cash gain_per gain_for gain_total gain_time \
    cost_cash cost_per cost_for cost_total cost_time cost_hours \
    net_total per_hour tasks trees \
    status ready gates gated_shut parts_open status_shown \
    sponsored until surgoals rolled_derived rolled_total \
    < <(jq -j '
      def list(f): if (f | length) == 0 then "—" else (f | join(", ")) end;
      [
        .slug, .what, (.why // "—"), .opine.sev, .opine.urg,
        ( if .goalKind == "bigrock" then "  🪨 mainquest"
          elif .goalKind == "altrock" then "  🪶 sidequest"
          elif .goalKind == "subrock" then "  🧩 part of \(.goalRoot)"
          else "" end ),
        (.kind // ""), .quant.asks, .quant.askRung, (.quantClimb // "none"),
        .quant.cashMeasured,
        (.quant.gain.cash // "—"), .quant.gain.per, .quant.gain.duration,
        (.quant.gain.cashTotal // "—"), (.quant.gain.time // "—"),
        (.quant.cost.cash // "—"), .quant.cost.per, .quant.cost.duration,
        (.quant.cost.cashTotal // "—"), (.quant.cost.time // "—"),
        (.quant.cost.hours // "—"),
        (.quant.netCashTotal // "—"), (.quant.cashPerHour // "—"),
        list(.refTask), list(.refTree),
        .status, .ready, list(.gates), list(.gatedByOpen), list(.partsOpen // []),
        ( if   .status == "enqueued" and .ready then "enqueued  👋 ready"
          elif .status == "enqueued" then "enqueued  🪵 gated"
          elif .status == "inflight" then "inflight  🌾 underway"
          elif .status == "done"     then "done      🌊 landed"
          elif .status == "held"     then "held      💤 parked on purpose"
          else .status end ),
        .sponsored, (.sponsoredUntil // ""), list(.goalSurgoals // []),
        (.gainRolled.derived // false), (.gainRolled.cashTotal // "—")
      ]
      | map(if type == "string" then . else tojson end)
      | join("\u001f"), "\u001e"' <<<"$row")

  # .why the flags appear only past a threshold
  #   a flag on every row flags no row at all. 🪃 needs rung 3 — the
  #   third ask is the first that is evidence of a pattern rather than
  #   noise. ⚖️ needs a two-place climb, since one swap between adjacent
  #   rows is within the noise of any human's judgment
  #
  # 🔴 .why ❔ exists, and it is not decoration
  #   a row with no cash figure never enters the cash rank, so it can
  #   never earn a ⚖️. left unmarked, its quiet flag column reads as
  #   "measured, and the evidence agrees" when it means "never measured"
  #   — and that asymmetry only ever promotes CASH work, which is the
  #   exact undervalue define.cost-gain-matrix exists to prevent
  flag=""
  if [[ "$rung" -ge 3 ]]; then flag="$flag 🪃"; fi
  if [[ "$climb" != "none" ]]; then flag="$flag ⚖️+$climb"; fi
  if [[ "$measured" != "true" ]]; then flag="$flag ❔"; fi

  # ⭐ = SPONSORED — a human authorized budget on this row, so it tops the
  #   rank. it leads the header line, before sev·urg, because it outranks
  #   the opine (define.prioritized-vs-sponsored)
  star=""
  if [[ "$sponsored" == "true" ]]; then star="⭐ "; fi

  # 🔥 = a hotfix still alight — urg 1h, and not yet done.
  #
  # 🔴 it leads even the ⭐, because the two answer different questions. ⭐
  #   says "a human committed budget"; 🔥 says "this burns RIGHT NOW". a
  #   funded row can wait a month; a 1h row cannot wait an hour, and a
  #   reader who scans the rank must meet that first.
  #
  # ⚠️ it goes OUT when the row is done, and that is the whole ask — a 🔥
  #   that never clears is decoration, and a reader looks past it within a
  #   week. so the glyph is DERIVED from urg + status on every render and
  #   never stored: the fire is a state of the work, not a label on it.
  #
  #   ⇒ a stored `hotfix` column would also be a second name for a fact the
  #     opine already carries, which is a synonym, which drifts
  #     (rule.forbid.domain-term-synonyms)
  fire=""
  if [[ "$urg" == "1h" && "$status" != "done" ]]; then fire="🔥 "; fi

  # 🔴 a BOUNDED sponsorship announces its own lapse, and that is the whole
  #   reason `until` is stored rather than left to prose.
  #
  #   a funded row sits at the TOP of the rank. the day its window closes it
  #   drops to wherever its sev·urg puts it — and with no render, that fall is
  #   indistinguishable from a human who changed their mind. the reader sees a
  #   row that "stopped mattering" and can name no cause (term=false-report).
  #
  # ⚠️ so the countdown is not a nicety; it is what makes the demotion HONEST.
  #   ⏳ at 7 days or fewer, because a lapse a human learns about on the day
  #   it happens is a lapse they could not have renewed
  lapse=""
  if [[ -n "$until" ]]; then
    local days
    days=$(( ( $(date -d "$until" +%s 2>/dev/null || echo 0) - $(date +%s) ) / 86400 ))
    if   [[ "$days" -le 7 ]]; then lapse=" ⏳${days}d"
    else                           lapse=" (${days}d)"; fi
  fi

  # 🔴 there is no `goal:` line, and its absence is the point.
  #   the slug IS the goal uri, so a `goal:` line under the slug line
  #   printed one value twice and read as `Goal.goal` — an entity that
  #   carries an attribute of its own name, which is not a shape any
  #   domain has (rule.forbid.domain-term-inconsistency: one concept,
  #   one word; a second name for it is a synonym the store must refuse)
  #
  # ⚠️ the KIND still rides, and it is NOT that dropped line come back.
  #   what was dropped is the second copy of the URI. what rides here is
  #   the one fact the uri does not state in words — `bigrock` vs
  #   `altrock`, three letters apart and opposite in sense. a reader who
  #   scans a rank must not decode that (see `kindmark` above)
  echo "   $lead ${fire}${star}$sev · $urg · $slug$kindmark$flag$lapse"
  echo "   $rail     ├─ what: $what"
  echo "   $rail     ├─ why:  $why"

  # 🔴 the kind renders only where one is DECLARED, and it says what the
  #   row does to the problem rather than restates the word. a bare
  #   `clamp` reads as jargon; `bounds it, the bleed continues` is the
  #   claim a reader must weigh against the gain on the next line
  #
  # ⚠️ an absent kind renders NOT AT ALL, deliberately. a root or a pure
  #   decomposition node aims at no problem and is neither — so a `—`
  #   here would invite a reader to fill in a blank that is correct
  if [[ "$kind" == "solve" ]]; then
    echo "   $rail     ├─ kind: 🔨 solve — removes the problem. the bleed stops"
  elif [[ "$kind" == "clamp" ]]; then
    echo "   $rail     ├─ kind: 🗜️  clamp — bounds the problem. the bleed continues, capped"
  fi

  echo "   $rail     ├─ state: $status_shown"
  echo "   $rail     ├─ opine ─ sev $sev · urg $urg"
  echo "   $rail     ├─ quant ─ asks $asks (rung $rung)"

  if [[ "$gain_cash" != "—" ]]; then
    echo "   $rail     │         gain  $gain_cash per $gain_per for $gain_for → $gain_total"
  else
    echo "   $rail     │         gain  —"
  fi

  if [[ "$cost_cash" != "—" ]]; then
    echo "   $rail     │         cost  $cost_cash per $cost_per for $cost_for → $cost_total"
  else
    echo "   $rail     │         cost  —"
  fi

  if [[ "$cost_time" != "—" || "$gain_time" != "—" ]]; then
    echo "   $rail     │         work  $cost_time (${cost_hours}h) · gives back $gain_time"
  else
    echo "   $rail     │         work  —"
  fi

  if [[ "$per_hour" != "—" ]]; then
    echo "   $rail     │         ⇒ net $net_total · $per_hour per hour of work"
  else
    echo "   $rail     │         ⇒ ❔ no cash measured — this row cannot earn a ⚖️"
  fi

  # .why the gate lines render only where an edge exists
  #   most rows gate naught and are gated by naught, and two `—` lines on
  #   every row would bury the handful that carry a real timeline
  if [[ "$gated_shut" != "—" ]]; then
    echo "   $rail     ├─ after: $gated_shut  🪵 unfinished"
  fi
  if [[ "$parts_open" != "—" ]]; then
    echo "   $rail     ├─ parts: $parts_open  🧩 unfinished"
  fi
  if [[ "$gates" != "—" ]]; then
    echo "   $rail     ├─ before: $gates"
  fi

  # 🔴 the EXTRA parents, always shown when present — this is the one row
  #   whose gain is drawn from more than one place, and a figure a reader
  #   cannot trace to a visible edge is a number nobody can audit
  #   (define.invariant.eco.gain-propagates-down-and-sums)
  if [[ "$surgoals" != "—" ]]; then
    echo "   $rail     ├─ also serves: $surgoals  🪶 N birds, one stone"
  fi

  # 🔴 the ROLLED gain, shown ONLY when it was DERIVED from parts
  #
  #   when a row measured its own figure, the rolled value equals it, and to
  #   print it twice teaches naught. when it was summed from parts, nobody
  #   measured it — and a derived figure rendered indistinguishably from a
  #   measured one is a number no reader can audit. the ∑ IS the mark
  #   (define.invariant.eco.gain-sums-up-never-down)
  if [[ "$rolled_derived" == "true" && "$rolled_total" != "—" ]]; then
    echo "   $rail     ├─ gain: ∑ $rolled_total  (summed from parts — nobody measured this whole)"
  fi

  echo "   $rail     ├─ task: $tasks"
  echo "   $rail     └─ tree: $trees"
}

######################################################################
# the verb
######################################################################

eco.priority() {
  local verb="${1:-}"; shift || true

  # ⚠️ there is no GOAL local, and its absence matched the refusal below only
  #   after 2026-09-21. it stood here, unassigned, and rode into the jq payload
  #   as `goal: ""` on every call — a dead name on the wire, kept alive by the
  #   one place nobody looks when a flag is removed
  local SLUG="" KIND="" SEV="" URG="" WHAT="" WHY="" OUTPUT="tree"
  local GAIN_CASH="" GAIN_PER="" GAIN_FOR="" GAIN_TIME=""
  local COST_CASH="" COST_PER="" COST_FOR="" COST_TIME=""
  local ASKS="" ASK="false" STATUS="" READY="false" SPONSORED=""
  local SPONSOR_WHO="" SPONSOR_WHY="" SPONSOR_SINCE="" SPONSOR_UNTIL=""
  local FROM="" TO=""
  local -a REF_TASK=() REF_TREE=() GATES=() GATED_BY=() SURGOAL=()

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --slug)       SLUG="${2:-}"; shift 2 ;;
      # 🔴 --goal is REFUSED. a priority row IS a goal, and its slug IS that
      #   goal's uri — so `--goal` asked for a second name for what --slug
      #   already names. that is `Goal.goal`: an entity that carries an
      #   attribute of its own name. no domain has that shape.
      #
      #   ⚠️ it did not merely read oddly, it MINTED DRIFT. measured
      #   2026-09-14: 44 of 44 rows, not one slug matched its goal, and six
      #   were coined at a keyboard — `coachbook-dao-codegen-hygiene` for
      #   `.../sql-dao-generator-codegen-hygiene`. four names, no two alike,
      #   and the render left the only question it could:
      #   "what is codegen hygiene? no one knows."
      #
      #   a guard was then added to refuse a --goal that DIFFERED from --slug.
      #   that was the wrong rung: it REPORTED the synonym rather than removed
      #   it, and its printed remedy ("re-run with --slug '<uri>'") steered the
      #   caller to drop --goal entirely — which minted a row with an EMPTY
      #   goal, invisible to every rollup. the fix produced the defect.
      #
      #   ⇒ so the attribute is gone, never validated
      #     (rule.prefer.prevent-over-correct, rung 1 — make it impossible)
      --goal)
        echo "✋ eco.priority: --goal does not exist. a priority IS a goal, and --slug is its uri." >&2
        echo "   you passed:  --goal '${2:-}'" >&2
        echo "   pass it as:  --slug '${2:-}'" >&2
        echo "⇒ one name, never two. a second name is a synonym, and it drifted on 44 of 44 rows." >&2
        return 2
        ;;
      # solve|clamp — what this goal does to the problem it aims at.
      # solve removes the rate; clamp truncates the window
      --kind)       KIND="${2:-}"; shift 2 ;;
      --sev)        SEV="${2:-}"; shift 2 ;;
      --urg)        URG="${2:-}"; shift 2 ;;
      --what)       WHAT="${2:-}"; shift 2 ;;
      --why)        WHY="${2:-}"; shift 2 ;;
      --gain-cash)  GAIN_CASH="${2:-}"; shift 2 ;;
      --gain-per)   GAIN_PER="${2:-}"; shift 2 ;;
      --gain-for)   GAIN_FOR="${2:-}"; shift 2 ;;
      --gain-time)  GAIN_TIME="${2:-}"; shift 2 ;;
      --cost-cash)  COST_CASH="${2:-}"; shift 2 ;;
      --cost-per)   COST_PER="${2:-}"; shift 2 ;;
      --cost-for)   COST_FOR="${2:-}"; shift 2 ;;
      --cost-time)  COST_TIME="${2:-}"; shift 2 ;;
      # 🔴 --ask takes NO value and --asks does; a shift 2 on the bare
      #   verb would eat the next flag whole, silently
      --ask)        ASK="true"; shift 1 ;;
      --asks)       ASKS="${2:-}"; shift 2 ;;
      --ref-task)   REF_TASK+=("${2:-}"); shift 2 ;;
      --ref-tree)   REF_TREE+=("${2:-}"); shift 2 ;;
      --status)     STATUS="${2:-}"; shift 2 ;;
      # SPONSORED — a human authorized budget (review time, tokens, compute)
      # on this row. tops the rank (define.prioritized-vs-sponsored)
      #
      # 🔴 as of 2026-09-15 this is an EPISODE, not a flag. --sponsor OPENS
      #   one and REFUSES without --sponsor-who and --sponsor-why, because a
      #   sponsorship nobody signed cannot be questioned, renewed, or revoked.
      #   --unsponsor CLOSES it (until = now) and never deletes it — the
      #   record is what answers "we spent three weeks on this; who said to?"
      #
      # ⚠️ --sponsor-until is OPTIONAL and an omission means OPEN-ENDED, never
      #   unknown. a bounded sponsorship LAPSES on its own, which is the whole
      #   point — and the render states the days left, so a row never falls
      #   off the rank in silence
      --sponsor)        SPONSORED="true"; shift 1 ;;
      --unsponsor)      SPONSORED="false"; shift 1 ;;
      --sponsor-who)    SPONSOR_WHO="${2:-}"; shift 2 ;;
      --sponsor-why)    SPONSOR_WHY="${2:-}"; shift 2 ;;
      --sponsor-since)  SPONSOR_SINCE="${2:-}"; shift 2 ;;
      --sponsor-until)  SPONSOR_UNTIL="${2:-}"; shift 2 ;;
      # ORCHESTRATION — one edge, two ends. `--gates x` and `--gated-by x`
      # write the same fact from opposite rows, so the store holds it once
      --gates)      GATES+=("${2:-}"); shift 2 ;;
      --gated-by)   GATED_BY+=("${2:-}"); shift 2 ;;
      # DECOMPOSITION — the extra surgoal a PATH cannot express, and it is
      # what makes the rock model a DAG rather than a tree
      #
      # ⚠️ this read "keyed on the goal rather than the slug" until
      #   2026-09-21. there is no such distinction any more: the slug IS
      #   the goal uri, so the two keys are one value
      #
      # 🔴 .why `--surgoal` and not `--serves`, which this flag was called
      #   until 2026-09-14: `surgoal` is the DECLARED canonical term for
      #   this exact relation (term=goal.surgoal), and a cli is a published
      #   contract — the one place rule.forbid.domain-term-synonyms grades
      #   "above all". `serves` is the same relation said as a verb, so it
      #   is a synonym in a contract, which that rule forbids outright.
      #
      #   ⚠️ the flag was also UNDOCUMENTED for its whole life: absent from
      #   the usage block and from `--help`, so the one capability that
      #   makes this model a DAG rather than a tree was reachable only by
      #   a reader of the source. a name nobody can find and nobody can
      #   look up is two defects, not one.
      --surgoal)    SURGOAL+=("${2:-}"); shift 2 ;;
      # 🔴 --ready takes NO value, same trap as --ask: a shift 2 here would
      #   eat the next flag whole and report success
      --ready)      READY="true"; shift 1 ;;
      # 🔴 the FUNDED read — "how are our stars?" answered by the store
      #
      # ⚠️ the VERB and the NOUN are two words on purpose. `--sponsor` ACTS
      #   (set), `--sponsored` ASKS (get). one label, one sense — and a human
      #   who types the wrong one on the wrong verb gets a refusal that names
      #   the fix rather than a silent no-op (rule.forbid.ambiguous-labels)
      #
      # ⇒ it reads the DERIVED flag, so a LAPSED sponsorship drops out of
      #   `--sponsored` the day it lapses. that is the window at work
      --sponsored)   SPONSORED="true"; shift 1 ;;
      --unsponsored) SPONSORED="false"; shift 1 ;;
      # goal.mv — the rename verb. a strict FK makes a rename unreachable by
      # `set`, so it takes the SUBTREE as its unit rather than a row
      --from)       FROM="${2:-}"; shift 2 ;;
      --to)         TO="${2:-}"; shift 2 ;;
      --output)     OUTPUT="${2:-}"; shift 2 ;;

      # 🔴 REFUSE an unknown token. it used to `shift` — silently.
      #
      #   a dropped flag does not fail. it WIDENS:
      #
      #     get --slg dispute-or-concede   -> the filter vanished, and the
      #                                       answer came back `count: 29`,
      #                                       the whole store, reported as a
      #                                       successful get
      #     get --db /some/other.db        -> read THIS store and headed the
      #                                       report `from: .eco/priority.db`
      #
      #   ⚠️ both exit 0. both look like answers. neither is an answer to the
      #   question that was asked — `term=false-report`, and the reader has no
      #   way to tell, because a superset of the right rows holds the right
      #   rows.
      #
      #   🔴 measured 2026-09-14: this defeated a by-hand verification of the
      #   plaintext restore. the check said the store rebuilt from committed
      #   text; it had read the live db and built no store at all.
      #
      #   ⇒ the VERB two screens below has always refused an unknown value and
      #     named the valid set. a flag deserves the same, and `grepsafe` in
      #     this very repo already does it (`error: unknown option: --slug`)
      *)
        if [[ "$1" == -* ]]; then
          echo "✋ eco.priority: '$1' is not a flag this tool takes" >&2
          echo "   run \`rhx eco.priority --help\` for the full set" >&2
          echo "   ⇒ it used to be dropped in silence, which WIDENS a filter" >&2
          echo "     rather than a refusal — the answer then reads complete" >&2
        else
          echo "✋ eco.priority: unexpected argument '$1'" >&2
          echo "   every input is a named flag — e.g. --slug '$1'" >&2
          echo "   ⇒ a bare value here is usually a flag whose quotes broke" >&2
        fi
        return 2 ;;
    esac
  done

  # caught HERE rather than in jq, because `tonumber` on a non-number
  # aborts the whole payload build and reports only "could not build the
  # payload" — a true sentence about the wrong subject
  if [[ -n "$ASKS" && ! "$ASKS" =~ ^[1-9][0-9]*$ ]]; then
    echo "✋ eco.priority: --asks '$ASKS' is not a positive integer — how many times a human reached for this" >&2
    return 2
  fi

  case "$verb" in
    set|get|del|goal.mv) ;;
    "")  echo "✋ eco.priority: a verb is required — one of: set get del goal.mv" >&2; return 2 ;;
    *)   echo "✋ eco.priority: verb '$verb' is not one of: set get del goal.mv" >&2; return 2 ;;
  esac

  # 🔴 goal.mv carries a payload of its own shape, so it builds and returns
  #   here rather than down the row-shaped path below. it has no --slug, no
  #   opine, no quant — its unit is a SUBTREE, and the whole reason it is a
  #   separate verb is that a row-shaped write cannot express a rename
  if [[ "$verb" == "goal.mv" ]]; then
    local mv_payload mv_verdict mv_rc
    mv_payload="$(jq -n -c --arg from "$FROM" --arg to "$TO" \
      '{ from: $from, to: $to } | with_entries(select(.value != ""))')" || {
      echo "💥 eco.priority: could not build the payload" >&2
      return 1
    }

    mv_verdict="$(__eco_db "goal.mv" "$mv_payload")"; mv_rc=$?
    if [[ $mv_rc -ne 0 ]]; then
      case "$mv_rc" in
        2) echo "   └─ fix: rhx eco.priority --help" >&2 ;;
        *) echo "   └─ the store malfunctioned — db: $(__eco_db_shown)" >&2 ;;
      esac
      return $mv_rc
    fi

    if [[ "$OUTPUT" == "json" ]]; then echo "$mv_verdict"; return 0; fi

    local mv_count; mv_count="$(jq -r '.count' <<<"$mv_verdict")"
    echo "🦫 chew on it"
    echo ""
    echo "🔦 eco.priority goal.mv"
    echo "   ├─ into: $(__eco_db_shown)"
    echo "   ├─ from: $(jq -r '.from' <<<"$mv_verdict")"
    echo "   ├─ to:   $(jq -r '.to' <<<"$mv_verdict")"
    echo "   └─ moved: $mv_count row(s)"

    # 🔴 the per-row trace is not decoration. a rename touches rows the
    #   human never named, so the ONE artifact that says which is this list
    #   — and without it the caller cannot tell a subtree move from a
    #   one-row edit that quietly missed its descendants
    #
    # ⚠️ a count of 1 on a root with parts beneath it is CORRECT, not a
    #   miss: a ROOT KIND flip (bigrock -> altrock) moves the root alone,
    #   because a subrock names the root's SLUG and never its KIND. a root
    #   SLUG rename on the same tree moves every part with it
    echo "   │"
    jq -r '.moved[] | "   │  \(.slug)\n   │     \(.before)\n   │  ─▶ \(.after)"' <<<"$mv_verdict"
    echo ""
    return 0
  fi

  # build the payload with jq, so every value is escaped by the tool
  # rather than by hand. an empty optional becomes null, never ""
  #
  # 🔴 .why an EMPTY ref array must arrive as `null`, never as `[]`
  #
  #   `pickRefs` parts "not given" from "given" by Array.isArray — and
  #   `[]` IS an array. so a call that set only a cash figure sent `[]`
  #   and WIPED the refs, in violation of this store's most-stated
  #   invariant: an omission PRESERVES, and only `none` clears.
  #
  #   ⚠️ `with_entries(select(.value != ""))` does NOT catch it. `[] != ""`
  #   is true in jq, so the key survives the filter. the guard has to sit
  #   here, at the shape.
  #
  #   measured 2026-09-13: three rows lost their crossrefs on a call that
  #   named no ref at all — two of them verified 🟢 by `eco.seed` one round
  #   earlier. and the render then read `task: —`, which is exactly what an
  #   absent record looks like, so the loss left no trace to notice
  local payload
  payload="$(jq -n -c \
    --arg slug "$SLUG" --arg kind "$KIND" \
    --arg sev "$SEV" --arg urg "$URG" \
    --arg what "$WHAT" --arg why "$WHY" \
    --arg gainCash "$GAIN_CASH" --arg gainPer "$GAIN_PER" \
    --arg gainDuration "$GAIN_FOR" --arg gainTime "$GAIN_TIME" \
    --arg costCash "$COST_CASH" --arg costPer "$COST_PER" \
    --arg costDuration "$COST_FOR" --arg costTime "$COST_TIME" \
    --arg asks "$ASKS" --argjson ask "$ASK" \
    --arg status "$STATUS" --argjson ready "$READY" \
    --arg sponsored "$SPONSORED" \
    --arg sponsorWho "$SPONSOR_WHO" --arg sponsorWhy "$SPONSOR_WHY" \
    --arg sponsorSince "$SPONSOR_SINCE" --arg sponsorUntil "$SPONSOR_UNTIL" \
    --argjson refTask "$(__eco_json_array "${REF_TASK[@]+"${REF_TASK[@]}"}")" \
    --argjson refTree "$(__eco_json_array "${REF_TREE[@]+"${REF_TREE[@]}"}")" \
    --argjson gates "$(__eco_json_array "${GATES[@]+"${GATES[@]}"}")" \
    --argjson gatedBy "$(__eco_json_array "${GATED_BY[@]+"${GATED_BY[@]}"}")" \
    --argjson surgoal "$(__eco_json_array "${SURGOAL[@]+"${SURGOAL[@]}"}")" \
    '{ slug: $slug, kind: $kind, sev: $sev, urg: $urg, what: $what,
       status: $status, ready: $ready,
       sponsored: (if $sponsored == "" then null else ($sponsored == "true") end),
       sponsorWho: $sponsorWho, sponsorWhy: $sponsorWhy,
       sponsorSince: $sponsorSince, sponsorUntil: $sponsorUntil,
       why: (if $why == "" then null else $why end),
       gainCash: $gainCash, gainPer: $gainPer,
       gainDuration: $gainDuration, gainTime: $gainTime,
       costCash: $costCash, costPer: $costPer,
       costDuration: $costDuration, costTime: $costTime,
       asks: (if $asks == "" then null else ($asks | tonumber) end), ask: $ask,
       refTask: (if ($refTask | length) == 0 then null else $refTask end),
       refTree: (if ($refTree | length) == 0 then null else $refTree end),
       gates: (if ($gates | length) == 0 then null else $gates end),
       gatedBy: (if ($gatedBy | length) == 0 then null else $gatedBy end),
       surgoal: (if ($surgoal | length) == 0 then null else $surgoal end) }
     | with_entries(select(.value != ""))')" || {
    echo "💥 eco.priority: could not build the payload" >&2
    return 1
  }

  local verdict rc
  verdict="$(__eco_db "$verb" "$payload")"; rc=$?

  if [[ $rc -ne 0 ]]; then
    # the store already named the fix on stderr; add the recovery line
    case "$rc" in
      2) echo "   └─ fix: rhx eco.priority --help" >&2 ;;
      *) echo "   └─ the store malfunctioned — db: $(__eco_db_shown)" >&2 ;;
    esac
    return $rc
  fi

  if [[ "$OUTPUT" == "json" ]]; then
    echo "$verdict"
    return 0
  fi

  echo "🦫 chew on it"
  echo ""

  case "$verb" in
    set)
      local wrote; wrote="$(jq -r '.wrote' <<<"$verdict")"
      echo "🔦 eco.priority set --slug $SLUG"
      echo "   ├─ into: $(__eco_db_shown)"
      echo "   ├─ wrote: $wrote"
      echo "   └─ held"
      echo "   │"
      __eco_render_one "$(jq -c '.priority' <<<"$verdict")" "└─"
      echo ""

      # .what = the frequency prompt, on a crossed fibonacci rung
      # .why  = a measured ask count informs the human's urg; it never
      #         rewrites it. so this ASKS, and fires once per rung rather
      #         than on every set past it
      #
      # 🔴 every value below is read from the MERGED ROW, never from the
      #   CLI args. a partial set supplies only what it changes, so $SEV
      #   and $URG are empty on most calls — and this block once rendered
      #   "may have outgrown urg=" and handed back a paste-ready
      #   `--sev  --urg <urg>` that would have failed on the spot. a
      #   nudge that emits a broken command is worse than no nudge
      local crossed; crossed="$(jq -r '.askCrossed // "none"' <<<"$verdict")"
      if [[ "$crossed" != "none" ]]; then
        local count sev_held urg_held
        count="$(jq -r '.priority.quant.asks' <<<"$verdict")"
        sev_held="$(jq -r '.priority.opine.sev' <<<"$verdict")"
        urg_held="$(jq -r '.priority.opine.urg' <<<"$verdict")"
        echo "🪃 tail slap — $SLUG just hit rung $crossed ($count asks)"
        echo "   ├─ a priority this recurrent may have outgrown urg=$urg_held"
        echo "   └─ re-judge it, or leave it — the call is yours:"
        echo "      rhx eco.priority set --slug $SLUG --sev $sev_held --urg <urg>"
        echo ""
      fi

      echo "🦫 dam fine! $SLUG is $wrote"
      ;;
    get)
      # ROOTSTRUCT — the decomposition view: goals rolled up by root, one
      # node per path segment, rows attached where a goal sits at that path.
      #
      # 🔴 propagation is the store's owed job, not this render's
      #   (define.invariant.eco.gain-propagates-down-and-sums, bhuild#386). so a
      #   leaf with no own figure shows its nearest ANCESTOR's per-hour, marked
      #   `↑ … (whole)` — never stamped as its own. the invariant forbids a
      #   propagated figure rendered indistinguishably from a measured one, and
      #   the ↑ IS the mark that keeps them apart
      if [[ "$OUTPUT" == "rootstruct" ]]; then
        echo "🔦 eco.priority get --output rootstruct"
        echo "   ├─ from: $(__eco_db_shown)"
        echo "   └─ the decomposition — goals rolled up by root"
        echo ""
        # 🔴 it keys on `.slug`, which IS the goal uri
        #   it read `.goal` until 2026-09-21, and that column is retired. the
        #   failure was SILENT and total: `select(.goal != null)` kept zero
        #   rows, so `--output rootstruct` printed its header, its tip, and an
        #   empty board — exit 0, no error, and the one view a human reads most
        #   answered "there are no priorities" over a store of 100+
        jq -r '
          (.priorities | map(select(.slug != null))) as $ps
          | ($ps | map({ key: (.slug | sub("^[a-z]+://"; "")), value: . }) | from_entries) as $byp
          | ( [ $ps[] | (.slug | sub("^[a-z]+://"; "") | split("/"))
                | range(1; length + 1) as $i | (.[0:$i] | join("/")) ] | unique | sort ) as $paths
          # is this path the LAST child under its parent? drives └─ vs ├─
          | ( reduce $paths[] as $p ({};
                ($p | split("/") | .[0:-1] | join("/")) as $parent
                | . + { ($p): ( ( [ $paths[] | select( (split("/") | .[0:-1] | join("/")) == $parent ) ] | last ) == $p ) }
            ) ) as $islast
          | $paths[]
          | . as $p | ($p | split("/")) as $seg | ($byp[$p]) as $r
          # the tree PREFIX: one guide column per ancestor (│ when the ancestor
          # has a later peer, else blank), then this node own connector
          | ( [ range(0; ($seg | length - 1)) as $k
                | (if $islast[ ($seg[0:($k+1)] | join("/")) ] then "   " else "│  " end) ] | join("") ) as $guide
          | (if $islast[$p] then "└─ " else "├─ " end) as $conn
          | [ ($guide + $conn),
              $seg[-1],
              ($r != null),
              ($r.opine.sev // ""),
              ($r.opine.urg // ""),
              # ONE glyph per row, and it reads as a LIFECYCLE:
              #   🏔️ bigrock    a ROOT mainquest — snow-capped, the summit
              #   ⛰️ altrock    a ROOT sidequest — the same mountain, no snow
              #   🪨 rock       an OBJECTIVE, no tree and none prepped
              #   💧 seeded     prepped for a tree — a task queued, none sprouted
              #   🌲 sprouted   a tree stands, work not yet begun
              #   🌾 inflight   a clone is at work on it now
              #   🌊 done       it landed
              #   💤 held       parked on purpose
              #
              # 🔴 the ladder reads ROCK-then-TREE, and the discriminator is
              #    a TREE SLUG, never a status. verbatim, 2026-09-18:
              #    *"unless it has a tree slug, its a rock."*
              #
              # 🔴 .why a rock needed its own glyph at all — the family was
              #    ALL TREE, so a rock had to borrow one and the borrow lied:
              #
              #      💧 seeded    glossed as "a sprout candidate"
              #      🌾 inflight  "a clone is at work on THIS row"
              #
              #    measured 2026-09-18: 36 of 106 rows carry parts, and 34 of
              #    them rendered 💧 — so the store invited a reader to sprout
              #    `sandpine`, `ensell`, `decost`, and `waivers`. a revenue target
              #    is not a branch, and `🌾 signup-funnel-tune` claimed a clone
              #    sat on a row whose CHILD held the work
              #
              # ⚠️ so the axis is not merely cosmetic: the tree glyphs are a
              #    DISPATCH signal, and a rock that wears one is a false
              #    report a reader acts on
              #
              # 🔴 a rock is closed by FULFILLMENT of its target, never by a
              #    merge, so it has no sprouted rung and never earns 🌲. it
              #    still takes 🌊 and 💤, which are about the OBJECTIVE
              #    rather than about a branch
              #
              # 🟡 the two mountains are one metaphor at two heights: the snow
              #    marks the summit, which is what parts `bigrock` (what we
              #    COMMITTED to) from `altrock` (real work, off the main line).
              #    ⇒ the kind is read off the ROOT alone — a subrock names the
              #    root SLUG and never the root KIND, so a promotion is one
              #    field and no descendant is touched (readme, the goal a rock)
              #
              # ⚠️ NO APOSTROPHE anywhere in this block: it sits inside a
              #    single-quoted jq program, so one closes the string and bash
              #    then parses the rest of the jq as bash. the failure reads
              #    `syntax error near unexpected token elif` and names a line
              #    that is fine — it never names the quote that caused it
              #
              # 🔴 the lifecycle is ONE glyph, never a [phase][status] pair.
              #    two glyphs of ONE axis, over a tree thirty rows deep, is a
              #    wall of emoji a reader scans past — so the axis that
              #    matters gets hidden by the one that does not
              #
              # 🔴 the phase axis is FOLDED IN rather than dropped, because
              #    it carries exactly one fact `status` does not: a row that
              #    is enqueued and ALREADY HAS A TREE. measured 2026-09-14 —
              #    22 rows carry a tree ref and 16 of them are `enqueued`,
              #    so a glyph keyed on status alone loses the majority case
              #
              # ⚠️ the READY/GATED split is NOT on this axis. it carries real
              #    weight, so it lives where it is asked for rather than
              #    glanced at:
              #      `get --ready`   the filter that answers it directly
              #      `state:` line   "👋 ready" / "🪵 gated", in full prose
              #      `after:` line   which unfinished gate holds the row
              #    ⇒ a board says WHAT EXISTS; the rank says WHAT IS NEXT
              (if $r == null then ""
               # 🔴 a MOUNTAIN is keyed on the SCHEME, at ANY depth — never on
               #    the segment count. verbatim, 2026-09-18:
               #    *"if {big,alt}rock, always show mountain. only show :rock:
               #      for subrocks that arent trees | tasks"*
               #
               #    ⇒ so a `bigrock://sandpine/ensell/1klpm` is a PEAK ON A PEAK:
               #      a pillar big enough to be named as one, or a peak enroute
               #      to a peak. the scheme carries PROMINENCE, and prominence
               #      is a fact at every depth rather than a root-only one
               #
               # 🟡 it is not an overload of the word. `bigrock` names what we
               #    COMMITTED to and `altrock` the real work off the main line
               #    (readme) — one sense, read at two depths. at a root that
               #    sense happens to read as mainquest-vs-sidequest, because a
               #    root prominence IS its quest kind
               elif ($r.slug | startswith("bigrock://")) then "🏔️"
               elif ($r.slug | startswith("altrock://")) then "⛰️"
               # a TREE SLUG — the work has a branch, so it walks the tree rungs
               elif (($r.refTree // []) | length) > 0 then
                 (if $r.status == "inflight" then "🌾"
                  elif $r.status == "done" then "🌊"
                  elif $r.status == "held" then "💤"
                  else "🌲" end)
               # PREPPED for a tree — a task is queued and none sprouted yet.
               # ⚠️ this rung is why the test is not `refTree` alone: a seeded
               #   row is dispatch-ready, and to call it a rock would hide the
               #   39 rows a human could sprout today
               elif (($r.refTask // []) | length) > 0 then
                 (if $r.status == "done" then "🌊"
                  elif $r.status == "held" then "💤"
                  else "💧" end)
               # a ROCK — an objective, closed by fulfillment of its target
               elif $r.status == "done" then "🌊"
               elif $r.status == "held" then "💤"
               else "🪨" end),
              # 🔴 the KIND rides a SECOND glyph, and ONLY for a 🗜️ clamp
              #    this is an ORTHOGONAL axis, never a second lifecycle glyph:
              #    lifecycle says WHERE the row sits, kind says WHAT IT DOES
              #    to the problem. so the wall-of-emoji argument above does
              #    not reach it — that argument bounds two glyphs of ONE axis
              #
              # ⚠️ a 🔨 solve renders NO glyph, on purpose. a solve is the
              #    default and the goal; a clamp is the exception a reader
              #    must be able to spot. mark both and the mark stops to
              #    discriminate — "a CLAMPED problem reads as a CLOSED one"
              #    is the harm, and it is the clamp that must not hide
              (if ($r != null and $r.kind == "clamp") then " 🗜️" else "" end),
              ($r.quant.cashPerHour // ""),
              ( [ range(1; ($seg | length)) as $i
                  | $byp[($seg[0:$i] | join("/"))] | select(. != null)
                  | .quant.cashPerHour | select(. != null) ] | last // "" ),
              ($r.sponsored // false)
            ]
          # 🔴 join on US (\u001f), never a tab. bash `read` treats tab as
          #   WHITESPACE, so it collapses a run of tabs and DROPS an empty
          #   field — and a leaf with no own per-hour then reads its ancestor
          #   inherit value into the per-hour column, rendered as own. a
          #   non-whitespace separator preserves every empty field in place
          | map(tostring) | join("\u001f")' <<<"$verdict" \
        | while IFS=$'\037' read -r prefix label hasRow sev urg mark kindmark perHour inherit spon; do
            if [[ "$hasRow" == "true" ]]; then
              local val star suffix fire
              # a cashless node shows NO value — the rootstruct is the
              # decomposition view, so an absent figure is left blank rather
              # than marked ❔ (the ❔ flag lives in the flat view, where it
              # guards the ⚖️ column; here there is no such column to guard)
              if   [[ -n "$perHour" ]]; then val="$perHour/h"
              elif [[ -n "$inherit" ]]; then val="↑ $inherit/h (whole)"
              else val=""; fi
              # ⭐ = sponsored — a human authorized budget; leads the label
              star=""; [[ "$spon" == "true" ]] && star="⭐ "
              # 🔥 = a hotfix still alight — urg 1h, and not yet done. it leads
              # even the ⭐: budget says "a human paid", fire says "it burns
              # NOW", and only the second one cannot wait
              #
              # ⚠️ done is read off the LIFECYCLE GLYPH here rather than off
              #   status, because status is not carried into this row. 🌊 is
              #   the one done-glyph across every rung of the ladder above, so
              #   the read holds — but it is a JOIN on a rendered value, and a
              #   new done-glyph would silently leave the fire alight
              fire=""; [[ "$urg" == "1h" && "$mark" != "🌊" ]] && fire="🔥 "
              # the ONE lifecycle glyph leads the node, then ⭐, then label; the
              # value is appended only when present, so no gap trails the row
              suffix=""; [[ -n "$val" ]] && suffix="  ${val}"
              # 🗜️ rides the OPINE, never the label — the kind qualifies the
              # rank ("p1 in a week, and it only bounds the bleed"), so it
              # sits where the rank is read rather than where the name is
              echo "   ${prefix}${mark} ${fire}${star}${label} — ${sev}·${urg}${kindmark}${suffix}"
            else
              echo "   ${prefix}${label}/"
            fi
          done
        echo ""
        echo "🦫 dam fine! the rootstruct"
        __eco_tip_forward_verbatim
        return 0
      fi

      local count; count="$(jq -r '.count' <<<"$verdict")"
      echo "🔦 eco.priority get"
      echo "   ├─ from: $(__eco_db_shown)"
      if [[ "$READY" == "true" ]]; then
        echo "   ├─ filter: --ready — enqueued, with no unfinished gate before it"
      fi
      echo "   ├─ found: $count"
      if [[ "$count" -eq 0 ]]; then
        # 🔴 an empty --ready set is a DIFFERENT answer from an empty store,
        #   and the two must never render alike. "no row is startable" means
        #   the timeline has work in it that a gate holds shut — a state that
        #   calls for a status update, never for a new priority. to offer
        #   `set one` there would answer a question nobody asked
        if [[ "$READY" == "true" ]]; then
          echo "   └─ not one row is startable"
          echo ""
          echo "🦫 tail slap — every enqueued row waits on a gate, or none is enqueued"
          echo "   ├─ see what holds them:  rhx eco.priority get"
          echo "   └─ open a gate by the finish of its gater:"
          echo "      rhx eco.priority set --slug <gater> --status done"
          return 0
        fi
        echo "   └─ the rank is empty"
        echo ""
        echo "🦫 crickets... set one:"
        echo "   ├─ rhx eco.priority set --slug <slug> --what '<what>' \\"
        echo "   │       --sev <p0|p1|p2|p3|p5> --urg <1d|3d|1w|1m>"
        echo "   └─ ⚖️ both are YOUR call — no default is offered on purpose"
        return 0
      fi
      # ⚠️ `├─`, never `└─` — the ranked rows below hang at this same depth,
      #   so a `└─` here would claim to be the last child and then be
      #   followed by more (rule.require.treestruct-output)
      echo "   ├─ ranked by OPINE — severity, then how soon it expires"
      echo "   │"
      local i=0
      while IFS= read -r row; do
        i=$((i + 1))
        if [[ $i -eq $count ]]; then __eco_render_one "$row" "└─"; else __eco_render_one "$row" "├─"; fi
      done < <(jq -c '.priorities[]' <<<"$verdict")
      echo ""

      # .what = the legend, emitted only where a mark actually fired
      # .why  = a legend on every run is noise a reader learns to skip;
      #         one that appears beside a mark is read
      local flagged_freq flagged_climb flagged_blind
      flagged_freq="$(jq -r '[.priorities[] | select(.quant.askRung >= 3)] | length' <<<"$verdict")"
      flagged_climb="$(jq -r '[.priorities[] | select(.quantClimb != null)] | length' <<<"$verdict")"
      flagged_blind="$(jq -r '[.priorities[] | select(.quant.cashMeasured == false)] | length' <<<"$verdict")"

      if [[ "$flagged_freq" -gt 0 || "$flagged_climb" -gt 0 || "$flagged_blind" -gt 0 ]]; then
        echo "🔦 the quants have a word — they inform your opine, never overrule it"
        if [[ "$flagged_freq" -gt 0 ]]; then
          echo "   ├─ 🪃  asked 3+ times. recurrence may have outgrown its urg"
        fi
        if [[ "$flagged_climb" -gt 0 ]]; then
          echo "   ├─ ⚖️  cash per hour of work outranks the sev you gave it"
        fi
        if [[ "$flagged_blind" -gt 0 ]]; then
          echo "   ├─ ❔  $flagged_blind row(s) carry NO cash figure, so they can never"
          echo "   │     earn a ⚖️. a quiet flag there is an absence of measurement,"
          echo "   │     never a verdict of agreement"
        fi
        echo "   └─ re-judge, or leave it — the call is yours"
        echo ""
      fi

      echo "🦫 dam fine! $count in the rank"
      __eco_tip_forward_verbatim --rank
      ;;
    del)
      local dropped edges
      dropped="$(jq -r '.dropped' <<<"$verdict")"
      edges="$(jq -r '.gatesDropped' <<<"$verdict")"
      echo "🔦 eco.priority del --slug $SLUG"
      echo "   ├─ from: $(__eco_db_shown)"
      echo "   ├─ dropped: $dropped"
      # 🔴 reported, never silent. the edges go with the row (an orphan gate
      #   reads as SHUT forever), so a delete can quietly free rows that were
      #   held back — and a human has a right to know the timeline moved
      echo "   └─ gates unhooked: $edges"
      echo ""
      if [[ "$dropped" == "yes" ]]; then
        echo "🦫 timber! $SLUG is off the rank"
      else
        echo "🦫 already gone — $SLUG was absent, so naught changed"
      fi
      ;;
  esac

  return 0
}
