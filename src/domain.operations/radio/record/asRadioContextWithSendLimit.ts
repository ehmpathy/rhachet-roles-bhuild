import type { RadioChannel } from '@src/domain.objects/RadioChannel';
import {
  type ContextDispatchRadio,
  isContextGithubAuth,
  type RadioGhSendLimit,
} from '@src/domain.objects/RadioContext';

/**
 * .what = a record's channel context, with this send's time bound attached
 * .why = the gh dao cuts each call to what the send has left; a channel with no gh calls
 *        has no bound to carry
 */
export const asRadioContextWithSendLimit = (input: {
  radioContext: ContextDispatchRadio<RadioChannel>;
  limit: RadioGhSendLimit;
}): ContextDispatchRadio<RadioChannel> => {
  if (!isContextGithubAuth(input.radioContext)) return input.radioContext;
  return {
    ...input.radioContext,
    github: { ...input.radioContext.github, send: input.limit },
  };
};
