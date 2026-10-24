import { asPhoneOutput } from './asPhoneOutput';

/**
 * .what = the `phone.contacts set | del` output: what changed, and how many contacts remain
 * .note = a peer named twice is one peer; the drop is named, never silent, as `phone.text set`
 *         names a repeated --to
 */
export const asPhoneContactsSetOutput = (input: {
  mode: 'grant' | 'revoke';
  address: string;
  contacts: string[];
  isChanged: boolean;
  duplicates: number;
}): string =>
  asPhoneOutput({
    vibe: input.isChanged
      ? VIBE_OF_CHANGE[input.mode]
      : VIBE_OF_NO_CHANGE[input.mode],
    root: `phone.contacts ${VERB_OF_MODE[input.mode]}`,
    nodes: [
      {
        text: `${input.isChanged ? LABEL_OF_CHANGE[input.mode] : LABEL_OF_NO_CHANGE[input.mode]}: ${input.address}`,
      },
      { text: `contacts: ${input.contacts.length}` },
      ...(input.duplicates > 0
        ? [
            {
              text: `${input.duplicates} repeated --address dropped; each peer is one ${input.mode}`,
            },
          ]
        : []),
    ],
  });

const VIBE_OF_CHANGE = {
  grant: 'new friend in the pond',
  revoke: 'waved them off',
} as const;

const VIBE_OF_NO_CHANGE = {
  grant: 'no change, the pond already holds that',
  revoke: 'no change, they were not in the pond',
} as const;

const LABEL_OF_CHANGE = { grant: 'granted', revoke: 'revoked' } as const;

// a no-op names the state found, never an act that did not happen
const LABEL_OF_NO_CHANGE = {
  grant: 'already a contact',
  revoke: 'not a contact',
} as const;

const VERB_OF_MODE = { grant: 'set', revoke: 'del' } as const;
