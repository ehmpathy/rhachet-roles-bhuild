import { getAllStones } from 'rhachet-roles-bhrain/sdk/route';

/**
 * .what = the brain a peer lane's run command names, via `--model` or `--brain`
 * .why  = one named boundary for the run-command grammar, so callers read as prose
 *
 * .note = null means the run names no brain, so the lane runs on the bhrain default
 * .note = the run string is bhuild's own template text (the `run:` line each guard template
 *         declares), handed back verbatim by bhrain's parser; this parses bhuild's content,
 *         never a bhrain-internal format
 */
const asBrainOfPeerRun = (input: { run: string }): string | null =>
  input.run.match(/--(?:model|brain)\s+'?([^'\s]+)'?/)?.[1] ?? null;

/**
 * .what = whether a peer lane's run command enrolls claude
 * .why  = the reviewer half of the wish turns on which lanes run on claude
 */
const isClaudePeerRun = (input: { run: string }): boolean =>
  /\benroll claude\b/.test(input.run);

/**
 * .what = every peer reviewer lane in a route, with the brain its run command names
 * .why  = the brain tests assert per lane; this reads lanes through bhrain's public route sdk
 *         (`rhachet-roles-bhrain/sdk/route`, a declared package export), so the lanes are the
 *         ones bhrain will run
 */
export const getAllPeerLanesWithBrain = async (input: {
  route: string;
}): Promise<
  { stone: string; slug: string; isClaude: boolean; brain: string | null }[]
> => {
  const stones = await getAllStones({ route: input.route });
  return stones.flatMap((stone) =>
    (stone.guard?.reviews.peer ?? []).map((peer) => ({
      stone: stone.name,
      slug: peer.slug,
      isClaude: isClaudePeerRun({ run: peer.run }),
      brain: asBrainOfPeerRun({ run: peer.run }),
    })),
  );
};
