import { promises as fs } from 'fs';
import { getError, MalfunctionError } from 'helpful-errors';
import path from 'path';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { getAllPhoneMailboxEntries } from '@src/.test/utils/getAllPhoneMailboxEntries';
import { PhoneTextRecord } from '@src/domain.objects/phone/PhoneTextRecord';

import { daoPhoneMailbox } from './index';

const SERIAL = '20fa7ac9-4dfc-4cbc-be9f-7685b5672a14';

/**
 * .what = a text record with a given uuid, for the mailbox to hold; QUEUED unless told
 */
const genRecord = (input: {
  uuid: string;
  way?: 'out' | 'in';
  status?: 'QUEUED' | 'DELIVERED';
}) =>
  new PhoneTextRecord({
    uuid: input.uuid,
    way: input.way ?? 'out',
    group: null,
    re: null,
    from: 'phone://grove=bert-laptop/tree=notebook/clone=director',
    to: 'phone://grove=bert-laptop/tree=svc-lessons.beav.feat-book-a-lesson/clone=mechanic',
    what: 'where is book-a-lesson?\nblocked on aught?',
    status: input.status ?? 'QUEUED',
    reason: null,
  });

describe('daoPhoneMailbox', () => {
  given('[case1] an empty tree', () => {
    when('[t0] two texts are written, then read back', () => {
      const result = useThen('both are read in write order', async () => {
        const treeDir = genTempDir({ slug: 'dao-phone-mailbox-case1' });
        await daoPhoneMailbox.gen({
          treeDir,
          clone: SERIAL,
          record: genRecord({ uuid: '7f3e9a02-41c6-4b0e-9d2a-0c5e8f1a3b77' }),
        });
        await daoPhoneMailbox.gen({
          treeDir,
          clone: SERIAL,
          record: genRecord({ uuid: 'a1b2c3d4-6e0f-4b9a-8c27-5d31f90e7a46' }),
        });
        const entries = await getAllPhoneMailboxEntries({
          treeDir,
          clone: SERIAL,
        });
        const ignore = await fs.readFile(
          path.join(
            treeDir,
            '.agent/.cache/repo=bhuild/role=dispatcher/.gitignore',
          ),
          'utf8',
        );
        return { entries, ignore };
      });

      then('the order is the write order', () => {
        expect(result.entries.map((entry) => entry.record.uuid)).toEqual([
          '7f3e9a02-41c6-4b0e-9d2a-0c5e8f1a3b77',
          'a1b2c3d4-6e0f-4b9a-8c27-5d31f90e7a46',
        ]);
      });

      then('each file sits in the clone mailbox, by ordinal and way', () => {
        expect(
          result.entries.map((entry) => path.basename(entry.path)),
        ).toEqual(['text.0001.out.json', 'text.0002.out.json']);
        expect(result.entries[0]!.path).toContain(
          `skill=phone.text/clone=${SERIAL}/`,
        );
      });

      then('a multiline text survives byte for byte', () => {
        expect(result.entries[0]!.record.what).toEqual(
          'where is book-a-lesson?\nblocked on aught?',
        );
      });

      then('the cache root ignores itself', () => {
        expect(result.ignore).toEqual('*\n');
      });
    });
  });

  given('[case2] a text already in the mailbox', () => {
    when('[t0] the same text is written again', () => {
      const result = useThen('no second copy is written', async () => {
        const treeDir = genTempDir({ slug: 'dao-phone-mailbox-case2' });
        const record = genRecord({
          uuid: '7f3e9a02-41c6-4b0e-9d2a-0c5e8f1a3b77',
          way: 'in',
          status: 'DELIVERED',
        });
        await daoPhoneMailbox.gen({ treeDir, clone: SERIAL, record });
        await daoPhoneMailbox.gen({ treeDir, clone: SERIAL, record });
        return {
          entries: await getAllPhoneMailboxEntries({ treeDir, clone: SERIAL }),
        };
      });

      then('the mailbox holds one copy', () => {
        expect(result.entries).toHaveLength(1);
      });
    });
  });

  given('[case3] two writers race into one mailbox', () => {
    when('[t0] eight texts are written at once', () => {
      const result = useThen('every text claims its own ordinal', async () => {
        const treeDir = genTempDir({ slug: 'dao-phone-mailbox-case3' });
        const uuids = Array.from(
          { length: 8 },
          (_, index) => `0000000${index}-0000-4000-8000-000000000000`,
        );
        await Promise.all(
          uuids.map((uuid) =>
            daoPhoneMailbox.gen({
              treeDir,
              clone: SERIAL,
              record: genRecord({ uuid }),
            }),
          ),
        );
        return {
          entries: await getAllPhoneMailboxEntries({ treeDir, clone: SERIAL }),
        };
      });

      then('no record overwrote another', () => {
        expect(
          new Set(result.entries.map((entry) => entry.record.uuid)).size,
        ).toEqual(8);
        expect(new Set(result.entries.map((entry) => entry.path)).size).toEqual(
          8,
        );
      });
    });

    when('[t1] a reader reads while the writes land', () => {
      const result = useThen('every read parses', async () => {
        const treeDir = genTempDir({ slug: 'dao-phone-mailbox-case3-read' });
        const uuids = Array.from(
          { length: 32 },
          (_, index) =>
            `${String(index).padStart(8, '0')}-0000-4000-8000-000000000000`,
        );

        // read in a loop until the writes end; each read must parse every record it lists
        const progress = { isWritten: false }; // .note = deliberate mutation: the loop stop flag
        const readsSeen: number[] = [];
        const reader = (async () => {
          while (!progress.isWritten) {
            const entries = await getAllPhoneMailboxEntries({
              treeDir,
              clone: SERIAL,
            });
            readsSeen.push(entries.length);
          }
        })();
        await Promise.all(
          uuids.map((uuid) =>
            daoPhoneMailbox.gen({
              treeDir,
              clone: SERIAL,
              record: genRecord({ uuid }),
            }),
          ),
        );
        progress.isWritten = true;
        await reader;
        const names = await fs.readdir(
          path.dirname(
            (await getAllPhoneMailboxEntries({ treeDir, clone: SERIAL }))[0]!
              .path,
          ),
        );
        return { readsSeen, names };
      });

      then('no read met a half-written record', () => {
        expect(result.readsSeen.length).toBeGreaterThan(0);
      });

      then('no temp file is left behind', () => {
        expect(result.names.filter((name) => name.includes('.tmp.'))).toEqual(
          [],
        );
        expect(result.names).toHaveLength(32);
      });
    });
  });

  given('[case4] a QUEUED text', () => {
    when('[t0] its status is set', () => {
      const result = useThen('the same file holds the new status', async () => {
        const treeDir = genTempDir({ slug: 'dao-phone-mailbox-case4' });
        const entry = await daoPhoneMailbox.gen({
          treeDir,
          clone: SERIAL,
          record: genRecord({ uuid: '7f3e9a02-41c6-4b0e-9d2a-0c5e8f1a3b77' }),
        });
        await daoPhoneMailbox.set({ entry, status: 'DELIVERED', reason: null });
        const entries = await getAllPhoneMailboxEntries({
          treeDir,
          clone: SERIAL,
        });
        const bytes = await fs.readFile(entry.path, 'utf8');
        return { entries, bytes };
      });

      then('the record reads DELIVERED, at the same path', () => {
        expect(result.entries).toHaveLength(1);
        expect(result.entries[0]!.record.status).toEqual('DELIVERED');
      });

      then('the bytes hold no clock and no ordinal', () => {
        expect(result.bytes).toMatchSnapshot();
      });
    });
  });

  given('[case5] an in copy, which is only ever DELIVERED', () => {
    when('[t0] an in copy is written QUEUED', () => {
      const result = useThen('the write is refused', async () => {
        const treeDir = genTempDir({ slug: 'dao-phone-mailbox-case5-t0' });
        const error = await getError(
          daoPhoneMailbox.gen({
            treeDir,
            clone: SERIAL,
            record: genRecord({
              uuid: '7f3e9a02-41c6-4b0e-9d2a-0c5e8f1a3b77',
              way: 'in',
            }),
          }),
        );
        const { entries, unreadable } = await daoPhoneMailbox.getAllReadable({
          treeDir,
          clone: SERIAL,
        });
        return { error, entries, unreadable };
      });

      then('it fails loud, and names the shape it refused', () => {
        expect(result.error).toBeInstanceOf(MalfunctionError);
        expect(result.error.message).toContain('not writable as is');
      });

      then('no record is left in the mailbox', () => {
        expect(result.entries).toEqual([]);
        expect(result.unreadable).toEqual([]);
      });
    });

    when('[t1] a file on disk holds an in copy that is QUEUED', () => {
      const result = useThen('the reader skips it, and names it', async () => {
        const treeDir = genTempDir({ slug: 'dao-phone-mailbox-case5-t1' });
        const entry = await daoPhoneMailbox.gen({
          treeDir,
          clone: SERIAL,
          record: genRecord({
            uuid: '7f3e9a02-41c6-4b0e-9d2a-0c5e8f1a3b77',
            way: 'in',
            status: 'DELIVERED',
          }),
        });
        const bytes = await fs.readFile(entry.path, 'utf8');
        await fs.writeFile(
          entry.path,
          bytes.replace('"DELIVERED"', '"QUEUED"'),
        );
        return daoPhoneMailbox.getAllReadable({ treeDir, clone: SERIAL });
      });

      then('the record is not read as a text', () => {
        expect(result.entries).toEqual([]);
      });

      then('the file is named as unreadable', () => {
        expect(result.unreadable).toHaveLength(1);
        expect(result.unreadable[0]!.path).toContain('.in.json');
      });
    });
  });

  given(
    '[case6] a claim a newer writer holds, with an act this reader does not know',
    () => {
      when('[t0] the daemon tries to claim the text', () => {
        const result = useThen('the live holder keeps it', async () => {
          const treeDir = genTempDir({ slug: 'dao-phone-mailbox-case6' });
          const entry = await daoPhoneMailbox.gen({
            treeDir,
            clone: 'mechanic',
            record: genRecord({ uuid: 'e5a2c7d0-4f1b-4a3e-9c8d-2b7f6e1a0c93' }),
          });
          // a live pid (this process's parent) holds it for an act a later release added
          await fs.writeFile(`${entry.path}.claim`, `${process.ppid} relay\n`);
          const claim = await daoPhoneMailbox.genClaim({
            path: entry.path,
            act: 'prep',
          });
          const actOfHolder = await daoPhoneMailbox.getClaimActOfHolder({
            path: entry.path,
          });
          return { claim, actOfHolder };
        });

        then('the claim is not taken from a live holder', () => {
          expect(result.claim).toEqual({ isClaimed: false, actStale: null });
        });

        then(
          'the unknown act reads as say, the act whose loss costs more',
          () => {
            expect(result.actOfHolder).toEqual('say');
          },
        );
      });
    },
  );
});
