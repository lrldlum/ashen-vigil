# Ashen Vigil (side-scroller): progress

Local: `cd /workspace/ashen-vigil-ss && python3 -m http.server 8171 --bind 127.0.0.1`, then http://127.0.0.1:8171/?play (or `?demo&boss`, `?still=dome`, `?touch`, `?mute`).
Static and ready for GitHub Pages: Phaser is vendored at vendor/phaser.min.js (the CDN tag is removed), all paths are relative, `.nojekyll` is present, and the test makes 0 requests to other sites. Nothing is published.

## Milestone A: DONE (2026-10-29)
Every item below is from Tester's r1 report (/workspace/reviewer/ashen_vigil_ss_r1_report.md).

**P1**
1. **Flask:** 3 charges on Q or F. Each heals 40 HP over a 0.6 s drink, and a hit interrupts it (the rest of the heal is lost). Refills at the bonfire and on respawn. The HUD shows code-drawn flask icons.
2. **Souls:** on death your souls drop as a glowing stain at the death spot. It's saved with `stain:{x,souls}`, shows a "SOULS >/<" HUD hint, and touching it restores the souls. Dying again replaces the old stain, so those souls are lost.
3. **Roll:** 0.36 s long, with i-frames only from 0.04 to 0.24 s. Costs 25 stamina and has 0.1 s of recovery. Leaves an ember trail.
4. **Stamina:** regen 30/s after a 0.9 s delay (1.3 s once emptied). An attack costs 18 and a parry 12. No action is possible at 0 stamina, and the bar flashes red when you're empty or an action is refused.
5. **Touch controls:** multi-touch pads (◀ ▶ ▲, JUMP, ATK, ROLL, PARRY, EST, ICE, BOLT, DOME, pause). They turn on automatically on touch devices or with `?touch`. In portrait, a DOM "ROTATE TO LANDSCAPE" overlay appears.
6. **Victory card:** shows time, deaths and souls, then offers NG+ (enemies, boss and damage scale up, souls are kept) or RETURN TO TITLE. The second area is milestone C.

**P2/P3**
- **Parry (#7):** A or Shift+X. The window is 0.1 s (6 frames). A parry staggers a hollow or the boss's slam for 1.5 s, and a riposte deals 4x damage. A successful parry cancels the parry recovery.
- **Boss tells (#8):** wind-ups are now 0.6 / 0.7 / 0.75 s for charge / slam / nova. Each has an eye flash, an audio cue, and a ground frost decal showing the attack's reach (slam line, charge arrows, nova ring).
- **Boss hit flash (#9):** 2 rendered frames in pale blue (not white), then a 0.15 s cooldown.
- **Rest (#10):** radius 28 px, with a "▲ REST" prompt.
- **Enemies (#11):** the hollow has a 2-hit combo. There's a new shield **knight** (6 HP) that blocks frontal melee and breaks guard after 3 blocks. Hollows and knights get a teal rim, imps an orange rim.
- **Title (#12):** a CONTINUE / NEW GAME menu, with tap support.
- **HUD (#13, #14):** bars have gold frames drawn in code. The souls counter is 2x size with a +N popup.
- **Pause (#15):** Esc or P pauses and lists the controls. M toggles sound.

**Visual**
- **Lighting:** an additive light layer (depth 2) with stepped radial pools from braziers, the bonfire, spikes, domes, bolts, explosions, shots, the hero, the stain and the boss. The pools light the skyline, the ground's top rows and puddle reflections. Lightning and parries flash the screen +15% for 2 frames.
- **Background:** darker, with a near layer about 30% darker and fewer windows, plus a 2-tone horizon haze. The ground has 3 tile variants and 8 puddles.
- **Hero:** now a 10x16 figure, rasterized per frame with a 1 px dark outline. Frames: run 6, attack 4 (two combo swings), roll 5, cast 3, death 6, plus idle, jump, fall, hurt, drink, parry and rest.
- **Effects:** the slash is a 3-frame arc (the combo swing goes upward). Ice debris lies on the ground for 1 s. The boss has a pale-blue rim and frost breath.
- **Frost dome:** the player spell is on D (30 FP) and is R=100 centred on the hero. The ring is about 240 px wide, matching Hugo's clip, with a thick bright ring and a crystal crown. Boss domes are R 92 / 104, the phase-change dome is 120, and the intro dome is 110.

**Tests:** `node test/milestoneA.mjs`, with the server on 8171. It runs 17 checks, and the latest results are in test/milestoneA_results.txt. `node test/shots.mjs <dir>` takes screenshots and records any requests to other sites. `node test/clip.mjs /tmp/fr` captures frames, and this encodes the clip:
`ffmpeg -f concat -safe 0 -i /tmp/fr/list.txt -vf "fps=30,scale=960:540:flags=neighbor" -c:v libx264 -pix_fmt yuv420p clips/A.mp4`.
Screenshots are in screenshots/A/{before,after}/ and the clip is clips/A.mp4.

**Known gaps:** there's still no heavy attack (it belongs to the weapon movesets in D). There's no slider for audio settings, only mute. There's still one stage.

Note: core.js, data.js and level.js are untracked files from an earlier, unfinished refactor. index.html doesn't load them, so they're kept for reference only (the level.js chunk ideas may help with B).

## Next milestones (not started)
- **B:** Rayman Legends-style exploration in every stage: branching up and down routes, hidden rooms, secret collectibles to free, wall-jumps, climbables, challenge rooms, and a vertical camera.
- **C:** Stage 2, the frozen Cathedral of the Pale Choir, and stage 3, the burning Cinderdeep (the tiles and backgrounds are already in assets/). Each gets a lord boss with an intro cinematic and 3 phases.
- **D:** DS3-style classes and leveling, weapons and armor with scaling and weight, staffs and wands for INT spells, and 3 save slots.
- **E:** Story: a hub shrine with a keeper, cryptic item text, and a rekindle or let-it-fade ending.
- **F:** Host-and-join co-op over PeerJS with a room code. The PeerJS library must be vendored locally to keep the build static.

## Milestone B — exploration (done)
- **LevelKit** (`class Level` in game.js + `STAGE_DEFS` in stages.js): an 8 px tile grid with kinds SOLID / ONEWAY / CHAIN / SPIKE plus a back-wall flag. Rects are greedily merged into static bodies and the level is painted procedurally to one texture. Each stage def lists world/top/bottom, carve, solid, oneway, chain, spikes, back, covers (hidden rooms), breakables, cages (embers), challenges (`timer` | `waves`), braziers and enemies. Stages 2 and 3 only need a new def plus a palette.
- Ramparts: up routes (rooftops, tower), down routes (crypt, ossuary), 3 hidden rooms, 1 cracked wall, 8 caged embers (HUD `n/8` + victory card), Ember Run timer trial (9 s), Ossuary waves trial. Vertical camera. Save keeps freed/found/chDone/broken.
- Controls: DOWN+JUMP drops through a ledge; UP/DOWN grabs and climbs a chain; JUMP on a chain hops off; slide down a wall and JUMP to wall-jump. Touch has a down button.
- r2 items: foreground parallax layer (1.3x) + drifting mist; hero rim light (gold when parrying) instead of the 2.5x zoom; wraith moved 1380→1300; stage enemies despawn when the boss gate closes; favicon; parry flash + "PARRY" pop; best time in localStorage `ashenVigil.best`.
- Fix found while testing: the ossuary chain ended one tile below the floor, so the player couldn't climb out. Extended it to y156.
- Tests: `node test/milestoneB.mjs` → 26/26, `node test/milestoneA.mjs` → 17/17. Clip: `node test/clipB.mjs /tmp/fB` then ffmpeg concat (see A).
- Gaps: rim light used instead of zoom; only stage 1 has exploration; enemy AI doesn't use climbables.

## Milestone C — stages 2 and 3, lords, stage link (done)
- **Room templates** (`TPL` in stages.js): `pillarRoom`, `crypt`, `tower`, `ossuary` and `ledge` are the stage-1 rooms re-anchored at any x. `composeStage(base, [[tpl,x,...]], remap)` builds a full stage def, gives every secret an id unique to that stage, and remaps base enemy kinds to the stage's own kinds.
- **Stage 2, Cathedral of the Pale Choir** (`?stage=cathedral`): pale ice-stone palette, snowfall, stained-glass light shafts and frozen floor spikes. Enemies: acolyte, sentinel (armoured, 8 HP) and chorister (fires a 3-note spread). Rooms: Choir Run (9 s timer), Pale Choir Trial (2 waves), 3 hidden rooms, a cracked wall and 8 embers. Bonfire: Chancel Vigil.
  - **Lord: the Pale Cantor.** Intro: descends from above under snow. Phase 1: hymn (ring of notes), glide, bell-toll slam (ice spikes). Phase 2 at 66%: a second, faster hymn ring and spikes on both sides. Phase 3 at 33%: requiem (telegraphed icicle rain). Each phase change has a 1.3 s roar during which it can't be damaged.
- **Stage 3, the Burning Cinderdeep** (`?stage=cinderdeep`): ember-red palette, rising ash and lava pits (spike tiles drawn as lava, with light and bubbles). Enemies: husk, cinderknight and wisp (fireballs), plus magmaw. Rooms: Furnace Run (10 s timer), Cinder Trial, the same set of secrets and 8 embers. Bonfire: Forge Vigil.
  - **Lord: Vulcrest the Cinder King.** Intro: rises from lava. Phase 1: hammer slam with a line of eruptions, fire charge. Phase 2: meteor rain. Phase 3: inferno floor waves you have to jump.
- **Link:** each stage's palette, textures and level are cached per stage. The save records `stage`, and secret ids accumulate across stages. Stage 1's lord shows a STAGE CLEAR card with ONWARD to stage 2, and stage 2 leads to stage 3. Stage 3's lord shows VICTORY with NG+, which restarts at stage 1. Best time is stored per stage (`ashenVigil.best.<stage>`; stage 3's is the full-run time).
- **A test change:** the A test's victory check now expects ONWARD to stage 2. NG+ is tested at the final lord in milestoneC.mjs.
- **Tests:** `node test/milestoneC.mjs` → 35/35, `milestoneA.mjs` → 17/17, `milestoneB.mjs` → 26/26. Clip: `node test/clipC.mjs /tmp/fC`, then the ffmpeg concat step.
- **Gaps:**
  - Stages 2 and 3 reuse stage 1's room shapes, so the layouts look alike.
  - Lords share one arena layout.
  - Magmaw behaves exactly like the imp.
  - Sound effects are reused.
  - The title screen always uses the stage 1 backdrop.

## Milestone D — DS3-style RPG systems
- rpg.js: 10 DS3 classes (exact DS3 start levels/stats), 8 stats (VIG/END/VIT/STR/DEX/INT/FTH/LCK), derived HP/ST/FP/load/poise/heal/soul bonus.
- Bonfire menu: LEVEL UP (rising soul cost, DS3 curve /8), EQUIPMENT (R hand, L hand, armor), LEAVE.
- Weapons: longsword, greatsword, dagger, spear, axe, bow + staff and wand (wand can be offhand). Requirements (halved AR if unmet), scaling letters S–E, distinct light movesets and heavy attacks (W key / HVY touch button): greatsword leaping slam, axe spin, spear charge, dagger 3-hit chain, bow charged piercing arrow.
- Armor: none/robe/leather/herald/knight/iron with weight -> LIGHT/MEDIUM/HEAVY/OVERLOADED roll, poise + hyper armor, absorption, palettes.
- INT spells scale with catalyst; 3 save slots on title (Delete twice erases), class select "CHOOSE YOUR ORIGIN".
- Weapon/armor pickups placed in stages 1–3. Lord arenas made distinct (cathedral rose window + platforms, cinderdeep lava falls + platforms). Room layouts still share templates.
- Tests: node test/milestoneD.mjs 15/15; A 17/17, B 26/26, C 35/35. Clip: node test/clipD.mjs /tmp/fD + ffmpeg concat -> clips/D.mp4. Before shots: test/shotsDbefore.mjs vs 80873be on :8172.

## Tester r3 fixes (between D and E)
- P1 chain-top: chain snap is now tile+3 (body stays inside the chain tile) and climbing off the top / jumping off near the top mantles onto an adjacent ledge (climb-over-the-top). Roof A and the ledge ember in all 3 stages are reachable with plain UP, UP+RIGHT, or UP+JUMP+RIGHT (test/r3fix.mjs).
- P2 Ember Run: gate is closed until the run starts (verified), and a timer clear is now pushed to sv.chDone and saved; `done` also reads chDone.
- P2 unique rooms: stage 2 gets the Nave (choir columns, bell-rope chains, loft) and Belfry (stacked bell-frame planks); stage 3 gets the Lava Rise (cinder pool crossed on stones) and the Forge (stepped anvil blocks over ember pits). All underground, so the shared templates and their tests are untouched.
- P2 Cinderdeep readability: cool cyan rim light + faint blue halo on the hero in Cinderdeep only.
- P2 NG+ decision: NG+ is a new journey — embers, hidden rooms, trials and broken walls reset (explicitly written as empty arrays) so they can be re-earned; character, souls, inventory, lore and endings carry over. The victory card labels embers "(NG+n)".
- P2 Magmaw: own behaviour — lurks submerged in the floor, surfaces near you, spits two arcing lava globs, sinks.
- P2 SFX: 12 new synthesized sounds (menu, pickup, chime, crumble, clang, slam, lava, heal, thunder, buff, talk, fanfare) replace the reused ones.
- P3: title backdrop follows the highlighted slot's stage; best times all use `ashenVigil.best.<stage>` (legacy key migrated); souls counter has a dark backing.
