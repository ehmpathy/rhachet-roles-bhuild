# inventory of fulcrums

| case | title | rework | status | confidence |
|---|---|---|---|---|
| F1 | cross-tree say runs `rhx clone say` with cwd at the peer tree | clean | council verdict: A stands | — |
| F2 | address = `phone://grove=<grove>/tree=<tree>/clone=<clone>`, one fixed order; `@:<clone>` shorthand | clean | ruled by wisher | — |
| F3 | contacts self-management gated by the `phone.contacts.uses` meter, blocked by default always | clean | ruled by wisher | — |
| F4 | a director gets the meter grant from its boot hooks (ruled); a per-seat grant at crew boot, reachable in this repo, stays a dream | clean | director half ruled by wisher; crew half council verdict: dream | — |
| F8 | three nouns, each get · set · del: `phone.text`, `phone.contacts`, later `phone.call` | clean | ruled by wisher | — |
| F5 | an unconfirmed say settles FAULTED, never auto-resent (at-most-once) | clean | ruled by director: lean stands (2026-10-23) | 80% |
| F6 | each delivery writes an `in` copy into the peer tree mailbox (a write into a foreign tree) | clean | ruled by director: lean stands (2026-10-23) | 75% |
| F7 | a clone may reply to any clone that texted it, contact or not | clean | ruled by director: lean stands (2026-10-23) | 80% |
| F9 | a text is named by its uuid alone (alias: first 8 chars); a number is refused; `--text <uuid>` on get/del, `--re <uuid>` on set | clean | ids ruled by wisher; flag settled by director | — |
| F10 | the clone slot is `clone=<clone>`; `@:` stays shell shorthand, never stored | clean | settled by director | — |
| F11 | `phone.contacts set/del` take no `--at`; a grant runs as the clone it widens | clean | ruled by wisher | — |
| F12 | texts and contacts are per seat (F24); daemon and meter per tree; `clone=` takes the slug, or the full serial for a clone with no slug | clean | texts + contacts ruled per seat (F24); daemon/meter scope per tree ruled by director: lean stands (2026-10-23) | 85% |
| F13 | the grove leg (push, pull, relay) rides a later delivery; a text across groves is refused loud | clean | ruled by director: lean stands (2026-10-23) | 70% |
| F14 | this grove's own name is `PHONE_GROVE`, else the hostname | clean | best-guessed | 75% |
| F15 | the daemon polls every 3s, and exits after 30 min with no QUEUED text | clean | best-guessed | 80% |
| F16 | a daemon crash between the say and the settle settles the text FAULTED, never resaid (at-most-once, like F5) | clean | best-guessed; closed in code at i001 | 90% |
| F17 | the phone keeps its own treestruct renderer; the lift into infra is deferred (dream) | clean | best-guessed | 85% |
| F18 | a group send writes one record per peer; a crash mid-write may leave part of the group QUEUED | clean | ruled by director: lean stands (2026-10-23) | 80% |
| F19 | the critical path is proven in-process with a fake rhachet boundary; the live two-clone demo is the byhand playtest | clean | council verdict: fake + playtest | — |
| F20 | a clone's contacts file is written last-write-wins; one writer at a time is assumed | clean | council verdict: no lock | — |
| F21 | a send that races `phone.daemon del` reads LIVE and waits for the next send; the fix is a dream | dirty | ruled by director: lean stands (2026-10-23) | 75% |
| F22 | notice retry, one wedged say, per-tick cost, `get` unbounded, the stale flag, layer placement, daemon upgrade + env are deferred to a dream | dirty | ruled by director: lean stands (2026-10-23) | 80% |
| F23 | the changes outside the phone ship in the phone's pr, named in its body, per the director's "commit the whole tree"; the regenerated settings file stays out | clean | settings file ruled by director (out of the commit, not restored); rest best-guessed | 70% |
| F24 | a revived clone keeps its seat: mailbox and contacts key by the slug, the serial only where a clone has none | clean | ruled by the director: per seat, never per serial; built in round i009 | 100% |
| F25 | a `clone socket auth error … auth-denied` line in this clone's pane is rhachet's socket server, not the phone daemon; the phone writes no pane but by `clone say` | clean | best-guessed; raised by the surdirector | 70% |
| F26 | nine extant `describe.skip` suites outside the phone (brain + gh.issues lanes), untouched since origin/main, stay skipped; a dream un-skips them | dirty | best-guessed | 70% |