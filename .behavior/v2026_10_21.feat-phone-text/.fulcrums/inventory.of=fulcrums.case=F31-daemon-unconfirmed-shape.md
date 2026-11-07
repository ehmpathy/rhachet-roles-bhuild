# F31 — `phone.daemon set` UNCONFIRMED reads as a phone refusal: the vision's vibe, then the 💥 header

## .the fork

the output a `phone.daemon set` prints when it spawned a daemon yet never saw its lock LIVE.

- **A (taken)**: the shape every phone refusal has — `🦫 bummer, the daemon did not surface`, a
  blank line, then `💥 MalfunctionError: the daemon did not surface` with its tree (state, the wait,
  the log, the retry). the `💧 phone.daemon set` root line is gone: the 💥 header is the root
- **B**: the shape the first snapshot locked (HEAD) — `💥 MalfunctionError: …` first, a blank line,
  then the `💧 phone.daemon set` root and its tree; no 🦫 vibe

## .taken, and why at the time

the approved vision renders it word for word (`1.vision.yield.md:492`): "a start whose lock is never
seen LIVE reads `🦫 bummer, the daemon did not surface`, exit 1, and names the log." every other phone
failure (`genPhoneRefusal`, the corrupt-meter malfunction) opens with the 🦫 vibe, then the qualified
header. B dropped the vision's line; A holds it and keeps the qualified header
(`rule.require.qualified-error-headers`), so a human reads the class and the system as the one at
fault.

the vibe repeats the headline's words ("did not surface") on purpose: the vision names that line, and
the header must name the same fact in its class's words. a varied vibe would drift from the vision.

## .rework

clean. one render (`asPhoneDaemonSetOutput.ts`) and one unit snapshot (`asPhoneDaemonOutput` case5);
no caller reads the text.

## .confidence — 70%, low because

it reverses an output the first round locked, and a reviewer (r012, i005) asks for a human to confirm
the reversal, which no driver can grant itself. the director carries it to the commander.

## .where

`src/domain.operations/phone/render/asPhoneDaemonSetOutput.ts`, its case5 snapshot. raised by r012 b1
and r011 n6 at 5.3 i005; raised again by r012 b1 at i006, which asks for a revert to B until the
human rules. the fork stays at A: the vision is the approved contract, and a revert would ship a shape
the vision does not name, to undo it again if the human confirms A. either way the change is one
render and one snapshot, so no work rides on the wait.

## .verdict

(open — awaits a human confirm, via the director)
