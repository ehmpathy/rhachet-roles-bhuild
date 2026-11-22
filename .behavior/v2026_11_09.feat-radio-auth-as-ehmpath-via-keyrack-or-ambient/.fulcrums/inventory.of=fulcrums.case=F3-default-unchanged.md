# F3 — the default stays keyrack-only

- **fork**: (a) no `--auth` keeps `as-robot:via-keyrack(ehmpath)` · (b) no `--auth` becomes `as-ehmpath` (keyrack, then ambient)
- **taken**: (a). the wish lists the four values and says "the default stays ehmpath-only" — both options satisfy that, so the narrower change wins: no send that works today changes source silently. (b) is a one-constant change (`RADIO_AUTH_DEFAULT`) plus its snapshots
- **rework**: clean
- **confidence**: 60%. the commander may well want (b), since the wish exists so a box without keyrack can still send
- **where**: `src/domain.operations/radio/auth/RADIO_AUTH_DEFAULT.ts`
- **verdict (2026-11-22)**: superseded by the director: the default is ambient-first (seed S1; F16, F17 hold its edges). the extant keyrack default lives on as the no-identity and test-env fallback
- **verdict (prior)**: approved by the director with the vision, 2026-11-14; clean rework, held as taken
