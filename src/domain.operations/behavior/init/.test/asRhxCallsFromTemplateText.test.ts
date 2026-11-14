import { asRhxCallsFromTemplateText } from './asRhxCallsFromTemplateText';

const TEST_CASES = [
  {
    description: 'reads an inline span: skill, args, flags',
    given: { text: 'run `rhx git.release --watch` until green' },
    expect: [{ skill: 'git.release', args: ['--watch'], flags: ['--watch'] }],
  },
  {
    description: 'reads a fenced line that opens with rhx',
    given: {
      text: '```\nrhx git.repo.test --what all --against local --env test --mode apply\n```',
    },
    expect: [
      {
        skill: 'git.repo.test',
        args: ['--what', 'all', '--against', 'local', '--env', 'test', '--mode', 'apply'],
        flags: ['--what', '--against', '--env', '--mode'],
      },
    ],
  },
  {
    description: 'keeps a quoted --title as one arg, with no flag read inside it',
    given: {
      text: '`rhx radio.task.push --via gh.issues --into <owner/repo> --title "<route slug>: a --b, layer <n>" --description @stdin`',
    },
    expect: [
      {
        skill: 'radio.task.push',
        args: [
          '--via',
          'gh.issues',
          '--into',
          '<owner/repo>',
          '--title',
          '"<route slug>: a --b, layer <n>"',
          '--description',
          '@stdin',
        ],
        flags: ['--via', '--into', '--title', '--description'],
      },
    ],
  },
  {
    description: 'reads a "$route/…" placeholder as a plain arg',
    given: {
      text: '`rhx symlink --at "$BEHAVIOR_DIR_REL/dreams/<f>" --to ".dream/<f>" --mode relative --idem findsert`',
    },
    expect: [
      {
        skill: 'symlink',
        args: [
          '--at',
          '"$BEHAVIOR_DIR_REL/dreams/<f>"',
          '--to',
          '".dream/<f>"',
          '--mode',
          'relative',
          '--idem',
          'findsert',
        ],
        flags: ['--at', '--to', '--mode', '--idem'],
      },
    ],
  },
  {
    description: 'reads a backticked call on its own line once, not twice',
    given: { text: '- step\n`rhx git.release --watch`\n- next' },
    expect: [{ skill: 'git.release', args: ['--watch'], flags: ['--watch'] }],
  },
  {
    description: 'reads every call when a text holds several',
    given: {
      text: 'run `rhx show.gh.test.errors`, then `rhx cicd.deflake init`',
    },
    expect: [
      { skill: 'show.gh.test.errors', args: [], flags: [] },
      { skill: 'cicd.deflake', args: ['init'], flags: [] },
    ],
  },
  {
    description: 'finds no call in prose that only mentions rhx',
    given: { text: 'the rhx tools run here, and `git log -1 --format=%H` too' },
    expect: [],
  },
];

describe('asRhxCallsFromTemplateText', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const calls = asRhxCallsFromTemplateText(thisCase.given).map((call) => ({
        skill: call.skill,
        args: call.args,
        flags: call.flags,
      }));
      expect(calls).toEqual(thisCase.expect);
    }),
  );
});
