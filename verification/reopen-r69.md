# Public game reopened — r69

Explicit owner request: “서버 풀ㅇ”, 2026-11-04 Asia/Seoul.

- Restored both public entry pages from the saved game shell with revision reopen-r69.
- Re-enabled only the current game bootstrap, preserving policy-r68 and presence-r67.
- NEXT game access_control.public_open=true; test scopes remain disabled.
- Granted only the two game RPCs to anon/authenticated. PUBLIC remains revoked.
- Shared app configuration, app data, and the old Supabase project were not changed.
- Updated deployment manifests and the existing entrypoint regression check.

Validation: all 149 repository tests passed. Live public RPC smoke check created two
temporary clients; each received the other and count=2. Both clients were released
after the check. This is a reopening smoke check, not a new capacity/load test.
