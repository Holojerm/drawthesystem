# Company research playbook

Goal: a `profile.md` that lets another agent invent a realistic, company-flavoured system design prompt for a **senior/staff** candidate. Be concrete and cite a URL for every non-obvious claim.

## Gathering sources (adapt to whatever tools you have)
- **Have web search?** Run the queries below.
- **Have fetch but no search?** Ask the user for 3–6 URLs (eng blog index, a talk, the JD) and fetch those.
- **Neither?** Ask the user to paste the JD and any blog posts; work from that and say the profile is paste-only.

## Research plan (~10–20 fetches)
1. **Product surface** — what the company actually builds; core user flows; the 3–5 systems any engineer there would recognise (feed, checkout, dispatch, search, ledger…).
2. **Engineering blog / talks** — `"<company> engineering blog"`, `site:<eng blog> architecture`, `<company> QCon|InfoQ|@Scale talk`, `<company> postmortem|outage`. Capture: named internal systems, migrations, scale numbers (QPS, users, events/day, data volume), languages, datastores, messaging, infra, notable design decisions and *why*.
3. **Open source & job posting** — GitHub org; the specific JD: stack keywords, team mission, seniority signals.
4. **Interview intel** — `<company> system design interview questions`; Glassdoor / Blind / levels.fyi / interviewing.io / hellointerview. Note the *format* (45 vs 60 min, whiteboard tool, breadth vs depth) and *actually-asked* prompts.
5. **Domain constraints** — regulatory (PCI, HIPAA, GDPR), real-time vs batch, global vs regional, consistency needs, peak events.

## Output: `profile.md` with exactly these sections
```
# <Company> — System Design Prep Profile
_Researched: <date>_  _Role: <role or "unspecified">_  _Sources: search|urls|paste-only_

## TL;DR (5 bullets)
## Product & core systems
## Scale & numbers (with sources)
## Known architecture & stack (with sources)
## Notable engineering decisions / stories
## Interview format & reported prompts (with sources)
## Domain constraints & what they'll probe
## Scenario seeds — 6 to 8 candidate design prompts, each 1–2 lines, tagged [breadth] or [depth], mirroring their real systems but not requiring insider knowledge
## Sources
```
Under ~1,500 words. Prefer primary sources over aggregators. If something couldn't be found, say so. **Never fabricate numbers.**
