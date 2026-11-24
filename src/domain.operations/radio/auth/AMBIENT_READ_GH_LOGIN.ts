/**
 * .what = the read of the box's gh host login: `gh auth token` with the token env vars unset
 * .why = `gh auth token` prints GH_TOKEN or GITHUB_TOKEN when either is set, ahead of the stored
 *        login. the send never uses those: runGhCommand strips both and sends under the token it
 *        was handed, or under gh's stored session for as-human. so the probe reads the same
 *        stored login the send does, and an env token can never pass as the box's login, nor ride
 *        out under the robot label
 */
export const AMBIENT_READ_GH_LOGIN =
  'env -u GH_TOKEN -u GITHUB_TOKEN gh auth token' as const;
