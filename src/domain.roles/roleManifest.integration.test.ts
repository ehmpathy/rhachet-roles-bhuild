/**
 * .what = clamps that `rhachet.repo.yml` lists exactly the roles the registry
 *         declares
 *
 * .why  = 🔴 this repo carries TWO registries. `getRoleRegistry.ts` is the
 *         source of truth for code; `rhachet.repo.yml` is the source of truth
 *         for CONSUMERS — `rhachet roles link` reads the yml, never the ts.
 *
 *         the yml is generated (`build:complete:repo`) and COMMITTED. so the
 *         two agree only while someone remembers to rebuild before the commit,
 *         and a role added to the ts alone is:
 *
 *           - present in code, and every unit/integration suite passes
 *           - absent from the manifest, so `roles link` never surfaces it
 *           - ⇒ `no skill found`, for every consumer, with no error anywhere
 *
 *         that is not hypothetical. this clamp was written because the manifest
 *         sat at FOUR roles while the registry declared SIX — the two lifted
 *         seats were absent from it, and the whole point of the lift is that a
 *         consumer can reach them. every gate was green.
 *
 *         ⚠️ the defect is invisible to the code's own tests BY CONSTRUCTION:
 *         they import the registry, which is the half that was right.
 *
 * .how  = it reads the registry through its real export, never a re-parse of
 *         the ts — a hand-rolled parse would drift from the code it grades.
 *
 * .note = it reads a file off disk, so it is an integration test rather than a
 *         unit one (rule.forbid.unit.remote-boundaries).
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getRoleRegistry } from './getRoleRegistry';

const PATH_MANIFEST = join(__dirname, '..', '..', 'rhachet.repo.yml');

/**
 * .what = the role slugs the generated manifest declares
 * .why  = only a LIST entry (`  - slug:`) names a role. the file also carries a
 *         bare top-level `slug:` for the registry itself, which is not a role —
 *         so the dash is the discriminator, never the word
 */
const getAllSlugsManifested = (input: { said: string }): string[] =>
  input.said
    .split('\n')
    .map((line) => line.match(/^\s*-\s+slug:\s*(\S+)\s*$/)?.[1])
    .filter((slug): slug is string => !!slug);

describe('roleManifest', () => {
  const scene = useBeforeAll(async () => {
    const declared = getRoleRegistry()
      .roles.map((role) => role.slug)
      .sort();
    const manifested = getAllSlugsManifested({
      said: readFileSync(PATH_MANIFEST, 'utf8'),
    }).sort();
    return { declared, manifested };
  });

  given('[case1] the registry in code and the manifest on disk', () => {
    when('[t0] both are read', () => {
      // ANTI-VACUITY: a registry that loaded zero roles, or a parse that found
      // none, would satisfy the teeth below over two empty sets — the exact
      // silent-absence shape this clamp exists to catch
      then('the subject exists — the registry declares roles', () => {
        expect(scene.declared.length).toBeGreaterThan(3);
      });

      then('and the parse read real slugs from the manifest', () => {
        expect(scene.manifested.length).toBeGreaterThan(3);
      });

      // and it must reach the two LIFTED seats specifically. the floors above
      // are cleared by the four roles that predate this lift, so a manifest
      // that dropped exactly the new pair would pass both of them
      then('and both lifted seats are declared in code', () => {
        expect(
          ['prioritizer', 'supervisor'].map((slug) => ({
            slug,
            declared: scene.declared.includes(slug),
          })),
        ).toEqual([
          { slug: 'prioritizer', declared: true },
          { slug: 'supervisor', declared: true },
        ]);
      });

      // 🔴 THE teeth — set equality, in BOTH directions at once. a subset check
      //    would pass a manifest that lists a role the registry retired, and a
      //    superset check would pass one that drops a role the registry adds
      then('🔴 the manifest lists exactly what the registry declares', () => {
        expect(scene.manifested).toEqual(scene.declared);
      });
    });
  });
});
