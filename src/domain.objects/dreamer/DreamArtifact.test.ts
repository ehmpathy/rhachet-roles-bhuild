import { getUniqueIdentifier } from 'domain-objects';

import { DreamArtifact } from './DreamArtifact';

describe('DreamArtifact', () => {
  test('instantiation with valid props', () => {
    const artifact = new DreamArtifact({
      path: '.dream/2026_01_27.config-reload.dream.md',
      name: 'config-reload',
      date: '2026_01_27',
      filename: '2026_01_27.config-reload.dream.md',
    });

    expect(artifact.path).toEqual('.dream/2026_01_27.config-reload.dream.md');
    expect(artifact.name).toEqual('config-reload');
    expect(artifact.date).toEqual('2026_01_27');
    expect(artifact.filename).toEqual('2026_01_27.config-reload.dream.md');
  });

  test('primary key is path', () => {
    expect(DreamArtifact.primary).toEqual(['path']);
  });

  test('unique key is path', () => {
    expect(DreamArtifact.unique).toEqual(['path']);
  });

  test('identical instances have same identity', () => {
    const artifact1 = new DreamArtifact({
      path: '.dream/2026_01_27.config-reload.dream.md',
      name: 'config-reload',
      date: '2026_01_27',
      filename: '2026_01_27.config-reload.dream.md',
    });

    const artifact2 = new DreamArtifact({
      path: '.dream/2026_01_27.config-reload.dream.md',
      name: 'config-reload',
      date: '2026_01_27',
      filename: '2026_01_27.config-reload.dream.md',
    });

    const uid1 = getUniqueIdentifier(artifact1);
    const uid2 = getUniqueIdentifier(artifact2);

    expect(uid1).toEqual(uid2);
  });

  test('different paths have different identity', () => {
    const artifact1 = new DreamArtifact({
      path: '.dream/2026_01_27.config-reload.dream.md',
      name: 'config-reload',
      date: '2026_01_27',
      filename: '2026_01_27.config-reload.dream.md',
    });

    const artifact2 = new DreamArtifact({
      path: '.dream/2026_01_20.config-reload.dream.md',
      name: 'config-reload',
      date: '2026_01_20',
      filename: '2026_01_20.config-reload.dream.md',
    });

    const uid1 = getUniqueIdentifier(artifact1);
    const uid2 = getUniqueIdentifier(artifact2);

    expect(uid1).not.toEqual(uid2);
  });
});
