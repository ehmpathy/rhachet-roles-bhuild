import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getAllTranscriptPaths } from './getAllTranscriptPaths';

/**
 * .what = scaffold a temp claude-projects corpus with the given project slugs
 * .why = lets the communicator run against a real filesystem, hermetically
 */
const genTempCorpus = (input: {
  projects: { slug: string; files: string[] }[];
}): string => {
  const root = mkdtempSync(join(tmpdir(), 'reflect-paths-'));
  for (const project of input.projects) {
    const projectDir = join(root, project.slug);
    mkdirSync(projectDir, { recursive: true });
    for (const file of project.files)
      writeFileSync(join(projectDir, file), '{}\n');
  }
  return root;
};

describe('getAllTranscriptPaths (integration)', () => {
  given('[case1] a corpus with two projects and mixed file types', () => {
    const scene = useBeforeAll(async () => {
      const root = genTempCorpus({
        projects: [
          { slug: 'proj-alpha', files: ['a.jsonl', 'b.jsonl', 'notes.md'] },
          { slug: 'proj-beta', files: ['c.jsonl'] },
        ],
      });
      return { root };
    });
    afterAll(() => rmSync(scene.root, { recursive: true, force: true }));

    when('[t0] enumerated with no project filter', () => {
      then('it returns only jsonl files across all projects', () => {
        const paths = getAllTranscriptPaths(
          { projectFilter: null },
          { projectsDir: scene.root },
        );
        expect(paths).toHaveLength(3);
        expect(paths.every((p) => p.endsWith('.jsonl'))).toEqual(true);
        expect(paths.some((p) => p.endsWith('notes.md'))).toEqual(false);
      });
    });

    when('[t1] enumerated with a project filter', () => {
      then('it returns only the matched project transcripts', () => {
        const paths = getAllTranscriptPaths(
          { projectFilter: 'alpha' },
          { projectsDir: scene.root },
        );
        expect(paths).toHaveLength(2);
        expect(paths.every((p) => p.includes('proj-alpha'))).toEqual(true);
      });
    });
  });

  given('[case2] a projects dir that does not exist', () => {
    when('[t0] enumerated', () => {
      then('it returns an empty list, not an error', () => {
        const paths = getAllTranscriptPaths(
          { projectFilter: null },
          { projectsDir: join(tmpdir(), 'reflect-does-not-exist-xyz') },
        );
        expect(paths).toEqual([]);
      });
    });
  });
});
