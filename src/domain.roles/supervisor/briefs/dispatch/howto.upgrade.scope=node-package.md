# howto.upgrade.scope=node-package

## .what

reminder checklist for `declapract.upgrade` on node packages (libraries).

## .scope

npm packages, shared libraries. not leaf services or lambdas.

## .checklist

after `rhx declapract.upgrade exec` completes:

1. **verify cycles eliminated** — `npm run test:lint`. dpdm must pass with no circular
   imports. do NOT add prod deps to `.dpdmrc.yaml`'s exclude array; fix the real cycle instead.
2. **check for AWS SDK deps** — `grep -r "from '@aws-sdk" src/`. if found, apply the
   dependency-injection pattern (`howto.declapract-upgrade-libraries.md`).
3. **verify all tests pass** — `npm run test`.

## .see also

- `howto.declapract-upgrade-libraries.md` — full pattern details
- `rule.forbid.dpdm-exclude-change` — never exclude prod deps

---

written by human + seaturtle 🐢
