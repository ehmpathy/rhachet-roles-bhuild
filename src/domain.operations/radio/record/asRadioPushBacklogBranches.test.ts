import { given, then, when } from 'test-fns';

import { asRadioPushBacklogBranches } from './asRadioPushBacklogBranches';

describe('asRadioPushBacklogBranches', () => {
  given('[case1] no other fates and no backlog', () => {
    when('[t0] the branches render', () => {
      then('there are none, so a lone nudge prints alone', () => {
        expect(asRadioPushBacklogBranches({ others: [], backlog: 0 })).toEqual(
          [],
        );
      });
    });
  });

  given('[case2] no other fates but a backlog left', () => {
    when('[t0] the branches render', () => {
      then('the backlog line stands alone', () => {
        expect(asRadioPushBacklogBranches({ others: [], backlog: 2 })).toEqual([
          { line: 'backlog = 2 await the radio', children: [] },
        ]);
      });
    });
  });
});
