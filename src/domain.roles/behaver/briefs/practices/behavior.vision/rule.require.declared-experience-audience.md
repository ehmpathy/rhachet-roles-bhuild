# rule.require.declared-experience-audience

## .what

each `case=NNN` experience demo declares, in its header, **who** encounters it and what they
**came for**:

```
> **who** — kai, a consumer who upgraded the package
> **came for** — a green suite, with no thought spared for temp dirs
```

the two fields are the **actor** and the **goal** of `define.experience`, in plain words: `who` is the
actor, `came for` is the goal. "audience" names that pair; it is no third concept.

`who` names a person or a role. `system` (a cron, a ci runner with no human) is a legitimate value —
the rule demands the field be answered, never that a felt human be invented to fill it.

## .why

- **checkable** — a declared field is a grep. a narrative voice is a judgment call, graded
  inconsistently across reviewers and rounds
- **it survives a matrix change** — a named actor stays true when cells split or merge. a cell
  coordinate (*"cell 18"*) goes stale the next time the matrix moves, and no reviewer reads a
  coordinate as a claim about a human
- **it forces the goal question** — the same actor with two goals is two experiences
  (`howto.experience.decompose`). a header with actor + goal makes a conflated cell visible at a
  glance

## .the test

> **can a reader name, from the header alone, who this experience serves and what they wanted?**

yes → declared · only a cell coordinate → stale by construction · neither → undeclared.

## .examples

### 👎 bad — coordinates, no human

```
> cells 14 + 15 + 16 · one adoption seam, three points of view
> cell 16 — wire the hooks · feel happy · care critipath
```

it names three points of view and identifies not one of them.

### 👍 good

```
> **who** — an adopter who already ships a teardown
> **came for** — wire the new hooks with no second teardown to maintain
>
> cell — `actor=adopter · feel=happy · care=critipath`
```

the coordinate may stay, below the audience — it locates the cell; it does not name the human.

## .enforcement

- a `case=NNN` with no declared `who` = **blocker**
- a `who` that names a cell coordinate rather than a person or role = **blocker**
- a `who` with no `came for` = **nitpick**

## .see also

- `rule.require.experience-coverage` — grades the narrative's voice; this grades the declared field
- `howto.experience.decompose` — actor and goal as axes
- `howto.experience.demonstrate` — the demo this header opens
