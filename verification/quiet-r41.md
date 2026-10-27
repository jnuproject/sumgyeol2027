# Symbol and quieter interface — 2026-10-27

- Reused the original `assets/sumgyeol_symbol_blue.png` without redrawing it. Native proportions preserved on front/back clothing badges, header, compact NPC marker, interaction button and conversation identity. The existing character and face-centred camera remain.
- Walking no longer automatically opens the location card, minimap, bottom destination bar or keyboard legend. Only small map/place/menu controls and a nearby interaction button remain; OpenStreetMap attribution stays visible.
- `campus-hud.js` gives map, destinations and tools a shared overlay slot. Opening another closes the current one; Escape, outside click and conversation entry dismiss it. Conversation records and settings open only on request. Explore cards are temporarily hidden while a tool panel is open, then restored appropriately.
- Browser checks on `campus-quiet-r41`: initial `openPanels: []`; map → destinations → more showed only the selected panel each time. Opening conversation records closed the tools panel. NPC interaction showed one conversation dialog with no optional overlay open. Original symbol on the NPC shirt and dialogue header visually verified.
- Automated existing suite: 53/53 passed (`/tmp/jeju-r41-tests.log`); changed scripts also pass syntax checks. Screenshots: `quiet-r41-walk.png`, `quiet-r41-dialogue.png`.
- One preview tab reused for all UI checks and retained for the user. No new cloud document, browser window, deployment or GitHub push was created.
