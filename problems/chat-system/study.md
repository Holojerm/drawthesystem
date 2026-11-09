# Study notes: chat system

## Key trade-offs
- **Push over a live connection or pull from a log.** A persistent connection gives sub-second delivery to online users, but it is a delivery hint and not a record. A durable per-conversation log that clients read from a cursor gives correctness after disconnects. Most designs use both, and the argument is about which one is authoritative when they disagree.
- **Fan-out on write or on read for groups.** Writing one copy of a message per recipient makes reads trivial and per-user state simple, but costs 250 writes for a large group message. Storing one copy per conversation and tracking a cursor per member is cheap to write and slightly more work to read. Group size and how often members are online push the choice.
- **Where ordering comes from.** A per-conversation sequence number assigned by one owner of that conversation gives a clean total order, but concentrates writes for a busy group and needs failover. Client timestamps are easy and wrong whenever clocks drift or a user has several devices. Order is needed per conversation, not globally, which keeps the sequencer small.
- **Delivery guarantee and duplicates.** At-least-once delivery with a client-generated message id and server dedup is the practical default. Exactly-once over a flaky mobile link is not achievable end to end, so say where the dedup lives and how long its window is.
- **Strong or best-effort metadata.** Delivery and read receipts, typing indicators and presence are high volume and low value per event. Dropping them under load is acceptable by the problem statement. Messages are not, so they should not share a queue or a failure domain with the lossy traffic.

## Common mistakes
- **Using the socket as the only copy of a message.** If the connection drops after the client sends but before the server persists, the message is gone and the sender may not know. Persist and acknowledge before treating a message as sent.
- **No per-recipient acknowledgement state.** Without a record of what each device has received, you cannot resume after offline periods or avoid redelivering everything on reconnect.
- **Ordering by wall-clock time.** Two devices and two servers disagree by hundreds of milliseconds, so replies can appear before the message they answer.
- **Treating multiple devices as an afterthought.** Read state, delivery and history all have to be per device or per user in a way that stays consistent. Bolting it on later usually means a data model rewrite.
- **Sending group messages from the request path to every member.** One slow or dead connection then delays the sender's acknowledgement and everyone else's delivery. Hand the fan-out to a queue.
