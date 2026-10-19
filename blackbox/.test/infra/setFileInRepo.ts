import fs from 'fs';
import path from 'path';

/**
 * .what = writes a fixture file into a temp repo, and refuses any write that would land outside it
 *
 * .why  = 🔴 a consumer repo links `.claude` to the actor brain dir, and that dir's
 *         `settings.json` links on to the host's own `~/.claude/settings.json`. a bare
 *         `fs.writeFileSync` follows every link, so a fixture write to
 *         `<repo>/.claude/settings.json` overwrote the global claude settings of the
 *         machine that ran the suite (2026-10-19, rhachet 1.50 layout).
 *
 *         a test fixture has no reason to write through a link at all, so the guard
 *         refuses two shapes:
 *         - the target itself is a link — the write would land wherever it points
 *         - the target's real parent dir sits outside the repo's real dir
 */
export const setFileInRepo = (input: {
  repoDir: string;
  path: string;
  content: string;
}): { path: string } => {
  // the target, as the caller named it
  const target = path.isAbsolute(input.path)
    ? input.path
    : path.join(input.repoDir, input.path);

  // refuse a target that is itself a link, even one that dangles
  const isLink = (() => {
    try {
      return fs.lstatSync(target).isSymbolicLink();
    } catch {
      return false; // absent: a fresh file, no link to follow
    }
  })();
  if (isLink)
    throw new Error(
      [
        `setFileInRepo: refused a write through a link`,
        `  target: ${target}`,
        `  links:  ${fs.readlinkSync(target)}`,
        `  fix:    write the file the link points at by its in-repo path, or drop the write`,
      ].join('\n'),
    );

  // refuse a target whose real parent dir escapes the repo — checked on the nearest
  // extant ancestor, before any mkdir, so a refusal leaves naught behind outside
  const repoReal = fs.realpathSync(input.repoDir);
  const parentReal = fs.realpathSync(
    getNearestExtantDir({ dir: path.dirname(target) }),
  );
  const isInside =
    parentReal === repoReal || parentReal.startsWith(repoReal + path.sep);
  if (!isInside)
    throw new Error(
      [
        `setFileInRepo: refused a write outside the repo`,
        `  target: ${target}`,
        `  lands:  ${parentReal}`,
        `  repo:   ${repoReal}`,
      ].join('\n'),
    );

  // the write itself
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, input.content);
  return { path: target };
};

/**
 * .what = the closest ancestor of a dir that exists on disk (the dir itself, if it does)
 * .why  = realpath needs an extant path; the guard must judge a fresh dir by where its
 *         extant ancestor really sits, before it creates aught
 */
const getNearestExtantDir = (input: { dir: string }): string =>
  fs.existsSync(input.dir)
    ? input.dir
    : getNearestExtantDir({ dir: path.dirname(input.dir) });
