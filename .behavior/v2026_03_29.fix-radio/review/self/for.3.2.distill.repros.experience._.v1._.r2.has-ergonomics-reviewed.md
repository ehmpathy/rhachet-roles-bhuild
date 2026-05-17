# self-review: has-ergonomics-reviewed

review of input/output ergonomics for radio skill keyrack integration.

---

## input ergonomics review

### primary input: radio.task.push

**current (with keyrack)**:
```bash
rhx radio.task.push --via gh.issues --title "task title" --description "task body"
```

| dimension | analysis | holds? |
|-----------|----------|--------|
| intuitive | standard cli pattern, no auth required | yes |
| convenient | --auth omitted, keyrack provides | yes |
| expressive | --auth still available for override | yes |
| composable | can pipe output to other commands | yes |

**feels natural?** yes — developer only provides task content, not auth mechanics.

### secondary input: keyrack fill

**setup command**:
```bash
rhx keyrack fill --owner ehmpath --env prep
```

| dimension | analysis | holds? |
|-----------|----------|--------|
| intuitive | explicit owner and env | yes |
| convenient | once per machine | yes |
| expressive | can specify different owners/envs | yes |

**feels natural?** yes — clear what is filled where.

### tertiary input: init keys

**setup command**:
```bash
npx rhachet init --keys --roles dispatcher
```

| dimension | analysis | holds? |
|-----------|----------|--------|
| intuitive | matches extant rhachet init pattern | yes |
| convenient | one command per repo | yes |
| expressive | can specify multiple roles | yes |

**feels natural?** yes — consistent with rhachet patterns.

---

## output ergonomics review

### primary output: task created

**expected**:
```
🎙️ created: task title
   ├─ exid: 42
   ├─ status: QUEUED
   ├─ repo: ehmpathy/rhachet-roles-bhuild-demo
   └─ via: gh.issues
```

| dimension | analysis | holds? |
|-----------|----------|--------|
| intuitive | clear success indicator with details | yes |
| composable | exid extractable via regex | yes |
| informative | shows where task was created | yes |

**feels natural?** yes — developer knows what happened and where.

### error output: keyrack not filled

**expected**:
```
⚠️ keyrack not unlocked for env=prep

hint: run `rhx keyrack fill --owner ehmpath --env prep`
```

| dimension | analysis | holds? |
|-----------|----------|--------|
| intuitive | clear error and remediation | yes |
| actionable | exact command to fix | yes |
| calm tone | soft tone, not panic | yes |

**feels natural?** yes — developer knows exactly what to do.

---

## friction points

| friction | severity | resolution |
|----------|----------|------------|
| two setup commands (fill + init) | low | docs explain order, error guides |
| env=prep vs env=test confusion | low | clear names, examples |
| error message must be exact | medium | careful phrases, copy-pastable |

**all friction is acceptable** — no changes required.

---

## pit of success verification

| principle | analysis | holds? |
|-----------|----------|--------|
| intuitive design | no docs needed for happy path | yes |
| convenient | auth auto-derived | yes |
| expressive | --auth override available | yes |
| composable | output parseable | yes |
| lower trust contracts | validate token format at boundary | yes |
| deeper behavior | handle expired tokens via refresh | yes |

---

## conclusion

all inputs and outputs pass ergonomics review.

no awkward patterns found. no friction points require changes.

