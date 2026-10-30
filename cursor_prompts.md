# Cursor Composer prompt sequence — Ashen Vigil
Open this folder in Cursor. Open Composer/Agent (Cmd/Ctrl+I). Paste one prompt at a time; run `python3 -m http.server 8000` in the terminal and test at http://localhost:8000 after each. Commit after each step.

**1 — Scaffold**
> @game_design.md @assets/README.md Read both fully. Scaffold the folder structure from §2 using plain ES modules and Phaser 3.80.1 from CDN (§1). Keep the existing index.html test scene as `src/scenes/TestScene.js`, add Boot (loads every asset exactly as listed in assets/README.md with correct frameWidth/frameHeight and creates all animations from the frame indices) and Title (shows assets/cover.png, "PRESS START"). Config: 320x180, pixelArt, roundPixels, Scale.FIT, zoom 4, arcade gravity 900. No gameplay yet.

**2 — Player controller**
> @game_design.md Implement src/entities/Player.js and src/systems/Input.js using EXACTLY the constants in §3 and controls in §5: accel/decel, variable jump, coyote time, jump buffer, fall gravity multiplier, roll with i-frame window and equip-load tiers, stamina regen/costs. Put constants in src/data/constants.js. Animations: idle/run/jump/fall/roll from player.png.

**3 — Stage + camera (vertical slice map)**
> @game_design.md @assets/README.md Build stage 6.1 Ashen Ramparts rooms R1–R3 as a JS tile array in src/data/stages/ramparts.js using tiles_stone.png indices (collide/one-way/hazard per README). Implement Camera.js per §4: room bounds, Mega Man screen transitions, deadzone, look-ahead. Add 3-layer parallax from bg_stone_*.

**4 — Combat core + VFX pool**
> @game_design.md Implement light attack hitboxes, buster pellet and hold-to-charge plasma shot. Create src/vfx/Particles.js (pooled, pixel-snapped, palette ramps) and effects charged plasma orb + hit sparks exactly as §19 describes, and Juice.js (hit-stop, shake values from §19). Add a /vfx-lab scene (press F9) that shows 3 variants of each effect side by side.

**5 — Enemies, souls, bonfire, death**
> @game_design.md Implement Enemy.js base FSM (§7) and Hollow Footman. Souls drop with death-burst VFX homing to player. Bonfire object (bonfire.png anim, embers) with rest menu (§15). Death → "YOU FELL", respawn, soul remnant recovery (§14). HUD scene (§20). This completes M1 — make it fully playable.

**6 — Defense & depth (M2)**
> @game_design.md Add heavy attacks, block, parry window by shield, stagger + riposte, crossbowman, landing/roll dust VFX.

**7 — RPG systems (M3)**
> @game_design.md Create src/data/classes.js (all 8 classes §9), Stats.js (derived stats + level cost formula §10, unit-test it in a console check), weapons/armor/shields data (§11) with AR formula, ClassSelect scene, Shrine level-up UI, Equipment menu.

**8 — Boss + cinematic + saves (M4)**
> @game_design.md Implement Cinematics.js intro (§8 steps & timings, letterbox, pan, entrance, name card, once per save, skippable) and The Hollow Seneschal with 3 phases. Implement Save.js (§16) with 3 slots on the title screen, autosave triggers, delete with confirm.

**9 — Magic, merchant, smith (M5)**
> @game_design.md Implement catalysts (staff vs wand rules), FP, all 10 spells in §12 with cast VFX per §19.6 and freeze burst §19.2, attunement, Azure flask, Merchant and Smith (§13).

**10 — Frozen cathedral (M6)**
> @game_design.md @assets/README.md Build stage 6.2 with tiles_frozen + bg_frozen_*, ice friction, falling icicles, frostbite, Choir Wraith + Bell Knight, boss Vaelith (boss_frostwarden.png) with intro + phases.

**11 — Cinderdeep (M7)**
> @game_design.md Build stage 6.3 with tiles_burning + bg_burning_*, lava, vents, collapsing bridges, dark catacombs light radius, Cinder Imp + Kiln Hound, fire VFX §19.3, boss Orsk (recolour boss sheet or draw procedurally) with intro + phases.

**12 — Co-op (M8)**
> @game_design.md Implement Net.js host-and-join co-op exactly per §17 with PeerJS CDN: room codes, host-authoritative snapshots, input messages, interpolation, phantom rules. Add "Open World"/"Join World" to the menu. Test with two browser tabs.

**13 — Story & ending (M9)**
> @game_design.md Write src/data/text.js with original item lore and NPC dialogue per §18, Hearth Shrine hub scene, final stage and Unkindled Sovereign, ending choice scenes.

**14 — Polish (M10)**
> Wire all sfx from assets/audio (see CREDITS.md), add music if present, gamepad support, pause menu, settings (volume, screen shake toggle). Profile and keep 60 fps. Fix any console errors.

Debug tip: select broken code → Cmd/Ctrl+K → "fix collision / camera per game_design.md §3/§4". Paste console errors back into Composer.
