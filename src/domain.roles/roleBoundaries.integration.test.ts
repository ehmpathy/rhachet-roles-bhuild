/**
 * .what = clamps that the supervisor and prioritizer seats hold DISJOINT material
 *
 * .why  = 🔴 `role=any` was the source's home for the supervisor, and the name is
 *         the defect: it reads as "shared" and it behaves as "every role in this
 *         repo". the measured cost was a prioritizer session that booted ~150
 *         supervisor briefs — and then ran a babysit tick, because its context
 *         said that was its job (`rule.always.prioritize-never-supervise`).
 *
 *         ⇒ so the split is not a tidier directory. **what boots IS the
 *         boundary**, and a brief filed at the wrong seat re-creates `role=any`
 *         one file at a time.
 *
 *         it fails silently, and worse than silently: the seat still works, the
 *         tests still pass, and the only symptom is an actor that does the other
 *         actor's job with total confidence.
 *
 * .how  = two claims over the two brief dirs.
 *
 *         1. the basename sets are DISJOINT. one brief at two seats is a split
 *            that did not split — and the duplicate drifts from its twin the
 *            first time either is edited.
 *
 *         2. each seat's signature vocabulary sits at exactly its own home. the
 *            prefixes are read off the filename rather than the prose, because a
 *            filename is the one part of a brief a reader sorts by — and because
 *            a prose grep would flag every legitimate cross-seat citation.
 *
 *         ⚠️ the second claim is graded in BOTH directions on purpose. a
 *         one-way check ("no eco.* at the supervisor") passes a corpus that
 *         moved every supervisor brief to the prioritizer, which is the same
 *         defect with the seats swapped.
 *
 *         🔴 `[case2]` grades a SECOND axis, and the two do not overlap at all.
 *         `[case1]` reads filenames under `briefs/`; `[case2]` reads import
 *         specifiers under any `.ts`. a seat can hold a perfectly disjoint brief
 *         corpus and still reach into its peer's interior from a module — which
 *         is precisely what happened: `prioritizer/skills/eco.seed` and
 *         `prioritizer/skills/work/ecowork` each imported a temp-dir helper from
 *         `supervisor/skills/work/work.harness`, and `[case1]` was green the
 *         whole time because a `.ts` is not a brief.
 *
 *         ⇒ the round's own lesson, applied to the round's own finding: **a
 *         guard is blind to the axis it does not ask about, and a green
 *         neighbour is no evidence at all.** one assert answers one question.
 *
 *         ⚠️ `[case2]` grades the specifier TEXT, never a module it followed to
 *         disk. so it cannot tell a leak that imports a real export from one
 *         that imports a name the target never had — and it does not need to:
 *         the second shape is a broken build, which every suite already catches.
 *         what only this guard catches is the leak that WORKS, and that is the
 *         one that ships. it claims the reach, and no more.
 *
 *         🔴 `[case3]` grades a THIRD axis, and it is the DOMINANT surface. the
 *         two seats ship ~15,600 lines of shell against a handful of `.ts`, so
 *         `[case2]`'s `.ts`-only aperture watches the small side of the corpus.
 *         a `source` that crosses role dirs is the same scope leak in the
 *         language the lift is actually written in.
 *
 *         ⇒ raised by peer `arch-smell-scopeleaks`'s lens at i004, which named
 *         the aperture rather than a live defect: it grepped the shell corpus
 *         itself and found none. measured again here — **zero cross-role
 *         `source` today**, every one lands inside its own seat. so `[case3]`
 *         opens green, and that is the point: it is the guard for the leak that
 *         has not happened yet, on the surface where it is most likely to.
 *
 *         ⚠️ `[case3]` grades the LINE TEXT of a whole `.sh`, never its `source`
 *         statements alone — deliberately, because a shell source is routed
 *         through a variable often enough to matter (`duct.poll.sh:77` does
 *         `source "$DUCTWORK_LIB"`). a statement-only pattern would see the
 *         `source` and not the value. a line-text pattern sees the assignment
 *         too, wherever the path is written down.
 *
 *         ⇒ the cost of the wider aperture is that a CITATION in a comment
 *         would trip it. measured 2026-09-25: zero `prioritizer/skills` in the
 *         supervisor tree and zero `supervisor/skills` in the prioritizer tree,
 *         comments included — so the wider net costs naught today, and a future
 *         citation that trips it is answered by a `.see also` in prose rather
 *         than by a path.
 *
 *         ⚠️ it matches the `<role>/skills` segment, so it claims the
 *         SOURCEABLE surface and no more. a `.sh` that read the other seat's
 *         `briefs/` would pass — and a brief is not executable, so that is the
 *         citation axis `briefCitations` already grades, not this one.
 *
 * .note = it walks the tree, so it is an integration test rather than a unit
 *         one (rule.forbid.unit.remote-boundaries).
 */
import { existsSync, readFileSync } from 'fs';
import { basename, dirname, join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getAllFilesRecursive } from './.test/getAllFilesRecursive';

const DIR_ROLES = __dirname;

/** the dir tsconfig's `@src/*` alias resolves to — `src/`, one up from here */
const DIR_SRC = join(DIR_ROLES, '..');

/**
 * .what = the absolute path an import specifier points at
 * .why  = a relative specifier resolves from its importer; an `@src/` one from
 *         `src/`. both roads reach the same interior, so `[case2]` reads both
 */
const asImportTarget = (input: { importer: string; spec: string }): string =>
  input.spec.startsWith('@src/')
    ? join(DIR_SRC, input.spec.slice('@src/'.length))
    : join(dirname(input.importer), input.spec);

/**
 * .what = the filename prefixes that name each seat's own vocabulary
 *
 * .why  = these are the two glossaries the `F2` call split. `eco.*` and `goal.*`
 *         are the priorities store's words — a rock, an opine, a gain, a surgoal.
 *         `crew.*`, `grove.*`, `duct.*`, `tree.*` are the work layer's — the
 *         boxes, the seats, and the pipes between them.
 *
 * .note = a brief that matches NEITHER is unclaimed and that is fine: most of the
 *         corpus is rules and howtos whose home is settled by their content. this
 *         clamps the part a filename can prove, and claims no more.
 */
const VOCAB_BY_ROLE: Record<string, RegExp> = {
  supervisor: /^(define\.invariant\.crew\.|term=(crew|grove|duct|tree)[._])/,
  prioritizer: /^(define\.(invariant\.)?eco\.|term=(eco|goal)[._])/,
};

/**
 * .what = the same two vocabularies, as they read on a glossary ROW
 * .why  = each seat ships its terms as rows of one `glossary.of=<role>.md`,
 *         never as a file per term. so the words a filename used to prove now
 *         sit one level down, and are graded there by the same two claims
 */
const VOCAB_ROW_BY_ROLE: Record<string, RegExp> = {
  supervisor: /^(crew|grove|duct|tree)(\.|$)/,
  prioritizer: /^(eco|goal)\./,
};

/** .what = the terms a glossary declares — one `| **term** |` row each */
const getAllGlossaryTerms = (input: { content: string }): string[] =>
  [...input.content.matchAll(/^\| \*\*([a-z0-9.-]+)\*\* \|/gm)].map(
    ([, term = '']) => term,
  );

describe('roleBoundaries', () => {
  const scene = useBeforeAll(async () => {
    const briefsByRole = Object.fromEntries(
      Object.keys(VOCAB_BY_ROLE).map((role) => [
        role,
        getAllFilesRecursive({ dir: join(DIR_ROLES, role, 'briefs') })
          .filter((path) => path.endsWith('.md'))
          .map((path) => basename(path)),
      ]),
    );

    // every term each seat's glossary declares, one row per term
    const rowsByRole = Object.fromEntries(
      Object.keys(VOCAB_BY_ROLE).map((role) => {
        const path = join(DIR_ROLES, role, 'briefs', `glossary.of=${role}.md`);
        return [
          role,
          existsSync(path)
            ? getAllGlossaryTerms({ content: readFileSync(path, 'utf8') })
            : [],
        ];
      }),
    );

    // a brief whose filename — or a glossary row whose term — claims one seat's
    // vocabulary while it sits at the other: the `role=any` defect, one at a time
    const misfiled = Object.keys(VOCAB_BY_ROLE).flatMap((role) =>
      Object.keys(VOCAB_BY_ROLE)
        .filter((owner) => owner !== role)
        .flatMap((owner) => [
          ...(briefsByRole[role] ?? [])
            .filter((brief) => VOCAB_BY_ROLE[owner]?.test(brief))
            .map((brief) => ({ brief, satAt: role, belongsAt: owner })),
          ...(rowsByRole[role] ?? [])
            .filter((term) => VOCAB_ROW_BY_ROLE[owner]?.test(term))
            .map((term) => ({
              brief: `glossary.of=${role}.md#${term}`,
              satAt: role,
              belongsAt: owner,
            })),
        ]),
    );

    const shared = (briefsByRole.supervisor ?? []).filter((brief) =>
      (briefsByRole.prioritizer ?? []).includes(brief),
    );

    // every relative OR `@src/*`-aliased import each seat's modules make, paired
    // with the role dir the specifier lands in. `join` normalizes the `..`
    // segments, so a specifier that climbs out of its own seat reports the dir
    // it arrived at. the alias (tsconfig `paths`) is a second road to the same
    // leak, so it is read too — peer i014 found `[case2]` blind to it
    const reachByRole = Object.fromEntries(
      Object.keys(VOCAB_BY_ROLE).map((role) => [
        role,
        getAllFilesRecursive({ dir: join(DIR_ROLES, role) })
          .filter((path) => path.endsWith('.ts'))
          .flatMap((path) =>
            [
              ...readFileSync(path, 'utf8').matchAll(
                /(?:from|require\()\s*['"]((?:\.|@src\/)[^'"]*)['"]/g,
              ),
            ].map(([, spec = '']) => ({
              from: path.slice(DIR_ROLES.length + 1),
              spec,
              lands: asImportTarget({ importer: path, spec })
                .slice(DIR_ROLES.length + 1)
                .split('/')[0],
            })),
          ),
      ]),
    );

    // a module under one seat whose import lands inside the OTHER seat's dir
    const leaks = Object.entries(reachByRole).flatMap(([role, reaches]) =>
      reaches
        .filter(({ lands }) => lands !== undefined && lands !== role)
        .filter(({ lands }) => lands !== undefined && lands in VOCAB_BY_ROLE)
        .map(({ from, spec, lands }) => ({ from, spec, reaches: lands })),
    );

    // every `.sh` line under each seat that names ANOTHER seat's skills dir —
    // a source, a lib-path assignment, or a comment that cites one. the shell
    // corpus is ~15,600 lines against a handful of `.ts`, so this is the axis
    // `[case2]` is structurally blind to
    const sourcesByRole = Object.fromEntries(
      Object.keys(VOCAB_BY_ROLE).map((role) => [
        role,
        getAllFilesRecursive({ dir: join(DIR_ROLES, role) })
          .filter((path) => path.endsWith('.sh'))
          .flatMap((path) =>
            readFileSync(path, 'utf8')
              .split('\n')
              .map((line, index) => ({
                from: path.slice(DIR_ROLES.length + 1),
                at: index + 1,
                line: line.trim(),
              }))
              .filter(({ line }) => /(?:^|\s|\/|")(?:source|\.)\s/.test(line)),
          ),
      ]),
    );

    const crossings = Object.keys(VOCAB_BY_ROLE).flatMap((role) =>
      getAllFilesRecursive({ dir: join(DIR_ROLES, role) })
        .filter((path) => path.endsWith('.sh'))
        .flatMap((path) =>
          readFileSync(path, 'utf8')
            .split('\n')
            .map((line, index) => ({ at: index + 1, line: line.trim() }))
            .flatMap(({ at, line }) =>
              Object.keys(VOCAB_BY_ROLE)
                .filter((peer) => peer !== role)
                .filter((peer) => line.includes(`${peer}/skills`))
                .map((peer) => ({
                  from: path.slice(DIR_ROLES.length + 1),
                  at,
                  reaches: peer,
                })),
            ),
        ),
    );

    return {
      briefsByRole,
      rowsByRole,
      misfiled,
      shared,
      reachByRole,
      leaks,
      sourcesByRole,
      crossings,
    };
  });

  given('[case1] the two lifted seats', () => {
    when('[t0] their brief dirs are walked', () => {
      // ANTI-VACUITY: a walk that found no brief would satisfy every claim below
      // over empty sets — which is the shape the disjointness claim is weakest to
      then('both seats ship a real corpus', () => {
        const counts = Object.entries(scene.briefsByRole).map(
          ([role, briefs]) => ({ role, enough: briefs.length > 20 }),
        );
        expect(counts).toEqual([
          { role: 'supervisor', enough: true },
          { role: 'prioritizer', enough: true },
        ]);
      });

      // and each vocabulary must be non-empty AT ITS OWN HOME, since the misfile
      // claim below is satisfied by a corpus that ships neither glossary at all.
      // a seat's words live in its filenames AND its glossary rows, so both count
      then('and each seat holds its own vocabulary', () => {
        const held = Object.keys(VOCAB_BY_ROLE).map((role) => ({
          role,
          enough:
            (scene.briefsByRole[role] ?? []).filter((brief) =>
              VOCAB_BY_ROLE[role]?.test(brief),
            ).length +
              (scene.rowsByRole[role] ?? []).filter((term) =>
                VOCAB_ROW_BY_ROLE[role]?.test(term),
              ).length >
            10,
        }));
        expect(held).toEqual([
          { role: 'supervisor', enough: true },
          { role: 'prioritizer', enough: true },
        ]);
      });

      // 🔴 THE teeth, half one. a brief at both seats is a split that did not
      //    split, and the two copies drift the first time either is edited
      then('🔴 no brief sits at both seats', () => {
        expect(scene.shared).toEqual([]);
      });

      // 🔴 THE teeth, half two. the failure names the brief, where it sat, and
      //    where it belongs — so the fix is one `mvsafe`
      //    (rule.require.errors-name-the-fix)
      then('🔴 every glossary brief sits at its own seat', () => {
        expect(scene.misfiled).toEqual([]);
      });
    });
  });

  given('[case2] the modules the two seats ship', () => {
    when(
      '[t1] every relative or @src import is followed to the dir it lands in',
      () => {
        // ANTI-VACUITY: an empty module set, or a set with no relative imports at
        // all, satisfies the reach claim below over nothing. both seats ship `.ts`
        // and both use relative imports, so a zero here is a walk that broke
        then('both seats ship modules that import relatively', () => {
          const counts = Object.entries(scene.reachByRole).map(
            ([role, reaches]) => ({ role, any: reaches.length > 0 }),
          );
          expect(counts).toEqual([
            { role: 'supervisor', any: true },
            { role: 'prioritizer', any: true },
          ]);
        });

        // 🔴 THE teeth. a module under one seat that imports from the other's dir
        //    is a scope leak in the literal sense — one bounded context reaching
        //    into another's interior — and the fix is `rule.prefer.most-common-
        //    denominator`: lift the shared piece to `.test/` or `..`, never reach
        then('🔴 no seat reaches into the other seat', () => {
          expect(scene.leaks).toEqual([]);
        });
      },
    );
  });

  given('[case3] the shell the two seats ship', () => {
    when('[t2] every `.sh` is read for a path into another seat', () => {
      // ANTI-VACUITY: the crossing claim below is satisfied over an empty walk,
      // and an empty walk is exactly what a bad glob produces. the supervisor
      // sources its libs from ~35 entrypoints, so a low count here is a broken
      // read rather than a clean corpus
      then('both seats ship shell that sources a lib', () => {
        const counts = Object.entries(scene.sourcesByRole).map(
          ([role, lines]) => ({ role, enough: lines.length > 0 }),
        );
        expect(counts).toEqual([
          { role: 'supervisor', enough: true },
          { role: 'prioritizer', enough: true },
        ]);
      });

      // and the supervisor's own count must be substantial — a walk that found
      // one `source` in 15,600 lines of shell read one file, not the tree
      then('and the supervisor half is the whole tree, not one file', () => {
        expect((scene.sourcesByRole.supervisor ?? []).length > 20).toEqual(
          true,
        );
      });

      // 🔴 THE teeth. a `.sh` under one seat that names the other seat's skills
      //    dir — sourced, assigned, or merely cited. the failure names the file
      //    and the LINE, so the fix is one read
      //    (rule.require.errors-name-the-fix)
      then('🔴 no seat writes a path into the other seat', () => {
        expect(scene.crossings).toEqual([]);
      });
    });
  });
});
