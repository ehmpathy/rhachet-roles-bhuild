import { readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * .what = every file under a dir, recursively, as an absolute path
 *
 * .why  = the guards in this directory each grade a claim over a whole TREE —
 *         every brief cites a real path, every fixture is tracked, no retired
 *         glyph survives anywhere. a tree claim needs a tree read.
 *
 *         ⚠️ and it must be a WALK, never a glob of extensions. a glob grades
 *         the list someone remembered to write; the walk grades what is there.
 *         a `.txt` fixture or a `.mjs` asset added later is caught by one and
 *         invisible to the other.
 *
 * .note = the word is `Recursive`, never `Deep`. this repo already had one:
 *         `domain.operations/behavior/init/initBehaviorDir.ts:21` declares a
 *         private `getAllFilesRecursive` on `main`. a second word for one
 *         concept is a synonym, and `rule.require.ubiqlang` allows exactly one.
 *
 *         ⚠️ `InTree` was rejected for the opposite reason — `tree` is a LIVE
 *         domain term here (a git worktree in a grove), so `getAllFilesInTree`
 *         reads as a claim about a worktree (`rule.forbid.ambiguous-labels`).
 *         and `Recursively` is an adverb, where the house shape is
 *         `[verb][...noun][adj]` (`rule.require.order.noun_adj`).
 *
 * .found by = peer review i010, `arch-opport-decomposition` nitpick.1 — which
 *         argued from clarity. the synonym above is the stronger ground, and it
 *         was found only by a grep for the precedent the reviewer implied.
 *
 * .note = this lives under `.test/` deliberately — `tsconfig.build.json`
 *         excludes `**‌/.test/**‌/*`, so a dev-only helper cannot compile into
 *         `dist/` as a shipped asset. that is the exact defect `case=8` found
 *         in `work.harness.ts`, which carried no `.test` in its path and so
 *         matched no exclude at all.
 */
export const getAllFilesRecursive = (input: { dir: string }): string[] =>
  readdirSync(input.dir).flatMap((entry) => {
    const path = join(input.dir, entry);
    return statSync(path).isDirectory()
      ? getAllFilesRecursive({ dir: path })
      : [path];
  });
