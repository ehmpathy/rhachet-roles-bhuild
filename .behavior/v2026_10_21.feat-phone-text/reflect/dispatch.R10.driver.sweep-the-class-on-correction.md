## .what

new driver rule `rule.always.sweep-the-class-on-correction`: when the human corrects one instance, grep the whole artifact set for the **class** (synonyms, peer flags, the same shape elsewhere) and fix every instance before you report done.

## .why

`rule.always.fix-forward-under-scouts-honor` covers small fixes you happen to see. it does not make you hunt the class. in one vision pass the human corrected repo → tree, `--add` → `--address`, `phone.get` → `phone.text get`, one at a time. each time the driver fixed the named instance and left the rest. the human had to say: "ok check for other inconsistencies of this nature". the sweep then found more than ten stale instances (box, repo, branch, start/stop, cross-repo) across six files.

## .provenance

`rhachet-roles-bhuild` @ `beav/feat-phone-text`, stone `1.vision`.

## .the forbid pair — ship both

a forbid bites faster than a require: a reviewer greps for a forbidden shape, but must reason to spot an absent one. so ship the twin:

**`rule.forbid.instance-only-corrections`** — a reply of "fixed" to a human correction while the same class still stands elsewhere in the artifact set:

| 👎 forbidden | 👍 instead |
|---|---|
| fix `--add` on one line, leave it in two case files | grep `--add` across `$route/**`, fix all, then report |
| rename repo → tree in the yield, leave `cross-repo` in the inventory | sweep the synonym set (repo, branch, box) in one pass |

## .enforcement (proposed)

- a human correction answered at the instance only, with the class left in the artifact = blocker
