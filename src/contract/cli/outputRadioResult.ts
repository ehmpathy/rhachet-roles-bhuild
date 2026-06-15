/**
 * .what = write formatted output to stdout or stderr
 * .why  = cli communicator for radio task results
 */
export const outputRadioResult = (input: {
  message: string;
  isError?: boolean;
  hint?: {
    ask?: string;
    command: string;
  };
}): void => {
  if (input.isError) {
    console.error(input.message);
    if (input.hint) {
      console.error('');
      if (input.hint.ask) console.error(input.hint.ask);
      console.error(`  $ ${input.hint.command}`);
    }
  } else {
    console.log(input.message);
  }
};
