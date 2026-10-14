# F23 — routine tool bumps in the tree ride along with this change

- **the fork** — peers enroll-impl-behavior-intent (i007 decisions) and enroll-impl-arch-defects
  (i007 nitpick.6): `package.json` / `pnpm-lock.yaml` (the fireworksai brain and a bhrain bump), the
  actor `settings.json` rewrite, and the `.depcheckrc.yml` ignore sit in the tree beside the fix.
  (a) split them into a separate chore; (b) let them ride along.
- **taken** — (b). they are the routine churn of `rhachet roles init` on this worktree, not an act
  of this route. `rule.require.git-release-confidence` (mechanic) puts routine rhachet, role, and
  settings bumps in scope by default and names a split of them as churn. the `.depcheckrc.yml`
  ignore is the one line that keeps lint green under the fireworksai bump; the reviewer is right
  that the two are bound together, which is why they ship as one set.
- **rework** — clean. a human may split them at commit time; no code in this route depends on them.
- **confidence** — 80%. low part: the commit is the human's act, and the human may still prefer a
  separate chore.
- **where** — `package.json`, `pnpm-lock.yaml`, `.depcheckrc.yml`,
  `.agent/.actors/actor.via.slug=.default/brain/.claude/settings.json`.
- **verdict** — unruled.
