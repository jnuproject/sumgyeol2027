# NPC dialogue r39 — 2026-10-26

User direction: campus exploration should lead to conversations with Sumgyeol NPCs, with policy woven into everyday exchanges. Fetch tasks, quizzes, hints, answer checks and policy reward stamps were removed from the implementation before delivery.

- Three animated companions share the existing character artwork with independent skeletons and idle animation. Pedestrian anchors: gate `[-72.55,-476.403]`, economics `[-47,87.6]`, student hall `[-96.9,-18]`.
- Approaching within 4.8m enables E / 말 걸기, with height and obstacle checks. Talking opens a dedicated native modal at the bottom of the game, with portrait, name, gradual text and player response buttons. Replies choose authored dialogue branches. E/Space reveals or advances a line; Escape and 나중에 이야기하자 exit.
- Verified in the real in-app browser: student-hall interaction, choice-dependent reply, council follow-up choice, E advancement after a response, no movement during dialogue (position `[-96.90,25.27,-21.00]` unchanged after W), ending a conversation, journal record and original-source link. Reload resumed the partial conversation; a completed conversation replayed from its greeting. Economics NPC's conversation also opened from the nearby walking start. The earlier gate proximity/obstacle check was verified by walking up to the NPC.
- The final conversation no longer displays policy instructions in toasts. Source summaries live in the optional conversation journal, and do not replace the scene dialogue.
- All authored branches reach a farewell; no quiz or required quest remains. Automated suite: 51/51 passed. Includes graph traversal, choice gating, partial resume/replay, unavailable/corrupt storage, existing navigation and geometry tests. Log: `/tmp/jeju-r39-tests.log`.
- Screenshot: `dialogue-r39-conversation.png` shows the player response and the NPC's next spoken reply in the actual game window.

Student forecourt correction retained: half-round roadside deck, radius 3.3m, 1.8m four-step access; no long raised ramp across the court. Door glazing and compact three-step entrance. Browser reports estimated street/court drop 0.488m. Shape/top-surface and stair geometry checks pass. Dimensions are visual estimates from references, not surveyed heights.

Limitations: fixed authored dialogue, not free-form AI chat or voice acting. Responsive layout is included; real phone hardware has not been verified in this pass. Docs were read only; content status remains proposals. No GitHub push or cloud deployment was performed in this pass.
