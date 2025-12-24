import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export const SKILL_PATH: string = path.join(__dirname, 'review.behavior.sh');
export const FIXTURES_PATH: string = path.join(
  __dirname,
  '.test/assets/example.repo',
);

/**
 * .what = finds feedback file matching pattern with timestamp
 * .why = feedback files have dynamic timestamps in filename
 */
export const findFeedbackFile = (
  dir: string,
  pattern: string,
): string | undefined => {
  const files = fs.readdirSync(dir);
  return files.find(
    (f) => f.includes(pattern) && f.includes('[feedback]') && f.endsWith('.md'),
  );
};

/**
 * .what = creates a temp copy of fixture with real git history
 * .why = avoids git-within-git issues by isolating in /tmp
 */
export const prepareFixtureWithGit = (fixturePath: string): string => {
  // create temp directory
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'review-behavior-'));

  // copy fixture contents (including hidden directories like .behavior/)
  execSync(`cp -a ${fixturePath}/. ${tempDir}/`);

  // init git repo
  execSync('git init', { cwd: tempDir });
  execSync('git config user.email "test@test.com"', { cwd: tempDir });
  execSync('git config user.name "Test"', { cwd: tempDir });

  // commit behavior declarations on main
  execSync('git add .behavior/', { cwd: tempDir });
  execSync('git commit -m "initial: add behavior declarations"', {
    cwd: tempDir,
  });

  return tempDir;
};
