/**
 * .what = clamps on the capacity model's token axes, fed crafted token reads
 *
 * .why  = the verb cannot hand its gate a calibrated, partial, or spent pool on demand: the
 *         token half reads a live fleet. so the defs are run here, on records whose answer is
 *         known, through the same jq program the verb runs (sourced from the lib)
 */
import { spawnSync } from 'child_process';
import { join } from 'path';
import { given, then, useThen, when } from 'test-fns';

const PATH_LIB = join(__dirname, 'capacitywork.sh');

// a grove of 4 cpus, 16G, no stall; one behavior crew of 1G and 1 core, 1 core busy outside it
const ROW_WITH_CREW = {
  cpus: 4,
  mem_total_kb: 16_777_216,
  mem_avail_kb: 12_582_912,
  psi_cpu_some_avg60: '0.00',
  psi_mem_full_avg60: '0.00',
  busy_cores: 2,
  crews: [{ crew: '/x', kind: 'behavior', rss_kb: 1_048_576, cores: 1 }],
};
const ROW_EMPTY = { ...ROW_WITH_CREW, busy_cores: 0.5, crews: [] };

// a pool that sustains 100 units/h on both windows
const CAL = {
  windows: ['five_hour', 'seven_day'].map((window) => ({
    window,
    verdict: { state: 'calibrated' },
    pool: { sustainable_per_hour: 100 },
  })),
};

// a fleet that burns $fleet units/h, 10 per behavior crew-hour
const tokensOf = (input: { fleet: number; partial: boolean }) => ({
  groves: [{ state: 'read' }],
  partial: input.partial,
  fleet: {
    weighted_per_hour: input.fleet,
    by_kind: { behavior: { weighted_per_crew_hour: 10 } },
  },
});

/**
 * .what = run `limits()` for the behavior kind on one grove row
 */
const getLimits = (input: {
  row: object;
  tokens: object;
}): {
  free: Record<string, number | null>;
  free_slots: number;
  free_binds: string;
  unread_axes: string[];
  upper_bound: boolean;
} => {
  const out = spawnSync(
    'bash',
    [
      '-c',
      'source "$0"; jq -n -c --argjson r "$1" --argjson tokens "$2" --argjson cal "$3" "$CAPACITYWORK_JQ_MODEL"\' costs($r; "behavior") as $c | limits($r; $c)\'',
      PATH_LIB,
      JSON.stringify(input.row),
      JSON.stringify(input.tokens),
      JSON.stringify(CAL),
    ],
    { encoding: 'utf8' },
  );
  if (out.status !== 0) throw new Error(`the model did not run: ${out.stderr}`);
  return JSON.parse(out.stdout);
};

// free slots on the grove with a crew: ram ~10, cpu 2 — so the cpu caps them at 2
const TEST_CASES = [
  {
    description:
      'a whole token read gives an honest free count, no axis unread',
    given: {
      row: ROW_WITH_CREW,
      tokens: tokensOf({ fleet: 40, partial: false }),
    },
    expect: { tokensFree: 6, unread: [] as string[], freeSlots: 2 },
  },
  {
    // the unreached grove is often the biggest burner: its absence shrinks the fleet rate
    description:
      'a partial token read leaves the free token count unread, never larger',
    given: {
      row: ROW_WITH_CREW,
      tokens: tokensOf({ fleet: 40, partial: true }),
    },
    expect: {
      tokensFree: null,
      unread: ['tokens_5h', 'tokens_7d'],
      freeSlots: 2,
    },
  },
  {
    description:
      'an empty grove, on a pool with room, gives its one first-crew slot',
    given: { row: ROW_EMPTY, tokens: tokensOf({ fleet: 40, partial: false }) },
    expect: { tokensFree: 6, unread: ['ram', 'cpu'], freeSlots: 1 },
  },
  {
    description: 'an empty grove, on a spent pool, gives no slot',
    given: { row: ROW_EMPTY, tokens: tokensOf({ fleet: 100, partial: false }) },
    expect: { tokensFree: 0, unread: ['ram', 'cpu'], freeSlots: 0 },
  },
];

describe('capacitywork', () => {
  given('[case1] the token axes, fed known token reads', () => {
    TEST_CASES.forEach((thisCase, index) =>
      when(`[t${index}] ${thisCase.description}`, () => {
        // the act (a bash + jq spawn) runs in the when, so a spawn fault fails the act
        const limits = useThen('the limits compute', async () =>
          getLimits(thisCase.given),
        );

        then('the free slots and unread axes match', () => {
          expect(limits.free.tokens_5h).toEqual(thisCase.expect.tokensFree);
          expect(limits.unread_axes).toEqual(thisCase.expect.unread);
          expect(limits.upper_bound).toEqual(thisCase.expect.unread.length > 0);
          expect(limits.free_slots).toEqual(thisCase.expect.freeSlots);
        });
      }),
    );
  });
});
