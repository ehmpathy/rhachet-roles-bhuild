# F5 — a clamp test is in scope

## .the fork

- (a) declare the budgets only, as the wish lists
- (b) also add a test that boots each `src` spec and fails over budget

## .taken — (b), and why at the time

measured 2026-10-21: `rhachet roles cost --all` exits **0** with a spec over budget (only a 🟡);
`roles boot --what <src spec>` exits **2**, but no test or ci job in this repo runs it. so a bare
declaration turns red nowhere, and "cannot grow unseen" fails. the branch name says "clamp".

## .rework — clean

one `given` case in an extant test file.

## .confidence — 85%, and why it is low

the wisher may consider the budget line alone sufficient, with a ci gate as later work.

## .where

`src/domain.roles/roleArtifacts.integration.test.ts`

## .verdict

(open — for the council)
