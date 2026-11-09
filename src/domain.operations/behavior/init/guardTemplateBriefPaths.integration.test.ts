import fs from 'fs';
import path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getOneBehaverBriefsDir } from '../../../domain.roles/.test/getOneBehaverBriefsDir';

const DIR_OF_TEMPLATES = path.join(__dirname, 'templates');

// the briefs dir the role itself declares; its layout below that is what a guard names
const DIR_OF_BEHAVER_BRIEFS = getOneBehaverBriefsDir();

// a behaver brief path, as a guard names it from the consumer's `.agent/` link, less `briefs/`
const PATTERN_BEHAVER_BRIEF =
  /\.agent\/repo=bhuild\/role=behaver\/briefs\/([^'"\s]+)/g;

// a glob char: such a path names a set, not one file
const PATTERN_GLOB = /[*?{[]/;

/**
 * .what = every behaver brief path named across the guard templates, with its template
 */
const getAllBehaverBriefPathsOfGuards = (): { guard: string; rel: string }[] =>
  fs
    .readdirSync(DIR_OF_TEMPLATES)
    .filter((file) => /\.guard(\.|$)/.test(file))
    .flatMap((guard) =>
      [
        ...fs
          .readFileSync(path.join(DIR_OF_TEMPLATES, guard), 'utf-8')
          .matchAll(PATTERN_BEHAVER_BRIEF),
      ].map((match) => ({ guard, rel: match[1]! })),
    );

/**
 * .what = proves each behaver brief a guard template binds ships with the role
 * .why  = a typo or a renamed brief in a guard passes every template test and fails only in a
 *         consumer, where the lane reads a rubric that is not there
 */
describe('guardTemplateBriefPaths', () => {
  given('[case1] the guard templates this package ships', () => {
    const scene = useBeforeAll(async () => ({
      paths: getAllBehaverBriefPathsOfGuards(),
    }));

    when('[t0] each behaver brief path they name is looked up', () => {
      then('the templates name at least one behaver brief', () => {
        expect(scene.paths.length).toBeGreaterThan(0);
      });

      then('every literal path names a brief the role ships', () => {
        const absent = scene.paths
          .filter(({ rel }) => !PATTERN_GLOB.test(rel))
          .filter(
            ({ rel }) => !fs.existsSync(path.join(DIR_OF_BEHAVER_BRIEFS, rel)),
          );
        expect(absent).toEqual([]);
      });

      then('every glob path roots in a dir the role ships', () => {
        const absent = scene.paths
          .filter(({ rel }) => PATTERN_GLOB.test(rel))
          .map(({ guard, rel }) => ({
            guard,
            rel,
            root: rel.slice(0, rel.search(PATTERN_GLOB)).replace(/[^/]*$/, ''),
          }))
          .filter(
            ({ root }) =>
              !fs.existsSync(path.join(DIR_OF_BEHAVER_BRIEFS, root)),
          );
        expect(absent).toEqual([]);
      });
    });
  });
});
