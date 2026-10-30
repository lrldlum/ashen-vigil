// ASHEN VIGIL — vertical slice. All art & VFX drawn in code (pixel-snapped), original content.
// TODO (later passes, see game_design.md): Pale Choir (frozen) + Cinderdeep (burning) stages, 8 DS3-style classes,
// leveling at bonfires, weapons/armor/catalyst inventory, PeerJS host/join co-op, 3 save slots, more bosses.
'use strict';
const W=320,H=180,GY=156,WORLD=3360,ARENA_L=2980,ARENA_R=3340;
const Q=new URLSearchParams(location.search);
const DEMO=Q.has('demo'), START_X=+(Q.get('x')||40);
// ---------- palette (night-indigo, matched to reference) ----------
const C={sky0:'#0b081d',sky1:'#0f0b25',sky2:'#140f2e',sky3:'#1a1439',sky4:'#221a47',
 far:'#191335',farW:'#2a2754',farW2:'#3b3a6e',near:'#0e0a20',nearW:'#30335f',
 gTop:'#4b4078',g1:'#352c5e',g2:'#2d2552',gM:'#1f1940',gD:'#17122f',
 pl:0xff7a1a,plS:0xb8440c,plH:0xffb04a,cape:0x7a1e14,steel:0xd8d0ee,
 ice0:0xffffff,ice1:0xd8f2ff,ice2:0x9fd8ff,ice3:0x4aa0ff,ice4:0x2a5cd0,ice5:0x1b3a8a,
 f0:0xfff6c0,f1:0xffd04a,f2:0xff8a1a,f3:0xd23a10,f4:0x6a1408,
 bolt:0xb7a6ff,boltC:0xf4f0ff,orb:0xc050ff};
const ICE=[C.ice0,C.ice1,C.ice2,C.ice3,C.ice4,C.ice5], FIRE=[C.f0,C.f1,C.f2,C.f3,C.f4];
const rnd=(a,b)=>a+Math.random()*(b-a), ri=(a,b)=>Math.floor(rnd(a,b+1)), clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t, ease=t=>1-Math.pow(1-t,3);
// ---------- save ----------
const SAVE_KEY='ashenVigil.save.v1';
const Save={load(){try{return JSON.parse(localStorage.getItem(SAVE_KEY))||null}catch(e){return null}},
 write(d){try{localStorage.setItem(SAVE_KEY,JSON.stringify(d))}catch(e){}}, clear(){localStorage.removeItem(SAVE_KEY)}};
// ---------- tiny 3x5 pixel font ----------
const FONT={A:'010101111101101',B:'110101110101110',C:'011100100100011',D:'110101101101110',E:'111100110100111',F:'111100110100100',
G:'011100101101011',H:'101101111101101',I:'111010010010111',J:'001001001101010',K:'101101110101101',L:'100100100100111',
M:'101111111101101',N:'110101101101101',O:'010101101101010',P:'110101110100100',Q:'010101101110011',R:'110101110101101',
S:'011100010001110',T:'111010010010010',U:'101101101101111',V:'101101101101010',W:'101101111111101',X:'101101010101101',
Y:'101101010010010',Z:'111001010100111','0':'111101101101111','1':'010110010010111','2':'110001010100111','3':'110001010001110',
'4':'101101111001001','5':'111100110001110','6':'011100111101111','7':'111001010010010','8':'111101111101111','9':'111101111001110',
'.':'000000000000010',':':'000010000010000','-':'000000111000000','!':'010010010000010','/':'001001010100100',',':'000000000010100',"'":'010010000000000',' ':'000000000000000'};
function textW(s,sc=1){return s.length*4*sc-sc}
function drawText(g,s,x,y,col,sc=1,shadow=0x07050f,alpha=1){s=s.toUpperCase();
 const pass=(c,ox,oy)=>{g.fillStyle(c,alpha);for(let i=0;i<s.length;i++){const f=FONT[s[i]]||FONT[' '];
  for(let k=0;k<15;k++)if(f[k]==='1')g.fillRect(x+ox+(i*4+k%3)*sc,y+oy+Math.floor(k/3)*sc,sc,sc)}};
 if(shadow!==null)pass(shadow,sc,sc);pass(col,0,0)}
// ---------- pixel helpers ----------
function px(g,x,y,c,a=1){g.fillStyle(c,a);g.fillRect(Math.round(x),Math.round(y),1,1)}
function line(g,x0,y0,x1,y1,c,a=1){x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);g.fillStyle(c,a);
 let dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,e=dx+dy,n=0;
 while(n++<400){g.fillRect(x0,y0,1,1);if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx}if(e2<=dx){e+=dx;y0+=sy}}}
function glow(g,x,y,r,c,a=.25){x=Math.round(x);y=Math.round(y);// stepped, banded glow (no smooth gradients)
 for(let i=3;i>=1;i--){g.fillStyle(c,a*(4-i)/6);g.fillCircle(x,y,Math.max(1,Math.round(r*i/3)))}}
function sparkle(g,x,y,s,c,a=1){x=Math.round(x);y=Math.round(y);g.fillStyle(c,a);g.fillRect(x,y-s,1,2*s+1);g.fillRect(x-s,y,2*s+1,1);if(s>1){g.fillStyle(0xffffff,a);g.fillRect(x,y,1,1)}}
// ---------- procedural textures ----------
function makeCanvas(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.imageSmoothingEnabled=false;fn(x,w,h);return c}
function seedRand(s){return()=>{s=(s*16807)%2147483647;return(s-1)/2147483646}}
const BAYER=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
function genTextures(scene){
 const T=scene.textures;
 if(T.exists('sky'))return;
 T.addCanvas('sky',makeCanvas(W,H,(x)=>{const bands=[C.sky0,C.sky1,C.sky2,C.sky3,C.sky4];const R=seedRand(7);
  for(let y=0;y<H;y++)for(let xx=0;xx<W;xx++){const t=Math.min(.999,y/150)*(bands.length-1);const i=Math.floor(t),f=t-i;
   const b=(BAYER[y&3][xx&3]+.5)/16;x.fillStyle=bands[Math.min(bands.length-1,i+(f>b?1:0))];x.fillRect(xx,y,1,1)}
  for(let i=0;i<110;i++){const sx=Math.floor(R()*W),sy=Math.floor(R()*120);const v=R();x.fillStyle=v>.93?'#e8e4ff':v>.7?'#8a86c0':'#4d4a86';x.fillRect(sx,sy,1,1)}}));
 // far skyline: gothic towers + spires, tileable 640
 T.addCanvas('far',makeCanvas(640,H,(x,w)=>{const R=seedRand(42);let xx=0;
  while(xx<w){const bw=14+Math.floor(R()*26),bh=30+Math.floor(R()*62),top=GY-bh;x.fillStyle=C.far;x.fillRect(xx,top,bw,GY-top);
   const spire=R();if(spire>.45){const sh=8+Math.floor(R()*18);for(let k=0;k<sh;k++){const ww=Math.max(1,Math.round(bw/2*(1-k/sh)));x.fillRect(xx+Math.floor(bw/2)-ww,top-k,ww*2,1)}x.fillRect(xx+Math.floor(bw/2),top-sh-4,1,5)}
   else{for(let k=0;k<bw;k+=3)x.fillRect(xx+k,top-2,2,2)}
   for(let wy=top+5;wy<GY-4;wy+=4)for(let wx=xx+2;wx<xx+bw-2;wx+=3){const v=R();if(v<.42){x.fillStyle=v<.06?C.farW2:C.farW;x.fillRect(wx,wy,1,2)}}
   xx+=bw+Math.floor(R()*6)-2}}));
 // near layer: cathedral facades, buttresses, rose windows, darker
 T.addCanvas('near',makeCanvas(800,H,(x,w)=>{const R=seedRand(9);let xx=0;
  while(xx<w){const bw=24+Math.floor(R()*34),bh=20+Math.floor(R()*54),top=GY-bh;x.fillStyle=C.near;x.fillRect(xx,top,bw,GY-top);
   const kind=R();
   if(kind<.35){const sh=14+Math.floor(R()*24);for(let k=0;k<sh;k++){const ww=Math.max(1,Math.round(bw/2*(1-k/sh)));x.fillRect(xx+Math.floor(bw/2)-ww,top-k,ww*2,1)}
     // rose window
     const cx=xx+Math.floor(bw/2),cy=top+8;x.fillStyle=C.nearW;for(let a=0;a<16;a++){x.fillRect(cx+Math.round(Math.cos(a/16*6.28)*4),cy+Math.round(Math.sin(a/16*6.28)*4),1,1)}x.fillRect(cx,cy,1,1);x.fillStyle=C.near}
   else if(kind<.6){for(let k=0;k<4;k++){x.fillRect(xx+Math.floor(k*bw/4),top-6-Math.floor(R()*8),2,10)}}
   for(let wy=top+16;wy<GY-8;wy+=12)for(let wx=xx+3;wx<xx+bw-4;wx+=6){if(R()<.5){x.fillStyle=C.nearW;x.fillRect(wx,wy+1,2,6);x.fillRect(wx+0,wy,2,1);x.fillStyle=C.near}}
   // flying buttress
   if(R()<.4){x.fillStyle=C.near;for(let k=0;k<12;k++)x.fillRect(xx+bw+k,top+10+k*k/6,2,2)}
   xx+=bw+4+Math.floor(R()*14)}}));
 // ground: brick band
 T.addCanvas('ground',makeCanvas(32,24,(x)=>{x.fillStyle=C.g1;x.fillRect(0,0,32,24);x.fillStyle=C.gTop;x.fillRect(0,0,32,1);x.fillStyle=C.g2;x.fillRect(0,1,32,1);
  for(let r=0;r<4;r++){const y=2+r*6;x.fillStyle=C.gM;x.fillRect(0,y+5,32,1);const off=r%2?8:0;for(let k=0;k<2;k++)x.fillRect((off+k*16)%32,y,1,5);
   x.fillStyle=r>1?C.gD:C.g2;if(r>1)x.fillRect(0,y,32,5)}
  x.fillStyle=C.gM;x.fillRect(0,23,32,1)}));
 T.addCanvas('plat',makeCanvas(16,8,(x)=>{x.fillStyle=C.g1;x.fillRect(0,0,16,6);x.fillStyle=C.gTop;x.fillRect(0,0,16,1);x.fillStyle=C.gM;x.fillRect(0,5,16,1);x.fillRect(15,1,1,4);x.fillStyle=C.gD;x.fillRect(2,6,2,2);x.fillRect(12,6,2,2)}));
 T.addCanvas('px',makeCanvas(2,2,(x)=>{x.fillStyle='#fff';x.fillRect(0,0,2,2)}));
}
// ---------- particles ----------
class FX{constructor(scene){this.s=scene;this.p=[];this.objs=[]}
 add(o){this.p.length<1400&&this.p.push(o);return o}
 ember(x,y,n=1,spd=1){for(let i=0;i<n;i++)this.add({k:'ember',x:x+rnd(-2,2),y,vx:rnd(-8,8)*spd,vy:rnd(-30,-12)*spd,l:0,m:rnd(.6,1.4),ph:rnd(0,6)})}
 fire(x,y,n=1,w=3,s=1){for(let i=0;i<n;i++)this.add({k:'fire',x:x+rnd(-w,w),y:y+rnd(-1,1),vx:rnd(-4,4),vy:rnd(-34,-18)*s,l:0,m:rnd(.25,.5)*s,sz:Math.random()<.5?2:1})}
 spark(x,y,n,col=0xffffff,sp=120,up=0){for(let i=0;i<n;i++){const a=rnd(0,6.283),v=rnd(.3,1)*sp;this.add({k:'spark',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-up,l:0,m:rnd(.15,.35),c:col})}}
 dust(x,y,n,dir=0){for(let i=0;i<n;i++)this.add({k:'dust',x:x+rnd(-3,3),y:y-rnd(0,2),vx:rnd(-20,20)+dir*rnd(10,30),vy:rnd(-14,-3),l:0,m:rnd(.3,.6),sz:ri(1,2)})}
 shard(x,y,n,sp=90){for(let i=0;i<n;i++){const a=rnd(3.4,6.0),v=rnd(.3,1)*sp;this.add({k:'shard',x:x+rnd(-3,3),y:y+rnd(-6,0),vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:0,m:rnd(.35,.8)})}}
 snow(x,y){this.add({k:'snow',x,y,vx:rnd(-6,4),vy:rnd(8,18),l:0,m:rnd(3,6),ph:rnd(0,6)})}
 star(x,y,c=C.ice1){this.add({k:'star',x,y,vx:0,vy:rnd(-6,-2),l:0,m:rnd(.3,.6),c})}
 soul(x,y,n){for(let i=0;i<n;i++)this.add({k:'soul',x:x+rnd(-4,4),y:y+rnd(-6,2),vx:rnd(-30,30),vy:rnd(-50,-20),l:0,m:rnd(.8,1.3)})}
 update(dt){const ps=this.p;for(let i=ps.length-1;i>=0;i--){const q=ps[i];q.l+=dt;if(q.l>=q.m){ps[i]=ps[ps.length-1];ps.pop();continue}
  switch(q.k){case'ember':q.vx+=Math.sin(q.l*5+q.ph)*30*dt;q.vy-=6*dt;break;case'fire':q.vy-=20*dt;q.vx*=.96;break;
   case'spark':q.vy+=260*dt;q.vx*=.93;break;case'dust':q.vx*=.9;q.vy*=.92;break;case'shard':q.vy+=300*dt;if(q.y>GY-1){q.y=GY-1;q.vy*=-.3;q.vx*=.6}break;
   case'snow':q.vx=Math.sin(q.l*1.6+q.ph)*10;break;case'soul':{const P=this.s.player;if(P&&q.l>.3){const dx=P.x-q.x,dy=P.y-8-q.y,d=Math.hypot(dx,dy)+1;q.vx+=dx/d*600*dt;q.vy+=dy/d*600*dt;q.vx*=.92;q.vy*=.92;if(d<5)q.l=q.m}break}}
  q.x+=q.vx*dt;q.y+=q.vy*dt}}
 draw(ga,gn){for(const q of this.p){const t=q.l/q.m;
  switch(q.k){case'ember':{if(Math.sin(q.l*40+q.ph)>.6&&t>.5)break;const c=FIRE[Math.min(4,Math.floor(t*4.5))];px(ga,q.x,q.y,c);if(t<.3)glow(ga,q.x,q.y,2,C.f2,.18);break}
   case'fire':{const c=FIRE[Math.min(4,Math.floor(t*5))];const s=t<.5?q.sz:1;ga.fillStyle(c,1);ga.fillRect(Math.round(q.x),Math.round(q.y),s,s);break}
   case'spark':{const c=t<.4?0xffffff:q.c;line(ga,q.x,q.y,q.x-q.vx*.03,q.y-q.vy*.03,c,1-t*.5);break}
   case'dust':{gn.fillStyle(t<.5?0x6b5f96:0x463c6e,.85*(1-t));gn.fillRect(Math.round(q.x),Math.round(q.y),q.sz,q.sz);break}
   case'shard':{const c=ICE[Math.min(5,1+Math.floor(t*4))];px(ga,q.x,q.y,c);if(t<.4)px(ga,q.x-Math.sign(q.vx),q.y-1,C.ice2,.6);break}
   case'snow':px(gn,q.x,q.y,0xcfe6ff,.8*(1-t*t));break;
   case'star':sparkle(ga,q.x,q.y,t<.5?2:1,q.c,1-t);break;
   case'soul':{px(ga,q.x,q.y,0xe8f6ff);glow(ga,q.x,q.y,3,0x7fb8ff,.2);break}}}}}
// ---------- effect variants (code is clay: several drafts, best one picked) ----------
const SLASH_V=[{name:'A crescent',r:13,th:3,sweep:140,dur:.11,trail:0},{name:'B wide trail',r:16,th:3,sweep:200,dur:.15,trail:1},{name:'C stab',r:11,th:4,sweep:90,dur:.08,trail:0}];
const ICE_V=[{name:'A needles',n:6,step:13,hMin:16,hMax:30,hw:2.2,grow:.10},{name:'B crown',n:8,step:11,hMin:14,hMax:40,hw:4.2,grow:.12},{name:'C wall',n:4,step:16,hMin:26,hMax:30,hw:5,grow:.16}];
const SLASH=SLASH_V[1], ICEP=ICE_V[1]; // picked after side-by-side review in ?lab
function drawSlash(ga,x,y,f,t,V){// t 0..1
 const a0=-100,sw=V.sweep,head=a0+sw*ease(Math.min(1,t*1.15));const tail=head-(V.trail?sw*.75:sw*.5)*(1-t*.6);
 for(let a=tail;a<=head;a+=4){const k=(a-tail)/(head-tail+1e-3);const rad=a*Math.PI/180;const th=Math.max(1,Math.round(V.th*k));
  for(let r=V.r-th;r<=V.r;r++){const c=k>.85?0xffffff:k>.5?0xffe2a8:k>.25?C.f1:C.f2;px(ga,x+Math.cos(rad)*r*f,y+Math.sin(rad)*r,c,Math.min(1,k*1.6)*(1-t*.4))}}
}
function drawSpike(ga,gn,x,by,h,hw,t,lean){// crystal spike, light from left
 const hh=Math.round(h);for(let i=0;i<hh;i++){const k=i/hh;const w=Math.max(0,Math.round(hw*(1-k)*(1+.15*Math.sin(k*9))));const cx=x+Math.round(lean*k*hh*.25);
  for(let dx=-w;dx<=w;dx++){let c=dx<=-w+0?C.ice1:dx<0?C.ice2:dx===0?C.ice1:dx<w?C.ice3:C.ice4;if(k>.85)c=C.ice0;ga.fillStyle(c,1);ga.fillRect(cx+dx,by-i,1,1)}}
 px(ga,x+Math.round(lean*hh*.25),by-hh,0xffffff)}
// Frost dome, matched to reference: full hemisphere, bright 2px shell, glowing elliptical base ring, inner crystals
function drawDome(ga,x,gy,r,a,t,seed){x=Math.round(x);r=Math.max(2,Math.round(r));const R=seedRand(seed);
 // body: faint banded fill (chords), brighter toward the shell
 for(let yy=0;yy<r;yy+=2){const w=Math.round(Math.sqrt(r*r-yy*yy));ga.fillStyle(C.ice4,a*(.05+.06*(yy/r)));ga.fillRect(x-w,gy-yy-1,2*w+1,2)}
 // hex lattice
 for(let yy=3;yy<r-2;yy+=6)for(let xx=-r;xx<=r;xx+=7){const ox=xx+((yy/6|0)%2?3:0);if(ox*ox+yy*yy<(r-3)*(r-3))px(ga,x+ox,gy-yy,C.ice2,a*.45)}
 // shell glow + 2px shell
 const N=Math.max(24,Math.round(r*3.4));
 for(let i=0;i<=N;i+=3){const an=Math.PI+i/N*Math.PI;glow(ga,x+Math.cos(an)*r,gy+Math.sin(an)*r,4,C.ice3,a*.12)}
 for(let i=0;i<=N;i++){const an=Math.PI+i/N*Math.PI,c=Math.cos(an),s=Math.sin(an);
  px(ga,x+c*r,gy+s*r,C.ice1,a);px(ga,x+c*(r-1),gy+s*(r-1),C.ice2,a*.8);
  const tr=((i/N)+t*.6)%1;if(tr<.04||Math.abs(tr-.5)<.02)px(ga,x+c*r,gy+s*r,0xffffff,a)}
 // base ring (ellipse) with glow
 const rx=Math.round(r*1.18),ry=Math.max(3,Math.round(r*.14));glow(ga,x,gy,rx*.6,C.ice3,a*.12);
 for(let i=0;i<Math.round(rx*7);i++){const an=i/Math.round(rx*7)*Math.PI*2;const yy=gy-1+Math.sin(an)*ry;px(ga,x+Math.cos(an)*rx,yy,Math.sin(an)>0?0xffffff:C.ice1,a);px(ga,x+Math.cos(an)*(rx-1),yy,C.ice2,a*.6)}
 for(let k=0;k<6;k++)glow(ga,x+Math.cos(k/6*6.283+t)*rx,gy-1+Math.sin(k/6*6.283+t)*ry,4,C.ice1,a*.25);
 // inner crystals
 const n=Math.round(r/6);for(let k=0;k<n;k++){const sx=x+Math.round((R()*2-1)*r*.85),h=4+R()*r*.35;drawSpike(ga,null,sx,gy-1,h,1.6,1,(R()-.5)*.8)}
 if(R()<.6)sparkle(ga,x+(R()*2-1)*r*.7,gy-R()*r*.8,2,C.ice1,a)}
// ===================================================================
class Boot extends Phaser.Scene{constructor(){super('boot')}
 preload(){['jump','roll','slash','hit','death','bonfire','souls','charge','shot','parry'].forEach(k=>this.load.audio(k,`assets/audio/sfx_${k}.wav`))}
 create(){genTextures(this);if(Q.has('lab'))return this.scene.start('lab');if(DEMO||Q.has('play'))return this.scene.start('stage',{fresh:!Q.has('continue')});this.scene.start('title')}}
// shared parallax
function makeBG(scene){const L=[['sky',0],['far',.15],['near',.4]].map(([k,f])=>[scene.add.tileSprite(0,0,W,H,k).setOrigin(0).setScrollFactor(0).setDepth(-10+f),f]);
 return cx=>L.forEach(([s,f])=>s.tilePositionX=cx*f)}
// ===================================================================
class Title extends Phaser.Scene{constructor(){super('title')}
 create(){this.bg=makeBG(this);this.fx=new FX(this);this.ga=this.add.graphics().setBlendMode(Phaser.BlendModes.ADD).setDepth(5);this.gn=this.add.graphics().setDepth(4);this.gt=this.add.graphics().setDepth(6);
  this.add.tileSprite(0,GY,W,24,'ground').setOrigin(0);this.t=0;this.save=Save.load();this.sel=0;
  const k=this.input.keyboard;k.on('keydown',e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown')this.sel^=1;if(e.key==='Enter'||e.key===' '||e.key==='z'){this.go()}});this.input.on('pointerdown',()=>this.go())}
 go(){if(this.gone)return;this.gone=1;const cont=this.save&&this.sel===0;if(!cont)Save.clear();this.cameras.main.fadeOut(400,7,5,15);this.time.delayedCall(420,()=>this.scene.start('stage',{fresh:!cont}))}
 update(_,d){const dt=d/1000;this.t+=dt;this.bg(this.t*8);const ga=this.ga,gn=this.gn,g=this.gt;ga.clear();gn.clear();g.clear();
  // bonfire + kneeling knight silhouette
  const bx=200,by=GY;if(Math.random()<.9)this.fx.fire(bx,by-3,2,3);if(Math.random()<.2)this.fx.ember(bx,by-8,1);this.fx.update(dt);
  glow(ga,bx,by-6,26+Math.sin(this.t*9)*1.5,C.f2,.16);line(gn,bx,by-1,bx+2,by-16,0x8b86a8);line(gn,bx-2,by-13,bx+4,by-12,0x8b86a8);gn.fillStyle(0x2a2245).fillRect(bx-6,by-2,13,2);
  const kx=184;gn.fillStyle(C.pl);gn.fillRect(kx-1,by-9,3,5);gn.fillRect(kx-1,by-12,3,3);gn.fillRect(kx-1,by-4,5,2);gn.fillRect(kx+3,by-2,2,2);gn.fillStyle(C.cape);gn.fillRect(kx-3,by-10,2,8);
  this.fx.draw(ga,gn);
  const title='ASHEN VIGIL',sc=4,tw=textW(title,sc),tx=Math.round(W/2-tw/2),ty=38;
  drawText(g,title,tx,ty+1,0x3a1a10,sc,null);drawText(g,title,tx,ty,0xffb04a,sc,0x1a0d22);
  // ember rim on title letters
  g.fillStyle(0xfff0c0,1);for(let i=0;i<title.length;i++)if(title[i]!==' ')g.fillRect(tx+i*16,ty,4,1);
  if(Math.random()<.5)this.fx.ember(rnd(tx,tx+tw),ty+20,1,.6);
  drawText(g,'A TALE OF THE LAST KINDLING',Math.round(W/2-textW('A TALE OF THE LAST KINDLING')/2),ty+26,0x8a86c0);
  const blink=Math.floor(this.t*2)%2===0;
  if(this.save){drawText(g,(this.sel===0?'> ':'  ')+'CONTINUE',118,112,this.sel===0?0xffe2a8:0x6b67a0);drawText(g,(this.sel===1?'> ':'  ')+'NEW GAME',118,121,this.sel===1?0xffe2a8:0x6b67a0)}
  else if(blink)drawText(g,'PRESS ENTER',Math.round(W/2-textW('PRESS ENTER')/2),116,0xffe2a8);
  drawText(g,'ARROWS MOVE  Z JUMP  X ATTACK  C ROLL  V FROST  S STORM  UP REST',6,170,0x5d5990,1,null)}}
// ===================================================================
class Lab extends Phaser.Scene{constructor(){super('lab')}
 create(){makeBG(this)(0);this.add.tileSprite(0,GY,W,24,'ground').setOrigin(0);this.fx=new FX(this);this.ga=this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);this.gn=this.add.graphics();this.t=0}
 update(_,d){const dt=d/1000;this.t+=dt;const ga=this.ga,gn=this.gn;ga.clear();gn.clear();
  SLASH_V.forEach((V,i)=>{const x=50+i*110,y=50,t=(this.t%0.6)/V.dur;if(t<=1)drawSlash(ga,x,y,1,t,V);drawText(gn,'SLASH '+V.name,x-30,72,V===SLASH?0xffe2a8:0x8a86c0)});
  ICE_V.forEach((V,i)=>{const x0=20+i*105,ct=this.t%1.6;for(let k=0;k<V.n;k++){const st=k*.05;const tt=clamp((ct-st)/V.grow,0,1);if(ct-st>0&&ct<1.2){const h=lerp(V.hMin,V.hMax,((k*37)%10)/10)*ease(tt);drawSpike(ga,gn,x0+k*V.step*.8,GY,h,V.hw,tt,0);glow(ga,x0+k*V.step*.8,GY-2,6,C.ice3,.15)}}
   drawText(gn,'ICE '+V.name,x0,GY+8,V===ICEP?0xffe2a8:0x8a86c0)});
  if(Q.has('bolt')){const bp=Stage.prototype.boltPath(260);for(let i=1;i<bp.pts.length;i++)line(ga,bp.pts[i-1][0],bp.pts[i-1][1],bp.pts[i][0],bp.pts[i][1],C.boltC,1)}if(Math.random()<.8)this.fx.fire(160,120,2);this.fx.update(dt);this.fx.draw(ga,gn)}}
// ===================================================================
class Stage extends Phaser.Scene{constructor(){super('stage')}
 init(d){this.fresh=d.fresh}
 create(){
  const sv=(!this.fresh&&Save.load())||{bonfire:false,souls:0,bossDown:false};this.sv=sv;
  this.physics.world.setBounds(0,-60,WORLD,H+60);
  this.bgf=makeBG(this);
  this.add.tileSprite(0,GY,WORLD,24,'ground').setOrigin(0).setDepth(1);
  this.gs=this.add.graphics().setDepth(0);// static deco
  this.gn=this.add.graphics().setDepth(3);// actors (normal)
  this.ga=this.add.graphics().setDepth(4).setBlendMode(Phaser.BlendModes.ADD);// light & fx
  this.gu=this.add.graphics().setDepth(50).setScrollFactor(0);// hud
  this.gua=this.add.graphics().setDepth(49).setScrollFactor(0).setBlendMode(Phaser.BlendModes.ADD);
  this.fx=new FX(this);
  // solids
  this.solids=[];const solid=(x,y,w,h,oneway)=>{const r=this.add.rectangle(x+w/2,y+h/2,w,h).setVisible(false);this.physics.add.existing(r,true);if(oneway){r.body.checkCollision.down=false;r.body.checkCollision.left=false;r.body.checkCollision.right=false}this.solids.push(r);return r};
  solid(0,GY,WORLD,30);
  this.plats=[[430,128,48],[540,108,40],[1000,124,64],[1110,100,48],[1820,126,56],[1930,104,40],[2160,118,48],[2290,96,48],[2400,120,40]];
  this.plats.forEach(([x,y,w])=>{solid(x,y,w,6,true);this.add.tileSprite(x,y,w,8,'plat').setOrigin(0).setDepth(1)});
  this.gateL=solid(ARENA_L-8,0,8,GY,false);this.gateL.body.enable=false;
  // static deco: broken pillars & arches in front of skyline
  const g=this.gs;for(let x=180;x<WORLD;x+=230+((x*7)%60)){const h=40+((x*13)%30);g.fillStyle(0x130f2a);g.fillRect(x,GY-h,8,h);g.fillRect(x-2,GY-h,12,3);g.fillStyle(0x221b43);g.fillRect(x,GY-h+3,1,h-3);
   if((x/230|0)%2){g.fillStyle(0x130f2a);for(let a=0;a<=20;a++){const ax=x+8+a*2,ay=GY-h-Math.round(Math.sin(a/20*Math.PI)*10)+6;g.fillRect(ax,ay,2,3)}}}
  this.braziers=[];for(let x=120;x<WORLD-200;x+=320)this.braziers.push(x);this.braziers.push(ARENA_L+30,ARENA_R-30);
  this.bonfire={x:1600,lit:sv.bonfire};
  // player
  const sx=sv.bonfire?this.bonfire.x+14:START_X;
  this.pb=this.physics.add.image(sx,GY-12,'px').setVisible(false);this.pb.body.setSize(6,14);this.pb.setCollideWorldBounds(true);this.pb.body.setMaxVelocityY(330);
  this.physics.add.collider(this.pb,this.solids);
  this.player={x:sx,y:GY,f:1,hp:100,hpMax:100,fp:80,fpMax:80,st:100,stMax:100,stDelay:0,state:'idle',t:0,inv:0,run:0,coy:0,buf:0,flash:0,dead:false,cast:0};
  this.souls=sv.souls||0;
  // enemies
  this.enemies=[];const E=(k,x)=>this.spawnEnemy(k,x);
  [['hollow',360],['imp',520],['hollow',720],['wraith',900],['hollow',1180],['imp',1260],['wraith',1380],['imp',1900],['hollow',2020],['wraith',2250],['hollow',2460],['imp',2600],['hollow',2760],['wraith',2850]].forEach(([k,x])=>E(k,x));
  this.shots=[];this.spells=[];this.bolts=[];this.novas=[];
  this.boss=null;this.bossState=sv.bossDown?'dead':'sleep';this.cine=null;this.bars=0;
  this.cam=this.cameras.main;this.cam.setBounds(0,0,WORLD,H);this.cam.startFollow(this.pb,true,.12,0,0,0);this.camOff=0;
  this.keys=this.input.keyboard.addKeys('LEFT,RIGHT,UP,DOWN,Z,X,C,V,S,E,SPACE,SHIFT,ENTER');
  this.inp={};this.hs=0;this.msg=null;this.t=0;this.flashA=0;this.ai={t:0,roll:2.5,bolt:3};
  this.cam.fadeIn(500,7,5,15);
  if(DEMO&&Q.has('boss')){this.pb.x=ARENA_L-60}
  this.say(sv.bonfire?'RESTED AT GATE VIGIL':'THE ASHEN RAMPARTS',2.5)}
 say(s,d=2){this.msg={s,t:d}}
 sfx(k,v=.35){try{this.sound.play(k,{volume:v})}catch(e){}}
 spawnEnemy(k,x){const b=this.physics.add.image(x,GY-20,'px').setVisible(false);const S={hollow:[8,14],wraith:[10,12],imp:[7,6]}[k];b.body.setSize(S[0],S[1]);b.setCollideWorldBounds(true);
  if(k==='wraith'){b.body.setAllowGravity(false);b.y=GY-40}else this.physics.add.collider(b,this.solids);
  const e={k,b,x0:x,hp:{hollow:4,wraith:3,imp:2}[k],state:'idle',t:rnd(0,1),f:-1,flash:0,dead:false,cd:rnd(1,2.5),souls:{hollow:30,wraith:60,imp:20}[k]};this.enemies.push(e);return e}
 // ---------------- input ----------------
 readInput(){const K=this.keys,J=Phaser.Input.Keyboard.JustDown;
  if(DEMO)return this.demoInput();
  return{l:K.LEFT.isDown,r:K.RIGHT.isDown,up:K.UP.isDown,jump:K.Z.isDown||K.SPACE.isDown,jumpP:J(K.Z)|J(K.SPACE),atkP:J(K.X),rollP:J(K.C)|J(K.SHIFT),iceP:J(K.V),boltP:J(K.S),restP:J(K.UP)|J(K.E)}}
 demoInput(){const P=this.player,A=this.ai,o={l:0,r:0,jump:0,jumpP:0,atkP:0,rollP:0,iceP:0,boltP:0,restP:0};A.t+=this.dt;A.roll-=this.dt;A.bolt-=this.dt;
  let near=null,nd=1e9;for(const e of this.enemies)if(!e.dead){const d=e.b.x-P.x;if(d>-20&&d<nd){nd=d;near=e}}
  const B=this.boss&&this.bossState==='fight'?this.boss:null;
  if(this.cine){return o}
  if(B){const d=B.x-P.x;const dist=Math.abs(d);P.f=Math.sign(d)||1;
   if(B.state==='wind'&&dist<46&&A.roll<1.5){o.rollP=1;o[d>0?'l':'r']=1;A.roll=2.2;return o}
   if(dist>26)o[d>0?'r':'l']=1;else if(Math.random()<.25)o.atkP=1;
   if(dist>50&&P.fp>=20&&A.bolt<0){o.boltP=1;A.bolt=2.4}else if(dist<90&&dist>30&&P.fp>=15&&Math.random()<.04)o.iceP=1;
   return o}
  o.r=1;
  if(near){const d=near.b.x-P.x,dy=Math.abs(near.b.y-P.y);if(d<20&&d>-14&&dy<26){o.r=d>8;if(Math.random()<.35)o.atkP=1}
   else if(d<95&&d>40&&P.fp>=15&&Math.random()<.05&&near.k!=='wraith')o.iceP=1;
   if(near.k==='wraith'&&d<150&&d>0&&P.fp>=20&&A.bolt<0){o.boltP=1;A.bolt=3}}
  if(A.roll<0&&near&&near.b.x-P.x<70&&near.b.x-P.x>40){o.rollP=1;A.roll=3.5}
  if(this.pb.body.blocked.right||Math.random()<.01){o.jumpP=1;o.jump=1;A.hold=.25}
  if(A.hold>0){A.hold-=this.dt;o.jump=1}
  if(P.x>this.bonfire.x-12&&P.x<this.bonfire.x&&!this.bonfire.lit)o.restP=1;
  if(P.hp<35)P.hp=60;// demo godmode
  return o}
 // ---------------- update ----------------
 update(time,delta){const dt=Math.min(delta,50)/1000;this.dt=dt;this.t+=dt;
  if(this.hs>0){this.hs-=dt;if(this.hs<=0)this.physics.resume();this.render(0);return}
  const P=this.player,b=this.pb,inp=this.cine||P.dead?{}:this.readInput();this.inp=inp;
  P.x=b.x;P.y=b.body.bottom;
  this.updatePlayer(dt,inp);this.updateEnemies(dt);this.updateBoss(dt);this.updateSpells(dt);this.updateCine(dt);
  // ambient fx
  for(const x of this.braziers)if(Math.abs(x-this.cam.scrollX-160)<200){this.fx.fire(x,GY-15,2,2);if(Math.random()<.06)this.fx.ember(x,GY-18,1)}
  if(Math.abs(this.bonfire.x-P.x)<240){const n=this.bonfire.lit?2:1;for(let i=0;i<n;i++)this.fx.fire(this.bonfire.x,GY-3,1,this.bonfire.lit?4:2,this.bonfire.lit?1.3:.7);if(Math.random()<.15)this.fx.ember(this.bonfire.x,GY-8,1)}
  if(this.cam.scrollX>ARENA_L-320&&Math.random()<.6)this.fx.snow(this.cam.scrollX+rnd(-20,340),-2);
  if(Q.get('still')==='dome'&&!this._sd&&this.t>2.5){this._sd=1;this.novas.push({dome:1,harmless:1,x:this.player.x+70,y:GY,R:80,grow:.5,t:0,m:3});setTimeout(()=>window.__dome=1,900)}
  if(Q.get('still')==='bolt'&&!this._sb&&this.t>2.5){this._sb=1;this.castBolt();setTimeout(()=>window.__bolt=1,130)}
  this.fx.update(dt);
  // camera look-ahead
  if(!this.cine){this.camOff=lerp(this.camOff,-P.f*36,1-Math.pow(.02,dt));this.cam.setFollowOffset(Math.round(this.camOff),0)}
  this.render(dt)}
 updatePlayer(dt,inp){const P=this.player,b=this.pb,body=b.body,on=body.blocked.down;P.t+=dt;P.inv-=dt;P.flash-=dt;P.stDelay-=dt;
  if(P.dead){b.setVelocityX(0);P.deadT+=dt;if(P.deadT>2.6)this.respawn();return}
  if(P.stDelay<=0)P.st=Math.min(P.stMax,P.st+45*dt);P.fp=Math.min(P.fpMax,P.fp+2*dt);
  P.coy=on?.1:P.coy-dt;P.buf=inp.jumpP?.12:P.buf-dt;
  const busy=P.state==='roll'||P.state==='atk'||P.state==='cast'||P.state==='hurt'||P.state==='rest';
  let dir=(inp.r?1:0)-(inp.l?1:0);
  if(!busy){if(dir)P.f=dir;const tv=dir*100,acc=on?(dir?900:1300):600;const vx=body.velocity.x;b.setVelocityX(vx+clamp(tv-vx,-acc*dt,acc*dt));
   if(P.buf>0&&P.coy>0){b.setVelocityY(-280);P.buf=0;P.coy=0;this.fx.dust(P.x,P.y,5);this.sfx('jump',.25)}
   if(!inp.jump&&body.velocity.y<-80)b.setVelocityY(body.velocity.y*.55);
   if(body.velocity.y>0)body.velocity.y+=500*dt;
   if(on&&dir&&Math.abs(body.velocity.x)>60){P.run+=dt*14;if(Math.random()<.08)this.fx.dust(P.x-P.f*3,P.y,1,-P.f)}
   P.state=on?(Math.abs(body.velocity.x)>8?'run':'idle'):(body.velocity.y<0?'jump':'fall');
   if(!P.wasOn&&on&&P.lastVy>160){this.fx.dust(P.x,P.y,8);P.land=.12}
   if(inp.rollP&&on&&P.st>=10){P.state='roll';P.t=0;P.st-=20;P.stDelay=.6;b.setVelocityX(P.f*180);this.fx.dust(P.x,P.y,6,-P.f);this.sfx('roll',.3)}
   else if(inp.atkP&&P.st>=8){P.state='atk';P.t=0;P.st-=14;P.stDelay=.6;P.hitDone=false;this.sfx('slash',.3);if(on)b.setVelocityX(P.f*30)}
   else if(inp.iceP&&P.fp>=15){P.state='cast';P.spell='ice';P.t=0;P.fp-=15;b.setVelocityX(0);this.sfx('charge',.25)}
   else if(inp.boltP&&P.fp>=20){P.state='cast';P.spell='bolt';P.t=0;P.fp-=20;b.setVelocityX(0);this.sfx('charge',.25)}
   else if(inp.restP&&on&&Math.abs(P.x-this.bonfire.x)<18){P.state='rest';P.t=0;b.setVelocityX(0);this.rest()}}
  else if(P.state==='roll'){P.inv=Math.max(P.inv,P.t<.3?.05:0);if(Math.random()<.4)this.fx.dust(P.x,P.y,1,-P.f);if(P.t>.36){P.state='idle';b.setVelocityX(P.f*60)}}
  else if(P.state==='atk'){b.setVelocityX(body.velocity.x*.85);if(P.t>.05&&P.t<.15&&!P.hitDone)this.meleeHit();if(P.t>.26)P.state='idle'}
  else if(P.state==='cast'){if(Math.random()<.6){const hx=P.x+P.f*7,hy=P.y-11;P.spell==='ice'?this.fx.star(hx+rnd(-3,3),hy+rnd(-3,3)):this.fx.spark(hx,hy,1,C.bolt,40)}
   if(P.t>.22&&!P.castDone){P.castDone=true;P.spell==='ice'?this.castIce(P.x+P.f*16,P.f,'p'):this.castBolt()}if(P.t>.42){P.state='idle';P.castDone=false}}
  else if(P.state==='hurt'){if(P.t>.3)P.state='idle'}
  else if(P.state==='rest'){if(P.t>1.4)P.state='idle'}
  P.land-=dt;P.wasOn=on;P.lastVy=body.velocity.y;
  if(P.hp<=0&&!P.dead)this.die()}
 hurtPlayer(n,src){const P=this.player;if(P.inv>0||P.dead||this.cine)return;P.hp-=n;P.inv=.8;P.flash=.12;P.state='hurt';P.t=0;
  const d=Math.sign(P.x-src)||1;this.pb.setVelocity(d*120,-140);this.cam.shake(120,.012);this.fx.spark(P.x,P.y-8,10,C.f2,110);this.sfx('hit',.4);this.hitstop(.06)}
 hitstop(s){this.hs=s;this.physics.pause()}
 meleeHit(){const P=this.player;const hx=P.x+P.f*12,hy=P.y-8;let any=false;
  const hit=(x,y,w,h)=>Math.abs(x-hx)<w/2+11&&Math.abs(y-hy)<h/2+9;
  for(const e of this.enemies){if(e.dead)continue;const bb=e.b.body;if(hit(bb.center.x,bb.center.y,bb.width,bb.height)){this.damageEnemy(e,1,P.f);any=true}}
  const B=this.boss;if(B&&this.bossState==='fight'&&hit(B.x,B.y-16,18,32)){this.damageBoss(1.5);any=true}
  if(any){P.hitDone=true;this.hitstop(.055);this.cam.shake(70,.006)}}
 damageEnemy(e,n,dir){e.hp-=n;e.flash=.1;this.fx.spark(e.b.x,e.b.y,10,0xffd04a,120,20);this.sfx('hit',.3);if(e.k!=='wraith')e.b.setVelocity(dir*90,-60);else e.b.x+=dir*6;
  if(e.hp<=0&&!e.dead){e.dead=true;e.deadT=0;e.b.body.enable=false;this.fx.soul(e.b.x,e.b.y,8);this.souls+=e.souls;this.fx.dust(e.b.x,GY,10);
   if(e.k==='imp')this.explode(e.b.x,e.b.y,false)}}
 explode(x,y,hurts){this.fx.fire(x,y,30,6,1.4);this.fx.spark(x,y,16,C.f1,150);this.fx.ember(x,y,10,2);this.novas.push({x,y,t:0,m:.25,fire:1});this.cam.shake(140,.01);
  if(hurts&&Math.hypot(this.player.x-x,this.player.y-8-y)<22)this.hurtPlayer(18,x)}
 die(){const P=this.player;P.dead=true;P.deadT=0;this.fx.ember(P.x,P.y-8,30,2);this.sfx('death',.5);this.say('EMBER EXTINGUISHED',2.4);this.souls=0}
 respawn(){this.sv.souls=0;Save.write({...this.sv,souls:0});this.scene.restart({fresh:false})}
 rest(){const P=this.player;P.hp=P.hpMax;P.fp=P.fpMax;P.st=P.stMax;const first=!this.bonfire.lit;this.bonfire.lit=true;this.fx.ember(this.bonfire.x,GY-8,40,2.2);this.fx.spark(this.bonfire.x,GY-6,16,C.f1,90,40);
  this.sfx('bonfire',.5);this.say(first?'BONFIRE LIT - GATE VIGIL':'RESTED. PROGRESS SAVED',2.4);
  // respawn enemies (DS rule) and save
  this.enemies.forEach(e=>{if(e.dead&&Math.abs(e.x0-P.x)>200){e.dead=false;e.hp={hollow:4,wraith:3,imp:2}[e.k];e.b.body.enable=true;e.b.setPosition(e.x0,e.k==='wraith'?GY-40:GY-20)}});
  this.sv={bonfire:true,souls:this.souls,bossDown:this.bossState==='dead'};Save.write(this.sv)}
 // ---------------- spells ----------------
 castIce(x,f,owner){const V=ICEP;for(let i=0;i<V.n;i++)this.spells.push({k:'spike',x:Math.round(x+i*V.step*f),t:-i*.045,h:lerp(V.hMin,V.hMax,Math.abs(Math.sin(i*2.3+x))),lean:rnd(-.4,.4),owner,hit:false});this.cam.shake(80,.004)}
 castBolt(){const P=this.player;let tx=P.x+P.f*90,best=null,bd=170;
  const cands=this.enemies.filter(e=>!e.dead).map(e=>({x:e.b.x,e}));if(this.boss&&this.bossState==='fight')cands.push({x:this.boss.x,boss:1});
  for(const c of cands){const d=(c.x-P.x)*P.f;if(d>0&&d<bd){bd=d;best=c}}if(best)tx=best.x;
  this.bolts.push({x:tx,t:0,pts:null,hit:false,target:best});this.sfx('shot',.4)}
 boltPath(x){const pts=[[x+rnd(-20,20),-4]];let cx=pts[0][0];for(let y=-4;y<GY;y+=ri(5,9)){cx+=rnd(-6,6);cx=lerp(cx,x,(y+20)/(GY+20)*.35);pts.push([cx,y])}pts.push([x,GY]);
  const br=[];for(let k=0;k<2;k++){const i=ri(3,pts.length-6);let [bx,by]=pts[i];const seg=[[bx,by]];const dir=Math.random()<.5?-1:1;for(let j=0;j<ri(3,6);j++){bx+=dir*rnd(3,8);by+=rnd(4,9);seg.push([bx,by])}br.push(seg)}return{pts,br}}
 updateSpells(dt){
  for(let i=this.spells.length-1;i>=0;i--){const s=this.spells[i];const was=s.t;s.t+=dt;if(s.t<0)continue;
   if(was<0){this.fx.shard(s.x,GY,4,60);this.fx.star(s.x+rnd(-4,4),GY-rnd(4,16))}
   if(s.t<.5&&Math.random()<.15)this.fx.star(s.x+rnd(-5,5),GY-rnd(2,s.h));
   if(!s.hit&&s.t>.03&&s.t<.3){if(s.owner==='p'){for(const e of this.enemies)if(!e.dead&&Math.abs(e.b.x-s.x)<9&&e.b.body.bottom>GY-s.h){this.damageEnemy(e,2,Math.sign(e.b.x-this.player.x));s.hit=true}
     if(this.boss&&this.bossState==='fight'&&Math.abs(this.boss.x-s.x)<12&&!s.bhit){this.damageBoss(1.2);s.bhit=true}}
    else if(Math.abs(this.player.x-s.x)<6)this.hurtPlayer(16,s.x)}
   if(s.t>.75){this.fx.shard(s.x,GY-s.h*.5,10,100);this.spells.splice(i,1)}}
  for(let i=this.bolts.length-1;i>=0;i--){const o=this.bolts[i];o.t+=dt;if(o.target&&o.target.e&&!o.target.e.dead)o.x=o.target.e.b.x;if(o.target&&o.target.boss)o.x=this.boss.x;
   if(!o.pts||Math.floor(o.t*14)!==o.fr){o.fr=Math.floor(o.t*14);o.pts=this.boltPath(o.x)}
   if(!o.hit&&o.t>.06){o.hit=true;this.flashA=.18;this.cam.shake(180,.014);this.fx.spark(o.x,GY-2,18,C.bolt,170,60);this.fx.spark(o.x,GY-2,8,0x5ad8ff,140,50);this.fx.spark(o.x,GY-2,6,C.f1,120,40);this.fx.dust(o.x,GY,8);this.novas.push({x:o.x,y:GY,t:0,m:.25,bolt:1});
    if(o.target&&o.target.e)this.damageEnemy(o.target.e,3,this.player.f);if(o.target&&o.target.boss)this.damageBoss(3);this.hitstop(.05)}
   if(o.t>.5)this.bolts.splice(i,1)}
  for(let i=this.novas.length-1;i>=0;i--){const n=this.novas[i];n.t+=dt;
   if(n.dome){const r=n.R*ease(Math.min(1,n.t/n.grow));if(!n.done&&n.t>n.grow*.9){n.done=true;const d=Math.hypot(this.player.x-n.x,(this.player.y-6)-n.y);if(!n.harmless&&d<n.R)this.hurtPlayer(22,n.x)}
    if(n.t>n.grow&&!n.burst){n.burst=true;for(let a=0;a<40;a++){const an=Math.PI+a/40*Math.PI;this.fx.add({k:'shard',x:n.x+Math.cos(an)*r,y:n.y+Math.sin(an)*r,vx:Math.cos(an)*40,vy:Math.sin(an)*40,l:0,m:rnd(.4,.8)})}this.cam.shake(160,.01)}}
   if(n.t>n.m)this.novas.splice(i,1)}
  // wraith frost orbs
  for(let i=this.shots.length-1;i>=0;i--){const s=this.shots[i];s.t+=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;if(Math.random()<.6)this.fx.add({k:'shard',x:s.x,y:s.y,vx:rnd(-8,8),vy:rnd(-8,8),l:0,m:.3});
   const P=this.player;if(Math.hypot(P.x-s.x,P.y-7-s.y)<6){this.hurtPlayer(12,s.x);this.fx.shard(s.x,s.y,10);this.shots.splice(i,1);continue}
   if(s.y>GY||s.t>3){this.fx.shard(s.x,s.y,8);this.shots.splice(i,1)}}}
 // ---------------- enemies ----------------
 updateEnemies(dt){const P=this.player;for(const e of this.enemies){if(e.dead){e.deadT+=dt;continue}const b=e.b;e.t+=dt;e.flash-=dt;e.cd-=dt;const dx=P.x-b.x,adx=Math.abs(dx);
   if(adx>260)continue;
   if(e.k==='hollow'){const on=b.body.blocked.down;
    if(e.state==='idle'){if(adx<110){e.state='chase'}b.setVelocityX(on?b.body.velocity.x*.8:b.body.velocity.x)}
    else if(e.state==='chase'){e.f=Math.sign(dx)||1;if(on)b.setVelocityX(e.f*38);if(adx<22&&e.cd<0){e.state='wind';e.t=0;b.setVelocityX(0)}}
    else if(e.state==='wind'){if(e.t>.45){e.state='swing';e.t=0;b.setVelocityX(e.f*70);this.sfx('slash',.2)}}
    else if(e.state==='swing'){if(e.t<.12&&adx<20&&Math.abs(P.y-b.body.bottom)<16)this.hurtPlayer(14,b.x);if(e.t>.35){e.state='chase';e.cd=1.2;b.setVelocityX(0)}}
    e.run=(e.run||0)+Math.abs(b.body.velocity.x)*dt*.35}
   else if(e.k==='wraith'){e.f=Math.sign(dx)||1;const ty=GY-44+Math.sin(e.t*2.2)*8;b.y+=(ty-b.y)*dt*3;b.x+=clamp(dx-e.f*70,-1,1)*22*dt*(adx>50?1:-.5);
    if(Math.random()<.3)this.fx.add({k:'shard',x:b.x+rnd(-3,3),y:b.y+6,vx:0,vy:rnd(4,12),l:0,m:.5});
    if(e.cd<0&&adx<170){e.cd=2.4;e.cast=.4}if(e.cast>0){e.cast-=dt;if(e.cast<=0){const a=Math.atan2(P.y-8-b.y,dx);this.shots.push({x:b.x,y:b.y,vx:Math.cos(a)*85,vy:Math.sin(a)*85,t:0});this.sfx('shot',.15)}}}
   else if(e.k==='imp'){const on=b.body.blocked.down;e.f=Math.sign(dx)||1;if(Math.random()<.3)this.fx.fire(b.x,b.y-3,1,2,.6);
    if(e.state==='idle'&&adx<130)e.state='hop';
    if(e.state==='hop'&&on&&e.cd<0){b.setVelocity(e.f*rnd(50,80),-rnd(150,200));e.cd=rnd(.5,.9);this.fx.dust(b.x,b.body.bottom,3)}
    if(e.state==='hop'&&adx<16&&Math.abs(P.y-b.body.bottom)<14){e.state='fuse';e.t=0;b.setVelocityX(0)}
    if(e.state==='fuse'&&e.t>.5){e.dead=true;e.deadT=0;b.body.enable=false;this.explode(b.x,b.y,true)}}}}
 // ---------------- boss: The Frost Warden ----------------
 updateBoss(dt){const P=this.player;
  if(this.bossState==='sleep'&&P.x>ARENA_L+20){this.bossState='cine';this.startCine()}
  const B=this.boss;if(!B)return;B.t+=dt;B.flash-=dt;
  if(this.bossState==='fight'){const dx=P.x-B.x,adx=Math.abs(dx);B.cd-=dt;
   if(Math.random()<.5)this.fx.add({k:'shard',x:B.x+rnd(-8,8),y:B.y-rnd(4,30),vx:rnd(-6,6),vy:rnd(-12,-2),l:0,m:.5});
   if(B.state==='walk'){B.f=Math.sign(dx)||1;B.x+=B.f*(B.phase2?34:26)*dt;B.step+=dt*6;
    if(B.cd<0){const r=Math.random();B.next=adx<40?(r<.6?'slam':'nova'):(r<.45?'charge':r<.8?'slam':'nova');if(!B.phase2&&B.next==='nova'&&Math.random()<.5)B.next='slam';B.state='wind';B.t=0}}
   else if(B.state==='wind'){const wt=B.next==='charge'?.5:B.next==='nova'?.6:.55;if(Math.random()<.7)this.fx.star(B.x+B.f*rnd(4,16),B.y-rnd(20,36));
    if(B.t>wt){B.state=B.next;B.t=0;if(B.next==='slam'){this.cam.shake(220,.02);this.fx.dust(B.x+B.f*16,GY,16);this.castIce(B.x+B.f*20,B.f,'b');this.sfx('death',.25);this.fx.shard(B.x+B.f*16,GY,16,120)}
     if(B.next==='nova'){this.novas.push({dome:1,x:B.x,y:GY,R:B.phase2?86:70,grow:.5,t:0,m:1.3});this.sfx('parry',.35)}
     if(B.next==='charge'){B.f=Math.sign(dx)||1}}}
   else if(B.state==='slam'){if(B.t<.1&&Math.abs(P.x-(B.x+B.f*16))<16)this.hurtPlayer(24,B.x);if(B.t>.6){B.state='walk';B.cd=rnd(.8,1.6)*(B.phase2?.7:1)}}
   else if(B.state==='nova'){if(B.t>1){B.state='walk';B.cd=rnd(.8,1.4)}}
   else if(B.state==='charge'){B.x+=B.f*200*dt;if(Math.random()<.9)this.fx.dust(B.x-B.f*8,GY,1,-B.f);this.fx.add({k:'shard',x:B.x-B.f*6,y:GY-rnd(2,20),vx:-B.f*30,vy:0,l:0,m:.4});
    if(Math.abs(P.x-B.x)<12&&Math.abs(P.y-GY)<26)this.hurtPlayer(20,B.x);
    if(B.x<ARENA_L+20||B.x>ARENA_R-20||B.t>.9){B.x=clamp(B.x,ARENA_L+20,ARENA_R-20);B.state='walk';B.cd=rnd(.6,1.2);this.cam.shake(150,.015);this.fx.dust(B.x,GY,12)}}
   B.x=clamp(B.x,ARENA_L+16,ARENA_R-16);
   if(!B.phase2&&B.hp<B.hpMax*.5){B.phase2=true;this.say('THE WARDEN\'S RIME DEEPENS',1.8);this.novas.push({dome:1,x:B.x,y:GY,R:96,grow:.6,t:0,m:1.4});this.cam.shake(300,.02)}
   if(B.hp<=0){this.bossState='dying';B.t=0;this.sfx('death',.6);this.say('WARDEN SLAIN',3);this.cam.shake(600,.02)}}
  if(this.bossState==='dying'){if(Math.random()<.9)this.fx.shard(B.x+rnd(-10,10),B.y-rnd(0,34),2,120);if(Math.random()<.3)this.fx.spark(B.x+rnd(-8,8),B.y-rnd(0,30),4,C.ice2);
   if(B.t>2.2){this.bossState='dead';this.fx.soul(B.x,B.y-16,60);this.souls+=2000;this.gateL.body.enable=false;this.sv={bonfire:this.bonfire.lit,souls:this.souls,bossDown:true};Save.write(this.sv);this.say('VICTORY ACHIEVED - PROGRESS SAVED',4);this.boss=null}}}
 damageBoss(n){const B=this.boss;if(!B||this.bossState!=='fight')return;B.hp-=n;B.flash=.1;this.fx.spark(B.x,B.y-18,12,C.ice1,130,30);this.sfx('hit',.35)}
 startCine(){this.gateL.body.enable=true;this.boss={x:ARENA_R-60,y:GY,f:-1,hp:40,hpMax:40,t:0,state:'rise',cd:1.5,flash:0,step:0,eyes:0,rise:0};
  this.cine={t:0};this.cam.stopFollow();this.pb.setVelocityX(0);this.player.state='idle';this.cam.pan(ARENA_R-110,90,900,'Sine.easeInOut')}
 updateCine(dt){const c=this.cine;if(!c)return;c.t+=dt;const B=this.boss;this.bars=Math.min(1,c.t/.5);
  if(c.t>.9&&c.t<1.6){B.rise=ease((c.t-.9)/.7);if(Math.random()<.9)this.fx.shard(B.x+rnd(-14,14),GY,2,80);if(!c.shk){c.shk=1;this.cam.shake(700,.012);this.sfx('charge',.5)}}
  if(c.t>1.6){B.eyes=Math.min(1,(c.t-1.6)/.3);if(!c.ign){c.ign=1;this.fx.spark(B.x-3,B.y-29,14,C.ice1,90);this.novas.push({dome:1,x:B.x,y:GY,R:64,grow:.45,t:0,m:1.2,harmless:1});this.flashA=.25}}
  if(c.t>3.8){this.bars=Math.max(0,1-(c.t-3.8)/.4)}
  if(c.t>4.2){this.cine=null;this.bars=0;this.bossState='fight';B.state='walk';B.rise=1;this.cam.startFollow(this.pb,true,.12,0,Math.round(this.camOff),0)}}
 // ---------------- render ----------------
 render(dt){const g=this.gn,ga=this.ga,cam=this.cam,P=this.player;g.clear();ga.clear();this.bgf(cam.scrollX);const t=this.t;
  // braziers
  for(const x of this.braziers){g.fillStyle(0x0d0a1c);g.fillRect(x-1,GY-12,3,12);g.fillRect(x-4,GY-14,9,2);g.fillRect(x-3,GY-12,7,1);g.fillRect(x-3,GY-1,7,1);
   glow(ga,x,GY-17,22+Math.sin(t*11+x)*1.2,C.f3,.13);glow(ga,x,GY-16,8,C.f2,.18);
   for(let k=0;k<4;k++){const hy=GY-24-k*7-((t*14+k*7)%7);const hx=x+Math.sin(t*5+k*1.7+x)*1.5;ga.fillStyle(0xff9040,.05);ga.fillRect(Math.round(hx)-1,Math.round(hy),3,4)}}// heat shimmer haze
  // bonfire
  {const x=this.bonfire.x,lit=this.bonfire.lit;g.fillStyle(0x2a2245);g.fillRect(x-7,GY-2,15,2);g.fillStyle(0x3a3060);g.fillRect(x-5,GY-3,11,1);line(g,x,GY-2,x+2,GY-17,0x8b86a8);line(g,x-2,GY-13,x+4,GY-12,0x8b86a8);px(g,x+2,GY-17,0xd8d0ee);
   glow(ga,x,GY-6,(lit?30:14)+Math.sin(t*9)*1.5,C.f2,lit?.17:.1);if(Math.abs(P.x-x)<18&&!this.cine)drawText(g,'UP: REST',x-15,GY-30,0xffe2a8)}
  // ice spikes
  for(const s of this.spells){if(s.t<0)continue;const gt=clamp(s.t/ICEP.grow,0,1);let h=s.h*ease(gt);if(s.t>.6)h*=1-(s.t-.6)/.15;
   glow(ga,s.x,GY-h*.4,6+h*.45,C.ice4,.12);glow(ga,s.x,GY-3,8+h*.25,C.ice3,.14);drawSpike(ga,g,s.x,GY-1,h,ICEP.hw*(s.owner==='b'?1.3:1),gt,s.lean);ga.fillStyle(C.ice2,.7);ga.fillRect(s.x-7,GY-1,15,1);for(let k=0;k<3;k++)px(ga,s.x+((k*5+Math.floor(s.t*20))%14)-7,GY-2,C.ice1,.8)}
  // novas / domes
  for(const n of this.novas){const k=n.t/n.m;
   if(n.dome){const r=n.R*ease(Math.min(1,n.t/n.grow)),a=n.t>n.grow?Math.max(0,1-(n.t-n.grow)/(n.m-n.grow)):1;drawDome(ga,n.x,GY,r,a,this.t,n.seed||(n.seed=ri(1,999)))}
   else if(n.fire){glow(ga,n.x,n.y,6+k*16,C.f2,.35*(1-k));}
   else if(n.bolt){glow(ga,n.x,n.y-3,8+k*12,C.bolt,.4*(1-k))}}
  // bolts
  for(const o of this.bolts){if(!o.pts)continue;const fade=o.t<.3?1:1-(o.t-.3)/.2;
   const dl=(pts,c,a,off)=>{for(let i=1;i<pts.length;i++)line(ga,pts[i-1][0]+off,pts[i-1][1],pts[i][0]+off,pts[i][1],c,a)};
   const M=o.pts.pts;{const ca=Math.min(1,o.t*8)*fade;for(let xx=Math.round(this.cam.scrollX)-2;xx<this.cam.scrollX+W+2;xx+=1){const yy=3+Math.round(Math.sin(xx*.21)*1.5+Math.sin(xx*.07+this.t*3)*2);this.gn.fillStyle(0x07050f,.8*ca);this.gn.fillRect(xx,0,1,yy);px(ga,xx,yy,0x6a58c8,.5*ca)}}glow(ga,o.x,GY-4,14,C.bolt,.2*fade);dl(M,C.bolt,.6*fade,-1);dl(M,C.bolt,.6*fade,1);dl(M,C.boltC,fade,0);o.pts.br.forEach(s=>dl(s,C.bolt,.8*fade,0));o.pts&&o.pts.pts;}
  // wraith shots
  for(const s of this.shots){glow(ga,s.x,s.y,6,C.ice3,.22);ga.fillStyle(C.ice1);ga.fillRect(Math.round(s.x)-1,Math.round(s.y)-1,3,3);px(ga,s.x,s.y,0xffffff)}
  // enemies
  for(const e of this.enemies)this.drawEnemy(g,ga,e);
  if(this.boss)this.drawBoss(g,ga,this.boss);
  this.drawPlayer(g,ga);
  this.fx.draw(ga,g);
  this.drawHUD()}
 drawPlayer(g,ga){const P=this.player;if(P.dead){const k=Math.min(1,P.deadT/1.2);g.fillStyle(C.plS,1-k);g.fillRect(Math.round(P.x)-4,Math.round(P.y)-2,8,2);return}
  if(P.inv>0&&P.state!=='roll'&&Math.floor(this.t*30)%2)return;
  const x=Math.round(P.x),y=Math.round(P.y),f=P.f,X=d=>x+d*f;const col=P.flash>0?0xffffff:C.pl,sh=P.flash>0?0xffffff:C.plS;
  glow(ga,x,y-8,14,C.f2,.05);
  if(P.state==='roll'){const a=P.t/.36*Math.PI*2*f;g.fillStyle(sh);g.fillCircle(x,y-4,4);g.fillStyle(col);g.fillCircle(x,y-4,3);px(g,x+Math.cos(a)*3,y-4+Math.sin(a)*3,C.plH);px(g,x-Math.cos(a)*3,y-4-Math.sin(a)*3,C.cape);return}
  let hipY=y-6,lean=0,legA=0,legB=0,liftA=0,liftB=0,crouch=P.land>0?1:0;
  if(P.state==='run'){legA=Math.sin(P.run)*3.2;legB=-legA;liftA=Math.max(0,Math.cos(P.run))*2;liftB=Math.max(0,-Math.cos(P.run))*2;lean=1;hipY-=Math.abs(Math.sin(P.run))>.7?1:0}
  else if(P.state==='jump'){legA=2;legB=-1;liftA=3;liftB=1}else if(P.state==='fall'){legA=-1;legB=2;liftA=1;liftB=2}
  else if(P.state==='idle'){hipY+=Math.sin(this.t*3)>.6?0:0}
  hipY+=crouch;
  // legs
  line(g,X(0),hipY,X(legA),y-liftA,sh);line(g,X(1),hipY,X(1+legB),y-liftB,col);
  // torso + head
  const nY=hipY-5;line(g,X(0+lean*0),hipY,X(lean),nY,col);line(g,X(1),hipY,X(1+lean),nY,col);
  g.fillStyle(col);g.fillRect(X(lean)-(f<0?2:0),nY-4,3,4);g.fillStyle(sh);px(g,X(lean+(f>0?2:0)),nY-4,sh);px(g,X(lean+1),nY-5,C.plH);
  // cape
  const cw=Math.sin(this.t*8)*1+(P.state==='run'?1:0);g.fillStyle(C.cape);for(let i=0;i<5;i++)px(g,X(-1-Math.round(i*.3*(1+cw*.3))),nY+i,C.cape);
  // arms & weapon
  const shX=X(lean),shY=nY+1;
  if(P.state==='atk'){const tt=P.t/.26;const ang=(-100+SLASH.sweep*ease(Math.min(1,tt*1.15)))*Math.PI/180;const hx=shX+Math.cos(ang)*4*f,hy=shY+Math.sin(ang)*4;line(g,shX,shY,hx,hy,col);
   line(g,hx,hy,hx+Math.cos(ang)*9*f,hy+Math.sin(ang)*9,C.steel);if(tt<1)drawSlash(ga,shX,shY,f,Math.min(1,P.t/SLASH.dur),SLASH)}
  else if(P.state==='cast'){const hx=shX+5*f,hy=shY-1;line(g,shX,shY,hx,hy,col);line(g,hx-f,hy+4,hx+f*2,hy-6,0x6a4a3a);const c=P.spell==='ice'?C.ice2:C.bolt;glow(ga,hx+f*2,hy-6,5+Math.sin(this.t*40),c,.35);px(ga,hx+f*2,hy-7,0xffffff)}
  else{const sw=P.state==='run'?Math.sin(P.run)*2:0;const hx=shX+(2+sw*.5)*f,hy=shY+4;line(g,shX,shY,hx,hy,col);line(g,hx,hy,hx+6*f,hy-5,C.steel);px(g,hx+f,hy,C.f1)}
  if(P.state==='rest'){glow(ga,x,y-8,12,C.f1,.15)}}
 drawEnemy(g,ga,e){const b=e.b,x=Math.round(b.x),y=Math.round(b.body.bottom),f=e.f,X=d=>x+d*f;
  if(e.dead){if(e.deadT<.5&&e.k!=='imp'){const k=e.deadT/.5;g.fillStyle(0x3a3157,1-k);g.fillRect(x-4,y-2,9,2);if(Math.random()<.5)this.fx.ember(x+rnd(-3,3),y-rnd(0,8),1,.5)}return}
  const fl=e.flash>0;
  if(e.k==='hollow'){const c=fl?0xffffff:0x5b4f7a,s=fl?0xffffff:0x3a3157;const ph=e.run||0;const la=Math.sin(ph)*2.5;
   line(g,X(0),y-5,X(la),y,s);line(g,X(1),y-5,X(1-la),y,c);g.fillStyle(c);g.fillRect(X(0)-(f<0?1:0),y-11,2,6);g.fillRect(X(1)-(f<0?2:0),y-14,3,3);px(g,X(0),y-12,s);
   const ey=e.state==='wind';px(g,X(3),y-13,ey?0xffffff:0xff5a3a);glow(ga,X(3),y-13,ey?5:2,0xff5a3a,ey?.4:.2);
   let ang=e.state==='wind'?-2.2+e.t*.3:e.state==='swing'?-2.2+Math.min(1,e.t/.1)*2.8:.9;const hx=X(1)+Math.cos(ang)*3*f,hy=y-10+Math.sin(ang)*3;line(g,X(1),y-10,hx,hy,c);line(g,hx,hy,hx+Math.cos(ang)*7*f,hy+Math.sin(ang)*7,0x9a92b8);
   if(e.state==='swing'&&e.t<.12)drawSlash(ga,X(1),y-10,f,e.t/.12,{r:10,th:2,sweep:160,trail:1})}
  else if(e.k==='wraith'){const cy=Math.round(b.y);const c=fl?0xffffff:0x24407a,l=fl?0xffffff:0x6fb0ff;glow(ga,x,cy+2,12,C.ice4,.16);
   for(let i=0;i<12;i++){const w=Math.round(i<4?i*1.2+1:4+Math.sin(i*.6)*0.5);const wav=i>8?Math.round(Math.sin(this.t*8+i)*1):0;g.fillStyle(c);g.fillRect(x-w+wav,cy-6+i,w*2+1,1);px(g,x-w+wav,cy-6+i,l,.8)}
   for(let k=-3;k<=3;k+=2)px(g,x+k+Math.round(Math.sin(this.t*9+k)),cy+6,c);
   g.fillStyle(0x0a0818);g.fillRect(x-2+f,cy-3,4,3);px(ga,x-1+f,cy-2,0xe8f6ff);px(ga,x+1+f,cy-2,0xe8f6ff);
   if(e.cast>0){glow(ga,x+f*6,cy,4+(.4-e.cast)*10,C.ice2,.35);sparkle(ga,x+f*6,cy,2,C.ice1)}}
  else if(e.k==='imp'){const fuse=e.state==='fuse';const c=fl||(fuse&&Math.floor(e.t*20)%2)?0xffffff:C.f3,l=C.f2;const sq=b.body.blocked.down?0:1;
   g.fillStyle(0x4a1008);g.fillRect(x-3,y-5-sq,7,5+sq);g.fillStyle(c);g.fillRect(x-3,y-6-sq,7,4+sq);g.fillStyle(l);g.fillRect(x-2,y-6-sq,5,1);px(g,x-1+f,y-4,C.f0);px(g,x+1+f,y-4,C.f0);
   glow(ga,x,y-4,fuse?6+e.t*16:6,C.f2,fuse?.3:.15)}}
 drawBoss(g,ga,B){const x=Math.round(B.x),f=B.f,rise=B.rise===undefined?1:B.rise;const y=Math.round(GY+(1-rise)*40),X=d=>x+d*f;const fl=B.flash>0;
  const c=fl?0xffffff:B.phase2?0x5a7ab8:0x4a4a78,s=fl?0xffffff:0x2a2a50,h=fl?0xffffff:0x9fb8e8;
  glow(ga,x,y-18,40,C.ice4,B.phase2?.14:.09);
  // clip below ground during rise (cinematic)
  const st=B.state==='walk'?Math.sin(B.step)*2:0;const wind=B.state==='wind';const crouch=wind?2:0;
  g.fillStyle(s);g.fillRect(X(-4+st)-(f<0?3:0),y-12,4,12);g.fillStyle(c);g.fillRect(X(2-st)-(f<0?3:0),y-12,4,12);// legs
  g.fillStyle(c);g.fillRect(x-7,y-28+crouch,14,16);g.fillStyle(s);g.fillRect(x-7,y-14+crouch,14,2);g.fillStyle(h);g.fillRect(x-7,y-28+crouch,14,1);
  g.fillStyle(c);g.fillRect(x-10,y-30+crouch,6,5);g.fillRect(x+4,y-30+crouch,6,5);g.fillStyle(h);g.fillRect(x-10,y-30+crouch,6,1);g.fillRect(x+4,y-30+crouch,6,1);// pauldrons
  g.fillStyle(c);g.fillRect(x-4,y-36+crouch,8,7);g.fillStyle(s);g.fillRect(X(0),y-33+crouch,4*f,2);// helm + visor
  line(g,x-4,y-36+crouch,x-8,y-42+crouch,h);line(g,x+3,y-36+crouch,x+7,y-42+crouch,h);// horns
  // cape tatters
  for(let i=0;i<14;i++)px(g,X(-8)-Math.round(Math.sin(this.t*4+i*.5)*1),y-28+i+crouch,0x1b1838);
  const ea=B.eyes===undefined?1:B.eyes;if(ea>0){px(ga,X(1),y-32+crouch,0xe8f6ff,ea);px(ga,X(3),y-32+crouch,0xe8f6ff,ea);glow(ga,X(2),y-32+crouch,5,C.ice2,.35*ea)}
  // greatsword
  let ang=B.state==='wind'?(B.next==='charge'?.1:-1.9):B.state==='slam'?Math.min(1,B.t/.08)*1.3-.2:B.state==='charge'?.05:.9;
  const hx=X(9),hy=y-24+crouch;const ex=hx+Math.cos(ang)*24*f,ey=hy+Math.sin(ang)*24;line(g,hx,hy,ex,ey,C.ice2);line(g,hx+0,hy+1,ex,ey+1,C.ice4);px(ga,ex,ey,0xffffff);glow(ga,(hx+ex)/2,(hy+ey)/2,6,C.ice3,.15);
  if(B.state==='slam'&&B.t<.12)drawSlash(ga,X(9),y-24,f,B.t/.12,{r:22,th:4,sweep:150,trail:1});
  // ground mask during rise
  if(rise<1){g.fillStyle(0x352c5e);g.fillRect(x-14,GY,28,40);g.fillStyle(0x4b4078);g.fillRect(x-14,GY,28,1)}}
 drawHUD(){const g=this.gu,ga=this.gua,P=this.player;g.clear();ga.clear();
  // letterbox
  if(this.bars>0){const bh=Math.round(22*this.bars);g.fillStyle(0x05040b);g.fillRect(0,0,W,bh);g.fillRect(0,H-bh,W,bh)}
  if(this.flashA>0){ga.fillStyle(0xd8d0ff,this.flashA);ga.fillRect(0,0,W,H);this.flashA-=this.dt*2.2}
  const c=this.cine;
  if(c&&c.t>1.9&&c.t<3.9){const a=Math.min(1,(c.t-1.9)/.3)*Math.min(1,(3.9-c.t)/.3);const n='FROST WARDEN',sub='KEEPER OF THE ASHEN RAMPARTS';
   drawText(g,n,Math.round(W/2-textW(n,2)/2),130,0xd8f2ff,2,0x05040b,a);drawText(g,sub,Math.round(W/2-textW(sub)/2),145,0x8a86c0,1,null,a);g.fillStyle(0x9fd8ff,a);const lw=Math.round(120*Math.min(1,(c.t-1.9)/.6));g.fillRect(W/2-lw/2,141,lw,1)}
  if(!c){// bars
   const bar=(y,v,m,col,dark,w)=>{g.fillStyle(0x07050f);g.fillRect(5,y-1,w+2,5);g.fillStyle(dark);g.fillRect(6,y,w,3);g.fillStyle(col);g.fillRect(6,y,Math.max(0,Math.round(w*v/m)),3);g.fillStyle(0xffffff,.25);g.fillRect(6,y,Math.max(0,Math.round(w*v/m)),1)};
   bar(6,P.hp,P.hpMax,0xd8402a,0x3a1020,70);bar(12,P.fp,P.fpMax,0x4a8cff,0x14204a,52);bar(18,P.st,P.stMax,0x58c060,0x14341c,60);
   const s=String(this.souls);g.fillStyle(0x9fd8ff);g.fillRect(W-textW(s)-14,6,3,3);glow(ga,W-textW(s)-13,7,3,C.ice3,.3);drawText(g,s,W-textW(s)-6,5,0xd8d0ee);
   const B=this.boss;if(B&&this.bossState==='fight'){const w=180,x0=(W-w)/2,y0=H-14;drawText(g,'FROST WARDEN',x0,y0-7,0xd8d0ee);g.fillStyle(0x07050f);g.fillRect(x0-1,y0-1,w+2,5);g.fillStyle(0x2a1020);g.fillRect(x0,y0,w,3);g.fillStyle(0xb8302a);g.fillRect(x0,y0,Math.max(0,Math.round(w*B.hp/B.hpMax)),3)}}
  if(this.msg){this.msg.t-=this.dt;const m=this.msg,a=clamp(m.t*2,0,1);const big=m.s==='EMBER EXTINGUISHED'||m.s==='WARDEN SLAIN';const sc=big?2:1;
   if(big){g.fillStyle(0x05040b,.6*a);g.fillRect(0,78,W,22)}
   drawText(g,m.s,Math.round(W/2-textW(m.s,sc)/2),big?83:34,big?(m.s==='WARDEN SLAIN'?0xffe2a8:0xd8402a):0xd8d0ee,sc,0x05040b,a);if(m.t<=0)this.msg=null}}}
// ===================================================================
new Phaser.Game({type:Phaser.AUTO,width:W,height:H,pixelArt:true,roundPixels:true,backgroundColor:'#0b081d',parent:document.body,
 scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},physics:{default:'arcade',arcade:{gravity:{y:800}}},
 fps:{target:60},audio:{noAudio:Q.has('mute')},scene:[Boot,Title,Lab,Stage]});
