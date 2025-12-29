# rule.require.namespaced.domainobject.names

## .what

all domain types (objects, literals, enums) must be namespaced to their parent domain hierarchy

## .why

- prevents naming collisions across domains
- makes type provenance immediately clear
- enables autocomplete grouping by domain
- ensures domain ownership is explicit

## .scope

applies to all domain distillation outputs:
- domain.objects (entities, literals)
- enums and type aliases
- nested types within domain objects

## .how

### naming pattern

```
[ParentDomain][ChildDomain]?[TypeName]
```

### examples

**entities follow domain pipeline:**
```ts
// ✅ good - namespaced to pipeline stage
BehaviorGathered
BehaviorDeptraced
BehaviorMeasured
BehaviorTriaged

// ❌ bad - generic, not namespaced
Behavior
GatheredItem
TracedDeps
```

**literals follow parent entity:**
```ts
// ✅ good - namespaced to parent entity
BehaviorMeasuredGainLeverage    // belongs to BehaviorMeasured.gain
BehaviorMeasuredGainYieldage    // belongs to BehaviorMeasured.gain
BehaviorMeasuredCostAttend      // belongs to BehaviorMeasured.cost
BehaviorMeasuredCostExpend      // belongs to BehaviorMeasured.cost

// ❌ bad - generic, context unclear
Leverage
Yieldage
TimeCost
CashCost
```

**enums follow parent entity:**
```ts
// ✅ good - namespaced to entity that owns them
BehaviorGatheredStatus          // used in BehaviorGathered.status
BehaviorMeasuredPriorityLevel   // used in BehaviorMeasured.priority
BehaviorTriagedReadinessLevel   // used in BehaviorTriaged.dimensions.readiness
BehaviorTriagedBandwidthLevel   // used in BehaviorTriaged.dimensions.bandwidth
BehaviorTriagedUrgencyLevel     // used in BehaviorTriaged.decision

// ❌ bad - generic, applies to nothing specific
Status
PriorityLevel
ReadinessLevel
BandwidthLevel
UrgencyLevel
```

### nested types follow full path:
```ts
// ✅ good - full path to nested location
BehaviorMeasuredGainYieldageChance

// ❌ bad - unclear where this belongs
YieldageChance
Chance
```

## .enforcement

- generic type names without domain namespace = **BLOCKER**
- enums or literals that could belong to multiple parents = **BLOCKER**
- types that don't indicate their owning entity = **BLOCKER**

## .rationale

when reading code, you should immediately know:
1. which domain this type belongs to
2. which entity owns this type
3. where in the entity hierarchy this type lives

generic names like `UrgencyLevel` force you to search for context.
namespaced names like `BehaviorTriagedUrgencyLevel` are self-documenting.

## .see also

- rule.forbid.unscoped.domainobject.names (negative pattern)
