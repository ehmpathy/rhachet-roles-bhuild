import type { IsoDateStamp } from 'iso-time';
import { given, then, when } from 'test-fns';

import { RadioTaskRepo } from '../../../../domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '../../../../domain.objects/RadioTaskStatus';
import { extractTaskFromGhIssues } from './extractTaskFromGhIssues';

describe('extractTaskFromGhIssues', () => {
  given('[case1] open issue with no assignees', () => {
    const issueData = {
      issueNumber: '142',
      title: '🎙️ task - fix flaky test',
      body: `🦫🎙️   dispatch to foreman

\`\`\`
💧 task enqueued
   ├─ priority = ?
   ├─ yieldage = ?
   └─ leverage = ?
\`\`\`

**title**

fix flaky test

**description**

timeout in ci needs attention`,
      state: 'open' as const,
      assignees: [] as string[],
      repo: new RadioTaskRepo({ owner: 'ehmpathy', name: 'acme-app' }),
      createdAt: '2026-01-30' as IsoDateStamp,
      createdBy: 'casey',
    };

    when('[t0] extracted from gh.issues format', () => {
      then('exid matches issue number', () => {
        const task = extractTaskFromGhIssues(issueData);
        expect(task.exid).toEqual('142');
      });

      then('title has prefix removed', () => {
        const task = extractTaskFromGhIssues(issueData);
        expect(task.title).toEqual('fix flaky test');
      });

      then('status is QUEUED', () => {
        const task = extractTaskFromGhIssues(issueData);
        expect(task.status).toEqual(RadioTaskStatus.QUEUED);
      });

      then('description is extracted', () => {
        const task = extractTaskFromGhIssues(issueData);
        expect(task.description).toEqual('timeout in ci needs attention');
      });

      then('branch is null', () => {
        const task = extractTaskFromGhIssues(issueData);
        expect(task.branch).toBeNull();
      });

      then('claimedBy is null', () => {
        const task = extractTaskFromGhIssues(issueData);
        expect(task.claimedBy).toBeNull();
      });
    });
  });

  given('[case2] open issue with assignee and tree planted', () => {
    const issueData = {
      issueNumber: '142',
      title: '🎙️ task - fix flaky test',
      body: `🦫🎙️   dispatch to foreman

\`\`\`
💧 task enqueued
   ├─ priority = ?
   ├─ yieldage = ?
   └─ leverage = ?
\`\`\`

🌲 tree planted at foreman/fix-flaky-test

**title**

fix flaky test

**description**

timeout in ci needs attention`,
      state: 'open' as const,
      assignees: ['foreman'],
      repo: new RadioTaskRepo({ owner: 'ehmpathy', name: 'acme-app' }),
      createdAt: '2026-01-30' as IsoDateStamp,
      createdBy: 'casey',
    };

    when('[t0] extracted from gh.issues format', () => {
      then('status is CLAIMED', () => {
        const task = extractTaskFromGhIssues(issueData);
        expect(task.status).toEqual(RadioTaskStatus.CLAIMED);
      });

      then('branch is extracted', () => {
        const task = extractTaskFromGhIssues(issueData);
        expect(task.branch).toEqual('foreman/fix-flaky-test');
      });

      then('claimedBy matches first assignee', () => {
        const task = extractTaskFromGhIssues(issueData);
        expect(task.claimedBy).toEqual('foreman');
      });
    });
  });

  given('[case3] closed issue with tree delivered', () => {
    const issueData = {
      issueNumber: '142',
      title: '🎙️ task - fix flaky test',
      body: `🦫🎙️   dispatch to foreman

\`\`\`
💧 task enqueued
   ├─ priority = ?
   ├─ yieldage = ?
   └─ leverage = ?
\`\`\`

🌲 tree delivered at foreman/fix-flaky-test

**title**

fix flaky test

**description**

timeout in ci needs attention`,
      state: 'closed' as const,
      assignees: ['foreman'],
      repo: new RadioTaskRepo({ owner: 'ehmpathy', name: 'acme-app' }),
      createdAt: '2026-01-30' as IsoDateStamp,
      createdBy: 'casey',
    };

    when('[t0] extracted from gh.issues format', () => {
      then('status is DELIVERED', () => {
        const task = extractTaskFromGhIssues(issueData);
        expect(task.status).toEqual(RadioTaskStatus.DELIVERED);
      });

      then('branch is extracted', () => {
        const task = extractTaskFromGhIssues(issueData);
        expect(task.branch).toEqual('foreman/fix-flaky-test');
      });
    });
  });
});
