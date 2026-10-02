import { ConstraintError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { asRadioErrorDetail } from './asRadioErrorDetail';
import { asRadioErrorHeadline } from './asRadioErrorHeadline';
import { asRadioErrorHint } from './asRadioErrorHint';
import { asRadioErrorHintLines } from './asRadioErrorHintLines';

const MESSAGE_WITH_METADATA = [
  '✋ ConstraintError: github auth via keyrack failed',
  '  • unblock now — re-run as human: --auth as-human',
  '  • or set the robot token',
  '',
  '{',
  '  "owner": "ehmpath"',
  '}',
].join('\n');

const ERROR_WITH_HINT = new ConstraintError('RADIO_TOKEN is not set', {
  hint: 'set RADIO_TOKEN in the environment',
});

const TEST_CASES = [
  {
    description: 'detail drops the metadata json helpful-errors appends',
    when: () =>
      asRadioErrorDetail({ message: MESSAGE_WITH_METADATA, hint: null }),
    expect: [
      '✋ ConstraintError: github auth via keyrack failed',
      '  • unblock now — re-run as human: --auth as-human',
      '  • or set the robot token',
    ].join('\n'),
  },
  {
    description: 'detail keeps a message with no metadata as is',
    when: () =>
      asRadioErrorDetail({ message: 'github rate limit exceeded', hint: null }),
    expect: 'github rate limit exceeded',
  },
  {
    description: 'hint: a helpful error yields the hint from its metadata',
    when: () => asRadioErrorHint({ error: ERROR_WITH_HINT }),
    expect: 'set RADIO_TOKEN in the environment',
  },
  {
    description: 'hint: a plain error yields null',
    when: () => asRadioErrorHint({ error: new Error('x') }),
    expect: null,
  },
  {
    description:
      'detail keeps the metadata hint as a hint line, when the body lacks it',
    when: () =>
      asRadioErrorHintLines({
        message: asRadioErrorDetail({
          message: ERROR_WITH_HINT.message,
          hint: asRadioErrorHint({ error: ERROR_WITH_HINT }),
        }),
      }),
    expect: ['hint: set RADIO_TOKEN in the environment'],
  },
  {
    description: 'detail does not repeat a hint the body already says',
    when: () =>
      asRadioErrorDetail({
        message: 'x failed\n  • or set the robot token',
        hint: 'or set the robot token',
      }),
    expect: 'x failed\n  • or set the robot token',
  },
  {
    description: 'headline is the first line',
    when: () => asRadioErrorHeadline({ message: MESSAGE_WITH_METADATA }),
    expect: '✋ ConstraintError: github auth via keyrack failed',
  },
  {
    description:
      'hint lines are the lines under the headline, bullets stripped',
    when: () =>
      asRadioErrorHintLines({
        message: asRadioErrorDetail({
          message: MESSAGE_WITH_METADATA,
          hint: null,
        }),
      }),
    expect: [
      'unblock now — re-run as human: --auth as-human',
      'or set the robot token',
    ],
  },
  {
    description: 'hint lines are empty for a one-line message',
    when: () =>
      asRadioErrorHintLines({ message: 'github rate limit exceeded' }),
    expect: [],
  },
];

describe('asRadioErrorDetail, asRadioErrorHint, asRadioErrorHeadline, asRadioErrorHintLines', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the error text is read', () => {
        then('it yields the expected part', () => {
          expect(thisCase.when()).toEqual(thisCase.expect);
        });
      });
    }),
  );
});
