/**
 * .what = cli entry point for the phone.text skill
 * .why  = a clone texts a peer or a group, reads its thread, or withdraws a QUEUED text — plain
 *         directed text, written into the receiver's inbox and said by the receiver tree's daemon
 *         over `rhx clone say`, never a pane keystroke
 *
 * usage:
 *   phone.text set --into <address> [--into <address> ...] --what <text|@stdin> [--re <uuid>]
 *   phone.text set --into group:<id> --what <text|@stdin>
 *   phone.text set --re <uuid of a group text> --what <text|@stdin>
 *   phone.text get [--text <uuid>]
 *   phone.text del --text <uuid>
 *
 * guarantee:
 *   - runs only inside an enrolled clone; reads and writes that clone's mailbox, and writes each
 *     receiver seat's inbox
 *   - a send admits every peer or none, returns at once with each text QUEUED, and wakes the
 *     daemon of each receiver tree on this grove; a peer on another grove is written through the
 *     grove connection, and its grove wakes its own daemon
 *   - a refusal exits 2 with a vibe line and the fix
 */
import { z } from 'zod';

import { asPhoneAddressString } from '@src/domain.operations/phone/address/asPhoneAddressString';
import { genPhoneDaemon } from '@src/domain.operations/phone/daemon/genPhoneDaemon';
import { getOnePhoneDaemon } from '@src/domain.operations/phone/daemon/getOnePhoneDaemon';
import { asPhoneDaemonOutcomeOfAll } from '@src/domain.operations/phone/render/asPhoneDaemonOutcomeOfAll';
import { asPhoneTextDelOutput } from '@src/domain.operations/phone/render/asPhoneTextDelOutput';
import { asPhoneTextGetOutput } from '@src/domain.operations/phone/render/asPhoneTextGetOutput';
import { asPhoneTextSetOutput } from '@src/domain.operations/phone/render/asPhoneTextSetOutput';
import { genPhoneRefusal } from '@src/domain.operations/phone/render/genPhoneRefusal';
import { getOnePhoneSelf } from '@src/domain.operations/phone/self/getOnePhoneSelf';
import { delPhoneText } from '@src/domain.operations/phone/text/delPhoneText';
import { getAllPhoneTexts } from '@src/domain.operations/phone/text/getAllPhoneTexts';
import { getOnePhoneTextByRef } from '@src/domain.operations/phone/text/getOnePhoneTextByRef';
import { setPhoneText } from '@src/domain.operations/phone/text/setPhoneText';
import { getCliArgs } from '@src/infra/cli';
import { getAllCliArgValuesOrOne } from '@src/infra/cli/getAllCliArgValuesOrOne';
import { getOneStdinText } from '@src/infra/cli/getOneStdinText';

import { asPhoneFlagValue } from './phone/asPhoneFlagValue';
import { assertPhoneFlagGiven } from './phone/assertPhoneFlagGiven';
import { assertPhoneVerbKnown } from './phone/assertPhoneVerbKnown';
import { getPhoneContextFromEnv } from './phone/getPhoneContextFromEnv';
import { getPhoneDaemonProgram } from './phone/getPhoneDaemonProgram';
import { withPhoneRefusalVibe } from './phone/withPhoneRefusalVibe';

const schemaOfArgs = z.object({
  named: z.object({
    help: z.boolean().optional(),
    h: z.boolean().optional(),
    into: z.union([z.string(), z.boolean()]).optional(),
    to: z.union([z.string(), z.boolean()]).optional(),
    what: z.string().optional(),
    re: z.union([z.string(), z.boolean()]).optional(),
    text: z.union([z.string(), z.boolean()]).optional(),

    // rhachet passthrough args (optional, ignored)
    repo: z.string().optional(),
    role: z.string().optional(),
    skill: z.string().optional(),
    s: z.string().optional(),
  }),
  ordered: z.array(z.string()).default([]),
});

const HELP_TEXT = `
🦫 here's how the phone works

💧 phone.text --help
   ├─ usage
   │  ├─ phone.text set --into <address> --what <text|@stdin> [--re <uuid>]   send a text (--into repeats for a group)
   │  ├─ phone.text set --into group:<id> --what <text|@stdin>                 text a group you are in
   │  ├─ phone.text get [--text <uuid>]                                        this clone's thread, or one text
   │  └─ phone.text del --text <uuid>                                          withdraw a QUEUED text
   │
   ├─ the inputs
   │  ├─ --into <address>   a peer; repeat it to text a new group (each peer gets its own copy)
   │  ├─ --into group:<id>  a group you are in, by its name
   │  ├─ --what <text>      the words; --what @stdin reads them from a pipe
   │  ├─ --re <uuid>        optional: the text this one answers; the peer sees the link
   │  │                     (a --re of a group text, with no --into, answers the whole group)
   │  └─ --text <uuid>      the text to read (get) or to withdraw (del)
   │
   ├─ for example
   │  ├─ rhx phone.text set --into @:foreman --what 'the slot shape changed'
   │  ├─ rhx phone.text set --into @:foreman --into @:mechanic --what 'standup at the reef'
   │  ├─ echo 'got it' | rhx phone.text set --into @:mechanic --re 7f3e9a02 --what @stdin
   │  └─ rhx phone.text set --re 5b1d0c44 --what 'on my way'     # 5b1d0c44 is a group text
   │
   ├─ the address
   │  ├─ phone://grove=<grove>/tree=<tree>/clone=<clone>
   │  ├─ phone://grove=local/tree=<tree>/clone=<clone>   (local = this grove)
   │  ├─ @:<clone>                                       (a clone in your own tree)
   │  └─ group:<id>                                      (a group you are in)
   │
   └─ the text's name
      └─ its uuid: the first 8 chars (7f3e9a02) or the whole
`.trim();

const _cliPhoneText = async (): Promise<void> => {
  const { named, ordered } = getCliArgs({
    schema: schemaOfArgs,
    valueRawKeys: ['what'],
  });
  const verb = ordered[0] ?? null;

  // handle --help, or an absent verb
  if (named.help || named.h || !verb) {
    console.log(HELP_TEXT);
    return;
  }

  // refuse a verb the phone does not know, before any clone lookup
  assertPhoneVerbKnown({
    skill: 'phone.text',
    verb,
    known: ['set', 'get', 'del'],
    usage: [
      "set --into <address> --what '...'",
      'get',
      'get --text <uuid>',
      'del --text <uuid>',
    ],
  });

  // the peer flag is --into, after the label a text names its peer by; one name, no alias
  if (named.to !== undefined)
    throw genPhoneRefusal({
      vibe: 'bummer, that flag swam upstream',
      headline: '--to is now --into, after the into: label',
      nodes: [
        {
          text: "send it as: rhx phone.text set --into <address> --what '...'",
        },
      ],
    });

  // refuse a withdraw that names no text, before any clone lookup
  const textToWithdraw =
    verb === 'del'
      ? assertPhoneFlagGiven({
          skill: 'phone.text',
          verb: 'del',
          flag: 'text',
          raw: named.text,
          takes: "the text's uuid (its first 8 chars, or the whole)",
          usage: 'del --text <uuid>',
        })
      : null;

  // find the clone this verb runs as
  const context = {
    ...getPhoneContextFromEnv({ env: process.env, roster: 'memo' }),
    log: (line: string) => console.error(line),
  };
  const self = await getOnePhoneSelf(
    { serial: process.env.RHACHET_CLONE_SERIAL || null, pitch: null },
    context,
  );

  // withdraw
  if (textToWithdraw !== null) {
    const result = await delPhoneText({ text: textToWithdraw, self }, context);
    console.log(asPhoneTextDelOutput(result));
    return;
  }

  // send, then wake the daemon of each receiver tree, and say what was seen of them
  if (verb === 'set') {
    const what =
      named.what === '@stdin' ? getOneStdinText() : (named.what ?? '');

    // a --re that is passed must name a text; bare or blank (parsed as a flag) is refused
    const re =
      named.re !== undefined
        ? assertPhoneFlagGiven({
            skill: 'phone.text',
            verb: 'set',
            flag: 're',
            raw: named.re,
            takes:
              'the uuid of the text it answers (its first 8 chars, or the whole)',
            usage: "set --into <address> --what '...' --re <uuid>",
          })
        : null;
    const { entries, duplicates, group, treeDirsToWake } = await setPhoneText(
      {
        into: getAllCliArgValuesOrOne({
          key: 'into',
          argv: process.argv,
          parsed: asPhoneFlagValue(named.into),
        }),
        what,
        re,
        self,
      },
      context,
    );
    // .note = deliberate mutation: one wake per tree, in turn
    const outcomes: ('FOUND' | 'STARTED' | 'UNCONFIRMED')[] = [];
    for (const treeDir of treeDirsToWake)
      outcomes.push(
        (await genPhoneDaemon({ treeDir, spawn: getPhoneDaemonProgram() }))
          .outcome,
      );
    console.log(
      asPhoneTextSetOutput({
        entries,
        daemon: asPhoneDaemonOutcomeOfAll({ outcomes }),
        duplicates,
        group,
      }),
    );
    return;
  }

  // read one text, or the whole thread, with whether a daemon is live to say a text held here
  const textToRead =
    named.text === undefined
      ? null
      : assertPhoneFlagGiven({
          skill: 'phone.text',
          verb: 'get',
          flag: 'text',
          raw: named.text,
          takes: "the text's uuid (its first 8 chars, or the whole)",
          usage: 'get --text <uuid>',
        });
  const { entries, unreadable } =
    textToRead !== null
      ? {
          entries: [await getOnePhoneTextByRef({ raw: textToRead, self })],
          unreadable: [],
        }
      : await getAllPhoneTexts({ self });
  const { lock } = await getOnePhoneDaemon({ treeDir: self.treeDir });
  console.log(
    asPhoneTextGetOutput({
      entries,
      unreadable,
      daemon: lock?.state === 'LIVE' ? 'LIVE' : 'DOWN',
      self: asPhoneAddressString(self.address),
    }),
  );
};

export const cliPhoneText = withPhoneRefusalVibe(_cliPhoneText);
