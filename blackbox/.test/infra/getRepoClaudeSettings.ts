import fs from 'fs';
import path from 'path';

/**
 * .what = the repo-level claude settings path of a consumer repo, relative to its root
 * .why  = `rhachet roles init` (rhachet >= 1.50) binds role hooks into the actor brain
 *         dir's `settings.of.repo.json`, reached via the `.claude` link. the
 *         `.claude/settings.json` beside it links on to the host's own
 *         `~/.claude/settings.json`, so a test must never read or write role hooks there
 */
export const REPO_CLAUDE_SETTINGS_PATH = path.join(
  '.claude',
  'settings.of.repo.json',
);

/**
 * .what = reads the repo-level claude settings a consumer repo's roles bound
 * .why  = one read site, so every test checks hooks where rhachet writes them
 */
export const getRepoClaudeSettings = (input: {
  repoDir: string;
}): {
  hooks?: Record<
    string,
    { matcher?: string; hooks?: { command: string; author?: string }[] }[]
  >;
} => {
  const settingsPath = path.join(input.repoDir, REPO_CLAUDE_SETTINGS_PATH);
  if (!fs.existsSync(settingsPath))
    throw new Error(
      [
        `repo claude settings absent`,
        `  where: ${settingsPath}`,
        `  fix:   run \`rhachet roles init\` in the consumer repo before you read its hooks`,
      ].join('\n'),
    );
  return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
};
