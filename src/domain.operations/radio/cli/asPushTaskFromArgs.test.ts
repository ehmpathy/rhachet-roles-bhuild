import { ConstraintError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

import { asPushTaskFromArgs } from './asPushTaskFromArgs';

const repo = new RadioTaskRepo({ owner: 'ehmpathy', name: 'rhachet' });

const REJECT_CASES = [
  {
    description: 'a new task with no title is rejected',
    given: { repo, exid: null, title: null, description: 'body', status: null },
    expect: { message: '--title required for new tasks' },
  },
  {
    description: 'a new task with an empty title is rejected',
    given: { repo, exid: null, title: '', description: 'body', status: null },
    expect: { message: '--title required for new tasks' },
  },
  {
    description:
      'a new task with no description is rejected, before it is recorded',
    given: {
      repo,
      exid: null,
      title: 'fix it',
      description: null,
      status: null,
    },
    expect: { message: '--description required for new task' },
  },
  {
    description: 'a new task with an empty description is rejected',
    given: { repo, exid: null, title: 'fix it', description: '', status: null },
    expect: { message: '--description required for new task' },
  },
];

const ACCEPT_CASES = [
  {
    description: 'a new task with title and description passes whole',
    given: {
      repo,
      exid: null,
      title: 'fix it',
      description: 'it flakes',
      status: null,
    },
  },
  {
    description: 'an update by exid needs no title nor description',
    given: {
      repo,
      exid: '123',
      title: null,
      description: null,
      status: RadioTaskStatus.CLAIMED,
    },
  },
];

describe('asPushTaskFromArgs', () => {
  REJECT_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the push args are checked', () => {
        then('it throws a ConstraintError that names the fix', async () => {
          const error = await getError(() =>
            asPushTaskFromArgs(thisCase.given),
          );
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain(thisCase.expect.message);
          expect(error.message).toContain('add --');
          expect(error.message).not.toContain('{');
        });
      });
    }),
  );
  ACCEPT_CASES.map((thisCase, index) =>
    given(
      `[case${REJECT_CASES.length + index + 1}] ${thisCase.description}`,
      () => {
        when('[t0] the push args are checked', () => {
          then('it returns the args whole', () => {
            expect(asPushTaskFromArgs(thisCase.given)).toEqual(thisCase.given);
          });
        });
      },
    ),
  );
});
