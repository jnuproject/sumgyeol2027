# Wind-droplet playable preview — r52

Original nonhuman geometry with wind curl, cream belly, blue scarf, mitten hands,
short feet and a backpack with the existing Sumgyeol symbol. The concept image
is not used as a billboard or substituted for a 3D model.

- `mascot.html`: rotatable model and six animation controls, followed by a direct
  link to the student-hall booth in the game.
- `?character=wind`: opt-in player, policy guide, booth volunteer and locally
  rendered remote-avatar appearance. Ordinary and seated students retain their
  existing human rigs. No multiplayer protocol or chat changes.
- Static parts and materials are shared. 8 coloured mesh draws per mascot plus
  backpack badge and contact shadow. Standalone scene observed 11 draws / 11,430
  triangles including its soft contact shadow and double-sided logo.
- The booth attendant stands on a 0.32m platform, visibly clearing the countertop.
- Conversation identity uses policy ID when setting the talking state; proximity
  targets are shallow copies and must not be compared by object identity.
- Reduced-motion preference disables decorative bob, blink, wave and mouth motion.

Validation: 109 tests pass, including geometry finiteness/scale, independent
animations with shared resources, root-position invariance, foot clearance,
reduced motion, existing seated poses, collision boundaries and multiplayer.
Browser views inspected at 1280×720 and 390×844. On a fresh 390px game load,
touch controls were present, the walk area remained restricted, one jump reached
1.225m clearance and policy conversation opened with the mascot face centred.
Booth view observed 216 draw calls. These are desktop viewport checks, not a
physical-phone or network-load performance benchmark.

Screenshots: `mascot-r52-preview.jpg`, `mascot-r52-dialogue.jpg`,
`mascot-r52-mobile-preview.jpg`, `mascot-r52-mobile-dialogue.jpg`.
