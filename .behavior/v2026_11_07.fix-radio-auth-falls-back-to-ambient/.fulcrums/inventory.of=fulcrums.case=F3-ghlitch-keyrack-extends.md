# F3 — drop the ghlitch keyrack extends that `rhx upgrade` added

## the fork

`rhx upgrade` linked the ghlitch observer + operator roles and added their keyrack manifests to
`.agent/keyrack.yml` `extends:`. each declares `AWS_PROFILE` under `env.all`, so every keyrack
unlock, test env included, asks for an aws sso login. this repo's tests use no aws.

- **A:** drop the two ghlitch extends (keep the bhrain driver extend the upgrade also added)
- **B:** keep them, and have each human unlock aws sso before any integration run

## taken: A, and why at the time

the integration runner halted on the sso prompt with no human at the seat; CI's keyrack firewall
reads the same manifest. A restores the prior key set. the upgrade also dropped a comment on
`BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN`; it is restored.

## rework: clean

re-add two lines. a later `rhx init` may re-add them on its own.

## confidence: 80%, and why not higher

a later ghlitch role may be meant to run here; then its keys belong under the env it needs, not
`env.all`.

## where

- `.agent/keyrack.yml`

## verdict

open — for the commander
