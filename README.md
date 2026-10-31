# Ashen Vigil

Pixel-art side-scroller built with Phaser 3. It's a static build: open `index.html` or serve the folder (GitHub Pages works).

## Controls

You can play with the keyboard or an **Xbox controller**. Other pads that use the standard Gamepad mapping work too. Press any button to wake the controller.

| Action | Xbox pad | Keyboard |
|---|---|---|
| Move / menus | Stick / D-pad | Arrows or WASD |
| Jump / confirm / advance dialogue | A | Space or Z (Enter in menus) |
| Weapon: tap light, hold heavy | X (Y = heavy) | X or J (hold to charge heavy) |
| Magic: cast the selected spell | RB (storm), LT frost, RT dome | C or K |
| Next spell | (coming with the spell system) | Q |
| Dodge roll / back | B | Shift or L |
| Parry (tap) / shield guard (hold, needs a shield in the left hand) | LB | V or U |
| Throw the selected throwable / next throwable | D-pad Down tap / D-pad Down hold | G / T |
| Gun: tap fire, hold reload (rune pistol: hold switches element) | X (Y = reload) | X or J |
| Drink flask | View | F or R |
| Interact (rest, talk, open, pull, read, enter) | A when a prompt shows, or Up | E (or Up arrow) |
| Inventory / equipment | (bonfire menu) | Tab or I |
| Pause | Start | Esc or P |

**Touch:** the on-screen pad adds **THR** (throw), **GRD** (hold to guard with a shield) and **RLD** (reload the gun) beside the attack buttons.

**Arsenal art:** pixel art for the arsenal weapons, shields, throwables and gun effects is on by default; add `?arsart=0` to the URL (or set localStorage `ashenVigil.arsArt` to `0`) to fall back to the placeholder drawings.

**Smith infusions:** at the smith, select a weapon and press Right (D-pad Right) to infuse it (heavy/sharp: 1 Ember Shard + 1000 souls; fire/frost/lightning: 2 + 2000; dark/holy: 3 + 3000).

**Context A:** when you stand on the ground next to something usable (bonfire, the Ash Keeper, a chest, a lever, a lore stone, a door/gate/lift/stair), an on-screen prompt shows the button (`A Rest`, `A Talk`, `A Open`; a boxed E key glyph without a pad) and A uses it instead of jumping. Step away to jump; D-pad Up always interacts and never jumps. Loot is picked up by walking over it.

## Foreground autotiles
`autotile.js` adds render-only edges, corners, variants and decor on top of the `tiles.js` materials, with 47 blob frames per stage. Collision is unchanged. `?tiles=0` turns it off. To add Artist PNG atlases, put them in `assets/art/tiles/<stage>/` with a `manifest.json` and list the stage in `assets/art/tiles/index.json`. See `test/tiles.mjs`.

## Credits

Combat effects (muzzle flashes, impacts, explosions, elemental infusion hits) use a vendored subset of
[PixelFX](https://github.com/patch-gg/pixelfx) by Patch and Hugo Duprez, MIT License. Its license and notices are in
`assets/fx/pixelfx/LICENSE` and `assets/fx/pixelfx/NOTICE.md`. The Patch Pixel font is not used. Add `?pfx=0` to the URL to
fall back to the older drawn effects.

### ArsFX helper (for spell code and anything else)

`arsenal.js` exposes `window.ArsFX`, which draws PixelFX effects into the running stage, recolored with the stage tint. When
PixelFX is off (`?pfx=0`) or still loading, it falls back to the game's own spark particles.

- `ArsFX.impact(x, y, color?, o?)`: a hit spark (0.4 s).
- `ArsFX.explosion(x, y, kind = 'fire', color?, o?)`: `kind` is `'fire'` (blast), `'frost'` (snow burst) or `'lightning'` (plasma). `y` is the floor.
- `ArsFX.burst(x, y, color?, o?)`: an arcane mana burst (0.7 s), for example a cast flash.
- `ArsFX.ready()` / `ArsFX.on()`: whether PixelFX is loaded / enabled.

`color` is an element or school name (`fire`, `frost`, `lightning`, `dark`, `holy`, `arcane`), a `'#rrggbb'` string or a
`0xRRGGBB` number. Leave it out to use the effect's own palette. `o` is `{ f: 1 | -1, scale, depth }`. Each call returns the
sprite, or `null` when the fallback drew instead. Spells don't use it yet: spell effects are Video Games' code.

## Arsenal r10 notes (Tester r17/r18)

- **Merchants:** one scrollable shop screen for the wandering merchant and the spell merchant (bonfire and shrine pedlar): keys / D-pad, mouse wheel, click-drag and touch drag; details panel; prices with currency; unaffordable rows dimmed.
- **Combat fixes:** a light chain waits until the current swing's hit window has resolved, and the lunge stops at the foe (the Ashmaul and Clapper now connect); STR boss-weapon bases spread; guard stamina regen 30% (none after 2 s of held guard); every boss attack chips 25% through a 100% shield and costs >= 40% stamina to block.
- **Drops:** a landed drop drifts to an idle player within 16 px.
- **Regen rings** (wandering merchant, every stage from the Ramparts on): SECOND WIND RING 1600 (+35% stamina regen, stamina returns 30% sooner), DEEP WELL RING 1800 (+75% FP regen), MENDING EMBER RING 2200 (0.8 HP/s). Icons are placeholders until the Artist draws them. Tests: `node test/arsgui.mjs`.
- **Inventory any time:** I or Tab (keyboard), View/Select (pad) opens and closes the inventory. Solo pauses the world; in co-op the world keeps running and your character takes no input. Equip changes apply at once. The pad flask moved to D-pad Up (listed in the pause controls).
