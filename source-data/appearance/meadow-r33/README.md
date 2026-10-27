# Lawn appearance correction · 2026-10-26 (r33)

Reference: the three phone aerial screenshots supplied by the user after the r32 pass. The user confirmed these are lawns but rejected the uniform yellow appearance. The photographs show largely open interiors, muted dry/grey-green turf, irregular vegetation around the margins and broad crown shadows. Map UI and labels are not ground features.

Applied:

- Removed the plain `#aaa77e` meadow material. Six existing lawn/garden polygons now use the local CC0 grass colour/normal/roughness textures with independent world-space variation for dry turf, olive turf and worn soil. Photographs are not copied into a ground texture.
- Each polygon has an edge-distance transition, so its tree margin is less uniform. The change shares the original draped terrain geometry and walking heights.
- Added 56 accepted, irregularly spaced lawn-margin tree placements, subject to existing road, path, wall and parking clearances. Trees are allowed only within 6.5m of the lawn outline; random trees remain excluded from lawn interiors.
- Aerial crown volumes now cast shadows. The aerial light/shadow camera covers the reference area; returning to walking restores its original nearby shadow range.
- `?view=lawns` opens the reference lawns at a closer north-up view. Normal school overview remains available.

The patch is an independent visual reconstruction. Individual tree locations and turf patches are inferred, not surveyed. There is no change to source elevation or GitHub deployment.
