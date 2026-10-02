import { MalfunctionError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { asCliMalfunctionOutput } from './asCliMalfunctionOutput';

const TEST_CASES = [
  {
    description: 'a malfunction names its class once, never twice',
    when: () =>
      asCliMalfunctionOutput({
        error: new MalfunctionError('radio task record could not be read'),
      }).split('\n'),
    expect: (lines: string[]) => {
      expect(lines[0]).toEqual(
        '💥 MalfunctionError: radio task record could not be read',
      );
      expect(lines.join('\n')).not.toContain(
        'MalfunctionError: 💥 MalfunctionError',
      );
    },
  },
  {
    description:
      'the stack frames follow the message, for the on-call engineer',
    when: () =>
      asCliMalfunctionOutput({
        error: new MalfunctionError('radio task record could not be read'),
      }).split('\n'),
    expect: (lines: string[]) => {
      expect(lines.slice(1).length).toBeGreaterThan(0);
      expect(lines.slice(1).every((line) => /^\s+at /.test(line))).toBe(true);
    },
  },
];

describe('asCliMalfunctionOutput', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the malfunction is rendered', () => {
        then('it reads as expected', () => {
          thisCase.expect(thisCase.when());
        });
      });
    }),
  );
});
