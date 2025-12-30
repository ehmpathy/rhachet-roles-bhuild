# contexts.bounded

# severity = blocker

## .what
each proposed behavior should represent a single bounded context - a cohesive domain with its own ubiquitous language and clear boundaries.

## .how
- look for natural seams in criteria where terminology shifts
- group criteria that share domain concepts together
- separate criteria that could evolve independently
- identify where one domain's output becomes another's input (dependency boundary)

## .signals.good
- criteria within a behavior use consistent terminology
- behaviors can be explained without reference to peer behaviors
- changes to one behavior rarely require changes to peers
- each behavior has a clear "job to be done"
