import { asRadioFaultLineUpstream } from './asRadioFaultLineUpstream';

/**
 * .what = the one line of an upstream fault's own text a drain prints beside its code
 * .why = a code alone (`upstream:fault`) cannot tell a human why a record was set aside;
 *        the upstream's first words can (case=1: the gh error, verbatim)
 *
 * .note = only one line (asRadioFaultLineUpstream), so a multi-line stderr never floods the tree
 */
export const asRadioFaultDetailLine = (input: {
  detail: string | null;
}): string | null => {
  const lineUpstream = asRadioFaultLineUpstream({ text: input.detail });
  if (!lineUpstream) return null;
  return `fault: ${lineUpstream}`;
};
