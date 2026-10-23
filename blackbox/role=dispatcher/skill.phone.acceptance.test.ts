import fs from 'fs';
import path, { basename } from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  genConsumerRepo,
  genRhachetStubBin,
  runRhachetSkill,
  sanitizeOutput,
} from '../.test/infra';

/**
 * .what = acceptance tests for the phone skills, run as a consumer runs them
 * .why = the skills dispatch through the built package; this proves each one is wired, guards
 *        its human-only verbs, refuses loud outside an enrolled clone, and carries a text and
 *        its reply end to end
 *
 * .note = a live clone may not enroll another (rhachet's enroll depth budget), so each round
 *         trip runs against a stub rhachet bound via PHONE_RHACHET_BIN: the stub lists the
 *         clones of the tree its cwd names and takes each say into a file, with that cwd. all
 *         else is the built phone: the cli, the contacts, the mailbox, the detached daemon in
 *         each tree, the say text. so a call aimed at the wrong tree finds no clone, and fails
 *         here. the live rhachet leg is the byhand playtest's
 */
const runPhoneSkill = (input: {
  repoDir: string;
  skill: string;
  args: string;
  env?: Record<string, string | undefined>;
}) =>
  runRhachetSkill({
    repo: 'bhuild',
    role: 'dispatcher',
    skill: input.skill,
    args: input.args,
    repoDir: input.repoDir,
    env: { RHACHET_CLONE_SERIAL: '', __I_AM_HUMAN: '', ...input.env },
    timeout: 90000,
  });

/**
 * .what = the sanitized outputs of several runs, joined into one snapshot body
 */
const asSnapOfSteps = (steps: { output: string }[]): string =>
  steps.map((step) => sanitizeOutput(step.output)).join('\n---\n');

describe('phone skills', () => {
  const scene = useBeforeAll(async () =>
    genConsumerRepo({ prefix: 'phone-skills', branchName: 'main' }),
  );

  given('[case1] a shell with no enrolled clone', () => {
    when('[t0] phone.text get runs', () => {
      const result = useThen('it is refused', async () =>
        runPhoneSkill({ repoDir: scene.repoDir, skill: 'phone.text', args: 'get' }),
      );

      then('it exits 2', () => {
        expect(result.exitCode).toEqual(2);
      });

      then('the refusal leads with its vibe and names the fix', () => {
        expect(result.output).toContain('🦫 bummer, no clone holds this phone');
        expect(result.output).toContain('the phone runs only inside an enrolled clone');
      });

      then('the refusal matches its snapshot', () => {
        expect(sanitizeOutput(result.output)).toMatchSnapshot();
      });
    });

    when('[t1] phone.text --help runs', () => {
      const result = useThen('it prints the usage', async () =>
        runPhoneSkill({ repoDir: scene.repoDir, skill: 'phone.text', args: '--help' }),
      );

      then('it exits 0 and shows the three verbs and the address forms', () => {
        expect(result.exitCode).toEqual(0);
        expect(sanitizeOutput(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case2] the phone.contacts.uses meter, unset', () => {
    const run = (args: string, env?: Record<string, string>) =>
      runPhoneSkill({ repoDir: scene.repoDir, skill: 'phone.contacts.uses', args, env });

    when('[t0] a human reads it, a clone tries to lift it, then a human lifts it', () => {
      const result = useThen('each step settles as expected', async () => {
        const before = run('get');
        const byClone = run('allow');
        const byHuman = run('allow', { __I_AM_HUMAN: 'true' });
        const after = run('get');
        return { before, byClone, byHuman, after };
      });

      then('unset reads as blocked', () => {
        expect(result.before.output).toContain('state: blocked (default)');
      });

      then('a clone may not lift it', () => {
        expect(result.byClone.exitCode).toEqual(2);
        expect(result.byClone.output).toContain('needs a human');
      });

      then('a human lifts it', () => {
        expect(result.byHuman.exitCode).toEqual(0);
        expect(result.byHuman.output).toContain('blocked (default) → allowed');
      });

      then('it then reads allowed', () => {
        expect(result.after.output).toContain('state: allowed');
      });

      then('each step matches its snapshot', () => {
        expect(
          asSnapOfSteps([result.before, result.byClone, result.byHuman, result.after]),
        ).toMatchSnapshot();
      });
    });

    when('[t1] a clone tries to drop it, then a human drops it', () => {
      const result = useThen('each step settles as expected', async () => {
        const byClone = run('block');
        const byHuman = run('block', { __I_AM_HUMAN: 'true' });
        const after = run('get');
        return { byClone, byHuman, after };
      });

      then('a clone may not drop it', () => {
        expect(result.byClone.exitCode).toEqual(2);
        expect(result.byClone.output).toContain('needs a human');
      });

      then('a human drops it', () => {
        expect(result.byHuman.exitCode).toEqual(0);
        expect(result.byHuman.output).toContain('allowed → blocked');
      });

      then('it then reads blocked', () => {
        expect(result.after.output).toContain('state: blocked');
      });

      then('each step matches its snapshot', () => {
        expect(
          asSnapOfSteps([result.byClone, result.byHuman, result.after]),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case3] the phone.daemon, never started', () => {
    when('[t0] its state is read', () => {
      const result = useThen('it reads DOWN', async () =>
        runPhoneSkill({ repoDir: scene.repoDir, skill: 'phone.daemon', args: 'get' }),
      );

      then('it exits 0 and reads DOWN', () => {
        expect(result.exitCode).toEqual(0);
        expect(result.output).toContain('state: DOWN');
      });

      then('it names how to start it, and matches its snapshot', () => {
        expect(result.output).toContain('start it: rhx phone.daemon set');
        expect(
          asMaskedOfRepoDir({ output: sanitizeOutput(result.output), repoDir: scene.repoDir }),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case4] the phone.daemon, started and stopped by a human', () => {
    // a backstop: the journey stops its own daemon, but a failed step must not leave one live
    afterAll(() =>
      runPhoneSkill({ repoDir: scene.repoDir, skill: 'phone.daemon', args: 'del' }),
    );

    when('[t0] it is started twice, read, stopped, and read again', () => {
      const result = useThen('each step settles as expected', async () => {
        const run = (args: string) =>
          runPhoneSkill({ repoDir: scene.repoDir, skill: 'phone.daemon', args });
        const started = run('set');
        const again = run('set');
        const live = run('get');
        const stopped = run('del');
        const down = run('get');
        return { started, again, live, stopped, down };
      });

      then('the first set starts a daemon, LIVE with a pid', () => {
        expect(result.started.exitCode).toEqual(0);
        expect(result.started.output).toContain('the daemon dives in');
        expect(result.started.output).toMatch(/state: LIVE/);
        expect(result.started.output).toMatch(/pid: \d+/);
      });

      then('a second set is a no-op on the same pid', () => {
        expect(result.again.output).toContain('the daemon already swims');
        expect(asPid(result.again.output)).toEqual(asPid(result.started.output));
      });

      then('get reads it LIVE', () => {
        expect(result.live.output).toContain('state: LIVE');
      });

      then('del stops it, and get then reads DOWN', () => {
        expect(result.stopped.exitCode).toEqual(0);
        expect(result.stopped.output).toContain('the daemon climbs out');
        expect(result.down.output).toContain('state: DOWN');
      });

      then('the set and del outputs match their snapshots', () => {
        expect(
          [result.started.stdout, result.again.stdout, result.stopped.stdout]
            .map((stdout) =>
              asMaskedOfRepoDir({
                output: sanitizeOutput(stdout),
                repoDir: scene.repoDir,
              }).replace(/pid: \d+/g, 'pid: <pid>'),
            )
            .join('\n---\n'),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case5] a verb the phone does not know', () => {
    when('[t0] phone.daemon runs with it', () => {
      const result = useThen('it is refused', async () =>
        runPhoneSkill({ repoDir: scene.repoDir, skill: 'phone.daemon', args: 'restart' }),
      );

      then('it exits 2 with a constraint header that names the verbs', () => {
        expect(result.exitCode).toEqual(2);
        expect(sanitizeOutput(result.output)).toMatchSnapshot();
      });
    });

    when('[t1] phone.text runs with a typo, outside any clone', () => {
      const result = useThen('it is refused for the typo', async () =>
        runPhoneSkill({ repoDir: scene.repoDir, skill: 'phone.text', args: 'sned' }),
      );

      then('the refusal names the typo, never a lack of clone', () => {
        expect(result.exitCode).toEqual(2);
        expect(result.output).toContain("phone.text has no verb 'sned'");
        expect(result.output).not.toContain('no clone holds this phone');
      });

      then('the refusal matches its snapshot', () => {
        expect(sanitizeOutput(result.output)).toMatchSnapshot();
      });
    });
  });

  given('[case6] phone.contacts, in a shell with no enrolled clone', () => {
    const run = (args: string) =>
      runPhoneSkill({ repoDir: scene.repoDir, skill: 'phone.contacts', args });
    const address = 'phone://grove=local/tree=svc-lessons/clone=director';

    when('[t0] get, set, and del run with every flag', () => {
      const result = useThen('each is refused for the absent clone', async () => ({
        get: run('get'),
        set: run(`set --address ${address}`),
        del: run(`del --address ${address}`),
      }));

      then('each exits 2 with the no-clone refusal', () => {
        for (const step of [result.get, result.set, result.del]) {
          expect(step.exitCode).toEqual(2);
          expect(step.output).toContain('the phone runs only inside an enrolled clone');
        }
      });

      then('the refusals match their snapshot', () => {
        expect(asSnapOfSteps([result.get, result.set, result.del])).toMatchSnapshot();
      });
    });

    when('[t1] set and del run with no --address', () => {
      const result = useThen('each is refused for the absent flag', async () => ({
        set: run('set'),
        del: run('del'),
      }));

      then('each exits 2 and names the absent flag, never a lack of clone', () => {
        expect(result.set.exitCode).toEqual(2);
        expect(result.set.output).toContain('phone.contacts set needs --address');
        expect(result.del.exitCode).toEqual(2);
        expect(result.del.output).toContain('phone.contacts del needs --address');
        expect(result.set.output).not.toContain('no clone holds this phone');
      });

      then('the refusals match their snapshot', () => {
        expect(asSnapOfSteps([result.set, result.del])).toMatchSnapshot();
      });
    });
  });

  given('[case7] phone.text set and del, in a shell with no enrolled clone', () => {
    const run = (args: string) =>
      runPhoneSkill({ repoDir: scene.repoDir, skill: 'phone.text', args });

    when('[t0] set and del run with every flag', () => {
      const result = useThen('each is refused for the absent clone', async () => ({
        set: run('set --to @:mechanic --what board-rentals-are-in'),
        del: run('del --text 7f3e9a02'),
      }));

      then('each exits 2 with the no-clone refusal', () => {
        for (const step of [result.set, result.del]) {
          expect(step.exitCode).toEqual(2);
          expect(step.output).toContain('the phone runs only inside an enrolled clone');
        }
      });

      then('the refusals match their snapshot', () => {
        expect(asSnapOfSteps([result.set, result.del])).toMatchSnapshot();
      });
    });

    when('[t1] del runs with no --text', () => {
      const result = useThen('it is refused for the absent flag', async () => run('del'));

      then('it exits 2 and names the absent flag, never a lack of clone', () => {
        expect(result.exitCode).toEqual(2);
        expect(result.output).toContain('phone.text del needs --text');
        expect(result.output).not.toContain('no clone holds this phone');
      });

      then('the refusal matches its snapshot', () => {
        expect(sanitizeOutput(result.output)).toMatchSnapshot();
      });
    });
  });

  given('[case8] the --help of each other phone skill', () => {
    when('[t0] each runs with --help', () => {
      const result = useThen('each prints its usage', async () => ({
        steps: ['phone.contacts', 'phone.contacts.uses', 'phone.daemon'].map((skill) =>
          runPhoneSkill({ repoDir: scene.repoDir, skill, args: '--help' }),
        ),
      }));

      then('each exits 0', () => {
        for (const step of result.steps) expect(step.exitCode).toEqual(0);
      });

      then('the usages match their snapshot', () => {
        expect(
          result.steps.map((step) => sanitizeOutput(step.stdout)).join('\n---\n'),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case9] a mechanic and a foreman in one tree, on a stub rhachet', () => {
    // the stub stands in for rhachet: it lists two clones, and takes each say into a file
    const stub = useBeforeAll(async () =>
      genRhachetStubBin({
        slug: 'phone-stub-rhachet',
        rosters: {
          [basename(scene.repoDir)]: [
            { serial: SERIAL_MECHANIC, slug: 'mechanic' },
            { serial: SERIAL_FOREMAN, slug: 'foreman' },
          ],
        },
      }),
    );
    const runAs = (input: {
      serial: string;
      skill: string;
      args: string;
      stdin?: string;
    }) =>
      runRhachetSkill({
        repo: 'bhuild',
        role: 'dispatcher',
        skill: input.skill,
        args: input.args,
        repoDir: scene.repoDir,
        env: {
          ...stub.env,
          PHONE_GROVE: 'bert-laptop',
          RHACHET_CLONE_SERIAL: input.serial,
          __I_AM_HUMAN: '',
        },
        stdin: input.stdin,
        timeout: 90000,
      });

    // the journey starts its own daemon on the stub; stop it, however the journey ends
    afterAll(() =>
      runAs({ serial: SERIAL_MECHANIC, skill: 'phone.daemon', args: 'del' }),
    );

    when('[t0] the mechanic texts the foreman, and the foreman replies', () => {
      const result = useThen('the text and its reply each land once', async () => {
        // the mechanic texts the foreman, named twice, words piped in
        const sent = runAs({
          serial: SERIAL_MECHANIC,
          skill: 'phone.text',
          args: "set --to @:foreman --to @:foreman --what @stdin",
          stdin: "slot shape changed for book-a-lesson\nit's 'lesson.slot', not 'slot'",
        });
        const alias = sent.output.match(/text: ([0-9a-f]{8})/)?.[1] ?? null;
        await getSaidWhen({ stub, count: 1 });

        // the foreman reads its thread, then replies to the text by its alias
        const foremanThread = runAs({
          serial: SERIAL_FOREMAN,
          skill: 'phone.text',
          args: 'get',
        });
        const replied = runAs({
          serial: SERIAL_FOREMAN,
          skill: 'phone.text',
          args: `set --to @:mechanic --re ${alias} --what 'got it; slot renamed'`,
        });
        await getSaidWhen({ stub, count: 2 });

        // the mechanic reads its whole thread: the text out, the reply in
        const mechanicThread = runAs({
          serial: SERIAL_MECHANIC,
          skill: 'phone.text',
          args: 'get',
        });
        return {
          sent,
          alias,
          foremanThread,
          replied,
          mechanicThread,
          said: stub.getAllSaid(),
        };
      });

      then('the send returns at once, QUEUED, with the repeat dropped', () => {
        expect(result.sent.exitCode).toEqual(0);
        expect(result.alias).not.toBeNull();
        expect(result.sent.output).toContain('status: QUEUED');
        expect(result.sent.output).toContain(
          '1 repeated --to dropped; each peer gets one text',
        );
      });

      then('the foreman is said the text once, signed, with the reply command', () => {
        expect(result.said[0]!.to).toEqual('foreman');
        expect(result.said[0]!.what).toContain(`text ${result.alias} from`);
        expect(result.said[0]!.what).toContain("it's 'lesson.slot', not 'slot'");
        expect(result.said[0]!.what).toContain(`--re ${result.alias}`);
        expect(result.said.filter((one) => one.to === 'foreman')).toHaveLength(1);
      });

      then("the foreman's thread holds the text in, DELIVERED", () => {
        expect(result.foremanThread.exitCode).toEqual(0);
        expect(result.foremanThread.output).toContain(result.alias!);
        expect(result.foremanThread.output).toContain('DELIVERED');
      });

      then('the reply is said to the mechanic, linked to the text it answers', () => {
        expect(result.replied.exitCode).toEqual(0);
        expect(result.said[1]!.to).toEqual('mechanic');
        expect(result.said[1]!.what).toContain(`(re ${result.alias})`);
        expect(result.said[1]!.what).toContain('got it; slot renamed');
      });

      then("the mechanic's thread holds the text out and the reply in", () => {
        expect(result.mechanicThread.exitCode).toEqual(0);
        expect(result.mechanicThread.output).toContain(`re ${result.alias}`);
        expect(
          result.mechanicThread.output.match(/DELIVERED/g) ?? [],
        ).toHaveLength(2);
      });

      then('every output and every said message matches its snapshot', () => {
        expect(
          [
            result.sent.stdout,
            result.foremanThread.stdout,
            result.replied.stdout,
            result.mechanicThread.stdout,
            ...result.said.map((one) => one.what),
          ]
            .map((output) =>
              asMaskedOfTextRefs({
                output: asMaskedOfTree({
                  output: sanitizeOutput(output),
                  repoDir: scene.repoDir,
                }),
              }),
            )
            .join('\n---\n'),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case10] a director tree and a crew tree on one grove, on a stub rhachet', () => {
    // two consumer repos, each a tree, found where the crew verbs put trees: <gitRoot>/<org>/<tree>
    const trees = useBeforeAll(async () => {
      const crew = genConsumerRepo({ prefix: 'phone-crew', branchName: 'main' });
      const director = genConsumerRepo({ prefix: 'phone-director', branchName: 'main' });
      const gitRoot = genTempDir({ slug: 'phone-git-root' });
      fs.mkdirSync(path.join(gitRoot, 'sandpine'), { recursive: true });
      for (const repoDir of [crew.repoDir, director.repoDir])
        fs.symlinkSync(repoDir, path.join(gitRoot, 'sandpine', basename(repoDir)));
      return {
        gitRoot,
        crewDir: crew.repoDir,
        crewTree: basename(crew.repoDir),
        directorDir: director.repoDir,
        directorTree: basename(director.repoDir),
      };
    });

    // the stub keys each roster by the tree its call ran in, as rhachet does
    const stub = useBeforeAll(async () =>
      genRhachetStubBin({
        slug: 'phone-stub-rhachet-cross',
        rosters: {
          [trees.crewTree]: [{ serial: SERIAL_MECHANIC, slug: 'mechanic' }],
          [trees.directorTree]: [{ serial: SERIAL_DIRECTOR, slug: 'director' }],
        },
      }),
    );

    const runIn = (input: {
      repoDir: string;
      serial: string;
      skill: string;
      args: string;
      isHuman?: boolean;
      stdin?: string;
    }) =>
      runRhachetSkill({
        repo: 'bhuild',
        role: 'dispatcher',
        skill: input.skill,
        args: input.args,
        repoDir: input.repoDir,
        env: {
          ...stub.env,
          PHONE_GROVE: 'bert-laptop',
          PHONE_GIT_ROOT: trees.gitRoot,
          RHACHET_CLONE_SERIAL: input.serial,
          __I_AM_HUMAN: input.isHuman ? 'true' : '',
        },
        stdin: input.stdin,
        timeout: 90000,
      });
    const asDirector = (args: string, options?: { isHuman?: boolean }) =>
      runIn({
        repoDir: trees.directorDir,
        serial: SERIAL_DIRECTOR,
        skill: args.split(' ')[0]!,
        args: args.split(' ').slice(1).join(' '),
        isHuman: options?.isHuman,
      });

    // each tree's daemon was started by the journey; stop both, however the journey ends
    afterAll(() => {
      runIn({ repoDir: trees.directorDir, serial: SERIAL_DIRECTOR, skill: 'phone.daemon', args: 'del' });
      runIn({ repoDir: trees.crewDir, serial: SERIAL_MECHANIC, skill: 'phone.daemon', args: 'del' });
    });

    when('[t0] the director is granted the crew mechanic, texts it, is answered, then revokes it', () => {
      const result = useThen('each step settles as expected', async () => {
        const mechanic = `phone://grove=local/tree=${trees.crewTree}/clone=mechanic`;
        const director = `phone://grove=bert-laptop/tree=${trees.directorTree}/clone=director`;

        // the director clone may not grant its own contact while its tree meter is blocked
        const grantByClone = asDirector(`phone.contacts set --address ${mechanic}`);

        // a human grants it, and the director reads it back
        const grantByHuman = asDirector(`phone.contacts set --address ${mechanic}`, {
          isHuman: true,
        });
        const contactsGranted = asDirector('phone.contacts get');

        // a text with no words is refused, and names the pipe
        const blank = asDirector(`phone.text set --to ${mechanic} --what ''`);

        // a text whose words lead with -- is a text, never a flag
        const sent = runIn({
          repoDir: trees.directorDir,
          serial: SERIAL_DIRECTOR,
          skill: 'phone.text',
          args: `set --to ${mechanic} --what '--apply is blocked on book-a-lesson; can you look?'`,
        });
        const alias = sent.output.match(/text: ([0-9a-f]{8})/)?.[1] ?? null;
        await getSaidWhen({ stub, count: 1 });

        // the mechanic, in its own tree, replies to the director it has no contact for
        const replied = runIn({
          repoDir: trees.crewDir,
          serial: SERIAL_MECHANIC,
          skill: 'phone.text',
          args: `set --to ${director} --re ${alias} --what @stdin`,
          stdin: 'on it; the slot shape changed',
        });
        await getSaidWhen({ stub, count: 2 });
        const directorThread = asDirector('phone.text get');

        // a human revokes the contact, twice: the second is a no-op
        const revoked = asDirector(`phone.contacts del --address ${mechanic}`, { isHuman: true });
        const revokedAgain = asDirector(`phone.contacts del --address ${mechanic}`, {
          isHuman: true,
        });
        const contactsRevoked = asDirector('phone.contacts get');

        // the `in` copy of each text lands in its peer's tree, under the peer's seat (F24)
        const asInCopies = (input: { treeDir: string; seat: string }) =>
          fs
            .readdirSync(
              path.join(
                input.treeDir,
                '.agent/.cache/repo=bhuild/role=dispatcher/skill=phone.text',
                `clone=${input.seat}`,
              ),
            )
            .filter((name) => name.endsWith('.in.json'));
        return {
          grantByClone,
          grantByHuman,
          contactsGranted,
          blank,
          sent,
          alias,
          replied,
          directorThread,
          revoked,
          revokedAgain,
          contactsRevoked,
          inCrew: asInCopies({ treeDir: trees.crewDir, seat: 'mechanic' }),
          inDirector: asInCopies({ treeDir: trees.directorDir, seat: 'director' }),
          said: stub.getAllSaid(),
          listed: stub.getAllListed(),
        };
      });

      then('a clone may not grant its own contact while its meter is blocked', () => {
        expect(result.grantByClone.exitCode).toEqual(2);
        expect(result.grantByClone.output).toContain('phone.contacts.uses');
      });

      then('a human grants it, and get shows it', () => {
        expect(result.grantByHuman.exitCode).toEqual(0);
        expect(result.contactsGranted.exitCode).toEqual(0);
        expect(result.contactsGranted.output).toContain(
          `tree=${trees.crewTree}/clone=mechanic`,
        );
      });

      then('a text with no words exits 2 and names the pipe', () => {
        expect(result.blank.exitCode).toEqual(2);
        expect(result.blank.output).toContain('@stdin');
        expect(result.blank.output).not.toContain('input invalid');
      });

      then('a text whose words lead with -- is sent, QUEUED', () => {
        expect(result.sent.exitCode).toEqual(0);
        expect(result.sent.output).toContain('status: QUEUED');
      });

      then('the director tree daemon says it in the crew tree, never its own', () => {
        expect(result.said[0]!.to).toEqual('mechanic');
        expect(result.said[0]!.cwd).toEqual(trees.crewTree);
        expect(result.said[0]!.what).toContain('--apply is blocked on book-a-lesson');
        expect(result.listed.map((one) => one.cwd)).toContain(trees.crewTree);
      });

      then('the reply needs no contact, and is said in the director tree', () => {
        expect(result.replied.exitCode).toEqual(0);
        expect(result.said[1]!.to).toEqual('director');
        expect(result.said[1]!.cwd).toEqual(trees.directorTree);
        expect(result.said[1]!.what).toContain(`(re ${result.alias})`);
      });

      then('each `in` copy lands in its peer tree', () => {
        expect(result.inCrew).toHaveLength(1);
        expect(result.inDirector).toHaveLength(1);
        expect(result.directorThread.output.match(/DELIVERED/g) ?? []).toHaveLength(2);
      });

      then('a human revokes it, and a second revoke is a no-op', () => {
        expect(result.revoked.exitCode).toEqual(0);
        expect(result.revokedAgain.exitCode).toEqual(0);
        const [sectionContacts, sectionTextedYou] =
          result.contactsRevoked.output.split('texted you');
        expect(sectionContacts).not.toContain(`tree=${trees.crewTree}/clone=mechanic`);
        expect(sectionContacts).toContain('grant one: rhx phone.contacts set');

        // the mechanic texted the director, so the director may still answer it
        expect(sectionTextedYou).toContain(`tree=${trees.crewTree}/clone=mechanic`);
      });

      then('every output and every said message matches its snapshot', () => {
        expect(
          [
            result.grantByClone.output,
            result.grantByHuman.stdout,
            result.contactsGranted.stdout,
            result.blank.output,
            result.sent.stdout,
            result.replied.stdout,
            result.directorThread.stdout,
            result.revoked.stdout,
            result.revokedAgain.stdout,
            result.contactsRevoked.stdout,
            ...result.said.map((one) => one.what),
          ]
            .map((output) =>
              asMaskedOfTextRefs({
                output: sanitizeOutput(output)
                  .split(trees.crewTree)
                  .join('$TREE_CREW')
                  .split(trees.directorTree)
                  .join('$TREE_DIRECTOR'),
              }),
            )
            .join('\n---\n'),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case11] a foreman at a modal, then one whose say cannot be confirmed, on a stub rhachet', () => {
    // a tree of its own, so its daemon never shares a mailbox with another journey's
    const repo = useBeforeAll(async () =>
      genConsumerRepo({ prefix: 'phone-skills-sharp', branchName: 'main' }),
    );
    const rosterOf = (input: { foremanSay: 'withheld' | 'unconfirmed' | null }) => ({
      [basename(repo.repoDir)]: [
        { serial: SERIAL_MECHANIC, slug: 'mechanic' },
        {
          serial: SERIAL_FOREMAN,
          slug: 'foreman',
          ...(input.foremanSay ? { say: input.foremanSay } : {}),
        },
      ],
    });
    const stub = useBeforeAll(async () =>
      genRhachetStubBin({
        slug: 'phone-stub-rhachet-sharp',
        rosters: rosterOf({ foremanSay: 'withheld' }),
      }),
    );
    const runAs = (input: { skill: string; args: string; isHuman?: boolean }) =>
      runRhachetSkill({
        repo: 'bhuild',
        role: 'dispatcher',
        skill: input.skill,
        args: input.args,
        repoDir: repo.repoDir,
        env: {
          ...stub.env,
          PHONE_GROVE: 'bert-laptop',
          RHACHET_CLONE_SERIAL: SERIAL_MECHANIC,
          __I_AM_HUMAN: input.isHuman ? 'true' : '',
        },
        timeout: 90000,
      });

    // the journey starts its own daemon on the stub; stop it, however the journey ends
    afterAll(() => runAs({ skill: 'phone.daemon', args: 'del' }));

    when('[t0] the mechanic texts the foreman while it sits at a modal, then the modal clears', () => {
      const result = useThen('the text waits with its reason, then lands once', async () => {
        const sent = runAs({ skill: 'phone.text', args: "set --to @:foreman --what 'is the swell up?'" });
        await getWithheldWhen({ stub, count: 1 });
        const threadHeld = await getThreadWhen({
          run: () => runAs({ skill: 'phone.text', args: 'get' }),
          has: 'peer at a modal',
        });

        // the modal clears; the next tick says it
        stub.setRosters(rosterOf({ foremanSay: null }));
        await getSaidWhen({ stub, count: 1 });
        const threadLanded = await getThreadWhen({
          run: () => runAs({ skill: 'phone.text', args: 'get' }),
          has: 'DELIVERED',
        });
        return { sent, threadHeld, threadLanded, said: stub.getAllSaid() };
      });

      then('the text waits QUEUED, the reason named in the thread', () => {
        expect(result.sent.exitCode).toEqual(0);
        expect(result.threadHeld.output).toContain('QUEUED');
        expect(result.threadHeld.output).toContain('peer at a modal');
      });

      then('once the modal clears, it is said once and reads DELIVERED', () => {
        expect(result.said.filter((one) => one.to === 'foreman')).toHaveLength(1);
        expect(result.threadLanded.output).toContain('DELIVERED');
        expect(result.threadLanded.output).not.toContain('peer at a modal');
      });
    });

    when('[t1] the mechanic texts the foreman, and the say cannot be confirmed', () => {
      const result = useThen('the text settles FAULTED, and the mechanic hears of it', async () => {
        stub.setRosters(rosterOf({ foremanSay: 'unconfirmed' }));
        const sent = runAs({ skill: 'phone.text', args: "set --to @:foreman --what 'board count?'" });
        await getSaidWhen({ stub, count: 3 });
        const thread = await getThreadWhen({
          run: () => runAs({ skill: 'phone.text', args: 'get' }),
          has: 'FAULTED',
        });
        return { sent, thread, said: stub.getAllSaid() };
      });

      then('the text reads FAULTED, with the verdict that could not confirm it', () => {
        expect(result.sent.exitCode).toEqual(0);
        expect(result.thread.output).toContain('FAULTED');
        expect(result.thread.output).toContain('unconfirmed: no echo seen');
      });

      then('it is said once, never resaid, and the notice is said to the mechanic', () => {
        expect(result.said.filter((one) => one.to === 'foreman')).toHaveLength(2);
        expect(result.said[2]!.to).toEqual('mechanic');
      });

      then('the thread and the notice match their snapshot', () => {
        expect(
          [result.thread.stdout, result.said[2]!.what]
            .map((output) =>
              asMaskedOfTextRefs({
                output: asMaskedOfTree({ output: sanitizeOutput(output), repoDir: repo.repoDir }),
              }),
            )
            .join('\n---\n'),
        ).toMatchSnapshot();
      });
    });

    when('[t2] a flag is passed bare, and --address repeats on a revoke', () => {
      const result = useThen('each bare flag is refused, and each address is revoked once', async () => {
        const crew = 'phone://grove=local/tree=svc-lessons.beav.feat-book-a-lesson';
        const bareTo = runAs({ skill: 'phone.text', args: 'set --to --what hi' });
        const bareText = runAs({ skill: 'phone.text', args: 'get --text' });
        const bareAddress = runAs({ skill: 'phone.contacts', args: 'set --address' });
        const revoked = runAs({
          skill: 'phone.contacts',
          args: `del --address ${crew}/clone=foreman --address ${crew}/clone=foreman --address ${crew}/clone=mechanic`,
          isHuman: true,
        });
        return { bareTo, bareText, bareAddress, revoked };
      });

      then('a bare --to, --text, or --address exits 2 with the usage', () => {
        expect(result.bareTo.exitCode).toEqual(2);
        expect(result.bareTo.output).toContain('a text must name a peer');
        expect(result.bareText.exitCode).toEqual(2);
        expect(result.bareText.output).toContain('needs --text');
        expect(result.bareAddress.exitCode).toEqual(2);
        expect(result.bareAddress.output).toContain('needs --address');
      });

      then('a repeated --address acts on each address once', () => {
        expect(result.revoked.exitCode).toEqual(0);
        expect(result.revoked.stdout.match(/💧 phone\.contacts del/g) ?? []).toHaveLength(2);
        expect(result.revoked.stdout.match(/clone=foreman\n/g) ?? []).toHaveLength(1);
        expect(result.revoked.stdout.match(/clone=mechanic\n/g) ?? []).toHaveLength(1);
        expect(result.revoked.stdout.match(/not a contact:/g) ?? []).toHaveLength(2);
      });

      then('the refusals and revokes match their snapshot', () => {
        expect(
          [result.bareTo.output, result.bareText.output, result.bareAddress.output, result.revoked.stdout]
            .map((output) =>
              asMaskedOfTree({ output: sanitizeOutput(output), repoDir: repo.repoDir }),
            )
            .join('\n---\n'),
        ).toMatchSnapshot();
      });
    });
  });
});

/**
 * .what = waits until the stub has withheld at least `count` says, or fails loud
 */
const getWithheldWhen = async (input: {
  stub: ReturnType<typeof genRhachetStubBin>;
  count: number;
}): Promise<void> => {
  for (let attempt = 0; attempt < 120; attempt++) {
    if (input.stub.getAllWithheld().length >= input.count) return;
    await new Promise((done) => setTimeout(done, 500));
  }
  throw new Error(`the stub withheld ${input.stub.getAllWithheld().length} says, not ${input.count}, within 60s`);
};

/**
 * .what = reads the thread until it holds `has`, or fails loud
 * .why = the daemon writes a reason or a settle on its own tick, a moment after the stub saw it
 */
const getThreadWhen = async (input: {
  run: () => ReturnType<typeof runRhachetSkill>;
  has: string;
}): Promise<ReturnType<typeof runRhachetSkill>> => {
  for (let attempt = 0; attempt < 60; attempt++) {
    const thread = input.run();
    if (thread.output.includes(input.has)) return thread;
    await new Promise((done) => setTimeout(done, 1000));
  }
  throw new Error(`the thread never read '${input.has}' within 60s`);
};

const SERIAL_MECHANIC = '4c1e8b27-9f0a-4d3b-8e61-2a7c5d90f314';
const SERIAL_FOREMAN = 'd03e6f91-5b2c-4a87-9e14-7f60c3a8b2d5';
const SERIAL_DIRECTOR = '0d1e2c3f-6a7b-4c8d-9e0f-1a2b3c4d5e6f';

/**
 * .what = waits until the stub has taken at least `count` says, or fails loud
 * .why = the daemon delivers on its own tick; the journey reads the stub's file, never a clock
 */
const getSaidWhen = async (input: {
  stub: ReturnType<typeof genRhachetStubBin>;
  count: number;
}): Promise<void> => {
  for (let attempt = 0; attempt < 120; attempt++) {
    if (input.stub.getAllSaid().length >= input.count) return;
    await new Promise((done) => setTimeout(done, 500));
  }
  throw new Error(
    `the stub took ${input.stub.getAllSaid().length} says, not ${input.count}, within 60s`,
  );
};

/**
 * .what = the output with the temp tree name masked as $TREE
 * .why = the tree is the temp repo's dir name, which carries a clock stamp
 */
const asMaskedOfTree = (input: { output: string; repoDir: string }): string =>
  input.output.split(basename(input.repoDir)).join('$TREE');

/**
 * .what = the output with each text's eight-hex alias masked
 * .why = a text's uuid is minted fresh on each run
 */
const asMaskedOfTextRefs = (input: { output: string }): string =>
  input.output.replace(/\b[0-9a-f]{8}\b/g, '<text>');

/**
 * .what = the pid a phone.daemon output names, or null
 */
const asPid = (output: string): string | null => output.match(/pid: (\d+)/)?.[1] ?? null;

/**
 * .what = the output with the temp repo dir masked as $REPO
 * .why = the temp dir name carries a clock stamp, so an unmasked path churns every snapshot
 * .note = keyed on the dir's unique name, since git prints the real path and the test may
 *         hold one reached through a link
 */
const asMaskedOfRepoDir = (input: { output: string; repoDir: string }): string =>
  input.output.replace(
    new RegExp(`\\S*/${basename(input.repoDir).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'),
    '$REPO',
  );
