import fs from 'fs';
import { MalfunctionError } from 'helpful-errors';
import path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  genConsumerRepo,
  runRhachetSkill,
  runRolesInit,
  sanitizeOutput,
} from '../.test/infra';

/**
 * .what = acceptance tests for radio.task.comment
 * .why = a comment rides the radio's one gate: held when blocked (sends naught), delivered
 *        oldest first when open, posted once, and never a rewrite of the thread
 */

/**
 * .what = invoke a dispatcher skill in the consumer repo, with an isolated home
 * .why = the radio.uses meters and the os.fileops store live under $HOME
 */
const runDispatcherSkill = (input: {
  repoDir: string;
  homeDir: string;
  skill: string;
  args: string;
  env?: Record<string, string | undefined>;
  stdin?: string;
}) =>
  runRhachetSkill({
    repo: 'bhuild',
    role: 'dispatcher',
    skill: input.skill,
    args: input.args,
    repoDir: input.repoDir,
    env: { HOME: input.homeDir, ...input.env },
    ...(input.stdin !== undefined ? { stdin: input.stdin } : {}),
    timeout: 30000,
  });

/**
 * .mock = the gh cli, via a stub `gh` first on PATH
 * .why  = a post to a real thread is a public write per run, and an absent thread, a held
 *         comment, and a repeat are states a test cannot provoke on demand against github; the
 *         stub keeps each thread's comments in a json file and logs every call with its token
 * .real = blackbox/role=dispatcher/skill.radio.task.push.via-gh-issues.acceptance.test.ts drives
 *         real gh calls with the keyrack token; the view + post argv here are the two this skill
 *         adds (`gh issue view N --json number,comments`, `gh issue comment N --body-file F`)
 * .note = the absent-thread stderr is gh's own text, verbatim, since isGithubIssueAbsent reads it
 * .note = the stub token is a marker the stub logs, never a credential
 */
const STUB_GH = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
const dir = process.env.STUB_GH_DIR;
const at = args.indexOf('--repo');
const repo = at >= 0 ? args[at + 1].replace('/', '_') : '';
const n = args[2] || '';
fs.appendFileSync(path.join(dir, 'calls.log'), (process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '<gh-session>') + ' ' + args[0] + ' ' + args[1] + ' ' + repo + ' ' + n + '\\n');
const store = path.join(dir, 'thread.' + repo + '.' + n + '.json');
if (args[0] === 'api' && args[1] === 'user') { console.log('stubbot'); process.exit(0); }
if (args[0] === 'issue' && args[1] === 'view') {
  if (!fs.existsSync(store)) { process.stderr.write('GraphQL: Could not resolve to an issue or pull request with the number of ' + n + '. (repository.issue)\\n'); process.exit(1); }
  console.log(JSON.stringify({ number: Number(n), comments: JSON.parse(fs.readFileSync(store, 'utf8')) }));
  process.exit(0);
}
if (args[0] === 'issue' && args[1] === 'comment') {
  const body = fs.readFileSync(args[args.indexOf('--body-file') + 1], 'utf8');
  const comments = JSON.parse(fs.readFileSync(store, 'utf8'));
  // a pr thread answers with a /pull/ url, as gh does; a marker file names a thread as a pr
  const isPr = fs.existsSync(path.join(dir, 'pr.' + repo + '.' + n));
  const url = 'https://github.com/' + repo.replace('_', '/') + (isPr ? '/pull/' : '/issues/') + n + '#issuecomment-' + (1000 + comments.length);
  comments.push({ body, url });
  fs.writeFileSync(store, JSON.stringify(comments));
  // post-then-timeout mode (case=3): the comment lands, then the call dies as a dial timeout, once
  const flagTimeout = path.join(dir, 'post-then-timeout.flag');
  if (fs.existsSync(flagTimeout)) {
    fs.rmSync(flagTimeout);
    process.stderr.write('Post "https://api.github.com/graphql": dial tcp: lookup api.github.com: i/o timeout\\n');
    process.exit(1);
  }
  console.log(url);
  process.exit(0);
}
// a task create ([case1b]): no open twin, then a new issue number in sequence
if (args[0] === 'issue' && args[1] === 'list') { console.log('[]'); process.exit(0); }
if (args[0] === 'issue' && args[1] === 'create') {
  const seqFile = path.join(dir, 'seq');
  const seq = (fs.existsSync(seqFile) ? Number(fs.readFileSync(seqFile, 'utf8')) : 700) + 1;
  fs.writeFileSync(seqFile, String(seq));
  console.log('https://github.com/' + repo.replace('_', '/') + '/issues/' + seq);
  process.exit(0);
}
process.stderr.write('stub gh: unexpected call: ' + args.join(' ') + '\\n');
process.exit(1);
`;

/**
 * .what = a consumer repo with the dispatcher role initialized
 * .why = the skill runs through rhachet, as a clone runs it
 */
const genConsumerRepoWithDispatcher = (input: {
  prefix: string;
  branchName: string;
}): { repoDir: string } => {
  const consumer = genConsumerRepo({ ...input, withClaudeDir: true });
  const init = runRolesInit({
    repo: 'bhuild',
    role: 'dispatcher',
    repoDir: consumer.repoDir,
  });
  if (init.exitCode !== 0)
    throw new MalfunctionError('roles init --role dispatcher failed', {
      exitCode: init.exitCode,
      stderr: init.stderr,
      hint: 'run `npm run build` first; the consumer repo links the built roles',
    });
  return consumer;
};

/**
 * .what = mask the parts of an output that vary per run
 * .why = record uuids (a hash over the per-run repo), run ids, and dates differ each run
 */
const asStableOutput = (input: { output: string }): string =>
  sanitizeOutput(input.output)
    .replace(/repo-\d+/g, 'repo-<run>')
    .replace(/radio-task-[A-Za-z0-9]{6}/g, 'radio-task-<tmp>')
    .replace(/\b[0-9a-f]{16}\b/g, '<uuid>')
    .replace(/\d{4}-\d{2}-\d{2}/g, '<date>');

/**
 * .what = the org gate, written into the scene home
 * .why = the commander's gate, set as a human would set it, per scene
 */
const setGate = (input: {
  homeDir: string;
  org: string;
  gate: 'allowed' | 'blocked';
}) => {
  const dirMeter = path.join(
    input.homeDir,
    '.rhachet/storage/repo=bhuild/role=dispatcher/.meter',
  );
  fs.mkdirSync(dirMeter, { recursive: true });
  fs.writeFileSync(
    path.join(dirMeter, 'radio.uses.org.jsonc'),
    JSON.stringify({ orgs: { [input.org]: input.gate } }),
  );
};

describe('radio.task.comment', () => {
  given('[case1] a clone comments on a gh thread, via a stub gh (case=1, case=2, case=3, case=4, case=6)', () => {
    const authEnv = 'as-robot:env(RADIO_ACPT_COMMENT_TOKEN)';
    const tokenStub = 'ghp_radioAcptCommentTokenStub000000';
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepoWithDispatcher({
        prefix: 'radio-comment-acpt-',
        branchName: 'feat/comment',
      });
      const homeDir = path.join(consumer.repoDir, '.home');
      fs.mkdirSync(homeDir);
      const stubDir = genTempDir({ slug: 'radio-comment-acpt-stub-gh' });
      fs.writeFileSync(path.join(stubDir, 'gh'), STUB_GH, { mode: 0o755 });

      // two threads exist: a radio task issue #489, and a foreign pr #652 with a prior comment
      fs.writeFileSync(
        path.join(stubDir, 'thread.sandpine_svc-lessons.489.json'),
        '[]',
      );
      fs.writeFileSync(
        path.join(stubDir, 'thread.sandpine_svc-lessons.652.json'),
        JSON.stringify([
          {
            body: 'lgtm once the tide table test passes',
            url: 'https://github.com/sandpine/svc-lessons/pull/652#issuecomment-1',
          },
        ]),
      );
      fs.writeFileSync(path.join(stubDir, 'pr.sandpine_svc-lessons.652'), '');
      return { consumer, homeDir, stubDir };
    });

    /**
     * .what = the env each run carries: the stub gh first on PATH, its log dir, the env token
     */
    const getEnvWithStub = () => ({
      PATH: `${scene.stubDir}:${process.env.PATH}`,
      STUB_GH_DIR: scene.stubDir,
      RADIO_ACPT_COMMENT_TOKEN: tokenStub,
    });

    /**
     * .what = the gh calls the stub saw, each with the token it carried
     */
    const getStubCalls = (): string[] => {
      const file = path.join(scene.stubDir, 'calls.log');
      if (!fs.existsSync(file)) return [];
      return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
    };

    /**
     * .what = the verb of each gh call, e.g. `issue view`
     */
    const asCallVerbs = (input: { calls: string[] }): string[] =>
      input.calls.map((call) => call.split(' ').slice(1, 3).join(' '));

    /**
     * .what = the comments one stub thread holds
     */
    const getThreadComments = (input: { n: string }): { body: string }[] =>
      JSON.parse(
        fs.readFileSync(
          path.join(scene.stubDir, `thread.sandpine_svc-lessons.${input.n}.json`),
          'utf8',
        ),
      );

    /**
     * .what = run the comment skill with the stub
     */
    const runComment = (input: { args: string; stdin?: string }) =>
      runDispatcherSkill({
        ...scene,
        repoDir: scene.consumer.repoDir,
        skill: 'radio.task.comment',
        args: input.args,
        env: getEnvWithStub(),
        stdin: input.stdin,
      });

    when('[t0] the gate is shut and the clone comments on #489 (the clamp, #567)', () => {
      const result = useThen('the comment runs', () => {
        setGate({ homeDir: scene.homeDir, org: 'sandpine', gate: 'blocked' });
        const comment = runComment({
          args: `--via gh.issues --into sandpine/svc-lessons --exid 489 --comment @stdin --auth "${authEnv}"`,
          stdin: 'the cure on this task is wrong; see the tide table test\n',
        });
        return { comment, calls: getStubCalls() };
      });

      then('exit code is 2 — held, not delivered', () => {
        expect(result.comment.exitCode).toBe(2);
      });

      then('no gh call is made: the shut gate sends naught', () => {
        expect(result.calls).toEqual([]);
        expect(getThreadComments({ n: '489' })).toEqual([]);
      });

      then('the output says held, labeled as a comment on #489, with the lift', () => {
        expect(result.comment.stdout).toContain('🦫 held for the radio');
        expect(result.comment.stdout).toContain('comment = #489');
        expect(result.comment.stdout).toContain('rhx radio.uses --org sandpine allow');
        expect(asStableOutput({ output: result.comment.stdout })).toMatchSnapshot();
      });
    });

    when('[t1] a human lists what waits', () => {
      const result = useThen('the list runs', () =>
        runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.queue',
          args: 'get',
          env: getEnvWithStub(),
        }),
      );

      then('the held comment is listed, labeled as a comment ([case1b] lists it beside a held task)', () => {
        expect(result.stdout).toContain('comment on #489');
        expect(asStableOutput({ output: result.stdout })).toMatchSnapshot();
      });
    });

    when('[t2] the clone repeats the same comment at the shut gate', () => {
      const result = useThen('the repeat runs', () => {
        const comment = runComment({
          args: `--via gh.issues --into sandpine/svc-lessons --exid 489 --comment @stdin --auth "${authEnv}"`,
          stdin: 'the cure on this task is wrong; see the tide table test\n',
        });
        const dir = path.join(scene.consumer.repoDir, '.behavior', '.radio');
        const records = fs
          .readdirSync(dir)
          .filter((name) => name.startsWith('record.'));
        return { comment, records };
      });

      then('it lands on the one extant record, never a second', () => {
        expect(result.comment.exitCode).toBe(2);
        expect(result.records).toHaveLength(1);
        expect(result.comment.stdout).toContain('backlog = 1');
      });
    });

    when('[t3] the gate opens and the clone comments on a foreign pr #652', () => {
      const result = useThen('the comment runs', () => {
        setGate({ homeDir: scene.homeDir, org: 'sandpine', gate: 'allowed' });
        const callsBefore = getStubCalls().length;
        const comment = runComment({
          args: `--via gh.issues --into sandpine/svc-lessons --exid 652 --comment "the tide table test passes now" --auth "${authEnv}"`,
        });
        return { comment, calls: getStubCalls().slice(callsBefore) };
      });

      then('exit code is 0', () => {
        expect(result.comment.exitCode).toBe(0);
      });

      then('the held comment on #489 goes first, then the new one on #652', () => {
        const output = result.comment.stdout;
        expect(output.indexOf('comment on #489')).toBeLessThan(
          output.indexOf('comment on #652'),
        );
        expect(getThreadComments({ n: '489' }).map((c) => c.body)).toEqual([
          'the cure on this task is wrong; see the tide table test',
        ]);
        expect(getThreadComments({ n: '652' }).map((c) => c.body)).toEqual([
          'lgtm once the tide table test passes',
          'the tide table test passes now',
        ]);
        expect(asStableOutput({ output })).toMatchSnapshot();
      });

      then('each send read the thread, then posted — and never edited a thread', () => {
        expect(asCallVerbs({ calls: result.calls })).toEqual([
          'issue view',
          'issue comment',
          'issue view',
          'issue comment',
        ]);
      });

      then('every gh call carried the robot token the auth named', () => {
        expect(result.calls.every((call) => call.startsWith(`${tokenStub} `))).toBe(true);
      });
    });

    when('[t4] the same body is already on the thread, from another hand (case=3)', () => {
      const result = useThen('the comment runs', () => {
        const callsBefore = getStubCalls().length;
        const comment = runComment({
          args: `--via gh.issues --into sandpine/svc-lessons --exid 652 --comment "lgtm once the tide table test passes" --auth "${authEnv}"`,
        });
        return { comment, calls: getStubCalls().slice(callsBefore) };
      });

      then('exit code is 0, and it reads kept — naught posted', () => {
        expect(result.comment.exitCode).toBe(0);
        expect(result.comment.stdout).toContain('kept');
        expect(result.comment.stdout).toContain('naught posted');
        expect(asStableOutput({ output: result.comment.stdout })).toMatchSnapshot();
      });

      then('the thread was read, never posted to', () => {
        expect(asCallVerbs({ calls: result.calls })).toEqual(['issue view']);
        expect(getThreadComments({ n: '652' })).toHaveLength(2);
      });
    });

    when('[t5] the clone comments on a thread that does not exist (case=6)', () => {
      const result = useThen('the comment runs', () =>
        runComment({
          args: `--via gh.issues --into sandpine/svc-lessons --exid 99999 --comment "hello" --auth "${authEnv}"`,
        }),
      );

      then('exit code is 2, and it reads refused, closed, with the fix', () => {
        expect(result.exitCode).toBe(2);
        expect(result.stdout).toContain('🦫 refused upstream');
        expect(result.stdout).toContain('#99999 not found in sandpine/svc-lessons');
        expect(asStableOutput({ output: result.stdout })).toMatchSnapshot();
      });
    });

    when('[t6] a different body lands on the same thread (case=3 [t2])', () => {
      const result = useThen('the comment runs', () => {
        const callsBefore = getStubCalls().length;
        const comment = runComment({
          args: `--via gh.issues --into sandpine/svc-lessons --exid 652 --comment "the tide table test passes now!" --auth "${authEnv}"`,
        });
        return { comment, calls: getStubCalls().slice(callsBefore) };
      });

      then('exit code is 0, and it reads posted — a thread may hold many', () => {
        expect(result.comment.exitCode).toBe(0);
        expect(result.comment.stdout).toContain('posted');
        expect(asCallVerbs({ calls: result.calls })).toEqual([
          'issue view',
          'issue comment',
        ]);
        expect(getThreadComments({ n: '652' }).map((c) => c.body)).toEqual([
          'lgtm once the tide table test passes',
          'the tide table test passes now',
          'the tide table test passes now!',
        ]);
      });

      then('the posted output names the act, the url, the channel, and where it was recorded', () => {
        expect(result.comment.stdout).toContain(
          'url: https://github.com/sandpine/svc-lessons/pull/652#issuecomment-',
        );
        expect(asStableOutput({ output: result.comment.stdout })).toMatchSnapshot();
      });
    });

    when('[t6b] the same body is commented again, once its record has settled', () => {
      const result = useThen('the comment runs', () => {
        const callsBefore = getStubCalls().length;
        const comment = runComment({
          args: `--via gh.issues --into sandpine/svc-lessons --exid 652 --comment "the tide table test passes now!" --auth "${authEnv}"`,
        });
        return { comment, calls: getStubCalls().slice(callsBefore) };
      });

      then('exit code is 0, and it reads kept — one thread read, naught posted (F13)', () => {
        expect(result.comment.exitCode).toBe(0);
        expect(result.comment.stdout).toContain('kept');
        expect(asCallVerbs({ calls: result.calls })).toEqual(['issue view']);
        expect(getThreadComments({ n: '652' })).toHaveLength(3);
        expect(asStableOutput({ output: result.comment.stdout })).toMatchSnapshot();
      });
    });

    when('[t6c] a human deletes that comment upstream, and the same body is commented again', () => {
      const result = useThen('the comment runs', () => {
        // the human's delete, on the thread itself
        const threadPath = path.join(
          scene.stubDir,
          'thread.sandpine_svc-lessons.652.json',
        );
        fs.writeFileSync(
          threadPath,
          JSON.stringify(
            getThreadComments({ n: '652' }).filter(
              (c) => c.body !== 'the tide table test passes now!',
            ),
          ),
        );
        const callsBefore = getStubCalls().length;
        const comment = runComment({
          args: `--via gh.issues --into sandpine/svc-lessons --exid 652 --comment "the tide table test passes now!" --auth "${authEnv}"`,
        });
        return { comment, calls: getStubCalls().slice(callsBefore) };
      });

      then('exit code is 0, and it reads posted — the comment is back on the thread', () => {
        expect(result.comment.exitCode).toBe(0);
        expect(result.comment.stdout).toContain('posted');
        expect(asCallVerbs({ calls: result.calls })).toEqual([
          'issue view',
          'issue comment',
        ]);
        expect(getThreadComments({ n: '652' }).map((c) => c.body)).toEqual([
          'lgtm once the tide table test passes',
          'the tide table test passes now',
          'the tide table test passes now!',
        ]);
      });
    });

    /**
     * .what = the env of an as-human run, with a robot token left in the shell
     * .why = case=8: had the send read GH_TOKEN or GITHUB_TOKEN, the comment would carry the
     *        robot's name. an as-human run drops the test-env markers (getGithubTokenByAuthArg
     *        forbids as-human under them); the stub gh stands in for the human's gh session
     */
    const getEnvAsHumanWithRobotTokenLeft = () => ({
      ...getEnvWithStub(),
      GH_TOKEN: tokenStub,
      GITHUB_TOKEN: tokenStub,
      NODE_ENV: undefined,
      JEST_WORKER_ID: undefined,
    });

    when('[t7] the gate is shut and the clone comments as-human, a robot token left in its env (case=8)', () => {
      const result = useThen('the comment and the list run', () => {
        setGate({ homeDir: scene.homeDir, org: 'sandpine', gate: 'blocked' });
        const comment = runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.comment',
          args: '--via gh.issues --into sandpine/svc-lessons --exid 489 --comment "signed by the human, never the robot" --auth as-human',
          env: getEnvAsHumanWithRobotTokenLeft(),
        });
        const list = runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.queue',
          args: 'get',
          env: getEnvWithStub(),
        });
        return { comment, list };
      });

      then('exit code is 2, and the held comment keeps auth as-human in the queue', () => {
        expect(result.comment.exitCode).toBe(2);
        expect(result.list.stdout).toContain('comment on #489');
        expect(result.list.stdout).toContain('auth: as-human');
      });

      then('the held as-human output and its queue row match the snapshot', () => {
        expect({
          comment: asStableOutput({ output: result.comment.stdout }),
          list: asStableOutput({ output: result.list.stdout }),
        }).toMatchSnapshot();
      });
    });

    when('[t8] the gate opens and the same as-human comment goes out (case=8)', () => {
      const result = useThen('the comment runs', () => {
        setGate({ homeDir: scene.homeDir, org: 'sandpine', gate: 'allowed' });
        const callsBefore = getStubCalls().length;
        const comment = runDispatcherSkill({
          ...scene,
          repoDir: scene.consumer.repoDir,
          skill: 'radio.task.comment',
          args: '--via gh.issues --into sandpine/svc-lessons --exid 489 --comment "signed by the human, never the robot" --auth as-human',
          env: getEnvAsHumanWithRobotTokenLeft(),
        });
        return { comment, calls: getStubCalls().slice(callsBefore) };
      });

      then('exit code is 0, and the comment lands on #489', () => {
        expect(result.comment.exitCode).toBe(0);
        expect(getThreadComments({ n: '489' }).map((c) => c.body)).toContain(
          'signed by the human, never the robot',
        );
      });

      then('every gh call ran with neither GH_TOKEN nor GITHUB_TOKEN — the human gh session signs it', () => {
        expect(result.calls.length).toBeGreaterThan(0);
        expect(result.calls.every((call) => call.startsWith('<gh-session> '))).toBe(true);
      });

      then('the posted as-human output matches the snapshot', () => {
        expect(asStableOutput({ output: result.comment.stdout })).toMatchSnapshot();
      });
    });

    when('[t9] two comments wait — one on a thread that does not exist, one for an org whose gate stays shut — then a comment gets through', () => {
      const result = useThen('the comments run', () => {
        // hold a comment on an absent thread, behind the shut sandpine gate
        setGate({ homeDir: scene.homeDir, org: 'sandpine', gate: 'blocked' });
        const heldGhost = runComment({
          args: `--via gh.issues --into sandpine/svc-lessons --exid 99999 --comment "a note for a thread long gone" --auth "${authEnv}"`,
        });

        // hold a comment for an org with no gate set, so shut by default
        const heldShut = runComment({
          args: `--via gh.issues --into sandpine-school/board-rentals --exid 7 --comment "board 7 is back from the shaper" --auth "${authEnv}"`,
        });

        // the sandpine gate opens, and a new comment gets through
        setGate({ homeDir: scene.homeDir, org: 'sandpine', gate: 'allowed' });
        const comment = runComment({
          args: `--via gh.issues --into sandpine/svc-lessons --exid 489 --comment "the tide table test passes in ci too" --auth "${authEnv}"`,
        });
        return { heldGhost, heldShut, comment };
      });

      then('both waited: each first run exits 2, held', () => {
        expect(result.heldGhost.exitCode).toBe(2);
        expect(result.heldShut.exitCode).toBe(2);
      });

      then('the comment on the absent thread drains as refused, named as a comment', () => {
        expect(result.comment.stdout).toContain('refused — closed, never retried');
        expect(result.comment.stdout).toContain('comment on #99999 —');
      });

      then('the comment behind the shut org stays held, named as a comment, with its next move', () => {
        expect(result.comment.stdout).toContain('still held');
        expect(result.comment.stdout).toContain('comment on #7');
      });

      then('the new comment lands on #489', () => {
        expect(getThreadComments({ n: '489' }).map((c) => c.body)).toContain(
          'the tide table test passes in ci too',
        );
      });

      then('the drain sections match the snapshot', () => {
        expect(asStableOutput({ output: result.comment.stdout })).toMatchSnapshot();
      });
    });

    when('[t10] the post lands, then the call times out (case=3, the origin of #406)', () => {
      const result = useThen('the comment runs', () => {
        fs.writeFileSync(path.join(scene.stubDir, 'post-then-timeout.flag'), '');
        const comment = runComment({
          args: `--via gh.issues --into sandpine/svc-lessons --exid 489 --comment "the wax order went in" --auth "${authEnv}"`,
        });
        return { comment };
      });

      then('exit code is 2, and it is held as a transient fault — never refused, never dropped', () => {
        expect(result.comment.exitCode).toBe(2);
        expect(result.comment.stdout).toContain('🦫 held for the radio');
        expect(result.comment.stdout).toContain('upstream:transient');
        expect(asStableOutput({ output: result.comment.stdout })).toMatchSnapshot();
      });

      then('the fix names what went wrong upstream, never our own gh call or temp path', () => {
        expect(result.comment.stdout).toContain(
          'fix it: Post "https://api.github.com/graphql": dial tcp: lookup api.github.com: i/o timeout',
        );
        expect(result.comment.stdout).toContain('the comment may be live already: never reword it');
        expect(result.comment.stdout).not.toContain('Command failed');
        expect(result.comment.stdout).not.toContain('--body-file');
      });

      then('the comment on #7 from [t9] still waits behind its shut org gate, held, never dropped', () => {
        expect(result.comment.stdout).toContain('comment on #7');
        expect(result.comment.stdout).toContain('still held');
      });

      then('the thread holds the comment once', () => {
        expect(
          getThreadComments({ n: '489' }).filter(
            (c) => c.body === 'the wax order went in',
          ),
        ).toHaveLength(1);
      });
    });

    when('[t11] the same comment is retried, once the network is back', () => {
      const result = useThen('the comment runs', () => {
        const callsBefore = getStubCalls().length;
        const comment = runComment({
          args: `--via gh.issues --into sandpine/svc-lessons --exid 489 --comment "the wax order went in" --auth "${authEnv}"`,
        });
        return { comment, calls: getStubCalls().slice(callsBefore) };
      });

      then('exit code is 0, and it reads kept — the thread read finds it, naught is posted twice', () => {
        expect(result.comment.exitCode).toBe(0);
        expect(result.comment.stdout).toContain('kept');
        expect(asCallVerbs({ calls: result.calls })).not.toContain('issue comment');
        expect(
          getThreadComments({ n: '489' }).filter(
            (c) => c.body === 'the wax order went in',
          ),
        ).toHaveLength(1);
      });
    });

    when('[t12] a multi-line body is piped via @stdin (the headline use in --help)', () => {
      const body =
        'the cure on this task is wrong:\n\n- the tide table test reads utc\n- the lesson slots read local time\n\nsee #490 for the fix';
      const result = useThen('the comment runs', () => {
        const comment = runComment({
          args: `--via gh.issues --into sandpine/svc-lessons --exid 489 --comment @stdin --auth "${authEnv}"`,
          stdin: `${body}\n`,
        });
        return { comment };
      });

      then('exit code is 0, and the thread holds the body with every line and blank line intact', () => {
        expect(result.comment.exitCode).toBe(0);
        expect(result.comment.stdout).toContain('posted');
        expect(
          getThreadComments({ n: '489' }).filter((c) => c.body.trim() === body),
        ).toHaveLength(1);
        expect(asStableOutput({ output: result.comment.stdout })).toMatchSnapshot();
      });
    });

    when('[t13] the clone comments with --auth as-robot:env(VAR) where VAR is not set', () => {
      const result = useThen('the comment runs', () => {
        const callsBefore = getStubCalls().length;
        const comment = runComment({
          args: '--via gh.issues --into sandpine/svc-lessons --exid 489 --comment "the rental wetsuits are rinsed" --auth "as-robot:env(RADIO_ACPT_UNSET_TOKEN)"',
        });
        return { comment, calls: getStubCalls().slice(callsBefore) };
      });

      then('exit code is 2, held as a caller-fixable auth fault, with no post made', () => {
        expect(result.comment.exitCode).toBe(2);
        expect(result.comment.stdout).toContain('🦫 held for the radio');
        expect(result.comment.stdout).toContain('upstream:auth');
        expect(asCallVerbs({ calls: result.calls })).not.toContain('issue comment');
        expect(result.comment.stdout).not.toContain('may be live');
        expect(asStableOutput({ output: result.comment.stdout })).toMatchSnapshot();
      });
    });

    when('[t14] a body full of shell and markup characters is piped via @stdin', () => {
      const body = 'the `tide` table says $HOME is "dry" — 🌊 & <done> $(echo nope)';
      const result = useThen('the comment runs', () => {
        const comment = runComment({
          args: `--via gh.issues --into sandpine/svc-lessons --exid 489 --comment @stdin --auth "${authEnv}"`,
          stdin: `${body}\n`,
        });
        return { comment };
      });

      then('the thread holds the body byte for byte: naught expanded, naught escaped', () => {
        expect(result.comment.stdout).toContain('comment on #489 (posted)');
        expect(
          getThreadComments({ n: '489' }).filter((c) => c.body.trim() === body),
        ).toHaveLength(1);
      });
    });
  });

  given('[case1b] a held comment and a held task wait side by side at a shut gate (#567: queue get lists both)', () => {
    const authEnv = 'as-robot:env(RADIO_ACPT_COMMENT_TOKEN)';
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepoWithDispatcher({
        prefix: 'radio-comment-beside-acpt-',
        branchName: 'feat/comment-beside',
      });
      const homeDir = path.join(consumer.repoDir, '.home');
      fs.mkdirSync(homeDir);
      setGate({ homeDir, org: 'sandpine', gate: 'blocked' });

      // a stub gh, so the drain at [t1] never reaches github; #489 exists with no comments
      const stubDir = genTempDir({ slug: 'radio-comment-beside-acpt-stub-gh' });
      fs.writeFileSync(path.join(stubDir, 'gh'), STUB_GH, { mode: 0o755 });
      fs.writeFileSync(
        path.join(stubDir, 'thread.sandpine_svc-lessons.489.json'),
        '[]',
      );
      const env = {
        RADIO_ACPT_COMMENT_TOKEN: 'ghp_radioAcptCommentTokenStub000000',
        PATH: `${stubDir}:${process.env.PATH}`,
        STUB_GH_DIR: stubDir,
      };

      // a task push and a comment, each held by the shut gate
      const push = runDispatcherSkill({
        repoDir: consumer.repoDir,
        homeDir,
        skill: 'radio.task.push',
        args: `--via gh.issues --into sandpine/svc-lessons --title "restock the wax rack" --description "two boxes of cold-water wax" --auth "${authEnv}"`,
        env,
      });
      const comment = runDispatcherSkill({
        repoDir: consumer.repoDir,
        homeDir,
        skill: 'radio.task.comment',
        args: `--via gh.issues --into sandpine/svc-lessons --exid 489 --comment "the wax rack moved by the door" --auth "${authEnv}"`,
        env,
      });
      return { consumer, homeDir, push, comment, env, stubDir };
    });

    when('[t0] a human lists what waits', () => {
      const result = useThen('the list runs', () =>
        runDispatcherSkill({
          repoDir: scene.consumer.repoDir,
          homeDir: scene.homeDir,
          skill: 'radio.task.queue',
          args: 'get',
          env: scene.env,
        }),
      );

      then('both writes were held: each exits 2', () => {
        expect(scene.push.exitCode).toBe(2);
        expect(scene.comment.exitCode).toBe(2);
      });

      then('the held comment is listed beside the held task, each with the lift', () => {
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('restock the wax rack');
        expect(result.stdout).toContain('comment on #489');
        expect(result.stdout).toContain('rhx radio.uses --org sandpine allow');
        expect(
          asStableOutput({ output: result.stdout }).replace(
            /\b[0-9a-f]{16}\b/g,
            '<uuid>',
          ),
        ).toMatchSnapshot();
      });
    });

    when('[t0b] the stop reminder renders (row 46c)', () => {
      const result = useThen('the stop line runs', () =>
        runDispatcherSkill({
          repoDir: scene.consumer.repoDir,
          homeDir: scene.homeDir,
          skill: 'radio.task.queue',
          args: 'get --when hook.onStop',
          env: scene.env,
        }),
      );

      then('it names both kinds, and the comment path that delivers them', () => {
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain(
          '🦫 2 tasks or comments held for the radio · 2 at a gate · lift: rhx radio.uses --org sandpine allow · next push or comment delivers them',
        );
      });
    });

    when('[t1] the gate opens and a new task push gets through (case=2 [t2], row 32)', () => {
      const result = useThen('the push runs', () => {
        setGate({ homeDir: scene.homeDir, org: 'sandpine', gate: 'allowed' });
        return runDispatcherSkill({
          repoDir: scene.consumer.repoDir,
          homeDir: scene.homeDir,
          skill: 'radio.task.push',
          args: `--via gh.issues --into sandpine/svc-lessons --title "rinse the wetsuits" --description "all of them" --auth "${authEnv}"`,
          env: scene.env,
        });
      });

      then('the push exits 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('the backlog goes oldest first: the held task, then the held comment, then the new push', () => {
        const stdout = result.stdout;
        const atTask = stdout.indexOf('restock the wax rack');
        const atComment = stdout.indexOf('comment on #489');
        const atPushed = stdout.indexOf('rinse the wetsuits');
        expect(atTask).toBeGreaterThan(-1);
        expect(atTask).toBeLessThan(atComment);
        expect(atComment).toBeLessThan(atPushed);
      });

      then('the comment landed on #489, once', () => {
        const thread = JSON.parse(
          fs.readFileSync(
            path.join(scene.stubDir, 'thread.sandpine_svc-lessons.489.json'),
            'utf8',
          ),
        ) as { body: string }[];
        expect(thread.map((c) => c.body)).toEqual([
          'the wax rack moved by the door',
        ]);
      });

      then('the drained order matches the snapshot', () => {
        expect(asStableOutput({ output: result.stdout })).toMatchSnapshot();
      });
    });
  });

  given('[case2] a clone comments on an os.fileops task (case=7)', () => {
    const target = `comment-acpt/repo-${Date.now()}`;
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepoWithDispatcher({
        prefix: 'radio-comment-fileops-acpt-',
        branchName: 'feat/comment-fileops',
      });
      const homeDir = path.join(consumer.repoDir, '.home');
      fs.mkdirSync(homeDir);
      setGate({ homeDir, org: 'comment-acpt', gate: 'allowed' });

      // a task to comment on
      const push = runDispatcherSkill({
        repoDir: consumer.repoDir,
        homeDir,
        skill: 'radio.task.push',
        args: `--via os.fileops --into ${target} --title "wax the rental boards" --description "all twelve"`,
      });
      const exid = push.stdout.match(/exid: ([\w-]+)/)?.[1];
      if (!exid)
        throw new MalfunctionError('scene: the task push did not deliver', {
          stdout: push.stdout,
          hint: 'the os.fileops push needs no network; read stdout for a held reason, and run `npm run build` first',
        });
      const store = path.join(homeDir, 'git', '.radio', ...target.split('/'));
      const taskFile = path.join(store, `task.${exid}._.md`);
      const taskBefore = fs.readFileSync(taskFile, 'utf8');
      return { consumer, homeDir, exid, store, taskFile, taskBefore };
    });

    /**
     * .what = run the comment skill against an os.fileops task
     */
    const runComment = (input: { exid: string; body: string }) =>
      runDispatcherSkill({
        repoDir: scene.consumer.repoDir,
        homeDir: scene.homeDir,
        skill: 'radio.task.comment',
        args: `--via os.fileops --into ${target} --exid ${input.exid} --comment "${input.body}"`,
      });

    /**
     * .what = mask the bytes of an os.fileops output that vary per run
     * .why = the target repo name carries Date.now(), the exid is minted per run, and the record
     *        uuid hashes the exid; all else is snapped as the caller reads it
     */
    const asStableFileopsOutput = (input: { output: string }): string =>
      asStableOutput({ output: input.output })
        .split(target)
        .join('comment-acpt/repo-<ts>')
        .split(scene.exid)
        .join('<exid>')
        .replace(/--uuid [0-9a-f]{16}\b/g, '--uuid <uuid>');

    /**
     * .what = the bodies the task's comment log holds
     */
    const getLogBodies = (): string[] => {
      const log = path.join(scene.store, `task.${scene.exid}.comments.jsonl`);
      if (!fs.existsSync(log)) return [];
      return fs
        .readFileSync(log, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line).body);
    };

    when('[t0] the clone comments on the task', () => {
      const result = useThen('the comment runs', () =>
        runComment({ exid: scene.exid, body: 'board 7 needs a new fin' }),
      );

      then('exit code is 0, and one entry lands in the log beside the task', () => {
        expect(result.exitCode).toBe(0);
        expect(getLogBodies()).toEqual(['board 7 needs a new fin']);
        expect(
          asStableOutput({ output: result.stdout }).split(scene.exid).join('<exid>'),
        ).toMatchSnapshot();
      });

      then('the task file is byte for byte unchanged', () => {
        expect(fs.readFileSync(scene.taskFile, 'utf8')).toEqual(scene.taskBefore);
      });
    });

    when('[t1] the same body is posted from a fresh record dir, as a second clone would', () => {
      const result = useThen('the comment runs', () => {
        fs.rmSync(path.join(scene.consumer.repoDir, '.behavior', '.radio'), {
          recursive: true,
          force: true,
        });
        return runComment({ exid: scene.exid, body: 'board 7 needs a new fin' });
      });

      then('it reads kept, and the log still holds one entry', () => {
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('kept');
        expect(result.stdout).toContain('already in the comment log — naught posted');
        // a kept comment landed naught, so it opens as a landed push does
        expect(result.stdout).toContain('🦫 already delivered');
        expect(result.stdout).not.toContain('onto the pile');
        expect(getLogBodies()).toEqual(['board 7 needs a new fin']);
        expect(
          asStableOutput({ output: result.stdout }).split(scene.exid).join('<exid>'),
        ).toMatchSnapshot();
      });
    });

    when('[t2] the clone comments on a task that does not exist', () => {
      const result = useThen('the comment runs', () =>
        runComment({ exid: 'no-such-task', body: 'hello' }),
      );

      then('exit code is 2, refused, and no log is written for it', () => {
        expect(result.exitCode).toBe(2);
        expect(result.stdout).toContain('🦫 refused upstream');
        expect(
          fs.existsSync(path.join(scene.store, 'task.no-such-task.comments.jsonl')),
        ).toBe(false);
        expect(asStableFileopsOutput({ output: result.stdout })).toMatchSnapshot();
      });
    });

    when('[t3] the gate is shut and the clone comments on the task (case=7 [t3], the os.fileops clamp)', () => {
      const result = useThen('the comment runs', () => {
        setGate({ homeDir: scene.homeDir, org: 'comment-acpt', gate: 'blocked' });
        return runComment({ exid: scene.exid, body: 'board 9 is dinged too' });
      });

      then('exit code is 2, held, and the log holds no entry for it', () => {
        expect(result.exitCode).toBe(2);
        expect(result.stdout).toContain('🦫 held for the radio');
        expect(getLogBodies()).toEqual(['board 7 needs a new fin']);
        expect(asStableFileopsOutput({ output: result.stdout })).toMatchSnapshot();
      });

      then('the task file is still byte for byte unchanged', () => {
        expect(fs.readFileSync(scene.taskFile, 'utf8')).toEqual(scene.taskBefore);
      });
    });

    when('[t4] the clone names --idem findsert, the comment\'s one mode (case=5 row 31)', () => {
      const result = useThen('the comment runs', () =>
        runDispatcherSkill({
          repoDir: scene.consumer.repoDir,
          homeDir: scene.homeDir,
          skill: 'radio.task.comment',
          args: `--via os.fileops --into ${target} --exid ${scene.exid} --comment "board 9 is dinged too" --idem findsert`,
        }),
      );

      then('it is accepted, not refused: the shut gate holds it as before', () => {
        expect(result.exitCode).toBe(2);
        expect(result.stdout).toContain('🦫 held for the radio');
        expect(result.stderr).not.toContain('ConstraintError');
        expect(asStableFileopsOutput({ output: result.stdout })).toMatchSnapshot();
      });
    });

    when('[t5] a second comment is held, its body lands in the log by another hand, then a plain task push gets through', () => {
      const result = useThen('the push runs', () => {
        // hold a second comment behind the shut gate
        const held = runComment({ exid: scene.exid, body: 'board 3 lost its leash' });

        // another clone appends that same body to the log meanwhile
        fs.appendFileSync(
          path.join(scene.store, `task.${scene.exid}.comments.jsonl`),
          `${JSON.stringify({ body: 'board 3 lost its leash' })}\n`,
        );

        // the gate opens, and an ordinary task push gets through
        setGate({ homeDir: scene.homeDir, org: 'comment-acpt', gate: 'allowed' });
        const push = runDispatcherSkill({
          repoDir: scene.consumer.repoDir,
          homeDir: scene.homeDir,
          skill: 'radio.task.push',
          args: `--via os.fileops --into ${target} --title "rinse the wetsuits" --description "all of them"`,
        });
        return { held, push };
      });

      then('the push exits 0: it carried the held comments out first, then its own task', () => {
        expect(result.held.exitCode).toBe(2);
        expect(result.push.exitCode).toBe(0);
        expect(result.push.stdout.indexOf(`comment on #${scene.exid}`)).toBeLessThan(
          result.push.stdout.indexOf('rinse the wetsuits'),
        );
      });

      then('the held comment posted once, and the one already in the log was kept, not doubled', () => {
        // the out-of-band entry landed before the drain; board 9 posts after it, board 3 once
        expect(getLogBodies()).toEqual([
          'board 7 needs a new fin',
          'board 3 lost its leash',
          'board 9 is dinged too',
        ]);
        // os.fileops has no thread: the note names the log
        expect(result.push.stdout).toContain('(already in the comment log — naught posted)');
        expect(result.push.stdout).not.toContain('already on the thread');
      });

      then('the drained lines match the snapshot', () => {
        expect(
          asStableOutput({ output: result.push.stdout })
            .split(scene.exid)
            .join('<exid>')
            .replace(/exid: [\w-]+/g, 'exid: <exid>')
            .replace(/#[0-9a-f]{8} rinse the wetsuits/g, '#<new-exid> rinse the wetsuits'),
        ).toMatchSnapshot();
      });
    });

    when('[t6] a held comment is amended, then dropped (rows 43, 44)', () => {
      const result = useThen('the queue verbs run', () => {
        // hold a comment behind a shut gate
        setGate({ homeDir: scene.homeDir, org: 'comment-acpt', gate: 'blocked' });
        const held = runComment({ exid: scene.exid, body: 'the rack key is lost' });
        const runQueue = (args: string) =>
          runDispatcherSkill({
            repoDir: scene.consumer.repoDir,
            homeDir: scene.homeDir,
            skill: 'radio.task.queue',
            args,
          });
        const listBefore = runQueue('get');
        const uuid = listBefore.stdout.match(/\b([0-9a-f]{16}) comment on/)?.[1];
        if (!uuid)
          throw new MalfunctionError('scene: the held comment is not listed', {
            stdout: listBefore.stdout,
          });
        const amend = runQueue(`set --uuid ${uuid} --description "x"`);
        const drop = runQueue(`del --uuid ${uuid} --why "found the key"`);
        const listAfter = runQueue('get');
        return { held, amend, drop, listAfter };
      });

      then('the comment was held: exit 2', () => {
        expect(result.held.exitCode).toBe(2);
      });

      then('its body cannot be amended: exit 2, and the fix names the drop', () => {
        expect(result.amend.exitCode).toBe(2);
        expect(result.amend.stderr).toContain(
          '--description cannot amend a held comment; its body is its identity',
        );
      });

      then('the drop names the comment, the why, and where its body is kept', () => {
        expect(result.drop.exitCode).toBe(0);
        expect(result.drop.stdout).toContain('🦫 dropped from the radio, never sent');
        expect(result.drop.stdout).toContain(`comment = #${scene.exid}`);
        expect(result.drop.stdout).toContain('why     = dropped: found the key');
      });

      then('naught waits after the drop, and the log never got the body', () => {
        expect(result.listAfter.stdout).toContain('naught held for the radio');
        expect(getLogBodies()).not.toContain('the rack key is lost');
      });
    });
  });

  given('[case3] a malformed comment is refused before it is recorded (case=5)', () => {
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepoWithDispatcher({
        prefix: 'radio-comment-malformed-acpt-',
        branchName: 'feat/comment-malformed',
      });
      const homeDir = path.join(consumer.repoDir, '.home');
      fs.mkdirSync(homeDir);
      return { consumer, homeDir };
    });

    const cases: {
      slug: string;
      what: string;
      args: string;
      says: string;
      skill?: string;
      stdin?: string;
    }[] = [
      {
        slug: 't0',
        what: 'no --exid',
        args: '--via os.fileops --into sandpine/svc-lessons --comment "hi"',
        says: '--exid is required',
      },
      {
        slug: 't1',
        what: 'a --title, a flag the skill does not read',
        args: '--via os.fileops --into sandpine/svc-lessons --exid 7 --comment "hi" --title "x"',
        says: 'use rhx radio.task.push --via os.fileops --into sandpine/svc-lessons --exid 7 --title <title>',
      },
      {
        slug: 't2',
        what: 'a --description, a flag the skill does not read',
        args: '--via os.fileops --into sandpine/svc-lessons --exid 7 --comment "hi" --description "x"',
        says: '--description is not read by radio.task.comment',
      },
      {
        slug: 't3',
        what: 'an empty body',
        args: '--via os.fileops --into sandpine/svc-lessons --exid 7 --comment " "',
        says: '--comment is empty',
      },
      {
        slug: 't4',
        what: '--idem upsert',
        args: '--via os.fileops --into sandpine/svc-lessons --exid 7 --comment "hi" --idem upsert',
        says: 'append-only',
      },
      {
        slug: 't5',
        what: 'a --status, a flag the skill does not read',
        args: '--via os.fileops --into sandpine/svc-lessons --exid 7 --comment "hi" --status CLAIMED',
        says: 'use rhx radio.task.push --via os.fileops --into sandpine/svc-lessons --exid 7 --status <status>',
      },
      {
        slug: 't6',
        what: 'radio.task.push --comment, the literal form of #567, which push does not read',
        skill: 'radio.task.push',
        args: '--via os.fileops --into sandpine/svc-lessons --exid 7 --comment "hi"',
        says: 'use rhx radio.task.comment --via os.fileops --into sandpine/svc-lessons --exid 7',
      },
      {
        slug: 't7',
        what: 'a gh body past the 65536-character cap, piped via @stdin',
        args: '--via gh.issues --into sandpine/svc-lessons --exid 489 --comment @stdin',
        stdin: 'a'.repeat(65537),
        says: 'github caps a comment at 65536',
      },
      {
        slug: 't8',
        what: 'no --comment at all',
        args: '--via os.fileops --into sandpine/svc-lessons --exid 7',
        says: '--comment is required; pass the body, or pipe it via --comment @stdin',
      },
      {
        slug: 't9',
        what: 'no --via',
        args: '--into sandpine/svc-lessons --exid 7 --comment "hi"',
        says: '--via is required; specify a channel: --via gh.issues or --via os.fileops',
      },
      {
        slug: 't10',
        what: 'no --into',
        args: '--via os.fileops --exid 7 --comment "hi"',
        says: '--into is required; use --into @this (current git repo) or --into owner/name',
      },
      {
        slug: 't11',
        what: 'a gh --exid that is not a number',
        args: '--via gh.issues --into sandpine/svc-lessons --exid wax-the-rental-boards --comment "hi"',
        says: 'exid "wax-the-rental-boards" is not a github issue number',
      },
      {
        slug: 't12',
        what: 'an os.fileops --exid that climbs out of its dir',
        args: '--via os.fileops --into sandpine/svc-lessons --exid ../../etc --comment "hi"',
        says: 'os.fileops exid "../../etc" is not a plain path segment',
      },
    ];
    cases.map((thisCase) =>
      when(`[${thisCase.slug}] the clone comments with ${thisCase.what}`, () => {
        const result = useThen('the comment runs', () =>
          runDispatcherSkill({
            repoDir: scene.consumer.repoDir,
            homeDir: scene.homeDir,
            skill: thisCase.skill ?? 'radio.task.comment',
            args: thisCase.args,
            ...(thisCase.stdin !== undefined ? { stdin: thisCase.stdin } : {}),
          }),
        );

        then('exit code is 2, the fix is named, and no record is written', () => {
          expect(result.exitCode).toBe(2);
          expect(result.stderr).toContain(thisCase.says);
          expect(
            fs.existsSync(path.join(scene.consumer.repoDir, '.behavior', '.radio')),
          ).toBe(false);
          expect(asStableOutput({ output: result.stderr }).trim()).toMatchSnapshot();
        });
      }),
    );
  });

  given('[case4] a human asks for help', () => {
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepoWithDispatcher({
        prefix: 'radio-comment-help-acpt-',
        branchName: 'feat/comment-help',
      });
      const homeDir = path.join(consumer.repoDir, '.home');
      fs.mkdirSync(homeDir);
      return { consumer, homeDir };
    });

    when('[t0] --help runs', () => {
      const result = useThen('help runs', () =>
        runDispatcherSkill({
          repoDir: scene.consumer.repoDir,
          homeDir: scene.homeDir,
          skill: 'radio.task.comment',
          args: '--help',
        }),
      );

      then('it shows usage, the held rule, and every option', () => {
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('radio.task.comment --help');
        expect(result.stdout).toContain('--comment');
        expect(asStableOutput({ output: result.stdout })).toMatchSnapshot();
      });
    });

    when('[t1] -h runs, the short alias', () => {
      const result = useThen('help runs', () =>
        runDispatcherSkill({
          repoDir: scene.consumer.repoDir,
          homeDir: scene.homeDir,
          skill: 'radio.task.comment',
          args: '-h',
        }),
      );

      then('it shows the same help as --help', () => {
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('radio.task.comment --help');
        expect(result.stdout).toContain('--help, -h');
      });
    });
  });
});
