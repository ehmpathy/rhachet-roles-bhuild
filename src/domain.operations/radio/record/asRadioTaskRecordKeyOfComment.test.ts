import { given, then, when } from 'test-fns';

import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';

import { asRadioTaskRecordKey } from './asRadioTaskRecordKey';
import { asRadioTaskRecordKeyOfComment } from './asRadioTaskRecordKeyOfComment';

const repo = new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' });

describe('asRadioTaskRecordKeyOfComment', () => {
  given('[case1] one body on one thread, twice', () => {
    when('[t0] both keys are computed', () => {
      then('they match, so a repeat lands on its extant record', () => {
        const keyA = asRadioTaskRecordKeyOfComment({
          repo,
          exid: '489',
          body: 'the cure is wrong',
        });
        const keyB = asRadioTaskRecordKeyOfComment({
          repo,
          exid: '489',
          body: 'the cure is wrong',
        });
        expect(keyA).toEqual(keyB);
        expect(keyA).toMatch(/^[0-9a-f]{16}$/);
      });
    });
  });

  given('[case2] a new body on the same thread', () => {
    when('[t0] both keys are computed', () => {
      then('they differ, so each body is its own record', () => {
        const keyA = asRadioTaskRecordKeyOfComment({
          repo,
          exid: '489',
          body: 'first note',
        });
        const keyB = asRadioTaskRecordKeyOfComment({
          repo,
          exid: '489',
          body: 'second note',
        });
        expect(keyA).not.toEqual(keyB);
      });
    });
  });

  given('[case3] the same body on another thread', () => {
    when('[t0] both keys are computed', () => {
      then('they differ', () => {
        const keyA = asRadioTaskRecordKeyOfComment({
          repo,
          exid: '489',
          body: 'note',
        });
        const keyB = asRadioTaskRecordKeyOfComment({
          repo,
          exid: '652',
          body: 'note',
        });
        expect(keyA).not.toEqual(keyB);
      });
    });
  });

  given('[case4] a comment and an update on the same issue', () => {
    when('[t0] both keys are computed', () => {
      then('they differ, so no push collides with a comment', () => {
        const comment = asRadioTaskRecordKeyOfComment({
          repo,
          exid: '489',
          body: '',
        });
        const update = asRadioTaskRecordKey({
          repo,
          title: null,
          exid: '489',
          status: null,
        });
        expect(comment).not.toEqual(update);
      });
    });
  });

  given('[case5] one body typed by hand and piped via @stdin', () => {
    when('[t0] both keys are computed', () => {
      then(
        'they match: a trailed newline or crlf is one comment, as the thread match reads it',
        () => {
          const typed = asRadioTaskRecordKeyOfComment({
            repo,
            exid: '489',
            body: 'line one\nline two',
          });
          const piped = asRadioTaskRecordKeyOfComment({
            repo,
            exid: '489',
            body: 'line one\r\nline two\n',
          });
          expect(piped).toEqual(typed);
        },
      );
    });
  });
});
