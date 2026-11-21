import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

import { setRadioTaskRecordDropped } from './setRadioTaskRecordDropped';
import { setRadioTaskRecordFromPush } from './setRadioTaskRecordFromPush';
import { setRadioTaskRecordHeld } from './setRadioTaskRecordHeld';

/**
 * .what = an update push to one issue of a public repo
 * .why = an update is keyed (repo, exid, status), so a text edit and a claim are two records
 */
const asPush = (input: {
  exid: string;
  status: RadioTaskStatus | null;
  description: string | null;
}) => ({
  repo: new RadioTaskRepo({ owner: 'sandpine', name: 'surf-forecast-public' }),
  via: RadioChannel.GH_ISSUES,
  auth: null,
  idem: null,
  title: null,
  description: input.description,
  exid: input.exid,
  status: input.status,
  promise: null,
});

/**
 * .what = a temp repo where the first push is held for its promise, and a second push follows it
 * .why = the drop of the first must count only the updates that truly wait behind it
 */
const genSceneHeldThenBehind = (input: {
  slug: string;
  ahead: { exid: string; status: RadioTaskStatus | null };
  behind: { exid: string; status: RadioTaskStatus };
}) => {
  const cwd = genTempDir({ slug: input.slug, git: true });
  const dir = `${cwd}/.behavior/.radio`;
  const { record: ahead } = setRadioTaskRecordFromPush(
    {
      push: asPush({
        ...input.ahead,
        description: 'forecast widget shows swell height per spot',
      }),
    },
    { dir, cwd },
  );
  setRadioTaskRecordHeld({
    record: ahead,
    dir,
    change: { reason: 'public-repo:unpromised' },
    detail: null,
    halt: false,
  });
  setRadioTaskRecordFromPush(
    { push: asPush({ ...input.behind, description: null }) },
    { dir, cwd },
  );
  return { cwd, ahead };
};

describe('setRadioTaskRecordDropped', () => {
  given(
    '[case1] a text-only edit held for its promise, a status-only claim on the same issue after it',
    () => {
      const scene = useBeforeAll(async () =>
        genSceneHeldThenBehind({
          slug: 'radio-record-dropped-text-only',
          ahead: { exid: '5', status: null },
          behind: { exid: '5', status: RadioTaskStatus.CLAIMED },
        }),
      );

      when('[t0] queue del drops the held edit', () => {
        const result = useThen('the drop is written', async () =>
          setRadioTaskRecordDropped(
            { key: scene.ahead.key, why: 'the text names a private route' },
            { cwd: scene.cwd },
          ),
        );

        then(
          'no update is counted behind it: the claim never waited on text',
          () => {
            expect(result.behind).toEqual(0);
            expect(result.deliverNeedsClaim).toBeNull();
          },
        );
      });

      when('[t1] queue del runs a second time', () => {
        const result = useThen('the drop converges', async () =>
          setRadioTaskRecordDropped(
            { key: scene.ahead.key, why: 'the text names a private route' },
            { cwd: scene.cwd },
          ),
        );

        then(
          'it reports the same count, from content, never from the rewritten reason',
          () => {
            expect(result.isAlreadyDropped).toEqual(true);
            expect(result.behind).toEqual(0);
          },
        );
      });
    },
  );

  given(
    '[case2] a claim with text held for its promise, a deliver on the same issue after it',
    () => {
      const scene = useBeforeAll(async () =>
        genSceneHeldThenBehind({
          slug: 'radio-record-dropped-claim-text',
          ahead: { exid: '6', status: RadioTaskStatus.CLAIMED },
          behind: { exid: '6', status: RadioTaskStatus.DELIVERED },
        }),
      );

      when('[t0] queue del drops the held claim', () => {
        const result = useThen('the drop is written', async () =>
          setRadioTaskRecordDropped(
            { key: scene.ahead.key, why: 'the text names a private route' },
            { cwd: scene.cwd },
          ),
        );

        then(
          'the deliver is counted behind it: a status step has order dependents',
          () => {
            expect(result.behind).toEqual(1);
          },
        );

        then('the deliver is named as one that needs the claim first', () => {
          expect(result.deliverNeedsClaim?.status).toEqual(
            RadioTaskStatus.DELIVERED,
          );
        });
      });
    },
  );
});
