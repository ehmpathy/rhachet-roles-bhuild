# rule.forbid.unscoped.domainobject.names

## .what

domain object names must not be generic or unscoped

## .why

unscoped names:
- create ambiguity about ownership
- cause naming collisions across domains
- force readers to search for context
- break autocomplete grouping

## .scope

applies to all domain distillation outputs:
- domain.objects (entities, literals)
- enums and type aliases
- nested types within domain objects

## .forbidden patterns

### generic nouns without domain prefix

```ts
// ❌ forbidden - no domain context
Status
Level
Type
Entry
Config
Result
```

### suffix-only names

```ts
// ❌ forbidden - suffix without domain path
PriorityLevel
ReadinessLevel
BandwidthLevel
UrgencyLevel
Chance
```

### abbreviated or partial namespaces

```ts
// ❌ forbidden - incomplete namespace
Leverage           // which domain? which entity?
Yieldage           // belongs to gain? cost? measured?
Attend             // cost dimension but not namespaced
```

### names that could belong to multiple parents

```ts
// ❌ forbidden - ambiguous ownership
Dimensions         // Measured.dimensions? Triaged.dimensions?
Composite          // gain.composite? cost.composite?
Distribution       // yieldage.distribution? other?
```

## .detection

flag as **BLOCKER** when:
- type name has fewer than 2 domain segments
- type name uses generic suffix without entity prefix
- type name could reasonably belong to multiple entities
- enum/literal name doesn't indicate owning entity

## .resolution

prefix with full domain path:

```ts
// ❌ before
type UrgencyLevel = 'now' | 'soon' | 'later';

// ✅ after
type BehaviorTriagedUrgencyLevel = 'now' | 'soon' | 'later';
```

```ts
// ❌ before
interface Leverage { author: number; support: number; }

// ✅ after
interface BehaviorMeasuredGainLeverage { author: number; support: number; }
```

## .see also

- rule.require.namespaced.domainobject.names (positive pattern)
