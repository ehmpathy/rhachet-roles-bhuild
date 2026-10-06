/**
 * .what = a hermetic temp dir, and the sweep that proves a suite left none
 *
 * .why  = 🔴 these are **role-neutral**, and they used to live inside
 *         `supervisor/skills/work/work.harness.ts` — a module whose own header
 *         scopes it to *"the test harness for the `*work` shell libs"*, with
 *         tmux sockets, crew recorders, and bash drivers beside them.
 *
 *         so a **prioritizer** suite that wanted a temp dir had to reach into
 *         the **supervisor's** internal test module to get it:
 *
 *           import { genTempDir } from '../../supervisor/skills/work/work.harness'
 *
 *         ⇒ that is a scope leak in the literal sense — one bounded context
 *         reaches into another's interior — and a decomposition miss:
 *         `rule.prefer.most-common-denominator` says 2+ siblings that need a
 *         capability lift it to their common ancestor, reactively, on the
 *         second use. the second use had already arrived.
 *
 *         ⚠️ and it leaked in the direction that costs most. the whole subject
 *         of this lift is a **role split**, so a fresh cross-role edge minted
 *         BY the lift's own test suites is the defect the split exists to end.
 *
 * .how  = `src/domain.roles/.test/` is the common ancestor of every role dir,
 *         and it already holds shared suite operations
 *         (`getAllFilesRecursive`). the supervisor's tmux/crew-specific harness
 *         stays where it is.
 *
 * .note = ONE export, a single object, and that shape is load-central rather
 *         than cosmetic. the three operations are the only legal moves on one
 *         piece of module-private state (`DIRS_TEMP`), so a one-procedure-per-
 *         file split cannot be done without EXPORTING that mutable array —
 *         which trades a multi-export file for an exported mutable global
 *         (`rule.require.immutable-vars`, `rule.forbid.hidden-side-effects`),
 *         a strictly worse outcome. the object keeps the registry private and
 *         still leaves the file with one exported name that matches its
 *         filename (`rule.require.sync-filename-opname`).
 *
 *         ⇒ the precedent is the dao shape `rule.forbid.barrel-exports` calls
 *         out by name — `daoAwsOrganization = { getOne, getAll, set, del }` —
 *         a generator/getter/deleter triad over one shared store. that rule's
 *         subject is a re-export FORWARDER; this file forwards naught, it
 *         declares.
 *
 * .note = a dot-dir, so `tsconfig.build.json` excludes it from `dist/` and
 *         `buildBoundary` reads it as dev-only by construction — the same
 *         treatment `work.harness.ts` needed and did not get until `case=8`.
 *
 * .found by = peer review i003, `enroll-impl-arch-defects` (the lift out of the
 *         supervisor) and i010, `arch-opport-decomposition` blocker.1 (the
 *         collapse to one export).
 */
import { mkdtempSync, rmSync } from 'fs';
import { MalfunctionError } from 'helpful-errors';
import { tmpdir } from 'os';
import { join } from 'path';

/** every temp dir this process made, so a teardown can prove it left none */
const DIRS_TEMP: string[] = [];

const PREFIX = 'work-test-';

export const tempDirs = {
  /**
   * .what = the name prefix every dir here carries
   * .why  = a stale-litter sweep needs it to tell OUR debris from a stranger's
   */
  prefix: PREFIX,

  /**
   * .what = a hermetic temp dir, unique per call
   * .why  = every test that touches the filesystem must be able to run beside
   *         another copy of itself without a collision
   *         (`rule.require.hermetic-tests`)
   * .note = each dir is recorded, so `delAll()` can sweep them. a suite that
   *         never calls that leaves one dir per invocation in the shared /tmp —
   *         which is exactly what 300+ stale `work-test-*` dirs turned out to
   *         be.
   */
  genOne: (input: { slug: string }): string => {
    const dir = mkdtempSync(join(tmpdir(), `${PREFIX}${input.slug}-`));
    DIRS_TEMP.push(dir);
    return dir;
  },

  /**
   * .what = every temp dir `genOne` made in THIS process, so far
   *
   * .why  = a stale-litter sweep must be able to tell a CORPSE from a live dir
   *         this very run owns. `delStaleTestDirs` walks the shared /tmp and
   *         reaps what looks abandoned — and without this read it would reap
   *         the dirs its own suite is mid-use of.
   *
   * .note = a copy, never the live array. a sweep is a READER of this list;
   *         only `genOne` appends to it and only `delAll` clears it.
   */
  getAll: (): string[] => [...DIRS_TEMP],

  /**
   * .what = remove every temp dir `genOne` made in THIS process
   * .why  = a suite that litters the shared /tmp is not hermetic in the way
   *         that matters over time: each run is clean, and the thousandth run
   *         has left a thousand dirs behind. call it from an afterAll.
   * .note = it sweeps only what this process made — never a bare prefix glob,
   *         so a parallel run of the same suite cannot reap its peer's dirs.
   *
   * .note = 🔴 it FAILS LOUD, and the shape of that is deliberate.
   *
   *         `force: true` already absorbs an absent path, so ENOENT never
   *         reaches a catch here — which means any error that DOES reach one is
   *         a real fault (EPERM, EBUSY: the dir is still on disk and would not
   *         go). a bare `catch {}` could therefore swallow only real faults,
   *         and that is precisely `rule.forbid.failhide`.
   *
   *         ⚠️ but a plain rethrow inside the loop is the wrong repair: it
   *         abandons every dir after the first failure, so one stuck dir turns
   *         into N of them and `DIRS_TEMP` is never cleared. so the sweep
   *         attempts EVERY dir, collects what would not go, and throws once at
   *         the end with all of them named (`rule.require.failloud`).
   */
  delAll: (): string[] => {
    const swept = [...DIRS_TEMP];
    const stuck: { dir: string; why: string }[] = [];
    for (const dir of swept) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch (error) {
        stuck.push({ dir, why: (error as Error)?.message ?? String(error) });
      }
    }
    DIRS_TEMP.length = 0;
    if (stuck.length)
      throw new MalfunctionError(
        'tempDirs.delAll could not remove every temp dir it made',
        {
          stuck,
          swept: swept.length,
          hint: 'a dir that will not go is usually still held by a child process this suite left alive — check its afterAll teardown order',
        },
      );
    return swept;
  },
};
