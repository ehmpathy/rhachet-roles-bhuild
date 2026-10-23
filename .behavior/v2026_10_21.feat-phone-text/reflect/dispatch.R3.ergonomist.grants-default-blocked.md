## .what

new rule `rule.require.grants-default-blocked` in ergonomist, as a peer of `rule.require.safe-by-default`:

- a permission that widens what an actor may reach or do (contacts, push, commit quota) is **blocked by default, always**, for every actor
- it is lifted only by an explicit act: a human at a tty, or a boot hook run beneath the actor
- it is **never inferred from role** ("directors are allowed" by detection is forbidden)
- unset reads as blocked

## .why

`rule.require.safe-by-default` names destructive actions. a reach widener is not destructive, so the rule did not fire. a vision drafted "a director may manage its own contacts by default". the human ruled: "default blocked always", with directors granted "via their hooks with the grant automatically".

role detection is an implicit grant. a grant should be an act someone can point to and audit.

## .provenance

`rhachet-roles-bhuild` @ `beav/feat-phone-text`, stone `1.vision`, fulcrum F3. extant precedent that already follows this shape: `radio.uses`, `git.commit.uses`.

## .the forbid pair — ship both

a forbid bites faster than a require: a reviewer greps for a forbidden shape, but must reason to spot an absent one. so ship the twin:

**`rule.forbid.role-inferred-grants`** — a grant that opens by default, or opens because of who the actor is:

| 👎 forbidden | 👍 instead |
|---|---|
| `if (role === 'director') allow` | the director's boot hook runs `phone.contacts.uses allow` |
| unset meter reads as allowed | unset reads as blocked |
| a clone lifts its own meter | human only (tty or `__I_AM_HUMAN=true`) |

## .enforcement (proposed)

- a reach or privilege widener that defaults open = blocker
- a grant inferred from role, with no explicit act = blocker
