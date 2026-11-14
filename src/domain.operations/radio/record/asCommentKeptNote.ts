import { RadioChannel } from '@src/domain.objects/RadioChannel';

/**
 * .what = the note beside a kept comment, in the words of its own channel
 * .why = a gh comment sits on a thread; an os.fileops comment sits in a log beside its task. one
 *        note for both would name a thread where none is. the verb stays `posted` on both, as the
 *        outcome line above it reads `posted:` on both
 */
export const asCommentKeptNote = (input: { via: string }): string =>
  input.via === RadioChannel.OS_FILEOPS
    ? 'already in the comment log — naught posted'
    : 'already on the thread — naught posted';
