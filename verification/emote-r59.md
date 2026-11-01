# Fixed emoji reactions and mascot motions — r59

Four fixed reactions: wave, heart, celebration dance, laugh. One mobile reaction button opens a four-choice menu; G opens it on desktop. Selecting closes the menu. Actions expire after 3 seconds, movement/jump/dialogue cancels, and a 3-second start cooldown prevents rapid repetition. Reduced-motion preferences retain the reaction and a restrained pose. No free text or chat.

Original wind mascot geometry animates hands/body/face without moving the collision root. Nearby detailed avatars receive the same motion; compact distant avatars retain their lightweight mesh and show the reaction bubble. Every visible reacting visitor can display a bubble, including visitors outside the 16/28 detailed-avatar budget. Four shared textures, pooled sprites, no new per-frame network calls. The 30 ambient / 18 talking NPC population is unchanged.

## Verification

- 130 game/terrain/navigation tests passed before final spacing adjustment; focused emote and multiplayer-scene tests passed afterward.
- Local PostgreSQL/PGlite: fixed enums, two-way reaction state, 3-second server expiry/cooldown, cancellation, replay protection, wrong-capability and free-text rejection, private-table denial, original-client compatibility, cascade cleanup.
- Two actual HTTP clients in a unique temporary test scope: reactions exchanged both ways, server age advances, expiry after 3 seconds, bad values and wrong token rejected, old endpoint remains unchanged. Clients removed afterward. Run `verification/emotes-live.mjs` only for an authorized live check.
- Two browser clients: count 2, one remote avatar each; receiving browser recorded local reaction id 0 with one remote reaction visible and two shared textures created. `emote-r59-peers.jpg` shows the two clients, captured after reaction expiry.
- 390×844 browser: menu tap, celebration animation (`dance`, age 196 ms), bubble, and moving immediately cancels (`id:0`, seq:2). Screenshots: `emote-r59-menu.jpg`, `emote-r59-dance.jpg`.
- Scene test: all 80 simulated nearby reacting visitors receive bubbles, including compact visitors; all expire, sprites/resources disposed. Not a concurrency load benchmark.
- No browser console errors in the checked preview. Actual iPhone FPS/heat not measured.

## Backend and compatibility

Applied migration `campus_walk_fixed_emotes` on existing project vedraqrdkwyyipztxddw. Only adds isolated `campus_walk_live.reactions` and `public.campus_walk_sync_emotes(jsonb)`. Original sync function, tables and existing clients are preserved. New wrapper delegates capability, exact-key, scope, bounds and capacity checks to the original RPC and enriches the same nearby snapshot. No new subscription or increased polling frequency. Session deletion/expiry cascades to its single reaction row.

Security advisor reports intentional RLS-with-no-policy for the private table (direct access denied), and anonymous/authenticated SECURITY DEFINER execution for the public game RPC. Empty search_path and qualified relations; anonymous access is limited to capability-verified game state and four numeric reactions. Unrelated project findings were not modified. Official Supabase database-function guidance and relevant changelog entries were checked.

https://supabase.com/docs/guides/database/functions
https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
