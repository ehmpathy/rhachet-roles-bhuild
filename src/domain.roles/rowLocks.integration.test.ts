/**
 * .what = clamps that every read-modify-write on a registry ROW is held under a
 *         `flock`, so two concurrent writers cannot lose one another's update
 *
 * .why  = raised as three blockers by the `arch-hazards-behavior` peer lane at
 *         i007, against `rule.forbid.behavior-hazards`. each site read a json
 *         row, merged a field in memory, then rewrote the whole file — with no
 *         lock between the read and the write. two writers interleave and one
 *         update is lost, silently:
 *
 *         | the row | the field lost | the cost |
 *         |---|---|---|
 *         | `ducts/{session}.json` | `sessionId` | a clone's identity. `claude --resume <uuid>` is the ONLY lever that recovers a crashed clone; absent it the fallback resolves by cwd-recency, and two roles share one worktree |
 *         | `ducts/{session}.json` | `host` | a duct that reports the wrong machine |
 *         | `crews/{tree}.json` | `bootedFirst` | the fleet can no longer be ordered by age, and the value is unrecoverable — the row was its only copy |
 *
 *         ⇒ and an interleave mid-write yields invalid json, which breaks every
 *           later read of a row `crewwork.sh` itself calls "the only record a
 *           crew ever existed".
 *
 * .how  = a STATIC read of the shipped shell. a genuine race test is
 *         inherently flaky — it passes whenever the scheduler happens to
 *         serialize — so it would be a clamp with no teeth on most runs. the
 *         structural property (the mutation is inside a lock) is what actually
 *         holds the invariant, and it is decidable from the file.
 *
 *         ⇒ so this clamp catches the two regressions that matter: a lock
 *           REMOVED from a guarded site, and a NEW mutation site added beside
 *           the guarded ones with no lock of its own. the second is the likely
 *           one, and it is the shape that produced these three blockers.
 *
 * .note = it reads the filesystem, so it is an integration test rather than a
 *         unit one (rule.forbid.unit.remote-boundaries).
 *
 * .note = the fix keeps the read INSIDE the lock, which is stronger than the
 *         read-then-lock-then-re-verify shape `termwork.sh` uses. termwork
 *         needs the weaker shape because it reads for other purposes too; these
 *         rows are read only to merge onto, so the whole operation fits in one
 *         critical section and no re-verify is owed.
 */
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getShellLibWhole } from './.test/getShellLibWhole';

const DIR_WORK = join(__dirname, 'supervisor', 'skills', 'work');

/**
 * .what = every shell function that mutates a registry row, and the lib it lives in
 * .why  = named one by one rather than found by a pattern, because the SET is the
 *         claim. a pattern that scanned for `jq` would grow silently as the corpus
 *         grows, and a clamp whose subject set drifts is a clamp that stops biting
 */
const SITES_ROW_MUTATE: { lib: string; fn: string; row: string }[] = [
  {
    lib: 'ductwork.sh',
    fn: '__duct_register_duct',
    row: 'ducts/{session}.json',
  },
  {
    lib: 'ductwork.sh',
    fn: '__duct_set_duct_session_id',
    row: 'ducts/{session}.json',
  },
  { lib: 'crewwork.sh', fn: '__crew_ledger_set', row: 'crews/{tree}.json' },
];

/**
 * .what = reads one shell function's body out of a lib, by brace depth
 * .why  = a line-number slice would rot on the next edit above it, and a regex
 *         for the closing brace cannot tell a nested `}` from the function's own
 */
const getOneShellFnBody = (input: { text: string; fn: string }): string => {
  const start = input.text.indexOf(`${input.fn}() {`);
  if (start < 0) return '';
  let depth = 0;
  for (let i = start; i < input.text.length; i++) {
    if (input.text[i] === '{') depth++;
    if (input.text[i] === '}') {
      depth--;
      if (depth === 0) return input.text.slice(start, i + 1);
    }
  }
  return '';
};

describe('rowLocks', () => {
  const scene = useBeforeAll(async () => {
    // .why WHOLE: a lib cut into parts keeps a site in a part file —
    //      `__crew_ledger_set` lives in crewwork.ledger.sh — and a read of the
    //      core alone would report it absent, a rename where there was none
    const libs = new Map(
      ['ductwork.sh', 'crewwork.sh', 'termwork.sh'].map((lib) => [
        lib,
        getShellLibWhole({ path: join(DIR_WORK, lib) }),
      ]),
    );
    const graded = SITES_ROW_MUTATE.map((site) => {
      const body = getOneShellFnBody({
        text: libs.get(site.lib) ?? '',
        fn: site.fn,
      });
      return {
        fn: site.fn,
        found: body.length > 0,
        // the pair that makes a lock real: the acquire, AND the fd the brace
        // group redirects. either alone is a lock that holds no row
        locked: body.includes('flock 9') && body.includes('} 9>'),
      };
    });
    return { libs, graded };
  });

  given('[case1] the three registry-row mutation sites', () => {
    when('[t0] each function body is read out of its lib', () => {
      // ANTI-VACUITY: a body the reader failed to find is an empty string, and
      // `''.includes('flock 9')` is false — so a broken reader would fail the
      // teeth below for the WRONG reason. assert the subject was reached first,
      // so a failure names a rename rather than an absent lock
      then('every site was actually found in its lib', () => {
        expect(scene.graded.map(({ fn, found }) => ({ fn, found }))).toEqual([
          { fn: '__duct_register_duct', found: true },
          { fn: '__duct_set_duct_session_id', found: true },
          { fn: '__crew_ledger_set', found: true },
        ]);
      });

      // 🔴 THE teeth. it goes red if a lock is stripped from any site
      then('🔴 every row mutation is held under a flock', () => {
        expect(scene.graded.map(({ fn, locked }) => ({ fn, locked }))).toEqual([
          { fn: '__duct_register_duct', locked: true },
          { fn: '__duct_set_duct_session_id', locked: true },
          { fn: '__crew_ledger_set', locked: true },
        ]);
      });
    });
  });

  given('[case2] the two duct mutations that race EACH OTHER', () => {
    when('[t1] their lock keys are compared', () => {
      // 🔴 the subtle half, and the one a per-function lock would get wrong.
      //    duct.open is a findsert, so a re-boot calls register while a live
      //    clone may be mid-bind. a lock keyed on the OPERATION would serialize
      //    each function against itself and leave the cross-pair race open.
      //    the key must name the ROW.
      then('🔴 both key on the ROW, so the pair is mutually exclusive', () => {
        const text = scene.libs.get('ductwork.sh') ?? '';
        const keys = ['__duct_register_duct', '__duct_set_duct_session_id'].map(
          (fn) => {
            const body = getOneShellFnBody({ text, fn });
            const match = body.match(/__duct_lock_path "([^"]+)"/);
            return { fn, key: match ? match[1] : null };
          },
        );
        expect(keys).toEqual([
          { fn: '__duct_register_duct', key: 'duct.$session' },
          { fn: '__duct_set_duct_session_id', key: 'duct.$session' },
        ]);
      });
    });
  });

  given('[case3] a blind whole-row overwrite is NOT this defect', () => {
    when('[t2] __duct_register_host is read', () => {
      // 🔴 recorded because a prior round of MINE listed this as a fourth
      //    read-modify-write site, and it is not one — it has no read at all.
      //    the peer lane raised three, not four, and it was right.
      //
      //    a blind single-field overwrite where every writer computes the same
      //    field is correct by construction for `lastSeen`: last-writer-wins IS
      //    the wanted semantic, and there is no prior value to lose.
      //
      //    ⇒ a lock here would buy no correctness and cost a boot-path
      //      serialization, so its ABSENCE is the deliberate call this asserts.
      then('it performs no read, so there is no update to lose', () => {
        const body = getOneShellFnBody({
          text: scene.libs.get('ductwork.sh') ?? '',
          fn: '__duct_register_host',
        });
        expect(body.length).toBeGreaterThan(0);
        expect(body.includes('jq')).toEqual(false);
      });
    });
  });
});
