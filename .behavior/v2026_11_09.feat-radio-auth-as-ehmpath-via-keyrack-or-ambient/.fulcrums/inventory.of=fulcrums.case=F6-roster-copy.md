# F6 — this repo holds its own copy of the ehmpath roster

- **fork**: (a) declare the ehmpath identities in this repo · (b) import them from rhachet-roles-ehmpathy
- **taken**: (a). the peer's roster lives in a bash leaf (`keyrack.operations.sh`), not an exported ts value, and the wish has the peer repo carry the same contract in its own tree. a ts constant here, with a comment that names the peer source, keeps the dependency direction clean
- **rework**: clean — swap the constant for an import once the peer exports one
- **confidence**: 75%. two rosters can drift; a dream for a shared export is owed
- **where**: new roster constant under `radio/auth/`
- **verdict**: approved by the director with the vision, 2026-11-14; clean rework, held as taken
