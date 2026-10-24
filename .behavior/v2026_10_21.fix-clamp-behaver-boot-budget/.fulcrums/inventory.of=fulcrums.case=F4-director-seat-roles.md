# F4 — which roles "boot in a director seat"

## .the fork

- (a) every role this repo **declares** a boot for, other than behaver: decomposer, prioritizer, supervisor
- (b) every swept `src/domain.roles/*/boot.yml`, which adds dispatcher and dreamer
- (c) only the roles a director seat actually enrolls — a set this repo does not record

## .taken — (a), and why

"director seat" is defined nowhere in this repo (grep, 2026-10-21). the wish's intent is "so it
cannot grow unseen"; a freeze on every role that boots serves it at the cost of one yaml line each.

dispatcher and dreamer carry a `boot.yml` on disk, but the role registry declares no `boot` for
either — they sit in `ROLES_WITH_INERT_BOOT` in `roleArtifacts.integration.test.ts`, a named debt
(`.dream/2026_09_22.fix-inert-bootyml-dispatcher-dreamer.dream.md`). an enrolled brain never boots
them, so a budget there would cap a file no seat reads. the wish's "dispatcher has no boot" is
right in the sense that matters.

🟡 the vision yield calls that aside "stale". it is not; the vision yield was written before the
registry was read. this entry is the correction, and the execution yield names it.

the clamp ([case5]) binds the same set by force: every **declared** boot owes a budget, and every
undeclared role dir must sit in `ROLES_WITH_INERT_BOOT`. once the inert debt is paid and a boot is
declared, the clamp demands its budget at that moment.

## .rework — clean

add a budget line to any role the wisher wants in, or drop one from a role the wisher wants out
(and name it as an exemption in [case5]).

## .confidence — 80%, and why it is not higher

the commander may mean a narrower set than (a) — e.g. behaver alone — and may not want the three
frozen.

## .where

`src/domain.roles/{decomposer,prioritizer,supervisor}/boot.yml` · `roleArtifacts.integration.test.ts` [case5]

## .verdict

(open — for the council)
