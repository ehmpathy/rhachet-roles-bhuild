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
    expect: { message: '--description is empty; a new task needs a body' },
  },
  {
    description:
      'an update with an empty description is rejected, so it cannot wipe the body',
    given: { repo, exid: '5', title: null, description: '', status: null },
    expect: { message: '--description is empty' },
  },
  {
    description:
      'an update with a blank piped description is rejected, status or not',
    given: {
      repo,
      exid: '5',
      title: null,
      description: '\n',
      status: RadioTaskStatus.CLAIMED,
    },
    expect: { message: '--description is empty' },
  },
  {
    description:
      'a new task with a blank piped description is rejected as a create with no body',
    given: {
      repo,
      exid: null,
      title: 'fix it',
      description: '  \n',
      status: null,
    },
    expect: { message: '--description is empty; a new task needs a body' },
  },
  {
    description:
      'an update with an empty title is rejected, so it cannot wipe the title',
    given: { repo, exid: '5', title: '', description: null, status: null },
    expect: { message: '--title is empty' },
  },
  {
    description: 'an update with a blank title is rejected, body or not',
    given: { repo, exid: '5', title: '  ', description: 'body', status: null },
    expect: { message: '--title is empty' },
  },
  {
    description: 'a new task with a blank title is rejected as a create',
    given: { repo, exid: null, title: '  ', description: 'body', status: null },
    expect: { message: '--title required for new tasks' },
  },
  {
    description:
      'an empty exid is rejected, so an update record never sends as a create',
    given: {
      repo,
      exid: '',
      title: null,
      description: null,
      status: RadioTaskStatus.CLAIMED,
    },
    expect: { message: '--exid is empty' },
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
  {
    description: 'an update with a body passes whole',
    given: {
      repo,
      exid: '123',
      title: null,
      description: 'the new body\n',
      status: null,
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
          expect(error.message).toMatchSnapshot();
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
