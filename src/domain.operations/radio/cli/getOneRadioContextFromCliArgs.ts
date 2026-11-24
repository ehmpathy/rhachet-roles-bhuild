import { RadioChannel } from '@src/domain.objects/RadioChannel';
import type { ContextDispatchRadio } from '@src/domain.objects/RadioContext';
import type { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import type { AuthSource } from '@src/domain.operations/radio/auth/AuthSource';
import { getGithubTokenByAuthArg } from '@src/domain.operations/radio/auth/getGithubTokenByAuthArg';

/**
 * .what = shell executor interface
 * .why = defines shape expected by domain.operations without infra import
 */
type ShellExecutor = (
  command: string,
) => Promise<{ stdout: string; stderr: string }>;

/**
 * .what = assemble dispatch context for radio channel from CLI args
 * .why = github channel requires auth token; os.fileops does not
 * .note = async operation that may trigger auth flow for gh.issues
 * .note = authSource rides beside the context, never inside it, so the caller can show
 *         where the send's identity came from (asAuthSourceShown decides what reads)
 */
export const getOneRadioContextFromCliArgs = async (
  input: {
    via: RadioChannel;
    repo: RadioTaskRepo;
    auth: string | null;
  },
  context: {
    env: NodeJS.ProcessEnv;
    shx: ShellExecutor;
  },
): Promise<{
  radioContext: ContextDispatchRadio<typeof input.via>;
  authSource: AuthSource | null;
}> => {
  if (input.via === RadioChannel.GH_ISSUES) {
    const { authSource, ...auth } = await getGithubTokenByAuthArg(
      { auth: input.auth },
      { env: context.env, shx: context.shx },
    );
    return {
      radioContext: { github: { auth }, git: { repo: input.repo } },
      authSource,
    };
  }
  return { radioContext: { git: { repo: input.repo } }, authSource: null };
};
