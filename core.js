// ASHEN VIGIL — vertical slice. All art & VFX drawn in code (pixel-snapped), original content.
// TODO (later passes, see game_design.md): Pale Choir (frozen) + Cinderdeep (burning) stages, 8 DS3-style classes,
// leveling at bonfires, weapons/armor/catalyst inventory, PeerJS host/join co-op, 3 save slots, more bosses.
'use strict';
const W=320,H=180,TS=8;let GY=240;
const Q=new URLSearchParams(location.search);
const DEMO=Q.has('demo');
// ---------- palette (night-indigo, matched to reference) ----------
const C={
 far:'#191335',farW:'#2a2754',farW2:'#3b3a6e',near:'#0e0a20',nearW:'#30335f',
 gTop:'#4b4078',g1:'#352c5e',g2:'#2d2552',gM:'#1f1940',gD:'#17122f',
 pl:0xff7a1a,plS:0xb8440c,plH:0xffb04a,cape:0x7a1e14,steel:0xd8d0ee,
 ice0:0xffffff,ice1:0xd8f2ff,ice2:0x9fd8ff,ice3:0x4aa0ff,ice4:0x2a5cd0,ice5:0x1b3a8a,
 f0:0xfff6c0,f1:0xffd04a,f2:0xff8a1a,f3:0xd23a10,f4:0x6a1408,
 bolt:0xb7a6ff,boltC:0xf4f0ff,orb:0xc050ff};
const ICE=[C.ice0,C.ice1,C.ice2,C.ice3,C.ice4,C.ice5], FIRE=[C.f0,C.f1,C.f2,C.f3,C.f4];
const rnd=(a,b)=>a+Math.random()*(b-a), ri=(a,b)=>Math.floor(rnd(a,b+1)), clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t, ease=t=>1-Math.pow(1-t,3);
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
// stage textures: parallax layers + 8x8 tileset, per palette
function hexInt(h){return parseInt(h.slice(1),16)}
function genStageTextures(scene,id){const T=scene.textures,P=PAL[STAGES[id].pal],HB=156;
 if(!T.exists('px'))T.addCanvas('px',makeCanvas(2,2,(x)=>{x.fillStyle='#fff';x.fillRect(0,0,2,2)}));
 if(T.exists('sky_'+id))return;
 T.addCanvas('sky_'+id,makeCanvas(W,H,(x)=>{const bands=P.sky;const R=seedRand(7);
  for(let y=0;y<H;y++)for(let xx=0;xx<W;xx++){const t=Math.min(.999,y/150)*(bands.length-1);const i=Math.floor(t),f=t-i;
   const b=(BAYER[y&3][xx&3]+.5)/16;x.fillStyle=bands[Math.min(bands.length-1,i+(f>b?1:0))];x.fillRect(xx,y,1,1)}
  for(let i=0;i<110;i++){const sx=Math.floor(R()*W),sy=Math.floor(R()*120);const v=R();x.fillStyle=v>.93?P.star[0]:v>.7?P.star[1]:P.star[2];x.fillRect(sx,sy,1,1)}}));
 T.addCanvas('far_'+id,makeCanvas(640,H,(x,w)=>{const R=seedRand(42+id.length);let xx=0;
  while(xx<w){const bw=14+Math.floor(R()*26),bh=30+Math.floor(R()*62),top=HB-bh;x.fillStyle=P.far;x.fillRect(xx,top,bw,H-top);
   const spire=R();let sh=0;if(spire>.45){sh=8+Math.floor(R()*18);for(let k=0;k<sh;k++){const ww=Math.max(1,Math.round(bw/2*(1-k/sh)));x.fillRect(xx+Math.floor(bw/2)-ww,top-k,ww*2,1)}x.fillRect(xx+Math.floor(bw/2),top-sh-4,1,5)}
   else{for(let k=0;k<bw;k+=3)x.fillRect(xx+k,top-2,2,2)}
   if(P.cap){x.fillStyle=P.cap;if(sh){x.fillRect(xx+Math.floor(bw/2)-1,top-sh+2,2,2)}x.fillRect(xx,top,bw,1);x.fillStyle=P.far}
   for(let wy=top+5;wy<H-4;wy+=4)for(let wx=xx+2;wx<xx+bw-2;wx+=3){const v=R();if(v<.42){x.fillStyle=v<.06?P.farW2:P.farW;x.fillRect(wx,wy,1,2)}}
   xx+=bw+Math.floor(R()*6)-2}}));
 T.addCanvas('near_'+id,makeCanvas(800,H,(x,w)=>{const R=seedRand(9+id.length);let xx=0;
  while(xx<w){const bw=24+Math.floor(R()*34),bh=20+Math.floor(R()*54),top=HB-bh;x.fillStyle=P.near;x.fillRect(xx,top,bw,H-top);
   const kind=R();
   if(kind<.35){const sh=14+Math.floor(R()*24);for(let k=0;k<sh;k++){const ww=Math.max(1,Math.round(bw/2*(1-k/sh)));x.fillRect(xx+Math.floor(bw/2)-ww,top-k,ww*2,1)}
     const cx=xx+Math.floor(bw/2),cy=top+8;x.fillStyle=P.nearW;for(let a=0;a<16;a++){x.fillRect(cx+Math.round(Math.cos(a/16*6.28)*4),cy+Math.round(Math.sin(a/16*6.28)*4),1,1)}x.fillRect(cx,cy,1,1);
     if(P.cap){x.fillStyle=P.cap;x.fillRect(xx+Math.floor(bw/2)-1,top-sh+1,2,1)}x.fillStyle=P.near}
   else if(kind<.6){for(let k=0;k<4;k++){x.fillRect(xx+Math.floor(k*bw/4),top-6-Math.floor(R()*8),2,10)}}
   if(P.cap){x.fillStyle=P.cap;x.fillRect(xx,top,bw,1);x.fillStyle=P.near}
   for(let wy=top+16;wy<H-8;wy+=12)for(let wx=xx+3;wx<xx+bw-4;wx+=6){if(R()<.5){x.fillStyle=P.nearW;x.fillRect(wx,wy+1,2,6);x.fillRect(wx+0,wy,2,1);x.fillStyle=P.near}}
   if(R()<.4){x.fillStyle=P.near;for(let k=0;k<12;k++)x.fillRect(xx+bw+k,top+10+k*k/6,2,2)}
   xx+=bw+4+Math.floor(R()*14)}}));
 // tileset 16x2 tiles of 8x8
 T.addCanvas('ts_'+id,makeCanvas(128,16,(x)=>{const t=(i,f)=>{x.save();x.translate((i%16)*8,Math.floor(i/16)*8);f();x.restore()};const F=(c,a,b,w,h)=>{x.fillStyle=c;x.fillRect(a,b,w,h)};
  const brick=(off,dark)=>{F(dark?P.gD:P.g1,0,0,8,8);F(P.gM,0,3,8,1);F(P.gM,0,7,8,1);F(P.gM,(off?2:5),0,1,3);F(P.gM,(off?6:1),4,1,3);if(!dark)F(P.g2,0,4,8,3)};
  t(0,()=>{});
  t(1,()=>{brick(0);F(P.gTop,0,0,8,1);F(P.g2,0,1,8,1);if(P.cap){F(P.cap,0,0,8,1);F(P.cap,2,1,3,1)}});// top
  t(2,()=>brick(0));t(3,()=>brick(1));t(4,()=>brick(0,1));
  t(5,()=>{F(P.g1,0,0,8,4);F(P.gTop,0,0,8,1);F(P.gM,0,3,8,1);F(P.gD,1,4,2,2);F(P.gD,5,4,2,2);if(P.cap)F(P.cap,0,0,8,1)});// one-way
  t(6,()=>{brick(1);F('#0a0814',2,1,1,3);F('#0a0814',3,4,1,2);F('#0a0814',5,2,1,2);F(P.gTop,4,4,1,1)});// breakable (cracked)
  t(7,()=>{for(let k=0;k<4;k++){F('#8a86a8',k*2,4,1,4);F('#c8c4e0',k*2,3,1,1)}});// spikes
  t(8,()=>{F('#ff8a1a',0,1,8,7);F('#ffd04a',0,0,8,1);F('#ffd04a',1,2,2,1);F('#d23a10',4,5,3,2)});t(9,()=>{F('#d23a10',0,0,8,8);F('#ff8a1a',2,2,2,1);F('#6a1408',5,5,2,2)});// lava
  t(10,()=>{F('#5a5470',3,0,2,3);F('#8a86a8',3,0,1,1);F('#5a5470',3,4,2,3);F('#8a86a8',4,4,1,1);F('#3a3450',3,3,2,1);F('#3a3450',3,7,2,1)});// chain
  t(12,()=>{F(P.gD,0,0,8,8);F(P.gM,0,3,8,1);F(P.gM,0,7,8,1);F(P.gM,3,0,1,3);F(P.gM,7,4,1,3)});// backwall
  t(13,()=>{F('#2a1e10',0,0,8,8);F('#6a4a2a',1,1,6,7);F('#ffd04a',5,4,1,1);F('#3a2a18',1,1,6,1)});// door
 }));
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
   case'spark':q.vy+=260*dt;q.vx*=.93;break;case'dust':q.vx*=.9;q.vy*=.92;break;case'shard':q.vy+=300*dt;if(this.s.solidAt&&this.s.solidAt(q.x,q.y+1)){q.vy*=-.3;q.vx*=.6}break;
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