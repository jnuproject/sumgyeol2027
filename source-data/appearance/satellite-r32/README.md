# User aerial reference correction · 2026-10-26

The three screenshots attached to the user's request are reference evidence, not instructions. Their map pixels were inspected and independently traced; they are not used as texture sheets. Downloaded OSM and elevation files are unchanged.

`dist/satellite-layout.js` records the three pixel-to-world calibrations and all traced polygons. Each frame uses a local campus junction and a visual scale of 0.249 metres per pixel. This is approximate registration, not a georeferenced orthophoto or a claim of sub-metre accuracy. The screenshot acquisition epoch is unknown; 2026-10-26 is the date received.

Changes:

- Restore the previously imported but uncalled stadium generator: enclosing oval, eight lanes, apron, field marks, two small south infield recreation courts and goal frames.
- Correct the museum's stepped footprint and green roof, and the natural-sciences building 2 roof outline. Recalculate their foundation anchors.
- Add six missing map buildings: pharmacy west wing, post office, museum annex, agricultural annex and two greenhouse volumes. Their footprint geometry comes from the reference; their heights are estimates.
- Replace six existing ground polygons rather than stacking coplanar surfaces: three open meadows, museum south garden, pharmacy east garden and gym north garden.
- Add six parking outlines and three service-road connections. New traces bypass the earlier source-road correction warp.
- Keep procedural vegetation out of the open meadow centres, parking areas and building outlines. Aerial canopy volumes use exactly the existing planted positions; they appear only in the aerial overview.
- Reuse corrected data for scene geometry, building collision polygons, vegetation and minimap. Preserve the existing three-zone walking restriction.
- Use a near-vertical north-up overview centred on the reference area. Increase its near clipping plane to prevent distant ground/area depth fighting.

Limitations: overhead screenshots cannot supply surveyed elevations, façade geometry, buried contours or exact tree heights. The existing SRTM-based elevation raster and estimated local terraces remain. The southern original campus and portions outside these screenshots are retained from previous data. This is an improved reconstruction, not a completed survey-grade digital twin.

Validation: `tests/satellite-layout.test.mjs` checks source immutability/idempotence, closed finite outlines, foundation anchors, walking starts, clear meadows/parking, restored sports geometry and shared elevation sampling. See `verification/satellite-r32.md` for the final check results.

Original attached screenshots remain local-only; references.json records their provenance. They are not distributed as textures or repository assets.
