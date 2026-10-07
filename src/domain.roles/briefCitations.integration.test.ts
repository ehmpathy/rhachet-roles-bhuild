/**
 * .what = clamps that every IN-PACKAGE brief citation resolves to a real file
 *
 * .why  = 🔴 a role split renames every path that crosses it. the supervisor
 *         and prioritizer briefs were one `role=any` corpus at their source, so
 *         a citation that was a peer read in one dir is now either a
 *         cross-role read or an out-of-package one — and a citation that
 *         resolves to neither is a **dead end a reader meets and the author
 *         never does**.
 *
 *         it fails silently in the worst way: markdown does not resolve, so no
 *         tool complains, and the cost lands on whoever follows the pointer.
 *
 *         🔴 and resolution is only HALF the claim. a citation labelled
 *         `(role=any)` — the dir the lift retired — still resolves, because
 *         `[t6]` grades the basename and the basename did not change. so the
 *         label rots while the pointer works, and the reader is told to look
 *         in a dir that does not exist. `[case2]` grades the LABEL, against
 *         the tree. it found **11 live instances** the moment it was written.
 *
 * .how  = every backticked `*.md` token inside a `.see also` section, resolved
 *         against the basenames the package actually ships.
 *
 *         ⚠️ the SECTION bound is load-bearing, not a convenience. a brief's
 *         prose names files that are not citations at all — a generic
 *         `readme.md`, a session's `progress.md`, a term cluster's own
 *         `choice._.md`. graded as citations those are 9 false positives here,
 *         and a clamp with false positives is a clamp somebody mutes.
 *         `.see also` is the one place a token is a POINTER a reader follows.
 *
 *         🔴 `[case2]` deliberately does NOT inherit that bound, and the
 *         asymmetry is the point: a bare `foo.md` is ambiguous, so it needs a
 *         section to disambiguate it — but `` `foo.md` (role=x) `` is
 *         SELF-identifying. no other shape in this corpus wears it. so the
 *         bound would buy no precision and would cost recall: the first stale
 *         label found sat in running prose, not in a `.see also`.
 *
 *         a `term=<x>._.choice._.md` token resolves through its role's
 *         `glossary.of=<role>.md`: the package ships the TERM as a row, and keeps
 *         the full record unpublished. `[case3]` holds the rows and the records
 *         as one set, so a glossed citation can never point at naught.
 *
 *         a token that names another repo is OUT of scope by construction —
 *         this cannot reach that tree, and the convention for such a citation
 *         is to name the repo beside it rather than to link it.
 *
 * .note = it walks the tree, so it is an integration test rather than a unit
 *         one (rule.forbid.unit.remote-boundaries).
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { basename, join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getAllFilesRecursive } from './.test/getAllFilesRecursive';

const DIR_ROLES = __dirname;

/**
 * .what = where each lifted role's FULL term records live — unpublished
 * .why  = a role ships a terse `glossary.of=<role>.md`; the full cluster per term stays in
 *         this repo so an enrolled brain is not flooded upfront
 */
const DIR_TERMS = join(
  __dirname,
  '..',
  '..',
  '.agent/repo=.this/role=any/briefs/domain.terms',
);

/** .what = the roles whose vocabulary ships as a glossary */
const ROLES_WITH_GLOSSARY = ['supervisor', 'prioritizer'] as const;

/** .what = the terms a glossary declares — one `| **term** |` row each */
const getAllGlossaryTerms = (input: { content: string }): string[] =>
  [...input.content.matchAll(/^\| \*\*([a-z0-9.-]+)\*\* \|/gm)].map(
    ([, term = '']) => term,
  );

/** .what = the term a `term=<x>._.choice._.md` or `.reason.md` token names */
const asCitedTerm = (input: { token: string }): string | null =>
  /^term=(.+?)\._\.choice\.(?:_|reason)\.md$/.exec(input.token)?.[1] ?? null;

/** .what = a citation this clamp cannot and should not resolve */
const isOutOfPackage = (input: { line: string; token: string }): boolean =>
  // a token that carries a slash names a repo or a path in one
  input.token.includes('/') ||
  // `org/repo`'s `foo.md` — the repo is named earlier on the line
  /`[a-z0-9_.-]+\/[a-z0-9_.-]+`/.test(input.line) ||
  // `sandpine-notebook`'s `foo.md` — a bare repo name, possessive, owns the token
  /`[a-z0-9_.-]+`'s `/.test(input.line) ||
  // `foo.md` (bhrain/learner) — the repo/role that owns it trails the token
  /\([a-z0-9_.-]+\/[a-z0-9_.-]+\)/.test(input.line);

describe('briefCitations', () => {
  const scene = useBeforeAll(async () => {
    const briefs = readdirSync(DIR_ROLES)
      .filter((entry) => statSync(join(DIR_ROLES, entry)).isDirectory())
      // 🔴 a dot-dir is NOT a role — `.test/` holds shared suite operations, and
      //    `tsconfig.build.json` excludes the whole family from `dist/`. with
      //    no filter it is walked as a role, finds no `briefs/`, and passes for
      //    the wrong reason: the count still clears its floor, so no assert
      //    ever reports that a non-role entered the set
      .filter((entry) => !entry.startsWith('.'))
      .flatMap((role) => {
        // a role may ship no briefs at all — `dispatcher` does not
        const dir = join(DIR_ROLES, role, 'briefs');
        return existsSync(dir) ? getAllFilesRecursive({ dir }) : [];
      })
      .filter((path) => path.endsWith('.md'));

    // every basename the package ships, so a cross-role citation resolves
    const shipped = new Set(briefs.map((path) => basename(path)));

    // every term a shipped glossary declares. a `term=<x>` citation names a
    // concept, and the glossary is where the package ships that concept — the
    // full record sits unpublished, and [case3] holds the two in step
    const glossed = new Set(
      briefs
        .filter((path) => /^glossary\.of=[a-z]+\.md$/.test(basename(path)))
        .flatMap((path) =>
          getAllGlossaryTerms({ content: readFileSync(path, 'utf8') }),
        ),
    );
    const isGlossed = (input: { token: string }): boolean => {
      const term = asCitedTerm({ token: basename(input.token) });
      return term !== null && glossed.has(term);
    };

    const unresolved = briefs.flatMap((path) => {
      const lines = readFileSync(path, 'utf8').split('\n');
      let inSeeAlso = false;
      return lines.flatMap((line, index) => {
        // a `.see also` section runs until the next heading of any level
        if (line.startsWith('#')) inSeeAlso = /^#+\s*\.?see also/i.test(line);
        if (!inSeeAlso) return [];
        return [...line.matchAll(/`([a-z][a-z0-9.=_/-]*\.md)`/g)]
          .map(([, token = '']) => token)
          .filter((token) => !isOutOfPackage({ line, token }))
          .filter((token) => !shipped.has(basename(token)))
          .filter((token) => !isGlossed({ token }))
          .map((token) => ({
            from: path.slice(DIR_ROLES.length + 1),
            line: index + 1,
            cites: token,
          }));
      });
    });

    // every basename → the role dir that actually ships it, so a LABEL can be
    // graded against the tree rather than against the author's memory
    const homeByBasename = new Map(
      briefs.map((path) => [
        basename(path),
        path.slice(DIR_ROLES.length + 1).split('/')[0] ?? '',
      ]),
    );

    const mislabeled = briefs.flatMap((path) => {
      const lines = readFileSync(path, 'utf8').split('\n');
      return lines.flatMap((line, index) =>
        [
          ...line.matchAll(
            /`([a-z][a-z0-9.=_/-]*?)(?:\.md)?`\s*\(role=([a-z]+)\)/g,
          ),
        ]
          .map(([, token = '', said = '']) => ({
            token,
            said,
            home: homeByBasename.get(`${basename(token)}.md`),
          }))
          // a label on a token this package does not ship names another repo's
          // role — out of scope, exactly as `isOutOfPackage` is for `[t6]`
          .filter(({ home }) => home !== undefined)
          .filter(({ said, home }) => said !== home)
          .map(({ token, said, home }) => ({
            from: path.slice(DIR_ROLES.length + 1),
            line: index + 1,
            cites: token,
            said: `role=${said}`,
            lives: `role=${home}`,
          })),
      );
    });

    // per role: the terms its glossary declares, beside the terms it keeps a
    // full record for. the two must be one set, or a row points at naught
    // (or a record has no row, and so no reader ever meets its word)
    const glossaries = ROLES_WITH_GLOSSARY.map((role) => {
      const pathGlossary = join(
        DIR_ROLES,
        role,
        'briefs',
        `glossary.of=${role}.md`,
      );
      const dirRecords = join(DIR_TERMS, `role=${role}`);
      const rows = existsSync(pathGlossary)
        ? getAllGlossaryTerms({ content: readFileSync(pathGlossary, 'utf8') })
        : [];
      const records = existsSync(dirRecords)
        ? readdirSync(dirRecords)
            .map((entry) => asCitedTerm({ token: entry }))
            .filter((term): term is string => term !== null)
        : [];
      return { role, rows, records: [...new Set(records)] };
    });

    return {
      briefs,
      shipped,
      unresolved,
      homeByBasename,
      mislabeled,
      glossaries,
    };
  });

  given('[case1] the brief corpus this package ships', () => {
    when('[t0] every citation is resolved', () => {
      // ANTI-VACUITY: a walk that found no brief would satisfy the claim below
      // over an empty set
      then('the subject exists — the walk found a real corpus', () => {
        expect(scene.briefs.length).toBeGreaterThan(100);
      });

      // and it must reach BOTH lifted role dirs, since the split is what makes
      // a citation cross a boundary in the first place
      then('and it reached both lifted role dirs', () => {
        const reached = ['supervisor/briefs/', 'prioritizer/briefs/'].map(
          (prefix) => ({
            prefix,
            reached: scene.briefs.some((path) =>
              path.slice(DIR_ROLES.length + 1).startsWith(prefix),
            ),
          }),
        );
        expect(reached).toEqual([
          { prefix: 'supervisor/briefs/', reached: true },
          { prefix: 'prioritizer/briefs/', reached: true },
        ]);
      });

      // 🔴 THE teeth. the failure names the file that cites, its line, and the
      //    token that resolves to naught — so the fix is a read away
      //    (rule.require.errors-name-the-fix)
      then('🔴 every in-package citation resolves to a shipped brief', () => {
        expect(scene.unresolved).toEqual([]);
      });
    });
  });

  given('[case2] a citation that crosses the new role boundary', () => {
    when('[t1] its `(role=…)` label is read against the tree', () => {
      // ANTI-VACUITY: a regex that matched no label would satisfy the teeth
      // below over an empty set — and unlike [case1]'s floor, this one cannot
      // borrow the brief count, since a corpus with zero labels is a legal
      // corpus. so the floor is on the LABELS, measured
      then('the subject exists — the corpus carries role labels', () => {
        const labeled = scene.briefs.filter((path) =>
          /\(role=[a-z]+\)/.test(readFileSync(path, 'utf8')),
        );
        expect(labeled.length).toBeGreaterThanOrEqual(7);
      });

      // and the labels must span BOTH directions, since a one-directional
      // corpus would leave the mirror unproven — `case=5` names the
      // prioritizer→supervisor direction as the one the handoff missed
      then('and it labels citations in both directions', () => {
        const directions = ['supervisor', 'prioritizer'].map((role) => ({
          role,
          labels: scene.briefs
            .filter((path) =>
              path.slice(DIR_ROLES.length + 1).startsWith(`${role}/`),
            )
            .filter((path) =>
              /\(role=[a-z]+\)/.test(readFileSync(path, 'utf8')),
            ).length,
        }));
        expect(directions.every(({ labels }) => labels > 0)).toEqual(true);
      });

      // 🔴 THE teeth. the failure names what the label SAID and where the
      //    target LIVES, so the fix is the diff of two strings
      then('🔴 the label names the role the target actually lives in', () => {
        expect(scene.mislabeled).toEqual([]);
      });
    });
  });

  given('[case3] a role that ships its vocabulary as a glossary', () => {
    when('[t2] its rows are read against its unpublished term records', () => {
      // ANTI-VACUITY: two empty sets are equal. a glossary that failed to
      // parse, beside a records dir that moved, would pass the teeth below
      then(
        'the subject exists — each glossary and its records are found',
        () => {
          const found = scene.glossaries.map(({ role, rows, records }) => ({
            role,
            rows: rows.length > 0,
            records: records.length > 0,
          }));
          expect(found).toEqual(
            ROLES_WITH_GLOSSARY.map((role) => ({
              role,
              rows: true,
              records: true,
            })),
          );
        },
      );

      then('each term appears in its glossary exactly once', () => {
        const dupes = scene.glossaries.map(({ role, rows }) => ({
          role,
          dupes: rows.filter((term, index) => rows.indexOf(term) !== index),
        }));
        expect(dupes).toEqual(
          ROLES_WITH_GLOSSARY.map((role) => ({ role, dupes: [] })),
        );
      });

      // 🔴 THE teeth, both directions. a row with no record points a reader at
      //    naught; a record with no row is a word no enrolled brain ever meets
      then('🔴 the glossary rows and the term records are one set', () => {
        const drift = scene.glossaries.map(({ role, rows, records }) => ({
          role,
          rowsWithoutRecord: rows.filter((term) => !records.includes(term)),
          recordsWithoutRow: records.filter((term) => !rows.includes(term)),
        }));
        expect(drift).toEqual(
          ROLES_WITH_GLOSSARY.map((role) => ({
            role,
            rowsWithoutRecord: [],
            recordsWithoutRow: [],
          })),
        );
      });
    });
  });
});
