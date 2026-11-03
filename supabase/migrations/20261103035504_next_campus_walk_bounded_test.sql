-- Temporary test access, public scope remains closed.
update campus_walk_live.access_control set public_open=false, test_scope='test-0e4237cb-11fc-4e6a-9d7c-8a0181cda176',test_expires_at=clock_timestamp()+interval '30 minutes' where singleton;
grant execute on function public.campus_walk_sync_emotes(jsonb) to anon;
