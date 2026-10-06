# rule.prefer.release-into-prod-phrase

## .what

to ship a mechanic's completed work, tell it **"release into prod"** — one phrase.
its route workflow forces the full release cycle from there. do NOT spell out the
individual git steps (commit / push / merge / release / watch); the workflow drives
them.

## .why

a mechanic at `route complete` with staged, verified work already knows how to
release — its bound workflow enforces the sequence. a step-by-step is redundant,
slower, and risks a clash with the workflow.

## .the lever

```bash
rhx git.crew.send --tree $tree --who mechanic --what 'release into prod'
```

this is exception 2 of `rule.forbid.steer-a-clone-beyond-a-permission-key`: it relays a
human's authorization. send it only to a tree that is verified and whose release the human
granted.

the workflow then forces, on its own: commit (correct scope + bound level) → push +
open PR → `rhx git.release --into prod --apply --watch` → watch CI to green, fix
real failures, retry proven flakes.

## .the one exception — rebase first when a shared-file predecessor just merged

the workflow does not know it must rebase. when a prior tree just merged changes to
files THIS tree also touches, prepend a rebase instruction:

```bash
rhx git.crew.send --tree $tree --who mechanic --what 'prior tree merged — rebase onto main first, then release into prod'
```

otherwise, just "release into prod". the prefix states a fact (which tree merged) and an
order; it never prescribes how to rebase — the mechanic's own tools carry that.

### "rebase first" means before the RELEASE, never before the COMMIT

git cannot rebase a dirty tree, so where work is still uncommitted the only valid
sequence is: commit → rebase → classify + resnap → re-run → release.

where you cannot tell if the tree is clean, say "commit, then rebase onto main, then
release into prod" — correct on a dirty tree, harmless on a clean one.

a mechanic that converges with a supervisor instruction rather than obeys it blindly
is the same job `rule.always.converge-with-reviewers` asks of a driver, one layer
up — a relayed instruction is a proposal, never a spec.

## .what still needs the human

"release into prod" primes the mechanic, but human-only gates still hold the actual
release. surface these; never self-grant:

- `git.commit.uses` quota / `--org` block — human only. an org-level block
  overrides any per-tree grant (precedence: org > local), so a mechanic can look
  blocked even after a per-tree quota grant — the fix is to lift the org block
- release / push authorization — human only

a blocked mechanic told to "release into prod" is still correct: it re-checks the
gate, and the instant the human flips it, the mechanic drives the rest with no
further prompts.

## .serialize releases that share files

trees that touch the same files (e.g. peer extract fixes with shared snapshots)
release ONE AT A TIME. release the first; once it merges, rebase + release the next.
parallel releases collide on the shared files. see `rule.require.one-pr-per-worktree`.

## .see also

- `rule.require.respect-git-commit-uses.md` — the git.commit.uses gate
- `rule.require.babysit-permission-approval.md` — approves routine prompts, never self-grants release/quota gates
- `rule.require.one-pr-per-worktree.md` — serialize shared-file releases with rebase

---

written by human + seaturtle 🐢
