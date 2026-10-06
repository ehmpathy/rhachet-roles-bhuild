# glossary

## .what

the supervisor's vocabulary — one row per word: what it IS, and the synonyms it forbids.

one canonical word per concept. a synonym in a verdict, a command, or a brief = drift.

⇒ the full record for each term (etymology, rejected synonyms, measured evidence) is kept out of
this package, at `ehmpathy/rhachet-roles-bhuild:.agent/repo=.this/role=any/briefs/domain.terms/role=supervisor/`.

## .the layers

| term | is | never |
|---|---|---|
| **grove** | the machine a tree's crew runs on — `local`, `house://<slug>`, or `cloud://<slug>` | box, host, server, remote, runner |
| **grove.house** | a grove the house owns and operates, reached over a wire | onprem, self-hosted, edge, private |
| **grove.tunnel** | the ssm port-forward that carries every reach to one grove | session, link, pipe |
| **grove.purpose** | what a grove is FOR — and so whether a crew may live on it | tier, class, env |
| **crew** | the set of clones that work ONE tree | team, pod, worker set |
| **crew.reflector** | the third seat in the standard crew, beside mechanic and foreman | reviewer, critic, auditor |
| **duct** | an addressable channel to one worker's keyboard, named by a uri | terminal, tab, session, pane |
| **term** | one window a human reads — the VIEW half of a crew | console, screen, duct |
| **ledger** | a durable record that a subject EXISTED, apart from whether it is live | cache, manifest |
| **tree.achievement** | a tree booted with a clone on a stated goal and no route — the ladder's middle rung | job, errand, mission |

## .dispatch

| term | is | never |
|---|---|---|
| **sprout** | dispatch a TREE — worktree, ducts, bound behavior. work starts now | kick off, start, claim |
| **seed** | dispatch a radio TASK — a gh issue, queued. work does not start. the default | ticket, backlog, log it |
| **fell** | end a tree for good — worktree, branch, and every record that depended on it | kill, clean up, retire |

## .crew state

| term | is | never |
|---|---|---|
| **at-work** | a crew that holds one or more live ducts | online, alive, engaged |
| **down** | work axis off, tree still on disk — no live duct, a worktree to boot onto | inactive, killed, asleep |
| **asleep** | the crew's grove did not answer this sweep — no claim about the crew either way | timeout, unknown, unavailable |
| **park** | a clone's deliberate rest at a gate it may not open itself | stall, freeze, block |
| **crew.status** | whose move it is — the party who owes the next act | phase, verdict, disposition |
| **husk** | a directory under `_worktrees/` that git does not own | ghost, phantom, zombie |
| **phantom** | a record whose subject is gone — a registration that outlives its substance | ghost (an open collision; see the record) |

## .the box and pane — what a read can see

| term | is | never |
|---|---|---|
| **duct.box.quiet** | a box `empty` and unchanged for `--stall-mins` | parked, dormant, abandoned |
| **duct.box.unread** | the pane capture came back empty — no claim about the box either way | blank, silent, empty |
| **duct.box.ghost** | text the clone never typed — a dim autocomplete the next key replaces | placeholder, phantom text |
| **duct.box.inflight** | text a human has not finished, cursor still in it | partial, draft, unfinished |
| **duct.box.modal** | a program has seized the keyboard and awaits a choice from a list | prompt, dialog, question |
| **duct.box.covered** | claude is live, and another program is drawn over its input box | occluded, masked, blocked |
| **duct.pane.cap** | the pane carries a vendor usage-limit line (`resets <time>`) — may be stale | throttle, rate-limit, exhausted |
| **duct.pane.husk** | claude exited; its chrome stays in scrollback above a live shell prompt | stale box, corpse |
| **duct.pane.plea** | the clone printed the human-only command itself (`--as approved`) | escalation, gate, blocker |
| **duct.pane.relic** | a line the pane keeps after the state it named has passed | history, leftover, echo |
| **duct.program.wedge** | a program alive that does not answer — holds the pane, acts on no input | frozen, deadlock, unresponsive |
| **route.stone.clipped** | a stone whose verdict word was cut off by the width of its render | cut, elided, partial |

## .acts on a clone

| term | is | never |
|---|---|---|
| **read** | observe a surface we do not own, at one moment, without touch | inspect, capture, dump, tail |
| **send** | put a payload into a destination not ours, across a boundary we do not control | submit, dispatch, type |
| **duct.submit** | press Enter after text, so the box hands it over — a paste swallows the Enter | enter, commit, deliver |
| **nudge** | one message that restores a parked clone's MOTION on the plan it held | bump, kick, unstick |
| **steer** | hand a clone a concrete compliant path it did not see, then leave the choice to it | advise, unblock, override |
| **ask** | a message that hands the reader the work of an answer | query, prompt, poke |
| **escalate** | transfer a decision to the human, since it is not yours to render | raise, flag, block |
| **crew.resume** | return a clone to work with its prior context intact | reboot, revive, wake |
| **duct.reboot** | replace the program in a duct's pane; the duct, name, and cwd survive | recycle, bounce, kill |
| **duct.refresh** | repaint every attached terminal and return its geometry — a VIEW repair | resync, reset |
| **auth** | sign a brain in on a grove — carry an oauth handshake across to a browser | connect, link, pair, enroll |
| **auth.swap** | replace the account a machine is signed in as; the machine stays | re-signin, switch |
| **mech** | WHICH machinery a verb uses, where the verb has more than one road (`--mech`) | strategy, driver, backend |

## .the fleet and the grove

| term | is | never |
|---|---|---|
| **poll** | a read over a whole fleet at once — derived live, one verdict per subject | survey, monitor, watch |
| **poll.flap** | a verdict that alternates across polls while its subject holds still | race, churn |
| **grove.saturation** | how much a grove's work WAITS on cpu, memory, or io — a queue, never % busy | stats, resources, vitals |
| **grove.saturation.stall** | the share of wall-clock in which work waited on a resource | backpressure, wait time |
| **grove.prune** | end the runaway processes of one name on a grove, spare the rest | sweep, cull, nuke |
| **grove.process.unsignalable** | a process in uninterruptible sleep (`State: D`) — a signal queues, never lands | hung, zombie, wedged |

## .failure shapes of a report

| term | is | never |
|---|---|---|
| **false-report** | an instrument's normal success shape, full confidence, wrong content | silent failure, flake, stale output |
| **partial-audit** | an audit whose subject set is narrower than its claim, and the auditor does not know | incomplete, shallow audit |
| **volunteered-diagnosis** | a guess an instrument prints beside its measurement, in the measurement's voice | inline explanation |
| **substituted-criterion** | a verdict against a standard the assessor supplied in place of the one already set | scope creep, lowered bar |
| **replication** | a party that could NOT have read the record reaches the same distinction | confirmation, second opinion |
| **spiral** | a loop where the effort to escape the trap deepens it | livelock, thrash, doom loop |
| **braid** | a second path laid beside a serviceable one, because its author did not look | duplicate, fork |
| **clamp** | a test that holds a repaired defect shut — red while present, green once fixed | latch, smoke test |
| **factory-upgrade** | a change to the tools that build the work, rather than to the work | chore, infra fix |

---

written by human + beaver 🦫
