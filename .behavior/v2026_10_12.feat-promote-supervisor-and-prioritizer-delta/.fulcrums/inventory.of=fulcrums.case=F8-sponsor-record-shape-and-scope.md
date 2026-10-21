# F8 — the sponsor record's shape and scope

## .the fork

F1 ruled the WHERE (a `.meter/` record a human writes). three shape calls were left open:

| call | taken | alternative |
|---|---|---|
| scope | one record per **supervisor repo root** (`git rev-parse --show-toplevel` of the caller) | one per tree; one per box (`~/.rhachet`) |
| verbs | `set` / `get` as subcommands of `git.crew.commit.sponsor` itself | a peer skill `git.crew.commit.sponsor.uses` |
| flag | `--who` = the sponsor on `set`, the seat on a bind | a distinct `--sponsor` on `set` |

## .why taken, at the time

- **scope:** the size meter (`git.tree.size.uses`) keys on the repo root; one meter shape, one place
  to look. a per-tree record would ask the human once per sprout — the exact toil the source verb
  was paved to end ("a constant that holds across every tree").
- **verbs:** vision case 6 [t1] names `! rhx git.crew.commit.sponsor set --who …` verbatim.
- **flag:** the vision's own command uses `set --who "<name <email>>"`. on a bind, `--who` was
  already the source's seat flag, and `set` takes no seat — the two senses never meet in one call.

## .rework

clean: a rename of a subcommand or a path constant (`__crew_sponsor_meter`); no caller beyond the
skill and `crew.boot` reads the record.

## .confidence — 80%, and why it is low

the `--who` overload is a one-word-two-senses smell (`rule.forbid.ambiguous-labels`), defended only
by the vision's own wording. a box-wide record may be the truer scope: a human sponsors work on
every repo the supervisor drives, not just its own.

## .where

`src/domain.roles/supervisor/skills/work/crewwork.sponsor.sh` · `skills/git.crew.commit.sponsor.sh`

## .verdict

—
