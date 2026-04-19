import { execSync } from 'child_process';
import {
  detectTerminalChoice,
  transformMessageForTerminal,
} from 'emoji-space-shim';
import path from 'path';

import { runRhachetSkill } from '../../.test/infra';

/**
 * .what = shim a string with emoji space adjustments
 * .why = ensures test assertions match output regardless of terminal env
 */
export const shim = (message: string) =>
  transformMessageForTerminal({ message, terminal: detectTerminalChoice() });

/**
 * .what = mask dynamic values in stdout for snapshot consistency
 * .why = dates and some paths vary per run, mask them for stable snapshots
 */
export const asSnapshotStable = (stdout: string): string =>
  stdout
    // mask iso dates in behavior dir names: v2026_02_23 -> v{DATE}
    .replace(/v\d{4}_\d{2}_\d{2}/g, 'v{DATE}')
    // mask branch-specific bind flags: .bind.feature.foo.flag -> .bind.{BRANCH}.flag
    .replace(/\.bind\.[a-z0-9._-]+\.flag/gi, '.bind.{BRANCH}.flag')
    // mask time values: "passed 3.6s" -> "passed [time]"
    .replace(/\d+\.\d+s/g, '[time]')
    // mask temp dir paths with timestamps: .temp/2026-04-17T17-05-08.861Z.name.hash -> .temp/{TEMP}
    .replace(/\.temp\/\d{4}-\d{2}-\d{2}T[\d-]+\.\d+Z\.[a-z0-9.-]+/gi, '.temp/{TEMP}');

export const SCRIPT_PATH = path.join(
  __dirname,
  '../../../src/domain.roles/behaver/skills/init.behavior.sh',
);

/**
 * .what = runs init.behavior via rhachet dispatch (consumer pattern)
 * .why = tests the skill as a consumer would invoke it
 */
export const runInitBehaviorSkillViaRhachet = (input: {
  behaviorName: string;
  repoDir: string;
}) =>
  runRhachetSkill({
    repo: 'bhuild',
    skill: 'init.behavior',
    args: `--name "${input.behaviorName}"`,
    repoDir: input.repoDir,
  });

/**
 * .what = runs init.behavior via direct bash spawn
 * .why = tests the shell executable directly without rhachet dispatch
 */
export const runInitBehaviorSkillDirect = (input: {
  args: string;
  repoDir: string;
  stdin?: string;
}): { stdout: string; stderr: string; exitCode: number } => {
  const { spawnSync } = require('child_process');
  const result = spawnSync(`bash "${SCRIPT_PATH}" ${input.args}`, {
    cwd: input.repoDir,
    encoding: 'utf-8',
    input: input.stdin,
    env: {
      ...process.env,
      PATH: process.env.PATH,
    },
    shell: true,
  });
  return {
    stdout: (result.stdout ?? '').trim(),
    stderr: (result.stderr ?? '').trim(),
    exitCode: result.status ?? 0,
  };
};
