# howto: thought routes via bhrain driver

## .what

thought routes are structured sequences of milestones (stones) that guide a brain through a deliberate thought process. the bhrain driver role provides skills to navigate these routes.

## .where

```
.behavior/{route-name}/
├── 0.wish.md                    # the goal/wish (static)
├── 1.vision.stone               # vision milestone
├── 1.vision.guard               # optional: validation gate
├── 2.1.criteria.blackbox.stone  # criteria milestones
├── 3.1.research.*.stone         # research milestones (parallel)
├── 3.3.blueprint.v1.stone       # blueprint milestone
├── 3.3.blueprint.v1.guard       # optional: validation gate
├── 4.1.roadmap.v1.stone         # roadmap milestone
├── 5.1.execution.*.stone        # execution milestones
└── .route/                      # auto-created for artifacts
    ├── .bind.{branch}.flag      # route bind marker
    ├── *.guard.review*.md       # review artifacts
    └── *.guard.judge*.md        # judge artifacts
```

## .core concepts

### stone

a single milestone/checkpoint on a route:
- file extension: `.stone` (not `.src`)
- numeric prefix for order: `1.`, `2.1.`, `3.3.`
- stones with same prefix can run in parallel (e.g., `3.1.a`, `3.1.b`)

### guard

optional validation gate that must pass before a stone is complete:
- file extension: `.guard` (matches stone name)
- yaml format with three optional sections: `artifacts`, `reviews`, `judges`
- enables quality gates and human approval checkpoints

## .skills

### route.bind — bind route to branch

```sh
# bind a route to current branch
npx rhachet run --repo bhrain --skill route.bind --route .behavior/my-feature

# query current bound route
npx rhachet run --repo bhrain --skill route.bind --get

# remove bound route
npx rhachet run --repo bhrain --skill route.bind --del
```

### route.stone.get — discover next stone

```sh
# get next single stone
npx rhachet run --repo bhrain --skill route.stone.get --stone @next-one --route .behavior/my-feature

# get all parallel stones (same numeric prefix)
npx rhachet run --repo bhrain --skill route.stone.get --stone @next-all --route .behavior/my-feature

# get specific stone
npx rhachet run --repo bhrain --skill route.stone.get --stone 1.vision --route .behavior/my-feature

# display stone content
npx rhachet run --repo bhrain --skill route.stone.get --stone @next-one --route .behavior/my-feature --say
```

### route.stone.set — mark stone as passed or approved

```sh
# mark as passed (triggers guard validation)
npx rhachet run --repo bhrain --skill route.stone.set --stone 1.vision --route .behavior/my-feature --as passed

# mark as approved (human approval, bypasses guards)
npx rhachet run --repo bhrain --skill route.stone.set --stone 1.vision --route .behavior/my-feature --as approved
```

### route.stone.judge — judge mechanism for guards

```sh
# check if stone has human approval
npx rhachet run --repo bhrain --skill route.stone.judge \
  --mechanism approved? \
  --stone 1.vision \
  --route .behavior/my-feature

# check if reviews pass thresholds
npx rhachet run --repo bhrain --skill route.stone.judge \
  --mechanism reviewed? \
  --stone 5.implement \
  --route .behavior/my-feature \
  --allow-blockers 0 \
  --allow-nitpicks 2
```

## .guard file format

```yaml
# optional: glob patterns for artifact detection
artifacts:
  - ".route/1.vision.guard.review*.md"

# optional: shell commands to run reviews
reviews:
  - "npx rhachet run --repo bhrain --skill review --stone 1.vision --route .behavior/my-feature"

# optional: shell commands to run judges
judges:
  - "npx rhachet run --repo bhrain --skill route.stone.judge --mechanism approved? --stone 1.vision --route .behavior/my-feature"
```

### common guard patterns

**human approval gate** (simplest):
```yaml
judges:
  - "npx rhachet run --repo bhrain --skill route.stone.judge --mechanism approved? --stone {stone} --route {route}"
```

**review threshold gate**:
```yaml
judges:
  - "npx rhachet run --repo bhrain --skill route.stone.judge --mechanism reviewed? --stone {stone} --route {route} --allow-blockers 0 --allow-nitpicks 2"
```

## .workflow

1. **bind the route** to your branch:
   ```sh
   npx rhachet run --repo bhrain --skill route.bind --route .behavior/my-feature
   ```

2. **get next stone** to work on:
   ```sh
   npx rhachet run --repo bhrain --skill route.stone.get --stone @next-one --route .behavior/my-feature --say
   ```

3. **complete the stone** (produce the artifact, e.g., vision.md)

4. **mark as passed** (or approved for human gates):
   ```sh
   # if guard requires automated review
   npx rhachet run --repo bhrain --skill route.stone.set --stone 1.vision --route .behavior/my-feature --as passed

   # if guard requires human approval
   npx rhachet run --repo bhrain --skill route.stone.set --stone 1.vision --route .behavior/my-feature --as approved
   ```

5. **repeat** for next stone

## .when to use guards

| scenario | guard type |
|----------|------------|
| critical decisions (vision, blueprint) | human approval (`approved?`) |
| code quality gates | review threshold (`reviewed?`) |
| artifact existence checks | `artifacts` glob patterns |

## .see also

- `rhachet-roles-bhrain` — the driver role package
- `.behavior/` directories — thought route conventions

