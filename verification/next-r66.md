# NEXT migration and bounded live validation — 2026-11-03

Owner requested moving the game into the existing app project and then testing load.
Target: **NEXT / sqqyvdpsalclqczqsyrk**, Seoul. No new project, paid instance,
compute resize, app table alteration or public reopening was performed.

## Migration

- Added only `campus_walk_live.sessions`, `reactions`, `access_control`, game
  RPCs and the game-specific expiry job. Private tables have RLS and no client grants.
- Enabled pg_cron because NEXT did not have it. `campus_walk_expiry` removes
  only game sessions older than 45 seconds every minute; reactions cascade.
- Ported existing nearby-state and fixed-reaction behavior. All participants
  within 150m remain in responses; no 12-person room or peer-count truncation.
- Hardened JSON-null validation. Added a closed-by-default public gate and an
  expiring test scope. The client now uses NEXT's publishable browser key.
- App security/search function definitions were not inspected; that read was
  rejected by automatic approval review, and metadata/aggregate checks were used.
- Temporary test access was closed after the run. Both game RPCs have EXECUTE
  revoked from PUBLIC, anon and authenticated. Public gate false; test scope null.
- Postflight: 0 sessions, 0 reactions; last two cleanup jobs succeeded; actual
  HTTP requests for public and retired test scopes both denied (401 / 42501).
- No new advisor warnings for game functions after closure. Informational
  no-policy notices on private RLS tables are intentional deny-all behavior.
  Existing unrelated app advisories were not changed.

## Live test

Recorded run: 03:59:28–04:01:42 UTC. One external Node load generator, no real
phones. Each participant moves in the same area and sends fixed reactions,
using the actual emote RPC with one request in flight per participant and the
server's 200/400ms cadence. Participants are admitted gradually, not as a burst.
Every phase targets 30 seconds; the first five seconds are excluded from RTT
percentiles/steady peer checks. Transfer includes all participants, not per-user.

| Participants | Actual phase seconds | Successful game requests | Errors | Median / p95 / p99 ms | All nearby peers | Decoded response MB |
|---|---:|---:|---:|---|---|---:|
| 5 | 30.7 | 723 | 0 | 39 / 117 / 132 | 4 each | 0.77 |
| 20 | 30.4 | 2,709 | 0 | 47 / 390 / 467 | 19 each | 12.95 |
| 50 | 30.5 | 6,237 | 0 | 158 / 417 / 728 | 49 each | 76.42 |
| 100 | 3.6, incomplete | 635 | 0 | No steady measurement | Not evaluated | 15.25 |

100 participants stopped at the predeclared 100 MiB decoded-response budget;
already-in-flight requests and cleanup brought the total to **107.24 decimal
MB**, across **10,678 requests** including admissions, probes and cleanup.
No 150/200-participant phase was started. This was a budget stop, not a capacity
failure. It does NOT demonstrate 100-person capacity or a 50-person maximum.

One cheap same-database RPC probe ran each second. Its baseline median/p95 was
102/458ms (includes cold connection setup); phase probe p95 was 182/394/415ms
at 5/20/50. Thus this is not a rigorous warm-baseline comparison. Metadata
snapshots before and just after load showed zero lock waits, long active queries
and database deadlocks. These snapshots are not continuous CPU monitoring.

At 50 participants the generator completed about 205 requests/sec including
probes, below the nominal ~250/sec target due to latency and backpressure.
The full-neighbor response grows with the number of nearby peers. 76.42 MB in
30.5 seconds extrapolates to roughly **9 GB/hour decoded** if held unchanged.
This is NOT measured billable egress: HTTP compression, protocol overhead and
Supabase accounting differ. No current organization usage/billing total was read.

## Limits and operational conclusion

50 participants passed a short exchange test; 100+ and sustained operation remain
unverified. Actual app login/read/write workflows, app peak traffic, phone FPS,
battery and mobile network conditions were NOT tested. No assertion of zero app
impact or supported event attendance follows from this run.

Before a public event: reduce repeated full-state payloads/unchanged snapshots
without capping visible peers, then run a separately budgeted longer test with
representative app traffic and database resource monitoring. Keep the game closed
until the owner requests reopening. See `paused-r60.md` for both access gates.

## Verification artifacts

- `next-loadtest-result.json`: measured results, no participant tokens.
- `next-loadtest.mjs`: bounded harness, private scope file required; cannot enable access.
- `next-migration-local.mjs`: local PostgreSQL checks for gates, expiry, private
  table access, capabilities, reactions, null rejection and cascade cleanup.
- 15 focused movement/network/reaction tests passed; the full deployment check
  also passed all 141 tests.
- SQL files under `supabase/migrations/` preserve the applied migration sequence.

The old project was not accessible through the current connector and was not
modified or re-enabled. Prior maintenance state remains the last verified state.
