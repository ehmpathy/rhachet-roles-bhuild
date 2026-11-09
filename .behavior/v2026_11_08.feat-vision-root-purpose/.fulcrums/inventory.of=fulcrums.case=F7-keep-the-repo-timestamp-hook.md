# F7 — keep the repo's own timestamp hook; defer the practice's zero-exemption lock

## .the fork

the boot's `declapract apply --practice husky` (declapract-typescript-ehmpathy 0.50.0) rewrote
`.husky/check.timestamps.sh` to a zero-exemption hook and added `check.timestamps.lock.sh`,
which halts any commit whose hook differs from the practice's blob.

- **A — adopt the practice.** the `.eco/*` exemption goes. the prioritizer's plaintext store
  (rows carry `createdAt`/`updatedAt` by design) becomes uncommittable: `ecowork.commit`
  [case46] red. the repo-local hook additions (class headers, the `why:` line, git stderr kept
  out of the scan) go too: `check.timestamps.integration.test.ts` red on 6 tests.
- **B — keep the repo's hook in this PR.** restore `check.timestamps.sh` to its main blob, drop
  the lock and its pre-commit line. keep the practice's `check.secrets.sh`, which conflicts with
  naught.

## .taken: B, and why at the time

- the wish is the vision root purpose. A is a store redesign for the prioritizer — out of scope
- `rule.forbid.timestamps-in-tracked-files` (this repo) names `.eco/*` a sanctioned home and
  warns "a declapract upgrade is not a no-op here" — B honors the repo's declared rule
- B leaves the hook byte-identical to main, so this PR changes no timestamp policy at all

## .rework: clean

to adopt A later: re-run `declapract apply --practice husky`, then redesign the `.eco` store
(or win the exemption upstream). no caller hardens against B — the hook is unchanged from main.

## .confidence: 65%, and why it is low

the practice's lock says, in its own words, that an exemption is a privacy leak "by design"; the
upstream author may mean the `.eco` exemption to die. whether this repo's store must change, or
the practice must learn a data-store exemption, is the wisher's call.

## .where

`.husky/check.timestamps.sh` (restored), `.husky/pre-commit` (lock line dropped),
`.husky/check.timestamps.integration.test.ts` (copies every `check.*.sh`, so `check.secrets.sh`
reaches the temp repo). dream: `dreams/v2026_11_08.reseed.timestamp-lock-vs-eco-store.md`.

## .verdict

(unruled)
