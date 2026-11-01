# Ara Daedongje festival — r61, service remains paused

Reference: https://appstagejeju.com/portfolio/?vid=21 (stage contractor, 2026-06-09). Inspected front/side/field photographs. Broad white covered stand, central LED with two side screens, scaffold wings, line arrays, central thrust, white peaked tents and picnic-mat audience informed the geometry. No third-party photos are distributed as game assets.

OSM pitch 286070859 anchors the event. Dimensions, temporary booths, crowd placement and connecting walkway are estimates for the game, not a surveyed event plan. Existing road alignment, stadium oval and surrounding campus buildings remain.

Added 8 tent booths, 3 LED screens, 12 paired picnic mats (24 seated static instanced mascots), 2 animated performers, photo frame, four picnic tables, string lights and four inexpensive night light-cones. No new real-time lights, music streaming, backend writes or crowd pathfinding. Festival policy NPC is relocated to the entrance, not duplicated; booth props are decorative. Existing policy remains the proposed year-end 숨플페; the Ara venue is not represented as a confirmed implemented policy.

Walkable area expands only to the stadium and the gym-side connection. Connector follows terrain and clears vegetation; stage, tent and table footprints block traversal. Existing restrictions elsewhere remain. Corrected stadium polygon depth bias that hid mats, and typed geometry buffers on the connector.

Validation: 133 tests pass, including connector/building/tree clearances, collision footprints, remaining exclusions, finite GPU geometry, population/triangle/draw budgets, and maintenance entrypoints. Festival without performers: ~259k triangles including instances, 64 draws (no DOM sign textures in Node); static batching saves 565 draws in browser. Browser visually checked day, night, overview and booth views. 390×844 responsive preview: 159 total scene draws, ~1.32M triangles; this is desktop responsive testing, not a real-phone frame-rate/load guarantee.

Preview: python3 verification/festival-preview.py, then http://127.0.0.1:18161/index.html?view=festival&revision=festival-r61 . Other views: festival-night, festival-overview, festival-booths. Server binds loopback only and replaces multiplayer with an offline stub. Public index.html/walk.html remain the script-free paused notice, game.js retains its redirect, and multiplayer RPC permissions remain revoked. Only dist is deployed, so the private preview shell is not published.

Screenshots: festival-day-r61.png, festival-night-r61.png, festival-booths-r61.png, festival-mobile-r61.png.
Reopening must be explicitly requested; follow updated paused-r60.md instructions to retain festival changes.
