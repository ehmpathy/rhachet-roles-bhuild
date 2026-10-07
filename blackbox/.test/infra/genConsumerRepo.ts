import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { genTempDir } from 'test-fns';

/**
 * .what = the roles every consumer repo links, in link order
 * .why  = one list feeds the template build, so a role added here reaches
 *         every scene with no second edit
 */
const ROLES_LINKED = [
  { repo: 'bhuild', role: 'behaver' },
  { repo: 'bhuild', role: 'decomposer' },
  { repo: 'bhuild', role: 'dispatcher' },
  { repo: 'bhrain', role: 'driver' },
];

/**
 * .what = the consumer's rhachet.use.ts — must exist before roles link
 */
const RHACHET_USE_CONTENT = `
import type { InvokeHooks, RoleRegistry } from 'rhachet';
import { getRoleRegistry as getRoleRegistryBhuild, getInvokeHooks as getInvokeHooksBhuild } from 'rhachet-roles-bhuild';
import { getRoleRegistry as getRoleRegistryBhrain } from 'rhachet-roles-bhrain';

export const getRoleRegistries = (): RoleRegistry[] => [getRoleRegistryBhuild(), getRoleRegistryBhrain()];
export const getInvokeHooks = (): InvokeHooks[] => [getInvokeHooksBhuild()];
`.trim();

/**
 * .what = .agent/keyrack.yml that extends the dispatcher role keyrack
 * .why  = keyrack SDK requires keyrack.yml at gitroot to construct key slugs
 */
const KEYRACK_YML_CONTENT = `org: ehmpathy
extends:
  - .agent/repo=bhuild/role=dispatcher/keyrack.yml
env.prod: null
env.prep:
  - EHMPATH_BEAVER_GITHUB_TOKEN
`;

/**
 * .what = writes the consumer files every scene shares: package.json + rhachet.use.ts
 */
const setConsumerFiles = (input: { repoDir: string }): void => {
  // package.json names rhachet-brains-anthropic for brain hooks adapter discovery
  // (init --hooks scans package.json for rhachet-brains-* packages)
  fs.writeFileSync(
    path.join(input.repoDir, 'package.json'),
    JSON.stringify(
      {
        name: 'test-consumer',
        version: '1.0.0',
        dependencies: { 'rhachet-brains-anthropic': '*' },
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(
    path.join(input.repoDir, 'rhachet.use.ts'),
    RHACHET_USE_CONTENT,
  );
};

/**
 * .what = the dist build stamp — the template is valid only for one build
 * .why  = a template linked against a prior build would hand a scene stale
 *         roles; the mtime of dist/index.js moves on every `npm run build`
 *
 * 🔴 .why the guard, and not a bare statSync
 *         `build:clean` runs `rm -rf dist/`, so any rebuild that starts
 *         while jest workers are live blanks this path mid-suite. the bare
 *         call then threw `ENOENT: … stat '<abs>/dist/index.js'` from a
 *         line 90 frames below the test — which names a PATH and not the
 *         CAUSE, so a reader diagnoses the helper rather than the race
 *         (rule.require.errors-name-the-fix, rule.require.failloud).
 *
 *         measured 2026-09-28: one full acceptance run failed this way in
 *         a suite that passed 14/14 in isolation moments later.
 */
const getDistStamp = (): string => {
  const pathDist = path.join(process.cwd(), 'dist', 'index.js');
  if (!fs.existsSync(pathDist))
    throw new Error(
      [
        `dist/index.js is absent — the acceptance scene cannot key its template`,
        ``,
        `  where: ${pathDist}`,
        `  why:   the suite links roles out of dist/, so a scene built against`,
        `         no dist would hand every test stale or absent roles`,
        ``,
        `  fix:   npm run build`,
        ``,
        `  ⚠️ if this fired MID-RUN on a tier that had already built, a second`,
        `     build ran concurrently — \`build:clean\` does \`rm -rf dist/\`, and`,
        `     it blanked this path out from under a live jest worker. re-run`,
        `     the tier alone before you diagnose the suite.`,
      ].join('\n'),
    );
  return String(Math.floor(fs.statSync(pathDist).mtimeMs));
};

/**
 * .what = findserts one fully linked consumer repo per jest worker per build
 *
 * .why  = 🔴 `rhachet roles link` runs rhachet's jit path: a fresh node that
 *         loads rhachet.use.ts and both role packages. four of those per scene
 *         were the dominant cost of the acceptance suite — a suite with nine
 *         scenes paid thirty-six of them. the links are RELATIVE symlinks
 *         (`../../../node_modules/...`) and every scene holds its own
 *         node_modules link to the same root, so one linked `.agent/` copies
 *         into any scene and resolves there exactly as a fresh link would.
 *
 * .note = keyed by worker pid AND dist stamp. a worker runs one suite at a
 *         time, so its own template never races; a rebuild moves the stamp,
 *         so no scene ever copies links from a stale build
 */
const findsertConsumerTemplate = (): string => {
  // reuse this worker's template for this build, if one is on disk
  const markerPath = path.join(
    os.tmpdir(),
    `rhachet-roles-bhuild.consumer-template.${process.pid}.${getDistStamp()}`,
  );
  if (fs.existsSync(markerPath)) {
    const templateFound = fs.readFileSync(markerPath, 'utf-8').trim();
    if (fs.existsSync(path.join(templateFound, '.agent'))) return templateFound;
  }

  // build the template: files, links, keyrack — once
  const templateDir = genTempDir({
    slug: 'consumer-template',
    git: true,
    symlink: [{ at: 'node_modules', to: 'node_modules' }],
  });
  setConsumerFiles({ repoDir: templateDir });
  for (const { repo, role } of ROLES_LINKED)
    execSync(`npx rhachet roles link --repo ${repo} --role ${role}`, {
      cwd: templateDir,
      stdio: 'pipe',
    });
  fs.writeFileSync(
    path.join(templateDir, '.agent', 'keyrack.yml'),
    KEYRACK_YML_CONTENT,
  );

  // record it only once complete, so a half-built template is never reused
  fs.writeFileSync(markerPath, templateDir);
  return templateDir;
};

/**
 * .what = overlays the worker's linked `.agent/` onto any temp repo
 *
 * .why  = 🔴 a scene that shells `claude` inside a temp repo boots that
 *         repo's rhachet hooks, and a repo with no `.agent/` refuses:
 *
 *             ✋ ConstraintError: no .agent/ found in this repo
 *                hint: run `rhachet roles link` first to initialize
 *
 *         so a bare `genTestGitRepo` fixture is UNFAITHFUL to any repo a
 *         consumer would ever run the skill in — a consumer linked the
 *         roles to obtain the skill at all. measured 2026-09-28, in
 *         `review.deliverable`, once a fail-loud chain echoed the child's
 *         own words instead of a bare exit code.
 *
 * .note = lifted out of `genConsumerRepo` once THREE further call sites
 *         needed it — `review.deliverable` plus the three `review.behavior`
 *         case suites, which share one `prepareFixtureWithGit`. proven
 *         reuse, per `rule.prefer.most-common-denominator`
 *
 * copies all the template's link output — `.agent/` and whatever else link
 * wrote at the root — save git and node_modules, which each scene owns.
 * `cp -a` keeps each relative symlink verbatim, so it points through the
 * repo's own node_modules link
 */
export const setConsumerLinks = (input: { repoDir: string }): void => {
  // node_modules FIRST: the copied `.agent/` holds relative symlinks
  // (`../../../node_modules/…`) that point through this repo's own link.
  // conditional, because `genConsumerRepo` already made one at creation
  const pathModules = path.join(input.repoDir, 'node_modules');
  if (!fs.existsSync(pathModules))
    fs.symlinkSync(path.join(process.cwd(), 'node_modules'), pathModules);

  const templateDir = findsertConsumerTemplate();
  const entriesLinked = fs
    .readdirSync(templateDir)
    .filter((entry) => !['.git', 'node_modules'].includes(entry));
  for (const entry of entriesLinked)
    execSync(`cp -a "${path.join(templateDir, entry)}" "${input.repoDir}/"`);

  // fail loud rather than hand a scene a repo the skill cannot run in.
  // 🔴 this assertion needs NO brain credential, so it holds even while the
  //   reviews behind it cannot run — which is the whole reason it is here
  //   rather than left to the review's own failure (rule.require.failfast)
  if (!fs.existsSync(path.join(input.repoDir, '.agent')))
    throw new Error(
      `setConsumerLinks: .agent/ absent after the link overlay at ${input.repoDir}`,
    );
};

/**
 * .what = creates a temporary git repo that simulates a consumer repo
 * .why  = tests portability when package is consumed as a dependency
 *
 * sets up:
 *   - git repo with initial commit
 *   - package.json
 *   - node_modules (symlinked from root for speed)
 *   - rhachet.use.ts that references the package
 *   - .agent/ with the four roles linked (copied from the worker's template)
 */
export const genConsumerRepo = (input?: {
  prefix?: string;
  withClaudeDir?: boolean;
  branchName?: string;
}): { repoDir: string } => {
  // create temp dir with git and node_modules symlink
  const repoDir = genTempDir({
    slug: input?.prefix ?? 'consumer-test',
    git: true,
    symlink: [{ at: 'node_modules', to: 'node_modules' }],
  });

  // write the shared consumer files
  setConsumerFiles({ repoDir });

  // checkout requested branch (use -B to force create/reset if exists)
  if (input?.branchName) {
    execSync(`git checkout -B "${input.branchName}"`, { cwd: repoDir });
  }

  setConsumerLinks({ repoDir });

  // a pre-made .claude/settings.json is what `roles link` would have found.
  // link moves it into the actor brain dir and leaves `.claude` a symlink to
  // that dir, so a write through the copied symlink lands it exactly there
  if (input?.withClaudeDir)
    fs.writeFileSync(
      path.join(repoDir, '.claude', 'settings.json'),
      JSON.stringify({ hooks: {} }, null, 2),
    );

  return { repoDir };
};
