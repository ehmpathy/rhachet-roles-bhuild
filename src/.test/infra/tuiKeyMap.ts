/**
 * .what = custom keyboard map for TUI tests
 *
 * .why = cli-test-library's default keyMap lacks:
 *        - modifier key combinations (shift+enter, ctrl+j, etc.)
 *        - terminal-specific escape sequences
 *        this extends the default map with keys needed for FeedbackRepl tests
 *
 * .ref = see briefs/howto.handle-multiline-ink-inputs.[lesson].md
 */

import type { keyboardKey } from 'cli-testing-library';

/**
 * custom keys for FeedbackRepl TUI tests
 *
 * escape sequence reference:
 * - CSI u format: \x1b[{keycode};{modifier}u
 *   modifiers: 2=shift, 3=alt, 5=ctrl, 6=ctrl+shift, 4=alt+shift
 * - modifyOtherKeys format: \x1b[27;{modifier};{keycode}~
 */
export const tuiKeyMap: Array<keyboardKey> = [
  // ─────────────────────────────────────────────────────────────────
  // alphanumeric keys (from default)
  // ─────────────────────────────────────────────────────────────────
  { code: 'Digit0', hex: '\x30' },
  { code: 'Digit1', hex: '\x31' },
  { code: 'Digit2', hex: '\x32' },
  { code: 'Digit3', hex: '\x33' },
  { code: 'Digit4', hex: '\x34' },
  { code: 'Digit5', hex: '\x35' },
  { code: 'Digit6', hex: '\x36' },
  { code: 'Digit7', hex: '\x37' },
  { code: 'Digit8', hex: '\x38' },
  { code: 'Digit9', hex: '\x39' },
  { code: 'KeyA', hex: '\x41' },
  { code: 'KeyB', hex: '\x42' },
  { code: 'KeyC', hex: '\x43' },
  { code: 'KeyD', hex: '\x44' },
  { code: 'KeyE', hex: '\x45' },
  { code: 'KeyF', hex: '\x46' },
  { code: 'KeyG', hex: '\x47' },
  { code: 'KeyH', hex: '\x48' },
  { code: 'KeyI', hex: '\x49' },
  { code: 'KeyJ', hex: '\x4a' },
  { code: 'KeyK', hex: '\x4b' },
  { code: 'KeyL', hex: '\x4c' },
  { code: 'KeyM', hex: '\x4d' },
  { code: 'KeyN', hex: '\x4e' },
  { code: 'KeyO', hex: '\x4f' },
  { code: 'KeyP', hex: '\x50' },
  { code: 'KeyQ', hex: '\x51' },
  { code: 'KeyR', hex: '\x52' },
  { code: 'KeyS', hex: '\x53' },
  { code: 'KeyT', hex: '\x54' },
  { code: 'KeyU', hex: '\x55' },
  { code: 'KeyV', hex: '\x56' },
  { code: 'KeyW', hex: '\x57' },
  { code: 'KeyX', hex: '\x58' },
  { code: 'KeyY', hex: '\x59' },
  { code: 'KeyZ', hex: '\x5a' },
  { code: 'KeyLowerA', hex: '\x61' },
  { code: 'KeyLowerB', hex: '\x62' },
  { code: 'KeyLowerC', hex: '\x63' },
  { code: 'KeyLowerD', hex: '\x64' },
  { code: 'KeyLowerE', hex: '\x65' },
  { code: 'KeyLowerF', hex: '\x66' },
  { code: 'KeyLowerG', hex: '\x67' },
  { code: 'KeyLowerH', hex: '\x68' },
  { code: 'KeyLowerI', hex: '\x69' },
  { code: 'KeyLowerJ', hex: '\x6a' },
  { code: 'KeyLowerK', hex: '\x6b' },
  { code: 'KeyLowerL', hex: '\x6c' },
  { code: 'KeyLowerM', hex: '\x6d' },
  { code: 'KeyLowerN', hex: '\x6e' },
  { code: 'KeyLowerO', hex: '\x6f' },
  { code: 'KeyLowerP', hex: '\x70' },
  { code: 'KeyLowerQ', hex: '\x71' },
  { code: 'KeyLowerR', hex: '\x72' },
  { code: 'KeyLowerS', hex: '\x73' },
  { code: 'KeyLowerT', hex: '\x74' },
  { code: 'KeyLowerU', hex: '\x75' },
  { code: 'KeyLowerV', hex: '\x76' },
  { code: 'KeyLowerW', hex: '\x77' },
  { code: 'KeyLowerX', hex: '\x78' },
  { code: 'KeyLowerY', hex: '\x79' },
  { code: 'KeyLowerZ', hex: '\x7a' },

  // ─────────────────────────────────────────────────────────────────
  // standard keys (from default)
  // ─────────────────────────────────────────────────────────────────
  { code: 'Space', hex: '\x20' },
  { code: 'Backspace', hex: '\x08' },
  { code: 'Enter', hex: '\x0D' },
  { code: 'Escape', hex: '\x1b' },
  { code: 'Tab', hex: '\x09' },

  // ─────────────────────────────────────────────────────────────────
  // arrows (from default)
  // ─────────────────────────────────────────────────────────────────
  { code: 'ArrowUp', hex: '\x1b\x5b\x41' },
  { code: 'ArrowDown', hex: '\x1B\x5B\x42' },
  { code: 'ArrowLeft', hex: '\x1b\x5b\x44' },
  { code: 'ArrowRight', hex: '\x1b\x5b\x43' },

  // ─────────────────────────────────────────────────────────────────
  // control pad (from default)
  // ─────────────────────────────────────────────────────────────────
  { code: 'Home', hex: '\x1b\x4f\x48' },
  { code: 'End', hex: '\x1b\x4f\x46' },
  { code: 'Delete', hex: '\x1b\x5b\x33\x7e' },
  { code: 'PageUp', hex: '\x1b\x5b\x35\x7e' },
  { code: 'PageDown', hex: '\x1b\x5b\x36\x7e' },

  // ─────────────────────────────────────────────────────────────────
  // CUSTOM: modifier key combinations for TUI tests
  // ─────────────────────────────────────────────────────────────────

  // shift+tab (back-tab) - toggles severity in FeedbackRepl
  { code: 'ShiftTab', hex: '\x1b[Z' },

  // ctrl+c - clear input or exit
  { code: 'CtrlC', hex: '\x03' },

  // ctrl+z - undo
  { code: 'CtrlZ', hex: '\x1a' },

  // ctrl+y - redo
  { code: 'CtrlY', hex: '\x19' },

  // ctrl+s - save in place
  { code: 'CtrlS', hex: '\x13' },

  // ctrl+j - newline (traditional unix linefeed)
  { code: 'CtrlJ', hex: '\x0a' },

  // ─────────────────────────────────────────────────────────────────
  // CUSTOM: CSI u format modifier+enter (modern terminals)
  // format: \x1b[13;{modifier}u where 13 = enter keycode
  // ─────────────────────────────────────────────────────────────────

  // shift+enter (CSI u)
  { code: 'ShiftEnterCsiU', hex: '\x1b[13;2u' },

  // alt+enter (CSI u)
  { code: 'AltEnterCsiU', hex: '\x1b[13;3u' },

  // ctrl+enter (CSI u)
  { code: 'CtrlEnterCsiU', hex: '\x1b[13;5u' },

  // ctrl+shift+enter (CSI u)
  { code: 'CtrlShiftEnterCsiU', hex: '\x1b[13;6u' },

  // alt+shift+enter (CSI u)
  { code: 'AltShiftEnterCsiU', hex: '\x1b[13;4u' },

  // ─────────────────────────────────────────────────────────────────
  // CUSTOM: modifyOtherKeys format (xterm/ghostty)
  // format: \x1b[27;{modifier};13~ where 13 = enter
  // ─────────────────────────────────────────────────────────────────

  // shift+enter (modifyOtherKeys)
  { code: 'ShiftEnterMok', hex: '\x1b[27;2;13~' },

  // alt+enter (modifyOtherKeys)
  { code: 'AltEnterMok', hex: '\x1b[27;3;13~' },

  // ctrl+enter (modifyOtherKeys)
  { code: 'CtrlEnterMok', hex: '\x1b[27;5;13~' },
];
