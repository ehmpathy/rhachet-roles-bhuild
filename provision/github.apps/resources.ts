import type { DeclastructProvider } from 'declastruct';
import { getDeclastructGithubProvider } from 'declastruct-github';
import type { DomainEntity } from 'domain-objects';
import { ConstraintError } from 'helpful-errors';
import { keyrack } from 'rhachet/keyrack';
import { genLogMethods } from 'sdk-logs';

import { getResourcesOfAppBhuildBeaver } from './resources.app.bhuild-beaver';

/**
 * .what = get admin github token from keyrack
 * .why = auto-fetch credentials from 1password via keyrack
 */
const getGithubAdminToken = async (): Promise<string> => {
  const { attempt, emit } = await keyrack.get({
    for: { key: 'GITHUB_TOKEN' },
    env: 'sudo',
    allow: { dangerous: true },
  });

  if (attempt.status !== 'granted') {
    throw new ConstraintError(`\n${emit.stdout}`, attempt);
  }

  return attempt.grant.key.secret;
};

/**
 * .what = declastruct provider configuration for github apps
 * .why = enables declastruct CLI to interact with GitHub API
 */
export const getProviders = async (): Promise<DeclastructProvider[]> => [
  getDeclastructGithubProvider(
    {
      credentials: {
        token: await getGithubAdminToken(),
      },
    },
    {
      // MUST be an sdk-logs logger — 1.6.0 DAOs read log._.level via as-procedure
      log: genLogMethods(),
    },
  ),
];

/**
 * .what = all github app resource declarations
 * .why = composes all app resources for unified provision
 */
export const getResources = async (): Promise<DomainEntity<any>[]> => {
  // gather all app resources
  const resourcesOfAppBhuildBeaver = await getResourcesOfAppBhuildBeaver();

  return [
    // app for beaver role radio task dispatch
    ...resourcesOfAppBhuildBeaver,
  ];
};
