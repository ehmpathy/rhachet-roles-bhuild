import { given, then, useBeforeAll, when } from 'test-fns';

import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { BEHAVIOR_SIZE_CONFIG } from './getAllTemplatesBySize';

/**
 * .what = proves the size manifest and the template files on disk name the same set
 * .why  = BEHAVIOR_SIZE_CONFIG is hand-kept beside the templates dir. a template file absent from
 *         every tier's `adds` is silently never written (not even at giga), and a `dels` entry
 *         that names no `adds` entry silently deletes naught. both must go red here, exhaustive,
 *         never sampled
 */

const TEMPLATES_DIR = path.join(__dirname, 'templates');

/**
 * .what = every template file under the templates dir, as a forward-slash path relative to it
 * .why  = the manifest names templates by that same relative path (e.g. `refs/...`)
 */
const getAllTemplateFilesOnDisk = (input: { dir: string }): string[] =>
  readdirSync(input.dir, { recursive: true, encoding: 'utf-8' })
    .filter((rel) => statSync(path.join(input.dir, rel)).isFile())
    .map((rel) => rel.split(path.sep).join('/'));

/**
 * .what = the manifest name of a template file: its guard variant suffix stripped
 * .why  = `1.vision.guard.light` and `1.vision.guard.heavy` both register as `1.vision.guard`
 */
const asManifestNameOfTemplateFile = (input: { file: string }): string =>
  input.file.replace(/\.(light|heavy)$/, '');

describe('getAllTemplatesBySize.manifest', () => {
  given('[case1] the templates dir and the size manifest', () => {
    const scene = useBeforeAll(async () => {
      const namesOnDisk = [
        ...new Set(
          getAllTemplateFilesOnDisk({ dir: TEMPLATES_DIR }).map((file) =>
            asManifestNameOfTemplateFile({ file }),
          ),
        ),
      ].sort();
      const tiers = Object.values(BEHAVIOR_SIZE_CONFIG);
      const adds: string[] = tiers.flatMap((tier) => [...tier.adds]);
      const dels: string[] = tiers.flatMap((tier) => [...tier.dels]);
      return { namesOnDisk, adds, dels };
    });

    when('[t0] each side is checked against the other', () => {
      then('there are templates on disk to check', () => {
        expect(scene.namesOnDisk.length).toBeGreaterThan(0);
      });

      then('every template on disk is registered in some tier', () => {
        const unregistered = scene.namesOnDisk.filter(
          (name) => !scene.adds.includes(name),
        );
        expect(unregistered).toEqual([]);
      });

      then('every registered template has a file on disk', () => {
        const fileless = scene.adds.filter(
          (name) => !scene.namesOnDisk.includes(name),
        );
        expect(fileless).toEqual([]);
      });

      then('every dels entry names an adds entry', () => {
        const orphanDels = scene.dels.filter(
          (name) => !scene.adds.includes(name),
        );
        expect(orphanDels).toEqual([]);
      });

      then('no template is registered twice', () => {
        const twice = scene.adds.filter(
          (name, index) => scene.adds.indexOf(name) !== index,
        );
        expect(twice).toEqual([]);
      });
    });
  });
});
