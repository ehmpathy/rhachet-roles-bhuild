import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

/**
 * .what = the clamp that keeps a concrete sev/urg out of every command a
 *        shipped executable SUGGESTS to a human
 *
 * .why  = `rule.forbid.fabricated-opines` grades a concrete `--sev pN` in an
 *        example, `--help` line, nudge, or prompt a **blocker**: a clone never
 *        authors a human's judgment, and a suggested value reads as a
 *        recommendation whatever the prose beside it says.
 *
 *        it recurred. the rule's own measured case (2026-09-13) scrubbed three
 *        surfaces that carried `--sev p1 --urg 1w`, and TWO more survived it —
 *        both nudges in `ecowork.db.goal.mjs`, each printed at the moment a
 *        human is most apt to copy-paste. a prose rule caught neither; only a
 *        scan can, so this is that scan.
 *
 * .note = the bound is EXECUTABLES, never prose. a brief must be free to quote
 *        the anti-pattern to teach it — `rule.forbid.fabricated-opines.md`
 *        itself prints `--sev p1 --urg 1w` twice, on purpose. only a file that
 *        EMITS text at runtime can recommend a value, so only those are read.
 *
 * .note = an ENUMERATION is not a recommendation, and the regex below draws
 *        that line. an args table that reads `--sev p0 | p1 | p2 | p3 | p5`
 *        shows the vocabulary, which `rule.require.discoverability` REQUIRES
 *        ("show the options; do not make the human remember them"). a
 *        recommendation names exactly ONE rung, so the `| p` that follows an
 *        enumerated value is what tells the two apart.
 */
describe('opineValuesAbsent', () => {
  const DIR_ROLES = __dirname;

  // a concrete opine in a suggested command — the shape the rule forbids.
  // the lookahead spares an enumeration, which lists its alternatives with `|`
  const RE_OPINE_CONCRETE =
    /--sev\s+p\d(?!\s*\|)|--urg\s+\d+[hdwm]\b(?!\s*\|)/g;

  // shipped files that EMIT text at runtime; prose is deliberately excluded
  const isExecutableShipped = (path: string): boolean =>
    !/\.test\.[a-z]+$/.test(path) &&
    !path.includes('/.test/') &&
    /\.(sh|mjs)$/.test(path);

  const getAllFilesUnder = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? getAllFilesUnder(path) : [path];
    });

  const scene = useBeforeAll(async () => {
    const files = getAllFilesUnder(DIR_ROLES).filter(isExecutableShipped);
    const hits = files.flatMap((path) => {
      const found = readFileSync(path, 'utf-8').match(RE_OPINE_CONCRETE) ?? [];
      return found.map((term) => `${relative(DIR_ROLES, path)}: ${term}`);
    });
    return { files, hits };
  });

  given('[case1] every shipped executable under src/domain.roles', () => {
    when('[t0] each is read for a concrete sev or urg', () => {
      then('the scan is not vacuous — it read the surfaces that nudge', () => {
        // ANTI-VACUITY: a filter that matched naught would pass over naught
        const rel = scene.files.map((f) => relative(DIR_ROLES, f));
        expect(rel).toContain('prioritizer/skills/eco.priority.sh');
        expect(rel).toContain('prioritizer/skills/work/ecowork.db.goal.mjs');
      });

      then('🔴 no shipped executable suggests an opine value', () => {
        expect(scene.hits).toEqual([]);
      });
    });
  });

  given('[case2] the two nudges as they read before the repair', () => {
    when('[t0] each is held against the same scan', () => {
      then('🔴 both go RED — the bite proof', () => {
        const before = [
          `⇒ declare the whole first:  rhx eco.priority set --slug 'x' --what '...' --sev p2 --urg 1m`,
          `     rhx eco.priority set --slug 'y' --what '...' --sev p2 --urg 1m`,
        ].join('\n');
        expect(before.match(RE_OPINE_CONCRETE)).toEqual([
          '--sev p2',
          '--urg 1m',
          '--sev p2',
          '--urg 1m',
        ]);
      });

      then('the placeholder form they were repaired to stays GREEN', () => {
        const after = `rhx eco.priority set --slug 'x' --what '...' --sev <p0|p1|p2|p3|p5> --urg <1d|3d|1w|1m>`;
        expect(after.match(RE_OPINE_CONCRETE)).toEqual(null);
      });
    });
  });

  given('[case3] an args table that ENUMERATES the vocabulary', () => {
    when('[t0] it is held against the same scan', () => {
      then('🟢 it stays GREEN — an enumeration is not a recommendation', () => {
        // `rule.require.discoverability` REQUIRES this table. a clamp that
        // reddened it would force an author to delete a rule-mandated surface,
        // so the carve-out is asserted rather than left to the regex to imply
        const table = [
          '#   --sev         p0 | p1 | p2 | p3 | p5     how bad it is if unfixed',
          '#   --urg         1h | 1d | 3d | 1w | 1m     by when it stops to be worth it',
        ].join('\n');
        expect(table.match(RE_OPINE_CONCRETE)).toEqual(null);
      });
    });
  });
});
