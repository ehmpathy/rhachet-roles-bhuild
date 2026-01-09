import { getUniqueIdentifier } from 'domain-objects';

import { BehaviorArtifact } from './BehaviorArtifact';

describe('BehaviorArtifact', () => {
  test('instantiation with all fields', () => {
    const artifact = new BehaviorArtifact({
      path: '/repo/.behavior/v2025_01_01.feature/5.1.execution.v1.i1.md',
      name: 'execution',
      version: 1,
      attempt: 1,
      filename: '5.1.execution.v1.i1.md',
    });

    expect(artifact.path).toEqual(
      '/repo/.behavior/v2025_01_01.feature/5.1.execution.v1.i1.md',
    );
    expect(artifact.name).toEqual('execution');
    expect(artifact.version).toEqual(1);
    expect(artifact.attempt).toEqual(1);
    expect(artifact.filename).toEqual('5.1.execution.v1.i1.md');
  });

  test('instantiation with null version and attempt', () => {
    const artifact = new BehaviorArtifact({
      path: '/repo/.behavior/v2025_01_01.feature/0.wish.md',
      name: 'wish',
      version: null,
      attempt: null,
      filename: '0.wish.md',
    });

    expect(artifact.version).toBeNull();
    expect(artifact.attempt).toBeNull();
  });

  test('unique key is path', () => {
    // verify static unique property is declared as path
    expect(BehaviorArtifact.unique).toEqual(['path']);
  });

  test('identical instances have same identity', () => {
    const artifact1 = new BehaviorArtifact({
      path: '/repo/.behavior/v2025_01_01.feature/0.wish.md',
      name: 'wish',
      version: null,
      attempt: null,
      filename: '0.wish.md',
    });

    const artifact2 = new BehaviorArtifact({
      path: '/repo/.behavior/v2025_01_01.feature/0.wish.md',
      name: 'wish',
      version: null,
      attempt: null,
      filename: '0.wish.md',
    });

    const uid1 = getUniqueIdentifier(artifact1);
    const uid2 = getUniqueIdentifier(artifact2);

    expect(uid1).toEqual(uid2);
  });
});
