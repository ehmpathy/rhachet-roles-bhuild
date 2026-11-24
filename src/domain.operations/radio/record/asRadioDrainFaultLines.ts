import { asRadioNestedLines } from '../asRadioNestedLines';
import { asRadioFaultCheckedLines } from './asRadioFaultCheckedLines';
import { asRadioFaultDetailLine } from './asRadioFaultDetailLine';

/**
 * .what = the fault lines of a held drain row: the fault's first line, and for an auth miss,
 *         the spots it checked nested beneath
 * .why = a miss names each spot it checked and what each held; a drain row that showed only the
 *        headline (`found no ehmpath token`) hid the why, such as a human email on the box
 */
export const asRadioDrainFaultLines = (input: {
  detail: string | null;
}): string[] => {
  const faultLine = asRadioFaultDetailLine({ detail: input.detail });
  if (!faultLine) return [];

  // an auth miss nests its checked spots; any other fault keeps its one line
  const checked = asRadioFaultCheckedLines({ detail: input.detail });
  if (checked.length === 0) return [faultLine];
  return [
    asRadioNestedLines({
      head: faultLine,
      lines: [asRadioNestedLines({ head: 'checked', lines: checked })],
    }),
  ];
};
