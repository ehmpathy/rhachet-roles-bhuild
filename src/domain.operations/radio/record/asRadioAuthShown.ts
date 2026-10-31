import { asGithubAuthMode } from '@src/domain.operations/radio/auth/asGithubAuthMode';
import { RADIO_AUTH_DEFAULT } from '@src/domain.operations/radio/auth/RADIO_AUTH_DEFAULT';

import { isRadioRecordAuthReplayable } from './isRadioRecordAuthReplayable';

/**
 * .what = a record's stored auth, as safe to show a reader
 * .why = a record file is tracked and can arrive by a merge; a stored auth no drain replays may
 *        hold a planted shell command or a secret var name, so it shows as its kind alone, never
 *        as text a reader could paste back into a command
 *
 * .note = no stored auth names the default it resolves to, so a reader knows what a send uses
 */
export const asRadioAuthShown = (input: { auth: string | null }): string => {
  if (input.auth === null) return `default (${RADIO_AUTH_DEFAULT})`;
  if (isRadioRecordAuthReplayable({ auth: input.auth })) return input.auth;
  const mode = asGithubAuthMode({ auth: input.auth });
  if (mode.kind === 'unknown') return 'unrecognized, will not replay';
  return `as-robot:${mode.kind}(…), will not replay`;
};
