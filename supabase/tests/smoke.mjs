// Offline smoke test for the migrations: runs them in PGlite (Postgres in WASM) on a
// minimal stand-in for Supabase's auth/storage schemas, then plays the main workflows
// as different users and checks RLS. Run: npm run db:test
// It does not replace testing against a real Supabase project.

import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const db = new PGlite({ extensions: { pgcrypto } });

const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema extensions;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as
    $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
  grant usage on schema public, auth, extensions, storage to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  grant all on storage.objects to anon, authenticated, service_role;
  -- Supabase's default privileges on public.
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
`;

let passed = 0;
function ok(name) {
  passed += 1;
  console.log(`  ok  ${name}`);
}

async function as(uid, fn) {
  const role = uid === 'service' ? 'service_role' : uid ? 'authenticated' : 'anon';
  const sub = uid && uid !== 'service' ? uid : '';
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [sub]);
  await db.exec(`set role ${role}`);
  try {
    return await fn();
  } finally {
    await db.exec('reset role');
  }
}

const q = async (uid, sql, params = []) => as(uid, async () => (await db.query(sql, params)).rows);

async function rejects(uid, sql, params, pattern, name) {
  await assert.rejects(q(uid, sql, params), (err) => pattern.test(err.message), name);
  ok(name);
}

async function main() {
  await db.exec(SUPABASE_STUB);

  const files = readdirSync(join(root, 'migrations')).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    try {
      await db.exec(readFileSync(join(root, 'migrations', file), 'utf8'));
    } catch (err) {
      throw new Error(`${file}: ${err.message}`);
    }
    ok(`migration ${file}`);
  }
  await db.exec(readFileSync(join(root, 'seed.sql'), 'utf8'));
  ok('seed.sql');

  // Users
  const ids = {};
  for (const name of ['admin', 'pres', 'lead', 'member', 'student', 'external', 'mate']) {
    ids[name] = (await db.query('select gen_random_uuid() as id')).rows[0].id;
    await db.query(
      `insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)`,
      [ids[name], `${name.toUpperCase()}@gmail.com`, { full_name: `Test ${name}` }],
    );
  }
  const profiles = await db.query('select count(*)::int as n from public.profiles where email like $1', ['%@gmail.com']);
  assert.equal(profiles.rows[0].n, 7);
  ok('auth trigger creates lowercase profiles');

  // Bootstrap roles the way the README describes (SQL editor, as postgres).
  await db.query(`insert into public.user_roles (user_id, role) values ($1, 'admin'), ($2, 'president')`, [ids.admin, ids.pres]);

  const team = async (slug) => (await db.query('select id from public.teams where slug = $1', [slug])).rows[0].id;
  const domain = async (slug) => (await db.query('select id from public.domains where slug = $1', [slug])).rows[0].id;
  const robotics = await team('robotics');
  const roboticsDomain = await domain('robotics');

  // Onboarding
  await rejects(ids.member, `select public.register_individual(gen_random_uuid())`, [], /ONBOARDING_REQUIRED/, 'register before onboarding is refused');
  for (const name of ['pres', 'lead', 'member', 'student']) {
    await q(ids[name], `select public.complete_onboarding($1, '9876543210', true, null, 'Mechanical', 2::smallint, $2)`, [
      `Test ${name}`, `ROLL-${name}`,
    ]);
  }
  await q(ids.external, `select public.complete_onboarding('Test external', '9876543210', false, 'Other College')`);
  await q(ids.mate, `select public.complete_onboarding('Test mate', '9876543210', false, 'Other College')`);
  const studentStatus = await db.query('select student_status from public.profiles where id = $1', [ids.student]);
  assert.equal(studentStatus.rows[0].student_status, 'pending');
  ok('onboarding sets pending student status');

  await rejects(ids.member, `update public.profiles set member_status = 'member' where id = $1`, [ids.member], /permission denied/, 'users cannot set their own member_status');
  await rejects(ids.member, `update public.profiles set student_status = 'verified' where id = $1`, [ids.member], /permission denied/, 'users cannot verify themselves');

  // Recruitment: lead and member join through a cycle
  await q(ids.pres, `insert into public.recruitment_cycles (name, opens_at, closes_at, status) values ('Fall 2026', now() - interval '1 day', now() + interval '10 days', 'open')`);
  const cycleId = (await db.query('select id from public.recruitment_cycles limit 1')).rows[0].id;
  await rejects(ids.external, `select public.submit_application($1, array[$2]::uuid[], '{}', 'I would love to build robots with the club.')`, [cycleId, roboticsDomain], /NOT_ELIGIBLE/, 'external participants cannot apply');

  for (const name of ['lead', 'member']) {
    const appId = (await q(ids[name], `select public.submit_application($1, array[$2]::uuid[], array[$3]::uuid[], 'I would love to build robots with the club.') as id`, [cycleId, roboticsDomain, robotics]))[0].id;
    await rejects(ids[name], `select public.submit_application($1, array[$2]::uuid[], '{}', 'Applying a second time to the same cycle.')`, [cycleId, roboticsDomain], /ALREADY_APPLIED/, `${name}: duplicate application refused`);
    assert.equal((await q(ids.member === ids[name] ? ids.lead : ids.member, `select * from public.recruitment_applications where id = $1`, [appId])).length, 0);
    await q(ids.pres, `select public.move_application($1, 'screening')`, [appId]);
    await q(ids.pres, `select public.move_application($1, 'shortlisted')`, [appId]);
    await q(ids.pres, `select public.move_application($1, 'interview')`, [appId]);
    await q(ids.pres, `select public.evaluate_application($1, 'interview', 8.5, 'Strong hands-on skills', 'select')`, [appId]);
    assert.equal((await q(ids[name], `select * from public.recruitment_evaluations`)).length, 0);
    await rejects(ids.pres, `select public.decide_application($1, 'selected')`, [appId], /STUDENT_NOT_VERIFIED/, `${name}: selection needs verified student`);
    await q(ids.pres, `select public.verify_student($1, true)`, [ids[name]]);
    await q(ids.pres, `select public.decide_application($1, 'selected')`, [appId]);
  }
  ok('applicants cannot read each other or their evaluations');
  const memberRow = await db.query('select member_status from public.profiles where id = $1', [ids.member]);
  assert.equal(memberRow.rows[0].member_status, 'member');
  const seats = await db.query('select count(*)::int as n from public.team_members where team_id = $1', [robotics]);
  assert.equal(seats.rows[0].n, 2);
  ok('selection grants membership, domains and team seats');

  await rejects(ids.pres, `select public.set_team_member($1, $2, 'lead')`, [robotics, ids.student], /NOT_A_MEMBER/, 'non-members cannot hold team seats');
  await q(ids.pres, `select public.set_team_member($1, $2, 'lead')`, [robotics, ids.lead]);
  await rejects(ids.pres, `select public.assign_role($1, 'vice_president')`, [ids.lead], /NOT_ALLOWED/, 'only admin assigns roles');
  await rejects(ids.admin, `select public.revoke_role($1, 'admin')`, [ids.admin], /LAST_ADMIN/, 'last admin cannot be removed');

  // Event proposal: major event needs two stages
  const [{ id: eventId }] = await q(ids.member, `
    insert into public.events (title, summary, description, event_type, venue, starts_at, reg_closes_at,
                               participation, team_min, team_max, owner_team_id, created_by)
    values ('Robo Rumble 2026', 'Bot battle', 'Build a bot and fight.', 'hackathon', 'Main ground',
            now() + interval '20 days', now() + interval '10 days', 'team', 2, 3, $1, $2)
    returning id`, [robotics, ids.member]);
  await rejects(ids.member, `update public.events set status = 'published' where id = $1`, [eventId], /permission denied/, 'authors cannot set status directly');
  assert.equal((await q(null, 'select * from public.events where id = $1', [eventId])).length, 0);
  ok('anon cannot see drafts');

  await q(ids.member, 'select public.submit_event($1)', [eventId]);
  await rejects(ids.member, `select public.review_event($1, 'approved')`, [eventId], /CANNOT_REVIEW_OWN/, 'proposer cannot review own event');
  await rejects(ids.lead, `select public.review_event($1, 'changes_requested')`, [eventId], /NOTES_REQUIRED/, 'change requests need notes');
  await q(ids.lead, `select public.review_event($1, 'approved')`, [eventId]);
  await rejects(ids.lead, 'select public.publish_event($1)', [eventId], /NOT_READY/, 'major event cannot publish after lead approval only');
  await rejects(ids.lead, `select public.review_event($1, 'approved')`, [eventId], /NOT_ALLOWED/, 'leads cannot give final approval');
  await q(ids.pres, `select public.review_event($1, 'approved')`, [eventId]);
  const [{ publish_event: slug }] = await q(ids.lead, 'select public.publish_event($1)', [eventId]);
  assert.match(slug, /^robo-rumble-2026-[0-9a-f]{6}$/);
  assert.equal((await q(null, 'select id from public.events where id = $1', [eventId])).length, 1);
  assert.equal((await q(ids.member, 'select * from public.event_reviews where event_id = $1', [eventId])).length, 2);
  ok('two-stage approval publishes with a slug; anon sees published event');

  // Team registration with an email invite
  await rejects(ids.external, 'select public.register_individual($1)', [eventId], /TEAM_EVENT/, 'team event refuses individual registration');
  await rejects(ids.external, `select public.create_event_team($1, 'Bolts', array['a@gmail.com','b@gmail.com','c@gmail.com'])`, [eventId], /TOO_MANY_INVITES/, 'invites capped at team_max - 1');
  const [{ create_event_team: teamId }] = await q(ids.external, `select public.create_event_team($1, 'Bolts', array[' Mate@Gmail.com '])`, [eventId]);
  const outbox = await db.query(`select payload->>'token' as token from public.email_outbox where template = 'team-invite'`);
  const token = outbox.rows[0].token;
  assert.equal((await q(ids.external, 'select status from public.event_teams where id = $1', [teamId]))[0].status, 'forming');
  assert.equal((await q(null, `select public.get_invite($1) as i`, [token]))[0].i.team_name, 'Bolts');
  ok('invite preview works before sign-in');
  await rejects(ids.member, 'select public.accept_invite($1)', [token], /INVITE_EMAIL_MISMATCH/, 'invite cannot be used by another account');
  await rejects(ids.external, 'select * from public.team_invites', [], /permission denied/, 'select * on invites is refused (token_hash hidden)');
  await q(ids.mate, 'select public.accept_invite($1)', [token]);
  assert.equal((await q(ids.external, 'select status from public.event_teams where id = $1', [teamId]))[0].status, 'complete');
  assert.equal((await q(ids.mate, 'select * from public.profiles where id = $1', [ids.external])).length, 1);
  assert.equal((await q(ids.mate, 'select * from public.profiles where id = $1', [ids.student])).length, 0);
  ok('teammate joins, team completes, teammates see each other only');
  await rejects(ids.mate, 'select public.accept_invite($1)', [token], /INVITE_ACCEPTED/, 'invite is single use');
  await rejects(ids.mate, `select public.create_event_team($1, 'Nuts', '{}')`, [eventId], /ALREADY_REGISTERED/, 'one seat per person per event');

  assert.equal((await q(null, 'select * from public.event_registrations')).length, 0);
  assert.equal((await q(null, 'select * from public.profiles')).length, 0);
  assert.equal((await q(ids.student, 'select * from public.event_registrations')).length, 0);
  assert.equal((await q(ids.lead, 'select * from public.event_registrations where event_id = $1', [eventId])).length, 2);
  ok('rosters visible to the owning lead only');
  const [{ seats_taken: taken }] = await q(null, 'select seats_taken from public.event_seat_counts where event_id = $1', [eventId]);
  assert.equal(Number(taken), 2);
  ok('public seat count');

  // Leader withdraws: whole team goes
  const [{ id: leaderReg }] = await q(ids.external, `select id from public.event_registrations where user_id = $1`, [ids.external]);
  await q(ids.external, 'select public.withdraw_registration($1)', [leaderReg]);
  const active = await db.query(`select count(*)::int as n from public.event_registrations where event_team_id = $1 and status = 'registered'`, [teamId]);
  assert.equal(active.rows[0].n, 0);
  ok('leader withdrawal withdraws the team');

  // Projects: contributor consent gates public credit
  const [{ id: projectId }] = await q(ids.member, `
    insert into public.projects (title, summary, problem, solution, owner_team_id, created_by)
    values ('Line Follower', 'Fast line follower', 'Slow bots', 'PID tuning', $1, $2) returning id`, [robotics, ids.member]);
  await q(ids.member, 'insert into public.project_contributors (project_id, member_id, contribution) values ($1, $2, $3)', [projectId, ids.lead, 'Firmware']);
  await q(ids.member, 'select public.submit_project($1)', [projectId]);
  await q(ids.lead, `select public.review_project($1, 'approved')`, [projectId]);
  assert.equal((await q(null, 'select * from public.project_contributors where project_id = $1', [projectId])).length, 1);
  await q(ids.lead, 'select public.confirm_contribution($1, true)', [projectId]);
  assert.equal((await q(null, 'select * from public.project_contributors where project_id = $1', [projectId])).length, 2);
  ok('published project shows only confirmed contributors');

  // Announcements
  const [{ id: annId }] = await q(ids.lead, `insert into public.announcements (title, body, audience, team_id, created_by) values ('Lab night', 'Friday 6pm', 'team', $1, $2) returning id`, [robotics, ids.lead]);
  await rejects(ids.lead, `insert into public.announcements (title, body, audience, created_by) values ('All hands', 'Body', 'members', $1)`, [ids.lead], /row-level security/, 'leads cannot announce to all members');
  await q(ids.lead, 'select public.publish_announcement($1)', [annId]);
  assert.equal((await q(ids.member, 'select * from public.announcements where id = $1', [annId])).length, 1);
  assert.equal((await q(ids.student, 'select * from public.announcements where id = $1', [annId])).length, 0);
  ok('team announcements reach the team only');

  // System
  assert.equal((await q(ids.member, 'select * from public.audit_logs')).length, 0);
  assert.ok((await q(ids.admin, 'select * from public.audit_logs')).length > 0);
  ok('audit log restricted to president and admin');
  await rejects(ids.member, 'select * from public.email_outbox', [], /permission denied/, 'outbox hidden from clients');
  await rejects(ids.member, 'select public.run_scheduled_maintenance()', [], /permission denied/, 'maintenance is service-role only');
  await rejects(null, `select public.register_individual($1)`, [eventId], /permission denied/, 'anon cannot call workflow RPCs');
  const [{ run_scheduled_maintenance: report }] = await q('service', 'select public.run_scheduled_maintenance()');
  assert.equal(typeof report.completed_events, 'number');
  ok('scheduled maintenance runs');

  console.log(`\n${passed} checks passed`);
}

main().catch((err) => {
  console.error(`\nFAILED: ${err.message}`);
  process.exit(1);
});
