import { asIsoDateStamp } from 'iso-time';

import { RadioTask } from '@src/domain.objects/RadioTask';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

import { asTaskDetailOutput } from './asTaskDetailOutput';

const task = new RadioTask({
  exid: '7',
  title: 'book-a-lesson reminder',
  description: 'remind each surfer the day before',
  status: RadioTaskStatus.QUEUED,
  repo: new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' }),
  pushedBy: 'seaturtle',
  pushedAt: asIsoDateStamp('2026-11-14'),
  claimedBy: null,
  claimedAt: null,
  deliveredAt: null,
  branch: null,
});

const TEST_CASES: {
  description: string;
  given: { outcome: string | null; auth: string | null };
}[] = [
  {
    description: 'a pull from a value with one source shows no auth row',
    given: { outcome: null, auth: null },
  },
  {
    description: 'an as-ehmpath pull names the spot that paid',
    given: { outcome: null, auth: 'as-ehmpath (via ambient)' },
  },
  {
    description: 'an as-ehmpath push names the spot that paid',
    given: { outcome: 'pushed', auth: 'as-ehmpath (via keyrack)' },
  },
];

describe('asTaskDetailOutput', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const output = asTaskDetailOutput({
        task,
        via: 'gh.issues',
        cached: null,
        recorded: null,
        ...thisCase.given,
      });
      const authRow = output
        .split('\n')
        .filter((line) => line.includes('├─ auth:'));
      expect(authRow).toEqual(
        thisCase.given.auth ? [`   ├─ auth: ${thisCase.given.auth}`] : [],
      );
      expect(output).toMatchSnapshot();
    }),
  );
});
