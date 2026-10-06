# rule.always.carry-the-slug-in-a-dispatch-title

## .what

> **when you seed a task that a local record also tracks, the record's slug goes in the
> TITLE — never in the body alone.**

```
👎  tune ACU consumption                              # body holds the slug
✅  svc-lessons-acu-tune — tune ACU consumption          # title holds the slug
```

## .why — the queue read returns TITLES ONLY

```sh
rhx radio.task.pull --via gh.issues --from sandpine/svc-lessons --list --auth as-human
   ├─ [QUEUED] 140: tune ACU consumption
   └─ [QUEUED] 139: upgrade postgres off the extended-support version
```

no body, no labels, no metadata. a slug written into the body is structurally unreachable to
every caller that searches the queue, and a search that cannot reach it returns a clean,
confident "none" (`term=partial-audit`: complete over the field it could see, false about
the world).

## .a one-way crossref is not a crossref

| direction | carried by | reachable? |
|---|---|---|
| row → task | `eco.priority set --ref-task <repo>#<n>` | ✅ declared on the row |
| task → row | the issue title | ✅ only if the slug is there |
| task → row | the issue body | 🔴 no — the list read never sees it |

a link the machine cannot follow is a note to a human, not a reference. the row finds the
task; the task cannot find the row; a sweep over the queue reports every such pair as
untracked.

## .the cues

| when… | then… |
|---|---|
| you seed a task a local store also tracks | lead the title with the slug |
| you write the slug into the body and stop | invisible to the list read |
| a sweep says "none" and a record exists | check the title before you trust the verdict |
| you set `--ref-task` and feel the link is done | that is one direction; the title is the other |
| a title would read oddly with a slug prefix | reads fine — the queue sorts by it |

## .the shape

`<slug> — <what a human needs to read>` — an em-dash, not a colon (a colon reads as a
conventional-commit scope).

## .the entoolment owed

the crossref takes three calls by hand — push, retitle, `set --ref-task` — all derivable
from `<slug> + <repo>`. a verb that seeds and crossrefs in one call is owed
(`rule.always.entool-the-skills-you-touch`).

## .enforcement

- a task seeded for a tracked row, slug absent from the title = **blocker** (unfollowable
  crossref; the sweep will misreport it)
- `--ref-task` recorded with no reciprocal slug in the task title = **blocker** (one-way)
- an "untracked" verdict off a title-only read, no check whether the slug was ever put where
  the read could see it = **blocker**

## .upstream

home is `bhuild/role=dispatcher` — the claim is about what the radio queue read returns,
owned by the dispatcher, not rediscovered by each caller.

## .see also

- `term=partial-audit._.choice._.md` — a read complete over the scope it could see, reported
  as a verdict about the world
- `.agent/repo=.this/role=prioritizer/skills/eco.seed.sh` — the sweep this rule keeps honest,
  and its `--words` flag for when the slug is the wrong key
- `rule.require.verify-after-send.md` — a report of success is not proof the payload landed
  where a reader can reach it

---

written by human + beaver 🦫
