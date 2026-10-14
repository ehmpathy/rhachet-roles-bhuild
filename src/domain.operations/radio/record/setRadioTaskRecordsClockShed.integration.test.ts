import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';

import { setRadioTaskRecordsClockShed } from './setRadioTaskRecordsClockShed';

/**
 * .what = a record as this version writes it
 * .why = each file in the scene starts from one shape, then a prior version's clock rides on top
 */
const genRecord = (input: Partial<RadioTaskRecord> & { key: string }) =>
  new RadioTaskRecord({
    kind: 'create',
    repo: new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' }),
    via: RadioChannel.OS_FILEOPS,
    auth: null,
    idem: null,
    title: `book a lesson ${input.key}`,
    description: 'a sandpine surf lesson',
    exid: null,
    status: null,
    recordStatus: RadioTaskRecordStatus.QUEUED,
    reason: null,
    heldSeq: 1,
    deliveredExid: null,
    ...input,
  });

describe('setRadioTaskRecordsClockShed', () => {
  given(
    '[case1] settled records a prior version stamped, in two dirs, beside a clean one',
    () => {
      const scene = useBeforeAll(async () => {
        const cwd = genTempDir({ slug: 'radio-clock-shed', git: true });
        const dirUnbound = path.join(cwd, '.behavior', '.radio');
        const dirRoute = path.join(
          cwd,
          '.behavior',
          'v2026_01_01.lessons',
          '.radio',
        );
        fs.mkdirSync(dirUnbound, { recursive: true });
        fs.mkdirSync(dirRoute, { recursive: true });

        // a prior version wrote these two: settled, each with its clock fields
        const delivered = genRecord({
          key: 'delivered',
          recordStatus: RadioTaskRecordStatus.DELIVERED,
          deliveredExid: '412',
        });
        const refused = genRecord({
          key: 'refused',
          heldSeq: 2,
          recordStatus: RadioTaskRecordStatus.REFUSED,
          reason: 'upstream:refused — no such task',
        });
        const clean = genRecord({ key: 'clean', heldSeq: 3 });
        const pathDelivered = path.join(dirUnbound, 'record.delivered.json');
        const pathRefused = path.join(dirRoute, 'record.refused.json');
        const pathClean = path.join(dirRoute, 'record.clean.json');
        fs.writeFileSync(
          pathDelivered,
          JSON.stringify({
            ...delivered,
            heldAt: '2026-01-01T00:00:00Z', // note: a pinned stamp never drifts, and the gate exempts .ts files
            settledAt: '2026-01-01T00:05:00Z',
          }),
        );
        fs.writeFileSync(
          pathRefused,
          JSON.stringify({ ...refused, heldAt: '2026-01-01T00:01:00Z' }),
        );
        fs.writeFileSync(pathClean, JSON.stringify(clean, null, 2) + '\n');
        return {
          cwd,
          delivered,
          refused,
          pathDelivered,
          pathRefused,
          pathClean,
          bytesClean: fs.readFileSync(pathClean, 'utf-8'),
        };
      });

      when('[t0] the records are shed of their clock', () => {
        const result = useThen('it writes', async () => {
          const shed = setRadioTaskRecordsClockShed({}, { cwd: scene.cwd });
          return {
            keys: shed.records.map((one) => one.key).sort(),
            delivered: JSON.parse(
              fs.readFileSync(scene.pathDelivered, 'utf-8'),
            ),
            refused: JSON.parse(fs.readFileSync(scene.pathRefused, 'utf-8')),
            bytesClean: fs.readFileSync(scene.pathClean, 'utf-8'),
          };
        });

        then('it rewrites the two stamped records, in both dirs', () => {
          expect(result.keys).toEqual(['delivered', 'refused']);
        });

        then('neither file holds a clock field', () => {
          [result.delivered, result.refused].forEach((json) => {
            expect(Object.keys(json)).not.toContain('heldAt');
            expect(Object.keys(json)).not.toContain('settledAt');
          });
        });

        then('each keeps its fate, its exid, and its place in line', () => {
          expect(result.delivered).toEqual(
            JSON.parse(JSON.stringify(scene.delivered)),
          );
          expect(result.refused).toEqual(
            JSON.parse(JSON.stringify(scene.refused)),
          );
        });

        then('the clean record is left byte for byte', () => {
          expect(result.bytesClean).toEqual(scene.bytesClean);
        });
      });

      when('[t1] the shed runs again', () => {
        const result = useThen('it runs', async () => {
          const bytesBefore = fs.readFileSync(scene.pathDelivered, 'utf-8');
          const shed = setRadioTaskRecordsClockShed({}, { cwd: scene.cwd });
          return {
            count: shed.records.length,
            bytesBefore,
            bytesAfter: fs.readFileSync(scene.pathDelivered, 'utf-8'),
          };
        });

        then('it finds naught and writes naught', () => {
          expect(result.count).toEqual(0);
          expect(result.bytesAfter).toEqual(result.bytesBefore);
        });
      });
    },
  );

  given('[case2] a repo with no .behavior dir', () => {
    when('[t0] the shed runs', () => {
      const result = useThen('it runs', async () =>
        setRadioTaskRecordsClockShed(
          {},
          { cwd: genTempDir({ slug: 'radio-clock-shed-none', git: true }) },
        ),
      );

      then('it writes naught', () => {
        expect(result.records).toEqual([]);
      });
    });
  });
});
