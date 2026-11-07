import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import { ConstraintError, MalfunctionError } from 'helpful-errors';
import { join } from 'path';
import { z } from 'zod';

/**
 * .what = the inbox verbs a peer grove's phone answers over the grove connection
 * .note = put = write a text or a group into a seat's inbox; del = withdraw a text there;
 *         set = mirror a settle onto the sender's `out` copy, for a sender on that grove
 */
export type PhoneGroveVerb = 'put' | 'del' | 'set';

/**
 * .what = the name a tree may carry, the same shape an address checks
 * .why = the tree name rides into a remote shell command; a name of this shape holds no quote,
 *        space, or shell char, so it can not break out of the command it sits in
 */
const PATTERN_TREE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

const schemaOfRegistry = z
  .object({ sshAlias: z.string().optional(), name: z.string().optional() })
  .passthrough();

/**
 * .what = the remote command that finds a tree on the peer grove and runs its phone inbox there
 * .why = the peer grove's own phone writes into its own disk, with its own installed package, in
 *        the tree's own dir, so a record lands as that grove's phone would write it. the payload
 *        rides stdin, never the command, so its words are never parsed by a shell
 * .note = the tree is looked up where the crew verbs put trees on that grove, as
 *         `getOnePhoneTreeDir` does here; a tree two dirs answer to is refused, never guessed
 */
const asRemoteCommand = (input: {
  tree: string;
  verb: PhoneGroveVerb;
}): string =>
  [
    'root="${PHONE_GIT_ROOT:-${CREWWORK_GIT_ROOT:-$HOME/git}}"',
    'found=""',
    'count=0',
    `for dir in "$root"/*/_worktrees/${input.tree} "$root"/*/${input.tree}; do`,
    '  if [ -e "$dir/.git" ]; then found="$dir"; count=$((count + 1)); fi',
    'done',
    `if [ "$count" -eq 0 ]; then echo '{"outcome":"NO_TREE"}'; exit 0; fi`,
    `if [ "$count" -gt 1 ]; then echo '{"outcome":"TWO_TREES"}'; exit 0; fi`,
    'cd "$found" || exit 1',
    `exec node -e "import('rhachet-roles-bhuild/cli').then(m => m.cli.phoneInbox())" -- ${input.verb}`,
  ].join('\n');

/**
 * .what = the ssh alias a grove is reached by, from the grove registry
 * .why = the registry is the supervisor's; a wake writes the alias, and `git.grove.send` reads it
 *        the same way, so the phone reaches a grove by the one path a human already uses
 */
const getOneSshAlias = async (input: {
  forestDir: string;
  grove: string;
}): Promise<string> => {
  const path = join(input.forestDir, 'groves', `${input.grove}.json`);
  const text = await fs
    .readFile(path, 'utf8')
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
  if (text === null)
    throw new ConstraintError(`grove ${input.grove} is not registered`, {
      path,
      hint: 'see the known groves: rhx git.grove.list',
    });
  const parsed = schemaOfRegistry.safeParse(
    ((): unknown => {
      try {
        return JSON.parse(text);
      } catch (error) {
        if (error instanceof SyntaxError) return null;
        throw error;
      }
    })(),
  );
  if (!parsed.success)
    throw new MalfunctionError('grove registry file is not json', { path });
  return parsed.data.sshAlias ?? parsed.data.name ?? input.grove;
};

/**
 * .what = runs one inbox verb on a peer grove, and returns its json answer
 * .why = the one path a text crosses groves: no daemon on the sender's side, a write through the
 *        grove connection into the receiver's inbox, where the receiver tree's daemon takes over
 */
const call = async (
  input: {
    grove: string;
    tree: string;
    verb: PhoneGroveVerb;
    payload: object;
  },
  context: { sshBin: string; forestDir: string },
): Promise<Record<string, unknown>> => {
  // a tree name that could break the remote command is refused before any ssh
  if (!PATTERN_TREE.test(input.tree))
    throw new ConstraintError('tree name is not a plain name', {
      tree: input.tree,
    });
  const alias = await getOneSshAlias({
    forestDir: context.forestDir,
    grove: input.grove,
  });
  const command = asRemoteCommand({ tree: input.tree, verb: input.verb });
  const raw = await new Promise<{
    exitCode: number;
    stdout: string;
    stderr: string;
  }>((done, fail) => {
    const child = execFile(
      context.sshBin,
      [alias, command],
      { timeout: 120_000, maxBuffer: 4 * 1024 * 1024, env: process.env },
      (error, stdout, stderr) => {
        // a spawn fault carries a string code: no ssh ran, so naught reached the grove
        if (error && typeof error.code === 'string')
          return fail(
            new MalfunctionError('could not run ssh to the grove', {
              grove: input.grove,
              code: error.code,
              spawned: false,
            }),
          );
        const exitCode =
          error === null ? 0 : typeof error.code === 'number' ? error.code : 1;
        return done({ exitCode, stdout, stderr });
      },
    );
    child.stdin?.end(JSON.stringify(input.payload));
  });

  // the answer is the last line of stdout, as json; aught else is a fault named with its stderr
  const lineLast = raw.stdout.trim().split('\n').pop() ?? '';
  const answer = ((): unknown => {
    try {
      return JSON.parse(lineLast);
    } catch (error) {
      if (error instanceof SyntaxError) return null;
      throw error;
    }
  })();
  const parsed = schemaOfAnswer.safeParse(answer);
  if (raw.exitCode !== 0 || !parsed.success)
    throw new MalfunctionError('the grove connection gave no answer', {
      grove: input.grove,
      tree: input.tree,
      verb: input.verb,
      exitCode: raw.exitCode,
      stderr: raw.stderr.slice(0, 2000),
      spawned: true,
    });
  return parsed.data;
};

/**
 * .what = an answer is one json object; each caller parses the shape its verb returns
 */
const schemaOfAnswer = z.record(z.string(), z.unknown());

/**
 * .what = the grove connection sdk, bound to one ssh bin and one grove registry
 * .why = the ssh bin is a dependency: by default `ssh`; an acceptance journey binds a stand-in
 *        that runs the remote command on a second tree root, so a cross-grove text runs end to
 *        end with no second machine
 */
export const genSdkPhoneGrove = (input: {
  sshBin: string | null;
  forestDir: string;
}) => {
  const context = { sshBin: input.sshBin ?? 'ssh', forestDir: input.forestDir };
  return {
    call: (one: {
      grove: string;
      tree: string;
      verb: PhoneGroveVerb;
      payload: object;
    }) => call(one, context),
  };
};
