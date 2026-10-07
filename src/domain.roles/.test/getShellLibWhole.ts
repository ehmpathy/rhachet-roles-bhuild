import { readFileSync } from 'fs';
import { basename, dirname, join } from 'path';

/**
 * .what = the paths of the PARTS a sourced shell lib declares, in load order
 *
 * .why  = a lib too large for one reviewer's window is cut into parts, and the
 *         core names them in one array — `CREWWORK_PARTS=(ledger view …)` — that
 *         its own loader walks. this reads that SAME array, so a test sees the
 *         parts the shell sources, never a list someone kept beside it.
 *
 * .note = a lib that declares no parts has none, and the result is `[]`.
 */
export const getShellLibParts = (input: { path: string }): string[] => {
  const text = readFileSync(input.path, 'utf8');
  const [, declared = ''] = /^[A-Z][A-Z0-9_]*_PARTS=\(([^)]*)\)/m.exec(text) ?? [];
  const base = basename(input.path, '.sh');
  return declared
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => join(dirname(input.path), `${base}.${part}.sh`));
};

/**
 * .what = the text of a sourced shell lib WHOLE — its core, then each part it
 *         declares, in load order
 *
 * .why  = 🔴 a source clamp greps a lib for a line it must hold. once the lib
 *         is cut into parts, a read of the core alone would miss every line
 *         that moved — and a `not.toContain` clamp would then pass for the WRONG
 *         reason, blind to a line that still ships. the whole lib is the subject
 *         a `source` defines, so it is the subject a source clamp reads.
 *
 * .note = each file is kept intact and joined by a newline, so a function body
 *         never straddles two files and a brace-depth read of one still works.
 */
export const getShellLibWhole = (input: { path: string }): string =>
  [input.path, ...getShellLibParts(input)]
    .map((path) => readFileSync(path, 'utf8'))
    .join('\n');

/**
 * .what = the text of a skill ENTRYPOINT whole — its own file, then the whole of
 *         the stage lib its body was cut into
 *
 * .why  = an entrypoint too large for one window keeps its arg surface and a
 *         list of stage calls, and moves each stage into a lib with parts
 *         (git.crew.poll.sh → work/pollwork.sh). a clamp on the skill's source
 *         reads what the skill RUNS, so it reads both.
 *
 * .note = the stage lib is named, never derived from the entrypoint's `source`
 *         lines — those also pull in libs the skill shares with its peers
 *         (crewwork.sh), and a read that grew by a shared lib would let a
 *         `toContain` clamp pass on a line the skill never holds.
 */
export const getShellSkillWhole = (input: {
  path: string;
  stages: string;
}): string =>
  [readFileSync(input.path, 'utf8'), getShellLibWhole({ path: input.stages })].join(
    '\n',
  );
