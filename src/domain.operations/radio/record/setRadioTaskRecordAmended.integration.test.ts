import { ConstraintError } from 'helpful-errors';
import * as path from 'path';
import {
  genTempDir,
  getError,
  given,
  then,
  useBeforeAll,
  useThen,
  when,
} from 'test-fns';

import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';

import { setRadioTaskRecordAmended } from './setRadioTaskRecordAmended';
import { setRadioTaskRecordFromPush } from './setRadioTaskRecordFromPush';

/**
 * .what = a temp worktree that holds one create for the sandpine lesson service
 */
const genScene = () => {
  const cwd = genTempDir({ slug: 'radio-amend-blank', git: true });
  const dir = path.join(cwd, '.behavior', '.radio');
  const { record } = setRadioTaskRecordFromPush(
    {
      push: {
        repo: new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' }),
        via: RadioChannel.GH_ISSUES,
        auth: null,
        idem: null,
        title: 'lesson reminders',
        description: 'remind each surfer the night before',
        exid: null,
        status: null,
      },
    },
    { dir, cwd },
  );
  return { cwd, dir, record };
};

describe('setRadioTaskRecordAmended', () => {
  given('[case1] a held create with a body', () => {
    const scene = useBeforeAll(async () => genScene());

    when('[t0] its body is amended to an empty string', () => {
      const result = useThen('it is refused', async () => {
        const error = await getError(() =>
          setRadioTaskRecordAmended(
            { key: scene.record.key, auth: null, description: '' },
            { cwd: scene.cwd },
          ),
        );
        return {
          isConstraint: error instanceof ConstraintError,
          message: error.message,
        };
      });

      then('it is refused as a constraint that names the fix', () => {
        expect(result.isConstraint).toEqual(true);
        expect(result.message).toContain('--description is empty');
        expect(result.message).toContain('omit --description');
      });

      then('the body on disk is kept', () => {
        const kept = daoRadioTaskRecord.get.one.byUnique({
          dir: scene.dir,
          key: scene.record.key,
        });
        expect(kept?.description).toEqual(
          'remind each surfer the night before',
        );
      });
    });

    when(
      '[t1] its body is amended to whitespace alone (an empty @stdin)',
      () => {
        const result = useThen('it is refused', async () => {
          const error = await getError(() =>
            setRadioTaskRecordAmended(
              { key: scene.record.key, auth: null, description: '\n' },
              { cwd: scene.cwd },
            ),
          );
          return { isConstraint: error instanceof ConstraintError };
        });

        then('it is refused as a constraint', () => {
          expect(result.isConstraint).toEqual(true);
        });
      },
    );

    when('[t2] its body is amended to a new body', () => {
      const result = useThen('it is amended', async () =>
        setRadioTaskRecordAmended(
          {
            key: scene.record.key,
            auth: null,
            description: 'remind each surfer to pack a wetsuit',
          },
          { cwd: scene.cwd },
        ),
      );

      then('the new body is kept', () => {
        expect(result.after.description).toEqual(
          'remind each surfer to pack a wetsuit',
        );
      });
    });
  });
});
