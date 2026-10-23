import { promises as fs } from 'fs';
import { MalfunctionError } from 'helpful-errors';
import { join } from 'path';
import { genTempDir, getError, given, then, useThen, when } from 'test-fns';

import { getAllPhoneMailboxEntries } from '@src/.test/utils/getAllPhoneMailboxEntries';
import { daoPhoneContacts } from '@src/access/daos/daoPhoneContacts';
import { daoPhoneMailbox } from '@src/access/daos/daoPhoneMailbox';
import { getOnePhoneCacheDir } from '@src/access/daos/getOnePhoneCacheDir';
import type { RhachetCloneSayRaw } from '@src/access/sdks/sdkRhachetClone';
import { PhoneAddress } from '@src/domain.objects/phone/PhoneAddress';
import { PhoneSelf } from '@src/domain.objects/phone/PhoneSelf';
import { PhoneTextRecord } from '@src/domain.objects/phone/PhoneTextRecord';
import type { PhoneTreeClone } from '@src/domain.objects/phone/PhoneTreeClone';

import { setPhoneDeliveriesOfTree } from '../daemon/setPhoneDeliveriesOfTree';
import type { PhoneContext } from '../PhoneContext';
import { getOnePhoneReach } from '../peer/getOnePhoneReach';
import { delPhoneText } from './delPhoneText';
import { getOnePhoneTextByRef } from './getOnePhoneTextByRef';
import { setPhoneText } from './setPhoneText';

const GROVE = 'bert-laptop';
const TREE_DIRECTOR = 'notebook';
const TREE_CREW = 'svc-lessons.beav.feat-book-a-lesson';
const SERIAL_DIRECTOR = '0d1e2c3f-0000-4000-8000-00000000d1e2';
const SERIAL_MECHANIC = '20fa7ac9-4dfc-4cbc-be9f-7685b5672a14';
const SERIAL_FOREMAN = '4c1e8b27-9a0f-4d2e-8b31-6f7a0c5d2e19';
const DIRECTOR = `phone://grove=${GROVE}/tree=${TREE_DIRECTOR}/clone=director`;
const MECHANIC = `phone://grove=${GROVE}/tree=${TREE_CREW}/clone=mechanic`;

/**
 * .what = a fake rhachet clone boundary: a roster per tree, and a say that records each call
 * .why = the logic under test is admission, records, and the status map; a fake (not a mock)
 *        stands in for rhachet, which the acceptance suite drives for real
 *
 * .fake = the `rhx clone list` / `rhx clone say` boundary (sdkRhachetClone) alone; trees, mailboxes,
 *         contacts, and the daemon tick are all real
 * .why  = a live say needs two live clones, and rhachet refuses an enroll past its depth budget
 *         from inside a clone; a live clone is also a paid brain session per run (F19)
 * .real = sdkRhachetClone.integration.test.ts drives real rhachet; the live two-clone delivery is
 *         the byhand playtest
 */
const genFakeSdkClone = (input: {
  rosters: Record<string, PhoneTreeClone[]>;
  sayAs: (call: { treeDir: string; clone: string }) => RhachetCloneSayRaw;
}) => {
  const said: { treeDir: string; clone: string; what: string }[] = [];
  return {
    said,
    sdkClone: {
      getAllClones: async (call: { treeDir: string }) =>
        input.rosters[call.treeDir] ?? [],
      say: async (call: { treeDir: string; clone: string; what: string }) => {
        said.push(call);
        return input.sayAs(call);
      },
    },
  };
};

/**
 * .what = a temp git root with two trees: the director's notebook and a crew tree
 */
const genScene = async (input: { slug: string }) => {
  const gitRoot = genTempDir({ slug: input.slug });
  const treeDirector = join(gitRoot, 'sandpine', TREE_DIRECTOR);
  const treeCrew = join(gitRoot, 'sandpine', '_worktrees', TREE_CREW);
  for (const dir of [treeDirector, treeCrew]) {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(join(dir, '.git'), 'gitdir: elsewhere\n');
  }
  const director = new PhoneSelf({
    serial: SERIAL_DIRECTOR,
    treeDir: treeDirector,
    address: new PhoneAddress({
      grove: GROVE,
      tree: TREE_DIRECTOR,
      clone: 'director',
    }),
  });
  const mechanic = new PhoneSelf({
    serial: SERIAL_MECHANIC,
    treeDir: treeCrew,
    address: new PhoneAddress({
      grove: GROVE,
      tree: TREE_CREW,
      clone: 'mechanic',
    }),
  });
  const rosters: Record<string, PhoneTreeClone[]> = {
    [treeDirector]: [
      { serial: SERIAL_DIRECTOR, slug: 'director', reachState: 'LIVE' },
    ],
    [treeCrew]: [
      { serial: SERIAL_MECHANIC, slug: 'mechanic', reachState: 'LIVE' },
      { serial: SERIAL_FOREMAN, slug: 'foreman', reachState: 'LIVE' },
    ],
  };
  return { gitRoot, treeDirector, treeCrew, director, mechanic, rosters };
};

const SERIAL_OF_SLUG: Record<string, string> = {
  director: SERIAL_DIRECTOR,
  mechanic: SERIAL_MECHANIC,
  foreman: SERIAL_FOREMAN,
};

/**
 * .what = the raw result rhachet gives for a say the peer took at once
 */
const sayReleased = (call: { clone: string }): RhachetCloneSayRaw => ({
  exitCode: 0,
  stdout: JSON.stringify({
    delivered: true,
    verdict: 'released',
    serial: SERIAL_OF_SLUG[call.clone] ?? null,
  }),
  stderr: '',
});

/**
 * .what = a phone context over the scene, with a fake clone sdk that records each say
 */
const asContext = (input: {
  gitRoot: string;
  sdkClone: PhoneContext['sdkClone'];
}): PhoneContext & { log: (line: string) => void } => ({
  gitRoot: input.gitRoot,
  forestDir: join(input.gitRoot, '.git.forest'),
  groveSelf: GROVE,
  sdkClone: input.sdkClone,
  log: () => undefined,
});

describe('setPhoneText', () => {
  given('[case1] a director with the crew mechanic as a contact', () => {
    when(
      '[t0] the director texts the mechanic, the daemon ticks, the mechanic replies',
      () => {
        const result = useThen(
          'the text and its reply land in both mailboxes',
          async () => {
            const scene = await genScene({ slug: 'phone-text-case1' });
            const fake = genFakeSdkClone({
              rosters: scene.rosters,
              sayAs: sayReleased,
            });
            const context = asContext({
              gitRoot: scene.gitRoot,
              sdkClone: fake.sdkClone,
            });
            await daoPhoneContacts.set({
              treeDir: scene.treeDirector,
              clone: 'director',
              addresses: [MECHANIC],
            });

            // the director sends; the director tree's daemon ticks
            const sent = await setPhoneText(
              {
                to: [`phone://grove=local/tree=${TREE_CREW}/clone=mechanic`],
                what: 'where is book-a-lesson?\nblocked on aught?',
                re: null,
                self: scene.director,
              },
              context,
            );
            const tallyOut = await setPhoneDeliveriesOfTree(
              {
                treeDir: scene.treeDirector,
                treeSelf: TREE_DIRECTOR,
                state: { isStopped: false },
              },
              context,
            );

            // the mechanic replies to the sender of an inbound text, with no contact of its own
            const alias = sent.entries[0]!.record.uuid.slice(0, 8);
            const reply = await setPhoneText(
              {
                to: [DIRECTOR],
                what: 'green; pr up within the hour.',
                re: alias,
                self: scene.mechanic,
              },
              context,
            );
            const tallyBack = await setPhoneDeliveriesOfTree(
              {
                treeDir: scene.treeCrew,
                treeSelf: TREE_CREW,
                state: { isStopped: false },
              },
              context,
            );

            return {
              sent: sent.entries,
              reply: reply.entries,
              tallyOut,
              tallyBack,
              said: fake.said,
              director: await getAllPhoneMailboxEntries({
                treeDir: scene.treeDirector,
                clone: 'director',
              }),
              mechanic: await getAllPhoneMailboxEntries({
                treeDir: scene.treeCrew,
                clone: 'mechanic',
              }),
            };
          },
        );

        then(
          'the text is written QUEUED, to the canonical address, local cast',
          () => {
            expect(result.sent[0]!.record.status).toEqual('QUEUED');
            expect(result.sent[0]!.record.to).toEqual(MECHANIC);
            expect(result.sent[0]!.record.from).toEqual(DIRECTOR);
          },
        );

        then(
          'the daemon said it into the mechanic, inside the crew tree',
          () => {
            expect(result.tallyOut).toEqual({ said: 1, waited: 0, settled: 0 });
            expect(result.said[0]!.clone).toEqual('mechanic');
            expect(result.said[0]!.treeDir).toContain(TREE_CREW);
          },
        );

        then(
          'the said message is signed and carries the exact reply command',
          () => {
            // the uuid is minted fresh each run; pin its alias so the snapshot holds
            const alias = result.sent[0]!.record.uuid.slice(0, 8);
            expect(
              result.said[0]!.what.split(alias).join('7f3e9a02'),
            ).toMatchSnapshot();
          },
        );

        then(
          'the director holds the text out and the reply in, both DELIVERED',
          () => {
            expect(
              result.director.map((entry) => [
                entry.record.way,
                entry.record.status,
              ]),
            ).toEqual([
              ['out', 'DELIVERED'],
              ['in', 'DELIVERED'],
            ]);
          },
        );

        then(
          'the mechanic holds the text in and the reply out, one uuid per text',
          () => {
            expect(result.mechanic.map((entry) => entry.record.uuid)).toEqual([
              result.sent[0]!.record.uuid,
              result.reply[0]!.record.uuid,
            ]);
          },
        );

        then('the reply links the text it answers by full uuid', () => {
          expect(result.reply[0]!.record.re).toEqual(
            result.sent[0]!.record.uuid,
          );
        });
      },
    );
  });

  given('[case2] a mechanic with no contacts', () => {
    when('[t0] it texts its foreman, in its own tree', () => {
      const result = useThen('the text is admitted', async () => {
        const scene = await genScene({ slug: 'phone-text-case2' });
        const fake = genFakeSdkClone({
          rosters: scene.rosters,
          sayAs: sayReleased,
        });
        const context = asContext({
          gitRoot: scene.gitRoot,
          sdkClone: fake.sdkClone,
        });
        return setPhoneText(
          {
            to: ['@:foreman'],
            what: 'judgment call on dedupe',
            re: null,
            self: scene.mechanic,
          },
          context,
        );
      });

      then('the text is QUEUED to the foreman', () => {
        expect(result.entries[0]!.record.to).toEqual(
          `phone://grove=${GROVE}/tree=${TREE_CREW}/clone=foreman`,
        );
      });
    });

    when('[t1] it texts the director, unknown to it', () => {
      const result = useThen('the send is refused', async () => {
        const scene = await genScene({ slug: 'phone-text-case2-t1' });
        const fake = genFakeSdkClone({
          rosters: scene.rosters,
          sayAs: sayReleased,
        });
        const context = asContext({
          gitRoot: scene.gitRoot,
          sdkClone: fake.sdkClone,
        });
        const error = await getError(
          setPhoneText(
            { to: [DIRECTOR], what: 'hi', re: null, self: scene.mechanic },
            context,
          ),
        );
        const mailbox = await getAllPhoneMailboxEntries({
          treeDir: scene.treeCrew,
          clone: 'mechanic',
        });
        return { message: error.message, mailbox };
      });

      then('the refusal lists who it may reach and how to grant', () => {
        expect(result.message).toMatchSnapshot();
      });

      then('no record is written', () => {
        expect(result.mailbox).toEqual([]);
      });
    });

    when('[t2] it texts a group where one peer is unknown', () => {
      const result = useThen('the whole group is refused', async () => {
        const scene = await genScene({ slug: 'phone-text-case2-t2' });
        const fake = genFakeSdkClone({
          rosters: scene.rosters,
          sayAs: sayReleased,
        });
        const context = asContext({
          gitRoot: scene.gitRoot,
          sdkClone: fake.sdkClone,
        });
        const error = await getError(
          setPhoneText(
            {
              to: ['@:foreman', DIRECTOR],
              what: 'hi',
              re: null,
              self: scene.mechanic,
            },
            context,
          ),
        );
        const mailbox = await getAllPhoneMailboxEntries({
          treeDir: scene.treeCrew,
          clone: 'mechanic',
        });
        return { message: error.message, mailbox };
      });

      then('no record is written: all or none', () => {
        expect(result.message).toContain('is not a contact');
        expect(result.mailbox).toEqual([]);
      });
    });

    when('[t3] it texts itself', () => {
      const result = useThen('the send is refused', async () => {
        const scene = await genScene({ slug: 'phone-text-case2-t3' });
        const fake = genFakeSdkClone({
          rosters: scene.rosters,
          sayAs: sayReleased,
        });
        const context = asContext({
          gitRoot: scene.gitRoot,
          sdkClone: fake.sdkClone,
        });
        const error = await getError(
          setPhoneText(
            { to: ['@:mechanic'], what: 'hi', re: null, self: scene.mechanic },
            context,
          ),
        );
        return { message: error.message };
      });

      then('the refusal names its own number', () => {
        expect(result.message).toContain('is this clone');
        expect(result.message).toMatchSnapshot();
      });
    });

    /**
     * .what = the refusal one send earns, and whether the mailbox stayed empty
     */
    const genRefusalOfSend = async (input: {
      slug: string;
      to: string[];
      what: string;
      groves: string[];
    }) => {
      const scene = await genScene({ slug: input.slug });
      const forestDir = join(scene.gitRoot, '.git.forest');
      await fs.mkdir(join(forestDir, 'groves'), { recursive: true });
      for (const grove of input.groves)
        await fs.writeFile(join(forestDir, 'groves', `${grove}.json`), '{}');
      const fake = genFakeSdkClone({
        rosters: scene.rosters,
        sayAs: sayReleased,
      });
      const error = await getError(
        setPhoneText(
          { to: input.to, what: input.what, re: null, self: scene.mechanic },
          asContext({ gitRoot: scene.gitRoot, sdkClone: fake.sdkClone }),
        ),
      );
      const mailbox = await getAllPhoneMailboxEntries({
        treeDir: scene.treeCrew,
        clone: 'mechanic',
      });
      return { message: error.message, mailbox };
    };

    when('[t4] it names no peer', () => {
      const result = useThen('the send is refused', () =>
        genRefusalOfSend({
          slug: 'phone-text-case2-t4',
          to: [],
          what: 'hi',
          groves: [],
        }),
      );

      then('the refusal says a text must name a peer, and how', () => {
        expect(result.message).toContain('a text must name a peer');
        expect(result.message).toMatchSnapshot();
        expect(result.mailbox).toEqual([]);
      });
    });

    when('[t5] it carries no words', () => {
      const result = useThen('the send is refused', () =>
        genRefusalOfSend({
          slug: 'phone-text-case2-t5',
          to: ['@:foreman'],
          what: '  \n ',
          groves: [],
        }),
      );

      then('the refusal says a text must carry words, and how', () => {
        expect(result.message).toContain('a text must carry words');
        expect(result.message).toMatchSnapshot();
        expect(result.mailbox).toEqual([]);
      });
    });

    when('[t6] it texts a peer on another known grove', () => {
      const result = useThen('the send is refused', () =>
        genRefusalOfSend({
          slug: 'phone-text-case2-t6',
          to: [
            'phone://grove=grove-sandpine-v20260901/tree=notebook/clone=director',
          ],
          what: 'hi',
          groves: ['grove-sandpine-v20260901'],
        }),
      );

      then('the refusal says the grove leg rides a later delivery', () => {
        expect(result.message).toContain('is on another grove');
        expect(result.message).toMatchSnapshot();
        expect(result.mailbox).toEqual([]);
      });
    });

    when('[t7] it texts a peer on an unknown grove', () => {
      const result = useThen('the send is refused', () =>
        genRefusalOfSend({
          slug: 'phone-text-case2-t7',
          to: ['phone://grove=nowhere/tree=notebook/clone=director'],
          what: 'hi',
          groves: [],
        }),
      );

      then(
        'the refusal names the grove, and how to list the known ones',
        () => {
          expect(result.message).toContain('no grove nowhere is known');
          expect(result.message).toMatchSnapshot();
          expect(result.mailbox).toEqual([]);
        },
      );
    });

    when('[t8] it carries more words than a text may hold', () => {
      const result = useThen('the send is refused', () =>
        genRefusalOfSend({
          slug: 'phone-text-case2-t8',
          to: ['@:foreman'],
          what: 'x'.repeat(8001),
          groves: [],
        }),
      );

      then('the refusal names the bound and the size, and how', () => {
        expect(result.message).toContain(
          'a text holds at most 8000 chars; this one holds 8001',
        );
        expect(result.message).toMatchSnapshot();
        expect(result.mailbox).toEqual([]);
      });
    });
  });

  given('[case3] a director who texts a group of two', () => {
    when('[t0] the group is sent', () => {
      const result = useThen('one record per peer, one group id', async () => {
        const scene = await genScene({ slug: 'phone-text-case3' });
        const fake = genFakeSdkClone({
          rosters: scene.rosters,
          sayAs: sayReleased,
        });
        const context = asContext({
          gitRoot: scene.gitRoot,
          sdkClone: fake.sdkClone,
        });
        const foreman = `phone://grove=${GROVE}/tree=${TREE_CREW}/clone=foreman`;
        await daoPhoneContacts.set({
          treeDir: scene.treeDirector,
          clone: 'director',
          addresses: [MECHANIC, foreman],
        });
        return setPhoneText(
          {
            to: [MECHANIC, foreman, MECHANIC],
            what: 'slot shape changed',
            re: null,
            self: scene.director,
          },
          context,
        );
      });

      then('two records share a group id, each with its own uuid', () => {
        expect(result.entries).toHaveLength(2);
        expect(result.entries[0]!.record.group).not.toBeNull();
        expect(result.entries[0]!.record.group).toEqual(
          result.entries[1]!.record.group,
        );
        expect(result.entries[0]!.record.uuid).not.toEqual(
          result.entries[1]!.record.uuid,
        );
      });

      then(
        'the peer named twice gets one text, and the drop is counted',
        () => {
          expect(result.duplicates).toEqual(1);
        },
      );
    });
  });

  given('[case4] a peer at a modal, then a peer that does not exist', () => {
    when('[t0] the daemon ticks over both', () => {
      const result = useThen(
        'one waits, one is refused and the sender told',
        async () => {
          const scene = await genScene({ slug: 'phone-text-case4' });
          const fake = genFakeSdkClone({
            rosters: scene.rosters,
            sayAs: (call) =>
              call.clone === 'foreman'
                ? {
                    exitCode: 2,
                    stdout: '',
                    stderr: JSON.stringify({
                      class: 'ConstraintError',
                      message: 'withheld',
                      reachState: null,
                      metadata: {
                        verdict: 'withheld',
                        reason: 'modal-holds-focus',
                      },
                    }),
                  }
                : call.clone === 'mechanik'
                  ? {
                      exitCode: 2,
                      stdout: '',
                      stderr: JSON.stringify({
                        class: 'ConstraintError',
                        message: "no clone answers to '@:mechanik'",
                        metadata: {},
                      }),
                    }
                  : sayReleased(call),
          });
          const context = asContext({
            gitRoot: scene.gitRoot,
            sdkClone: fake.sdkClone,
          });
          await setPhoneText(
            {
              to: ['@:foreman'],
              what: 'at a modal?',
              re: null,
              self: scene.mechanic,
            },
            context,
          );
          await setPhoneText(
            {
              to: ['@:mechanik'],
              what: 'typo peer',
              re: null,
              self: scene.mechanic,
            },
            context,
          );
          const tally = await setPhoneDeliveriesOfTree(
            {
              treeDir: scene.treeCrew,
              treeSelf: TREE_CREW,
              state: { isStopped: false },
            },
            context,
          );
          const mailbox = await getAllPhoneMailboxEntries({
            treeDir: scene.treeCrew,
            clone: 'mechanic',
          });
          return { tally, mailbox, said: fake.said };
        },
      );

      then(
        'the text to the peer at a modal stays QUEUED, with the reason',
        () => {
          expect(result.mailbox[0]!.record.status).toEqual('QUEUED');
          expect(result.mailbox[0]!.record.reason).toEqual('peer at a modal');
        },
      );

      then('the text to a peer that does not exist is REFUSED', () => {
        expect(result.mailbox[1]!.record.status).toEqual('REFUSED');
      });

      then('the sender is told of the refusal in its own session', () => {
        // the uuid is minted fresh each run; pin its alias so the snapshot holds
        const notice = result.said.find((call) => call.clone === 'mechanic');
        const alias = result.mailbox[1]!.record.uuid.slice(0, 8);
        expect(notice?.what.split(alias).join('d03e6f91')).toMatchSnapshot();
      });
    });
  });

  given('[case5] a QUEUED text and a DELIVERED text', () => {
    when('[t0] each is withdrawn', () => {
      const result = useThen(
        'the QUEUED one withdraws, the DELIVERED one refuses',
        async () => {
          const scene = await genScene({ slug: 'phone-text-case5' });
          const fake = genFakeSdkClone({
            rosters: scene.rosters,
            sayAs: sayReleased,
          });
          const context = asContext({
            gitRoot: scene.gitRoot,
            sdkClone: fake.sdkClone,
          });
          const delivered = await setPhoneText(
            {
              to: ['@:foreman'],
              what: 'first',
              re: null,
              self: scene.mechanic,
            },
            context,
          );
          await setPhoneDeliveriesOfTree(
            {
              treeDir: scene.treeCrew,
              treeSelf: TREE_CREW,
              state: { isStopped: false },
            },
            context,
          );
          const queued = await setPhoneText(
            {
              to: ['@:foreman'],
              what: 'second',
              re: null,
              self: scene.mechanic,
            },
            context,
          );
          const aliasQueued = queued.entries[0]!.record.uuid.slice(0, 8);
          const withdrawn = await delPhoneText({
            text: aliasQueued,
            self: scene.mechanic,
          });
          const again = await delPhoneText({
            text: aliasQueued,
            self: scene.mechanic,
          });
          const refusal = await getError(
            delPhoneText({
              text: delivered.entries[0]!.record.uuid.slice(0, 8),
              self: scene.mechanic,
            }),
          );
          const tally = await setPhoneDeliveriesOfTree(
            {
              treeDir: scene.treeCrew,
              treeSelf: TREE_CREW,
              state: { isStopped: false },
            },
            context,
          );
          // the uuid is minted fresh each run; pin its alias so the snapshot holds
          const aliasDelivered = delivered.entries[0]!.record.uuid.slice(0, 8);
          return {
            withdrawn,
            again,
            refusal: {
              message: refusal.message.split(aliasDelivered).join('d03e6f91'),
            },
            tally,
          };
        },
      );

      then('the QUEUED text settles WITHDRAWN', () => {
        expect(result.withdrawn.entry.record.status).toEqual('WITHDRAWN');
      });

      then('a second withdraw is a no-op', () => {
        expect(result.again.statusBefore).toEqual('WITHDRAWN');
      });

      then('a delivered text can not be unsaid', () => {
        expect(result.refusal.message).toContain('was already DELIVERED');
        expect(result.refusal.message).toMatchSnapshot();
      });

      then('the daemon never says a WITHDRAWN text', () => {
        expect(result.tally).toEqual({ said: 0, waited: 0, settled: 0 });
      });
    });
  });

  given(
    '[case6] references that name no one text, and texts not the sender to take back',
    () => {
      when('[t0] each is looked up, or withdrawn', () => {
        const result = useThen('each is refused', async () => {
          const scene = await genScene({ slug: 'phone-text-case6' });
          const MECHANIC_SELF = `phone://grove=${GROVE}/tree=${TREE_CREW}/clone=mechanic`;
          const FOREMAN_PEER = `phone://grove=${GROVE}/tree=${TREE_CREW}/clone=foreman`;
          const record = (input: {
            uuid: string;
            way: 'out' | 'in';
            status: 'QUEUED' | 'REFUSED' | 'DELIVERED';
          }) => ({
            uuid: input.uuid,
            way: input.way,
            group: null,
            re: null,
            from: input.way === 'out' ? MECHANIC_SELF : FOREMAN_PEER,
            to: input.way === 'out' ? FOREMAN_PEER : MECHANIC_SELF,
            what: 'hi',
            status: input.status,
            reason: input.status === 'REFUSED' ? 'at a modal' : null,
          });
          for (const seed of [
            {
              uuid: '7f3e9a02-41c6-4b0e-9d2a-0c5e8f1a3b77',
              way: 'out' as const,
              status: 'QUEUED' as const,
            },
            {
              uuid: '7f3e9a02-d9b8-4e15-a6c3-71f20e4d9c05',
              way: 'out' as const,
              status: 'QUEUED' as const,
            },
            {
              uuid: '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
              way: 'in' as const,
              status: 'DELIVERED' as const,
            },
            {
              uuid: '9c8b7a6d-1e2f-4a3b-9c4d-5e6f7a8b9c0d',
              way: 'out' as const,
              status: 'REFUSED' as const,
            },
          ])
            await daoPhoneMailbox.gen({
              treeDir: scene.treeCrew,
              clone: 'mechanic',
              record: new PhoneTextRecord(record(seed)),
            });
          const byNumber = await getError(
            getOnePhoneTextByRef({ raw: '3', self: scene.mechanic }),
          );
          const byAlias = await getError(
            getOnePhoneTextByRef({ raw: '7f3e9a02', self: scene.mechanic }),
          );
          const byNoMatch = await getError(
            getOnePhoneTextByRef({ raw: 'abcdef01', self: scene.mechanic }),
          );
          const byFull = await getOnePhoneTextByRef({
            raw: '7f3e9a02-d9b8-4e15-a6c3-71f20e4d9c05',
            self: scene.mechanic,
          });
          const delOfIn = await getError(
            delPhoneText({ text: '1a2b3c4d', self: scene.mechanic }),
          );
          const delOfRefused = await getError(
            delPhoneText({ text: '9c8b7a6d', self: scene.mechanic }),
          );
          return {
            byNumber: byNumber.message,
            byAlias: byAlias.message,
            byNoMatch: byNoMatch.message,
            byFull,
            delOfIn: delOfIn.message,
            delOfRefused: delOfRefused.message,
          };
        });

        then('a number is refused: texts go by name', () => {
          expect(result.byNumber).toMatchSnapshot();
        });

        then('a shared alias is refused, both listed by full uuid', () => {
          expect(result.byAlias).toMatchSnapshot();
        });

        then('a name that matches no text is refused, with the cure', () => {
          expect(result.byNoMatch).toContain(
            'no text abcdef01 in this mailbox',
          );
          expect(result.byNoMatch).toMatchSnapshot();
        });

        then('a text that came in can not be withdrawn by its receiver', () => {
          expect(result.delOfIn).toContain('only its sender may withdraw');
          expect(result.delOfIn).toMatchSnapshot();
        });

        then('a REFUSED text can not be withdrawn', () => {
          expect(result.delOfRefused).toContain('was already REFUSED');
          expect(result.delOfRefused).toMatchSnapshot();
        });

        then('the full uuid names exactly one', () => {
          expect(result.byFull.record.uuid).toEqual(
            '7f3e9a02-d9b8-4e15-a6c3-71f20e4d9c05',
          );
        });
      });
    },
  );

  given('[case7] a withdraw that lands while the daemon is mid-say', () => {
    when('[t0] the sender withdraws mid-say', () => {
      const result = useThen(
        'the withdraw is refused; the record tells the truth',
        async () => {
          const scene = await genScene({ slug: 'phone-text-case7' });
          const fake = genFakeSdkClone({
            rosters: scene.rosters,
            sayAs: sayReleased,
          });
          const queued = await setPhoneText(
            {
              to: ['@:foreman'],
              what: 'mid-say',
              re: null,
              self: scene.mechanic,
            },
            asContext({ gitRoot: scene.gitRoot, sdkClone: fake.sdkClone }),
          );
          const alias = queued.entries[0]!.record.uuid.slice(0, 8);

          // the say itself fires the withdraw, as a sender would mid-say
          const withdraws: { message: string }[] = [];
          const sdkClone: PhoneContext['sdkClone'] = {
            getAllClones: fake.sdkClone.getAllClones,
            say: async (call) => {
              const error = await getError(
                delPhoneText({ text: alias, self: scene.mechanic }),
              );
              withdraws.push({
                message: error.message.split(alias).join('d03e6f91'),
              });
              return fake.sdkClone.say(call);
            },
          };
          const tally = await setPhoneDeliveriesOfTree(
            {
              treeDir: scene.treeCrew,
              treeSelf: TREE_CREW,
              state: { isStopped: false },
            },
            asContext({ gitRoot: scene.gitRoot, sdkClone }),
          );
          const after = await getOnePhoneTextByRef({
            raw: alias,
            self: scene.mechanic,
          });
          const claims = (await fs.readdir(join(after.path, '..'))).filter(
            (name) => name.endsWith('.claim'),
          );
          return { withdraws, tally, after, said: fake.said, claims };
        },
      );

      then('the withdraw is refused: the text is in the daemon paws', () => {
        expect(result.withdraws).toHaveLength(1);
        expect(result.withdraws[0]!.message).toContain('is mid-say right now');
        expect(result.withdraws[0]!.message).toMatchSnapshot();
      });

      then('the text settles DELIVERED, never clobbered to a lie', () => {
        expect(result.after.record.status).toEqual('DELIVERED');
        expect(result.tally).toEqual({ said: 1, waited: 0, settled: 0 });
      });

      then('it was said once', () => {
        expect(result.said).toHaveLength(1);
      });

      then('the claim is released after the settle', () => {
        expect(result.claims).toEqual([]);
      });
    });
  });

  given('[case8] a claim left behind by a dead process', () => {
    /**
     * .what = queues one text, then leaves a claim on it as a crashed holder would
     * .note = a pid far above any live one stands in for the crashed holder
     */
    const genStaleClaim = async (input: { slug: string; claim: string }) => {
      const scene = await genScene({ slug: input.slug });
      const fake = genFakeSdkClone({
        rosters: scene.rosters,
        sayAs: sayReleased,
      });
      const context = asContext({
        gitRoot: scene.gitRoot,
        sdkClone: fake.sdkClone,
      });
      const queued = await setPhoneText(
        { to: ['@:foreman'], what: 'hi', re: null, self: scene.mechanic },
        context,
      );
      const path = queued.entries[0]!.path;
      await fs.writeFile(`${path}.claim`, input.claim);
      return { scene, fake, context, path };
    };

    when(
      '[t0] the dead holder was a daemon mid-say, and the daemon ticks',
      () => {
        const result = useThen(
          'the text is settled, never said twice',
          async () => {
            const { scene, fake, context, path } = await genStaleClaim({
              slug: 'phone-text-case8-say',
              claim: '4194303999 say\n',
            });
            const tally = await setPhoneDeliveriesOfTree(
              {
                treeDir: scene.treeCrew,
                treeSelf: TREE_CREW,
                state: { isStopped: false },
              },
              context,
            );
            const after = await daoPhoneMailbox.getOne({ path });
            return { tally, after, said: fake.said };
          },
        );

        then('the text settles FAULTED with the reason, never resaid', () => {
          expect(result.tally).toEqual({ said: 0, waited: 0, settled: 1 });
          expect(result.after.record.status).toEqual('FAULTED');
          expect(result.after.record.reason).toContain('it may have been said');
        });

        then('the peer hears naught; the sender hears the failure', () => {
          expect(result.said.map((call) => call.clone)).toEqual(['mechanic']);
        });
      },
    );

    when(
      '[t1] the dead holder was a daemon mid-say, and the sender withdraws',
      () => {
        const result = useThen('the withdraw is refused', async () => {
          const { scene, path } = await genStaleClaim({
            slug: 'phone-text-case8-del',
            claim: '4194303999 say\n',
          });
          const { record } = await daoPhoneMailbox.getOne({ path });
          const alias = record.uuid.slice(0, 8);
          const error = await getError(
            delPhoneText({ text: alias, self: scene.mechanic }),
          );
          const after = await daoPhoneMailbox.getOne({ path });
          return {
            error: { message: error.message.split(alias).join('d03e6f91') },
            after,
          };
        });

        then('it can not be withdrawn as never said', () => {
          expect(result.error.message).toContain('was already FAULTED');
          expect(result.error.message).toMatchSnapshot();
          expect(result.after.record.status).toEqual('FAULTED');
        });
      },
    );

    when('[t2] the dead holder was a withdraw, and the daemon ticks', () => {
      const result = useThen('the stale claim is reclaimed', async () => {
        const { scene, context } = await genStaleClaim({
          slug: 'phone-text-case8-withdraw',
          claim: '4194303999 withdraw\n',
        });
        return {
          tally: await setPhoneDeliveriesOfTree(
            {
              treeDir: scene.treeCrew,
              treeSelf: TREE_CREW,
              state: { isStopped: false },
            },
            context,
          ),
        };
      });

      then('the text is said, not stuck behind a dead claim', () => {
        expect(result.tally).toEqual({ said: 1, waited: 0, settled: 0 });
      });
    });
  });

  given('[case9] a tick whose delivery of one text faults', () => {
    /**
     * .what = queues one text from the mechanic to the foreman
     */
    const genTwoTexts = async (input: { slug: string }) => {
      const scene = await genScene({ slug: input.slug });
      const fake = genFakeSdkClone({
        rosters: scene.rosters,
        sayAs: sayReleased,
      });
      const context = asContext({
        gitRoot: scene.gitRoot,
        sdkClone: fake.sdkClone,
      });
      const queued = await setPhoneText(
        { to: ['@:foreman'], what: 'hi', re: null, self: scene.mechanic },
        context,
      );
      return { scene, fake, context, path: queued.entries[0]!.path };
    };

    when('[t0] the roster read before the say throws', () => {
      const result = useThen('the text waits; no say is spent', async () => {
        const { scene, path } = await genTwoTexts({
          slug: 'phone-text-case9-pre',
        });
        const said: string[] = [];
        const sdkClone: PhoneContext['sdkClone'] = {
          getAllClones: async () => {
            throw new MalfunctionError('rhachet clone list failed');
          },
          say: async (call) => {
            said.push(call.clone);
            return sayReleased(call);
          },
        };
        const tally = await setPhoneDeliveriesOfTree(
          {
            treeDir: scene.treeCrew,
            treeSelf: TREE_CREW,
            state: { isStopped: false },
          },
          asContext({ gitRoot: scene.gitRoot, sdkClone }),
        );
        const after = await daoPhoneMailbox.getOne({ path });
        const claims = (await fs.readdir(join(path, '..'))).filter((name) =>
          name.endsWith('.claim'),
        );
        return { tally, after, said, claims };
      });

      then('the tick resolves; the fault is held to the one text', () => {
        expect(result.tally).toEqual({ said: 0, waited: 1, settled: 0 });
      });

      then(
        'the text is never said, and stays QUEUED with the reason named',
        () => {
          expect(result.said).toEqual([]);
          expect(result.after.record.status).toEqual('QUEUED');
          expect(result.after.record.reason).toEqual(
            'retry: rhachet clone list failed',
          );
        },
      );

      then('its claim is released, so the next tick tries again', () => {
        expect(result.claims).toEqual([]);
      });
    });

    when('[t1] the `in` copy write throws after the say has landed', () => {
      const result = useThen(
        'the text settles FAULTED, said once',
        async () => {
          const { scene, fake, context, path } = await genTwoTexts({
            slug: 'phone-text-case9-post',
          });

          // a file where the foreman's seat mailbox dir should be: the `in` copy can not be written
          const mailboxForeman = join(
            getOnePhoneCacheDir({ treeDir: scene.treeCrew }),
            'skill=phone.text',
            'clone=foreman',
          );
          await fs.writeFile(mailboxForeman, 'not a dir');

          const tally = await setPhoneDeliveriesOfTree(
            {
              treeDir: scene.treeCrew,
              treeSelf: TREE_CREW,
              state: { isStopped: false },
            },
            context,
          );
          const saidFirst = fake.said.map((call) => call.clone);
          const tallyAgain = await setPhoneDeliveriesOfTree(
            {
              treeDir: scene.treeCrew,
              treeSelf: TREE_CREW,
              state: { isStopped: false },
            },
            context,
          );
          const after = await daoPhoneMailbox.getOne({ path });
          const claims = (await fs.readdir(join(path, '..'))).filter((name) =>
            name.endsWith('.claim'),
          );
          return {
            tally,
            tallyAgain,
            after,
            saidFirst,
            said: fake.said,
            claims,
          };
        },
      );

      then('the tick resolves, never throws', () => {
        expect(result.tally).toEqual({ said: 0, waited: 0, settled: 1 });
      });

      then(
        'the text settles FAULTED: it was said, and is never said again',
        () => {
          expect(result.after.record.status).toEqual('FAULTED');
          expect(result.after.record.reason).toContain(
            'said, then its settle failed',
          );
          expect(result.tallyAgain).toEqual({ said: 0, waited: 0, settled: 0 });
        },
      );

      then('the foreman heard it once; the mechanic heard the failure', () => {
        expect(result.saidFirst).toEqual(['foreman', 'mechanic']);
        expect(result.said).toHaveLength(2);
      });

      then('the claim is released', () => {
        expect(result.claims).toEqual([]);
      });
    });
  });

  given('[case10] the claim a daemon takes before any write', () => {
    when('[t0] a daemon died after its claim and before its say', () => {
      const result = useThen('the text is said, never FAULTED', async () => {
        const scene = await genScene({ slug: 'phone-text-case10-prep' });
        const fake = genFakeSdkClone({
          rosters: scene.rosters,
          sayAs: sayReleased,
        });
        const context = asContext({
          gitRoot: scene.gitRoot,
          sdkClone: fake.sdkClone,
        });
        const queued = await setPhoneText(
          { to: ['@:foreman'], what: 'hi', re: null, self: scene.mechanic },
          context,
        );
        const path = queued.entries[0]!.path;
        await fs.writeFile(`${path}.claim`, '4194303999 prep\n');
        const tally = await setPhoneDeliveriesOfTree(
          {
            treeDir: scene.treeCrew,
            treeSelf: TREE_CREW,
            state: { isStopped: false },
          },
          context,
        );
        const after = await daoPhoneMailbox.getOne({ path });
        return { tally, after };
      });

      then(
        'a stale `prep` claim is a safe retake: the text is DELIVERED',
        () => {
          expect(result.tally).toEqual({ said: 1, waited: 0, settled: 0 });
          expect(result.after.record.status).toEqual('DELIVERED');
        },
      );
    });

    when(
      '[t1] a sender holds the withdraw claim as the peer tree goes away',
      () => {
        const result = useThen('the daemon writes naught', async () => {
          const scene = await genScene({ slug: 'phone-text-case10-withdraw' });
          const fake = genFakeSdkClone({
            rosters: scene.rosters,
            sayAs: sayReleased,
          });
          const context = asContext({
            gitRoot: scene.gitRoot,
            sdkClone: fake.sdkClone,
          });
          await daoPhoneContacts.set({
            treeDir: scene.treeDirector,
            clone: 'director',
            addresses: [MECHANIC],
          });
          const queued = await setPhoneText(
            { to: [MECHANIC], what: 'hi', re: null, self: scene.director },
            context,
          );
          const path = queued.entries[0]!.path;

          // a live sender holds the withdraw claim; the peer tree is gone
          await fs.writeFile(`${path}.claim`, `${process.ppid} withdraw\n`);
          await fs.rm(scene.treeCrew, { recursive: true, force: true });

          const tally = await setPhoneDeliveriesOfTree(
            {
              treeDir: scene.treeDirector,
              treeSelf: TREE_DIRECTOR,
              state: { isStopped: false },
            },
            context,
          );
          const after = await daoPhoneMailbox.getOne({ path });
          return { tally, after };
        });

        then(
          'the daemon waits on the claim and writes naught, so the withdraw stands',
          () => {
            expect(result.tally).toEqual({ said: 0, waited: 1, settled: 0 });
            expect(result.after.record.status).toEqual('QUEUED');
            expect(result.after.record.reason).toEqual(null);
          },
        );
      },
    );

    when('[t2] a sender sends two texts and the first is withheld', () => {
      const result = useThen('the second holds its place', async () => {
        const scene = await genScene({ slug: 'phone-text-case10-order' });
        const fake = genFakeSdkClone({
          rosters: scene.rosters,
          sayAs: (call) =>
            fake.said.length === 1
              ? {
                  exitCode: 2,
                  stdout: '',
                  stderr: JSON.stringify({
                    message: 'say withheld',
                    metadata: {
                      verdict: 'withheld',
                      reason: 'modal-holds-focus',
                    },
                  }),
                }
              : sayReleased(call),
        });
        const context = asContext({
          gitRoot: scene.gitRoot,
          sdkClone: fake.sdkClone,
        });
        const first = await setPhoneText(
          { to: ['@:foreman'], what: 'one', re: null, self: scene.mechanic },
          context,
        );
        const second = await setPhoneText(
          { to: ['@:foreman'], what: 'two', re: null, self: scene.mechanic },
          context,
        );
        const tally = await setPhoneDeliveriesOfTree(
          {
            treeDir: scene.treeCrew,
            treeSelf: TREE_CREW,
            state: { isStopped: false },
          },
          context,
        );
        const afterFirst = await daoPhoneMailbox.getOne({
          path: first.entries[0]!.path,
        });
        const afterSecond = await daoPhoneMailbox.getOne({
          path: second.entries[0]!.path,
        });
        return { tally, afterFirst, afterSecond, said: fake.said };
      });

      then('only the first is tried; the second waits behind it', () => {
        expect(result.said).toHaveLength(1);
        expect(result.tally).toEqual({ said: 0, waited: 2, settled: 0 });
      });

      then('both stay QUEUED, so the peer reads them in the order sent', () => {
        expect(result.afterFirst.record.status).toEqual('QUEUED');
        expect(result.afterFirst.record.reason).toEqual('peer at a modal');
        expect(result.afterSecond.record.status).toEqual('QUEUED');
      });
    });

    when('[t3] the roster shows the peer DEAD', () => {
      const result = useThen('no say is spent', async () => {
        const scene = await genScene({ slug: 'phone-text-case10-dead' });
        const rosters = {
          ...scene.rosters,
          [scene.treeCrew]: [
            {
              serial: SERIAL_MECHANIC,
              slug: 'mechanic',
              reachState: 'LIVE' as const,
            },
            {
              serial: SERIAL_FOREMAN,
              slug: 'foreman',
              reachState: 'DEAD' as const,
            },
          ],
        };
        const fake = genFakeSdkClone({ rosters, sayAs: sayReleased });
        const context = asContext({
          gitRoot: scene.gitRoot,
          sdkClone: fake.sdkClone,
        });
        const queued = await setPhoneText(
          { to: ['@:foreman'], what: 'hi', re: null, self: scene.mechanic },
          context,
        );
        const tally = await setPhoneDeliveriesOfTree(
          {
            treeDir: scene.treeCrew,
            treeSelf: TREE_CREW,
            state: { isStopped: false },
          },
          context,
        );
        const after = await daoPhoneMailbox.getOne({
          path: queued.entries[0]!.path,
        });
        return { tally, after, said: fake.said };
      });

      then('the text waits with the reason, and no say is spent on it', () => {
        expect(result.said).toEqual([]);
        expect(result.tally).toEqual({ said: 0, waited: 1, settled: 0 });
        expect(result.after.record.reason).toEqual('peer clone is DEAD');
      });
    });
  });

  given('[case11] the reads a delivery makes before it claims the text', () => {
    when('[t0] the sender withdraws while the roster read is in flight', () => {
      const result = useThen(
        'the withdraw lands, and the daemon writes naught',
        async () => {
          const scene = await genScene({ slug: 'phone-text-case11-del' });
          const fake = genFakeSdkClone({
            rosters: scene.rosters,
            sayAs: sayReleased,
          });
          const queued = await setPhoneText(
            { to: ['@:foreman'], what: 'hi', re: null, self: scene.mechanic },
            asContext({ gitRoot: scene.gitRoot, sdkClone: fake.sdkClone }),
          );
          const alias = queued.entries[0]!.record.uuid.slice(0, 8);

          // the roster read itself fires the withdraw, as a sender would while rhachet runs
          const withdraws: string[] = [];
          const sdkClone: PhoneContext['sdkClone'] = {
            say: fake.sdkClone.say,
            getAllClones: async (call) => {
              const withdrawn = await delPhoneText({
                text: alias,
                self: scene.mechanic,
              });
              withdraws.push(withdrawn.entry.record.status);
              return fake.sdkClone.getAllClones(call);
            },
          };
          const tally = await setPhoneDeliveriesOfTree(
            {
              treeDir: scene.treeCrew,
              treeSelf: TREE_CREW,
              state: { isStopped: false },
            },
            asContext({ gitRoot: scene.gitRoot, sdkClone }),
          );
          const after = await daoPhoneMailbox.getOne({
            path: queued.entries[0]!.path,
          });
          return { withdraws, tally, after, said: fake.said };
        },
      );

      then('the withdraw is not refused: no claim is held over a read', () => {
        expect(result.withdraws).toEqual(['WITHDRAWN']);
      });

      then('the text stays WITHDRAWN, and no say is spent', () => {
        expect(result.after.record.status).toEqual('WITHDRAWN');
        expect(result.said).toEqual([]);
        expect(result.tally).toEqual({ said: 0, waited: 0, settled: 1 });
      });
    });

    when('[t1] the peer is DEAD and has no slug', () => {
      const result = useThen('the text settles REFUSED', async () => {
        const scene = await genScene({ slug: 'phone-text-case11-dead' });
        const rosters = {
          ...scene.rosters,
          [scene.treeCrew]: [
            {
              serial: SERIAL_MECHANIC,
              slug: 'mechanic',
              reachState: 'LIVE' as const,
            },
            { serial: SERIAL_FOREMAN, slug: null, reachState: 'DEAD' as const },
          ],
        };
        const fake = genFakeSdkClone({ rosters, sayAs: sayReleased });
        const context = asContext({
          gitRoot: scene.gitRoot,
          sdkClone: fake.sdkClone,
        });
        const queued = await setPhoneText(
          {
            to: [`@:${SERIAL_FOREMAN}`],
            what: 'hi',
            re: null,
            self: scene.mechanic,
          },
          context,
        );
        const tally = await setPhoneDeliveriesOfTree(
          {
            treeDir: scene.treeCrew,
            treeSelf: TREE_CREW,
            state: { isStopped: false },
          },
          context,
        );
        const after = await daoPhoneMailbox.getOne({
          path: queued.entries[0]!.path,
        });
        return { tally, after, said: fake.said };
      });

      then('it never waits for a clone that no revive can return', () => {
        expect(result.tally).toEqual({ said: 0, waited: 0, settled: 1 });
        expect(result.after.record.status).toEqual('REFUSED');
        expect(result.after.record.reason).toEqual(
          `peer clone ${SERIAL_FOREMAN} is DEAD and has no slug to revive under`,
        );
      });

      then('the sender alone hears of it', () => {
        expect(result.said.map((call) => call.clone)).toEqual(['mechanic']);
      });
    });

    when('[t2] the say never spawns', () => {
      const result = useThen('the text waits, then is said once', async () => {
        const scene = await genScene({ slug: 'phone-text-case11-spawn' });
        const fake = genFakeSdkClone({
          rosters: scene.rosters,
          sayAs: sayReleased,
        });
        const queued = await setPhoneText(
          { to: ['@:foreman'], what: 'hi', re: null, self: scene.mechanic },
          asContext({ gitRoot: scene.gitRoot, sdkClone: fake.sdkClone }),
        );
        const path = queued.entries[0]!.path;

        // the first say can not spawn rhachet at all, as on a box out of pids
        const sdkCloneNoSpawn: PhoneContext['sdkClone'] = {
          getAllClones: fake.sdkClone.getAllClones,
          say: async () => {
            throw new MalfunctionError('could not run rhachet', {
              code: 'EAGAIN',
              spawned: false,
            });
          },
        };
        const tallyFirst = await setPhoneDeliveriesOfTree(
          {
            treeDir: scene.treeCrew,
            treeSelf: TREE_CREW,
            state: { isStopped: false },
          },
          asContext({ gitRoot: scene.gitRoot, sdkClone: sdkCloneNoSpawn }),
        );
        const afterFirst = await daoPhoneMailbox.getOne({ path });
        const tallyAgain = await setPhoneDeliveriesOfTree(
          {
            treeDir: scene.treeCrew,
            treeSelf: TREE_CREW,
            state: { isStopped: false },
          },
          asContext({ gitRoot: scene.gitRoot, sdkClone: fake.sdkClone }),
        );
        const afterAgain = await daoPhoneMailbox.getOne({ path });
        return { tallyFirst, afterFirst, tallyAgain, afterAgain };
      });

      then('a say that never ran is not FAULTED: it waits to retry', () => {
        expect(result.tallyFirst).toEqual({ said: 0, waited: 1, settled: 0 });
        expect(result.afterFirst.record.status).toEqual('QUEUED');
        expect(result.afterFirst.record.reason).toContain(
          'retry: could not run rhachet',
        );
      });

      then('the next tick says it', () => {
        expect(result.tallyAgain).toEqual({ said: 1, waited: 0, settled: 0 });
        expect(result.afterAgain.record.status).toEqual('DELIVERED');
      });
    });

    when('[t3] three texts in one tick go to one peer tree', () => {
      const result = useThen('the roster is read once', async () => {
        const scene = await genScene({ slug: 'phone-text-case11-memo' });
        const fake = genFakeSdkClone({
          rosters: scene.rosters,
          sayAs: sayReleased,
        });
        const context = asContext({
          gitRoot: scene.gitRoot,
          sdkClone: fake.sdkClone,
        });
        for (const what of ['one', 'two', 'three'])
          await setPhoneText(
            { to: ['@:foreman'], what, re: null, self: scene.mechanic },
            context,
          );
        const reads: string[] = [];
        const sdkClone: PhoneContext['sdkClone'] = {
          say: fake.sdkClone.say,
          getAllClones: async (call) => {
            reads.push(call.treeDir);
            return fake.sdkClone.getAllClones(call);
          },
        };
        const tally = await setPhoneDeliveriesOfTree(
          {
            treeDir: scene.treeCrew,
            treeSelf: TREE_CREW,
            state: { isStopped: false },
          },
          asContext({ gitRoot: scene.gitRoot, sdkClone }),
        );
        return { reads, tally };
      });

      then('one rhachet roster read serves every text in the tick', () => {
        expect(result.tally).toEqual({ said: 3, waited: 0, settled: 0 });
        expect(result.reads).toHaveLength(1);
      });
    });

    when('[t4] the sender mailbox holds a record a newer writer left', () => {
      const result = useThen(
        'send, look up, and withdraw still work',
        async () => {
          const scene = await genScene({ slug: 'phone-text-case11-skew' });
          const fake = genFakeSdkClone({
            rosters: scene.rosters,
            sayAs: sayReleased,
          });
          const context = asContext({
            gitRoot: scene.gitRoot,
            sdkClone: fake.sdkClone,
          });
          const first = await setPhoneText(
            { to: ['@:foreman'], what: 'one', re: null, self: scene.mechanic },
            context,
          );

          // a record of a format this reader does not know, as a newer daemon would write
          const dir = join(first.entries[0]!.path, '..');
          await fs.writeFile(
            join(dir, 'text.0099.in.json'),
            JSON.stringify({ v: 2, uuid: 'future', status: 'READ' }),
          );

          const second = await setPhoneText(
            { to: ['@:foreman'], what: 'two', re: null, self: scene.mechanic },
            context,
          );
          const alias = second.entries[0]!.record.uuid.slice(0, 8);
          const found = await getOnePhoneTextByRef({
            raw: alias,
            self: scene.mechanic,
          });
          const withdrawn = await delPhoneText({
            text: alias,
            self: scene.mechanic,
          });
          const { unreadable } = await daoPhoneMailbox.getAllReadable({
            treeDir: scene.treeCrew,
            clone: 'mechanic',
          });
          return {
            statusSent: second.entries[0]!.record.status,
            found: found.record.uuid === second.entries[0]!.record.uuid,
            statusWithdrawn: withdrawn.entry.record.status,
            unreadable: unreadable.map((bad) =>
              bad.path.endsWith('text.0099.in.json'),
            ),
          };
        },
      );

      then('one bad record bricks none of the phone', () => {
        expect(result.statusSent).toEqual('QUEUED');
        expect(result.found).toEqual(true);
        expect(result.statusWithdrawn).toEqual('WITHDRAWN');
      });

      then('the bad record is named, never dropped in silence', () => {
        expect(result.unreadable).toEqual([true]);
      });
    });
  });

  given(
    '[case13] a seat whose clone is revived under the same slug (F24)',
    () => {
      when(
        '[t0] the director texts the mechanic, the mechanic is revived, the director texts again',
        () => {
          const result = useThen(
            'both texts reach the seat, and the seat keeps its contacts',
            async () => {
              const scene = await genScene({ slug: 'phone-text-case13' });
              const SERIAL_REVIVED = '7aa1c0de-1b2c-4d3e-8f40-5a6b7c8d9e01';
              // .note = deliberate mutation: the roster the fake reads, swapped at the revive
              const rosters = { ...scene.rosters };
              const fake = genFakeSdkClone({ rosters, sayAs: sayReleased });
              const context = asContext({
                gitRoot: scene.gitRoot,
                sdkClone: fake.sdkClone,
              });

              // the mechanic's seat is granted the director; the director may reach the mechanic
              await daoPhoneContacts.set({
                treeDir: scene.treeDirector,
                clone: 'director',
                addresses: [MECHANIC],
              });
              await daoPhoneContacts.set({
                treeDir: scene.treeCrew,
                clone: 'mechanic',
                addresses: [DIRECTOR],
              });
              await setPhoneText(
                { to: [MECHANIC], what: 'one', re: null, self: scene.director },
                context,
              );
              await setPhoneDeliveriesOfTree(
                {
                  treeDir: scene.treeDirector,
                  treeSelf: TREE_DIRECTOR,
                  state: { isStopped: false },
                },
                context,
              );

              // the revive: the slug rebinds to a fresh serial
              rosters[scene.treeCrew] = [
                {
                  serial: SERIAL_REVIVED,
                  slug: 'mechanic',
                  reachState: 'LIVE',
                },
                { serial: SERIAL_FOREMAN, slug: 'foreman', reachState: 'LIVE' },
              ];
              const revived = new PhoneSelf({
                serial: SERIAL_REVIVED,
                treeDir: scene.treeCrew,
                address: scene.mechanic.address,
              });
              await setPhoneText(
                { to: [MECHANIC], what: 'two', re: null, self: scene.director },
                context,
              );
              await setPhoneDeliveriesOfTree(
                {
                  treeDir: scene.treeDirector,
                  treeSelf: TREE_DIRECTOR,
                  state: { isStopped: false },
                },
                context,
              );

              // the revived clone texts the director with no re-grant
              const reply = await setPhoneText(
                { to: [DIRECTOR], what: 'back', re: null, self: revived },
                context,
              );
              const reach = await getOnePhoneReach({ self: revived }, context);
              const thread = await getAllPhoneMailboxEntries({
                treeDir: scene.treeCrew,
                clone: 'mechanic',
              });
              return { reach, thread, reply: reply.entries };
            },
          );

          then(
            'both texts sit in the seat mailbox, either side of the revive',
            () => {
              expect(
                result.thread
                  .filter((entry) => entry.record.way === 'in')
                  .map((entry) => entry.record.what),
              ).toEqual(['one', 'two']);
            },
          );

          then(
            'the revived clone keeps the seat contacts, with no re-grant',
            () => {
              expect(result.reach.contacts).toEqual([DIRECTOR]);
              expect(result.reply[0]!.record.status).toEqual('QUEUED');
            },
          );
        },
      );
    },
  );

  given('[case14] a contact revoked while a text to it waits', () => {
    when('[t0] the daemon ticks after the revoke', () => {
      const result = useThen(
        'the text settles REFUSED, never said',
        async () => {
          const scene = await genScene({ slug: 'phone-text-case14' });
          const fake = genFakeSdkClone({
            rosters: scene.rosters,
            sayAs: sayReleased,
          });
          const context = asContext({
            gitRoot: scene.gitRoot,
            sdkClone: fake.sdkClone,
          });
          await daoPhoneContacts.set({
            treeDir: scene.treeDirector,
            clone: 'director',
            addresses: [MECHANIC],
          });
          const queued = await setPhoneText(
            { to: [MECHANIC], what: 'hi', re: null, self: scene.director },
            context,
          );

          // the booter revokes before the daemon reaches the text
          await daoPhoneContacts.set({
            treeDir: scene.treeDirector,
            clone: 'director',
            addresses: [],
          });
          const tally = await setPhoneDeliveriesOfTree(
            {
              treeDir: scene.treeDirector,
              treeSelf: TREE_DIRECTOR,
              state: { isStopped: false },
            },
            context,
          );
          const after = await daoPhoneMailbox.getOne({
            path: queued.entries[0]!.path,
          });
          return { tally, after, said: fake.said };
        },
      );

      then('the revoke holds for the life of the text', () => {
        expect(result.after.record.status).toEqual('REFUSED');
        expect(result.after.record.reason).toEqual(
          `${MECHANIC} is no longer a contact`,
        );
        expect(result.tally).toEqual({ said: 0, waited: 0, settled: 1 });
      });

      then(
        'only the fail notice is said, to the sender; the peer hears naught',
        () => {
          expect(result.said.map((call) => call.clone)).toEqual(['director']);
        },
      );
    });
  });

  given('[case15] a stop that lands before the tick reaches a text', () => {
    when('[t0] the daemon ticks with its stop already set', () => {
      const result = useThen('no text is said', async () => {
        const scene = await genScene({ slug: 'phone-text-case15' });
        const fake = genFakeSdkClone({
          rosters: scene.rosters,
          sayAs: sayReleased,
        });
        const context = asContext({
          gitRoot: scene.gitRoot,
          sdkClone: fake.sdkClone,
        });
        const queued = await setPhoneText(
          { to: ['@:foreman'], what: 'hi', re: null, self: scene.mechanic },
          context,
        );
        const tally = await setPhoneDeliveriesOfTree(
          {
            treeDir: scene.treeCrew,
            treeSelf: TREE_CREW,
            state: { isStopped: true },
          },
          context,
        );
        const after = await daoPhoneMailbox.getOne({
          path: queued.entries[0]!.path,
        });
        return { tally, after, said: fake.said };
      });

      then('the stop bites at the next text: it stays QUEUED, unsaid', () => {
        expect(result.said).toEqual([]);
        expect(result.tally).toEqual({ said: 0, waited: 0, settled: 0 });
        expect(result.after.record.status).toEqual('QUEUED');
      });
    });
  });
});
