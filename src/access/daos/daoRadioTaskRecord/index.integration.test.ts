import * as fs from 'fs';
import { ConstraintError, MalfunctionError } from 'helpful-errors';
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

/**
 * .what = a fresh record dir, with one raw file written into it under the given name
 * .why = each scene below is a dir that holds a file a human or a merge could leave there
 */
const genDirWithFile = (input: {
  slug: string;
  name: string;
  content: string;
}): { dir: string; pathFile: string } => {
  const dir = path.join(genTempDir({ slug: input.slug }), '.radio');
  fs.mkdirSync(dir, { recursive: true });
  const pathFile = path.join(dir, input.name);
  fs.writeFileSync(pathFile, input.content);
  return { dir, pathFile };
};

/**
 * .what = the class and message of a read of every record in a dir
 */
const getErrorOfReadAll = async (input: {
  dir: string;
}): Promise<{ isMalfunction: boolean; message: string }> => {
  const error = await getError(() =>
    daoRadioTaskRecord.get.all({ dirs: [input.dir] }),
  );
  return {
    isMalfunction: error instanceof MalfunctionError,
    message: error.message,
  };
};

describe('daoRadioTaskRecord', () => {
  given('[case1] a writable record dir', () => {
    const scene = useBeforeAll(async () => ({
      dir: path.join(genTempDir({ slug: 'dao-record-case1' }), '.radio'),
    }));

    when('[t0] a record is upserted, then read back', () => {
      const found = useThen('it round-trips', async () => {
        daoRadioTaskRecord.set.upsert({ dir: scene.dir, record });
        return daoRadioTaskRecord.get.one.byUnique({
          dir: scene.dir,
          key: 'k1',
        });
      });

      then('the record reads back whole', () => {
        expect(found).toEqual(record);
      });
    });
  });

  given('[case2] a record dir path that is a file, not a dir (X3)', () => {
    const scene = useBeforeAll(async () => {
      const dir = path.join(genTempDir({ slug: 'dao-record-case2' }), '.radio');
      fs.writeFileSync(dir, 'not a dir');
      return { dir };
    });

    when('[t0] a record is upserted', () => {
      const result = useThen('it fails', async () => {
        const error = await getError(() =>
          daoRadioTaskRecord.set.upsert({ dir: scene.dir, record }),
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
        // the io cause rides on its own line
        expect(result.message).toContain('├─ why:');
        expect(result.message).not.toContain('{"');
      });

      then(
        'the malfunction names the fix: a writable directory, then a rerun',
        () => {
          expect(result.message).toContain(
            `└─ fix:   make ${scene.dir} a writable directory, then run the command again: this record was not written`,
          );
        },
      );
    });
  });

  given('[case3] a record file on disk that is not valid json', () => {
    const scene = useBeforeAll(async () =>
      genDirWithFile({
        slug: 'dao-record-case3',
        name: 'record.bad.json',
        content: '{ not json',
      }),
    );

    when('[t0] the dir is read', () => {
      const result = useThen('it fails', async () =>
        getErrorOfReadAll({ dir: scene.dir }),
      );

      then('the read fails loud, and names the file it hit', () => {
        expect(result.isMalfunction).toEqual(true);
        expect(result.message).toContain('radio task record could not be read');
        expect(result.message).toContain(scene.pathFile);
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
  });

  given(
    '[case3.1] a record file that is not valid json, beside one good record',
    () => {
      const scene = useBeforeAll(async () => {
        const made = genDirWithFile({
          slug: 'dao-record-case3-1',
          name: 'record.bad.json',
          content: '{ not json',
        });
        daoRadioTaskRecord.set.upsert({ dir: made.dir, record });
        return made;
      });

      when('[t0] the dir is read leniently', () => {
        const found = useThen('it skips the bad file', async () => ({
          records: daoRadioTaskRecord.get
            .allReadable({ dirs: [scene.dir] })
            .map((one) => one.record),
        }));

        then('it returns the good record and drops the unreadable one', () => {
          // the mint reads this way, so a bad record elsewhere never stops a push before it is saved
          expect(found.records).toEqual([record]);
        });
      });
    },
  );

  given(
    '[case4] a record whose target path is a dir, so the rename fails',
    () => {
      const scene = useBeforeAll(async () => {
        const dir = path.join(
          genTempDir({ slug: 'dao-record-case4r' }),
          '.radio',
        );
        fs.mkdirSync(path.join(dir, 'record.k1.json', 'inner'), {
          recursive: true,
        });
        return { dir };
      });

      when('[t0] a record is upserted', () => {
        const result = useThen('it fails', async () => {
          const error = await getError(() =>
            daoRadioTaskRecord.set.upsert({ dir: scene.dir, record }),
          );
          return {
            isMalfunction: error instanceof MalfunctionError,
            names: fs.readdirSync(scene.dir),
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

  given('[case5] a writable record dir, for a repeat write', () => {
    const scene = useBeforeAll(async () => ({
      dir: path.join(genTempDir({ slug: 'dao-record-case5' }), '.radio'),
    }));

    when('[t0] the same record is upserted twice', () => {
      const result = useThen('both succeed', async () => {
        daoRadioTaskRecord.set.upsert({ dir: scene.dir, record });
        daoRadioTaskRecord.set.upsert({ dir: scene.dir, record });
        return { names: fs.readdirSync(scene.dir) };
      });

      then('the dir holds the record file alone, no temp', () => {
        expect(result.names).toEqual(['record.k1.json']);
      });
    });
  });

  given('[case6] a legacy record file that holds clock fields', () => {
    const scene = useBeforeAll(async () =>
      genDirWithFile({
        slug: 'dao-record-case6',
        name: 'record.k1.json',
        content: JSON.stringify({
          ...record,
          heldAt: 'a legacy clock value',
          settledAt: null,
        }),
      }),
    );

    when('[t0] the record is read', () => {
      const found = useThen('it reads', async () =>
        daoRadioTaskRecord.get.one.byUnique({ dir: scene.dir, key: 'k1' }),
      );

      then('the read sheds the legacy keys', () => {
        expect(found).toEqual(record);
        expect(Object.keys(found ?? {})).not.toContain('heldAt');
        expect(Object.keys(found ?? {})).not.toContain('settledAt');
      });
    });
  });

  given('[case7] a record file with no numeric heldSeq', () => {
    const scene = useBeforeAll(async () =>
      genDirWithFile({
        slug: 'dao-record-case7',
        name: 'record.k1.json',
        content: JSON.stringify({ ...record, heldSeq: 'first' }),
      }),
    );

    when('[t0] the dir is read', () => {
      const result = useThen('it fails', async () =>
        getErrorOfReadAll({ dir: scene.dir }),
      );

      then('the read fails loud, names the file, and names the gap', () => {
        expect(result.isMalfunction).toEqual(true);
        expect(result.message).toContain(scene.pathFile);
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
        expect(result.message.split(scene.dir).join('<dir>')).toMatchSnapshot();
      });
    });
  });

  // one given per value, so each read sees exactly one bad file and fails under its own title
  [
    { heldSeq: 0, found: '(found: 0)' },
    { heldSeq: -5, found: '(found: -5)' },
    { heldSeq: 1.5, found: '(found: 1.5)' },
  ].map((thisCase, index) =>
    given(
      `[case8.${index + 1}] a record file whose heldSeq is ${thisCase.heldSeq}, a number with no place in line`,
      () => {
        const scene = useBeforeAll(async () =>
          genDirWithFile({
            slug: `dao-record-case8-${index + 1}`,
            name: 'record.k1.json',
            content: JSON.stringify({ ...record, heldSeq: thisCase.heldSeq }),
          }),
        );

        when('[t0] the dir is read', () => {
          const result = useThen('it fails', async () =>
            getErrorOfReadAll({ dir: scene.dir }),
          );

          then('the read fails loud, and names the value it found', () => {
            expect(result.isMalfunction).toEqual(true);
            expect(result.message).toContain(thisCase.found);
          });
        });
      },
    ),
  );

  given(
    '[case9] a dir with one clock-stamped record beside a clean one',
    () => {
      const scene = useBeforeAll(async () => {
        const made = genDirWithFile({
          slug: 'dao-record-case9',
          name: 'record.k1.json',
          content: JSON.stringify({
            ...record,
            heldAt: 'a legacy clock value',
          }),
        });
        daoRadioTaskRecord.set.upsert({
          dir: made.dir,
          record: new RadioTaskRecord({ ...record, key: 'k2' }),
        });
        return made;
      });

      when('[t0] the clock-stamped records are listed', () => {
        const found = useThen('it lists', async () => ({
          entries: daoRadioTaskRecord.get.allClockHeld({ dirs: [scene.dir] }),
        }));

        then('only the stamped one is listed, its clock fields shed', () => {
          expect(found.entries).toEqual([{ record, dir: scene.dir }]);
        });
      });
    },
  );

  given(
    '[case9.1] a record file with a settledAt key alone, null, beside a clean one',
    () => {
      const scene = useBeforeAll(async () => {
        const made = genDirWithFile({
          slug: 'dao-record-case9-1',
          name: 'record.k1.json',
          content: JSON.stringify({ ...record, settledAt: null }),
        });
        // a clean record beside it, so the list proves it excludes one
        daoRadioTaskRecord.set.upsert({
          dir: made.dir,
          record: new RadioTaskRecord({ ...record, key: 'k2' }),
        });
        return made;
      });

      when('[t0] the clock-stamped records are listed', () => {
        const found = useThen('it lists', async () => ({
          entries: daoRadioTaskRecord.get.allClockHeld({ dirs: [scene.dir] }),
        }));

        then(
          'the file is listed: the key alone counts, even null; the clean one is not',
          () => {
            expect(found.entries.map((entry) => entry.record.key)).toEqual([
              'k1',
            ]);
          },
        );
      });
    },
  );

  given('[case9.2] a clock-stamped record file', () => {
    const scene = useBeforeAll(async () =>
      genDirWithFile({
        slug: 'dao-record-case9-2',
        name: 'record.k1.json',
        content: JSON.stringify({ ...record, heldAt: 'a legacy clock value' }),
      }),
    );

    when('[t0] the record is written back', () => {
      const found = useThen('it is rewritten', async () => {
        daoRadioTaskRecord.set.upsert({ dir: scene.dir, record });
        return {
          entries: daoRadioTaskRecord.get.allClockHeld({ dirs: [scene.dir] }),
        };
      });

      then('naught is listed as clock-stamped after', () => {
        expect(found.entries).toEqual([]);
      });
    });
  });

  given(
    '[case10] a record file whose fields do not fit the record shape',
    () => {
      const scene = useBeforeAll(async () =>
        genDirWithFile({
          slug: 'dao-record-case10',
          name: 'record.k1.json',
          content: JSON.stringify({
            ...record,
            repo: 'sandpine',
            via: 'pigeon',
          }),
        }),
      );

      when('[t0] the dir is read', () => {
        const result = useThen('it fails', async () =>
          getErrorOfReadAll({ dir: scene.dir }),
        );

        then('the read fails loud at the boundary, and names the file', () => {
          expect(result.isMalfunction).toEqual(true);
          expect(result.message).toContain(
            'radio task record could not be read',
          );
          expect(result.message).toContain(scene.pathFile);
        });

        then('the why: line names each field out of shape', () => {
          expect(result.message).toContain('the record does not fit its shape');
          expect(result.message).toContain('repo:');
          expect(result.message).toContain('via:');
        });
      });
    },
  );

  given('[case10.1] a record file out of shape, beside one good record', () => {
    const scene = useBeforeAll(async () => {
      const made = genDirWithFile({
        slug: 'dao-record-case10-1',
        name: 'record.k1.json',
        content: JSON.stringify({ ...record, repo: 'sandpine', via: 'pigeon' }),
      });
      daoRadioTaskRecord.set.upsert({
        dir: made.dir,
        record: new RadioTaskRecord({ ...record, key: 'k2' }),
      });
      return made;
    });

    when('[t0] the dir is read leniently', () => {
      const found = useThen('it skips the bad file', async () => ({
        keys: daoRadioTaskRecord.get
          .allReadable({ dirs: [scene.dir] })
          .map((one) => one.record.key),
      }));

      then('a shape fault is skipped, like a parse fault', () => {
        expect(found.keys).toEqual(['k2']);
      });
    });
  });

  given('[case11] a record file name the fs cannot read as a file', () => {
    // .note = a dir in the place of a record file throws EISDIR on read, an fs fault
    const scene = useBeforeAll(async () => {
      const dir = path.join(
        genTempDir({ slug: 'dao-record-case11' }),
        '.radio',
      );
      const pathBad = path.join(dir, 'record.k9.json');
      fs.mkdirSync(pathBad, { recursive: true });
      daoRadioTaskRecord.set.upsert({ dir, record });
      return { dir, pathBad };
    });

    when('[t0] the dir is read leniently, for the mint', () => {
      const result = useThen('it fails', async () => {
        const error = await getError(() =>
          daoRadioTaskRecord.get.allReadable({ dirs: [scene.dir] }),
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
          expect(result.message).toContain(scene.pathBad);
        },
      );

      then('the fix names the fs repair, not a json repair', () => {
        expect(result.message).toContain(
          '└─ fix:   make the record file readable: a file, with read permission. do not remove it: that drops its task unsent',
        );
      });
    });
  });

  given('[case12] a record key that would climb out of the record dir', () => {
    const keyBad = 'x/../../../escaped';
    const scene = useBeforeAll(async () => {
      const root = genTempDir({ slug: 'dao-record-case12' });
      return { root, dir: path.join(root, 'a', 'b', '.radio') };
    });

    when('[t0] a record is read by that key', () => {
      const result = useThen('it is refused', async () => {
        const error = await getError(() =>
          daoRadioTaskRecord.get.one.byUnique({ dir: scene.dir, key: keyBad }),
        );
        return { isConstraint: error instanceof ConstraintError };
      });

      then('it is refused as a constraint', () => {
        expect(result.isConstraint).toEqual(true);
      });
    });

    when('[t1] a record is written with that key', () => {
      const result = useThen('it is refused', async () => {
        const error = await getError(() =>
          daoRadioTaskRecord.set.upsert({
            dir: scene.dir,
            record: new RadioTaskRecord({ ...record, key: keyBad }),
          }),
        );
        return {
          isConstraint: error instanceof ConstraintError,
          escaped:
            fs.existsSync(path.join(scene.root, 'escaped.json')) ||
            fs.existsSync(path.join(scene.root, 'a', 'escaped.json')),
        };
      });

      then(
        'it is refused as a constraint, and no file lands outside the dir',
        () => {
          expect(result.isConstraint).toEqual(true);
          expect(result.escaped).toEqual(false);
        },
      );
    });
  });

  given(
    '[case12.1] a record file on disk that holds a key which climbs',
    () => {
      const scene = useBeforeAll(async () =>
        genDirWithFile({
          slug: 'dao-record-case12-1',
          name: 'record.planted.json',
          content: JSON.stringify({ ...record, key: 'x/../../../escaped' }),
        }),
      );

      when('[t0] the dir is read', () => {
        const result = useThen('it fails', async () =>
          getErrorOfReadAll({ dir: scene.dir }),
        );

        then(
          'the read fails loud: the key does not fit the record shape',
          () => {
            expect(result.isMalfunction).toEqual(true);
          },
        );
      });
    },
  );

  given('[case13] a record file copied under the name of another key', () => {
    const scene = useBeforeAll(async () => {
      const dir = path.join(
        genTempDir({ slug: 'dao-record-case13' }),
        '.radio',
      );
      const pathCopy = path.join(dir, 'record.k2.json');
      daoRadioTaskRecord.set.upsert({ dir, record });
      fs.copyFileSync(path.join(dir, 'record.k1.json'), pathCopy);
      return { dir, pathCopy };
    });

    when('[t0] the dir is read', () => {
      const result = useThen('it fails', async () =>
        getErrorOfReadAll({ dir: scene.dir }),
      );

      then('the read fails loud, and names the copy and both keys', () => {
        expect(result.isMalfunction).toEqual(true);
        expect(result.message).toContain(scene.pathCopy);
        expect(result.message).toContain(
          'the record holds key "k1" but its file is named for "k2"',
        );
      });
    });
  });
});
