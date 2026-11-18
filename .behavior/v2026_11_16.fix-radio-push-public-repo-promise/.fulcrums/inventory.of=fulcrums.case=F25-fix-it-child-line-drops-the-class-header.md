# F25: a `fix it:` or `fault:` child line drops the doubled class header

## .the fork

a held tree's last branch reads `fix it: <message>`, and a drain row reads `fault: <message>`. the message
comes from a thrown error, so it opened `✋ ConstraintError: …`. the fork:

- **a.** keep the header inside the child line: `└─ fix it: ✋ ConstraintError: --auth … is not set`
- **b.** cut it from the child line: `└─ fix it: --auth … is not set`. the class still opens the run's header
  (`└─ ✋ blocked by constraints`) and the exit code (2) still carries it

## .taken: b, and why at the time

- **5.3 i003 r006 (ergo-snapshot-visual-blemishes) raised the doubled header as a blemish.** a label, then a
  glyph, then a class, then the message reads as two openers on one line
- **`rule.require.qualified-error-headers` governs the opener a human reads first** — "every human-read error
  opens with its class". a held tree is not an error opener: the push did not fail, it was held, and the tree
  opens with `🦫 held for the radio`. the child line is a labelled field inside it, like `cause:` or `hint:`
- **the class stays visible where the rule puts it.** stderr still prints `✋ blocked by constraints`, and the
  exit code is 2. naught about who fixes it is lost
- **one transformer, one regex** (`asRadioLineWithoutClassHeader`): it cuts a `✋|💥 <Name>Error:` only at the
  start of the line, and keeps any other text (its unit test: `HttpError:` kept)

## .rework

clean. drop the wrap at `asRadioPushOutput.ts` and `asRadioFaultDetailLine.ts`, resnap 7 lines. no contract
change beyond the bytes.

## .confidence, and why it is low

75%. two peer lanes disagree: r006 asked for the cut, r012 (5.3 i004) asks to restore it under the header rule.
a wisher who reads the header rule as "every line that carries an error" would choose a.

## .where

`src/domain.operations/radio/record/asRadioLineWithoutClassHeader.ts`, called by `asRadioPushOutput.ts` and
`asRadioFaultDetailLine.ts`. snaps: `radioTaskPush.integration` case6–10, via-gh-issues case7 and case8.
