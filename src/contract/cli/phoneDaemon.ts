/**
 * .what = cli entry point for the phone.daemon skill
 * .why  = one daemon per tree carries every clone's texts; a human may check it, start it, or
 *         stop it, and `phone.text set` starts it on its own
 *
 * usage:
 *   phone.daemon get     is a daemon live in this tree?
 *   phone.daemon set     find the live daemon, or start one
 *   phone.daemon del     stop it; no text is lost
 *   phone.daemon run     the loop itself (what `set` starts, detached)
 *
 * guarantee:
 *   - one daemon per tree, held by a lock; a second start is a no-op
 *   - the files are the queue: a stop or a crash loses no text
 */
import type { IsoDuration } from 'iso-time';
import { z } from 'zod';

import { delPhoneDaemon } from '@src/domain.operations/phone/daemon/delPhoneDaemon';
import { genPhoneDaemon } from '@src/domain.operations/phone/daemon/genPhoneDaemon';
import { getOnePhoneDaemon } from '@src/domain.operations/phone/daemon/getOnePhoneDaemon';
import { runPhoneDaemon } from '@src/domain.operations/phone/daemon/runPhoneDaemon';
import { asPhoneDaemonDelOutput } from '@src/domain.operations/phone/render/asPhoneDaemonDelOutput';
import { asPhoneDaemonGetOutput } from '@src/domain.operations/phone/render/asPhoneDaemonGetOutput';
import { asPhoneDaemonSetOutput } from '@src/domain.operations/phone/render/asPhoneDaemonSetOutput';
import { getOnePhoneTreeDirOfCwd } from '@src/domain.operations/phone/tree/getOnePhoneTreeDirOfCwd';
import { getCliArgs } from '@src/infra/cli';

import { assertPhoneVerbKnown } from './phone/assertPhoneVerbKnown';
import { getPhoneContextFromEnv } from './phone/getPhoneContextFromEnv';
import { getPhoneDaemonProgram } from './phone/getPhoneDaemonProgram';
import { withPhoneRefusalVibe } from './phone/withPhoneRefusalVibe';

const schemaOfArgs = z.object({
  named: z.object({
    help: z.boolean().optional(),
    h: z.boolean().optional(),

    // rhachet passthrough args (optional, ignored)
    repo: z.string().optional(),
    role: z.string().optional(),
    skill: z.string().optional(),
    s: z.string().optional(),
  }),
  ordered: z.array(z.string()).default([]),
});

const HELP_TEXT = `
🦫 here's the daemon

💧 phone.daemon --help
   └─ usage
      ├─ phone.daemon get   is a daemon live in this tree?
      ├─ phone.daemon set   find the live daemon, or start one
      └─ phone.daemon del   stop it; no text is lost
`.trim();

const _cliPhoneDaemon = async (): Promise<void> => {
  const { named, ordered } = getCliArgs({ schema: schemaOfArgs });
  const verb = ordered[0] ?? null;

  // handle --help, or an absent verb
  if (named.help || named.h || !verb) {
    console.log(HELP_TEXT);
    return;
  }

  // refuse a verb the phone does not know, before any tree lookup; `run` is the loop the
  // detached start calls, so it is known but left out of the usage a human reads
  assertPhoneVerbKnown({
    skill: 'phone.daemon',
    verb,
    known: ['get', 'set', 'del', 'run'],
    usage: ['get', 'set', 'del'],
  });
  const treeDir = getOnePhoneTreeDirOfCwd();

  // the loop itself, as the detached start runs it
  if (verb === 'run') {
    await runPhoneDaemon(
      { treeDir, tick: DAEMON_TICK, idleExit: DAEMON_IDLE_EXIT },
      getPhoneContextFromEnv({ env: process.env, roster: 'live' }),
    );
    return;
  }

  // read
  if (verb === 'get') {
    console.log(asPhoneDaemonGetOutput(await getOnePhoneDaemon({ treeDir })));
    return;
  }

  // find or start, and say what was seen; an unconfirmed start is a malfunction, exit 1
  if (verb === 'set') {
    const { lock, outcome } = await genPhoneDaemon({
      treeDir,
      spawn: getPhoneDaemonProgram(),
    });
    const { logPath } = await getOnePhoneDaemon({ treeDir });
    console.log(asPhoneDaemonSetOutput({ lock, outcome, logPath }));
    if (outcome === 'UNCONFIRMED') process.exitCode = 1;
    return;
  }

  // stop, and say whether it is gone yet
  const { outcome } = await delPhoneDaemon({ treeDir });
  console.log(asPhoneDaemonDelOutput({ outcome }));
};

/**
 * .what = the daemon's poll span, and the quiet span before it exits (F15)
 */
const DAEMON_TICK: IsoDuration = { seconds: 3 };
const DAEMON_IDLE_EXIT: IsoDuration = { minutes: 30 };

export const cliPhoneDaemon = withPhoneRefusalVibe(_cliPhoneDaemon);
