# Design a one-to-one and group chat system
_Company: generic · Mode: breadth · Time: 45 min · Level: senior/staff_

## Setting
You're building the messaging backbone for a consumer chat app: one-to-one conversations, small group chats, delivery/read receipts, and a client that's frequently offline (mobile, spotty connectivity).

## The ask
Design the system that lets a user send a message, delivers it to every recipient's device (online or not), and shows accurate delivery and read state.

## Given constraints
- ~50M daily active users, ~10B messages/day, groups up to 250 members
- End-to-end delivery latency < 1 s p99 when both parties are online
- Messages must never be lost and must arrive in a sane order per conversation, even across reconnects and multiple devices per user
- Offline users must receive every message once they reconnect, without duplicates
- Read receipts and typing indicators are best-effort and may be dropped under load — message delivery may not

## Deliverables
Requirements → estimates → API/data model → high-level diagram (connection layer, message store, fan-out) → 1–2 deep dives → trade-offs. Likely probes: how you fan out a group message, how a client resumes after being offline for days, and where exactly-once vs. at-least-once delivery applies.

## Rules
Think aloud. Draw in the canvas. Ask clarifying questions — I will answer as the interviewer.
