# F9 — the `--auth` help values render as child branches, not indented text

- **fork**: case=6 sketched the four values as text indented beside `--auth`. (a) render as sketched · (b) render each value as a child branch (`│  ├─ as-ehmpath …`) under the `--auth` row
- **taken**: (b). `rule.forbid.treestruct-indented-text-as-children` (ergonomist) bars list items drawn as indented text beside their label. the value, its column, and the order match the sketch; only the glyphs differ
- **rework**: clean — the three help strings and their snapshots
- **confidence**: 90%
- **where**: `src/contract/cli/radioTask{Push,Pull,Queue}.ts` help text
- **verdict**: —
