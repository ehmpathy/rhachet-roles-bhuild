import fs from 'fs';
import path from 'path';

import { ConstraintError, UnexpectedCodePathError } from 'helpful-errors';
import { given, then, useBeforeAll, when } from 'test-fns';

import {
  genConsumerRepo,
  GITHUB_DEMO_REPO,
  runRhachetSkill,
  sanitizeOutput,
} from '../.test/infra';

/**
 * .what = acceptance tests for radio.task.comment via the real gh.issues channel
 * .why = the stub suite proves the gate, the queue, and the output; only a real gh call proves
 *        the thread read and the post agree with the cli shape the dao parses
 *
 * .note = auth is provided via keyrack (EHMPATH_BEAVER_GITHUB_TOKEN), as the push gh suite does
 *
 * .usage:
 *   npm run test:acceptance -- skill.radio.task.comment.via-gh-issues
 */

/**
 * .what = invoke a dispatcher skill against the scene
 * .why = each call is a consumer invocation, as a clone would run it
 */
const runSkill = (input: {
  repoDir: string;
  homeDir: string;
  skill: string;
  args: string;
  human?: boolean;
}) =>
  runRhachetSkill({
    repo: 'bhuild',
    role: 'dispatcher',
    skill: input.skill,
    args: input.args,
    repoDir: input.repoDir,
    env: {
      HOME: input.homeDir,
      ...(input.human ? { __I_AM_HUMAN: 'true' } : {}),
    },
    timeout: 60000, // gh api calls can be slow
  });

/**
 * .what = the live output with the bytes each run mints masked
 * .why = the issue number and the comment id are new on every run; all else must match the snap
 */
const asStableLiveOutput = (input: { output: string; exid: string }): string =>
  sanitizeOutput(input.output)
    .split(`#${input.exid}`)
    .join('#<exid>')
    .split(`/issues/${input.exid}`)
    .join('/issues/<exid>')
    .replace(/issuecomment-\d+/g, 'issuecomment-<id>');

describe('radio.task.comment via gh.issues', () => {
  // one consumer repo and one demo issue for every case (pnpm install is expensive)
  const scene = useBeforeAll(async () => {
    const consumer = await genConsumerRepo({ prefix: 'radio-comment-gh-acpt-' });
    const homeDir = path.join(consumer.repoDir, '.home');
    fs.mkdirSync(homeDir);

    // allow radio for @all orgs; a failed grant fails here, not as a later held comment
    const allowed = runSkill({
      repoDir: consumer.repoDir,
      homeDir,
      skill: 'radio.uses',
      args: '--org @all allow',
      human: true,
    });
    if (allowed.exitCode !== 0)
      throw new UnexpectedCodePathError('radio.uses allow failed in the scene', {
        exitCode: allowed.exitCode,
        output: allowed.output,
        hint: 'run `npm run build` first; the scene grants radio via the built skill',
      });

    // open a demo issue to comment on
    const title = `comment target ${Date.now()}`;
    const pushed = runSkill({
      repoDir: consumer.repoDir,
      homeDir,
      skill: 'radio.task.push',
      args: `--via gh.issues --into "${GITHUB_DEMO_REPO}" --title "${title}" --description "a thread for the comment acceptance test"`,
    });
    const exid = pushed.output.match(/exid: (\d+)/)?.[1];
    if (!exid)
      throw new ConstraintError('the demo issue push names no exid', {
        exitCode: pushed.exitCode,
        output: pushed.output,
        hint: 'the robot github token is likely absent (the push holds as upstream:auth); run: rhx keyrack unlock --owner ehmpath --env test',
      });

    return { consumer, homeDir, exid, title };
  });

  // a unique body per run, so a rerun never meets a prior run's comment
  const body = `the tide table test passes now (${Date.now()})`;

  given('[case1] a comment on a real issue', () => {
    when('[t0] the body is not yet on the thread', () => {
      const result = useBeforeAll(async () =>
        runSkill({
          repoDir: scene.consumer.repoDir,
          homeDir: scene.homeDir,
          skill: 'radio.task.comment',
          args: `--via gh.issues --into "${GITHUB_DEMO_REPO}" --exid ${scene.exid} --comment "${body}"`,
        }),
      );

      then('exit code is 0, and it reads posted, with the comment url', () => {
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain(`posted: comment on #${scene.exid}`);
        expect(result.output).toMatch(
          new RegExp(`url: https://github\\.com/${GITHUB_DEMO_REPO}/issues/${scene.exid}#issuecomment-\\d+`),
        );
      });

      then('the live posted output matches the snap, run-minted bytes masked', () => {
        expect(
          asStableLiveOutput({ output: result.stdout, exid: scene.exid }),
        ).toMatchSnapshot();
      });

      then('the issue itself is untouched: its title and body read back as pushed (#533)', () => {
        // read the issue back from github through the radio's own pull
        const pulled = runSkill({
          repoDir: scene.consumer.repoDir,
          homeDir: scene.homeDir,
          skill: 'radio.task.pull',
          args: `--via gh.issues --from "${GITHUB_DEMO_REPO}" --exid ${scene.exid}`,
        });
        expect(pulled.exitCode).toBe(0);
        expect(pulled.output).toContain(scene.title);
        expect(pulled.output).toContain('a thread for the comment acceptance test');
        // pull reads the issue body, never its comments; so the comment shows here only if it was
        // written into the issue body itself, the defect #533 names
        expect(pulled.output).not.toContain(body);
      });
    });

    when('[t1] the same body is commented from a fresh record dir, as a second clone would', () => {
      const result = useBeforeAll(async () => {
        // a second clone holds no record of the first post; only the thread read can catch it
        fs.rmSync(path.join(scene.consumer.repoDir, '.behavior', '.radio'), {
          recursive: true,
          force: true,
        });
        return runSkill({
          repoDir: scene.consumer.repoDir,
          homeDir: scene.homeDir,
          skill: 'radio.task.comment',
          args: `--via gh.issues --into "${GITHUB_DEMO_REPO}" --exid ${scene.exid} --comment "${body}"`,
        });
      });

      then('exit code is 0, and it reads kept: the thread read found it, naught posted', () => {
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain(`kept: comment on #${scene.exid}`);
        expect(result.output).toContain('already on the thread');
      });

      then('the live kept output matches the snap, run-minted bytes masked', () => {
        expect(
          asStableLiveOutput({ output: result.stdout, exid: scene.exid }),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case2] a comment on an issue that does not exist', () => {
    when('[t0] the clone comments on an absent thread', () => {
      const result = useBeforeAll(async () =>
        runSkill({
          repoDir: scene.consumer.repoDir,
          homeDir: scene.homeDir,
          skill: 'radio.task.comment',
          args: `--via gh.issues --into "${GITHUB_DEMO_REPO}" --exid 99999999 --comment "no such thread (${Date.now()})"`,
        }),
      );

      then('exit code is 2, and it reads refused, with the fix', () => {
        expect(result.exitCode).toBe(2);
        expect(result.output).toContain('refused');
        expect(result.output).toContain('#99999999');
      });

      then('the live refused output matches the snap', () => {
        expect(
          asStableLiveOutput({ output: result.stdout, exid: scene.exid }),
        ).toMatchSnapshot();
      });
    });
  });
});
