# howto.declapract-upgrade-libraries

## .what

extra steps when `declapract.upgrade` runs on a library (not a leaf deployable service).

## .when

applies: npm packages (e.g. `simple-dynamodb-client`, `sdk-config`), shared libraries other
repos consume.

does not apply: leaf services (`svc-coachbook`, `svc-rentals`), lambda deployables.

## .why

libraries have stricter needs: a cycle propagates to every consumer, a heavy dep (aws sdk)
bloats every consumer bundle, and dpdm enforces cycle-free imports.

## .steps

### 1. verify cycles eliminated

```bash
npm run test:lint
```

if dpdm fails: do NOT add prod deps to `.dpdmrc.yaml`'s exclude array. fix the real circular
imports (`rule.forbid.dpdm-exclude-change`).

### 2. check for AWS SDK deps

```bash
grep -r "from '@aws-sdk" src/
```

if found, apply the dependency-injection pattern below.

## .pattern: eliminate AWS SDK runtime imports

the sdk-logs pattern breaks the import chain so dpdm cannot follow into node_modules.

1. **sdk passed via `context`, never `input`** — context = injectable deps; input = the
   operation's data
2. **sdk nested under `context.aws.{service}.sdk`** — e.g. `context.aws.ssm.sdk`,
   `context.aws.dynamodb.sdk`

reference: `ehmpathy/sdk-logs`.

```ts
// 1. type-only imports — erased at compile time
import type {
  CloudWatchLogsClient,
  CreateLogGroupCommand,
  PutLogEventsCommand,
  ResourceAlreadyExistsException,
} from '@aws-sdk/client-cloudwatch-logs';

// 2. declare sdk type
export type SdkAwsCloudwatch = {
  CloudWatchLogsClient: typeof CloudWatchLogsClient;
  CreateLogGroupCommand: typeof CreateLogGroupCommand;
  PutLogEventsCommand: typeof PutLogEventsCommand;
  ResourceAlreadyExistsException: typeof ResourceAlreadyExistsException;
};

// 3. sdk passed via context
export const genCloudwatchOutlet = (
  input: { region?: string; logGroup?: string },
  context: { aws: { cloudwatch: { sdk: SdkAwsCloudwatch } } },
) => {
  const {
    CloudWatchLogsClient,
    CreateLogGroupCommand,
    PutLogEventsCommand,
    ResourceAlreadyExistsException,
  } = context.aws.cloudwatch.sdk;
  const client = new CloudWatchLogsClient({});
  // ...
};

// 4. the leaf service that consumes this library provides the sdk
import * as sdkAwsCloudwatch from '@aws-sdk/client-cloudwatch-logs';
genCloudwatchOutlet(
  { region: 'us-east-1' },
  { aws: { cloudwatch: { sdk: sdkAwsCloudwatch } } },
);
```

source carries no runtime import of the aws sdk, so dpdm cannot follow into node_modules — the
sdk stays in leaf services, and the library stays light.

## .see also

- `howto.dispatch-dependency-upgrades.md` — dispatch pattern
- `rule.forbid.dpdm-exclude-change` — never exclude prod deps
- `rule.require.dependency-injection` — the DI pattern

---

written by human + seaturtle 🐢
