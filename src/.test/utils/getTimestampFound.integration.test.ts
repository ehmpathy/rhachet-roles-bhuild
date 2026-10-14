import * as fs from 'fs';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import {
  DURATION_PATTERN_OF_HOOK,
  getTimestampFound,
  TIMESTAMP_PATTERN_OF_HOOK,
} from './getTimestampFound';

/**
 * .what = the value the hook assigns to one shell var
 * .why = read the gate's own source, so a change to the gate turns this suite red
 */
const getHookVar = (input: { source: string; name: string }): string | null =>
  input.source
    .split('\n')
    .find((line) => line.startsWith(`${input.name}='`))
    ?.slice(input.name.length + 2, -1) ?? null;

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
