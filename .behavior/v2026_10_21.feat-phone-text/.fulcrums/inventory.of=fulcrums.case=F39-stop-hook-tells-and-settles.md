# F39 — the stop hook tells each held text once, settles it DELIVERED, and exits 2

## .the fork

the order: "onStop the phone should have a hook that also lets them know of messages that are held
for them, in case the daemon has a failure".

- **A (taken)**
  - the dispatcher's onStop hook claims each QUEUED `in` copy for the clone
  - it settles each one DELIVERED, reason `told at stop, by the onStop hook`, mirrored to the sender
  - it prints the texts to stderr, as a say would, and exits 2 so the clone reads them
  - no held text: silent, exit 0
  - a fault of its own: one line, exit 0, never a blocked stop
- **B**: the hook only lists the held texts and leaves them QUEUED for the daemon
- the entry is `cli.phoneNotifications`, run by the hook; no `phone.notifications.sh` skill ships

## .taken, and why at the time

under B the daemon would later say each text a second time, and the stop would repeat on every
stop. A tells each text once, as a say does. a stop hook that could fail closed would trap a clone,
so a fault never blocks.

## .rework

clean. the hook is one entry in `getDispatcherRole`, one cli entry, one operation.

## .confidence — 75%, low because

DELIVERED by the hook reads the same as DELIVERED by a say, told apart only by the reason.

## .where

`src/contract/cli/phoneNotifications.ts`, `src/domain.operations/phone/text/setPhoneTextsToldAtStop.ts`,
`src/domain.roles/dispatcher/getDispatcherRole.ts`.

## .verdict

(best-guessed)
