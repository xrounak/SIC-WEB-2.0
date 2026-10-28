-- Reference data: domains (disciplines) and club teams.
-- Safe to re-run. Adjust names to match the club before production.

insert into public.domains (name, slug, sort_order) values
  ('Mechanical', 'mechanical', 10),
  ('Civil', 'civil', 20),
  ('Electrical', 'electrical', 30),
  ('Electronics', 'electronics', 40),
  ('Robotics', 'robotics', 50),
  ('IoT', 'iot', 60),
  ('AI / ML', 'ai-ml', 70),
  ('Software', 'software', 80),
  ('Research', 'research', 90)
on conflict (slug) do nothing;

insert into public.teams (name, slug, team_type, domain_id)
select v.name, v.slug, v.team_type, d.id
from (values
  ('Robotics', 'robotics', 'technical', 'robotics'),
  ('IoT & Embedded', 'iot-embedded', 'technical', 'iot'),
  ('AI / ML', 'ai-ml', 'technical', 'ai-ml'),
  ('Software', 'software', 'technical', 'software'),
  ('Mechanical Design', 'mechanical-design', 'technical', 'mechanical'),
  ('Civil & Structures', 'civil-structures', 'technical', 'civil'),
  ('Electrical & Power', 'electrical-power', 'technical', 'electrical'),
  ('Electronics', 'electronics', 'technical', 'electronics'),
  ('Research', 'research', 'technical', 'research'),
  ('Media', 'media', 'media', null),
  ('Management', 'management', 'operations', null),
  ('PR & Outreach', 'pr-outreach', 'operations', null)
) as v (name, slug, team_type, domain_slug)
left join public.domains d on d.slug = v.domain_slug
on conflict (slug) do nothing;
