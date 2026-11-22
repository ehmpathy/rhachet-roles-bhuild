#!/usr/bin/env bash
######################################################################
# .what = the jq render defs the token verbs share
#
# .a LIB: sourced, never executed. the verbs that source it are
#         `rhx git.crew.tokens` and `rhx git.grove.capacity`
#
# .why  = `git.crew.tokens` (read, calibrate) and `git.grove.capacity`
#         render one quantity — weighted tokens — and each kept its own
#         copy of the formatter. the capacity copy drifted: it rendered a
#         sub-1K rate as `0K`. one def, sourced, cannot drift
#
# usage:
#   source "$SKILL_DIR/work/tokenwork.sh"
#   jq -r "$TOKENWORK_JQ_DEFS"' "\(mtok(.x)) · \(many(.n; "crew"))"'
#
# .also = the cost weight, TOKENWORK_JQ_WEIGHT — the one statement of the
#         api price ratios. it was restated at five sites in three dialects,
#         and a ratio changed at one would leave the rest to weigh a
#         different quantity. a grove probe embeds it via tokenwork_payload_lib
#
# guarantee:
#   - defines variables and one printer; runs no command on source
#   - mtok($x): ≥1M → "1.2M", ≥1K → "966K", else the whole number; null → "0";
#     each rounded to nearest, so rows add up to their sum
#   - many($n; $w): "1 crew", "3 crews"
#   - grovelabel($n): "grove local", but a name that opens with "grove" stands alone
#   - usagefields: an api `usage` block → {input, write5m, write1h, read, output}
#   - weighted: those fields → input 1 · cache write 5m 1.25 · cache write 1h 2
#     · cache read 0.1 · output 5 (an estimate, from api price ratios; F3)
######################################################################

# shellcheck disable=SC2034 # read by the verbs that source this lib
TOKENWORK_JQ_DEFS='
  # .note = round to nearest, never floor: a floor drops a different slice from each row than from
  #         their sum, so the crew rows would read short of the fleet line they add up to
  def mtok($x): if ($x // 0) >= 999500 then "\(($x // 0) / 1000000 * 10 | round / 10)M" elif ($x // 0) >= 999.5 then "\(($x // 0) / 1000 | round)K" else "\(($x // 0) | round)" end;
  def many($n; $w): "\($n) \($w)\(if $n == 1 then "" else "s" end)";
  # .note = a registry name often opens with "grove" itself; the label word is dropped there, so a
  #         row never reads `grove grove-sandpine-…`
  def grovelabel($n): if ($n | startswith("grove")) then $n else "grove \($n)" end;
'

# shellcheck disable=SC2034
TOKENWORK_JQ_WEIGHT='
  def usagefields: {
      input: (.input_tokens // 0),
      write1h: (.cache_creation.ephemeral_1h_input_tokens // 0),
      write5m: ((.cache_creation_input_tokens // 0) - (.cache_creation.ephemeral_1h_input_tokens // 0)),
      read: (.cache_read_input_tokens // 0),
      output: (.output_tokens // 0) };
  def weighted: (.input + 1.25 * .write5m + 2 * .write1h + 0.1 * .read + 5 * .output);
'

######################################################################
# the forest — every grove's probe row folded into one record
#
# .what = TOKENWORK_JQ_FOREST, named defs over the grove rows ($groves):
#   forest_crews($groves)        every crew any grove read, tagged with its grove
#   forest_read($groves)         did any grove answer?
#   forest_partial($groves)      is the burn a lower bound (an unreached grove, or an unread transcript)?
#   fleet_burn($crews; $read; $hours)
#                                the fleet's weighted burn and its rate; null where no grove read
#   kind_burn($crews; $hours)    per crew kind: the crews, the burn, the burn per crew-hour
#   forest_record($since; $until; $spanMin)
#                                the record the render, --json, and calibrate all read
#
# .note = where no grove read, the burn is unknown (null), never 0: a 0 reads as an idle fleet
######################################################################
# shellcheck disable=SC2034
TOKENWORK_JQ_FOREST='
  def forest_crews($groves): [ $groves[] | select(.record) | .grove as $g | .record.crews[] | . + {grove: $g} ];
  def forest_read($groves): ([$groves[] | select(.state == "read")] | length > 0);
  def forest_unread($groves): [ $groves[] | select(.record) | .grove as $g | .record.unread[] | "\($g):\(.)" ];
  def forest_unreached($groves): [ $groves[] | select(.state != "read") | .grove ];
  def forest_partial($groves): ((forest_unreached($groves) | length) > 0 or (forest_unread($groves) | length) > 0);
  def fleet_burn($crews; $read; $hours):
    ([$crews[].weighted] | add // 0) as $w
    | { weighted: (if $read then $w else null end),
        weighted_per_hour: (if $read then ($w / $hours | round) else null end) };
  def kind_burn($crews; $hours):
    ["behavior", "directive", "other"] | map(. as $k
      | [$crews[] | select(.kind == $k)] as $cs
      | { ($k): { crews: ($cs | length),
                  weighted: ([$cs[].weighted] | add // 0),
                  weighted_per_crew_hour: (if ($cs | length) == 0 then null
                    else (([$cs[].weighted] | add) / ($cs | length) / $hours | round) end) } })
    | add;
  def forest_record($since; $until; $spanMin):
    . as $groves
    | ($spanMin / 60) as $hours
    | forest_crews($groves) as $crews
    | forest_read($groves) as $read
    | { since: $since, until: $until, span_min: $spanMin,
        groves: $groves, read: $read,
        partial: forest_partial($groves),
        unread: forest_unread($groves),
        unreached: forest_unreached($groves),
        fleet: (fleet_burn($crews; $read; $hours) + { by_kind: kind_burn($crews; $hours) }) };
'

# .what = the weight as source text, for a grove probe to embed
tokenwork_payload_lib() {
  declare -p TOKENWORK_JQ_WEIGHT
}
