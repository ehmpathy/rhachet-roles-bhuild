import type { RadioRepoVisibility } from '../../../domain.objects/RadioRepoVisibility';

/**
 * .what = the visibility gh reported, read from `gh repo view --json visibility` stdout
 * .why = only an exact PRIVATE or INTERNAL may let unvouched text through, so any other answer
 *        (malformed json, an absent field, an unknown value, a case change) reads as unreadable,
 *        and names its own cause so the hold never says "unreadable ()"
 */
export const asGhRepoVisibilityFromJson = (input: {
  stdout: string;
}):
  | { visibility: Exclude<RadioRepoVisibility, 'unreadable'> }
  | { visibility: 'unreadable'; cause: string } => {
  // parse the json, or name that it would not parse
  const parsed = ((): unknown => {
    try {
      return JSON.parse(input.stdout);
    } catch (error) {
      // only a parse miss is an answer here (unreadable, with its cause); any other throw is a defect
      if (!(error instanceof SyntaxError)) throw error;
      return undefined;
    }
  })();
  if (parsed === undefined)
    return { visibility: 'unreadable', cause: 'visibility json unparsable' };

  // read the field, or name that it is absent
  const value =
    typeof parsed === 'object' && parsed !== null && 'visibility' in parsed
      ? parsed.visibility
      : undefined;
  if (value === undefined || value === null || value === '')
    return { visibility: 'unreadable', cause: 'visibility field absent' };

  // map the exact enum; all else is unknown
  if (value === 'PUBLIC') return { visibility: 'public' };
  if (value === 'PRIVATE') return { visibility: 'private' };
  if (value === 'INTERNAL') return { visibility: 'internal' };
  return {
    visibility: 'unreadable',
    cause: `visibility value ${JSON.stringify(value)} unknown`,
  };
};
