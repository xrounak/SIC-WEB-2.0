-- Chronos 2026: rule books for four events, from the organisers' documents.
-- Run in the Supabase SQL editor. Safe to run again (it just rewrites the same text).
--
--   robo-war            Nether Clash        teams of 2–5
--   robo-soccer         Elytra Kick         teams of 2–4
--   rc-car-hurdle-race  Pillager's Parkour  teams of 2–5 (at least one girl)
--   boat-race           Marine Rush         team size unchanged (the rule book doesn't set one)
--
-- The event page shows the Markdown with a contents list built from the ## headings.

-- ---------------------------------------------------------------- Nether Clash (Robo War)
update public.events
set team_min = 2,
    team_max = 5,
    description = $md$
Armoured combat robots fight it out in an enclosed arena. Build for strength, drive power, weapons and control.

## Robot specifications

- **Weight:** the robot must not weigh more than **5 kg**. This includes the chassis, batteries, weapons and every other part attached to it.
- **Dimensions:** at most **35 cm × 35 cm × 30 cm** (length × width × height).
- **Control:** wired or wireless remote control is allowed. Every robot **must have a failsafe** that stops it safely if the control signal is lost.

## Team

- Each team has **2 to 5 members**.
- Only registered team members may enter the competition area.

## Weapons

### Allowed

- Vertical and horizontal spinners
- Drum and disc spinners
- Blades and cutting mechanisms
- Needles, spikes and piercing mechanisms
- Cutters and shearing mechanisms
- Lifters, flippers and wedges
- Drills and other mechanical attack systems

### Not allowed

Firearms, explosives, flame-based weapons, chemical weapons, electric shock systems, projectile-launching weapons and incendiary devices.

## Matches

- Every match is fought **inside the enclosed arena**. Nobody may enter the arena while a match is on.
- Each match lasts **3 minutes**, one robot against another.
- A robot that **can't move for 10 seconds in a row** may be declared knocked out by the referee.

## Winning a match

A match is won by **knockout**, or by the **judges' decision** if it runs the full 3 minutes. The judges score:

| Criterion | Weight |
|---|---|
| Damage | 40% |
| Aggression | 25% |
| Control | 20% |
| Strategy | 15% |

## Tournament and disqualification

- The competition is a **knockout** tournament.
- A team may be disqualified for cheating, unsportsmanlike behaviour, interfering with the arena, or breaking the rules again and again.
$md$
where slug = 'robo-war';

-- ---------------------------------------------------------------- Elytra Kick (Robo Soccer)
update public.events
set team_min = 2,
    team_max = 4,
    description = $md$
Radio-controlled bots play football: push the ball past the other team's bot and into their goal.

## Bot specifications

- **Motors:** between **300 and 500 RPM**.
- **Dimensions:** at most **30 cm × 30 cm × 20 cm** (length × width × height). Bigger bots can't take part.
- **Weight:** under **5 kg**. A heavier bot is disqualified.
- **Wheels:** diameter between **8 cm and 12 cm**.
- **Ground clearance:** more than **2.5 cm**.
- **Power:** up to **12 V**. If you don't have a 12 V battery, an AC supply is provided so you can use an AC-to-DC converter.

## Front design

The front of the bot has slightly curved plates to push and guide the ball towards the goal. It may only **push** the ball (see *Not allowed*).

## Team

- Each team has **at most 4 members**. Larger teams must cut down before the match.
- Only **2 operators** may stand in the pilot zone during play.

## How a match is played

- Each match lasts **5 minutes**, one team against another.
- The ball starts on the **centre spot**. Both bots start completely behind their own goal-area line.
- Play starts on the **referee's whistle**. Bots may move only after the whistle.
- Push the ball into your opponent's goal. After every goal, play restarts from the centre.
- The clock keeps running. The referee stops it only for a technical issue, an injury or another problem.

## Scoring

### Goals

- Each goal is worth **1 point**.
- A goal counts only when the **whole ball crosses the goal line**.
- A goal that comes **off the wall** still counts.
- The referee decides whether a goal is valid.

### Own goals

An own goal gives **1 point to the other team**.

### Winning

- The team with **more goals** at the end of the match wins.
- If the scores are level, the match is a draw.

### Tie-breaker

- A draw may go to **extra time**.
- If it's still level after extra time, a **penalty shootout** decides the winner.

### Final decision

All goals and scoring decisions are checked by the referee, whose decision is final.

## Not allowed

- A front design that can **swallow, enclose or trap** the ball. The bot may only push it.
- Traps, glue or sticky coatings on the front of the bot.
- Sharp metal edges, spikes or anything that could puncture the ball or hurt someone.
- Petrol, gas or any other internal combustion engine.
- Ground clearance so low that the bot damages the arena.
- Glue, double-sided tape, sticky chemicals or anything else on the wheels to add grip.

## Fouls

1. **Touching the bot** by hand during a match without the referee's permission.
2. **Deliberately damaging** the opponent's bot. This may mean immediate disqualification.
3. **Driving outside the arena** on purpose.
4. **Touching the ball** by hand during play.
5. **Unfair blocking** of the opponent's bot.
6. **Ignoring the referee's** instructions or decisions.
7. **Entering the arena** without the referee's permission.
8. **Interfering** with the opponent's controls or signals.
9. **Damaging the arena**, goalposts or other equipment on purpose.
10. **Cheating** or getting unauthorised help.

## Penalties

| Offence | Penalty |
|---|---|
| First | Official **warning**. Correct it straight away. |
| Second | **1 point deducted** from your score. |
| Third | The team **may be disqualified** from the match. |

> **Serious violations** (deliberate damage to another bot, cheating or unsafe behaviour) can mean **immediate disqualification** without a warning. All penalty decisions by the referee are final.
$md$
where slug = 'robo-soccer';

-- ---------------------------------------------------------------- Pillager's Parkour (RC car hurdle race)
update public.events
set team_min = 2,
    team_max = 5,
    description = $md$
Custom RC cars race through a track of hurdles and obstacles. The fastest clean run wins.

## Car specifications

- **Motors:** between **300 and 500 RPM**.
- **Weight:** under **2.5 kg**. A heavier car is disqualified.
- **Dimensions:** at most **30 cm × 30 cm × 20 cm** (length × width × height). Bigger cars can't take part.

## Team

- Each team has **at most 5 members**, and **at least one girl is compulsory**.
- Larger teams must cut down before the race.

## The track

- The track has **10 to 12 hurdles and obstacles**.
- Every team must clear them **in the given order**.

## Timing and ranking

- Results are decided by the **total time** to complete the track.
- The team with the **lowest time** ranks highest.

## Skipping a hurdle

You may skip a hurdle, but **10 seconds are added** to your total time for each one.

## Going off track or capsizing

If your car goes off the track or flips over, it restarts from the **checkpoint before** the point where it happened.

## Penalties

- **Crossing the track boundary** means negative marks or a time penalty, as the organisers decide.
- **Unfair means** or breaking the rules may lead to **disqualification**.
$md$
where slug = 'rc-car-hurdle-race';

-- ---------------------------------------------------------------- Marine Rush (RC boat race)
update public.events
set description = $md$
Radio-controlled boats race through a water course with seven hurdles. Hull design, propulsion and stability decide it.

## Boat specifications

- **Dimensions:** at most **30 cm × 20 cm × 15 cm** (length × width × height). A boat over any one of these limits can't take part.
- **Motor:** must run between **200 and 500 RPM**.
- **Declare your motor** at the technical inspection. Organisers may check its rating against the manufacturer's specifications or with test equipment.
- Components must be **firmly mounted**, wiring and batteries **protected**, and there must be no sharp or dangerous parts sticking out.
- Every boat must **pass the technical and safety inspection** before it races. Organisers may reject an unsafe or non-compliant boat.

## The race

- Start only on the **official's signal**. Timing starts at the signal and stops when the boat legally crosses the **END line**.
- There's **no time limit** and **one attempt**: the boat must either reach the end in a single run, or clear each hurdle to move on to the next point.
- Officials record the time of each attempt. The **best valid result** is used for ranking, the same way for everyone.

## Obstacles and checkpoints

- The course has **seven hurdles, A to G**.
- The boat must pass every checkpoint and obstacle **in the correct order**.

### Skipping a hurdle or missing a checkpoint

Skipping a hurdle or missing a checkpoint adds a **10-second penalty** to your total time.

## Winning

- A team that **completes the whole course** is a finisher.
- The **shortest final time**, including penalties, wins.
- If two teams have exactly the same final time, there may be a **re-race**.
- All timing, checkpoint and penalty decisions are checked by the officials, whose decision is final.

## If something goes wrong

- If the boat **gets stuck, leaves the route or capsizes**, wait for the official. They'll direct the recovery and tell you which checkpoint to restart from.
- **No touching the boat** without permission. Any safety help is given the same way to every team.
- If the **organisers' equipment or timing fails**, the official may pause the attempt and allow a restart without penalty.
- If **your boat fails**, you may get another attempt if the schedule allows.

## Safety

- The arena and obstacles are inspected before the event.
- **Don't enter the arena or reach into the water** while a boat or a powered obstacle is running.
- Motors, pumps, batteries, wiring and connectors must be **waterproofed**. Damaged or unsafe equipment can't be used.
- Powered obstacles have an **emergency shut-off** and are run only by authorised staff.
- Officials may stop any attempt if there's a safety risk.
$md$
where slug = 'boat-race';

select slug, title, team_min, team_max, char_length(description) as rule_book_chars
from public.events
where slug in ('robo-war', 'robo-soccer', 'rc-car-hurdle-race', 'boat-race')
order by slug;
