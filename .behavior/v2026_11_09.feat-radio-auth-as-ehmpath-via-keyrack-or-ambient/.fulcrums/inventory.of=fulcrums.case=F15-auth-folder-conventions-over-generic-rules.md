# F15 — the new auth operations follow the auth folder's extant conventions

- **fork**: three peer points ask the new auth leaves to depart from the folder's extant shape: (1) `getOne<Noun>` over `get<Noun>` · (2) `input: Record<never, never>` or no input over `Record<string, never>` · (3) the `git config user.email` read lifted to `src/infra/git`. (a) adopt each · (b) keep the extant convention, and say why in the op doc where a reader would trip
- **taken**: (b).
  - (1) the caller `getGithubTokenByAuthArg` and both new leaves name a token read `get<Noun>`; a `.name` note in `getEhmpathTokenByVia` says so. a rename would split the folder or ripple into the extant caller
  - (2) `Record<string, never>` is the repo's form for a no-input operation (7 extant sites under `src/domain.operations`)
  - (3) the email read and `gh auth token` share one exit rule in one helper, and they ARE the ambient spot's definition; one caller, so no lift yet (`rule.prefer.most-common-denominator`)
- **rework**: clean — each is a rename or a file move with one caller
- **confidence**: 80%
- **where**: `src/domain.operations/radio/auth/getEhmpathTokenBy*.ts`, `getEhmpathTokenFrom{Keyrack,Ambient}.ts`
- **verdict**: —
