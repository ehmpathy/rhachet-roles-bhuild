import type { IsoDateStamp } from 'iso-time';
import { given, then, when } from 'test-fns';

import { RadioTask } from '../../../../domain.objects/RadioTask';
import { RadioTaskRepo } from '../../../../domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '../../../../domain.objects/RadioTaskStatus';
import { composeTaskIntoOsFileops } from './composeTaskIntoOsFileops';
import { extractTaskFromOsFileops } from './extractTaskFromOsFileops';

describe('extractTaskFromOsFileops', () => {
  given('[case1] valid os.fileops content for QUEUED task', () => {
    const content = `---
exid: "142"
title: "fix flaky test"
status: QUEUED
repo: "ehmpathy/acme-app"
pushed_by: casey
pushed_at: 2026-01-30
claimed_by: null
claimed_at: null
delivered_at: null
branch: null
---

🎙️ task - fix flaky test

🦫  dispatch to foreman

💧 task enqueued
   ├─ priority = ?
   ├─ yieldage = ?
   └─ leverage = ?

---

fix flaky test

timeout in ci needs attention
`;

    when('[t0] extracted from os.fileops format', () => {
      then('exid is extracted', () => {
        const task = extractTaskFromOsFileops({ content });
        expect(task.exid).toEqual('142');
      });

      then('title is extracted', () => {
        const task = extractTaskFromOsFileops({ content });
        expect(task.title).toEqual('fix flaky test');
      });

      then('status is QUEUED', () => {
        const task = extractTaskFromOsFileops({ content });
        expect(task.status).toEqual(RadioTaskStatus.QUEUED);
      });

      then('repo is extracted', () => {
        const task = extractTaskFromOsFileops({ content });
        expect(task.repo.owner).toEqual('ehmpathy');
        expect(task.repo.name).toEqual('acme-app');
      });

      then('description is extracted', () => {
        const task = extractTaskFromOsFileops({ content });
        expect(task.description).toEqual('timeout in ci needs attention');
      });

      then('claimedBy is null', () => {
        const task = extractTaskFromOsFileops({ content });
        expect(task.claimedBy).toBeNull();
      });

      then('branch is null', () => {
        const task = extractTaskFromOsFileops({ content });
        expect(task.branch).toBeNull();
      });
    });
  });

  given('[case2] valid os.fileops content for CLAIMED task', () => {
    const content = `---
exid: "142"
title: "fix flaky test"
status: CLAIMED
repo: "ehmpathy/acme-app"
pushed_by: casey
pushed_at: 2026-01-30
claimed_by: foreman
claimed_at: 2026-01-30
delivered_at: null
branch: foreman/fix-flaky-test
---

🎙️ task - fix flaky test

🦫  dispatch to foreman

💧 task enqueued
   ├─ priority = ?
   ├─ yieldage = ?
   └─ leverage = ?

🌲 tree planted at foreman/fix-flaky-test

---

fix flaky test

timeout in ci needs attention
`;

    when('[t0] extracted from os.fileops format', () => {
      then('status is CLAIMED', () => {
        const task = extractTaskFromOsFileops({ content });
        expect(task.status).toEqual(RadioTaskStatus.CLAIMED);
      });

      then('claimedBy is extracted', () => {
        const task = extractTaskFromOsFileops({ content });
        expect(task.claimedBy).toEqual('foreman');
      });

      then('branch is extracted', () => {
        const task = extractTaskFromOsFileops({ content });
        expect(task.branch).toEqual('foreman/fix-flaky-test');
      });
    });
  });

  given('[case3] compose and extract roundtrip', () => {
    const originalTask = new RadioTask({
      exid: '999',
      title: 'roundtrip test',
      description: 'verify compose and extract are inverses',
      status: RadioTaskStatus.CLAIMED,
      repo: new RadioTaskRepo({ owner: 'test', name: 'repo' }),
      pushedBy: 'tester',
      pushedAt: '2026-01-30' as IsoDateStamp,
      claimedBy: 'worker',
      claimedAt: '2026-01-31' as IsoDateStamp,
      deliveredAt: null,
      branch: 'worker/roundtrip',
    });

    when('[t0] task is composed then extracted', () => {
      then('extracted task matches original', () => {
        const content = composeTaskIntoOsFileops({ task: originalTask });
        const extractedTask = extractTaskFromOsFileops({ content });

        expect(extractedTask.exid).toEqual(originalTask.exid);
        expect(extractedTask.title).toEqual(originalTask.title);
        expect(extractedTask.status).toEqual(originalTask.status);
        expect(extractedTask.repo.owner).toEqual(originalTask.repo.owner);
        expect(extractedTask.repo.name).toEqual(originalTask.repo.name);
        expect(extractedTask.pushedBy).toEqual(originalTask.pushedBy);
        expect(extractedTask.claimedBy).toEqual(originalTask.claimedBy);
        expect(extractedTask.branch).toEqual(originalTask.branch);
      });
    });
  });

  given('[case4] invalid content without frontmatter', () => {
    const content = 'no frontmatter here';

    when('[t0] extraction attempted', () => {
      then('throws error', () => {
        expect(() => extractTaskFromOsFileops({ content })).toThrow(
          'invalid os.fileops task format: no frontmatter',
        );
      });
    });
  });

  given('[case5] content with quoted title that has special chars', () => {
    const content = `---
exid: "143"
title: "fix \\"special\\" characters"
status: QUEUED
repo: "ehmpathy/acme-app"
pushed_by: casey
pushed_at: 2026-01-30
claimed_by: null
claimed_at: null
delivered_at: null
branch: null
---

🎙️ task - fix "special" characters

---

fix "special" characters

handle edge cases
`;

    when('[t0] extracted from os.fileops format', () => {
      then('title quotes are unescaped', () => {
        const task = extractTaskFromOsFileops({ content });
        expect(task.title).toEqual('fix "special" characters');
      });
    });
  });
});
