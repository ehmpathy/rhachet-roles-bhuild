# decomposed

this behavior was decomposed into focused behaviors.

**applied_at:** 2025-01-01T10:00:00Z
**plan_file:** z.plan.decomposition.v1.json

## behaviors created

| name         | path                               |
| ------------ | ---------------------------------- |
| feature-auth | .behavior/v2025_01_01.feature-auth |
| feature-data | .behavior/v2025_01_01.feature-data |

## dependency graph

```
feature-auth
     |
     v
feature-data
```

## next steps

1. cd to each behavior directory
2. regenerate criteria from decomposed wish/vision
3. proceed with normal bhuild thoughtroute
