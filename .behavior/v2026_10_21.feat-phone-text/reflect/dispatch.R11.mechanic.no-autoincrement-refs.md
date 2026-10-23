# seed: forbid auto-incremented ids as references; require a uuid or a slug

kind: reseed · into: ehmpathy/rhachet-roles-ehmpathy · role: mechanic
suggested home: `briefs/practices/code.prod/pitofsuccess.procedures/` (a pit-of-success pair)

## .the cue

the bhuild phone vision (`rhachet-roles-bhuild`, route `v2026_10_21.feat-phone-text`) first named
a text by a per-mailbox number (`--text 3`, `--re 1`). the wisher struck it: *"no <seq>, only
uuids"*, and asked for the rule: *"we never use auto incremented ids for references because they
are too easy to mistake; uuids and slugs are hard to mistake and impossible to collide on accident,
failfast for safety"*.

## .the pair

two files, the forbid first, since a forbid bites faster than a require.

---

### rule.forbid.autoincrement-references.md

#### .what

never let an auto-incremented id — a seq, an ordinal, a row number, a `#3` — be the name a human or
a clone uses to reference a thing: in a flag, an arg, a hint, a log, a link, a url, a record field
another record points at.

an ordinal may live inside storage, for order alone (a file name prefix, a db sort key). it is never
printed as a name and never accepted as one.

#### .why

- **a slip names a valid neighbor.** `--text 3` typed as `--text 4` reads, links, or deletes the
  wrong thing, with no error. the mistake is silent because every small number is valid
- **it collides across scopes.** a per-mailbox, per-table, or per-tree counter gives one thing a
  different number in each scope, and two things the same number in two scopes. a number copied
  from one scope into another names the wrong thing
- **it leaks order and count.** a sequence tells a reader how many came before

#### .enforcement

- an auto-incremented id accepted as a reference (flag, arg, url, foreign field) = **blocker**
- an auto-incremented id printed as the name of a thing in output a reader acts on = **blocker**
- an ordinal kept in storage for order, never printed, never accepted = **false positive**

---

### rule.require.uuid-or-slug-references.md

#### .what

every reference names its thing by a **uuid** (or a fixed-length prefix alias of one) or a
**slug**. a reference that matches no thing, or more than one, fails fast and loud.

#### .why

- **hard to mistake.** a slip in a uuid or a slug names no thing at all, so it fails at once
  instead of hitting a neighbor
- **impossible to collide by accident.** a uuid is unique across every scope; a slug is chosen,
  unique within its declared scope, and refused at mint if taken
- **one name everywhere.** the same uuid names the thing in every copy, view, and hint, so a
  reference copied between scopes still names the same thing

#### .how

- mint a uuid at creation; store it on every copy
- accept a prefix alias (e.g. the first 8 chars) on input for ergonomics; refuse an alias that
  matches two, and list the full ids. never store the alias
- where a human picks the name, use a slug, refused at mint if taken in its scope
- a number on input is refused (exit 2), and the refusal shows the accepted form

#### .enforcement

- a reference form that can silently point at the wrong thing = **blocker**
- an ambiguous prefix alias settled by a guess instead of refused = **blocker**
- a dangle (a reference that matches no thing) that proceeds rather than fails = **blocker**

---

## .provenance

worked case: the phone's text refs (`--text <uuid>`, `--re <uuid>`, a number refused with the alias
shown), and rhachet's own `@:<slug|serial>` clone refs, which already follow this shape.
