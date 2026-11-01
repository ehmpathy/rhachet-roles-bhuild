import * as fs from 'fs';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import { genGhBodyTempFile } from './genGhBodyTempFile';

describe('genGhBodyTempFile', () => {
  given('[case1] two bodies written in the same instant', () => {
    when('[t0] each is written, then cleaned up', () => {
      const result = useThen('both are written', async () => {
        const [first, second] = await Promise.all([
          genGhBodyTempFile({ body: 'remind the surfer\npack a wetsuit' }),
          genGhBodyTempFile({ body: 'count the rash guards' }),
        ]);
        const bodies = {
          first: fs.readFileSync(first.file, 'utf8'),
          second: fs.readFileSync(second.file, 'utf8'),
        };
        await first.cleanup();
        await second.cleanup();
        return { first, second, bodies };
      });

      then('each body sits in its own private dir', () => {
        expect(path.dirname(result.first.file)).not.toEqual(
          path.dirname(result.second.file),
        );
      });

      then('each file holds its own body, newlines intact', () => {
        expect(result.bodies.first).toEqual(
          'remind the surfer\npack a wetsuit',
        );
        expect(result.bodies.second).toEqual('count the rash guards');
      });

      then('cleanup removes each dir', () => {
        expect(fs.existsSync(path.dirname(result.first.file))).toEqual(false);
        expect(fs.existsSync(path.dirname(result.second.file))).toEqual(false);
      });
    });
  });
});
