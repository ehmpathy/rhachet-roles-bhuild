import { DreamArtifact } from './DreamArtifact';
import { DreamCandidate } from './DreamCandidate';

describe('DreamCandidate', () => {
  test('instantiation with valid props', () => {
    const candidate = new DreamCandidate({
      dream: new DreamArtifact({
        path: '.dream/2026_01_27.config-reload.dream.md',
        name: 'config-reload',
        date: '2026_01_27',
        filename: '2026_01_27.config-reload.dream.md',
      }),
      distance: 2,
    });

    expect(candidate.dream.name).toEqual('config-reload');
    expect(candidate.distance).toEqual(2);
  });

  test('nested DreamArtifact is hydrated from plain object', () => {
    const candidate = new DreamCandidate({
      dream: {
        path: '.dream/2026_01_27.config-reload.dream.md',
        name: 'config-reload',
        date: '2026_01_27',
        filename: '2026_01_27.config-reload.dream.md',
      },
      distance: 1,
    });

    // the nested dream should be hydrated as a DreamArtifact instance
    expect(candidate.dream).toBeInstanceOf(DreamArtifact);
    expect(candidate.dream.path).toEqual(
      '.dream/2026_01_27.config-reload.dream.md',
    );
  });

  test('nested hydration is configured', () => {
    expect(DreamCandidate.nested).toEqual({ dream: DreamArtifact });
  });
});
