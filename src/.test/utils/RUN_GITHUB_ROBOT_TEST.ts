/**
 * .what = true where the live github-robot tier is named: `GITHUB_ROBOT_LIVE=true`
 * .why  = these tests mint a real robot token (EHMPATH_BEAVER_GITHUB_TOKEN, a github app secret)
 *         or write real issues with it. ci holds that token via the keyrack firewall, and sets
 *         the flag in `.github/workflows/.test.yml`, so the real writes run on every pr. a fleet
 *         host holds no github token (a github write there goes through `--auth as-human`), so
 *         a local default run leaves them off
 *
 * .note = target it locally on a host that holds the token:
 *         `GITHUB_ROBOT_LIVE=true npx jest -c ./jest.integration.config.ts <file>`
 * .note = the blackbox tier reads the same flag via `blackbox/.test/infra/constants.ts`
 */
export const RUN_GITHUB_ROBOT_TEST = process.env.GITHUB_ROBOT_LIVE === 'true';
