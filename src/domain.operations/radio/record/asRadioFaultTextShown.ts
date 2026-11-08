import { asRadioErrorTextSansClass } from './asRadioErrorTextSansClass';
import { isRadioAuthBothFailedDetail } from './isRadioAuthBothFailedDetail';

/**
 * .what = the text a `fault:` or `fix it:` row shows for one line of a fault
 * .why = the both-failed fault (#513) renders as a tree beneath its row, so its class header
 *        would read twice; every other fault keeps the bytes it rendered before #513 (F7)
 */
export const asRadioFaultTextShown = (input: {
  line: string;
  detail: string | null;
}): string =>
  isRadioAuthBothFailedDetail({ detail: input.detail })
    ? asRadioErrorTextSansClass({ line: input.line })
    : input.line;
