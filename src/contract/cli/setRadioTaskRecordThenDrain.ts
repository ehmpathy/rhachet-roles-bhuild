import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { getBranchBehaviorBind } from '@src/domain.operations/behavior/bind/getBranchBehaviorBind';
import { asRadioLockWaitNotice } from '@src/domain.operations/radio/record/asRadioLockWaitNotice';
import { asRadioPushOutput } from '@src/domain.operations/radio/record/asRadioPushOutput';
import { asRadioPushSavedNotice } from '@src/domain.operations/radio/record/asRadioPushSavedNotice';
import { asRadioTaskRecordHomeFromCwd } from '@src/domain.operations/radio/record/asRadioTaskRecordHomeFromCwd';
import { getOneRadioPushDrainWithBacklog } from '@src/domain.operations/radio/record/getOneRadioPushDrainWithBacklog';
import { getOneRadioTaskRecordHome } from '@src/domain.operations/radio/record/getOneRadioTaskRecordHome';
import { isRadioPushDelivered } from '@src/domain.operations/radio/record/isRadioPushDelivered';
import { withFaultNotice } from '@src/infra/cli/withFaultNotice';
import { isGitRepoAt } from '@src/infra/git/isGitRepoAt';
import { shx } from '@src/infra/shell/shx';

/**
 * .what = the route bind of this branch, or null outside a git repo
 * .why  = the contract composes the behavior context's bind with the radio context's
 *         record home, so neither domain reaches into the other
 */
const getOneBranchBindForRecord = (input: {
  cwd: string;
}): { behaviorDir: string | null; binds: string[] } | null => {
  // outside a git repo, no branch can bind a route
  if (!isGitRepoAt({ dir: input.cwd })) return null;
  return getBranchBehaviorBind({}, { cwd: input.cwd });
};

/**
 * .what = the one record → gate → drain path every radio write takes: transcribe the act into
 *         its record, then hold it at a shut gate or drain the backlog through an open one, then
 *         report its fate and exit 2 unless it landed
 * .why  = radio.task.push and radio.task.comment share this path, so a comment meets
 *         `radio.uses` exactly as a push does, and the radio stays the one github write path
 *
 * .note = cwd is the repo root, by contract (rule.forbid.cwd-override)
 */
export const setRadioTaskRecordThenDrain = async (input: {
  transcribe: (home: { dir: string; cwd: string }) => {
    record: RadioTaskRecord;
    dir: string;
  };
  authTyped: string | null;
}): Promise<void> => {
  // transcribe first: once recorded, this act is never lost.
  // homeDir honors $HOME for the global-meter lookup (standard CLI convention):
  // os.homedir() reads the OS passwd entry and cannot be isolated in-process
  const context = {
    cwd: process.cwd(),
    homeDir: process.env.HOME,
    env: process.env,
    shx,
    // a push blocked on another drain says so once, on stdout: rhachet drops stderr on exit 0
    onLockWait: () => console.log(asRadioLockWaitNotice()),
  };
  const bind = getOneBranchBindForRecord({ cwd: context.cwd });
  const home = getOneRadioTaskRecordHome({ bind }, context);
  const { record, dir } = input.transcribe({
    dir: home.dir,
    cwd: context.cwd,
  });

  // name where the record lives: a re-push after a bind stays where it was first held
  const homeOfRecord = asRadioTaskRecordHomeFromCwd(
    { home: { ...home, dir } },
    context,
  );

  // hold at a shut gate, or drain the backlog through an open one, then count what still waits;
  // a fault in either (an unreadable record, a bad gate config) first says the act is saved
  const { pushed, others, backlog } = await withFaultNotice({
    logic: () =>
      getOneRadioPushDrainWithBacklog(
        { record, dir, authTyped: input.authTyped },
        context,
      ),
    notice: asRadioPushSavedNotice({ record, dir: homeOfRecord.dir }),
  });

  // report the fate of this act, and of the backlog it carried
  console.log(
    asRadioPushOutput({
      pushed,
      others,
      home: homeOfRecord,
      backlog: backlog.length,
    }),
  );

  // exit 2 unless this act landed: a held or refused one was not delivered
  if (!isRadioPushDelivered({ pushed })) process.exitCode = 2;
};
