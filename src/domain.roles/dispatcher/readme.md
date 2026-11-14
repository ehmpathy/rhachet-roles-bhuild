# dispatcher

the dispatcher role dispatches work two ways: tasks via radio channels, and plain directed text
between clones via the phone.

## skills

### radio — broadcast tasks

- `radio.task.push` - broadcast tasks to a channel (gh.issues, os.fileops)
- `radio.task.pull` - receive tasks from a channel
- `radio.task.queue` - read, amend, drop, and drain the tasks held for the radio: `get | set | del | drain` (a blocked push is held, then delivered by the next push or drain that gets through; a record that upstream refuses or faults on is set aside and the rest still deliver; a record file that cannot be read fails loud, named, with its fix, and is never skipped)

### phone — text peer clones

- `phone.text` - send a text to a peer clone or a group (`--into group:<id>`), read this clone's thread, or withdraw a QUEUED text; the text is written into the receiver's inbox, on this grove or across one
- `phone.contacts` - read, grant, or revoke the peers this clone may text beyond its own tree
- `phone.contacts.uses` - the meter on whether this tree's clones may manage their own contacts (a human sets it)
- `phone.daemon` - check, start, or stop the tree's daemon, which says each text held for its clones over `rhx clone say`
- the onStop hook tells a clone of each text held for it, so a text reaches its clone even when the daemon has failed

## purpose

enables distributed coordination between humans and clones: tasks via broadcast channels, and
direct text between a director and its crews, both ways, with no pane keystroke.
