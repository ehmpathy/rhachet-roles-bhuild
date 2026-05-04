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
   - treestruct format for hierarchical data (cli: visual branches, api: well-nested objects)
   - consistent indentation
   - logical groups

2. **readability**
   - no debug noise
   - clear labels and messages

3. **consistency**
   - same format across similar outputs
   - same terminology throughout
   - matches extant patterns in codebase

4. **mascots** (only if cli repo with mascot defined in README)
   - if mascot defined: emoji usage should match throughout
   - if not a cli or no mascot: this check does not apply

## .examples

### blocker — debug noise in snapshot

```
exports[`behavior init`] = `
📦 init
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
🦫 dammed right

🌲 behavior.review --guard heavy
   └─ complete
```

format must be consistent across commands in the same repo.

### blocker — flat api response (treestruct = well-nested objects)

```
exports[`getInvoice`] = `
{
  "invoiceId": "inv_123",
  "invoiceStatus": "paid",
  "customerName": "acme",
  "customerEmail": "acme@example.com",
  "lineItem0Amount": 100,
  "lineItem1Amount": 50
}
`;
```

should be well-nested:

```
exports[`getInvoice`] = `
{
  "invoice": {
    "exid": "inv_123",
    "status": "paid",
    "customer": {
      "name": "acme",
      "email": "acme@example.com"
    },
    "lineItems": [
      { "amount": 100 },
      { "amount": 50 }
    ]
  }
}
`;
```

## .treestruct reference (cli repos with mascots only)

```
{mascot emoji} {status phrase}

{command emoji} {command}
   ├─ {key}: {value}
   └─ {section}
      ├─ {item}
      └─ {item}
```

check repo README for mascot and emoji conventions.

## .see also

- `repo=ehmpathy/role=ergonomist` `rule.require.treestruct-output` — treestruct format for cli output
- `repo=ehmpathy/role=mechanic` `rule.require.treestruct` — treestruct name patterns
