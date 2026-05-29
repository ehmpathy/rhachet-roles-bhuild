import type { ContextDispatchRadio } from '@src/domain.objects/RadioContext';
import { RadioChannel } from '@src/domain.objects/RadioChannel';
import type { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
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
): Promise<ContextDispatchRadio<typeof input.via>> => {
  if (input.via === RadioChannel.GH_ISSUES) {
    return {
      github: {
        auth: await getGithubTokenByAuthArg(
          { auth: input.auth },
          { env: context.env, shx: context.shx },
        ),
      },
      git: { repo: input.repo },
    };
  }
  return { git: { repo: input.repo } };
};
