import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

import { asRadioTaskRecordOrder } from './asRadioTaskRecordOrder';

/**
 * .what = a held update to a sandpine issue
 */
const genUpdate = (input: {
  key: string;
  heldSeq: number;
  exid: string;
  status: RadioTaskStatus | null;
  repoName?: string;
  via?: RadioChannel;
}) => ({
  record: new RadioTaskRecord({
    key: input.key,
    kind: 'update',
    repo: new RadioTaskRepo({
      owner: 'sandpine',
      name: input.repoName ?? 'svc-lessons',
    }),
    via: input.via ?? RadioChannel.GH_ISSUES,
    auth: null,
    idem: null,
    title: null,
    description: null,
    exid: input.exid,
    status: input.status,
    recordStatus: RadioTaskRecordStatus.QUEUED,
    reason: null,
    heldSeq: input.heldSeq,
    deliveredExid: null,
  }),
});

/**
 * .what = the keys of the records, in drain order
 */
const asKeysInOrder = (input: {
  records: ReturnType<typeof genUpdate>[];
}): string[] =>
  [...input.records]
    .sort((a, b) => asRadioTaskRecordOrder({ a, b }))
    .map((entry) => entry.record.key);

const TEST_CASES = [
  {
    description: 'heldSeq leads, whatever the status',
    given: [
      genUpdate({
        key: 'aa',
        heldSeq: 2,
        exid: '7',
        status: RadioTaskStatus.CLAIMED,
      }),
      genUpdate({
        key: 'bb',
        heldSeq: 1,
        exid: '7',
        status: RadioTaskStatus.DELIVERED,
      }),
    ],
    expect: ['bb', 'aa'],
  },
  {
    description:
      'a heldSeq tie on one issue: claim before deliver, though the key sorts the other way',
    given: [
      genUpdate({
        key: 'zz',
        heldSeq: 5,
        exid: '7',
        status: RadioTaskStatus.CLAIMED,
      }),
      genUpdate({
        key: 'aa',
        heldSeq: 5,
        exid: '7',
        status: RadioTaskStatus.DELIVERED,
      }),
    ],
    expect: ['zz', 'aa'],
  },
  {
    description: 'a heldSeq tie on one issue: queued before claimed',
    given: [
      genUpdate({
        key: 'aa',
        heldSeq: 5,
        exid: '7',
        status: RadioTaskStatus.CLAIMED,
      }),
      genUpdate({
        key: 'zz',
        heldSeq: 5,
        exid: '7',
        status: RadioTaskStatus.QUEUED,
      }),
    ],
    expect: ['zz', 'aa'],
  },
  {
    description:
      'a heldSeq tie across two issues: the task group decides, not the status',
    given: [
      genUpdate({
        key: 'aa',
        heldSeq: 5,
        exid: '8',
        status: RadioTaskStatus.CLAIMED,
      }),
      genUpdate({
        key: 'zz',
        heldSeq: 5,
        exid: '7',
        status: RadioTaskStatus.DELIVERED,
      }),
    ],
    expect: ['zz', 'aa'],
  },
  {
    description:
      'a heldSeq tie on one exid in two repos: the task group decides',
    given: [
      genUpdate({
        key: 'aa',
        heldSeq: 5,
        exid: '7',
        status: RadioTaskStatus.CLAIMED,
        repoName: 'svc-rentals',
      }),
      genUpdate({
        key: 'zz',
        heldSeq: 5,
        exid: '7',
        status: RadioTaskStatus.DELIVERED,
      }),
    ],
    expect: ['zz', 'aa'],
  },
  {
    description:
      'a heldSeq tie on one exid in one repo over two channels: two tasks, so the task group decides',
    given: [
      genUpdate({
        key: 'zz',
        heldSeq: 5,
        exid: '7',
        status: RadioTaskStatus.CLAIMED,
        via: RadioChannel.OS_FILEOPS,
      }),
      genUpdate({
        key: 'aa',
        heldSeq: 5,
        exid: '7',
        status: RadioTaskStatus.DELIVERED,
      }),
    ],
    expect: ['aa', 'zz'],
  },
];

/**
 * .what = a held create of a sandpine task (no exid)
 */
const genCreate = (input: { key: string; heldSeq: number }) => ({
  record: new RadioTaskRecord({
    ...genUpdate({
      key: input.key,
      heldSeq: input.heldSeq,
      exid: '0',
      status: null,
    }).record,
    kind: 'create',
    title: 'lesson reminder',
    description: 'remind the surfer of the 9am lesson',
    exid: null,
    status: RadioTaskStatus.QUEUED,
  }),
});

/**
 * .what = every order of a list
 * .why = a total comparator sorts every input order to one output
 */
const getAllPermutations = <T>(input: { items: T[] }): T[][] =>
  input.items.length <= 1
    ? [input.items]
    : input.items.flatMap((item, index) =>
        getAllPermutations({
          items: [
            ...input.items.slice(0, index),
            ...input.items.slice(index + 1),
          ],
        }).map((rest) => [item, ...rest]),
      );

describe('asRadioTaskRecordOrder', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asKeysInOrder({ records: thisCase.given })).toEqual(
        thisCase.expect,
      );
    }),
  );

  test('a heldSeq tie of a deliver, its claim, and a create sorts the same from every input order, claim before deliver', () => {
    // the trio that formed a cycle under the pairwise lifecycle term
    const deliver = genUpdate({
      key: '1aaaaaaaaaaaaaaa',
      heldSeq: 5,
      exid: '7',
      status: RadioTaskStatus.DELIVERED,
    });
    const claim = genUpdate({
      key: 'faaaaaaaaaaaaaaa',
      heldSeq: 5,
      exid: '7',
      status: RadioTaskStatus.CLAIMED,
    });
    const create = genCreate({ key: '8aaaaaaaaaaaaaaa', heldSeq: 5 });
    const orders = getAllPermutations({ items: [deliver, claim, create] }).map(
      (records) => asKeysInOrder({ records }),
    );
    expect(orders).toHaveLength(6);
    orders.forEach((order) => expect(order).toEqual(orders[0]));
    expect(orders[0]!.indexOf(claim.record.key)).toBeLessThan(
      orders[0]!.indexOf(deliver.record.key),
    );
  });
});
