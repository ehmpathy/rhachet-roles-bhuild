# F7 — an `as-ehmpath` hit adds an `auth = … (via …)` line

- **fork**: on a successful `as-ehmpath` send, (a) print no auth line, as every value does today · (b) add one line that names the spot that paid
- **taken**: (b), scoped to `as-ehmpath` alone. the wish does not ask for it. it is the one value with two sources, so a later 403 or a wrong-author issue is only diagnosable if the output says which token was used. one line, one value, no other output changes
- **rework**: clean — drop the line and its snapshot rows
- **confidence**: 70%. a vision addition, not a wish requirement; the wisher may prefer zero output change
- **where**: the push and drain success output
- **verdict**: approved by the director with the vision, 2026-11-14; clean rework, held as taken
