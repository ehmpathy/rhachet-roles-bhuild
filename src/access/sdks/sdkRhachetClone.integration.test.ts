import { join } from 'path';
import { genTempDir, getError, given, then, useThen, when } from 'test-fns';

import { sdkRhachetClone } from './sdkRhachetClone';

/**
 * .what = drives the real rhachet cli this package depends on, in a tree with no clone
 * .why = the phone parses rhachet's `clone list` json and reads a failed `clone say` from its
 *        stderr json; a drift in either shape would silently break delivery, so the contract is
 *        checked against rhachet itself, never a fake
 *
 * .note = a clone may not enroll another (rhachet's enroll depth budget), so a live delivery is
 *         out of reach here; the empty roster and the absent clone are the shapes this suite owns
 */
describe('sdkRhachetClone', () => {
  given('[case1] a git tree with no enrolled clone', () => {
    when('[t0] its clones are listed', () => {
      const result = useThen('the roster parses', async () => {
        const treeDir = genTempDir({
          slug: 'sdk-rhachet-clone-case1',
          git: true,
        });
        return { clones: await sdkRhachetClone.getAllClones({ treeDir }) };
      });

      then('the roster is empty, and the json shape was understood', () => {
        expect(result.clones).toEqual([]);
      });
    });

    when('[t1] a text is said to a clone that does not exist', () => {
      const result = useThen(
        'the say fails with a readable record',
        async () => {
          const treeDir = genTempDir({
            slug: 'sdk-rhachet-clone-case1-t1',
            git: true,
          });
          const raw = await sdkRhachetClone.say({
            treeDir,
            clone: 'nobody',
            what: 'hello from the phone',
          });
          return { raw };
        },
      );

      then('the say exits nonzero', () => {
        expect(result.raw.exitCode).not.toEqual(0);
      });

      then(
        'stderr holds a json record with the message the phone keys on',
        () => {
          const record = JSON.parse(
            result.raw.stderr.slice(result.raw.stderr.indexOf('{')),
          );
          expect(record.message).toContain('no clone answers to');
        },
      );
    });
  });

  given('[case2] a tree dir that does not exist', () => {
    when('[t0] its clones are listed', () => {
      const result = useThen('it fails loud', async () => {
        const treeDir = join(
          genTempDir({ slug: 'sdk-rhachet-clone-case2' }),
          'absent',
        );
        const error = await getError(sdkRhachetClone.getAllClones({ treeDir }));
        return { message: error.message };
      });

      then('the fault names that rhachet could not run', () => {
        expect(result.message).toContain('could not run rhachet');
      });
    });
  });
});
