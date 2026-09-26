# Design a video streaming platform
_Company: generic · Mode: breadth · Time: 45 min · Level: senior/staff_

## Setting
You're building the upload-to-playback pipeline for a video platform: creators upload raw video, it needs to become smoothly playable on phones, laptops, and TVs over widely varying network conditions, worldwide.

## The ask
Design the system that ingests an uploaded video, prepares it for playback, and serves it to viewers with minimal buffering regardless of their connection.

## Given constraints
- ~500K uploads/day, average 10 minutes; ~1B playback-hours/month across the globe
- Playback must adapt to the viewer's bandwidth in real time (no manual quality selection required) and start within ~1–2 s of pressing play
- Processing an upload into playable form should complete in well under real time (a 10-minute upload ready in a few minutes, not a few minutes per minute of footage)
- Popular new uploads can spike to millions of views within hours; unpopular long-tail content still needs to be servable on demand years later
- Content must be served from edge locations near the viewer, not from one origin per request

## Deliverables
Requirements → estimates (storage, encoding fan-out, egress) → high-level diagram (ingest/transcode pipeline, storage, CDN delivery, adaptive playback) → 1–2 deep dives → trade-offs. Likely probes: the transcoding pipeline's parallelism, adaptive bitrate mechanics, and cold-start vs. hot-content caching at the edge.

## Rules
Think aloud. Draw in the canvas. Ask clarifying questions — I will answer as the interviewer.
