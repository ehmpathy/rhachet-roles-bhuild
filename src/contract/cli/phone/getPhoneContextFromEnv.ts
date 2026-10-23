import { homedir, hostname } from 'os';
import { join } from 'path';

import { genSdkRhachetClone } from '@src/access/sdks/sdkRhachetClone';
import type { PhoneContext } from '@src/domain.operations/phone/PhoneContext';
import { withPhoneRosterMemo } from '@src/domain.operations/phone/withPhoneRosterMemo';

/**
 * .what = the phone context a cli builds from its env
 * .why = each outside dependency is named once, at the contract layer, and injected below
 *
 * .note = env overrides, each optional:
 *         - PHONE_GROVE: this grove's name; default the hostname (A4)
 *         - PHONE_GIT_ROOT, else CREWWORK_GIT_ROOT: where trees live; default ~/git
 *         - GIT_FOREST_DIR: the grove registry root; default ~/.git.forest
 *         - PHONE_RHACHET_BIN: the rhachet cli to call; default the one this package depends on
 * .note = `roster: 'memo'` reads each tree's roster once per call: a one-shot verb reads the
 *         same roster from several steps, and each read execs rhachet. the daemon lives long and
 *         must see a peer come and go, so it reads `live` and memoizes per tick instead
 */
export const getPhoneContextFromEnv = (input: {
  env: NodeJS.ProcessEnv;
  roster: 'memo' | 'live';
}): PhoneContext => {
  const sdkClone = genSdkRhachetClone({
    bin: input.env.PHONE_RHACHET_BIN || null,
  });
  return {
    groveSelf: input.env.PHONE_GROVE || hostname(),
    gitRoot:
      input.env.PHONE_GIT_ROOT ||
      input.env.CREWWORK_GIT_ROOT ||
      join(homedir(), 'git'),
    forestDir: input.env.GIT_FOREST_DIR || join(homedir(), '.git.forest'),
    sdkClone:
      input.roster === 'memo' ? withPhoneRosterMemo({ sdkClone }) : sdkClone,
  };
};
