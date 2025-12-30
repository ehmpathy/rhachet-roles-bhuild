# context.threshold

# severity = blocker

## .what
behaviors that consume >30% of context window should be decomposed.

## .why
- 30% artifacts leaves 70% for execution headroom
- execution needs space for: tool calls, thought, code generation, iteration
- cramped context leads to: forgotten requirements, inconsistent output, missed edge cases

## .calculation
- sum chars from: criteria + research + distill files
- estimate tokens: chars / 4
- context window: 200k tokens (claude)
- threshold: 60k tokens (30%)
