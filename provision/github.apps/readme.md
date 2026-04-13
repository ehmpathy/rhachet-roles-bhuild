# github apps provision

this directory houses the declared GitHub Apps used by rhachet-roles-bhuild.

## structure

```
provision/github.apps/
├── readme.md                              # this file
├── resources.ts                           # main declastruct resources file
└── resources.app.bhuild-beaver.ts         # app auth for beaver role (radio.task.push)
```

## prerequisites

### store admin token in keyrack

declastruct needs a GitHub token with admin access to create apps. set it in keyrack from 1password:

```bash
rhx keyrack set --key GITHUB_TOKEN --env sudo --vault 1password

# to find a 1password uri:
#   1. open 1password app
#   2. find item
#   3. right-click field → "Copy Secret Reference"
#
# enter 1password uri (e.g., op://vault/item/field): **************
```

verify the key was set:

```bash
rhx keyrack get --key GITHUB_TOKEN --env sudo

# ✅ granted: GITHUB_TOKEN
```

the provision commands will auto-fetch the token via `keyrack.get()`.

## usage

### generate a plan

```bash
npx declastruct plan \
  --wish ./provision/github.apps/resources.ts \
  --into ./provision/github.apps/.temp/plan.json
```

### apply the plan

```bash
npx declastruct apply \
  --plan ./provision/github.apps/.temp/plan.json
```

### store app credentials in keyrack

after apply completes, store the produced credentials in keyrack.

#### interactive flow (recommended)

use the interactive `keyrack set` flow — it handles the GitHub App JSON format automatically.

**run twice** — once for local tests, once for CI/CD (github.secrets is write-only):

```bash
# for local test use
rhx keyrack set --key EHMPATH_BEAVER_GITHUB_TOKEN --env test --vault os.secure

# for CI/CD
rhx keyrack set --key EHMPATH_BEAVER_GITHUB_TOKEN --env test --vault github.secrets
```

both commands use the same interactive prompt to ensure the credential is formatted correctly:

```bash

   which mechanism?
   1. EPHEMERAL_VIA_GITHUB_APP — github app installation (short-lived tokens)
   2. PERMANENT_VIA_REPLICA — static secret (api key, password)

   choice: 1
🔐 keyrack set ehmpathy.test.EHMPATH_BEAVER_GITHUB_TOKEN via EPHEMERAL_VIA_GITHUB_APP
   │
   ├─ which github org?
   │  ├─ options
   │  │  ├─ 1. rheuse
   │  │  ├─ 2. bhuild
   │  │  ├─ 3. ehmpathy
   │  └─ choice: 3
   │     └─ ehmpathy ✓
   │
   ├─ which github app?
   │  ├─ options
   │  │  ├─ 1. declastruct-github-conformer (id: 2471935)
   │  │  ├─ 2. rhelease (id: 2472031)
   │  │  ├─ 3. beaver-by-bhuild (id: 3234162)
   │  └─ choice: 3
   │     └─ beaver-by-bhuild ✓
   │
   ├─ which github app secret?
   │  └─ private key path (.pem): ~/path/to/beaver-by-bhuild.private-key.pem
   │
   └─ ✓ pushed to github.secrets (no roundtrip — write-only vault)
⠀
🔐 keyrack set (org: ehmpathy, env: test)
   └─ ehmpathy.test.EHMPATH_BEAVER_GITHUB_TOKEN
      ├─ mech: EPHEMERAL_VIA_GITHUB_APP
      └─ vault: github.secrets
```

keyrack automatically:
- fetches the installation id from GitHub API
- constructs the JSON blob with appId, privateKey, installationId
- pushes to the specified vault (github.secrets for CI, os.secure for local)

#### manual flow (advanced)

if you prefer to construct the JSON manually:

1. get the installation id:

```bash
gh api --method GET /orgs/ehmpathy/installations | jq '.installations[] | select(.app_slug == "beaver-by-bhuild") | {app_id, id}'
# returns: { "app_id": 3234162, "id": 120377098 }
```

2. store in keyrack (pipe the json via stdin):

```bash
jq -c -n --rawfile key ~/path/to/beaver-by-bhuild.private-key.pem \
  '{appId: "APP_ID", privateKey: $key, installationId: "INSTALLATION_ID"}' | \
npx rhachet keyrack set \
  --key EHMPATH_BEAVER_GITHUB_TOKEN \
  --env prep \
  --vault os.secure \
  --owner ehmpath \
  --mech EPHEMERAL_VIA_GITHUB_APP
```

replace `APP_ID`, `INSTALLATION_ID`, and the pem file path with actual values.

#### verify

```bash
rhx keyrack get --key EHMPATH_BEAVER_GITHUB_TOKEN --env prep --owner ehmpath
# ✅ granted: EHMPATH_BEAVER_GITHUB_TOKEN
```

### manual override

if you prefer to set the token manually (skips keyrack):

```bash
GITHUB_TOKEN=<token> npx declastruct plan ...
```

## local usage (cli)

to get short-lived access tokens locally via your GitHub App credentials.

### bash function

add this function to your `~/.bashrc` or `~/.zshrc`:

```bash
# generates a short-lived github app installation access token (valid for 1 hour)
# usage: get_github_app_token <org> <app_id> <private_key>
get_github_app_token() {
  # prepare the jwt
  local ORG="$1" APP_ID="$2" PRIVATE_KEY="$3"
  local NOW=$(date +%s)
  local IAT=$((NOW - 60)) EXP=$((NOW + 600))
  local HEADER=$(echo -n '{"alg":"RS256","typ":"JWT"}' | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')
  local PAYLOAD=$(echo -n "{\"iat\":${IAT},\"exp\":${EXP},\"iss\":\"${APP_ID}\"}" | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')
  local KEY_FILE=$(mktemp)
  echo -e "$PRIVATE_KEY" > "$KEY_FILE"
  local SIGNATURE=$(echo -n "${HEADER}.${PAYLOAD}" | openssl dgst -sha256 -sign "$KEY_FILE" 2>/dev/null | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')
  rm -f "$KEY_FILE"
  if [[ -z "$SIGNATURE" ]]; then >&2 echo "error: failed to sign jwt (check private key format)"; return 1; fi

  # get the installation
  local JWT="${HEADER}.${PAYLOAD}.${SIGNATURE}"
  local INSTALLATION=$(curl -s -H "Authorization: Bearer $JWT" -H "Accept: application/vnd.github+json" "https://api.github.com/orgs/${ORG}/installation")
  local ERROR=$(echo "$INSTALLATION" | jq -r '.message // empty')
  if [[ -n "$ERROR" ]]; then >&2 echo "error: $ERROR"; return 1; fi

  # grab a token
  local INSTALLATION_ID=$(echo "$INSTALLATION" | jq '.id')
  local TOKEN_RESP=$(curl -s -X POST -H "Authorization: Bearer $JWT" -H "Accept: application/vnd.github+json" "https://api.github.com/app/installations/${INSTALLATION_ID}/access_tokens")
  local TOKEN=$(echo "$TOKEN_RESP" | jq -r '.token // empty')
  if [[ -z "$TOKEN" ]]; then >&2 echo "error: $(echo "$TOKEN_RESP" | jq -r '.message // "failed to get token"')"; return 1; fi

  # verify identity (output to stderr so it doesn't get captured in GITHUB_TOKEN=$(...) usage)
  local APP_SLUG=$(echo "$INSTALLATION" | jq -r '.app_slug')
  local REPOS=$(curl -s -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json" "https://api.github.com/installation/repositories" | jq -r '[.repositories[].name] | join(", ") // empty')
  >&2 echo ""
  >&2 echo "🔑 authentication succeeded"
  >&2 echo "├─ as: ${APP_SLUG}[bot]"
  >&2 echo "├─ org: ${ORG}"
  >&2 echo "└─ repos: ${REPOS:-all}"
  >&2 echo ""
  echo "$TOKEN"
}
```

### 1password integration

store your GitHub App credentials in 1Password, then add aliases to your shell config:

```bash
# 1password item structure:
#   - item name: "github.app.bhuild-beaver"
#   - fields:
#     - app_id: "123456"
#     - app_private_key: "-----BEGIN RSA PRIVATE KEY-----\n..." (use literal `\n` instead of newlines)

# alias to export BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN with short-lived app token
alias use.github.bhuild.beaver='export BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN=$(get_github_app_token \
  ehmpathy \
  "$(op item get github.app.bhuild-beaver --fields label=app_id --format json | jq -r .value)" \
  "$(op item get github.app.bhuild-beaver --fields label=app_private_key --format json | jq -r .value)")'
```

usage:
```bash
# activate the token (valid for 1 hour)
use.github.bhuild.beaver

# now run commands that need BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN
npm run test:acceptance -- skill.radio.task.push.via-gh-issues
```
