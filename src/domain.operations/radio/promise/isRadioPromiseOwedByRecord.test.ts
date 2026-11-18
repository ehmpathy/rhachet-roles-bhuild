import { given, then, when } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';

import { isRadioPromiseOwedByRecord } from './isRadioPromiseOwedByRecord';

const LITERAL = 'task-to-public-repo-is-anonymized';

const TEST_CASES = [
  {
    description: 'a gh.issues create with text and no promise',
    record: {
      via: RadioChannel.GH_ISSUES,
      title: 't',
      description: 'b',
      promise: null,
    },
    promiseOverride: null,
    expect: true,
  },
  {
    description: 'an update that sets a title only',
    record: {
      via: RadioChannel.GH_ISSUES,
      title: 't',
      description: null,
      promise: null,
    },
    promiseOverride: null,
    expect: true,
  },
  {
    description: 'an update that sets a body only',
    record: {
      via: RadioChannel.GH_ISSUES,
      title: null,
      description: 'b',
      promise: null,
    },
    promiseOverride: null,
    expect: true,
  },
  {
    description: 'a status-only update',
    record: {
      via: RadioChannel.GH_ISSUES,
      title: null,
      description: null,
      promise: null,
    },
    promiseOverride: null,
    expect: false,
  },
  {
    description: 'an os.fileops record with text',
    record: {
      via: RadioChannel.OS_FILEOPS,
      title: 't',
      description: 'b',
      promise: null,
    },
    promiseOverride: null,
    expect: false,
  },
  {
    description: 'the literal promise on the record',
    record: {
      via: RadioChannel.GH_ISSUES,
      title: 't',
      description: 'b',
      promise: LITERAL,
    },
    promiseOverride: null,
    expect: false,
  },
  {
    description: 'the literal promise as the drain override',
    record: {
      via: RadioChannel.GH_ISSUES,
      title: 't',
      description: 'b',
      promise: null,
    },
    promiseOverride: LITERAL,
    expect: false,
  },
  {
    description: 'another promise string on a hand-edited record',
    record: {
      via: RadioChannel.GH_ISSUES,
      title: 't',
      description: 'b',
      promise: 'trust me',
    },
    promiseOverride: null,
    expect: true,
  },
];

describe('isRadioPromiseOwedByRecord', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the record is checked', () => {
        then(`it reads ${thisCase.expect ? 'owed' : 'not owed'}`, () => {
          expect(
            isRadioPromiseOwedByRecord({
              record: thisCase.record,
              promiseOverride: thisCase.promiseOverride,
            }),
          ).toEqual(thisCase.expect);
        });
      });
    }),
  );
});
