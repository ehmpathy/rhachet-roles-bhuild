# F38 — the grove leg: one ssh call per write, by the registry's alias; no say crosses a grove

## .the fork

the order: "a cross-grove send writes through the grove connection, with no daemon".

- **A (taken)**
  - each write is one ssh call to the alias in `<forestDir>/groves/<grove>.json`
  - the call runs the far grove's own `phone.inbox` in the far tree, with the payload on stdin
  - verbs: `put` (a text or a group), `del` (a withdraw), `set` (mirror a settle back)
  - the far daemon says the text, and mirrors each settle back to the sender's `out` copy
  - a fail notice to a sender on another grove is that mirror alone; no say crosses a grove
- **B**: a relay daemon per grove that pulls from the other

## .taken, and why at the time

A is the path a human already uses (`git.grove.send` reads the same alias). the far phone writes
its own disk with its own package. B is a second daemon the order said not to keep.

## .the bounds A carries

- the mirror back needs the sender's grove registered on the far grove
- each grove's `PHONE_GROVE` must match the name the other registry holds
- a far fault comes back as one headline; its stderr stays on the far side

## .rework

clean. `sdkPhoneGrove` is one file, behind `PhoneContext.sdkGrove`.

## .confidence — 70%, low because

the live leg runs here only against a stub ssh (acceptance case14); a real two-machine walk is the
playtest's.

## .where

`src/access/sdks/sdkPhoneGrove.ts`, `src/contract/cli/phoneInbox.ts`,
`src/domain.operations/phone/text/setPhoneTextCopies.ts`, `.../text/setPhoneTextOutMirror.ts`.

## .verdict

(best-guessed; supersedes F13 by the commander's order)
