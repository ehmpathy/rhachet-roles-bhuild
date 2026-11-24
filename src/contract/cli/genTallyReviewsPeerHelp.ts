import { getColumnWidth } from '@src/domain.operations/tally.reviews.peer/getColumnWidth';

/**
 * .what = the usage guide printed on --help
 * .why = discovery of options and defaults without a trip to the docs
 */
export const genTallyReviewsPeerHelp = (): string => {
  const usageRows: Array<[string, string]> = [
    [
      'tally.reviews.peer --route <dir>',
      'tally what each peer lane found on a route',
    ],
    [
      'tally.reviews.peer --route <dir> --by rule',
      'tally points per cited rule',
    ],
    [
      'tally.reviews.peer --route <dir> --lane-with <filter>',
      'narrow to one lane',
    ],
  ];
  const optionRows: Array<[string, string, string]> = [
    ['--route <dir>', 'the route dir to tally', '(required)'],
    [
      '--by <axis>',
      'lane (counts per lane) | rule (points per rule)',
      '(default: lane)',
    ],
    [
      '--lane-with <filter>',
      'keep reports whose filename holds this string',
      '(default: all lanes)',
    ],
    [
      '--lane-wout <a,b>',
      'drop reports whose filename holds any of these',
      '(default: none)',
    ],
    ['--help, -h', 'show this help', ''],
  ];

  // align each column so the eye scans one tree
  const usageWidth = getColumnWidth({
    values: usageRows.map(([cmd]) => cmd),
    min: 0,
  });
  const flagWidth = getColumnWidth({
    values: optionRows.map(([flag]) => flag),
    min: 0,
  });
  const descWidth = getColumnWidth({
    values: optionRows.map(([, desc]) => desc),
    min: 0,
  });
  const asBranch = (input: { index: number; total: number }): string =>
    input.index === input.total - 1 ? '└─' : '├─';
  const usageLines = usageRows.map(
    ([cmd, desc], index) =>
      `   │  ${asBranch({ index, total: usageRows.length })} ${cmd.padEnd(usageWidth)}  ${desc}`,
  );
  const optionLines = optionRows.map(([flag, desc, def], index) =>
    `   │  ${asBranch({ index, total: optionRows.length })} ${flag.padEnd(flagWidth)}  ${desc.padEnd(descWidth)}  ${def}`.trimEnd(),
  );

  return [
    '🦫 oh, behave!',
    '',
    '🌲 tally.reviews.peer --help',
    '   ├─ usage',
    ...usageLines,
    '   │',
    '   ├─ options',
    ...optionLines,
    '   │',
    '   └─ reads',
    '      ├─ b=N n=N: the blockers and nitpicks a lane raised, summed over its reports',
    '      ├─ by lane: many reports and 0 blockers = budget rounds spent, no defect found',
    '      ├─ by rule: a rule absent from the rows was cited 0 times in the corpus',
    '      ├─ --lane-wout: give the flag once; join its values with commas',
    '      ├─ exit 2: the call is wrong — its route, its filters, or an empty corpus',
    '      └─ exit 1: a report on disk is malformed — its name, summary, or `rule` lines',
  ].join('\n');
};
