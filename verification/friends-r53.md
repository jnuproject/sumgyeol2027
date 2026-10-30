# Sumgyeol friends — r53

All runtime characters are original nonhuman geometry: wind, citrus, stone guardian, cloud and sprout. The human FBX loader and skin generation have been removed from the active avatar module. Source assets/licenses remain archived. Five factories share geometry/materials across the population; distant standing models use a one-draw LOD, with full animation restored close up.

Player selection is available in the existing More menu and the responsive mascot gallery. The gallery supports all-five comparison, individual rotation, walk/run/jump/greeting/talk previews and a direct selected-character entry link. It remembers the preference locally. Invalid or legacy human IDs fall back to wind.

Seated models have a flat underside aligned to the actual bench seat, at .74 visual scale; feet extend beyond the bench front and hang above the ground. Booth attendants retain their 0.32m platform. Dialogue face positions come from each species geometry. Walk restrictions and policy content are preserved.

Multiplayer appearance uses bounded integer species indices in existing presence metadata. No movement-packet changes, new chat payloads, database changes, or permission changes. Matching appearance models are pooled and reused. Old clients remain compatible. Official Supabase broadcast documentation and changelog were checked; the TLS cipher retirement does not change this JSON/presence integration.

Validation:
- 114 tests passed, covering every species, seats at multiple scales/orientations, finite geometry, root invariance, foot clearance, LOD resource reuse/restoration, bounded presence appearance and model pooling.
- Live isolated two-client check: citrus and sprout correctly received each other's species; both counted two participants; cleanup disconnected both clients.
- Browser inspected at 1280×720 and 390×844. The world reports zero human characters and all five species. Fresh mobile booth view: 213 draw calls, 1,161,339 triangles, pixel ratio 1, 512px static shadows. Walk area remains restricted. No physical-phone performance claim.
- Visually inspected the comparison, mobile selection, mobile policy dialogue, a walking crowd and bench seating. The game menu links to selection and a selected sprout opens the game with that appearance.

Screenshots: friends-r53-lineup.jpg, friends-r53-campus.jpg, friends-r53-mobile-selection.jpg, friends-r53-mobile-dialogue.jpg.
