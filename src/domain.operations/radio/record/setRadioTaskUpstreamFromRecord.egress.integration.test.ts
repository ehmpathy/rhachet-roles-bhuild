import * as fs from 'fs';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

/**
 * .what = every file path under a dir, at any depth
 */
const getAllFilePaths = (input: { dir: string }): string[] =>
  fs.readdirSync(input.dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(input.dir, entry.name);
    if (entry.isDirectory()) return getAllFilePaths({ dir: full });
    return [full];
  });

/**
 * .what = every prod file under src/, as a path relative to the repo root, with its text
 * .why = the egress pin reads imports straight from the source, so a new caller cannot hide
 */
const getAllProdSources = (input: {
  dir: string;
}): { file: string; text: string }[] =>
  getAllFilePaths(input)
    .filter((full) => full.endsWith('.ts') && !full.includes('.test.'))
    .map((full) => ({
      file: path.relative(process.cwd(), full),
      text: fs.readFileSync(full, 'utf8'),
    }));

/**
 * .what = the prod files that import a module by its file name
 */
const getImportersOf = (input: {
  sources: { file: string; text: string }[];
  module: string;
}): string[] =>
  input.sources
    .filter((source) =>
      new RegExp(`from '[^']*/${input.module}'`).test(source.text),
    )
    .map((source) => source.file)
    .sort();

describe('setRadioTaskUpstreamFromRecord — the one egress the promise gate guards', () => {
  given('[case1] the prod sources under src/', () => {
    const scene = useBeforeAll(async () => ({
      sources: getAllProdSources({ dir: path.join(process.cwd(), 'src') }),
    }));

    when('[t0] the importers of the send are read', () => {
      then(
        'radioTaskPush is imported by setRadioTaskUpstreamFromRecord alone',
        () => {
          expect(
            getImportersOf({ sources: scene.sources, module: 'radioTaskPush' }),
          ).toEqual([
            'src/domain.operations/radio/record/setRadioTaskUpstreamFromRecord.ts',
          ]);
        },
      );

      then(
        'setRadioTaskUpstreamFromRecord is imported by setRadioTaskRecordUpstream alone, which runs the gate first',
        () => {
          expect(
            getImportersOf({
              sources: scene.sources,
              module: 'setRadioTaskUpstreamFromRecord',
            }),
          ).toEqual([
            'src/domain.operations/radio/record/setRadioTaskRecordUpstream.ts',
          ]);
        },
      );
    });
  });
});
