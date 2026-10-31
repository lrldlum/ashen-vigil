// Ashen Vigil: PixelFX (MIT, assets/fx/pixelfx) baked into small sprite strips, recolored per stage palette.
// Loaded by arsenal.js with import(); every effect is rendered once per (effect, palette, stage tint) and cached as a Phaser texture.
import { createFrame, clearFrame, createFx, composite, PAL, hex, mix, toHex } from './pixelfx/src/core/index.js';
import * as muzzlePistol from './pixelfx/src/fx/projectiles/muzzle-pistol.js';
import * as muzzleShotgun from './pixelfx/src/fx/projectiles/muzzle-shotgun.js';
import * as hitSpark from './pixelfx/src/fx/impacts/hit-spark.js';
import * as smallExplosion from './pixelfx/src/fx/explosions/small-explosion.js';
import * as snowBurst from './pixelfx/src/fx/ice/snowflake-burst.js';
import * as plasmaExplosion from './pixelfx/src/fx/explosions/plasma-explosion.js';
import * as manaBurst from './pixelfx/src/fx/arcane/mana-burst.js';
// dur: seconds kept (long smoke tails trimmed for perf); fps: bake rate; opts: effect knobs
export const EFFECTS = {
  muzzle: { mod: muzzlePistol, dur: .3, fps: 24, opts: { height: 0 } },
  muzzleBig: { mod: muzzleShotgun, dur: .4, fps: 24, opts: { height: 0 } },
  spark: { mod: hitSpark, dur: .4, fps: 24, opts: { height: 0 } },
  boom: { mod: smallExplosion, dur: 1.1, fps: 18, opts: { size: .6 } },
  snow: { mod: snowBurst, dur: 1.0, fps: 18, opts: { count: 7 } },
  plasma: { mod: plasmaExplosion, dur: .9, fps: 18, opts: {} },
  mana: { mod: manaBurst, dur: .7, fps: 20, opts: {} },
};
// element / school ramps (dark to bright) from PixelFX's PAL
export const RAMPS = { fire: PAL.fire, frost: PAL.ice, lightning: PAL.electric, dark: PAL.shadow, holy: PAL.holy, arcane: PAL.arcane };
// stage tints: each ramp is pulled toward the stage's light colour (whites stay white) so effects sit in the scene
export const THEME = { ramparts: '#b8b0ff', cathedral: '#ffe2b0', cinderdeep: '#ff7a3a', shrine: '#ffd27a', belltower: '#a8e0ff', catacomb: '#ff9a50',
  drowned: '#6ad0c0', keep: '#c8c0d8', spire: '#c8a8ff', cloister: '#a8d070', throne: '#d8a0ff' };
export function recolor(ramp, theme, k = .28) {
  const t = THEME[theme]; if (!t || !ramp) return ramp;
  const T = hex(t);
  return ramp.map((c, i) => i === ramp.length - 1 ? c : toHex(mix(hex(c), T, k * (0.5 + 0.5 * i / ramp.length))));
}
/** A ramp from a name (RAMPS key) or one colour ('#rrggbb'): dark shade -> colour -> white. */
export function rampOf(c) {
  if (!c) return null; if (RAMPS[c]) return RAMPS[c]; if (c[0] !== '#') return null;
  const C = hex(c), K = hex('#0a0814'), W = hex('#ffffff');
  return [mix(K, C, .35), mix(K, C, .6), mix(K, C, .85), C, mix(C, W, .3), mix(C, W, .6), W].map(toHex);
}
/** Bake an effect: returns { w, h, n, fps, ox, oy, data } with frames cropped to their union box, laid out in one row. */
export function bake(key, { ramp = null, theme = null, seed } = {}) {
  const E = EFFECTS[key], meta = E.mod.meta, [W, H] = meta.size, [OX, OY] = meta.origin;
  const opts = { x: OX, y: OY, ...E.opts };
  const base = ramp || meta.options?.palette;
  if (meta.options && 'palette' in meta.options && base) opts.palette = recolor(base, theme);
  if (seed !== undefined) opts.seed = seed;
  const fx = createFx(E.mod, opts), frame = createFrame(W, H), n = Math.max(2, Math.round(E.dur * E.fps)), raw = [];
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let i = 0; i < n; i++) {
    if (i) fx.update(1 / E.fps);
    clearFrame(frame); fx.draw(frame);
    const px = composite(frame, new Uint8ClampedArray(W * H * 4), null);
    // fade the last quarter so trimmed tails end clean
    const fade = i > n * .75 ? 1 - (i - n * .75) / (n * .25 + 1) : 1;
    for (let j = 3; j < px.length; j += 4) if (px[j]) { px[j] = Math.round(px[j] * fade); if (px[j] > 8) { const q = (j - 3) / 4, x = q % W, y = (q / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y } }
    raw.push(px);
  }
  if (x1 < 0) { x0 = OX; y0 = OY; x1 = OX; y1 = OY }
  const w = x1 - x0 + 1, h = y1 - y0 + 1, data = new Uint8ClampedArray(w * n * h * 4);
  raw.forEach((px, i) => { for (let y = 0; y < h; y++) { const s = ((y + y0) * W + x0) * 4; data.set(px.subarray(s, s + w * 4), (y * w * n + i * w) * 4) } });
  return { w, h, n, fps: E.fps, ox: OX - x0, oy: OY - y0, data };
}
/** Browser: bake straight into a canvas Phaser can turn into a sprite sheet. */
export function bakeCanvas(key, o) {
  const b = bake(key, o), cv = document.createElement('canvas'); cv.width = b.w * b.n; cv.height = b.h;
  cv.getContext('2d').putImageData(new ImageData(b.data, b.w * b.n, b.h), 0, 0);
  return { ...b, canvas: cv, data: undefined };
}
