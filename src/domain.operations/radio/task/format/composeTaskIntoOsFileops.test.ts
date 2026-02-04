import type { IsoDateStamp } from 'iso-time';
import { given, then, when } from 'test-fns';

import { RadioTask } from '../../../../domain.objects/RadioTask';
import { RadioTaskRepo } from '../../../../domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '../../../../domain.objects/RadioTaskStatus';
import { composeTaskIntoOsFileops } from './composeTaskIntoOsFileops';

describe('composeTaskIntoOsFileops', () => {
  given('[case1] task in QUEUED status', () => {
    const task = new RadioTask({
      exid: '142',
      title: 'fix flaky test',
      description: 'timeout in ci needs attention',
      status: RadioTaskStatus.QUEUED,
      repo: new RadioTaskRepo({ owner: 'ehmpathy', name: 'acme-app' }),
      pushedBy: 'casey',
      pushedAt: '2026-01-30' as IsoDateStamp,
      claimedBy: null,
      claimedAt: null,
      deliveredAt: null,
      branch: null,
    });

    when('[t0] composed into os.fileops format', () => {
      then('contains yaml frontmatter', () => {
        const result = composeTaskIntoOsFileops({ task });
        expect(result).toMatch(/^---\n/);
        expect(result).toContain('\n---\n');
      });

      then('frontmatter contains exid', () => {
        const result = composeTaskIntoOsFileops({ task });
        expect(result).toContain('exid: "142"');
      });

      then('frontmatter contains title', () => {
        const result = composeTaskIntoOsFileops({ task });
        expect(result).toContain('title: "fix flaky test"');
      });

      then('frontmatter contains status', () => {
        const result = composeTaskIntoOsFileops({ task });
        expect(result).toContain('status: QUEUED');
      });

      then('frontmatter contains repo', () => {
        const result = composeTaskIntoOsFileops({ task });
        expect(result).toContain('repo: "ehmpathy/acme-app"');
      });

      then('frontmatter contains pushed_by and pushed_at', () => {
        const result = composeTaskIntoOsFileops({ task });
        expect(result).toContain('pushed_by: casey');
        expect(result).toContain('pushed_at: 2026-01-30');
      });

      then('frontmatter contains null for claimed fields', () => {
        const result = composeTaskIntoOsFileops({ task });
        expect(result).toContain('claimed_by: null');
        expect(result).toContain('claimed_at: null');
      });

      then('body contains task header', () => {
        const result = composeTaskIntoOsFileops({ task });
        expect(result).toContain('🎙️ task - fix flaky test');
      });

      then('body does not contain tree section', () => {
        const result = composeTaskIntoOsFileops({ task });
        expect(result).not.toContain('🌲');
      });

      then('matches snapshot', () => {
        const result = composeTaskIntoOsFileops({ task });
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case2] task in CLAIMED status with branch', () => {
    const task = new RadioTask({
      exid: '142',
      title: 'fix flaky test',
      description: 'timeout in ci needs attention',
      status: RadioTaskStatus.CLAIMED,
      repo: new RadioTaskRepo({ owner: 'ehmpathy', name: 'acme-app' }),
      pushedBy: 'casey',
      pushedAt: '2026-01-30' as IsoDateStamp,
      claimedBy: 'foreman',
      claimedAt: '2026-01-30' as IsoDateStamp,
      deliveredAt: null,
      branch: 'foreman/fix-flaky-test',
    });

    when('[t0] composed into os.fileops format', () => {
      then('frontmatter contains claimed_by', () => {
        const result = composeTaskIntoOsFileops({ task });
        expect(result).toContain('claimed_by: foreman');
      });

      then('frontmatter contains branch', () => {
        const result = composeTaskIntoOsFileops({ task });
        expect(result).toContain('branch: foreman/fix-flaky-test');
      });

      then('body contains tree planted section', () => {
        const result = composeTaskIntoOsFileops({ task });
        expect(result).toContain('🌲 tree planted at foreman/fix-flaky-test');
      });

      then('matches snapshot', () => {
        const result = composeTaskIntoOsFileops({ task });
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case3] task with quotes in title', () => {
    const task = new RadioTask({
      exid: '143',
      title: 'fix "special" characters',
      description: 'handle edge cases',
      status: RadioTaskStatus.QUEUED,
      repo: new RadioTaskRepo({ owner: 'ehmpathy', name: 'acme-app' }),
      pushedBy: 'casey',
      pushedAt: '2026-01-30' as IsoDateStamp,
      claimedBy: null,
      claimedAt: null,
      deliveredAt: null,
      branch: null,
    });

    when('[t0] composed into os.fileops format', () => {
      then('title quotes are escaped in frontmatter', () => {
        const result = composeTaskIntoOsFileops({ task });
        expect(result).toContain('title: "fix \\"special\\" characters"');
      });
    });
  });
});
