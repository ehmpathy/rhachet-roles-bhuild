# rule.forbid.live-review-rosters-in-acceptance-journeys

## .what

an acceptance journey that drives a route through its guards must not walk the guards'
full review rosters. stub the reviewers down to one per stone, and test the rosters in
isolation.

| what the journey proves | how |
|---|---|
| the guard this repo emits gates under the bhrain driver | live: blocked without a promise, allowed after one |
| the peer + judge sections parse and hold | live, verbatim — only the self-review roster is stubbed |
| every self-review in every guard variant is well formed | isolated: read the source templates, no driver call |

## .why

- **each review is a round trip through bhrain.** a self-review costs one pass (to trigger)
  plus one promise. each call is a fresh node that imports bhrain — measured 2–6s on a
  loaded box, and none of that cost is this repo's code.
- **the heavy roster is ~30 self-reviews.** one live journey made ~90 driver calls and ran
  300s+ per stone suite, which alone broke the 5-minute acceptance budget.
- **the roster count proves naught the driver does not already prove.** bhrain's own
  suite owns "every self-review must be promised". this repo owns the guard *content* —
  and content is read, not walked.

⇒ the walk tests bhrain's loop N times over. one stub reviewer proves the gate is
connected; the template read tests every reviewer.

## .how

- after `init.behavior`, rewrite each stone's `reviews: self:` block to one stub slug.
  leave `peer:` and `judges:` verbatim — they are the connections under test.
- stub every external reviewer the guard shells to (`claude`, `enroll`, `review`) so a
  peer review returns `0 blockers` / `0 nitpicks` at once.
- assert the self-review rosters of every template variant in a template-read suite:
  dash-case slugs, a non-empty `say`, no duplicate slug.

## .enforcement

- an acceptance journey that promises a guard's full self-review roster live = **blocker**
- a stub that also replaces `peer:` or `judges:` = **blocker** (the connection under test is gone)
- a roster left untested in isolation after it was stubbed = **blocker**

## .see also

- `howto.test-self-reviews-via-bhrain.[lesson].md` — the pass → backdate → promise protocol
  the stubbed roster still follows, once
- `rule.require.guard-variant-consistency.md` — why every variant is read, not just heavy
