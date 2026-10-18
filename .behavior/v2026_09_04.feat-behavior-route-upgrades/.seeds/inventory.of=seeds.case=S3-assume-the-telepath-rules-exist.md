# S3 — build against the telepath rules as if they exist

**caught** 2026-09-07 · **landed** the F3 bind, the prose lane, this route's execution plan

## .said — verbatim

> ok lets please plan to execute this with the assumption that the telepath rules will be shipped by
> the time this pr needs to ship. and just act like they exist at the intended locations in the
> meantime. cool?

## .settled

**a cross-repo rule bind may be authored against files that do not exist yet.** the bind names the
intended path; the target repo ships the file before the consumer's PR merges.

⇒ two repos land one design in parallel rather than in series. the alternative — hold bhuild until
bhrain merges — serializes work that carries no sequence constraint at authorship time.

## 🔴 .the condition this puts on the bind, and it is not negotiable

**an absent rubric must be LOUD.** the whole reason a parallel build is safe is that the consumer
fails hard if the producer never shipped. remove that and the parallel build becomes a silent
downgrade.

🟡 **the extant guard idiom would do exactly the wrong thing here.** the 5 lanes in this repo's
templates that bind a `repo=.this` rubric each carry `--optional rules` — counted 2026-09-10,
`grep -c '--optional rules'` over `templates/`, 5 hits across 5 files:

```sh
--rules '.agent/repo=.this/**/rule.*.md' --optional rules
```

that flag is **correct** where it stands — a consumer repo may legitimately carry no local rules, so
the lane skips rather than breaks. it is **wrong** for the telepath bind, where the rules are
required.

| the lane | rules glob matches zero | what the guard sees |
|---|---|---|
| with `--optional rules` | 🌙 **skips**, emits `0 blockers` / `0 nitpicks` | ✅ **approved** — a silently-disabled gate |
| without it | 🔴 **throws** `BadRequestError` about an ineffective glob | 💥 **malfunction** — blocks passage |

✅ **verified at source, not assumed.** bhrain's `stepReview.integration.test.ts` declares
`[case2] rules glob matches zero files` → *"throws BadRequestError about ineffective glob"*, and
`review.ts:206` comments the strict default outright: *"validate `--optional` supply names (fail
loud: never silently disable strictness)"*.

⇒ **the prose lane binds `--rules` with NO `--optional rules`.** if the telepath tree has not
shipped, the lane malfunctions and the stone will not pass. that is the desired outcome, and it is
what makes the parallel build honest rather than hopeful.

## .landed

| where | what |
|---|---|
| `1.vision.guard.{light,heavy}` | the prose peer lane, bound to three telepath paths, **strict** |
| `$route/.dispatch/…handoff=telepath-rules-bhuild-will-cite.md` | the three exact filenames the bind depends on |
| the F2 entry | its residual 4% is exactly this dependency |

## 🟡 .the residue

the bind is a **contract across a repo boundary**, so a **rename** in the telepath tree breaks it as
surely as an absence would — and a rename is likelier, because the file will exist. the handoff names
the three filenames for that reason; it is the only guard against a drift the strict flag cannot
catch.
