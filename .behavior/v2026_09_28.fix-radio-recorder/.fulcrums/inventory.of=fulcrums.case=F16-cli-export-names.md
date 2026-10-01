# F16 — `radioTaskHeld.ts` exports `cliRadioTaskHeld`

- **the fork:** match the other cli files (`radioTaskPush.ts` → `cliRadioTaskPush`, `radioTaskPull.ts` →
  `cliRadioTaskPull`, both on main) · rename to `cliRadioTaskHeld.ts`
- **taken:** match them. `src/contract/cli/` holds one convention; a lone rename splits it
  into two. a rename of all three is a sweep of files this wish never opened
- **rework:** clean — `mvsafe` three files + the `src/index.ts` imports
- **confidence:** 85%
- **where:** `src/contract/cli/radioTask*.ts`; peer r5 nitpick.2
- **verdict:** —
