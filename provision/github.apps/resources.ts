import type { DeclastructProvider } from 'declastruct';
import { getDeclastructGithubProvider } from 'declastruct-github';
import type { DomainEntity } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';

import { getResourcesOfAppBhuildBeaver } from './resources.app.bhuild-beaver';

/**
 * .what = declastruct provider configuration for github apps
 * .why = enables declastruct CLI to interact with GitHub API
 */
export const getProviders = async (): Promise<DeclastructProvider[]> => [
  getDeclastructGithubProvider(
    {
      credentials: {
        token:
          process.env.GITHUB_TOKEN ??
          UnexpectedCodePathError.throw('GITHUB_TOKEN not set'),
      },
    },
    {
      log: {
        info: () => {},
        debug: () => {},
        warn: console.warn,
        error: console.error,
      },
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
