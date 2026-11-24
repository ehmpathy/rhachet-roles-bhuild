import { asIsoDateStamp } from 'iso-time';

import { RadioTask } from '@src/domain.objects/RadioTask';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

import { asTaskListOutput } from './asTaskListOutput';

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
  given: { tasks: RadioTask[]; auth: string | null };
  expect: { header: string };
}[] = [
  {
    description: 'a list from a value with one source shows the plain header',
    given: { tasks: [task], auth: null },
    expect: { header: '🎙️ tasks on gh.issues:' },
  },
  {
    description: 'an as-ehmpath list names the spot that paid in its header',
    given: { tasks: [task], auth: 'as-ehmpath (via keyrack)' },
    expect: {
      header: '🎙️ tasks on gh.issues · auth: as-ehmpath (via keyrack)',
    },
  },
  {
    description: 'an empty as-ehmpath list still names the spot',
    given: { tasks: [], auth: 'as-ehmpath (via ambient)' },
    expect: {
      header: '🎙️ tasks on gh.issues · auth: as-ehmpath (via ambient)',
    },
  },
  {
    description:
      'a human list names the email, with one level of parens, never two',
    given: {
      tasks: [task],
      auth: 'as-human (via ambient email bert@example.com)',
    },
    expect: {
      header:
        '🎙️ tasks on gh.issues · auth: as-human (via ambient email bert@example.com)',
    },
  },
];

describe('asTaskListOutput', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const output = asTaskListOutput({ ...thisCase.given, via: 'gh.issues' });
      expect(output.split('\n')[0]).toEqual(thisCase.expect.header);
      expect(output).toMatchSnapshot();
    }),
  );
});
