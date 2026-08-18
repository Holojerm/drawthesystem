---
name: progress
description: Summarise practice history from progress.md and session feedback — trends per rubric dimension, recurring gaps, and what to drill next. Usage — /progress
license: MIT
---

# /progress

1. Read `progress.md` and every `sessions/*/feedback.md`.
2. Report:
   - Sessions completed, by company and mode; overall score trend (list, oldest → newest).
   - Per-dimension average and trend (↑ ↓ →) for the 10 rubric dimensions.
   - Recurring gaps: phrases/failure modes that appear in ≥ 2 feedbacks.
   - Cruxes missed vs. found.
   - Companies researched but not yet practised.
3. Recommend the next session: company + seed + mode, targeting the weakest dimension, and one 10-minute standalone drill (e.g. "estimate storage for 1B 280-char posts w/ 5 yr retention, out loud, in 3 min").
4. Keep it under ~40 lines. No fluff.
