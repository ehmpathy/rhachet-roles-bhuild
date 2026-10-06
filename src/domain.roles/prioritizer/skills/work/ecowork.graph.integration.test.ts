/**
 * .what = clamps on the gate and serve edges — order, cycles, filters, parts, renames
 *
 * .note = a PART of the `ecowork.db` suite, cut so one reviewer can hold
 *         it whole. the suite's shared fixtures, and its account of what it
 *         runs against and why, live in ecowork.harness.ts.
 */
import { spawnSync } from 'child_process';
import { rmSync } from 'fs';
import { dirname } from 'path';
import { given, then, useBeforeAll } from 'test-fns';

import { tempDirs } from '../../../.test/tempDirs';
import {
  eco,
  genDbPath,
  getStoreEdges,
  PATH_ECOWORK_DB,
} from './ecowork.harness';

afterAll(() => tempDirs.delAll());

describe('ecowork.db', () => {
  // ///////////////////////////////////////////////////////////////////
  // ORCHESTRATION — the gate edge, and the status that opens it
  // ///////////////////////////////////////////////////////////////////

  given('[case19] two priorities where one must precede the other', () => {
    const db = genDbPath({ slug: 'eco-gate-order' });

    // 🔴 the slug IS the goal uri (assertSlugIsGoal), and an edge keys on the
    //    goal's uuid — so a gated row must declare a goal or there is no key
    //    to hold it by. these two constants are what that costs a fixture
    const AUDIT = 'bigrock://audit';
    const TUNE = 'bigrock://tune';

    const scene = useBeforeAll(async () => {
      eco({
        db,
        verb: 'set',
        payload: {
          slug: AUDIT,
          what: 'measure the waste',
          sev: 'p1',
          urg: '1w',
        },
      });
      eco({
        db,
        verb: 'set',
        payload: {
          slug: TUNE,
          what: 'cut the waste',
          sev: 'p1',
          urg: '1w',
          gatedBy: [AUDIT],
        },
      });
      return { got: eco({ db, verb: 'get', payload: {} }) };
    });

    const at = (slug: string) =>
      scene.got.priorities.find((p: { slug: string }) => p.slug === slug);

    // 🔴 ONE edge, two ends. the whole reason a table beats a json column:
    //    `--gated-by audit` on `tune` must be readable from `audit` as
    //    `--gates tune`, with no second write that could disagree
    then(
      '[t0] the edge reads from BOTH ends, and neither end wrote it twice',
      () => {
        expect(at(TUNE).gatedBy).toEqual([AUDIT]);
        expect(at(AUDIT).gates).toEqual([TUNE]);
      },
    );

    then('[t1] the gated row is NOT ready, and the gater IS', () => {
      expect(at(TUNE).ready).toEqual(false);
      expect(at(AUDIT).ready).toEqual(true);
    });

    then(
      '[t2] a new row defaults to enqueued rather than to any finished state',
      () => {
        expect(at(AUDIT).status).toEqual('enqueued');
        expect(at(TUNE).status).toEqual('enqueued');
      },
    );

    // 🔴 the clamp on the whole point of the status column. with no status
    //    a gate can never open, so `--ready` would answer the same set
    //    forever and the timeline could never advance
    then('[t3] a gater that reaches done OPENS the gate', () => {
      expect(
        eco({ db, verb: 'get', payload: { ready: true } }).priorities.map(
          (p: { slug: string }) => p.slug,
        ),
      ).toEqual([AUDIT]);

      eco({ db, verb: 'set', payload: { slug: AUDIT, status: 'done' } });

      expect(
        eco({ db, verb: 'get', payload: { ready: true } }).priorities.map(
          (p: { slug: string }) => p.slug,
        ),
      ).toEqual([TUNE]);
    });

    // a done gater is HISTORY. to leave it listed as a reason this row
    // waits would make a free row read as held
    then(
      '[t4] the opened gate leaves gatedBy intact and gatedByOpen empty',
      () => {
        const after = eco({ db, verb: 'get', payload: { slug: TUNE } })
          .priorities[0];
        expect(after.gatedBy).toEqual([AUDIT]);
        expect(after.gatedByOpen).toEqual([]);
      },
    );
  });

  given('[case20] gate edges that would make the timeline unwalkable', () => {
    const db = genDbPath({ slug: 'eco-gate-refuse' });

    const setRaw = (payload: object) =>
      spawnSync('node', [PATH_ECOWORK_DB, 'set', db], {
        input: JSON.stringify(payload),
        encoding: 'utf8',
        timeout: 30_000,
      });

    // the slug IS the goal uri, and an edge keys on the goal's uuid
    const A = 'bigrock://a';
    const B = 'bigrock://b';
    const C = 'bigrock://c';

    useBeforeAll(async () => {
      for (const slug of [A, B, C])
        eco({
          db,
          verb: 'set',
          payload: { slug, what: slug, sev: 'p1', urg: '1w' },
        });
      eco({ db, verb: 'set', payload: { slug: B, gatedBy: [A] } });
      eco({ db, verb: 'set', payload: { slug: C, gatedBy: [B] } });
      return {};
    });

    // an unchecked one is SILENT: the edge writes, `--ready` treats it as a
    // gate nobody can pass, and the row it guards never surfaces again
    then('[t0] a gate on a slug that names no priority is REFUSED', () => {
      const run = setRaw({ slug: A, gates: ['ghost'] });
      expect(run.status).toEqual(2);
      expect(run.stderr).toContain("no priority 'ghost'");
    });

    then('[t1] a self-gate is REFUSED', () => {
      const run = setRaw({ slug: A, gates: [A] });
      expect(run.status).toEqual(2);
      expect(run.stderr).toContain('cannot gate itself');
    });

    // 🔴 a → b → c → a reads fine at every step and yields a set where no
    //    row is ever ready and no error ever fires. refused at write rather
    //    than detected at read (rule.prefer.prevent-over-correct)
    then(
      '[t2] an edge that would CLOSE a cycle is refused, and names the path',
      () => {
        const run = setRaw({ slug: C, gates: [A] });
        expect(run.status).toEqual(2);
        expect(run.stderr).toContain('cycle');
        expect(run.stderr).toContain(A);
      },
    );

    // 🔴 the clamp on the partial-write defect measured 2026-09-13: the
    //    rewrite of a gate side is a DELETE plus N inserts, so a refusal
    //    mid-list dropped every extant edge and still reported failure. the
    //    human reads "refused" and believes naught changed
    then(
      '[t3] a refusal ROLLS BACK — a partial gate write never survives',
      () => {
        const before = eco({ db, verb: 'get', payload: { slug: C } })
          .priorities[0];
        expect(before.gatedBy).toEqual([B]);

        const run = setRaw({ slug: C, gatedBy: [B, 'ghost'] });
        expect(run.status).toEqual(2);

        const after = eco({ db, verb: 'get', payload: { slug: C } })
          .priorities[0];
        expect(after.gatedBy).toEqual([B]);
      },
    );

    then(
      '[t4] a status outside the declared set is refused, and says why not `open`',
      () => {
        const run = setRaw({ slug: A, status: 'open' });
        expect(run.status).toEqual(2);
        expect(run.stderr).toContain('enqueued inflight done held');
        expect(run.stderr).toContain('github');
      },
    );
  });

  given('[case21] a gate whose gater sits OUTSIDE the caller filter', () => {
    const db = genDbPath({ slug: 'eco-gate-crossbranch' });

    // the slug IS the goal uri, so the goal path IS the row's name
    const ROOT = 'bigrock://sandpine.decost';
    const DECLAPRACT = 'subrock://sandpine.decost/declapract-upgrade';
    const TWILIO = 'subrock://sandpine.decost/sms-tune';

    const scene = useBeforeAll(async () => {
      // the root first — a part may name a whole only if some row declares it
      eco({
        db,
        verb: 'set',
        payload: {
          slug: ROOT,
          what: 'cut the sandpine run cost',
          sev: 'p1',
          urg: '1m',
        },
      });
      eco({
        db,
        verb: 'set',
        payload: {
          slug: DECLAPRACT,
          what: 'run current best-practices',
          sev: 'p1',
          urg: '1w',
        },
      });
      eco({
        db,
        verb: 'set',
        payload: {
          slug: TWILIO,
          what: 'cut the twilio spend',
          sev: 'p1',
          urg: '1w',
          gatedBy: [DECLAPRACT],
        },
      });
      return {
        narrowed: eco({
          db,
          verb: 'get',
          payload: { slug: TWILIO },
        }),
      };
    });

    // 🔴 the clamp on the most expensive shape this store can emit: a
    //    term=partial-audit with a green check on it. a `--goal` filter
    //    narrows to one branch, and its gater lives on another — so a gate
    //    join over only the filtered rows would report this row READY
    //    because the row that holds it was out of view
    then(
      '[t0] a narrowed get still sees the gate from the other branch',
      () => {
        expect(scene.narrowed.count).toEqual(1);
        expect(scene.narrowed.priorities[0].gatedByOpen).toEqual([DECLAPRACT]);
        expect(scene.narrowed.priorities[0].ready).toEqual(false);
      },
    );

    // a piece is not a prerequisite. decomposition draws no edge between
    // these two — they are siblings — and orchestration draws one
    then(
      '[t1] the gate crosses branches that decomposition keeps apart',
      () => {
        // the rollup returns the root plus its two branches — the root is a real
        // row, declared because the FK demands a whole before its parts
        const both = eco({ db, verb: 'get', payload: { slug: ROOT } });
        expect(both.count).toEqual(3);
        expect(
          both.priorities.find((p: { slug: string }) => p.slug === DECLAPRACT)
            .goalPath,
        ).toEqual('declapract-upgrade');
        expect(
          both.priorities.find((p: { slug: string }) => p.slug === TWILIO)
            .goalPath,
        ).toEqual('sms-tune');
      },
    );
  });

  given('[case22] statuses that are not merely "unfinished"', () => {
    const db = genDbPath({ slug: 'eco-gate-status' });

    // the slug IS the goal uri, and an edge keys on the goal's uuid
    const PARKED = 'bigrock://parked';
    const UNDERWAY = 'bigrock://underway';
    const FREE = 'bigrock://free';

    useBeforeAll(async () => {
      for (const slug of [PARKED, UNDERWAY, FREE])
        eco({
          db,
          verb: 'set',
          payload: { slug, what: slug, sev: 'p1', urg: '1w' },
        });
      eco({ db, verb: 'set', payload: { slug: PARKED, status: 'held' } });
      eco({ db, verb: 'set', payload: { slug: UNDERWAY, status: 'inflight' } });
      return {};
    });

    // 🔴 `ready` means "may be STARTED now", which is narrower than "has no
    //    open gate". a held row was parked on purpose and an inflight row
    //    has already begun — to surface either would make the park and the
    //    claim invisible
    then('[t0] only the enqueued row is ready', () => {
      const ready = eco({ db, verb: 'get', payload: { ready: true } });
      expect(ready.priorities.map((p: { slug: string }) => p.slug)).toEqual([
        FREE,
      ]);
    });

    then('[t1] a held row still GATES, so `held` is not a quiet `done`', () => {
      eco({ db, verb: 'set', payload: { slug: FREE, gatedBy: [PARKED] } });
      const ready = eco({ db, verb: 'get', payload: { ready: true } });
      expect(ready.count).toEqual(0);
    });

    then(
      '[t2] --status filters exactly, and an omitted status preserves',
      () => {
        expect(
          eco({ db, verb: 'get', payload: { status: 'held' } }).count,
        ).toEqual(1);
        eco({
          db,
          verb: 'set',
          payload: { slug: PARKED, what: 'parked, re-worded' },
        });
        expect(
          eco({ db, verb: 'get', payload: { slug: PARKED } }).priorities[0]
            .status,
        ).toEqual('held');
      },
    );

    // 🔴 an orphan edge names a slug that no longer exists, and an absent
    //    gater reads as a SHUT gate — so one delete would silently freeze
    //    every row it used to gate, with no error and no way to see why
    then('[t3] a del takes its edges with it, and reports how many', () => {
      const dropped = eco({ db, verb: 'del', payload: { slug: PARKED } });
      expect(dropped.gatesDropped).toEqual(1);
      const after = eco({ db, verb: 'get', payload: { slug: FREE } })
        .priorities[0];
      expect(after.gatedByOpen).toEqual([]);
      expect(after.ready).toEqual(true);
    });
  });

  // 🔴 a PART gates its WHOLE, and the store derives that from --goal
  //    rather than from the gate table. see
  //    define.invariant.eco.a-part-gates-its-whole
  given('[case24] a parent rock with parts beneath it', () => {
    const db = genDbPath({ slug: 'eco-part-gates-whole' });

    const setRaw = (payload: object) =>
      spawnSync('node', [PATH_ECOWORK_DB, 'set', db], {
        input: JSON.stringify(payload),
        encoding: 'utf8',
        timeout: 30_000,
      });

    // 🔴 the slug IS the goal uri (assertSlugIsGoal), so a fixture cannot
    //    hold a bare nickname beside the uri — the two names were exactly
    //    the synonym that invariant exists to forbid
    const ROOT = 'bigrock://sandpine.decost';
    const TWILIO = 'subrock://sandpine.decost/sms-tune';
    const AUDIT = 'subrock://sandpine.decost/sms-tune/waste-audit';
    const ALERT = 'subrock://sandpine.decost/sms-tune/waste-alert';
    const PG = 'subrock://sandpine.decost/pg-upgrade';

    const scene = useBeforeAll(async () => {
      // ⚠️ the ROOT comes first, and that order is not cosmetic — the FK
      //    refuses a part of a whole nobody declared
      //    (define.invariant.eco.a-surgoal-must-be-declared-first)
      for (const slug of [ROOT, TWILIO, AUDIT, ALERT, PG])
        eco({
          db,
          verb: 'set',
          payload: { slug, what: slug, sev: 'p1', urg: '1w' },
        });
      return { got: eco({ db, verb: 'get', payload: {} }) };
    });

    const at = (slug: string) =>
      scene.got.priorities.find((p: { slug: string }) => p.slug === slug);

    // 🔴 NOT ONE gate edge was typed. the block comes from the tree
    then('[t0] the parent is held by its parts, with no gate table row', () => {
      expect(at(TWILIO).partsOpen).toEqual([ALERT, AUDIT]);
      expect(at(TWILIO).gatedBy).toEqual([]);
      expect(at(TWILIO).ready).toEqual(false);
    });

    // the two halves stay apart in the shape, because the repair differs:
    // drop an edge, versus finish a piece
    then('[t1] a leaf carries no parts, and a peer branch is untouched', () => {
      expect(at(AUDIT).partsOpen).toEqual([]);
      expect(at(AUDIT).ready).toEqual(true);
      expect(at(PG).partsOpen).toEqual([]);
    });

    // 🔴 a whole is not one of its own parts. were it, every row would be
    //    its own prerequisite and no row could ever be ready
    then('[t2] a row is never beneath ITSELF', () => {
      expect(at(PG).partsOpen).not.toContain(PG);
      expect(at(TWILIO).partsOpen).not.toContain(TWILIO);
    });

    then(
      '[t3] each part that reaches done releases the whole, the last one frees it',
      () => {
        eco({ db, verb: 'set', payload: { slug: AUDIT, status: 'done' } });
        expect(
          eco({ db, verb: 'get', payload: { slug: TWILIO } }).priorities[0]
            .partsOpen,
        ).toEqual([ALERT]);

        eco({ db, verb: 'set', payload: { slug: ALERT, status: 'done' } });
        const freed = eco({ db, verb: 'get', payload: { slug: TWILIO } })
          .priorities[0];
        expect(freed.partsOpen).toEqual([]);
        expect(freed.ready).toEqual(true);
      },
    );

    // 🔴 a second source of truth for one fact. drop the hand-typed edge
    //    and the order silently vanishes, though the tree still states it
    then(
      '[t4] a hand-typed gate that RESTATES the tree is refused, both ways',
      () => {
        const upward = setRaw({ slug: AUDIT, gates: [TWILIO] });
        expect(upward.status).toEqual(2);
        expect(upward.stderr).toContain('already a PART of');

        const downward = setRaw({ slug: TWILIO, gates: [AUDIT] });
        expect(downward.status).toEqual(2);
        expect(downward.stderr).toContain('already a PART of');
      },
    );

    // 🔴 the refusal must TEACH the repair, never merely refuse. a gate on
    //    a parent is redundant AND imprecise — aim it at the leaf, and the
    //    block reaches the parent on its own
    then('[t5] the refusal names where the gate actually belongs', () => {
      expect(setRaw({ slug: TWILIO, gates: [AUDIT] }).stderr).toContain(
        'aim it at the row that does the WORK',
      );
    });
  });

  given('[case25] a cross-branch gate aimed at a leaf', () => {
    const db = genDbPath({ slug: 'eco-gate-propagates' });

    // the slug IS the goal uri, so the fixture names each row by its uri
    const ROOT = 'bigrock://sandpine.decost';
    const DECLAPRACT = 'subrock://sandpine.decost/declapract-upgrade';
    const TWILIO = 'subrock://sandpine.decost/sms-tune';
    const AUDIT = 'subrock://sandpine.decost/sms-tune/waste-audit';

    const scene = useBeforeAll(async () => {
      // the root, declared first — the FK demands it
      for (const slug of [ROOT, DECLAPRACT, TWILIO, AUDIT])
        eco({
          db,
          verb: 'set',
          payload: { slug, what: slug, sev: 'p1', urg: '1w' },
        });
      // the gate lands on the LEAF that does the work, never on the roll-up
      eco({ db, verb: 'set', payload: { slug: AUDIT, gatedBy: [DECLAPRACT] } });
      return { got: eco({ db, verb: 'get', payload: {} }) };
    });

    const at = (slug: string) =>
      scene.got.priorities.find((p: { slug: string }) => p.slug === slug);

    then('[t0] the leaf carries the gate', () => {
      expect(at(AUDIT).gatedByOpen).toEqual([DECLAPRACT]);
      expect(at(AUDIT).ready).toEqual(false);
    });

    // 🔴 the whole point of the invariant: the block reaches the parent
    //    up the tree, with NO second edge typed on the parent
    then('[t1] the block reaches the parent on its own, via part-of', () => {
      expect(at(TWILIO).gatedBy).toEqual([]);
      expect(at(TWILIO).partsOpen).toEqual([AUDIT]);
      expect(at(TWILIO).ready).toEqual(false);
    });

    then(
      '[t2] a gater that reaches done frees the leaf, and then the parent',
      () => {
        eco({ db, verb: 'set', payload: { slug: DECLAPRACT, status: 'done' } });
        const leaf = eco({ db, verb: 'get', payload: { slug: AUDIT } })
          .priorities[0];
        expect(leaf.ready).toEqual(true);

        eco({ db, verb: 'set', payload: { slug: AUDIT, status: 'done' } });
        const parent = eco({ db, verb: 'get', payload: { slug: TWILIO } })
          .priorities[0];
        expect(parent.ready).toEqual(true);
      },
    );
  });

  // 🔴 the goal tree is REFERENTIAL — a part may name a whole only if some
  //    row declares it. see define.invariant.eco.a-surgoal-must-be-declared-first
  given('[case26] a goal whose surgoal no row has declared', () => {
    const db = genDbPath({ slug: 'eco-goal-fk' });

    const setRaw = (payload: object) =>
      spawnSync('node', [PATH_ECOWORK_DB, 'set', db], {
        input: JSON.stringify(payload),
        encoding: 'utf8',
        timeout: 30_000,
      });
    const delRaw = (payload: object) =>
      spawnSync('node', [PATH_ECOWORK_DB, 'del', db], {
        input: JSON.stringify(payload),
        encoding: 'utf8',
        timeout: 30_000,
      });

    // 🔴 the measured defect, verbatim: this exact goal was ACCEPTED and read
    //    `ready: true` — a leaf of a tree with no trunk
    then(
      '[t0] an orphan subrock is refused, and the shape check alone would not catch it',
      () => {
        const orphan = setRaw({
          slug: 'subrock://never-declared/a/b',
          what: 'a part of naught',
          sev: 'p1',
          urg: '1w',
        });
        expect(orphan.status).toEqual(2);
        expect(orphan.stderr).toContain('no priority declares that goal yet');
      },
    );

    then('[t1] a ROOT owes no reference, so it seeds a tree from empty', () => {
      const root = eco({
        db,
        verb: 'set',
        payload: {
          slug: 'bigrock://decost',
          what: 'the root',
          sev: 'p1',
          urg: '1m',
        },
      });
      expect(root.wrote).toEqual('created');
    });

    // the check runs at EVERY rung, so depth-2 is refused until depth-1 exists
    then(
      '[t2] a declared root does not license an arbitrary depth beneath it',
      () => {
        const deep = setRaw({
          slug: 'subrock://decost/a/b',
          what: 'two rungs down',
          sev: 'p1',
          urg: '1w',
        });
        expect(deep.status).toEqual(2);
        // ⚠️ the rung above may be a SUBROCK or a ROOT ROCK at every depth, now
        //    that a root may carry a path — so the message offers all three and
        //    any one satisfies. the subrock form leads, as the likeliest intent
        expect(deep.stderr).toContain("names a part of 'subrock://decost/a");
        expect(deep.stderr).toContain('bigrock://decost/a');
      },
    );

    // 🔴 a subrock names its root's SLUG, never its KIND — so EITHER root kind
    //    satisfies the reference, and the alt<->big flip stays a one-row edit
    then('[t3] the root-rung reference accepts either kind', () => {
      expect(
        setRaw({
          slug: 'subrock://decost/a',
          what: 'a branch',
          sev: 'p1',
          urg: '1w',
        }).status,
      ).toEqual(0);
      eco({
        db,
        verb: 'goal.mv',
        payload: { from: 'bigrock://decost', to: 'altrock://decost' },
      });
      expect(
        setRaw({
          slug: 'subrock://decost/c',
          what: 'a peer branch',
          sev: 'p2',
          urg: '1w',
        }).status,
      ).toEqual(0);
    });

    // 🔴 the OTHER end of the reference. a `set` that tries to MOVE a goal is
    //    a reparent, and must not strand what it leaves behind — so `set`
    //    refuses any goal outright, rather than drop it and exit 0
    then(
      '[t4] a set that tries to move a goal out from under its parts is refused',
      () => {
        eco({
          db,
          verb: 'set',
          payload: {
            slug: 'subrock://decost/a/b',
            what: 'a leaf',
            sev: 'p2',
            urg: '1w',
          },
        });
        const moved = setRaw({
          slug: 'subrock://decost/a',
          goal: 'subrock://decost/z',
        });
        expect(moved.status).toEqual(2);
        expect(moved.stderr).toContain('set takes no goal');
        // and the parts still stand under the row they named
        const rows = eco({ db, verb: 'get', payload: {} }).priorities.map(
          (p: { slug: string }) => p.slug,
        );
        expect(rows).toContain('subrock://decost/a');
        expect(rows).toContain('subrock://decost/a/b');
      },
    );

    // 🔴 the refusal must TEACH the repair. under a strict FK a rename is
    //    unreachable one row at a time, so the error names the verb that can
    then('[t5] the move refusal names goal.mv, the verb the FK demands', () => {
      expect(
        setRaw({ slug: 'subrock://decost/a', goal: 'subrock://decost/z' })
          .stderr,
      ).toContain('goal.mv --from');
    });

    then('[t6] a del is a departure too, and obeys the same guard', () => {
      const dropped = delRaw({ slug: 'subrock://decost/a' });
      expect(dropped.status).toEqual(2);
      expect(dropped.stderr).toContain('is the only priority that declares');
    });

    // 🔴 .this case once read "the guard fires on the LAST declarant, never on
    //    ANY declarant", and that state is no longer reachable — rewritten
    //    2026-09-16 to grade what the store now guarantees instead.
    //
    //    it wrote a SECOND row on one goal (`mid` + `mid-twin`, both
    //    `subrock://decost/a`) and checked that the first del passed while the
    //    second was refused. under `slug === goal` (assertSlugIsGoal) the slug
    //    IS the goal uri and the slug is PRIMARY, so a goal has exactly one
    //    declarant by construction — a second write on that uri is an EDIT of
    //    the one row, never a peer beside it.
    //
    //    ⇒ so the two-declarant state that guard discriminated cannot arise. a
    //      clamp for an unreachable state proves naught (rule.forbid.failhide),
    //      so it grades the reachable claim: the second write converges onto
    //      the one row, and that row remains the last declarant
    then(
      '[t7] a goal has exactly ONE declarant, so a re-set is an EDIT',
      () => {
        const twin = eco({
          db,
          verb: 'set',
          payload: { slug: 'subrock://decost/a', what: 'a peer' },
        });
        expect(twin.wrote).toEqual('updated');
        expect(delRaw({ slug: 'subrock://decost/a' }).status).toEqual(2);
      },
    );

    // ⚠️ a partial set that names no --goal must not be refused for a
    //    reference it never touched — the FK runs on the MERGED goal
    then(
      '[t8] a partial set that leaves the goal alone is untouched by the FK',
      () => {
        expect(
          setRaw({ slug: 'subrock://decost/a/b', ask: true }).status,
        ).toEqual(0);
      },
    );
  });

  // 🔴 a rename is a SUBTREE fact, so it has its own verb. the strict FK is
  //    what makes it necessary — there is no order of single-row writes that
  //    gets from one goal uri to another without a stranded moment
  given(
    '[case27] a goal rename, which no sequence of sets could express',
    () => {
      const db = genDbPath({ slug: 'eco-goal-mv' });

      const mvRaw = (payload: object) =>
        spawnSync('node', [PATH_ECOWORK_DB, 'goal.mv', db], {
          input: JSON.stringify(payload),
          encoding: 'utf8',
          timeout: 30_000,
        });
      // the slug IS the goal uri, so the set of slugs is the set of goals
      const goalsNow = () =>
        eco({ db, verb: 'get', payload: {} })
          .priorities.map((p: { slug: string }) => p.slug)
          .sort();

      // the rows as seeded; `goal.mv` carries each slug with its uri
      const ROOT = 'bigrock://decost';
      const MID = 'subrock://decost/twilio';
      const LEAF = 'subrock://decost/twilio/audit';

      useBeforeAll(async () => {
        for (const slug of [ROOT, MID, LEAF])
          eco({
            db,
            verb: 'set',
            payload: { slug, what: slug, sev: 'p1', urg: '1w' },
          });
        return {};
      });

      then(
        '[t0] a branch rename carries its descendants, tails preserved',
        () => {
          const moved = eco({
            db,
            verb: 'goal.mv',
            payload: {
              from: 'subrock://decost/twilio',
              to: 'subrock://decost/sms-tune',
            },
          });
          expect(moved.count).toEqual(2);
          expect(goalsNow()).toEqual(
            [
              ROOT,
              'subrock://decost/sms-tune',
              'subrock://decost/sms-tune/audit',
            ].sort(),
          );
        },
      );

      then('[t1] a root SLUG rename rewrites every subrock beneath it', () => {
        const moved = eco({
          db,
          verb: 'goal.mv',
          payload: {
            from: 'bigrock://decost',
            to: 'bigrock://sandpine.decost',
          },
        });
        expect(moved.count).toEqual(3);
        expect(goalsNow()).toEqual(
          [
            'bigrock://sandpine.decost',
            'subrock://sandpine.decost/sms-tune',
            'subrock://sandpine.decost/sms-tune/audit',
          ].sort(),
        );
      });

      // 🔴 the invariant pays for itself: a subrock names the root's SLUG and
      //    never its KIND, so a kind flip is a ONE-ROW edit even with a whole
      //    tree beneath it. a count of 1 here is correct, not a missed subtree
      then(
        '[t2] a root KIND flip moves exactly one row, however deep the tree',
        () => {
          const moved = eco({
            db,
            verb: 'goal.mv',
            payload: {
              from: 'bigrock://sandpine.decost',
              to: 'altrock://sandpine.decost',
            },
          });
          expect(moved.count).toEqual(1);
          expect(goalsNow()).toContain(
            'subrock://sandpine.decost/sms-tune/audit',
          );
        },
      );

      then(
        '[t3] a move into its own subtree is refused — a whole inside its part',
        () => {
          const cycle = mvRaw({
            from: 'altrock://sandpine.decost',
            to: 'subrock://sandpine.decost/x',
          });
          expect(cycle.status).toEqual(2);
          expect(cycle.stderr).toContain('is beneath --from');
        },
      );

      then(
        '[t4] a move of a goal no row declares is refused, rather than a silent no-op',
        () => {
          const ghost = mvRaw({
            from: 'bigrock://ghost',
            to: 'bigrock://other',
          });
          expect(ghost.status).toEqual(2);
          expect(ghost.stderr).toContain('no priority declares');
        },
      );

      // 🔴 a destination in use is a MERGE dressed as a rename: two branches
      //    fold into one, and no second goal.mv can undo it
      then('[t5] a move onto an occupied goal is refused as a merge', () => {
        const merge = mvRaw({
          from: 'subrock://sandpine.decost/sms-tune/audit',
          to: 'subrock://sandpine.decost/sms-tune',
        });
        expect(merge.status).toEqual(2);
        expect(merge.stderr).toContain('MERGE');
      });

      // the destination owes the same reference every goal owes, and a moved
      // subtree may not vouch for its own new parent
      then(
        '[t6] the destination obeys the FK, checked against the rows that STAY',
        () => {
          const nowhere = mvRaw({
            from: 'subrock://sandpine.decost/sms-tune',
            to: 'subrock://sandpine.decost/never/here',
          });
          expect(nowhere.status).toEqual(2);
          expect(nowhere.stderr).toContain('no priority outside');
        },
      );

      then('[t7] a refusal leaves every goal exactly as it was', () => {
        expect(goalsNow()).toEqual(
          [
            'altrock://sandpine.decost',
            'subrock://sandpine.decost/sms-tune',
            'subrock://sandpine.decost/sms-tune/audit',
          ].sort(),
        );
      });
    },
  );

  // 🔴 THE DAG. a goal uri carries one path, so it names one parent chain —
  //    a TREE. the goal that serves two roots is the single highest-value
  //    shape the store can hold ("N birds, one stone"), and a tree cannot
  //    express it AT ALL. every clamp below is about the second parent
  given('[case32] a goal that serves a second root no path names', () => {
    const db = genDbPath({ slug: 'eco-dag' });

    // ⚠️ a slug IS its goal uri (rule.require.rock-goal-treestruct), so the
    //   two ride as one constant and every key below is that uri
    const DECOST = 'bigrock://sandpine.decost';
    const SPEED = 'bigrock://dev-speed';
    const TUNE = 'subrock://sandpine.decost/acu-tune';
    const AUDIT = 'subrock://sandpine.decost/acu-tune/audit';

    const scene = useBeforeAll(async () => {
      const set = (payload: object) =>
        eco({ db, verb: 'set', payload: { sev: 'p2', urg: '1w', ...payload } });

      set({ slug: DECOST, what: 'cut infra cost' });
      set({ slug: SPEED, what: 'ship faster' });
      set({ slug: TUNE, what: 'tune the acu queries' });
      set({ slug: AUDIT, what: 'a child of the multi-parent goal' });

      const before = eco({ db, verb: 'get', payload: { slug: SPEED } });
      const wrote = set({ slug: TUNE, surgoal: [SPEED] });
      const after = eco({ db, verb: 'get', payload: { slug: SPEED } });
      const home = eco({ db, verb: 'get', payload: { slug: DECOST } });
      const whole = eco({ db, verb: 'get', payload: { slug: SPEED } });

      const asSlugs = (result: { priorities: { slug: string }[] }) =>
        result.priorities.map((row) => row.slug).sort();

      return {
        before: asSlugs(before),
        after: asSlugs(after),
        home: asSlugs(home),
        surgoals: wrote.priority.goalSurgoals,
        wholeParts: whole.priorities[0].partsOpen,
        wholeReady: whole.priorities[0].ready,
      };
    });

    // the baseline: without the edge, the second root sees its own row only.
    // 🔴 this assertion is what makes [t1] evidence rather than a tautology
    then(
      '[t0] before the edge the second root rolls up to itself alone',
      () => {
        expect(scene.before).toEqual([SPEED]);
      },
    );

    // 🔴 THE teeth. a path-prefix rollup is blind to this row by
    //    construction — it would return a count that reads complete while
    //    it omits the goal worth the most (term=partial-audit)
    then('[t1] after the edge the second root rolls up the served goal', () => {
      expect(scene.before).not.toContain(TUNE);
      expect(scene.after).toContain(TUNE);
    });

    // a served goal brings its whole subtree. a rollup that took the goal
    // and stopped would report the work as done-in-one and hide its parts
    then('[t2] and every goal beneath the served one comes with it', () => {
      const deep = eco({ db, verb: 'get', payload: { slug: SPEED } });
      const slugs = deep.priorities
        .map((row: { slug: string }) => row.slug)
        .sort();
      expect(slugs).toEqual([SPEED, TUNE, AUDIT].sort());
    });

    // ⚠️ the edge is ADDITIVE, never a move. a goal that gained a second
    //    parent must not fall out of its first — that would silently empty
    //    the rollup the human already reads every day
    then(
      '[t3] the original root still rolls it up — the edge adds, never moves',
      () => {
        expect(scene.home).toEqual([DECOST, TUNE, AUDIT].sort());
      },
    );

    // 🔴 a part gates its whole BY CONSTRUCTION, and the store derives that
    //    from the goal graph. read off the path alone it is blind to the
    //    edge, so the second root would report `ready` with real work open
    //    beneath it — the store would state the part-of relation in one
    //    breath and deny it in the next
    then('[t4] the served whole is gated by its new part', () => {
      expect(scene.wholeParts).toContain(TUNE);
      expect(scene.wholeReady).toEqual(false);
    });

    // a propagated figure a reader cannot trace to a visible edge is a
    // number nobody can audit
    then('[t5] the extra parent is visible on the row', () => {
      expect(scene.surgoals).toEqual([SPEED]);
    });
  });

  given('[case33] the edges a DAG must refuse', () => {
    const db = genDbPath({ slug: 'eco-dag-refuse' });

    // ⚠️ a slug IS its goal uri (rule.require.rock-goal-treestruct)
    const ALPHA = 'bigrock://alpha';
    const BETA = 'bigrock://beta';
    const LEAF = 'subrock://alpha/leaf';
    const ORPHAN = 'bigrock://orphan';

    const scene = useBeforeAll(async () => {
      const set = (payload: object) =>
        eco({ db, verb: 'set', payload: { sev: 'p2', urg: '1w', ...payload } });

      set({ slug: ALPHA, what: 'a root' });
      set({ slug: BETA, what: 'another root' });
      set({ slug: LEAF, what: 'a part of alpha' });

      set({ slug: ORPHAN, what: 'a root that tries to shed its goal' });

      // .why a REAL spawn rather than a try/catch — the exit code carries
      //   half the contract, and a store that refuses on stdout and exits 0
      //   is the defect (rule.require.exit-code-semantics)
      const refused = (payload: object) =>
        spawnSync('node', [PATH_ECOWORK_DB, 'set', db], {
          input: JSON.stringify({ sev: 'p2', urg: '1w', ...payload }),
          encoding: 'utf8',
          timeout: 30_000,
        });

      return {
        undeclared: refused({
          slug: LEAF,
          surgoal: ['bigrock://no-such-root'],
        }),
        redundant: refused({ slug: LEAF, surgoal: [ALPHA] }),
        inverted: refused({ slug: ALPHA, surgoal: [LEAF] }),
        goalless: refused({ slug: ORPHAN, goal: 'none', surgoal: [BETA] }),
      };
    });

    // the same FK the path parent obeys. an edge to a goal nobody declared
    // is a branch with no trunk — invisible to every rollup, and a typo in
    // it reads exactly like a real branch
    then('[t0] an edge to a goal nobody declared is refused', () => {
      expect(scene.undeclared.status).toEqual(2);
      expect(scene.undeclared.stderr).toContain('no priority declares');
    });

    // 🔴 the whole is ALREADY an ancestor by path, so the edge is a second
    //    home for one fact. drop the edge and the relation survives — that
    //    asymmetry is what makes it a defect rather than a duplicate
    then(
      '[t1] an edge that restates the path is refused as a second home',
      () => {
        expect(scene.redundant.status).toEqual(2);
        expect(scene.redundant.stderr).toContain('ALREADY beneath');
      },
    );

    // the direction is the easy mistake, and it is worse than redundant:
    // it makes a whole a part of its own part
    then('[t2] an edge pointed down the tree is refused as inverted', () => {
      expect(scene.inverted.status).toEqual(2);
      expect(scene.inverted.stderr).toContain('inverts the tree');
    });

    // a serve edge runs goal → goal, so a row with no goal could serve naught.
    // 🔴 that row cannot exist: the slug IS the goal, and a write that tries
    //    to clear it is refused before any edge is written
    then(
      '[t3] a write that would strip a row of its goal is refused, edge and all',
      () => {
        expect(scene.goalless.status).toEqual(2);
        expect(scene.goalless.stderr).toContain('set takes no goal');
      },
    );
  });

  // 🔴 a cycle does not merely loop. gain sums UP through parents, so a
  //    cycle inflates both goals without bound on every pass — and it is
  //    locally reasonable at every step, which is why it must be refused
  //    at write rather than detected at read
  given('[case34] a serve edge that would close a cycle', () => {
    const db = genDbPath({ slug: 'eco-dag-cycle' });

    const scene = useBeforeAll(async () => {
      const set = (payload: object) =>
        eco({ db, verb: 'set', payload: { sev: 'p2', urg: '1w', ...payload } });

      set({ slug: 'bigrock://a', what: 'root a' });
      set({ slug: 'bigrock://b', what: 'root b' });
      set({ slug: 'bigrock://c', what: 'root c' });

      set({ slug: 'bigrock://a', surgoal: ['bigrock://b'] });
      set({ slug: 'bigrock://b', surgoal: ['bigrock://c'] });

      return spawnSync('node', [PATH_ECOWORK_DB, 'set', db], {
        input: JSON.stringify({
          slug: 'bigrock://c',
          sev: 'p2',
          urg: '1w',
          surgoal: ['bigrock://a'],
        }),
        encoding: 'utf8',
        timeout: 30_000,
      });
    });

    then(
      '[t0] it is refused, and names the path that already reaches back',
      () => {
        expect(scene.status).toEqual(2);
        expect(scene.stderr).toContain('close a cycle');
        expect(scene.stderr).toContain('bigrock://a');
      },
    );

    // the arithmetic, said out loud, is what makes the refusal teachable —
    // a human who reads "would loop" drops an edge at random; one who reads
    // "sums without bound" knows which end is wrong
    then(
      '[t1] and it says WHY a cycle is unbounded rather than merely circular',
      () => {
        expect(scene.stderr).toContain('without bound');
      },
    );
  });

  // ⚠️ the DAG's edges are part of the STORE, so they are part of the
  //    committed plaintext — never of the derived cache
  //    (define.invariant.eco.the-store-is-plaintext-in-git)
  given('[case35] a serve edge, across a db rebuild', () => {
    const db = genDbPath({ slug: 'eco-dag-mirror' });

    const scene = useBeforeAll(async () => {
      const set = (payload: object) =>
        eco({ db, verb: 'set', payload: { sev: 'p2', urg: '1w', ...payload } });

      set({ slug: 'bigrock://one', what: 'a root' });
      set({ slug: 'bigrock://two', what: 'another root' });
      set({ slug: 'bigrock://one', surgoal: ['bigrock://two'] });

      // ⚠️ `serve.csv` was RENAMED to `goal_decomposition.csv`, and its
      //   endpoints are goal UUIDs rather than uris (setStoreFilesRenamed)
      const lines = getStoreEdges({
        dir: dirname(db),
        file: 'goal_decomposition.csv',
        from: 'part',
        to: 'whole',
      });

      rmSync(db, { force: true });
      rmSync(`${db}-shm`, { force: true });
      rmSync(`${db}-wal`, { force: true });

      return {
        lines,
        rebuilt: eco({ db, verb: 'get', payload: { slug: 'bigrock://two' } }),
      };
    });

    then('[t0] the edge lands in the committed plaintext', () => {
      expect(scene.lines).toEqual([['bigrock://one', 'bigrock://two']]);
    });

    // 🔴 if the edge lived only in the db, a `rm priority.db` would silently
    //    drop it — and the rollup would shrink with no error and no trace
    then('[t1] and the rollup survives a full db deletion', () => {
      const slugs = scene.rebuilt.priorities
        .map((row: { slug: string }) => row.slug)
        .sort();
      expect(slugs).toEqual(['bigrock://one', 'bigrock://two']);
    });
  });
});
