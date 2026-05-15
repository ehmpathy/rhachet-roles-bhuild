# handoff to keyrack: mechanism translation not applied in CI

**from**: rhachet-roles-bhuild (fix-radio branch)
**to**: rhachet/keyrack

## situation

the `EHMPATH_BEAVER_GITHUB_TOKEN` github secret contains a JSON blob:
```json
{"appId":"3234162","privateKey":"...","installationId":"...","mech":"EPHEMERAL_VIA_GITHUB_APP"}
```

in CI, `keyrack.source({ env: 'test', owner: 'ehmpath', mode: 'strict' })` runs in jest env setup.

**expected**: keyrack translates the JSON blob to an ephemeral `ghs_*` token via the `EPHEMERAL_VIA_GITHUB_APP` mechanism.

**actual**: keyrack passes through the raw JSON blob without translation.

```
token prefix: {"appId":"3234162","
```

## evidence

CI run: https://github.com/ehmpathy/rhachet-roles-bhuild/actions/runs/24454964815

test failure:
```
expect(result.token.startsWith('ghs_')).toBe(true);
// Expected: true
// Received: false
```

## question

how should keyrack handle mechanism translation in CI?

options considered:
1. **keyrack firewall action** — translate secrets before workflow passes them to jobs
2. **keyrack.source() auto-translate** — detect `mech` field in JSON and translate on read
3. **keyrack.get() auto-translate** — translate when the key is accessed (current code uses `keyrack.get()`)

## current flow

```
github secret (JSON blob)
    ↓
workflow env var: EHMPATH_BEAVER_GITHUB_TOKEN="${{ secrets.EHMPATH_BEAVER_GITHUB_TOKEN }}"
    ↓
jest.integration.env.ts: keyrack.source({ env: 'test', owner: 'ehmpath', mode: 'strict' })
    ↓
test: keyrack.get({ for: { key: 'EHMPATH_BEAVER_GITHUB_TOKEN' }, env: 'test', owner: 'ehmpath' })
    ↓
returns: raw JSON blob (not translated)
```

## files involved

- `.github/workflows/.test.yml` — passes secret as env var
- `jest.integration.env.ts` — calls keyrack.source()
- `src/domain.operations/radio/auth/getAuthFromKeyrack.ts` — calls keyrack.get()

## branch

`vlad/fix-radio` — PR #176

---

## diagnosis (2026-05-14)

**root cause**: the GitHub secret JSON blob does NOT contain the `mech` field.

### evidence

the provision readme shows the manual flow constructs JSON without `mech`:
```bash
jq -c -n '{appId: "...", privateKey: $key, installationId: "..."}'
```

the `--mech EPHEMERAL_VIA_GITHUB_APP` flag is passed to `keyrack set` but that doesn't embed it in the stored JSON.

### mechanism detection flow

1. `vaultAdapterOsEnvvar.get()` reads from `process.env[EHMPATH_BEAVER_GITHUB_TOKEN]`
2. calls `inferKeyrackMechForGet({ value: source })`
3. `inferKeyrackMechForGet` parses JSON and looks for `parsed.mech`
4. if no `.mech` field → returns `'PERMANENT_VIA_REPLICA'` (passthrough)
5. passthrough means raw JSON blob is returned instead of translated `ghs_*` token

### fix required

re-set the GitHub secret with the `mech` field embedded in the JSON:

```bash
# construct JSON WITH mech field
jq -c -n --rawfile key ~/path/to/beaver-by-bhuild.private-key.pem \
  '{appId: "3234162", privateKey: $key, installationId: "INSTALLATION_ID", mech: "EPHEMERAL_VIA_GITHUB_APP"}' | \
gh secret set EHMPATH_BEAVER_GITHUB_TOKEN --repo ehmpathy/rhachet-roles-bhuild
```

or use the interactive `rhx keyrack set --vault github.secrets` flow which handles this automatically.

### action for human

1. locate the private key PEM file
2. get the installation ID via `gh api --method GET /orgs/ehmpathy/installations | jq '.installations[] | select(.app_slug == "beaver-by-bhuild") | .id'`
3. re-set the secret with proper JSON structure
4. re-run CI to verify fix
