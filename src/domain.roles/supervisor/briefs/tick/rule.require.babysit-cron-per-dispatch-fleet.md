# rule.require.babysit-cron-per-dispatch-fleet

## .what

whenever you have one or more live dispatchees (mechanic ducts), keep ONE cron
that fires every ~15 min and reminds you to babysit EACH of them. one omnibus
cron for the whole fleet — not one per tree.

## .why

a dispatched mechanic runs in its own claude session inside a duct. its
permission prompts and queued messages fire against *its* keyboard, which no
human watches. without a periodic sweep:

- safe read-only prompts (git status, grep, test runs) stall forever
- typed decisions sit unsent in the Ink box (the submit quirk)
- a mechanic that finished verified work never gets told "release into prod"
- the human becomes the blocker on work that needed no human

a single repeat reminder makes the supervisor re-derive the live fleet every
tick and act — so the human stays free for the real gates (vision approval,
commit quota, release auth) and no safe work stalls silently.

**one omnibus cron, never one-per-tree.** per-tree crons collide on minute marks
and outlive the ducts they watch. a fleet-wide cron cannot reference a dead tree,
because it never hardcodes the fleet — `git.crew.poll` derives it every run.

## .the lever

```
CronCreate:
  cron: "9,24,39,54 * * * *"   # every ~15 min, OFF the :00/:30 marks
  recurring: true
  prompt: |
    BABYSIT-ALL tick — the procedure is howto.run-a-babysit-tick; read it
    if any step below is unclear, and follow its enforcement.

    run `rhx git.grove.saturation` FIRST — the shared resource, before its
    members. on a 🔴 lifetime cpu stall, halt sprouts this tick and fell what
    `rhx git.crew.poll --fellable` names — that flag is on the CREW poll,
    never on saturation (rule.require.bound-grove-concurrency-by-saturation).
    ⇒ 0 fellable on a 🔴 grove is rung 5 of that rule's ladder: an undersized
    grove is a PROVISION decision for the human, never a dispatch one.
    🔴 a halted sprout is NOT cancelled work — author its wish into
    src/stream/ and SEED it, then surface the provision levers
    (rule.always.seed-when-the-grove-is-saturated). a wish costs naught to
    write and evaporates if you merely say it. ⚠️ a blocked `radio.uses`
    stops the PUSH, never the authorship — the file is the queue entry.

    ⚠️ on 🔴 cpu WITH a full run queue, look for a runaway BEFORE you fell a
    single tree: `rhx git.grove.prune <grove> --process nvim` (plan; kills
    naught). nvim is the known repeat offender — 11 once held ~43% cpu and
    ~6.2G ram on a 4-core grove, and the prune fixed what a fell could not.
    a fell gives up real work; a prune gives up naught
    (rule.require.prune-runaways-before-you-blame-the-grove). a high load
    beside an EMPTY runq is the memory axis — do NOT prune that one.

    then run `rhx git.crew.poll --live --stones`, and run no other call
    before it. ONE call for the whole fleet, derived live. never a loop of
    crew.read (rule.require.bulk-over-byhand — blocker), and never
    `duct.poll` — the crew poll calls it for you. read the two tally lines:
      🗿 stones — 🙋 await approval · ✋ blocked (the driver's) · 🔍 in review
      🚧 N at a modal
    🙋 is the human's, so surface it once. ✋ and 🔍 are YOURS to work —
    ask why the reviewer won't agree, then CONVERGE: a .taken per open
    .given, then re-arrive. ⛔ never `route.guard.budget --add N` — the
    route's budget is the budget (rule.forbid.budget-top-ups, blocker).
    an exhausted lane converges or stands terminal WITH a record of what
    was tried. 🚧 is a decision to render.

    then DERIVE the two actionable sets through the tool, never by an eye
    over the render: `rhx git.crew.poll --fellable` (merged-clean trees to
    close) and `rhx git.crew.poll --healable` (limited crews a nudge cures).
    each emits its own runnable command per tree — act on the emitted lines,
    never a tree name copied by hand off --stones (rule.always.poll-the-fell
    -and-heal-sets — blocker). run each emitted `git.crew.heal` line
    verbatim. 🔴 --healable does NOT exclude a live/future cap — it names
    every 🚫 row heal has ANY cure for, and heal picks the cure axis (a
    nudge for a transient/stale cap, an auth.swap for a live one). read
    the line heal emits; do not assume a nudge is safe.

    EVERY drill-in and EVERY steer goes through a crew verb, addressed by
    TREE and ROLE — `rhx git.crew.read --tree <tree> --who <role>` and
    `rhx git.crew.send --tree <tree> --who <role>`. never a `duct.*` call or
    a duct uri (rule.always.entool-the-layer-you-drop-below — blocker, no
    first-one-free). if a crew verb errors, REPAIR it; the old duct call is
    not the fallback, it is the braid.

    then act per rule.require.babysit-permission-approval +
    rule.prefer.release-into-prod-phrase. on a 🚧prompt, crew.read that ONE
    role for the FULL command, then:
      approve  --keys 1   (the option that reads bare `Yes`)
      decline  --keys 3   (the option that reads `No` — the LAST one. NEVER
                           2: that is "yes, and don't ask again", a grant
                           beyond this run, and it is never yours to give)
      unsure   escalate — it costs one message; a misaimed key costs the grant
    a transcript-share / data-consent prompt is NEITHER a modal NOR a
    survey: REJECT it explicitly — find the decline key, send it, verify.
    never approve, never dismiss with 0 (a dismiss can read as assent)
    (rule.always.reject-transcript-share-prompts). same for MY own session.
    submit ✍️PREFILLED msgs — typed and UNSENT — with --keys Enter, after
    a --raw ghost check. ⛔ a 📬QUEUED box is already submitted: leave it,
    the clone drains it. an Enter there lands in the EMPTY box beneath the
    queued row, which is a recorded harm (term=duct.box.unread,
    term=duct.box.inflight). read the box state; never the tally.
    tell verified+granted trees "release into prod", surface (never
    self-grant) human-only gates. verify-after-send. if no work is
    needed, say so and stop.
```

## .placement

- **off-minute** — never :00 or :30. pick `9,24,39,54`, and offset from any peer
  cron so their ticks interleave rather than stack
- **session-only** (`durable: false`) — the fleet exists only for this session;
  a disk-persisted cron would outlive the ducts

## .lifecycle

| event | action |
|-------|--------|
| first dispatch of a session | create the omnibus babysit cron |
| more dispatches added | do NOT add more crons — the sweep picks them up |
| a dispatchee abandoned / released | no cron change — next tick reconciles |
| last dispatchee closed | `CronDelete` the babysit cron (fleet empty) |
| supervisor session ends | session-only cron dies on its own |

## .the tick contract

each tick MUST:
0. **`rhx git.grove.saturation`** — the SHARED RESOURCE, read before its members.
   the order carries the value: a saturated grove makes every crew on it look
   slow, so a member-first read diagnoses N clones for ONE cause and steers each
   separately. governed by `rule.require.bound-grove-concurrency-by-saturation`
   ⇒ and on 🔴 cpu with a full run queue, **`rhx git.grove.prune` comes before any
   fell** — the cause may sit outside the fleet entirely
   (`rule.require.prune-runaways-before-you-blame-the-grove`)
1. **`rhx git.crew.poll --live --stones`** — the whole fleet in ONE call, derived
   live, so the never-hardcode mandate holds by construction
2. **`rhx git.crew.poll --fellable` + `rhx git.crew.poll --healable`** — derive the
   two ACTIONABLE sets THROUGH the tool: the merged-clean trees to close, and the
   `limited` crews a nudge cures. each emits its own runnable command per tree —
   act on the emitted lines, never a tree name transcribed by hand off `--stones`
   (`rule.always.poll-the-fell-and-heal-sets`). `--healable` excludes a LIVE cap by
   construction, so a nudge never lands on a wait-only crew
3. act per `rule.require.babysit-permission-approval` (approve/steer/escalate),
   `rule.require.nudge-parked-clones` (route an idle clone by its owner), and
   `rule.prefer.release-into-prod-phrase` (verified+granted → release)
4. `rhx git.crew.read` after any send (`rule.require.verify-after-send`)
5. if no work is needed, say so briefly and stop — never invent work

every one of those is a CREW verb — a supervisor addresses a tree and a role,
never a `duct.*` call or a host (`rule.always.entool-the-layer-you-drop-below`).
where one errors, the repair outranks the tick.

## ⚠️ .the tick PROCEDURE lives in the howto

the steps above are the contract. **how each is actually run** — the ONE poll and
its four halves, the crew-verb shapes, the fleet scope, the `🚧 PROMPT` drill-in,
the late-`--keys` hazard, `--brief` — is `howto.run-a-babysit-tick.md`, along with
the enforcement that grades a tick.

⇒ the split is the extant pattern: a rule states what is owed, a howto states how
it is done (`babysit-permission-approval` + `howto.review-permission-requests`).

## .enforcement

- live dispatchees with no babysit cron = **blocker** (the human becomes the
  bottleneck on work that needed no human)
- a babysit cron that hardcodes the fleet instead of a live derivation =
  **blocker** (it goes stale, babysits dead trees, and misses new ones)
- one cron per tree instead of one omnibus sweep, or a cron left alive after the
  last dispatchee closed = **nitpick**

⇒ every grade on the CONDUCT of a tick — the loop, the wrong instrument, the
layer drop, the pinned scope, the unread modal — is in the howto.

## .see also

- `howto.run-a-babysit-tick.md` — the PROCEDURE half. read it before a first tick
- `rule.require.bound-grove-concurrency-by-saturation.md` — step 0, and the
  thresholds that halt a sprout
- `rule.require.babysit-permission-approval.md` — the per-prompt safety test
- `rule.prefer.release-into-prod-phrase.md` — the single release lever
- `rule.require.throttle-babysit-cron-by-idle-streak.md` — how to slow it down (never fully stand it down while dispatchees live)

---

written by human + beaver 🦫
