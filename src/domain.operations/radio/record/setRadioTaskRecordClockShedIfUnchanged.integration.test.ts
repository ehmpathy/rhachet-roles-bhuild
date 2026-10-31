import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';

import { setRadioTaskRecordClockShedIfUnchanged } from './setRadioTaskRecordClockShedIfUnchanged';

/**
 * .what = a held record as this version writes it
 */
const genRecord = (input: Partial<RadioTaskRecord>): RadioTaskRecord =>
  new RadioTaskRecord({
    key: 'wetsuit',
    kind: 'create',
    repo: new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' }),
    via: RadioChannel.OS_FILEOPS,
    auth: null,
    idem: null,
    title: 'wetsuit inventory',
    description: 'count the wetsuits',
    exid: null,
    status: null,
    recordStatus: RadioTaskRecordStatus.QUEUED,
    reason: null,
    heldSeq: 1,
    deliveredExid: null,
    ...input,
  });

/**
 * .what = a record dir with one file a prior version stamped with a clock field
 */
const genSceneStamped = (input: {
  slug: string;
}): { dir: string; file: string } => {
  const cwd = genTempDir({ slug: input.slug, git: true });
  const dir = path.join(cwd, '.behavior', '.radio');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'record.wetsuit.json');
  fs.writeFileSync(
    file,
    JSON.stringify({ ...genRecord({}), heldAt: '2026-01-01T00:00:00Z' }), // note: a pinned stamp; the gate exempts .ts files
  );
  return { dir, file };
};

describe('setRadioTaskRecordClockShedIfUnchanged', () => {
  given('[case1] a stamped record, unchanged since the shed read it', () => {
    const scene = useBeforeAll(async () => {
      const { dir, file } = genSceneStamped({ slug: 'radio-shed-unchanged' });
      const [found] = daoRadioTaskRecord.get.allClockHeld({ dirs: [dir] });
      return { file, found: found! };
    });

    when('[t0] the shed writes it back', () => {
      const result = useThen('it writes', async () => ({
        shed: setRadioTaskRecordClockShedIfUnchanged({ found: scene.found }),
        json: JSON.parse(fs.readFileSync(scene.file, 'utf-8')),
      }));

      then('it writes the record', () => {
        expect(result.shed.record?.key).toEqual('wetsuit');
      });

      then('the file holds no clock field', () => {
        expect(Object.keys(result.json)).not.toContain('heldAt');
      });
    });
  });

  given(
    '[case2] a stamped record a push rewrote after the shed read it',
    () => {
      const scene = useBeforeAll(async () => {
        const { dir, file } = genSceneStamped({ slug: 'radio-shed-repushed' });
        const [found] = daoRadioTaskRecord.get.allClockHeld({ dirs: [dir] });

        // a push lands between the shed's read and its write
        daoRadioTaskRecord.set.upsert({
          record: genRecord({
            description: 'count the wetsuits and the boards',
          }),
          dir,
        });
        return { file, found: found! };
      });

      when('[t0] the shed reaches it with its stale read', () => {
        const result = useThen('it runs', async () => ({
          shed: setRadioTaskRecordClockShedIfUnchanged({ found: scene.found }),
          json: JSON.parse(fs.readFileSync(scene.file, 'utf-8')),
        }));

        then('it writes naught', () => {
          expect(result.shed.record).toBeNull();
        });

        then("the push's body stands", () => {
          expect(result.json.description).toEqual(
            'count the wetsuits and the boards',
          );
        });

        then('the file holds no clock field, since the push wrote none', () => {
          expect(Object.keys(result.json)).not.toContain('heldAt');
        });
      });
    },
  );
});
