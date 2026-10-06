# rule.require.verify-released-before-close

## .what

before you stop a crew, read it and verify the work was released.

## .why

- a stopped crew cannot be recovered — its pane history goes with it
- a premature stop loses the context that would explain what was left
- "one published" could name any crew in the fleet; a read is what parts them

## .pattern

```bash
# 1. read the mechanic first
rhx git.crew.read --tree "$tree" --who mechanic

# 2. verify the output shows a release — "released", "merged", "published",
#    or a PR merge confirmation

# 3. only then stop
rhx git.crew.stop --tree "$tree"
```

## .antipattern

```bash
rhx git.crew.stop --tree "$tree"    # ⛔ what if it was never released?
```

## .enforcement

a crew stopped with no prior read that shows a release = **blocker**

## .see also

- `rule.require.tree-del-before-duct-close.md` — the gate that runs after this read
- `rule.always.entool-the-layer-you-drop-below.md` — why the verbs above are crew verbs

---

written by human + seaturtle 🐢
