# dispatcher

the dispatcher role provides task dispatch capabilities via radio channels.

## skills

- `radio.task.push` - broadcast tasks to a channel (gh.issues, os.fileops)
- `radio.task.pull` - receive tasks from a channel
- `radio.task.queue` - read, amend, drop, and drain the tasks held for the radio: `get | set | del | drain` (a blocked push is held, then delivered by the next push or drain that gets through; a record that faults is set aside and the rest still deliver)
- `radio.task.held` - deprecated alias of `radio.task.queue get`; prints a rename notice

## purpose

enables distributed task coordination between humans and clones via broadcast channels.
