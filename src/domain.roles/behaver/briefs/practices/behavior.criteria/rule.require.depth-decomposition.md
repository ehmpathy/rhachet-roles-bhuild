.tactic = criteria:require-depth-decomposition

.what = criteria must be decomposed by depth before scope

.why
- different depths have different concerns and stakeholders
- infra depth concerns (cache, storage) differ from domain depth concerns (business rules)
- terms depth concerns (vocabulary) differ from both
- mixed depths within scopes create confusion and couple concerns
- clear depth separation enables parallel implementation by specialists

.scope
- applies to all criteria documents
- BLOCKER level violation when detected

.definitions
- **depth** = layer of concern (e.g., terms, domain, infra)
- **scope** = bounded context within a depth
- **usecase** = specific behavior within a scope
- **given/when/then** = atomic criteria within a usecase

.hierarchy
```
depth (terms | domain | infra)
  └── scope (bounded context)
        └── usecase (specific behavior)
              └── given/when/then (atomic criteria)
```

.depths
- **terms** = vocabulary, ubiquitous language, definitions
- **domain** = business logic, rules, contracts, workflows
- **infra** = implementation details, cache, storage, parallel execution

.detect
- criteria with mixed infrastructure concerns and domain logic in same scope
- cache or storage details alongside business rules
- terminology definitions scattered across domain scopes
- no clear depth headers in criteria document

.fix
- group all terms-depth criteria together (vocabulary, definitions)
- group all domain-depth criteria together (business logic, contracts)
- group all infra-depth criteria together (cache, storage, parallel execution)
- use `# depth.X = name` headers to separate depths

.examples

.negative (mixed depths)
```
# scope.1 = gather behaviors
given('sources configured')
  when('gather runs')
    then('behaviors discovered')
    then('with-simple-cache is used')        # infra concern mixed with domain
    then('"yieldage" means effective gain')  # terms concern mixed with domain
```

.positive (decomposed by depth)
```
# depth.1 = terms

## scope.1.1 = ubiquitous language
given('dispatcher terminology')
  when('measurement terms used')
    then('"yieldage" is used for effective gain')


# depth.2 = domain

## scope.2.1 = gather behaviors
given('sources configured')
  when('gather runs')
    then('behaviors discovered')


# depth.3 = infra

## scope.3.1 = gather cache
given('gather cache implemented')
  when('cache mechanism chosen')
    then('with-simple-cache is used')
```

.benefit
- each depth can be reviewed by relevant specialists
- infra changes don't pollute domain criteria diffs
- terms can be established before domain logic is specified
- enables parallel work across depths
