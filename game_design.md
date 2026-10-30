# ASHEN VIGIL — Game Design Document
2D side-scrolling pixel-art action platformer (run-and-gun + souls-like melee). All names, art, text and audio are original.

## 1. Tech stack
- Phaser 3.80.x via CDN: `https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js`. Plain ES modules (`<script type="module">`), no bundler.
- Internal resolution 320x180, `pixelArt:true`, `roundPixels:true`, `Scale.FIT` + `CENTER_BOTH`, integer zoom 4 (CSS `image-rendering:pixelated`).
- Arcade physics, gravity y=900 px/s². Fixed step 60 Hz.
- Tilemaps: Tiled JSON (or JS 2D arrays in `src/data/stages/*.js` for the slice), 16x16 tiles from `assets/tiles/`.
- Co-op: PeerJS 1.5 via CDN (`https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js`).
- Save: `localStorage`. Run with `python3 -m http.server 8000`.

## 2. Folder structure
```
index.html            boot + scene list
src/main.js           Phaser config
src/scenes/  Boot, Title, ClassSelect, Stage, Hud (parallel), Pause/Menu, Shrine (level-up), Shop, Cinematic, GameOver, Ending
src/entities/ Player.js, Enemy.js (base + FSM), enemies/*.js, bosses/*.js, Projectile.js, Pickup.js
src/systems/  Input.js, Stats.js, Inventory.js, Combat.js (hitboxes, damage, poise, hitstop), Save.js, Net.js, Camera.js, Cinematics.js
src/vfx/      Particles.js (pool), effects/*.js (one file per effect), Juice.js (shake, hitstop, flash)
src/data/     classes.js, weapons.js, armor.js, spells.js, enemies.js, bosses.js, stages/*.js, text.js (story & item lore)
assets/       see assets/README.md
```

## 3. Player physics constants (px, s)
| Const | Value | Notes |
|---|---|---|
| RUN_SPEED | 110 | max horizontal |
| ACCEL_GROUND / DECEL_GROUND | 900 / 1200 | snappy, Mega Man feel |
| ACCEL_AIR | 600 | |
| GRAVITY | 900 | FALL_GRAVITY_MULT 1.6 when vy>0; MAX_FALL 320 |
| JUMP_VELOCITY | -270 | ~40 px apex; release early → vy*=0.45 (variable jump) |
| COYOTE_TIME | 0.10 | after leaving ledge |
| JUMP_BUFFER | 0.12 | press before landing |
| ROLL_SPEED / ROLL_TIME | 180 / 0.40 | I-FRAMES 0.08–0.30 of roll (light load); medium 0.10–0.26; heavy (>70% equip load) ROLL_SPEED 130, i-frames 0.12–0.22 |
| STAMINA_MAX | 80 + 2*END | regen 45/s after 0.6 s delay; 15/s while blocking |
| Stamina costs | roll 20, jump 0, light 14 (weapon-dependent), heavy 28, block hit = dmg*0.5*(1-stability), parry 12, sprint 12/s | at 0 stamina: no roll, guard break on block |
| HURT_KNOCKBACK | 120 x, -140 y; invuln 0.6 s | |
| HITBOX | body 10x22, offset (11,8) on 32x32 frame | |

## 4. Camera
- Horizontal follow, lerp 0.12, vertical lerp 0 within a room (Mega Man rooms), deadzone 40x180 centered.
- Rooms: each stage is a sequence of rooms (Tiled object layer `rooms`, rects). Camera bounds = current room rect. Crossing into a new room: freeze 0.35 s, tween scroll to new bounds (Mega Man screen transition), enemies of the old room despawn.
- Vertical rooms (shafts) switch to vertical follow. Boss rooms lock (gates close) and camera fixed.
- Look-ahead: offset 24 px toward facing, eased 0.3 s.

## 5. Controls (keyboard and Xbox controller; button map in README.md)
| Action | Keys | Pad |
|---|---|---|
| Move | ←/→ or A/D; ↑/↓ or W/S aim & ladders | stick/dpad |
| Jump | Z / Space | A |
| Light attack | X / J | X |
| Heavy attack | hold X 0.35 s or K | RB |
| Shot / charged shot | C / L (tap = pellet, hold ≥0.9 s = charged plasma orb) | Y |
| Roll | Shift / I | B |
| Block / parry | V / O (hold block; tap within 6 frames of hit = parry) | LB |
| Cast spell | F / U (needs catalyst) ; Q cycle spell | RT / dpad up |
| Flask | R / H | dpad down |
| Interact (bonfire, NPC, loot) | E / ↑ | A near prompt |
| Menu / pause | Esc / Enter | Start |

## 6. Stages (gothic; each = 6–9 rooms, 1 bonfire mid, 1 at boss door)
### 6.1 The Ashen Ramparts (stone) — tutorial / vertical slice. Tiles `tiles_stone.png`, bg `bg_stone_*`.
Layout: R1 flat run with hollows (teach attack), R2 broken walkway, one-way platforms (tile 6) over spike pit (tile 8), R3 bonfire "Gate Vigil", R4 tower shaft (vertical room, ladders), R5 crossbow hollow gallery, R6 boss door (fog wall object). Boss: **The Hollow Seneschal** (reuse boss sheet tinted stone).
### 6.2 Cathedral of the Pale Choir (frozen). Tiles `tiles_frozen.png`, bg `bg_frozen_*`.
Ice floors (ground friction 0.3 → decel 300), icicles fall when player passes beneath (tile 8 on ceilings, trigger zone 24px), frostbite buildup bar (cold zones +8/s; full = 15% max HP dmg, stamina regen -50% for 10 s; warm near braziers). Wraiths float in nave rooms. Boss: **Vaelith, Warden of the Frost Bell** (`boss_frostwarden.png`).
### 6.3 Cinderdeep — the Burning City & Catacombs (burning). Tiles `tiles_burning.png`, bg `bg_burning_*`.
Lava pools (instant death, tile 8 animated), collapsing bridges (fall 0.5 s after stepping), fire vents cycle 2 s on/2 s off, catacomb rooms dark (light radius 64 around player, ember torches). Cinder imps hop & burst. Boss: **Orsk, the Kiln That Walks**.
### 6.4 (stretch) The Last Hearth — final stage + final boss **The Unkindled Sovereign**.
Tiled layers per stage: `bg_deco`, `ground` (collide), `oneway`, `hazard`, `fg_deco`, objects: `rooms`, `spawns` (type, x, y, props), `bonfires`, `loot`, `npc`, `doors`, `boss_trigger`.

## 7. Enemies (FSM in Enemy.js: IDLE → PATROL → NOTICE(0.4 s "!") → CHASE → WINDUP → ATTACK → RECOVER → back; any → STAGGER (poise broken) → any → DEAD (drop souls))
| Enemy | Stage | HP | Dmg | Souls | Behaviour |
|---|---|---|---|---|---|
| Hollow Footman | stone | 40 | 12 | 30 | patrol ledge, aggro 96px, windup 0.5 s, sword lunge 40px; poise 20 |
| Hollow Crossbowman | stone | 30 | 10 | 40 | keeps 120px distance, fires bolt every 2.2 s |
| Choir Wraith | frozen | 35 | 14 | 60 | flies sine path, casts ice shard (3 spread) at 140px; phases through walls; weak to fire x1.5 |
| Bell Knight | frozen | 120 | 22 | 150 | shielded front (blocks shots), must roll behind or guard-break with heavy |
| Cinder Imp | burning | 25 | 16 | 50 | hops toward player, at 24px self-ignites (0.6 s telegraph flash) and explodes radius 28 |
| Kiln Hound | burning | 60 | 18 | 90 | charge dash across room, leaves fire trail 1.5 s |
Enemies respawn when resting at a bonfire (bosses never).

## 8. Bosses (each: health bar at bottom with name, room locks, souls reward, unique item)
Intro cinematic (Cinematic.js, plays once per save; flag `save.seenIntro[bossId]`; any key skips):
1. 0.0 s letterbox bars tween in (24px each, 0.4 s, Sine.easeOut), player input locked, music cuts.
2. 0.4 s camera pans from player to boss anchor (1.2 s, Cubic.easeInOut).
3. 1.6 s entrance (boss-specific: drops from ceiling + shake 0.3 s/0.012; rises from ice; bursts out of kiln), 1.0 s.
4. 2.6 s name card: large title + subtitle fades in 0.3 s, holds 1.4 s, line underline grows; boss music starts.
5. 4.3 s pan back 0.6 s, bars out, fight starts. Retries skip straight to step 5 with 0.5 s bars.
| Boss | HP | Phase 1 | Phase 2 (≤60%) | Phase 3 (≤25%) | Reward |
|---|---|---|---|---|---|
| The Hollow Seneschal | 600 | 3-hit halberd combo, jump slam | adds sweep + summons 2 hollows | enraged, faster windups (-30%) | Seneschal Soul, Gate key |
| Vaelith, Warden of the Frost Bell | 900 | bell toll shockwave (jump it), ice lances | floor freezes (slippery), wraith summons | bell shatters → blizzard: arena-wide frostbite, homing shards | Frost Bell Soul → Rime Staff |
| Orsk, the Kiln That Walks | 1100 | furnace breath cone, slam | arena edges become lava, fireball rain | core exposed (weak point x2), explosive charge | Kiln Soul → Cinder Greataxe |
Boss AI: weighted attack table per phase, no repeat >2 times, always telegraph ≥0.35 s with flash + windup frame. Phase transition: hitstop 0.2 s, white flash, roar, shake.

## 9. Classes (start level, VIG/END/VIT/STR/DEX/INT/FTH/LCK, gear)
| Class | Lv | VIG | END | VIT | STR | DEX | INT | FTH | LCK | Gear |
|---|---|---|---|---|---|---|---|---|---|---|
| Sentinel (knight) | 9 | 12 | 10 | 11 | 13 | 12 | 9 | 9 | 7 | longsword, kite shield, plate set |
| Brute (warrior) | 7 | 14 | 11 | 12 | 16 | 9 | 8 | 9 | 11 | battle axe, round shield |
| Cutpurse (thief) | 5 | 10 | 11 | 10 | 9 | 14 | 10 | 8 | 14 | dagger, buckler, shortbow |
| Ashwright (sorcerer) | 6 | 9 | 9 | 7 | 7 | 12 | 16 | 7 | 12 | dagger, Ember Wand, Soul Bolt |
| Lampbearer (cleric) | 7 | 10 | 9 | 12 | 12 | 8 | 7 | 16 | 13 | mace, lamp talisman, Mend |
| Vagrant (deprived) | 1 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | club, plank shield |
| Pyre Witch (pyromancer) | 8 | 11 | 12 | 10 | 12 | 9 | 14 | 14 | 9 | hand axe, Cinder Flame |
| Gunwarden (marksman — the buster class) | 6 | 11 | 12 | 9 | 9 | 15 | 11 | 8 | 10 | Vigil Cannon (arm buster), short sword |
Every class has the arm buster (pellet + charged shot); Gunwarden's scales best.

## 10. Stats & leveling
VIG → HP = 300 + 25*VIG (diminishing after 40: +10). END → stamina (80+2*END). VIT → equip load 40+1.5*VIT. STR/DEX → weapon scaling, req. INT → sorcery dmg & FP max (FP = 50 + 4*INT/2 + 3*FTH/2). FTH → miracles/pyromancy. LCK → item discovery, bleed.
**Level-up cost (souls) for going from level L to L+1:** `cost(L) = max( round(0.02*L^3 + 3.06*L^2 + 105.6*L - 895), 200 + 12*L )`. Examples: L1→2 = 212, L5→6 = 260, L10→11 = 487, L20→21 = 2601, L40→41 = 9505 (monotonic). Level at the Shrine (keeper NPC "Sister Ember") or any bonfire after the first boss.

## 11. Weapons, armor, shields, parry
Weapon data: `{id,name,type,dmg:{phys,fire,frost,magic},scale:{str,dex,int,fth} (letters E–S → 0.2..1.4),req,stamina:{light,heavy},speed,range,poiseDmg,upgrade:0..5}`. AR = base*(1+0.1*upgrade) + Σ base*scale*statCurve(stat) (statCurve: linear to 20 →0.5, to 40 →0.9, cap 1.0). Below req: -40% dmg.
Types: dagger (fast, 10 stam, crit backstab x3), straight sword, greatsword (slow, 0.6 s windup, hyperarmor on heavy), spear (long range, block while poking), axe, mace (strike, vs. armored), bow (hold to draw, arrows), arm buster (pellet 8 dmg, charged 40+DEX scale). Upgrades at the Smith with Ember Shards (+1..+3) and Great Ember Shards (+4..+5): cost souls 500*(lvl+1).
Armor: slots head/chest/hands/legs: `{phys,fire,frost,magic absorption %, poise, weight}`. Load ratio weight/equipLoad: <30% light, <70% medium, ≥100% overloaded (no roll, walk). Sets: Sentinel Plate, Ashen Rags, Pale Choir Robe (frost res), Kiln Iron (fire res, heavy).
Shields: `{absorb phys %, stability 0–100, parryWindow frames}`; buckler 8f, round 6f, kite 4f (greatshield cannot parry). Parry success → enemy enters STAGGER 1.5 s, next light attack = riposte x4 dmg, sfx_parry + white ring VFX.

## 12. Catalysts & spells (FP)
Staffs: +20% spell dmg, cast time 0.5 s, two-handed (no shield). Wands: -15% dmg, cast 0.25 s, offhand with a weapon. Talismans for faith.
| Spell | School | FP | Req | Effect |
|---|---|---|---|---|
| Soul Bolt | sorcery | 6 | INT 10 | fast bolt 30 dmg |
| Seeking Motes | sorcery | 12 | INT 14 | 3 orbs orbit 1 s then home |
| Crystal Lance | sorcery | 20 | INT 22 | piercing spear, 90 dmg |
| Rime Burst | sorcery | 18 | INT 18 | freeze burst radius 40, frostbite +60 |
| Gleaming Edge | sorcery | 15 | INT 16 | weapon buff +30 magic, 30 s |
| Cinder Flame | pyromancy | 8 | INT 8 FTH 8 | short flame burst |
| Ember Orb | pyromancy | 14 | INT 12 FTH 12 | arcing fireball, splash |
| Mend | miracle | 25 | FTH 12 | heal 40% |
| Ward Hymn | miracle | 20 | FTH 16 | -30% dmg taken 20 s |
| Lantern Ward | miracle | 10 | FTH 10 | repel shockwave, knockback |
Ashen Flask: 3 charges (+1 per upgrade), heals 40% over 0.5 s, refilled at bonfires. Azure Flask restores FP (split charges at Shrine).

## 13. Merchant & Smith (Shrine hub)
- **Merchant "Old Corlath"**: sells Soul Bolt 1000, Seeking Motes 3000, Ember Wand 2500, arrows 10/ea, Ember Shards 800 (limit 4). Inventory expands after each boss.
- **Smith "Hallen the Anvil"**: upgrade weapons, reinforce flask, infuse (frost/fire with boss souls).

## 14. Souls, death & recovery
Souls are currency + XP. On death: "YOU FELL" (fade 1.5 s), respawn at last bonfire with 0 souls; a **soul remnant** (glowing teal wisp, pulsing) is placed at the last safe ground position. Touch it to reclaim. Die again before reclaim → lost forever. Enemies reset.

## 15. Bonfires ("Vigil Flames")
Interact → "VIGIL KINDLED" banner. Resting: refill HP/FP/flask, respawn enemies, save. Menu: Level up (if Shrine unlocked), Travel (between kindled vigils), Attune spells (slots = 1 + INT/15), Leave. Animated `bonfire.png` 8 fps + ember particles.

## 16. Saves (localStorage)
Keys `ashenvigil.slot1..3`, JSON `{version:1, class, level, stats, souls, remnant:{stage,x,y,amount}|null, inventory, equipped, flasks, lastVigil:{stage,id}, kindled:[], bossesDefeated:[], seenIntro:{}, flags:{}, playtimeSec, updatedAt}`. Autosave on rest, boss kill, item pickup, stage change (debounced 1 s). Title shows 3 slots (class, level, location, playtime) + delete with confirm. Validate version on load; migrate.

## 17. Co-op (host-and-join, PeerJS)
- Host: Menu → "Open World" → `new Peer('ashen-'+code)` where code = 5 uppercase chars; show code. Joiner: "Join World" → enter code → `peer.connect('ashen-'+code)`.
- Host is authoritative: runs enemies/bosses/physics; sends snapshots 15 Hz `{t, enemies:[id,x,y,state,hp,flip,frame], players:[...] }`; joiner sends inputs 30 Hz `{seq, keys bitmask, aim}` plus its own predicted position (host trusts client movement, validates speed). Joiner interpolates remote entities with 100 ms buffer.
- Joiner is a "Phantom" (tinted soul-teal outline), gets souls from kills, cannot rest/level in host world; if phantom dies it returns home. Boss HP x1.5 with 2 players. Max 2–4 players.
- Events reliable channel: hit, death, bossPhase, cinematicSkip, loot. Disconnect → phantom fades.

## 18. Story — "The Last Vigil"
The world's First Flame is guttering. Long ago, the **Lords of Cinder** — the Seneschal of the Ramparts, Vaelith of the Frost Bell and Orsk of the Kiln — swore to burn themselves as kindling when the flame waned. They broke their vow and hid in their crumbling domains. You are an **Ashen Vigil**: a dead watchman raised from the grave-ash to hunt the oathbreakers and carry their embers back to the **Hearth Shrine**, where **Sister Ember**, the keeper, tends what remains.
Tone: cryptic, melancholic; lore lives in item descriptions (`text.js`) and short NPC lines. Each Lord's soul reveals why they fled (fear, love, hunger).
Final stage: The Last Hearth, boss **The Unkindled Sovereign** (the first Vigil, who failed). **Ending choice** at the dying flame: **Rekindle** (sacrifice yourself; world endures, cycle continues; golden fade) or **Let It Fade** (walk into darkness with Sister Ember holding a single ember; new age of dark; cold blue fade). Secret third: carry the ember-thread from Sister Ember's questline → **Kindle a New Flame** (bittersweet).

## 19. VFX — code-drawn pixel effects
Approach (after Hugo Duprez, "How to make good pixel art effects with Claude", https://www.spritefusion.com/blog/how-to-make-good-pixel-art-effects-with-claude/): **every effect is drawn procedurally in code** (no effect sprite sheets), built from tiny pixel particles and shapes on the 320x180 grid, then iterated: make 3–4 variants of each effect side by side in a `/vfx-lab` scene, pick the best, refine timing until the motion reads well. Rules:
- Snap all positions to integer pixels; no anti-aliasing; draw with `Graphics.fillRect` 1x1/2x2 or a 1px particle texture generated at boot (`make.graphics → generateTexture('px',1,1)`).
- Use the limited palette (assets palette: ember0–3, ice0–3, soul, plasma, bone, void). Colour = function of particle life: hot → cool ramp (e.g. ember3 → ember2 → ember1 → ember0 → gone). Never fade with alpha on pixel art; step down the ramp instead (alpha only in last 2 frames, or dithered).
- Strong anticipation + fast release + long settle: windup 4–8 frames, burst 1–3 frames, decay 10–30 frames. Ease-out (Cubic/Expo.out) for expansion, ease-in for collapse. Animate at 30 fps steps (update visuals every 2 frames) for chunkier pixel motion.
- Layering: core (bright, small), glow ring (1 colour darker, larger, flickers), debris (particles with gravity/drag), afterimage/trail.
- Particle pool (`vfx/Particles.js`): preallocated 1024 particles `{x,y,vx,vy,life,max,ramp,size,grav,drag}`, drawn into one Graphics each frame (clear+redraw). API: `vfx.burst(type, x, y, opts)`.
Effects (each in `src/vfx/effects/`):
1. **Charged plasma orb** — charging: pixels spiral inward to the buster (radius 14→2, 3 per frame), core grows 2→6 px pulsing 8 Hz, colour plasma→ice3 at full charge + white flash frame + sfx_charge. Projectile: 8 px core with 1 px ice3 rim, 3-frame afterimage trail stepping down ice ramp, sparkle pixels shed 2/frame. Impact: ring expanding 2→18 px in 6 frames (Expo.out), 12 shards.
2. **Freeze burst** — 0.1 s white pre-flash, then 8 radial ice crystals (lines growing 0→12 px, ice3 tip/ice1 base), hexagonal ring, then frost motes drifting up with drag 0.92, crystals shatter at end into 20 pixels falling with gravity 300.
3. **Fire** — flame column: particles spawn at base with vy -40..-70, horizontal jitter ±10, life 0.3–0.6 s, ramp ember3→ember0, size 2→1; sparse embers that rise and flicker; heat-shimmer optional. Torches/lava/vents/Orsk reuse with params.
4. **Hit sparks** — 4–6 pixels in a cone opposite to hit direction, speed 120–200, life 6–10 frames, plus a 1-frame white "impact star" (3 px cross). Crit/riposte: larger cross + 2 rings.
5. **Death bursts** — enemy: flash white 2 frames, dissolve into soul-teal pixels that drift then home to player (souls pickup, sfx_souls). Boss: 1 s slow-mo (timeScale 0.3), concentric rings, 200 particles, screen-wide flash, "LORD OF CINDER FELLED" banner.
6. **Spell casts** — catalyst glow circle (rune ring of 8 pixels rotating) during cast time, release flash; Soul Bolt = soul-teal tadpole with 4-px trail; Crystal Lance = elongated diamond with shard trail; Mend = rising golden motes.
7. Others: roll dust puffs, landing dust, parry ring (white, 1 frame + expanding ring), bonfire embers, soul remnant wisp, snow and ash weather layers.
**Juice:** hit-stop: light 50 ms, heavy 90 ms, parry/riposte 150 ms, boss phase 200 ms (pause physics + anims, keep VFX ticking). Screen shake: light hit 80 ms/0.003, heavy 150 ms/0.006, boss slam 300 ms/0.012 (decaying). Damage flash: tint white 2 frames. Damage numbers optional (off by default).

## 20. HUD
Top-left: HP bar (red), FP bar (blue), stamina bar (green) using `assets/ui/bar_*` cropped to value; trailing "damage ghost" bar shrinks after 0.5 s. Bottom-left: equipped spell/weapon icons, flask icon + count. Bottom-right: souls icon + count (rolls up). Boss bar bottom-centre with name.

## 21. Build-order milestones
1. **M1 Vertical slice** (Ashen Ramparts R1–R3 + Hollow Footman + bonfire): player movement with all physics constants, camera rooms, light attack, buster pellet + charged shot with VFX, roll with i-frames, stamina, HP, death & respawn at bonfire, souls drop/recovery, HUD. Playable in browser.
2. **M2 Combat depth**: heavy attacks, block/parry/riposte, hit-stop & shake, enemy FSM base + crossbowman, VFX lab scene.
3. **M3 RPG systems**: class select (8), stats, level-up at Shrine with formula, weapons/armor/shields data, equip load → roll tiers, inventory/equip menu.
4. **M4 First boss** (Seneschal) with intro cinematic (once per save, skippable) and 3 phases; Save system with 3 localStorage slots.
5. **M5 Magic**: catalysts, FP, 10 spells, attunement, merchant & smith, upgrades.
6. **M6 Frozen cathedral** + Vaelith + frostbite; **M7 Cinderdeep** + Orsk + lava/fire hazards.
7. **M8 Co-op** host-and-join via PeerJS.
8. **M9 Story & ending**: Shrine hub NPCs, item lore, final stage, Sovereign, ending choice. **M10** polish, audio mix, gamepad, performance.
