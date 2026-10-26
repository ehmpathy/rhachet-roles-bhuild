/**
 * .what = cli entry point for radio.task.held skill — an alias of `radio.task.queue get`
 *         (deprecated); a human who lists sees the new name atop the list, while a
 *         stop hook prints only its json line
 * .why  = shows the tasks held for the radio in this worktree; at stop, the clone
 *         reminds the human in one line what waits and how to free it
 *
 * options:
 *   --when hook.onStop  one line as a claude `systemMessage`, naught when none held
 *   --help              show usage and exit
 *
 * usage:
 *   radio.task.held
 *   radio.task.held --when hook.onStop
 *
 * guarantee:
 *   - reads local records and radio.uses only; no network, no send
 *   - never blocks the stop: a claude stop hook blocks on exit 2 alone, and in the
 *     stop hook every constraint is recast as a malfunction, so it never exits 2.
 *     a fault fails loud (exit 1, cause on stderr), which claude shows the human
 *     and does not treat as a block
 */

import { z } from 'zod';

import { asRadioHeldOutput } from '@src/domain.operations/radio/record/asRadioHeldOutput';
import { getAllRadioTaskRecordsHeldWithLift } from '@src/domain.operations/radio/record/getAllRadioTaskRecordsHeldWithLift';
import { getCliArgs } from '@src/infra/cli';
import { withStopHookNeverBlocks } from '@src/infra/cli/withStopHookNeverBlocks';

const schemaOfArgs = z.object({
  named: z.object({
    // help flag
    help: z.boolean().optional(),
    h: z.boolean().optional(),

    // optional: hook mode
    when: z.enum(['hook.onStop']).optional(),

    // rhachet passthrough args (optional, ignored)
    repo: z.string().optional(),
    role: z.string().optional(),
    skill: z.string().optional(),
    s: z.string().optional(),
  }),
  ordered: z.array(z.string()).default([]),
});

const HELP_TEXT = `
🦫 let's check the meter...

🎙️ radio.task.held --help
   ├─ radio.task.held is deprecated; run \`rhx radio.task.queue get\` instead (stop hook: \`rhx radio.task.queue get --when hook.onStop\`)
   ├─ usage
   │  ├─ radio.task.held                       list the tasks held for the radio
   │  └─ radio.task.held --when hook.onStop    one-line stop reminder (naught when none)
   │
   └─ options
      ├─ --when      hook.onStop: print one claude systemMessage line, or naught when none held
      └─ --help, -h  show this help
`.trim();

const _cliRadioTaskHeld = async (): Promise<void> => {
  const { named } = getCliArgs({ schema: schemaOfArgs });

  // handle --help flag
  if (named.help || named.h) {
    console.log(HELP_TEXT);
    return;
  }

  // the new name, atop the list (stdout: `rhachet run` drops stderr on exit 0); a stop hook stays quiet
  const mode = named.when === 'hook.onStop' ? 'hook.onStop' : 'list';
  if (mode === 'list')
    console.log(
      'radio.task.held is deprecated; run `rhx radio.task.queue get` instead',
    );

  // read the held records and the gate of each, from local files only
  const held = await getAllRadioTaskRecordsHeldWithLift(
    {},
    { cwd: process.cwd(), homeDir: process.env.HOME },
  );

  // list mode: the tree
  const output = asRadioHeldOutput({ held, mode });
  if (mode === 'list') {
    console.log(output);
    return;
  }

  // stop mode: one line to the human via claude's systemMessage, or naught; the rename rides
  // inside that one line, so a hook still wired to the old name learns of its retirement
  if (output === null) return;
  console.log(
    JSON.stringify({
      systemMessage: `${output} · radio.task.held is deprecated; run \`rhx radio.task.queue get --when hook.onStop\` instead`,
    }),
  );
};

export const cliRadioTaskHeld = withStopHookNeverBlocks(_cliRadioTaskHeld);
