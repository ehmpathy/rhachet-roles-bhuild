/**
 * .what = the shared harness of the `work.surface` suite — the dirs it reads,
 *         and the text readers its static clamps share
 *
 * .suite = clamps on the SKILL SURFACE over the *work libs
 *
 * .why  = these libs were moved out of `~/.bash_aliases.*work.sh` and in
 *         beside the skills for one stated reason: **no risk of collision**.
 *         the global dotfiles are owned by `bert/dev-env-setup`'s
 *         `install_env`, so whichever wrote last won and a reinstall silently
 *         erased the newer copy.
 *
 *         that guarantee is a property of every skill at once, and one skill
 *         that reverts to the global would reopen the hole with no visible
 *         symptom until a reinstall. so it is clamped across the whole
 *         surface rather than skill by skill.
 *
 *         the second clamp here is subtler and cost a live failure: the source
 *         must be UNCONDITIONAL. an earlier crewwork guarded it with
 *           declare -f duct.open >/dev/null || source ...
 *         which read as thrift and was a silent DOWNGRADE — a skill runs under
 *         a shell whose rc has already sourced the global copy, so the guard
 *         was satisfied by the OLDER version and the repo's own never loaded.
 *         the first crew.boot failed on `unknown arg '--cwd'` against a lib
 *         that had supported --cwd for an hour.
 *
 * .how  = read the files. no substrate, no subprocess — this is a property of
 *         the text, so the text is the subject.
 */
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

import {
  getShellLibParts,
  getShellLibWhole,
  getShellSkillWhole,
} from '../../../.test/getShellLibWhole';

export const DIR_SKILLS = join(__dirname, '..');
export const DIR_WORK = __dirname;

/** every *.sh directly under skills/ (the surface a caller invokes) */
export const getSkillFiles = (): string[] =>
  readdirSync(DIR_SKILLS)
    .filter((f) => f.endsWith('.sh'))
    .map((f) => join(DIR_SKILLS, f));

/**
 * .what = every *work.sh lib, AND every part each one declares
 * .why  = a lib cut into parts (crewwork.sh → crewwork.heal.sh, …) keeps its
 *         code in files whose names do not end in `work.sh`. a scan that walked
 *         the name alone would read the core and go blind to every line that
 *         moved — so each per-file clamp here reads the parts as files too.
 */
export const getLibFiles = (): string[] =>
  readdirSync(DIR_WORK)
    .filter((f) => f.endsWith('work.sh'))
    .map((f) => join(DIR_WORK, f))
    .flatMap((path) => [path, ...getShellLibParts({ path })]);

export const read = (path: string): string => readFileSync(path, 'utf8');

/**
 * .what = a file's CODE, with every comment line dropped
 *
 * .why  = these clamps hunt for anti-patterns by their text, and the files
 *         that most carefully DOCUMENT an anti-pattern are the files that
 *         quote it. crewwork's header quotes the exact `declare -f ... ||
 *         source` guard it exists to warn against, so a naive read flags the
 *         one file that got it right.
 *
 *         a clamp that fires on prose is a clamp whose red carries no signal,
 *         and the cure is to narrow the SUBJECT to what the claim is about:
 *         the code, never the commentary.
 */
export const asCode = (text: string): string =>
  text
    .split('\n')
    .filter((line) => !/^\s*#/.test(line))
    .join('\n');
export const readCode = (path: string): string => asCode(read(path));

/**
 * .what = a lib's CODE whole — its core and every part it declares
 * .why  = a clamp on one lib's behavior (crewwork's, say) names the LIB, never
 *         the file a function happens to sit in. read the core alone and a
 *         `toContain` goes red on a line that moved, while a `not.toContain`
 *         goes green over a line that still ships
 */
export const readCodeWhole = (path: string): string =>
  asCode(getShellLibWhole({ path }));

/**
 * .what = the poll skill whole — its entrypoint, then every stage it runs
 * .why  = the poll's body lives in work/pollwork.<part>.sh; a clamp on what the
 *         poll renders reads the stages, or it reads only the arg surface
 */
export const readPollWhole = (): string =>
  getShellSkillWhole({
    path: join(DIR_SKILLS, 'git.crew.poll.sh'),
    stages: join(DIR_WORK, 'pollwork.sh'),
  });

/**
 * .what = does this code source a global dotfile we do not own?
 *
 * .note = it matches a source at a line start OR after `||`, `&&`, or `;`.
 *         the first draft anchored to line start alone, and the teeth test
 *         below caught it: the real defect shape was
 *           declare -f duct.open >/dev/null || source ~/.bash_aliases...
 *         where the source sits MID-LINE, so the one form that actually bit
 *         us was the one form the detector could not see.
 */
export const hasGlobalSource = (code: string): boolean =>
  /(^|\|\||&&|;)\s*(\.|source)\s+\S*bash_aliases/m.test(code);

/** .what = does this code guard its source behind a `declare -f` check? */
export const hasGuardedSource = (code: string): boolean =>
  /declare\s+-f\s+\S+\s*>\/dev\/null[^\n]*\|\|\s*(\.|source)/.test(code);

/** the skills that compose a *work lib, found by their own source line */
export const getSkillsThatSource = (): { path: string; body: string }[] =>
  getSkillFiles()
    .map((path) => ({ path, body: read(path) }))
    .filter(({ body }) =>
      /source\s+.*work\/\w+work\.sh|DUCTWORK_LIB=/.test(body),
    );
