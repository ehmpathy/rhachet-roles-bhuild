/**
 * .what = the one line a caller prints when another drain holds the radio lock
 * .why = push and queue print the same notice; one source keeps the words in step
 */
export const asRadioLockWaitNotice = (): string =>
  '🦫 waits for the radio lock; another drain holds it (up to 2 min)';
