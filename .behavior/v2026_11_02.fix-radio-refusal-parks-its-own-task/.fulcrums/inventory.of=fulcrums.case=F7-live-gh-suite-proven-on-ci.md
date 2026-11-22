# F7 — the live gh.issues suite is proven on this pr's ci, not on this host

## the fork

- (a) prove `skill.radio.task.push.via-gh-issues` green on this host before 5.1 passes
- (b) prove it green on this pr's ci run (`git.release --watch`, which the wish's "done" already
  demands), and cite that run in 5.3

## taken: (b), and why at the time

- `EHMPATH_BEAVER_GITHUB_TOKEN` is absent from this host's keyrack (`rhx keyrack unlock --owner
  ehmpath --env test` → `status: absent 🫧`). to set it is a human act; the driver holds no lever
- ci holds it: `.github/workflows/.test.yml` hydrates it via `keyrack firewall --env test`, and the
  shard `test-shards-acceptance (explicit, 2, skill.radio.task.push.via-gh-issues)` passed on #605
  (run 41204255581) — the base this branch sits on
- this diff does not touch that suite's file, and touches the send path only on a fault branch
  (the headline write) plus a settle that clears a null headline on delivery. the new words are
  proven at the stub-gh grain (case9, recorder [case7]) because a real github refusal cannot be
  provoked on demand, and the wish forbids a live probe that edits a real issue
- the wish's own "done" is `git.release --watch` green, which runs this exact suite with the token

## rework

clean: if the wisher wants (a), they set the key once
(`rhx keyrack set --owner ehmpath --key EHMPATH_BEAVER_GITHUB_TOKEN --env test --vault <vault>`) and
the driver reruns `rhx git.repo.test --what acceptance --against local --env test --scope
path://skill.radio.task.push.via-gh-issues --mode apply`.

## confidence: 80%, and why it is low

two peer lanes (behavior-intent-coverage, ergo-friction-hazards) read
`rule.require.external-contract-integration-tests` as "credentials absent = blocker, not deferral".
the proof is deferred one stage, not skipped — but the rule's letter favors (a).

## where

`5.1.execution.from_vision.yield.md` proof table; 5.3 must cite the ci run.

## verdict

open — for the council.
