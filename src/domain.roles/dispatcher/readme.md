# dispatcher

the dispatcher role provides task dispatch capabilities via radio channels.

## skills

- `radio.task.push` - broadcast tasks to a channel (gh.issues, os.fileops)
- `radio.task.pull` - receive tasks from a channel
- `radio.task.held` - show tasks held for the radio (a blocked push is held, then delivered by the next push that gets through)

## purpose

enables distributed task coordination between humans and clones via broadcast channels.

## where a dispatch lives

the source you author for a push lives with the route that produced it, at
`$route/.dispatch/dispatch.$target.$slug.[task].md` (`.behavior/.dispatch/` when no route is
bound) — never under a `briefs/` dir. a durable lesson in it
is distilled into a brief of its own. the rule: `behavior.execution/rule.require.dispatch-lives-with-its-route` (behaver).
