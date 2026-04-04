import { given, then, when } from 'test-fns';

import {
  BEHAVIOR_SIZE_CONFIG,
  getAllTemplatesBySize,
  isTemplateInSize,
} from './getAllTemplatesBySize';

describe('getAllTemplatesBySize', () => {
  given('BEHAVIOR_SIZE_CONFIG', () => {
    when('checked for completeness', () => {
      then(
        'max order equals size count - 1 (no forgotten registrations)',
        () => {
          const sizes = Object.keys(BEHAVIOR_SIZE_CONFIG);
          const maxOrder = Math.max(
            ...Object.values(BEHAVIOR_SIZE_CONFIG).map((c) => c.order),
          );
          expect(maxOrder).toEqual(sizes.length - 1);
        },
      );

      then('all sizes have dels declared', () => {
        for (const [size, config] of Object.entries(BEHAVIOR_SIZE_CONFIG)) {
          expect(config).toHaveProperty(
            'dels',
            expect.any(Array),
            `size=${size} must have dels array`,
          );
        }
      });
    });
  });

  given('size=nano', () => {
    when('getAllTemplatesBySize is called', () => {
      then('returns only nano-level templates', () => {
        const templates = getAllTemplatesBySize({ size: 'nano' });
        expect(templates).toMatchSnapshot();
        expect(templates).toContain('0.wish.md');
        expect(templates).toContain('1.vision.stone');
        expect(templates).not.toContain('2.1.criteria.blackbox.stone');
      });

      then('includes from_vision execution (nano-specific)', () => {
        const templates = getAllTemplatesBySize({ size: 'nano' });
        expect(templates).toContain('5.1.execution.from_vision.v1.stone');
        expect(templates).toContain('5.1.execution.from_vision.v1.guard');
      });

      then('does NOT include phased execution (mini+)', () => {
        const templates = getAllTemplatesBySize({ size: 'nano' });
        expect(templates).not.toContain(
          '5.1.execution.phase0_to_phaseN.v1.stone',
        );
        expect(templates).not.toContain(
          '5.1.execution.phase0_to_phaseN.v1.guard',
        );
      });

      then('does NOT include blueprint or roadmap (mini+)', () => {
        const templates = getAllTemplatesBySize({ size: 'nano' });
        expect(templates).not.toContain('3.3.1.blueprint.product.v1.stone');
        expect(templates).not.toContain('4.1.roadmap.v1.stone');
      });

      then('includes verification (tests should never be forgotten)', () => {
        const templates = getAllTemplatesBySize({ size: 'nano' });
        expect(templates).toContain('5.3.verification.v1.stone');
        expect(templates).toContain('5.3.verification.v1.guard');
      });
    });
  });

  given('size=mini', () => {
    when('getAllTemplatesBySize is called', () => {
      then('returns nano + mini templates', () => {
        const templates = getAllTemplatesBySize({ size: 'mini' });
        expect(templates).toMatchSnapshot();
        // nano templates
        expect(templates).toContain('0.wish.md');
        expect(templates).toContain('1.vision.stone');
        // mini templates
        expect(templates).toContain('2.1.criteria.blackbox.stone');
        expect(templates).toContain(
          '3.1.3.research.internal.product.code.prod._.v1.stone',
        );
        // not medi
        expect(templates).not.toContain('5.5.playtest.v1.stone');
      });

      then('includes phased execution (replaces from_vision)', () => {
        const templates = getAllTemplatesBySize({ size: 'mini' });
        expect(templates).toContain('5.1.execution.phase0_to_phaseN.v1.stone');
        expect(templates).toContain('5.1.execution.phase0_to_phaseN.v1.guard');
      });

      then('does NOT include from_vision execution (deleted by mini)', () => {
        const templates = getAllTemplatesBySize({ size: 'mini' });
        expect(templates).not.toContain('5.1.execution.from_vision.v1.stone');
        expect(templates).not.toContain('5.1.execution.from_vision.v1.guard');
      });

      then('includes blueprint and roadmap (moved from nano)', () => {
        const templates = getAllTemplatesBySize({ size: 'mini' });
        expect(templates).toContain('3.3.1.blueprint.product.v1.stone');
        expect(templates).toContain('3.3.1.blueprint.product.v1.guard');
        expect(templates).toContain('4.1.roadmap.v1.stone');
      });
    });
  });

  given('size=medi', () => {
    when('getAllTemplatesBySize is called', () => {
      then('returns nano + mini + medi templates', () => {
        const templates = getAllTemplatesBySize({ size: 'medi' });
        expect(templates).toMatchSnapshot();
        // nano templates
        expect(templates).toContain('0.wish.md');
        // mini templates
        expect(templates).toContain('2.1.criteria.blackbox.stone');
        // medi templates
        expect(templates).toContain('5.5.playtest.v1.stone');
        expect(templates).toContain('3.2.distill.repros.experience._.v1.stone');
        // not mega
        expect(templates).not.toContain(
          '3.1.1.research.external.product.domain._.v1.stone',
        );
      });

      then('dels accumulate: from_vision still deleted', () => {
        const templates = getAllTemplatesBySize({ size: 'medi' });
        expect(templates).not.toContain('5.1.execution.from_vision.v1.stone');
        expect(templates).not.toContain('5.1.execution.from_vision.v1.guard');
      });
    });
  });

  given('size=mega', () => {
    when('getAllTemplatesBySize is called', () => {
      then('returns all templates', () => {
        const templates = getAllTemplatesBySize({ size: 'mega' });
        expect(templates).toMatchSnapshot();
        // mega templates
        expect(templates).toContain(
          '3.1.1.research.external.product.domain._.v1.stone',
        );
        expect(templates).toContain('3.2.distill.domain._.v1.guard');
        expect(templates).toContain('3.3.0.blueprint.factory.v1.stone');
      });

      then('dels accumulate: from_vision still deleted', () => {
        const templates = getAllTemplatesBySize({ size: 'mega' });
        expect(templates).not.toContain('5.1.execution.from_vision.v1.stone');
        expect(templates).not.toContain('5.1.execution.from_vision.v1.guard');
      });
    });
  });

  given('size=giga', () => {
    when('getAllTemplatesBySize is called', () => {
      then('returns same as mega (reserved for future)', () => {
        const megaTemplates = getAllTemplatesBySize({ size: 'mega' });
        const gigaTemplates = getAllTemplatesBySize({ size: 'giga' });
        expect(gigaTemplates).toEqual(megaTemplates);
      });

      then('dels accumulate: from_vision still deleted', () => {
        const templates = getAllTemplatesBySize({ size: 'giga' });
        expect(templates).not.toContain('5.1.execution.from_vision.v1.stone');
        expect(templates).not.toContain('5.1.execution.from_vision.v1.guard');
      });
    });
  });

  given('dels behavior', () => {
    when('a template is added at one size and deleted at a larger size', () => {
      then('it appears in the smaller size but not the larger size', () => {
        // nano has from_vision
        const nano = getAllTemplatesBySize({ size: 'nano' });
        expect(nano).toContain('5.1.execution.from_vision.v1.stone');

        // mini dels from_vision, adds phased
        const mini = getAllTemplatesBySize({ size: 'mini' });
        expect(mini).not.toContain('5.1.execution.from_vision.v1.stone');
        expect(mini).toContain('5.1.execution.phase0_to_phaseN.v1.stone');
      });
    });

    when('dels accumulate through larger sizes', () => {
      then('deleted templates stay deleted', () => {
        const sizes = ['mini', 'medi', 'mega', 'giga'] as const;
        for (const size of sizes) {
          const templates = getAllTemplatesBySize({ size });
          expect(templates).not.toContain(
            '5.1.execution.from_vision.v1.stone',
            `from_vision should be deleted at size=${size}`,
          );
        }
      });
    });

    when('a template is not in dels', () => {
      then('it remains in the output', () => {
        // 0.wish.md is never deleted
        const sizes = ['nano', 'mini', 'medi', 'mega', 'giga'] as const;
        for (const size of sizes) {
          const templates = getAllTemplatesBySize({ size });
          expect(templates).toContain(
            '0.wish.md',
            `wish should be present at size=${size}`,
          );
        }
      });
    });
  });
});

describe('isTemplateInSize', () => {
  given('a template with guard variant suffix', () => {
    when('checked against size that includes base guard', () => {
      then('matches the variant', () => {
        expect(
          isTemplateInSize({
            templateName: '1.vision.guard.light',
            size: 'nano',
          }),
        ).toBe(true);
        expect(
          isTemplateInSize({
            templateName: '1.vision.guard.heavy',
            size: 'nano',
          }),
        ).toBe(true);
      });
    });
  });

  given('a template not in size', () => {
    when('checked against nano', () => {
      then('returns false', () => {
        expect(
          isTemplateInSize({
            templateName: '2.1.criteria.blackbox.stone',
            size: 'nano',
          }),
        ).toBe(false);
      });
    });
  });

  given('a direct template match', () => {
    when('checked against size', () => {
      then('returns true', () => {
        expect(
          isTemplateInSize({
            templateName: '0.wish.md',
            size: 'nano',
          }),
        ).toBe(true);
      });
    });
  });
});
