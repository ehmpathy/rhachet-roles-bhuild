/**
 * .what = cli entry point for radio.task.comment skill
 * .why  = a clone or human comments on an extant task, issue, or pr through the radio — behind
 *         `radio.uses`, held when blocked — so no github write path sits beside the gate
 *
 * .note = the comment is recorded first, then meets the gate on the path radio.task.push takes
 *         (setRadioTaskRecordThenDrain): a shut gate holds it QUEUED (exit 2); an open gate delivers
 *         the held backlog first, then this comment. a body already on the thread is kept, never
 *         posted twice
 *
 * options:
 *   --via       channel: gh.issues or os.fileops (required)
 *   --into      target repo: @this (current git repo) or owner/name (required)
 *   --exid      the task, issue, or pr number to comment on (required)
 *   --comment   the comment body (required; supports @stdin)
 *   --auth      as-human | as-robot:via-keyrack(owner) | as-robot:env(VAR) | as-robot:shx(cmd)
 *   --help      show usage and exit
 *
 * usage:
 *   radio.task.comment --via gh.issues --into owner/repo --exid 489 --comment "the cure is wrong; see #490"
 *   cat note.md | radio.task.comment --via gh.issues --into @this --exid 489 --comment @stdin
 */

import { ConstraintError } from 'helpful-errors';
import { z } from 'zod';

import { IdempotencyMode } from '@src/domain.objects/IdempotencyMode';
import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { asCommentBodyLengthRefusal } from '@src/domain.operations/radio/cli/asCommentBodyLengthRefusal';
import { asCommentPushFlagsRefusal } from '@src/domain.operations/radio/cli/asCommentPushFlagsRefusal';
import { asRadioTaskExidForChannel } from '@src/domain.operations/radio/cli/asRadioTaskExidForChannel';
import { getOneRadioTaskRepoFromCliArg } from '@src/domain.operations/radio/cli/getOneRadioTaskRepoFromCliArg';
import { setRadioTaskRecordFromComment } from '@src/domain.operations/radio/record/setRadioTaskRecordFromComment';
import { getCliArgs } from '@src/infra/cli';
import { getOneArgOrStdinText } from '@src/infra/cli/getOneArgOrStdinText';

import { setRadioTaskRecordThenDrain } from './setRadioTaskRecordThenDrain';

// ────────────────────────────────────────────────────────────────────
// schema
// ────────────────────────────────────────────────────────────────────

const schemaOfArgs = z.object({
  named: z.object({
    // help flag
    help: z.boolean().optional(),
    h: z.boolean().optional(),

    // required: channel, target, thread, body
    via: z.nativeEnum(RadioChannel).optional(),
    into: z.string().optional(),
    exid: z.string().optional(),
    comment: z.string().optional(),

    // optional: auth mode
    auth: z.string().optional(),

    // optional: idempotency mode; a comment is findsert only
    idem: z.nativeEnum(IdempotencyMode).optional(),

    // flags this skill does not read; declared so they are refused, never dropped
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),

    // rhachet passthrough args (optional, ignored)
    repo: z.string().optional(),
    role: z.string().optional(),
    skill: z.string().optional(),
    s: z.string().optional(),
  }),
  ordered: z.array(z.string()).default([]),
});

// ────────────────────────────────────────────────────────────────────
// exported CLI entry point
// ────────────────────────────────────────────────────────────────────

const HELP_TEXT = `
🦫 let's check the meter...

🎙️ radio.task.comment --help
   ├─ usage
   │  ├─ rhx radio.task.comment --via gh.issues --into owner/repo --exid 489 --comment "..."
   │  ├─ cat note.md | rhx radio.task.comment --via gh.issues --into @this --exid 489 --comment @stdin
   │  └─ rhx radio.task.comment --via os.fileops --into @this --exid 123 --comment "..."
   │
   ├─ held, never lost
   │  ├─ every comment is recorded first, into $route/.radio/ (or .behavior/.radio/)
   │  ├─ a shut gate or an upstream fault holds it QUEUED, exit 2
   │  ├─ the next push or comment that gets through delivers the backlog first, oldest first
   │  ├─ see what waits: rhx radio.task.queue get
   │  └─ lift a shut gate (human): rhx radio.uses allow
   │
   ├─ posted once
   │  ├─ the task or thread is read first; a comment with the exact body already there is kept
   │  └─ body, title, and status of the task or thread are never touched
   │
   └─ options
      ├─ --via         channel: gh.issues or os.fileops (required)
      ├─ --into        target: @this (current repo) or owner/repo (required)
      ├─ --exid        the task, issue, or pr number to comment on (required)
      ├─ --comment     the comment body (required; supports @stdin)
      ├─ --auth        mode: as-robot:via-keyrack(owner) | as-robot:env(VAR) | as-robot:shx(cmd) | as-human
      ├─ --idem        findsert, the only mode; upsert is refused, since a comment is append-only
      └─ --help, -h    show this help
`.trim();

export const cliRadioTaskComment = async (): Promise<void> => {
  const { named } = getCliArgs({ schema: schemaOfArgs });

  // handle --help flag
  if (named.help || named.h) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  // refuse flags this skill does not read, before any other check, so the fix names the right skill;
  // a silent drop would read as done
  const pushFlagsRefusal = asCommentPushFlagsRefusal({
    title: named.title,
    description: named.description,
    status: named.status,
    via: named.via,
    into: named.into,
    exid: named.exid,
  });
  if (pushFlagsRefusal !== null) throw new ConstraintError(pushFlagsRefusal);

  // validate the required args; each fix rides in the message, since metadata prints as raw json
  if (!named.via)
    throw new ConstraintError(
      '--via is required; specify a channel: --via gh.issues or --via os.fileops',
    );
  if (!named.into)
    throw new ConstraintError(
      '--into is required; use --into @this (current git repo) or --into owner/name',
    );
  if (!named.exid)
    throw new ConstraintError(
      '--exid is required; name the task, issue, or pr number to comment on: --exid <n>',
    );

  // a comment is append-only: findsert is its one mode, always on
  if (named.idem === IdempotencyMode.UPSERT)
    throw new ConstraintError(
      '--idem upsert does not apply to a comment, which is append-only; a comment is always findsert (the exact body already recorded is kept). omit --idem',
    );

  // the exid must be able to name a thread on its channel
  const exid = asRadioTaskExidForChannel({ via: named.via, exid: named.exid });

  // the body: required, and not blank
  const body = getOneArgOrStdinText({ raw: named.comment ?? null });
  if (body === null)
    throw new ConstraintError(
      '--comment is required; pass the body, or pipe it via --comment @stdin',
    );
  if (body.trim() === '')
    throw new ConstraintError(
      '--comment is empty; a comment needs a body. pass it, or pipe it via --comment @stdin',
    );

  // a body the channel can never accept is refused before it is recorded, so it never waits forever
  const lengthRefusal = asCommentBodyLengthRefusal({ via: named.via, body });
  if (lengthRefusal !== null) throw new ConstraintError(lengthRefusal);

  // derive repo from --into arg
  const repo = await getOneRadioTaskRepoFromCliArg({
    arg: named.into,
    argName: '--into',
    errorContext: {
      notFoundMessage: '--into is required',
      hint: 'use --into @this (current git repo) or --into owner/name',
    },
  });

  // transcribe, then meet the gate and drain, via the path every radio write shares
  const via = named.via;
  await setRadioTaskRecordThenDrain({
    transcribe: (home) =>
      setRadioTaskRecordFromComment(
        {
          comment: { repo, via, auth: named.auth ?? null, exid, body },
        },
        home,
      ),
    authTyped: named.auth ?? null,
  });
};
