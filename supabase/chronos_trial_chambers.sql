-- Trial Chambers (the hackathon): rule book and the new hours, Sat 12 Dec 2026, 8:00 am to 6:00 pm IST
-- (build and judging included). Run in the Supabase SQL editor. Safe to run again.

update public.events
set starts_at = timestamptz '2026-12-12 08:00:00+05:30',
    ends_at = timestamptz '2026-12-12 18:00:00+05:30',
    team_min = 2,
    team_max = 4,
    summary = 'A one-day coding hackathon. Build a working project, then prove you understand it: the judges will ask you to change it live.',
    description = $md$
**Trial Chambers** is the Chronos hackathon. In one day, teams pick a real problem, build a working project in code, and demo it to the judges. You may use open-source code and AI coding tools, but **you must understand your own code**: the judges will test that by asking for a small change on the spot.

## When

**Saturday, 12 December 2026, 8:00 am to 6:00 pm**, with building and judging both on the same day. There is a **lunch break** in the middle.

## Who can join

- Any student, from any branch and college. Beginners are welcome.
- Teams of **2 to 4**. You can also register alone and be matched with a team at check-in.
- **Every team must have at least one girl.**
- Every member registers on the website. Bring your **college ID card or library card** to get in.
- A person can be in **one team only**.

## Themes

Pick one theme. Come with an idea or find one on the day.

1. **Campus life:** lost and found, canteen queues, notices, hostel complaints, bus timings.
2. **Palamu and rural life:** crop prices, water and power cuts, local jobs, finding government schemes in Hindi.
3. **Health and safety:** safety alerts, blood donor finder, first-aid guide.
4. **Open innovation:** anything else that solves a real problem.

## What you can use

- **Open-source libraries, frameworks and templates** are allowed.
- **AI tools and AI code editors** (ChatGPT, Claude, Copilot, Cursor and similar) are allowed.
- Whatever you use, **your team must know how the code works**: its structure, the flow of data, and where each part lives. See *Live code check* below.
- Start the **actual build only after 9:00 am**. Planning, research and design on paper before that are fine.
- Bring your own laptop, charger and extension board. Power sockets and Wi-Fi are provided, but bring a backup mobile hotspot.

## What to submit

Before the build time ends, each team submits:

1. **A working project** with its **source code** (a repository link or a project folder you can open on your laptop).
2. **A short pitch deck:** 4 to 5 slides covering the problem, the solution, how it works and who it helps.
3. **A demo you can show in 3 minutes** to the judges.

## Demos and judging

Each team gets **3 minutes to demo and 2 minutes for questions**.

| What the judges look for | Points |
|---|---|
| Problem and impact: a real problem, real users | 30 |
| Working project: does it run and do what you say | 30 |
| Live code check: do you understand your own code (see below) | 20 |
| Creativity and presentation | 20 |

- **Best First-Timer Team** and **Best Social Impact** get their own prizes, in addition to the overall winners.
- The judges' decision is final. Ties are settled by the live code check score.
- Results, prizes and certificates are announced by SIC after judging.

## Live code check

This is the most important rule. While judging, the judges will ask your team to **make a small change to your own project**, for example *change the colour of a button*, *rename a field*, *add one more item to a list* or *show a different message*.

- You **may use AI or open-source code** to build the project, and you may use your AI editor during the check too.
- But you must **find the right place in your code and make the change yourself, and explain the flow**: how a request or click travels through your project.
- Any team member can be asked. A team that cannot find or explain its own code loses most of the live-check points, however good the project looks.

## Rules

1. **Original work:** build your project during the hackathon. Code, designs or ideas copied from another team or from an existing finished product are not allowed.
2. **No pre-built projects.** You may reuse libraries, templates and your own small helper code, but you must say so in the demo. Be ready to show which parts you wrote or edited.
3. **Fair play:** no copying from other teams, no interfering with other teams' work or devices, no cheating of any kind.
4. **Respect the venue:** look after the seminar hall, the equipment and each other. Don't leave rubbish or take things that aren't yours.
5. **Follow the organisers.** Mentors and organisers may ask you to explain your project at any time.
6. **Disqualification:** teams may be disqualified for plagiarism, cheating, unsafe or offensive content, or not following these rules.
7. **Safety first:** hardware must be safe. No dangerous chemicals, open flames or anything that can hurt people.

## Questions?

Ask the organisers on the [SIC website](https://sic.gecp.in/contact) or message us on WhatsApp.
$md$
where slug = '12-hour-hackathon';

select slug, title, to_char(starts_at at time zone 'Asia/Kolkata', 'Dy DD Mon HH12:MI am') as starts,
       to_char(ends_at at time zone 'Asia/Kolkata', 'HH12:MI am') as ends, team_min, team_max
from public.events where slug = '12-hour-hackathon';
