-- DEMO DATA for exploring the site. Not for production.
-- Paste into Supabase → SQL Editor → Run, after setup.sql. Safe to run once; remove with demo_cleanup.sql.
--
-- Creates 14 demo people (emails @example.com, ids starting d0000000-…). They cannot sign
-- in: no passwords are set. Sign in with your own account to explore; see the bottom of
-- this file to give yourself a role.
-- Dates are relative to now(), so "upcoming" events stay upcoming whenever you run it.

begin;

-- ---------------------------------------------------------------------------
-- People. The on_auth_user_created trigger creates each profile.
-- ---------------------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select id::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', email, now(),
       '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('full_name', name), now(), now()
from (values
  ('d0000000-0000-4000-8000-000000000001', 'demo.aarav@example.com',   'Aarav Sharma'),
  ('d0000000-0000-4000-8000-000000000002', 'demo.diya@example.com',    'Diya Patel'),
  ('d0000000-0000-4000-8000-000000000003', 'demo.meera@example.com',   'Dr. Meera Iyer'),
  ('d0000000-0000-4000-8000-000000000004', 'demo.rohan@example.com',   'Rohan Verma'),
  ('d0000000-0000-4000-8000-000000000005', 'demo.ananya@example.com',  'Ananya Singh'),
  ('d0000000-0000-4000-8000-000000000006', 'demo.kabir@example.com',   'Kabir Khan'),
  ('d0000000-0000-4000-8000-000000000007', 'demo.ishita@example.com',  'Ishita Rao'),
  ('d0000000-0000-4000-8000-000000000008', 'demo.vikram@example.com',  'Vikram Nair'),
  ('d0000000-0000-4000-8000-000000000009', 'demo.sneha@example.com',   'Sneha Gupta'),
  ('d0000000-0000-4000-8000-000000000010', 'demo.arjun@example.com',   'Arjun Mehta'),
  ('d0000000-0000-4000-8000-000000000011', 'demo.priya@example.com',   'Priya Das'),
  ('d0000000-0000-4000-8000-000000000012', 'demo.rahul@example.com',   'Rahul Joshi'),
  ('d0000000-0000-4000-8000-000000000013', 'demo.neha@example.com',    'Neha Kulkarni'),
  ('d0000000-0000-4000-8000-000000000014', 'demo.siddharth@example.com','Siddharth Bose')
) as v (id, email, name)
on conflict (id) do nothing;

update public.profiles p
set phone = v.phone,
    branch = v.branch,
    academic_year = v.yr,
    roll_number = v.roll,
    college_name = v.college,
    bio = v.bio,
    student_status = v.student::public.student_status,
    member_status = v.member::public.member_status,
    public_profile = v.public,
    onboarded_at = now() - interval '60 days'
from (values
  ('d0000000-0000-4000-8000-000000000001', '+91 90000 00001', 'Mechanical', 4, 'ME21001', null, 'Builds robots, breaks printers. President of SIC.', 'verified', 'member', true),
  ('d0000000-0000-4000-8000-000000000002', '+91 90000 00002', 'Electronics & Communication', 3, 'EC22014', null, 'PCB design and embedded firmware.', 'verified', 'member', true),
  ('d0000000-0000-4000-8000-000000000003', '+91 90000 00003', 'Electrical (Faculty)', null, null, 'Faculty, Department of Electrical Engineering', 'Faculty coordinator for SIC.', 'external', 'none', true),
  ('d0000000-0000-4000-8000-000000000004', '+91 90000 00004', 'Mechanical', 3, 'ME22031', null, 'Robotics team lead. Drives, gearboxes and line followers.', 'verified', 'member', true),
  ('d0000000-0000-4000-8000-000000000005', '+91 90000 00005', 'Computer Science', 3, 'CS22007', null, 'Full-stack developer, leads the software team.', 'verified', 'member', true),
  ('d0000000-0000-4000-8000-000000000006', '+91 90000 00006', 'Computer Science', 2, 'CS23019', null, 'Computer vision and ML for civil inspection.', 'verified', 'member', true),
  ('d0000000-0000-4000-8000-000000000007', '+91 90000 00007', 'Electronics & Communication', 3, 'EC22025', null, 'IoT and low-power sensors.', 'verified', 'member', true),
  ('d0000000-0000-4000-8000-000000000008', '+91 90000 00008', 'Electrical', 2, 'EE23004', null, null, 'verified', 'member', false),
  ('d0000000-0000-4000-8000-000000000009', '+91 90000 00009', 'Information Technology', 2, 'IT23011', null, 'Frontend and design for club projects.', 'verified', 'member', true),
  ('d0000000-0000-4000-8000-000000000010', '+91 90000 00010', 'Civil', 3, 'CE22018', null, null, 'verified', 'member', false),
  ('d0000000-0000-4000-8000-000000000011', '+91 90000 00011', 'Electronics & Communication', 1, 'EC24033', null, null, 'pending', 'applicant', false),
  ('d0000000-0000-4000-8000-000000000012', '+91 90000 00012', 'Mechanical', 2, 'ME23027', null, null, 'verified', 'applicant', false),
  ('d0000000-0000-4000-8000-000000000013', '+91 90000 00013', 'Computer Science', 3, null, 'City Institute of Technology', null, 'external', 'none', false),
  ('d0000000-0000-4000-8000-000000000014', '+91 90000 00014', 'Mechanical', 3, null, 'City Institute of Technology', null, 'external', 'none', false)
) as v (id, phone, branch, yr, roll, college, bio, student, member, public)
where p.id = v.id::uuid;

-- Office bearers
insert into public.user_roles (user_id, role) values
  ('d0000000-0000-4000-8000-000000000001', 'president'),
  ('d0000000-0000-4000-8000-000000000002', 'vice_president'),
  ('d0000000-0000-4000-8000-000000000003', 'faculty_coordinator')
on conflict do nothing;

-- Team seats
insert into public.team_members (team_id, member_id, team_role)
select t.id, v.member::uuid, v.role
from (values
  ('robotics',          'd0000000-0000-4000-8000-000000000004', 'lead'),
  ('robotics',          'd0000000-0000-4000-8000-000000000008', 'member'),
  ('robotics',          'd0000000-0000-4000-8000-000000000001', 'member'),
  ('software',          'd0000000-0000-4000-8000-000000000005', 'lead'),
  ('software',          'd0000000-0000-4000-8000-000000000009', 'member'),
  ('ai-ml',             'd0000000-0000-4000-8000-000000000006', 'lead'),
  ('iot-embedded',      'd0000000-0000-4000-8000-000000000007', 'lead'),
  ('electronics',       'd0000000-0000-4000-8000-000000000002', 'lead'),
  ('civil-structures',  'd0000000-0000-4000-8000-000000000010', 'member'),
  ('media',             'd0000000-0000-4000-8000-000000000009', 'deputy')
) as v (team, member, role)
join public.teams t on t.slug = v.team
on conflict do nothing;

insert into public.member_domains (member_id, domain_id)
select v.member::uuid, d.id
from (values
  ('d0000000-0000-4000-8000-000000000001', 'mechanical'), ('d0000000-0000-4000-8000-000000000001', 'robotics'),
  ('d0000000-0000-4000-8000-000000000002', 'electronics'),
  ('d0000000-0000-4000-8000-000000000004', 'robotics'), ('d0000000-0000-4000-8000-000000000004', 'mechanical'),
  ('d0000000-0000-4000-8000-000000000005', 'software'),
  ('d0000000-0000-4000-8000-000000000006', 'ai-ml'),
  ('d0000000-0000-4000-8000-000000000007', 'iot'), ('d0000000-0000-4000-8000-000000000007', 'electronics'),
  ('d0000000-0000-4000-8000-000000000008', 'robotics'), ('d0000000-0000-4000-8000-000000000008', 'electrical'),
  ('d0000000-0000-4000-8000-000000000009', 'software'),
  ('d0000000-0000-4000-8000-000000000010', 'civil')
) as v (member, domain)
join public.domains d on d.slug = v.domain
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------
insert into public.events (
  id, slug, title, summary, description, event_type, is_major, status, visibility, venue,
  starts_at, ends_at, reg_opens_at, reg_closes_at, capacity, participation, team_min, team_max,
  owner_team_id, domain_id, created_by, published_at
)
select v.id::uuid, v.slug, v.title, v.summary, v.description, v.etype, v.major, v.status::public.event_status, v.vis, v.venue,
       now() + v.starts, now() + v.starts + v.dur, now() + v.opens, now() + v.closes, v.cap, v.part, v.tmin, v.tmax,
       (select id from public.teams where slug = v.team), (select id from public.domains where slug = v.domain),
       v.by::uuid, case when v.status in ('published', 'completed') then now() - interval '7 days' end
from (values
  ('e0000000-0000-4000-8000-000000000001', 'arduino-from-zero', 'Arduino from Zero',
   'A hands-on first workshop: blink, sense, and drive a motor.',
   E'Never touched a microcontroller? Start here.\n\nWe''ll wire up LEDs, read a temperature sensor and drive a small DC motor with an Arduino Uno. Kits are provided; bring a laptop with the Arduino IDE installed.\n\nOpen to all branches and years.',
   'workshop', false, 'published', 'public', 'Electronics Lab 2',
   interval '5 days', interval '3 hours', interval '-6 days', interval '4 days', 60, 'individual', null::int, null::int, 'iot-embedded', 'iot', 'd0000000-0000-4000-8000-000000000007'),
  ('e0000000-0000-4000-8000-000000000002', 'line-follower-sprint', 'Line Follower Sprint',
   'Build a line-following robot in teams and race it on our track.',
   E'Teams of 2 to 4 design, build and tune a line follower. Fastest clean lap wins.\n\nRules: max 20 × 20 cm footprint, any microcontroller, no pre-built commercial chassis. Track and timing gates provided on the day.\n\nPrizes for the top three teams and the best newcomer team.',
   'competition', true, 'published', 'public', 'Main Workshop Bay',
   interval '12 days', interval '6 hours', interval '-5 days', interval '10 days', 80, 'team', 2, 4, 'robotics', 'robotics', 'd0000000-0000-4000-8000-000000000004'),
  ('e0000000-0000-4000-8000-000000000003', 'intro-to-pytorch', 'Intro to PyTorch',
   'Train your first image classifier, from tensors to a working model.',
   E'A members-only session. We cover tensors, autograd, a small CNN and how to read training curves. Bring a laptop; we''ll use Google Colab.',
   'workshop', false, 'published', 'members', 'Seminar Hall 1',
   interval '8 days', interval '2 hours', interval '-3 days', interval '7 days', 40, 'individual', null, null, 'ai-ml', 'ai-ml', 'd0000000-0000-4000-8000-000000000006'),
  ('e0000000-0000-4000-8000-000000000004', 'popsicle-bridge-challenge', 'Popsicle Bridge Challenge',
   'Design the strongest bridge per gram from popsicle sticks and glue.',
   E'Teams of 2 or 3 build a 50 cm span bridge using only the sticks and glue we provide. Bridges are load-tested to failure on the day. Score = load at failure ÷ bridge mass.',
   'competition', true, 'published', 'public', 'Civil Engineering Block, Ground Floor',
   interval '20 days', interval '5 hours', interval '-2 days', interval '15 days', 60, 'team', 2, 3, 'civil-structures', 'civil', 'd0000000-0000-4000-8000-000000000010'),
  ('e0000000-0000-4000-8000-000000000005', 'careers-in-embedded-systems', 'Talk: Careers in Embedded Systems',
   'An industry engineer on firmware jobs, internships and what to learn first.',
   E'Our guest, a senior firmware engineer, talks about the path from college projects to embedded roles, followed by open Q&A.',
   'seminar', true, 'published', 'public', 'Auditorium',
   interval '3 days', interval '90 minutes', interval '-8 days', interval '3 days', 150, 'individual', null, null, 'iot-embedded', 'electronics', 'd0000000-0000-4000-8000-000000000007'),
  ('e0000000-0000-4000-8000-000000000006', 'hacksic-24', 'HackSIC 24',
   'A 24-hour hackathon on campus problems. Registration opens soon.',
   E'Build anything that makes campus life better: hardware, software or both. Mentors on call all night, food included. Teams of 2 to 4.',
   'hackathon', true, 'published', 'public', 'Central Library, Ground Floor',
   interval '30 days', interval '24 hours', interval '2 days', interval '27 days', 120, 'team', 2, 4, 'software', 'software', 'd0000000-0000-4000-8000-000000000005'),
  ('e0000000-0000-4000-8000-000000000007', 'solder-night', 'Solder Night',
   'Learn to solder by building a small LED badge you keep.',
   E'Through-hole soldering basics, safety and inspection.',
   'workshop', false, 'completed', 'public', 'Electronics Lab 1',
   interval '-20 days', interval '3 hours', interval '-35 days', interval '-21 days', 30, 'individual', null, null, 'electronics', 'electronics', 'd0000000-0000-4000-8000-000000000002'),
  ('e0000000-0000-4000-8000-000000000008', 'drone-basics', 'Drone Basics',
   'How quadcopters fly: frames, motors, ESCs and flight controllers.',
   E'An introductory seminar with a live indoor flight demo.',
   'seminar', false, 'completed', 'public', 'Seminar Hall 2',
   interval '-45 days', interval '2 hours', interval '-60 days', interval '-46 days', 100, 'individual', null, null, 'robotics', 'robotics', 'd0000000-0000-4000-8000-000000000004'),
  ('e0000000-0000-4000-8000-000000000009', 'git-for-everyone', 'Git & GitHub for Everyone',
   'Version control for non-CS students: commits, branches and pull requests.',
   E'A beginner session so every team can share code and CAD files properly.',
   'workshop', false, 'pending_review', 'public', 'Computer Lab 3',
   interval '14 days', interval '2 hours', null, null, 50, 'individual', null, null, 'software', 'software', 'd0000000-0000-4000-8000-000000000009'),
  ('e0000000-0000-4000-8000-000000000010', 'robowars-prep', 'Inter-college RoboWars Prep Camp',
   'A two-day build camp for our RoboWars entry, open to other colleges.',
   E'Design reviews, weapon safety, and full-speed test fights in the cage.',
   'external', true, 'lead_approved', 'public', 'Main Workshop Bay',
   interval '25 days', interval '2 days', null, null, 40, 'team', 3, 5, 'robotics', 'robotics', 'd0000000-0000-4000-8000-000000000008'),
  ('e0000000-0000-4000-8000-000000000011', 'total-station-surveying', 'Surveying with a Total Station',
   'Field session on modern surveying instruments.',
   E'Draft: need to confirm instrument availability with the department.',
   'workshop', false, 'draft', 'public', 'Campus grounds',
   interval '35 days', interval '3 hours', null, null, 25, 'individual', null, null, 'civil-structures', 'civil', 'd0000000-0000-4000-8000-000000000010'),
  ('e0000000-0000-4000-8000-000000000012', 'fusion-360-crash-course', 'Fusion 360 Crash Course',
   'CAD from sketch to printable part in one evening.',
   E'Sketches, constraints, extrudes and exporting for 3D printing.',
   'workshop', false, 'changes_requested', 'public', 'Computer Lab 1',
   interval '18 days', interval '3 hours', null, null, 35, 'individual', null, null, 'mechanical-design', 'mechanical', 'd0000000-0000-4000-8000-000000000008')
) as v (id, slug, title, summary, description, etype, major, status, vis, venue, starts, dur, opens, closes, cap, part, tmin, tmax, team, domain, by)
on conflict (id) do nothing;

-- Drafts and proposals don't have slugs yet.
update public.events set slug = null
where id in ('e0000000-0000-4000-8000-000000000009', 'e0000000-0000-4000-8000-000000000010',
             'e0000000-0000-4000-8000-000000000011', 'e0000000-0000-4000-8000-000000000012');

insert into public.event_reviews (event_id, stage, reviewer_id, decision, notes, created_at) values
  ('e0000000-0000-4000-8000-000000000001', 'lead',  'd0000000-0000-4000-8000-000000000002', 'approved', null, now() - interval '9 days'),
  ('e0000000-0000-4000-8000-000000000002', 'lead',  'd0000000-0000-4000-8000-000000000001', 'approved', 'Great format. Please publish the track layout a week before.', now() - interval '9 days'),
  ('e0000000-0000-4000-8000-000000000002', 'final', 'd0000000-0000-4000-8000-000000000002', 'approved', null, now() - interval '8 days'),
  ('e0000000-0000-4000-8000-000000000004', 'lead',  'd0000000-0000-4000-8000-000000000001', 'approved', null, now() - interval '6 days'),
  ('e0000000-0000-4000-8000-000000000004', 'final', 'd0000000-0000-4000-8000-000000000002', 'approved', null, now() - interval '5 days'),
  ('e0000000-0000-4000-8000-000000000005', 'lead',  'd0000000-0000-4000-8000-000000000002', 'approved', null, now() - interval '11 days'),
  ('e0000000-0000-4000-8000-000000000005', 'final', 'd0000000-0000-4000-8000-000000000001', 'approved', 'Book the auditorium AV team.', now() - interval '10 days'),
  ('e0000000-0000-4000-8000-000000000006', 'lead',  'd0000000-0000-4000-8000-000000000001', 'approved', null, now() - interval '4 days'),
  ('e0000000-0000-4000-8000-000000000006', 'final', 'd0000000-0000-4000-8000-000000000002', 'approved', null, now() - interval '3 days'),
  ('e0000000-0000-4000-8000-000000000010', 'lead',  'd0000000-0000-4000-8000-000000000004', 'approved', 'Ready for VP / President sign-off.', now() - interval '1 day'),
  ('e0000000-0000-4000-8000-000000000012', 'lead',  'd0000000-0000-4000-8000-000000000001', 'changes_requested',
   'Please add a software-licence plan (student licences or the free tier) and cap it at 30 so everyone gets a lab PC.', now() - interval '2 days');

-- Registrations: individuals
insert into public.event_registrations (event_id, user_id, created_at)
select v.e::uuid, v.u::uuid, now() - v.ago
from (values
  ('e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000008', interval '5 days'),
  ('e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000009', interval '4 days'),
  ('e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000011', interval '3 days'),
  ('e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000012', interval '2 days'),
  ('e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000013', interval '1 day'),
  ('e0000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000008', interval '6 days'),
  ('e0000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000010', interval '5 days'),
  ('e0000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000014', interval '2 days'),
  ('e0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000009', interval '2 days'),
  ('e0000000-0000-4000-8000-000000000007', 'd0000000-0000-4000-8000-000000000008', interval '25 days'),
  ('e0000000-0000-4000-8000-000000000007', 'd0000000-0000-4000-8000-000000000010', interval '25 days')
) as v (e, u, ago)
on conflict do nothing;

update public.event_registrations set status = 'attended'
where event_id = 'e0000000-0000-4000-8000-000000000007';

-- Registrations: teams for the Line Follower Sprint
insert into public.event_teams (id, event_id, name, leader_id, status) values
  ('f0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000002', 'Torque Bandits',   'd0000000-0000-4000-8000-000000000013', 'complete'),
  ('f0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000002', 'Circuit Breakers', 'd0000000-0000-4000-8000-000000000011', 'forming'),
  ('f0000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000002', 'PID Pirates',      'd0000000-0000-4000-8000-000000000008', 'complete')
on conflict do nothing;

insert into public.event_registrations (event_id, user_id, event_team_id, team_role) values
  ('e0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000013', 'f0000000-0000-4000-8000-000000000001', 'leader'),
  ('e0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000014', 'f0000000-0000-4000-8000-000000000001', 'member'),
  ('e0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000011', 'f0000000-0000-4000-8000-000000000002', 'leader'),
  ('e0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000008', 'f0000000-0000-4000-8000-000000000003', 'leader'),
  ('e0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000012', 'f0000000-0000-4000-8000-000000000003', 'member'),
  ('e0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000010', 'f0000000-0000-4000-8000-000000000003', 'member')
on conflict do nothing;

-- A pending invite. Preview it at /invite/demo-invite-token
insert into public.team_invites (event_team_id, email, invited_by, token_hash, expires_at)
values ('f0000000-0000-4000-8000-000000000002', 'demo.friend@example.com', 'd0000000-0000-4000-8000-000000000011',
        encode(extensions.digest('demo-invite-token', 'sha256'), 'hex'), now() + interval '10 days')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------
insert into public.projects (id, slug, title, summary, problem, solution, outcomes, hardware_details, software_details, repo_url, status, owner_team_id, created_by, published_at, created_at)
select v.id::uuid, v.slug, v.title, v.summary, v.problem, v.solution, v.outcomes, v.hw, v.sw, v.repo,
       v.status::public.project_status, (select id from public.teams where slug = v.team), v.by::uuid,
       case when v.status = 'published' then now() - v.ago end, now() - v.ago - interval '10 days'
from (values
  ('a0000000-0000-4000-8000-000000000001', 'line-follower-v2', 'Line Follower v2',
   'A PID-tuned line follower that laps our track in 9.8 seconds.',
   'Our first robot oscillated on curves and lost the line at speed.',
   'Moved to an 8-sensor IR array, wrote a PID loop with feed-forward on curves and cut 140 g from the chassis.',
   'Lap time went from 16.4 s to 9.8 s. Placed 2nd at the zonal robotics meet.',
   'ATmega328P, TB6612FNG motor driver, N20 600 RPM motors, QTR-8RC sensor array, 2S LiPo.',
   'Arduino C++, PID tuned with a serial plotter and logged runs.', 'https://github.com/',
   'published', 'robotics', 'd0000000-0000-4000-8000-000000000004', interval '30 days'),
  ('a0000000-0000-4000-8000-000000000002', 'smart-irrigation-controller', 'Smart Irrigation Controller',
   'Soil-moisture driven watering for the college garden, monitored over Wi-Fi.',
   'Garden staff watered on a fixed schedule, wasting water after rain.',
   'Capacitive soil sensors feed an ESP32 that opens a solenoid valve only when the soil is dry; readings go to a small dashboard.',
   'About 35% less water used over six weeks of testing.',
   'ESP32, capacitive moisture sensors, 12 V solenoid valve, relay module, 20 W solar panel.',
   'ESP-IDF firmware, MQTT, a small web dashboard.', null,
   'published', 'iot-embedded', 'd0000000-0000-4000-8000-000000000007', interval '20 days'),
  ('a0000000-0000-4000-8000-000000000003', 'campus-lost-and-found', 'Campus Lost & Found',
   'A web app where students post and claim lost items with photo matching.',
   'Lost items ended up in a cupboard nobody checked; WhatsApp posts got buried.',
   'A simple web app with photo uploads, categories, and a claim flow verified by the security desk.',
   '140 items returned in the first semester.',
   null, 'Next.js, Postgres, image hashing to suggest likely matches.', 'https://github.com/',
   'published', 'software', 'd0000000-0000-4000-8000-000000000005', interval '15 days'),
  ('a0000000-0000-4000-8000-000000000004', 'concrete-crack-detection', 'Crack Detection in Concrete',
   'A CNN that flags cracks in photos of campus buildings for inspection.',
   'Manual inspection of older blocks is slow and inconsistent.',
   'Fine-tuned a small CNN on a public crack dataset plus 600 photos we labelled around campus.',
   '94% precision on our held-out campus photos; the civil department now uses it for first-pass screening.',
   'Phone camera on a telescopic pole.', 'PyTorch, MobileNetV3, a Streamlit review tool.', null,
   'published', 'ai-ml', 'd0000000-0000-4000-8000-000000000006', interval '8 days'),
  ('a0000000-0000-4000-8000-000000000005', null, 'Low-cost Weather Station',
   'Temperature, humidity, pressure and rainfall logging for under ₹2,000.',
   'The department''s weather data comes from a station 20 km away.',
   'An ESP8266 with BME280 and a tipping-bucket rain gauge, posting every 5 minutes.',
   null, 'ESP8266, BME280, 3D-printed rain gauge and radiation shield.', 'Arduino, InfluxDB.', null,
   'submitted', 'iot-embedded', 'd0000000-0000-4000-8000-000000000007', interval '2 days'),
  ('a0000000-0000-4000-8000-000000000006', null, 'Truss Analysis Toolkit',
   'A small tool to check student truss designs before building them.',
   'Draft', 'Draft', null, null, null, null,
   'draft', 'civil-structures', 'd0000000-0000-4000-8000-000000000010', interval '1 day')
) as v (id, slug, title, summary, problem, solution, outcomes, hw, sw, repo, status, team, by, ago)
on conflict (id) do nothing;

insert into public.project_contributors (project_id, member_id, contribution, confirmed_at, is_public) values
  ('a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000004', 'Chassis, PID tuning', now(), true),
  ('a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000008', 'Motor driver and power', now(), true),
  ('a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'Mentor', now(), true),
  ('a0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000007', 'Firmware and hardware', now(), true),
  ('a0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000009', 'Dashboard', now(), true),
  ('a0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000005', 'Backend', now(), true),
  ('a0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000009', 'Frontend and design', now(), true),
  ('a0000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000006', 'Model and training', now(), true),
  ('a0000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000010', 'Dataset and field photos', now(), false),
  ('a0000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000007', 'Everything so far', now(), true),
  ('a0000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000008', 'Rain gauge', null, true)
on conflict do nothing;

insert into public.project_domains (project_id, domain_id)
select v.p::uuid, d.id
from (values
  ('a0000000-0000-4000-8000-000000000001', 'robotics'), ('a0000000-0000-4000-8000-000000000001', 'electronics'),
  ('a0000000-0000-4000-8000-000000000002', 'iot'), ('a0000000-0000-4000-8000-000000000002', 'electronics'),
  ('a0000000-0000-4000-8000-000000000003', 'software'),
  ('a0000000-0000-4000-8000-000000000004', 'ai-ml'), ('a0000000-0000-4000-8000-000000000004', 'civil'),
  ('a0000000-0000-4000-8000-000000000005', 'iot')
) as v (p, domain)
join public.domains d on d.slug = v.domain
on conflict do nothing;

insert into public.project_reviews (project_id, reviewer_id, decision, created_at)
select id, 'd0000000-0000-4000-8000-000000000001', 'approved', published_at
from public.projects where id::text like 'a0000000%' and status = 'published';

-- ---------------------------------------------------------------------------
-- Recruitment
-- ---------------------------------------------------------------------------
insert into public.recruitment_cycles (id, name, description, opens_at, closes_at, status, created_by)
values ('c0000000-0000-4000-8000-000000000001', 'Fall 2026',
        'Demo cycle. Applications for all domains and teams.',
        now() - interval '5 days', now() + interval '14 days', 'open', 'd0000000-0000-4000-8000-000000000001')
on conflict do nothing;

insert into public.recruitment_reviewers (cycle_id, user_id, assigned_by) values
  ('c0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000001')
on conflict do nothing;

insert into public.recruitment_applications (id, cycle_id, user_id, domain_prefs, team_prefs, motivation, experience, portfolio_url, status, submitted_at)
values
  ('b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000011',
   array[(select id from public.domains where slug = 'electronics'), (select id from public.domains where slug = 'iot')],
   array[(select id from public.teams where slug = 'iot-embedded')],
   'I''ve been repairing radios with my father since school and want to learn how to design my own boards and sensors.',
   'Built a home temperature logger with an Arduino Nano.', null, 'screening', now() - interval '3 days'),
  ('b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000012',
   array[(select id from public.domains where slug = 'robotics'), (select id from public.domains where slug = 'mechanical')],
   array[(select id from public.teams where slug = 'robotics'), (select id from public.teams where slug = 'mechanical-design')],
   'I want to build combat robots and learn proper CAD. I enjoyed the Drone Basics seminar and want to go further.',
   'SolidWorks basics from coursework; built a small RC car.', 'https://github.com/', 'interview', now() - interval '4 days')
on conflict do nothing;

insert into public.recruitment_evaluations (application_id, evaluator_id, stage, score, private_notes, recommendation) values
  ('b0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000004', 'screening', 7.5, 'Clear motivation, some hands-on experience. Advance.', 'advance'),
  ('b0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000004', 'interview', 8.5, 'Good grasp of gearing; asked smart questions about weapon safety.', 'select')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Announcements and notifications
-- ---------------------------------------------------------------------------
insert into public.announcements (title, body, audience, team_id, status, published_at, created_by) values
  ('Recruitment for Fall 2026 is open',
   E'Applications are open for all domains and teams until the end of the cycle. First-years welcome.\n\nApply from the Join page.',
   'public', null, 'published', now() - interval '5 days', 'd0000000-0000-4000-8000-000000000001'),
  ('Lab hours during Diwali week',
   'The SIC lab is open 4–8 pm on weekdays and closed on Diwali day. Happy Diwali!',
   'public', null, 'published', now() - interval '1 day', 'd0000000-0000-4000-8000-000000000002'),
  ('Monthly members meetup: Saturday 5 pm',
   'Project demos, team updates and snacks. Bring something you''re working on, finished or not.',
   'members', null, 'published', now() - interval '2 days', 'd0000000-0000-4000-8000-000000000001'),
  ('Motor driver order arrived',
   'The TB6612 boards for the Line Follower Sprint are in the robotics cupboard. Sign them out in the register.',
   'team', (select id from public.teams where slug = 'robotics'), 'published', now() - interval '6 hours', 'd0000000-0000-4000-8000-000000000004');

insert into public.notifications (user_id, kind, title, body, target_url, created_at) values
  ('d0000000-0000-4000-8000-000000000008', 'event_decision', 'Changes requested on "Fusion 360 Crash Course"',
   'Please add a software-licence plan and cap it at 30.', '/portal/proposals/e0000000-0000-4000-8000-000000000012', now() - interval '2 days'),
  ('d0000000-0000-4000-8000-000000000001', 'event_review', 'Final approval needed: Inter-college RoboWars Prep Camp', null,
   '/manage/events/e0000000-0000-4000-8000-000000000010', now() - interval '1 day'),
  ('d0000000-0000-4000-8000-000000000004', 'project_review', 'New project to review: Low-cost Weather Station', null,
   '/manage/projects/a0000000-0000-4000-8000-000000000005', now() - interval '2 days');

insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata, created_at) values
  ('d0000000-0000-4000-8000-000000000002', 'event.reviewed', 'event', 'e0000000-0000-4000-8000-000000000002', '{"stage":"final","decision":"approved"}', now() - interval '8 days'),
  ('d0000000-0000-4000-8000-000000000004', 'event.published', 'event', 'e0000000-0000-4000-8000-000000000002', '{}', now() - interval '7 days'),
  ('d0000000-0000-4000-8000-000000000001', 'student.verified', 'profile', 'd0000000-0000-4000-8000-000000000012', '{}', now() - interval '4 days'),
  ('d0000000-0000-4000-8000-000000000001', 'event.reviewed', 'event', 'e0000000-0000-4000-8000-000000000012', '{"stage":"lead","decision":"changes_requested"}', now() - interval '2 days');

commit;

-- ---------------------------------------------------------------------------
-- Optional: give YOUR account access to explore the portal and manage area.
-- Sign in on the site once first, put your email below, uncomment and run.
-- ---------------------------------------------------------------------------
-- update public.profiles set member_status = 'member', student_status = 'verified', onboarded_at = coalesce(onboarded_at, now())
--   where email = 'you@gmail.com';
-- insert into public.user_roles (user_id, role)
--   select id, r::public.app_role from public.profiles, unnest(array['admin', 'president']) r where email = 'you@gmail.com'
--   on conflict do nothing;
-- insert into public.team_members (team_id, member_id, team_role)
--   select t.id, p.id, 'lead' from public.teams t, public.profiles p where t.slug = 'robotics' and p.email = 'you@gmail.com'
--   on conflict do nothing;
