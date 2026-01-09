import { BadRequestError, getError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { setBranchBehaviorBind } from './setBranchBehaviorBind';

describe('setBranchBehaviorBind', () => {
  given('[case1] protected branch names', () => {
    when('[t0] branchName is main', () => {
      then('throws BadRequestError', async () => {
        const error = await getError(async () =>
          setBranchBehaviorBind({
            branchName: 'main',
            behaviorDir: '/some/behavior/dir',
          }),
        );
        expect(error).toBeInstanceOf(BadRequestError);
        expect(error.message).toContain('can not bind');
        expect(error.message).toContain('main');
        expect(error.message).toContain('switch to a scoped branch');
      });
    });

    when('[t1] branchName is master', () => {
      then('throws BadRequestError', async () => {
        const error = await getError(async () =>
          setBranchBehaviorBind({
            branchName: 'master',
            behaviorDir: '/some/behavior/dir',
          }),
        );
        expect(error).toBeInstanceOf(BadRequestError);
        expect(error.message).toContain('can not bind');
        expect(error.message).toContain('master');
      });
    });
  });
});
