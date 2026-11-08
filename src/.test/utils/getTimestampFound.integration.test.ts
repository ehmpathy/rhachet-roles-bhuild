import * as fs from 'fs';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import {
  DURATION_PATTERN_OF_HOOK,
  getTimestampFound,
  TIMESTAMP_PATTERN_OF_HOOK,
} from './getTimestampFound';

/**
 * .what = the value the hook assigns to one shell var, with each `${VAR}` it composes expanded
 * .why = read the gate's own source, so a change to the gate turns this suite red; the gate
 *        builds its pattern from parts, so a literal read alone would see no pattern at all
 */
const getHookVar = (input: { source: string; name: string }): string | null => {
  const line = input.source
    .split('\n')
    .find((each) => new RegExp(`^${input.name}=['"]`).test(each));
  if (!line) return null;
  const said = line.slice(input.name.length + 2, -1);
  return said.replace(
    /\$\{([A-Z_]+)\}/g,
    (_, name: string) => getHookVar({ source: input.source, name }) ?? '',
  );
};

describe('getTimestampFound', () => {
  given('[case1] the commit gate this repo runs', () => {
    when('[t0] its patterns are read', () => {
      const result = useThen('it reads', async () => {
        const source = fs.readFileSync(
          path.join(__dirname, '..', '..', '..', '.husky', 'check.timestamps.sh'),
          'utf-8',
        );
        return {
          timestamp: getHookVar({ source, name: 'TIMESTAMP_PATTERN' }),
          duration: getHookVar({ source, name: 'DURATION_PATTERN' }),
        };
      });

      then('the test copy of each pattern equals the gate', () => {
        expect(result.timestamp).toEqual(TIMESTAMP_PATTERN_OF_HOOK);
        expect(result.duration).toEqual(DURATION_PATTERN_OF_HOOK);
      });
    });
  });

  given('[case2] content the gate grades', () => {
    then('a time of day is found, on its own line', () => {
      expect(
        getTimestampFound({
          content: 'title: book a lesson\nheldAt: 2026-01-01T09:30:00Z',
        }),
      ).toEqual('heldAt: 2026-01-01T09:30:00Z');
    });

    then('a clock with no seconds is found, as the gate now forbids it', () => {
      expect(getTimestampFound({ content: 'sent at 14:30' })).toEqual(
        'sent at 14:30',
      );
    });

    then('a line:col ref and a port map pass, as the gate lets them', () => {
      expect(
        getTimestampFound({ content: 'see file.ts:12:34 and 5432:5432' }),
      ).toEqual(null);
    });

    then('a bare datestamp passes', () => {
      expect(getTimestampFound({ content: 'pushed_at: 2026-01-01' })).toEqual(
        null,
      );
    });

    then('a duration passes, as the gate lets it', () => {
      expect(getTimestampFound({ content: 'window: PT12:30:00' })).toEqual(
        null,
      );
    });
  });
});
