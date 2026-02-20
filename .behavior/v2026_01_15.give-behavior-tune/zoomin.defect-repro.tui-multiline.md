# defect reproduction: tui multiline experience

## .test criteria (bdd format)

### scenario 1: alt+enter inserts newline

```gherkin
given the feedback repl is active
  and the user has typed "line one"
when the user presses alt+enter
then a newline is inserted after "line one"
  and the cursor moves to the next line
  and no submit occurs
```

**expected**: cursor on new line, ready for "line two"
**actual**: TBD (need real terminal test)

### scenario 2: multiline paste preserves content

```gherkin
given the feedback repl is active
  and the clipboard contains:
    """
    function example() {
      return 42;
    }
    """
when the user pastes the clipboard content
then all three lines appear in the input
  and indentation is preserved
  and no submit occurs
  and cursor is at end of pasted content
```

**expected**: all content visible, format intact
**actual**: TBD (need real terminal test)

### scenario 3: history navigation with multiline entry

```gherkin
given the feedback repl has prior entries:
  | index | severity | text |
  | 1 | blocker | "line one\nline two\nline three" |
  | 2 | nitpick | "short entry" |
when the user presses up arrow (with empty input)
then entry #2 "short entry" loads into input
when the user presses up arrow again
then entry #1 loads with all three lines visible
when the user presses down arrow
then entry #2 loads back
when the user presses down arrow again
then input returns to empty (draft restored)
```

**expected**: full multiline content loads, navigation works both directions
**actual**: TBD (need real terminal test)

---

## .reproduction plan

### step 1: find the test runner

```sh
# look for runFeedbackRepl or similar
ls src/domain.operations/behavior/feedback/repl/
```

### step 2: run with debug

```sh
DEBUG_REPL=true npx tsx <path-to-repl-runner> /tmp/test.md
```

### step 3: test each scenario

for each scenario:
1. perform the action
2. observe result
3. check /tmp/repl-debug.log for stdin data
4. document actual vs expected

### step 4: identify root cause

compare:
- what escape sequence was sent (hex in log)
- what ink parsed (useInput log)
- what action was taken

---

## .findings

(to be filled as defects are reproduced)

### alt+enter

**stdin hex**: TBD
**ink parsed**: TBD
**result**: TBD

### paste

**stdin hex**: TBD
**ink parsed**: TBD
**result**: TBD

### history navigation

**observation**: TBD

---

## .next actions

1. find repl entry point
2. run in real terminal
3. document each defect
4. trace to root cause
