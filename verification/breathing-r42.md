# Campus-wide Sumgyeol presence — 2026-10-27

User request: the school still feels empty; add more people and make Sumgyeol present throughout the world while retaining the quiet interface.

## Final scene

- 134 background students/volunteers across the connecting avenue and destination plazas: 69 pedestrians, 19 seated students, 3 branded booth volunteers and conversation groups. Eight clothing colours, varied heights, phase/direction/speed differences and local passing/waiting behaviour.
- 9 talkable Sumgyeol NPCs, increased from 3. New encounters on the avenue, near the museum approach, around lawns and in the central-library plaza. They adapt the same three sourced policy narratives, with local greetings and shared saved topic progress. No new policy promise was invented.
- 42 branded fixtures: 33 symbol banners, 3 staffed shelter booths, 4 message walls and 2 photo signs. Additional furniture totals 11 benches and 5 notice tables. Native symbol proportions are preserved in the world graphics.
- No additional permanent HUD windows. The previous one-at-a-time map/place/tools controls and face-centred conversation remain.

## Placement and rendering

Pedestrian runs are sampled and split around crossroads, existing obstacles and new fixtures. Furniture respects vehicle lanes, building walls, the economics hedge, protected arrivals and existing walking routes. Decorations are fictional game scenes; the source campus footprints, road alignment and original green lawns are unchanged.

Students are distributed across the route rather than spawned into one corner. The nearest 42 are shown on desktop, 22 on touch layouts; more distant animation is throttled. Static decorations are batched separately from the animated crowd. Final browser run showed 210 fewer static draw calls from batching; this is a scene statistic, not a phone performance claim.

## Validation

- Final browser metadata: `campus-breathing-r42`, 134 background people, 9 talkable NPCs, 42 branded fixtures, 3 staffed booths, quiet HUD `openPanels: []`.
- Visually checked the student-hall hub and the revised library forecourt with its booth, message wall and groups of students. Approached the new library NPC with normal movement and opened its face-centred dialogue; saved unfinished topic progress resumed, and no HUD panel remained open.
- Automated suite: **53/53 passed**, `/tmp/jeju-r42-tests.log`. Extended spatial tests require population and branding across the avenue, actual movement, vehicle/building/arrival clearance and a bounded visible crowd. New scripts pass syntax checks. No browser errors observed.
- Screenshots: `breathing-r42-student-hub.png`, `breathing-r42-library-hub.png`, `breathing-r42-avenue.png`.

Actual phone hardware remains untested. No GitHub push, deployment or cloud-document edits were performed.
