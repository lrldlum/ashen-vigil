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
 const OLC=0xf3e2b8;
 function preload(L){if(!ON())return;if(typeof ARMORL!=='undefined')ARMORL.preload(L);if(typeof WEAPART!=='undefined')WEAPART.preload(L);L.spritesheet('av_hero',DIR+'hero_strip.png',{frameWidth:46,frameHeight:46});L.spritesheet('av_acolyte',DIR+'bell_acolyte_strip.png',{frameWidth:51,frameHeight:51})}
 // r9 readability: crisp 1px outline (4 tint-filled copies offset +-1px, behind) + soft additive lift copy (above)
 function edge(s,d){return{ol:[[1,0],[-1,0],[0,1],[0,-1]].map(o=>{const q=s.add.sprite(0,0,'av_hero',0).setOrigin(.5,58/64).setDepth(d-.01).setTintFill(OLC).setAlpha(.9).setVisible(false);q.o=o;return q}),
  lift:s.add.sprite(0,0,'av_hero',0).setOrigin(.5,58/64).setDepth(d+.0005).setBlendMode(Phaser.BlendModes.ADD).setAlpha(.28).setVisible(false)}}
 function edgeVis(E,v){E.lift.setVisible(v);for(const q of E.ol)q.setVisible(v)}
 function edgeSync(E,sp,tc){for(const q of E.ol)q.setTexture(sp.texture.key,sp.frame.name).setFlipX(sp.flipX).setPosition(sp.x+q.o[0],sp.y+q.o[1]).setTintFill(tc);E.lift.setTexture(sp.texture.key,sp.frame.name).setFlipX(sp.flipX).setPosition(sp.x,sp.y)}
 function setup(s){s.pxc=null;if(!ON()||!s.textures.exists('av_hero'))return;
  const c=s.pxc={t:0,drawn:0,foes:new Map(),hero:s.add.sprite(0,0,'av_hero',0).setOrigin(.5,58/64).setDepth(3.1).setVisible(false),aco:s.sid==='cathedral'&&s.textures.exists('av_acolyte')};
  const AR=typeof ARMORL!=='undefined';c.rig=AR?ARMORL.rig(s,c.hero):null;
  c.rem=s.add.sprite(0,0,'av_hero',0).setOrigin(.5,58/64).setDepth(3.08).setVisible(false);c.rrig=AR?ARMORL.rig(s,c.rem):null;
  c.he=edge(s,3.1);c.re=edge(s,3.08);
  s.events.on('postupdate',()=>{if(s.pxc!==c)return;c.t+=(s.dt||1/60);if(c.drawn)c.ld=c.t;if(c.rdrawn)c.lr=c.t;const hv=c.t-(c.ld??-9)<.12,rv=c.t-(c.lr??-9)<.12;c.hero.setVisible(hv);c.rem.setVisible(rv);edgeVis(c.he,hv);edgeVis(c.re,rv);
   const WA=typeof WEAPART!=='undefined';
   if(c.rig){if(hv)ARMORL.dress(s,c.rig,s.sv&&s.sv.eq,c.fl,c.tint);else ARMORL.hide(c.rig);if(WA)WEAPART.wield(s,c.rig,hv&&s.sv&&s.sv.eq&&s.sv.eq.main,c.fl,c.tint)}
   if(c.rrig){if(rv)ARMORL.dress(s,c.rrig,c.req,c.rfl,c.rtint);else ARMORL.hide(c.rrig);if(WA)WEAPART.wield(s,c.rrig,rv&&c.rmain,c.rfl,c.rtint)}c.drawn=0;c.rdrawn=0});
  s.events.once('shutdown',()=>{s.pxc=null})}
 function pick(c,st,a){if(st.a!==a){st.a=a;st.t0=c.t}const [s0,n,fps]=AN[a],k=Math.floor((c.t-st.t0)*fps);return s0+(a==='attack'||a==='hit'?Math.min(n-1,k):k%n)}
 // returns true when the pixel hero was drawn (caller then skips the old hero + its rim)
 function hero(s,x,y,f,st,P){const c=s.pxc;if(!c)return false;c.drawn=1;c.hs=c.hs||{};
  const a=st==='hurt'?'hit':st==='atk'?'attack':(st==='run'||st==='roll'||st==='jump'||st==='fall')?'run':'idle';let fr;
  if(a==='attack'){const m=s.move(),h0=m.h0||.1,h1=m.h1||h0+.08,T=m.t||h1+.15,t=P.t;fr=t<h0?16+Math.min(3,Math.floor(t/h0*4)):t<h1?20:21+Math.min(2,Math.floor((t-h1)/Math.max(.01,T-h1)*3));c.hs.a=null}
  else fr=pick(c,c.hs,a);
  const sp=c.hero;upright(c,sp,c.he,'dead');sp.setFrame(fr).setPosition(Math.round(x),Math.round(y)).setFlipX(f<0);
  c.fl=P.flash>0&&Math.floor(c.t*30)%2;c.tint=typeof NET!=='undefined'&&NET.guest()&&NET.linked()?NET.TINT.b:null;
  if(c.fl)sp.setTintFill(0xffffff);else if(c.tint!=null)sp.setTint(c.tint);else sp.clearTint();edgeSync(c.he,sp,c.tint??OLC);
  // boss weapon heavy look: one burst per heavy swing, at the start of the damage window
  if(P.state==='atk'&&P.heavy&&typeof WEAPART!=='undefined'){if(!c.hvF&&P.t>=s.move().h0){c.hvF=1;c.hvLast=WEAPART.heavy(s,s.sv.eq.main,x+f*6,y,f)}}else c.hvF=0;return true}
 // death: current hand-drawn hero (hit strip 24-29, then held and laid down, fading) instead of the legacy procedural man
 function death(s,x,y,f,dT,alpha,rem){const c=s.pxc;if(!c)return false;const sp=rem?c.rem:c.hero,E=rem?c.re:c.he;if(rem)c.rdrawn=1;else c.drawn=1;
  const fr=24+Math.min(5,Math.floor(dT/.12)),lay=Math.min(1,Math.max(0,(dT-.5)/.4));
  sp.setFrame(fr).setPosition(Math.round(x),Math.round(y)).setFlipX(f<0).setAngle((f<0?1:-1)*90*lay).setAlpha(alpha);
  const tc=typeof NET!=='undefined'&&NET.guest()&&NET.linked()?NET.TINT.b:null;if(rem){c.rtint=rem.rh?null:NET.TINT.b;c.req=c.req||{};if(c.rtint!=null)sp.setTint(c.rtint);else sp.clearTint()}else{c.tint=tc;c.fl=0;if(tc!=null)sp.setTint(tc);else sp.clearTint()}
  edgeSync(E,sp,(rem?c.rtint:tc)??OLC);for(const q of E.ol)q.setAngle(sp.angle).setAlpha(.9*alpha);E.lift.setAngle(sp.angle).setAlpha(.28*alpha);c[rem?'rdead':'dead']=1;return true}
 function upright(c,sp,E,k){if(!c[k])return;c[k]=0;sp.setAngle(0).setAlpha(1);for(const q of E.ol)q.setAngle(0).setAlpha(.9);E.lift.setAngle(0).setAlpha(.28)}
 // co-op partner: pixel hero + their armor (equip ids come over NET.me(): ar/hd/hn/lg). Role colour: the guest is teal on both screens
 function remote(s,R,x,y,rh){const c=s.pxc;if(!c)return false;c.rdrawn=1;c.rs=c.rs||{};const st=R.st;
  const a=st==='hurt'?'hit':st==='atk'?'attack':(st==='run'||st==='roll'||st==='jump'||st==='fall')?'run':'idle';
  upright(c,c.rem,c.re,'rdead');const fr=a==='attack'?16+Math.min(7,(R.fr|0)*2):pick(c,c.rs,a);c.rem.setFrame(fr).setPosition(x,y).setFlipX(R.f<0);
  c.req={armor:R.ar,head:R.hd,hands:R.hn,legs:R.lg};c.rmain=R.main;c.rfl=!!R.fl&&Math.floor(c.t*30)%2;c.rtint=rh?null:NET.TINT.b;
  if(c.rfl)c.rem.setTintFill(0xffffff);else if(c.rtint!=null)c.rem.setTint(c.rtint);else c.rem.clearTint();edgeSync(c.re,c.rem,c.rtint??OLC);return true}// r6: P2 guest is teal
 // returns true when the enemy was drawn as a Bell Acolyte
 function foe(s,e){const c=s.pxc;if(!c||!c.aco||e.base!=='hollow')return false;let sp=c.foes.get(e);
  if(e.dead){if(sp)sp.setVisible(false);return false}
  if(!sp){sp=s.add.sprite(0,0,'av_acolyte',0).setOrigin(.5,58/64).setDepth(3.05);c.foes.set(e,sp)}
  const b=e.b,a=e.flash>0?'hit':/wind|swing|atk/.test(e.state)?'attack':Math.abs(b.body.velocity.x)>4?'move':'idle';let fr=null;
  if(a==='attack'){const t=e.t||0;if(e.state==='wind'){const wd=e.combo?.22:.45;fr=16+Math.min(2,Math.floor(t/wd*3))}else if(e.state==='swing')fr=t<.06?19:t<.12?20:21+Math.min(2,Math.floor((t-.12)/.23*3))}
  e._pxa=e._pxa||{};sp.setVisible(true).setFrame(fr??pick(c,e._pxa,a)).setPosition(Math.round(b.x),Math.round(b.body.bottom)).setFlipX(e.f>0);
  if(e.flash>0&&Math.floor(c.t*30)%2)sp.setTintFill(0xffffff);else sp.clearTint();return true}
 return {preload,setup,hero,death,foe,remote,ON}})();
