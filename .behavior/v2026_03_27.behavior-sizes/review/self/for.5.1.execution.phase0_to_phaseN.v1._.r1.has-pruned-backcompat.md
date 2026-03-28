# self-review: has-pruned-backcompat

## reviewed

the implementation was checked for unnecessary backwards compatibility.

## findings

### no backwards compatibility concerns found

the implementation avoids common backcompat pitfalls:

1. **no deprecated parameter aliases** - no `--level` alias for `--size`, no legacy names
2. **no migration code** - no detection/upgrade of "old" behaviors to "new" format
3. **no version flags** - no `--v1` vs `--v2` modes or compatibility shims
4. **no legacy defaults** - no special handling for "extant users expect X"
5. **no conditional logic based on behavior age** - no "if created before X date" checks

### design decisions that avoid backcompat debt

| decision | why it's clean |
|----------|----------------|
| `size` is optional | new feature, not changing extant behavior |
| default is `medi` | sensible default, not "what users had before" |
| findsert semantics | rerunning with different size keeps files |
| cumulative sizes | simple additive model, no special cases |

### considered but rejected

- no `--migrate` command to upgrade extant behaviors
- no `--compat` flag for "old style" initialization
- no detection of "this looks like a mini behavior without the flag"

### minimum viable

the implementation adds `--size` as a new optional parameter. extant callers (no `--size` flag) get `medi` behavior, which matches the spirit of "default ceremony" from before the feature.

all changes directly serve the `--size` feature requirement without backcompat overhead.
