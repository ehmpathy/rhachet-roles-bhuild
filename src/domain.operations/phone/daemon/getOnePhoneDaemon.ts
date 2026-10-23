import {
  daoPhoneDaemon,
  type PhoneDaemonLock,
} from '@src/access/daos/daoPhoneDaemon';

/**
 * .what = this tree's daemon as `phone.daemon get` shows it: its lock, and where its log lives
 */
export const getOnePhoneDaemon = async (input: {
  treeDir: string;
}): Promise<{ lock: PhoneDaemonLock | null; logPath: string }> => ({
  lock: await daoPhoneDaemon.getOne(input),
  logPath: daoPhoneDaemon.getOneLogPath(input),
});
