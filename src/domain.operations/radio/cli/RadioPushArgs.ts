/**
 * .what = the flags of one `radio.task.push`, as the caller typed them
 * .why = the promise nudge reprints the exact command with `--promise` added; it must carry
 *        every flag the push took, so the contract's schema and the reprint share this shape
 *
 * .note = description is the raw value: `@stdin` stays `@stdin`, so the reprint asks for a
 *         re-pipe rather than echo a body that came by pipe
 */
export interface RadioPushArgs {
  via: string;
  into: string;
  exid: string | null;
  status: string | null;
  title: string | null;
  description: string | null;
  idem: string | null;
  auth: string | null;
}
