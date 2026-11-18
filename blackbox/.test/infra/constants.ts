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
 * .what = true where the live github-robot tier is named: `GITHUB_ROBOT_LIVE=true`
 * .why  = a push that writes real issues via the default auth (via-keyrack, the robot token
 *         EHMPATH_BEAVER_GITHUB_TOKEN) needs a github app secret. ci holds it via the keyrack
 *         firewall and sets the flag in `.github/workflows/.test.yml`, so the real writes run on
 *         every pr; a fleet host holds no github token, so a local default run leaves them off
 *
 * .note = target it locally on a host that holds the token:
 *         `GITHUB_ROBOT_LIVE=true npx jest -c ./jest.acceptance.config.ts <file>`
 */
export const RUN_GITHUB_ROBOT_TEST = process.env.GITHUB_ROBOT_LIVE === 'true';

/**
 * .what = github token for bhuild demo repo
 * .why = auth for gh.issues acceptance tests (explicit auth mode)
 *
 * .deprecated = prefer default keyrack auth via EHMPATH_BEAVER_GITHUB_TOKEN
 *               this constant is retained for backward compatibility tests
 */
export const BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN = process.env.BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN;
