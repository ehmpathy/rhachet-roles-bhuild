import { asFlagsParsedFromShellText } from './asFlagsParsedFromShellText';

const TEST_CASES = [
  {
    description: 'reads a single-flag arm',
    given: { text: 'case $1 in\n  --watch)\n    WATCH=true\n    shift\n    ;;\nesac' },
    expect: ['--watch'],
  },
  {
    description: 'reads every alternative of a joined arm',
    given: { text: '    --into|--from|--why)\n      shift 2 ;;' },
    expect: ['--into', '--from', '--why'],
  },
  {
    description: 'reads a quoted arm and an =* arm',
    given: { text: '  "--mode") MODE="$2" ;;\n  --at=*) AT="${1#*=}" ;;' },
    expect: ['--mode', '--at'],
  },
  {
    description: 'reads a short flag beside its long twin',
    given: { text: '  --help|-h)\n    usage ;;' },
    expect: ['--help', '-h'],
  },
  {
    description: 'parses naught from a flag named only in a header comment',
    given: { text: '#   radio.task.push.sh --via gh.issues --into @this\n# --via)\n' },
    expect: [],
  },
  {
    description: 'parses naught from an echo or usage line',
    given: { text: '  echo "  --against   local | cloud"\n  echo "--against)"' },
    expect: [],
  },
];

describe('asFlagsParsedFromShellText', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asFlagsParsedFromShellText(thisCase.given)).toEqual(thisCase.expect);
    }),
  );
});
