# F26 — the crewwork calls i005 holds rather than repairs

each section is one peer concern of round i005, crewwork slice, answered with a held call.

## .a — `crewwork.harness.ts` exports eleven names (r020 b3)

- **fork:** split the harness into one file per export, or keep one shared fixture module
- **taken:** keep one module. its two procedures took `(input)` objects this round
- **why:** it is a test fixture module, imported by nine `crewwork.*.integration.test.ts`
  files. seven of its eleven exports are constants (`TREE`, `ROLES_*`, `SESSIONS_FULL`), and
  four of those are DERIVED from `ROLES_DEFAULT` in the same file (`ROLES_TREEBOUND`,
  `ROLES_LOCAL_BOOTED`, `SESSIONS_FULL`). a split puts a derived constant one import away from
  its source, so a roster change touches two files to stay coherent.
  `rule.require.single-responsibility` names its purpose as "easier to locate, understand, test
  code" and draws every example from a domain procedure (`getCustomerInvoices.ts`). a fixture
  module shared by nine suites is the one place each suite looks for the roster; a split serves
  none of the rule's three aims
- **rework:** clean — one `git mv` per export, plus nine import edits
- **confidence:** 80% — the rule text carries no test carve-out, so a stricter read holds

## .b — three crewwork.sh helpers stay positional (r016 b1, remainder)

- **fork:** convert `__crew_cap_grove_spread`, `__crew_unreached_class`, `__crew_clones_idle` to
  named args this round, or after the work slice lands
- **taken:** after. the five crewwork-local helpers r016 b1 named are converted this round
- **why:** each of the three is called from `pollwork.rows.sh`, `pollwork.sweeps.sh` or
  `pollwork.read.sh`, and source clamps in `work.surface.scope` pin those call texts. that slice
  had its own absorb in flight this round, so a parallel edit of its call sites is a merge race
- **rework:** clean — three signatures, their pollwork call sites, and the clamps that pin them
- **confidence:** 90%
- **verdict:** repaired in i006. the work slice had landed, so the race was gone. all three now
  take `--flag value`, with their pollwork callers and clamps; i006 r016 b1 converted five more
  helpers beside them (`__crew_read_local_seat_hint`, `__crew_sponsor_grant_by`,
  `__crew_seat_is_live`, `__crew_role_is_phantom`, `__crew_answer_trust_prompt`)
