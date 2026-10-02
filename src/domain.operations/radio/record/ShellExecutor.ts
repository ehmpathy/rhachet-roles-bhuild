/**
 * .what = the shell executor the recorder's send path takes as context
 * .why = one shape for every recorder op that reaches a channel's auth,
 *        declared here so domain.operations need no infra import
 */
export type ShellExecutor = (
  command: string,
) => Promise<{ stdout: string; stderr: string }>;
