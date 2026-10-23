import { execFile } from 'child_process';
import { MalfunctionError } from 'helpful-errors';
import { type IsoDuration, toMilliseconds } from 'iso-time';
import { dirname, join } from 'path';
import { z } from 'zod';

/**
 * .what = whether a clone can take a say, as rhachet reports it (its `CloneReachState`)
 * .note = LIVE answers a say; DEAF is an active clone with no socket; DEAD is gone
 */
export const RHACHET_CLONE_REACH_STATES = ['LIVE', 'DEAD', 'DEAF'] as const;
export type RhachetCloneReachState =
  (typeof RHACHET_CLONE_REACH_STATES)[number];

/**
 * .what = one clone as `rhachet clone list` reports it
 */
export interface RhachetCloneListed {
  serial: string;
  slug: string | null;
  reachState: RhachetCloneReachState;
}

/**
 * .what = the raw result of one `rhachet clone say`
 * .why = a say outcome rides in two channels (stdout json on success, stderr json on a
 *        failure), and its read into a phone status is a pure step apart from this boundary
 */
export interface RhachetCloneSayRaw {
  exitCode: number;
  stdout: string;
  stderr: string;
}

const schemaOfCloneList = z.object({
  actors: z.array(
    z.object({
      clones: z.array(
        z.object({
          serial: z.string(),
          slug: z.string().nullable().optional(),
          reachState: z.string(),
        }),
      ),
    }),
  ),
});

/**
 * .what = the path to the rhachet cli this package depends on
 * .why = the phone runs the same rhachet it was built against, never whatever `npx` finds in a
 *        peer tree, so a say's json shape is the one this sdk parses
 * .note = `require.resolve` is node's own api name; no other api finds a dependency's dir
 */
const getRhachetBinDefault = (): string =>
  join(dirname(require.resolve('rhachet')), '..', 'bin', 'run');

/**
 * .what = the code node sets when a child's output overran `maxBuffer`; the child ran
 */
const CODE_OF_MAXBUFFER = 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER';

/**
 * .what = is this error a rhachet call that never spawned, so no say could have landed
 * .why = a say that never ran may be retried; one that may have run must never be said twice
 */
export const isRhachetSpawnFault = (error: unknown): boolean =>
  error instanceof MalfunctionError && error.metadata?.spawned === false;

/**
 * .what = runs the rhachet cli in one tree and captures its exit code and both streams
 *
 * .note = cwd is the target tree, by design (fulcrum F1): rhachet reads a tree's clones from
 *         `process.cwd()`, and offers no `--repo` flag. this one communicator is the only spot
 *         that bends `rule.forbid.cwd-override`; a `reseed` dream asks rhachet for `--repo`
 */
const execRhachet = (input: {
  bin: string;
  treeDir: string;
  args: string[];
  stdin: string | null;
  timeout: IsoDuration;
}): Promise<RhachetCloneSayRaw> =>
  new Promise((done, fail) => {
    const child = execFile(
      input.bin,
      input.args,
      {
        cwd: input.treeDir,
        timeout: toMilliseconds(input.timeout),
        maxBuffer: 16 * 1024 * 1024,
        env: process.env,
      },
      (error, stdout, stderr) => {
        // a spawn fault (no bin, no dir, no pid or fd to spare) carries a string code: no child ran
        // .note = a child that overran its output buffer also carries a string code, yet it ran;
        //         it reads as a failed exit below, never as a spawn fault
        if (
          error &&
          typeof error.code === 'string' &&
          error.code !== CODE_OF_MAXBUFFER
        )
          return fail(
            new MalfunctionError('could not run rhachet', {
              treeDir: input.treeDir,
              args: input.args,
              code: error.code,
              spawned: false,
            }),
          );
        const exitCode =
          error === null ? 0 : typeof error.code === 'number' ? error.code : 1;
        return done({ exitCode, stdout, stderr });
      },
    );
    child.stdin?.end(input.stdin ?? '');
  });

/**
 * .what = every clone enrolled in one tree, with its reach state
 * .note = a reach state this sdk does not know (one a newer rhachet adds) reads as DEAF: the
 *         clone is there and can not be said to yet, so a text to it waits, and no phone verb
 *         fails on the roster read
 */
const getAllClones = async (
  input: { treeDir: string },
  context: { bin: string },
): Promise<RhachetCloneListed[]> => {
  const raw = await execRhachet({
    bin: context.bin,
    treeDir: input.treeDir,
    args: ['clone', 'list', '--output', 'json'],
    stdin: null,
    timeout: { seconds: 90 },
  });
  if (raw.exitCode !== 0)
    throw new MalfunctionError('rhachet clone list failed', {
      treeDir: input.treeDir,
      stderr: raw.stderr.slice(0, 2000),
    });
  const parsed = schemaOfCloneList.safeParse(
    ((): unknown => {
      try {
        return JSON.parse(raw.stdout);
      } catch (error) {
        if (error instanceof SyntaxError) return null;
        throw error;
      }
    })(),
  );
  if (!parsed.success)
    throw new MalfunctionError('rhachet clone list printed an unknown shape', {
      treeDir: input.treeDir,
      stdout: raw.stdout.slice(0, 2000),
    });
  return parsed.data.actors.flatMap((actor) =>
    actor.clones.map((clone) => ({
      serial: clone.serial,
      slug: clone.slug ?? null,
      reachState: asRhachetCloneReachState({ raw: clone.reachState }),
    })),
  );
};

/**
 * .what = a reach state as this sdk knows it; one it does not know reads as DEAF
 */
const asRhachetCloneReachState = (input: {
  raw: string;
}): RhachetCloneReachState =>
  RHACHET_CLONE_REACH_STATES.find((state) => state === input.raw) ?? 'DEAF';

/**
 * .what = says one message into one clone of one tree, and returns the raw outcome
 * .why = the phone's only delivery path; it never passes `--force`, so a text never fuses with
 *        a human's half-typed turn
 */
const say = async (
  input: { treeDir: string; clone: string; what: string },
  context: { bin: string },
): Promise<RhachetCloneSayRaw> =>
  execRhachet({
    bin: context.bin,
    treeDir: input.treeDir,
    args: [
      'clone',
      'say',
      `@:${input.clone}`,
      '--what',
      '@stdin',
      '--output',
      'json',
    ],
    stdin: input.what,
    timeout: { minutes: 3 },
  });

/**
 * .what = the rhachet clone sdk, bound to one rhachet cli
 * .why = the cli path is a dependency: by default the rhachet this package was built against; a
 *        caller (an acceptance journey) may bind a stand-in cli that answers the same json, so the
 *        phone's own contract runs end to end with no live clone
 */
export const genSdkRhachetClone = (input: { bin: string | null }) => {
  const context = { bin: input.bin ?? getRhachetBinDefault() };
  return {
    getAllClones: (call: { treeDir: string }) => getAllClones(call, context),
    say: (call: { treeDir: string; clone: string; what: string }) =>
      say(call, context),
  };
};

export const sdkRhachetClone = genSdkRhachetClone({ bin: null });
