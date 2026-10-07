/**
 * .what = clamps that every role's ON-DISK artifacts and its DECLARATION agree
 *
 * .why  = three of this package's guarantees fail SILENTLY, and all three failed
 *         at once during the supervisor/prioritizer lift:
 *
 *           a `boot.yml` with no `boot:`   the file ships, the curation is inert,
 *                                          and a session opens with none of it.
 *                                          measured cost of the supervisor's half
 *                                          alone: 159,698 tokens, 63% of a ~253k
 *                                          window
 *           a role with no `readme.md`     the one artifact a human meets first.
 *                                          the supervisor had NO role dir at
 *                                          source, so its readme is authored
 *                                          rather than ported — and an authored
 *                                          artifact is one a lift can forget
 *           a readme with the OLD glyph    a role's artifact is its identity. a
 *                                          half-cutover ships two answers to
 *                                          "what does this glyph mean here?"
 *
 *         ⇒ not one announces itself. the package builds, the tests pass, the
 *         skill runs. so they are clamped, or they are hoped for
 *         (rule.require.clamp-edge-cases).
 *
 * .how  = the REAL registry, against the REAL filesystem. the whole subject is
 *         whether a declaration and a file agree, so a fake proves nothing of it
 *         (rule.forbid.integration.mocks).
 *
 * .note = it reads the filesystem, so it is an integration test rather than a
 *         unit one (rule.forbid.unit.remote-boundaries).
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { MalfunctionError } from 'helpful-errors';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getRoleRegistry } from './getRoleRegistry';

const DIR_ROLES = __dirname;

/**
 * .what = the artifact glyph each role wears, as its readme must open with
 * .why  = a role's glyph IS its identity to a human, and it renders in every
 *         place the readme does. a rename that leaves the old glyph behind
 *         ships the retired identity alongside the new one
 *
 * .note = each row is READ off the readme it guards rather than guessed. a
 *         guessed row makes this clamp assert the author's memory instead of
 *         the tree, which is how a false green is built
 */
const GLYPH_BY_ROLE: Record<string, string> = {
  behaver: '🌲',
  decomposer: '🍄',
  dreamer: '🌙',
  prioritizer: '🔦',
  supervisor: '⛺',
};

/**
 * 🔴 .what = the roles whose readme opens with NO glyph
 *
 * .why  = a second DEBT, named here rather than hidden. `dispatcher` opens
 *         `# dispatcher` — no artifact, and a different heading level than
 *         every peer. to give it one is an IDENTITY decision about a role this
 *         lift does not touch, so it is the wisher's call rather than a
 *         mechanic's (rule.always.defer-fulcrums-to-last).
 *
 * ⇒ the allowlist is what makes the debt LOUD: a NEW role that ships a readme
 *   with no glyph fails this clamp, and cannot quietly join this one.
 */
const ROLES_WITHOUT_GLYPH = ['dispatcher'];

/**
 * 🔴 .what = the roles whose `boot.yml` is on disk and NOT declared
 *
 * .why  = this is a DEBT, named here rather than hidden. both files predate the
 *         supervisor/prioritizer lift and their curation has never once booted.
 *         the repair is a one-line `boot:` per role — but it changes what those
 *         roles load for every consumer, which is a behavior change outside the
 *         lift that found it (rule.always.fix-forward-under-scouts-honor: safe
 *         but unclean is a defer).
 *
 * ⇒ the allowlist is what makes the debt LOUD: a new role that drops its `boot:`
 *   fails this clamp, and these two cannot be quietly joined by a third.
 *
 * ⇒ tracked at `.dream/2026_09_22.fix-inert-bootyml-dispatcher-dreamer.dream.md`
 *   and as fulcrum `F7`. delete a row here when its `boot:` lands.
 */
const ROLES_WITH_INERT_BOOT = ['dispatcher', 'dreamer'];

/** .what = the role dirs on disk — a dir that holds a `get*Role.ts` */
const getAllRoleDirs = (): string[] =>
  readdirSync(DIR_ROLES)
    .filter((entry) => statSync(join(DIR_ROLES, entry)).isDirectory())
    .filter((entry) =>
      readdirSync(join(DIR_ROLES, entry)).some(
        (file) => file.startsWith('get') && file.endsWith('Role.ts'),
      ),
    )
    .sort();

describe('roleArtifacts', () => {
  const scene = useBeforeAll(async () => {
    const registry = getRoleRegistry();
    const dirs = getAllRoleDirs();
    return {
      registry,
      roles: [...registry.roles].sort((a, b) => (a.slug < b.slug ? -1 : 1)),
      dirs,
    };
  });

  given('[case1] the roles this package declares', () => {
    when('[t0] the registry and the filesystem are compared', () => {
      // ANTI-VACUITY: a registry that loaded none, or a walk that found none,
      // would satisfy every set claim below over two empty sets
      then('both hold the same, non-empty set of roles', () => {
        expect(scene.dirs.length).toBeGreaterThan(0);
        expect(scene.roles.map((role) => role.slug)).toEqual(scene.dirs);
      });
    });
  });

  given('[case2] each role dir on disk', () => {
    // 🔴 THE teeth for the readme half. the supervisor has no role dir at its
    //    source repo, so its readme is authored rather than ported — and the
    //    cost of the miss is an ADOPTION, never a crash
    when('[t0] its readme is read', () => {
      then('every role dir holds a readme.md', () => {
        const absent = scene.dirs.filter(
          (dir) => !existsSync(join(DIR_ROLES, dir, 'readme.md')),
        );
        expect(absent).toEqual([]);
      });

      then('every role DECLARES the readme it holds', () => {
        const undeclared = scene.roles
          .filter((role) => !role.readme?.uri)
          .map((role) => role.slug);
        expect(undeclared).toEqual([]);
      });

      // 🔴 the artifact cutover clamp. a port that keeps a role's OLD glyph
      //    ships the old identity under the new name. the retired set, and the
      //    package-wide ban on it, live in `glyphsRetired.integration.test.ts`
      //    — which is the one file permitted to write those characters, since
      //    a ban has to name what it bans
      then('the readme opens with the glyph the role wears', () => {
        const graded = scene.dirs
          .filter((dir) => !ROLES_WITHOUT_GLYPH.includes(dir))
          .map((dir) => {
            const first = readFileSync(
              join(DIR_ROLES, dir, 'readme.md'),
              'utf8',
            ).split('\n')[0];
            // 🔴 a role dir that neither declares a glyph nor sits on the named
            //    debt list is a NEW role nobody gave an identity to. it fails
            //    loud, because a silent skip is how the debt list grows
            const glyph =
              GLYPH_BY_ROLE[dir] ??
              MalfunctionError.throw(
                'a role wears no glyph and is not a named debt',
                {
                  dir,
                  declared: Object.keys(GLYPH_BY_ROLE),
                  knownDebt: ROLES_WITHOUT_GLYPH,
                  fix: 'add the role to GLYPH_BY_ROLE, or to ROLES_WITHOUT_GLYPH with a reason',
                },
              );
            return { role: dir, wearsIt: (first ?? '').includes(glyph) };
          });
        // ANTI-VACUITY: the expected set is built FROM the graded set, so an
        // empty `graded` — a debt list that grew to swallow every role — would
        // satisfy the claim below over two empty arrays. the two roles this
        // lift owns must be in it by name
        expect(graded.map(({ role }) => role)).toEqual(
          expect.arrayContaining(['supervisor', 'prioritizer']),
        );
        expect(graded).toEqual(
          graded.map(({ role }) => ({ role, wearsIt: true })),
        );
      });
    });
  });

  given('[case3] each boot.yml on disk', () => {
    // 🔴 THE teeth for the boot half. a `boot.yml` that no role declares is
    //    inert curation: it costs naught, buys naught, and every test passes
    when('[t0] the declarations are read', () => {
      const sceneBoot = useBeforeAll(async () => {
        const onDisk = scene.dirs.filter((dir) =>
          existsSync(join(DIR_ROLES, dir, 'boot.yml')),
        );
        const declared = scene.roles
          .filter((role) => !!role.boot?.uri)
          .map((role) => role.slug);
        return { onDisk, declared };
      });

      // ANTI-VACUITY: a repo with no boot.yml at all would pass the claim below
      then('the subject exists — at least one role ships curation', () => {
        expect(sceneBoot.onDisk.length).toBeGreaterThan(0);
      });

      then('every boot.yml on disk is declared, but for the named debt', () => {
        const inert = sceneBoot.onDisk.filter(
          (role) => !sceneBoot.declared.includes(role),
        );
        expect(inert).toEqual(ROLES_WITH_INERT_BOOT);
      });

      // the mirror: a `boot:` that points at an absent file fails at boot time,
      // on a consumer's machine, with no test between here and there
      then('every declared boot points at a file that exists', () => {
        const dangling = scene.roles
          .filter((role) => !!role.boot?.uri)
          .filter((role) => !existsSync(role.boot!.uri))
          .map((role) => role.slug);
        expect(dangling).toEqual([]);
      });
    });
  });

  given('[case4] the brief paths INSIDE each boot.yml', () => {
    // 🔴 one level deeper than `[case3]`, and a distinct failure. `[case3]`
    //    proves the curation file exists and is declared; this proves the file
    //    points at briefs that are still there.
    //
    //    the lift is exactly the event that breaks it: `F2` re-homed the
    //    `eco.*`/`goal.*` vocabulary from one seat to the other, and any boot
    //    entry left behind now names a path in a dir it no longer occupies.
    //
    //    ⚠️ it fails the way every hazard on this route fails — in silence. a
    //    boot that cannot find an entry loads the rest, so a session opens
    //    short of its curation with no error, and the only symptom is an actor
    //    that has not read the brief it was built to read.
    when('[t0] every non-glob entry is looked up on disk', () => {
      const scenePaths = useBeforeAll(async () => {
        const perRole = scene.dirs
          .filter((dir) => existsSync(join(DIR_ROLES, dir, 'boot.yml')))
          .map((dir) => {
            const lines = readFileSync(
              join(DIR_ROLES, dir, 'boot.yml'),
              'utf8',
            ).split('\n');
            // every line that LOOKS like a brief entry, by the loosest test
            // that cannot be wrong. the strict parse below is graded against
            // this, so a yaml shape the parse has yet to learn is caught as a
            // shortfall rather than absorbed as a smaller set
            const claimed = lines.filter((line) =>
              /^\s*-\s+briefs\//.test(line),
            ).length;
            // ⚠️ the `(?:#.*)?` arm carries weight. these files are more
            //    comment than yaml, so an entry that one day holds its reason
            //    inline is the likely next shape — and with no `#` arm the
            //    strict parse would drop it in SILENCE, which is the precise
            //    failure this whole clamp exists to forbid
            const parsed = lines
              .map(
                (line) =>
                  line.match(/^\s*-\s+(briefs\/[^\s#]+)\s*(?:#.*)?$/)?.[1],
              )
              .filter((path): path is string => !!path);
            // a glob is a pattern, not a pointer — it stands for whatever is
            // there, so an empty match is a curation question rather than a
            // broken path, and not this clamp's subject
            const cited = parsed
              .filter((path) => !path.includes('*'))
              .map((path) => ({ role: dir, cites: path }));
            return { role: dir, claimed, parsed: parsed.length, cited };
          });

        const cited = perRole.flatMap(({ cited: rows }) => rows);
        const unlanded = cited.filter(
          ({ role, cites }) => !existsSync(join(DIR_ROLES, role, cites)),
        );
        return { perRole, cited, unlanded };
      });

      // ANTI-VACUITY: a regex that matched no line would satisfy the claim
      // below over an empty set — which is this clamp's whole failure mode,
      // since the parse is hand-rolled
      then('the subject exists — the parse found real entries', () => {
        expect(scenePaths.cited.length).toBeGreaterThan(20);
      });

      // 🔴 and the parse must be COMPLETE over what it claims to read. an
      //    anti-vacuity floor catches a parse that found NO line; it is blind
      //    to one that found MOST — and a clamp that quietly grades a subset
      //    reports a clean verdict over a scope it narrowed itself
      then('🔴 the parse read every line that looks like an entry', () => {
        expect(
          scenePaths.perRole.map(({ role, claimed, parsed }) => ({
            role,
            complete: claimed === parsed,
          })),
        ).toEqual(
          scenePaths.perRole.map(({ role }) => ({ role, complete: true })),
        );
      });

      // and it must reach BOTH lifted seats, since the re-home is what makes a
      // boot entry go stale in the first place
      then('and it reached both lifted seats', () => {
        const reached = ['supervisor', 'prioritizer'].map((role) => ({
          role,
          reached: scenePaths.cited.some((entry) => entry.role === role),
        }));
        expect(reached).toEqual([
          { role: 'supervisor', reached: true },
          { role: 'prioritizer', reached: true },
        ]);
      });

      // 🔴 THE teeth. the failure names the seat and the path, so the fix is one
      //    read (rule.require.errors-name-the-fix)
      then('🔴 every boot entry lands on a brief that exists', () => {
        expect(scenePaths.unlanded).toEqual([]);
      });
    });
  });
});
