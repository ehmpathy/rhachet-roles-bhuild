import * as fs from 'fs';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

/**
 * .what = the lines of one top-level job in a github workflow, from its key to the next job key
 * .why  = the repo carries no yaml parser; a job's block is its indented run of lines
 */
const getJobBlock = (input: { workflow: string; job: string }): string | null => {
  const lines = input.workflow.split('\n');
  const start = lines.findIndex((line) => line === `  ${input.job}:`);
  if (start === -1) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^ {2}[a-z][\w-]*:\s*$/.test(line));
  return [lines[start], ...(end === -1 ? rest : rest.slice(0, end))].join('\n');
};

/**
 * .what = proves ci turns the live github-robot tier on
 * .why  = RUN_GITHUB_ROBOT_TEST gates the tests that write real issues with the robot token.
 *         ci holds that token, so ci must set GITHUB_ROBOT_LIVE, or those tests run nowhere.
 *         a workflow edit (by hand, or by a declapract upgrade) that drops the flag goes red here
 */
describe('RUN_GITHUB_ROBOT_TEST.integration', () => {
  given('[case1] the repo test workflow', () => {
    const scene = useBeforeAll(async () => ({
      workflow: fs.readFileSync(
        path.join(__dirname, '../../../.github/workflows/.test.yml'),
        'utf-8',
      ),
    }));

    when('[t0] each shard job that runs the gated suites is read', () => {
      then('the integration shard job sets GITHUB_ROBOT_LIVE to true', () => {
        const block = getJobBlock({
          workflow: scene.workflow,
          job: 'test-shards-integration',
        });
        expect(block).not.toBeNull();
        expect(block).toContain("GITHUB_ROBOT_LIVE: 'true'");
      });

      then('the acceptance shard job sets GITHUB_ROBOT_LIVE to true', () => {
        const block = getJobBlock({
          workflow: scene.workflow,
          job: 'test-shards-acceptance',
        });
        expect(block).not.toBeNull();
        expect(block).toContain("GITHUB_ROBOT_LIVE: 'true'");
      });
    });
  });
});
