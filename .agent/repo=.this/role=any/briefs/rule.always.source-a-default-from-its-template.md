# rule.always.source-a-default-from-its-template

> **a template holds the DEFAULT. an instance holds the STATE.**

when you need to know what a value is *supposed* to be — a budget, a threshold, a flag, a
timeout — read it from the **template** the instance was stamped from. read the instance only
to learn what has *happened* to it since.

🟡 **the two are indistinguishable on the page.** a stamped instance and its template carry the
same key, the same type, the same shape. only the provenance parts them, and the instance does
not announce that it has drifted.

## .why — an instance's value is a RECORD, never a declaration

`initBehaviorDir` stamps a route guard from `templates/1.vision.guard.light`. from that moment
its values accrue. `rhx route.guard.budget --add N` writes back into the instance; a driver edits
a glob; a mutation lands. so the number you read is *what this route has been through*. it
answers *"what happened here?"* — never *"what did we mean?"*

⇒ to copy that number into a new lane is to propagate an accident as though it were a design.
the worked case — a template default of 3, read off an instance as 14:
`rule.always.source-a-default-from-its-template.example=the-budget-of-14.md`.

## .the family — this is the third instance of one shape

| the artifact | read as | actually is |
|---|---|---|
| an extant file's **mtime** | a clock | a record of a **past write** (`rule.always.date-a-record-from-the-filesystem`) |
| a **peer budget count** at `14/14` | a wall | a record of **rounds spent**, with no claim about a remedy |
| a stamped guard's **budget: 14** | the default | a record of **top-ups applied** |

⇒ **each time, a reader took a log for a verdict.** the general form:

> **a process WRITES into the instance; the template holds what it was CONFIGURED with. a written value is state, so read the default from the template.**

## .the check

> **"is this value declared here, or accumulated here?"**

| when… | then… |
|---|---|
| it is a **template**, a schema default, a constant | declared. cite it, copy it |
| it is a **stamped instance**, a counter, a timestamp, a ledger | accumulated. read it for state only; to learn the intent, find what stamped it |
| you copy a value from a **peer entry** in the same file | 🔴 the sharpest cue — peers share provenance **and** share drift |
| an artifact carries a `provenance:` key | it names the template. read that |
| you would say *"the local convention here is X"* | a convention is declared upstream; this is one instance of it |
| you reason from a **count** to a conclusion | ask what writes the count, and what it is a count *of* |

## .the caveat

an instance's value is often **correct** — a route that earned 14 rounds should keep them, and to
reset it to the template default is a mutation with no cause. the rule governs where a **new**
value comes from, never whether you preserve an extant one.

## .enforcement

- a new value copied from a stamped instance where a template declares the default = **blocker**
- a `provenance:` key present and unread, while a default is chosen = **blocker**
- a count read as a verdict, with no check of what writes it = **blocker**
- an accrued instance value reset to its template default with no cause = **blocker** (the
  reverse error)

## .see also

- `rule.always.date-a-record-from-the-filesystem` — the clock instance of this shape
- `rule.require.trust-but-verify` (ehmpathy/mechanic) — the parent; this names one item to verify
