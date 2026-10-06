# catalog.of=saturator 🦫

the index over **saturators** — the clusters that drive a grove toward saturation. one row per
axis; the rows themselves live in the per-axis members.

a **saturator** is a process cluster whose consumption is large enough to move a box's verdict.
named by what it CONSUMES, never by what it is for.

## .the question this answers

> "the grove is 🔴. which cluster do I cut, and does that cut touch the axis that is red?"

## .the law — cpu is a FLOW, ram is a STOCK

| axis | what it is | a cluster's cost | cut it by |
|---|---|---|---|
| **cpu** | a **flow** — spent by events, gone after | rate × cost-per-event | fewer events, or a cheaper event |
| **ram** | a **stock** — held by residents, returned only on exit | peers × footprint-each | fewer peers, or a smaller peer |

a short-lived process burns cpu and holds ram for an instant. a long-lived one holds ram and
burns cpu rarely. the two axes select **different** clusters.

## .the measure — the two lists are near-disjoint

measured, one box, both axes 🔴:

| cluster | cpu share | ram share |
|---|---|---|
| `tmux: server` + `zsh` + `systemd` | 89.0% | 1.5% |
| `claude` | 8.3% | 89.4% |

⇒ a cut aimed at the wrong axis moves the wrong number. fell clones on a cpu-red box and you
surrender real work to reclaim 8.3%. cut fork churn on a ram-red box and you reclaim 1.5%. read
the axis first, then open its member. **crew count is the ram lever, not the cpu lever.**

## .the rows

| axis | saturator kinds | top cluster | share | member |
|---|---|---|---|---|
| **cpu** | fork churn · replicated singleton · session churn | `tmux: server` | 47.9% | `catalog.of=saturator.axis=cpu.md` |
| **ram** | per-peer footprint · peer-count leak | `claude` | 89.4% | `catalog.of=saturator.axis=ram.md` |

## ⚠️ how to read a row — a cluster names the REAPER, never the worker

cpu attribution rests on `cutime`+`cstime`, which charges a dead child to **whoever reaped it**.
`zsh` at 32.8% does not mean shells compute — the 65 live shells own 0.0 hours between them. it
means every process that died under a shell: hooks, `rhx` calls, `node`, dead clones alike.

🔴 a row names a COLLECTION POINT, not a culprit. to convict a specific member of a blended row,
the member must report itself — the one gap no counter closes, filed per-axis.

## .how to add a row

a cluster earns a row when it crosses 5% of either axis on any grove. append it to the axis
member with: the measured share, its kind (per the axis member's taxonomy), the box and date,
and the lever that would cut it. one cluster may appear on both axes, with a different kind and
a different lever on each.

## .the gaps

| gap | state |
|---|---|
| blended reaper rows | open — needs self-report; no counter splits a reaper's total by child kind |
| single-grove evidence | open — a second grove would show which shares are universal vs local |
| no history | open — shares are cumulative-since-boot; a cluster that gains its share late reads like one steady throughout |
| disk/io axis | absent by design — io stalls ~1.3% of this box's life; add when a cluster crosses 5% |

## .see also

- `surgoal.squeeze-the-grove.md` — the surgoal this inventory serves
- `.agent/repo=.this/role=any/briefs/evidence/role=supervisor/surgoal.squeeze-the-grove.reason.md` — the measured record and reproduce commands
- `rule.require.bound-grove-concurrency-by-saturation.md` — reads the axis; this names what backs it
- `rule.require.prune-runaways-before-you-blame-the-grove.md` — the cheapest cut, once a row is convicted
- `rule.require.catalog-is-an-index` (bhrain/librarian) ⚠️ FOREIGN — the shape this obeys

---

written by human + beaver 🦫
