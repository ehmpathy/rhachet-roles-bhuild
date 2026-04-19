# self-review: role-standards-adherance

review for adherence to mechanic role standards.

## relevant briefs directories

the changes are template text, not TypeScript code. relevant brief categories:

1. **lang.terms** — gerund rules, forbidden terms
2. **practices** — directory decomposition, conventions

not relevant (no TypeScript code changed):
- test patterns
- error patterns
- domain patterns
- observability

## brief check: rule.forbid.gerunds

**changes checked**: 1.vision.stone, 1.vision.guard.light, 1.vision.guard.heavy

**gerunds found**: none remain (all were caught by hooks and fixed)

**verdict**: compliant

## brief check: rule.forbid.term-*

**changes checked**: all three template files

**forbidden terms found**: none remain (hooks caught several terms during early iterations and I fixed them)

**verdict**: compliant

## brief check: naming conventions

**changes checked**: section name "groundwork", subsections "external research"/"internal research", slug "has-grounded-in-reality"

**pattern compliance**:
- section names: lowercase, natural language ✓
- subsection names: match extant research stone terminology ✓
- slug: kebab-case, `has-*` prefix ✓

**verdict**: compliant

## brief check: template structure

**changes checked**: YAML structure in guards

**pattern compliance**:
- `slug:` + `say: |` structure ✓
- indentation matches extant entries ✓
- multiline text uses `|` block scalar ✓

**verdict**: compliant

## violations found

none. all changes comply with mechanic role standards.

## why standards hold

| standard | check | why it holds |
|----------|-------|--------------|
| no gerunds | hooks enforced | all gerunds fixed before write |
| no forbidden terms | hooks enforced | all terms fixed before write |
| naming conventions | manual check | follows extant patterns |
| template structure | YAML validity | builds pass, format matches |
