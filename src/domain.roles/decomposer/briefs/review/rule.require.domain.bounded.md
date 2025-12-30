# domain.bounded

# severity = blocker

## .what
behaviors that span multiple distinct domains should be decomposed.

## .signals
- research files cover unrelated topics
- criteria use inconsistent terminology
- "and" appears frequently to connect unrelated capabilities
- different expertise required for different sections

## .action
flag as hazard when multiple bounded contexts detected, recommend decomposition to enforce separation of concerns.
