import { given, then, when } from 'test-fns';

import { getAllTranscriptEvents } from './getAllTranscriptEvents';

const PATH = '/transcripts/session.jsonl';

describe('getAllTranscriptEvents', () => {
  given('[case1] a mix of valid, blank, and corrupt lines', () => {
    const content = [
      JSON.stringify({
        type: 'user',
        message: { role: 'user', content: 'hello there' },
        cwd: '/repo',
        gitBranch: 'main',
      }),
      '',
      '{ this is not valid json',
      JSON.stringify({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            { type: 'text', text: 'on it' },
            { type: 'tool_use', name: 'Bash', input: { command: 'ls' } },
          ],
        },
      }),
    ].join('\n');

    when('[t0] the content is parsed', () => {
      const events = getAllTranscriptEvents({ content, transcriptPath: PATH });

      then('it skips blank and corrupt lines, holds valid events', () => {
        expect(events).toHaveLength(2);
      });

      then('it extracts user text from a string content', () => {
        expect(events[0]!.role).toEqual('user');
        expect(events[0]!.text).toEqual('hello there');
        expect(events[0]!.cwd).toEqual('/repo');
        expect(events[0]!.gitBranch).toEqual('main');
      });

      then(
        'it extracts assistant text and tool_use from an array content',
        () => {
          expect(events[1]!.role).toEqual('assistant');
          expect(events[1]!.text).toEqual('on it');
          expect(events[1]!.toolUses).toEqual([
            { name: 'Bash', input: { command: 'ls' } },
          ]);
        },
      );
    });
  });

  given('[case2] a file that is entirely corrupt', () => {
    const content = 'not json\nalso not json\n{ broken';

    when('[t0] the content is parsed', () => {
      const events = getAllTranscriptEvents({ content, transcriptPath: PATH });

      then('it returns an empty list, never throws', () => {
        expect(events).toEqual([]);
      });
    });
  });
});
