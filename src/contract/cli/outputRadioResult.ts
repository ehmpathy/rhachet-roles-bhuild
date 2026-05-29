/**
 * .what = write formatted output to stdout
 * .why  = cli communicator for radio task results
 */
export const outputRadioResult = (input: { message: string }): void => {
  console.log(input.message);
};
