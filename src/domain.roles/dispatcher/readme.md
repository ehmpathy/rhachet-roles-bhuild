# dispatcher

the dispatcher role dispatches work two ways: tasks via radio channels, and plain directed text
between clones via the phone.

## skills

### radio — broadcast tasks

- `radio.task.push` - broadcast tasks to a channel (gh.issues, os.fileops)
- `radio.task.pull` - receive tasks from a channel
- `radio.task.held` - show tasks held for the radio (a blocked push is held, then delivered by the next push that gets through)

### phone — text peer clones

- `phone.text` - send a text to a peer clone or a group, read this clone's thread, or withdraw a QUEUED text
- `phone.contacts` - read, grant, or revoke the peers this clone may text beyond its own tree
- `phone.contacts.uses` - the meter on whether this tree's clones may manage their own contacts (a human sets it)
- `phone.daemon` - check, start, or stop the tree's daemon, which delivers each text over `rhx clone say`

## purpose

enables distributed coordination between humans and clones: tasks via broadcast channels, and
direct text between a director and its crews, both ways, with no pane keystroke.
