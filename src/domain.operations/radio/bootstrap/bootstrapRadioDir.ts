import * as fs from 'fs/promises';
import * as path from 'path';

import type { RadioTaskRepo } from '../../../domain.objects/RadioTaskRepo';
import { getGlobalRadioRoot, getRadioPath } from './getRadioPath';

/**
 * .what = ensure global radio root readme exists
 * .why = self-document the global radio directory
 */
const ensureGlobalReadme = async (): Promise<void> => {
  const globalRoot = getGlobalRadioRoot();
  const readmePath = path.join(globalRoot, 'readme.md');

  try {
    await fs.access(readmePath);
    return; // already exists
  } catch {
    // create directory and readme
  }

  await fs.mkdir(globalRoot, { recursive: true });

  const content = `# .radio

> global radio directory for cross-repo task dispatch

this directory stores tasks broadcast via \`radio.task.push --via os.fileops\`.

## structure

- \`$owner/$repo/\` — tasks for each repo
- \`$owner/$repo/task.{exid}._.md\` — task content with frontmatter
- \`$owner/$repo/task.{exid}._.status=QUEUED.flag\` — status flag for fast glob

## usage

tasks here are accessible from each repo via \`.radio/\` symlink.

cross-repo dispatch writes directly here without local symlink.
`;

  await fs.writeFile(readmePath, content, 'utf-8');
};

/**
 * .what = ensure repo radio directory and readme exist
 * .why = self-document the repo radio directory
 */
const ensureRepoReadme = async (input: {
  repo: RadioTaskRepo;
}): Promise<string> => {
  const paths = getRadioPath({ repo: input.repo, variant: 'global' });
  const readmePath = paths.readme!;

  try {
    await fs.access(readmePath);
    return paths.radioDir; // already exists
  } catch {
    // create directory and readme
  }

  await fs.mkdir(paths.radioDir, { recursive: true });

  const content = `# .radio/${input.repo.owner}/${input.repo.name}

> local radio cache for ${input.repo.owner}/${input.repo.name}

this directory stores tasks for the ${input.repo.owner}/${input.repo.name} repository.

## files

- \`readme.md\` — this file
- \`task.{exid}._.md\` — main task file with yaml frontmatter
- \`task.{exid}.bak.{isodate}.md\` — backup from prior edit
- \`task.{exid}._.status={STATUS}.flag\` — empty flag file for status glob
`;

  await fs.writeFile(readmePath, content, 'utf-8');
  return paths.radioDir;
};

/**
 * .what = ensure local .radio symlink exists
 * .why = provide local access to global radio directory
 */
const ensureLocalSymlink = async (input: {
  repo: RadioTaskRepo;
  cwd: string;
}): Promise<string> => {
  const localPath = path.join(input.cwd, '.radio');
  const globalPath = getRadioPath({
    repo: input.repo,
    variant: 'global',
  }).radioDir;

  try {
    const stat = await fs.lstat(localPath);
    if (stat.isSymbolicLink()) {
      const target = await fs.readlink(localPath);
      if (target === globalPath) {
        return localPath; // already correct
      }
      // wrong target, remove and recreate
      await fs.rm(localPath);
    } else {
      // not a symlink, leave it alone
      return localPath;
    }
  } catch {
    // doesn't exist, create it
  }

  await fs.symlink(globalPath, localPath, 'dir');
  return localPath;
};

/**
 * .what = ensure radio directory structure exists
 * .why = bootstrap global and local radio dirs on first use
 */
export const bootstrapRadioDir = async (input: {
  repo: RadioTaskRepo;
  cwd: string;
}): Promise<{ globalDir: string; localSymlink: string }> => {
  // ensure global root readme
  await ensureGlobalReadme();

  // ensure repo directory and readme
  const globalDir = await ensureRepoReadme({ repo: input.repo });

  // ensure local symlink
  const localSymlink = await ensureLocalSymlink({
    repo: input.repo,
    cwd: input.cwd,
  });

  return { globalDir, localSymlink };
};
