/**
 * .what = communication path for task persistence
 * .why = determines which dao adapter handles task storage
 */
enum RadioChannel {
  GH_ISSUES = 'gh.issues',
  OS_FILEOPS = 'os.fileops',
}

const isRadioChannel = (value: unknown): value is RadioChannel =>
  Object.values(RadioChannel).includes(value as RadioChannel);

export { RadioChannel, isRadioChannel };
