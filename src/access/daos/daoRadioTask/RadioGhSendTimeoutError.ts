import { MalfunctionError } from 'helpful-errors';

/**
 * .what = a gh call killed by its send bound: the call ran past its own timeout, or the
 *         send ran past its deadline before the call could start
 * .why = a stalled github is a wall every record behind would meet, so the drain must
 *        halt and hold the record (upstream:transient), never crash. a typed class lets
 *        the upstream fault allowlist admit it by kind, while a generic MalfunctionError
 *        stays a defect
 *
 * .note = the message names `etimedout`, which the reason classifier reads as transient
 */
export class RadioGhSendTimeoutError extends MalfunctionError {}
