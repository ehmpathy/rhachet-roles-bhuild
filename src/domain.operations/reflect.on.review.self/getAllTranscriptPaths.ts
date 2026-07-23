import { existsSync, readdirSync, statSync } from 'fs';
import { homedir } from 'os';
import * as path from 'path';

/**
 * .what = the default root dir where claude-code stores per-project transcripts
 * .why = the corpus the reflection sweeps by default; honors a
 *        `CLAUDE_PROJECTS_DIR` env override so a non-default corpus (or a temp
 *        corpus in tests) can be pointed at without a code change
 *
 * .note = computed at call time (not a module const) so the env override and
 *         the current home dir are read when the sweep runs, not at import
 */
export const getDefaultProjectsDir = (): string =>
  process.env.CLAUDE_PROJECTS_DIR ??
  path.join(homedir(), '.claude', 'projects');

/**
 * .what = enumerate every transcript jsonl across all claude projects on the machine
 * .why = the default corpus is machine-wide; a `--project` filter narrows to one
 *        project's slug dir
 *
 * @param projectFilter - optional match text; only project slug dirs that include
 *        it are read (absent = all projects)
 * @param options.projectsDir - the corpus root to read; defaults to the real
 *        `~/.claude/projects`. tests point it at a temp dir for hermetic runs.
 */
export const getAllTranscriptPaths = (
  input: {
    projectFilter: string | null;
  },
  options?: { projectsDir?: string },
): string[] => {
  const projectsDir = options?.projectsDir ?? getDefaultProjectsDir();

  // no projects dir means no corpus to read
  if (!existsSync(projectsDir)) return [];

  // each child of the projects dir is one project's slug dir
  const projectSlugs = readdirSync(projectsDir);
  return projectSlugs.flatMap((projectSlug) => {
    // honor the optional project filter
    if (input.projectFilter && !projectSlug.includes(input.projectFilter))
      return [];

    const projectDir = path.join(projectsDir, projectSlug);
    if (!statSync(projectDir).isDirectory()) return [];

    // collect every jsonl transcript within the project dir
    return readdirSync(projectDir)
      .filter((entry) => entry.endsWith('.jsonl'))
      .map((entry) => path.join(projectDir, entry));
  });
};
