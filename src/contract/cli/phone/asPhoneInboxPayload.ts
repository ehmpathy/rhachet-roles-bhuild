import { MalfunctionError } from 'helpful-errors';
import { z } from 'zod';

import { PhoneGroup } from '@src/domain.objects/phone/PhoneGroup';
import { PhoneTextRecord } from '@src/domain.objects/phone/PhoneTextRecord';
import { PHONE_TEXT_STATUSES } from '@src/domain.objects/phone/PhoneTextStatus';

const schemaOfRecord = z.object({
  uuid: z.string(),
  way: z.enum(['out', 'in']),
  group: z.string().nullable(),
  re: z.string().nullable(),
  from: z.string(),
  to: z.string(),
  what: z.string(),
  status: z.enum(PHONE_TEXT_STATUSES),
  reason: z.string().nullable(),
});

// a plain union: two shapes share the verb `put`, told apart by `kind`, and a discriminated
// union refuses a repeated discriminator value at its first parse
const schemaOfPayload = z.union([
  z.object({
    verb: z.literal('put'),
    kind: z.literal('text'),
    grove: z.string(),
    record: schemaOfRecord,
  }),
  z.object({
    verb: z.literal('put'),
    kind: z.literal('group'),
    grove: z.string(),
    clone: z.string(),
    group: z.object({ uuid: z.string(), members: z.array(z.string()).min(2) }),
  }),
  z.object({
    verb: z.literal('del'),
    grove: z.string(),
    clone: z.string(),
    uuid: z.string(),
  }),
  z.object({
    verb: z.literal('set'),
    grove: z.string(),
    clone: z.string(),
    uuid: z.string(),
    status: z.enum(PHONE_TEXT_STATUSES),
    reason: z.string().nullable(),
  }),
]);

/**
 * .what = the inbox payload, parsed by its verb, with its records cast to domain objects
 * .why = the payload crosses a grove as json; a shape this phone does not know is a malfunction
 *        of the caller's grove, named, never a guess
 */
export const asPhoneInboxPayload = (input: { verb: string; raw: string }) => {
  const json = ((): unknown => {
    try {
      return JSON.parse(input.raw);
    } catch (error) {
      if (error instanceof SyntaxError) return null;
      throw error;
    }
  })();
  const parsed = schemaOfPayload.safeParse(
    json && typeof json === 'object' ? { ...json, verb: input.verb } : null,
  );
  if (!parsed.success)
    throw new MalfunctionError('phone inbox payload has an unknown shape', {
      verb: input.verb,
      issues: parsed.error.issues.map((issue) => issue.message),
    });
  const payload = parsed.data;
  if (payload.verb === 'put' && payload.kind === 'text')
    return { ...payload, record: new PhoneTextRecord(payload.record) };
  if (payload.verb === 'put')
    return { ...payload, group: new PhoneGroup(payload.group) };
  return payload;
};
