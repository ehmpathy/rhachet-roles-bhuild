import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { genTestGitRepo } from '../../.test/infra';

/**
 * .what = the result of one skill call, as the journey records it
 */
export type SkillCallResult = { code: number; stdout: string; stderr: string };

/**
 * .what = type-predicate guard for the execSync error shape
 * .why = narrows an unknown thrown value without an as-cast (rule.forbid.as-cast)
 */
const isExecErrorShape = (
  value: unknown,
): value is { stdout?: Buffer; stderr?: Buffer; status?: number } =>
  typeof value === 'object' && value !== null;

/**
 * .what = the env a consumer-side skill call runs under
 * .why = the consumer's own node_modules/.bin leads PATH, exactly as npx would
 *        put it — so the stub `claude` there wins over any claude on the host
 */
const getConsumerEnv = (input: { repoDir: string }): NodeJS.ProcessEnv => ({
  ...getEnvOfUnenrolledSession(),
  PATH: `${path.join(input.repoDir, 'node_modules', '.bin')}:${process.env.PATH ?? ''}`,
});

/**
 * .what = this process's env, minus every `RHACHET_CLONE_*` key
 * .why = the journey drives as a human-typed session (an unenrolled driver). a run launched
 *        from inside an enrolled clone would leak that clone's serial, and bhrain's
 *        `clone whoami` probe would then fail on a serial the temp repo does not hold — a halt
 *        that only the run host produces, never ci
 */
const getEnvOfUnenrolledSession = (): NodeJS.ProcessEnv =>
  Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) => !key.startsWith('RHACHET_CLONE_'),
    ),
  );

/**
 * .what = the rhachet command a consumer call runs
 * .why = 🔴 the journey makes ~90 bhrain calls. `npx` re-resolves the bin on
 *        each one (~0.6s measured under load), so the consumer's own bin is
 *        called direct; `getConsumerEnv` restores the PATH npx would have set
 */
const getRhachetBin = (input: { repoDir: string }): string =>
  path.join(input.repoDir, 'node_modules', '.bin', 'rhachet');

/**
 * .what = runs a rhachet skill in the consumer and captures its output
 * .why = one invocation shape for every journey call
 */
export const runSkill = (input: {
  repo: string;
  skill: string;
  args?: string;
  cwd: string;
}): SkillCallResult => {
  const args = input.args ?? '';
  try {
    const stdout = execSync(
      `${getRhachetBin({ repoDir: input.cwd })} run --repo ${input.repo} --skill ${input.skill} -- ${args}`,
      {
        cwd: input.cwd,
        env: getConsumerEnv({ repoDir: input.cwd }),
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );
    return { code: 0, stdout: stdout.trim(), stderr: '' };
  } catch (error: unknown) {
    if (!isExecErrorShape(error)) throw error;
    return {
      code: error.status ?? 1,
      stdout: (error.stdout ?? '').toString().trim(),
      stderr: (error.stderr ?? '').toString().trim(),
    };
  }
};

/**
 * .what = the combined output of a skill call
 */
export const asCallOutput = (input: { call: SkillCallResult }): string =>
  input.call.stdout + input.call.stderr;

/**
 * .what = marks a stone with a status via bhrain route.stone.set
 */
export const setStoneAs = (input: {
  repoDir: string;
  routeRel: string;
  stone: string;
  as: 'passed' | 'approved';
}): SkillCallResult =>
  runSkill({
    repo: 'bhrain',
    skill: 'route.stone.set',
    args: `--stone ${input.stone} --route ${input.routeRel} --as ${input.as}`,
    cwd: input.repoDir,
  });

/**
 * .what = enters the route's frontier stone via bhrain route.drive
 * .why = route.drive (never route.stone.set) is where bhrain applies a stone's `brain:`
 */
export const setRouteDriven = (input: {
  repoDir: string;
  routeRel: string;
}): SkillCallResult =>
  runSkill({
    repo: 'bhrain',
    skill: 'route.drive',
    args: `--route ${input.routeRel}`,
    cwd: input.repoDir,
  });

/**
 * .what = drops the stones a suite never walks, so the drive's frontier is its own stone
 * .why = route.drive enters the first unpassed stone, as a real driver who deleted them would
 */
export const setStonesDeleted = (input: {
  repoDir: string;
  routeRel: string;
  stones: string[];
}): void => {
  const deleted = runSkill({
    repo: 'bhrain',
    skill: 'route.stone.del',
    args: `${input.stones.map((stone) => `--stone '${stone}'`).join(' ')} --route ${input.routeRel} --mode apply`,
    cwd: input.repoDir,
  });
  if (deleted.code !== 0)
    throw new Error(
      `route.stone.del failed: ${deleted.stdout} ${deleted.stderr}`,
    );
};

/**
 * .what = extract self-review slugs from a guard file
 * .why = dynamically discover reviews instead of hardcoded lists
 *
 * .note = only extracts slugs from `reviews: self:` section, not `peer:` section
 *         because bhrain only creates .triggered files for self-reviews
 */
export const getSlugsFromGuardFile = (input: {
  guardPath: string;
}): string[] => {
  const content = fs.readFileSync(input.guardPath, 'utf-8');

  // find the self: section; it ends at peer: or judges: or end of reviews block
  const selfSectionMatch = content.match(
    /reviews:\s*\n\s+self:\s*\n([\s\S]*?)(?=\n\s+peer:|\n\s*judges:|\nartifacts:|\n[a-z]+:|\s*$)/,
  );
  if (!selfSectionMatch) return [];

  // extract each slug in the self: section
  const selfSection = selfSectionMatch[1]!;
  const slugMatches = selfSection.matchAll(/^\s+-\s+slug:\s+(.+)$/gm);
  return Array.from(slugMatches, (m) => m[1]!.trim());
};

/**
 * .what = the ask marker bhrain writes when it hands out one self-review
 * .why = bhrain (>=0.39) dates the ask by this file's mtime: a promise inside 30s of it is
 *        refused once as rushed, and an articulation older than it is refused as stale
 */
const asAskMarkerFilename = (input: { stone: string; slug: string }): string =>
  `${input.stone}.guard.selfreview.${input.slug}.triggered.since`;

/**
 * .what = backdate one slug's ask marker past bhrain's haste window
 * .why = the journey promises at once; a real driver reads first. a backdate stands in for
 *        that read time, so the promise clears the haste cue on its first attempt
 */
const backdateAskMarker = (input: {
  routeDir: string;
  stone: string;
  slug: string;
}): void => {
  const filePath = path.join(input.routeDir, asAskMarkerFilename(input));
  const mtimePast = new Date(Date.now() - 91 * 1000);
  fs.utimesSync(filePath, mtimePast, mtimePast);
};

/**
 * .what = promise all self-reviews for a stone via bhrain's one-at-a-time ask
 * .why = follows bhrain's (>=0.39) promise contract exactly:
 *   t0: --as passed (asks review 1, blocked) ← done by caller
 *   t1: backdate ask 1 + write articulation + promise --into (NO pass call)
 *   tN: --as passed (asks review N) + backdate + write articulation + promise --into
 */
export const promiseAllReviewSelfs = (input: {
  repoDir: string;
  routeDir: string;
  routeRel: string;
  stone: string;
}): void => {
  // discover the self-review slugs this stone's guard declares
  const slugs = getSlugsFromGuardFile({
    guardPath: path.join(path.dirname(input.routeDir), `${input.stone}.guard`),
  });
  if (slugs.length === 0)
    throw new Error(`no self-review slugs found in ${input.stone}.guard`);

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i]!; // safe: bounded by array length

    // 1. trigger next review via --as passed (skip for i=0, already triggered by caller)
    if (i > 0) {
      const passed = setStoneAs({ ...input, as: 'passed' });
      // exit code 2 = constraint: the self-review gate halted the pass (expected)
      const wasBlockedByReviewSelf =
        passed.code === 2 && passed.stdout.includes('review.self');
      if (!wasBlockedByReviewSelf)
        throw new Error(
          `[${i}] pass call FAILED unexpectedly: code=${passed.code}, stdout=${passed.stdout}, stderr=${passed.stderr}`,
        );
    }

    // 2. verify bhrain asked this slug (its ask marker exists)
    const filesBefore = fs.readdirSync(input.routeDir);
    const askMarker = asAskMarkerFilename({ stone: input.stone, slug });
    if (!filesBefore.includes(askMarker))
      throw new Error(
        `[${i}] no ask marker ${askMarker} for slug=${slug}. files: ${filesBefore.join(', ')}`,
      );

    // 3. backdate the ask, so the promise clears the haste cue
    backdateAskMarker({ ...input, slug });

    // 4. write the articulation AFTER the backdate, so it post-dates the ask (never stale)
    // bhrain owes it at: $route/review/self/for.{stone}._.{slug}.md
    const articulationRel = `${input.routeRel}/review/self/for.${input.stone}._.${slug}.md`;
    const articulationPath = path.join(input.repoDir, articulationRel);
    fs.mkdirSync(path.dirname(articulationPath), { recursive: true });
    fs.writeFileSync(
      articulationPath,
      `# ${slug}\n\nTest articulation for ${slug}.`,
    );

    // 5. promise this review, named by the path it was written to
    const promised = runSkill({
      repo: 'bhrain',
      skill: 'route.stone.set',
      args: `--stone ${input.stone} --route ${input.routeRel} --as promised --that ${slug} --into ${articulationRel}`,
      cwd: input.repoDir,
    });
    if (promised.code !== 0)
      throw new Error(
        `[${i}] promise call FAILED: code=${promised.code}, stdout=${promised.stdout}, stderr=${promised.stderr}`,
      );

    // 6. verify promise file was created (a challenged promise writes none)
    const filesAfter = fs.readdirSync(input.routeDir);
    const promiseFile = filesAfter.find(
      (f) =>
        f.startsWith(`${input.stone}.guard.promise.${slug}.`) &&
        f.endsWith('.md'),
    );
    if (!promiseFile)
      throw new Error(
        `[${i}] promise file not created for slug=${slug}. files: ${filesAfter.join(', ')}`,
      );
  }
};

/**
 * .what = writes an executable stub into the consumer
 */
const setStubExecutable = (input: {
  repoDir: string;
  relPath: string;
  content: string;
}): void => {
  const filePath = path.join(input.repoDir, input.relPath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, input.content);
  fs.chmodSync(filePath, 0o755);
};

/**
 * .what = writes a stub role readme into the consumer
 * .why = rhachet resolves every role an enroll names before the enroll stub
 *        runs, so each must exist on disk
 */
const setStubRole = (input: { repoDir: string; relDir: string }): void => {
  const roleDir = path.join(input.repoDir, input.relDir);
  fs.mkdirSync(roleDir, { recursive: true });
  fs.writeFileSync(
    path.join(roleDir, 'readme.md'),
    `# ${path.basename(input.relDir)} (stub)\nstub role for tests\n`,
  );
};

/**
 * .what = the stub reviewer output, per contract.reviewer-output
 * .note = bhrain parses "N blockers" + "N nitpicks" numeric tokens to derive
 *         the review verdict; prose like "no blockers found" is a malfunction.
 */
const STUB_REVIEW_OUTPUT = `echo "# review (stub)"
echo ""
echo "0 blockers"
echo "0 nitpicks"
exit 0`;

/**
 * .what = the dist build stamp — an installed consumer is valid for one build
 * .why = pnpm copies this package's dist into the consumer at install time, so
 *        a consumer installed against a prior build would test stale code; the
 *        mtime of dist/index.js moves on every `npm run build`
 */
const getDistStamp = (): string =>
  String(
    Math.floor(
      fs.statSync(path.join(process.cwd(), 'dist', 'index.js')).mtimeMs,
    ),
  );

/**
 * .what = blocks the worker for a moment, with no busy loop
 */
const sleepSync = (input: { ms: number }): void => {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, input.ms);
};

/**
 * .what = the claim on a template build, taken via an atomic mkdir
 * .why = jest runs the journey suites on parallel workers; exactly one of them
 *        may install, and the rest await its result
 */
const getTemplateBuildClaim = (input: { lockDir: string }): boolean => {
  try {
    fs.mkdirSync(input.lockDir);
    return true;
  } catch (error: unknown) {
    // allowlist the lost race; rethrow all else (else failhide)
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'EEXIST'
    )
      return false;
    throw error;
  }
};

/**
 * .what = waits for the worker that holds the claim to mark the template ready
 */
const awaitTemplateReady = (input: {
  readyPath: string;
  lockDir: string;
}): void => {
  const deadline = Date.now() + 10 * 60 * 1000;
  while (!fs.existsSync(input.readyPath)) {
    // the builder releases its claim on failure, so an absent claim with no
    // ready marker means that build failed — fail loud rather than wait out
    if (!fs.existsSync(input.lockDir))
      throw new Error(
        `the bhrain consumer template build failed in another worker; see that suite's error (template: ${path.dirname(input.readyPath)})`,
      );
    if (Date.now() > deadline)
      throw new Error(
        `the bhrain consumer template was not ready within 10 minutes; remove the stale claim and rerun: ${input.lockDir}`,
      );
    sleepSync({ ms: 500 });
  }
};

/**
 * .what = findserts one installed + linked + stubbed consumer per build,
 *         shared by every journey suite on every worker
 *
 * .why = 🔴 `pnpm install` plus five `roles link` calls cost ~35s unloaded and
 *        several times that on a loaded box. each stone suite paid it again,
 *        so the split into parallel suites multiplied the setup it meant to
 *        spread. a scene now symlinks this template's node_modules and copies
 *        the rest — the role links are relative, so they point through the
 *        scene's own node_modules link exactly as a fresh link would
 */
const findsertBhrainConsumerTemplate = (): string => {
  // reuse the template for this build, if one is ready
  const templateDir = path.join(
    os.tmpdir(),
    `rhachet-roles-bhuild.bhrain-consumer.${getDistStamp()}`,
  );
  const readyPath = path.join(templateDir, '.ready');
  const lockDir = `${templateDir}.lock`;
  if (fs.existsSync(readyPath)) return templateDir;

  // claim the build, or await the worker that holds the claim
  if (!getTemplateBuildClaim({ lockDir })) {
    awaitTemplateReady({ readyPath, lockDir });
    return templateDir;
  }

  // build the template; release the claim on failure so waiters fail loud
  try {
    fs.rmSync(templateDir, { recursive: true, force: true });
    fs.mkdirSync(templateDir, { recursive: true });
    execSync('git init -b main', { cwd: templateDir, stdio: 'pipe' });
    setConsumerInstall({ repoDir: templateDir });
    fs.writeFileSync(readyPath, new Date().toISOString());
    return templateDir;
  } catch (error: unknown) {
    fs.rmSync(lockDir, { recursive: true, force: true });
    throw error;
  }
};

/**
 * .what = creates a consumer repo with both bhuild and bhrain linked
 * .why = tests the full journey from init.behavior through route.stone.set
 */
export const genConsumerRepoWithBhrain = (input: {
  prefix: string;
  branchName: string;
}): { repoDir: string; cleanup: () => void } => {
  const { repoDir, cleanup } = genTestGitRepo({
    prefix: input.prefix,
    branchName: input.branchName,
  });

  // share the installed template: link its node_modules, copy all else
  const templateDir = findsertBhrainConsumerTemplate();
  fs.symlinkSync(
    path.join(templateDir, 'node_modules'),
    path.join(repoDir, 'node_modules'),
  );
  const entriesShared = fs
    .readdirSync(templateDir)
    .filter((entry) => !['.git', 'node_modules', '.ready'].includes(entry));
  for (const entry of entriesShared)
    execSync(`cp -a "${path.join(templateDir, entry)}" "${repoDir}/"`);

  return { repoDir, cleanup };
};

/**
 * .what = installs and links the consumer's deps, then writes the review stubs
 */
const setConsumerInstall = (input: { repoDir: string }): void => {
  const { repoDir } = input;

  // create package.json with bhuild, bhrain, and ehmpathy roles
  fs.writeFileSync(
    path.join(repoDir, 'package.json'),
    JSON.stringify(
      {
        name: 'test-consumer',
        version: '1.0.0',
        dependencies: {
          'rhachet-roles-bhuild': `file:${process.cwd()}`,
          'rhachet-roles-bhrain': '0.39.2', // at the peer floor (>=0.39.0), so `brain:` is parsed for real
          'rhachet-roles-ehmpathy': '>=1.34.0',
          rhachet: '^1.15.0',
        },
      },
      null,
      2,
    ),
  );

  // create .gitignore to exclude node_modules (prevents ENOBUFS in bhrain's git ls-files)
  // .note = no trailing slash: a scene's node_modules is a symlink, and git
  //         matches `dir/` against directories only
  fs.writeFileSync(path.join(repoDir, '.gitignore'), 'node_modules\n');

  // install dependencies
  execSync('npx pnpm install --ignore-scripts', {
    cwd: repoDir,
    stdio: 'pipe',
  });

  // link roles
  for (const { repo, role } of [
    { repo: 'bhuild', role: 'behaver' },
    { repo: 'bhrain', role: 'driver' },
    { repo: 'ehmpathy', role: 'architect' },
    { repo: 'ehmpathy', role: 'mechanic' },
    { repo: 'ehmpathy', role: 'ergonomist' },
  ])
    execSync(
      `${getRhachetBin({ repoDir })} roles link --repo ${repo} --role ${role}`,
      { cwd: repoDir, env: getConsumerEnv({ repoDir }), stdio: 'pipe' },
    );

  /**
   * .mock = the peer-review brain: the `claude` cli, the bhrain `review` skill, the rhachet
   *         `enroll` skill, and the `use.apikeys` credential source they read
   * .why = the subject here is bhuild's guard templates — that `init.behavior` emits guards
   *        whose stones, self-reviews, and judges drive a route to passage. a real reviewer
   *        is a paid llm call per guard with a non-deterministic verdict, so a real one would
   *        make each guard's passage a coin flip, not a check of the template. the stubs return
   *        a fixed, contract-valid verdict (`0 blockers` / `0 nitpicks`) so only the guard
   *        wire is under test
   * .real = the review boundary itself is proven where it lives: rhachet-roles-bhrain's own
   *         `review` acceptance suite, and every live route drive (this route's peer rounds
   *         run the real guards these templates emit)
   */
  // create stub claude binary (peer reviews use rhachet enroll claude, which calls claude CLI)
  // .note = rhachet's brain-cli probes `claude --version` before a dispatch: an
  //         answer with no version reads as a malfunction, and one below its
  //         floor (2.1.277 as of 2026-09) as a constraint. the stub answers far
  //         above any floor, since the floor only rises and the stub is not the
  //         subject of this suite
  setStubExecutable({
    repoDir,
    relPath: 'node_modules/.bin/claude',
    content: `#!/usr/bin/env bash
# stub claude for tests - outputs success without API call
if [[ "\${1:-}" == "--version" ]]; then
  echo "99.0.0 (Claude Code)"
  exit 0
fi
${STUB_REVIEW_OUTPUT}
`,
  });

  // create dummy use.apikeys.sh (peer reviews source this, but no real keys needed in tests)
  setStubExecutable({
    repoDir,
    relPath: '.agent/repo=.this/role=any/skills/use.apikeys.sh',
    content: '#!/usr/bin/env bash\n# dummy for tests - no API keys needed\n',
  });

  // create stub review skill (peer reviews invoke this, outputs success with no issues)
  // emits numeric counts to stdout per contract.reviewer-output (guard parses stdout)
  setStubExecutable({
    repoDir,
    relPath: '.agent/repo=bhrain/role=driver/skills/review.sh',
    content: `#!/usr/bin/env bash
# stub review skill for tests - outputs success with no blockers
OUTPUT=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --output) OUTPUT="$2"; shift 2 ;;
    *) shift ;;
  esac
done
if [[ -n "$OUTPUT" ]]; then
  mkdir -p "$(dirname "$OUTPUT")"
  printf '# peer review (stub)\\n\\n0 blockers\\n0 nitpicks\\n' > "$OUTPUT"
fi
echo "0 blockers"
echo "0 nitpicks"
exit 0
`,
  });

  // create stub roles the peer reviews enroll
  // .note = the reviewer dir supports role resolution, not coverage — the
  //         reviewer role's presence in the guards is asserted directly in the
  //         guard-template suite
  for (const relDir of [
    '.agent/repo=ehmpathy/role=architect',
    '.agent/repo=ehmpathy/role=mechanic',
    '.agent/repo=ehmpathy/role=ergonomist',
    '.agent/repo=bhrain/role=reviewer',
  ])
    setStubRole({ repoDir, relDir });

  // create stub enroll skill (peer reviews use rhachet enroll claude, must succeed in tests)
  setStubExecutable({
    repoDir,
    relPath: '.agent/repo=rhachet/role=any/skills/enroll.sh',
    content: `#!/usr/bin/env bash
# stub enroll skill for tests - outputs success without active claude
${STUB_REVIEW_OUTPUT}
`,
  });
};

/**
 * .what = the one self-review slug a stubbed roster holds
 */
export const SLUG_REVIEW_SELF_STUB = 'has-stub-review';

/**
 * .what = a guard whose `reviews: self:` roster holds one stub reviewer
 * .why = each self-review is a pass + a promise through bhrain, ~2–6s per
 *        call. the journey proves the gate is connected; the full roster is
 *        read in isolation (rule.forbid.live-review-rosters-in-acceptance-journeys)
 *
 * .note = the self block ends at the next key at its own depth (`  peer:`) or
 *         at a top-level key; a blank line inside a `say: |` block is neither
 */
export const asGuardWithSelfReviewsStubbed = (input: {
  content: string;
}): string => {
  const lines = input.content.split('\n');
  const selfStart = lines.findIndex((line) => line === '  self:');
  if (selfStart === -1) return input.content;
  const selfLength = lines
    .slice(selfStart + 1)
    .findIndex((line) => /^ {0,2}\S/.test(line));
  const selfEnd =
    selfLength === -1 ? lines.length : selfStart + 1 + selfLength;
  return [
    ...lines.slice(0, selfStart + 1),
    `    - slug: ${SLUG_REVIEW_SELF_STUB}`,
    '      say: |',
    '        stub self-review; the real roster is read in isolation.',
    ...lines.slice(selfEnd),
  ].join('\n');
};

/**
 * .what = a consumer repo with a heavy-guard behavior initialized, ready to drive
 * .why = each stone's journey suite starts from this one scene, so the stones
 *        run as parallel suites rather than one serial chain
 */
export const genGuardedBehaviorScene = (input: {
  prefix: string;
}): {
  repoDir: string;
  behaviorDir: string;
  routeRel: string;
  routeDir: string;
  cleanup: () => void;
} => {
  // setup consumer repo
  const { repoDir, cleanup } = genConsumerRepoWithBhrain({
    prefix: input.prefix,
    branchName: `feature/${input.prefix}`,
  });

  // create initial src/ structure (execution guard requires src/**/* artifacts)
  // committed early so a later edit shows a diff
  fs.mkdirSync(path.join(repoDir, 'src'), { recursive: true });
  fs.writeFileSync(
    path.join(repoDir, 'src', 'index.ts'),
    '// initial placeholder\nexport const version = "0.0.0";\n',
  );
  execSync('git add src/ && git commit -m "add initial src structure"', {
    cwd: repoDir,
    stdio: 'pipe',
  });

  // initialize behavior with heavy guards (tests the full guard journey)
  const initialized = runSkill({
    repo: 'bhuild',
    skill: 'init.behavior',
    args: '--name full-journey --guard heavy',
    cwd: repoDir,
  });
  if (initialized.code !== 0)
    throw new Error(
      `init.behavior failed: code=${initialized.code}, stdout=${initialized.stdout}, stderr=${initialized.stderr}`,
    );

  // find the behavior dir
  const behaviorDirName = fs
    .readdirSync(path.join(repoDir, '.behavior'))
    .find((d) => d.includes('full-journey'));
  if (!behaviorDirName) throw new Error('behavior dir not found');
  const behaviorDir = path.join(repoDir, '.behavior', behaviorDirName);

  // stub each guard's self-review roster to one reviewer; peer + judges stay
  // verbatim (rule.forbid.live-review-rosters-in-acceptance-journeys)
  for (const guardFile of fs
    .readdirSync(behaviorDir)
    .filter((f) => f.endsWith('.guard'))) {
    const guardPath = path.join(behaviorDir, guardFile);
    fs.writeFileSync(
      guardPath,
      asGuardWithSelfReviewsStubbed({
        content: fs.readFileSync(guardPath, 'utf-8'),
      }),
    );
  }

  return {
    repoDir,
    behaviorDir,
    routeRel: `.behavior/${behaviorDirName}`,
    routeDir: path.join(behaviorDir, '.route'),
    cleanup,
  };
};

/**
 * .what = the stones recorded as passed in the route's passage.jsonl
 */
export const getStonesPassed = (input: { routeDir: string }): string[] =>
  fs
    .readFileSync(path.join(input.routeDir, 'passage.jsonl'), 'utf-8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))
    .filter((p: { status?: string }) => p.status === 'passed')
    .map((p: { stone: string }) => p.stone);
