revoke execute on function public.campus_walk_sync(jsonb) from public,anon,authenticated;
revoke execute on function public.campus_walk_sync_emotes(jsonb) from public,anon,authenticated;
update campus_walk_live.access_control set public_open=false,test_scope=null,test_expires_at=null where singleton;
