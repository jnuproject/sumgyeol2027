# Campus realism and restricted walking — r51

- Restored `createFocusWalkArea` in the runtime: entrance, student hall, economics/library route and their existing connections. Background campus geometry remains visible.
- Near-player ground boundary (13 m fade), same-area map shading and a short map legend.
- 18 conversations retained inside the restriction, including matching location/direction text. No policy promises added.
- Latest OSM API snapshot checked on 2026-10-30: 4,342 nodes, 321 ways, 13 relations; no IDs or feature versions changed. Source XML is not overwritten. See `dist/campus-realism-sources.json`.
- Seven crossing stations independently traced from the supplied aerial references, following the corrected straight avenue. Paint gaps and curb openings share these stations. Twelve mapped building name plates share one texture atlas.
- Street lamps extend along both mapped avenue ways and avoid side roads, crossings and buildings; small flush drainage grates added. Fixture dimensions and mounting positions are estimates, not OSM survey claims.

## Validation

- Full regression suite: 105 tests passed (navigation, connected focus routes, all 18 encounter placements, crossing/marking geometry, lamp clearance, building labels, terrain, escalators, mobile input, multiplayer).
- Browser at 1280×720: overhead campus rendering; seven crossings; no console warnings/errors observed.
- Browser at 390×844: runtime reports `restricted:true`, `inside:true`, 18 NPCs, 12 building labels, seven crossings. Student-hall booth conversation opens and centers the NPC face. Map uses the same walk boundary.
- Screenshots: `realism-r51-mobile-dialogue.jpg`, `realism-r51-walk-area.jpg`.
- Mobile-size run: 211 draw calls, static 512px shadows and pixel ratio 1; this is a desktop browser at phone dimensions, not a physical-device FPS measurement.
- Physical phone hardware and sustained touch walking remain unverified.
