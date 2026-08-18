---
name: research
description: Deep-research a target company (eng blog, talks, scale, stack, interview format) into companies/<slug>/profile.md to ground later scenarios. Use when the user names a company they're interviewing with. Usage — /research <company> [job posting URL]
license: MIT
---

# /research <company> [job-url]

Build or refresh a company profile.

1. `slug` = lowercase-hyphenated company name (`stripe`, `doordash`). Target: `companies/<slug>/profile.md`.
2. If the profile exists and is < 30 days old, show its TL;DR and ask refresh vs. reuse.
3. Follow [references/researcher.md](references/researcher.md) end to end. If your agent supports spawning a subagent, delegate the playbook to one (it's ~10–20 fetches); otherwise do it inline.
4. Sanity check the result: all sections present, ≥ 6 scenario seeds, cited sources (or an explicit `paste-only` note). Fill gaps if thin.
5. Print the TL;DR and the numbered scenario seeds, then suggest `/scenario <slug> <seed#>`.

Rules: no invented facts; a stealth startup with nothing public gets a domain-based profile that says so.
