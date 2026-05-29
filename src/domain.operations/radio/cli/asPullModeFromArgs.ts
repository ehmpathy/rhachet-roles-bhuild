import { BadRequestError } from 'helpful-errors';

import type { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

/**
 * .what = discriminated union for pull operation mode
 * .why  = enables type-safe branch in orchestrator
 */
export type PullMode =
  | {
      kind: 'list';
      filter: { status: RadioTaskStatus } | null;
      limit: number | null;
    }
  | { kind: 'single'; ref: { exid: string } | { title: string } };

/**
 * .what = parse CLI args into pull mode
 * .why  = extracts mode determination decode-friction from orchestrator
 */
export const asPullModeFromArgs = (input: {
  list: boolean | null;
  exid: string | null;
  title: string | null;
  status: RadioTaskStatus | null;
  limit: number | null;
}): PullMode => {
  const isListMode = input.list === true;
  const isSingleMode = input.exid !== null || input.title !== null;

  // validate: must specify one mode
  if (!isListMode && !isSingleMode) {
    throw new BadRequestError(
      'specify --list or --exid/--title; use --list to list tasks or --exid/--title to fetch one',
      { hint: 'add --list to list tasks or --exid/--title to fetch one' },
    );
  }

  // validate: cannot specify both modes
  if (isListMode && isSingleMode) {
    throw new BadRequestError(
      'cannot use --list with --exid/--title; choose one mode',
      { hint: 'use --list alone or --exid/--title alone' },
    );
  }

  // return discriminated mode
  if (isListMode) {
    return {
      kind: 'list',
      filter: input.status ? { status: input.status } : null,
      limit: input.limit,
    };
  }

  // single mode: must have exid or title (validated above)
  return {
    kind: 'single',
    ref: input.exid ? { exid: input.exid } : { title: input.title! },
  };
};
