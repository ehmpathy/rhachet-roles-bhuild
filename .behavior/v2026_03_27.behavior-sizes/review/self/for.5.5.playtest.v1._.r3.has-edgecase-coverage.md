# self-review: has-edgecase-coverage (r3)

## the actual question

> are edge cases covered in the playtest?

let me read the playtest as a foreman would and look for gaps.

## issue found: verify heavy guard content

**playtest line 150:**
```
**verify:**
- mini templates created
- `1.vision.guard` has heavy content
```

**the problem:** how does a foreman know what "heavy" content looks like?

the instruction says to verify the guard "has heavy content" but does not explain:
- what heavy content looks like
- how to distinguish heavy from light
- what command to run to check

**fix needed:** add concrete verification command

```bash
cat .behavior/*/1.vision.guard | head -20
```

and explain what to look for:
- heavy guard has more reviews/judges
- light guard has fewer constraints

**status:** this is a gap. i need to fix the playtest.

## playtest fix

update happy path 5 with explicit verification:

```markdown
**verify:**
- mini templates created
- `1.vision.guard` has heavy content:
  ```bash
  cat .behavior/*/1.vision.guard | grep -c "review\|judge"
  ```
  heavy guard should have more review/judge lines than light
```

## other edge cases reviewed

### edge case: foreman runs from wrong directory

**playtest coverage:** each happy path starts with `cd .temp`

**verdict:** covered

### edge case: .temp/ directory not extant

**playtest coverage:** first command `rm -rf test-nano && mkdir test-nano` handles this

**verdict:** covered

### edge case: foreman forgets git init

**playtest coverage:** explicit `git init && git commit --allow-empty -m "init"`

**verdict:** covered

### edge case: foreman runs on main branch

**playtest coverage:** explicit `git checkout -b feature/...`

**verdict:** covered

## issue action

**before i continue:** i must fix happy path 5 in the playtest to explain how to verify heavy guard content.

let me update the playtest now.
