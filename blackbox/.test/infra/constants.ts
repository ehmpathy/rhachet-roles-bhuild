/**
 * .what = test constants for acceptance tests
 * .why = centralized config for test infrastructure
 */

/**
 * .what = demo repo for gh.issues acceptance tests
 * .why = dedicated test repo to isolate test issues from real repos
 */
export const GITHUB_DEMO_REPO = 'ehmpathy/rhachet-roles-bhuild-demo';

/**
 * .what = github token for bhuild demo repo
 * .why = auth for gh.issues acceptance tests
 */
export const BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN = process.env.BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN;
