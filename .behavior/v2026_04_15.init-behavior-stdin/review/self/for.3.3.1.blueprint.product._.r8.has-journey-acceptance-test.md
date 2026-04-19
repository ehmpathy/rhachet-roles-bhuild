# self-review r8: has-journey-acceptance-test

## why r8?

r7 confirmed test coverage is thorough for isolated cases. but the guide also requires a journey acceptance test with [t0], [t1], [t2]... timesteps that show state progression through a complete workflow. this r8 checks for that.

---

## the question

does the blueprint declare a journey acceptance test?

---

## what is a journey acceptance test?

a journey test shows:
- sequential timesteps [t0], [t1], [t2]...
- state changes between steps
- pit-of-success recovery paths
- complete workflow from start to finish

vs isolated case tests which test one scenario in isolation.

---

## blueprint test tree analysis

the blueprint (lines 133-147) declares:

```
blackbox/
└── role=behaver/
    ├── [+] skill.init.behavior.wish.acceptance.test.ts
    │   ├── [case1] inline non-empty
    │   ├── [case2] stdin non-empty
    │   ├── [case3] inline empty error
    │   ├── [case4] stdin empty error
    │   ├── [case5] inline + modified wish error
    │   ├── [case6] inline + open combined
    │   └── [case7] absent --wish backwards compat
```

all 7 cases are isolated `[case]` blocks — none show sequential `[t]` timesteps.

---

## does a journey test exist?

**answer**: no

the blueprint lacks a journey acceptance test. all declared tests are isolated cases that verify one scenario each.

---

## is a journey test needed?

**answer**: yes

the pit-of-success error case (case5: modified wish file) implies a recovery workflow:

1. user runs with --wish
2. user modifies wish file
3. user tries to re-run with --wish (blocked)
4. user deletes wish file to recover
5. user re-runs with --wish (succeeds)

this is a journey that should be tested with [t0], [t1], [t2]... timesteps.

---

## proposed journey test: [case8]

```typescript
given('[case8] journey: create, blocked, recover, recreate', () => {
  const scene = useBeforeAll(async () => {
    const repo = await genConsumerRepo({ installed: true });
    return { repo };
  });

  when('[t0] initial state', () => {
    then('behavior does not exist', async () => {
      const exists = existsSync(join(scene.repo.path, '.behavior'));
      expect(exists).toBe(false);
    });
  });

  when('[t1] user creates behavior with wish', () => {
    const result = useThen('command succeeds', async () =>
      runInitBehaviorSkillDirect({
        cwd: scene.repo.path,
        args: ['--name', 'test-feature', '--wish', 'implement cool thing'],
      }),
    );

    then('exit code is 0', () => {
      expect(result.exitCode).toBe(0);
    });

    then('wish file contains content', async () => {
      const wishPath = join(scene.repo.path, '.behavior/vYYYY_MM_DD.test-feature/0.wish.md');
      const content = readFileSync(wishPath, 'utf-8');
      expect(content).toContain('implement cool thing');
    });
  });

  when('[t2] user tries to re-run (blocked)', () => {
    const result = useThen('command fails', async () =>
      runInitBehaviorSkillDirect({
        cwd: scene.repo.path,
        args: ['--name', 'test-feature', '--wish', 'different content'],
      }),
    );

    then('exit code is 2 (constraint)', () => {
      expect(result.exitCode).toBe(2);
    });

    then('stderr shows recovery hint', () => {
      expect(result.stderr).toContain('wish file has been modified');
      expect(result.stderr).toContain('rm');
    });
  });

  when('[t3] user recovers via wish file removal', () => {
    then('wish file is removed', async () => {
      const wishPath = join(scene.repo.path, '.behavior/vYYYY_MM_DD.test-feature/0.wish.md');
      rmSync(wishPath);
      expect(existsSync(wishPath)).toBe(false);
    });
  });

  when('[t4] user re-runs with new wish', () => {
    const result = useThen('command succeeds', async () =>
      runInitBehaviorSkillDirect({
        cwd: scene.repo.path,
        args: ['--name', 'test-feature', '--wish', 'new wish content'],
      }),
    );

    then('exit code is 0', () => {
      expect(result.exitCode).toBe(0);
    });

    then('wish file contains new content', async () => {
      const wishPath = join(scene.repo.path, '.behavior/vYYYY_MM_DD.test-feature/0.wish.md');
      const content = readFileSync(wishPath, 'utf-8');
      expect(content).toContain('new wish content');
    });
  });
});
```

---

## gap found

| gap | severity | fix | status |
|-----|----------|-----|--------|
| no journey acceptance test | blocker | add [case8] journey test to blueprint | fixed |

---

## fix applied

added [case8] journey test to blueprint:

```
├── [case8] journey: create, blocked, recover, recreate
│   ├── [t0] initial state (behavior absent)
│   ├── [t1] user creates behavior with wish
│   ├── [t2] user tries to re-run (blocked, exit 2)
│   ├── [t3] user recovers via wish file removal
│   └── [t4] user re-runs with new wish (succeeds)
```

also updated snapshot coverage table to include journey timesteps.

---

## verdict

gap fixed. blueprint now includes journey acceptance test with [t0]-[t4] timesteps.

