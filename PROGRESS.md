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

## Hotfix r4 (live-player issues)
- P1 title erase: X (attack) never erases. Only Delete/Backspace opens "ERASE SLOT n? DEL AGAIN = YES  ANY KEY = NO"; any other key cancels.
- P1 chain-top: r4 reviewed c5b5d97; the fix landed in 499ea85. test/r4fix.mjs now climbs with the real keyboard (UP, UP+RIGHT, UP then jump+RIGHT) at roof A and the ledge in all 3 stages: all land on the slab (y=20).
- Balance: level costs x3 (DS3 curve x3/8); greatsword base 2.1->1.8, light 0.7 s / 32 ST, heavy weapons keep 35% AR when requirements are unmet (was 50%); LIGHT roll velocity 215 (covers ~25% more than MEDIUM); staff catalyst buff 160 / scaling A (2.66x at INT 40).
- UI: level-up / equipment panels offset off the HUD bars; touch pad raised so the down button fits at 844x390.
- Faith heal for Herald/Cleric: ships with milestone E (talisman + HEAL miracle), not in this hotfix.
- milestoneD distinct_movesets: greatsword-heavy bound relaxed to 1.25x dagger heavy (knight doesn't meet STR 16 and the nerf is intended).

## Milestone E — story
- story.js (new, loaded after rpg.js): DESC (cryptic 2-3 line descriptions for all 9 weapons/catalysts, 6 armors, 3 sorceries, 3 miracles and the flask), LORE (10 engraved stones), KEEPER (4 dialogue tiers), SHOP, MIRACLES.
- The Ash Shrine hub (STAGE_DEFS.shrine, 640 px, no enemies/boss): bonfire with LEVEL UP / EQUIPMENT / ITEMS AND SPELLS, the Ash Keeper (TALK / BUY / LEAVE; dialogue tier = lords slain, tier 3 after any ending), merchant (talisman, heal, lightning spear, blessed weapon, bow, spear, herald mail, robe, +1 flask x2), exit arch to the next road.
  Reached from every lord's STAGE CLEAR card ("REST AT THE ASH SHRINE") and from any bonfire once a lord is down ("TRAVEL TO THE SHRINE"; the exit returns you to that bonfire).
- Lore: 3 stones per stage + 1 in the shrine; UP reads, saved in sv.lore (kept across NG+). Items menu and equipment panel show descriptions; pickups use item names.
- Faith miracles: EMBER TALISMAN (off hand, FTH 10, scaling B) -> HEAL (G), LIGHTNING SPEAR (T, piercing, no drop), BLESSED WEAPON (R, 14 s, x(1+0.3*mir) on melee and arrows). Power = RPG.mirBuff (FTH). Herald starts with talisman + Heal, Cleric with talisman + Heal + Lightning Spear. Touch: MIR button (heal when low, else spear).
- Endings: final lord card -> APPROACH THE FIRST FLAME -> REKINDLE / LET IT FADE -> Ending scene: ~11 s code-drawn cinematic (rekindle: kneel, the flame swells, the hero burns to embers, amber sky; fade: the flame gutters to one cupped ember, stars come out) + end card (time, deaths, lore, endings seen) -> JOURNEY ON (NG+) / TITLE. ?ending=rekindle|fade for direct viewing. sv.endings recorded.
- r3/r4 leftover arenas: the Pale Cantor glides to a 2-tier choir loft (plats y116 x2, y80) in phases 2-3 and fires note volleys from the perch; Vulcrest's arena has 3 lava pits that crack in phase 1 and erupt (14 dmg, knockback) from phase 2. Gate position is still shared.
- milestoneC.mjs final step now goes card -> choice -> ending -> JOURNEY ON (same NG+ assertion).

## r5 review fixes
- P2 touch class select: class rows are tap targets (tap = select), BEGIN / BACK buttons confirm or return (no more "any tap = Knight").
- P3 touch erase: hold a save slot 0.6 s -> ERASE / KEEP buttons; any other tap keeps the save. Slot taps now act on release so a hold never starts the game.
- P3 class-select overlay is fully opaque and the control hints are hidden behind it.
- P3 Cathedral chains (x568, x664) now reach the floor (y300).
- P3 buying a flask raises the max only; the new charge arrives at the next rest.
- P3 ending cinematic skips on the first press (presses in the first 0.15 s are buffered).
- Menus: arrow / Z / Enter / X taps shorter than one frame now still register (keydown handler drives menuKey; frame edge input is de-duplicated). This was why a scripted shopper "stuck" on option 3.
- Test: test/r5fix.mjs (9 checks: touch class select, opaque overlay, touch erase with confirm, shop purchase with real keyboard, flask no-refill, Blessed Weapon buff + damage, chains reach floor, one-press skip, no errors). Shots in screenshots/r5fix/.

## Milestone F: online co-op (PeerJS, room code)
- `vendor/peerjs.min.js` (PeerJS 1.5.5, MIT, see vendor/PEERJS_LICENSE) is vendored; `net.js` holds all networking. No CDN. Solo play makes zero outside requests; the broker is only contacted when you host or join.
- Broker: the **free public PeerJS cloud broker (0.peerjs.com)** only. No accounts, no signups, no TURN server. **Strict/symmetric NATs (some mobile carriers, corporate networks) may fail to connect without a TURN relay**; the game reports the error and stays playable solo. `?peerhost=HOST&peerport=PORT` points at a self-hosted PeerServer (for tests only).
- Title: new 4th row **CO-OP** -> HOST A ROOM WITH SLOT n / JOIN A ROOM WITH A CODE / BACK. Host shows a 4-character code (unambiguous letters/digits) in the HUD. Join has an on-screen keypad (tap) plus keyboard typing. URL shortcuts: `?host[&room=CODE]`, `?join=CODE`.
- Authority: the host simulates all enemies, bosses, challenges, cages, breakables and loot and streams a 15 Hz snapshot (full progress every 15th); each player streams its own hero at 20 Hz. Guest hits/cage/breakable/pickup are requests the host resolves. Enemies target the nearest player; each player takes its own damage locally.
- Shared progress: freed embers, found secrets, broken walls, challenge clears, bonfire, lord kills, souls earned by either player (both gain), loot (both receive it), stage changes and the ending choice. The host leads: the guest can't use the hub exit or bonfire travel ("THE HOST LEADS THE WAY") and follows the host between stages. The guest has its own character (from its slot or a chosen class) saved under `ashenVigil.coop.guest`.
- Second player is drawn in a teal tint with a P1/P2 tag and a mini HP bar.
- Disconnects: guest leaves -> host keeps the room open ("YOUR COMPANION HAS FADED", waits for a new guest). Host leaves -> guest resumes local simulation ("THE HOST IS GONE - YOU WALK ALONE"). Heartbeat timeout 7 s. A third joiner gets "ROOM IS FULL".
- Test: test/milestoneF.mjs (20 checks). Room registration and offer/answer signaling go through the real broker (verified). **This box's managed Chrome policy (WebRtcIPHandling = disable_non_proxied_udp) yields zero ICE candidates**, so the WebRTC data channel itself can't open between two headless contexts here; the test carries the same JSON messages through a test-only relay (Playwright binding) for that last hop. Real devices on normal networks use the direct WebRTC channel.
- Clip: clips/F.mp4 (host | guest touch side by side).

## r6 review fixes
- P2 keeper/bonfire menus open on their first row: menu navigation ignores input for the first 0.15 s, so the Up that opens the menu can't also move the cursor (it used to wrap TALK -> LEAVE). Also, a key tapped inside a single frame (Phaser drops JustDown when down+up land in one frame) is now latched, so a quick Up tap at the keeper opens the menu reliably.
- P3 join timeout: after 15 s without a data channel the join gives up with "CONNECTION FAILED - TRY ANOTHER NETWORK" (peer torn down; ENTER retries). Still no TURN by design; strict NATs may fail.
- P3 room full: the refusal no longer runs the drop path; status stays "ROOM IS FULL" (role cleared) instead of "HOST LOST".
- P3 colours by role: P1 (host) keeps its armour colours with an ember "P1 HOST" tag; P2 (guest) is teal with a teal "P2 GUEST" tag on BOTH screens. Both players get a backed label.
- Tests: test/r6fix.mjs (5 checks) + 2 new checks in test/milestoneF.mjs (role colours on both screens, ROOM IS FULL status). Shots: screenshots/r6/. Clip: clips/r6.mp4 (host | guest).

## Milestone G — The Frozen Bell Tower, loot & signature weapons
- **New stage `belltower`** (THE FROZEN BELL TOWER): optional side stage reached by the **Frozen Stair** in the Ash Shrine (sealed until the Cantor falls; `?stairopen` bypasses). Icy palette, all FX in code (snow, distant bells, swinging arena bell, icicles). Bonfire BELL-ROPE VIGIL at x1600. Victory returns to the shrine and keeps hub progression.
- **Branching routes (Rayman-style):** low crypt road vs chain climb at x1000 to the high bell-frame beams; FROST RUN / BELL TRIAL / icefall spikes; secret loft behind a cover with the RIMEBOUND SHROUD armor.
- **Collectibles:** 5 frozen bells rung by attacks (HUD BELLS n/5) unseal the bt_bellcage; 3 lore stones b1–b3.
- **Boss — THE RIMEBOUND TOLLER** (Lord of the Frozen Bells, hp 58): intro cinematic "A BELL TOLLS IN THE FROZEN DARK", 3 phases (THE BELLS TOLL AS ONE / THE PEAL OF ENDINGS) with toll (ice shockwaves), requiem icicles, slam, charge, peal (triple toll). Story ties: keeper lines (sealed/open/slain), item descriptions, ending line BELL_ENDING.
- **Loot (loot.js):** chests on every stage (open with UP; hidden ones; mimics that hop, bite and drop gear), weighted DROP_TABLES (common/elite/chest/mimic), monsters drop souls/consumables/gear; consumables ember, blue sap, soul shard, rime salt (guard buff), cinderleaf (stamina buff), each with description and code-drawn pickup burst.
- **Signature weapons:** every lord drops a guaranteed weapon — Warden→FROSTBRAND, Cantor→REQUIEM PIKE, King→CROWNBREAKER, Toller→TOLLER'S CLAPPER — equippable, with stats, story text and a heavy-attack special (frost/hymn/cinder/toll, FP cost).
- **Co-op:** bells, chests, mimics, drops and flames are host-authoritative via snapshot/prog; guest picks via dpick; gear shared to both players; both receive the signature weapon.
- **Persistence:** sv.bells, sv.chests, sv.inv per save slot.
- **Tests:** test/G.mjs 28/28; all older suites green (milestoneE lore count updated for the 3 new stones). Clip clips/G.mp4, shots screenshots/G/{before,after}.

## Milestone H — Special balance + The Burning Catacomb Forge
- **Bug found & fixed:** since G, an inline comment in `weaponSpecial` swallowed the FP cost/counter code, so signature specials never spent FP and FROSTBRAND's frost row scaled off `spellMul` (0 for pure melee builds). Specials now share one power budget: `specialPower()` = half the AR FROSTBRAND would have on the current build (independent of catalysts and of the wielded weapon's stat requirements). Each special strikes every target **once** for ~4×pw (frost row, hymn ring, cinder line, forge pillars; toll 3.5×pw + stun for its wide radius); lords take 60%. Cinder/forge bursts now anchor where the swing started (lunging heavies no longer outrun their own fire).
  - Isolated special damage on one acolyte (knight build): before FROSTBRAND 8.8 / PIKE 1.8 / CROWNBREAKER 1.7 / CLAPPER 1.6 → now 2.77 / 2.77 / 2.77 / 2.42 / MAUL 2.77 (all within 0.7–1.3× of FROSTBRAND; tested).
- **New stage `catacomb`** (THE BURNING CATACOMB FORGE): optional side stage through the **Ember Descent** grate in the Ash Shrine (barred until the Toller is still; `?descentopen` bypasses). Ember palette, code-drawn skull niches, hanging crucibles, furnace mouth, lavafalls. Bonfire ANVIL VIGIL at 1600; returns to the shrine.
- **Routes:** HIGH forge gantry (chain at 1000 → beams at -60 → drop at 1600) vs LOW slag pool (lavaRise) and anvil steps (forge); secret loft behind a cover with the ASHWROUGHT APRON armour + hidden chest; SLAG RUN timer, ANVIL TRIAL waves.
- **Collectible:** 5 FORGE ANVILS (bell system re-skinned via `bellKind:'anvil'`, HUD ANVILS n/5) unseal the anvil cage. 6 chests (2 hidden, 2 mimics). Lore f1–f3.
- **Lord: THE ASHWROUGHT SMITH** (hp 62): cinematic "AN ANVIL RINGS IN THE BURNING DARK" with three hammer strikes; phases THE BELLOWS BREATHE / THE CRUCIBLE POURS; hammer slam (explosion line), bellows (ground fire both ways, twice from phase 2), molten ingots lobbed at you, gantry loft with fire volleys, crucible pour (phase 3).
- **Signature:** ASHWROUGHT MAUL (forge special: three molten pillars). Story: the Smith cast the Toller's bell, the Keeper's lantern and the King's crown; keeper lines sealed/open/slain; FORGE_ENDING line in both endings.
- **Co-op:** anvils, chests, mimic, drops, boss fire and signature all go through the existing host-authoritative paths (tested).
- **Tests:** test/H.mjs 28/28; all suites green (milestoneE lore count includes the new stones). Clip clips/H.mp4, shots screenshots/H/{before,after}.
- milestoneC: the cathedral phase-3 check sampled ~3 random picks in 14 s, so it failed about a third of the time (it also failed on bdd62df). It now samples for up to 40 s and stops as soon as requiem or inferno shows.

## Milestone I — The Drowned Crypt (water, swimming, sigil puzzle, the Tidebound Abbess)
- **Water & swimming (all code-drawn):** stages can declare `water` volumes. Inside one the hero swims: gravity off, buoyancy floats you up, jump/up strokes up, down dives, horizontal drag; leaping out works when your head is at the surface. **Breath** (12 s) drains while your head is under (bubble meter in the HUD, "AIR" warning) and refills at the surface; at zero you take drowning damage every second. Water draws as a translucent layer over the hero with a moving surface line, caustics and bubbles. Volumes can **drain** when a puzzle lock is solved, and the arena pool can rise as a **tide**.
- **New stage `drowned`** (THE DROWNED CRYPT): optional side stage through the **Drowned Well** in the Ash Shrine (x380), sealed until the Smith falls (`?wellopen` bypasses). Teal palette, flooded arches, light shafts, drips. Bonfire TIDEMARK VIGIL; returns to the shrine.
- **Routes:** HIGH gantry (chain at 1000) vs LOW flooded crypt (300–772) and flooded nave (1100–1500), swum through; secret loft (spear + hidden chest); TIDE TRIAL waves, SLUICE RUN timer; a cistern at 2400.
- **Puzzle/collectible:** four SISTER SIGILS (grave-slabs, glyph = tally) must be struck in the order lore stone w2 tells (gantry, crypt, nave, court). A wrong strike sinks them all back. Solving it unseals the sigil cage and drains the cistern, which frees the **sunken chest** (it can't be opened underwater). 6 chests (2 hidden, 2 mimics, 1 sunken). Lore w1–w3.
- **Lord: THE TIDEBOUND ABBESS** (hp 60): cinematic "THE WATER REMEMBERS A HYMN" (she rises from the pool); phases THE SISTERS SING BENEATH / THE TIDE RISES. Tide waves along the floor (twice from phase 2), geysers on her crook-slam, homing drowned-breath bubbles, a loft to the drowned choir with water volleys, a deluge in phase 3, and in phase 3 **the tide floods the arena**, so you fight while swimming.
- **Signature:** ABBESS'S TIDE-CROOK (spear-style; special `tide`: a crest that rolls ahead 4 steps). It uses the H power budget: 2.77 isolated, the same as FROSTBRAND (tested).
- **Story:** the Keeper was the Abbess's last novice and swam out through the well with her lantern; keeper lines sealed/open/slain; CRYPT_ENDING line in both endings.
- **Co-op:** sigils are host-authoritative, including order resets (prog now mirrors un-rung bells as well as rung ones); drain state follows chDone; flames carry a water flag in snapshots; the tide follows the synced boss phase; guests swim locally.
- **Tests:** test/I.mjs 30/30; all suites green (milestoneE lore count includes w1–w3). Clip clips/I.mp4, shots screenshots/I/{before,after}.
- Test hardening: the G/H co-op chest checks allow for the guest auto-picking a drop it stands on, and the co-op lord kills in G/H/I clear a phase-change roar first (a roar ignores damage). Both were intermittent failures seen while re-running the suites.

## Milestone J — The Ruined Rampart Keep
- New stage `keep` (THE RUINED RAMPART KEEP), opened by the Keep Gate in the Ash Shrine (x 540), which stays barred until the Abbess falls (`?keepopen` for testing). Bonfire BREACH VIGIL.
- Siege elements are drawn in code: crumbling walls and arrow slits, torn banners that blow with the wind, a ruined skyline, and the arena portcullis.
  - **Wind on the battlements:** periodic gust zones (`def.wind`) push players, harder when airborne. Streaks and blowing debris show when a gust is active.
  - **Ballistae:** four of them fire bolts at players in line. Wrecking all four (the collectible mechanic, a re-skin of the bells system with `bellKind:'ballista'`) silences them and unseals the `kp_balcage` cage.
  - **Falling masonry:** telegraphed stones drop from the top of the screen near the crumbling sections.
- Routes, secrets, chests and lore:
  - high battlements reached by chain, and a low crypt;
  - hidden chests ch_k2 and ch_k3; mimics ch_k4 and ch_k6;
  - lore k1–k3, where k2 hints at the ballistae.
- **The Ironclad Castellan** (`marshal`, 62 hp):
  - war-horn cinematic and three phases;
  - attacks: charge, slam shockwave, bolt volley from the arena walls, a gust that blows players away (phase 2+), perching on the broken wall, and a rubble rain (phase 3);
  - in phase 3 a gale sweeps the arena in alternating directions.
- **Signature weapon:** CASTELLAN'S HALBERD (axe). Its special 'bolt' is a piercing ballista bolt; isolated damage is within 0.7–1.3× FROSTBRAND.
- Story ties: keeper lines (sealed, open, slain) and an ending line on both endings.
- Co-op: the host is authoritative for ballistae (prog bells), chests, mimics, bolts and stones (snap shots), and the boss (the guest derives the gust from state). Wind is simulated locally per client.
- Tests: `test/J.mjs` (27 checks). milestoneE's lore total now counts the keep.

## Milestone K — The Astral Spire
- New stage `spire` (THE ASTRAL SPIRE), a gothic observatory reached by the Star Lift in the Ash Shrine (x 80). The lift stays still until the Castellan falls (`?spireopen` for testing). Bonfire ORRERY VIGIL.
- Drawn in code: lancet windows and ribbed domes, a turning star field, the arena orrery overhead (it turns faster each phase), and shimmering gravity tides.
  - **Gravity tides:** pulsing low-gravity zones (`def.lowg`) lift players, so jumps go higher (`stats.floated`).
  - **Star platforms:** `def.stars` platforms hold you only while lit. They blink before going dark (`stats.starStands`).
  - **Starfall:** telegraphed falling stars near the open domes (`def.starfall`).
- Collectible: four star lenses (`bellKind:'lens'`). Turning them all to the sky unseals the `sp_orrery` cage. Lore a2 hints at it.
- Routes and secrets: high gallery by chain and a low crypt; hidden chests ch_s2/ch_s3; mimics ch_s4/ch_s6; lore a1–a3.
- **The Starbound Astronomer** (`astronomer`, 64 hp):
  - star cinematic, three phases;
  - attacks: fanned star lances, a gravity well that drags players in (phase 2+), perching at her telescope with star shots, comets (phase 3) and charge;
  - in phase 3 the whole arena goes low-gravity.
- **Signature weapon:** ASTRONOMER'S STARLANCE (spear). Its 'nova' special bursts in a starlight ring; isolated damage is within 0.7–1.3× FROSTBRAND.
- Story ties: keeper lines (sealed, open, slain), an ending line on both endings, and lore a3 tying her to the Castellan.
- Co-op: the host is authoritative for lenses, chests, mimics, star shots and the boss (the guest derives the well and the low gravity from boss state). Gravity tides and star platforms run locally per client from the shared clock.
- Tests: `test/K.mjs` (27 checks). milestoneE's lore total counts the spire.

## Milestone L — r6fix join-timeout fix + The Blighted Cloister
- **r6fix reliability:** the join-timeout check used to time the wait with the test runner's clock, so a slow broker or a busy box gave 28 s or 315 s readings. net.js now stamps `NET.jt0` when a join starts and `NET.jtFired` when the timer gives up. The test measures that span on the page's own clock and must land in 14–17 s; the runner's wall time is only logged. It also waits for the join to really start before its mid-check.
- New stage `cloister` (THE BLIGHTED CLOISTER), reached by the Overgrown Arch in the Ash Shrine (x 250). The arch stays thorned until the Astronomer is slain (`?cloisteropen` for testing). Bonfire TRELLIS VIGIL.
- Drawn in code: a cloister arcade, hanging vines over the chains (`def.vines`), pulsing spore clouds, thorn brakes, and a vine-choked rose window over the arena.
  - **Poison spores:** pulsing clouds (`def.spores`) build up blight and drain HP while they bloom. They never kill (HP floors at 1). Tracked as `stats.poisoned`.
  - **Thorn brakes:** `def.thorns` strips hurt and bounce you (`stats.thorned`).
- Collectible: four blighted blooms (`bellKind:'bloom'`). Cutting them all unseals the `cl_reliquary` cage. Lore g2 hints at it.
- Routes and secrets: high gallery by chain and a low crypt; hidden chests ch_c2/ch_c3; mimics ch_c4/ch_c6; lore g1–g3.
- **The Thorned Prioress** (`prioress`, 64 hp):
  - garden cinematic, three phases;
  - attacks: vine lashes, bramble rows erupting from the soil (phase 2+), climbing her trellis with thorn shots, rot spore pods (phase 3) and charge;
  - in phase 3 the rot rolls from one half of the arena to the other.
- **Signature weapon:** PRIORESS'S THORNBRAND (sword). Its 'bramble' special erupts a row of thorns ahead; isolated damage is within 0.7–1.3× FROSTBRAND.
- Story ties: keeper lines (sealed, open, slain), an ending line on both endings, and lore g3 tying her to the Astronomer.
- Co-op: the host is authoritative for blooms, chests, mimics, thorn and spore shots, and the boss (the guest derives the phase-3 rot from boss state and the clock). Spore clouds and thorns run locally per client.
- Tests: `test/L.mjs` (27 checks). milestoneE's lore total counts the cloister.

## Milestone M — flake hardening + The Hollow Throne (finale)
- **Flake hardening:**
  - The victory-screen wait in G–L is now 40 s instead of 12 s. J's flake was the victory card arriving late on a busy box, followed by a null dereference.
  - The real-heavy special checks in I–L now pin the dummy so the heavy's own lunge or knockback can't shove it out of the special's reach. That was I's 2.22 against 2.77. A miss is re-measured up to twice, and the condition itself is unchanged.
- New finale stage `throne` (THE HOLLOW THRONE), reached by the Hollow Door in the Ash Shrine (x 425). Its six oath-seals burn out one per beaten lord, and it opens only when the Toller, Smith, Abbess, Castellan, Astronomer and Prioress are all beaten (`THRONE_LORDS`; `?throneopen` for testing). Bonfire LAST VIGIL. `def.finale`.
- **Echo halls** reuse the earlier mechanics through their def keys: the Castellan's gale (`wind`), the Astronomer's weightless nave (`lowg`), the Prioress's rot bed (`spores`) and thorns. Drawn in code: ash colonnades with faded banners in each lord's colour, falling ash, and the hollow throne with six oath-flames.
- **Collectible:** six relic altars (`bellKind:'relic'`, each with `lord` and `w`). An altar refuses (`stats.relicRefused`) until whoever strikes it carries that lord's signature weapon; in co-op the host checks its own inventory. All six open the `th_vault` cage. Lore h2 explains it.
- Routes and secrets: high gallery by chain and a low crypt; hidden chests ch_t2/ch_t3; mimics ch_t4/ch_t6; lore h1–h3.
- **The Hollow Heir** (`heir`, 72 hp):
  - six-oath cinematic;
  - phases echo the earlier lords: p1 is the Castellan's volley, the Prioress's lash and a charge; p2 adds the Astronomer's gravity well, the Abbess's tide wave, the Castellan's gust and brambles; p3 adds comets, rot and rubble, plus the Prioress's rot rolling across the arena;
  - he perches on the throne loft.
- **Signature weapon:** HEIR'S HOLLOWBRAND (greatsword). Its 'echo' special fires a starlight ring and a piercing bolt together; each target is hit once, so isolated damage is within 0.7–1.3× FROSTBRAND.
- **New ending variant, USURP ('THE HOLLOW THRONE'):** the finale's victory offers CLAIM THE HOLLOW THRONE / RETURN TO THE ASH SHRINE / RETURN TO TITLE. Claiming plays the usurp ending, which is saved in `sv.endings` and synced to the guest. Rekindle and fade gain a throne line, and ending lines are filtered so variants without a line are fine.
- Story ties: keeper lines (sealed, open, slain) and lore h3 on the Heir learning every lord's art.
- Co-op: the host is authoritative for relics, chests, mimics, boss shots and the boss, and sends the ending to the guest. Echo-hall hazards run locally.
- Tests: `test/M.mjs` (26 checks). milestoneE's lore total counts the throne.

## Text readability pass (priority interrupt, before N)
- **Font:** "Vigil 5x7", an original mixed-case pixel font drawn for this game in code (no vendored font, so no licence or credit is needed). Caps are 7 rows, lowercase has 2-row descenders, the advance is 6 px, and glyphs are drawn as whole-pixel runs at integer scale (pixelArt + roundPixels, no blur). Large titles (sc ≥ 2) keep the classic 3x5 face.
- **Contrast:** all 1x text gets a 1px dark outline (one expanded rect per glyph run). Messages, pickups and the boss name sit on dark semi-transparent panels. Lore and keeper dialogue re-wrap to their panels; the dialogue box is taller.
- **Fewer all-caps blocks:** `nice()` turns all-caps strings into sentence case (or Title Case for short labels). Names (stages, lords, vigils, the keeper, classes), acronyms (HP, FP, LV, NG…) and key letters stay capitalised. The source strings are unchanged, so the Small size shows the old caps.
- **Longer on screen:** `say()` lasts `d + 1.2 + 0.03 s/char`, and pickup pops 1.6 s (was 0.9 s), rising only for the first 0.6 s.
- **TEXT SIZE option:** in the pause menu, press T (or tap the row) to switch Large/Small. It is saved in the save (`sv.textSize`) and in localStorage for the title screen.
- Applies to dialogue, the HUD, menus, boss names, pickups and story text.
- Shots: `screenshots/text/before|after/t01_dialogue … t06_story.png`. Tests: `test/textfix.mjs` (10 checks).

## r7 fixes (Tester r7 on e04a38e, 7.4/10)
**P1**
- **Unique stage plans.** Keep, Spire, Cloister and Throne now have their own part lists, lengths and arena positions:
  - Keep: 4000 px. Curtain wall, crypt, battlement gantry, gatehouse melee, siege ossuary + shortcut, breach tower, wind trench.
  - Spire: 4320 px. Comet tower, lens nave, star-chart melee, star gantry, crypt, orrery ossuary + shortcut, zenith tower, tide rampart.
  - Cloister: 3840 px. Crypt, spore walk, trellis colonnade, bramble ossuary + shortcut, belfry, trellis gantry over a rot bed, yard melee.
  - Throne: 4640 px. Every echo on the road.
  - Chests (loot.js), collectibles, cages, lore, items and hazard rectangles all moved per stage. Arena coordinates come from `def.arena` (the boss code's 3170/3300/3000 literals are now ARENA_L-relative).
- **Mimics rolled per save.** `mimicIds(sid, sv.seed)` keeps the authored count but draws from the visible chests. `?seed=N` pins the roll; seed 0 gives the authored set, which the G–M tests use. In co-op the host's seed rides in prog.
- **Main road:**
  - New templates: `lockfight` (a ground melee with full-height gates and two waves), `shortcut`, `windgap`, `gravwall` and `sporewalk`.
  - Every side stage (G–M) has two forced fights: a ground lockfight, plus the ossuary trial that the road now drops through.
  - The pre-boss **shortcut door** is barred from the bonfire side. You open its lever from the far side after the ossuary, and it stays open in `sv.shortcuts` (co-op: 'sc' message plus prog).
  - A hold-Right bot now stalls at the first melee (keep: x≈2000 after 30 s; arena at 3620).
- **Co-op runaway hollows.** In updateEnemies, a ground foe leaving range drops out of swing/wind with zero velocity. Swing/wind times out after 0.9 s, and a target that jumps more than 200 px in a frame forces a retarget (`stats.swingFix`).

**P2**
- **Specials.** `specialPower(wp)` uses the held weapon's own AR (0.5×AR), capped at 0.84× that weapon's light DPS. Each special costs at least 14 FP and has a 1.5 s cooldown (`P.spCd`).
- **Hazards:**
  - Wind pushes 1500 px/s² on the ground and 1100 px/s² airborne (about 2.5× before), so an idle hero drifts 40–60 px/s and a gust can blow you off a battlement plank.
  - Spores can kill below 25% HP, and being blighted blocks the flask.
  - Thorn hedges are solid 12 px bodies; touching one hurts and knocks you back for 0.3 s.
- **Usurp ending:** its own scene. The Hollow Throne sits on a dais, six coloured lord silhouettes kneel, and the ashen one climbs and takes the seat while a crown of ash kindles.

**P3**
- The Spire's tide zone is split around the gantry's hidden room, so it is no longer clamped near x1300.
- Altars accept only the **wielded** weapon (lore h2 says so).
- Catacomb warning posts: "LAVA BELOW - TAKE THE GANTRY" and "EMBER PITS BELOW".

**Other**
- The text pass's sentence case now keeps common words (ash, flame…) lowercase inside sentences unless they are part of a name.
- Tests: `test/r7fix.mjs` (17 checks). G–M now pin `seed=0`, reset `spCd` before scripted specials, and read positions from the defs. L's spore check now expects death below 25%, and M equips each relic's weapon.
- Shots: `screenshots/r7/before|after/` (the same spots in each stage, plus the catacomb low route and the usurp ending) and `screenshots/r7/after/r0x_*` from the test. Clip: `clips/r7.mp4`.

## Backgrounds pass (per-stage parallax)
- bg.js (BGART): code-drawn sky, far and near layers plus a screen-space ambient layer (depth -9.7) for cathedral, cinderdeep, belltower (peaks, snowstorm, swinging bells), catacomb/forge (lava falls, smoke, chimneys), drowned (caustics, sunken arches, coffins), keep (storm, lightning, banners), spire (nebulae, floating stones, planets), cloister (rotted trees, spores, stained glass) and throne (void, broken colossus). Ramparts keeps the original city.
- genTextures(scene, sx, pal, sid) swaps in the stage's art, and the stage update redraws the ambient layer.
- test/bgfix.mjs: 23 checks (per-layer md5 is unique across the 10 stages, ambient layer present, no page errors).
- Shots: screenshots/bg/before|after/<stage>.png, plus the grid at screenshots/bg/compare.png.
- bg pass 2 (Justin: "not strong enough"): every theme except ramparts gets a bold full-frame composition with no city layers. Cathedral: giant rose window and buttresses (violet). Cinderdeep: cavern teeth and magma glow (orange). Bell tower: moon, snow peaks, pines (icy blue). Forge: lava sea and chimneys (yellow-orange). Drowned: teal water, light shafts, kelp, arches. Keep: storm banks, lightning, red banners, rain (grey). Spire: nebulae, ringed planet, floating rocks. Cloister: three giant stained-glass windows over a garden arcade with rotted trees (green). Throne: purple void, rifts, and a giant broken colossus. Grids: screenshots/bg/compare.png (before/after) and compare_after.png.
