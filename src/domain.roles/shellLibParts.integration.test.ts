/**
 * .what = clamps that every shell lib cut into PARTS still loads WHOLE
 *
 * .why  = 🔴 a lib too large for one reviewer's window is cut into parts
 *         (crewwork.sh → crewwork.heal.sh, crewwork.ledger.sh, …) and the core
 *         loads them from one declared list. that list is the new seam, and it
 *         fails in ways no behavior clamp would name:
 *
 *         | the drift | what a caller meets |
 *         |---|---|
 *         | a part on disk, absent from the list | its functions never load — `command not found`, far from the cause |
 *         | a part in the list, absent from disk | the loader refuses — the case this file proves is LOUD |
 *         | a function defined in two parts | the later source wins, silently, by load order |
 *         | a part that RUNS code at source time | a half-built lib acts before the core is in place |
 *
 *         ⇒ each row is a property of the text and the load, never of a verb's
 *           behavior, so a behavior suite goes green over all four.
 *
 * .how  = static reads for the set claims, and a real `bash` source for the
 *         load claims — the load is the subject, so the load is what runs.
 *
 * .note = it reads the filesystem and spawns bash, so it is an integration test
 *         (rule.forbid.unit.remote-boundaries).
 */
import { spawnSync } from 'child_process';
import { copyFileSync, readdirSync, readFileSync } from 'fs';
import { basename, dirname, join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getAllFilesRecursive } from './.test/getAllFilesRecursive';
import { getShellLibParts } from './.test/getShellLibWhole';
import { tempDirs } from './.test/tempDirs';

const DIR_ROLES = __dirname;

/** .what = the measured count of libs cut into parts, as a RATCHET floor */
const QUANT_LIBS_WITH_PARTS = 3;

/** .what = every function a shell text DEFINES, by name, in file order */
const getAllShellFnNames = (input: { text: string }): string[] =>
  input.text
    .split('\n')
    .map((line) => /^([A-Za-z_][A-Za-z0-9_.:-]*)\(\) *\{/.exec(line)?.[1])
    .filter((name): name is string => !!name);

/** .what = run a bash body, with the arm every entrypoint gives a lib */
const runBash = (input: { body: string }) => {
  const run = spawnSync('bash', ['-c', `set -uo pipefail\n${input.body}`], {
    encoding: 'utf8',
    timeout: 30_000,
  });
  return {
    stdout: run.stdout ?? '',
    stderr: run.stderr ?? '',
    exit: run.status ?? 1,
  };
};

describe('shellLibParts', () => {
  afterAll(() => tempDirs.delAll());

  const scene = useBeforeAll(async () => {
    const libs = getAllFilesRecursive({ dir: DIR_ROLES })
      .filter((path) => path.endsWith('.sh') && !path.includes('/.test/'))
      .filter((path) => getShellLibParts({ path }).length > 0)
      .map((path) => {
        const base = basename(path, '.sh');
        const parts = getShellLibParts({ path });
        const onDisk = readdirSync(dirname(path))
          .filter((f) => f.startsWith(`${base}.`) && f.endsWith('.sh'))
          .filter((f) => !f.endsWith('.test.sh') && f !== basename(path))
          .map((f) => join(dirname(path), f))
          .sort();
        const fnsByFile = [path, ...parts].map((file) => ({
          file,
          fns: getAllShellFnNames({ text: readFileSync(file, 'utf8') }),
        }));
        return { path, parts, onDisk, fnsByFile };
      });
    return { libs };
  });

  given('[case1] every lib that declares parts', () => {
    when('[t0] the libs are found', () => {
      // ANTI-VACUITY: a walk that found none would pass every claim below
      then('the subject exists — at least the measured count', () => {
        expect(scene.libs.length).toBeGreaterThanOrEqual(QUANT_LIBS_WITH_PARTS);
      });
    });

    when('[t1] its declared parts are compared to the files on disk', () => {
      then('🔴 the list and the disk hold the same set', () => {
        expect(
          scene.libs.map(({ path, parts, onDisk }) => ({
            lib: basename(path),
            declared: [...parts].sort().map((p) => basename(p)),
            onDisk: onDisk.map((p) => basename(p)),
          })),
        ).toEqual(
          scene.libs.map(({ path, onDisk }) => ({
            lib: basename(path),
            declared: onDisk.map((p) => basename(p)),
            onDisk: onDisk.map((p) => basename(p)),
          })),
        );
      });
    });

    when('[t2] every function is traced to the file that defines it', () => {
      then('🔴 no function is defined in two files', () => {
        const doubled = scene.libs.flatMap(({ fnsByFile }) => {
          const all = fnsByFile.flatMap(({ file, fns }) =>
            fns.map((fn) => ({ fn, file: basename(file) })),
          );
          return all.filter(
            ({ fn }, i) => all.findIndex((other) => other.fn === fn) !== i,
          );
        });
        expect(doubled).toEqual([]);
      });
    });

    when('[t3] each part is parsed and sourced ALONE', () => {
      then('every part parses', () => {
        const failed = scene.libs.flatMap(({ parts }) =>
          parts
            .map((part) => ({
              part: basename(part),
              ...runBash({ body: `bash -n '${part}'` }),
            }))
            .filter(({ exit }) => exit !== 0),
        );
        expect(failed).toEqual([]);
      });

      // 🔴 a part is DEFINITIONS only. sourced alone, with no core beneath it,
      //    it must say naught and exit 0 — any line that RUNS at source time
      //    would act before the core it leans on is in place
      then('🔴 every part only defines — it runs naught at source time', () => {
        const noisy = scene.libs.flatMap(({ parts }) =>
          parts
            .map((part) => ({
              part: basename(part),
              ...runBash({ body: `source '${part}'` }),
            }))
            .filter(
              ({ exit, stdout, stderr }) =>
                exit !== 0 || stdout !== '' || stderr !== '',
            )
            .map(({ part, exit, stderr }) => ({ part, exit, stderr })),
        );
        expect(noisy).toEqual([]);
      });
    });

    when('[t4] the core is sourced as a caller sources it', () => {
      // 🔴 THE teeth. the set a real `source` defines must hold every function
      //    the files define. a part the loader skips drops out of this set
      then('🔴 the source defines every function of every part', () => {
        const absent = scene.libs.flatMap(({ path, fnsByFile }) => {
          const run = runBash({
            body: `source '${path}' >/dev/null 2>&1 || exit 9\ndeclare -F`,
          });
          const defined = new Set(
            run.stdout
              .split('\n')
              .map((line) => line.replace(/^declare -f\s+/, '').trim()),
          );
          return fnsByFile.flatMap(({ file, fns }) =>
            fns
              .filter((fn) => !defined.has(fn))
              .map((fn) => ({ lib: basename(path), file: basename(file), fn })),
          );
        });
        expect(absent).toEqual([]);
      });
    });
  });

  given('[case2] a lib whose part is absent from disk', () => {
    when('[t0] a caller sources the core', () => {
      // 🔴 the bite. a copy of the lib with ONE part withheld must refuse to
      //    load, and name the file — a lib that loads half its functions and
      //    says naught is the failure this whole seam exists to prevent
      const outcome = useBeforeAll(async () => {
        const lib = scene.libs[0];
        if (!lib) throw new Error('no lib with parts was found to copy');
        const dir = tempDirs.genOne({ slug: 'shell-lib-parts' });
        const [withheld, ...kept] = lib.parts;
        if (!withheld) throw new Error('the lib declares no part to withhold');

        // the core and its kept parts, beside any peer lib the core sources
        const peers = readdirSync(dirname(lib.path))
          .filter((f) => f.endsWith('.sh'))
          .filter((f) => !f.startsWith(basename(lib.path, '.sh')));
        for (const file of [lib.path, ...kept])
          copyFileSync(file, join(dir, basename(file)));
        for (const peer of peers)
          copyFileSync(join(dirname(lib.path), peer), join(dir, peer));

        return {
          withheld: basename(withheld),
          run: runBash({
            body: `source '${join(dir, basename(lib.path))}'\necho "__AFTER__=$?"`,
          }),
        };
      });

      then('the source fails — it never reports a clean load', () => {
        expect(outcome.run.stdout).not.toContain('__AFTER__=0');
      });

      then('and the refusal names the absent part', () => {
        expect(outcome.run.stderr).toContain('MalfunctionError');
        expect(outcome.run.stderr).toContain(outcome.withheld);
      });
    });
  });
});
