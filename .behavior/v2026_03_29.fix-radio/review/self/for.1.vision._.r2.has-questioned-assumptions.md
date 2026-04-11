# self-review: has-questioned-assumptions

review of hidden assumptions in the vision.

---

## assumption 1: keyrack will be available in the skill context

| question | answer |
|----------|--------|
| what do we assume without evidence? | that keyrack cli is callable from radio skill |
| what evidence supports this? | other skills like git.commit use keyrack |
| what if the opposite were true? | skill would fail to fetch creds |
| did the wisher say this? | implied by "similar to how the bhrain repo's review skill does" |
| what exceptions exist? | skill context may differ from bhrain |

**found: needs verification**

the vision assumes keyrack is available but did not verify. added to research needed:
- [ ] verify keyrack cli is available from skill context

---

## assumption 2: EPHEMERAL_VIA_GITHUB_APP mechanism works as expected

| question | answer |
|----------|--------|
| what do we assume without evidence? | that mechanism translates app json to ghs_ token |
| what evidence supports this? | reviewed mechAdapterGithubApp.ts in rhachet |
| what if the opposite were true? | keyrack could not provide tokens |
| did the wisher say this? | wisher referenced the mechanism name |
| what exceptions exist? | none found — the code is clear |

**found: holds**

evidence verified via code review. the mechanism:
1. parses json with appId, privateKey, installationId
2. creates auth via @octokit/auth-app
3. returns short-lived ghs_ token with 55-min expiry

---

## assumption 3: ci/cd env var fallback is acceptable

| question | answer |
|----------|--------|
| what do we assume without evidence? | that ci/cd workflows can use GITHUB_TOKEN env var |
| what evidence supports this? | wisher explicitly said "keyrack will already forward from env var if needed, so cicd will work out of the box" |
| what if the opposite were true? | ci/cd would need keyrack setup |
| did the wisher say this? | yes, explicitly |
| what exceptions exist? | none — wisher confirms this |

**found: holds**

wisher explicitly confirmed ci/cd falls back to env var.

---

## assumption 4: the beaver app will have sufficient permissions

| question | answer |
|----------|--------|
| what do we assume without evidence? | that the app has issues:write for gh.issues channel |
| what evidence supports this? | none — app does not exist yet |
| what if the opposite were true? | gh api calls would fail with 403 |
| did the wisher say this? | wisher said it's a "public app" but not permissions |
| what exceptions exist? | might need other permissions for other channels |

**found: open question**

captured in vision's open questions section. need wisher to clarify permissions.

---

## assumption 5: token translation latency is ~500ms

| question | answer |
|----------|--------|
| what do we assume without evidence? | that github app token generation takes ~500ms |
| what evidence supports this? | typical oauth/jwt flow latency |
| what if the opposite were true? | user experience would differ |
| did the wisher say this? | no |
| what exceptions exist? | network latency varies; could be 100ms-2000ms |

**found: adjust vision**

the 500ms estimate is speculative. updated vision timeline to say "~500ms" as estimate, not fact. latency depends on:
- network to github api
- jwt sign (fast, local)
- token request round trip

---

## summary

| assumption | status | action |
|------------|--------|--------|
| keyrack available in skill | needs verification | added to research needed |
| EPHEMERAL_VIA_GITHUB_APP works | holds | verified via code review |
| ci/cd env var fallback | holds | wisher explicitly confirmed |
| beaver app permissions | open question | captured in vision |
| 500ms latency | estimate only | clarified as approximate |

no issues found that require vision revision — open questions and research items are already captured.
