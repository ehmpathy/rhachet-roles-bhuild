# F15 — the daemon polls every 3s, and exits after 30 min with no QUEUED text

## .the fork

- **A (taken)**: a poll of every clone mailbox each 3s (A3); the daemon exits once no QUEUED `out`
  text has existed for 30 min, and the next `phone.text set` starts it again
- **B**: a file watch (`fs.watch`) in place of the poll
- **C**: a daemon that never exits

## .taken, and why at the time

a poll is the simplest correct design across editors, network mounts, and a rename-based write; a
missed watch event would strand a text. a daemon per tree that never exits leaks one process per
tree ever texted from. a text that waits on a peer (at a modal, dead) keeps the daemon awake, so an
exit never strands a text.

## .rework

clean — two constants in `runPhoneDaemon`.

## .confidence — 80%, low because

the 3s cadence sets the floor on delivery latency, and each tick re-says a text that still waits on
a withheld peer; a wisher may want a backoff.

## .verdict

(awaits council)
