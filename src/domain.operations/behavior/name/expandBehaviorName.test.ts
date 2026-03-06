import { BadRequestError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { expandBehaviorName } from './expandBehaviorName';

describe('expandBehaviorName', () => {
  given('[case1] explicit name (not @branch)', () => {
    when('[t0] name is explicit', () => {
      then('it returns the name unchanged', () => {
        const result = expandBehaviorName({
          name: 'my-feature',
          branch: 'casey/other-branch',
        });
        expect(result).toEqual('my-feature');
      });
    });
  });

  given('[case2] @branch token with bare branch', () => {
    when('[t0] branch has no slashes', () => {
      then('it returns full branch name', () => {
        const result = expandBehaviorName({
          name: '@branch',
          branch: 'fix-urgent-bug',
        });
        expect(result).toEqual('fix-urgent-bug');
      });
    });
  });

  given('[case3] @branch token with single prefix', () => {
    when('[t0] branch has author prefix', () => {
      then('it returns last segment', () => {
        const result = expandBehaviorName({
          name: '@branch',
          branch: 'casey/add-user-auth',
        });
        expect(result).toEqual('add-user-auth');
      });
    });
  });

  given('[case4] @branch token with multi prefix', () => {
    when('[t0] branch has multiple segments', () => {
      then('it returns last segment only', () => {
        const result = expandBehaviorName({
          name: '@branch',
          branch: 'org/team/cool-feature',
        });
        expect(result).toEqual('cool-feature');
      });
    });
  });

  given('[case5] @branch on protected branch main', () => {
    when('[t0] branch is main', () => {
      then('it throws BadRequestError', () => {
        expect(() =>
          expandBehaviorName({
            name: '@branch',
            branch: 'main',
          }),
        ).toThrow(BadRequestError);
        expect(() =>
          expandBehaviorName({
            name: '@branch',
            branch: 'main',
          }),
        ).toThrow('cannot init behavior on protected branch: main');
      });
    });
  });

  given('[case6] @branch on protected branch master', () => {
    when('[t0] branch is master', () => {
      then('it throws BadRequestError', () => {
        expect(() =>
          expandBehaviorName({
            name: '@branch',
            branch: 'master',
          }),
        ).toThrow(BadRequestError);
        expect(() =>
          expandBehaviorName({
            name: '@branch',
            branch: 'master',
          }),
        ).toThrow('cannot init behavior on protected branch: master');
      });
    });
  });

  given('[case7] @branch in detached HEAD state', () => {
    when('[t0] branch is HEAD', () => {
      then('it throws BadRequestError', () => {
        expect(() =>
          expandBehaviorName({
            name: '@branch',
            branch: 'HEAD',
          }),
        ).toThrow(BadRequestError);
        expect(() =>
          expandBehaviorName({
            name: '@branch',
            branch: 'HEAD',
          }),
        ).toThrow('cannot expand @branch in detached HEAD state');
      });
    });
  });

  given('[case8] @branch with mixed case branch', () => {
    when('[t0] branch has mixed case', () => {
      then('it preserves case', () => {
        const result = expandBehaviorName({
          name: '@branch',
          branch: 'Casey/Add-User-Auth',
        });
        expect(result).toEqual('Add-User-Auth');
      });
    });
  });
});
