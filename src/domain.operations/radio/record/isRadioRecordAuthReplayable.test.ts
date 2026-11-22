import { isRadioRecordAuthReplayable } from './isRadioRecordAuthReplayable';

const TEST_CASES: {
  description: string;
  auth: string | null;
  expect: boolean;
}[] = [
  {
    description: 'replays the default (no stored auth)',
    auth: null,
    expect: true,
  },
  {
    description: 'replays as-ehmpath: a mode, never a command',
    auth: 'as-ehmpath',
    expect: true,
  },
  {
    description: 'replays as-ehmpath-via-keyrack',
    auth: 'as-ehmpath-via-keyrack',
    expect: true,
  },
  {
    description: 'replays as-ehmpath-via-ambient',
    auth: 'as-ehmpath-via-ambient',
    expect: true,
  },
  {
    description: 'replays as-human',
    auth: 'as-human',
    expect: true,
  },
  {
    description: 'replays a plain keyrack owner',
    auth: 'as-robot:via-keyrack(ehmpath)',
    expect: true,
  },
  {
    description: 'never replays a stored shell command',
    auth: 'as-robot:shx(echo ghp_x)',
    expect: false,
  },
  {
    description: 'never replays a keyrack owner spliced with shell text',
    auth: 'as-robot:via-keyrack(x; touch pwned)',
    expect: false,
  },
  {
    description: 'never replays an env var whose name holds no TOKEN segment',
    auth: 'as-robot:env(AWS_SECRET_ACCESS_KEY)',
    expect: false,
  },
];

describe('isRadioRecordAuthReplayable', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isRadioRecordAuthReplayable({ auth: thisCase.auth })).toEqual(
        thisCase.expect,
      );
    }),
  );
});
