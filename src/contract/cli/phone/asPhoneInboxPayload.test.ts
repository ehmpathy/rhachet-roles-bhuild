import { MalfunctionError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { PhoneGroup } from '@src/domain.objects/phone/PhoneGroup';
import { PhoneTextRecord } from '@src/domain.objects/phone/PhoneTextRecord';

import { asPhoneInboxPayload } from './asPhoneInboxPayload';

const RECORD = {
  uuid: '3c92356c-0000-4000-8000-000000000001',
  way: 'in',
  group: null,
  re: null,
  from: 'phone://grove=bert-laptop/tree=notebook/clone=director',
  to: 'phone://grove=grove-sandpine-v20260901/tree=svc-lessons/clone=mechanic',
  what: 'swell at noon',
  status: 'QUEUED',
  reason: null,
};

describe('asPhoneInboxPayload', () => {
  given('[case1] each verb with the shape it carries', () => {
    when('[t0] a put of a text is parsed', () => {
      then('it returns the text, cast to a record', () => {
        const payload = asPhoneInboxPayload({
          verb: 'put',
          raw: JSON.stringify({
            kind: 'text',
            grove: 'bert-laptop',
            record: RECORD,
          }),
        });
        expect(payload.verb).toEqual('put');
        expect('record' in payload && payload.record).toBeInstanceOf(
          PhoneTextRecord,
        );
      });
    });

    when(
      '[t1] a put of a group is parsed, the second shape that shares the verb put',
      () => {
        then('it returns the group, cast to a group', () => {
          const payload = asPhoneInboxPayload({
            verb: 'put',
            raw: JSON.stringify({
              kind: 'group',
              grove: 'bert-laptop',
              clone: 'mechanic',
              group: {
                uuid: 'a1b2c3d4-0000-4000-8000-000000000002',
                members: ['a', 'b'],
              },
            }),
          });
          expect('group' in payload && payload.group).toBeInstanceOf(
            PhoneGroup,
          );
        });
      },
    );

    when('[t2] a del and a set are parsed', () => {
      then('each returns its own fields', () => {
        const del = asPhoneInboxPayload({
          verb: 'del',
          raw: JSON.stringify({
            grove: 'bert-laptop',
            clone: 'mechanic',
            uuid: RECORD.uuid,
          }),
        });
        expect(del).toEqual({
          verb: 'del',
          grove: 'bert-laptop',
          clone: 'mechanic',
          uuid: RECORD.uuid,
        });
        const set = asPhoneInboxPayload({
          verb: 'set',
          raw: JSON.stringify({
            grove: 'bert-laptop',
            clone: 'director',
            uuid: RECORD.uuid,
            status: 'DELIVERED',
            reason: null,
          }),
        });
        expect(set).toMatchObject({ verb: 'set', status: 'DELIVERED' });
      });
    });
  });

  given('[case2] a payload this phone does not know', () => {
    when('[t0] the body is not json, or holds an unknown shape', () => {
      then('each is a named malfunction', async () => {
        const notJson = await getError(() =>
          asPhoneInboxPayload({ verb: 'put', raw: 'surf?' }),
        );
        expect(notJson).toBeInstanceOf(MalfunctionError);
        const unknownKind = await getError(() =>
          asPhoneInboxPayload({
            verb: 'put',
            raw: JSON.stringify({ kind: 'board', grove: 'x' }),
          }),
        );
        expect(unknownKind).toBeInstanceOf(MalfunctionError);
        expect(unknownKind.message).toContain(
          'phone inbox payload has an unknown shape',
        );
      });
    });
  });
});
