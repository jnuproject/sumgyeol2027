-- Owner explicitly requested reopening on 2026-11-04 Asia/Seoul.
-- Only the campus game is affected; the shared NEXT application is unchanged.
revoke execute on function public.campus_walk_sync(jsonb) from public;
revoke execute on function public.campus_walk_sync_emotes(jsonb) from public;
grant execute on function public.campus_walk_sync(jsonb) to anon, authenticated;
grant execute on function public.campus_walk_sync_emotes(jsonb) to anon, authenticated;
update campus_walk_live.access_control set public_open=true,test_scope=null,test_expires_at=null where singleton;
