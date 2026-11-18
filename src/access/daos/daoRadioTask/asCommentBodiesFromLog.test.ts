import { MalfunctionError } from 'helpful-errors';
import { getError, given, then } from 'test-fns';

import { asCommentBodiesFromLog } from './asCommentBodiesFromLog';

const PATH = '/home/bert/git/.radio/sandpine/svc-lessons/task.7.comments.jsonl';

const READ_CASES = [
  {
    description: 'an empty log holds no bodies',
    given: { text: '' },
    expect: [],
  },
  {
    description:
      'each line is one body, oldest first; newlines in a body stay literal',
    given: {
      text: `${JSON.stringify({ body: 'board 7 needs a new fin\nand a wax' })}\n${JSON.stringify({ body: 'board 9 is dinged too' })}\n`,
    },
    expect: ['board 7 needs a new fin\nand a wax', 'board 9 is dinged too'],
  },
  {
    description: 'a blank line between entries holds no entry',
    given: {
      text: `${JSON.stringify({ body: 'a' })}\n\n${JSON.stringify({ body: 'b' })}\n`,
    },
    expect: ['a', 'b'],
  },
];

const FAULT_CASES = [
  {
    description: 'a torn append (half a json line)',
    given: {
      text: `${JSON.stringify({ body: 'a' })}\n{"body":"board 9 is din`,
    },
    line: 2,
  },
  {
    description: 'a json line with no body field',
    given: { text: `${JSON.stringify({ note: 'hand edit' })}\n` },
    line: 1,
  },
  {
    description: 'a json line whose body is not a string',
    given: {
      text: `${JSON.stringify({ body: 'a' })}\n${JSON.stringify({ body: 7 })}\n`,
    },
    line: 2,
  },
];

describe('asCommentBodiesFromLog', () => {
  READ_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      then('it reads the bodies', () => {
        expect(
          asCommentBodiesFromLog({ text: thisCase.given.text, path: PATH }),
        ).toEqual(thisCase.expect);
      });
    }),
  );

  FAULT_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      then(
        'it fails loud, named: the log path, the line, and the repair',
        async () => {
          const error = await getError(() =>
            asCommentBodiesFromLog({ text: thisCase.given.text, path: PATH }),
          );
          expect(error).toBeInstanceOf(MalfunctionError);
          expect(error.message).toContain(PATH);
          expect(error.message).toContain(`line ${thisCase.line}`);
          expect(error.message).toContain('repair or remove that line');
        },
      );
    }),
  );
});
