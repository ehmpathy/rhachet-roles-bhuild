# F1 — `GH_TOKEN` is an ambient source, ahead of `GITHUB_TOKEN`

## the fork

the wish names the ambient credential as "the gh login, or `GITHUB_TOKEN` in the env". `GH_TOKEN`
is not named.

- **A:** ambient = `GITHUB_TOKEN` → gh login (the wish's words, literally)
- **B:** ambient = `GH_TOKEN` → `GITHUB_TOKEN` → gh login (gh's own precedence)

## taken: B, and why at the time

gh reads `GH_TOKEN` before `GITHUB_TOKEN`, and both before stored credentials
(https://cli.github.com/manual/gh_help_environment). a box that sets `GH_TOKEN` already has `gh`
act under it; for radio to skip it would make radio send under a different identity than `gh`
does on the same box.

## rework: clean

one source dropped from the ambient derive, one line in the vision contract, one row (23/29) in
the inventory. no caller hardens against it.

## confidence: 90%, and why not higher

the wish's text omits `GH_TOKEN`; the omission could have been deliberate.

## where

- `1.vision.yield.md` — `## the contract`, `**the ambient credential**`
- `1.vision.experience.case=_.md` — rows 23, 29

## verdict

**stands** — director, 2026-11-08: "gh itself reads GH_TOKEN before GITHUB_TOKEN, so the ambient
credential the wish names includes it".
