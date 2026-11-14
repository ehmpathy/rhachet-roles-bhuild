import { RadioChannel } from '@src/domain.objects/RadioChannel';

/**
 * .what = github's cap on one issue or pr comment body, in characters
 * .why = a body past it fails upstream on every replay, so it is refused before it is recorded
 */
const GH_COMMENT_BODY_CHARS_MAX = 65536;

/**
 * .what = the refusal for a comment body its channel can never accept, or null
 * .why = a body github refuses would fault on every drain and wait forever; refused at the
 *        boundary, before it is recorded, it never enters the queue
 *
 * .note = os.fileops appends to a local log, which has no cap
 */
export const asCommentBodyLengthRefusal = (input: {
  via: RadioChannel;
  body: string;
}): string | null => {
  // only github caps a comment body
  if (input.via !== RadioChannel.GH_ISSUES) return null;
  if (input.body.length <= GH_COMMENT_BODY_CHARS_MAX) return null;
  return `--comment is ${input.body.length} characters; github caps a comment at ${GH_COMMENT_BODY_CHARS_MAX}. trim the body, or split it across comments`;
};
