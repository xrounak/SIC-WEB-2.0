-- The club has four domains: Mechanical, Civil, IoT & Robotics and Software.
-- This folds the older nine (and their technical teams) into those four and moves
-- everything that pointed at the old ones: members, projects, events, announcements
-- and recruitment preferences. Safe on an empty database and safe to run twice.
--
--   Robotics, IoT, Electronics, Electrical -> IoT & Robotics
--   AI / ML, Research                      -> Software (teams) / Software or dropped (domains)
--   Mechanical Design -> Mechanical, Civil & Structures -> Civil (renamed)

-- ---- Domains --------------------------------------------------------------------
update public.domains set name = 'IoT & Robotics', slug = 'iot-robotics', sort_order = 30 where slug = 'robotics';
update public.domains set sort_order = 10 where slug = 'mechanical';
update public.domains set sort_order = 20 where slug = 'civil';
update public.domains set sort_order = 40 where slug = 'software';

create temp table _dm (old_slug text primary key, new_slug text);
insert into _dm values
  ('iot', 'iot-robotics'),
  ('electronics', 'iot-robotics'),
  ('electrical', 'iot-robotics'),
  ('ai-ml', 'software'),
  ('research', null);

create temp table _dmi as
  select o.id as old_id, n.id as new_id
  from _dm m
  join public.domains o on o.slug = m.old_slug
  left join public.domains n on n.slug = m.new_slug;

update public.teams t set domain_id = m.new_id from _dmi m where t.domain_id = m.old_id;
update public.events e set domain_id = m.new_id from _dmi m where e.domain_id = m.old_id;

insert into public.member_domains (member_id, domain_id)
  select md.member_id, m.new_id
  from public.member_domains md join _dmi m on m.old_id = md.domain_id
  where m.new_id is not null
  on conflict do nothing;
delete from public.member_domains md using _dmi m where md.domain_id = m.old_id;

insert into public.project_domains (project_id, domain_id)
  select pd.project_id, m.new_id
  from public.project_domains pd join _dmi m on m.old_id = pd.domain_id
  where m.new_id is not null
  on conflict do nothing;
delete from public.project_domains pd using _dmi m where pd.domain_id = m.old_id;

-- Recruitment preferences are plain uuid arrays, so they are rewritten by hand.
update public.recruitment_applications a
set domain_prefs = coalesce((
  select array_agg(distinct coalesce(m.new_id, d))
  from unnest(a.domain_prefs) d
  left join _dmi m on m.old_id = d
  where not (m.old_id is not null and m.new_id is null)
), '{}')
where exists (select 1 from unnest(a.domain_prefs) d join _dmi m on m.old_id = d);

delete from public.domains where id in (select old_id from _dmi);

-- ---- Teams ----------------------------------------------------------------------
update public.teams
  set name = 'IoT & Robotics', slug = 'iot-robotics', domain_id = (select id from public.domains where slug = 'iot-robotics')
  where slug = 'robotics';
update public.teams set name = 'Mechanical', slug = 'mechanical' where slug = 'mechanical-design';
update public.teams set name = 'Civil', slug = 'civil' where slug = 'civil-structures';

create temp table _tm (old_slug text primary key, new_slug text not null);
insert into _tm values
  ('iot-embedded', 'iot-robotics'),
  ('electronics', 'iot-robotics'),
  ('electrical-power', 'iot-robotics'),
  ('ai-ml', 'software'),
  ('research', 'software');

create temp table _tmi as
  select o.id as old_id, n.id as new_id
  from _tm m
  join public.teams o on o.slug = m.old_slug
  join public.teams n on n.slug = m.new_slug;

-- Members keep their highest role if they sat in both teams.
insert into public.team_members (team_id, member_id, team_role, status, joined_at)
  select m.new_id, tm.member_id, tm.team_role, tm.status, tm.joined_at
  from public.team_members tm join _tmi m on m.old_id = tm.team_id
  on conflict (team_id, member_id) do update
  set team_role = case
        when public.team_members.team_role = 'lead' or excluded.team_role = 'lead' then 'lead'
        when public.team_members.team_role = 'deputy' or excluded.team_role = 'deputy' then 'deputy'
        else 'member' end,
      status = case
        when public.team_members.status = 'active' or excluded.status = 'active' then 'active'
        else 'inactive' end;

update public.events e set owner_team_id = m.new_id from _tmi m where e.owner_team_id = m.old_id;
update public.projects p set owner_team_id = m.new_id from _tmi m where p.owner_team_id = m.old_id;
update public.announcements a set team_id = m.new_id from _tmi m where a.team_id = m.old_id;

update public.recruitment_applications a
set team_prefs = coalesce((
  select array_agg(distinct coalesce(m.new_id, t))
  from unnest(a.team_prefs) t
  left join _tmi m on m.old_id = t
), '{}')
where exists (select 1 from unnest(a.team_prefs) t join _tmi m on m.old_id = t);

delete from public.teams where id in (select old_id from _tmi);

drop table _dm, _dmi, _tm, _tmi;
