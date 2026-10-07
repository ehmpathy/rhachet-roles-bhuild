/**
 * .what = clamps on who the cpu rank names — zombies, newborns, inline programs, the reaped
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
import { getProbePayload, PATH_SPEND } from './git.grove.saturation.harness';

/**
 * .what = sweep the temp dirs [case2] made
 * .why  = each arm writes a payload file and a spinner; a suite that litters
 *         /tmp is clean on run 1 and filthy on run 1000.
 */
afterAll(() => {
  tempDirs.delAll();
});

/**
 * .what = a `ps` that answers exactly as the real one, plus one FIXTURE row
 *
 * .why  = a zombie cannot be MADE reliably from a shell. bash reaps its own
 *         background children asynchronously via waitchld(), so the classic
 *         `child & sleep` recipe leaves no zombie on this platform — a clamp
 *         built on it would pass for the wrong reason, which is the failhide
 *         shape this suite forbids.
 *
 *         ⇒ so the FIXTURE is the process table the probe reads, injected at
 *           the one seam the probe reads it through. the payload still runs
 *           verbatim from source, and every other row it sees is the real box
 *           (rule.always.clamp-the-verbatim-pane-your-classifier-judged — the
 *           subject is what the instrument was handed, never a transcription
 *           of what the instrument emitted).
 *
 * ⚠️ `-p` reads pass through UNTOUCHED. `ps -o pgid= -p $$` is how the payload
 *    learns its OWN process group; inject there and __sat_pg reads a fiction,
 *    the #110 self-filter ceases to fire, and the probe counts itself again —
 *    a clamp that manufactures a second defect to prove the first.
 */
/**
 * .what = the comm each injected fixture carries
 * .why  = a fixture name must be UNFINDABLE on the real box, or a tooth keyed
 *         on it cannot part "the shim fired" from "the box already had one".
 */
const SLUG_ZOMBIE = 'satzombie';

const SLUG_NEWBORN = 'satnewborn';

const SLUG_INLINE = 'satinline';

/**
 * .what = the two fictions a cpu rank must refuse, and the rows that carry them
 *
 * 🔴 .why they are two TERMS and never one
 *
 *   `pcpu` is cputime ÷ elapsed, so it divides into a fiction from BOTH ends:
 *
 *   | the fiction | cputime | elapsed | the term that catches it |
 *   |---|---|---|---|
 *   | a ZOMBIE  | REAL    | STOPPED | `$1 ~ /^Z/` |
 *   | a NEWBORN | ~ZERO   | ~ZERO   | `$2 == 0`   |
 *
 * ⇒ the fixtures are deliberately ORTHOGONAL. the zombie carries a NON-ZERO
 *   `times`, so the newborn term cannot catch it; the newborn carries a LIVE
 *   `stat`, so the zombie term cannot catch it. take either term out and
 *   exactly one case goes red — which is the only way a clamp proves that a
 *   cure has two halves rather than one.
 */
const FIXTURES = {
  zombie: {
    stat: 'Z',
    times: '42', // REAL spend, already accrued — the newborn term must not fire
    etimes: '0',
    pcpu: '99.9',
    comm: SLUG_ZOMBIE,
    args: `[${SLUG_ZOMBIE}] <defunct>`,
  },
  newborn: {
    stat: 'R', // LIVE — the zombie term must not fire
    times: '0', // spent naught: the whole of the claim
    etimes: '0',
    pcpu: '999',
    comm: SLUG_NEWBORN,
    args: `${SLUG_NEWBORN} --just-forked`,
  },
  /**
   * .what = a LIVE `node -e <inline program>`, in two variants that differ only
   *         after a `/` inside the program's own source text
   * .why  = the `eats` key builder basenames its first arg, and `-e` marks a
   *         PROGRAM rather than a path. the two variants below are the measured
   *         production pair, reduced: one family, sliced into two buckets.
   * ⚠️ stat=R and times!=0 on purpose — neither the zombie nor the newborn term
   *    may reach this row, or the case would pass off a neighbour's cure.
   */
  inline: {
    stat: 'R',
    times: '42',
    etimes: '100',
    pcpu: '7.5',
    comm: SLUG_INLINE,
    // 🔴 the SLUG rides in the TAIL segment of each program, on purpose. under
    //    the shipped shape the key is that tail, so the slug surfaces in a
    //    `roll=` key and a tooth can name it. put the slug ahead of the last
    //    `/` and the basename cuts it off — the tooth then passes over a defect
    //    it cannot see.
    // ⚠️ no `'` here: the shim renders each row from a single-quoted awk, so a
    //    quote in the fixture is eaten by the shell before `ps` ever answers.
    args: `/usr/bin/node -e import(p/${SLUG_INLINE}A).then(m`,
    argsAlt: `/usr/bin/node -e import(p/${SLUG_INLINE}B).then(m`,
  },
} as const;

type KindFixture = keyof typeof FIXTURES;

/**
 * .what = how many fixture rows the shim injects
 * .why  = 🔴 the CENSUS render is `sort -rn | head -8`, keyed on PEER COUNT — so
 *         a single injected row at n=1 is cut before any tooth can see it.
 *         measured on the first run that read as GREEN: the anti-vacuity tooth
 *         failed against a census of exactly 8 real rows (zsh 256 … nvim 12)
 *         while the shim answered every read correctly. the witness was blind,
 *         never the shim.
 *
 * ⇒ 512 tops the busiest real peer measured on `local` (zsh, 256), so the row
 *   holds the census's #1 slot on any box the suite runs against.
 *
 * ⚠️ it does NOT weaken the cure teeth: one row or five hundred, the arms
 *    either skip the fixture or they do not. the count buys VISIBILITY for the
 *    witness alone.
 */
const COUNT_FIXTURE = 512;

/**
 * .what = each cpu-rank arm's own field spec — its IDENTITY in the payload
 * .why  = a static tooth anchors on the spec the arm READS, never on the shape
 *         of the awk around it: an anchor on a closure forbids the arm from a
 *         correct new term (the lesson [case6] records, and the lesson this
 *         very pair re-taught when `times` joined both specs).
 */
const SPEC_TOP = "'stat,times,pcpu,pmem,comm,args'";

const SPEC_EATS = "'stat,times,pcpu,comm,args'";

const genPsShim = (input: { dir: string; kind: KindFixture }): string => {
  const fix: {
    stat: string;
    times: string;
    etimes: string;
    pcpu: string;
    comm: string;
    args: string;
    argsAlt?: string;
  } = FIXTURES[input.kind];

  /**
   * .what = the awk that renders ONE fixture row against whatever spec `ps` was
   *         asked for, with `args` bound to the value handed in
   * .why  = a fixture may need two variants that differ ONLY in `args` — the
   *         inline-program pair, which is one family the shipped key builder
   *         split in two. every other field must stay identical between them,
   *         or the clamp proves a difference it did not mean to introduce.
   */
  const genRowAwk = (args: string): string[] => [
    '$(awk -v spec="$spec" \'BEGIN{',
    '  n=split(spec, f, ",");',
    '  for (i=1;i<=n;i++) {',
    '    k=f[i]; sub(/=$/,"",k); v="-";',
    '    if (k=="pid") v="999991";',
    '    else if (k=="pgid") v="999991";',
    '    else if (k=="ppid") v="999990";',
    `    else if (k=="stat") v="${fix.stat}";`,
    // ⚠️ `times` and `etimes` are REQUIRED here even where a given case does
    //    not read them: `__sat_ps` runs `ps` under `2>/dev/null`, so a spec
    //    the shim answers short does not error — it empties the arm, and the
    //    clamp then passes over naught.
    `    else if (k=="times") v="${fix.times}";`,
    `    else if (k=="etimes") v="${fix.etimes}";`,
    `    else if (k=="pcpu") v="${fix.pcpu}";`,
    '    else if (k=="pmem") v="0.0";',
    '    else if (k=="rss") v="0";',
    // 🔴 a comm no real process carries. `git` was the MEASURED name and it
    //    is the wrong fixture name: `local` holds real git processes AND two
    //    real zombies, so every tooth keyed on it passes whether the shim
    //    fired or not — which is exactly what happened on the first RED run.
    `    else if (k=="comm") v="${fix.comm}";`,
    `    else if (k=="args") v="${args}";`,
    '    printf "%s%s", (i>1?" ":""), v;',
    '  }',
    '  printf "\\n";',
    "}')",
  ];

  const half = Math.floor(COUNT_FIXTURE / 2);
  const emit: string[] = fix.argsAlt
    ? [
        `rowA=${genRowAwk(fix.args).join('\n')}`,
        `rowB=${genRowAwk(fix.argsAlt).join('\n')}`,
        // 🔴 HALF and HALF. the shipped key builder basenamed the inline program,
        //    so these two land in separate buckets at n=256 each; the cure folds
        //    them into one at n=512. a single variant could not tell the two
        //    apart, because 512 identical rows fold under either shape.
        `for ((i = 0; i < ${half}; i++)); do printf "%s\\n" "$rowA"; done`,
        `for ((i = 0; i < ${COUNT_FIXTURE - half}; i++)); do printf "%s\\n" "$rowB"; done`,
      ]
    : [
        `row=${genRowAwk(fix.args).join('\n')}`,
        // 🔴 many rows, never one — see COUNT_FIXTURE. the census head-limits by
        //    peer count, so one row is invisible to the witness that proves the
        //    shim fired at all.
        `for ((i = 0; i < ${COUNT_FIXTURE}; i++)); do printf "%s\\n" "$row"; done`,
      ];

  const pathShim = join(input.dir, 'ps');
  writeFileSync(
    pathShim,
    [
      '#!/usr/bin/env bash',
      'real=/usr/bin/ps',
      'out="$("$real" "$@")"',
      'spec=""',
      'bypid=""',
      'want=""',
      // ⚠️ the payload passes `-eo` and the SPEC as two args. a `-eo*` glob
      //    matches the bare `-eo` with an empty suffix, so a naive parse sets
      //    spec="" and bypasses every census — measured here, on the first RED
      //    run: the shim was inert and the clamp passed off the box's OWN
      //    zombies. the unique comm below is what now refuses that.
      'for a in "$@"; do',
      '  if [[ -n "$want" ]]; then spec="$a"; want=""; continue; fi',
      '  case "$a" in',
      '    -p) bypid=1 ;;',
      '    -p*) bypid=1 ;;',
      '    -eo|-o) want=1 ;;',
      '    -eo*) spec="${a#-eo}" ;;',
      '    -o*) spec="${a#-o}" ;;',
      '  esac',
      'done',
      'if [[ -n "$bypid" || -z "$spec" ]]; then printf "%s\\n" "$out"; exit 0; fi',
      ...emit,
      'printf "%s\\n" "$out"',
    ].join('\n'),
    { mode: 0o755 },
  );
  return pathShim;
};

/**
 * .what = run the probe payload once, with the shim first on PATH
 * .why  = `__sat_ps` calls bare `ps`, so PATH is the seam. the payload itself
 *         is untouched — read from source, byte-identical, exactly as [case1]
 *         and [case2] run it.
 */
const runProbeWithShim = (input: { shim: KindFixture | 'none' }): string => {
  const dir = tempDirs.genOne({ slug: 'sat-rank' });
  const pathProbe = join(dir, 'probe.sh');
  writeFileSync(pathProbe, getProbePayload());
  const lines: string[] = ['set -u'];
  if (input.shim !== 'none') {
    mkdirSync(join(dir, 'bin'), { recursive: true });
    genPsShim({ dir: join(dir, 'bin'), kind: input.shim });
    lines.push(`export PATH="${join(dir, 'bin')}:$PATH"`);
  }
  lines.push(`timeout 90 bash ${pathProbe}`);
  const out = spawnSync('bash', ['-c', lines.join('\n')], {
    encoding: 'utf8',
    timeout: 180_000,
  });
  if (out.status !== 0)
    throw new Error(
      `the probe exited ${out.status} — a clamp on its OUTPUT cannot run: ${out.stderr}`,
    );
  return out.stdout;
};

given('[case7] a ZOMBIE must never be ranked as cpu spend', () => {
  /**
   * 🔴 .the measured defect, 2026-09-18, on `local`, two ticks apart
   *
   *      ├─ top     hungriest by cpu
   *      │     ├─ git                     66.6% cpu ·   0.0% mem      (tick A)
   *      │     │   [git] <defunct>
   *      │     ├─ git                      100% cpu ·   0.0% mem      (tick C)
   *      │     │   [git] <defunct>
   *
   *    the #1 row of the ONE table a supervisor reads before a prune — on a box
   *    whose live hungriest was `claude` at 27.2%, and whose `holds` row three
   *    lines below said `2 zombie`. two halves of one report disagreed, and
   *    neither named the other.
   *
   * ⇒ the SAME arithmetic as [case1]/#110, entered from the other end. `pcpu` is
   *   cputime ÷ elapsed; #110's `ps` had cputime ~0 over elapsed ~0, and a zombie
   *   has REAL cputime over an elapsed that stopped. both divide into a fiction.
   *
   * ⚠️ and the harm is worse than a wasted glance: a zombie is UNKILLABLE — it
   *    has already exited, and only its parent's wait() clears it. so the row
   *    aims a prune at a target no signal can reach, and the prune's failure
   *    then reads as a tool defect rather than as a phantom target.
   */

  when('[t0] the payload is read from source', () => {
    const payload = getProbePayload();

    then('both CPU-RANK arms skip a zombie', () => {
      // ⚠️ anchored on the two arms' own field specs — their IDENTITY — never on
      //    the shape of the awk around them. an anchor on a closure forbids the
      //    arm from a correct new term (the lesson [case6] records).
      const armTop = payload.split('\n').filter((l) => l.includes(SPEC_TOP));
      const armEats = payload.split('\n').filter((l) => l.includes(SPEC_EATS));

      // ANTI-VACUITY — a renamed spec would empty both buckets and satisfy
      // every assertion below over an empty set (rule.forbid.failhide).
      expect(armTop.length).toBe(1);
      expect(armEats.length).toBe(1);

      // each arm's skip rides within 4 lines of its read — the awk opens there
      const rows = payload.split('\n');
      const near = (at: number): string => rows.slice(at, at + 4).join('\n');
      const atTop = rows.findIndex((l) => l.includes(SPEC_TOP));
      const atEats = rows.findIndex((l) => l.includes(SPEC_EATS));
      expect(near(atTop)).toContain('$1 ~ /^Z/ { next }');
      expect(near(atEats)).toContain('$1 ~ /^Z/ { next }');
    });

    then(
      '🔴 the CENSUS still COUNTS a zombie — the filter is not global',
      () => {
        // .why = `procs_zombie` reads through the very same __sat_ps helper, and a
        //   zombie is precisely what it exists to report. a census counts HANDLES;
        //   a rank ranks SPEND. push the filter down into __sat_ps and this row
        //   silently becomes 0 on every box — a second false report, minted by the
        //   cure for the first.
        expect(payload).toContain(
          "procs_zombie=$(__sat_ps 'stat' | grep -c '^Z'",
        );
        // and __sat_ps itself carries no zombie term
        const at = payload.indexOf('__sat_ps() {');
        const helper = payload.slice(at, at + 500);
        expect(helper.length).toBeGreaterThan(200); // anti-vacuity
        expect(helper).not.toContain('^Z');
      },
    );
  });

  when('[t1] the probe runs against a table that HOLDS a zombie', () => {
    // ⚠️ an OBJECT, never the bare string — the trap this suite already records
    //    at [case1][t2]: `useThen` hands back a PROXY, and a proxy over a
    //    primitive is not a primitive. property access unwraps it.
    const ran = useThen('the shimmed probe answers', () => ({
      emitted: runProbeWithShim({ shim: 'zombie' }),
    }));

    then(
      '🔴 ANTI-VACUITY — the injected zombie really reached the probe',
      () => {
        // 🔴 keyed on the CENSUS, which carries no zombie filter by design — so
        //    this proves the shim was on PATH and answered a real census read.
        //    a `procs_zombie >= 1` tooth would NOT: `local` holds two real
        //    zombies, so it passes with the shim entirely inert. measured, on
        //    the first RED run, where it did exactly that.
        //
        // ⚠️ and the census is `head -8` by PEER COUNT, which is why the shim
        //    injects COUNT_ZOMBIE rows rather than one. a lone row is cut before
        //    this tooth can read it — measured too, on the run after.
        const cens = ran.emitted
          .split('\n')
          .filter((l) => l.startsWith('cens='));
        expect(cens.length).toBeGreaterThanOrEqual(1);
        expect(cens.join('\n')).toContain(SLUG_ZOMBIE);
      },
    );

    then('the `top` arm ranks no zombie', () => {
      const rows = ran.emitted.split('\n').filter((l) => l.startsWith('proc='));
      expect(rows.length).toBeGreaterThanOrEqual(1); // the arm still renders
      expect(rows.join('\n')).not.toContain(SLUG_ZOMBIE);
    });

    then('the `eats` roll-up sums no zombie', () => {
      // a phantom 99.9% folded into a program's bucket is the sharper harm —
      // this is the row that parts a RUNAWAY from mere CONCURRENCY.
      const rolls = ran.emitted
        .split('\n')
        .filter((l) => l.startsWith('roll='));
      expect(rolls.join('\n')).not.toContain(SLUG_ZOMBIE);
    });
  });

  when('[t2] the probe runs against the real table, unshimmed', () => {
    const ran = useThen('the plain probe answers', () => ({
      emitted: runProbeWithShim({ shim: 'none' }),
    }));

    then('🔴 the counter-tooth — live rows still rank', () => {
      // the cure drops a row on a STATE, so a botched skip that dropped every
      // row would satisfy t1 perfectly. this is what refuses that cure.
      const rows = ran.emitted.split('\n').filter((l) => l.startsWith('proc='));
      expect(rows.length).toBeGreaterThanOrEqual(1);
      const rolls = ran.emitted
        .split('\n')
        .filter((l) => l.startsWith('roll='));
      expect(rolls.length).toBeGreaterThanOrEqual(1);
    });
  });

  afterAll(() => tempDirs.delAll());
});

given('[case8] a NEWBORN must never be ranked as cpu spend', () => {
  /**
   * 🔴 .the measured defect, 2026-09-18, on `local`, two reads one apart
   *
   *      ├─ top     hungriest by cpu
   *      │     ├─ run.bun.rhachet          225% cpu          (read A)
   *      │     ├─ bash                     125% cpu          (read A)
   *      ├─ eats    cpu by program
   *      │     ├─ 703.2% · n=7  run.bun.rhachet-run.bc       (read A)
   *      │     ├─ 500.0% · n=1  bash route.foreground.guard  (read A)
   *
   *    ~13.5 cores claimed on a 12-core box that read `idle 89%`, with load at
   *    3.07. one read later every row above was GONE and the top was `nvim
   *    15.6%`, while load had moved only to 3.76.
   *
   * ⇒ `bash` at 125% is the tell that needs no cross-check: a single-threaded
   *   program cannot exceed one core. the raw table said why —
   *
   *      pid      etimes  times  pcpu  comm
   *      2749914       0      0   158  MainThread
   *      2749927       0      0  75.0  MainThread
   *      2749925       0      0  28.5  zsh
   *
   *   `pcpu` is cputime ÷ elapsed, and a just-forked row divides ~0 by ~0.
   *   the SAME arithmetic as [case7] and as #110, entered from the third and
   *   last end: #110 was the probe's own `ps`, the zombie is real spend over a
   *   stopped clock, and this is a clock that has barely started.
   *
   * ⚠️ the harm is the inverse of the zombie's and no smaller. a zombie puts a
   *    phantom at the TOP of the prune list; a newborn puts a whole innocent
   *    program there — `eats` is the arm that parts a RUNAWAY from ordinary
   *    concurrency, so a prune aimed off it fells real work.
   *
   * 🟡 the cure skips on `times == 0`, never on an `etimes` floor. `times` is
   *    cpu seconds ACCRUED, so it states the claim the rank makes; an age floor
   *    would be a guessed threshold over a proxy. worst cost of the skip is one
   *    core-second of genuine spend, unranked for one tick.
   */

  when('[t0] the payload is read from source', () => {
    const payload = getProbePayload();

    then('both CPU-RANK arms read `times`, and skip a zero', () => {
      const armTop = payload.split('\n').filter((l) => l.includes(SPEC_TOP));
      const armEats = payload.split('\n').filter((l) => l.includes(SPEC_EATS));

      // ANTI-VACUITY — the spec IS the anchor, so an empty bucket would satisfy
      // every assertion below over naught (rule.forbid.failhide).
      expect(armTop.length).toBe(1);
      expect(armEats.length).toBe(1);

      const rows = payload.split('\n');
      const near = (at: number): string => rows.slice(at, at + 4).join('\n');
      expect(near(rows.findIndex((l) => l.includes(SPEC_TOP)))).toContain(
        '$2 == 0   { next }',
      );
      expect(near(rows.findIndex((l) => l.includes(SPEC_EATS)))).toContain(
        '$2 == 0   { next }',
      );
    });

    then('🔴 the CENSUS is untouched — the filter is not global', () => {
      // .why = the twin of [case7]'s census tooth, and the same hazard: push
      //   either term down into __sat_ps and `holds`/`cens` silently under-count
      //   on every box. a census counts HANDLES; a rank ranks SPEND.
      const at = payload.indexOf('__sat_ps() {');
      const helper = payload.slice(at, at + 500);
      expect(helper.length).toBeGreaterThan(200); // anti-vacuity
      expect(helper).not.toContain('$2 == 0');
    });
  });

  when('[t1] the probe runs against a table that HOLDS a newborn', () => {
    // ⚠️ an OBJECT, never the bare string — `useThen` hands back a PROXY, and a
    //    proxy over a primitive is not a primitive ([case1][t2]).
    const ran = useThen('the shimmed probe answers', () => ({
      emitted: runProbeWithShim({ shim: 'newborn' }),
    }));

    then(
      '🔴 ANTI-VACUITY — the injected newborn really reached the probe',
      () => {
        // keyed on the CENSUS, which carries no rank filter by design — so this
        // proves the shim was on PATH and answered a real read. and the census is
        // `head -8` by PEER COUNT, which is why COUNT_FIXTURE rows go in.
        const cens = ran.emitted
          .split('\n')
          .filter((l) => l.startsWith('cens='));
        expect(cens.length).toBeGreaterThanOrEqual(1);
        expect(cens.join('\n')).toContain(SLUG_NEWBORN);
      },
    );

    then('the `top` arm ranks no newborn', () => {
      const rows = ran.emitted.split('\n').filter((l) => l.startsWith('proc='));
      expect(rows.length).toBeGreaterThanOrEqual(1); // the arm still renders
      expect(rows.join('\n')).not.toContain(SLUG_NEWBORN);
    });

    then('the `eats` roll-up sums no newborn', () => {
      // 🔴 the sharper harm of the pair: 512 rows at 999% each is the phantom
      //    runaway the measured render carried, and `eats` is the arm a prune
      //    decision is read off.
      const rolls = ran.emitted
        .split('\n')
        .filter((l) => l.startsWith('roll='));
      expect(rolls.join('\n')).not.toContain(SLUG_NEWBORN);
    });

    then(
      '🔴 the ORTHOGONALITY tooth — the zombie term cannot claim this',
      () => {
        // the fixture carries stat=R, so [case7]'s `^Z` term is blind to it. that
        // is what makes the two cures two: take `$2 == 0` out and this case goes
        // red while [case7] stays green.
        expect(FIXTURES.newborn.stat).not.toMatch(/^Z/);
        expect(FIXTURES.zombie.times).not.toBe('0');
      },
    );
  });

  when('[t2] the probe runs against the real table, unshimmed', () => {
    const ran = useThen('the plain probe answers', () => ({
      emitted: runProbeWithShim({ shim: 'none' }),
    }));

    then('🔴 the counter-tooth — live rows still rank', () => {
      // the cure drops a row on a MEASUREMENT, so a botched term that dropped
      // every row would satisfy t1 perfectly. this is what refuses that cure.
      const rows = ran.emitted.split('\n').filter((l) => l.startsWith('proc='));
      expect(rows.length).toBeGreaterThanOrEqual(1);
      const rolls = ran.emitted
        .split('\n')
        .filter((l) => l.startsWith('roll='));
      expect(rolls.length).toBeGreaterThanOrEqual(1);
    });
  });

  afterAll(() => tempDirs.delAll());
});

given(
  '[case10] the eats roll-up must not BASENAME an inline `-e` program',
  () => {
    /**
     * 🔴 .the measured defect, 2026-09-18, on `grove-sandpine`
     *
     *      ├─ eats    cpu by program
     *      │     ├─   22.9% cpu · n=9  node processChild.js
     *      │     ├─   21.0% cpu · n=1  node cli').then(m
     *      │     ├─   14.2% cpu · n=1  node review').then(m
     *
     *    the last two rows are ONE family — `node -e import('rhachet-roles-bhrain
     *    /…/cli').then(m…` — and the key builder took a basename of the argument
     *    after `-e`. but `-e` marks a PROGRAM, and a program is source text: the
     *    split found the last `/` INSIDE the source and cut there, so one family
     *    fell into as many buckets as it had distinct import paths.
     *
     * ⇒ folded, the family is 35.2% at n=2, which OUTRANKS `processChild.js` at
     *   22.9% — so the #2 row of the prune table named the wrong program.
     *
     * ⚠️ the sharper harm is the `n` column, never the rank. `n=1` beside a high
     *    cpu figure is the RUNAWAY tell a prune decision reads; to fragment one
     *    family into two n=1 rows MANUFACTURES that tell out of ordinary
     *    concurrency. the arm that parts a runaway from a busy fleet was the arm
     *    that invented one.
     *
     * 🟡 the cure keys the family as `node -e` and stops — it does NOT try to
     *    recover a name from the program text. a program has no name to recover;
     *    any attempt is a parse of arbitrary source, and a wrong parse re-enters
     *    by the same door.
     */

    when('[t0] the payload is read from source', () => {
      const payload = getProbePayload();

      then(
        'the `-e` guard precedes the basename, and the basename is the ELSE',
        () => {
          const rows = payload.split('\n');
          const at = rows.findIndex((l) => l.includes(SPEC_EATS));

          // ANTI-VACUITY — the spec IS the anchor (see SPEC_EATS), so an absent arm
          // would satisfy every assertion below over naught.
          expect(rows.filter((l) => l.includes(SPEC_EATS)).length).toBe(1);

          const arm = rows.slice(at, at + 20).join('\n');
          expect(arm).toContain('if (a == "-e") key = prog " -e";');
          // 🔴 the basename must sit BEHIND the guard. this refuses the shipped
          //    shape, where `split(a, q, "/")` ran unconditionally and the guard
          //    merely swapped WHICH argument it sliced.
          expect(arm).toContain('else { n2 = split(a, q, "/")');
        },
      );
    });

    when(
      '[t1] the probe runs against a table that HOLDS an inline pair',
      () => {
        // ⚠️ an OBJECT, never the bare string — `useThen` hands back a PROXY.
        const ran = useThen('the shimmed probe answers', () => ({
          emitted: runProbeWithShim({ shim: 'inline' }),
        }));

        then(
          '🔴 ANTI-VACUITY — the injected pair really reached the probe',
          () => {
            const cens = ran.emitted
              .split('\n')
              .filter((l) => l.startsWith('cens='));
            expect(cens.length).toBeGreaterThanOrEqual(1);
            expect(cens.join('\n')).toContain(SLUG_INLINE);
          },
        );

        then('🔴 no key is cut out of the PROGRAM TEXT', () => {
          // the shipped shape emitted `node cli).then(m` — a key sliced at a `/`
          // that lives inside the source, which is the whole defect. the fixture
          // puts the slug in that tail, so its presence in ANY key is the tell.
          const rolls = ran.emitted
            .split('\n')
            .filter((l) => l.startsWith('roll='));
          expect(rolls.length).toBeGreaterThanOrEqual(1); // the arm still renders
          expect(rolls.join('\n')).not.toContain(SLUG_INLINE);
        });

        then(
          '🔴 the family FOLDS — one `node -e` row holds BOTH variants',
          () => {
            // the shim emits half of each variant. under the shipped shape they land
            // in two buckets of COUNT_FIXTURE/2; the cure folds them into one. so the
            // COUNT is the discriminator, and a single variant could not have been
            // one — identical rows fold under either shape.
            //
            // ⚠️ a FLOOR, never an equality. measured on `local`: the box runs its own
            //    real `node -e` clone, so the fold read 513. an exact count would clamp
            //    the box's fleet rather than the cure.
            const rolls = ran.emitted
              .split('\n')
              .filter((l) => l.startsWith('roll='));
            const folded = rolls
              .filter((l) => l.endsWith('|node -e'))
              .map((l) => Number(l.split('|')[1]));
            expect(folded.length).toBe(1);
            expect(folded[0]).toBeGreaterThanOrEqual(COUNT_FIXTURE);
          },
        );

        then(
          '🔴 the ORTHOGONALITY tooth — neither rank filter may claim this',
          () => {
            // the fixture is LIVE and has SPENT, so [case7]'s `^Z` and [case8]'s
            // `$2 == 0` are both blind to it. that is what makes this cure its own.
            expect(FIXTURES.inline.stat).not.toMatch(/^Z/);
            expect(FIXTURES.inline.times).not.toBe('0');
          },
        );
      },
    );

    afterAll(() => tempDirs.delAll());
  },
);

/**
 * .what = the REAPED row states what its counter measures — death, never birth
 * .why  = dK is a cutime+cstime delta on a LIVE parent, and cutime accrues the
 *         WHOLE lifetime of a child at the moment it is reaped. so the row
 *         constrains DEATH in-window and says naught about birth.
 *
 *         it read `(born AND died in-window)` until 2026-09-19. that label is
 *         false on its first half, and the harm is the supervisor's next move:
 *         measured the same day on grove-sandpine-v20260901,
 *         `claude  live 7.2%  reaped 245.0%  (n=23)`. under the old label a
 *         reader concludes a storm of short-lived processes ate 2.5 cores, or
 *         that the tool is broken because a share cannot exceed 100%. the true
 *         account is 23 clones that each reaped long-lived children, and
 *         NEITHER a prune nor a fell is owed.
 *
 *         ⇒ a fork storm is a claim about RATE. forks/s settles it; this row
 *           cannot, and must not be read as though it could.
 */
given(
  '[case-reaped-label] the REAPED row constrains death, never birth',
  () => {
    /**
     * .what = the printf lines the render actually emits, comments stripped
     * .why  = the `.why` block above the awk quotes every phrase asserted below.
     *         to a bare indexOf over the file, a comment reads exactly like the
     *         render — so the clamp would pass on prose while the row lied.
     */
    const renderLines = (): string[] => {
      const src = readFileSync(PATH_SPEND, 'utf8');
      const at = src.indexOf('printf "      ├─ 🟢 live');
      expect(at).toBeGreaterThan(0);
      const end = src.indexOf('by cluster, ranked on live+reaped', at);
      expect(end).toBeGreaterThan(at);
      return src
        .slice(at, end)
        .split('\n')
        .filter((line) => !/^\s*#/.test(line) && /printf/.test(line));
    };

    when('[t0] the split is rendered', () => {
      then('🔴 ANTI-VACUITY — the rows and their warn are all present', () => {
        // a rename of the glyphs, or a delete of the warn, empties or shortens
        // this filter. without the floor every assertion below passes on an
        // empty array and reads as clean (rule.forbid.failhide).
        const lines = renderLines();
        expect(lines.length).toBeGreaterThanOrEqual(5);
      });

      then('🔴 it does NOT claim the children were BORN in-window', () => {
        // the defect itself. `born AND died` is the exact false label.
        const body = renderLines().join('\n');
        expect(body).not.toContain('born AND died');
        expect(body).not.toContain('born and died');
      });

      then('it names DEATH in-window, and the WHOLE lifetime carried', () => {
        const reaped = renderLines().filter((line) =>
          line.includes('🔴 reaped'),
        );
        expect(reaped.length).toBe(1);
        expect(reaped[0]).toContain('reaped in-window');
        expect(reaped[0]).toContain('WHOLE lifetime');
      });

      then('🔴 the warn states birth is UNCONSTRAINED, and why', () => {
        const body = renderLines().join('\n');
        expect(body).toContain('birth is UNCONSTRAINED');
        expect(body).toContain('cutime');
        expect(body).toContain('at the moment it is reaped');
      });

      then(
        '🔴 it refuses the storm read, and names the term that settles it',
        () => {
          // the operational half — the reason this is a defect and not a typo.
          // a supervisor acts on a storm: prune, fell, halt a sprout.
          const body = renderLines().join('\n');
          expect(body).toContain('NOT a fork storm');
          expect(body).toContain('forks/s');
          expect(body).toContain('is NORMAL');
        },
      );

      then(
        'COUNTER — the LIVE row is untouched, so the two splits stay apart',
        () => {
          // scope tooth. the cure corrects one of the two halves; a smear that
          // blurred them together would repair the label and lose the split.
          const live = renderLines().filter((line) => line.includes('🟢 live'));
          expect(live.length).toBe(1);
          expect(live[0]).toContain('work still alive');
          expect(live[0]).not.toContain('reaped');
        },
      );
    });

    when('[t1-spend] --help declares the same split', () => {
      then(
        '🔴 both faces agree — the legend carries the corrected claim',
        () => {
          // the help text is a SECOND site of the same claim. it drifted in step
          // with the render for the life of the defect, so it is clamped in step
          // with the cure (rule.require.a-cue-is-not-a-claim: two detectors).
          const src = readFileSync(PATH_SPEND, 'utf8');
          const legend = src
            .split('\n')
            .filter(
              (line) =>
                /^\s*echo\s+"/.test(line) &&
                /REAPED|lifetime of a child/.test(line),
            );
          expect(legend.length).toBeGreaterThanOrEqual(2);

          const body = legend.join('\n');
          expect(body).not.toContain('born and died');
          expect(body).toContain('children reaped in-window');
          expect(body).toContain('constrains DEATH, never birth');
          expect(body).toContain('NOT a fork storm');
        },
      );
    });
  },
);
