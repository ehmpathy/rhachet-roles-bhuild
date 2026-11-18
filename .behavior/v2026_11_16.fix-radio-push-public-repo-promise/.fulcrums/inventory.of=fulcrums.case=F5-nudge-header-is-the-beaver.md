# F5: the nudge opens with `🦫 hold up`, not `✋ ConstraintError:`

- **raised by:** peer mech-failhides, blocker.1 (rule.require.qualified-error-headers)
- **the fork:**
  - keep the issue's nudge verbatim, opened by `🦫 hold up — this task goes to a public repo`;
  - or prepend `✋ ConstraintError: push to public repo <o/n> needs an anonymized promise` above it.
- **taken:** keep it verbatim. three reasons, each checkable:
  1. the issue (ehmpathy/rhachet-roles-bhuild#675) fixes the nudge's text, and the wish's done list
     says "the nudge is snapped". the vision, approved by the director, quotes it line for line
     (`1.vision.yield.md` .after).
  2. the nudge is a **held fate** of a push, not an error. the radio already renders every held push
     under a `🦫` header with exit 2 and no class header: "🦫 onto the pile!"
     (`asRadioPushOutput.ts`, the held branch). a held push is a status report. the qualified-header
     rule governs errors a caller must fix.
  3. the one real error on this path, a bad `--promise` value, **does** open with
     `✋ ConstraintError:` (the blueprint's "output channels").
- **the reviewer's case, re-raised at round 3 (its budget then spent), stated fairly:**
  1. exit 2 is the constraint code by rule.require.exit-code-semantics, so a message emitted on exit
     2 *is* a constraint error.
  2. from the first line alone, a human cannot tell they must act.
  3. `🦫` is one more bespoke opener, which the rule forbids.
  4. "🦫 onto the pile!" is extant code; the nudge is new code, so it must comply.
- **where the two cases part:** whether the issue's verbatim text binds the header, or only the
  body. if only the body: prepend `✋ ConstraintError: push to public repo <o/n> needs an anonymized
  promise` and keep the 🦫 block beneath. that serves both rules, at the cost of a second header
  that restates the first.
- **rework:** clean. one line prepended in `asRadioPromiseNudgeOutput`, plus one snapshot update.
- **confidence: 80%.** exit 2 is the constraint code, so a reader could fairly call the nudge an
  error. the issue's verbatim shape and the extant held-output precedent outweigh that.
- **where:** `asRadioPromiseNudgeOutput`
- **verdict:** open, for the council at the close
