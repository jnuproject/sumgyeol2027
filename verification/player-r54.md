# Fixed wind-droplet player — r54

Local and remote players are always wind. The four other species are NPC-only across walking, seated, policy and volunteer roles. The factory enforces this invariant independently of obsolete kind options, URL parameters and local storage. Existing remote appearance metadata is ignored by the renderer.

Removed the selection menu from both game entry pages and its click handler. Removed preference reads, the gallery selection script, and the old selection flow. Existing mascot.html links redirect to the game. Existing local preference data is simply unused.

Validation: 114 tests pass, including fixed-player/4-NPC-species invariants, legacy remote appearance fallback, seated poses, movement, collision boundary and multiplayer regression coverage. Browser opened with character=sprout at the previously used origin; it reported a wind player, zero humans, one created wind (the player), four other NPC species, and no selection button in More. Screenshot: player-r54-campus.jpg.
