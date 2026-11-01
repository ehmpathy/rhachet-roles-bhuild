/**
 * .what = the grammar a radio task record key must fit: lowercase letters, digits, and dashes
 * .why = one grammar for every reader of a key — the dao that names a file by it, and each
 *        reason that names a record by it (`behind:<key> (same issue #N)`) — so the two can
 *        never drift apart
 *
 * .note = a minted key is 16 lowercase hex chars (asRadioTaskRecordKey); the grammar is wider
 *         so a hand-named record (`legacy-a`) still reads, yet a slash or a dot can never fit,
 *         so a key can never climb out of its record dir
 * .note = the source holds no anchors, so a reason pattern can embed it; anchor it to match a
 *         whole key (RADIO_TASK_RECORD_KEY_PATTERN)
 */
export const RADIO_TASK_RECORD_KEY_GRAMMAR = '[a-z0-9][a-z0-9-]*';

/**
 * .what = the grammar, anchored: does a whole string fit as a record key
 */
export const RADIO_TASK_RECORD_KEY_PATTERN = new RegExp(
  `^${RADIO_TASK_RECORD_KEY_GRAMMAR}$`,
);
