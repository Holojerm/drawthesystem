# Design a payment ledger
_Company: generic · Mode: depth · Time: 45 min · Level: senior/staff_

## Setting
You're building the internal ledger behind a payments product: money moves between a customer's balance, a merchant's balance, and the platform's own fee account on every transaction, and every one of those movements has to be auditable and exactly correct — no exceptions, ever.

## The ask
Design the ledger service that records every balance-changing event, keeps balances always reconcilable, and survives a retried or duplicated request without double-moving money.

## Given constraints
- ~50M transactions/day, each touching 2–3 accounts (customer, merchant, platform fee)
- A transaction must be atomic: all of its account movements happen, or none do
- The same transaction request retried after a timeout must never be applied twice
- At any point, the sum of all account balances must reconcile to zero (money is only ever moved, never created or destroyed by the ledger itself)
- Auditors must be able to reconstruct any account's balance at any past point in time from the recorded history alone

## Deliverables
Requirements → data model (double-entry accounting or equivalent, and why) → idempotency and atomicity mechanism → high-level diagram → 1–2 deep dives → trade-offs. Likely probes: how idempotency keys prevent double-application, how atomicity holds across multiple account updates, and how historical balance reconstruction actually works.

## Rules
Think aloud. Draw in the canvas. Ask clarifying questions — I will answer as the interviewer.
