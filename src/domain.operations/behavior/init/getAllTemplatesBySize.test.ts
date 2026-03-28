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
    });
  });

  given('size=giga', () => {
    when('getAllTemplatesBySize is called', () => {
      then('returns same as mega (reserved for future)', () => {
        const megaTemplates = getAllTemplatesBySize({ size: 'mega' });
        const gigaTemplates = getAllTemplatesBySize({ size: 'giga' });
        expect(gigaTemplates).toEqual(megaTemplates);
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
