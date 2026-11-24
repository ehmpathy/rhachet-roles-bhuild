import { ConstraintError } from 'helpful-errors';

/**
 * .what = an ambient read that exited with a fault, never its "none" exit
 * .why = a box fault the caller fixes (gh not installed, a broken git config, a cut read). as a
 *        ConstraintError the drain holds it; as its own class, a spot walk can tell it apart
 *        from the test guard's refusal, and read it as that spot's miss so the next spot is tried
 */
export class AmbientReadFaultError extends ConstraintError {
  public readonly command: string;
  public readonly exitCode: number | null;
  public readonly execError: string;

  constructor(input: {
    command: string;
    exitCode: number | null;
    execError: string;
  }) {
    super(
      `the ambient read \`${input.command}\` failed (exit ${input.exitCode ?? 'none, cut off'}); this box cannot say who it is`,
      {
        command: input.command,
        exitCode: input.exitCode,
        execError: input.execError,
        hint: `check that \`${input.command}\` runs on this box, or name the auth: --auth as-ehmpath-via-keyrack | --auth as-human`,
      },
    );
    this.command = input.command;
    this.exitCode = input.exitCode;
    this.execError = input.execError;
  }
}
