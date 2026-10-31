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
