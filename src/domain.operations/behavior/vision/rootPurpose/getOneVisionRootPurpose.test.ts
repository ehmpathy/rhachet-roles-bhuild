import { given, then, useThen, when } from 'test-fns';

import { getOneVisionRootPurpose } from './getOneVisionRootPurpose';

/**
 * .what = a vision yield with the given root purpose body, between two peer sections
 * .why  = the section must be bounded by the h2 that follows it, as in a real yield
 */
const asVision = (input: { body: string | null }): string =>
  [
    '# vision: sandpine lesson reminders',
    '',
    ...(input.body === null
      ? []
      : ['## .the root purpose', '', input.body, '']),
    '## the outcome world',
    '',
    '- why: a bullet out here must never count',
    '',
  ].join('\n');

const TEST_CASES = [
  {
    description: 'section absent',
    given: { markdown: asVision({ body: null }) },
    expect: {
      section: 'absent',
      isFirst: false,
      headers: 0,
      depth: 0,
      layers: 0,
      placeholders: 0,
      malformed: 0,
    },
  },
  {
    description: 'two nested layers',
    given: {
      markdown: asVision({
        body: [
          '- why: surfers want to see the swell before they book',
          '  - why: a surfer who books into flat water cancels',
        ].join('\n'),
      }),
    },
    expect: {
      section: 'present',
      isFirst: true,
      headers: 1,
      depth: 2,
      layers: 2,
      placeholders: 0,
      malformed: 0,
    },
  },
  {
    description: 'three nested layers',
    given: {
      markdown: asVision({
        body: [
          '- why: surfers who book a lesson should get a reminder',
          '  - why: a surfer who forgets misses the slot',
          '    - why: an empty slot is revenue the school never recovers',
        ].join('\n'),
      }),
    },
    expect: {
      section: 'present',
      isFirst: true,
      headers: 1,
      depth: 3,
      layers: 3,
      placeholders: 0,
      malformed: 0,
    },
  },
  {
    description: 'four nested layers',
    given: {
      markdown: asVision({
        body: ['- why: a', '  - why: b', '    - why: c', '      - why: d'].join(
          '\n',
        ),
      }),
    },
    expect: {
      section: 'present',
      isFirst: true,
      headers: 1,
      depth: 4,
      layers: 4,
      placeholders: 0,
      malformed: 0,
    },
  },
  {
    description:
      'a tab-indented layer under a 2-space one nests, as it renders',
    given: {
      markdown: asVision({
        body: ['- why: a', '  - why: b', '\t- why: c'].join('\n'),
      }),
    },
    expect: {
      section: 'present',
      isFirst: true,
      headers: 1,
      depth: 3,
      layers: 3,
      placeholders: 0,
      malformed: 0,
    },
  },
  {
    description: 'layers nested by tabs alone read 3 deep',
    given: {
      markdown: asVision({
        body: ['- why: a', '\t- why: b', '\t\t- why: c'].join('\n'),
      }),
    },
    expect: {
      section: 'present',
      isFirst: true,
      headers: 1,
      depth: 3,
      layers: 3,
      placeholders: 0,
      malformed: 0,
    },
  },
  {
    description:
      'a section after a line with a backticked `<!--` is read whole',
    given: {
      markdown: [
        '# vision',
        'write `<!--` to open a comment',
        '## .the root purpose',
        '- why: a',
        '  - why: b',
        '    - why: c',
      ].join('\n'),
    },
    expect: {
      section: 'present',
      isFirst: true,
      headers: 1,
      depth: 3,
      layers: 3,
      placeholders: 0,
      malformed: 0,
    },
  },
  {
    description: 'layers one column apart render flat, so read as depth 1',
    given: {
      markdown: asVision({
        body: ['- why: a', ' - why: b', '  - why: c'].join('\n'),
      }),
    },
    expect: {
      section: 'present',
      isFirst: true,
      headers: 1,
      depth: 1,
      layers: 3,
      placeholders: 0,
      malformed: 0,
    },
  },
  {
    description:
      'layers 8 columns apart render as no list items, so read as malformed',
    given: {
      markdown: asVision({
        body: ['- why: a', '        - why: b', '                - why: c'].join(
          '\n',
        ),
      }),
    },
    expect: {
      section: 'present',
      isFirst: true,
      headers: 1,
      depth: 1,
      layers: 1,
      placeholders: 0,
      malformed: 2,
    },
  },
  {
    description:
      'a first layer at 4 columns is indented code, so its chain reads as malformed',
    given: {
      markdown: asVision({
        body: ['    - why: a', '      - why: b', '        - why: c'].join('\n'),
      }),
    },
    expect: {
      section: 'present',
      isFirst: true,
      headers: 1,
      depth: 0,
      layers: 0,
      placeholders: 0,
      malformed: 3,
    },
  },
  {
    description:
      'a chain inside a `>` blockquote reads as malformed, not silent',
    given: {
      markdown: asVision({
        body: ['> - why: a', '>   - why: b', '>     - why: c'].join('\n'),
      }),
    },
    expect: {
      section: 'present',
      isFirst: true,
      headers: 1,
      depth: 0,
      layers: 0,
      placeholders: 0,
      malformed: 3,
    },
  },
  {
    description: 'three flat layers read as depth 1',
    given: {
      markdown: asVision({
        body: ['- why: a', '- why: b', '- why: c'].join('\n'),
      }),
    },
    expect: {
      section: 'present',
      isFirst: true,
      headers: 1,
      depth: 1,
      layers: 3,
      placeholders: 0,
      malformed: 0,
    },
  },
  {
    description: 'scaffold placeholders left as is count as no layer',
    given: {
      markdown: asVision({
        body: [
          '- why: <the surface motive — why the wisher asked>',
          '  - why: <the motive beneath it>',
          '    - why: <the root motive — the one that no longer shifts>',
        ].join('\n'),
      }),
    },
    expect: {
      section: 'present',
      isFirst: true,
      headers: 1,
      depth: 0,
      layers: 0,
      placeholders: 3,
      malformed: 0,
    },
  },
  {
    description: 'a motive that quotes angle brackets still counts',
    given: {
      markdown: asVision({
        body: [
          '- why: the <Schedule> view must load before a surfer gives up',
          '  - why: a surfer who gives up calls the desk',
          '    - why: each call is an instructor hour not spent in the water',
        ].join('\n'),
      }),
    },
    expect: {
      section: 'present',
      isFirst: true,
      headers: 1,
      depth: 3,
      layers: 3,
      placeholders: 0,
      malformed: 0,
    },
  },
  {
    description: 'whys in another form are malformed, not layers',
    given: {
      markdown: asVision({
        body: [
          '1. why surfers book',
          '* why: they forget',
          '- why no colon',
        ].join('\n'),
      }),
    },
    expect: {
      section: 'present',
      isFirst: true,
      headers: 1,
      depth: 0,
      layers: 0,
      placeholders: 0,
      malformed: 3,
    },
  },
  {
    description: 'a header without the dot is read too',
    given: {
      markdown: [
        '## the root purpose',
        '- why: a',
        '  - why: b',
        '    - why: c',
      ].join('\n'),
    },
    expect: {
      section: 'present',
      isFirst: true,
      headers: 1,
      depth: 3,
      layers: 3,
      placeholders: 0,
      malformed: 0,
    },
  },
  {
    description: 'layers inside a code fence do not count',
    given: {
      markdown: asVision({
        body: ['- why: a', '```md', '  - why: b', '    - why: c', '```'].join(
          '\n',
        ),
      }),
    },
    expect: {
      section: 'present',
      isFirst: true,
      headers: 1,
      depth: 1,
      layers: 1,
      placeholders: 0,
      malformed: 0,
    },
  },
  {
    description:
      'a fenced example of the header above the real section is not the header',
    given: {
      markdown: [
        '# vision: sandpine lesson reminders',
        '',
        '```md',
        '## .the root purpose',
        '- why: <the surface motive>',
        '```',
        '',
        '## .the root purpose',
        '- why: a',
        '  - why: b',
        '    - why: c',
      ].join('\n'),
    },
    expect: {
      section: 'present',
      isFirst: true,
      headers: 1,
      depth: 3,
      layers: 3,
      placeholders: 0,
      malformed: 0,
    },
  },
  {
    description: 'a fenced header alone is no section',
    given: {
      markdown: ['```md', '## .the root purpose', '- why: a', '```'].join('\n'),
    },
    expect: {
      section: 'absent',
      isFirst: false,
      headers: 0,
      depth: 0,
      layers: 0,
      placeholders: 0,
      malformed: 0,
    },
  },
  {
    description: 'a crlf yield reads the same as an lf one',
    given: {
      markdown: [
        '## .the root purpose',
        '- why: a',
        '  - why: b',
        '    - why: c',
      ].join('\r\n'),
    },
    expect: {
      section: 'present',
      isFirst: true,
      headers: 1,
      depth: 3,
      layers: 3,
      placeholders: 0,
      malformed: 0,
    },
  },
  {
    description: 'a ```` fence that holds a ``` fence drops whole',
    given: {
      markdown: asVision({
        body: [
          '- why: a',
          '````md',
          '```md',
          '  - why: an example',
          '```',
          '    - why: still an example',
          '````',
          '  - why: b',
          '    - why: c',
        ].join('\n'),
      }),
    },
    expect: {
      section: 'present',
      isFirst: true,
      headers: 1,
      depth: 3,
      layers: 3,
      placeholders: 0,
      malformed: 0,
    },
  },
  {
    description: 'a fenced h2 inside the section does not end it',
    given: {
      markdown: asVision({
        body: [
          '- why: a',
          '```md',
          '## an example header',
          '```',
          '  - why: b',
          '    - why: c',
        ].join('\n'),
      }),
    },
    expect: {
      section: 'present',
      isFirst: true,
      headers: 1,
      depth: 3,
      layers: 3,
      placeholders: 0,
      malformed: 0,
    },
  },
  {
    description: 'bold whys are malformed, not layers',
    given: {
      markdown: asVision({
        body: ['- **why:** a', '  - **why:** b', '    - __why:__ c'].join('\n'),
      }),
    },
    expect: {
      section: 'present',
      isFirst: true,
      headers: 1,
      depth: 0,
      layers: 0,
      placeholders: 0,
      malformed: 3,
    },
  },
  {
    description:
      'a capital `- Why:` reads as a layer, case-blind as the header',
    given: {
      markdown: asVision({
        body: ['- Why: a', '  - WHY: b', '    - why: c'].join('\n'),
      }),
    },
    expect: {
      section: 'present',
      isFirst: true,
      headers: 1,
      depth: 3,
      layers: 3,
      placeholders: 0,
      malformed: 0,
    },
  },
  {
    description: 'a blank `- why:` counts as a placeholder, not a layer',
    given: {
      markdown: asVision({
        body: ['- why: a', '  - why:', '    - why: c'].join('\n'),
      }),
    },
    expect: {
      section: 'present',
      isFirst: true,
      headers: 1,
      depth: 2,
      layers: 2,
      placeholders: 1,
      malformed: 0,
    },
  },
  {
    description: 'layers inside an html comment do not count',
    given: {
      markdown: asVision({
        body: [
          '- why: a',
          '<!--',
          '  - why: b',
          '-->',
          '<!-- - why: c -->',
        ].join('\n'),
      }),
    },
    expect: {
      section: 'present',
      isFirst: true,
      headers: 1,
      depth: 1,
      layers: 1,
      placeholders: 0,
      malformed: 0,
    },
  },
  {
    description: 'a section below another `##` section is present, not first',
    given: {
      markdown: [
        '# vision',
        '## the outcome world',
        'surfers get a reminder',
        '## .the root purpose',
        '- why: a',
        '  - why: b',
        '    - why: c',
      ].join('\n'),
    },
    expect: {
      section: 'present',
      isFirst: false,
      headers: 1,
      depth: 3,
      layers: 3,
      placeholders: 0,
      malformed: 0,
    },
  },
  {
    description:
      'a `##` inside a fence above the section does not make it second',
    given: {
      markdown: [
        '# vision',
        '```md',
        '## the outcome world',
        '```',
        '## .the root purpose',
        '- why: a',
      ].join('\n'),
    },
    expect: {
      section: 'present',
      isFirst: true,
      headers: 1,
      depth: 1,
      layers: 1,
      placeholders: 0,
      malformed: 0,
    },
  },
  {
    description:
      'two headers: the first is read, and both are counted; branched chains add no depth',
    given: {
      markdown: [
        '# vision',
        '## .the root purpose',
        '- why: a',
        '  - why: b',
        '- why: c',
        '  - why: d',
        '## .the root purpose',
        '- why: e',
        '  - why: f',
        '    - why: g',
      ].join('\n'),
    },
    expect: {
      section: 'present',
      isFirst: true,
      headers: 2,
      depth: 2,
      layers: 4,
      placeholders: 0,
      malformed: 0,
    },
  },
  {
    description: 'a header with text after it, or at h3, is no section',
    given: {
      markdown: [
        '## .the root purpose:',
        '- why: a',
        '### .the root purpose',
        '- why: b',
      ].join('\n'),
    },
    expect: {
      section: 'absent',
      isFirst: false,
      headers: 0,
      depth: 0,
      layers: 0,
      placeholders: 0,
      malformed: 0,
    },
  },
];

describe('getOneVisionRootPurpose', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the root purpose is read', () => {
        const result = useThen('it reads', async () => ({
          purpose: getOneVisionRootPurpose(thisCase.given),
        }));

        then('reads the expected shape', () => {
          expect(result.purpose).toEqual(thisCase.expect);
        });
      });
    }),
  );
});
