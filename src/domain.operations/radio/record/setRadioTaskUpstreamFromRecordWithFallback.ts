import type { RadioChannel } from '@src/domain.objects/RadioChannel';
import {
  type ContextDispatchRadio,
  isContextGithubAuth,
  type RadioGhSendLimit,
} from '@src/domain.objects/RadioContext';
import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { asRadioAuthBothFailedError } from '@src/domain.operations/radio/auth/asRadioAuthBothFailedError';
import { asRadioAuthBotMiss } from '@src/domain.operations/radio/auth/asRadioAuthBotMiss';
import { getOneGithubAuthFallback } from '@src/domain.operations/radio/auth/getOneGithubAuthFallback';
import type { RadioAuthFallback } from '@src/domain.operations/radio/auth/RadioAuthFallback';

import { asRadioContextWithSendLimit } from './asRadioContextWithSendLimit';
import { asRadioUpstreamReason } from './asRadioUpstreamReason';
import { isRadioReplayRefusal } from './isRadioReplayRefusal';
import type { ShellExecutor } from './ShellExecutor';
import { setRadioTaskUpstreamFromRecord } from './setRadioTaskUpstreamFromRecord';

type SendResult = Awaited<ReturnType<typeof setRadioTaskUpstreamFromRecord>>;

/**
 * .what = the auth refusal a send fault names (401, or a 403 write refusal), or null
 * .why = only a refused credential earns a resend under another; a rate limit, an outage,
 *        or any other fault never does
 */
const asRadioAuthRefusal = (input: {
  send: SendResult;
}): 'upstream:401' | 'upstream:access' | null => {
  if (!('fault' in input.send)) return null;
  if (isRadioReplayRefusal({ error: input.send.fault })) return null;
  const reason = asRadioUpstreamReason({ message: input.send.faultText });
  if (reason === 'upstream:401' || reason === 'upstream:access') return reason;
  return null;
};

/**
 * .what = send one record upstream; under the default auth, resend once under the ambient
 *         credential when github refuses the ehmpath bot token
 * .why = the fallback after a refusal must live beside the send, so push and drain take it
 *        the same way (#513); delivery reuses the extant findsert, so a resend never doubles
 *
 * .note = a send already under the ambient credential (the bot token was absent) is never
 *         resent; its refusal names both credentials. a chosen auth is never resent
 * .note = faultText stays the last send's own text, so the held reason reads as that refusal
 */
export const setRadioTaskUpstreamFromRecordWithFallback = async (
  input: {
    record: RadioTaskRecord;
    radioContext: ContextDispatchRadio<RadioChannel>;
    fallback: RadioAuthFallback | null;
    isAuthDefault: boolean;
    limit: RadioGhSendLimit;
  },
  context: { env: NodeJS.ProcessEnv; shx: ShellExecutor },
): Promise<
  | {
      sent: Extract<SendResult, { sent: unknown }>['sent'];
      fallback: RadioAuthFallback | null;
    }
  | { fault: Error; faultText: string; sentUnder: RadioAuthFallback | null }
> => {
  // send under the auth derived for this record
  const send = await setRadioTaskUpstreamFromRecord(
    { record: input.record },
    asRadioContextWithSendLimit({
      radioContext: input.radioContext,
      limit: input.limit,
    }),
  );
  if ('sent' in send) return { sent: send.sent, fallback: input.fallback };

  // only a refused credential under the default auth earns another try
  // a fault that is no refusal stays as is; under the ambient credential it names that one
  const refusal = asRadioAuthRefusal({ send });
  if (!refusal || !input.isAuthDefault)
    return { ...send, sentUnder: input.fallback };
  const code = refusal === 'upstream:401' ? '401' : '403';

  // the ambient credential was refused too, after the bot token was absent
  if (input.fallback)
    return {
      fault: asRadioAuthBothFailedError({
        bot: input.fallback.bot,
        ambient: { state: 'refused', kind: input.fallback.kind, code },
      }),
      faultText: send.faultText,
      sentUnder: null,
    };

  // only a github send carries a credential to swap
  if (!isContextGithubAuth(input.radioContext))
    return { ...send, sentUnder: null };

  // github refused the bot token: fall back to the ambient credential, if the box holds one
  const bot = asRadioAuthBotMiss({ refusal });
  const ambient = await getOneGithubAuthFallback({ bot }, context);
  if ('fault' in ambient)
    return { fault: ambient.fault, faultText: send.faultText, sentUnder: null };

  // resend once under the ambient credential
  const resend = await setRadioTaskUpstreamFromRecord(
    { record: input.record },
    asRadioContextWithSendLimit({
      radioContext: {
        git: input.radioContext.git,
        github: { auth: { token: ambient.token, role: 'as-robot' } },
      },
      limit: input.limit,
    }),
  );
  if ('sent' in resend)
    return { sent: resend.sent, fallback: { kind: ambient.kind, bot } };

  // the ambient credential was refused too: name both
  const refusalAmbient = asRadioAuthRefusal({ send: resend });
  if (!refusalAmbient)
    return { ...resend, sentUnder: { kind: ambient.kind, bot } };
  return {
    sentUnder: null,
    fault: asRadioAuthBothFailedError({
      bot,
      ambient: {
        state: 'refused',
        kind: ambient.kind,
        code: refusalAmbient === 'upstream:401' ? '401' : '403',
      },
    }),
    faultText: resend.faultText,
  };
};
