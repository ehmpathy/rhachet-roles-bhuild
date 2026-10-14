## .what

port upstream the fixes `rhachet-roles-bhuild` made to its copy of the husky practice
`src/practices/husky/best-practice/.husky/check.timestamps.sh`, so every repo that adopts it gets
them, and a declapract upgrade does not revert them there.

## .the gaps, on `origin/main`

1. **error headers name no class** (`rule.require.qualified-error-headers`, mechanic: a blocker)
   - line 41: `printf '💥 check.timestamps: failed to read staged content for %s\n'`
   - line 51: `printf '✋ timestamps are forbidden in snapshots. mask them to prevent permadrift\n'`
   - the exit codes already match the classes (1 = malfunction, 2 = constraint); only the words are absent
2. **git's stderr mixes into the scanned bytes**: the content is read with `2>&1`, so a git notice
   on stderr is scanned as file content
3. **the constraint branch prints to stdout**; the malfunction branch already uses stderr
4. **the message misnames the scope**: the gate scans every staged file outside `.ts` / `.sh`, not
   only snapshots
5. **a non-ascii path fails as a malfunction**: git quotes it (`"lecciones-\303\261.md"`), and
   `git show ":$file"` cannot find the quoted form

## .the shape of the fix

```bash
# list staged paths raw, so a non-ascii path is found
git -c core.quotepath=off diff --cached --name-only --diff-filter=ACM

# read the blob without git's stderr; git's own message prints above the halt header
content=$(git show ":$file")

printf '💥 MalfunctionError: check.timestamps failed to read staged content for %s\n' "$file" >&2
printf '✋ ConstraintError: timestamps are forbidden in tracked files. mask them to prevent permadrift\n' >&2
```

- drop the `└─ $content` line under the malfunction header (git's message already prints above it)
- send both constraint lines to stderr
- check whether any declapract test or snapshot pins the old text, and update it

## .the test to adopt

`ehmpathy/rhachet-roles-bhuild` `.husky/check.timestamps.integration.test.ts` covers:

- a staged time of day halts (exit 2, masked snapshot)
- a datestamp passes
- a `.ts` file is exempt
- an unreadable blob is a malfunction (exit 1, git's message above the header)
- a non-ascii path: a datestamp passes, a time of day halts with the raw path

## .where it came from

route `v2026_10_07.fix-radio-queue-drops-timestamps` in `rhachet-roles-bhuild`. peer reviewers
raised each gap (mech-failhides, arch-hazards-maintenance, ergo-friction-hazards,
enroll-impl-arch-defects), and the local copy carries every fix.
