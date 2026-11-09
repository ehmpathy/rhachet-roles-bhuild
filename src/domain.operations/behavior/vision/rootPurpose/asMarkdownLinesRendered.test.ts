import { given, then, useThen, when } from 'test-fns';

import { asMarkdownLinesRendered } from './asMarkdownLinesRendered';

const TEST_CASES: {
  description: string;
  given: { markdown: string };
  expect: { lines: string[] };
}[] = [
  {
    description: 'plain lines are kept as is',
    given: { markdown: ['# a', '- why: b'].join('\n') },
    expect: { lines: ['# a', '- why: b'] },
  },
  {
    description:
      'a `<!--` inside a code span is literal and hides no later line',
    given: {
      markdown: ['write `<!--` to open a comment', '- why: b'].join('\n'),
    },
    expect: { lines: ['write `<!--` to open a comment', '- why: b'] },
  },
  {
    description: 'a real comment beside a code span still drops, the span kept',
    given: {
      markdown: ['use `<!-- x -->` then <!-- hidden --> text'].join('\n'),
    },
    expect: { lines: ['use `<!-- x -->` then  text'] },
  },
  {
    description:
      'an emoji before an inline comment: the cut lands on the comment, not off by one',
    given: { markdown: ['🌊 a <!-- hid --> b', '- why: c'].join('\n') },
    expect: { lines: ['🌊 a  b', '- why: c'] },
  },
  {
    description: 'a crlf yield splits the same as an lf one',
    given: { markdown: ['# a', '- why: b'].join('\r\n') },
    expect: { lines: ['# a', '- why: b'] },
  },
  {
    description: 'a fenced block drops whole',
    given: { markdown: ['a', '```md', '- why: b', '```', 'c'].join('\n') },
    expect: { lines: ['a', 'c'] },
  },
  {
    description: 'a ```` fence holds a ``` fence whole',
    given: {
      markdown: ['a', '````', '```', 'b', '```', 'c', '````', 'd'].join('\n'),
    },
    expect: { lines: ['a', 'd'] },
  },
  {
    description: 'a line that opens with inline code opens no fence',
    given: {
      markdown: ['a', '```x``` text', '- why: b', 'c'].join('\n'),
    },
    expect: { lines: ['a', '```x``` text', '- why: b', 'c'] },
  },
  {
    description: 'a tilde fence may hold a backtick in its info string',
    given: { markdown: ['a', '~~~ `md`', '- why: b', '~~~', 'c'].join('\n') },
    expect: { lines: ['a', 'c'] },
  },
  {
    description: 'a multi-line comment drops whole',
    given: { markdown: ['a', '<!--', '- why: b', '-->', 'c'].join('\n') },
    expect: { lines: ['a', 'c'] },
  },
  {
    description: 'an inline comment drops, its line kept',
    given: { markdown: ['a <!-- hid --> b'].join('\n') },
    expect: { lines: ['a  b'] },
  },
  {
    description:
      'a comment opener inside a fence is code: it hides no text after the fence',
    given: {
      markdown: [
        '```md',
        '<!-- an example',
        '```',
        '## .the root purpose',
        '- why: a',
        '-->',
      ].join('\n'),
    },
    expect: { lines: ['## .the root purpose', '- why: a', '-->'] },
  },
  {
    description:
      'a fence line inside a comment is hidden: it opens no fence after the comment',
    given: {
      markdown: ['<!--', '```', '-->', '- why: a', '```'].join('\n'),
    },
    expect: { lines: ['- why: a'] },
  },
  {
    description: 'text after a comment close on the same line is kept',
    given: { markdown: ['<!--', 'hid', '--> - why: a'].join('\n') },
    expect: { lines: [' - why: a'] },
  },
];

describe('asMarkdownLinesRendered', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the markdown is rendered to lines', () => {
        const result = useThen('it renders', async () => ({
          lines: asMarkdownLinesRendered(thisCase.given),
        }));

        then('keeps exactly the lines a rendered page shows', () => {
          expect(result.lines).toEqual(thisCase.expect.lines);
        });
      });
    }),
  );
});
