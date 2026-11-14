# dispatcher

the dispatcher role sends tasks to, and receives tasks from, a radio channel (gh.issues or os.fileops).

## skills

- `radio.task.push` - broadcast tasks to a channel (gh.issues, os.fileops)
- `radio.task.comment` - comment on an extant task, issue, or pr, behind the same gate as a push (held when blocked; an exact body already on the thread is kept, never posted twice)
- `radio.task.pull` - receive tasks from a channel
- `radio.task.queue` - read, amend, drop, and drain the tasks held for the radio: `get | set | del | drain` (a blocked push is held, then delivered by the next push or drain that gets through; a record that upstream refuses or faults on is set aside and the rest still deliver; a record file that cannot be read fails loud, named, with its fix, and is never skipped)
## purpose

lets humans and clones hand tasks to each other: one pushes a task onto a channel, another pulls it, claims it, and delivers it.
