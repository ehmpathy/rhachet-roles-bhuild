# 🦫 rhachet-roles-bhuild

![test](https://github.com/ehmpathy/rhachet-roles-bhuild/workflows/test/badge.svg)
![publish](https://github.com/ehmpathy/rhachet-roles-bhuild/workflows/publish/badge.svg)

roles for building resilient systems, via [rhachet](https://github.com/ehmpathy/rhachet)

# purpose

declare, decompose, and dispatch behaviors that shape your ecosystem.

# install

```sh
npm install rhachet-roles-bhuild
```

# use

## `readme --registry`
```sh
npx rhachet readme --registry bhuild
```

produces

```md
# 🦫 bhuild role registry

this registry defines roles used to build systems and solutions.

---

## 🌲 behaver

used to declare clear and testable behaviors that can be reliably built and verified.

---

## 💧 dispatcher

used to maximize prioritized throughput within a resource bandwidth.

---

## 🍄 decomposer

used to decompose large behaviors into focused, independent sub-behaviors.
```

## 🌲 behaver skills

### init.behavior

initialize a `.behavior/` directory with structured scaffold for behavior-driven development.

```sh
npx rhachet run --repo bhuild --role behaver --skill init.behavior \
  --name say-hello
```

### bind.behavior

bind, unbind, or query branch-to-behavior binds.

```sh
# bind current branch to a behavior
npx rhachet run --repo bhuild --role behaver --skill bind.behavior \
  --set --behavior say-hello

# query current binding
npx rhachet run --repo bhuild --role behaver --skill bind.behavior \
  --get

# unbind current branch
npx rhachet run --repo bhuild --role behaver --skill bind.behavior \
  --del
```

### review.behavior

review behavior artifacts (wish, criteria, blueprint, roadmap) against best practice rules.

```sh
npx rhachet run --repo bhuild --role behaver --skill review.behavior \
  --of say-hello

npx rhachet run --repo bhuild --role behaver --skill review.behavior \
  --of say-hello --against criteria,blueprint
```

### review.deliverable

review an implementation deliverable against behavior declarations (wish, vision, criteria, blueprint, roadmap).

```sh
npx rhachet run --repo bhuild --role behaver --skill review.deliverable \
  --for.behavior say-hello \
  --against blueprint

npx rhachet run --repo bhuild --role behaver --skill review.deliverable \
  --for.behavior say-hello \
  --against wish,vision,criteria \
  --interactive
```

## 💧 dispatcher skills

### radio.task.push

broadcast tasks to a radio channel for distributed dispatch. supports github issues and local filesystem channels.

```sh
# push a new task to github issues
npx rhachet run --repo bhuild --role dispatcher --skill radio.task.push \
  --via gh.issues \
  --title "fix flaky test" \
  --description "timeout in ci needs retry logic"

# push to a specific repo
npx rhachet run --repo bhuild --role dispatcher --skill radio.task.push \
  --via gh.issues \
  --repo ehmpathy/acme-app \
  --title "add dark mode" \
  --description "user preference for theme"

# claim a task (QUEUED → CLAIMED)
npx rhachet run --repo bhuild --role dispatcher --skill radio.task.push \
  --via gh.issues \
  --exid 142 \
  --status CLAIMED

# deliver a task (CLAIMED → DELIVERED)
npx rhachet run --repo bhuild --role dispatcher --skill radio.task.push \
  --via gh.issues \
  --exid 142 \
  --status DELIVERED

# push to local filesystem
npx rhachet run --repo bhuild --role dispatcher --skill radio.task.push \
  --via os.fileops \
  --title "offline task" \
  --description "works without network"
```

### radio.task.pull

pull tasks from a radio channel. lists available tasks or retrieves specific task details.

```sh
# list all tasks from github issues
npx rhachet run --repo bhuild --role dispatcher --skill radio.task.pull \
  --via gh.issues \
  --list

# list tasks with status filter
npx rhachet run --repo bhuild --role dispatcher --skill radio.task.pull \
  --via gh.issues \
  --list \
  --status QUEUED

# pull specific task by exid
npx rhachet run --repo bhuild --role dispatcher --skill radio.task.pull \
  --via gh.issues \
  --exid 142

# pull from local cache
npx rhachet run --repo bhuild --role dispatcher --skill radio.task.pull \
  --via os.fileops \
  --list
```

### auth modes

for `gh.issues` channel, authentication is required. supported modes:

| mode                | usage                              | description                                  |
| ------------------- | ---------------------------------- | -------------------------------------------- |
| `as-human`          | `--auth as-human`                  | use gh cli's logged-in session (interactive) |
| `as-robot:env(VAR)` | `--auth as-robot:env(GITHUB_TOKEN)`| use token from environment variable          |
| `as-robot:shx(cmd)` | `--auth as-robot:shx(op read ...)` | execute shell command to retrieve token      |
| env fallback        | (no --auth)                        | use `GITHUB_TOKEN` env var if set            |

examples:

```sh
# use gh cli login (human interactive)
npx rhachet run --repo bhuild --role dispatcher --skill radio.task.push \
  --via gh.issues \
  --auth as-human \
  --title "task" --description "desc"

# use token from environment variable
npx rhachet run --repo bhuild --role dispatcher --skill radio.task.push \
  --via gh.issues \
  --auth as-robot:env(MY_GITHUB_TOKEN) \
  --title "task" --description "desc"

# use bhuild beaver app token (short-lived github app auth)
npx rhachet run --repo bhuild --role dispatcher --skill radio.task.push \
  --via gh.issues \
  --auth "as-robot:shx(use.github.as.bhuild.beaver)" \
  --title "task" --description "desc"

# use 1password cli to retrieve token
npx rhachet run --repo bhuild --role dispatcher --skill radio.task.push \
  --via gh.issues \
  --auth "as-robot:shx(op read op://vault/github-token/credential)" \
  --title "task" --description "desc"
```

the `shx(...)` pattern enables token retrieval from any cli tool that outputs a token:
- bhuild beaver app (`use.github.as.bhuild.beaver`) — short-lived github app tokens
- 1password (`op read ...`)
- hashicorp vault (`vault kv get ...`)
- aws secrets manager (`aws secretsmanager get-secret-value ...`)
- azure key vault (`az keyvault secret show ...`)
- google secret manager (`gcloud secrets versions access ...`)

## 🍄 decomposer skills

### review.behavior

review behavior for decomposition need, by measurement of context pressure and domain breadth.

```sh
npx rhachet run --repo bhuild --role decomposer --skill review.behavior \
  --of my-large-behavior
```

### decompose.behavior

decompose a behavior into focused sub-behaviors that fit within context window limits.

```sh
# plan mode: analyze and propose sub-behaviors
npx rhachet run --repo bhuild --role decomposer --skill decompose.behavior \
  --of my-large-behavior --mode plan

# apply mode: create sub-behaviors from approved plan
npx rhachet run --repo bhuild --role decomposer --skill decompose.behavior \
  --of my-large-behavior --mode apply \
  --plan .behavior/my-large-behavior/z.decomposition.plan.json
```

# mascots

this repo houses roles for beavers 🦫 — industrious builders of resilient system, who carefully construct the behaviors that shape their ecosystems.

they wield:

- 🌲 evergreen — for behavers — to grow the behaviors which define the system, dependably
- 💧 water — for dispatchers — to channel work through constrained resources, optimally
- 🍄 mushroom — for decomposers — to break down complexity into parts that nourish, reusably
