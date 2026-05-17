import { given, then, when } from 'test-fns';

import { getAuthFromKeyrack } from './getAuthFromKeyrack';

describe('getAuthFromKeyrack.integration', () => {
  given('[case1] keyrack with unlocked credentials', () => {
    when('[t0] get EHMPATH_BEAVER_GITHUB_TOKEN', () => {
      then('returns ephemeral ghs_* token', async () => {
        const result = await getAuthFromKeyrack({
          owner: 'ehmpath',
          env: 'test',
          key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
        });

        // log for diagnosis
        console.log('token prefix:', result.token.substring(0, 20));
        console.log('token length:', result.token.length);
        console.log('starts with ghs_:', result.token.startsWith('ghs_'));

        // parse JSON to see what keys are present (if it's JSON)
        try {
          const parsed = JSON.parse(result.token);
          console.log('parsed JSON keys:', Object.keys(parsed));
          console.log('has mech?:', 'mech' in parsed);
          console.log('mech value:', parsed.mech);
        } catch {
          console.log('not JSON — likely already translated');
        }

        expect(result.token).toBeDefined();
        expect(result.token.startsWith('ghs_')).toBe(true);
      });
    });
  });
});
