#!/usr/bin/env bash
######################################################################
# .what = record and rank what is worth the spend — set, get, del
#
# .why  = the fleet had instruments for the CURRENT STATE — crew.poll,
#         grove.saturation, crew.ledger, radio.task.pull — and not one
#         for WHAT MATTERS NEXT.
#
#         measured 2026-09-13: 511 open issues over four repos, 42 crews
#         with 0 merged, and a ~$300/mo cost bleed the human could name
#         out loud that appeared in no queue at all. the weekly cadence
#         meant to catch it (sandpine-notebook's
#         howto.strategy.weekly-reprioritize — one operator's cadence,
#         so it stays there) last ran 2026-06-05.
#
#         a queue with no rank orders itself by filename age. that is
#         how three dreams braided onto one `grepsafe` defect.
#
# .why `eco` = economy AND ecology, deliberately both. a priority ranks
#         what is worth the spend, and compute spent to re-derive
#         unranked work is power drawn and heat rejected as surely as it
#         is money. `eco` names the concept both words point at: the
#         cost of a choice, counted honestly.
#
# 🔴 .every field is a QUANT or an OPINE, and the two never mix
#
#         quant.{gain,cost,asks}   MEASURED — a number you would defend,
#                                  or one the store counted for you
#         opine.{sev,urg}          JUDGED — your claim, and the only
#                                  pair that sets the rank order
#
#         ⇒ a quant INFORMS an opine. it never overwrites one.
#
#         so `get` ranks by sev and urg alone, and raises a flag beside
#         any row whose evidence disagrees with your judgment. you
#         re-judge it, or you leave it. the store never decides.
#
#         ⇒ the full argument, its counter-argument, and what would
#           overturn it: define.invariant.eco.quant-informs-opine
#
# usage:
#   rhx eco.priority set --slug <goal-uri> --sev <sev> --urg <urg> --what <what>
#                        [--kind solve|clamp] [--why <why>]
#                        [--gain-cash <price>] [--gain-per <p>] [--gain-for <dur>]
#                        [--cost-cash <price>] [--cost-per <p>] [--cost-for <dur>]
#                        [--gain-time <work>] [--cost-time <work>]
#                        [--ref-task <ref>] [--ref-tree <ref>]
#                        [--status <s>] [--gates <slug>] [--gated-by <slug>]
#                        [--surgoal <goal-uri>]
#                        [--sponsor --sponsor-who <who> --sponsor-why <why>
#                          [--sponsor-since <ts>] [--sponsor-until <ts>]]
#                        [--unsponsor]
#   rhx eco.priority get [--slug <s>] [--sev <s>] [--urg <u>]
#                        [--status <s>] [--ready]
#                        [--sponsored | --unsponsored]
#                        [--ref-task <ref>] [--ref-tree <ref>] [--output json]
#   rhx eco.priority del --slug <slug>
#   rhx eco.priority goal.mv --from <goal-uri> --to <goal-uri>
#   rhx eco.priority --help
#
# args:
#   --slug        the natural key, AND the goal uri. one slug, one priority —
#                 set is an upsert
#
# 🔴 .a PRIORITY **IS** a GOAL — so the uri IS the slug, and there is no --goal
#
#                   --slug 'subrock://rhachet/entool/route-efficiency/boot-token-budget'
#
#                 a bare name beside a uri whose leaf repeats it is two names
#                 for one concept, and a second name is a synonym that drifts.
#
#                 ⚠️ `--goal` is REFUSED outright, on set and on get alike, and
#                 the refusal names the uri to pass instead. it is not dropped
#                 in silence — a dropped filter would answer off the whole
#                 store and read as a scoped result.
#
#                 three kinds, closed set:
#                   bigrock://<root>          🪨 the MAINQUEST — what we
#                                             committed to. few, on purpose:
#                                             the big rocks go in first, or
#                                             they never fit at all
#                   altrock://<root>          🪶 the SIDEQUEST — real work,
#                                             worth the spend, off the main
#                                             line. the sand that fills the
#                                             gaps between the rocks
#                   subrock://<root>/<path>   🧩 a DECOMPOSITION of a root
#                                             rock, nested as deep as needed
#
#                 e.g. 'bigrock://sandpine.decost'
#                      'altrock://dev-ergonomics'
#                      'subrock://sandpine.decost/acu-tune/query-audit'
#
#                 `get --slug <uri>` ROLLS UP — it answers the question a flat
#                 queue cannot: "do we actually move the objective we said
#                 mattered?" three rows that each read p1 may serve one
#                 objective or three, and a list hides which.
#                 ⇒ it is also the one axis that can promote a row a cash
#                   figure would demote — a cheap row that unblocks two
#                   expensive ones earns its place through the goal
#
# 🔴 .a row with its OWN TREE BORROWS the tree's name as its leaf
#
#                 a tree is one branch and one pr, so the tree's name is
#                 ALREADY that row's name. coin a second and a grep for the
#                 branch finds no row, and a grep for the row finds no branch.
#
#                   --slug 'subrock://rhachet/entool/route-efficiency/rhachet-brains-fireworksai.beav.fix-prompt-cache-affinity'
#                           └─ the leaf IS the --ref-tree
#
#                 ⇒ read the name off the ledger: `rhx git.crew.ledger`
#                 ⇒ a row with NO branch of its own is a CONTAINER — it takes a
#                   short leaf, and no --ref-tree
#
#   --kind        what this goal DOES to the problem it aims at. optional,
#                 and a closed set of two:
#                   solve   🔨 after it lands the problem is GONE. it
#                              attacks the RATE, so the bleed stops
#                   clamp   🗜️  after it lands the problem is BOUNDED. it
#                              truncates the WINDOW, so the bleed
#                              continues, capped
#
#                 the test, asked at write time: "after this lands, is the
#                 problem GONE, or merely BOUNDED?" a loss is
#                 `rate x window` — the discriminator is WHICH TERM you
#                 moved, never how far. 🟡 "it reduces the cost a lot" is a
#                 SOLVE; a partial repair still attacks the rate.
#
# 🔴 .why a clamp earns a STORED column rather than a note in --why
#                 a CLAMPED problem reads as a CLOSED one. the alert ships,
#                 the row goes done, the dashboard is green — and the waste
#                 is still there, at exactly the rate it was, because the
#                 solve was never scheduled. the kind is what makes that
#                 state queryable rather than tribal.
#                 ⇒ and a clamp is cheap, so it almost always wins on
#                   gain-per-cost. that is usually RIGHT — take the bound
#                   first, buy the time, then schedule the repair. but a
#                   rank that cannot see the kind stacks clamp on clamp at
#                   the top and never surfaces the solve underneath.
#
#                 a clamp is a PEER of its solve, never a part of it: both
#                 are parts of the PROBLEM, which is the whole. a part
#                 gates its whole, and a clamp gates naught.
#
#                 ⚠️ NULL is legal and means "aims at no problem" — a root,
#                 a decomposition node, a feature. a forced third word
#                 would be a lie the cost rollup then sums.
#                 ⇒ define.eco.solve-vs-clamp
#
# 🔴 .THE INVARIANT — a subrock names the root's SLUG, never its KIND
#                 a root rock is EXPECTED to flip. a sidequest that earns
#                 the main line becomes a bigrock; a mainquest we stop to
#                 defend becomes an altrock. that promotion is ONE ROW,
#                 ONE FIELD — and every subrock beneath it is untouched at
#                 any depth, because not one of them ever claimed which
#                 kind their root was. encode the kind in the child and
#                 the same promotion costs a rewrite of the whole tree.
#                 ⇒ `goalRoot` rides derived on every row, and reads the
#                   same from the root and every descendant, whatever kind
#                   the root wears today. that is the TRACE.
#
# 🔴 .a FILTER ROLLS UP — the goal, plus every subrock beneath it
#                 a decomposition that does not roll up is no
#                 decomposition. an exact match on a bigrock returns the
#                 root alone and omits every row that does the work, while
#                 it reports a count that reads complete. and the rollup
#                 keys on the ROOT SLUG, never the scheme — a scheme-keyed
#                 match would break on the one edit it must survive.
#
#                 🔴 a BARE slug is refused, on set and on filter alike. a
#                 bare value records no KIND, and a column that holds both
#                 shapes can never say whether a bare one IS a bigrock or
#                 merely never said. a root takes no path; a subrock
#                 requires one.
#
# 🔴 .THE FOREIGN KEY — a SURGOAL must be declared before its part
#                 a subrock claims "this is a part of <the goal one rung
#                 up>". that claim is CHECKED: if no row declares the
#                 surgoal, the write is refused. so you declare a tree
#                 top-down, root first.
#
#                   rhx eco.priority set --slug 'bigrock://sandpine' ...
#                   rhx eco.priority set --slug 'subrock://sandpine/decost' ...
#                   rhx eco.priority set --slug 'subrock://sandpine/decost/twilio' ...
#
#                 ⚠️ a goal is not a label above a row — the row IS the goal.
#                 so the root above is a real row with a real sev and urg.
#
#                 .why it is strict: the shape check alone is not
#                 integrity. `subrock://typo-in-root/x` passes the regex
#                 cleanly, lands in a tree of its own, falls out of every
#                 rollup, gates nobody, and reads startable
#                 forever. the FK is the only instrument that can name it.
#
#                 ⇒ the same reference guards the OTHER end: a `set` that
#                   MOVES a goal, and a `del`, are both refused when the
#                   row is the last declarant of a goal that has parts.
#                   that is what makes `goal.mv` necessary — see below.
#
#   goal.mv       RENAME or REPARENT a goal, and carry its whole subtree
#                 --from <goal-uri>  --to <goal-uri>
#
#                 .why it is a separate verb rather than a flag on set
#                   under a strict FK a rename is unreachable one row at a
#                   time: retype the parent and every descendant is
#                   stranded; retype the children first and each is refused
#                   for a parent that does not exist yet. there is no order
#                   that works, because a rename is not a property of a ROW
#                   — it is a property of a SUBTREE.
#
#                   rhx eco.priority goal.mv --from 'subrock://sandpine/twilio' \
#                                            --to   'subrock://sandpine/sms-tune'
#
#                 ⚠️ a root KIND flip is ALSO a goal.mv — and it still moves
#                   exactly ONE row, however deep the tree, because a
#                   subrock names the root's SLUG and never its KIND:
#
#                   rhx eco.priority goal.mv --from 'altrock://rhachet' --to 'bigrock://rhachet'
#
#                 it refuses: a --from nobody declares · a --to inside its
#                 own subtree · a --to already in use (that is a MERGE, and
#                 no second goal.mv can undo it) · a --to whose own surgoal
#                 is undeclared
#                 🔴 the KIND is a LENS, never a sort key. a p1 altrock
#                 outranks a p2 bigrock, and that is correct — sev already
#                 asks "how bad if unfixed", so a human who graded a
#                 sidequest p1 has said it matters that much.
#                 ⇒ the whole shape: define.eco.rock-lifecycle-and-treestruct
#   --what        the outcome, in your own words
#   --why         the reason it is ranked there — the field that outlives you
#                 🔴 it must name a CELL of the 3x2 cost-gain matrix: time,
#                 cash, or rank, either direction. "it is broken" restates
#                 the --what and records no basis; "no revenue, so not p1"
#                 tests ONE ROW OF THREE and discards the two the matrix
#                 exists to defend (rule.require.a-gain-cell-behind-every-sev,
#                 rule.forbid.sev-from-cash-alone)
#
#   OPINE — your claim, and 🔴 only a human may author it
#   --sev         p0 | p1 | p2 | p3 | p5     how bad it is if unfixed
#   --urg         1h | 1d | 3d | 1w | 1m     by when it stops to be worth it
#
# 🔥 .1h is the SHARP end, and it means hotfix
#                 drop it all — prod bleeds while you read this. a row at
#                 1h that is not yet `done` renders 🔥, ahead of even the
#                 ⭐, and the fire GOES OUT the moment its status is done.
#
#                 ⚠️ the glyph is DERIVED from urg + status, never stored.
#                 a `hotfix` column would be a second name for a fact the
#                 opine already carries, and a second name drifts.
#
#                 🔴 .why the ladder reaches down here at all: the
#                 widened-gap argument cuts both ways. precision is real
#                 at the sharp end and imaginary at the dull one — so the
#                 ladder is right to stop at 1m, and was wrong to stop at
#                 1d, where a live crash loop and a day's work graded the
#                 same and the store could not say which a human meant.
#                 ⇒ neither carries a default and neither is ever suggested.
#                   a clone that fills one has decided on your behalf, and the
#                   record then carries a judgment indistinguishable from
#                   yours (rule.forbid.fabricated-opines)
#
#   QUANT — a measured or estimated number
#   --gain-cash   iso-price words, e.g. 'USD 150.00'
#   --gain-per    once | 1d | 1w | 1mo | 1y  how OFTEN   (default: once)
#   --gain-for    how LONG it runs, e.g. '3mo' or '5y'   (default: 1y)
#   --cost-cash   iso-price words — what the fix itself costs in money
#   --cost-per    once | 1d | 1w | 1mo | 1y  how OFTEN   (default: once)
#   --cost-for    how LONG it runs, e.g. '5y'            (default: 1y)
#   --gain-time   work the fix GIVES BACK   a fibonacci rung (below)
#   --cost-time   the work to do it         a fibonacci rung (below)
#   --ask         record ONE more reach for this priority (+1)
#   --asks <n>    state the count outright — a repair, or a human who
#                 already knows the true number
#
# .the work ladder — the NUMBER is the rung, the UNIT is yours
#
#   1h 2h 3h 5h 8h 13h 21h 34h 55h 89h   ·   1d 2d 3d 5d 8d 13d 21d …
#
#   🔴 fibonacci, for the same reason sev is: nobody can tell a 4h task
#   from a 5h task before they start, so a scale that offers both asks
#   for a discrimination no human can make — and then carries the answer
#   into cash-per-hour, where it reads as a measurement. the gaps widen
#   because the uncertainty widens.
#
#   ⚠️ 1d = 8h, so '8h' and '1d' are the same duration in two spellings.
#   both are accepted and neither is rewritten.
#
# 🔴 .asks counts a HUMAN's reach, and an EDIT is not a reach
#
#   an omitted --ask PRESERVES the count, exactly as every other field does.
#   a climb on every write would over-count: the caller is usually a CLONE, so
#   three edits made on one human's behalf read as three human asks — and fire
#   a 🪃 at a priority nobody has asked for twice.
#
#   --ref-task    repeatable — the seeded radio issue(s) that serve it
#   --ref-tree    repeatable — the live tree(s) that work it
#   --output      tree (default) | json
#
#   ORCHESTRATION — what must come first, and what has already happened
#
#   --status      enqueued | inflight | done | held   (default: enqueued)
#                   enqueued  ranked, nobody on it
#                   inflight  a tree or a clone is on it now
#                   done      it landed. ⇒ this is what OPENS a gate
#                   held      parked on purpose — waits on a human, a date,
#                             a decision. NOT enqueued, so it never reads
#                             as ready, and it still gates what follows it
#
#                 🟡 `held` rather than `blocked`, because `blocked` is
#                   taken twice already — a review severity, and the
#                   driver's `--as blocked`
#
#   --gates       repeatable — slug(s) this priority must PRECEDE
#   --gated-by    repeatable — slug(s) that must precede THIS one
#   --ready       on get — only rows that are enqueued with no unfinished
#                 gate before them. "what can i start right now"
#
#   SPONSORSHIP — a human authorized their BUDGET on this row
#
#   --sponsor     open a sponsorship. the row renders ⭐ and TOPS the rank,
#                 above every opine — prioritized says the org wants it,
#                 sponsored says a human paid for it NOW
#                 (define.prioritized-vs-sponsored)
#   --unsponsor   CLOSE it — until = now. it never deletes the episode, so
#                 the record still says who funded it and for how long
#   --sponsor-who MANDATORY on --sponsor — the human who authorized it
#   --sponsor-why MANDATORY on --sponsor — why they committed the budget.
#                 same matrix cell rule as --why: time, cash, or rank
#   --sponsor-since  when it opened   (default: now)
#   --sponsor-until  when it LAPSES   (default: OPEN-ENDED)
#
#   --sponsored   on get — only rows sponsored right now
#   --unsponsored on get — only rows that are NOT
#
# 🔴 .a sponsorship is an EPISODE, not a flag — and who/why are REFUSED
#   if absent
#                 a sponsorship nobody signed cannot be questioned, renewed,
#                 or revoked: no reader can tell a live commitment from a
#                 stale one, and no human can be asked whether they still
#                 mean it. so the two are mandatory at the door rather than
#                 owed later — 6 of the 11 rows carried over from the
#                 retired boolean flag still have neither, and each is a
#                 ⭐ that outranks every graded row on nobody's authority.
#
#                 ⚠️ --sponsor-until is OPTIONAL and an omission means
#                 OPEN-ENDED, never unknown. a bounded sponsorship LAPSES
#                 on its own and drops out of `--sponsored` the day it does,
#                 which is the whole point of a window.
#
# ⚠️ .the VERB and the NOUN are one letter apart, on purpose
#                 `--sponsor` ACTS (on set) · `--sponsored` ASKS (on get).
#                 one label, one sense — and the filter reads the DERIVED
#                 flag, so a lapsed row leaves the funded set by itself
#
#   ⇒ `--gates`/`--gated-by` REPLACE that side, exactly as the refs do:
#     an omitted flag preserves, and `none` clears
#
#   --surgoal     repeatable — an EXTRA surgoal, beyond the one the row's
#                 own uri path already names
#
# 🔴 .the model is a DAG, and `--surgoal` is what makes it one
#
#   a goal uri carries ONE path, so it names ONE parent chain — a TREE. and
#   a tree cannot express the highest-value shape there is:
#
#     subrock://sandpine/decost/acu-tune   also serves   bigrock://dev-speed
#
#   "N birds, one stone" has nowhere to live in a path. so the extra parent
#   is an EDGE, stored once, and it points UP:
#
#     rhx eco.priority set --slug acu-tune --surgoal 'bigrock://dev-speed'
#
#   ⇒ a surgoal edge runs goal → goal, and a gate runs row → row. those were
#     two different keys until 2026-09-21, when the row's `goal` column was
#     retired and the SLUG became the uri — so the two now key on the same
#     value, and the pair stays distinct by the DIRECTION each edge runs
#     rather than by the column each one read
#
#   ⚠️ it REPLACES the extra-parent set, exactly as `--gates` does: an
#     omitted flag preserves, `none` clears. so state the set you want
#
#   it refuses: a goal that is its own surgoal · a surgoal no row declares
#   (the same FK the path parent obeys) · a surgoal the PATH already implies
#   (a second home for one fact) · an INVERTED edge (a whole named as the
#   part of its own part) · an edge that would close a CYCLE — gain sums UP
#   through parents, so a cycle inflates both goals without bound
#
# 🟡 .the flag is `--surgoal`, and `--serves` is a forbidden synonym
#   `surgoal` is the declared canonical term for this exact relation
#   (term=goal.surgoal), and a cli is the contract
#   rule.forbid.domain-term-synonyms grades "above all". `serves` is the
#   same relation said as a verb — a synonym in a contract, which that rule
#   forbids.
#
# 🔴 .a GOAL and a GATE are ORTHOGONAL — two relations over the same rows
#
#   the uri PATH says what a row is PART OF     decomposition, a tree
#   --gates says what must come FIRST           orchestration, a timeline
#
#   a piece is not a prerequisite. `paint` is part of a house and gates
#   naught; `walls` gate `roof` and neither is part of the other. so a
#   gate crosses branches of the rock tree freely, and a path cannot
#   express one at all.
#
#   ⇒ the trap that hides this: pick a row that is BOTH — a waste-audit
#     that is a piece of `sms-tune` AND gates it — and the two edges
#     land on one pair, so they read as one relationship. they are not.
#     see define.eco.decomposition-vs-orchestration
#
# ⚠️ .a CYCLE is refused at write, never detected at read
#   A gates B gates C gates A reads fine at every step, and yields a set
#   where no row is ever ready and no error ever fires. so the store
#   refuses the edge that would close the loop, and names the path
#   (rule.prefer.prevent-over-correct).
#
# 🔴 .PER is how often · FOR is how long — and EACH SIDE owns its own
#
#   --gain-cash 'USD 150.00' --gain-per 1mo --gain-for 3mo  →  USD 450.00
#   --cost-cash 'USD 40.00'  --cost-per 1mo --cost-for 5y   →  USD 2400.00
#                                                    ⇒ net    USD -1950.00
#
#   a period alone cannot be totalled: 'USD 150.00' per 1mo is worth
#   USD 450.00 over three months and USD 9000.00 over five years, and no
#   figure derived from the rate alone can tell those apart.
#
#   ⚠️ and the two sides run for DIFFERENT lengths, which is often the
#   whole verdict. one shared window cannot state the row above at all —
#   forced onto 5y it invents 57 months of gain nobody gets; forced onto
#   3mo it forgives 57 months of spend somebody pays. no shared window is
#   owed, because the net subtracts TOTALS rather than rates.
#
#   ⇒ the rank signal is NET: (gain total - cost total) / hours of work. a
#     gross figure would put an USD 1800 win that spends USD 1700 of
#     vendor cash above an USD 500 win that spends naught. a cost with no
#     gain nets NEGATIVE, which sorts it to the bottom — as it should
#
# 🔴 .an omitted field PRESERVES. the sentinel `none` CLEARS
#
#   rhx eco.priority set --slug svc-lessons-acu-floor
#      └─ "this came up again" — asks 1 → 2, and the gain, cost, why, and
#         refs all survive. this is the natural, most frequent call
#
#   rhx eco.priority set --slug svc-lessons-acu-floor --gain-cash none
#      └─ the cash is gone, and its orphaned --gain-per resets to `once`
#
#   ⇒ a full-field overwrite here would delete the whole QUANT family on
#     the cheapest call in the tool — the very half that exists to inform
#     an opine. `UPDATE SET a = 1` has never nulled `b`, and neither does
#     this. a NEW priority owes --sev --urg --what; an extant one owes
#     only its slug
#
# .the three flags `get` raises — and each ASKS, never decides
#
#   🪃      asks crossed fibonacci rung 3+. recurrence may have outgrown
#           your --urg. it fires ONCE per rung, never on every set past it
#
#   ⚖️+N    the row climbs N>=2 places when re-sorted by cash per hour of
#           work — so the evidence outranks the --sev you gave it.
#           🔴 check --gain-for and --cost-for BEFORE you re-judge: a
#           habit-typed 1y on a 3mo gain inflates the total fourfold, and
#           the flag then measures your typo rather than your judgment
#
#   ❔      the row carries NO cash figure, so it can never enter the cash
#           rank and can never earn a ⚖️. 🔴 without this flag, its quiet
#           ⚖️ column would read as "measured, and it agrees" when it
#           means "never measured" — and that asymmetry only ever
#           promotes CASH work, which is the exact undervalue
#           define.cost-gain-matrix exists to prevent.
#           ⇒ it demands no figure. NEVER invent one: a fabricated number
#             is indistinguishable from a measured one once it is stored
#
#   ⇒ how to act on each, in order: howto.read-eco-priority-flags
#
# 🟢 .the sev scale is FIBONACCI — 0, 1, 2, 3, 5 — which is why `p4` is
#         absent: 4 is not in the sequence. ⇒ do NOT "repair" the gap.
#
#         a scale whose gaps widen refuses false precision by
#         construction, the same way agile story points do. p0 vs p1
#         ("drop it all" vs "today") is a distinction a human can
#         defend; p3 vs a would-be p4 is a distinction nobody can.
#
#         `asks` climbs the same ladder — 1 2 3 5 8 13 — for the same
#         reason. a crossed rung PROMPTS you to re-judge urg; it never
#         rewrites urg itself, and it fires once per rung.
#
# example:
#   rhx eco.priority set --slug svc-lessons-acu-floor \
#     --sev <p0|p1|p2|p3|p5> --urg <1d|3d|1w|1m> \
#     --what 'a query over-ramps the min ACU floor on svc-lessons' \
#     --why  'gain.cash — it bleeds every month. gain.rank — it is named out
#             loud and sits in no queue, which costs trust in the queue' \
#     --gain-cash 'USD 150.00' --gain-per 1mo --gain-for 2y --cost-time 5h
#
#         🔴 sev and urg carry NO default and no suggested value, on
#         purpose. they are the one part of the record only a human may
#         author (rule.forbid.fabricated-opines), and a fibonacci ladder
#         whose rows all start at one rung is no ladder.
#
#         🔴 --why must name a CELL of the 3x2 cost-gain matrix — time,
#         cash, or rank, either direction. "it is broken" restates the
#         --what and records no basis; "no revenue, so not p1" tests one
#         row of three (rule.require.a-gain-cell-behind-every-sev,
#         rule.forbid.sev-from-cash-alone).
#
# 🔴 .the store is `.eco/priority.csv`. the db is a CACHE
#
#         `.eco/priority.db` is sqlite, per-repo — the way .meter/ and .route/
#         already are — because a flat markdown queue cannot answer "every p1
#         due this week" or "is this already caught?", and the second is what
#         lets a braid form.
#
#         but a sqlite file cannot be reviewed (`Binary files differ`), cannot
#         be merged (git resolves to one side and drops the other branch's rows
#         in silence), and rewrites 56K on every single-field edit. so the CSV
#         is committed and the binary is ignored.
#
#         ⚠️ delete `priority.db` whenever you like — the next call rebuilds it
#         from the csv. do NOT delete the csv.
#         ⇒ define.invariant.eco.the-csv-is-truth-the-db-is-a-cache
#
# .ECOWORK_DB = point any call at another store
#
#         env var, not a flag — the path is resolved once, at the boundary
#
#           ECOWORK_DB=/tmp/check/priority.db rhx eco.priority get
#
#         🔴 .why it is worth a line in --help: this is the ONLY way to verify
#         the invariant's central claim by hand. "the csv can rebuild the db"
#         is checkable exactly one way — copy the committed text somewhere
#         empty, point a read at it, and watch the store come back. left
#         undocumented, that check is reachable only by a reader of the source,
#         and the claim rests on a test suite alone.
#
#         ⚠️ an unknown flag is REFUSED outright — `--db` is not taken, and a
#         silently dropped one would answer off the LIVE store while the header
#         named a path it was never pointed at.
#
# guarantee:
#   - set is an upsert: one slug, one row, a re-run adds no duplicate
#   - set is PARTIAL: an omission preserves, `none` clears
#   - del is idempotent: an absent slug reports and exits 0
#   - a --what / --why carries arbitrary prose safely (stdin, never argv)
#   - cash arithmetic runs in integer cents, never a float
#   - a cross-currency gain/cost pair is REFUSED, never summed — this
#     store holds no fx rate, and a guessed one poisons every net
#   - exit 0 = ok, 1 = malfunction, 2 = constraint
######################################################################

set -uo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/ecowork.sh"

# .why the help check runs BEFORE the arg sweep
#   a --help that falls through to the verb check reports "a verb is
#   required" and exits 2 — a true statement, and the wrong answer to
#   the question asked (rule.require.help-on-demand)
#
# .why the header is bound by its DIVIDERS and not by a line range
#   a `sed -n '2,96p'` is correct until the very next edit to the header,
#   and then it truncates the help silently — which is the worst shape a
#   defect can take in the one surface a lost human reaches for. awk
#   prints what sits between the first two ###### rules, so the help
#   cannot drift from the header it quotes
for arg in "$@"; do
  if [[ "$arg" == "--help" || "$arg" == "-h" ]]; then
    awk '/^#####+$/ { seen++; next } seen == 1' "$0" | sed 's/^# \{0,1\}//'
    exit 0
  fi
done

# .why the rhx flags are stripped here rather than in the lib
#   rhx injects --skill/--repo/--role into every call. the lib is also
#   sourced by tests, which pass no such flags, so the strip belongs at
#   the boundary that actually sees them
declare -a ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skill|--repo|--role) shift 2 ;;
    *) ARGS+=("$1"); shift ;;
  esac
done

eco.priority "${ARGS[@]+"${ARGS[@]}"}"
