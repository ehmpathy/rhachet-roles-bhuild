import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { RadioTaskRepo } from '../../../domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '../../../domain.objects/RadioTaskStatus';
import { getGlobalRadioRoot, getRadioPath } from './getRadioPath';

describe('getRadioPath', () => {
  const testRepo = new RadioTaskRepo({
    owner: 'test-owner',
    name: 'test-repo',
  });

  given('[case1] global variant', () => {
    when('[t0] called without exid', () => {
      then('returns global radio directory path', () => {
        const result = getRadioPath({ repo: testRepo, variant: 'global' });
        expect(result.radioDir).toEqual(
          path.join(os.homedir(), 'git', '.radio', 'test-owner', 'test-repo'),
        );
      });

      then('returns readme path', () => {
        const result = getRadioPath({ repo: testRepo, variant: 'global' });
        expect(result.readme).toEqual(
          path.join(
            os.homedir(),
            'git',
            '.radio',
            'test-owner',
            'test-repo',
            'readme.md',
          ),
        );
      });

      then('taskFile is undefined', () => {
        const result = getRadioPath({ repo: testRepo, variant: 'global' });
        expect(result.taskFile).toBeUndefined();
      });
    });

    when('[t1] called with exid', () => {
      then('returns task file path', () => {
        const result = getRadioPath({
          repo: testRepo,
          variant: 'global',
          exid: '123',
        });
        expect(result.taskFile).toEqual(
          path.join(
            os.homedir(),
            'git',
            '.radio',
            'test-owner',
            'test-repo',
            'task.123._.md',
          ),
        );
      });

      then('statusFlag returns correct path for each status', () => {
        const result = getRadioPath({
          repo: testRepo,
          variant: 'global',
          exid: '123',
        });
        expect(result.statusFlag!(RadioTaskStatus.QUEUED)).toEqual(
          path.join(
            os.homedir(),
            'git',
            '.radio',
            'test-owner',
            'test-repo',
            'task.123._.status=QUEUED.flag',
          ),
        );
      });

      then('backup returns correct path with date', () => {
        const result = getRadioPath({
          repo: testRepo,
          variant: 'global',
          exid: '123',
        });
        expect(result.backup!('2026-01-30' as any)).toEqual(
          path.join(
            os.homedir(),
            'git',
            '.radio',
            'test-owner',
            'test-repo',
            'task.123.bak.2026-01-30.md',
          ),
        );
      });
    });
  });

  given('[case2] local variant', () => {
    when('[t0] called with cwd', () => {
      then('returns local .radio path', () => {
        const result = getRadioPath({
          repo: testRepo,
          variant: 'local',
          cwd: '/some/repo',
        });
        expect(result.radioDir).toEqual('/some/repo/.radio');
      });
    });

    when('[t1] called without cwd', () => {
      then('uses process.cwd()', () => {
        const result = getRadioPath({ repo: testRepo, variant: 'local' });
        expect(result.radioDir).toEqual(path.join(process.cwd(), '.radio'));
      });
    });
  });
});

describe('getGlobalRadioRoot', () => {
  given('[case1] called', () => {
    when('[t0] invoked', () => {
      then('returns ~/git/.radio path', () => {
        const result = getGlobalRadioRoot();
        expect(result).toEqual(path.join(os.homedir(), 'git', '.radio'));
      });
    });
  });
});
