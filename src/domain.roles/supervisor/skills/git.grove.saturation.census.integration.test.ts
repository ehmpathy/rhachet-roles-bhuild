/**
 * .what = clamps on who the census COUNTS — itself, its siblings, the oom witness
 *
 * .note = a PART of the `git.grove.saturation` suite, cut so one reviewer can hold
 *         it whole. the suite's shared fixtures, and its account of what it
 *         runs against and why, live in git.grove.saturation.harness.ts.
 */
import { spawn, spawnSync } from 'child_process';
import { mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { given, then, useThen, when } from 'test-fns';

import { tempDirs } from '../../.test/tempDirs';
import {
  getProbePayload,
  PATH_SAT,
  runPayload,
  SLUG_SIBLING,
} from './git.grove.saturation.harness';

given('[case1] the saturation probe must not COUNT ITSELF', () => {
  /**
   * 🔴 .the measured defect, 2026-09-15, task #110
   *
   *    `ps -o pcpu` is cputime ÷ elapsed-since-start, and the probe's own `ps`
   *    has just started — so its elapsed rounds to near zero and its own share
   *    reads ENORMOUS. measured twice on local, minutes apart:
   *
   *      proc=400|0.0|ps|ps -eo pcpu,pmem,comm,args --sort
   *      proc=300|0.0|ps|ps -eo pcpu,pmem,comm,args --sort=-pcpu
   *
   *    which the render then drew as the box's #1 cpu consumer, above nvim and
   *    claude, in the ONE table a supervisor reads before a prune:
   *
   *      ├─ top     hungriest by cpu
   *      │     ├─ ps                       400% cpu ·   0.0% mem
   *
   *    ⇒ the instrument named itself the culprit. a confident WRONG verdict,
   *      and PERMANENT by construction rather than a load artifact — the probe
   *      is always in its own snapshot (`surgoal.squeeze-the-grove`: "a sampler
   *      IS a saturator").
   */

  when('[t0] the payload is read from source', () => {
    const payload = getProbePayload();

    then('it is the real payload, not an empty read', () => {
      expect(payload.length).toBeGreaterThan(4000);
      expect(payload).toContain('procs_total=');
    });

    then('it captures its OWN process group', () => {
      // ⚠️ the PROCESS GROUP, never the pid. the probe is a shell, its
      //    pipelines, its awks, and its `ps` — all one group. a pid filter
      //    would drop the `ps` and keep the shell that spawned it.
      expect(payload).toContain('__sat_pg');
      expect(payload).toContain('ps -o pgid= -p $$');
    });

    then('it declares ONE self-excluded snapshot reader', () => {
      // .why one: four census sites need the identical exclusion, so it is
      //      declared once — and that is also what makes the drop COUNTABLE.
      expect(payload).toContain('__sat_ps()');
    });
  });

  when('[t1] every process census in the payload is enumerated', () => {
    const payload = getProbePayload();
    // ⚠️ EXECUTED lines only. the skill's `.why` quotes the defective render
    //    verbatim — `proc=400|0.0|ps|ps -eo pcpu,pmem,comm,args --sort` — so a
    //    naive `ps -e` match graded the EVIDENCE as a census and went red on
    //    the very comment that records the cure. measured on the first GREEN
    //    run. a comment is not a census.
    const censuses = payload
      .split('\n')
      .filter((line) => !/^\s*#/.test(line))
      .filter((line) => /\bps -e/.test(line));

    then('there are censuses to grade — the enumeration is not vacuous', () => {
      // ⚠️ ANTI-VACUITY. a regex that matched no line would satisfy the
      //    for-loop below over an empty set and read as a clean pass — the
      //    failhide shape this suite forbids (rule.forbid.failhide).
      expect(censuses.length).toBeGreaterThanOrEqual(3);
    });

    /**
     * 🔴 this arm was NARROWED on 2026-09-15, by #111, and the reason is worth
     *    more than the arm.
     *
     *    it read: "every one of them selects `pgid`, so the exclusion can key
     *    on it" — DERIVED over every `ps -e` line, deliberately, so that "a
     *    census site added later with no pgid column reddens this clamp."
     *
     *    #111's cure added exactly such a line, and this clamp went red:
     *
     *      __sat_kin=$(ps -eo pid=,ppid= 2>/dev/null | awk ...
     *
     *    ⇒ THE CLAMP WAS RIGHT TO FIRE, and the answer is not to loosen it. that
     *      read is not a census: it builds the kin closure, so it must see EVERY
     *      process — the probe's own group included — or the parent map has
     *      holes and the closure silently under-drops.
     *
     * ⇒ so the derivation is re-pointed rather than relaxed. every `ps -e` read
     *   must be accounted for by exactly ONE of three declared kinds, and the
     *   SUM is asserted against the total — which is what keeps a fourth,
     *   unaccounted census red.
     *
     * ⚠️ the sum carries this arm's whole weight. drop it and a new raw census
     *   matches no kind, is graded by no claim, and passes
     *   (rule.forbid.failhide).
     */
    const readsCensus = censuses.filter((line) => line.includes('$fields'));
    const readsWitness = censuses.filter((line) =>
      line.includes('procs_self='),
    );
    const readsClosure = censuses.filter((line) => line.includes('__sat_kin='));

    then('every `ps -e` read is one of three declared kinds', () => {
      expect(
        readsCensus.length + readsWitness.length + readsClosure.length,
      ).toBe(censuses.length);
      // ⚠️ ANTI-VACUITY per kind — a renamed seam would empty one bucket and
      //    still satisfy the sum.
      expect(readsCensus.length).toBeGreaterThanOrEqual(2);
      expect(readsWitness.length).toBe(1);
      expect(readsClosure.length).toBe(1);
    });

    then('the CENSUS reads select both keys the two filters need', () => {
      // 🔴 `pgid` for #110 (the probe's own group) and `pid` for #111 (the kin
      //    set). neither filter subsumes the other, because `timeout` puts each
      //    probe in a group of its own.
      for (const census of readsCensus) {
        expect(census).toContain('pid,pgid');
      }
    });

    then('the WITNESS read keys on pgid — it counts what #110 dropped', () => {
      expect(readsWitness[0]).toContain('pgid');
    });

    then('the CLOSURE read is UNFILTERED, and takes ppid', () => {
      // 🔴 the one read that must NOT be narrowed. a parent map with holes
      //    yields a closure that under-drops, and an under-drop leaves a
      //    surplus instrument row — the safe direction, but still the defect
      //    #111 is.
      expect(readsClosure[0]).toContain('ppid');
      expect(readsClosure[0]).not.toContain('$fields');
    });
  });

  when('[t2] the payload runs on this box', () => {
    // ⚠️ an OBJECT, never the bare string. `useThen` hands back a PROXY that
    //    defers access, and a proxy over a primitive is not a primitive: a
    //    `expect(proxy).toMatch(...)` reads it as a char-indexed object and
    //    goes red for a reason that has naught to do with the defect —
    //    measured here, on the first RED run. property access unwraps, so the
    //    payload rides on a named field (the crewwork suite's own pattern).
    const ran = useThen('the probe exits clean', () => {
      // 🔴 a LOAD SOURCE, so the `roll=` arm below cannot pass or fail on the
      //    runner's mood. `roll=` carries a `>= 1%` cpu floor (see the timeout
      //    suite's idle-box case), so a fully idle ci runner emits zero rows —
      //    measured red on ci, 2026-10-07. a detached spinner sits in its OWN
      //    process group, so the self-filter cannot drop it, and it holds a full
      //    core for the probe's whole read.
      const spinner = spawn('sh', ['-c', 'while :; do :; done'], {
        detached: true,
        stdio: 'ignore',
      });
      spawnSync('sleep', ['1']);
      const out = spawnSync('bash', ['-c', getProbePayload()], {
        encoding: 'utf8',
        timeout: 120_000,
      });
      process.kill(-spinner.pid!, 'SIGKILL');
      if (out.status !== 0)
        throw new Error(
          `the probe exited ${out.status} — a clamp on its OUTPUT cannot run: ${out.stderr}`,
        );
      return { emitted: out.stdout };
    });

    then(
      'it reports how many of its OWN rows it dropped, and it is >= 1',
      () => {
        // 🔴 THE DETERMINISTIC HALF, and the reason this key exists at all.
        //
        //    the `proc=` assertion below is the MEASURED defect, and its redness
        //    is load-sensitive: `ps`'s own share is start-relative, so on a busy
        //    4-cpu grove it once fell below the top-3 cut while on local it read
        //    300-400%. so the teeth cannot rest on it alone.
        //
        //    the probe is in its own snapshot on EVERY box, at every load. so a
        //    count of its own dropped rows is >= 1 always, and a cure that
        //    filters no row at all is caught with no reliance on timing.
        const self = ran.emitted.match(/^procs_self=(\d+)$/m);
        expect(self).not.toBeNull();
        expect(Number(self![1])).toBeGreaterThanOrEqual(1);
      },
    );

    then('no emitted row names `ps` as the program', () => {
      const rows = ran.emitted
        .split('\n')
        .filter((line) => /^(proc|roll|cens|greeds)=/.test(line));

      // ⚠️ ANCHORED, like the count above. a bare negative over an empty set
      //    passes vacuously.
      expect(rows.length).toBeGreaterThanOrEqual(4);
      for (const row of rows) {
        const [, ...fields] = row.split('=');
        const parts = fields.join('=').split('|');
        expect(parts).not.toContain('ps');
      }
    });

    then('it still emits every row kind — the cure broke no census', () => {
      // a cure that silences the tables is not a cure. each census must still
      // speak (rule.forbid.clipped-sweeps).
      expect(ran.emitted).toMatch(/^proc=/m);
      expect(ran.emitted).toMatch(/^roll=/m);
      expect(ran.emitted).toMatch(/^cens=/m);
      expect(ran.emitted).toMatch(/^greeds=/m);
      expect(ran.emitted).toMatch(/^procs_total=\d+$/m);
      expect(ran.emitted).toMatch(/^procs_zombie=\d+$/m);
      expect(ran.emitted).toMatch(/^procs_dstate=\d+$/m);
    });

    // 🔴 `grep -c` prints `0` on no match AND exits 1, so a `|| echo 0`
    //    fallback emits a second, keyless `0` line. a host with no zombie
    //    and no D-state proc hits that path on every sweep
    then('no count emits a stray keyless line', () => {
      expect(ran.emitted).not.toMatch(/^\d+$/m);
    });
  });
});

/**
 * .what = sweep the temp dirs [case2] made
 * .why  = each arm writes a payload file and a spinner; a suite that litters
 *         /tmp is clean on run 1 and filthy on run 1000.
 */
afterAll(() => {
  tempDirs.delAll();
});

given('[case2] the saturation probe must not count its SIBLING probes', () => {
  /**
   * 🔴 .the measured defect, 2026-09-15, task #111 — the residue of #110
   *
   *    #110 removed the probe's own `ps` from its own census. the LOCAL render
   *    then still carried this row:
   *
   *      ├─ top     hungriest by cpu
   *      │     ├─ nvim                    15.1% cpu ·   2.5% mem
   *      │     ├─ nvim                    12.5% cpu ·   4.2% mem
   *      │     └─ ssh                     12.2% cpu ·   0.0% mem
   *      │         ssh -n -o BatchMode
   *
   *    that `ssh -n -o BatchMode` is THIS SKILL's own grove probe — the fan-out
   *    at git.grove.saturation.sh:517. so the instrument was still naming
   *    itself the box's #3 cpu consumer, one process group over.
   *
   * 🔴 .why #110's filter cannot reach it, and why that is STRUCTURAL
   *    the fan-out runs each probe under `timeout`, and `timeout` calls
   *    setpgid(0,0) — that is HOW it kills the whole group on expiry. so every
   *    probe lands in its OWN new group. `__sat_pg`, computed inside the
   *    payload from its own `$$`, therefore covers the payload and its children
   *    EXACTLY, and covers neither its siblings nor the skill above it.
   *
   * 🔴 .the cure is an ANCESTRY filter, and the bound is the whole design
   *    the skill hands the local payload its own pid (`SAT_SELF_ROOT`), and the
   *    payload drops every process whose parent chain reaches it.
   *
   *      the skill excludes what it SPAWNS — never what spawned it.
   *
   *    that bound is not a nicety. root the closure one level HIGHER (at
   *    `$PPID`) and the width becomes the CALLER's: run by hand from an
   *    interactive shell, `$PPID` is the human's shell, and the filter would
   *    hide every process that shell ever started. a HIDDEN real consumer costs
   *    a wrong prune decision, which is the one direction this skill must never
   *    fail. rooted at `$$`, the width is exactly this invocation's own tree —
   *    bounded by construction, on any box, under any caller.
   *
   * ⚠️ .and the same argument REFUSES the two obvious cures
   *    - `timeout --foreground` would put every probe in one group and one
   *      filter would cover all of them — but that group is INHERITED, so its
   *      width is the caller's again, and on a babysit tick that group can hold
   *      the clone that ran the sweep.
   *    - an argv blocklist (`ssh -n -o BatchMode`) would hide a HUMAN's own ssh.
   *
   * ⚠️ .the ONE payload stays one payload
   *    the same bytes run under `bash -c` locally and are handed to `ssh`
   *    remotely (the skill's own comment at :509 — "a divergent local reader
   *    would be a second instrument for one question, and the two would
   *    drift"). so the seam is an OPTIONAL env that only the local arm sets,
   *    and it is HOST-GUARDED: the value carries `hostname:pid`, and a payload
   *    that reads a hostname other than its own refuses it. t2 is that clamp —
   *    a pid from this box means naught on a grove, and a leaked value must be
   *    inert rather than merely unlikely.
   */

  when('[t0] the payload and the fan-out are read from source', () => {
    const payload = getProbePayload();
    const src = readFileSync(PATH_SAT, 'utf8');

    then('the payload reads an OPTIONAL root, so it stays one payload', () => {
      expect(payload).toContain('SAT_SELF_ROOT');
      expect(payload).toContain('__sat_root');
    });

    then(
      'the root is HOST-GUARDED — a leaked value is inert, not unlikely',
      () => {
        // the guard is what makes an optional env safe to hand across a box
        // boundary at all. without it the seam rests on ssh's default of not
        // forwarding env, which is a property of the CALLER's ssh config.
        const at = payload.indexOf('__sat_root');
        expect(at).toBeGreaterThan(0);
        expect(payload.slice(at, at + 600)).toContain('hostname');
      },
    );

    then('every census site inherits the drop, via __sat_ps', () => {
      // .why through __sat_ps: six census sites need the identical exclusion.
      //      #110 already paid for that seam; a seventh site added later
      //      inherits this filter for free, and cannot forget it.
      const at = payload.indexOf('__sat_ps()');
      expect(at).toBeGreaterThan(0);
      const body = payload.slice(at, payload.indexOf('\n}', at));
      expect(body).toContain('kinset');
    });

    then('the CLOSURE itself is declared exactly once', () => {
      // 🔴 the property, not the token. a fixpoint copied per census site would
      //    drift — and worse, would cost six closures where one serves, which
      //    is the census-over-counter waste `surgoal.squeeze-the-grove` names.
      //
      // ⚠️ EXECUTED lines only. this payload's own `.why` block explains the
      //    closure in prose, so a naive count over the whole text grades the
      //    comment that documents the cure (the #96 false-green, avoided here
      //    in advance).
      //
      // ⚠️ and the token is the FIXPOINT STEP, not a bare `in kin)` — the
      //    emit line (`for (k in kin) print k`) holds that substring too, so
      //    the loose form counted 2 and read as a second closure. measured on
      //    the first GREEN run.
      const spoken = payload
        .split('\n')
        .filter((line) => !/^\s*#/.test(line))
        .filter((line) => line.includes('par[i] in kin'));
      expect(spoken.length).toBe(1);
    });

    then(
      'it reports how many kin it dropped — the deterministic witness',
      () => {
        // the `top` and `roll` symptoms are load-sensitive (an `ssh` blocked on
        // connect burns no cpu and may sit below every cut), so no table can
        // PROVE the filter ran. a count can. same argument as #110's procs_self.
        expect(payload).toContain('procs_kin=');
      },
    );

    then('the LOCAL arm sets the root and the REMOTE arm does not', () => {
      // 🔴 DERIVED over the fan-out's two arms. this is the assertion that
      //    grades the GAP the defect lives in — the payload could be perfect
      //    and the skill could still never hand it a root.
      const at = src.indexOf('# fan out');
      expect(at).toBeGreaterThan(0);
      const end = src.indexOf('# render', at);
      expect(end).toBeGreaterThan(at);
      const fan = src
        .slice(at, end)
        .split('\n')
        .filter((line) => !/^\s*#/.test(line));

      const local = fan.filter((line) => line.includes('bash -c "$PROBE"'));
      const remote = fan.filter((line) =>
        line.includes('timeout "$TIMEOUT" ssh'),
      );

      // ⚠️ ANTI-VACUITY on both sides. a renamed arm would satisfy two empty
      //    filters and read as a clean pass (rule.forbid.failhide).
      expect(local.length).toBe(1);
      expect(remote.length).toBe(1);

      expect(local[0]).toContain('SAT_SELF_ROOT=');
      expect(remote[0]).not.toContain('SAT_SELF_ROOT');
    });
  });

  when(
    '[t1] the payload runs with NO root — the remote path, unchanged',
    () => {
      const ran = useThen('the probe exits clean', () => ({
        emitted: runPayload({ slug: 'sat-kin-inert', root: null }),
      }));

      then('it drops no kin at all — the seam is INERT without the env', () => {
        // 🔴 the safety half. every grove read takes this path, so a non-zero
        //    here would mean the cure changed a measurement on 4 boxes to repair
        //    a render on 1.
        expect(ran.emitted).toMatch(/^procs_kin=0$/m);
      });

      then('and it still drops its own group — #110 is untouched', () => {
        const self = ran.emitted.match(/^procs_self=(\d+)$/m);
        expect(self).not.toBeNull();
        expect(Number(self![1])).toBeGreaterThanOrEqual(1);
      });
    },
  );

  when('[t2] the payload runs with a root from ANOTHER box', () => {
    const ran = useThen('the probe exits clean', () => ({
      emitted: runPayload({ slug: 'sat-kin-foreign', root: 'not-this-box' }),
    }));

    then(
      'it REFUSES the root — a pid from one box means naught on another',
      () => {
        // 🔴 the hazard the task named: "a pgid from this box means naught on a
        //    grove, so a hardcoded exclusion would either be inert remotely or,
        //    worse, drop an unrelated remote group." this arm makes that second
        //    half impossible rather than improbable.
        expect(ran.emitted).toMatch(/^procs_kin=0$/m);
      },
    );
  });

  when("[t3] the payload runs with THIS box's root, beside a sibling", () => {
    const ran = useThen('the probe exits clean', () => ({
      emitted: runPayload({
        slug: 'sat-kin-fires',
        root: 'self',
        sibling: true,
      }),
    }));

    then('it drops at least one kin — the filter FIRED', () => {
      const kin = ran.emitted.match(/^procs_kin=(\d+)$/m);
      expect(kin).not.toBeNull();
      expect(Number(kin![1])).toBeGreaterThanOrEqual(1);
    });

    then(
      'no emitted row names the SIBLING — the measured defect, closed',
      () => {
        // 🔴 THE MEASURED ARM. the sibling is a `timeout`-wrapped spinner in its
        //    OWN process group, spawned by the same root — the topology of the
        //    `ssh -n -o BatchMode` row above, reproduced. it burns a full core
        //    for ~1.5s before the probe reads, so under the un-fixed payload it
        //    lands in `proc=` (top-3 by cpu) and in `roll=` (top-6 by summed
        //    cpu). that is what makes this arm bite rather than pass vacuously.
        const rows = ran.emitted
          .split('\n')
          .filter((line) => /^(proc|roll|cens|greeds)=/.test(line));

        // ⚠️ ANCHORED. a bare negative over an empty set passes vacuously.
        expect(rows.length).toBeGreaterThanOrEqual(4);
        for (const row of rows) {
          expect(row).not.toContain(SLUG_SIBLING);
        }
      },
    );

    then('it still emits every row kind — the cure broke no census', () => {
      expect(ran.emitted).toMatch(/^proc=/m);
      expect(ran.emitted).toMatch(/^roll=/m);
      expect(ran.emitted).toMatch(/^cens=/m);
      expect(ran.emitted).toMatch(/^greeds=/m);
      expect(ran.emitted).toMatch(/^procs_total=\d+$/m);
    });
  });

  when('[t4] the WHOLE SKILL runs, fan-out and all', () => {
    const ran = useThen('the skill exits clean', () => {
      // ⚠️ `--only local`, so this stays HERMETIC — no ssh, no network, no
      //    grove touched (rule.require.hermetic-tests). the sibling topology is
      //    proven in t3; what THIS arm proves is that the seam is wired in the
      //    fan-out, which is the gap the defect actually lived in.
      const forest = tempDirs.genOne({ slug: 'sat-kin-forest' });
      mkdirSync(join(forest, 'groves'), { recursive: true });
      const out = spawnSync('bash', [PATH_SAT, '--only', 'local', '--json'], {
        encoding: 'utf8',
        timeout: 180_000,
        env: { ...process.env, GIT_FOREST_DIR: forest },
      });
      if (out.status !== 0)
        throw new Error(
          `the skill exited ${out.status} — a clamp on its OUTPUT cannot run: ${out.stderr}`,
        );
      return { emitted: out.stdout };
    });

    then('it read local, and local alone', () => {
      // the fixture forest holds no grove json, so no other key may appear —
      // which is what keeps this arm hermetic AND fast.
      const keys = ran.emitted
        .split('\n')
        .filter((line) => /^grove=/.test(line));
      expect(keys).toEqual(['grove=local']);
    });

    then('the local probe was handed a root, and it FIRED', () => {
      // 🔴 under the un-fixed skill this key does not exist at all, so the
      //    match is null and this reddens. the floor is 1 rather than a
      //    specific count: the kin are the skill, its fan-out subshell, the
      //    `timeout`, and the payload — a count would over-fit the topology.
      const kin = ran.emitted.match(/^procs_kin=(\d+)$/m);
      expect(kin).not.toBeNull();
      expect(Number(kin![1])).toBeGreaterThanOrEqual(1);
    });
  });
});

given('[case3] the oom count must have a witness a GROVE can read', () => {
  /**
   * 🔴 .the measured defect, 2026-09-16
   *
   *    the oom arm had exactly two witnesses, and both are journal reads. on a
   *    grove the user holds neither the journal groups nor sudo, so BOTH read
   *    blind and the arm rendered:
   *
   *      ├─ oom     ⚪ not measured — no journal access on this box  ·  guard: earlyoom
   *      │          (a kill here is INVISIBLE to us, never absent — grant the
   *      │           grove user the journal groups, or read it with sudo)
   *
   *    measured the same minute on grove-sandpine-v20260901, as `camper`, no sudo:
   *
   *      $ cat /sys/fs/cgroup/user.slice/user-1002.slice/memory.events
   *      oom_kill 2
   *
   *    ⇒ TWO clones had been culled and the instrument called the axis
   *      unmeasured — while memory graded 🔴 (17% available, full 38% @60s, no
   *      swap cushion, so "pressure ooms rather than thrashes"). the blindness
   *      landed on the ONE axis that was red.
   *
   * 🔴 .and the printed fix named the WRONG LEVER. it asked for a privilege
   *    grant on a shared host — a human-owned, slow, security-relevant ask —
   *    for a counter that needed no privilege at all. a supervisor who obeyed
   *    it would escalate to a human and wait, for a signal already in reach
   *    (`surgoal.squeeze-the-grove`: sample COUNTERS, never GAUGES; and the
   *    surgoal's own table names `memory.events oom_kill` as readable with
   *    "NO journal access").
   */

  when('[t0] the probe payload is read from source', () => {
    const payload = getProbePayload();

    then('it carries a cgroup witness at all', () => {
      // 🔴 under the un-fixed skill this key does not exist, so both reddens.
      expect(payload).toContain('oom_cgkills=');
      expect(payload).toContain('memory.events');
    });

    then('it reads a COUNTER, never a census', () => {
      // 🔴 the surgoal's hard rule: an enumeration over N processes costs O(N)
      //    forks per sample and JOINS the queue it measures on a 🔴 box. this
      //    witness must stay 1 read, whatever the process count — so no `ps`,
      //    no loop, no fan-out may appear on the line that produces it.
      const line = payload
        .split('\n')
        .filter((l) => !/^\s*#/.test(l))
        .join('\n')
        .match(/oom_cgkills=[\s\S]*?\n(?=[a-z_]+=|\s*$)/);
      expect(line).not.toBeNull();
      expect(line![0]).not.toMatch(/\bps\s+-e/);
      expect(line![0]).not.toMatch(/\bfor\s+\w+\s+in\b/);
    });

    then('it reads the AGGREGATE slice, keyed on no uid at all', () => {
      // 🔴 .this arm is the sharpest in the file, and it was written AFTER the
      //    first draft of the cure shipped a WRONG 🟢 to production.
      //
      //    that draft read `user.slice/user-$(id -u).slice`, on the claim that
      //    a clone runs as the grove user. but a grove is registered TWICE —
      //    `<name>.ground` and `<name>` — and the fan-out ssh's through ONE of
      //    them (`GROVE_PROBER`), which is the `.ground` login:
      //
      //      ground → uid 1001 · user-1001.slice → oom_kill 0
      //      camper → uid 1002 · user-1002.slice → oom_kill 2   ← the clones
      //      aggregate         · user.slice      → oom_kill 2
      //
      //    so `$(id -u)` picked the PROBER's own near-empty slice, the first
      //    path succeeded with 0, the fallback never fired, and the grove
      //    rendered `🟢 no kills` on a box where two clones had been culled.
      //
      // ⇒ ⚪ "I cannot see" became 🟢 "no kills" — strictly WORSE than the
      //   blindness the cure was written to repair. the grain is the BOX, and
      //   any uid key answers a question about the login instead.
      expect(payload).toContain('/sys/fs/cgroup/user.slice/memory.events');
      const seg = payload.slice(payload.indexOf('echo "oom_cgkills='));
      expect(seg.slice(0, 400)).not.toContain('id -u');
    });

    then('it distinguishes UNREADABLE from measured-zero', () => {
      // 🔴 the whole arm exists for that distinction. a sentinel of 0 would
      //    render 🟢 "no kills" on a box that measured naught — the exact
      //    false-report the ⚪ state was added to prevent.
      const seg = payload.slice(payload.indexOf('oom_cgkills='));
      expect(seg).toMatch(/print "-"/);
      expect(seg).not.toMatch(/print "0"/);
    });
  });

  when('[t1] the payload RUNS on this box', () => {
    const ran = useThen('the probe exits clean', () => {
      // hermetic: the payload is one self-contained bash string, run here —
      // same instrument, same box, no ssh and no grove within reach
      // (rule.require.hermetic-tests), exactly as [case1] runs it.
      const out = spawnSync('bash', ['-c', getProbePayload()], {
        encoding: 'utf8',
        timeout: 120_000,
      });
      if (out.status !== 0)
        throw new Error(
          `the probe exited ${out.status} — a clamp on its OUTPUT cannot run: ${out.stderr}`,
        );
      return { emitted: out.stdout };
    });

    then('it emits the cgroup witness as a key', () => {
      // 🔴 under the un-fixed skill the key is absent entirely → null → red.
      expect(ran.emitted).toMatch(/^oom_cgkills=/m);
    });

    then('the witness READS on this box — a number, not the sentinel', () => {
      // ⚠️ this arm is the one that proves the cure works rather than merely
      //    compiles. linux with cgroup v2 always mounts a user slice for a
      //    logged-in uid, so a sentinel here means the path logic is wrong.
      //    measured 2026-09-16: grove reads 2, local reads 2.
      const hit = ran.emitted.match(/^oom_cgkills=(.+)$/m);
      expect(hit).not.toBeNull();
      expect((hit?.[1] ?? '').trim()).toMatch(/^\d+$/);
    });
  });

  when('[t2] the RENDER seam is read from source', () => {
    // 🔴 .this arm exists because a green probe clamp proves the DETECTOR and
    //    says NOT ONE THING about the render. that failure has now landed
    //    three times on this fleet in two days: a detector went green while
    //    the row a human reads never moved
    //    (rule.always.capture-clamp-then-verify-in-prod).
    const src = readFileSync(PATH_SAT, 'utf8');

    then('the third witness is WIRED into oom_seen', () => {
      // 🔴 the whole cure. without this the probe emits a number nobody reads,
      //    and the grove stays ⚪ forever — green suite, unmoved render.
      const seen = src.match(/^\s*oom_seen=.*$/m);
      expect(seen).not.toBeNull();
      expect(seen![0]).toContain('oom_cgok');
    });

    then('the journal is PREFERRED, and the two are never summed', () => {
      // ⚠️ they have different denominators: the journal counts kernel oom
      //    lines system-wide, the cgroup counts kills in ONE slice. measured
      //    2026-09-16 on local, where both read: journal 7, cgroup 2. a sum
      //    would double-count every box that has both.
      expect(src).toContain('oom_ksrc');
      expect(src).not.toMatch(/oom_kills\s*\+\s*oom_cgkills/);
      expect(src).not.toMatch(/oom_cgkills\s*\+\s*oom_kills/);
    });

    then('the fallback keys on LINES, never on the kill count', () => {
      // 🔴 the discriminator must be oom_klines. a readable journal that saw
      //    zero oom lines is a measured 0 and must NOT be overwritten by the
      //    narrower cgroup figure; only an UNREADABLE journal reports zero
      //    lines. to key on oom_kills would silently downgrade a real measure.
      const at = src.indexOf('oom_ksrc=cgroup');
      expect(at).toBeGreaterThan(0);
      const guard = src.slice(Math.max(0, at - 400), at);
      expect(guard).toContain('oom_klines');
    });

    then('the earlyoom half is UNKNOWN when its journal is blind', () => {
      // 🔴 earlyoom TERMs from userland and never increments the kernel
      //    counter, so the cgroup witness cannot stand in for it. to print a
      //    `0 by earlyoom` beside a measured kernel count would trade one
      //    false report for another (term=false-report).
      expect(src).toContain('oom_esrc');
      expect(src).toMatch(/UNCOUNTED/);
    });

    then('the ⚪ branch no longer prescribes a PRIVILEGE GRANT', () => {
      // 🔴 the second half of the defect. the old text sent a supervisor to a
      //    human for a lever that was never needed. a render may still say the
      //    axis is unmeasured — it may not name that cure.
      // ⚠️ ANCHORED ON THE ECHO, never on the bare phrase. the phrase also
      //    appears in the probe's own comment, which QUOTES the old render as
      //    evidence — so a bare indexOf grades the comment and reddens against
      //    a cure that landed. this clamp caught exactly that on its first run.
      const at = src.indexOf('├─ oom     ⚪ not measured');
      expect(at).toBeGreaterThan(0);
      const branch = src.slice(at, at + 400);
      expect(branch).not.toContain('journal groups');
      expect(branch).not.toContain('sudo');
    });

    then('no bare AND-list closes an oom branch', () => {
      // 🔴 `set -euo pipefail` is live (line 67). an AND-list whose test is
      //    false returns 1 as the branch's last command, so the whole `if`
      //    returns 1 and the report ABORTS mid-render rather than degrades one
      //    arm. this clamp went red on my own first draft.
      const at = src.indexOf('🟢 no kills in');
      expect(at).toBeGreaterThan(0);
      const branch = src.slice(at, at + 700);
      expect(branch).not.toMatch(/^\s*\[\[[^\n]*\]\]\s*&&\s*\\?\s*$/m);
      expect(branch).not.toMatch(/^\s*\[\[[^\n]*\]\]\s*&&\s*echo/m);
    });
  });
});
