import { given, then, when } from 'test-fns';

import { RADIO_PUSH_FLAGS_CARRIED } from '@src/domain.operations/radio/cli/asRadioPushCommandWithPromise';

import { schemaOfArgs } from './radioTaskPush';

/**
 * .what = the flags a push reads that a re-run never carries: help, and rhachet's own dispatch
 */
const FLAGS_NOT_CARRIED = ['help', 'h', 'repo', 'role', 'skill', 's'];

describe('radioTaskPush', () => {
  given('[case1] the flags the push contract reads', () => {
    when('[t0] each is checked against the nudge re-run command', () => {
      then('every task flag is carried, so the re-run drops none', () => {
        const flagsRead = Object.keys(schemaOfArgs.shape.named.shape);
        const flagsUncarried = flagsRead.filter(
          (flag) =>
            !(RADIO_PUSH_FLAGS_CARRIED as readonly string[]).includes(flag) &&
            !FLAGS_NOT_CARRIED.includes(flag),
        );
        expect(flagsUncarried).toEqual([]);
      });
    });
  });
});
