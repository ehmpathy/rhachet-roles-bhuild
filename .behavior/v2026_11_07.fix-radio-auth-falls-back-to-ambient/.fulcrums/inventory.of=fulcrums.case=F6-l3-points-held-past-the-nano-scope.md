# F6 — the L3 review points held past the nano scope

## the fork

the 5.1 L3 lanes (i005) raised points that are sound but widen the wish or reshape code it does not need. each is held here, not fixed in this pr:

| point | lane | held because |
|---|---|---|
| `radio.task.pull` keeps the bot-only path | behavior-intent b2, arch-defects n3 | the wish names push and drain only; the vision scoped pull out. a seat that pulls is named in the pr as the open gap |
| `upstream:not-found` is outside the fallback | behavior-intent b3 | the wish names 401/403. a private repo a token cannot see answers not-found; whether that should fall back is the wisher's call, named in the pr |
| the CLI tier snaps only the bot-absent path | behavior-intent n2 | the refused, mixed, and override paths are clamped at integration through the real `setRadioTaskRecordUpstream` with a stub gh (cases 1-17); the CLI tier proves the wire, the integration tier proves each branch |
| the gh-login source is unreachable under a test env | behavior-intent n3, arch-defects n7 | `isGithubAuthTestEnv` keeps a test from a read of the dev's own gh login, so no suite can leak a real identity. the branch is clamped at unit with a stubbed `shx`. a capability injection is the cleaner shape, past this wish |
| the fallback line names why, not how to fix it | behavior-intent n4 | the line reports a delivery that succeeded; the fix belongs to a failure. a locked bot token's fix is named where it holds a record |
| the fallback line prints above the delivery result | behavior-intent n5 | the order names the credential before what it delivered; taste, no harm |
| three loose params (`radioContext`, `fallback`, `isAuthDefault`) over a tagged union | arch-defects n1 | a sound refactor; it reshapes the send seam past what the fix needs |
| glue duplicated (ambient context literal, 401/403 map, both-failed assembly) | arch-defects n2 | two to three copies each, within two files; the catch-shape copy was lifted (`asRadioHeldFault`). the rest is a followup |
| `asRadioAuthBotMiss` parses the keyrack fault's prose | arch-defects n4 | the reviewer is right that the ripple is small: `HelpfulError.metadata` carries `status` on the locked and blocked branches. held because the parse is pinned (`asRadioAuthBotMiss.test.ts [case3]`) and an unread status degrades to `not granted`, never a wrong label. the metadata read is the followup |
| a text-classified 403 now triggers a resend under another identity | arch-defects n5 | the classifier is the one the hold reasons already used; the resend is a findsert, so a misread costs one redundant call and a both-failed report, never a duplicate issue. a typed refusal from `runGhCommand` is the followup. the pr names the 403-bypass |
| each record re-offers the bot token in a drain | arch-defects n6 | N redundant bot calls, bounded by the drain's send budget; a drain-scoped verdict is the followup |
| an ambient human login is tagged `role: 'as-robot'` | arch-defects n7 (i005), n3 (i006) | `runGhCommand` reads the role to word its 401 text, so the resend's raw fault text says "the robot token was rejected". no seat sees it: a refusal under the ambient credential is rewritten to both-failed, and only the held reason (`upstream:401`) is read from that text. an `as-ambient` role is the followup |
| the derive and send halves share one policy through three params; test seams ride prod signatures | arch-defects n1, n4 (i006) | the same reshape as the tagged-union row, with a capability injection; one seam change, past this wish |
| per-record keyrack read and `gh auth token` spawn in a drain | arch-defects n2 (i006) | bounded by the drain budget, as the bot re-offer row; one drain-scoped memo is the followup |
| the bot-miss gate catches any derive fault | arch-defects n5 (i006) | as the keyrack-metadata row: the D3 set (absent, locked, blocked) is the vision's; an allowlist in code is the followup |
| the "fallback" term names three things | arch-defects n7 (i006) | a rename across the new types; clean, a followup |
| the acceptance suite's biome reflow rides in the radio commit | arch-defects n8 (i006) | true: the upgrade commit never touched that file, so the radio commit carries ~900 lines of re-wrap. a split rewrites pushed history (a force push on the pr branch), which no grant here covers; raised to the director with the pr |
| the grove "bot token refused" row has no CLI proof | behavior-intent n5 (i006) | the wire is the same `fate.fallback` the bot-absent acceptance proves; integration cases 3, 5, 13 clamp the refusal and the one-issue resend |
| the `case=9` demo and the catalog trail the render | behavior-intent n6, n7 (i006) | the yield names the real render; the demo prose and five alterpath rows are catalog hygiene, a followup |
| the bot fix text is masked at acceptance; the gh-login headline prints in no run | behavior-intent smaller notes (i006) | the mask is box variance; the fix text is pinned at unit (`asRadioAuthBotMiss [case3]`). the gh login is the test-env row above |

## taken: hold, each named in the pr or as a followup

## rework

clean for every row: each is a local refactor, a scope widen the wisher can ask for, or a test-seam change.

## confidence

75%. lowest on the not-found row: a wisher may hold that a token that cannot see a repo is a refusal in all but name.

## verdict

open
