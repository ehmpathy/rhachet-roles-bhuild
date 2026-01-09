import { getUniqueIdentifier } from 'domain-objects';

import { BehaviorFeedback } from './BehaviorFeedback';

describe('BehaviorFeedback', () => {
  test('instantiation with RefByUnique against', () => {
    const feedback = new BehaviorFeedback({
      path: '/repo/.behavior/v2025_01_01.feature/5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
      against: {
        path: '/repo/.behavior/v2025_01_01.feature/5.1.execution.v1.i1.md',
      },
      version: 1,
      filename: '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
    });

    expect(feedback.path).toEqual(
      '/repo/.behavior/v2025_01_01.feature/5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
    );
    expect(feedback.against).toEqual({
      path: '/repo/.behavior/v2025_01_01.feature/5.1.execution.v1.i1.md',
    });
    expect(feedback.version).toEqual(1);
    expect(feedback.filename).toEqual(
      '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
    );
  });

  test('instantiation with v2 feedback', () => {
    const feedback = new BehaviorFeedback({
      path: '/repo/.behavior/v2025_01_01.feature/0.wish.md.[feedback].v2.[given].by_human.md',
      against: {
        path: '/repo/.behavior/v2025_01_01.feature/0.wish.md',
      },
      version: 2,
      filename: '0.wish.md.[feedback].v2.[given].by_human.md',
    });

    expect(feedback.version).toEqual(2);
  });

  test('unique key is path', () => {
    // verify static unique property is declared as path
    expect(BehaviorFeedback.unique).toEqual(['path']);
  });

  test('identical instances have same identity', () => {
    const feedback1 = new BehaviorFeedback({
      path: '/repo/.behavior/v2025_01_01.feature/0.wish.md.[feedback].v1.[given].by_human.md',
      against: { path: '/repo/.behavior/v2025_01_01.feature/0.wish.md' },
      version: 1,
      filename: '0.wish.md.[feedback].v1.[given].by_human.md',
    });

    const feedback2 = new BehaviorFeedback({
      path: '/repo/.behavior/v2025_01_01.feature/0.wish.md.[feedback].v1.[given].by_human.md',
      against: { path: '/repo/.behavior/v2025_01_01.feature/0.wish.md' },
      version: 1,
      filename: '0.wish.md.[feedback].v1.[given].by_human.md',
    });

    const uid1 = getUniqueIdentifier(feedback1);
    const uid2 = getUniqueIdentifier(feedback2);

    expect(uid1).toEqual(uid2);
  });
});
