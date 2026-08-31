# define.experience._.axis=care.path=criti-vs-alter

## .what

**critipath vs alterpath** is the **care** axis of an experience — how much we care that a
path is demonstrated. care is set by one number, the path's **severity** if it broke:

- a **critipath** — a **criti**cal path — high severity. a core usecase leans on it and a break
  is costly to absorb. → demo **required**; absent = **blocker**.
- an **alterpath** — an **alter**nate path — low severity. a break is cheap to absorb (a workable
  fallback, or it rarely fires). → demo **optional bonus**; absent = **nitpick**.

this is one of the two axes an experience sits on (see `define.experience`). the other is
**feel** (happy vs sharp — see `define.experience._.axis=feel.path=happy-vs-sharp`). they are independent: a
critipath can be happy or sharp; a sharp path can be criti or alter.

## .severity = frequency × cost

care is not a vibe — it is a **product**. the severity of a broken path is:

> **severity = frequency × cost** — how often the path is walked, times the per-incident cost to
> recover when it breaks.

this is the classic risk law — **risk = likelihood × impact**. severity is the *expected* burden
of the break: a rare break costs little in aggregate; a common break compounds; a break with no
recovery costs it all — but only if it ever fires.

| fallback's per-incident cost | × frequency | → care |
|------------------------------|-------------|--------|
| **∞** — destroys the goal (data gone, window missed) | any freq, even blue-moon | **critipath** |
| **high** — support hand-fixes each | rare → tolerable | **alterpath** |
| **high** — support hand-fixes each | common → support drowns | **critipath** |
| **~0** — costless self-serve alt | any freq, even constant | **alterpath** (demo richly for *priority*, but absent = nitpick) |
| **∞** — no recovery | **zero** — never walked | **not critical** — see the boundary below |

so "escalate to support" is *always* a fallback — which is why "does a fallback exist?" is the
wrong question. the right one is **is the fallback workable?** = is `freq × cost` tolerable.

## .the boundary — frequency zero zeroes any cost

severity is a *product*, so a **zero-frequency** term contributes zero, whatever the cost. a path
nobody ever walks carries no expected burden — it is not critical, even if a break would be total
ruin. the canonical boundary case (see
`define.experience._.axis=care.path=criti-vs-alter._.demo.boundary=shoetie-on-carbumper-at-75mph`):

> tie your shoes on the car bumper at 75mph — cost is ∞ (you die), yet nobody ever does it
> (freq = 0). `0 × ∞ = 0`. a true loss of capability that carries **no expected loss** → not
> critical.

this is the mirror of *rare ≠ alter*: rarity relaxes severity only **above** freq = 0. a rare
break that *does* fire and cannot recover is a critipath; a break that never fires is not an
experience at all.

## .the one test

apply a single question to any path:

> **if this path broke, is there a workable route around it — one that still gets the actor to
> their goal?**

- **no workable route** → **critipath** (blocker if the demo is absent)
- **a workable route remains** → **alterpath** (nitpick if the demo is absent)

the word **workable** does the work, and it is not binary — it is the `freq × cost` product above.
a fallback that tanks the goal (cost → ∞) is not workable at any frequency. a fallback that is
cheap (cost ≈ 0) is workable at any frequency. in between, frequency decides: a costly fallback is
workable when rare, unworkable when the path is walked so often the cost compounds.

## .an alterpath is not "a lesser feature"

the common trap is to read alterpath as "small" or "edge case". it is neither. an alterpath is
precisely **a path with a workable fallback** — often the *nicer*, more convenient route. its
absence is survivable only because the actor can drop back to the core route.

- **rare alone ≠ alter.** rarity lowers the *frequency* half, but cost decides whether each hit
  is survivable. a once-a-season recovery path with no fallback (cost → ∞) is still a
  **critipath** — a rare break that fires and cannot recover still sums high. rarity relaxes
  severity only when the fallback still reaches the goal. (this is why care = `freq × cost`, not
  freq alone.)
- **convenient ≠ criti.** a slick shortcut most surfers love is still an **alterpath** if the
  long way around works fine (cost ≈ 0), however often they walk it.

## .the subsumption tell

when two paths reach the same goal, they are usually **asymmetric** — one *subsumes* the other:

- **specific-book** (name the spot + time) subsumes **auto-assign** — you can always hand-pick
  exactly what auto would have picked.
- **auto-assign** does *not* subsume specific-book — auto might drop you at a spot two coves
  away, on the wrong tide.

**the path that subsumes the other, and that the goal requires, is the critipath.** the
convenience layered on top is the alterpath.

> **caution — subsumption is a tell, not a law.** do not reflexively name the most-specified path
> a critipath. it is critical only when the *declared goal* requires that specificity. flip the
> goal and it flips: a "drop-in finder" whose goal is "just get me in the water" makes
> **auto-assign the critipath** and specific-book the alterpath (see below). the goal decides,
> not the parameter count.

## .it depends on the declared core usecase

you cannot name a path's care until you know **what the actor actually wants**. a surfer at a surf
school does not want *a* lesson anywhere — they want **their spot, at dawn, on the tide they can
make**. surf is intrinsically time-and-place specific, so:

- **book-a-specific-slot** is the **critipath** — auto-assign is no workable fallback for "my
  spot at my time".
- **auto-assign** is the **alterpath** — if it broke, the surfer just names the slot manually.

flip the product and it flips: a "drop-in class finder" whose declared goal is *"just get me in
the water, i'm easy"* makes **auto-assign the critipath** and specific-book the alterpath. the
**declared core usecase decides**, not the mechanics.

> this is why care is named at the **vision** stage: to name it, you must first answer the
> domain-discovery question *"what does the actor truly want?"* — the gap that otherwise slips
> to delivery.

## .examples — at the seaturtle surf school 🐢🌊

each row: two paths to one goal. the critipath has no workable fallback; the alterpath does.

| goal | critipath (no fallback) | alterpath (workable fallback) | why alter |
|------|-------------------------|-------------------------------|-----------|
| catch my session | **book my spot + tide** (`--spot mavericks --time 6am`) | **auto-assign** a nearest-open slot | if auto broke, i name the slot myself |
| get into my account | **sign in with password** | **"sign in with Wave"** (sso) | if sso broke, i use email + password |
| pay for the lesson | **charge my card** | **apply a `TURTLE10` promo code** | if the promo broke, i pay full price |
| ride a board today | **reserve a specific board** (my 9'0 longboard) | **"surprise me"** random-board pick | if surprise broke, i reserve one by name |
| find an open spot | **list open spots** | **"sort by wave height"** toggle | if sort broke, i scan the default list |

read every row through the one test — *if it broke, is there a workable route to the same
goal?* the left column has none; the right column always does.

## .examples — at the beaver camp 🦫 (frequency flips the care)

a **camp** is a protected host of resources (a `local:laptop`, a `cloud:ec2`). a **grove** is a
set of trees within a camp. two paths, *same* command shape, *same* fallback ("escalate to
support") — the care flips on **frequency** alone:

| path | when | if it broke, the fallback | `freq × cost` | care |
|------|------|---------------------------|---------------|------|
| **`grove open`** — load a grove to work | every morning, every beaver | support hand-loads the trees | common × high → **support drowns** | **critipath** |
| **`grove restore`** — rebuild a corrupt grove from snapshot | once in a blue moon | support rebuilds from the same snapshot by hand | rare × high → **tolerable** | **alterpath** |

the fallback is identical; only the frequency differs, and that alone sets the severity. now the
**cost** override: if `grove restore` had **no snapshot**, support could not rebuild — cost → ∞ —
and it flips to **critipath despite the rarity**. rarity relaxes severity only while the fallback
still reaches the goal.

## .what blocks

- an **absent critipath** demo — a high-severity path (`freq × cost` intolerable), with no case
  — is a **blocker**.
- an **absent alterpath** demo — a low-severity path (`freq × cost` tolerable) — is a **nitpick**.
- a path mis-named **alter** that in truth carries intolerable severity (the "backup" tanks the
  goal, or the path is walked too often to absorb) is itself a **blocker** — it hides a critipath.

## .see also

- `define.experience` — the parent frame (feel × care) these two briefs deepen
- `define.experience._.axis=feel.path=happy-vs-sharp` — the other axis (what the actor feels)
- `define.experience._.metric=boundary-density` — the metric to prioritize demos by (and *coverage*-subsumption,
  the cousin of the *care*-subsumption tell above)
- `define.experience._.axis=care.path=criti-vs-alter._.demo.catalog=freq-x-cost`
  — the worked `freq × cost` catalog (every cell → its care, with examples)
- `define.experience._.axis=care.path=criti-vs-alter._.demo.boundary=shoetie-on-carbumper-at-75mph`
  — the `0 × ∞ = 0` boundary case (a total loss nobody walks is not critical)
- `define.experience._.demo.surf-school` — the worked catalog + cases
- `rule.require.experience-coverage` — the rule that blocks on absent critipaths
- architect `def.domain-discovery` — the "what does the actor truly want?" that care forces
