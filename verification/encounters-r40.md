# Face-to-face encounters and everyday campus life — 2026-10-27

User request: centre the real NPC's face during conversation and surround the encounter with people and everyday objects.

## Implemented

- Camera uses the animated Head bone, faces the speaker toward the player and frames their face and upper body at the horizontal centre, above the low dialogue panel. The player's own model is hidden during conversation. The old separate illustrated portrait is removed from this panel.
- Walking yaw, pitch, zoom, perspective and player coordinates are never changed by conversation. Camera interpolation approaches the speaker and returns to walking on close; reduced motion uses an immediate transition.
- Three local everyday scenes: 14 additional students, including 5 seated and 4 walking; four benches and three small notice tables. Shared character meshes and four separately recoloured, unbranded clothing textures. Backpacks, books, printed sheets and drinks dress the furniture.
- Furniture is kept out of buildings, carriageways, existing registered obstacles, the observed economics planting bed and protected player/NPC arrival spaces. Bench legs meet local terrain; seated figures use the bench's seat level. Walkers use sampled pedestrian paths, pause at the ends and wait near the player. Distant students are hidden and their animation updates are skipped.
- These are fictional everyday details, not surveyed fixtures or actual online players. No policy dialogue text or document was changed in this pass.

## Verification

- Browser on final `campus-encounters-r40b`: student hall and economics scenes render; 14 students / 5 seated / 4 walkers and seven fixtures reported by the scene. Planted-bed conflicts found in the first economics placement were corrected and visually rechecked on paving. Player arrival clearance was added after detecting an overlapping background student.
- Student-hall conversation: face and upper body fill the centre, choices remain below, nearby students remain in the background. Escape closes the panel. Camera before and after: `[-83.07881803274122,28.950012319133393,-21]`; player before and after: `[-96.9,25.26955742653395,-21]`. Perspective remains third person.
- Automated suite: **53/53 passed**, `/tmp/jeju-r40-tests.log`. New checks cover projected face position from eight approach directions on landscape/portrait aspects, coincident-player and obstructed-camera handling, furniture/route clearance, reserved arrival spaces and actual pedestrian movement. Existing navigation, terrain, geometry and conversation checks also pass.
- Screenshots: `encounters-r40-face-dialogue.png`, `encounters-r40-campus-life.png`.

Actual phone hardware was not tested in this pass. Camera framing for narrow aspect ratios is covered by projection checks; the conversation panel has responsive layout rules. No GitHub push or deployment was performed.
