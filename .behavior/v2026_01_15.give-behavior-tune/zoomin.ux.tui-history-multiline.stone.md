# stone: ideal ux for give.feedback tui

## .answer

see companion briefs:
- `zoomin.ux.tui-history-multiline.v1.i1.md` - main answer
- `zoomin.root-cause.tui-newline.md` - root cause analysis
- `zoomin.ref.claude-code-terminal-setup.md` - how claude code does it

**tl;dr**: the code is correct. terminals need configuration. most terminals don't send CSI u sequences for shift/alt+enter by default - they send plain `\n` which triggers submit. ctrl+j is the only universal newline. solution: add terminal-setup helper like claude code does, or document the workarounds.

---

## .the question

we need to step back and think through the ideal user experience for the tui for give.feedback

particularly around history and multiline content (inputs, histories, and pastes)

what would the ideal experience look like?

how could we fulfill it?

---

## .context

current state:
- FeedbackRepl.tsx exists with basic ink component
- multiline input via shift+enter, alt+enter, ctrl+j supported
- history navigation via arrow keys partially implemented
- tests exist but real terminal behavior differs from test simulation

key tensions:
1. **multiline input** - user wants to write multi-paragraph feedback
2. **history navigation** - user wants to revisit/edit prior feedback entries
3. **multiline paste** - user pastes code snippets or logs as part of feedback
4. **scrollback pollution** - when multiline content shrinks, stale lines remain visible

---

## .subquestions

### 1. what is the ideal multiline input experience?

- how should the user enter newlines? (shift+enter? alt+enter? ctrl+j?)
- should the input area grow dynamically or have fixed height?
- how should we handle very long feedback (50+ lines)?
- should there be a visual indicator of multiline mode?

### 2. what is the ideal history navigation experience?

- when user presses up arrow, what should happen?
  - replace current input with previous entry?
  - show previous entry in a preview?
  - cycle through entries with visual indicator?
- how should multiline history entries display?
  - truncate to single line with "..." indicator?
  - expand to full height?
  - show in scrollable viewport?
- should history be per-severity (blocker history vs nitpick history) or unified?

### 3. what is the ideal paste experience?

- when user pastes multiline content:
  - should it auto-detect and insert all lines?
  - should it preserve original format (indentation, blank lines)?
  - should newlines in paste be treated differently than typed newlines?

### 4. how should viewport/scrollback be managed?

- when input shrinks from 5 lines to 1 line, stale lines remain visible
- options:
  - accept stale lines as tradeoff (simple, no flicker)
  - use console.clear() (clears all, loses context)
  - use fixed-height viewport (like vim/less, contained render)
  - build differential renderer (like claude code - complex)

---

## .reference points

### claude code approach

per research in briefs:
- uses alt+enter for newlines (not shift+enter)
- ctrl+g also works as newline fallback
- rewrote ink renderer from scratch for flicker-free updates
- ~16ms frame budget, ~5ms to convert react to ansi
- uses DEC mode 2026 for synchronized output

### ink limitations

- `useInput` hook receives raw escape sequences
- different terminals send different sequences for same key combo
- shift+enter not universally supported (some terminals send plain `\n`)
- no native scrollback clear capability
- `console.clear()` runs after ink render, causes blank terminal

### terminal escape sequence reality

| action | iTerm | Ghostty | CSI u terminals |
|--------|-------|---------|-----------------|
| shift+enter | `\n` (indistinguishable) | `\x1b[27;2;13~` | `\x1b[13;2u` |
| alt+enter | varies | `\x1b[27;3;13~` | `\x1b[13;3u` |
| ctrl+j | `\n` (0x0a) | `\n` (0x0a) | `\n` (0x0a) |

**ctrl+j is the only reliable cross-terminal newline**

---

## .exploration space

**answered in**: `zoomin.ux.tui-history-multiline.v1.i1.md`

### option A: simple readline-style

- single-line input with history via up/down
- no multiline edit in-place
- multiline content entered via external editor ($EDITOR)
- pros: simple, reliable, no scrollback issues
- cons: breaks "quick feedback in terminal" goal

### option B: vim-style modal

- normal mode for navigation
- insert mode for edit
- multiline via natural enter key (like vim insert mode)
- submit via escape + :w or ctrl+s
- pros: familiar to vim users, clear mode separation
- cons: steep curve, mode confusion

### option C: enhanced readline with ctrl+j

- single-line appearance, multiline via ctrl+j
- history shows first line + "[+N lines]" indicator
- expand on select to show full content
- pros: simple default, progressive disclosure
- cons: ctrl+j unfamiliar, hidden multiline

### option D: fixed viewport editor

- fixed-height viewport (e.g., 10 lines)
- scroll within viewport for long content
- history replaces viewport content
- pros: contained render, no scrollback pollution
- cons: complex implementation, viewport size

### option E: accept limitations pragmatically

- use ctrl+j for newlines (reliable)
- accept scrollback pollution on shrink
- history shows truncated preview
- focus on core use case: quick 1-3 line feedback
- pros: ship fast, iterate later
- cons: imperfect ux for edge cases

---

## .next steps

**completed** - see companion brief for implementation checklist:

- [x] enumerate concrete user journeys
- [x] evaluate options
- [x] choose based on reliability vs ux tradeoff
- [ ] add ctrl+j hint in footer
- [ ] add submit confirmation flash
- [ ] document limitations in --help
- [ ] acceptance test for history navigation with multiline

---

## .related files

- `.behavior/v2026_01_15.give-behavior-tune/3.3.blueprint.v1.i1.md`
- `.agent/repo=.this/role=any/briefs/howto.debug-ink-terminal-input.[lesson].md`
- `.agent/repo=.this/role=any/briefs/howto.handle-multiline-ink-inputs.[lesson].md`
- `src/domain.operations/behavior/feedback/repl/FeedbackRepl.tsx`
- `src/domain.operations/behavior/feedback/repl/useFeedbackState.ts`
