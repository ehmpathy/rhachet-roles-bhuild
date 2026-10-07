/**
 * .what = clamps on what the render SAYS — ungraded load hints, grove words, re-read bounds
 *
 * .note = a PART of the `git.grove.saturation` suite, cut so one reviewer can hold
 *         it whole. the suite's shared fixtures, and its account of what it
 *         runs against and why, live in git.grove.saturation.harness.ts.
 */
import { spawnSync } from 'child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { given, then, useThen, when } from 'test-fns';

import { tempDirs } from '../../.test/tempDirs';
import { PATH_SAT, PATH_SPEND } from './git.grove.saturation.harness';

/**
 * .what = sweep the temp dirs [case2] made
 * .why  = each arm writes a payload file and a spinner; a suite that litters
 *         /tmp is clean on run 1 and filthy on run 1000.
 */
afterAll(() => {
  tempDirs.delAll();
});

/**
 * .what = the ungraded-load hint names CANDIDATES, never an unmeasured cause
 * .why  = it said `so this reads the MEMORY axis` until 2026-09-19. that is a
 *         cause asserted without a measurement, and two rows on the SAME render
 *         refuted it — measured that day on grove-sandpine-v20260901:
 *
 *           load 7.13 · runq 0 · holds `0 in D` · ram stall 0.00%@60s · 23% free
 *
 *         under the old clause a load of 7.13 needs ~7 tasks in uninterruptible
 *         sleep. there were none, and the axis it named read clean.
 *
 *         ⚠️ the category error beneath: LOAD is a decayed average over 1/5/15m,
 *         while runq and the D-count are INSTANTS. `runq 0, therefore memory`
 *         compares an average to a sample.
 *
 *         🔴 the harm is a MISDIRECTED READ, and it does not need an idle box:
 *         D-state is memory reclaim OR disk io OR a network fs. where the real
 *         axis is disk, the old clause sent a supervisor to memory, memory read
 *         clean, and the red disk row went unexamined.
 *
 *         ⚠️ the extant clamps assert only that the hint EXISTS
 *         (`toContain('load  ungraded')`), so its CONTENT was unclamped. this
 *         case is orthogonal to those and does not replace them.
 */
given('[case-load-ungraded] the hint names candidates, not a cause', () => {
  /**
   * .what = the echo lines the arm emits, comments stripped
   * .why  = 🔴 LOAD-BEARING, not decoration. the `.why` block above the arm in
   *         source quotes `reads the MEMORY axis` verbatim to record what was
   *         cured. a slice that kept comments would hand that phrase to the
   *         absence tooth below, which would then go red on the cure's own
   *         account of itself.
   */
  const hintLines = (): string[] => {
    const src = readFileSync(PATH_SAT, 'utf8');
    const at = src.indexOf('echo "   │     ├─ ⚠️ load  ungraded');
    expect(at).toBeGreaterThan(0);
    const end = src.indexOf('\n  fi', at);
    expect(end).toBeGreaterThan(at);
    return src
      .slice(at, end)
      .split('\n')
      .filter((line) => !/^\s*#/.test(line) && /echo/.test(line));
  };

  when('[t0] a load the run queue does not back is rendered', () => {
    then('🔴 ANTI-VACUITY — the arm is found and emits its lines', () => {
      // a rename of the echo, or a delete of the arm, empties this filter and
      // every assertion below passes on an empty array, which reads as clean
      // (rule.forbid.failhide).
      expect(hintLines().length).toBeGreaterThanOrEqual(6);
    });

    then('🔴 it does NOT assert the MEMORY axis as the cause', () => {
      // the defect itself, verbatim.
      const body = hintLines().join('\n');
      expect(body).not.toContain('reads the MEMORY axis');
      expect(body).not.toContain('MEMORY axis');
    });

    then('🔴 it parts the AVERAGE from the INSTANTS', () => {
      // the category error. without this, `runq 0` reads as proof about a
      // quantity that is not sampled at the same grain.
      const body = hintLines().join('\n');
      expect(body).toContain('DECAYED AVERAGE');
      expect(body).toContain('INSTANTS');
      expect(body).toContain('OUTLIVES its burst');
    });

    then('🔴 it names ALL THREE D-state candidates, never one', () => {
      // the misdirected-read harm. one named cause sends the reader to one
      // axis; three send them to the discriminator.
      const body = hintLines().join('\n');
      expect(body).toContain('memory reclaim');
      expect(body).toContain('disk io');
      expect(body).toContain('network fs');
      expect(body).toContain('never memory alone');
    });

    then('it points at the discriminator this render already prints', () => {
      const body = hintLines().join('\n');
      expect(body).toContain('stall rows');
      expect(body).toContain('in D');
    });

    then('COUNTER — the two clauses that were CORRECT survive', () => {
      // scope tooth. the cure replaces one clause of three; a rewrite that
      // lost the measured runq fact or the grade prescription would repair
      // the false cause and regress the parts that were right.
      const body = hintLines().join('\n');
      expect(body).toContain('so no task waits on cpu');
      expect(body).toContain('grade cpu on stall + life, never on load');
    });

    then('COUNTER — the TRIGGER is unchanged, so only the text moved', () => {
      // the cure is about what the arm SAYS. if its guard drifted, the arm
      // would fire on a different population and this whole case would grade
      // a render no supervisor sees.
      const src = readFileSync(PATH_SAT, 'utf8');
      expect(src).toContain('if [[ "$runq_backs_load" == "no" ]]');
      expect(src).toContain(
        'awk -v p="${load_pct:-0}" \'BEGIN{exit !(p+0>=100)}\'',
      );
    });
  });
});

/**
 * .what = spend must address a grove in the SAME words every peer verb uses
 *
 * 🔴 .the measured defect, 2026-09-19, mid-babysit-tick — TWO rounds, one call
 *
 *    a supervisor held `cloud://grove-sandpine-v20260901` in hand, because that
 *    is the form `git.crew.poll --grove`, `git.crew.read --grove`, and
 *    `git.crew.send --grove` all take. it typed that same value here:
 *
 *      round 1   --grove <uri>    →  ✋ unknown flag '--grove'
 *      round 2   --only  <uri>    →  🐢 grove 'cloud://…' is not registered
 *
 *    both exit 2. the grove was registered and reachable the whole time.
 *
 * ⚠️ .they are TWO defects, and the second is the worse one
 *
 *    the flag name is a plain `rule.forbid.domain-term-inconsistency`: one
 *    concept — WHICH grove to read — carried two words across one verb family.
 *    it costs a round and the error names the fix, so a reader recovers.
 *
 *    the uri refusal is a `term=false-report`. "is not registered" is a true
 *    claim about the skill's own filename lookup, stated as a verdict about
 *    the WORLD. a reader who believes it hunts a registry defect that does not
 *    exist, and `rhx git.grove.list` — the fix the error names — shows the
 *    grove present, which reads as a defective registry rather than a parse.
 *
 * ⇒ so the cure is two lines and the clamp is behavioral: the teeth below run
 *   the real skill against a temp forest, because a source grep would pass on
 *   a `--grove` case arm that never reached the resolver.
 *
 * 🟡 .the bound — these teeth grade RESOLUTION, never the probe
 *    a fake grove cannot be ssh'd, so each run below fails at the READ. that is
 *    the point: the flag and the uri are settled strictly BEFORE any ssh, so
 *    the discriminator is which error came back, never whether it exited 0.
 */
given('[case11] a grove is addressed in the words its peer verbs use', () => {
  const ERR_FLAG = "unknown flag '--grove'";
  const ERR_ABSENT = 'is not registered';

  /**
   * .what = run the real spend skill against a forest that holds one grove
   * .why  = GIT_FOREST_DIR is the skill's own seam (it reads
   *         `${GIT_FOREST_DIR:-$HOME/.git.forest}/groves`), so a temp forest is
   *         hermetic with no fleet within reach (rule.require.hermetic-tests)
   */
  const runSpend = (input: { args: string[] }): string => {
    const forest = tempDirs.genOne({ slug: 'spend-flags' });
    mkdirSync(join(forest, 'groves'), { recursive: true });
    writeFileSync(
      join(forest, 'groves', 'grove-fixture.json'),
      JSON.stringify({ host: '203.0.113.1', port: 22, user: 'nobody' }),
    );
    const out = spawnSync(
      'bash',
      [PATH_SPEND, ...input.args, '--timeout', '1'],
      {
        encoding: 'utf8',
        env: { ...process.env, GIT_FOREST_DIR: forest },
        timeout: 60_000,
      },
    );
    return `${out.stdout ?? ''}\n${out.stderr ?? ''}`;
  };

  when('[t0] the flag every peer verb uses is typed', () => {
    const ran = useThen('the skill answers', () => ({
      byGrove: runSpend({ args: ['--grove', 'grove-fixture'] }),
      byOnly: runSpend({ args: ['--only', 'grove-fixture'] }),
    }));

    then('🔴 --grove is accepted — it is NOT an unknown flag', () => {
      expect(ran.byGrove).not.toContain(ERR_FLAG);
      expect(ran.byGrove).not.toContain(ERR_ABSENT);
    });

    then('COUNTER — --only still resolves, so the alias ADDED a door', () => {
      // the cure must widen the surface, never swap one word for another.
      // a rename would satisfy the tooth above and break every extant caller.
      expect(ran.byOnly).not.toContain(ERR_FLAG);
      expect(ran.byOnly).not.toContain(ERR_ABSENT);
    });

    then('🔴 ANTI-VACUITY — both really reached the same grove', () => {
      // without this, an arm that exited before the resolver would satisfy
      // every `not.toContain` above over naught.
      expect(ran.byGrove).toContain('grove-fixture');
      expect(ran.byOnly).toContain('grove-fixture');
    });
  });

  when('[t1] the grove is named by the uri its peer verbs take', () => {
    const ran = useThen('the skill answers', () => ({
      byUri: runSpend({ args: ['--grove', 'cloud://grove-fixture'] }),
      byUriPositional: runSpend({ args: ['cloud://grove-fixture'] }),
    }));

    then(
      '🔴 a `cloud://` prefix resolves — it is a FORM, not another grove',
      () => {
        expect(ran.byUri).not.toContain(ERR_ABSENT);
        expect(ran.byUri).toContain('grove-fixture');
      },
    );

    then(
      'the positional form takes the uri too — one parse, both doors',
      () => {
        // `<grove>` and `--only` land on the same variable, so a strip placed in
        // the flag arm rather than after it would cure one door and leave the
        // other to emit the false report.
        expect(ran.byUriPositional).not.toContain(ERR_ABSENT);
        expect(ran.byUriPositional).toContain('grove-fixture');
      },
    );
  });

  when('[t2] the teeth that a careless cure would file off', () => {
    const ran = useThen('the skill answers', () => ({
      absent: runSpend({ args: ['--grove', 'cloud://no-such-grove'] }),
      bogus: runSpend({ args: ['--nonsense', 'x'] }),
    }));

    then(
      'COUNTER — a genuinely absent grove STILL reports not-registered',
      () => {
        // 🔴 the sharpest counter-case. a cure that swallowed the uri by way of
        //    a swallowed lookup would pass [t1] and turn a real typo into a
        //    silent read of every grove (rule.forbid.failhide).
        expect(ran.absent).toContain(ERR_ABSENT);
        expect(ran.absent).toContain('no-such-grove');
      },
    );

    then(
      'COUNTER — an unknown flag STILL fails loud with the known set',
      () => {
        // the `-*` arm is what made round 1 recoverable. an alias added by a
        // widened catch-all rather than a named case would delete it.
        expect(ran.bogus).toContain("unknown flag '--nonsense'");
        expect(ran.bogus).toContain('--only|--grove');
      },
    );
  });

  /**
   * 🔴 .the uri refusal was a CLASS, never one skill
   *
   * the enumeration, run the same tick rather than assumed
   * (rule.require.enumerate-before-you-name):
   *
   *   git.grove.keyrack   ✅ strips it — `cloud://*) host="${grove#cloud://}"`
   *   git.grove.auth      ✅ strips it — the identical arm, same comment
   *   git.grove.spend     🔴 did not — cured above
   *   git.grove.prune     🔴 did not — cured, and it is the WORST of the set
   *
   * ⇒ two of four had it right, so the cure is CONFORMANCE to an extant
   *   convention rather than an invention. that is what makes it safe.
   *
   * 🔴 prune earns its own teeth because of WHEN it is called. the babysit
   *    tick names it by name for a 🔴 cpu box with a full run queue — the one
   *    moment a supervisor is told to prune BEFORE it fells, precisely to
   *    spare real work. a false "not registered" there reads as a broken
   *    registry and sends that supervisor to the fell it was steered off.
   *
   * 🟡 .the bound — prune takes its grove POSITIONALLY and has no --grove
   *    flag. that is how the tick contract calls it, so the cure is the strip
   *    alone; no flag surface was added, and none is clamped here.
   */
  when('[t3] the peer verb the babysit tick names by name', () => {
    const PATH_PRUNE = join(__dirname, 'git.grove.prune.sh');

    const runPrune = (input: { grove: string }): string => {
      const forest = tempDirs.genOne({ slug: 'prune-uri' });
      mkdirSync(join(forest, 'groves'), { recursive: true });
      writeFileSync(
        join(forest, 'groves', 'grove-fixture.json'),
        JSON.stringify({ host: '203.0.113.1', port: 22, user: 'nobody' }),
      );
      const out = spawnSync(
        'bash',
        [PATH_PRUNE, input.grove, '--process', 'nvim'],
        {
          encoding: 'utf8',
          env: { ...process.env, GIT_FOREST_DIR: forest },
          timeout: 60_000,
        },
      );
      return `${out.stdout ?? ''}\n${out.stderr ?? ''}`;
    };

    const ran = useThen('prune answers', () => ({
      byUri: runPrune({ grove: 'cloud://grove-fixture' }),
      byBare: runPrune({ grove: 'grove-fixture' }),
      absent: runPrune({ grove: 'cloud://no-such-grove' }),
    }));

    then('🔴 prune resolves the uri form too', () => {
      expect(ran.byUri).not.toContain(ERR_ABSENT);
    });

    then(
      '🔴 ANTI-VACUITY — the uri reached the SAME grove the bare name does',
      () => {
        // 🔴 a bare `toContain('grove-fixture')` is VACUOUS here, and this clamp
        //    shipped with exactly that until it was watched: the rejection text
        //    is `grove 'cloud://grove-fixture' is not registered`, which ECHOES
        //    the name, so the tooth passed green under the un-fixed defect.
        //
        // ⇒ so it must key on a string only a RESOLVED path can emit. prune
        //   echoes its own command line once past the registry check, and that
        //   echo carries the STRIPPED name — which the defect never reaches.
        expect(ran.byUri).toContain('git.grove.prune grove-fixture --process');
        expect(ran.byBare).toContain('git.grove.prune grove-fixture --process');
        // and the uri must be GONE from the resolved form, never merely tolerated
        expect(ran.byUri).not.toContain('prune cloud://');
      },
    );

    then(
      'COUNTER — a genuinely absent grove STILL reports not-registered',
      () => {
        expect(ran.absent).toContain(ERR_ABSENT);
        expect(ran.absent).toContain('no-such-grove');
      },
    );
  });

  /**
   * [case12] — a failed probe's next-move is BOUNDED at one re-read
   *
   * 🔴 .the defect, measured 2026-09-20 on grove-sandpine-v20260901
   *
   *   both timeout arms said "re-read before you act" in prose and handed back
   *   `--timeout $((TIMEOUT * 2))` UNCONDITIONALLY. the prose is singular; the
   *   command is a ladder with no top.
   *
   *   ⇒ the babysit contract mandates that emitted lines be run VERBATIM, so a
   *     supervisor who obeys the tool climbs 20 → 40 → 80 → 160 …, and every
   *     rung costs the wall clock it just asked for. two rungs were run that
   *     tick and a third was offered — on a grove `git.crew.poll` had already
   *     classified UNREACHED by its own independent session-list call.
   *
   * ⚠️ .and the harm is not merely spent time. a next-move that cannot move is
   *   a `term=false-report`: it reads as progress, so the supervisor defers the
   *   move that would actually settle it (a wake) in favour of one more
   *   measurement.
   *
   * .the discriminator is STATELESS — the default is 20, and the only way a
   *   caller arrives with more is to have followed a prior hint. so
   *   `TIMEOUT > default` IS "this is a re-read", with no memory kept.
   */
  given('[case12] a failed probe bounds its own re-read ladder', () => {
    const src = readFileSync(PATH_SAT, 'utf8');

    when('[t0] the next-move builder is read', () => {
      const at = src.indexOf('__sat_next_move() {');

      then('it exists and keys on the NAMED default, never a literal', () => {
        expect(at).toBeGreaterThan(-1); // ANTI-VACUITY
        expect(src.includes('SATURATION_TIMEOUT_DEFAULT=20')).toEqual(true);
        expect(src.includes('TIMEOUT=$SATURATION_TIMEOUT_DEFAULT')).toEqual(
          true,
        );
        expect(
          src.includes('(( TIMEOUT > SATURATION_TIMEOUT_DEFAULT ))'),
        ).toEqual(true);
      });

      then('🔴 the RE-READ branch offers a WAKE, and no bigger clock', () => {
        const end = src.indexOf('\n    }', at);
        expect(end).toBeGreaterThan(at); // ANTI-VACUITY: the builder is closed
        const body = src.slice(at, end);
        const split = body.indexOf('else');
        expect(split).toBeGreaterThan(-1); // ANTI-VACUITY: both branches exist

        const reread = body.slice(0, split);
        expect(reread.includes('rhx git.grove.wake ${entry}')).toEqual(true);
        // 🔴 the whole cure: no doubled clock on the second failure
        expect(reread.includes('TIMEOUT * 2')).toEqual(false);
        // and it must not silently upgrade a failed READ into a verdict
        expect(reread.includes('a failed read never is')).toEqual(true);
      });

      then('and the FIRST branch still offers exactly one re-read', () => {
        const end = src.indexOf('\n    }', at);
        const body = src.slice(at, end);
        const first = body.slice(body.indexOf('else'));
        expect(first.includes('--timeout $((TIMEOUT * 2))')).toEqual(true);
        expect(first.includes('ONCE')).toEqual(true);
      });
    });

    when('[t1] the two timeout arms are read', () => {
      then(
        '🔴 BOTH route through the builder — neither keeps its own ladder',
        () => {
          // the rc-124 arm and the ssh-banner arm carried byte-identical ladders;
          // a cure applied to one of the two leaves the other
          expect(
            src.includes('confirm before you dismiss it: $(__sat_next_move'),
          ).toEqual(true);
          expect(
            src.includes('settles NAUGHT on its own: $(__sat_next_move'),
          ).toEqual(true);
        },
      );

      /**
       * ⚠️ .the prose is STRIPPED, and the first cut of this tooth did not
       *   strip it — so it fired on the `.why` comment that QUOTES the defect
       *   it forbids. a source tooth grades CODE; a comment that records what
       *   was wrong must stay legal, or the cure cannot document itself.
       */
      then(
        '🔴 and NO unconditional ladder survives outside the builder',
        () => {
          const at = src.indexOf('__sat_next_move() {');
          const end = src.indexOf('\n    }', at);
          expect(end).toBeGreaterThan(at); // ANTI-VACUITY
          const code = (src.slice(0, at) + src.slice(end))
            .split('\n')
            .filter((line) => !line.trimStart().startsWith('#'))
            .join('\n');
          expect(code.includes('--timeout $((TIMEOUT * 2))')).toEqual(false);
          // ANTI-VACUITY: the strip did not empty the corpus it grades
          expect(code.includes('__sat_next_move')).toEqual(true);
        },
      );
    });
  });
});
