# PixelFX (vendored subset)

Source: https://github.com/patch-gg/pixelfx — MIT License, Copyright (c) 2026 Patch, Copyright (c) 2026 Hugo Duprez (see LICENSE).

Vendored here: `src/core/` and 7 effects (projectiles/muzzle-pistol, projectiles/muzzle-shotgun, impacts/hit-spark,
explosions/small-explosion, ice/snowflake-burst, explosions/plasma-explosion, arcane/mana-burst (used only by the window.ArsFX.burst helper)) plus their category
`_lib.js` helpers, unmodified. Ashen Vigil bakes them at runtime into Phaser sprite sheets recolored to each stage's
palette (assets/fx/arsfx.mjs, loaded by arsenal.js).

Upstream notices that apply to these files: `src/core/sim.js` and effects that say so adapt Sprite Fusion's open-source
pixel art VFX (https://www.spritefusion.com/pixel-art-vfx), Copyright (c) 2026 Hugo Duprez, MIT License.
`src/core/act.js` adapts Hollow Crown (https://github.com/rehan-remade/hollow-crown), Copyright (c) 2026 rehan-remade,
MIT License.

The Patch Pixel font (upstream `gallery/fonts`) is NOT MIT and is NOT included or used.
