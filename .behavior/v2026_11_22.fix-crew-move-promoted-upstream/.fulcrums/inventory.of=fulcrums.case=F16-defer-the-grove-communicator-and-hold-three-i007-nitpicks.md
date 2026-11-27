# F16 — defer the grove communicator, and hold three i007 nitpicks

## .the fork

r011 blocker.1 asks for the fix at the cause: one `__duct_tmux_on_grove` that quotes every arg, with all ~20 sinks routed through it. either build it now, or close the injection at each sink and pin that with a clamp, then dream the communicator.

r011 also raised three nitpicks that this round holds rather than changes: nitpick.2 (`:` `=` `@` read as tmux target syntax, and a locale-bound regex), nitpick.4 (four ssh trips per grove `duct.open`), and nitpick.5 (comment churn in `ductwork.life.sh`).

## .taken

| point | taken | why |
|---|---|---|
| blocker.1, the communicator | close at each sink, add a clamp, and dream the refactor | the session wall now matches the sink quote contract: a `'` or a control char is refused, and every sink single-quotes the name. every other spliced value has a guard at its parse. `work.surface.layout` case20 fails on any unvetted `$(__duct_tmux_cmd)` splice. the communicator touches ~20 live sites in 5 files, a ripple past this diff. dream: `.dream/v2026_11_27.refactor.one-grove-tmux-communicator.md` |
| nitpick.2, target syntax and locale | hold | the session wall is no longer an allowlist, so its regex range is gone. the host test is a bash glob, which matches by ascii range (`globasciiranges`, on by default in bash 5). `:` cannot reach a session name: git refuses `:` in a ref (`git check-ref-format`), and tmux itself swaps `:` and `.` to `_` in a session name. `@` sits in the host part only, where `user@grove` is its intended sense |
| nitpick.4, four ssh trips | hold, per F15 | the trips are the pure-read probe and the read-then-write anchor that F15 holds. each trip is bounded (BatchMode, ConnectTimeout, ServerAlive), so a silent grove cannot hang a seat raise |
| nitpick.5, `life.sh` churn | hold | the cut `.why` block was a word-for-word copy of the one that sits below the `-d` test in the same function. the cut leaves a pointer to it. the `⚠️`→`🟡` swap is owed: `⚠️` is width-ambiguous (`rule.forbid.width-ambiguous-glyphs`), and both lines sit in the function this route edits |

## .rework

clean for the three nitpicks: each is a local revert or edit.

dirty for the communicator, if the director wants it in this route: ~20 sites, 5 files. that is why the call is held to the end.

## .confidence

75%. the reviewer is right that the quote rule should live in one communicator. what holds this round is the clamp: a new raw splice turns red.

## .where

`src/domain.roles/supervisor/skills/work/ductwork.{uri,io,life,pane,host}.sh` · `work.surface.layout.integration.test.ts` case20

## .the i008 reopen

round i008 (r011 blocker.1) found a sink this fulcrum's clamp did not see: the crewwork tree lookup sent `sh -c "…$dotted…"` over ssh, so two shells parsed the slug, and its deny-list guarded one. a slug that pairs off quotes ran on the grove. the same class sat in `pollwork.read.sh`. both now ride `__duct_bash_on_grove` with `%q` names, and case20 now reads every `ssh` call, not just `$(__duct_tmux_cmd)` lines. the communicator stays dreamed: the claim this fulcrum rests on is now "every ssh sink in the surface splices only a vetted value", and case20 pins that wider claim.

## .verdict

open, for the director.
