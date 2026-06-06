import fs from 'fs';
import path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { genConsumerRepo, runRhachetSkill } from '../.test/infra';

/**
 * .what = invoke radio.uses skill to set up permissions
 * .why = radio.task.push requires radio.uses permission
 */
const runRadioUses = (input: {
  repoDir: string;
  args: string;
  homeDir?: string;
}): { stdout: string; stderr: string; exitCode: number } => {
  const result = runRhachetSkill({
    repo: 'bhuild',
    role: 'dispatcher',
    skill: 'radio.uses',
    args: input.args,
    repoDir: input.repoDir,
    env: {
      __I_AM_HUMAN: 'true',
      ...(input.homeDir ? { HOME: input.homeDir } : {}),
    },
    timeout: 30000,
  });
  return {
    stdout: result.output,
    stderr: '',
    exitCode: result.exitCode,
  };
};

/**
 * .what = runs radio.task.push via rhachet dispatch (consumer pattern)
 * .why = tests the skill as a consumer would invoke it
 */
const runRadioTaskPush = (input: {
  repoDir: string;
  via: string;
  into?: string;
  title?: string;
  description?: string;
  exid?: string;
  status?: string;
  idem?: string;
  homeDir?: string;
}) => {
  const args = [
    `--via ${input.via}`,
    input.into ? `--into "${input.into}"` : '',
    input.title ? `--title "${input.title}"` : '',
    input.description ? `--description "${input.description}"` : '',
    input.exid ? `--exid "${input.exid}"` : '',
    input.status ? `--status ${input.status}` : '',
    input.idem ? `--idem ${input.idem}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return runRhachetSkill({
    repo: 'bhuild',
    role: 'dispatcher',
    skill: 'radio.task.push',
    args,
    repoDir: input.repoDir,
    env: input.homeDir ? { HOME: input.homeDir } : {},
    timeout: 30000,
  });
};

describe('radio.task.push via os.fileops', () => {
  given('[case1] inside a git repo', () => {
    const testRepo = { owner: 'test-owner', name: `test-repo-acpt-push-${Date.now()}` };
    const scene = useBeforeAll(async () => {
      const consumer = await genConsumerRepo({ prefix: 'radio-push-acpt-' });
      const homeDir = path.join(consumer.repoDir, '.home');
      fs.mkdirSync(homeDir);
      // allow radio usage for @all orgs
      runRadioUses({
        repoDir: consumer.repoDir,
        args: '--org @all allow',
        homeDir,
      });
      const globalRadioDir = path.join(homeDir, 'git', '.radio', testRepo.owner, testRepo.name);
      return { consumer, homeDir, globalRadioDir };
    });

    afterAll(async () => {
      await fs.promises.rm(scene.globalRadioDir, { recursive: true, force: true });
    });

    when('[t0] push with title and description', () => {
      const result = useBeforeAll(async () =>
        runRadioTaskPush({
          repoDir: scene.consumer.repoDir,
          via: 'os.fileops',
          into: `${testRepo.owner}/${testRepo.name}`,
          title: 'test task from acceptance',
          description: 'this is a test task',
          homeDir: scene.homeDir,
        }),
      );

      then('exits with code 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('output shows success with emoji', () => {
        expect(result.output).toContain('🎙️');
      });

      then('output shows outcome created', () => {
        expect(result.output.toLowerCase()).toContain('created');
      });

      then('task file exists in global radio dir', async () => {
        const files = await fs.promises.readdir(scene.globalRadioDir);
        const taskFiles = files.filter((f) => f.startsWith('task.') && f.endsWith('._.md'));
        expect(taskFiles.length).toBeGreaterThan(0);
      });

      then('status flag file exists', async () => {
        const files = await fs.promises.readdir(scene.globalRadioDir);
        const flagFiles = files.filter((f) => f.includes('.status=QUEUED.flag'));
        expect(flagFiles.length).toBeGreaterThan(0);
      });
    });

    when('[t1] push without title', () => {
      const result = useBeforeAll(async () =>
        runRadioTaskPush({
          repoDir: scene.consumer.repoDir,
          via: 'os.fileops',
          into: `${testRepo.owner}/${testRepo.name}`,
          description: 'no title provided',
          homeDir: scene.homeDir,
        }),
      );

      then('exits with non-zero code', () => {
        expect(result.exitCode).not.toBe(0);
      });

      then('output mentions title required', () => {
        expect(result.output.toLowerCase()).toContain('title');
        expect(result.output.toLowerCase()).toContain('required');
      });
    });

    when('[t2] push without description', () => {
      const result = useBeforeAll(async () =>
        runRadioTaskPush({
          repoDir: scene.consumer.repoDir,
          via: 'os.fileops',
          into: `${testRepo.owner}/${testRepo.name}`,
          title: 'no description task',
          homeDir: scene.homeDir,
        }),
      );

      then('exits with non-zero code', () => {
        expect(result.exitCode).not.toBe(0);
      });

      then('output mentions description required', () => {
        expect(result.output.toLowerCase()).toContain('description');
        expect(result.output.toLowerCase()).toContain('required');
      });
    });
  });

  given('[case2] idempotency modes', () => {
    const idemRepo = {
      owner: 'test-idem',
      name: `test-repo-idem-${Date.now()}`,
    };
    const scene = useBeforeAll(async () => {
      const consumer = await genConsumerRepo({ prefix: 'radio-push-idem-' });
      const homeDir = path.join(consumer.repoDir, '.home');
      fs.mkdirSync(homeDir);
      // allow radio usage for @all orgs
      runRadioUses({
        repoDir: consumer.repoDir,
        args: '--org @all allow',
        homeDir,
      });
      const idemRadioDir = path.join(homeDir, 'git', '.radio', idemRepo.owner, idemRepo.name);
      return { consumer, homeDir, idemRadioDir };
    });

    afterAll(async () => {
      await fs.promises.rm(scene.idemRadioDir, { recursive: true, force: true });
    });

    when('[t0] findsert mode with duplicate title', () => {
      const firstResult = useBeforeAll(async () =>
        runRadioTaskPush({
          repoDir: scene.consumer.repoDir,
          via: 'os.fileops',
          into: `${idemRepo.owner}/${idemRepo.name}`,
          title: 'findsert duplicate task',
          description: 'first push',
          idem: 'findsert',
          homeDir: scene.homeDir,
        }),
      );

      then('first push succeeds with created', () => {
        expect(firstResult.exitCode).toBe(0);
        expect(firstResult.output.toLowerCase()).toContain('created');
      });

      then('second push succeeds with found', async () => {
        const secondResult = runRadioTaskPush({
          repoDir: scene.consumer.repoDir,
          via: 'os.fileops',
          into: `${idemRepo.owner}/${idemRepo.name}`,
          title: 'findsert duplicate task',
          description: 'second push',
          idem: 'findsert',
          homeDir: scene.homeDir,
        });
        expect(secondResult.exitCode).toBe(0);
        expect(secondResult.output.toLowerCase()).toContain('found');
      });
    });

    when('[t1] upsert mode with duplicate title', () => {
      const firstResult = useBeforeAll(async () =>
        runRadioTaskPush({
          repoDir: scene.consumer.repoDir,
          via: 'os.fileops',
          into: `${idemRepo.owner}/${idemRepo.name}`,
          title: 'upsert duplicate task',
          description: 'first version',
          idem: 'upsert',
          homeDir: scene.homeDir,
        }),
      );

      then('first push succeeds', () => {
        expect(firstResult.exitCode).toBe(0);
      });

      then('second push updates description', async () => {
        const secondResult = runRadioTaskPush({
          repoDir: scene.consumer.repoDir,
          via: 'os.fileops',
          into: `${idemRepo.owner}/${idemRepo.name}`,
          title: 'upsert duplicate task',
          description: 'updated version',
          idem: 'upsert',
          homeDir: scene.homeDir,
        });
        expect(secondResult.exitCode).toBe(0);

        // verify description was updated in file
        const files = await fs.promises.readdir(scene.idemRadioDir);
        const taskFiles = files.filter(
          (f) => f.startsWith('task.') && f.endsWith('._.md'),
        );
        // find the upsert task via content match
        let foundUpsertTask = false;
        for (const taskFile of taskFiles) {
          const content = await fs.promises.readFile(
            path.join(scene.idemRadioDir, taskFile),
            'utf-8',
          );
          if (content.includes('upsert duplicate task')) {
            foundUpsertTask = true;
            expect(content).toContain('updated version');
          }
        }
        expect(foundUpsertTask).toBe(true);
      });
    });
  });

  given('[case3] status transitions', () => {
    const statusRepo = {
      owner: 'test-status',
      name: `test-repo-status-${Date.now()}`,
    };
    const scene = useBeforeAll(async () => {
      const consumer = await genConsumerRepo({ prefix: 'radio-push-status-' });
      const homeDir = path.join(consumer.repoDir, '.home');
      fs.mkdirSync(homeDir);
      // allow radio usage for @all orgs
      runRadioUses({
        repoDir: consumer.repoDir,
        args: '--org @all allow',
        homeDir,
      });
      const statusRadioDir = path.join(homeDir, 'git', '.radio', statusRepo.owner, statusRepo.name);
      return { consumer, homeDir, statusRadioDir };
    });
    let taskExid: string;

    afterAll(async () => {
      await fs.promises.rm(scene.statusRadioDir, { recursive: true, force: true });
    });

    when('[t0] create task then claim it', () => {
      const createResult = useBeforeAll(async () => {
        const result = runRadioTaskPush({
          repoDir: scene.consumer.repoDir,
          via: 'os.fileops',
          into: `${statusRepo.owner}/${statusRepo.name}`,
          title: 'task for status test',
          description: 'will be claimed',
          homeDir: scene.homeDir,
        });

        // extract exid from output or file
        const files = await fs.promises.readdir(scene.statusRadioDir);
        const taskFile = files.find(
          (f) => f.startsWith('task.') && f.endsWith('._.md'),
        );
        if (taskFile) {
          const match = taskFile.match(/^task\.([^.]+)\./);
          if (match) taskExid = match[1]!;
        }

        return result;
      });

      then('task is created', () => {
        expect(createResult.exitCode).toBe(0);
        expect(taskExid).toBeDefined();
      });

      then('claim updates status to CLAIMED', async () => {
        const claimResult = runRadioTaskPush({
          repoDir: scene.consumer.repoDir,
          via: 'os.fileops',
          into: `${statusRepo.owner}/${statusRepo.name}`,
          exid: taskExid,
          status: 'CLAIMED',
          homeDir: scene.homeDir,
        });
        expect(claimResult.exitCode).toBe(0);

        // verify status flag changed
        const files = await fs.promises.readdir(scene.statusRadioDir);
        const claimedFlag = files.find((f) =>
          f.includes('.status=CLAIMED.flag'),
        );
        expect(claimedFlag).toBeDefined();
      });

      then('deliver updates status to DELIVERED', async () => {
        const deliverResult = runRadioTaskPush({
          repoDir: scene.consumer.repoDir,
          via: 'os.fileops',
          into: `${statusRepo.owner}/${statusRepo.name}`,
          exid: taskExid,
          status: 'DELIVERED',
          homeDir: scene.homeDir,
        });
        expect(deliverResult.exitCode).toBe(0);

        // verify no status flag (delivered = no flag)
        const files = await fs.promises.readdir(scene.statusRadioDir);
        const anyFlag = files.find((f) => f.includes('.status='));
        expect(anyFlag).toBeUndefined();
      });
    });
  });

  given('[case4] channel validation', () => {
    const validateRepo = { owner: 'test-validate', name: `test-repo-validate-${Date.now()}` };
    const scene = useBeforeAll(async () => {
      const consumer = await genConsumerRepo({ prefix: 'radio-push-validate-' });
      const homeDir = path.join(consumer.repoDir, '.home');
      fs.mkdirSync(homeDir);
      // allow radio usage for @all orgs
      runRadioUses({
        repoDir: consumer.repoDir,
        args: '--org @all allow',
        homeDir,
      });
      return { consumer, homeDir };
    });

    when('[t0] push without --via', () => {
      then('fails with helpful error', () => {
        const result = runRhachetSkill({
          repo: 'bhuild',
          role: 'dispatcher',
          skill: 'radio.task.push',
          args: `--title "test" --description "test" --into "${validateRepo.owner}/${validateRepo.name}"`,
          repoDir: scene.consumer.repoDir,
          env: { HOME: scene.homeDir },
        });
        expect(result.exitCode).not.toBe(0);
      });
    });
  });

  given('[case5] task file format', () => {
    const formatRepo = {
      owner: 'test-format',
      name: `test-repo-format-${Date.now()}`,
    };
    const scene = useBeforeAll(async () => {
      const consumer = await genConsumerRepo({ prefix: 'radio-push-format-' });
      const homeDir = path.join(consumer.repoDir, '.home');
      fs.mkdirSync(homeDir);
      // allow radio usage for @all orgs
      runRadioUses({
        repoDir: consumer.repoDir,
        args: '--org @all allow',
        homeDir,
      });
      const formatRadioDir = path.join(homeDir, 'git', '.radio', formatRepo.owner, formatRepo.name);
      return { consumer, homeDir, formatRadioDir };
    });

    afterAll(async () => {
      await fs.promises.rm(scene.formatRadioDir, { recursive: true, force: true });
    });

    when('[t0] task is pushed', () => {
      const result = useBeforeAll(async () =>
        runRadioTaskPush({
          repoDir: scene.consumer.repoDir,
          via: 'os.fileops',
          into: `${formatRepo.owner}/${formatRepo.name}`,
          title: 'format test task',
          description: 'verify file format',
          homeDir: scene.homeDir,
        }),
      );

      then('file has yaml frontmatter', async () => {
        const files = await fs.promises.readdir(scene.formatRadioDir);
        const taskFile = files.find(
          (f) => f.startsWith('task.') && f.endsWith('._.md'),
        );
        expect(taskFile).toBeDefined();

        const content = await fs.promises.readFile(
          path.join(scene.formatRadioDir, taskFile!),
          'utf-8',
        );
        expect(content).toMatch(/^---\n/);
        expect(content).toContain('exid:');
        expect(content).toContain('title:');
        expect(content).toContain('status:');
      });

      then('file body contains task header', async () => {
        const files = await fs.promises.readdir(scene.formatRadioDir);
        const taskFile = files.find(
          (f) => f.startsWith('task.') && f.endsWith('._.md'),
        );
        const content = await fs.promises.readFile(
          path.join(scene.formatRadioDir, taskFile!),
          'utf-8',
        );
        expect(content).toContain('🎙️ task -');
        expect(content).toContain('format test task');
      });
    });
  });

  given('[case6] bootstrap creates readme files', () => {
    const bootstrapRepo = {
      owner: 'test-bootstrap',
      name: `test-repo-bootstrap-${Date.now()}`,
    };
    const scene = useBeforeAll(async () => {
      const consumer = await genConsumerRepo({ prefix: 'radio-push-bootstrap-' });
      const homeDir = path.join(consumer.repoDir, '.home');
      fs.mkdirSync(homeDir);
      // allow radio usage for @all orgs
      runRadioUses({
        repoDir: consumer.repoDir,
        args: '--org @all allow',
        homeDir,
      });
      const globalRadioRoot = path.join(homeDir, 'git', '.radio');
      const bootstrapRadioDir = path.join(globalRadioRoot, bootstrapRepo.owner, bootstrapRepo.name);
      return { consumer, homeDir, globalRadioRoot, bootstrapRadioDir };
    });

    afterAll(async () => {
      await fs.promises.rm(scene.bootstrapRadioDir, { recursive: true, force: true });
    });

    when('[t0] first push to fresh repo', () => {
      const result = useBeforeAll(async () =>
        runRadioTaskPush({
          repoDir: scene.consumer.repoDir,
          via: 'os.fileops',
          into: `${bootstrapRepo.owner}/${bootstrapRepo.name}`,
          title: 'bootstrap test',
          description: 'triggers bootstrap',
          homeDir: scene.homeDir,
        }),
      );

      then('global radio readme exists', async () => {
        const readmePath = path.join(scene.globalRadioRoot, 'readme.md');
        const exists = await fs.promises
          .access(readmePath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);
      });

      then('repo radio readme exists', async () => {
        const readmePath = path.join(scene.bootstrapRadioDir, 'readme.md');
        const exists = await fs.promises
          .access(readmePath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);
      });
    });
  });
});
