/**
 * .what = the node program that runs this package's phone daemon, as a detached process spawns it
 * .why = only the contract layer knows its own cli entry point; the domain op that starts a
 *        daemon takes this program as input rather than name the contract itself
 */
export const getPhoneDaemonProgram = (): {
  program: string;
  args: string[];
} => ({
  program: "import('rhachet-roles-bhuild/cli').then(m => m.cli.phoneDaemon())",
  args: ['run'],
});
