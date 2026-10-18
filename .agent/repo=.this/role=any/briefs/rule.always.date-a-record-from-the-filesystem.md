# rule.always.date-a-record-from-the-filesystem

> **the "today" in your context was captured when the session opened. it does not advance.**

before you stamp any dated record — a `.disputes` entry, a progress file, a dream, a route dir —
read the date off the **filesystem**, not off your context.

**write a probe, then read its mtime.** the write is what makes the read a clock:

```sh
printf 'probe\n' | rhx teesafe --into '<dir>/.clockprobe' --idem upsert
rhx globsafe --pattern '<dir>/.clockprobe' --long     # its mtime IS now
rhx rmsafe --path '<dir>/.clockprobe'
```

🔴 **an extant file's mtime is NOT a clock — it is a record of a past write.** it answers *"when did
i last touch this?"*, never *"what time is it?"*, and the gap between those two is exactly the
interval in which a midnight can pass.

🟡 **measured 2026-09-06:** i read two files written hours earlier, saw `2026-09-05 16:24`, and had
to probe to learn the true date was **09-06**. the stale read was **one day wrong in the same
direction as the defect this rule exists to catch** — so it would have confirmed the error rather
than caught it.

## .why — a long session crosses midnight, and no signal fires

the session injects the date once, at start, and never refreshes it. a session that opens at 02:53 and
runs past midnight carries a **stale "today"** for every hour after — and it reads exactly like a
current one, because it is well-formed, plausible, and stated with authority.

⇒ **that is the whole hazard: there is no tell in the value itself.** a wrong date is not malformed,
so it renders like a correct one to any review that grades plausibility, and zero of them can
distinguish it — only a comparison against a second clock catches it.

## 🔴 .the tell is a sentinel-driven hook that will not stop firing

a skill that writes `progress.$date.md` and checks it for staleness computes `$date` from the
**real** clock. so once you have crossed midnight:

| what happens | how it reads |
|---|---|
| you append to yesterday's file | ✅ succeeds, looks correct |
| the hook computes today's filename | finds no file |
| the hook fires again, *"> 1 hour stale"* | 🔴 reads as a **broken hook**, while both are behaving |

🟡 **the failure inverts the diagnosis.** the tool is right and your date is wrong, so every instinct
points at the tool. a third identical fire is the cue to check the clock rather than the hook.

## .the check

> **"is the date i am about to write derived from a clock, or from my context?"**

- from a clock → good
- from context → 🔴 verify it. one `globsafe --long` on a file you just wrote settles it

🟡 **and never "correct" a clock-derived date to match your context.** that is the reverse of the
repair, and it converts a right record into a wrong one under the appearance of tidiness.

## .what it costs when it slips

measured here, 2026-09-05: two dated glossary entries wrong (one of them **corrected from right to
wrong**), a dream filename and its symlink a day off, and two rounds of a progress file appended into
the prior day — against that file's own *"ONE FILE PER DAY, never across days"*. the hook fired
three times and was blamed twice before the clock was read.

## .enforcement

- a dated record whose date came from context, unverified, where a clock read was available = **blocker**
- a clock-derived date edited to match a context date = **blocker**
- 🔴 **an extant file's mtime read AS a clock, with no fresh write** = **blocker** — it is a past
  write, and it fails in the same direction as the defect
- a hook or skill diagnosed as broken before its clock-dependent input was checked = **nitpick**

## .see also

- `rule.require.trust-but-verify` (mechanic) — the general form; this is its clock instance
- `rule.always.diagnose-reviewer-malfunctions` (bhrain/driver) — diagnose the cause before you escalate the symptom
- `.agent/.cache/repo=bhrain/role=learner/skill=learn.domain.terms/progress.2026-09-05.md` — round 5, the worked incident
