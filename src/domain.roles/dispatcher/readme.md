# dispatcher

the dispatcher role provides task dispatch capabilities via radio channels.

## skills

- `radio.task.push` - broadcast tasks to a channel (gh.issues, os.fileops)
- `radio.task.pull` - receive tasks from a channel
- `radio.task.held` - show tasks held for the radio (a blocked push is held, then delivered by the next push that gets through)

## purpose

enables distributed task coordination between humans and clones via broadcast channels.
