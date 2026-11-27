/**
 * .what = clamps on the move's box-half unpacks: a transcript that cannot be placed, or a staged state that cannot be
 *         restored, halts the unpack loud, never counts past it
 *
 * .why  = the apply's sha256 proof reads the carried bytes and skips `.agent/.actors/*`, so it sees neither a transcript
 *         that never landed nor an index the restage never wrote. a transcript copy that failed in silence let the seat
 *         boot with `--resume` and the run say `resumed` over a conversation that was gone
 *
 * .how  = a bash driver sources the operations file against a temp $HOME with one real tree. a tgz in the shape each
 *         packer emits is piped into the unpack. a read-only dir refuses the copy; a held `index.lock` refuses the
 *         restage. git, tar, cp run for real; no real tree or home is in reach (rule.require.hermetic-tests)
 */
import { execFileSync, spawnSync } from 'child_process';
import { chmodSync, mkdirSync, realpathSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { tempDirs } from '../../.test/tempDirs';
import { getEnvClearOfOperator } from './work/work.harness';

const PATH_OPERATIONS = join(__dirname, 'work', 'movework.sh');
const TREE = 'svc-lessons.beav.feat-x';

// the in-tree transcript, at the path the packer lays it: its brain project dir is renamed to the destination's own
const TRANSCRIPT_REL =
  '.agent/.actors/actor.x/brain/.claude/projects/-src-tree/c1.jsonl';

const genScene = (input: { slug: string }) => {
  const dirRoot = realpathSync(tempDirs.genOne({ slug: input.slug }));
  const dirHome = join(dirRoot, 'home');
  const dirTree = join(dirHome, 'git', 'sandpine', '_worktrees', TREE);
  const dirStage = join(dirRoot, 'stage');
  const pathGitconfig = join(dirRoot, 'gitconfig');
  mkdirSync(dirTree, { recursive: true });
  mkdirSync(dirStage, { recursive: true });
  writeFileSync(
    pathGitconfig,
    '[user]\n  name = Test Human\n  email = human@example.com\n[init]\n  defaultBranch = main\n',
  );
  const env = {
    ...getEnvClearOfOperator(),
    HOME: dirHome,
    GIT_CONFIG_GLOBAL: pathGitconfig,
    GIT_CONFIG_NOSYSTEM: '1',
  };
  execFileSync('git', ['init', '-q', dirTree], { env });
  execFileSync('git', ['commit', '-q', '--allow-empty', '-m', 'init'], {
    cwd: dirTree,
    env,
  });

  // .what = run one bash body with the operations file sourced; stdout + stderr as one text
  const run = (body: string): { out: string } => {
    const res = spawnSync(
      'bash',
      [
        '-c',
        ['set -uo pipefail', `source '${PATH_OPERATIONS}'`, body].join('\n'),
      ],
      { env },
    );
    return { out: `${res.stdout.toString()}${res.stderr.toString()}` };
  };

  // .what = an output with the temp root and each minted commit sha masked, so a snapshot holds across runs
  // .why  = claude keys a project dir on the cwd, every non-alphanumeric as a dash, so the root also rides in that form;
  //         a commit sha carries its author time. the fixed all-ones head stays, since the test names it
  const getMasked = (out: string): string =>
    out
      .split(dirRoot)
      .join('<root>')
      .split(dirRoot.replace(/[^A-Za-z0-9]/g, '-'))
      .join('<root-as-project-dir>')
      .replace(/\b(?!1{40}\b)[0-9a-f]{40}\b/g, '<sha>');

  // .what = lay one in-tree transcript and pack it as __mvbox_transcripts_pack does
  const genTranscriptsTgz = (): string => {
    mkdirSync(join(dirStage, 'in', dirname(TRANSCRIPT_REL)), {
      recursive: true,
    });
    writeFileSync(join(dirStage, 'in', TRANSCRIPT_REL), '{"turn":1}\n');
    return [
      `tar -cf '${dirStage}/intree.tar' -C '${dirStage}/in' .`,
      `tar -czf '${dirStage}/transcripts.tgz' -C '${dirStage}' intree.tar`,
    ].join('\n');
  };

  // .what = lay one staged add and pack it as __mvbox_pack does
  const genFilesTgz = (): string => {
    mkdirSync(join(dirStage, 'f'), { recursive: true });
    writeFileSync(join(dirStage, 'f', 'x.ts'), 'export const x = 1;\n');
    writeFileSync(join(dirStage, 'meta.txt'), 'S\tx.ts\n');
    return [
      `tar -cf '${dirStage}/files.tar' -C '${dirStage}/f' x.ts`,
      `tar -czf '${dirStage}/carry.tgz' -C '${dirStage}' meta.txt files.tar`,
    ].join('\n');
  };

  return {
    dirRoot,
    dirTree,
    dirStage,
    env,
    run,
    getMasked,
    genTranscriptsTgz,
    genFilesTgz,
  };
};

describe('git.crew.move box unpacks', () => {
  given('[case1] a transcript carried to a tree that accepts it', () => {
    const scene = useBeforeAll(async () => {
      const s = genScene({ slug: 'unpack-ok' });
      const result = s.run(
        [
          s.genTranscriptsTgz(),
          `__mvbox_transcripts_unpack '${TREE}' < '${s.dirStage}/transcripts.tgz'; echo "RC=$?"`,
          `find '${s.dirTree}/.agent' -name c1.jsonl`,
        ].join('\n'),
      );
      return { ...s, result };
    });

    when('[t0] the unpack runs', () => {
      then('it places the transcript and says so', () => {
        expect(scene.result.out).toContain('placed=1');
        expect(scene.result.out).toContain('RC=0');
        expect(scene.result.out).toContain('/c1.jsonl');
      });

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(scene.result.out)).toMatchSnapshot();
      });
    });
  });

  given(
    '[case2] a transcript carried to a tree whose actor dir refuses writes',
    () => {
      const scene = useBeforeAll(async () => {
        const s = genScene({ slug: 'unpack-refused' });
        const dirActors = join(s.dirTree, '.agent', '.actors');
        mkdirSync(dirActors, { recursive: true });
        chmodSync(dirActors, 0o555);
        const result = s.run(
          [
            s.genTranscriptsTgz(),
            `__mvbox_transcripts_unpack '${TREE}' < '${s.dirStage}/transcripts.tgz'; echo "RC=$?"`,
          ].join('\n'),
        );
        chmodSync(dirActors, 0o755);
        return { ...s, result };
      });

      when('[t0] the unpack runs', () => {
        then('it fails with rc 1, never a count', () => {
          expect(scene.result.out).toContain('RC=1');
          expect(scene.result.out).not.toContain('placed=');
        });

        then('it names the transcript and where it could not land', () => {
          expect(scene.result.out).toContain(
            `💥 MalfunctionError: the transcript ${TRANSCRIPT_REL} could not be placed at`,
          );
        });

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(scene.result.out)).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case3] legacy transcripts carried to a legacy dir that refuses writes',
    () => {
      const scene = useBeforeAll(async () => {
        const s = genScene({ slug: 'unpack-legacy' });
        const dirProjects = join(s.dirRoot, 'legacy-claude', 'projects');
        mkdirSync(dirProjects, { recursive: true });
        chmodSync(dirProjects, 0o555);
        mkdirSync(join(s.dirStage, 'lg'), { recursive: true });
        writeFileSync(join(s.dirStage, 'lg', 'c1.jsonl'), '{"turn":1}\n');
        const result = s.run(
          [
            `tar -cf '${s.dirStage}/legacy.tar' -C '${s.dirStage}/lg' .`,
            `tar -czf '${s.dirStage}/transcripts.tgz' -C '${s.dirStage}' legacy.tar`,
            `CREW_LEGACY_CLAUDE_DIR='${s.dirRoot}/legacy-claude' __mvbox_transcripts_unpack '${TREE}' < '${s.dirStage}/transcripts.tgz'; echo "RC=$?"`,
          ].join('\n'),
        );
        chmodSync(dirProjects, 0o755);
        return { ...s, result };
      });

      when('[t0] the unpack runs', () => {
        then('it fails with rc 1, and names the legacy dir', () => {
          expect(scene.result.out).toContain('RC=1');
          expect(scene.result.out).not.toContain('placed=');
          expect(scene.result.out).toContain(
            '💥 MalfunctionError: the legacy transcripts could not be placed at',
          );
        });

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(scene.result.out)).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case5] the twin and adoption reads, over a git that cannot answer',
    () => {
      const scene = useBeforeAll(async () => {
        const s = genScene({ slug: 'reads-unread' });
        const clean = s.run(
          `__mvbox_tree_clean '${s.dirTree}'; echo "CLEAN_RC=$?"`,
        );
        // a corrupt HEAD: git can no longer read the tree's status or its history
        writeFileSync(join(s.dirTree, '.git', 'HEAD'), 'not a ref\n');
        const result = s.run(
          [
            `__mvbox_tree_clean '${s.dirTree}'; echo "UNREAD_CLEAN_RC=$?"`,
            `__mvbox_head_window '${TREE}'; echo "WINDOW_RC=$?"`,
            `printf '' | __mvbox_dest_only sandpine no-such-repo 0000000000000000000000000000000000000000; echo "DEST_RC=$?"`,
          ].join('\n'),
        );
        return { ...s, clean, result };
      });

      when('[t0] the tree reads clean', () => {
        then('tree_clean says clean', () => {
          expect(scene.clean.out).toContain('CLEAN_RC=0');
        });
      });

      when('[t1] git cannot read the tree or the repo', () => {
        then(
          'tree_clean says NOT clean, never adopts what it could not read',
          () => {
            expect(scene.result.out).toContain('UNREAD_CLEAN_RC=1');
          },
        );

        then('the head window fails loud, never an empty history', () => {
          expect(scene.result.out).toContain('WINDOW_RC=1');
          expect(scene.result.out).toContain(
            `💥 MalfunctionError: git cannot read the head history of ${TREE}`,
          );
        });

        then(
          'the destination walk fails loud, never "no commit is lost"',
          () => {
            expect(scene.result.out).toContain('DEST_RC=1');
            expect(scene.result.out).toContain(
              '💥 MalfunctionError: git cannot check which head commits the destination holds',
            );
          },
        );

        then('the render matches the snapshot', () => {
          expect(scene.getMasked(scene.result.out)).toMatchSnapshot();
        });
      });
    },
  );

  given('[case6] a settle whose patch-twin re-judge cannot run', () => {
    const scene = useBeforeAll(async () => {
      const s = genScene({ slug: 'settle-unread' });
      const dirMain = join(s.dirRoot, 'home', 'git', 'sandpine', 'svc-lessons');
      mkdirSync(dirMain, { recursive: true });
      execFileSync('git', ['init', '-q', dirMain], { env: s.env });
      execFileSync('git', ['commit', '-q', '--allow-empty', '-m', 'init'], {
        cwd: dirMain,
        env: s.env,
      });
      execFileSync('git', ['branch', 'beav/feat-x'], {
        cwd: dirMain,
        env: s.env,
      });
      // a head the destination does not hold: git cherry cannot compare against it
      const HEAD_ABSENT = '1111111111111111111111111111111111111111';
      const result = s.run(
        [
          `__mvbox_settle sandpine svc-lessons beav/feat-x ${HEAD_ABSENT} yes; echo "RC=$?"`,
          `echo "ASIDE=$(git -C '${dirMain}' for-each-ref --format='%(refname)' refs/crew-move-setaside)"`,
        ].join('\n'),
      );
      return { ...s, result };
    });

    when('[t0] the settle runs with a set-aside reason', () => {
      then('it halts loud, rc 1, and names the cherry', () => {
        expect(scene.result.out).toContain('RC=1');
        expect(scene.result.out).toContain(
          '💥 MalfunctionError: git cherry could not compare branch beav/feat-x',
        );
      });

      then('it set naught aside: no proof, no act', () => {
        expect(scene.result.out).toContain('ASIDE=\n');
      });

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(scene.result.out)).toMatchSnapshot();
      });
    });
  });

  given('[case4] a staged add carried to a tree', () => {
    const scene = useBeforeAll(async () => {
      const s = genScene({ slug: 'restage' });
      const ok = s.run(
        [
          s.genFilesTgz(),
          `__mvbox_unpack '${TREE}' < '${s.dirStage}/carry.tgz'; echo "RC=$?"`,
          `echo "CACHED=$(git -C '${s.dirTree}' diff --cached --name-only)"`,
        ].join('\n'),
      );
      // a held index lock: git refuses every index write, as a crashed or live git would leave it
      execFileSync('git', ['reset', '-q'], { cwd: s.dirTree, env: s.env });
      writeFileSync(join(s.dirTree, '.git', 'index.lock'), '');
      const locked = s.run(
        `__mvbox_unpack '${TREE}' < '${s.dirStage}/carry.tgz'; echo "RC=$?"`,
      );
      return { ...s, ok, locked };
    });

    when('[t0] the index accepts the restage', () => {
      then('the path is staged, as the source had it', () => {
        expect(scene.ok.out).toContain('RC=0');
        expect(scene.ok.out).toContain('CACHED=x.ts');
      });

      then('the render matches the snapshot', () => {
        expect(scene.getMasked(scene.ok.out)).toMatchSnapshot();
      });
    });

    when('[t1] the index refuses the restage', () => {
      then('it fails with rc 1, and names the path', () => {
        expect(scene.locked.out).toContain('RC=1');
        expect(scene.locked.out).toContain(
          '💥 MalfunctionError: the staged state of x.ts could not be restored',
        );
      });

      then('the render matches the snapshot', () => {
        // .why = the advice git prints after `File exists.` is the host git's, and its words change by version
        expect(
          scene
            .getMasked(scene.locked.out)
            .replace(
              /(index\.lock': File exists\.)[\s\S]*$/,
              '$1\n<git lock advice>\n',
            ),
        ).toMatchSnapshot();
      });
    });
  });
});
