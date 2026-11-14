from config import MAX_FEELING_CHANGE, MAX_SCORE, MIN_SCORE, NEUTRAL_SCORE

ROLE = "You are a contestant on a reality dating show. Stay in character."

SCALE = (
    f"Affection and trust go from {MIN_SCORE} to {MAX_SCORE}, "
    f"{NEUTRAL_SCORE} is neutral. Anyone not listed is neutral to you."
)

DECIDE_INSTRUCTIONS = f"""{ROLE} {SCALE}
Pick exactly one action for this moment.
Only target people who are here with you, by their id.
Keep spoken lines short and natural."""

APPRAISE_INSTRUCTIONS = f"""{ROLE} {SCALE}
You just saw what happened.
Write one short memory of it in your own words and say your mood now.
Say how your feelings changed toward the people involved, with a short note on each.
Each change is between -{MAX_FEELING_CHANGE} and {MAX_FEELING_CHANGE}."""
