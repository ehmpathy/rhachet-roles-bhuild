# rule.forbid.private-business-in-published-roles

## .what

a published role teaches with a **demo business**, never a real one. every example in
`src/domain.roles/**` — brief, readme, skill header, code comment, test, fixture — speaks of
**sandpine**, a fictional surf school, and its surf-school work.

a real operator's org, repos, services, initiatives, people, and infra ids stay out of the
package. they live in the operator's own notebook, where they belong.

## .why

- **the package is read by every consumer.** a brief that roots its taxonomy at one real
  business teaches that business as *the* taxonomy. `bigrock://<real-org>.decost` reads as the
  shape a stranger must copy, not an example of it.
- **a lift carries the source repo's world with it.** roles graduate from a private notebook
  into this package. the notebook's live work rides along unless someone strips it — measured
  on the supervisor + prioritizer lift: 380 hits of one private org across 93 files.
- **fine to publish ≠ fine to teach.** an org name may be harmless to disclose and still wrong
  as an example. the test is legibility to a stranger, not secrecy.
- **one demo business composes.** every brief that speaks of sandpine can cite every other. a
  mix of three real orgs and two placeholders reads as three unrelated stories.

## .the demo business

| concept | the demo |
|---|---|
| org | `sandpine` — a surf school |
| mainquest roots | `sandpine.decost` (cost down) · `sandpine.ensell` (revenue up) |
| tool root | `rhachet.entool` — rhachet is public, so it stays |
| initiatives | `book-a-lesson` · `spot-forecast-widget` · `coachbook` · `cert-ingest` |
| repos / services | `sandpine/svc-lessons` · `sandpine/infrastructure` |
| grove | `grove-sandpine-v20260901` |
| human | `bert` · `@example.com` |

reach for surf-school work when you need a new example: lesson reservations, board rentals,
instructor schedules, tide and swell forecasts, wetsuit inventory, lesson reminders.

## .what counts as a leak

| kind | e.g. | replace with |
|---|---|---|
| a real org or business | the operator's company | `sandpine` |
| a private repo or notebook | the source repo of a lift | name the concept, or `sandpine/<repo>` |
| a private service or tree slug | `svc-<real>.beav.feat-…` | a surf-school `svc-*` |
| a real initiative or metric | a named product bet, a revenue target | a surf-school initiative |
| a real person | a first name, a handle, an email | `bert` (`rule.forbid.real-identities-in-fixtures`) |
| an infra id | an aws account id, an instance id, an ip | a fake of the same shape |

**not leaks:** public ehmpathy / rhachet repos and packages, and public vendors named
generically (twilio, aws, aurora, postgres).

## .the provenance case

a brief may cite where a lesson was learned. cite it **without the private name**: *"measured
on a 4-cpu grove, 2026-09-13"* carries the evidence; the grove's real hostname adds no proof.
where the source is genuinely needed, it stays in this repo's unpublished
`.agent/repo=.this/` evidence files, never in `src/`.

## .the clamp

`src/domain.roles/orgNamesAbsent.integration.test.ts` holds the forbidden terms and scans every
file under `src/` and `blackbox/`. a lift that carries a name back goes red.

⚠️ the clamp catches the names already found. it cannot catch a new operator's name on the next
lift. so when you lift, **add that operator's org and people to `TERMS_FORBIDDEN` first**, then
scrub until green.

## .enforcement

- a real org, repo, service, initiative, or person in a published example = **blocker**
- a lift that lands without its source operator's names added to the clamp = **blocker**
- a new example that invents a second demo business instead of sandpine = **nitpick**
- a provenance citation that names a private host or repo where the bare evidence would serve
  = **nitpick**

## .see also

- `rule.forbid.real-identities-in-fixtures` (mechanic) — the people half of this rule
- `define.why-seaturtles-love-software` (mechanic) — why our demos speak in surf

---

written by human + beaver 🦫
