import * as fs from 'fs';
import * as path from 'path';
import {
  genTempDir,
  getError,
  given,
  then,
  useBeforeAll,
  useThen,
  when,
} from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

import { setPartRadioTask } from './setPartRadioTask';

/**
 * .mock = the gh cli, via a stateful stub `gh` first on PATH
 * .why  = a deliver cut short between its edit and its close cannot be provoked against real
 *         github; the stub keeps one issue's body and state on disk, fails its first close once
 *         on demand, and logs each close
 * .real = daoRadioTaskViaGhIssues.integration.test.ts runs the dao against real github
 */
const STUB_GH = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const dir = process.env.STUB_GH_DIR;
const args = process.argv.slice(2);
const read = (name) => fs.readFileSync(path.join(dir, name), 'utf-8');
const verb = args[0] + ' ' + args[1];
if (verb === 'issue view') {
  process.stdout.write(JSON.stringify({
    number: 599,
    title: '🎙️ task - wetsuit inventory',
    body: read('body'),
    state: read('state'),
    assignees: [],
    createdAt: '2026-10-25T00:00:00Z',
    author: { login: 'bert' },
  }));
  process.exit(0);
}
if (verb === 'issue edit') {
  const at = args.indexOf('--body-file');
  if (at >= 0) fs.writeFileSync(path.join(dir, 'body'), fs.readFileSync(args[at + 1], 'utf-8'));
  process.exit(0);
}
if (verb === 'issue close') {
  fs.appendFileSync(path.join(dir, 'close.log'), 'close\\n');
  if (fs.existsSync(path.join(dir, 'close-fail'))) {
    fs.rmSync(path.join(dir, 'close-fail'));
    process.stderr.write('HTTP 502: Bad Gateway');
    process.exit(1);
  }
  fs.writeFileSync(path.join(dir, 'state'), 'CLOSED');
  process.exit(0);
}
process.stderr.write('stub gh: unexpected call: ' + args.join(' '));
process.exit(1);
`;

describe('setPartRadioTask via gh.issues — a deliver cut short after its edit', () => {
  const pathPrior = process.env.PATH;
  const repo = new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' });
  const context = {
    github: { auth: { token: 'ghp_stubToken000', role: 'as-robot' as const } },
    git: { repo },
  };

  afterAll(() => {
    process.env.PATH = pathPrior;
  });

  given('[case1] a claimed issue whose deliver fails at its close', () => {
    const scene = useBeforeAll(async () => {
      const dir = genTempDir({ slug: 'gh-stub-deliver-replay' });
      fs.writeFileSync(path.join(dir, 'gh'), STUB_GH, { mode: 0o755 });
      fs.writeFileSync(
        path.join(dir, 'body'),
        '🌲 tree planted at bert/wetsuits\n\n**description**\n\ncount the wetsuits',
      );
      fs.writeFileSync(path.join(dir, 'state'), 'OPEN');
      fs.writeFileSync(path.join(dir, 'close-fail'), '');
      process.env.STUB_GH_DIR = dir;
      process.env.PATH = `${dir}:${pathPrior}`;
      return { dir };
    });

    const deliver = () =>
      setPartRadioTask(
        {
          via: RadioChannel.GH_ISSUES,
          task: { repo, exid: '599', status: RadioTaskStatus.DELIVERED },
        },
        context,
      );

    when('[t0] the first deliver edits the body, then its close fails', () => {
      const result = useThen('it fails', async () => {
        const error = await getError(deliver());
        return {
          message: error.message,
          body: fs.readFileSync(path.join(scene.dir, 'body'), 'utf-8'),
          state: fs.readFileSync(path.join(scene.dir, 'state'), 'utf-8'),
        };
      });

      then('it fails loud on the close', () => {
        expect(result.message).toContain('502');
      });

      then(
        'the issue is left half applied: the body says delivered, the state is open',
        () => {
          expect(result.body).toContain('tree delivered at');
          expect(result.state).toEqual('OPEN');
        },
      );
    });

    when('[t1] the replay delivers again', () => {
      const result = useThen('it runs', async () => {
        const outcome = await deliver();
        return {
          outcome: outcome.outcome,
          status: outcome.task.status,
          closes: fs
            .readFileSync(path.join(scene.dir, 'close.log'), 'utf-8')
            .split('\n')
            .filter(Boolean).length,
          state: fs.readFileSync(path.join(scene.dir, 'state'), 'utf-8'),
        };
      });

      then(
        'it reads the open issue as claimed, so it updates, never "unchanged"',
        () => {
          expect(result.outcome).toEqual('updated');
          expect(result.status).toEqual(RadioTaskStatus.DELIVERED);
        },
      );

      then('it sends the close again, and the issue ends closed', () => {
        expect(result.closes).toEqual(2);
        expect(result.state).toEqual('CLOSED');
      });
    });
  });
});
