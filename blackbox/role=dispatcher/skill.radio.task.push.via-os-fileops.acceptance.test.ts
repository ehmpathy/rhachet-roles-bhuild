import fs from 'fs';
import os from 'os';
import path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import {
  genConsumerRepo,
  runRhachetSkill,
  type ConsumerRepo,
} from '../.test/infra';

/**
 * .what = runs radio.task.push via rhachet dispatch (consumer pattern)
 * .why = tests the skill as a consumer would invoke it
 */
const runRadioTaskPush = (input: {
  repoDir: string;
  via: string;
  repo?: string;
  title?: string;
  description?: string;
  exid?: string;
  status?: string;
  idem?: string;
}) => {
  const args = [
    `--via ${input.via}`,
    input.repo ? `--repo "${input.repo}"` : '',
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
    timeout: 30000,
  });
};

describe('radio.task.push via os.fileops', () => {
  // test repo owner/name for global radio dir
  const testRepo = { owner: 'test-owner', name: `test-repo-acpt-push-${Date.now()}` };
  const globalRadioDir = path.join(
    os.homedir(),
    'git',
    '.radio',
    testRepo.owner,
    testRepo.name,
  );

  // cleanup global radio dir after all tests
  afterAll(async () => {
    await fs.promises.rm(globalRadioDir, { recursive: true, force: true });
  });

  given('[case1] inside a git repo', () => {
    const testGitRepo = useBeforeAll(async () =>
      genConsumerRepo({ prefix: 'radio-push-acpt-' }),
    );

    when('[t0] push with title and description', () => {
      const result = useBeforeAll(async () =>
        runRadioTaskPush({
          repoDir: testGitRepo.repoDir,
          via: 'os.fileops',
          repo: `${testRepo.owner}/${testRepo.name}`,
          title: 'test task from acceptance',
          description: 'this is a test task',
        }),
      );

      then('exits with code 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('output shows success with emoji', () => {
        expect(result.output).toContain('✨');
      });

      then('output shows outcome created', () => {
        expect(result.output.toLowerCase()).toContain('created');
      });

      then('task file exists in global radio dir', async () => {
        const files = await fs.promises.readdir(globalRadioDir);
        const taskFiles = files.filter((f) => f.startsWith('task.') && f.endsWith('._.md'));
        expect(taskFiles.length).toBeGreaterThan(0);
      });

      then('status flag file exists', async () => {
        const files = await fs.promises.readdir(globalRadioDir);
        const flagFiles = files.filter((f) => f.includes('.status=QUEUED.flag'));
        expect(flagFiles.length).toBeGreaterThan(0);
      });
    });

    when('[t1] push without title', () => {
      const result = useBeforeAll(async () =>
        runRadioTaskPush({
          repoDir: testGitRepo.repoDir,
          via: 'os.fileops',
          repo: `${testRepo.owner}/${testRepo.name}`,
          description: 'no title provided',
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
          repoDir: testGitRepo.repoDir,
          via: 'os.fileops',
          repo: `${testRepo.owner}/${testRepo.name}`,
          title: 'no description task',
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
    const testGitRepo = useBeforeAll(async () =>
      genConsumerRepo({ prefix: 'radio-push-idem-' }),
    );
    const idemRepo = {
      owner: 'test-idem',
      name: `test-repo-idem-${Date.now()}`,
    };
    const idemRadioDir = path.join(
      os.homedir(),
      'git',
      '.radio',
      idemRepo.owner,
      idemRepo.name,
    );

    afterAll(async () => {
      await fs.promises.rm(idemRadioDir, { recursive: true, force: true });
    });

    when('[t0] findsert mode with duplicate title', () => {
      const firstResult = useBeforeAll(async () =>
        runRadioTaskPush({
          repoDir: testGitRepo.repoDir,
          via: 'os.fileops',
          repo: `${idemRepo.owner}/${idemRepo.name}`,
          title: 'findsert duplicate task',
          description: 'first push',
          idem: 'findsert',
        }),
      );

      then('first push succeeds with created', () => {
        expect(firstResult.exitCode).toBe(0);
        expect(firstResult.output.toLowerCase()).toContain('created');
      });

      then('second push succeeds with found', async () => {
        const secondResult = runRadioTaskPush({
          repoDir: testGitRepo.repoDir,
          via: 'os.fileops',
          repo: `${idemRepo.owner}/${idemRepo.name}`,
          title: 'findsert duplicate task',
          description: 'second push',
          idem: 'findsert',
        });
        expect(secondResult.exitCode).toBe(0);
        expect(secondResult.output.toLowerCase()).toContain('found');
      });
    });

    when('[t1] upsert mode with duplicate title', () => {
      const firstResult = useBeforeAll(async () =>
        runRadioTaskPush({
          repoDir: testGitRepo.repoDir,
          via: 'os.fileops',
          repo: `${idemRepo.owner}/${idemRepo.name}`,
          title: 'upsert duplicate task',
          description: 'first version',
          idem: 'upsert',
        }),
      );

      then('first push succeeds', () => {
        expect(firstResult.exitCode).toBe(0);
      });

      then('second push updates description', async () => {
        const secondResult = runRadioTaskPush({
          repoDir: testGitRepo.repoDir,
          via: 'os.fileops',
          repo: `${idemRepo.owner}/${idemRepo.name}`,
          title: 'upsert duplicate task',
          description: 'updated version',
          idem: 'upsert',
        });
        expect(secondResult.exitCode).toBe(0);

        // verify description was updated in file
        const files = await fs.promises.readdir(idemRadioDir);
        const taskFiles = files.filter(
          (f) => f.startsWith('task.') && f.endsWith('._.md'),
        );
        // find the upsert task via content match
        let foundUpsertTask = false;
        for (const taskFile of taskFiles) {
          const content = await fs.promises.readFile(
            path.join(idemRadioDir, taskFile),
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
    const consumer = useBeforeAll(async () =>
      genConsumerRepo({ prefix: 'radio-push-status-' }),
    );
    const statusRepo = {
      owner: 'test-status',
      name: `test-repo-status-${Date.now()}`,
    };
    const statusRadioDir = path.join(
      os.homedir(),
      'git',
      '.radio',
      statusRepo.owner,
      statusRepo.name,
    );
    let taskExid: string;

    afterAll(async () => {
      await fs.promises.rm(statusRadioDir, { recursive: true, force: true });
    });

    when('[t0] create task then claim it', () => {
      const createResult = useBeforeAll(async () => {
        const result = runRadioTaskPush({
          repoDir: consumer.repoDir,
          via: 'os.fileops',
          repo: `${statusRepo.owner}/${statusRepo.name}`,
          title: 'task for status test',
          description: 'will be claimed',
        });

        // extract exid from output or file
        const files = await fs.promises.readdir(statusRadioDir);
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
          repoDir: consumer.repoDir,
          via: 'os.fileops',
          repo: `${statusRepo.owner}/${statusRepo.name}`,
          exid: taskExid,
          status: 'CLAIMED',
        });
        expect(claimResult.exitCode).toBe(0);

        // verify status flag changed
        const files = await fs.promises.readdir(statusRadioDir);
        const claimedFlag = files.find((f) =>
          f.includes('.status=CLAIMED.flag'),
        );
        expect(claimedFlag).toBeDefined();
      });

      then('deliver updates status to DELIVERED', async () => {
        const deliverResult = runRadioTaskPush({
          repoDir: consumer.repoDir,
          via: 'os.fileops',
          repo: `${statusRepo.owner}/${statusRepo.name}`,
          exid: taskExid,
          status: 'DELIVERED',
        });
        expect(deliverResult.exitCode).toBe(0);

        // verify no status flag (delivered = no flag)
        const files = await fs.promises.readdir(statusRadioDir);
        const anyFlag = files.find((f) => f.includes('.status='));
        expect(anyFlag).toBeUndefined();
      });
    });
  });

  given('[case4] channel validation', () => {
    const testGitRepo = useBeforeAll(async () =>
      genConsumerRepo({ prefix: 'radio-push-validate-' }),
    );

    when('[t0] push without --via', () => {
      then('fails with helpful error', () => {
        const result = runRhachetSkill({
          repo: 'bhuild',
          role: 'dispatcher',
          skill: 'radio.task.push',
          args: `--title "test" --description "test" --repo "${testRepo.owner}/${testRepo.name}"`,
          repoDir: testGitRepo.repoDir,
        });
        expect(result.exitCode).not.toBe(0);
      });
    });
  });

  given('[case5] task file format', () => {
    const testGitRepo = useBeforeAll(async () =>
      genConsumerRepo({ prefix: 'radio-push-format-' }),
    );
    const formatRepo = {
      owner: 'test-format',
      name: `test-repo-format-${Date.now()}`,
    };
    const formatRadioDir = path.join(
      os.homedir(),
      'git',
      '.radio',
      formatRepo.owner,
      formatRepo.name,
    );

    afterAll(async () => {
      await fs.promises.rm(formatRadioDir, { recursive: true, force: true });
    });

    when('[t0] task is pushed', () => {
      const result = useBeforeAll(async () =>
        runRadioTaskPush({
          repoDir: testGitRepo.repoDir,
          via: 'os.fileops',
          repo: `${formatRepo.owner}/${formatRepo.name}`,
          title: 'format test task',
          description: 'verify file format',
        }),
      );

      then('file has yaml frontmatter', async () => {
        const files = await fs.promises.readdir(formatRadioDir);
        const taskFile = files.find(
          (f) => f.startsWith('task.') && f.endsWith('._.md'),
        );
        expect(taskFile).toBeDefined();

        const content = await fs.promises.readFile(
          path.join(formatRadioDir, taskFile!),
          'utf-8',
        );
        expect(content).toMatch(/^---\n/);
        expect(content).toContain('exid:');
        expect(content).toContain('title:');
        expect(content).toContain('status:');
      });

      then('file body contains task header', async () => {
        const files = await fs.promises.readdir(formatRadioDir);
        const taskFile = files.find(
          (f) => f.startsWith('task.') && f.endsWith('._.md'),
        );
        const content = await fs.promises.readFile(
          path.join(formatRadioDir, taskFile!),
          'utf-8',
        );
        expect(content).toContain('task:');
        expect(content).toContain('format test task');
      });
    });
  });

  given('[case6] bootstrap creates readme files', () => {
    const testGitRepo = useBeforeAll(async () =>
      genConsumerRepo({ prefix: 'radio-push-bootstrap-' }),
    );
    const bootstrapRepo = {
      owner: 'test-bootstrap',
      name: `test-repo-bootstrap-${Date.now()}`,
    };
    const bootstrapRadioDir = path.join(
      os.homedir(),
      'git',
      '.radio',
      bootstrapRepo.owner,
      bootstrapRepo.name,
    );
    const globalRadioRoot = path.join(os.homedir(), 'git', '.radio');

    afterAll(async () => {
      await fs.promises.rm(bootstrapRadioDir, { recursive: true, force: true });
    });

    when('[t0] first push to fresh repo', () => {
      const result = useBeforeAll(async () =>
        runRadioTaskPush({
          repoDir: testGitRepo.repoDir,
          via: 'os.fileops',
          repo: `${bootstrapRepo.owner}/${bootstrapRepo.name}`,
          title: 'bootstrap test',
          description: 'triggers bootstrap',
        }),
      );

      then('global radio readme exists', async () => {
        const readmePath = path.join(globalRadioRoot, 'readme.md');
        const exists = await fs.promises
          .access(readmePath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);
      });

      then('repo radio readme exists', async () => {
        const readmePath = path.join(bootstrapRadioDir, 'readme.md');
        const exists = await fs.promises
          .access(readmePath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);
      });
    });
  });
});
