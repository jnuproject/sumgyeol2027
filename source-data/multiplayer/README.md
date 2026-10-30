# Real-time campus (r49)

Supabase Realtime Presence supplies connection membership; Broadcast supplies position at most5Hz while moving and every2s while idle. Public room: sumgyeol-campus-v1. This is an anonymous social walk, not an authoritative competitive game. IDs are random per page load; the count includes the current page and multiple open tabs separately. Sudden connection loss can take the server heartbeat timeout to disappear.

No text chat, nickname input, voice, account signup, database writes, physical location, or saved movement history. The frontend only renders strict numeric pose packets from current presence members. This does not prevent a modified client from sending packets to the public channel; no arbitrary text is rendered. Existing project tables, RLS, auth settings, functions, and billing settings were not changed. A browser publishable key is included; no secret/service-role key.

The nearest16 remote avatars are rendered on mobile and28 on desktop. They do not collide with players. Count covers the whole shared room, even beyond render distance. Disconnects do not stop local gameplay. Reconnect and page lifecycle cleanup are included. Large crowd load/physical phone tests remain unmeasured; hosting limits and message quotas apply.

Dependency: @supabase/realtime-js 2.91.0 (MIT), bundled with esbuild0.25.12. Exact lockfile included. To rebuild: npm ci in this folder, then bundle node_modules/@supabase/realtime-js/dist/module/index.js with --bundle --format=esm --platform=browser --minify to dist/vendor/realtime.js from repository root. License notices are next to the bundle.

Docs checked: https://supabase.com/docs/guides/realtime/presence and https://supabase.com/docs/guides/realtime/broadcast; changelog reviewed including the TLS cipher deprecation (modern browser TLS is supported). Existing project security advisors were inspected read-only; existing findings in unrelated database functions were not changed.

Validation: 100 automated checks passed. verification/multiplayer-live.mjs uses two real WebSocket clients in an isolated random room to check bidirectional coordinates,2→1→2 membership and reconnect. Initial browser game initialization and connection indicator were visible. Two-scene browser visual QA timed out; complete two-device visual/mobile hardware validation remains outstanding.
