# F34 — two snapshot shifts a prior lane asked for stand: the narrowed meter pitch, the `(none)` hints as peers

## .the fork

r012 (5.3 i006) asks to confirm two shifts its own rubric reads as test changes with no ask behind
them. both came from r011's own asks at i005.

1. **the no-clone refusal's meter pitch**
   - **A (taken)**: the pitch (`a human holds no mailbox; a human lifts the meter …`) prints only
     where the meter governs the verb: `phone.contacts set` and `del`. `phone.text` never pitches
     it (r011 n4, i005), and `phone.contacts get` no longer does either (r011 n8, i006)
   - **B**: every contacts verb, and every text verb, pitches the meter
2. **the empty-contacts `(none)` layout**
   - **A (taken)**: the grant hints sit beside `(none)` as peers, not as its children (r011 n3, i005)
   - **B**: the hints nest under `(none)`, as HEAD drew them

## .taken, and why at the time

1. the meter governs a change of contacts and naught else. a pitch on a verb it does not govern sends
   the human to lift a meter that would not help them; a read or a text never needs it. so A names
   the meter where it is the fix, and only there. a `not.toContain('phone.contacts.uses')` assertion
   pins A for `phone.text` and for `phone.contacts get`; a `toContain` pins it for set and del
2. `(none)` is a fact; the hints are next moves. a next move nested under the fact reads as a detail
   of the empty list (`rule.forbid.treestruct-indented-text-as-children`). the hint text is unchanged

## .rework

clean. each is one render branch and its snapshot lines.

## .confidence — 85%, low because

the shift to each output came from one lane's ask, and another lane reads it as an unasked test
change. a human may prefer the pitch everywhere, as one sure path to the meter.

## .where

`src/domain.operations/phone/self/getOnePhoneSelf.ts` (the `pitch` input, set by each cli),
`src/domain.operations/phone/render/asPhoneContactsGetOutput.ts` (the `(none)` rows). raised by
r012 n1 and n2 at 5.3 i006.

## .verdict

(best-guessed; open to the council)
