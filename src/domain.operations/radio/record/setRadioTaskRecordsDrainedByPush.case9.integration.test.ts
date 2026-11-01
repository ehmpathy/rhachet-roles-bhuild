import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';
import { shx } from '@src/infra/shell/shx';

import { asRadioDrainOutput } from './asRadioDrainOutput';
import { asRadioDropOutput } from './asRadioDropOutput';
import { asRadioPushOutput } from './asRadioPushOutput';
import { asRadioTaskRecordLabel } from './asRadioTaskRecordLabel';
import { getAllRadioTaskRecordsHeld } from './getAllRadioTaskRecordsHeld';
import { isRadioPushDelivered } from './isRadioPushDelivered';
import { setRadioTaskRecordAmended } from './setRadioTaskRecordAmended';
import { setRadioTaskRecordDropped } from './setRadioTaskRecordDropped';
import { setRadioTaskRecordFromPush } from './setRadioTaskRecordFromPush';
import { setRadioTaskRecordsDrained } from './setRadioTaskRecordsDrained';
import { setRadioTaskRecordsDrainedByPush } from './setRadioTaskRecordsDrainedByPush';

/**
 * .mock = the gh cli, via a stub `gh` first on PATH
 * .why  = an update the robot may not write (#599), a repo the auth cannot see, and a rate
 *         limit are faults a test cannot provoke on demand against real github; the stub
 *         replays gh's own stderr text for each, per target repo
 * .real = the 401 path runs against real github in setRadioTaskRecordsDrainedByPush
 *         [case7]; the gh dao itself in daoRadioTaskViaGhIssues.integration.test.ts
 *
 * .note = mode `access-update` answers `issue view` with a claimed radio issue, then refuses
 *         `issue edit` the way github refused bhuild#599; a create on that repo still lands
 * .note = mode `access-claim` faults only #599: unclaimed, and its edits refused; any other
 *         issue on that repo reads claimed and takes its edits
 * .note = a call under STUB_GH_WIDE_TOKEN passes the access refusals, as a wider auth would;
 *         a claim that lands marks its issue claimed, so a later deliver of it can land
 */
const STUB_GH = `#!/usr/bin/env bash
args="$*"
repo="$(printf '%s' "$args" | grep -oE -- '--repo [^ ]+' | cut -d' ' -f2 | tr '/' '_')"
mode="ok"
if [ -n "$repo" ] && [ -f "$STUB_GH_DIR/mode.$repo" ]; then mode="$(cat "$STUB_GH_DIR/mode.$repo")"; fi
wide="no"; if [ -n "$STUB_GH_WIDE_TOKEN" ] && [ "$GH_TOKEN" = "$STUB_GH_WIDE_TOKEN" ]; then wide="yes"; fi
claimed="no"; if [ -f "$STUB_GH_DIR/claimed.$repo.$3" ]; then claimed="yes"; fi
case "$1 $2" in
  "api user") echo "stubbot"; exit 0 ;;
esac
if [ "$mode" = "rate-limit" ]; then echo "API rate limit exceeded for installation ID 1" >&2; exit 1; fi
if [ "$mode" = "unreachable" ]; then echo "GraphQL: Could not resolve to a Repository with the name '$repo'. (repository)" >&2; exit 1; fi
if [ "$mode" = "access-update" ] && [ "$wide" = "no" ] && [ "$1 $2" = "issue edit" ]; then echo "GraphQL: Resource not accessible by integration (updateIssue)" >&2; exit 1; fi
if [ "$mode" = "access-update" ] && [ "$wide" = "no" ] && [ "$1 $2" = "issue close" ]; then echo "GraphQL: Resource not accessible by integration (updateIssue)" >&2; exit 1; fi
if [ "$mode" = "access-claim" ] && [ "$3" = "599" ] && [ "$claimed" = "no" ] && [ "$1 $2" = "issue view" ]; then echo '{"number":599,"title":"🎙️ task - board rentals open friday","body":"**description**\\n\\nboard rentals open friday","state":"OPEN","assignees":[],"createdAt":"2026-10-20T00:00:00Z","author":{"login":"stubbot"}}'; exit 0; fi
if [ "$mode" = "access-claim" ] && [ "$3" = "599" ] && [ "$wide" = "no" ] && [ "$1 $2" = "issue edit" ]; then echo "GraphQL: Resource not accessible by integration (updateIssue)" >&2; exit 1; fi
if [ "$mode" = "access-claim" ] && [ "$3" = "599" ] && [ "$wide" = "no" ] && [ "$1 $2" = "issue close" ]; then echo "GraphQL: Resource not accessible by integration (updateIssue)" >&2; exit 1; fi
case "$1 $2" in
  "issue view") echo '{"number":'"$3"',"title":"🎙️ task - board rentals open friday","body":"**description**\\n\\nboard rentals open friday","state":"OPEN","assignees":[{"login":"stubbot"}],"createdAt":"2026-10-20T00:00:00Z","author":{"login":"stubbot"}}' ;;
  "issue edit") if printf '%s' "$args" | grep -q -- '--add-assignee'; then touch "$STUB_GH_DIR/claimed.$repo.$3"; fi ;;
  "issue close") ;;
  "issue list") echo "[]" ;;
  "issue create")
    n="$(cat "$STUB_GH_DIR/seq" 2>/dev/null || echo 700)"; n=$((n + 1)); echo "$n" > "$STUB_GH_DIR/seq"
    echo "https://github.com/stub/stub/issues/$n" ;;
  *) echo "stub gh: unexpected call: $args" >&2; exit 1 ;;
esac
`;

const repoLessons = new RadioTaskRepo({
  owner: 'sandpine',
  name: 'svc-lessons',
});
const repoForecast = new RadioTaskRepo({
  owner: 'sandpine',
  name: 'spot-forecast',
});
const repoRentals = new RadioTaskRepo({
  owner: 'sandpine',
  name: 'svc-rentals',
});
const repoCoachbook = new RadioTaskRepo({
  owner: 'sandpine',
  name: 'coachbook',
});
const repoBookings = new RadioTaskRepo({
  owner: 'sandpine',
  name: 'svc-bookings',
});
const repoInfra = new RadioTaskRepo({
  owner: 'sandpine-labs',
  name: 'infrastructure',
});
const repoWax = new RadioTaskRepo({
  owner: 'sandpine',
  name: 'board-wax',
});
const repoLeash = new RadioTaskRepo({
  owner: 'sandpine',
  name: 'board-leash',
});
const authEnv = 'as-robot:env(RADIO_CASE9_TEST_TOKEN)';

/**
 * .what = a temp git repo + a temp home, the org gates set: sandpine open, sandpine-labs shut
 * .why = each record meets its own target's gate (E waits at a gate the others pass)
 */
const genScene = (input: { slug: string }) => {
  const cwd = genTempDir({ slug: input.slug, git: true });
  const homeDir = genTempDir({ slug: `${input.slug}-home` });
  const dirMeter = path.join(
    homeDir,
    '.rhachet/storage/repo=bhuild/role=dispatcher/.meter',
  );
  fs.mkdirSync(dirMeter, { recursive: true });
  fs.writeFileSync(
    path.join(dirMeter, 'radio.uses.org.jsonc'),
    JSON.stringify({
      orgs: { sandpine: 'allowed', 'sandpine-labs': 'blocked' },
    }),
  );
  return { cwd, homeDir };
};

/**
 * .what = set how the stub gh answers for one target repo
 * .why = each scene faults some targets and leaves the rest deliverable
 */
const setStubMode = (input: {
  repo: RadioTaskRepo;
  mode: 'ok' | 'rate-limit' | 'access-update' | 'access-claim' | 'unreachable';
}) =>
  fs.writeFileSync(
    path.join(
      process.env.STUB_GH_DIR ?? '',
      `mode.${input.repo.owner}_${input.repo.name}`,
    ),
    input.mode,
  );

/**
 * .what = transcribe one push into the queue, unsent
 * .why = a week of held work, in order, before the carrier push probes the gate
 */
const holdPush = (input: {
  cwd: string;
  repo: RadioTaskRepo;
  title: string | null;
  exid?: string | null;
  status?: RadioTaskStatus | null;
  description?: string | null;
}) =>
  setRadioTaskRecordFromPush(
    {
      push: {
        repo: input.repo,
        via: RadioChannel.GH_ISSUES,
        auth: authEnv,
        idem: null,
        title: input.title,
        description:
          input.description ??
          (input.title ? `details for ${input.title}` : null),
        exid: input.exid ?? null,
        status: input.status ?? null,
      },
    },
    { dir: path.join(input.cwd, '.behavior', '.radio'), cwd: input.cwd },
  ).record;

/**
 * .what = hold the five records of case=9, oldest first
 * .why = the backlog every scene starts from
 */
const holdBacklog = (input: { cwd: string }) => ({
  a: holdPush({
    cwd: input.cwd,
    repo: repoLessons,
    title: null,
    exid: '599',
    status: RadioTaskStatus.DELIVERED,
    description: 'board rentals open friday',
  }),
  b: holdPush({ cwd: input.cwd, repo: repoForecast, title: 'tide widget' }),
  c: holdPush({ cwd: input.cwd, repo: repoRentals, title: 'wetsuit sizes' }),
  d: holdPush({ cwd: input.cwd, repo: repoCoachbook, title: 'coachbook ics' }),
  e: holdPush({ cwd: input.cwd, repo: repoInfra, title: 'cert ingest' }),
});

/**
 * .what = the carrier push: record it, then drain the backlog through its open gate
 * .why = the act under test, composed as the cli composes it
 */
const pushCarrier = async (input: { cwd: string; homeDir: string }) => {
  const dir = path.join(input.cwd, '.behavior', '.radio');
  const { record } = setRadioTaskRecordFromPush(
    {
      push: {
        repo: repoLessons,
        via: RadioChannel.GH_ISSUES,
        auth: authEnv,
        idem: null,
        title: 'board rentals',
        description: 'rent a board by the hour',
        exid: null,
        status: null,
      },
    },
    { dir, cwd: input.cwd },
  );
  const context = {
    cwd: input.cwd,
    homeDir: input.homeDir,
    env: process.env,
    shx,
  };
  const drained = await setRadioTaskRecordsDrainedByPush(
    { record, dir, authTyped: authEnv },
    context,
  );
  const backlog = getAllRadioTaskRecordsHeld({}, context).length;
  return {
    ...drained,
    backlog,
    isDelivered: isRadioPushDelivered({ pushed: drained.pushed }),
    output: asRadioPushOutput({
      pushed: drained.pushed,
      others: drained.others,
      home: { dir: '.behavior/.radio', place: 'unbound', binds: [] },
      backlog,
    }),
    fateByLabel: Object.fromEntries(
      drained.others.map((fate) => [
        asRadioTaskRecordLabel({ record: fate.record }),
        fate,
      ]),
    ),
  };
};

describe('radio.task.push — case=9, one push carries a mixed backlog', () => {
  const pathPrior = process.env.PATH;

  // put the stub gh first on PATH, with a token the env auth mode can read
  beforeAll(() => {
    const dir = genTempDir({ slug: 'radio-case9-stub-gh' });
    fs.writeFileSync(path.join(dir, 'gh'), STUB_GH, { mode: 0o755 });
    process.env.STUB_GH_DIR = dir;
    process.env.PATH = `${dir}:${pathPrior}`;
    process.env.RADIO_CASE9_TEST_TOKEN = 'ghp_radioCase9TestTokenStub0000000';
    process.env.RADIO_CASE9_WIDE_TOKEN = 'ghp_radioCase9WideTokenStub0000000';
    process.env.STUB_GH_WIDE_TOKEN = process.env.RADIO_CASE9_WIDE_TOKEN;
    setStubMode({ repo: repoLessons, mode: 'access-update' });
    setStubMode({ repo: repoForecast, mode: 'unreachable' });
    setStubMode({ repo: repoRentals, mode: 'ok' });
    setStubMode({ repo: repoCoachbook, mode: 'ok' });
    setStubMode({ repo: repoBookings, mode: 'access-claim' });
  });
  afterAll(() => {
    process.env.PATH = pathPrior;
  });

  given(
    '[case1] five records held across four repos, the carrier gate open',
    () => {
      const scene = useBeforeAll(async () => {
        const one = genScene({ slug: 'radio-case9-t0' });
        holdBacklog({ cwd: one.cwd });
        return one;
      });

      when('[t0] one more push lands on the repo that faulted A', () => {
        const result = useThen('the carrier push drains', async () =>
          pushCarrier(scene),
        );

        then('A, the #599 update, is set aside as upstream:access', () => {
          const fate = result.fateByLabel['deliver #599'];
          expect(fate?.fate).toEqual('held');
          expect(fate?.record.reason).toEqual('upstream:access');
        });

        then('B is set aside as upstream:not-found, never refused', () => {
          const fate = result.fateByLabel['tide widget'];
          expect(fate?.fate).toEqual('held');
          expect(fate?.record.reason).toEqual('upstream:not-found');
          expect(fate?.record.recordStatus).toEqual(
            RadioTaskRecordStatus.QUEUED,
          );
        });

        then('C and D deliver past both', () => {
          expect(result.fateByLabel['wetsuit sizes']?.fate).toEqual(
            'delivered',
          );
          expect(result.fateByLabel['coachbook ics']?.fate).toEqual(
            'delivered',
          );
        });

        then('E waits at its own shut gate, with a lift for a human', () => {
          const fate = result.fateByLabel['cert ingest'];
          expect(fate?.fate).toEqual('held');
          expect(fate?.fate === 'held' ? fate.lift : null).toContain(
            'radio.uses',
          );
        });

        then('the carrier lands, though A faulted on its repo (exit 0)', () => {
          expect(result.pushed.fate).toEqual('delivered');
          expect(result.isDelivered).toEqual(true);
          expect(result.backlog).toEqual(3);
        });

        then('the output names each fate and each fix', () => {
          expect(result.output).toContain(
            'fault: GraphQL: Resource not accessible by integration (updateIssue)',
          );
          expect(result.output).toContain('amend it: rhx radio.task.queue set');
          expect(result.output).toContain('lift it (human):');
          expect(result.output).not.toContain('Command failed:');
          expect(result.output).not.toMatch(/radio-task-edit-\d+/);
          expect(result.output).toMatchSnapshot();
        });
      });
    },
  );

  given('[case2] the same backlog, a rate limit on C', () => {
    const scene = useBeforeAll(async () => {
      const one = genScene({ slug: 'radio-case9-t2' });
      holdBacklog({ cwd: one.cwd });
      return one;
    });

    when('[t2] the same carrier push', () => {
      const result = useThen('the carrier push drains', async () => {
        setStubMode({ repo: repoRentals, mode: 'rate-limit' });
        const pushed = await pushCarrier(scene);
        setStubMode({ repo: repoRentals, mode: 'ok' });
        return pushed;
      });

      then('A and B are set aside before the wall', () => {
        expect(result.fateByLabel['deliver #599']?.record.reason).toEqual(
          'upstream:access',
        );
        expect(result.fateByLabel['tide widget']?.record.reason).toEqual(
          'upstream:not-found',
        );
      });

      then('C halts the drain; D waits behind it, never sent', () => {
        const fateC = result.fateByLabel['wetsuit sizes'];
        expect(fateC?.fate).toEqual('held');
        expect(fateC?.fate === 'held' ? fateC.halt : null).toEqual(true);
        expect(result.fateByLabel['coachbook ics']?.fate).toEqual('held');
      });

      then('the carrier waits too: exit 2, this push did not land', () => {
        expect(result.pushed.fate).toEqual('held');
        expect(result.isDelivered).toEqual(false);
        expect(result.output).toContain(
          'fault: API rate limit exceeded for installation ID 1',
        );
        expect(result.output).not.toMatch(/radio-task-edit-\d+/);
        expect(result.output).toMatchSnapshot();
      });
    });
  });

  given(
    '[case3] two updates to one issue, the first set aside (updates land in order)',
    () => {
      const scene = useBeforeAll(async () => {
        const one = genScene({ slug: 'radio-case9-t3' });
        holdPush({
          cwd: one.cwd,
          repo: repoBookings,
          title: null,
          exid: '599',
          status: RadioTaskStatus.CLAIMED,
        });
        holdPush({
          cwd: one.cwd,
          repo: repoBookings,
          title: null,
          exid: '599',
          status: RadioTaskStatus.DELIVERED,
          description: 'board rentals open friday',
        });
        holdPush({
          cwd: one.cwd,
          repo: repoBookings,
          title: null,
          exid: '600',
          status: RadioTaskStatus.DELIVERED,
          description: 'wax the rental boards',
        });
        holdPush({ cwd: one.cwd, repo: repoRentals, title: 'wetsuit sizes' });
        return one;
      });

      when('[t0] the carrier push drains them', () => {
        const result = useThen('the carrier push drains', async () =>
          pushCarrier(scene),
        );

        then('the CLAIMED update of #599 is set aside on its own fault', () => {
          const fate = result.fateByLabel['claim #599'];
          expect(fate?.fate).toEqual('held');
          expect(fate?.record.reason).toEqual('upstream:access');
        });

        then(
          'the DELIVERED update of #599 waits behind it, unsent and QUEUED, never refused',
          () => {
            const fate = result.fateByLabel['deliver #599'];
            expect(fate?.fate).toEqual('held');
            expect(fate?.record.recordStatus).toEqual(
              RadioTaskRecordStatus.QUEUED,
            );
            expect(fate?.record.reason).toMatch(
              /^behind:[0-9a-f]{16} \(same issue #599\)$/,
            );
          },
        );

        then(
          'an update to another issue is sent, never held behind #599',
          () => {
            const fate = result.fateByLabel['deliver #600'];
            // the stub answers #600 as claimed and takes its edits, so it lands: sent past the
            // #599 pair, never held behind it
            expect(fate?.fate).toEqual('delivered');
            expect(fate?.record.recordStatus).toEqual(
              RadioTaskRecordStatus.DELIVERED,
            );
            expect(fate?.record.deliveredExid).toEqual('600');
            expect(fate?.record.reason ?? '').not.toMatch(/^behind:/);
          },
        );

        then(
          'the output shows the wait behind #599 as a wait, never a fault',
          () => {
            const rowBehind = result.output
              .split('\n')
              .find((line) => line.includes('deliver #599'));
            expect(rowBehind).toContain('(same issue #599)');
            expect(result.output).toContain(
              'unsent, sends once it lands or is dropped',
            );
            expect(result.output).not.toContain('fault: behind');
            expect(result.output).toMatchSnapshot();
          },
        );

        then('a record on another repo still delivers', () => {
          expect(result.fateByLabel['wetsuit sizes']?.fate).toEqual(
            'delivered',
          );
        });

        then('the queue still holds both #599 updates, in order', () => {
          const held = getAllRadioTaskRecordsHeld({}, scene).map(({ record }) =>
            asRadioTaskRecordLabel({ record }),
          );
          expect(held.slice(0, 2)).toEqual(['claim #599', 'deliver #599']);
        });
      });
    },
  );

  given(
    '[case4] two updates to #599, the first set aside, then amended (the positive half, case=10)',
    () => {
      const scene = useBeforeAll(async () => {
        const one = genScene({ slug: 'radio-case9-t4' });
        const claim = holdPush({
          cwd: one.cwd,
          repo: repoBookings,
          title: null,
          exid: '599',
          status: RadioTaskStatus.CLAIMED,
        });
        const deliver = holdPush({
          cwd: one.cwd,
          repo: repoBookings,
          title: null,
          exid: '599',
          status: RadioTaskStatus.DELIVERED,
          description: 'board rentals open friday',
        });
        await pushCarrier(one);
        return { ...one, claim, deliver };
      });
      const drain = (input: { authOverride: string | null }) =>
        setRadioTaskRecordsDrained(
          {},
          {
            cwd: scene.cwd,
            homeDir: scene.homeDir,
            env: process.env,
            shx,
            authOverride: input.authOverride,
          },
        );

      when(
        '[t1] the claim is amended to a wider auth, then a plain drain',
        () => {
          const result = useThen('the drain runs', async () => {
            await setRadioTaskRecordAmended(
              {
                key: scene.claim.key,
                auth: 'as-robot:env(RADIO_CASE9_WIDE_TOKEN)',
                description: null,
              },
              { cwd: scene.cwd },
            );
            const { fates } = await drain({ authOverride: null });
            return {
              fateByLabel: Object.fromEntries(
                fates.map((fate) => [
                  asRadioTaskRecordLabel({ record: fate.record }),
                  fate,
                ]),
              ),
            };
          });

          then('the claim lands under its new auth', () => {
            expect(result.fateByLabel['claim #599']?.fate).toEqual('delivered');
          });

          then(
            'the deliver is sent next, no longer behind; under its own auth it meets the access fault',
            () => {
              const fate = result.fateByLabel['deliver #599'];
              expect(fate?.fate).toEqual('held');
              expect(fate?.record.reason).toEqual('upstream:access');
            },
          );
        },
      );

      when('[t2] a drain under the wider auth, for the whole line', () => {
        const result = useThen('the drain runs', async () => {
          const { fates } = await drain({
            authOverride: 'as-robot:env(RADIO_CASE9_WIDE_TOKEN)',
          });
          return { fates };
        });

        then('the deliver lands, after the claim, in order', () => {
          const fate = result.fates.find(
            (one) =>
              asRadioTaskRecordLabel({ record: one.record }) === 'deliver #599',
          );
          expect(fate?.fate).toEqual('delivered');
          expect(fate?.record.recordStatus).toEqual(
            RadioTaskRecordStatus.DELIVERED,
          );
        });

        then('naught is left held on #599', () => {
          const held = getAllRadioTaskRecordsHeld({}, scene).filter(
            ({ record }) => record.exid === '599',
          );
          expect(held).toEqual([]);
        });
      });
    },
  );

  given(
    '[case5] two updates to #599, the first set aside, then dropped (the positive half, case=10)',
    () => {
      const scene = useBeforeAll(async () => {
        const one = genScene({ slug: 'radio-case9-t5' });
        setStubMode({ repo: repoWax, mode: 'access-update' });
        const edit = holdPush({
          cwd: one.cwd,
          repo: repoWax,
          title: null,
          exid: '599',
          status: null,
          description: 'wax the rental boards, then the loaners',
        });
        const deliver = holdPush({
          cwd: one.cwd,
          repo: repoWax,
          title: null,
          exid: '599',
          status: RadioTaskStatus.DELIVERED,
          description: 'boards waxed',
        });
        const carried = await pushCarrier(one);
        return { ...one, edit, deliver, carried };
      });

      then('before the drop, the deliver waits behind the edit', () => {
        expect(
          scene.carried.fateByLabel['deliver #599']?.record.reason,
        ).toMatch(/^behind:/);
      });

      when(
        '[t1] the edit is dropped, the repo grants the write, then a plain drain',
        () => {
          const result = useThen('the drain runs', async () => {
            const dropped = await setRadioTaskRecordDropped(
              { key: scene.edit.key, why: 'superseded by the deliver' },
              { cwd: scene.cwd },
            );
            setStubMode({ repo: repoWax, mode: 'ok' });
            const { fates } = await setRadioTaskRecordsDrained(
              {},
              {
                cwd: scene.cwd,
                homeDir: scene.homeDir,
                env: process.env,
                shx,
                authOverride: null,
              },
            );
            return { dropped, fates };
          });

          then('the drop names the one update that waited behind it', () => {
            expect(result.dropped.behind).toEqual(1);
          });

          then('the deliver sends on that next drain, and lands', () => {
            const fate = result.fates.find(
              (one) =>
                asRadioTaskRecordLabel({ record: one.record }) ===
                'deliver #599',
            );
            expect(fate?.fate).toEqual('delivered');
          });
        },
      );
    },
  );

  given('[case6] two updates to #599 held, and the later one dropped', () => {
    const scene = useBeforeAll(async () => {
      const one = genScene({ slug: 'radio-case9-t6' });
      holdPush({
        cwd: one.cwd,
        repo: repoBookings,
        title: null,
        exid: '599',
        status: RadioTaskStatus.CLAIMED,
      });
      const deliver = holdPush({
        cwd: one.cwd,
        repo: repoBookings,
        title: null,
        exid: '599',
        status: RadioTaskStatus.DELIVERED,
        description: 'board rentals open friday',
      });
      return { ...one, deliver };
    });

    when('[t0] the later deliver is dropped', () => {
      const result = useThen('the drop runs', async () =>
        setRadioTaskRecordDropped(
          { key: scene.deliver.key, why: 'moot' },
          { cwd: scene.cwd },
        ),
      );

      then(
        'naught waits behind it; the claim is ahead of it, not behind',
        () => {
          expect(result.behind).toEqual(0);
        },
      );
    });
  });

  given(
    '[case7] a claim and its deliver to #599 held, the issue unclaimed upstream, and the claim dropped (case=10 [t2])',
    () => {
      const scene = useBeforeAll(async () => {
        const one = genScene({ slug: 'radio-case9-t7' });
        setStubMode({ repo: repoLeash, mode: 'access-claim' });
        const claim = holdPush({
          cwd: one.cwd,
          repo: repoLeash,
          title: null,
          exid: '599',
          status: RadioTaskStatus.CLAIMED,
        });
        const deliver = holdPush({
          cwd: one.cwd,
          repo: repoLeash,
          title: null,
          exid: '599',
          status: RadioTaskStatus.DELIVERED,
          description: 'board rentals open friday',
        });
        return { ...one, claim, deliver };
      });

      when('[t0] the claim is dropped as moot', () => {
        const dropped = useThen('the drop runs', async () =>
          setRadioTaskRecordDropped(
            { key: scene.claim.key, why: 'claim moot' },
            { cwd: scene.cwd },
          ),
        );

        then('the drop names the deliver that now lacks its claim', () => {
          expect(dropped.behind).toEqual(1);
          expect(dropped.deliverNeedsClaim?.key).toEqual(scene.deliver.key);
        });

        then('the drop warns, and names both fixes', () => {
          const output = asRadioDropOutput(dropped)
            .replace(new RegExp(scene.claim.key, 'g'), '<claim-key>')
            .replace(new RegExp(scene.deliver.key, 'g'), '<deliver-key>');
          expect(output).toContain(
            'the deliver of #599 behind it needs a claim',
          );
          expect(output).toMatchSnapshot();
        });
      });

      when('[t0.1] the drop is retried, as after a lost output', () => {
        const retried = useThen('the retry runs', async () =>
          setRadioTaskRecordDropped(
            { key: scene.claim.key, why: 'claim moot' },
            { cwd: scene.cwd },
          ),
        );

        then('the retry writes naught, and still names the deliver', () => {
          expect(retried.isAlreadyDropped).toEqual(true);
          expect(retried.behind).toEqual(1);
          expect(retried.deliverNeedsClaim?.key).toEqual(scene.deliver.key);
        });

        then('the retry output still carries the claim alert', () => {
          const output = asRadioDropOutput(retried)
            .replace(new RegExp(scene.claim.key, 'g'), '<claim-key>')
            .replace(new RegExp(scene.deliver.key, 'g'), '<deliver-key>');
          expect(output).toContain('already dropped');
          expect(output).toContain(
            'the deliver of #599 behind it needs a claim',
          );
          expect(output).toMatchSnapshot();
        });
      });

      when('[t1] a plain drain sends the deliver', () => {
        const result = useThen('the drain runs', async () => {
          const { fates } = await setRadioTaskRecordsDrained(
            {},
            {
              cwd: scene.cwd,
              homeDir: scene.homeDir,
              env: process.env,
              shx,
              authOverride: null,
            },
          );
          return { fates };
        });

        then(
          'upstream refuses the deliver as unclaimed, closed for good',
          () => {
            const fate = result.fates.find(
              (one) => one.record.key === scene.deliver.key,
            );
            expect(fate?.fate).toEqual('refused');
            expect(fate?.record.recordStatus).toEqual(
              RadioTaskRecordStatus.REFUSED,
            );
            expect(fate?.record.reason).toContain(
              'cannot deliver unclaimed task',
            );
          },
        );

        then('the drain says so, as snapped', () => {
          const output = asRadioDrainOutput({
            fates: result.fates,
            backlog: 0,
            authOverride: null,
          }).replace(new RegExp(scene.deliver.key, 'g'), '<deliver-key>');
          expect(output).toContain('cannot deliver unclaimed task');
          expect(output).toMatchSnapshot();
        });
      });
    },
  );
});
