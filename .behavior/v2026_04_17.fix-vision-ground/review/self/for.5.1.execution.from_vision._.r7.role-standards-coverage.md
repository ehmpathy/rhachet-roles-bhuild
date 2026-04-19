# self-review: role-standards-coverage (round 7)

which mechanic standards apply to template prose changes, and are they all covered?

## relevant briefs directories

the changes are template text (markdown + YAML), not TypeScript code.

| briefs directory | relevant? | why |
|------------------|-----------|-----|
| lang.terms | yes | gerunds, forbidden terms apply to prose |
| practices | yes | naming conventions, structure patterns |
| test | no | no TypeScript code, no tests to write |
| error | no | no error patterns in prose templates |
| domain | no | no domain objects or operations |
| observability | no | no logs or metrics |

## standards checklist

### lang.terms standards

| standard | applies | covered |
|----------|---------|---------|
| rule.forbid.gerunds | yes | hooks enforced, zero gerunds in final text |
| rule.forbid.term-existing | yes | used "extant" throughout |
| rule.forbid.term-nothing | yes | used "none" throughout |
| rule.forbid.term-helpers | yes | term not used |
| rule.require.order.noun_adj | yes | "external research" not "research external" |

### practices standards

| standard | applies | covered |
|----------|---------|---------|
| naming.sections | yes | lowercase natural language headers |
| naming.slugs | yes | kebab-case with has-* prefix |
| yaml.structure | yes | slug + say pattern matches extant |
| yaml.indentation | yes | 2 spaces for keys, 4 for content |

## patterns that should be present

for template additions:

1. **section placement** — new sections go in logical order
   - covered: groundwork goes after open questions, before awkward (matches flow)

2. **subsection consistency** — subsections match extant patterns
   - covered: ### headers match other subsections in stones

3. **guard consistency** — same review in light and heavy variants
   - covered: has-grounded-in-reality in both guards, identical text

4. **edge case prompts** — templates handle empty cases
   - covered: "if none referenced, say 'none'" in both subsections

## patterns not applicable

these mechanic patterns do not apply to template prose:

- error handles (no code)
- validation (no inputs)
- tests (no behavior to test)
- types (no TypeScript)
- domain patterns (no entities)
- caching (no data access)
- observability (no runtime)

## gaps found

none. all applicable standards are covered.

## why coverage is complete

the changes are minimal prose additions to template files. the relevant standards are all language-level (gerunds, terms, naming) and structural (YAML format, section order). all were enforced by hooks and verified by manual review. no TypeScript patterns apply because no code was written.
