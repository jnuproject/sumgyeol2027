# Game paused at owner's request

Public index.html and walk.html display a maintenance notice and load no game or networking scripts. The game bootstrap also redirects cached entry HTML to the notice when it fetches the new module. Both production position/reaction RPCs have EXECUTE revoked from PUBLIC, anon and authenticated. No unrelated Supabase services or data are changed; ephemeral sessions expire normally.

A page that already has the complete game loaded can retain its offline scene until refreshed. It cannot continue multiplayer exchange through either revoked RPC. Static hosting cannot remotely unload an already-running cached JavaScript scene.

Reopen only when requested: copy verification/game-shell.html to dist/index.html and dist/walk.html; replace only the maintenance location.replace bootstrap in the current dist/game.js with try { await initialize(); } catch(error){ fail(error); }, regenerate the manifest and redeploy. Do not restore the entire old game.js: r61 includes newer festival work. Re-grant EXECUTE on the two RPCs to anon/authenticated only (see source-data/multiplayer/operations/pause-r60.sql). Original game remains in Git history and workspace backups.
