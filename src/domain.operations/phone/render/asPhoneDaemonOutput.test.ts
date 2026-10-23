import { given, then, when } from 'test-fns';

import type { PhoneDaemonLock } from '@src/access/daos/daoPhoneDaemon';

import { asPhoneDaemonDelOutput } from './asPhoneDaemonDelOutput';
import { asPhoneDaemonGetOutput } from './asPhoneDaemonGetOutput';
import { asPhoneDaemonSetOutput } from './asPhoneDaemonSetOutput';

const LOG_PATH =
  '/sandpine/svc-lessons/.agent/.cache/repo=bhuild/role=dispatcher/skill=phone.daemon/daemon.log';
const LOCK_LIVE: PhoneDaemonLock = {
  path: '/sandpine/svc-lessons/.agent/.cache/repo=bhuild/role=dispatcher/skill=phone.daemon/daemon.lock',
  pid: 4242,
  state: 'LIVE',
};

const TEST_CASES = [
  {
    description: '[case1] get, with a live daemon',
    render: () =>
      asPhoneDaemonGetOutput({ lock: LOCK_LIVE, logPath: LOG_PATH }),
    expect: { contains: 'pid: 4242' },
  },
  {
    description: '[case2] get, with no daemon',
    render: () => asPhoneDaemonGetOutput({ lock: null, logPath: LOG_PATH }),
    expect: { contains: 'start it: rhx phone.daemon set' },
  },
  {
    description: '[case3] set, a live daemon found',
    render: () =>
      asPhoneDaemonSetOutput({
        lock: LOCK_LIVE,
        outcome: 'FOUND',
        logPath: LOG_PATH,
      }),
    expect: { contains: 'the daemon already swims' },
  },
  {
    description: '[case4] set, a daemon started',
    render: () =>
      asPhoneDaemonSetOutput({
        lock: LOCK_LIVE,
        outcome: 'STARTED',
        logPath: LOG_PATH,
      }),
    expect: { contains: 'the daemon dives in' },
  },
  {
    description: '[case5] set, a daemon spawned that never showed a live lock',
    render: () =>
      asPhoneDaemonSetOutput({
        lock: null,
        outcome: 'UNCONFIRMED',
        logPath: LOG_PATH,
      }),
    expect: { contains: '💥 MalfunctionError: the daemon did not surface' },
  },
  {
    description: '[case6] del, with no daemon',
    render: () => asPhoneDaemonDelOutput({ outcome: 'ABSENT' }),
    expect: { contains: 'the daemon already rests' },
  },
  {
    description: '[case7] del, the daemon stopped',
    render: () => asPhoneDaemonDelOutput({ outcome: 'STOPPED' }),
    expect: { contains: 'the daemon climbs out' },
  },
  {
    description: '[case8] del, the daemon still mid-say',
    render: () => asPhoneDaemonDelOutput({ outcome: 'STOPPING' }),
    expect: { contains: 'state: STOPPING' },
  },
];

describe('asPhoneDaemon*Output', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the output is rendered', () => {
        const output = thisCase.render();

        then('it names what was observed', () => {
          expect(output).toContain(thisCase.expect.contains);
        });

        then('it matches the snapshot', () => {
          expect(output).toMatchSnapshot();
        });
      });
    }),
  );
});
