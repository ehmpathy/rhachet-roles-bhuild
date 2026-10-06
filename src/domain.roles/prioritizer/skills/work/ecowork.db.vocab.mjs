/////////////////////////////////////////////////////////////////////
// .what = the vocabularies a row is written in — opine and quant scales, cash, time, asks
//
// .why  = every layer above validates against these, so they sit at the bottom and
//         import naught of their own. `ConstraintError` lives here for the same
//         reason: every layer throws it, and `main` tests for it by identity
//
// .note = a PART of `ecowork.db.mjs`, cut so one reviewer can hold it
//         whole. only the entry opens the store — this module takes an
//         open `db` handle and never opens one ([case56])
/////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////
// the OPINE vocabularies — what a human claims
/////////////////////////////////////////////////////////////////////

// ✅ the sev scale is FIBONACCI — 0, 1, 2, 3, 5. settled by the wisher
//    2026-09-13, and it is why `p4` is absent: 4 is not in the sequence.
//    ⇒ do NOT "repair" the gap. a reader who sees p0 p1 p2 p3 p5, infers
//      a typo, and adds p4 destroys the property the scale is FOR.
//
//    .why a scale whose gaps widen = the same reason agile points use
//    one. precision is real at the sharp end and imaginary at the dull
//    one: p0 vs p1 ("drop it all" vs "today") is a distinction a human
//    can defend, while p3 vs a would-be p4 is a distinction nobody can.
//    the gaps grow because our capacity to tell items apart shrinks.
export const SEV_ALLOWED = ['p0', 'p1', 'p2', 'p3', 'p5'];

// 🔥 `1h` is the SHARP end of the urg ladder, and it means hotfix — drop it
//    all, right now, prod bleeds while you read this.
//
// 🔴 .why the ladder grew a rung DOWNWARD rather than upward
//    the widened-gap argument above cuts both ways: precision is real at
//    the sharp end and imaginary at the dull one. so the ladder was right
//    to stop at `1m` and wrong to stop at `1d` — with `1d` as its tightest
//    rung, a live prod crash loop and a day's work graded identically, and
//    the store had no way to say which one a human meant.
//
//    measured 2026-09-20: a human graded a prod `Runtime.ExitError` loop
//    `1h` and the store refused the word. the refusal was correct against
//    the ladder as declared, and the ladder was short.
//
// ⚠️ a row at `1h` that is not yet done renders 🔥 — see ecowork.sh. the
//    glyph is DERIVED from urg + status and is never stored: a `hotfix`
//    column would be a second name for a fact the opine already carries,
//    and a second name drifts (rule.forbid.domain-term-synonyms).
export const URG_ALLOWED = ['1h', '1d', '3d', '1w', '1m'];

// urg to days, so a sort can order two urgencies that sort wrong as text
// ('1d' < '1m' < '1w' alphabetically, which is meaningless)
//
// ⚠️ 1h is a FRACTION of a day, so it is stored as one — the sort runs
//    low-to-high on this number, and an integer floor would tie it with 1d
//    and let a hotfix sort below a day's work
export const URG_DAYS = { '1h': 0.125, '1d': 1, '3d': 3, '1w': 7, '1m': 30 };

/////////////////////////////////////////////////////////////////////
// the QUANT vocabularies — what the store or the human MEASURES
/////////////////////////////////////////////////////////////////////

// .what = the fibonacci ladder a re-encounter count climbs
//
// .why  = FREQUENCY is a quant, and the only one no human types. sev
//         and urg are a claim; `asks` is a fact the store counts. so it
//         is the most trustworthy field here, and it earns the same
//         refusal of false precision as sev: 4 asks and 5 asks are not
//         tellable apart, so the ladder skips 4 as the sev scale does.
//
// 🔴 .why `asks` and NOT `hits` = the store counts a human who REACHED
//         for this priority. it does not count an occurrence of the
//         defect itself — no instrument here watches for one. `hits`
//         names the second and measures the first, which is a claim the
//         data cannot support. `asks` says what the number is: how many
//         times a human asked for this to be ranked.
//
//         ⇒ the term is boundary-qualified as `eco.ask`, because `ask`
//           is already declared at the DUCT layer (a message that hands
//           a clone the work of an answer). two boundaries, two terms,
//           no overload — term=eco.ask._.choice._.md
//
//         a crossed rung is a PROMPT, never an auto-write — see
//         getAskRung. the human's --urg always stands.
export const ASK_RUNGS = [1, 2, 3, 5, 8, 13];

// .what = how often a cash gain — or a cash cost — repeats
//
// .why  = a rate and a one-time sum are not comparable, and the case
//         that motivated this store is a rate: "$150/mo" for an
//         over-ramped ACU floor. to store 150 with no period is to
//         store a number whose unit lives in a human's head
//         (rule.forbid.magic-values).
//
//         both sides take a period, because the asymmetry is real: a
//         one-time build cost that unlocks a repeat gain is the common
//         shape, and a cost that repeats (a new vendor line) is a shape
//         a symmetric pair must be able to hold
//         (rule.prefer.symmetric-term-pairs)
export const PER_DAYS = { '1d': 1, '1w': 7, '1mo': 30, '1y': 365 };
export const PER_ALLOWED = ['once', ...Object.keys(PER_DAYS)];

// 🔴 .what = the DURATION — how long a cash figure actually runs
//
// .why  = a period alone cannot be totalled. `USD 150.00` per `1mo` is
//         worth USD 450.00 if the fix holds for three months and
//         USD 9000.00 if it holds for five years, and no figure derived
//         from the rate alone can tell those apart.
//
//         🔴 the earlier design annualized to a fixed FIRST-YEAR window,
//         which made an `USD 1800.00` one-time and an `USD 150.00`
//         per-1mo tie exactly — and the second is worth that much again
//         every year after. a one-year horizon is an invented number
//         under a neutral name.
//
//         ⇒ so the human states the duration. a gain that lasts 3mo is
//           totalled over 3mo; one that lasts 5y over 5y. no discount
//           rate is invented, because none is needed: the quantity that
//           was absent was never a rate, it was a LENGTH.
//
// 🔴 .why EACH SIDE owns its own duration, and not the priority
//         gain and cost run for different lengths, and that difference is
//         often the whole verdict. a USD 40.00/1mo vendor line that runs
//         5y against a gain that lasts 3mo is a NET LOSS, and one shared
//         window cannot say so — it would force both onto 5y (which
//         invents 57 months of gain nobody gets) or onto 3mo (which
//         forgives 57 months of spend somebody pays).
//
//         ⇒ and no shared window is OWED, because the net subtracts
//           TOTALS rather than rates. each side is totalled over its own
//           life first; the subtraction then holds whole sums, which are
//           comparable no matter how long each took to accrue.
export const DUR_UNIT_DAYS = { d: 1, w: 7, mo: 30, y: 365 };
export const DUR_RE = /^\d+(d|w|mo|y)$/;
export const DUR_DEFAULT = '1y';

/** .what = '3mo' -> 90 · '5y' -> 1825 */
export const asDurDays = (words) => {
  const unit = words.match(/(d|w|mo|y)$/)[0];
  return Number(words.slice(0, -unit.length)) * DUR_UNIT_DAYS[unit];
};

/**
 * .what = how many times a period fits inside a duration
 * .why  = the floor is deliberate. a gain that lasts 40 days at a
 *         monthly rate has banked ONE month, not 1.33 — the second month
 *         has not elapsed, so to count it would book money nobody got
 */
export const getRepeats = (per, durDays) =>
  per === 'once' ? 1 : Math.floor(durDays / PER_DAYS[per]);

// cash rides as iso-price WORDS ('USD 150.00'), per rule.require.iso-price.
// the package is not installed here, so this validates the canonical form
// and does its arithmetic in integer cents — never a float
// (rule.forbid.any-price: 0.1 + 0.2 reaches a real invoice as 0.30000000000000004)
export const CASH_RE = /^[A-Z]{3} -?\d+(\.\d{1,2})?$/;

// time rides as hours or days of work. 1d = 8h, declared here rather
// than assumed by a reader
export const HOURS_PER_DAY = 8;

// 🔴 .what = the fibonacci ladder a work estimate stands on
//
// .why  = the same argument `sev`, `urg`, and `asks` already make, applied
//         to the one field that invites false precision hardest. nobody
//         can tell a 4h task from a 5h task before they start it, so a
//         scale that offers both asks for a discrimination no human can
//         make — and then carries the answer into `cashPerHour`, where it
//         reads as a measurement.
//
//         ⇒ the gaps widen because the uncertainty widens. 1h vs 2h is a
//           real distinction; 34h vs 55h is a shrug either way, and the
//           ladder says so by refusal of everything between.
//
// .why the NUMBER is the rung, and the UNIT is free
//         `3h` and `3d` are both on the ladder. the alternative — one
//         ladder in hours — spells a two-week estimate `89h`, which no
//         human writes and every human must divide to read.
//
// ⚠️ .the one overlap, stated rather than hidden
//         `8h` and `1d` are the same duration in two spellings. both are
//         accepted and neither is rewritten, because the arithmetic runs
//         on hours and the render shows them (`1d (8h)`). a human who
//         writes `1d` meant a day; to recast it as `8h` would correct a
//         spelling that was never wrong.
export const TIME_RUNGS = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
export const TIME_RE = /^(\d+)([hd])$/;

/** .what = is this a rung on the ladder, rather than merely well-shaped? */
export const isTimeRung = (words) => {
  const held = TIME_RE.exec(words ?? '');
  if (!held) return false;
  return TIME_RUNGS.includes(Number(held[1]));
};

/** .what = the ladder, as a human reads it in an error */
export const TIME_LADDER = `${TIME_RUNGS.map((n) => `${n}h`).join(' ')} · ${TIME_RUNGS.map(
  (n) => `${n}d`,
).join(' ')}`;

/** .what = a constraint the caller must repair; exit 2 */
export class ConstraintError extends Error {}

/////////////////////////////////////////////////////////////////////
// cash — integer cents, never a float
/////////////////////////////////////////////////////////////////////

/** .what = 'USD 150.00' -> { currency: 'USD', cents: 15000n } */
export const asCashCents = (words) => {
  const [currency, amount] = words.split(' ');
  const negative = amount.startsWith('-');
  const [whole, frac = ''] = amount.replace('-', '').split('.');
  const cents = BigInt(whole) * 100n + BigInt(`${frac}00`.slice(0, 2));
  return { currency, cents: negative ? -cents : cents };
};

/** .what = { currency: 'USD', cents: 180000n } -> 'USD 1800.00' */
export const asCashWords = ({ currency, cents }) => {
  const negative = cents < 0n;
  const magnitude = negative ? -cents : cents;
  const whole = magnitude / 100n;
  const frac = String(magnitude % 100n).padStart(2, '0');
  return `${currency} ${negative ? '-' : ''}${whole}.${frac}`;
};

/** .what = '4h' | '2d' -> 4 | 16 */
export const asCostHours = (words) =>
  words.endsWith('d')
    ? Number(words.slice(0, -1)) * HOURS_PER_DAY
    : Number(words.slice(0, -1));

/////////////////////////////////////////////////////////////////////
// the ask ladder
/////////////////////////////////////////////////////////////////////

/**
 * .what = the highest fibonacci rung an ask count has reached
 * .why  = a raw count invites false precision ("it is at 7!"). the rung
 *         is the honest unit: 7 and 8 say the same about a priority,
 *         and 1 and 13 do not.
 */
export const getAskRung = (asks) => ASK_RUNGS.filter((rung) => asks >= rung).pop() ?? 0;

/**
 * .what = has this ask landed EXACTLY on a rung?
 * .why  = the prompt must fire once per rung, never on every set past it.
 *         a nag that repeats is a nag a human learns to ignore.
 */
export const isAskRung = (asks) => ASK_RUNGS.includes(asks);

/** .what = the sentinel that CLEARS a field, since an omission preserves */
export const CLEAR = 'none';
