import { given, then, when } from 'test-fns';

import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

import { asRadioTaskRecordKey } from './asRadioTaskRecordKey';

describe('asRadioTaskRecordKey', () => {
  const repo = new RadioTaskRepo({ owner: 'ehmpathy', name: 'rhachet' });
  const repoOther = new RadioTaskRepo({ owner: 'sandpine', name: 'rhachet' });

  given('[case1] a create', () => {
    when('[t0] the same repo and title are keyed twice', () => {
      then('the keys match — a repeat push lands on its record', () => {
        const keyA = asRadioTaskRecordKey({
          repo,
          title: 'fix flaky test',
          exid: null,
          status: null,
        });
        const keyB = asRadioTaskRecordKey({
          repo,
          title: 'fix flaky test',
          exid: null,
          status: null,
        });
        expect(keyA).toEqual(keyB);
      });
    });

    when('[t1] the title or the repo differs', () => {
      then('the keys differ', () => {
        const key = asRadioTaskRecordKey({
          repo,
          title: 'fix flaky test',
          exid: null,
          status: null,
        });
        expect(
          asRadioTaskRecordKey({
            repo,
            title: 'other',
            exid: null,
            status: null,
          }),
        ).not.toEqual(key);
        expect(
          asRadioTaskRecordKey({
            repo: repoOther,
            title: 'fix flaky test',
            exid: null,
            status: null,
          }),
        ).not.toEqual(key);
      });
    });

    when('[t2] the key is read as a file name part', () => {
      then('it is 16 hex characters', () => {
        expect(
          asRadioTaskRecordKey({
            repo,
            title: 'a/b c',
            exid: null,
            status: null,
          }),
        ).toMatch(/^[0-9a-f]{16}$/);
      });
    });
  });

  given('[case2] an update', () => {
    when('[t0] a claim and a deliver of one exid are keyed', () => {
      then('the keys differ — each move is its own record', () => {
        const claim = asRadioTaskRecordKey({
          repo,
          title: null,
          exid: '412',
          status: RadioTaskStatus.CLAIMED,
        });
        const deliver = asRadioTaskRecordKey({
          repo,
          title: null,
          exid: '412',
          status: RadioTaskStatus.DELIVERED,
        });
        expect(claim).not.toEqual(deliver);
      });
    });

    when('[t1] the same claim is keyed twice', () => {
      then('the keys match', () => {
        const keyA = asRadioTaskRecordKey({
          repo,
          title: null,
          exid: '412',
          status: RadioTaskStatus.CLAIMED,
        });
        const keyB = asRadioTaskRecordKey({
          repo,
          title: 'any',
          exid: '412',
          status: RadioTaskStatus.CLAIMED,
        });
        expect(keyA).toEqual(keyB);
      });
    });
  });
});
