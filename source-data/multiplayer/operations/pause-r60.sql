-- Applied by migration pause_campus_walk_access, at owner's request.
revoke execute on function public.campus_walk_sync(jsonb) from public, anon, authenticated;
revoke execute on function public.campus_walk_sync_emotes(jsonb) from public, anon, authenticated;
-- Reopen only at owner's request. Previous grants were anon/authenticated only.
-- grant execute on function public.campus_walk_sync(jsonb) to anon, authenticated;
-- grant execute on function public.campus_walk_sync_emotes(jsonb) to anon, authenticated;
