# Design a social news feed
_Company: generic · Mode: breadth · Time: 45 min · Level: senior/staff_

## Setting
You're on the feed team at a social network where users follow other users and pages, and expect a fast, roughly-reverse-chronological (or ranked) feed of posts from everyone they follow.

## The ask
Design the system that lets a user create a post and lets every follower load a personalized feed of recent posts from the people and pages they follow.

## Given constraints
- ~200M daily active users; average user follows ~300 accounts; a celebrity account has 50M+ followers
- Feed load must return in < 200 ms p99 for a user opening the app cold
- New posts should appear in followers' feeds within seconds
- The celebrity/hot-account case (fan-out to 50M followers on every post) must not be handled the same way as a normal user's post
- Feed ranking may consider recency, engagement, and affinity — you choose how deep to go, but the read path must stay fast either way

## Deliverables
Requirements → estimates (fan-out volume, storage) → API/data model → high-level diagram (fan-out-on-write vs. fan-out-on-read, and where each applies) → 1–2 deep dives → trade-offs. Likely probes: the celebrity-account hot path, feed storage/caching, and how ranking changes the architecture if you go there.

## Rules
Think aloud. Draw in the canvas. Ask clarifying questions — I will answer as the interviewer.
