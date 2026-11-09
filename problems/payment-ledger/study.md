# Study notes: payment ledger

## Key trade-offs
- **Derived or maintained balances.** Summing entries on every read is always correct and gets slower as history grows. Keeping a running balance is fast and can drift from the entries if any code path updates one without the other. Keep a maintained balance written in the same transaction as the entries, and reconcile it against the history on a schedule.
- **One transaction or a saga.** A single database transaction across the accounts gives atomicity with no extra design and limits you to one database and its contention. A saga with compensating steps scales across systems and exposes intermediate states you must handle. At 50M transactions a day, the question is whether accounts can be sharded so each transaction stays within one shard.
- **Account sharding and hot accounts.** Sharding by account spreads load, and a platform fee account touched by every transaction becomes a hot row. Splitting it into sub-accounts and summing them removes the hot spot and complicates balance reads.
- **Isolation and locking.** Serialisable transactions or explicit row locks prevent two debits from overdrawing a balance, at the cost of throughput on busy accounts. Optimistic checks with retries do better when conflicts are rare.
- **Idempotency storage.** A unique constraint on the client key in the same transaction as the entries is the strongest guarantee. Keeping the keys in a separate cache is faster and can disagree with the ledger after a crash.

## Common mistakes
- **Updating a balance column in place.** With no immutable history, you cannot audit, reconcile or rebuild a past balance.
- **Editing or deleting a wrong entry.** Auditors need to see both the error and the correction, so fix mistakes with a new offsetting entry.
- **Storing money as floating point.** Rounding errors accumulate, and the books stop adding up. Use integer minor units and store the currency with every amount.
- **Retries without a key.** A timeout leaves the caller unsure whether the first attempt succeeded, so retrying creates a second movement. The key has to come from the caller and be checked atomically.
- **Treating reconciliation as optional.** The zero-sum invariant only protects you if something checks it continuously and alerts when it breaks.
