# rule.require.roles-own-skills-any-carries-contract-points

## .what

a skill's implementation lives in the role that owns it —
`.agent/repo=.this/role=<owner>/skills/`. `role=any/skills/` carries a **symlink to its
contract point**, and only to its contract point.

```
.agent/repo=.this/role=prioritizer/skills/eco.priority.sh     # the owner — the real file
.agent/repo=.this/role=prioritizer/skills/work/ecowork.sh     # the lib beneath it — NOT linked
.agent/repo=.this/role=any/skills/eco.priority.sh  ->  ../../role=prioritizer/skills/eco.priority.sh
```

a **contract point** is the entrypoint a caller invokes. the `work/` lib beneath it is
substrate, and substrate is never linked.

## .why

`role=any` boots into every session in this repo — the right place to advertise a verb, the
wrong place to house one. a flat layout leaves "who maintains this?" with no answer on disk,
makes every skill everyone's and so no one's, and blurs lib from entrypoint. an owned layout
makes the path name the owner, makes the symlink set the public contract, and makes the role
dir portable by construction.

`rhachet init --roles <role>` treats a role as the unit of distribution. a skill written flat
into `role=any` must be re-decomposed before it can ever ship as a role — expensive once
callers exist, one directory choice at authorship.

## .the symlink is a declaration, not a convenience

`rhx` resolves skills by name across every booted role, so the link buys no reach. what it
buys is a statement: these, and only these, are the entrypoints this role exposes. a lib that
gains a caller outside its role is a design event — it must surface as a new contract point,
never as a second link into `work/`. that keeps `role=any/skills/` the whole callable surface
at a glance, with no internals mixed in.

## .how

1. create the owner dir — `.agent/repo=.this/role=<owner>/skills/`, with a `readme.md`
2. write the entrypoint there, thin: parse args, call the lib, exit
3. write the lib in `work/`, beside it
4. link the contract point with the paved verb — relative, findserted:

```sh
rhx symlink --at '.agent/repo=.this/role=any/skills/<skill>.sh' \
            --to '.agent/repo=.this/role=<owner>/skills/<skill>.sh' \
            --mode relative --idem findsert
```

`--mode relative` so the link survives a clone at a different path; `--idem findsert` so a
re-run adds no churn.

## .the test

> **"if this role were lifted into its own package tomorrow, what would break?"**

naught but the symlinks → correct, the role is a unit. the lib has callers in three other
roles → it was never that role's lib — promote it to a contract point, or move it to a shared
role. `role=any` holds the real file → the role is a label, not a boundary.

## ⚠️ .the bound

governs new skills, and skills you disturb. the extant flat skills in `role=any/skills/`
(`git.crew.*`, `git.grove.*`, `duct.*`, `term.*`) predate this rule — do not sweep them. a new
skill is owned from birth; a skill you already touch for another reason may be relocated on
the way through (`rule.prefer.scouts-honor`).

## .enforcement

- a new skill whose implementation lands in `role=any/skills/` = **blocker**
- a symlink from `role=any` into a role's `work/` lib = **blocker**
- an owner role dir with no `readme.md` = **nitpick**
- an absolute-mode symlink where relative would serve = **nitpick**
- an extant flat skill left in place, untouched = **false positive**

## .see also

- `define.role.[article]` (enroller) — `role = skills + briefs`, the unit this rule keeps intact
- `howto.add.portable-skills.[guide]` (enroller) — what portability demands of a skill
- `rule.always.entool-the-layer-you-drop-below.md` — the peer claim one layer up
- `rule.prefer.scouts-honor` (mechanic) — the fix-forward bound
- `.dream/v2026_09_13.feat.eco-priority-the-prioritizers-verb.md` — the worked example

---

written by human + beaver 🦫
