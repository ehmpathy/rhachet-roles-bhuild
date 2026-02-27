# howto: test self-reviews via bhrain

## .what

pattern for test of bhrain routes with self-review guards in acceptance tests.

## .critical constraints

### slugs MUST use dashes, NOT dots

bhrain does NOT support dots in slug names. use dashes:
- `behavior-declaration-coverage` ✓
- `behavior.declaration.coverage` ✗

dots in slugs cause bhrain to fail to recognize promises as valid.

### NEVER delete triggered files

bhrain uses `.triggered` files for state management. deletion breaks the promise flow:
- bhrain creates triggered file when self-review is first encountered
- bhrain checks triggered file mtime for 90-second cooldown
- bhrain matches promise files to triggered files

if you delete triggered files, promises become orphaned and bhrain won't recognize them.

## .the bhrain test pattern

bhrain's own acceptance tests follow this exact sequence:

```typescript
when('[t0] pass attempted without promises', () => {
  // calls --as passed → triggers FIRST review → blocked
  const result = invokeRouteSkill({ as: 'passed' });  // triggers review 1
});

when('[t1] first review is promised', () => {
  const result = useThen(async () => {
    // NO pass call - t0 already triggered review 1
    await backdateTriggeredReport({ slug: 'all-done' });
    return invokeRouteSkill({ as: 'promised', that: 'all-done' });
  });
});

when('[t2] second review is promised', () => {
  const result = useThen(async () => {
    // CALL --as passed to trigger review 2
    await invokeRouteSkill({ as: 'passed' });
    await backdateTriggeredReport({ slug: 'tests-pass' });
    return invokeRouteSkill({ as: 'promised', that: 'tests-pass' });
  });
});
```

### key insight

- **t0** calls `--as passed` → creates triggered file for review 1
- **t1** does NOT call pass (review 1 already triggered) → backdate → promise
- **t2** calls `--as passed` (creates triggered file for review 2) → backdate → promise
- **tN** for N > 1: call pass → backdate → promise

## .helper functions

### backdateTriggeredFile

bhrain enforces 90-second cooldown via mtime check. backdate to bypass:

```typescript
const backdateTriggeredFile = (input: {
  routeDir: string;
  stone: string;
  slug: string;
}): void => {
  const files = fs.readdirSync(input.routeDir);
  const triggeredFile = files.find(
    (f) =>
      f.includes(`${input.stone}.guard.selfreview.${input.slug}`) &&
      f.endsWith('.triggered'),
  );
  if (triggeredFile) {
    const filePath = path.join(input.routeDir, triggeredFile);
    const mtimePast = new Date(Date.now() - 91 * 1000);
    fs.utimesSync(filePath, mtimePast, mtimePast);
  }
};
```

### promiseAllSelfReviews

promise multiple self-reviews in order:

```typescript
const promiseAllSelfReviews = (input: {
  repoDir: string;
  routeDir: string;
  routeRel: string;
  stone: string;
  slugs: string[];
}): void => {
  for (let i = 0; i < input.slugs.length; i++) {
    const slug = input.slugs[i];

    // 1. trigger next review via --as passed (skip for i=0, already triggered)
    if (i > 0) {
      try {
        execSync(`... --as passed`, { cwd: input.repoDir });
      } catch {
        // expected — blocked by self-review
      }
    }

    // 2. verify triggered file exists for this slug
    const triggeredFile = findTriggeredFile({ routeDir, stone, slug });
    if (!triggeredFile) throw new Error(`no triggered file for slug=${slug}`);

    // 3. backdate the triggered file
    backdateTriggeredFile({ routeDir, stone, slug });

    // 4. promise this review
    execSync(`... --as promised --that ${slug}`, { cwd: input.repoDir });

    // 5. verify promise file was created
    const promiseFile = findPromiseFile({ routeDir, stone, slug });
    if (!promiseFile) throw new Error(`promise file not created for slug=${slug}`);
  }
};
```

## .file name conventions

### triggered files

pattern: `{stone}.guard.selfreview.{slug}.{hash}.triggered`
- hash is 64-char sha256 derived from guard file content

### promise files

pattern: `{stone}.guard.promise.{slug}.{hash}.md`

## .common mistakes

| mistake | symptom | fix |
|---------|---------|-----|
| dots in slug names | "review.self 1/4" stays after promise | use dashes: `behavior-declaration-coverage` |
| delete triggered files | promises not recognized | never delete triggered files |
| call pass on i=0 | no triggered file for slug | skip pass for i=0, already triggered by caller |
| forget backdate | 90-second cooldown blocks promise | backdate mtime by 91+ seconds |

## .see also

- bhrain test: `rhachet-roles-bhrain/blackbox/driver.route.self-review.acceptance.test.ts`
- fetch via: `gh api --method GET repos/ehmpathy/rhachet-roles-bhrain/contents/blackbox/driver.route.self-review.acceptance.test.ts`
