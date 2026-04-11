# self-review: has-questioned-requirements

review of requirements in `0.wish.md` against the vision in `1.vision.md`.

---

## requirement 0: provision the github app for the beaver robot

| question | answer |
|----------|--------|
| who said this was needed? | wisher explicitly stated |
| what evidence supports this? | ephemeral tokens are more secure than long-lived PATs |
| what if we did not do this? | continue with PATs or require manual auth setup |
| is the scope appropriate? | yes — one-time provision |
| could we achieve the goal simpler? | no — github app is the standard pattern for ephemeral tokens |

**found: holds, but clarification needed**

the wish mentions "ehmpath beaver app" but I did not find this app name in declastruct-github patterns. the extant apps there are:
- `declastruct-github-conformer` (repo admin)
- `declastruct-github-testauth` (test support)
- `rhelease` (release workflow)

**question for wisher**: is "ehmpath beaver" a new app to create, or should we use an extant app? if new, what permissions does it need for gh.issues channel (likely `issues: write`)?

---

## requirement 1: register EHMPATH_BEAVER_GITHUB_TOKEN into keyrack

| question | answer |
|----------|--------|
| who said this was needed? | wisher |
| what evidence supports this? | keyrack must know about keys to grant access |
| what if we did not do this? | skill could not fetch creds from keyrack |
| is the scope appropriate? | yes — yaml config only |
| could we achieve the goal simpler? | no — this is the standard pattern |

**found: holds, minor terminology note**

the wish mentions "genDispatcherRole" but the file is `getDispatcherRole.ts`. the `Role.build()` call handles registration via the role definition — no separate gen function needed. the keyrack can be added to the role definition.

---

## requirement 2: upgrade tests to fetch creds via keyrack

| question | answer |
|----------|--------|
| who said this was needed? | wisher, references xai pr |
| what evidence supports this? | consistent test/prod credential path |
| what if we did not do this? | tests would need separate auth setup |
| is the scope appropriate? | yes |
| could we achieve the goal simpler? | no — follows established pattern |

**found: holds**

the xai pr (#21) shows the pattern: update jest env files to unlock keyrack with test env creds.

---

## requirement 3: update radio skill to fetch creds from keyrack by default

| question | answer |
|----------|--------|
| who said this was needed? | wisher |
| what evidence supports this? | this is the core goal of the wish |
| what if we did not do this? | defeats the purpose of the wish |
| is the scope appropriate? | yes |
| could we achieve the goal simpler? | no — this is minimal |

**found: holds**

the current `getGithubTokenByAuthArg` function can be extended to try keyrack first, then fall back to env var.

---

## summary

| requirement | status | notes |
|-------------|--------|-------|
| 0. provision github app | holds, needs clarification | "ehmpath beaver" app name/permissions unclear |
| 1. register in keyrack | holds | minor terminology: getDispatcherRole not genDispatcherRole |
| 2. upgrade tests | holds | follows xai pattern |
| 3. update radio skill | holds | core goal |

**action**: captured open questions in vision section; recommend to proceed with research phase to clarify app requirements.
