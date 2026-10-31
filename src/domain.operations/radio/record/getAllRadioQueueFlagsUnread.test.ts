import { getAllRadioQueueFlagsUnread } from './getAllRadioQueueFlagsUnread';

const TEST_CASES = [
  {
    description: 'drain with a --uuid it would ignore',
    given: { verb: 'drain' as const, flags: ['uuid', 'auth'] },
    expect: { unread: ['uuid'], accepted: ['auth'] },
  },
  {
    description: 'drain with a --mode it would ignore',
    given: { verb: 'drain' as const, flags: ['mode'] },
    expect: { unread: ['mode'], accepted: ['auth'] },
  },
  {
    description: 'set with every flag it reads',
    given: { verb: 'set' as const, flags: ['uuid', 'auth', 'description'] },
    expect: { unread: [], accepted: ['uuid', 'auth', 'description', 'title'] },
  },
  {
    description: 'set with the old --key name, which it no longer reads',
    given: { verb: 'set' as const, flags: ['key', 'auth'] },
    expect: {
      unread: ['key'],
      accepted: ['uuid', 'auth', 'description', 'title'],
    },
  },
  {
    description: 'del with a --description it would ignore',
    given: { verb: 'del' as const, flags: ['uuid', 'why', 'description'] },
    expect: { unread: ['description'], accepted: ['uuid', 'why'] },
  },
  {
    description: 'get with the rhachet dispatch args and help',
    given: {
      verb: 'get' as const,
      flags: ['repo', 'role', 'skill', 's', 'help', 'h', 'when'],
    },
    expect: { unread: [], accepted: ['when'] },
  },
];

describe('getAllRadioQueueFlagsUnread', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getAllRadioQueueFlagsUnread(thisCase.given)).toEqual(
        thisCase.expect,
      );
    }),
  );
});
