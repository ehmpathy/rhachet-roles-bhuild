# F24 · the claude, statusline, and grove contracts are proven by live walks, not by a ci case

## .the fork

the 5.3 peer `mech-external-contracts` asks for an integration test against each real external
surface the two verbs read:

1. claude code's transcript jsonl (`message.usage`, `message.id`, `sessionId`, `isSidechain`)
2. the statusline stdin a seat hands `claude.statusline.caplog` (`rate_limits.*`, `workspace.project_dir`)
3. the live claude binary `claude.statusline.probe` scans
4. a real grove, over real ssh
5. (nitpick) bhrain's `routeStatusLine` render, and (nitpick) the `BRAIN_LIVE` gate on the one live claude call

- **(a)** add a live ci case for each
- **(b)** keep the hermetic clamps in ci, and hold the live proof in the recorded walks
- **(c)** commit a captured sample of each surface and parse it in ci

## .taken, and why

(b), with (c) as the follow-up shape.

- **ci holds none of the four surfaces.** ci installs no `claude` (F23 names the five behaver
  suites that skip for the same cause), runs no seat with a statusline, and holds no ssh key to any
  grove. a live case there is a deterministic red, or a skip, and a skip is forbidden at 5.3
- **the live proof is on record, verbatim.** the 5.3 critical-path walk read this grove's real
  transcripts through the linked verb: 7 crews, 27.3M over 60 min, each crew named with its seat
  count and account (`review/self/for.5.3.verification._.has-critical-paths-frictionless.md`). the
  same walk hit a real grove over real ssh, and its real failure (no jq) is what cured the jq row.
  0901 was read three times over ssh for the report (5.1 yield). the probe read `yes` on the live
  2.1.280 binary (5.3 yield, groundwork)
- **the clamps keep the real field names.** the fixture builder (`asTranscript`) writes the exact
  keys the live transcript carries, checked against a real line at groundwork. a rename upstream
  makes the live walk read 0, which the meter renders `⚪`, never as a silent number
- **(c) is the right shape, and a dream holds it**: a captured line of each surface, masked of
  clock times (the commit gate refuses an iso instant in a tracked file), parsed in ci. it is new
  test work across four surfaces, outside this stone's cure of the verbs it ships

## .rework

clean: a captured fixture adds a test; it changes no verb.

## .confidence, and why it is low

60%. the rule reads "at least one integration test that calls the real service". this call reads a
recorded live walk as that call, since ci cannot reach the service. a council may want (c) before
the merge.

## .verdict

open — the council's.
