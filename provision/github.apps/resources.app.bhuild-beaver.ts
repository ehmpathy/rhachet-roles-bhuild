import type { DeclaredResource } from 'declastruct';
import {
  DeclaredGithubApp,
  DeclaredGithubAppInstallation,
  DeclaredGithubOwner,
} from 'declastruct-github';

/**
 * .what = declares the bhuild-beaver app resources
 * .why = enables beaver role to push/pull radio tasks via gh.issues
 */
export const getResourcesOfAppBhuildBeaver = async (): Promise<
  DeclaredResource[]
> => {
  // declare the owner
  const owner = new DeclaredGithubOwner({
    type: 'organization',
    slug: 'ehmpathy',
  });

  // declare the app
  const app = DeclaredGithubApp.as({
    owner,
    slug: 'bhuild-beaver',
    name: 'Bhuild Beaver',
    description:
      'grant narrow auth to beaver role for radio task dispatch via gh.issues',
    homepageUrl: 'https://github.com/ehmpathy/rhachet-roles-bhuild',
    public: false,

    // narrow permissions scoped to issue read/write only
    permissions: {
      repository: {
        // radio.task.push/pull via gh.issues
        issues: 'write',

        metadata: 'read', // always required
      },
      organization: {},
    },
    events: [],
    webhookUrl: null,
  });

  // declare the installation on ehmpathy org, scoped to demo repo
  const installation = DeclaredGithubAppInstallation.as({
    app: { owner, slug: app.slug },
    target: owner,
    repositorySelection: 'selected',
    repositories: ['rhachet-roles-bhuild-demo'],
  });

  return [app, installation];
};
