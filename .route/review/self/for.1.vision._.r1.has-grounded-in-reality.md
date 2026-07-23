# self-review r1 — has-grounded-in-reality

stone: 1.vision
question: did the junior ground the vision in reality, or make things up?

## verdict

grounded. every claim in the groundwork section was read from the actual source
before the vision was written, not assumed. i re-opened each cited file/line as
part of this review to confirm. one line-range citation was imprecise; i fixed it.

## external references

the vision claims "none — no new external dependencies." verified: the design
adds no new package, service, or API. it leans only on `gh` (already invoked in
`daoRadioTaskViaGhIssues.ts`) and the `rhachet/keyrack` SDK (already imported in
`genAuthFromKeyrack.ts:2`). no external claim to sanity-check because none was made.
holds.

## internal references — each re-verified against the code

| claim in vision | verification | verdict |
|-----------------|-------------|---------|
| default auth = `as-robot:via-keyrack(ehmpath)` at `getGithubTokenByAuthArg.ts:40` | read line 40: `const auth = input.auth ?? 'as-robot:via-keyrack(ehmpath)';` | ✓ exact |
| `absent` → ConstraintError that names `--auth as-human`, `genAuthFromKeyrack.ts:55-63` | read 55-63: ConstraintError with `• or re-run as human: --auth as-human` | ✓ exact |
| `locked`-after-unlock → MalfunctionError raw stdout, lines 84-90 | read 84-90: `throw new MalfunctionError(\`keyrack:\n${second.emit.stdout}\`...)` | ✓ exact |
| `blocked`/other → MalfunctionError raw stdout, lines 93-99 | read 93-99: same shape on `first.emit.stdout` | ✓ exact |
| bad-token gh rejection un-wrapped in `runGhCommand`, `daoRadioTaskViaGhIssues.ts:37-56` | read 54: `const { stdout } = await execAsync(command, { env });` — no auth try/catch | ✓ exact |
| `gh issue create` path, `daoRadioTaskViaGhIssues.ts:243-247` | read 244-247: `runGhCommand(\`gh issue create ...\`)` inside try | ✓ exact |
| glyph contract "✋ = fix config, 💥 = server fault" at `getGithubTokenByAuthArg.ts:27-28` | read 27-28: the `.note` states exactly this | ✓ exact |
| as-human forbidden in tests, `getGithubTokenByAuthArg.ts:111-115` | read 111-115: `if (isTestEnv) throw new ConstraintError('--auth as-human is forbidden in test environment'...)` | ✓ exact |

## stdout/error-format checks

the vision's proposed ✋ message reuses the *exact* two-bullet nudge shape already
present in the `absent` snapshot (`genAuthFromKeyrack.test.ts.snap:15-25`), and reuses
`ConstraintError`/`MalfunctionError` from `helpful-errors` (imported at
`genAuthFromKeyrack.ts:1`). i confirmed the current locked/blocked snapshots render
as `💥` (case3 line 4, case5 line 28) and absent renders as `✋` (case4 line 16), which
is the precise before-state the vision proposes to change. the proposed output matches
extant vocab; it does not invent a new format.

## issue found and fixed

- **imprecise citation.** the draft cited the snapshot as "case3:1-13 ... case4:15-25".
  lines 1-2 of that file are the jest header, so case3 actually begins at line 3.
  fixed the vision to read "case3, lines 3-13; case4, lines 15-25; case5, lines 27-37"
  after a re-read of the snapshot file. the substance (locked/blocked=💥, absent=✋) was
  correct; only the line boundary was off by two.

## non-issues (why they hold)

- **"no external research" is not a gap.** the wish references no external API/doc, so
  the honest groundwork answer is "none." a claim of external verification that was not
  needed would itself be a fabrication. the absence is correct, not lazy.
- **the open questions are labeled as open, not asserted as fact.** the bad-token
  allowlist strings and the exact 401/403 gh stderr are explicitly deferred to research
  in the "research needed" section rather than guessed — this is grounded honesty, not
  a hole.

## conclusion

the vision is coherent with the code as it exists on this branch. claims trace to
specific verified lines; the one inaccuracy was a citation boundary, now corrected.
no fabricated behavior detected.
