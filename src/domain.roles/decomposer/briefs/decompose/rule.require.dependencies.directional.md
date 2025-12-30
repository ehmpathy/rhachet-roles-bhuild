# dependencies.directional

# severity = blocker

## .what
dependencies between proposed behaviors must flow in one direction - no cycles allowed.

## .how
- identify which behaviors produce artifacts others consume
- producer behaviors have zero or fewer dependencies
- consumer behaviors depend on producers

## .principle.order
behaviors with fewer dependencies should be built first, enable parallel work on independent behaviors.
