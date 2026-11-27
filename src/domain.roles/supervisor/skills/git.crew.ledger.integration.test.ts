/**
 * .what = clamps on `git.crew.ledger --tree --grove`: place one ledger row
 *
 * .why  = git.crew.move writes the destination grove through this verb. a row
 *         left on the old grove sends every later sweep to the wrong grove, and a
 *         findsert that overwrote would move a crew no one asked to move
 */
import { spawnSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { tempDirs } from '../../.test/tempDirs';
import { getEnvClearOfOperator } from './work/work.harness';

const PATH_SKILL = join(__dirname, 'git.crew.ledger.sh');
const TREE = 'svc-lessons.beav.feat-book-a-lesson';

afterAll(() => tempDirs.delAll());

/** .what = run the verb against a private ledger dir */
const runLedger = (input: { dir: string; args: string[] }) => {
  const result = spawnSync('bash', [PATH_SKILL, ...input.args], {
    encoding: 'utf8',
    // a bound, so an arg loop that spins reads as a failed cell (status null), never a hung suite
    timeout: 20_000,
    env: {
      ...getEnvClearOfOperator(),
      HOME: input.dir,
      CREWWORK_DIR: join(input.dir, '.crewwork'),
    },
  });
  return {
    code: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
};

/** .what = the whole render a caller reads: the exit code, stdout, then stderr */
const asRender = (result: {
  code: number | null;
  stdout: string;
  stderr: string;
}): string =>
  [`exit ${result.code}`, result.stdout, result.stderr].join('\n---\n');

/** .what = the one row the ledger holds for TREE, or null */
const getRow = (input: {
  dir: string;
}): { grove: string; roles: string } | null => {
  const file = join(input.dir, '.crewwork', 'crews', `${TREE}.json`);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, 'utf8'));
};

describe('git.crew.ledger --tree --grove', () => {
  given('[case1] no row for the tree', () => {
    const scene = useBeforeAll(async () => ({
      dir: tempDirs.genOne({ slug: 'ledger' }),
    }));

    when('[t0] enrolled on a cloud grove with roles', () => {
      const result = useBeforeAll(async () =>
        runLedger({
          dir: scene.dir,
          args: [
            '--tree',
            TREE,
            '--grove',
            'cloud://grove-sandpine-v20260901',
            '--roles',
            'mechanic,foreman',
          ],
        }),
      );
      then('it exits 0 and says the row was added', () => {
        expect(result.code).toEqual(0);
        expect(result.stdout).toContain(
          `row added: ${TREE} is on cloud://grove-sandpine-v20260901 (roles: mechanic,foreman)`,
        );
      });
      then('the row holds the grove and the roles', () => {
        expect(getRow({ dir: scene.dir })).toMatchObject({
          grove: 'cloud://grove-sandpine-v20260901',
          roles: 'mechanic,foreman',
        });
      });
      then('the render matches the snapshot', () => {
        expect(asRender(result)).toMatchSnapshot();
      });
    });

    when('[t1] enrolled on local under the default findsert', () => {
      const result = useBeforeAll(async () =>
        runLedger({
          dir: scene.dir,
          args: ['--tree', TREE, '--grove', 'local'],
        }),
      );
      then('it keeps the extant row and says so', () => {
        expect(result.code).toEqual(0);
        expect(result.stdout).toContain(
          `row kept: ${TREE} is on cloud://grove-sandpine-v20260901 (findsert)`,
        );
        expect(getRow({ dir: scene.dir })?.grove).toEqual(
          'cloud://grove-sandpine-v20260901',
        );
      });
      then('the render matches the snapshot', () => {
        expect(asRender(result)).toMatchSnapshot();
      });
    });

    when('[t2] enrolled on local under upsert, no roles', () => {
      const result = useBeforeAll(async () =>
        runLedger({
          dir: scene.dir,
          args: ['--tree', TREE, '--grove', 'local', '--idem', 'upsert'],
        }),
      );
      then('it sets the grove, names the old one, and keeps the roles', () => {
        expect(result.code).toEqual(0);
        expect(result.stdout).toContain(
          `row set: ${TREE} is on local, was cloud://grove-sandpine-v20260901 (roles: mechanic,foreman)`,
        );
        expect(getRow({ dir: scene.dir })).toMatchObject({
          grove: 'local',
          roles: 'mechanic,foreman',
        });
      });
      then('the render matches the snapshot', () => {
        expect(asRender(result)).toMatchSnapshot();
      });
    });
  });

  given('[case2] bad input', () => {
    const scene = useBeforeAll(async () => ({
      dir: tempDirs.genOne({ slug: 'ledger' }),
    }));

    when('[t0] a --tree with no --grove', () => {
      const result = useBeforeAll(async () =>
        runLedger({ dir: scene.dir, args: ['--tree', TREE] }),
      );
      then('it exits 2, names the fix, and writes no row', () => {
        expect(result.code).toEqual(2);
        expect(result.stderr).toContain('--tree needs --grove');
        expect(getRow({ dir: scene.dir })).toBeNull();
      });
      then('the render matches the snapshot', () => {
        expect(asRender(result)).toMatchSnapshot();
      });
    });

    when('[t1] a grove that is neither local nor cloud://', () => {
      const result = useBeforeAll(async () =>
        runLedger({
          dir: scene.dir,
          args: ['--tree', TREE, '--grove', 'laptop'],
        }),
      );
      then('it exits 2 and writes no row', () => {
        expect(result.code).toEqual(2);
        expect(result.stderr).toContain("grove 'laptop' is neither local");
        expect(getRow({ dir: scene.dir })).toBeNull();
      });
      then('the render matches the snapshot', () => {
        expect(asRender(result)).toMatchSnapshot();
      });
    });

    when('[t2] an --idem that is neither findsert nor upsert', () => {
      const result = useBeforeAll(async () =>
        runLedger({
          dir: scene.dir,
          args: ['--tree', TREE, '--grove', 'local', '--idem', 'create'],
        }),
      );
      then('it exits 2 and writes no row', () => {
        expect(result.code).toEqual(2);
        expect(result.stderr).toContain('--idem takes findsert | upsert');
        expect(getRow({ dir: scene.dir })).toBeNull();
      });
      then('the render matches the snapshot', () => {
        expect(asRender(result)).toMatchSnapshot();
      });
    });

    // .why = `shift 2` past the last arg shifts naught; an unguarded value flag spun the arg loop forever
    when('[t3] a --tree with no value at all', () => {
      const result = useBeforeAll(async () =>
        runLedger({ dir: scene.dir, args: ['--tree'] }),
      );
      then('it exits 2 at once and names the flag', () => {
        expect(result.code).toEqual(2);
        expect(result.stderr).toContain('--tree takes a value, got none');
        expect(getRow({ dir: scene.dir })).toBeNull();
      });
      then('the render matches the snapshot', () => {
        expect(asRender(result)).toMatchSnapshot();
      });
    });

    when('[t4] a --del with no value at all', () => {
      const result = useBeforeAll(async () =>
        runLedger({ dir: scene.dir, args: ['--del'] }),
      );
      then('it exits 2 at once and names the flag', () => {
        expect(result.code).toEqual(2);
        expect(result.stderr).toContain('--del takes a value, got none');
      });
      then('the render matches the snapshot', () => {
        expect(asRender(result)).toMatchSnapshot();
      });
    });

    when('[t5] a --grove whose value is the next flag', () => {
      const result = useBeforeAll(async () =>
        runLedger({
          dir: scene.dir,
          args: ['--tree', TREE, '--grove', '--roles', 'mechanic'],
        }),
      );
      then('it exits 2 and blames --grove, never --roles', () => {
        expect(result.code).toEqual(2);
        expect(result.stderr).toContain(
          "--grove takes a value, got the next flag '--roles'",
        );
        expect(getRow({ dir: scene.dir })).toBeNull();
      });
      then('the render matches the snapshot', () => {
        expect(asRender(result)).toMatchSnapshot();
      });
    });

    // .why = the rhx trailer arm shifted 2 past the last arg too, so a bare `--role` spun the loop the same way
    when('[t6] a rhx trailer flag with no value at the end', () => {
      const result = useBeforeAll(async () =>
        runLedger({ dir: scene.dir, args: ['--role'] }),
      );
      then(
        'the loop ends: the trailer is dropped, and the bare read runs',
        () => {
          expect(result.code).toEqual(0);
          expect(getRow({ dir: scene.dir })).toBeNull();
        },
      );
    });
  });

  given('[case3] a flag the chosen verb would ignore', () => {
    const scene = useBeforeAll(async () => ({
      dir: tempDirs.genOne({ slug: 'ledger' }),
    }));

    when('[t0] --roles with no --grove', () => {
      const result = useBeforeAll(async () =>
        runLedger({ dir: scene.dir, args: ['--roles', 'mechanic'] }),
      );
      then('it exits 2 rather than read the ledger and drop the flag', () => {
        expect(result.code).toEqual(2);
        expect(result.stderr).toContain(
          '--roles and --idem place a row, so they need --tree and --grove',
        );
        expect(result.stdout).toEqual('');
      });
      then('the render matches the snapshot', () => {
        expect(asRender(result)).toMatchSnapshot();
      });
    });

    when('[t1] --idem with no --grove', () => {
      const result = useBeforeAll(async () =>
        runLedger({ dir: scene.dir, args: ['--idem', 'upsert'] }),
      );
      then('it exits 2', () => {
        expect(result.code).toEqual(2);
        expect(result.stderr).toContain('need --tree and --grove');
      });
      then('the render matches the snapshot', () => {
        expect(asRender(result)).toMatchSnapshot();
      });
    });

    when('[t2] --del beside --grove', () => {
      const result = useBeforeAll(async () =>
        runLedger({
          dir: scene.dir,
          args: ['--del', TREE, '--grove', 'local'],
        }),
      );
      then('it exits 2: one act per call, and no row is placed', () => {
        expect(result.code).toEqual(2);
        expect(result.stderr).toContain(
          '--del takes no placement flag (got: --grove)',
        );
        expect(getRow({ dir: scene.dir })).toBeNull();
      });
      then('the render matches the snapshot', () => {
        expect(asRender(result)).toMatchSnapshot();
      });
    });

    when('[t3] --del beside --tree', () => {
      const result = useBeforeAll(async () =>
        runLedger({ dir: scene.dir, args: ['--del', TREE, '--tree', TREE] }),
      );
      then('it exits 2', () => {
        expect(result.code).toEqual(2);
        expect(result.stderr).toContain('--del takes no placement flag');
      });
      then('the render matches the snapshot', () => {
        expect(asRender(result)).toMatchSnapshot();
      });
    });

    when('[t4] --backfill beside --tree and --grove', () => {
      const result = useBeforeAll(async () =>
        runLedger({
          dir: scene.dir,
          args: ['--backfill', '--tree', TREE, '--grove', 'local'],
        }),
      );
      then('it exits 2 and places no row', () => {
        expect(result.code).toEqual(2);
        expect(result.stderr).toContain('--backfill takes no placement flag');
        expect(getRow({ dir: scene.dir })).toBeNull();
      });
      then('the render matches the snapshot', () => {
        expect(asRender(result)).toMatchSnapshot();
      });
    });
  });

  given('[case4] the caller asks how to use it', () => {
    const scene = useBeforeAll(async () => ({
      dir: tempDirs.genOne({ slug: 'ledger' }),
    }));

    when('[t0] --help runs', () => {
      const result = useBeforeAll(async () =>
        runLedger({ dir: scene.dir, args: ['--help'] }),
      );
      then('it exits 0 and names the placement flags', () => {
        expect(result.code).toEqual(0);
        expect(result.stdout).toContain('--tree');
        expect(result.stdout).toContain('--grove');
        expect(result.stdout).toContain('--idem');
      });
      then('the help render matches the snapshot', () => {
        expect(asRender(result)).toMatchSnapshot();
      });
    });
  });

  given('[case5] a bare read', () => {
    const scene = useBeforeAll(async () => ({
      dir: tempDirs.genOne({ slug: 'ledger' }),
    }));

    when('[t0] the ledger holds no row', () => {
      const result = useBeforeAll(async () =>
        runLedger({ dir: scene.dir, args: [] }),
      );
      then('stdout stays empty, so a line-wise caller reads no row', () => {
        expect(result.code).toEqual(0);
        expect(result.stdout).toEqual('');
      });
      then('stderr says the ledger is empty and names the seed verb', () => {
        expect(result.stderr).toContain('the ledger holds no row');
        expect(result.stderr).toContain('rhx git.crew.ledger --backfill');
      });
      then('the render matches the snapshot', () => {
        expect(asRender(result)).toMatchSnapshot();
      });
    });

    when('[t1] the ledger holds one row', () => {
      const result = useBeforeAll(async () => {
        runLedger({
          dir: scene.dir,
          args: ['--tree', TREE, '--grove', 'local'],
        });
        return runLedger({ dir: scene.dir, args: [] });
      });
      then('stdout lists the tree and its grove, and stderr is quiet', () => {
        expect(result.code).toEqual(0);
        expect(result.stdout).toContain(TREE);
        expect(result.stdout).toContain('local');
        expect(result.stderr).toEqual('');
      });
      then('the populated render matches the snapshot', () => {
        expect(asRender(result)).toMatchSnapshot();
      });
    });

    when('[t2] the ledger holds two rows of unequal length', () => {
      const result = useBeforeAll(async () => {
        runLedger({
          dir: scene.dir,
          args: [
            '--tree',
            'svc-lessons.beav.fix-x',
            '--grove',
            'cloud://grove-sandpine-v20260901',
          ],
        });
        return runLedger({ dir: scene.dir, args: [] });
      });
      then('the grove column aligns past the longest tree name', () => {
        const lines = result.stdout.split('\n').filter((l) => l.length > 0);
        expect(lines).toHaveLength(2);
        const groveCols = lines.map((l) => l.search(/ (local|cloud:\/\/\S+)$/));
        expect(new Set(groveCols).size).toEqual(1);
      });
      then('the aligned render matches the snapshot', () => {
        expect(asRender(result)).toMatchSnapshot();
      });
    });
  });
});
