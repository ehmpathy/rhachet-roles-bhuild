# F17 — do lifted briefs that name one org's infra ship in the published npm artifact

- **status** = 🔴 **ruled by the wisher, 2026-09-27 — "scrub the org names."** my ship-as-lifted
  guess OVERRULED. the published briefs carry neutral placeholders (`ahbode`, `examplehuman`);
  the evidence each one records is kept, only the org name is gone
- **confidence** = 70% → 100%

## .the fork, stated fairly

peer round i015, lane `r11`, `[nitpick][better]`: the lifted `*.reason.md` evidence files and several
briefs cite grove slugs (`grove-ahbode-v20260901`), service names (`svc-notifications`,
`svc-gateway`), and a named repo (`ahbode/infrastructure`). the build's include list pulls
`**/briefs/**/*.md` into `dist/`, so every one of them ships to npm.

| option | what it does |
|---|---|
| **A. ship as lifted** | the evidence is the reason a term was chosen; `rule.require.persist-domain-term-evidence` requires it be kept |
| B. keep source-only | an exclude rule on `*.reason.md` — the evidence stays in git, leaves the tarball |
| C. redact in place | rewrite each org name to a placeholder |

## .taken, and why at the time

**A.** three grounds:

1. the same i015 round split the concern into two kinds, and the split is the call. an org name in a
   **default** changes what a consumer's tool DOES (repaired — blocker 1). an org name in a
   **measured-case record** changes naught a consumer runs; it says where a lesson was learned.
2. the wish says the lift moves the corpus verbatim. C rewrites evidence, which makes it no longer
   evidence — a measurement with its subject redacted cannot be re-checked.
3. the names are not secrets: slugs and service names, no credential, no address, no customer datum.

## .rework

**clean.** B is one exclude line in the build's include list plus a test that the tarball omits
`*.reason.md`. naught depends on the evidence files at runtime.

## .confidence — 70%, and why it is low

the 30% is a **publication** question, and publication is the wisher's to make: whether an org is
content to have its fleet's internal names in a public package is not decidable from the code. i
cannot read it from any file, so i do not claim to.

## .where

- `src/domain.roles/supervisor/briefs/**`, `src/domain.roles/prioritizer/briefs/**`
- the build include list that copies `**/briefs/**/*.md` into `dist/`

## .verdict, once ruled

_(unset — for the council)_
