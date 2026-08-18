---
name: research
description: Deep-research a target company (eng blog, talks, scale, stack, interview format) into companies/<slug>/profile.md. Usage — /research <company> [job posting URL]
---

# /research <company> [job-url]

Build or refresh a company profile that grounds later scenarios.

## Steps
1. Derive `slug` = lowercase, hyphenated company name (e.g. `stripe`, `doordash`). Path: `companies/<slug>/profile.md`.
2. If the profile already exists and is < 30 days old, show its TL;DR and ask whether to refresh or reuse. Otherwise continue.
3. Spawn the `company-researcher` subagent with: company name, job URL (if given), and the absolute output path. Wait for it.
4. Read the resulting `profile.md`. Sanity check: it has all required sections, ≥ 6 scenario seeds, and cited sources. If thin, re-run the agent with the specific gaps.
5. Print the TL;DR and the scenario seeds list, numbered, and tell the user they can now run `/scenario <slug> [seed number | free text]`.

## Notes
- Do not invent facts. If research finds little (stealth startup), say so and lean on the domain instead.
- Save any raw notes the agent produced alongside as `companies/<slug>/notes/`.
