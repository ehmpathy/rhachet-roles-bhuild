# tldr

## severity: blocker

forbid snapshot visual blemishes: snapped output must be clean, readable, consistent

snapshots are the contract. visual blemishes in snapshots are experiential defects that ship to users.

---
---
---

# deets

## .what

review for visual and experiential blemishes in snapshot files.

## .why

snapshots capture what users will see. blemishes in snapshots are blemishes in production. reviewers must be able to vibecheck the output.

## severity: blocker

visual blemishes block merge. the snapshot is the contract — it must look correct.

## .how

for each snapshot in the diff, check:

1. **structure clarity**
   - treestruct format for hierarchical data
   - consistent indentation
   - logical groups

2. **readability**
   - no debug noise
   - no internal ids exposed to users
   - clear labels and messages

3. **consistency**
   - same format across similar outputs
   - same terminology throughout
   - matches extant patterns in codebase

4. **turtle vibes** (for cli output)
   - turtle emoji for headers
   - treestruct branches
   - vibe phrases for status

## .examples

### blocker — debug noise in snapshot

```
exports[`behavior init`] = `
🐚 init
   ├─ path: .behavior/foo
   ├─ DEBUG: internal state = { x: 1 }
   └─ done
`;
```

the DEBUG line is a visual blemish.

### blocker — inconsistent format

one command outputs:
```
✓ success
```

another outputs:
```
🐢 cowabunga!
🐚 command
   └─ done
```

format must be consistent across commands.

### blocker — exposed internal ids

```
exports[`create invoice`] = `
{
  "id": "inv_a1b2c3d4e5f6",
  "internalDbId": 12345,
  ...
}
`;
```

`internalDbId` should not appear in user-faced output.

## .treestruct reference

```
🐢 {vibe phrase}

🐚 {command}
   ├─ {key}: {value}
   └─ {section}
      ├─ {item}
      └─ {item}
```
