-- Reference data: the club's four domains and its teams.
-- Safe to re-run. Adjust names to match the club before production.

insert into public.domains (name, slug, sort_order) values
  ('Mechanical', 'mechanical', 10),
  ('Civil', 'civil', 20),
  ('IoT & Robotics', 'iot-robotics', 30),
  ('Software', 'software', 40)
on conflict (slug) do nothing;

insert into public.teams (name, slug, team_type, domain_id)
select v.name, v.slug, v.team_type, d.id
from (values
  ('Mechanical', 'mechanical', 'technical', 'mechanical'),
  ('Civil', 'civil', 'technical', 'civil'),
  ('IoT & Robotics', 'iot-robotics', 'technical', 'iot-robotics'),
  ('Software', 'software', 'technical', 'software'),
  ('Media', 'media', 'media', null),
  ('Management', 'management', 'operations', null),
  ('PR & Outreach', 'pr-outreach', 'operations', null)
) as v (name, slug, team_type, domain_slug)
left join public.domains d on d.slug = v.domain_slug
on conflict (slug) do nothing;
