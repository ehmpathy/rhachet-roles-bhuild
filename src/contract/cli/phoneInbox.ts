/**
 * .what = cli entry point for the phone inbox, the verbs a grove answers over its connection
 * .why  = a text crosses groves as a write into the receiver's inbox; the receiver grove's own
 *         phone takes it, in the receiver tree's own dir, so a record lands as that grove's phone
 *         would write it
 *
 * usage (run by the grove connection, never by hand; the payload rides stdin as json):
 *   phone.inbox put    take a text, or a group record, into a seat's inbox; wake this tree's daemon
 *   phone.inbox del    withdraw a QUEUED text in a seat's inbox
 *   phone.inbox set    mirror a settle onto a sender's `out` copy in this tree
 *
 * guarantee:
 *   - one json answer on stdout's last line; a fault exits non-zero, and the caller holds it
 *   - the payload names the grove as the sender knows it, so `local` and own-grove reads agree
 */

import { genPhoneDaemon } from '@src/domain.operations/phone/daemon/genPhoneDaemon';
import { getOnePhonePeerOfTree } from '@src/domain.operations/phone/daemon/getOnePhonePeerOfTree';
import { setPhoneInboxGroup } from '@src/domain.operations/phone/inbox/setPhoneInboxGroup';
import { setPhoneInboxText } from '@src/domain.operations/phone/inbox/setPhoneInboxText';
import { delPhoneTextInCopy } from '@src/domain.operations/phone/text/delPhoneTextInCopy';
import { setPhoneTextOutMirrorOnDisk } from '@src/domain.operations/phone/text/setPhoneTextOutMirrorOnDisk';
import { getOnePhoneTreeDirOfCwd } from '@src/domain.operations/phone/tree/getOnePhoneTreeDirOfCwd';
import { getCliArgvTail } from '@src/infra/cli/getCliArgvTail';
import { getOneStdinText } from '@src/infra/cli/getOneStdinText';

import { asPhoneInboxPayload } from './phone/asPhoneInboxPayload';
import { getPhoneContextFromEnv } from './phone/getPhoneContextFromEnv';
import { getPhoneDaemonProgram } from './phone/getPhoneDaemonProgram';

export const cliPhoneInbox = async (): Promise<void> => {
  // the verb is the first bare arg; `node -e` names no entry file, so argv[1] may be the verb
  const verb =
    getCliArgvTail({ argv: process.argv }).find(
      (arg) => !arg.startsWith('-'),
    ) ?? '';
  const payload = asPhoneInboxPayload({ verb, raw: getOneStdinText() });
  const treeDir = getOnePhoneTreeDirOfCwd();

  // this grove, by the name its sender knows it by
  const context = {
    ...getPhoneContextFromEnv({ env: process.env, roster: 'memo' }),
    groveSelf: payload.grove,
    log: (line: string) => console.error(line),
  };

  // the seat a name answers to in this tree: its slug, or its serial; else the name as given
  const asSeat = async (clone: string): Promise<string> => {
    const seat = await getOnePhonePeerOfTree(
      { peerTreeDir: treeDir, clone },
      context,
    );
    return seat ? (seat.slug ?? seat.serial) : clone;
  };

  // take a group record onto a seat
  if (payload.verb === 'put' && payload.kind === 'group') {
    const answer = await setPhoneInboxGroup(
      { group: payload.group, clone: payload.clone, treeDir },
      context,
    );
    console.log(JSON.stringify(answer));
    return;
  }

  // take a text into a seat's inbox, then wake this tree's daemon to say it
  if (payload.verb === 'put') {
    const answer = await setPhoneInboxText(
      { record: payload.record, treeDir },
      context,
    );
    const { outcome: daemon } =
      answer.outcome === 'QUEUED'
        ? await genPhoneDaemon({ treeDir, spawn: getPhoneDaemonProgram() })
        : { outcome: null };
    console.log(JSON.stringify({ ...answer, daemon }));
    return;
  }

  // withdraw a text where it waits
  if (payload.verb === 'del') {
    const answer = await delPhoneTextInCopy(
      { treeDir, clone: await asSeat(payload.clone), uuid: payload.uuid },
      context,
    );
    console.log(JSON.stringify(answer));
    return;
  }

  // mirror a settle onto a sender's `out` copy
  const answer = await setPhoneTextOutMirrorOnDisk({
    treeDir,
    clone: payload.clone,
    uuid: payload.uuid,
    status: payload.status,
    reason: payload.reason,
  });
  console.log(JSON.stringify(answer));
};
