import * as fs from 'fs';
import { MalfunctionError } from 'helpful-errors';
import * as path from 'path';
import { genTempDir, getError, given, then, useThen, when } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';

import { daoRadioTaskRecord } from './index';

const record = new RadioTaskRecord({
  key: 'k1',
  kind: 'create',
  repo: new RadioTaskRepo({ owner: 'ehmpathy', name: 'rhachet' }),
  via: RadioChannel.OS_FILEOPS,
  auth: null,
  idem: null,
  title: 'fix flaky keyrack test',
  description: 'the test flakes',
  exid: null,
  status: null,
  recordStatus: RadioTaskRecordStatus.QUEUED,
  reason: null,
  heldSeq: 1,
  deliveredExid: null,
});

describe('daoRadioTaskRecord', () => {
  given('[case1] a writable record dir', () => {
    const dir = path.join(genTempDir({ slug: 'dao-record-case1' }), '.radio');

    when('[t0] a record is upserted, then read back', () => {
      const found = useThen('it round-trips', async () => {
        daoRadioTaskRecord.set.upsert({ dir, record });
        return daoRadioTaskRecord.get.one.byUnique({ dir, key: 'k1' });
      });

      then('the record reads back whole', () => {
        expect(found).toEqual(record);
      });
    });
  });

  given('[case2] a record dir path that is a file, not a dir (X3)', () => {
    const dir = path.join(genTempDir({ slug: 'dao-record-case2' }), '.radio');

    when('[t0] a record is upserted', () => {
      const result = useThen('it fails', async () => {
        fs.writeFileSync(dir, 'not a dir');
        const error = await getError(() =>
          daoRadioTaskRecord.set.upsert({ dir, record }),
        );
        return {
          isMalfunction: error instanceof MalfunctionError,
          message: error.message,
        };
      });

      then('the failed transcribe is a loud malfunction', () => {
        expect(result.isMalfunction).toEqual(true);
        expect(result.message).toContain(
          'radio task record could not be written',
        );
        expect(result.message).toContain('├─ where:');
        expect(result.message).not.toContain('{"');
      });
    });
  });

  given('[case3] a record file on disk that is not valid json', () => {
    const dir = path.join(genTempDir({ slug: 'dao-record-case3' }), '.radio');
    const pathBad = path.join(dir, 'record.bad.json');

    when('[t0] the dir is read', () => {
      const result = useThen('it fails', async () => {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(pathBad, '{ not json');
        const error = await getError(() =>
          daoRadioTaskRecord.get.all({ dirs: [dir] }),
        );
        return {
          isMalfunction: error instanceof MalfunctionError,
          message: error.message,
        };
      });

      then('the read fails loud, and names the file it hit', () => {
        expect(result.isMalfunction).toEqual(true);
        expect(result.message).toContain('radio task record could not be read');
        expect(result.message).toContain(pathBad);
      });

      then(
        'the fix rides in the message, with no raw json metadata block',
        () => {
          expect(result.message).toContain(
            '└─ fix:   repair the record file: valid json, in the shape named above. do not remove it: that drops its task unsent',
          );
          expect(result.message).not.toContain('{"');
        },
      );
    });

    when('[t1] the dir is read leniently, beside one good record', () => {
      const found = useThen('it skips the bad file', async () => {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(pathBad, '{ not json');
        daoRadioTaskRecord.set.upsert({ dir, record });
        const all = daoRadioTaskRecord.get.allReadable({ dirs: [dir] });
        return { records: all.map((one) => one.record) };
      });

      then('it returns the good record and drops the unreadable one', () => {
        // the mint reads this way, so a bad record elsewhere never stops a push before it is saved
        expect(found.records).toEqual([record]);
      });
    });
  });

  given(
    '[case4] a record whose target path is a dir, so the rename fails',
    () => {
      const dir = path.join(
        genTempDir({ slug: 'dao-record-case4r' }),
        '.radio',
      );

      when('[t0] a record is upserted', () => {
        const result = useThen('it fails', async () => {
          fs.mkdirSync(path.join(dir, 'record.k1.json', 'inner'), {
            recursive: true,
          });
          const error = await getError(() =>
            daoRadioTaskRecord.set.upsert({ dir, record }),
          );
          return {
            isMalfunction: error instanceof MalfunctionError,
            names: fs.readdirSync(dir),
          };
        });

        then('the failed write is a loud malfunction', () => {
          expect(result.isMalfunction).toEqual(true);
        });

        then('no temp file lingers beside it', () => {
          expect(result.names).toEqual(['record.k1.json']);
        });
      });
    },
  );

  given('[case5] a record is written twice', () => {
    const dir = path.join(genTempDir({ slug: 'dao-record-case4' }), '.radio');

    when('[t0] the writes complete', () => {
      const result = useThen('both succeed', async () => {
        daoRadioTaskRecord.set.upsert({ dir, record });
        daoRadioTaskRecord.set.upsert({ dir, record });
        return { names: fs.readdirSync(dir) };
      });

      then('the dir holds the record file alone, no temp', () => {
        expect(result.names).toEqual(['record.k1.json']);
      });
    });
  });

  given('[case6] a legacy record file that holds clock fields', () => {
    const dir = path.join(genTempDir({ slug: 'dao-record-case6' }), '.radio');

    when('[t0] the record is read', () => {
      const found = useThen('it reads', async () => {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(
          path.join(dir, 'record.k1.json'),
          JSON.stringify({
            ...record,
            heldAt: 'a legacy clock value',
            settledAt: null,
          }),
        );
        return daoRadioTaskRecord.get.one.byUnique({ dir, key: 'k1' });
      });

      then('the read sheds the legacy keys', () => {
        expect(found).toEqual(record);
        expect(Object.keys(found ?? {})).not.toContain('heldAt');
        expect(Object.keys(found ?? {})).not.toContain('settledAt');
      });
    });
  });

  given('[case7] a record file with no numeric heldSeq', () => {
    const dir = path.join(genTempDir({ slug: 'dao-record-case7' }), '.radio');
    const pathBad = path.join(dir, 'record.k1.json');

    when('[t0] the dir is read', () => {
      const result = useThen('it fails', async () => {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(
          pathBad,
          JSON.stringify({ ...record, heldSeq: 'first' }),
        );
        const error = await getError(() =>
          daoRadioTaskRecord.get.all({ dirs: [dir] }),
        );
        return {
          isMalfunction: error instanceof MalfunctionError,
          message: error.message,
        };
      });

      then('the read fails loud, names the file, and names the gap', () => {
        expect(result.isMalfunction).toEqual(true);
        expect(result.message).toContain(pathBad);
        expect(result.message).toContain('heldSeq');
      });

      then('the error names the value it found, with no raw json block', () => {
        expect(result.message).toContain('(found: "first")');
        expect(result.message).not.toContain('{"');
      });

      then('the why: line names the cause, with no second class header', () => {
        expect(result.message).toContain(
          '─ why:   the record lacks a positive integer heldSeq',
        );
        expect(result.message.split('MalfunctionError:').length - 1).toEqual(1); // note: the outer header only; the inner fault's header is stripped
      });

      then('the message a human reads is pinned', () => {
        // mask the temp dir: its name holds the clock genTempDir stamps
        expect(result.message.split(dir).join('<dir>')).toMatchSnapshot();
      });
    });
  });

  given(
    '[case8] a record file whose heldSeq is a number but no place in line',
    () => {
      const root = genTempDir({ slug: 'dao-record-case8' });

      when('[t0] the dir is read, for each invalid seq', () => {
        const result = useThen('each read fails', async () => {
          // one dir per value, so each read sees exactly one bad file
          const errors = await Promise.all(
            [0, -5, 1.5].map(async (heldSeq, index) => {
              const dir = path.join(root, `.radio-${index}`);
              fs.mkdirSync(dir, { recursive: true });
              fs.writeFileSync(
                path.join(dir, 'record.k1.json'),
                JSON.stringify({ ...record, heldSeq }),
              );
              return getError(() =>
                daoRadioTaskRecord.get.all({ dirs: [dir] }),
              );
            }),
          );
          return {
            kinds: errors.map((error) => error instanceof MalfunctionError),
            messages: errors.map((error) => error.message),
          };
        });

        then('zero, a negative, and a fraction each fail loud', () => {
          expect(result.kinds).toEqual([true, true, true]);
        });

        then('each names the value it found', () => {
          expect(result.messages[0]).toContain('(found: 0)');
          expect(result.messages[1]).toContain('(found: -5)');
          expect(result.messages[2]).toContain('(found: 1.5)');
        });
      });
    },
  );

  given(
    '[case9] a dir with one clock-stamped record beside a clean one',
    () => {
      const dir = path.join(genTempDir({ slug: 'dao-record-case9' }), '.radio');
      const recordClean = new RadioTaskRecord({ ...record, key: 'k2' });

      when('[t0] the clock-stamped records are listed', () => {
        const found = useThen('it lists', async () => {
          fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(
            path.join(dir, 'record.k1.json'),
            JSON.stringify({ ...record, heldAt: 'a legacy clock value' }),
          );
          daoRadioTaskRecord.set.upsert({ dir, record: recordClean });
          return {
            entries: daoRadioTaskRecord.get.allClockHeld({ dirs: [dir] }),
          };
        });

        then('only the stamped one is listed, its clock fields shed', () => {
          expect(found.entries).toEqual([{ record, dir }]);
        });
      });

      when('[t1] a settledAt key alone, even null, still counts', () => {
        const found = useThen('it lists', async () => {
          fs.writeFileSync(
            path.join(dir, 'record.k1.json'),
            JSON.stringify({ ...record, settledAt: null }),
          );
          return {
            entries: daoRadioTaskRecord.get.allClockHeld({ dirs: [dir] }),
          };
        });

        then('the file is listed', () => {
          expect(found.entries.map((entry) => entry.record.key)).toEqual([
            'k1',
          ]);
        });
      });

      when('[t2] the stamped record is written back', () => {
        const found = useThen('it lists again', async () => {
          daoRadioTaskRecord.set.upsert({ dir, record });
          return {
            entries: daoRadioTaskRecord.get.allClockHeld({ dirs: [dir] }),
          };
        });

        then('naught is listed', () => {
          expect(found.entries).toEqual([]);
        });
      });
    },
  );

  given(
    '[case10] a record file whose fields do not fit the record shape',
    () => {
      const dir = path.join(
        genTempDir({ slug: 'dao-record-case10' }),
        '.radio',
      );
      const pathBad = path.join(dir, 'record.k1.json');

      when('[t0] the dir is read', () => {
        const result = useThen('it fails', async () => {
          fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(
            pathBad,
            JSON.stringify({ ...record, repo: 'sandpine', via: 'pigeon' }),
          );
          const error = await getError(() =>
            daoRadioTaskRecord.get.all({ dirs: [dir] }),
          );
          return {
            isMalfunction: error instanceof MalfunctionError,
            message: error.message,
          };
        });

        then('the read fails loud at the boundary, and names the file', () => {
          expect(result.isMalfunction).toEqual(true);
          expect(result.message).toContain(
            'radio task record could not be read',
          );
          expect(result.message).toContain(pathBad);
        });

        then('the why: line names each field out of shape', () => {
          expect(result.message).toContain('the record does not fit its shape');
          expect(result.message).toContain('repo:');
          expect(result.message).toContain('via:');
        });
      });

      when('[t1] the dir is read leniently, beside one good record', () => {
        const found = useThen('it skips the bad file', async () => {
          daoRadioTaskRecord.set.upsert({
            dir,
            record: new RadioTaskRecord({ ...record, key: 'k2' }),
          });
          const all = daoRadioTaskRecord.get.allReadable({ dirs: [dir] });
          return { keys: all.map((one) => one.record.key) };
        });

        then('a shape fault is skipped, like a parse fault', () => {
          expect(found.keys).toEqual(['k2']);
        });
      });
    },
  );

  given('[case11] a record file name the fs cannot read as a file', () => {
    // .note = a dir in the place of a record file throws EISDIR on read, an fs fault
    const dir = path.join(genTempDir({ slug: 'dao-record-case11' }), '.radio');
    const pathBad = path.join(dir, 'record.k9.json');

    when('[t0] the dir is read leniently, for the mint', () => {
      const result = useThen('it fails', async () => {
        fs.mkdirSync(pathBad, { recursive: true });
        daoRadioTaskRecord.set.upsert({ dir, record });
        const error = await getError(() =>
          daoRadioTaskRecord.get.allReadable({ dirs: [dir] }),
        );
        return {
          isMalfunction: error instanceof MalfunctionError,
          message: error.message,
        };
      });

      then(
        'an fs fault is not skipped: it fails loud and names the path',
        () => {
          expect(result.isMalfunction).toEqual(true);
          expect(result.message).toContain(pathBad);
        },
      );

      then('the fix names the fs repair, not a json repair', () => {
        expect(result.message).toContain(
          '└─ fix:   make the record file readable: a file, with read permission. do not remove it: that drops its task unsent',
        );
      });
    });
  });
});
