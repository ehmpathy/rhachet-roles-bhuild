# F15 · three of the wish's levers stay unmeasured; none gets a guessed gain

## .the fork

the wish asks for each lever's "measured or estimated gain in crews". the catalog
(`git.grove.capacity.levers.jsonc`) lists every candidate the wish names. four had no read of
their cost: fewer hook forks, cheaper crew transport, a status line from a file, a fork cap per seat.

- **(a)** read the cost where a signal exists, and list the rest as unmeasured with what their
  first read would be
- **(b)** give every row an estimated gain now, from judgment

## .taken, and why

(a). the hook lever now has a read: `grove.census` sums each hook run's wall time from the
transcripts (`attachment.durationMs`), and prints it as an upper bound on the cores the hooks spend.
the other three have no signal in a transcript:

- **transport** — the supervisor's tmux/ssh/kitty processes are not seats; their cpu sits in the
  census's `outside_crews` row, which does not split by verb
- **status line** — a per-render command outside the transcripts; its runs leave no record
- **fork cap** — the share a cap removes depends on a cap value no one has chosen yet; one read
  put one crew's forks at 10M of a 41.2M/h fleet hour, which says forks are lumpy, not what a cap cuts

a gain from judgment would rank on taste, which `rule.always.re-measure-a-lever-before-you-rank-it`
forbids; the catalog states what each first read would be.

## .rework

clean. each row's `tier`, `reads`, and `cut` change in the catalog; no code changes.

## .confidence, and why it is low

65%. the transport row may be the largest cpu lever of all (the saturator catalog puts tmux + zsh +
systemd near 89% of the cpu flow), and it ships with no number. a reader may take "unmeasured" as
"small".

## .where

`git.grove.capacity.levers.jsonc`; `grove.census.sh` (the hook read).

## .verdict

open.
