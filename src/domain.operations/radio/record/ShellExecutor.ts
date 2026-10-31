/**
 * .what = the shell executor the recorder's send path takes as context
 * .why = one shape for every recorder op that reaches a channel's auth,
 *        declared here so domain.operations need no infra import
 *
 * .note = options.timeout bounds the command; a drain hands it what its deadline has left
 */
export type ShellExecutor = (
  command: string,
  options?: { timeout?: { milliseconds: number } },
) => Promise<{ stdout: string; stderr: string }>;
