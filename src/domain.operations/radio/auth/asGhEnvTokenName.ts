/**
 * .what = the name of the gh env token this env holds, GH_TOKEN before GITHUB_TOKEN, else null
 * .why = gh reads either env token ahead of its stored login, yet every radio send that uses the
 *        stored login strips both; a miss on such a box names the token it cannot use
 */
export const asGhEnvTokenName = (input: {
  env: NodeJS.ProcessEnv;
}): 'GH_TOKEN' | 'GITHUB_TOKEN' | null => {
  if (input.env.GH_TOKEN) return 'GH_TOKEN';
  if (input.env.GITHUB_TOKEN) return 'GITHUB_TOKEN';
  return null;
};
