import * as fs from 'fs';
import { MalfunctionError } from 'helpful-errors';
import { asIsoTimeStamp } from 'iso-time';
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
  heldAt: asIsoTimeStamp('2026-09-29T09:14:00Z'),
  heldSeq: 1,
  settledAt: null,
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
            '└─ fix:   repair the json of the record file, or remove it',
          );
          expect(result.message).not.toContain('{"');
        },
      );
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
});
