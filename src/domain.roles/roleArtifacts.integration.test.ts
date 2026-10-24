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
 *
 * .run  = ci runs it on each push. a local run skips it after a brief edit (an edit to a
 *         `.md` imports no module, so `--changedSince` passes over it), so run it by hand:
 *         `rhx git.repo.test --what integration --scope path://roleArtifacts --mode apply`
 */
import { spawn } from 'child_process';
import {
  closeSync,
  cpSync,
  existsSync,
  openSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'fs';
import { MalfunctionError } from 'helpful-errors';
import { join, relative } from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';
import { stripVTControlCharacters } from 'util';

import { getRoleRegistry } from './getRoleRegistry';

const DIR_ROLES = __dirname;
const DIR_REPO = join(__dirname, '..', '..');
const PATH_RHACHET_BIN = join(DIR_REPO, 'node_modules', '.bin', 'rhachet');

// one boot measured 2–6s on a loaded box; a hung boot is killed, and its verdict names the signal.
// boots run as async processes, so the jest hook timeout still holds over the whole set.
// it sits under that hook timeout (90s, jest.integration.env.ts), so one boot phase cannot
// outlive its hook; a hook that boots in sequence may abort first, and its child then ends at
// this timeout, never later
const MS_BOOT_TIMEOUT = 85_000;

// the roles that boot in a director seat, each under a declared budget
const ROLES_WITH_BUDGET = [
  'behaver',
  'decomposer',
  'prioritizer',
  'supervisor',
] as const;

// the two yaml shapes rhachet reads for a budget: the block form, and the flow form.
// each captures (head)(digits)(tail), so one replacer serves both
const REGEX_BUDGET_BLOCK =
  /^(budget:\s*\n\s+tokens:[ \t]*)([\d_]+)([ \t]*(?:#.*)?)$/m;
const REGEX_BUDGET_FLOW =
  /^(budget:\s*\{\s*tokens:\s*)([\d_]+)(\s*\}[ \t]*(?:#.*)?)$/m;

/**
 * .what = the `budget:` a boot.yml declares — present or not, and its tokens where readable
 * .why  = rhachet exports no reader for it, and this repo takes no direct yaml dependency.
 *         `present` without `tokens` is a shape this reader lacks, so a red clamp says so,
 *         rather than tell the author to add a budget they already declared
 */
const asBootBudget = (input: {
  yaml: string;
}): { present: boolean; tokens: number | null } => {
  const digits =
    input.yaml.match(REGEX_BUDGET_BLOCK)?.[2] ??
    input.yaml.match(REGEX_BUDGET_FLOW)?.[2] ??
    null;
  return {
    present: /^budget:/m.test(input.yaml),
    tokens: digits === null ? null : Number(digits.replace(/_/g, '')),
  };
};

/**
 * .what = the boot.yml with its declared `budget: tokens:` set to the given count
 * .why  = the write twin of `asBootBudget`, so a test can force a budget by name
 */
const asBootYamlWithBudget = (input: {
  yaml: string;
  tokens: number;
}): string => {
  const regex = REGEX_BUDGET_BLOCK.test(input.yaml)
    ? REGEX_BUDGET_BLOCK
    : REGEX_BUDGET_FLOW;
  if (!regex.test(input.yaml))
    throw new MalfunctionError('boot.yml declares no budget to rewrite', {
      yaml: input.yaml,
      fix: 'declare `budget:\\n  tokens: <n>` (or `budget: { tokens: <n> }`) in the boot.yml first',
    });
  return input.yaml.replace(
    regex,
    (_whole, head: string, _digits: string, tail: string) =>
      `${head}${input.tokens}${tail}`,
  );
};

/**
 * .what = the verdict of one `rhachet roles boot`, shaped for one assertion
 * .why  = a red clamp must name the role, the render, and rhachet's own reason,
 *         so the fix is one read (rule.require.errors-name-the-fix)
 * .note = rhachet reports on stderr; stdout is the payload, read only where stderr is blank
 */
const asBootVerdict = (input: {
  role: string;
  render: 'src' | 'linked';
  result: {
    status: number | null;
    signal: NodeJS.Signals | null;
    stdout: string;
    stderr: string;
    error: Error | null;
  };
}): {
  role: string;
  render: 'src' | 'linked';
  exit: number | null;
  why: string | null;
} => ({
  role: input.role,
  render: input.render,
  exit: input.result.status,
  why:
    input.result.status === 0
      ? null
      : asLinesBounded({
          text: [
            input.result.stderr.trim() || input.result.stdout.trim(),
            input.result.signal
              ? `killed by signal ${input.result.signal}`
              : '',
            input.result.error ? String(input.result.error) : '',
            // the path rhachet names is a temp seat; this is the one the author can run
            `repro: npx rhachet roles cost --what src/domain.roles/${input.role}/boot.yml${input.render === 'linked' ? ' — the linked render costs a little more than src' : ''}`,
          ].join('\n'),
          max: 60,
        }),
});

/**
 * .what = the non-blank lines of a text, kept whole up to `max`, else its head and tail
 *         around a marker that names how many lines were cut
 * .why  = a reason can sit at either end — rhachet's fixes at the tail, a payload's error at
 *         its end — and a cut must read as a cut, never as the whole message
 */
const asLinesBounded = (input: { text: string; max: number }): string => {
  const lines = input.text.split('\n').filter((line) => line.trim());
  if (lines.length <= input.max) return lines.join('\n');
  const half = Math.floor(input.max / 2);
  return [
    ...lines.slice(0, half),
    `… <${lines.length - half * 2} lines cut>`,
    ...lines.slice(-half),
  ].join('\n');
};

/**
 * .what = the structure of a boot payload: every tag and every ref path, with each said
 *         body and the `<stats>` block dropped
 * .why  = this is what a seat is handed — which briefs it reads, which it may fetch. a cut
 *         brief or an empty render changes it; a reworded body or a token count does not
 */
const asBootManifest = (input: { stdout: string; repoDir: string }): string =>
  stripVTControlCharacters(input.stdout)
    .split(input.repoDir) // the seat is a temp dir; its path varies per run
    .join('<repo>')
    .split('\n')
    .reduce<{ kept: string[]; closer: string | null; keepCloser: boolean }>(
      (acc, line) => {
        // inside a dropped body: skip until its closer
        if (acc.closer)
          return line.trim() === acc.closer
            ? {
                kept: acc.keepCloser ? [...acc.kept, line] : acc.kept,
                closer: null,
                keepCloser: false,
              }
            : acc;

        // an opener whose body is prose (a said brief, a readme) or counts (stats);
        // a self-closed tag (`<brief.ref path="…"/>`) has no body, so it is kept as is
        const tag = line.trim().endsWith('/>')
          ? null
          : (line.match(/^\s*<([\w.]+)(\s[^>]*)?>\s*$/)?.[1] ?? null);
        if (tag === 'stats')
          return { kept: acc.kept, closer: '</stats>', keepCloser: false };
        if (tag && line.includes('path="'))
          return {
            kept: [...acc.kept, line],
            closer: `</${tag}>`,
            keepCloser: true,
          };

        // a tag or a ref path: keep; a blank line: drop
        return line.trim() ? { ...acc, kept: [...acc.kept, line] } : acc;
      },
      { kept: [], closer: null, keepCloser: false },
    )
    .kept.join('\n');

/**
 * .what = the full boot payload a seat reads, with the `<stats>` blocks dropped
 * .why  = every said body in one view: a cue line cut to fit a budget shows in review as a
 *         removed line, where a token count alone would only read as a smaller boot
 */
const asBootPayloadWithoutStats = (input: {
  stdout: string;
  repoDir: string;
}): string =>
  stripVTControlCharacters(input.stdout)
    .split(input.repoDir)
    .join('<repo>')
    .replace(/^[ \t]*<stats>[\s\S]*?<\/stats>[ \t]*\n?/gm, '')
    .trim();

/**
 * .what = whether `build:complete:dist` ships a file of a role dir, by its path in that dir
 * .why  = a seat boots what the package ships, never the src tree. a test file or a `.log`
 *         fixture in src would show in the boot's `<also>` and cost tokens no seat pays
 * .note = mirrors the rsync filter in package.json `build:complete:dist`, first match wins.
 *         `[case6]` snaps that command, so an edit to it turns red here until this follows
 */
const isRoleFileShipped = (input: { relPath: string }): boolean => {
  const segments = input.relPath.split('/');
  const name = segments[segments.length - 1] ?? '';
  const dirs = segments.slice(0, -1);
  const dirLast = dirs[dirs.length - 1] ?? null;

  // the excludes, ahead of every include
  if (dirs.some((dir) => ['.route', '.scratch', '.behavior'].includes(dir)))
    return false;
  if (name.endsWith('.test.sh')) return false;

  // the includes, in rsync's order
  if (name === 'readme.md' || name.endsWith('.template.md')) return true;
  if (name === 'boot.yml') return true;
  if (dirs.includes('briefs') && /\.md(\.min)?$/.test(name)) return true;
  if (dirs.includes('skills') && /\.(sh|mjs|jsonc)$/.test(name)) return true;
  if (dirs.includes('inits') && /\.(sh|jsonc)$/.test(name)) return true;
  if (dirs.includes('templates') && name.endsWith('.md')) return true;
  if (dirLast === 'templates' && /\.(stone|guard)$|\.guard\./.test(name))
    return true;
  return name === 'keyrack.yml';
};

/**
 * .what = the brief entries a boot manifest hands a seat — said, ref'd, or a readme
 * .why  = a render with none is inert curation: it boots, fits any budget, and teaches naught
 */
const asBootBriefEntries = (input: { manifest: string }): string[] =>
  input.manifest
    .split('\n')
    .filter((line) => /path="|\.md(\.min)?$/.test(line.trim()));

/**
 * .what = the non-glob brief entries under `say:` in a boot.yml
 * .why  = a said entry is a promise that the cue boots; the clamp checks each one against
 *         the render, since a `not:` glob that also matches it drops it with no error
 */
const asBootSaidEntries = (input: { yaml: string }): string[] =>
  input.yaml.split('\n').reduce<{ said: string[]; inSay: boolean }>(
    (acc, line) => {
      // a `say:` key opens the list; any other key closes it
      const key = line.match(/^\s*([\w.]+):/)?.[1] ?? null;
      if (key) return { said: acc.said, inSay: key === 'say' };

      // inside the list: keep each non-glob brief entry
      const entry = line.match(/^\s*-\s+(briefs\/[^\s#]+)\s*(?:#.*)?$/)?.[1];
      if (!acc.inSay || !entry || /[*!(]/.test(entry)) return acc;
      return { said: [...acc.said, entry], inSay: true };
    },
    { said: [], inSay: false },
  ).said;

/**
 * .what = why a glob entry of a boot.yml no longer lands on disk, or null where it does
 * .why  = a glob is a pattern, so `[case4]`'s per-path lookup skips it. but a glob whose
 *         dir was re-homed matches naught, in silence — and a `!(a|b).md` exclusion that
 *         names a brief no longer there is a stale curation line. so each glob must keep
 *         a dir with files under it, and each literal name it excludes must still exist
 * .note = the static base is every segment ahead of the first one with a wildcard
 */
const asBootGlobUnlanded = (input: {
  roleDir: string;
  glob: string;
}): string | null => {
  // the static base dir, ahead of the first wildcard segment
  const segments = input.glob.split('/');
  const indexWild = segments.findIndex((segment) => /[*!(]/.test(segment));
  const dirBase = join(input.roleDir, ...segments.slice(0, indexWild));
  if (!existsSync(dirBase) || !statSync(dirBase).isDirectory())
    return `its base dir is absent: ${relative(input.roleDir, dirBase)}`;
  const files = readdirSync(dirBase, { recursive: true }).filter((path) =>
    statSync(join(dirBase, String(path))).isFile(),
  );
  if (files.length === 0)
    return `its base dir holds no file: ${relative(input.roleDir, dirBase)}`;

  // each literal name inside a `!(…)` exclusion, with the suffix after `)`
  const exclusion = segments[indexWild]?.match(/^!\(([^)]*)\)(.*)$/) ?? null;
  if (!exclusion || indexWild !== segments.length - 1) return null;
  const suffix = exclusion[2] ?? '';
  const namesAbsent = (exclusion[1] ?? '')
    .split('|')
    .filter((name) => !/[*?]/.test(name))
    .filter((name) => !existsSync(join(dirBase, `${name}${suffix}`)));
  return namesAbsent.length
    ? `its exclusion names a brief no longer on disk: ${namesAbsent.join(', ')}`
    : null;
};

/**
 * .what = the `.reason.md` files a boot manifest does not list at ref (before `<also>`)
 * .why  = a refout's argument must stay one fetch away; a `not:` glob such as
 *         `briefs/<dir>/!(a|b).md` also matches `x.reason.md`, and erases it with no error
 * .note = each reason is a path under the role dir (`briefs/…`); a ref line is a path under
 *         its block's base, so a reason counts as listed where it ends with that line
 */
const asReasonsUnreferenced = (input: {
  reasons: string[];
  manifest: string;
}): string[] => {
  const linesRef = (input.manifest.split('<also>')[0] ?? '')
    .split('\n')
    // a bare path line, or the path of a self-closed `<brief.ref path="…"/>`
    .map((line) => line.match(/<brief\.ref path="([^"]+)"/)?.[1] ?? line.trim())
    .filter((line) => line.endsWith('.reason.md') && !line.startsWith('<'));
  return input.reasons.filter(
    (reason) => !linesRef.some((line) => reason.endsWith(`/${line}`)),
  );
};

/**
 * .what = the said entries a boot manifest renders no `<brief.say>` line for
 * .why  = names the silent cue cut: the entry is declared at say, yet the seat never reads it
 * .note = rhachet prefers a `.md.min` beside a said `.md`, so either path counts as rendered
 */
const asSaidEntriesUnrendered = (input: {
  role: string;
  said: string[];
  manifest: string;
}): string[] => {
  const pathsSaid = input.manifest
    .split('\n')
    .map((line) => line.match(/<brief\.say path="([^"]+)"/)?.[1])
    .filter((path): path is string => !!path);
  return input.said.filter(
    (entry) =>
      !pathsSaid.some(
        (path) =>
          path.endsWith(`/${input.role}/${entry}`) ||
          path.endsWith(`/${input.role}/${entry}.min`),
      ),
  );
};

/**
 * .what = the roles whose boot manifest hands its seat no brief at all
 * .why  = names the inert-render verdict, so the clamp reads as the claim it makes
 */
const asRolesWithNoBrief = (input: {
  manifests: Record<string, string>;
}): string[] =>
  Object.entries(input.manifests)
    .filter(([, manifest]) => asBootBriefEntries({ manifest }).length === 0)
    .map(([role]) => role);

/**
 * .what = the manifests of the roles whose boot fit its budget (exit 0); a halted boot is dropped
 * .why  = a halted boot prints no manifest, so every check that reads one would turn red too,
 *         with advice that misleads (a `not:` glob, a cut cue). the exit check alone owns that red
 */
const asManifestsOfFitBoots = (input: {
  verdicts: { role: string; exit: number | null }[];
  manifests: Record<string, string>;
}): Record<string, string> =>
  Object.fromEntries(
    Object.entries(input.manifests).filter(([role]) =>
      input.verdicts.some(
        (verdict) => verdict.role === role && verdict.exit === 0,
      ),
    ),
  );

/**
 * .what = the claims the behaver cue must still say, whatever their line wrap
 * .why  = "dense, not cut": the cue may be reflowed or rendered anew, but these claims stay
 */
const CUE_CLAIMS_BEHAVER = [
  'you must evolve the contract to hold it before that stage passes',
  'grow the contract; never bolt an experience on outside it.',
];

/**
 * .what = the claims the supervisor `.md.min` cues must still say, whatever their line wrap
 * .why  = a `.min` condenses its `.md`; these are the claims a condense once dropped
 *         (the decline key, the dismiss ban, the halted-sprout seed, the meter caveat, the
 *         steer-vs-grant line, the ask-exception), so a later condense cannot drop them again
 */
const CUE_CLAIMS_SUPERVISOR = [
  'decline `--keys 3` (the last, `No`) — NEVER 2',
  'never dismiss with 0',
  'a halted sprout is not cancelled: author its wish into `src/stream/` and SEED it',
  'a blocked `radio.uses` stops the push, never the file',
  'an `allowed` org/global meter beside an unset local one is no sure grant',
  'a steer changes the FORM; if it also changes what the mechanic may reach, it was a grant',
  'ask only when the human names a tree-shaped outcome and withholds the word',
];

/**
 * .what = the claims the prioritizer `.md.min` cues must still say, whatever their line wrap
 * .why  = the prioritizer fits 10k via three `.md.min` cues, so a later condense could cut a
 *         cue unseen; these are the core claim of each, the act each cue governs
 */
const CUE_CLAIMS_PRIORITIZER = [
  'hunt its neighborhood for work that runs in SERIES and could run in PARALLEL',
  'a clean hunt is still stated',
  'a prioritizer ranks work. it does not run work.',
  '`eco.seed` is the whole hand-off',
  "a clone never AUTHORS a human's `sev` or `urg`",
  'ASK the human outright and PROPOSE your own read',
  'silence also fails',
];

/**
 * .what = a text with its line breaks, blockquote marks, and runs of space folded to one space
 * .why  = so a claim matches across a hard wrap, and a reflow never reads as a cut
 */
const asProseFolded = (input: { text: string }): string =>
  input.text.replace(/\s*\n[>\s]*/g, ' ').replace(/[ \t]+/g, ' ');

/**
 * .what = the payload token count a boot states in its `<stats>` block
 * .why  = the clamp's own measure of a render, so a test can pin a budget at it exactly
 */
const asBootTokens = (input: { stdout: string }): number => {
  const digits = stripVTControlCharacters(input.stdout).match(
    /tokens = ([\d,]+)/,
  )?.[1];
  if (!digits)
    throw new MalfunctionError('boot stats state no token count', {
      tail: input.stdout.slice(-400),
    });
  return Number(digits.replace(/,/g, ''));
};

/**
 * .what = every brief name a catalog line names, with `a.{b · c}` expanded to `a.b`, `a.c`
 * .why  = a catalog stands in for the per-path roster a `not:` removed; a brief it fails
 *         to name is a brief no session can find, so the clamp must read the names out
 */
const asCatalogNames = (input: { catalog: string }): string[] =>
  input.catalog
    .split('\n')
    .filter((line) => /^- \*\*[^*]+\/\*\* — /.test(line))
    .flatMap((line) => {
      const dir = line.match(/^- \*\*([^*]+)\/\*\*/)![1]!;
      const body = line.replace(/^- \*\*[^*]+\/\*\* — /, '');
      // split on the top-level ` · ` only; a brace group keeps its own
      const items = body.split(/ · (?![^{]*\})/);
      return items.flatMap((item) => {
        const brace = item.match(/^(.*)\{(.*)\}$/);
        const names = brace
          ? brace[2]!.split(' · ').map((tail) => `${brace[1]}${tail}`)
          : [item];
        return names.map((name) => `${dir}/${name.trim()}.md`);
      });
    });

/**
 * .what = the fix owed by one declared boot's budget, or null where none is owed
 * .why  = each failure shape names its own remedy, so a red clamp is one read
 */
const asBootBudgetFix = (input: {
  what: string;
  budget: { present: boolean; tokens: number | null } | null;
}): string | null => {
  if (!input.budget) return `the declared boot spec is absent: ${input.what}`;
  if (input.budget.present && input.budget.tokens === null)
    return `${input.what} declares \`budget:\` in a shape this clamp cannot read; use \`budget:\\n  tokens: <n>\` or \`budget: { tokens: <n> }\``;
  if (!input.budget.tokens || input.budget.tokens <= 0)
    return `measure via \`npx rhachet roles cost --what ${input.what}\`, declare \`budget: tokens: <that, rounded up to the next 100>\`; a consumer seat's render (\`.agent/repo=bhuild/role=<role>/\`) costs a little more than \`src\`, so if the linked boot reports the overage, round that payload up instead`;
  return null;
};

/**
 * .what = each role whose declaration drifted from the named inert list, with its fix
 * .why  = the list is a closed allowlist; a drift in either direction must name its remedy
 */
const asInertBootDrift = (input: {
  undeclared: string[];
  inert: string[];
}): { role: string; fix: string }[] => [
  ...input.undeclared
    .filter((role) => !input.inert.includes(role))
    .map((role) => ({
      role,
      fix: 'write its `boot.yml` (say · ref · not, with `budget: tokens:`) and declare it in the role registry (`boot: { uri }`), or add it to ROLES_WITH_INERT_BOOT with the reason no seat boots it',
    })),
  ...input.inert
    .filter((role) => !input.undeclared.includes(role))
    .map((role) => ({
      role,
      fix: 'its boot is now declared — drop it from ROLES_WITH_INERT_BOOT',
    })),
];

/**
 * .what = boot one spec via the real `rhachet roles boot`, from the given seat
 * .why  = the one communicator for the rhachet contract, so its args live in one place
 */
const getOneBootResult = async (input: {
  role: string;
  render: 'src' | 'linked';
  what: string;
  cwd: string;
}): Promise<{
  verdict: ReturnType<typeof asBootVerdict>;
  stdout: string;
  stderr: string;
}> => {
  // 🔴 the streams land in FILES, never pipes. a node process that exits with writes still
  //    queued on a pipe drops them — measured: a manifest cut mid-role, only under load,
  //    so a snapshot of it flaked. a write to a file completes before the exit
  const pathOut = join(input.cwd, `.boot.${input.role}.${input.render}.stdout`);
  const pathErr = join(input.cwd, `.boot.${input.role}.${input.render}.stderr`);
  const fdOut = openSync(pathOut, 'w');
  const fdErr = openSync(pathErr, 'w');

  // run the boot as an async process, so boots overlap and no one blocks the worker
  const result = await new Promise<
    Parameters<typeof asBootVerdict>[0]['result']
  >((resolve) => {
    const child = spawn(
      PATH_RHACHET_BIN,
      ['roles', 'boot', '--what', input.what],
      {
        cwd: input.cwd,
        timeout: MS_BOOT_TIMEOUT,
        stdio: ['ignore', fdOut, fdErr],
      },
    );
    // the child holds its own copy of each fd; this process's copies are done
    closeSync(fdOut);
    closeSync(fdErr);
    const asResult = (error: Error | null) => ({
      status: child.exitCode,
      signal: child.signalCode,
      stdout: readFileSync(pathOut, 'utf8'),
      stderr: readFileSync(pathErr, 'utf8'),
      error,
    });
    // a spawn failure names its cause; a close carries the exit code or the kill signal
    child.on('error', (error) => resolve(asResult(error)));
    child.on('close', () => resolve(asResult(null)));
  });
  return {
    verdict: asBootVerdict({
      role: input.role,
      render: input.render,
      result,
    }),
    stdout: result.stdout,
    stderr: result.stderr,
  };
};

/**
 * .what = copy the shipped files of one role into a seat as REAL files, at the given layout
 * .why  = a seat boots what the package ships, so only the files `build:complete:dist` ships
 *         are copied. real files, since rhachet only warns on a symlinked spec
 *         (`isBootSpecForeign`), and a real-file copy halts
 * .note = `src` is this repo's own layout; `linked` is the path a consumer seat links it at,
 *         a longer base path that costs a little more per entry
 */
const genRoleSeatCopy = (input: {
  role: string;
  repoDir: string;
  layout: 'src' | 'linked';
}): { what: string } => {
  const dirRole = join(DIR_ROLES, input.role);
  const at =
    input.layout === 'src'
      ? `src/domain.roles/${input.role}`
      : `.agent/repo=bhuild/role=${input.role}`;
  cpSync(dirRole, join(input.repoDir, at), {
    recursive: true,
    filter: (path) =>
      statSync(path).isDirectory() ||
      isRoleFileShipped({ relPath: relative(dirRole, path) }),
  });
  return { what: `${at}/boot.yml` };
};

/**
 * .what = a boot halt, with the bytes that vary per run masked
 * .why  = the halt is the one blocked state a human meets here; a snapshot shows it to a
 *         reviewer, and the masks keep it stable across payload growth and temp paths
 */
const asBootHaltMasked = (input: { why: string; repoDir: string }): string =>
  stripVTControlCharacters(input.why) // color codes carry no sense to a reader
    .split(input.repoDir)
    .join('<repo>')
    .replace(/\b\d+(?:[,_]\d{3})*\b/g, '<n>'); // counts drift as the payload grows

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
            // broken path, and not this clamp's subject. an extglob `!(…)` is a
            // glob too, with no `*` in it
            const cited = parsed
              .filter((path) => !/[*!(]/.test(path))
              .map((path) => ({ role: dir, cites: path }));
            // the globs get their own check below, since a lookup cannot read one
            const globs = parsed
              .filter((path) => /[*!(]/.test(path))
              .map((path) => ({ role: dir, glob: path }));
            return { role: dir, claimed, parsed: parsed.length, cited, globs };
          });

        const cited = perRole.flatMap(({ cited: rows }) => rows);
        const unlanded = cited.filter(
          ({ role, cites }) => !existsSync(join(DIR_ROLES, role, cites)),
        );
        const globs = perRole.flatMap(({ globs: rows }) => rows);
        const globsUnlanded = globs
          .map(({ role, glob }) => ({
            role,
            glob,
            why: asBootGlobUnlanded({ roleDir: join(DIR_ROLES, role), glob }),
          }))
          .filter(({ why }) => why !== null);
        return { perRole, cited, unlanded, globs, globsUnlanded };
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

      // a glob stands for whatever is there, so its lookup is its base dir and the
      // literal names it excludes. a re-homed dir or a stale exclusion is named here
      then(
        '🔴 every glob entry keeps its base dir and the names it excludes',
        () => {
          // ANTI-VACUITY: the supervisor's per-dir `not:` globs alone are ten
          expect(scenePaths.globs.length).toBeGreaterThanOrEqual(10);
          expect(scenePaths.globsUnlanded).toEqual([]);
        },
      );
    });
  });

  given('[case5] each declared boot, against the budget it declares', () => {
    // 🔴 a boot grows in silence. `rhachet roles cost --all` marks an overage 🟡
    //    and exits 0, so naught in ci turns red when a role's boot outgrows its
    //    budget — every seat that boots the role just pays more, every call.
    //    `rhachet roles boot` is the one command that halts (exit 2) on a spec
    //    this repo owns, so the clamp boots each spec and reads the exit code.
    //
    // 🔴 and it boots each spec TWICE. a consumer seat boots the role from
    //    `.agent/repo=bhuild/role=<role>/`, a longer base path than `src/`, so
    //    the same yaml costs more there (behaver: +30 tokens). a budget that
    //    fits `src` alone would warn in every consumer seat and in no ci run.
    //    the linked render is booted from a REAL-FILE copy in a temp repo:
    //    rhachet warns rather than halts on a symlinked spec
    //    (`isBootSpecForeign`), so only a real-file copy gets the halt.
    const sceneBudget = useBeforeAll(async () => {
      // the roles whose boot the registry declares, each with the spec it declares
      const specs = scene.roles
        .flatMap((role) =>
          role.boot?.uri ? [{ role: role.slug, uri: role.boot.uri }] : [],
        )
        .sort((a, b) => a.role.localeCompare(b.role));
      const declared = specs.map(({ role }) => role);

      // the budget each declared boot states; an absent spec reads as no yaml at all
      const perRole = specs.map(({ role, uri }) => ({
        role,
        what: relative(DIR_REPO, uri),
        budget: existsSync(uri)
          ? asBootBudget({ yaml: readFileSync(uri, 'utf8') })
          : null,
      }));
      return { declared, perRole };
    });

    when('[t0] the declarations are read', () => {
      // ANTI-VACUITY: a registry that declared no boot would pass every claim below.
      // exact, both ways: a fifth role with a boot must join ROLES_WITH_BUDGET, or its
      // manifest would be exit-checked yet never snapped
      then('the declared boots are exactly the curated seats', () => {
        expect(sceneBudget.declared).toEqual([...ROLES_WITH_BUDGET]);
      });

      // 🔴 a new role must curate its boot under a budget, or join the named
      //    debt list with a reason. a role with no declared boot boots WHOLE —
      //    the most uncapped boot there is — so it cannot slip by in silence
      then('every role declares a boot, but for the named debt', () => {
        const undeclared = scene.dirs.filter(
          (dir) => !sceneBudget.declared.includes(dir),
        );
        expect(
          asInertBootDrift({ undeclared, inert: ROLES_WITH_INERT_BOOT }),
        ).toEqual([]);
      });

      // an inert role is exempt from a budget only while it has no curation to grow; a
      // brief dropped into one would grow every seat that boots it whole, unseen
      then('🔴 every inert role ships no briefs', () => {
        expect(
          ROLES_WITH_INERT_BOOT.filter((role) =>
            existsSync(join(DIR_ROLES, role, 'briefs')),
          ),
        ).toEqual([]);
      });

      then('🔴 every declared boot declares `budget: tokens:`', () => {
        const unbudgeted = sceneBudget.perRole
          .map(({ role, what, budget }) => ({
            role,
            fix: asBootBudgetFix({ what, budget }),
          }))
          .filter(({ fix }) => fix !== null);
        expect(unbudgeted).toEqual([]);
      });
    });

    when('[t1] each declared boot is booted at the src layout', () => {
      const booted = useBeforeAll(async () => {
        // a git repo that holds the shipped files of each role at this repo's own layout
        const repoDir = genTempDir({
          slug: 'roleArtifacts-boot-budget-src',
          git: true,
        });

        // boot each declared spec there, all at once
        const results = await Promise.all(
          sceneBudget.declared.map(async (role) => ({
            role,
            ...(await getOneBootResult({
              role,
              render: 'src',
              what: genRoleSeatCopy({ role, repoDir, layout: 'src' }).what,
              cwd: repoDir,
            })),
          })),
        );
        const stdoutBehaver =
          results.find(({ role }) => role === 'behaver')?.stdout ?? '';
        const stdoutSupervisor =
          results.find(({ role }) => role === 'supervisor')?.stdout ?? '';
        const stdoutPrioritizer =
          results.find(({ role }) => role === 'prioritizer')?.stdout ?? '';
        const verdicts = results.map(({ verdict }) => verdict);
        return {
          verdicts,
          // a halted boot prints no manifest; only the exit check grades it
          manifests: asManifestsOfFitBoots({
            verdicts,
            manifests: Object.fromEntries(
              results.map(({ role, stdout }) => [
                role,
                asBootManifest({ stdout, repoDir }),
              ]),
            ),
          }),
          stdoutBehaver,
          stdoutSupervisor,
          stdoutPrioritizer,
          // every said body each seat reads; the same fit-only filter as the manifests
          payloads: asManifestsOfFitBoots({
            verdicts,
            manifests: Object.fromEntries(
              results.map(({ role, stdout }) => [
                role,
                asBootPayloadWithoutStats({ stdout, repoDir }),
              ]),
            ),
          }),
        };
      });

      then('🔴 every src boot fits its budget (exit 0)', () => {
        // ANTI-VACUITY, local: an empty declared set would pass the map below
        expect(booted.verdicts.length).toBeGreaterThanOrEqual(4);
        expect(booted.verdicts).toEqual(
          booted.verdicts.map(({ role, render }) => ({
            role,
            render,
            exit: 0,
            why: null,
          })),
        );
      });

      // 🔴 a cap alone passes a CUT — a smaller boot fits any budget. an empty render
      //    (entries under a key rhachet ignores) fits too, and teaches naught
      then('🔴 every src boot hands its seat at least one brief', () => {
        expect(asRolesWithNoBrief({ manifests: booted.manifests })).toEqual([]);
      });

      // 🔴 rhachet subtracts `not:` before it splits say from ref, so a said entry that a
      //    `not:` glob also matches renders nowhere, with no error. the budget falls and the
      //    snapshot shows no line to remove — only this check sees the cue go absent
      then('🔴 every said entry renders as a said brief', () => {
        // a halted boot rendered no manifest to read; the exit check already names it
        const perRole = sceneBudget.perRole
          .filter(({ role }) => role in booted.manifests)
          .map(({ role, what }) => ({
            role,
            said: asBootSaidEntries({
              yaml: readFileSync(join(DIR_REPO, what), 'utf8'),
            }),
          }));

        // ANTI-VACUITY: a parse that read no say list would pass the claim below
        expect(perRole.flatMap(({ said }) => said).length).toBeGreaterThan(10);

        const unrendered = perRole
          .map(({ role, said }) => ({
            role,
            unrendered: asSaidEntriesUnrendered({
              role,
              said,
              manifest: booted.manifests[role]!,
            }),
          }))
          .filter(({ unrendered: entries }) => entries.length > 0)
          .map(({ role, unrendered: entries }) => ({
            role,
            unrendered: entries,
            fix: 'a `not:` glob also matches it: add its name to its dir glob, or move it out of say',
          }));
        expect(unrendered).toEqual([]);
      });

      // 🔴 a refout's argument must stay one fetch away. a `not:` extglob such as
      //    `briefs/<dir>/!(a|b).md` matches `x.reason.md` too, and erases it with no error
      then('🔴 every `.reason.md` on disk is listed at ref', () => {
        const perRole = sceneBudget.perRole
          .filter(({ role }) => role in booted.manifests)
          .map(({ role }) => ({
            role,
            reasons: readdirSync(join(DIR_ROLES, role, 'briefs'), {
              recursive: true,
            })
              .map((path) => `briefs/${String(path)}`)
              .filter((path) => path.endsWith('.reason.md')),
          }));

        // ANTI-VACUITY: behaver's refout ships one, so a walk that found none is broken
        expect(
          perRole.flatMap(({ reasons }) => reasons).length,
        ).toBeGreaterThan(0);

        const unreferenced = perRole
          .map(({ role, reasons }) => ({
            role,
            unreferenced: asReasonsUnreferenced({
              reasons,
              manifest: booted.manifests[role]!,
            }),
          }))
          .filter(({ unreferenced: entries }) => entries.length > 0)
          .map(({ role, unreferenced: entries }) => ({
            role,
            unreferenced: entries,
            fix: 'a `not:` glob also matches it: exclude `*.reason.md` from that glob, so the `ref:` claim keeps it',
          }));
        expect(unreferenced).toEqual([]);
      });

      // what each seat is handed — every said brief, every ref path — so a dropped brief
      // shows in review as a removed line, never as a quieter, smaller boot. one snapshot
      // per role, so parallel edits to two roles never collide in one entry
      ROLES_WITH_BUDGET.forEach((role) =>
        then(`the ${role} manifest reads as reviewed`, () => {
          // a halted boot has no manifest: fix the budget red above first
          expect({ role, fit: role in booted.manifests }).toEqual({
            role,
            fit: true,
          });
          expect(booted.manifests[role]).toMatchSnapshot();
        }),
      );

      // the wish's bound is "dense, not cut": the cue stays at say, the argument lands at
      // ref. so the behaver boot must still say each claim, and list its argument at ref
      then(
        '🔴 the behaver boot still says the cue and lists its argument at ref',
        () => {
          // a halted boot says no cue at all: fix the budget red above first
          expect({ fit: 'behaver' in booted.manifests }).toEqual({ fit: true });
          const prose = asProseFolded({ text: booted.stdoutBehaver });
          expect(
            CUE_CLAIMS_BEHAVER.filter((claim) => !prose.includes(claim)),
          ).toEqual([]);
          expect(booted.manifests.behaver).toMatch(
            /^behavior\.vision\/rule\.require\.experience-catalog-evolution\.reason\.md$/m,
          );
        },
      );

      // the supervisor fits 10k via `.md.min` cues; a condense must never cut a claim
      then('🔴 the supervisor boot still says each condensed claim', () => {
        expect({ fit: 'supervisor' in booted.manifests }).toEqual({
          fit: true,
        });
        const prose = asProseFolded({ text: booted.stdoutSupervisor });
        expect(
          CUE_CLAIMS_SUPERVISOR.filter((claim) => !prose.includes(claim)),
        ).toEqual([]);
      });

      // the prioritizer fits 10k via `.md.min` cues too; the same bound holds
      then('🔴 the prioritizer boot still says each condensed claim', () => {
        expect({ fit: 'prioritizer' in booted.manifests }).toEqual({
          fit: true,
        });
        const prose = asProseFolded({ text: booted.stdoutPrioritizer });
        expect(
          CUE_CLAIMS_PRIORITIZER.filter((claim) => !prose.includes(claim)),
        ).toEqual([]);
      });

      // the claim pins above hold a few sentences; this pins every said line of every
      // seat, so a cut or a reword of any cue to fit a budget shows in review as a changed
      // line. one snapshot per role, so parallel edits to two roles never collide
      then('the behaver payload holds its refout cue', () => {
        // a halted boot says no cue at all: fix the budget red above first
        expect({ fit: 'behaver' in booted.payloads }).toEqual({ fit: true });
        expect(booted.payloads.behaver).toContain(
          'rule.require.experience-catalog-evolution',
        );
      });
      ROLES_WITH_BUDGET.forEach((role) =>
        then(`the ${role} boot says each cue as reviewed`, () => {
          // a halted boot says no cue at all: fix the budget red above first
          expect({ role, fit: role in booted.payloads }).toEqual({
            role,
            fit: true,
          });
          expect(booted.payloads[role]).toMatchSnapshot();
        }),
      );
    });

    when('[t2] each declared boot is booted at the linked layout', () => {
      const booted = useBeforeAll(async () => {
        // a git repo that plays the consumer seat
        const repoDir = genTempDir({
          slug: 'roleArtifacts-boot-budget',
          git: true,
        });

        // copy each role in as real files at the linked path, then boot them all at once
        const results = await Promise.all(
          sceneBudget.declared.map((role) =>
            getOneBootResult({
              role,
              render: 'linked',
              what: genRoleSeatCopy({ role, repoDir, layout: 'linked' }).what,
              cwd: repoDir,
            }),
          ),
        );
        return { verdicts: results.map(({ verdict }) => verdict) };
      });

      then('🔴 every linked boot fits its budget (exit 0)', () => {
        // ANTI-VACUITY, local: an empty declared set would pass the map below
        expect(booted.verdicts.length).toBeGreaterThanOrEqual(4);
        expect(booted.verdicts).toEqual(
          booted.verdicts.map(({ role, render }) => ({
            role,
            render,
            exit: 0,
            why: null,
          })),
        );
      });
    });

    // ANTI-VACUITY for the gate itself. [t1] and [t2] pass on exit 0, and exit 0
    // is also what rhachet returns when it only WARNS. should a rhachet upgrade
    // move a real-file spec to the warn rung, every boot above would stay green
    // over any budget. so one copy is forced over budget, and must halt.
    when('[t3] a linked copy is forced over its budget', () => {
      const booted = useBeforeAll(async () => {
        // a consumer seat with one role copied in as real files
        const repoDir = genTempDir({
          slug: 'roleArtifacts-boot-budget-bite',
          git: true,
        });
        const { what } = genRoleSeatCopy({
          role: 'decomposer',
          repoDir,
          layout: 'linked',
        });

        // force its budget to one token — far under any payload
        const pathBoot = join(repoDir, what);
        writeFileSync(
          pathBoot,
          asBootYamlWithBudget({
            yaml: readFileSync(pathBoot, 'utf8'),
            tokens: 1,
          }),
        );

        // boot it where a seat would
        const { verdict, stderr, stdout } = await getOneBootResult({
          role: 'decomposer',
          render: 'linked',
          what,
          cwd: repoDir,
        });
        return {
          verdict,
          // on exit 0, `why` is null; a warn-rung rhachet's words sit on stderr, else stdout
          said:
            verdict.why ??
            asLinesBounded({ text: stderr.trim() || stdout, max: 60 }),
          repoDir,
          budget: asBootBudget({ yaml: readFileSync(pathBoot, 'utf8') }),
        };
      });

      then('the copy declares the forced budget', () => {
        expect(booted.budget).toEqual({ present: true, tokens: 1 });
      });

      // one assertion over the whole verdict, so a warn-rung regression prints rhachet's
      // own words beside the exit it got
      then('🔴 the boot halts (exit 2) and names the overage', () => {
        expect({
          role: booted.verdict.role,
          exit: booted.verdict.exit,
          said: booted.said,
        }).toEqual({
          role: 'decomposer',
          exit: 2,
          said: expect.stringContaining('over budget'),
        });
      });

      // the halt is the one blocked state a human meets here; snap it so a reviewer
      // sees the message and its named fixes, with counts and the temp path masked.
      // its words are rhachet's, so only the repro this repo appends is asserted
      then('the halt reads as a human meets it', () => {
        const halt = asBootHaltMasked({
          why: booted.said,
          repoDir: booted.repoDir,
        });
        expect(halt).toContain(
          'repro: npx rhachet roles cost --what src/domain.roles/decomposer/boot.yml',
        );
        expect(halt).toMatchSnapshot();
      });
    });

    when('[t4] a budget sits exactly at the src cost', () => {
      // 🔴 the src/linked trap: the linked render costs a little more per path, so a budget
      //    set at the src figure passes src and fails every consumer seat. this proves the
      //    clamp boots the linked render on its own, rather than trust the src figure
      const booted = useBeforeAll(async () => {
        const repoDir = genTempDir({
          slug: 'roleArtifacts-boot-budget-src-vs-linked',
          git: true,
        });
        const seatSrc = genRoleSeatCopy({
          role: 'decomposer',
          repoDir,
          layout: 'src',
        });
        const seatLinked = genRoleSeatCopy({
          role: 'decomposer',
          repoDir,
          layout: 'linked',
        });

        // measure the src render, then pin both copies' budget at that exact figure
        const measured = await getOneBootResult({
          role: 'decomposer',
          render: 'src',
          what: seatSrc.what,
          cwd: repoDir,
        });
        const tokensSrc = asBootTokens({ stdout: measured.stdout });
        [seatSrc.what, seatLinked.what].forEach((what) =>
          writeFileSync(
            join(repoDir, what),
            asBootYamlWithBudget({
              yaml: readFileSync(join(repoDir, what), 'utf8'),
              tokens: tokensSrc,
            }),
          ),
        );

        const [src, linked] = await Promise.all(
          [
            { render: 'src' as const, what: seatSrc.what },
            { render: 'linked' as const, what: seatLinked.what },
          ].map(({ render, what }) =>
            getOneBootResult({
              role: 'decomposer',
              render,
              what,
              cwd: repoDir,
            }),
          ),
        );
        return { tokensSrc, src: src!.verdict, linked: linked!.verdict };
      });

      then('the src figure was read', () => {
        expect(booted.tokensSrc).toBeGreaterThan(100);
      });

      then(
        '🔴 src passes at its own figure, and the linked render halts',
        () => {
          expect({ src: booted.src.exit, linked: booted.linked.exit }).toEqual({
            src: 0,
            linked: 2,
          });
        },
      );
    });
  });

  given('[case6] the budget clamp, on each shape it must read', () => {
    // the clamp's red paths: a real repo is green, so these shapes never occur in [case5].
    // each is run here, so a branch that would mislead an author is seen to work first
    when('[t0] each boot.yml shape is read for its budget', () => {
      const CASES = [
        { shape: 'block', yaml: 'budget:\n  tokens: 2_200\n' },
        {
          shape: 'block, with a comment',
          yaml: 'budget:\n  tokens: 800 # why\n',
        },
        { shape: 'flow', yaml: 'budget: { tokens: 7_900 }\n' },
        {
          shape: 'flow, with a comment',
          yaml: 'budget: { tokens: 500 } # why\n',
        },
        { shape: 'absent', yaml: 'always:\n  briefs:\n    say: []\n' },
        { shape: 'unreadable', yaml: 'budget: lots\n' },
      ];
      then('each shape reads as its budget', () => {
        expect(
          CASES.map(({ shape, yaml }) => ({
            shape,
            ...asBootBudget({ yaml }),
          })),
        ).toEqual([
          { shape: 'block', present: true, tokens: 2200 },
          { shape: 'block, with a comment', present: true, tokens: 800 },
          { shape: 'flow', present: true, tokens: 7900 },
          { shape: 'flow, with a comment', present: true, tokens: 500 },
          { shape: 'absent', present: false, tokens: null },
          { shape: 'unreadable', present: true, tokens: null },
        ]);
      });
      then(
        'each readable shape is rewritten in place, its comment kept',
        () => {
          expect(
            CASES.slice(0, 4).map(({ yaml }) =>
              asBootYamlWithBudget({ yaml, tokens: 1 }),
            ),
          ).toEqual([
            'budget:\n  tokens: 1\n',
            'budget:\n  tokens: 1 # why\n',
            'budget: { tokens: 1 }\n',
            'budget: { tokens: 1 } # why\n',
          ]);
        },
      );
      then('a boot.yml with no budget refuses a rewrite', () => {
        expect(() =>
          asBootYamlWithBudget({ yaml: CASES[4]!.yaml, tokens: 1 }),
        ).toThrow('boot.yml declares no budget to rewrite');
      });
    });

    when('[t1] each budget verdict is named for the author', () => {
      // the message a new role's author meets when its boot has no budget, or a bad one
      const what = 'src/domain.roles/sandpine/boot.yml';
      const CASES = [
        { budget: null, shape: 'spec absent' },
        { budget: { present: false, tokens: null }, shape: 'no budget' },
        { budget: { present: true, tokens: null }, shape: 'unreadable' },
        { budget: { present: true, tokens: 0 }, shape: 'zero' },
        { budget: { present: true, tokens: 800 }, shape: 'declared' },
      ];
      then(
        'each shape names its own fix, and a declared budget owes none',
        () => {
          const fixes = CASES.map(({ budget, shape }) => ({
            shape,
            fix: asBootBudgetFix({ what, budget }),
          }));
          expect(fixes.map(({ fix }) => fix === null)).toEqual([
            false,
            false,
            false,
            false,
            true,
          ]);
          expect(fixes).toMatchSnapshot();
        },
      );
    });

    when('[t2] the inert list drifts from the declarations', () => {
      then('each direction of drift names its fix', () => {
        const drift = asInertBootDrift({
          undeclared: ['dreamer', 'sandpine'],
          inert: ['dispatcher', 'dreamer'],
        });
        expect(drift.map(({ role }) => role)).toEqual([
          'sandpine',
          'dispatcher',
        ]);
        // the red rows a human reads, exact
        expect(drift).toMatchSnapshot();
      });
      then('no drift names naught', () => {
        expect(
          asInertBootDrift({ undeclared: ['dreamer'], inert: ['dreamer'] }),
        ).toEqual([]);
      });
    });

    when('[t2b] one boot halts over budget', () => {
      // a halted boot prints no manifest, so the checks that read one must not
      // also turn red with advice that misleads; only the exit check owns it
      then('its manifest is dropped, the fit ones are kept', () => {
        expect(
          asManifestsOfFitBoots({
            verdicts: [
              { role: 'behaver', exit: 2 },
              { role: 'supervisor', exit: 0 },
            ],
            manifests: { behaver: '', supervisor: 'briefs/a.md' },
          }),
        ).toEqual({ supervisor: 'briefs/a.md' });
      });
      then('the said-entry check then reads no halted role', () => {
        const fit = asManifestsOfFitBoots({
          verdicts: [{ role: 'behaver', exit: 2 }],
          manifests: { behaver: '' },
        });
        expect('behaver' in fit).toEqual(false);
      });
    });

    when('[t3] a long reason is bounded', () => {
      const text = Array.from(
        { length: 70 },
        (_, index) => `line ${index}`,
      ).join('\n');
      then('a short reason is kept whole', () => {
        expect(asLinesBounded({ text: 'a\n\nb', max: 60 })).toEqual('a\nb');
      });
      then('a long one keeps its head and tail around a named cut', () => {
        const bounded = asLinesBounded({ text, max: 60 }).split('\n');
        expect(bounded).toHaveLength(61);
        expect(bounded[0]).toEqual('line 0');
        expect(bounded[30]).toEqual('… <10 lines cut>');
        expect(bounded[60]).toEqual('line 69');
      });
    });

    // a boot that outran MS_BOOT_TIMEOUT has no exit code and a partial stderr; its red
    // must say the harness ended it, so a saturated box never reads as a budget fault
    when('[t3b] a boot the harness killed is named', () => {
      const verdict = asBootVerdict({
        role: 'supervisor',
        render: 'linked',
        result: {
          status: null,
          signal: 'SIGTERM',
          stdout: '',
          stderr: '',
          error: new Error('spawnSync npx ETIMEDOUT'),
        },
      });
      then('its exit is null and its reason names the kill', () => {
        expect(verdict.exit).toEqual(null);
        expect(verdict.why).toContain('killed by signal SIGTERM');
        expect(verdict.why).toContain('ETIMEDOUT');
      });
      then('the killed verdict reads as reviewed', () => {
        expect(verdict).toMatchSnapshot();
      });
    });

    when('[t4] a role dir is filtered to what the build ships', () => {
      const CASES = [
        { relPath: 'readme.md', shipped: true },
        { relPath: 'boot.yml', shipped: true },
        { relPath: 'keyrack.yml', shipped: true },
        { relPath: 'briefs/practices/rule.require.x.md', shipped: true },
        { relPath: 'briefs/practices/rule.require.x.md.min', shipped: true },
        { relPath: 'skills/radio.task.push.sh', shipped: true },
        { relPath: 'skills/radio.task.push.test.sh', shipped: false },
        { relPath: 'inits/init.claude.permissions.jsonc', shipped: true },
        { relPath: 'templates/1.vision.stone', shipped: true },
        { relPath: 'templates/1.vision.guard.light', shipped: true },
        { relPath: 'templates/nested/1.vision.stone', shipped: false },
        { relPath: 'getBehaverRole.ts', shipped: false },
        {
          relPath: 'skills/radio.task.push.integration.test.ts',
          shipped: false,
        },
        { relPath: '.log/fixture.json', shipped: false },
        { relPath: 'briefs/.route/rule.x.md', shipped: false },
      ];
      then('each path ships, or not, as the rsync filter rules', () => {
        expect(
          CASES.map(({ relPath }) => ({
            relPath,
            shipped: isRoleFileShipped({ relPath }),
          })),
        ).toEqual(CASES);
      });

      // the filter above mirrors this command; an edit to it must be mirrored there too
      then('the build command it mirrors is the one reviewed', () => {
        const pkg = JSON.parse(
          readFileSync(join(DIR_REPO, 'package.json'), 'utf8'),
        ) as { scripts: Record<string, string> };
        expect(pkg.scripts['build:complete:dist']).toMatchSnapshot();
      });
    });

    when('[t5] a boot payload is read for its structure', () => {
      const stdout = [
        '<briefs>',
        '  <brief.say path="briefs/rule.x.md">',
        '  the cue, said in full',
        '  </brief.say>',
        '  <brief.ref path="briefs/rule.x.reason.md"/>',
        '</briefs>',
        '<stats>',
        '  tokens = 42',
        '</stats>',
      ].join('\n');
      then(
        'the manifest keeps tags and paths, and drops bodies and stats',
        () => {
          expect(asBootManifest({ stdout, repoDir: '/tmp/seat' })).toEqual(
            [
              '<briefs>',
              '  <brief.say path="briefs/rule.x.md">',
              '  </brief.say>',
              '  <brief.ref path="briefs/rule.x.reason.md"/>',
              '</briefs>',
            ].join('\n'),
          );
        },
      );
      then('the payload keeps every said body, and drops the stats', () => {
        const payload = asBootPayloadWithoutStats({
          stdout,
          repoDir: '/tmp/seat',
        });
        expect(payload).toContain('the cue, said in full');
        expect(payload).not.toContain('tokens = 42');
      });
      then('a cue reflowed across lines still reads as its claim', () => {
        expect(
          asProseFolded({ text: '> grow the contract;\n> never bolt' }),
        ).toEqual('> grow the contract; never bolt');
      });
    });

    when('[t6] a catalog line is read for the names it holds', () => {
      then(
        'a brace group expands, a bare name stays, the dir prefixes each',
        () => {
          expect(
            asCatalogNames({
              catalog: [
                '# catalog',
                '- **tick/** — howto.run-a-tick · rule.always.{poll-x · read-y} · rule.forbid.z',
                'skills: naught to read here',
              ].join('\n'),
            }),
          ).toEqual([
            'tick/howto.run-a-tick.md',
            'tick/rule.always.poll-x.md',
            'tick/rule.always.read-y.md',
            'tick/rule.forbid.z.md',
          ]);
        },
      );
    });
  });

  given('[case7] the supervisor catalog, against the briefs on disk', () => {
    // 🔴 the supervisor boot `not:`s every brief it does not say, so its roster
    //    no longer lists them. the catalog is the one place a session can find
    //    them. a brief added later and left out of the catalog drops out of
    //    sight in silence — the boot still renders, under budget, and short.
    when('[t0] the catalog names are compared to the unsaid briefs', () => {
      const sceneCatalog = useBeforeAll(async () => {
        const dirRole = join(DIR_ROLES, 'supervisor');
        const boot = readFileSync(join(dirRole, 'boot.yml'), 'utf8');
        // the same `say:` parser the said-entry check uses, so the two never disagree
        const said = asBootSaidEntries({ yaml: boot }).map((entry) =>
          entry.replace(/^briefs\//, ''),
        );
        const onDisk = readdirSync(join(dirRole, 'briefs'), { recursive: true })
          .map((path) => String(path))
          .filter(
            (path) => path.endsWith('.md') && !path.endsWith('.reason.md'),
          )
          .filter((path) => path.includes('/'));
        const unsaid = onDisk.filter((path) => !said.includes(path)).sort();
        const named = asCatalogNames({
          catalog: readFileSync(
            join(dirRole, 'briefs', 'catalog.of=supervisor.briefs.md'),
            'utf8',
          ),
        }).sort();
        return { said, unsaid, named };
      });

      then(
        'the subject exists — the boot says briefs, the disk holds more',
        () => {
          expect(sceneCatalog.said.length).toBeGreaterThan(20);
          expect(sceneCatalog.unsaid.length).toBeGreaterThan(50);
        },
      );

      // each red row names its fix, so the repair is one read (rule.require.errors-name-the-fix)
      then('🔴 every unsaid brief is named in the catalog', () => {
        expect(
          sceneCatalog.unsaid
            .filter((path) => !sceneCatalog.named.includes(path))
            .map((brief) => ({
              brief,
              fix: 'name it on its dir line in briefs/catalog.of=supervisor.briefs.md, or say it in boot.yml',
            })),
        ).toEqual([]);
      });

      then(
        '🔴 every catalog name lands on a brief that exists, and is unsaid',
        () => {
          expect(
            sceneCatalog.named
              .filter((path) => !sceneCatalog.unsaid.includes(path))
              .map((brief) => ({
                brief,
                fix: 'drop it from the catalog — it is said in boot.yml, or absent from disk',
              })),
          ).toEqual([]);
        },
      );
    });
  });

  given('[case8] the supervisor verb counts, against its skills', () => {
    // 🔴 the supervisor boot `not:`s every skill, so its readme is the one verb
    //    inventory a seat reads. its counts are written by hand; a verb added later
    //    leaves them stale in silence, and the seat under-reads its own toolbox.
    when('[t0] each counted family is compared to its skills on disk', () => {
      const sceneVerbs = useBeforeAll(async () => {
        const dirRole = join(DIR_ROLES, 'supervisor');
        const readme = readFileSync(join(dirRole, 'readme.md'), 'utf8');
        const verbs = readdirSync(join(dirRole, 'skills'))
          .filter((name) => name.endsWith('.sh'))
          .map((name) => name.replace(/\.sh$/, ''));
        const counted = [...readme.matchAll(/`([\w.]+)\.\*` \((\d+)\)/g)];
        const families = counted.map(([, prefix, count]) => ({
          family: `${prefix}.*`,
          stated: Number(count),
          onDisk: verbs.filter((verb) => verb.startsWith(`${prefix}.`)).length,
        }));
        const total = Number(
          readme.match(/### skills — (\d+) verbs/)?.[1] ?? NaN,
        );
        return { verbs, families, total };
      });

      // ANTI-VACUITY: a readme regex that matched no family would pass the claims below
      then('the subject exists — the readme counts five families', () => {
        expect(sceneVerbs.families.length).toEqual(5);
      });

      then('🔴 each family count equals its skills on disk', () => {
        expect(
          sceneVerbs.families
            .filter(({ stated, onDisk }) => stated !== onDisk)
            .map(({ family, stated, onDisk }) => ({
              family,
              stated,
              onDisk,
              fix: 'set the count on its line in supervisor/readme.md',
            })),
        ).toEqual([]);
      });

      then('🔴 the verb total equals the skills on disk', () => {
        expect({
          stated: sceneVerbs.total,
          onDisk: sceneVerbs.verbs.length,
        }).toEqual({
          stated: sceneVerbs.verbs.length,
          onDisk: sceneVerbs.verbs.length,
        });
      });
    });
  });

  given(
    '[case9] each `.md.min`, against the full `.md` it boots in place of',
    () => {
      // 🔴 a `.min` boots in place of its `.md`, so an edit to the `.md` alone changes no
      //    boot. the banner atop the `.md` says so; a `.min` with no banner restores the
      //    trap, and a banner whose `.min` is gone makes a false claim
      when('[t0] every brief file of every role is read', () => {
        const scenePairs = useBeforeAll(async () => {
          const files = readdirSync(DIR_ROLES, { recursive: true })
            .map((path) => String(path))
            .filter((path) => path.includes('/briefs/'));
          const mins = files.filter((path) => path.endsWith('.md.min')).sort();
          const bannered = files
            .filter((path) => path.endsWith('.md'))
            .filter((path) =>
              readFileSync(join(DIR_ROLES, path), 'utf8').includes(
                'boots in place of this file',
              ),
            )
            .sort();
          return { mins, bannered };
        });

        then('the subject exists — the roles ship `.min` cues', () => {
          expect(scenePairs.mins.length).toBeGreaterThan(20);
        });

        then(
          '🔴 every `.md.min` has its `.md` beside it, with the banner',
          () => {
            expect(
              scenePairs.mins
                .map((min) => min.replace(/\.min$/, ''))
                .filter((md) => !scenePairs.bannered.includes(md))
                .map((md) => ({
                  md,
                  fix: `add under its title: > ⚠️ \`${md.split('/').pop()}.min\` boots in place of this file — an edit here changes no boot until the \`.min\` carries it too.`,
                })),
            ).toEqual([]);
          },
        );

        then('🔴 every banner names a `.md.min` that exists', () => {
          expect(
            scenePairs.bannered
              .filter((md) => !scenePairs.mins.includes(`${md}.min`))
              .map((md) => ({
                md,
                fix: 'its `.md.min` is gone: drop the banner',
              })),
          ).toEqual([]);
        });
      });
    },
  );
});
