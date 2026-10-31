# F9 — may an update edit an issue outside the radio frame?

- **the fork**: (a) keep the refusal — the radio edits only radio issues — and make its output name the rule and the fix · (b) edit it, only the fields the push names, verbatim, no radio frame · (c) edit it into the radio frame
- **taken**: (a). the measured case, #599, carries the radio title (`gh issue view 599`), so the extant edit path serves it once its auth is right. #603's acceptance turns on permission ("an issue the integration may not edit"), not on format. (b) adds a dao branch and a hazard — a radio write over a human's words — for a need no case has shown. (c) is worse on the same count
- **rework**: clean — (b) is a branch in `daoRadioTaskViaGhIssues` on the title prefix, plus a verbatim compose; no caller hardens against (a)
- **confidence**: 55%. #603 says "edit an issue it did not open"; if "it" means the radio frame rather than the robot author, the wisher wants (b)
- **where**: `daoRadioTaskViaGhIssues.ts:110-116` (the refusal), `:310` (the radio-frame recompose)
- **verdict**: —
