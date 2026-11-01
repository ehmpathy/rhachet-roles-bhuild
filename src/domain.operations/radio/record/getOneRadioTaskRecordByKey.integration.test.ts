import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';

import { getOneRadioTaskRecordByKey } from './getOneRadioTaskRecordByKey';
import { setRadioTaskRecordFromPush } from './setRadioTaskRecordFromPush';

/**
 * .what = a temp worktree where two route dirs hold one key, each with its own body
 */
const genScene = () => {
  const cwd = genTempDir({ slug: 'radio-key-two-dirs', git: true });
  const dirAlpha = path.join(cwd, '.behavior', 'v2026_01_01.alpha', '.radio');
  const dirBeta = path.join(cwd, '.behavior', 'v2026_01_02.beta', '.radio');
  const push = {
    repo: new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' }),
    via: RadioChannel.GH_ISSUES,
    auth: null,
    idem: null,
    title: 'lesson reminders',
    exid: null,
    status: null,
  };
  const { record } = setRadioTaskRecordFromPush(
    { push: { ...push, description: 'body in alpha' } },
    { dir: dirAlpha, cwd },
  );
  // a push would find the alpha record, so the duplicate is written whole, as a merge would leave it
  daoRadioTaskRecord.set.upsert({
    dir: dirBeta,
    record: new RadioTaskRecord({ ...record, description: 'body in beta' }),
  });
  return { cwd, dirAlpha, dirBeta, key: record.key };
};

describe('getOneRadioTaskRecordByKey', () => {
  given('[case1] two route dirs hold one key, listed beta first', () => {
    const scene = useBeforeAll(async () => genScene());

    when('[t0] a verb names the key with no home dir', () => {
      then(
        'the dir first in code-unit order answers, whatever the list order',
        () => {
          /**
           * .mock = the order of `daoRadioTaskRecord.get.dirs` only; every record read stays real
           * .why = readdir order is the filesystem's, so a real dir list cannot force the reverse
           * .real = the scene's two dirs and records are real files on disk
           */
          const spy = jest
            .spyOn(daoRadioTaskRecord.get, 'dirs')
            .mockReturnValue([scene.dirBeta, scene.dirAlpha]);
          try {
            const found = getOneRadioTaskRecordByKey(
              { key: scene.key, dirHome: null },
              { cwd: scene.cwd },
            );
            expect(found?.dir).toEqual(scene.dirAlpha);
            expect(found?.record.description).toEqual('body in alpha');
          } finally {
            spy.mockRestore();
          }
        },
      );
    });
  });
});
