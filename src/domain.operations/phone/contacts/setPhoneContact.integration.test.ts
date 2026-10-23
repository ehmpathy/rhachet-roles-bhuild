import { promises as fs } from 'fs';
import { join } from 'path';
import { genTempDir, getError, given, then, useThen, when } from 'test-fns';

import { daoPhoneContactsUses } from '@src/access/daos/daoPhoneContactsUses';
import { PhoneAddress } from '@src/domain.objects/phone/PhoneAddress';
import { PhoneSelf } from '@src/domain.objects/phone/PhoneSelf';
import type { PhoneTreeClone } from '@src/domain.objects/phone/PhoneTreeClone';

import type { PhoneContext } from '../PhoneContext';
import { getAllPhoneContacts } from './getAllPhoneContacts';
import { setPhoneContact } from './setPhoneContact';

const GROVE = 'bert-laptop';
const TREE_DIRECTOR = 'notebook';
const TREE_CREW = 'svc-lessons.beav.feat-book-a-lesson';
const SERIAL_DIRECTOR = '0d1e2c3f-0000-4000-8000-00000000d1e2';
const SERIAL_MECHANIC = '20fa7ac9-4dfc-4cbc-be9f-7685b5672a14';
const SERIAL_UNNAMED = '4c1e8b27-9a0f-4d2e-8b31-6f7a0c5d2e19';
const MECHANIC = `phone://grove=${GROVE}/tree=${TREE_CREW}/clone=mechanic`;

/**
 * .what = a temp git root with the director's tree and one crew tree, and a fake clone roster
 * .why = the roster is a fake (not a mock) of rhachet's `clone list`; the acceptance suite
 *        drives rhachet for real
 */
const genScene = async (input: { slug: string }) => {
  const gitRoot = genTempDir({ slug: input.slug });
  const treeDirector = join(gitRoot, 'sandpine', TREE_DIRECTOR);
  const treeCrew = join(gitRoot, 'sandpine', '_worktrees', TREE_CREW);
  for (const dir of [treeDirector, treeCrew]) {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(join(dir, '.git'), 'gitdir: elsewhere\n');
  }
  const rosters: Record<string, PhoneTreeClone[]> = {
    [treeDirector]: [
      { serial: SERIAL_DIRECTOR, slug: 'director', reachState: 'LIVE' },
    ],
    [treeCrew]: [
      { serial: SERIAL_MECHANIC, slug: 'mechanic', reachState: 'LIVE' },
      { serial: SERIAL_UNNAMED, slug: null, reachState: 'DEAD' },
    ],
  };
  const context: PhoneContext = {
    gitRoot,
    forestDir: join(gitRoot, '.git.forest'),
    groveSelf: GROVE,
    sdkClone: {
      getAllClones: async (call) => rosters[call.treeDir] ?? [],
      say: async () => ({ exitCode: 0, stdout: '{}', stderr: '' }),
    },
  };
  const director = new PhoneSelf({
    serial: SERIAL_DIRECTOR,
    treeDir: treeDirector,
    address: new PhoneAddress({
      grove: GROVE,
      tree: TREE_DIRECTOR,
      clone: 'director',
    }),
  });
  return { context, director, treeDirector };
};

describe('setPhoneContact', () => {
  given('[case1] a clone whose tree meter is unset', () => {
    when('[t0] the clone grants itself a contact', () => {
      const result = useThen('the grant is refused', async () => {
        const scene = await genScene({ slug: 'phone-contacts-case1' });
        const error = await getError(
          setPhoneContact(
            {
              mode: 'grant',
              address: MECHANIC,
              self: scene.director,
              isHuman: false,
            },
            scene.context,
          ),
        );
        return { message: error.message };
      });

      then('the refusal names the meter and who may lift it', () => {
        expect(result.message).toMatchSnapshot();
      });
    });
  });

  given('[case2] a clone whose tree meter is allowed', () => {
    when(
      '[t0] it grants a crew mechanic twice, a short serial, then revokes',
      () => {
        const result = useThen('each step settles as expected', async () => {
          const scene = await genScene({ slug: 'phone-contacts-case2' });
          await daoPhoneContactsUses.set({
            treeDir: scene.treeDirector,
            state: 'allowed',
          });
          const first = await setPhoneContact(
            {
              mode: 'grant',
              address: `phone://grove=local/tree=${TREE_CREW}/clone=mechanic`,
              self: scene.director,
              isHuman: false,
            },
            scene.context,
          );
          const second = await setPhoneContact(
            {
              mode: 'grant',
              address: MECHANIC,
              self: scene.director,
              isHuman: false,
            },
            scene.context,
          );
          const unnamed = await setPhoneContact(
            {
              mode: 'grant',
              address: `phone://grove=local/tree=${TREE_CREW}/clone=4c1e8b27`,
              self: scene.director,
              isHuman: false,
            },
            scene.context,
          );
          const view = await getAllPhoneContacts(
            { self: scene.director },
            scene.context,
          );
          const revoked = await setPhoneContact(
            {
              mode: 'revoke',
              address: MECHANIC,
              self: scene.director,
              isHuman: false,
            },
            scene.context,
          );
          return { first, second, unnamed, view, revoked };
        });

        then('the first grant stores the canonical form, local cast', () => {
          expect(result.first.address).toEqual(MECHANIC);
          expect(result.first.isChanged).toEqual(true);
        });

        then('a second grant is a no-op', () => {
          expect(result.second.isChanged).toEqual(false);
          expect(result.second.contacts).toEqual(result.first.contacts);
        });

        then('a short serial is stored as the full serial', () => {
          expect(result.unnamed.address).toEqual(
            `phone://grove=${GROVE}/tree=${TREE_CREW}/clone=${SERIAL_UNNAMED}`,
          );
        });

        then('get shows each contact with its reach state', () => {
          expect(result.view.reachStateOf).toEqual({
            [MECHANIC]: 'LIVE',
            [`phone://grove=${GROVE}/tree=${TREE_CREW}/clone=${SERIAL_UNNAMED}`]:
              'DEAD',
          });
        });

        then('a revoke drops it', () => {
          expect(result.revoked.isChanged).toEqual(true);
          expect(result.revoked.contacts).not.toContain(MECHANIC);
        });
      },
    );
  });

  given('[case3] a human, and a peer tree that does not exist', () => {
    when('[t0] the human grants a contact in an absent tree', () => {
      const result = useThen('the grant is refused', async () => {
        const scene = await genScene({ slug: 'phone-contacts-case3' });
        const error = await getError(
          setPhoneContact(
            {
              mode: 'grant',
              address: `phone://grove=local/tree=coachbook.beav.feat-slot-shape/clone=mechanic`,
              self: scene.director,
              isHuman: true,
            },
            scene.context,
          ),
        );
        return {
          message: error.message.split(scene.context.gitRoot).join('$GIT_ROOT'),
        };
      });

      then('the refusal names the absent tree, and where it looked', () => {
        expect(result.message).toContain(
          'no tree coachbook.beav.feat-slot-shape on bert-laptop',
        );
        expect(result.message).toMatchSnapshot();
      });
    });

    when('[t1] the human grants a contact on an unknown grove', () => {
      const result = useThen('the grant is refused', async () => {
        const scene = await genScene({ slug: 'phone-contacts-case3-t1' });
        const error = await getError(
          setPhoneContact(
            {
              mode: 'grant',
              address: `phone://grove=grove-sandpine-v20260922/tree=notebook/clone=director`,
              self: scene.director,
              isHuman: true,
            },
            scene.context,
          ),
        );
        return { message: error.message };
      });

      then('the refusal names the unknown grove', () => {
        expect(result.message).toContain(
          'no grove grove-sandpine-v20260922 is known',
        );
      });
    });
  });

  given('[case4] contacts revoked by a form other than the one stored', () => {
    when('[t0] each is revoked by a serial, then a tree is gone', () => {
      const result = useThen('each revoke finds its contact', async () => {
        const scene = await genScene({ slug: 'phone-contacts-case4' });
        const grant = (address: string) =>
          setPhoneContact(
            { mode: 'grant', address, self: scene.director, isHuman: true },
            scene.context,
          );
        const revoke = (address: string) =>
          setPhoneContact(
            { mode: 'revoke', address, self: scene.director, isHuman: true },
            scene.context,
          );
        const crewByShort = `phone://grove=${GROVE}/tree=${TREE_CREW}/clone=4c1e8b27`;

        // stored by slug, revoked by full serial
        await grant(MECHANIC);
        const bySerial = await revoke(
          `phone://grove=${GROVE}/tree=${TREE_CREW}/clone=${SERIAL_MECHANIC}`,
        );

        // stored by full serial, revoked by short serial
        await grant(crewByShort);
        const byShort = await revoke(crewByShort);

        // stored by full serial, tree gone, revoked by short serial
        await grant(crewByShort);
        await fs.rm(join(scene.treeDirector, '..', '_worktrees', TREE_CREW), {
          recursive: true,
        });
        const byShortTreeGone = await revoke(crewByShort);
        return { bySerial, byShort, byShortTreeGone };
      });

      then('a slug-stored contact goes by its full serial', () => {
        expect(result.bySerial.isChanged).toEqual(true);
        expect(result.bySerial.contacts).toEqual([]);
      });

      then('a serial-stored contact goes by its short serial', () => {
        expect(result.byShort.isChanged).toEqual(true);
        expect(result.byShort.contacts).toEqual([]);
      });

      then('a short serial still finds it after its tree is gone', () => {
        expect(result.byShortTreeGone.isChanged).toEqual(true);
        expect(result.byShortTreeGone.contacts).toEqual([]);
      });
    });
  });

  given(
    '[case5] a grant that needs no contact, or can not pick one tree',
    () => {
      when('[t0] the human grants a clone in its own tree', () => {
        const result = useThen('the grant is refused', async () => {
          const scene = await genScene({ slug: 'phone-contacts-case5-t0' });
          const error = await getError(
            setPhoneContact(
              {
                mode: 'grant',
                address: `phone://grove=local/tree=${TREE_DIRECTOR}/clone=director`,
                self: scene.director,
                isHuman: true,
              },
              scene.context,
            ),
          );
          return { message: error.message };
        });

        then(
          'the refusal says it is already in the pond, and how to text it',
          () => {
            expect(result.message).toContain("is in this clone's own tree");
            expect(result.message).toMatchSnapshot();
          },
        );
      });

      when('[t1] two orgs each hold a tree of that name', () => {
        const result = useThen('the grant is refused', async () => {
          const scene = await genScene({ slug: 'phone-contacts-case5-t1' });
          const twin = join(
            scene.context.gitRoot,
            'sandpine-archive',
            '_worktrees',
            TREE_CREW,
          );
          await fs.mkdir(twin, { recursive: true });
          await fs.writeFile(join(twin, '.git'), 'gitdir: elsewhere\n');
          const error = await getError(
            setPhoneContact(
              {
                mode: 'grant',
                address: MECHANIC,
                self: scene.director,
                isHuman: true,
              },
              scene.context,
            ),
          );
          return {
            message: error.message
              .split(scene.context.gitRoot)
              .join('$GIT_ROOT'),
          };
        });

        then('the refusal names both dirs, never guesses one', () => {
          expect(result.message).toContain('names 2 dirs on this grove');
          expect(result.message).toMatchSnapshot();
        });
      });
    },
  );
});
