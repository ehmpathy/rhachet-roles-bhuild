import { isRadioFateBehindHalt } from './isRadioFateBehindHalt';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

/**
 * .what = the lines that place a record against a halt: it hit the wall, or waits behind it
 * .why = a rate limit or an outage holds the whole line, so the fix is a wait, never an
 *        amend; the reader must see which record met the wall and which never left (case=6)
 */
export const asRadioHaltLines = (input: {
  fate: RadioTaskRecordFate;
}): string[] => {
  if (input.fate.fate !== 'held') return [];
  if (input.fate.halt)
    return [
      'halted: the line stops here',
      'wait, then: rhx radio.task.queue drain',
    ];
  if (isRadioFateBehindHalt({ fate: input.fate }))
    return ['behind the halt: unsent, still in line'];
  return [];
};
