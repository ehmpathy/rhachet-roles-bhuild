/**
 * .what = the user args of a cli call: argv with the node bin and any entry file path dropped
 * .why = a skill dispatches via `node -e "import('pkg').then(m => m.cli.X())" -- <args>`, which
 *        names no entry file, so argv[1] is already the first user arg; a direct call such as
 *        `tsx src/contract/cli/x.ts <args>` puts the entry file in argv[1]. one rule reads both
 * .note = an entry file is told by `/cli/` in its path: every cli entry lives under
 *         src/contract/cli/
 */
export const getCliArgvTail = (input: { argv: string[] }): string[] => {
  const argvFirstIsEntryFile = input.argv[1]?.includes('/cli/') ?? false;
  return argvFirstIsEntryFile ? input.argv.slice(2) : input.argv.slice(1);
};
