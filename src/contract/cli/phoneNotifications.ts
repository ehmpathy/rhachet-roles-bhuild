/**
 * .what = cli entry point for phone notifications: the texts held for this clone, told at its stop
 * .why  = the tree's daemon wakes a clone with each text; if the daemon has failed, a clone still
 *         learns of its texts the next time it stops, since its own stop hook tells it
 *
 * usage (the dispatcher role's onStop hook runs it):
 *   phone.notifications get --when hook.onStop
 *
 * guarantee:
 *   - a text held for this clone is told once: settled DELIVERED, then printed to stderr, exit 2,
 *     so the clone reads it before it stops; the sender's thread reads DELIVERED
 *   - no text held = no output, exit 0; the stop proceeds
 *   - a shell with no enrolled clone, or any phone fault, never blocks the stop: one line, exit 0
 */
import { asPhoneAddressString } from '@src/domain.operations/phone/address/asPhoneAddressString';
import { getOnePhoneDaemon } from '@src/domain.operations/phone/daemon/getOnePhoneDaemon';
import { asPhoneTextsToldAtStop } from '@src/domain.operations/phone/render/asPhoneTextsToldAtStop';
import { getOnePhoneSelf } from '@src/domain.operations/phone/self/getOnePhoneSelf';
import { setPhoneTextsToldAtStop } from '@src/domain.operations/phone/text/setPhoneTextsToldAtStop';

import { getPhoneContextFromEnv } from './phone/getPhoneContextFromEnv';

export const cliPhoneNotifications = async (): Promise<void> => {
  // a shell with no clone holds no mailbox; the stop proceeds in silence
  const serial = process.env.RHACHET_CLONE_SERIAL || null;
  if (!serial) return;

  const context = {
    ...getPhoneContextFromEnv({ env: process.env, roster: 'memo' }),
    log: (line: string) => console.error(line),
  };
  const result = await (async () => {
    const self = await getOnePhoneSelf({ serial, pitch: null }, context);
    const { told } = await setPhoneTextsToldAtStop({ self }, context);
    const { lock } = await getOnePhoneDaemon({ treeDir: self.treeDir });
    return { self, told, daemon: lock?.state === 'LIVE' ? 'LIVE' : 'DOWN' };
  })().catch((error: unknown) => {
    // the stop hook never blocks a stop on a fault of its own; it names the fault in one line
    if (!(error instanceof Error)) throw error;
    console.error(
      `🦫 phone.notifications skipped: ${error.message.split('\n')[0]}`,
    );
    return null;
  });
  if (!result || result.told.length === 0) return;

  // tell the clone: stderr with exit 2 is what a stop hook hands back to the clone to read
  console.error(
    asPhoneTextsToldAtStop({
      told: result.told,
      self: asPhoneAddressString(result.self.address),
      daemon: result.daemon === 'LIVE' ? 'LIVE' : 'DOWN',
    }),
  );
  process.exitCode = 2;
};
