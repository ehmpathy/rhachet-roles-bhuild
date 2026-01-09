import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { getLatestArtifactByName } from './getLatestArtifactByName';

describe('getLatestArtifactByName', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'artifact-test-'));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test('single execution file', () => {
    writeFileSync(join(testDir, '5.1.execution.v1.i1.md'), '');

    const result = getLatestArtifactByName({
      behaviorDir: testDir,
      artifactName: 'execution',
    });

    expect(result).not.toBeNull();
    expect(result?.filename).toEqual('5.1.execution.v1.i1.md');
    expect(result?.version).toEqual(1);
    expect(result?.attempt).toEqual(1);
  });

  test('multiple versions returns latest version', () => {
    writeFileSync(join(testDir, '5.1.execution.v1.i1.md'), '');
    writeFileSync(join(testDir, '5.1.execution.v2.i1.md'), '');

    const result = getLatestArtifactByName({
      behaviorDir: testDir,
      artifactName: 'execution',
    });

    expect(result?.filename).toEqual('5.1.execution.v2.i1.md');
    expect(result?.version).toEqual(2);
  });

  test('multiple attempts returns latest attempt', () => {
    writeFileSync(join(testDir, '5.1.execution.v1.i1.md'), '');
    writeFileSync(join(testDir, '5.1.execution.v1.i2.md'), '');

    const result = getLatestArtifactByName({
      behaviorDir: testDir,
      artifactName: 'execution',
    });

    expect(result?.filename).toEqual('5.1.execution.v1.i2.md');
    expect(result?.attempt).toEqual(2);
  });

  test('excludes feedback files', () => {
    writeFileSync(join(testDir, '5.1.execution.v1.i1.md'), '');
    writeFileSync(
      join(testDir, '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md'),
      '',
    );

    const result = getLatestArtifactByName({
      behaviorDir: testDir,
      artifactName: 'execution',
    });

    expect(result?.filename).toEqual('5.1.execution.v1.i1.md');
    expect(result?.filename).not.toContain('[feedback]');
  });

  test('criteria.blackbox matches only blackbox, not blueprint', () => {
    writeFileSync(join(testDir, '2.criteria.blackbox.md'), '');
    writeFileSync(join(testDir, '2.criteria.blueprint.md'), '');

    const result = getLatestArtifactByName({
      behaviorDir: testDir,
      artifactName: 'criteria.blackbox',
    });

    expect(result?.filename).toEqual('2.criteria.blackbox.md');
  });

  test('no version/attempt returns null version and attempt', () => {
    writeFileSync(join(testDir, '0.wish.md'), '');

    const result = getLatestArtifactByName({
      behaviorDir: testDir,
      artifactName: 'wish',
    });

    expect(result?.filename).toEqual('0.wish.md');
    expect(result?.version).toBeNull();
    expect(result?.attempt).toBeNull();
  });

  test('no match returns null', () => {
    writeFileSync(join(testDir, '0.wish.md'), '');

    const result = getLatestArtifactByName({
      behaviorDir: testDir,
      artifactName: 'execution',
    });

    expect(result).toBeNull();
  });

  test('version wins over attempt across versions', () => {
    writeFileSync(join(testDir, '5.1.execution.v1.i3.md'), '');
    writeFileSync(join(testDir, '5.1.execution.v2.i1.md'), '');

    const result = getLatestArtifactByName({
      behaviorDir: testDir,
      artifactName: 'execution',
    });

    expect(result?.filename).toEqual('5.1.execution.v2.i1.md');
    expect(result?.version).toEqual(2);
  });

  test('excludes .src files', () => {
    writeFileSync(join(testDir, '3.1.research.domain._.v1.src'), '');
    writeFileSync(join(testDir, '3.1.research.domain._.v1.md'), '');

    const result = getLatestArtifactByName({
      behaviorDir: testDir,
      artifactName: 'research.domain',
    });

    expect(result?.filename).toEqual('3.1.research.domain._.v1.md');
  });
});
