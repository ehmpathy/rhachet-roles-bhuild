import { spawnSync } from 'child_process';
import fs from 'fs';
import { homedir, hostname } from 'os';
import path, { basename } from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  genConsumerRepo,
  genRhachetStubBin,
  type RhachetStubClone,
  type runRhachetSkill,
  sanitizeOutput,
  type SkillResult,
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
/**
 * .what = each journey's time budget: ten minutes
 * .why = a journey chains up to ten skill runs and a few daemon waits; each run loads the built
 *        package in a fresh node, which takes ~2s on an idle ci runner and 10–15s on a loaded
 *        grove (measured 2026-10-23). a 90s budget for the whole journey timed out there with
 *        no assertion failed, so the budget is sized to the sum of its steps, not the fast case
 */
jest.setTimeout(600_000);

/**
 * .what = every run this suite made, with both streams kept apart
 * .why = the shared harness drops stderr on a success and joins the two on a failure, so it can
 *        not see which stream a line lands on; a caller who reads `$(rhx phone.text get)` or
 *        drops `2>/dev/null` depends on it, so the last case checks the stream contract over all
 */
const RUNS_ALL: { skill: string; args: string; result: SkillResult }[] = [];

/**
 * .what = runs a phone skill as a consumer runs it, and keeps stdout and stderr apart on every exit
 * .note = `output` keeps the shared harness's shape (stdout on exit 0, both streams joined on a
 *         refusal), so the snapshots read as a terminal shows them (F28)
 */
const runPhoneCli = (
  input: Parameters<typeof runRhachetSkill>[0],
): SkillResult => {
  const args = input.args ? `-- ${input.args}` : '';
  const ran = spawnSync(
    `npx rhachet run --repo ${input.repo} --role ${input.role} --skill ${input.skill} ${args}`,
    {
      cwd: input.repoDir,
      shell: true,
      timeout: input.timeout ?? 60000,
      env: { ...process.env, ...input.env },
      input: input.stdin ?? '',
    },
  );
  const stdout = (ran.stdout ?? '').toString().trim();
  const stderr = (ran.stderr ?? '').toString().trim();
  const exitCode = ran.status ?? 1;
  const result: SkillResult = {
    stdout,
    stderr,
    output: exitCode === 0 ? stdout : [stdout, stderr].filter(Boolean).join('\n'),
    exitCode,
  };
  RUNS_ALL.push({ skill: input.skill, args: input.args ?? '', result });
  return result;
};

const runPhoneSkill = (input: {
  repoDir: string;
  skill: string;
  args: string;
  env?: Record<string, string | undefined>;
}) =>
  runPhoneCli({
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
        expect(result.output).toContain('run it from a clone: rhx enroll claude --as @:<slug>');
      });

      then('a phone.text refusal never pitches the contacts meter', () => {
        expect(result.output).not.toContain('phone.contacts.uses');
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
        expect(result.stdout).toContain("the text's name");
        expect(result.stdout).toContain('its uuid: the first 8 chars (7f3e9a02) or the whole');
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

    when('[t2] a human re-runs each verb, then the meter file is corrupt, then a human repairs it', () => {
      const result = useThen('each re-run is a no-op, the corrupt meter fails loud, and its cure works', async () => {
        const blockAgain = run('block', { __I_AM_HUMAN: 'true' });
        const allowOnce = run('allow', { __I_AM_HUMAN: 'true' });
        const allowAgain = run('allow', { __I_AM_HUMAN: 'true' });
        const meterPath = path.join(scene.repoDir, '.meter', 'phone.contacts.uses.jsonc');
        fs.writeFileSync(meterPath, '{ "state": "ajar" }\n');
        const corrupt = run('get');
        const repaired = run('block', { __I_AM_HUMAN: 'true' });
        const afterRepair = run('get');
        return { blockAgain, allowOnce, allowAgain, corrupt, repaired, afterRepair };
      });

      then('a re-run of block or allow exits 0 and names the state unchanged', () => {
        expect(result.blockAgain.exitCode).toEqual(0);
        expect(result.blockAgain.output).toContain('state: blocked (unchanged)');
        expect(result.allowAgain.exitCode).toEqual(0);
        expect(result.allowAgain.output).toContain('state: allowed (unchanged)');
      });

      then('a corrupt meter fails loud as a malfunction, exit 1, and names its path', () => {
        expect(result.corrupt.exitCode).toEqual(1);
        expect(result.corrupt.output).toContain('MalfunctionError');
        expect(result.corrupt.output).toContain('phone.contacts.uses meter has an unknown shape');
        expect(result.corrupt.output).toContain('phone.contacts.uses.jsonc');
        expect(result.corrupt.output).toContain('rhx phone.contacts.uses block');
      });

      then('the cure it names repairs it: a human block overwrites the corrupt meter', () => {
        expect(result.repaired.exitCode).toEqual(0);
        expect(result.repaired.output).toContain('state: unreadable → blocked');
        expect(result.afterRepair.exitCode).toEqual(0);
        expect(result.afterRepair.output).toContain('state: blocked');
      });

      then('each step matches its snapshot', () => {
        expect(
          asMaskedOfStackFrames({
            output: asMaskedOfRepoDir({
              output: asSnapOfSteps([
                result.blockAgain,
                result.allowOnce,
                result.allowAgain,
                result.corrupt,
                result.repaired,
                result.afterRepair,
              ]),
              repoDir: scene.repoDir,
            }),
          }),
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

      then('the set, get, del, and DOWN get outputs match their snapshots', () => {
        expect(
          [
            result.started.stdout,
            result.again.stdout,
            result.live.stdout,
            result.stopped.stdout,
            result.down.stdout,
          ]
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

      then('a grant or revoke refusal names how a human lifts the meter for a clone', () => {
        for (const step of [result.set, result.del]) {
          expect(step.output).toContain('a human holds no mailbox');
          expect(step.output).toContain('lift it: rhx phone.contacts.uses allow');
        }
      });

      then('a read refusal never pitches the meter, which governs a change alone', () => {
        expect(result.get.output).not.toContain('phone.contacts.uses');
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

    when('[t1] each runs with a typo, with -h, and with no verb', () => {
      const skills = ['phone.text', 'phone.contacts', 'phone.contacts.uses', 'phone.daemon'];
      const result = useThen('each settles as expected', async () => {
        const run = (skill: string, args: string) =>
          runPhoneSkill({ repoDir: scene.repoDir, skill, args });
        return {
          typos: [run('phone.contacts', 'add'), run('phone.contacts.uses', 'lift')],
          helps: skills.map((skill) => run(skill, '--help')),
          shorts: skills.map((skill) => run(skill, '-h')),
          bares: skills.map((skill) => run(skill, '')),
        };
      });

      then('a typo exits 2 and names the verb it does not know', () => {
        expect(result.typos[0]!.exitCode).toEqual(2);
        expect(result.typos[0]!.output).toContain("phone.contacts has no verb 'add'");
        expect(result.typos[1]!.exitCode).toEqual(2);
        expect(result.typos[1]!.output).toContain("phone.contacts.uses has no verb 'lift'");
      });

      then('-h and a bare call each print the --help usage, exit 0', () => {
        for (const [index, help] of result.helps.entries()) {
          expect(result.shorts[index]!.exitCode).toEqual(0);
          expect(result.shorts[index]!.stdout).toEqual(help.stdout);
          expect(result.bares[index]!.exitCode).toEqual(0);
          expect(result.bares[index]!.stdout).toEqual(help.stdout);
        }
      });

      then('the typo refusals match their snapshot', () => {
        expect(asSnapOfSteps(result.typos)).toMatchSnapshot();
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
      runPhoneCli({
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
        expect(result.said[0]!.what).toContain('\n💧 reply\n');
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
          asSnapOfStepsWithTextRefs({
            outputs: [
              result.sent.stdout,
              result.foremanThread.stdout,
              result.replied.stdout,
              result.mechanicThread.stdout,
              ...result.said.map((one) => one.what),
            ].map((output) =>
              asMaskedOfTree({
                output: sanitizeOutput(output),
                repoDir: scene.repoDir,
              }),
            ),
          }),
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

      // a grove registry that knows one other grove, as `rhx git.grove.list` would
      const forestDir = genTempDir({ slug: 'phone-git-forest' });
      fs.mkdirSync(path.join(forestDir, 'groves'), { recursive: true });
      fs.writeFileSync(path.join(forestDir, 'groves', `${GROVE_OTHER}.json`), '{}\n');
      return {
        gitRoot,
        forestDir,
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
          [trees.crewTree]: [
            { serial: SERIAL_MECHANIC, slug: 'mechanic' },
            { serial: SERIAL_FOREMAN, slug: 'foreman' },
          ],
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
      runPhoneCli({
        repo: 'bhuild',
        role: 'dispatcher',
        skill: input.skill,
        args: input.args,
        repoDir: input.repoDir,
        env: {
          ...stub.env,
          PHONE_GROVE: 'bert-laptop',
          PHONE_GIT_ROOT: trees.gitRoot,
          GIT_FOREST_DIR: trees.forestDir,
          RHACHET_CLONE_SERIAL: input.serial,
          __I_AM_HUMAN: input.isHuman ? 'true' : '',
        },
        stdin: input.stdin,
        timeout: 90000,
      });
    const asDirector = (
      args: string,
      options?: { isHuman?: boolean; stdin?: string },
    ) =>
      runIn({
        repoDir: trees.directorDir,
        serial: SERIAL_DIRECTOR,
        skill: args.split(' ')[0]!,
        args: args.split(' ').slice(1).join(' '),
        isHuman: options?.isHuman,
        stdin: options?.stdin,
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
          asSnapOfStepsWithTextRefs({
            outputs: [
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
            ].map((output) =>
              sanitizeOutput(output)
                .split(trees.crewTree)
                .join('$TREE_CREW')
                .split(trees.directorTree)
                .join('$TREE_DIRECTOR'),
            ),
          }),
        ).toMatchSnapshot();
      });
    });

    when('[t1] a human lifts the director tree meter; the director grants, groups, revokes, and is refused', () => {
      const result = useThen('each step settles as expected', async () => {
        const mechanic = `phone://grove=local/tree=${trees.crewTree}/clone=mechanic`;
        const foreman = `phone://grove=local/tree=${trees.crewTree}/clone=foreman`;
        const asOutCount = () =>
          fs
            .readdirSync(
              path.join(
                trees.directorDir,
                '.agent/.cache/repo=bhuild/role=dispatcher/skill=phone.text/clone=director',
              ),
            )
            .filter((name) => name.endsWith('.out.json')).length;
        const saidBefore = stub.getAllSaid().length;

        // a human lifts the meter; the director clone then grants its own contact
        const meterLifted = asDirector('phone.contacts.uses allow', { isHuman: true });
        const grantedByClone = asDirector(`phone.contacts set --address ${foreman}`);

        // a group of two distinct peers: the mechanic texted first, the foreman is a contact
        const grouped = asDirector(
          `phone.text set --to ${mechanic} --to ${foreman} --what 'boards are in'`,
        );
        const groupAlias = grouped.output.match(/([0-9a-f]{8}) → /)?.[1] ?? null;
        await getSaidWhen({ stub, count: saidBefore + 2 });

        // the director clone revokes its own contact
        const revokedByClone = asDirector(`phone.contacts del --address ${foreman}`);

        // a stranger, and a group with one stranger in it: refused whole, naught queued
        const outBefore = asOutCount();
        const toStranger = asDirector(`phone.text set --to ${foreman} --what 'hello?'`);
        const toGroupWithStranger = asDirector(
          `phone.text set --to ${mechanic} --to ${foreman} --what 'all hands'`,
        );
        // a text to its own address, and a text too large for a session: refused, naught queued
        const toSelf = asDirector("phone.text set --to @:director --what 'note to self'");
        const tooLarge = asDirector('phone.text set --to @:director --what @stdin', {
          stdin: 'a'.repeat(8001),
        });

        // an address with its keys out of order, and one whose clone value does not parse
        const toBackwards = asDirector(
          `phone.text set --to phone://tree=${trees.crewTree}/grove=local/clone=mechanic --what 'surf?'`,
        );
        const toMalformed = asDirector(
          `phone.text set --to phone://grove=local/tree=${trees.crewTree}/clone=@:mechanic --what 'surf?'`,
        );

        // a reply flag passed bare, and one that names no text in this mailbox
        const reBare = asDirector(`phone.text set --to ${mechanic} --what 'got it' --re`);
        const reUnknown = asDirector(
          `phone.text set --to ${mechanic} --what 'got it' --re deadbeef`,
        );
        const outAfter = asOutCount();

        // a peer on a grove the registry knows, and on one it does not
        const toOtherGrove = asDirector(
          `phone.text set --to phone://grove=${GROVE_OTHER}/tree=svc-lessons/clone=mechanic --what 'surf?'`,
        );
        const toUnknownGrove = asDirector(
          "phone.text set --to phone://grove=grove-nope/tree=svc-lessons/clone=mechanic --what 'surf?'",
        );

        // a grant to a tree that is not on this grove
        const grantToAbsentTree = asDirector(
          'phone.contacts set --address phone://grove=local/tree=svc-wetsuit-stock/clone=mechanic',
        );

        // a grant of two, the second to a tree not on this grove: each address converges alone
        // (F27), so the first is granted and the second refused, exit 2; a rerun converges
        const grantMixed = asDirector(
          `phone.contacts set --address ${foreman} --address phone://grove=local/tree=svc-wetsuit-stock/clone=mechanic`,
        );
        const contactsAfterMixed = asDirector('phone.contacts get');
        const revokedAfterMixed = asDirector(`phone.contacts del --address ${foreman}`);

        // a text to a clone this tree does not hold: QUEUED, then REFUSED, and the sender hears
        const toGhost = asDirector("phone.text set --to @:ghost --what 'anyone there?'");
        await getSaidWhen({ stub, count: saidBefore + 3 });
        const threadAfterGhost = await getThreadWhen({
          run: () => asDirector('phone.text get'),
          has: 'REFUSED',
        });

        // a text named by number, by an alias no text holds, and a withdraw of a DELIVERED one
        const refByNumber = asDirector('phone.text get --text 3');
        const refUnknown = asDirector('phone.text get --text deadbeef');
        const delDelivered = asDirector(`phone.text del --text ${groupAlias}`);
        return {
          meterLifted,
          grantedByClone,
          grouped,
          groupAlias,
          revokedByClone,
          toStranger,
          toGroupWithStranger,
          toSelf,
          tooLarge,
          toBackwards,
          toMalformed,
          reBare,
          reUnknown,
          outBefore,
          outAfter,
          toOtherGrove,
          toUnknownGrove,
          grantToAbsentTree,
          grantMixed,
          contactsAfterMixed,
          revokedAfterMixed,
          toGhost,
          threadAfterGhost,
          refByNumber,
          refUnknown,
          delDelivered,
          said: stub.getAllSaid().slice(saidBefore),
        };
      });

      then('with the meter lifted by a human, the clone grants and revokes its own contact', () => {
        expect(result.meterLifted.exitCode).toEqual(0);
        expect(result.grantedByClone.exitCode).toEqual(0);
        expect(result.grantedByClone.output).toContain('granted:');
        expect(result.revokedByClone.exitCode).toEqual(0);
        expect(result.revokedByClone.output).toContain('revoked:');
      });

      then('a group of two distinct peers is said once to each, in the crew tree', () => {
        expect(result.grouped.exitCode).toEqual(0);
        expect(result.grouped.output).toContain('group: 2 peers');
        expect(result.groupAlias).not.toBeNull();
        const saidGroup = result.said.filter((one) => one.what.includes('boards are in'));
        expect(saidGroup.map((one) => one.to).sort()).toEqual(['foreman', 'mechanic']);
        expect(saidGroup.every((one) => one.cwd === trees.crewTree)).toEqual(true);
      });

      then('a stranger is refused, exit 2, and the refusal names the grant', () => {
        expect(result.toStranger.exitCode).toEqual(2);
        expect(result.toStranger.output).toContain('🦫 bummer, no such contact');
        expect(result.toStranger.output).toContain('rhx phone.contacts set --address');
      });

      then('with the meter lifted, the refusal names only the grant still owed', () => {
        expect(result.toStranger.output).toContain('grant it, as this clone:');
        expect(result.toStranger.output).not.toContain('rhx phone.contacts.uses allow');
      });

      then('a group with one stranger is refused whole, and naught is queued', () => {
        expect(result.toGroupWithStranger.exitCode).toEqual(2);
        expect(result.toGroupWithStranger.output).toContain('is not a contact');
        expect(result.outAfter).toEqual(result.outBefore);
      });

      then('the group refusal says naught was sent; a lone refusal never names a group', () => {
        expect(result.toGroupWithStranger.output).toContain(
          'naught was sent: a group of 2 is refused whole',
        );
        expect(result.toStranger.output).not.toContain('group of');
      });

      then('a grant of two with one refused grants the other, then exits 2 on the refused one', () => {
        expect(result.grantMixed.exitCode).toEqual(2);
        expect(result.grantMixed.stdout).toContain('granted:');
        expect(result.grantMixed.stdout).toContain('clone=foreman');
        expect(result.grantMixed.stderr).toContain('no tree svc-wetsuit-stock');
        expect(result.contactsAfterMixed.stdout).toContain(`tree=${trees.crewTree}/clone=foreman`);
        expect(result.revokedAfterMixed.exitCode).toEqual(0);
      });

      then('a text to its own address is refused, exit 2', () => {
        expect(result.toSelf.exitCode).toEqual(2);
        expect(result.toSelf.output).toContain('🦫 bummer, that is your own number');
      });

      then('a text too large for a session is refused, exit 2, and names the bound', () => {
        expect(result.tooLarge.exitCode).toEqual(2);
        expect(result.tooLarge.output).toContain('🦫 whoa, that text is a whole dam');
        expect(result.tooLarge.output).toContain('at most 8000 chars; this one holds 8001');
      });

      then('an address out of order is refused, exit 2, and prints the canonical form', () => {
        expect(result.toBackwards.exitCode).toEqual(2);
        expect(result.toBackwards.output).toContain('🦫 bummer, that address reads backwards');
        expect(result.toBackwards.output).toContain(
          'the keys come in one order: grove, tree, clone',
        );
        expect(result.toBackwards.output).toContain(`/tree=${trees.crewTree}/clone=mechanic`);
      });

      then('a bare --re is refused as bare, exit 2, never sent unlinked', () => {
        expect(result.reBare.exitCode).toEqual(2);
        expect(result.reBare.output).toContain('--re takes a value: the uuid of the text it answers');
        expect(result.reBare.output).not.toContain('needs --re');
      });

      then('a --re that names no text is refused, exit 2, and naught is queued', () => {
        expect(result.reUnknown.exitCode).toEqual(2);
        expect(result.reUnknown.output).toContain('no text deadbeef in this mailbox');
        expect(result.outAfter).toEqual(result.outBefore);
      });

      then('an address whose clone value does not parse is refused, exit 2, with the fault', () => {
        expect(result.toMalformed.exitCode).toEqual(2);
        expect(result.toMalformed.output).toContain('🦫 bummer, that address does not parse');
        expect(result.toMalformed.output).toContain('the clone key takes a bare name');
      });

      then('a peer on a known grove is refused, exit 2: no river there yet', () => {
        expect(result.toOtherGrove.exitCode).toEqual(2);
        expect(result.toOtherGrove.output).toContain('🦫 bummer, no river to that grove yet');
      });

      then('a peer on an unknown grove is refused, exit 2, and names the grove list', () => {
        expect(result.toUnknownGrove.exitCode).toEqual(2);
        expect(result.toUnknownGrove.output).toContain('no grove grove-nope is known');
        expect(result.toUnknownGrove.output).toContain('rhx git.grove.list');
      });

      then('a grant to a tree not on this grove is refused, exit 2', () => {
        expect(result.grantToAbsentTree.exitCode).toEqual(2);
        expect(result.grantToAbsentTree.output).toContain('no tree svc-wetsuit-stock');
      });

      then('a text to a clone the tree does not hold settles REFUSED, and the sender hears of it', () => {
        expect(result.toGhost.exitCode).toEqual(0);
        expect(result.threadAfterGhost.output).toContain('REFUSED');
        const notice = result.said.find((one) => one.what.includes('was REFUSED'));
        expect(notice?.to).toEqual('director');
        expect(notice?.cwd).toEqual(trees.directorTree);
      });

      then('a text ref by number, by an unknown alias, or a withdraw of a said text, is refused', () => {
        expect(result.refByNumber.exitCode).toEqual(2);
        expect(result.refByNumber.output).toContain('3 is not a text reference');
        expect(result.refUnknown.exitCode).toEqual(2);
        expect(result.refUnknown.output).toContain('no text deadbeef in this mailbox');
        expect(result.delDelivered.exitCode).toEqual(2);
        expect(result.delDelivered.output).toContain('was already DELIVERED');
      });

      then('every output and the notice match their snapshot', () => {
        expect(
          asSnapOfStepsWithTextRefs({
            outputs: [
              result.meterLifted.stdout,
              result.grantedByClone.stdout,
              result.grouped.stdout,
              result.revokedByClone.stdout,
              result.toStranger.output,
              result.toGroupWithStranger.output,
              result.toSelf.output,
              result.tooLarge.output,
              result.toBackwards.output,
              result.toMalformed.output,
              result.reBare.output,
              result.reUnknown.output,
              result.toOtherGrove.output,
              result.toUnknownGrove.output,
              result.grantToAbsentTree.output,
              result.grantMixed.output,
              result.toGhost.stdout,
              result.threadAfterGhost.stdout,
              result.refByNumber.output,
              result.refUnknown.output,
              result.delDelivered.output,
              ...result.said
                .filter((one) => one.what.includes('was REFUSED'))
                .map((one) => one.what),
            ].map((output) =>
              sanitizeOutput(output)
                .split(trees.crewTree)
                .join('$TREE_CREW')
                .split(trees.directorTree)
                .join('$TREE_DIRECTOR')
                .split(trees.gitRoot)
                .join('$GIT_ROOT'),
            ),
          }),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case11] a foreman at a modal, then one whose say cannot be confirmed, on a stub rhachet', () => {
    // a tree of its own, so its daemon never shares a mailbox with another journey's
    const repo = useBeforeAll(async () =>
      genConsumerRepo({ prefix: 'phone-skills-sharp', branchName: 'main' }),
    );
    const rosterOf = (input: {
      foremanSay: 'withheld' | 'unconfirmed' | null;
      foremanSerial?: string;
      foremanSayReason?: RhachetStubClone['sayReason'];
    }) => ({
      [basename(repo.repoDir)]: [
        { serial: SERIAL_MECHANIC, slug: 'mechanic' },
        {
          serial: input.foremanSerial ?? SERIAL_FOREMAN,
          slug: 'foreman',
          ...(input.foremanSay ? { say: input.foremanSay } : {}),
          ...(input.foremanSayReason ? { sayReason: input.foremanSayReason } : {}),
        },
        { serial: SERIAL_REFLECTOR, slug: 'reflector' },
      ],
    });
    const stub = useBeforeAll(async () =>
      genRhachetStubBin({
        slug: 'phone-stub-rhachet-sharp',
        rosters: rosterOf({ foremanSay: 'withheld' }),
      }),
    );
    const runAs = (input: {
      skill: string;
      args: string;
      isHuman?: boolean;
      serial?: string;
    }) =>
      runPhoneCli({
        repo: 'bhuild',
        role: 'dispatcher',
        skill: input.skill,
        args: input.args,
        repoDir: repo.repoDir,
        env: {
          ...stub.env,
          PHONE_GROVE: 'bert-laptop',
          RHACHET_CLONE_SERIAL: input.serial ?? SERIAL_MECHANIC,
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

      then('the send, both threads, and the said text match their snapshot', () => {
        expect(
          asSnapOfStepsWithTextRefs({
            outputs: [
              result.sent.stdout,
              result.threadHeld.stdout,
              result.threadLanded.stdout,
              result.said[0]!.what,
            ].map((output) =>
              asMaskedOfTree({ output: sanitizeOutput(output), repoDir: repo.repoDir }),
            ),
          }),
        ).toMatchSnapshot();
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
          asSnapOfStepsWithTextRefs({
            outputs: [result.thread.stdout, result.said[2]!.what].map((output) =>
              asMaskedOfTree({ output: sanitizeOutput(output), repoDir: repo.repoDir }),
            ),
          }),
        ).toMatchSnapshot();
      });
    });

    when('[t2] a flag is passed bare, and --address repeats on a revoke', () => {
      const result = useThen('each bare flag is refused, and each address is revoked once', async () => {
        const crew = `phone://grove=local/tree=${basename(repo.repoDir)}`;
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
        expect(result.bareAddress.exitCode).toEqual(2);
      });

      then('a bare --text or --address is named as bare, never as absent', () => {
        expect(result.bareText.output).toContain("--text takes a value: the text's uuid");
        expect(result.bareText.output).not.toContain('needs --text');
        expect(result.bareAddress.output).toContain('--address takes a value: a peer address');
        expect(result.bareAddress.output).not.toContain('needs --address');
      });

      then('a repeated --address acts on each address once, and names the drop', () => {
        expect(result.revoked.exitCode).toEqual(0);
        expect(result.revoked.stdout.match(/💧 phone\.contacts del/g) ?? []).toHaveLength(2);
        expect(result.revoked.stdout.match(/clone=foreman\n/g) ?? []).toHaveLength(1);
        expect(result.revoked.stdout.match(/clone=mechanic\n/g) ?? []).toHaveLength(1);
        expect(result.revoked.stdout.match(/not a contact:/g) ?? []).toHaveLength(2);
        expect(result.revoked.stdout).toContain(
          '1 repeated --address dropped; each peer is one revoke',
        );
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

    when('[t3] the mechanic texts the foreman at a modal, reads the text by name, then withdraws it', () => {
      const result = useThen('the text is read QUEUED by its alias, then withdrawn, never said', async () => {
        stub.setRosters(rosterOf({ foremanSay: 'withheld' }));
        const sent = runAs({ skill: 'phone.text', args: "set --to @:foreman --what 'wetsuit count?'" });
        const alias = sent.output.match(/text: ([0-9a-f]{8})/)?.[1] ?? null;
        const readHeld = await getThreadWhen({
          run: () => runAs({ skill: 'phone.text', args: `get --text ${alias}` }),
          has: 'peer at a modal',
        });
        // the whole uuid names the same text as its alias; read it off the mailbox record
        const uuid = getAllMailboxRecords({ repoDir: repo.repoDir, seat: 'mechanic' }).find(
          (one) => one.record.uuid?.startsWith(alias ?? '-'),
        )?.record.uuid;
        const readHeldWhole = runAs({ skill: 'phone.text', args: `get --text ${uuid}` });
        const withdrawn = await getWithdrawnWhen({
          run: () => runAs({ skill: 'phone.text', args: `del --text ${alias}` }),
        });
        const withdrawnAgain = runAs({ skill: 'phone.text', args: `del --text ${uuid}` });
        const readWithdrawn = runAs({ skill: 'phone.text', args: `get --text ${alias}` });

        // the modal clears; a later text lands, and the withdrawn one, sent first, must not have
        const saidBefore = stub.getAllSaid().length;
        stub.setRosters(rosterOf({ foremanSay: null }));
        runAs({ skill: 'phone.text', args: "set --to @:foreman --what 'never mind, found them'" });
        await getSaidWhen({ stub, count: saidBefore + 1 });
        return {
          sent,
          alias,
          uuid,
          readHeld,
          readHeldWhole,
          withdrawn,
          withdrawnAgain,
          readWithdrawn,
          said: stub.getAllSaid(),
        };
      });

      then('the send names the text by its alias', () => {
        expect(result.sent.exitCode).toEqual(0);
        expect(result.alias).not.toBeNull();
      });

      then('get --text reads that one text, QUEUED, with its reason', () => {
        expect(result.readHeld.exitCode).toEqual(0);
        expect(result.readHeld.output).toContain(result.alias!);
        expect(result.readHeld.output).toContain('QUEUED');
        expect(result.readHeld.output).toContain('peer at a modal');
      });

      then('get --text with the whole uuid reads the same text as its alias', () => {
        expect(result.uuid).toMatch(/^[0-9a-f]{8}-/);
        expect(result.readHeldWhole.exitCode).toEqual(0);
        expect(result.readHeldWhole.stdout).toEqual(result.readHeld.stdout);
      });

      then('del --text withdraws it, and a second del, by the whole uuid, is a no-op', () => {
        expect(result.withdrawn.exitCode).toEqual(0);
        expect(result.withdrawn.output).toContain('status: QUEUED → WITHDRAWN (never said)');
        expect(result.withdrawnAgain.exitCode).toEqual(0);
        expect(result.withdrawnAgain.output).toContain('status: WITHDRAWN (no change)');
      });

      then('get --text then reads it WITHDRAWN', () => {
        expect(result.readWithdrawn.exitCode).toEqual(0);
        expect(result.readWithdrawn.output).toContain('WITHDRAWN');
      });

      then('the withdrawn text is never said, though a later text lands once the modal clears', () => {
        expect(result.said.some((one) => one.what.includes('never mind, found them'))).toEqual(true);
        expect(result.said.filter((one) => one.what.includes(result.alias!))).toHaveLength(0);
      });

      then('each step matches its snapshot', () => {
        expect(
          asSnapOfStepsWithTextRefs({
            outputs: [
              result.sent.stdout,
              result.readHeld.stdout,
              result.withdrawn.stdout,
              result.withdrawnAgain.stdout,
              result.readWithdrawn.stdout,
            ].map((output) =>
              asMaskedOfTree({ output: sanitizeOutput(output), repoDir: repo.repoDir }),
            ),
          }),
        ).toMatchSnapshot();
      });
    });

    when('[t4] the foreman is revived under a new serial, then texted again', () => {
      const result = useThen('the revived foreman keeps its seat', async () => {
        const threadBefore = runAs({ skill: 'phone.text', args: 'get', serial: SERIAL_FOREMAN });
        stub.setRosters(rosterOf({ foremanSay: null, foremanSerial: SERIAL_FOREMAN_REVIVED }));
        const threadAfter = runAs({
          skill: 'phone.text',
          args: 'get',
          serial: SERIAL_FOREMAN_REVIVED,
        });
        const saidBefore = stub.getAllSaid().length;
        const sent = runAs({ skill: 'phone.text', args: "set --to @:foreman --what 'welcome back'" });
        await getSaidWhen({ stub, count: saidBefore + 1 });
        // a clone no text has reached, and a serial the roster does not hold
        const threadEmpty = runAs({ skill: 'phone.text', args: 'get', serial: SERIAL_REFLECTOR });
        const threadOffRoster = runAs({ skill: 'phone.text', args: 'get', serial: SERIAL_FOREMAN });
        return {
          threadBefore,
          threadAfter,
          sent,
          threadEmpty,
          threadOffRoster,
          said: stub.getAllSaid().slice(saidBefore),
        };
      });

      then('a clone no text has reached reads an empty thread, exit 0', () => {
        expect(result.threadEmpty.exitCode).toEqual(0);
        expect(result.threadEmpty.output).toContain('🦫 the pond is still');
      });

      then('the retired serial, now off the roster, is refused, exit 2', () => {
        expect(result.threadOffRoster.exitCode).toEqual(2);
        expect(result.threadOffRoster.output).toContain(
          '🦫 bummer, this clone is not on the roster here',
        );
        expect(result.threadOffRoster.output).toContain(`no clone with serial ${SERIAL_FOREMAN}`);
        expect(result.threadOffRoster.output).toContain('run the phone from the clone itself');
      });

      then('the empty thread and the off-roster refusal match their snapshot', () => {
        expect(
          [result.threadEmpty.output, result.threadOffRoster.output]
            .map((output) =>
              asMaskedOfTree({ output: sanitizeOutput(output), repoDir: repo.repoDir }),
            )
            .join('\n---\n'),
        ).toMatchSnapshot();
      });

      then('the revived foreman reads the same thread its prior serial held', () => {
        expect(result.threadBefore.exitCode).toEqual(0);
        expect(result.threadBefore.output).toContain('mechanic');
        expect(result.threadAfter.exitCode).toEqual(0);
        expect(result.threadAfter.stdout).toEqual(result.threadBefore.stdout);
      });

      then('a text to the same slug lands on the revived foreman', () => {
        expect(result.sent.exitCode).toEqual(0);
        const said = result.said.find((one) => one.what.includes('welcome back'));
        expect(said?.to).toEqual('foreman');
      });

      then('the revived thread, the send, and the said text match their snapshot', () => {
        expect(
          asSnapOfStepsWithTextRefs({
            outputs: [
              result.threadAfter.stdout,
              result.sent.stdout,
              result.said.find((one) => one.what.includes('welcome back'))!.what,
            ].map((output) =>
              asMaskedOfTree({ output: sanitizeOutput(output), repoDir: repo.repoDir }),
            ),
          }),
        ).toMatchSnapshot();
      });
    });

    when('[t5] the daemon is stopped with a text QUEUED, then a crashed lock is left behind', () => {
      const result = useThen('the text waits while the daemon is down, then lands once', async () => {
        const daemon = (args: string) => runAs({ skill: 'phone.daemon', args, isHuman: true });

        // a text the foreman cannot take yet, seen by the daemon
        stub.setRosters(rosterOf({ foremanSay: 'withheld', foremanSerial: SERIAL_FOREMAN_REVIVED }));
        const withheldBefore = stub.getAllWithheld().length;
        const sent = runAs({ skill: 'phone.text', args: "set --to @:foreman --what 'tide is out'" });
        await getWithheldWhen({ stub, count: withheldBefore + 1 });

        // the daemon is stopped, read, and stopped again
        const stopped = daemon('del');
        const down = daemon('get');
        const stoppedAgain = daemon('del');

        // the modal clears, yet no daemon swims to say it: the text waits QUEUED
        const saidBefore = stub.getAllSaid().length;
        stub.setRosters(rosterOf({ foremanSay: null, foremanSerial: SERIAL_FOREMAN_REVIVED }));
        await new Promise((done) => setTimeout(done, 5000));
        const threadWaits = runAs({ skill: 'phone.text', args: 'get' });
        const saidWhileDown = stub.getAllSaid().length - saidBefore;

        // a daemon that crashed leaves its lock, with a pid no process holds
        const pidDead = spawnSync(process.execPath, ['-e', '0']).pid;
        fs.writeFileSync(
          path.join(
            repo.repoDir,
            '.agent/.cache/repo=bhuild/role=dispatcher/skill=phone.daemon/daemon.lock',
          ),
          `${pidDead}\nprotocol: 1\n`,
        );
        const downStale = daemon('get');

        // a start reclaims the stale lock, and the next tick says the text
        const restarted = daemon('set');
        await getSaidWhen({ stub, count: saidBefore + 1 });
        const threadLanded = await getThreadWhen({
          run: () => runAs({ skill: 'phone.text', args: 'get' }),
          has: 'DELIVERED',
        });
        return {
          sent,
          stopped,
          down,
          stoppedAgain,
          threadWaits,
          saidWhileDown,
          downStale,
          restarted,
          threadLanded,
          said: stub.getAllSaid().slice(saidBefore),
        };
      });

      then('the send is QUEUED, and the daemon stops on del', () => {
        expect(result.sent.exitCode).toEqual(0);
        expect(result.stopped.exitCode).toEqual(0);
        expect(result.stopped.output).toContain('the daemon climbs out');
      });

      then('get then reads DOWN, and a second del is a no-op', () => {
        expect(result.down.output).toContain('state: DOWN');
        expect(result.stoppedAgain.exitCode).toEqual(0);
        expect(result.stoppedAgain.output).toContain('the daemon already rests');
      });

      then('while it is down, the text waits QUEUED, never said, and the thread says why', () => {
        expect(result.saidWhileDown).toEqual(0);
        expect(result.threadWaits.output).toContain('QUEUED');
        expect(result.threadWaits.output).toContain('daemon: DOWN — the QUEUED texts wait for it');
      });

      then('a lock left by a crashed daemon reads DOWN, never LIVE', () => {
        expect(result.downStale.output).toContain('state: DOWN');
      });

      then('a start reclaims the crashed lock, and the text then lands once', () => {
        expect(result.restarted.exitCode).toEqual(0);
        expect(result.restarted.output).toContain('the daemon dives in');
        expect(result.said.filter((one) => one.what.includes('tide is out'))).toHaveLength(1);
        expect(result.threadLanded.output).toContain('DELIVERED');
      });

      then('each step matches its snapshot', () => {
        expect(
          asSnapOfStepsWithTextRefs({
            outputs: [
              result.sent.stdout,
              result.stopped.stdout,
              result.down.stdout,
              result.stoppedAgain.stdout,
              result.threadWaits.stdout,
              result.downStale.stdout,
              result.restarted.stdout,
              result.threadLanded.stdout,
            ].map((output) =>
              asMaskedOfTree({
                output: asMaskedOfRepoDir({ output: sanitizeOutput(output), repoDir: repo.repoDir }),
                repoDir: repo.repoDir,
              }).replace(/pid: \d+/g, 'pid: <pid>'),
            ),
          }),
        ).toMatchSnapshot();
      });
    });

    when('[t6] the roster shows one clone DEAF and one DEAD, then each is granted or texted', () => {
      const result = useThen('the contacts read names each reach state', async () => {
        const tree = basename(repo.repoDir);
        stub.setRosters({
          [tree]: [
            { serial: SERIAL_MECHANIC, slug: 'mechanic' },
            { serial: SERIAL_FOREMAN_REVIVED, slug: 'foreman' },
            { serial: SERIAL_REFLECTOR, slug: 'reflector', reachState: 'DEAF' },
            { serial: SERIAL_SHAPER, slug: 'shaper', reachState: 'DEAD' },
          ],
        });
        const granted = runAs({
          skill: 'phone.contacts',
          args: `set --address phone://grove=local/tree=${tree}/clone=reflector`,
          isHuman: true,
        });
        const contacts = runAs({ skill: 'phone.contacts', args: 'get' });

        // a text to the DEAD clone waits with its reason, and no say is spent on it
        const toDead = runAs({ skill: 'phone.text', args: "set --to @:shaper --what 'fins?'" });
        const threadDead = await getThreadWhen({
          run: () => runAs({ skill: 'phone.text', args: 'get' }),
          has: 'peer clone is DEAD',
        });
        return {
          granted,
          contacts,
          toDead,
          threadDead,
          saidToDead: stub.getAllSaid().filter((one) => one.to === 'shaper'),
        };
      });

      then('the send to the DEAD clone promises a carry, never a delivery, and names where to look', () => {
        expect(result.toDead.exitCode).toEqual(0);
        expect(result.toDead.stdout).toContain('status: QUEUED → the daemon carries it');
        expect(result.toDead.stdout).toContain('rhx phone.text get');
        expect(result.toDead.stdout).not.toContain('delivers');
      });

      then('a text to the DEAD clone waits QUEUED with its reason, never said', () => {
        expect(result.toDead.exitCode).toEqual(0);
        expect(result.threadDead.output).toContain('QUEUED');
        expect(result.threadDead.output).toContain('peer clone is DEAD');
        expect(result.saidToDead).toEqual([]);
      });

      then('a grant to a clone in its own tree is refused, exit 2: it is already in reach', () => {
        expect(result.granted.exitCode).toEqual(2);
        expect(result.granted.output).toContain('🦫 no need, that one is already in your pond');
        expect(result.granted.output).toContain("is in this clone's own tree");
      });

      then('the DEAF clone reads DEAF in its own-tree row', () => {
        expect(result.contacts.exitCode).toEqual(0);
        expect(result.contacts.output).toMatch(/@:reflector\s+\(DEAF\)/);
      });

      then('the DEAD clone folds into a count, never a row', () => {
        expect(result.contacts.output).toContain('+ 1 DEAD, not shown');
        expect(result.contacts.output).not.toContain('@:shaper');
      });

      then('the grant refusal, the contacts read, the DEAD send, and its wait match their snapshot', () => {
        expect(
          asSnapOfStepsWithTextRefs({
            outputs: [
              result.granted.output,
              result.contacts.stdout,
              result.toDead.stdout,
              result.threadDead.stdout,
            ].map((output) =>
              asMaskedOfTree({ output: sanitizeOutput(output), repoDir: repo.repoDir }),
            ),
          }),
        ).toMatchSnapshot();
      });
    });

    when('[t7] a mailbox record no reader can parse, then two texts that share an alias', () => {
      const result = useThen('the thread names the bad record, and the alias is refused', async () => {
        const mailboxDir = asMailboxDir({ repoDir: repo.repoDir, seat: 'mechanic' });

        // a record no reader can parse, as a torn write or a hand edit leaves it
        const pathTorn = path.join(mailboxDir, 'text.9999.out.json');
        fs.writeFileSync(pathTorn, '{"uuid": "torn');
        const threadTorn = runAs({ skill: 'phone.text', args: 'get' });
        fs.rmSync(pathTorn);

        // two settled texts, the second forged to lead with the first one's alias
        const [first, second] = getAllMailboxRecords({ repoDir: repo.repoDir, seat: 'mechanic' })
          .filter((one) => one.record.status === 'DELIVERED')
          .slice(0, 2);
        const alias = first!.record.uuid.slice(0, 8);
        const bytesSecond = fs.readFileSync(second!.path, 'utf8');
        fs.writeFileSync(
          second!.path,
          JSON.stringify({ ...second!.record, uuid: `${alias}${second!.record.uuid.slice(8)}` }),
        );
        const readShared = runAs({ skill: 'phone.text', args: `get --text ${alias}` });
        fs.writeFileSync(second!.path, bytesSecond);
        return { threadTorn, readShared, alias };
      });

      then('the thread still reads, exit 0, and names the record it could not parse', () => {
        expect(result.threadTorn.exitCode).toEqual(0);
        expect(result.threadTorn.stdout).toContain('text.9999.out.json');
        expect(result.threadTorn.stdout).toContain('DELIVERED');
      });

      then('an alias two texts share is refused, exit 2, and both are listed by whole uuid', () => {
        expect(result.readShared.exitCode).toEqual(2);
        expect(result.readShared.output).toContain('🦫 bummer, two fish answer to that name');
        expect(result.readShared.output).toContain(`${result.alias} matches 2 texts in this mailbox`);
      });

      then('the torn thread and the shared-alias refusal match their snapshot', () => {
        expect(
          asSnapOfStepsWithTextRefs({
            outputs: [result.threadTorn.stdout, result.readShared.output].map((output) =>
              asMaskedOfUuids({
                output: asMaskedOfTree({ output: sanitizeOutput(output), repoDir: repo.repoDir }),
              }),
            ),
          }),
        ).toMatchSnapshot();
      });
    });

    when('[t8] the foreman holds typed text in its input box, then shows a screen rhachet can not read', () => {
      const result = useThen('the text waits with each reason in turn, then lands once', async () => {
        // the DEAD shaper stays on the roster, so its text from [t6] waits, never refused here
        const tree = basename(repo.repoDir);
        const roster = (sayReason: RhachetStubClone['sayReason'] | null) => ({
          [tree]: [
            ...rosterOf({
              foremanSay: sayReason ? 'withheld' : null,
              foremanSerial: SERIAL_FOREMAN_REVIVED,
              foremanSayReason: sayReason ?? undefined,
            })[tree]!,
            { serial: SERIAL_SHAPER, slug: 'shaper', reachState: 'DEAD' as const },
          ],
        });
        stub.setRosters(roster('input-region-dirty'));
        const sent = runAs({ skill: 'phone.text', args: "set --to @:foreman --what 'wax on the rack?'" });
        const threadDirty = await getThreadWhen({
          run: () => runAs({ skill: 'phone.text', args: 'get' }),
          has: 'peer input box holds typed text',
        });
        stub.setRosters(roster('focus-unrecognized'));
        const threadUnread = await getThreadWhen({
          run: () => runAs({ skill: 'phone.text', args: 'get' }),
          has: 'peer not at its prompt (mid-turn, or an unrecognized screen)',
        });
        const saidBefore = stub.getAllSaid().length;
        stub.setRosters(roster(null));
        await getSaidWhen({ stub, count: saidBefore + 1 });
        return {
          sent,
          threadDirty,
          threadUnread,
          said: stub.getAllSaid().slice(saidBefore),
        };
      });

      then('the text waits QUEUED, the typed-text reason named', () => {
        expect(result.sent.exitCode).toEqual(0);
        expect(result.threadDirty.stdout).toContain('QUEUED · peer input box holds typed text');
      });

      then('the text waits QUEUED, the unread-screen reason named', () => {
        expect(result.threadUnread.stdout).toContain('QUEUED · peer not at its prompt (mid-turn, or an unrecognized screen)');
      });

      then('once the foreman can take it, it is said once', () => {
        expect(result.said.filter((one) => one.what.includes('wax on the rack?'))).toHaveLength(1);
      });

      then('both waits match their snapshot', () => {
        expect(
          asSnapOfStepsWithTextRefs({
            outputs: [result.threadDirty.stdout, result.threadUnread.stdout].map((output) =>
              asMaskedOfTree({ output: sanitizeOutput(output), repoDir: repo.repoDir }),
            ),
          }),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case12] a director and a crew tree found by the shipped defaults alone, on a stub rhachet', () => {
    // a home of its own: trees under ~/git, the grove registry at ~/.git.forest, and no phone env
    const home = useBeforeAll(async () => {
      const homeDir = genTempDir({ slug: 'phone-home' });
      const crew = genConsumerRepo({ prefix: 'phone-home-crew', branchName: 'main' });
      const director = genConsumerRepo({ prefix: 'phone-home-director', branchName: 'main' });
      fs.mkdirSync(path.join(homeDir, 'git', 'sandpine'), { recursive: true });
      for (const repoDir of [crew.repoDir, director.repoDir])
        fs.symlinkSync(repoDir, path.join(homeDir, 'git', 'sandpine', basename(repoDir)));
      fs.mkdirSync(path.join(homeDir, '.git.forest', 'groves'), { recursive: true });
      fs.writeFileSync(path.join(homeDir, '.git.forest', 'groves', `${GROVE_OTHER}.json`), '{}\n');
      return {
        homeDir,
        crewTree: basename(crew.repoDir),
        directorDir: director.repoDir,
        directorTree: basename(director.repoDir),
      };
    });
    const stub = useBeforeAll(async () =>
      genRhachetStubBin({
        slug: 'phone-stub-rhachet-home',
        rosters: {
          [home.crewTree]: [{ serial: SERIAL_MECHANIC, slug: 'mechanic' }],
          [home.directorTree]: [{ serial: SERIAL_DIRECTOR, slug: 'director' }],
        },
      }),
    );
    const asDirector = (args: string, options?: { isHuman?: boolean }) =>
      runPhoneCli({
        repo: 'bhuild',
        role: 'dispatcher',
        skill: args.split(' ')[0]!,
        args: args.split(' ').slice(1).join(' '),
        repoDir: home.directorDir,
        env: {
          ...stub.env,
          HOME: home.homeDir,
          // npx keeps its cache where the grove keeps it, so the temp home costs no fetch
          npm_config_cache: path.join(homedir(), '.npm'),
          PHONE_GROVE: '',
          PHONE_GIT_ROOT: '',
          CREWWORK_GIT_ROOT: '',
          GIT_FOREST_DIR: '',
          RHACHET_CLONE_SERIAL: SERIAL_DIRECTOR,
          __I_AM_HUMAN: options?.isHuman ? 'true' : '',
        },
        timeout: 90000,
      });

    // the journey starts the director tree's daemon; stop it, however the journey ends
    afterAll(() => asDirector('phone.daemon del'));

    when('[t0] a human grants a crew clone, the director texts it, then texts two other groves', () => {
      const result = useThen('each default is found where it ships', async () => {
        const mechanic = `phone://grove=local/tree=${home.crewTree}/clone=mechanic`;
        const granted = asDirector(`phone.contacts set --address ${mechanic}`, { isHuman: true });
        const sent = asDirector(`phone.text set --to ${mechanic} --what 'boards are waxed'`);
        await getSaidWhen({ stub, count: 1 });
        const toKnownGrove = asDirector(
          `phone.text set --to phone://grove=${GROVE_OTHER}/tree=svc-lessons/clone=mechanic --what 'surf?'`,
        );
        const toUnknownGrove = asDirector(
          "phone.text set --to phone://grove=grove-nope/tree=svc-lessons/clone=mechanic --what 'surf?'",
        );
        return { granted, sent, toKnownGrove, toUnknownGrove, said: stub.getAllSaid() };
      });

      then('the grove defaults to the hostname, and the tree is found under ~/git', () => {
        expect(result.granted.exitCode).toEqual(0);
        expect(result.granted.stdout).toContain(
          `granted: phone://grove=${hostname()}/tree=${home.crewTree}/clone=mechanic`,
        );
      });

      then('the text is said in the crew tree found under ~/git', () => {
        expect(result.sent.exitCode).toEqual(0);
        expect(result.said[0]!.to).toEqual('mechanic');
        expect(result.said[0]!.cwd).toEqual(home.crewTree);
      });

      then('a grove the registry at ~/.git.forest knows is refused as no river yet', () => {
        expect(result.toKnownGrove.exitCode).toEqual(2);
        expect(result.toKnownGrove.output).toContain('🦫 bummer, no river to that grove yet');
        expect(result.toKnownGrove.output).toContain(`this grove: ${hostname()}`);
      });

      then('a grove the registry does not know is refused, and names the grove list', () => {
        expect(result.toUnknownGrove.exitCode).toEqual(2);
        expect(result.toUnknownGrove.output).toContain('no grove grove-nope is known');
      });

      then('every output matches its snapshot', () => {
        expect(
          asSnapOfStepsWithTextRefs({
            outputs: [
              result.granted.stdout,
              result.sent.stdout,
              result.toKnownGrove.output,
              result.toUnknownGrove.output,
            ].map((output) =>
              sanitizeOutput(output)
                .split(hostname())
                .join('$GROVE')
                .split(home.crewTree)
                .join('$TREE_CREW')
                .split(home.directorTree)
                .join('$TREE_DIRECTOR')
                .split(home.homeDir)
                .join('$HOME'),
            ),
          }),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case13] every phone run this suite made', () => {
    when('[t0] the two streams of each run are read', () => {
      const result = useThen('each run is read', async () => ({ runs: [...RUNS_ALL] }));
      const asLabel = (run: (typeof RUNS_ALL)[number]) =>
        `${run.skill} ${run.args} (exit ${run.result.exitCode})`;
      const HEADER = /(✋ ConstraintError|💥 MalfunctionError):/;

      then('the suite ran both successes and refusals', () => {
        expect(result.runs.filter((run) => run.result.exitCode === 0).length).toBeGreaterThan(0);
        expect(result.runs.filter((run) => run.result.exitCode !== 0).length).toBeGreaterThan(0);
      });

      then('a run that exits 0 prints naught to stderr', () => {
        expect(
          result.runs
            .filter((run) => run.result.exitCode === 0 && run.result.stderr !== '')
            .map(asLabel),
        ).toEqual([]);
      });

      then('a run that fails prints its vibe and its header to stderr', () => {
        expect(
          result.runs
            .filter((run) => run.result.exitCode !== 0)
            .filter((run) => {
              // the raw stream holds the color codes a terminal reads; read it as a human sees it
              const stderr = sanitizeOutput(run.result.stderr);
              return !/^🦫 /m.test(stderr) || !HEADER.test(stderr);
            })
            .map(asLabel),
        ).toEqual([]);
      });

      then('a run that fails prints no error header to stdout', () => {
        expect(
          result.runs
            .filter((run) => run.result.exitCode !== 0 && HEADER.test(run.result.stdout))
            .map(asLabel),
        ).toEqual([]);
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

/**
 * .what = runs a withdraw until the daemon is not mid-say on the text, or fails loud
 * .why = a held text is retried each tick; while that say is in flight the daemon holds a claim,
 *        and a withdraw then is refused by design (S38). on a loaded grove the say takes longer,
 *        so a blind withdraw can land inside it. only that one refusal is waited out
 */
const getWithdrawnWhen = async (input: {
  run: () => ReturnType<typeof runRhachetSkill>;
}): Promise<ReturnType<typeof runRhachetSkill>> => {
  for (let attempt = 0; attempt < 60; attempt++) {
    const withdrawn = input.run();
    if (!withdrawn.output.includes('is mid-say right now')) return withdrawn;
    await new Promise((done) => setTimeout(done, 250));
  }
  throw new Error('the daemon stayed mid-say on the text for 15s');
};

const SERIAL_MECHANIC = '4c1e8b27-9f0a-4d3b-8e61-2a7c5d90f314';
const SERIAL_FOREMAN = 'd03e6f91-5b2c-4a87-9e14-7f60c3a8b2d5';
const SERIAL_FOREMAN_REVIVED = '7b9d2e40-1c3f-4a5e-8d6b-0f2a4c6e8a10';
const SERIAL_REFLECTOR = '5e8a1c93-2d4b-4f6a-9c0e-3b7d5f9a1e24';
const SERIAL_SHAPER = '9a4c2e71-3f5b-4d8e-a1c6-7e0b9d3f5a82';
const SERIAL_DIRECTOR = '0d1e2c3f-6a7b-4c8d-9e0f-1a2b3c4d5e6f';
const GROVE_OTHER = 'grove-sandpine-v20260901';

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
 * .what = the outputs of several steps, joined into one snapshot body, with each text's eight-hex
 *         alias masked by its first position across the whole body: <text01>, <text02>, …
 * .why = a text's uuid is minted fresh on each run; a positional mask keeps two texts apart, and
 *        since it spans every step, a reply's `re <textNN>` visibly links to the text it answers
 * .note = a mask is eight chars, as wide as the alias it hides, so the columns the render pads
 *         stay aligned; numbers follow first appearance in the body, so a thread listed after
 *         its sends reads them out of order
 * .note = a fixed eight-hex word is no minted alias, so it stays as typed: the example a refusal
 *         prints, and the unknown alias a journey asks for
 */
const ALIASES_FIXED = ['7f3e9a02', 'deadbeef'];
const asSnapOfStepsWithTextRefs = (input: { outputs: string[] }): string => {
  const body = input.outputs.join('\n---\n');
  const aliasesSeen = [...new Set(body.match(/\b[0-9a-f]{8}\b/g) ?? [])].filter(
    (alias) => !ALIASES_FIXED.includes(alias),
  );
  return aliasesSeen.reduce(
    (masked, alias, index) =>
      masked.split(alias).join(`<text${String(index + 1).padStart(2, '0')}>`),
    body,
  );
};

/**
 * .what = the output with each stack frame line collapsed to one `at <frame>` line
 * .why = a malfunction prints its stack, whose frames name the absolute path of the build that
 *        ran it; the frames differ per grove and per release, so a snapshot keeps only that they
 *        were printed
 */
const asMaskedOfStackFrames = (input: { output: string }): string =>
  input.output.replace(/(\n {4}at [^\n]*)+/g, '\n    at <frame>');

/**
 * .what = the dir that holds one seat's mailbox, in a tree
 */
const asMailboxDir = (input: { repoDir: string; seat: string }): string =>
  path.join(
    input.repoDir,
    '.agent/.cache/repo=bhuild/role=dispatcher/skill=phone.text',
    `clone=${input.seat}`,
  );

/**
 * .what = every `out` record in one seat's mailbox, in file order, each with its path
 * .why = a journey that forges a record, or names a text by its whole uuid, reads the file the
 *        phone wrote, never a value it guesses
 */
const getAllMailboxRecords = (input: {
  repoDir: string;
  seat: string;
}): { path: string; record: { uuid: string; status: string } }[] => {
  const dir = asMailboxDir(input);
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.out.json'))
    .sort()
    .map((name) => ({
      path: path.join(dir, name),
      record: JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')),
    }));
};

/**
 * .what = the output with each whole uuid's tail masked; its eight-hex head stays for the alias mask
 * .why = a refusal that lists texts by whole uuid churns per run; the head shows which alias each
 *        answers to
 */
const asMaskedOfUuids = (input: { output: string }): string =>
  input.output.replace(
    /\b([0-9a-f]{8})-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/g,
    '$1-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  );

/**
 * .what = the pid a phone.daemon output names, or null
 */
const asPid = (output: string): string | null => output.match(/pid: (\d+)/)?.[1] ?? null;

/**
 * .what = the output with the temp repo dir masked as $REPO
 * .why = the temp dir name carries a clock stamp, so an unmasked path churns every snapshot
 * .note = keyed on the dir's unique name, since git prints the real path and the test may
 *         hold one reached through a link; the prefix stops at a quote, so a quoted path keeps it
 */
const asMaskedOfRepoDir = (input: { output: string; repoDir: string }): string =>
  input.output.replace(
    new RegExp(`[^\\s"']*/${basename(input.repoDir).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'),
    '$REPO',
  );
