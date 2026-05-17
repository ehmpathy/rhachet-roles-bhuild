# self-review: has-snap-changes-rationalized (r8)

paused reflection on why no snapshot changes were produced.

---

## the deeper question

why did this behavior not produce any .snap file changes?

---

## analysis: what this behavior changes

### authentication flow (internal)

```
BEFORE:
  no --auth → check process.env.GITHUB_TOKEN → use if present

AFTER:
  no --auth → try keyrack → return token if granted
```

this is an **internal credential resolution change**. the token is used internally by the github API calls. the user never sees the token.

### user-visible output (external)

```
BEFORE and AFTER:
  🎙️ created: test task
     ├─ exid: 42
     ├─ status: QUEUED
     ├─ repo: ehmpathy/rhachet-roles-bhuild-demo
     └─ via: gh.issues
```

the output format is **unchanged**. the task creation message looks the same whether auth came from keyrack or env var.

---

## why this makes sense

snapshots capture user-visible output. this behavior changes:
- **internal**: how credentials are resolved
- **not external**: what the user sees

the output format tests (composeTaskIntoGhIssues.test.ts) are unchanged because:
1. the format code was not modified
2. the format is independent of auth method
3. a task looks the same regardless of how we authenticated

---

## what would cause snapshot changes?

if we had changed:
- output message format
- error message format
- status display format
- any user-visible text

none of these were in scope for this behavior.

---

## conclusion

**no snapshot changes because the behavior is internal.**

the keyrack integration is an **internal infrastructure change** for auth resolution. the user-visible contract (task output format) is unchanged.

**why it holds**:
1. auth changes are internal wires
2. output format is independent of auth method
3. the separation between "how we authenticate" and "what we show the user" is clean
4. no format code was touched in this behavior

