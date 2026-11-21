import {
  asGhIssueNumber,
  asOsFileopsPathSegment,
} from '@src/access/daos/daoRadioTask';
import { RadioChannel } from '@src/domain.objects/RadioChannel';

/**
 * .what = an exid checked for the channel it will name a thread on
 * .why = a gh thread is a number; an os.fileops task id is a path segment. the cli calls this one
 *        operation, so a new channel's grammar lands here, never in each cli
 */
export const asRadioTaskExidForChannel = (input: {
  via: RadioChannel;
  exid: string;
}): string => {
  if (input.via === RadioChannel.GH_ISSUES)
    return asGhIssueNumber({ exid: input.exid });
  return asOsFileopsPathSegment({ value: input.exid, of: 'exid' });
};
