// ASHEN VIGIL — Artist's true-size pixel sprites (hero everywhere, Bell Acolyte replaces the Cathedral 'hollow').
// Strips: assets/art/sheets_pixel/<name>_strip.png (hero 46x46, acolyte 51x51; 30 frames: idle 0-7, run/move 8-15,
// attack 16-23, hit 24-29). Origin (0.5,58/64), scale 1, NEAREST (game default). Hitboxes and damage timing are
// unchanged; attack frames are mapped onto the real damage window (hero f20 = weapon h0..h1, acolyte f19-20 = swing 0-.12s).
// ?artchars=0 falls back to the old procedural art. Refresh art with tools/sync_art.sh (filenames are the contract).
'use strict';
const PIXCH=(()=>{
 const ON=()=>new URLSearchParams(location.search).get('artchars')!=='0';
 const DIR='assets/art/sheets_pixel/';
 const AN={idle:[0,8,8],run:[8,8,12],move:[8,8,8],attack:[16,8,16],hit:[24,6,14]};
 function preload(L){if(!ON())return;L.spritesheet('av_hero',DIR+'hero_strip.png',{frameWidth:46,frameHeight:46});L.spritesheet('av_acolyte',DIR+'bell_acolyte_strip.png',{frameWidth:51,frameHeight:51})}
 function setup(s){s.pxc=null;if(!ON()||!s.textures.exists('av_hero'))return;
  const c=s.pxc={t:0,drawn:0,foes:new Map(),hero:s.add.sprite(0,0,'av_hero',0).setOrigin(.5,58/64).setDepth(3.1).setVisible(false),aco:s.sid==='cathedral'&&s.textures.exists('av_acolyte')};
  s.events.on('postupdate',()=>{if(s.pxc!==c)return;c.t+=(s.dt||1/60);c.hero.setVisible(!!c.drawn);c.drawn=0});
  s.events.once('shutdown',()=>{s.pxc=null})}
 function pick(c,st,a){if(st.a!==a){st.a=a;st.t0=c.t}const [s0,n,fps]=AN[a],k=Math.floor((c.t-st.t0)*fps);return s0+(a==='attack'||a==='hit'?Math.min(n-1,k):k%n)}
 // returns true when the pixel hero was drawn (caller then skips the old hero + its rim)
 function hero(s,x,y,f,st,P){const c=s.pxc;if(!c)return false;c.drawn=1;c.hs=c.hs||{};
  const a=st==='hurt'?'hit':st==='atk'?'attack':(st==='run'||st==='roll'||st==='jump'||st==='fall')?'run':'idle';let fr;
  if(a==='attack'){const m=s.move(),h0=m.h0||.1,h1=m.h1||h0+.08,T=m.t||h1+.15,t=P.t;fr=t<h0?16+Math.min(3,Math.floor(t/h0*4)):t<h1?20:21+Math.min(2,Math.floor((t-h1)/Math.max(.01,T-h1)*3));c.hs.a=null}
  else fr=pick(c,c.hs,a);
  const sp=c.hero;sp.setFrame(fr).setPosition(Math.round(x),Math.round(y)).setFlipX(f<0);
  if(P.flash>0&&Math.floor(c.t*30)%2)sp.setTintFill(0xffffff);else if(typeof NET!=='undefined'&&NET.guest()&&NET.linked())sp.setTint(NET.TINT.b);else sp.clearTint();return true}// r6: P2 guest is teal
 // returns true when the enemy was drawn as a Bell Acolyte
 function foe(s,e){const c=s.pxc;if(!c||!c.aco||e.base!=='hollow')return false;let sp=c.foes.get(e);
  if(e.dead){if(sp)sp.setVisible(false);return false}
  if(!sp){sp=s.add.sprite(0,0,'av_acolyte',0).setOrigin(.5,58/64).setDepth(3.05);c.foes.set(e,sp)}
  const b=e.b,a=e.flash>0?'hit':/wind|swing|atk/.test(e.state)?'attack':Math.abs(b.body.velocity.x)>4?'move':'idle';let fr=null;
  if(a==='attack'){const t=e.t||0;if(e.state==='wind'){const wd=e.combo?.22:.45;fr=16+Math.min(2,Math.floor(t/wd*3))}else if(e.state==='swing')fr=t<.06?19:t<.12?20:21+Math.min(2,Math.floor((t-.12)/.23*3))}
  e._pxa=e._pxa||{};sp.setVisible(true).setFrame(fr??pick(c,e._pxa,a)).setPosition(Math.round(b.x),Math.round(b.body.bottom)).setFlipX(e.f>0);
  if(e.flash>0&&Math.floor(c.t*30)%2)sp.setTintFill(0xffffff);else sp.clearTint();return true}
 return {preload,setup,hero,foe,ON}})();
