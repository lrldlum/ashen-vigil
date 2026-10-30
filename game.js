// ASHEN VIGIL — vertical slice. All art & VFX drawn in code (pixel-snapped), original content.
// TODO (later passes, see game_design.md): Pale Choir (frozen) + Cinderdeep (burning) stages, 8 DS3-style classes,
// leveling at bonfires, weapons/armor/catalyst inventory, PeerJS host/join co-op, 3 save slots, more bosses.
'use strict';
const W=320,H=180,GY=156;let WORLD=3360,ARENA_L=2980,ARENA_R=3340;
const Q=new URLSearchParams(location.search);
const DEMO=Q.has('demo'), START_X=+(Q.get('x')||40);
// ---------- palette (night-indigo, matched to reference) ----------
const C={sky0:'#0b081d',sky1:'#0f0b25',sky2:'#140f2e',sky3:'#1a1439',sky4:'#221a47',
 far:'#140f2c',farW:'#211d45',farW2:'#2f2d5c',near:'#0a0718',nearW:'#1e1f42',
 gTop:'#4b4078',g1:'#352c5e',g2:'#2d2552',gM:'#1f1940',gD:'#17122f',
 pl:0xff7a1a,plS:0xb8440c,plH:0xffb04a,cape:0x7a1e14,steel:0xd8d0ee,
 ice0:0xffffff,ice1:0xd8f2ff,ice2:0x9fd8ff,ice3:0x4aa0ff,ice4:0x2a5cd0,ice5:0x1b3a8a,
 f0:0xfff6c0,f1:0xffd04a,f2:0xff8a1a,f3:0xd23a10,f4:0x6a1408,
 bolt:0xb7a6ff,boltC:0xf4f0ff,orb:0xc050ff};
const BASEPAL={...C};
const ICE=[C.ice0,C.ice1,C.ice2,C.ice3,C.ice4,C.ice5], FIRE=[C.f0,C.f1,C.f2,C.f3,C.f4];
const rnd=(a,b)=>a+Math.random()*(b-a), ri=(a,b)=>Math.floor(rnd(a,b+1)), clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t, ease=t=>1-Math.pow(1-t,3);
// ---------- save ----------
// 3 save slots (milestone D). Slot 1 keeps the original key so older saves still load.
const slotKey=i=>i?'ashenVigil.save.v1.s'+(i+1):'ashenVigil.save.v1';
const Save={slot:Q.has('slot')?clamp((+Q.get('slot')||1)-1,0,2):clamp(+(localStorage.getItem('ashenVigil.slot')||0),0,2),
 key(){return slotKey(this.slot)},use(i){this.slot=i;try{localStorage.setItem('ashenVigil.slot',String(i))}catch(e){}},
 load(i=this.slot){try{return JSON.parse(localStorage.getItem(slotKey(i)))||null}catch(e){return null}},
 write(d){try{localStorage.setItem(this.key(),JSON.stringify(d))}catch(e){}}, clear(i=this.slot){localStorage.removeItem(slotKey(i))}};
// ---------- tiny 3x5 pixel font ----------
const FONT={A:'010101111101101',B:'110101110101110',C:'011100100100011',D:'110101101101110',E:'111100110100111',F:'111100110100100',
G:'011100101101011',H:'101101111101101',I:'111010010010111',J:'001001001101010',K:'101101110101101',L:'100100100100111',
M:'101111111101101',N:'110101101101101',O:'010101101101010',P:'110101110100100',Q:'010101101110011',R:'110101110101101',
S:'011100010001110',T:'111010010010010',U:'101101101101111',V:'101101101101010',W:'101101111111101',X:'101101010101101',
Y:'101101010010010',Z:'111001010100111','0':'111101101101111','1':'010110010010111','2':'110001010100111','3':'110001010001110',
'4':'101101111001001','5':'111100110001110','6':'011100111101111','7':'111001010010010','8':'111101111101111','9':'111101111001110',
'.':'000000000000010',':':'000010000010000','-':'000000111000000','!':'010010010000010','/':'001001010100100',',':'000000000010100',"'":'010010000000000',' ':'000000000000000',
'>':'100010001010100','<':'001010100010001','+':'000010111010000','(':'010100100100010',')':'010001001001010','?':'110001010000010','^':'010101000000000','=':'000111000111000','%':'101001010100101'};
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
function genTextures(scene,sx='',pal=null){
 const T=scene.textures;
 if(T.exists('sky'+sx))return;
 const keep={...C};if(pal)Object.assign(C,pal);try{genTex(T,sx)}finally{Object.assign(C,keep)}}
function genTex(T,sx){
 T.addCanvas('sky'+sx,makeCanvas(W,H,(x)=>{const bands=[C.sky0,C.sky1,C.sky2,C.sky3,C.sky4];const R=seedRand(7);
  for(let y=0;y<H;y++)for(let xx=0;xx<W;xx++){const t=Math.min(.999,y/150)*(bands.length-1);const i=Math.floor(t),f=t-i;
   const b=(BAYER[y&3][xx&3]+.5)/16;x.fillStyle=bands[Math.min(bands.length-1,i+(f>b?1:0))];x.fillRect(xx,y,1,1)}
  for(let i=0;i<110;i++){const sx=Math.floor(R()*W),sy=Math.floor(R()*120);const v=R();x.fillStyle=v>.93?'#e8e4ff':v>.7?'#8a86c0':'#4d4a86';x.fillRect(sx,sy,1,1)}}));
 // far skyline: gothic towers + spires, tileable 640
 T.addCanvas('far'+sx,makeCanvas(640,H,(x,w)=>{const R=seedRand(42);let xx=0;
  while(xx<w){const bw=14+Math.floor(R()*26),bh=30+Math.floor(R()*62),top=GY-bh;x.fillStyle=C.far;x.fillRect(xx,top,bw,GY-top);
   const spire=R();if(spire>.45){const sh=8+Math.floor(R()*18);for(let k=0;k<sh;k++){const ww=Math.max(1,Math.round(bw/2*(1-k/sh)));x.fillRect(xx+Math.floor(bw/2)-ww,top-k,ww*2,1)}x.fillRect(xx+Math.floor(bw/2),top-sh-4,1,5)}
   else{for(let k=0;k<bw;k+=3)x.fillRect(xx+k,top-2,2,2)}
   for(let wy=top+5;wy<GY-4;wy+=4)for(let wx=xx+2;wx<xx+bw-2;wx+=3){const v=R();if(v<.3){x.fillStyle=v<.06?C.farW2:C.farW;x.fillRect(wx,wy,1,2)}}
   xx+=bw+Math.floor(R()*6)-2}
  // horizon haze: 2 stepped tones (Tester r1 visual: depth)
  x.fillStyle=C.haze1||'rgba(30,24,66,.55)';x.fillRect(0,GY-26,w,12);x.fillStyle=C.haze2||'rgba(38,30,80,.65)';x.fillRect(0,GY-14,w,14)}));
 // near layer: cathedral facades, buttresses, rose windows, darker
 T.addCanvas('near'+sx,makeCanvas(800,H,(x,w)=>{const R=seedRand(9);let xx=0;
  while(xx<w){const bw=24+Math.floor(R()*34),bh=20+Math.floor(R()*54),top=GY-bh;x.fillStyle=C.near;x.fillRect(xx,top,bw,GY-top);
   const kind=R();
   if(kind<.35){const sh=14+Math.floor(R()*24);for(let k=0;k<sh;k++){const ww=Math.max(1,Math.round(bw/2*(1-k/sh)));x.fillRect(xx+Math.floor(bw/2)-ww,top-k,ww*2,1)}
     // rose window
     const cx=xx+Math.floor(bw/2),cy=top+8;x.fillStyle=C.nearW;for(let a=0;a<16;a++){x.fillRect(cx+Math.round(Math.cos(a/16*6.28)*4),cy+Math.round(Math.sin(a/16*6.28)*4),1,1)}x.fillRect(cx,cy,1,1);x.fillStyle=C.near}
   else if(kind<.6){for(let k=0;k<4;k++){x.fillRect(xx+Math.floor(k*bw/4),top-6-Math.floor(R()*8),2,10)}}
   for(let wy=top+16;wy<GY-8;wy+=12)for(let wx=xx+3;wx<xx+bw-4;wx+=6){if(R()<.2){x.fillStyle=C.nearW;x.fillRect(wx,wy+1,2,6);x.fillRect(wx+0,wy,2,1);x.fillStyle=C.near}}
   // flying buttress
   if(R()<.4){x.fillStyle=C.near;for(let k=0;k<12;k++)x.fillRect(xx+bw+k,top+10+k*k/6,2,2)}
   xx+=bw+4+Math.floor(R()*14)}}));
 // ground: brick band
 T.addCanvas('ground'+sx,makeCanvas(96,24,(x)=>{for(let v=0;v<3;v++){const o=v*32;x.fillStyle=C.g1;x.fillRect(o,0,32,24);x.fillStyle=C.gTop;x.fillRect(o,0,32,1);x.fillStyle=C.g2;x.fillRect(o,1,32,1);
  for(let r=0;r<4;r++){const y=2+r*6;x.fillStyle=C.gM;x.fillRect(o,y+5,32,1);const off=r%2?8:0;for(let k=0;k<2;k++)x.fillRect(o+(off+k*16)%32,y,1,5);
   x.fillStyle=r>1?C.gD:C.g2;if(r>1)x.fillRect(o,y,32,5)}
  x.fillStyle=C.gM;x.fillRect(o,23,32,1);
  // variants: 1 = cracked brick, 2 = chipped edge + darker brick
  if(v===1){x.fillStyle=C.gM;[[20,2],[21,3],[21,4],[22,5],[22,6],[23,7]].forEach(([a,b])=>x.fillRect(o+a,b,1,1));x.fillStyle=C.gD;x.fillRect(o+3,8,12,5)}
  if(v===2){x.fillStyle=C.gM;x.fillRect(o+9,0,4,1);x.fillRect(o+10,1,2,1);x.fillStyle=C.g2;x.fillRect(o+17,2,15,5);x.fillStyle=C.gM;x.fillRect(o+25,9,1,3)}}}));
 T.addCanvas('plat'+sx,makeCanvas(16,8,(x)=>{x.fillStyle=C.g1;x.fillRect(0,0,16,6);x.fillStyle=C.gTop;x.fillRect(0,0,16,1);x.fillStyle=C.gM;x.fillRect(0,5,16,1);x.fillRect(15,1,1,4);x.fillStyle=C.gD;x.fillRect(2,6,2,2);x.fillRect(12,6,2,2)}));
 if(!T.exists('px'))T.addCanvas('px',makeCanvas(2,2,(x)=>{x.fillStyle='#fff';x.fillRect(0,0,2,2)}));
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
   case'spark':q.vy+=260*dt;q.vx*=.93;break;case'dust':q.vx*=.9;q.vy*=.92;break;case'shard':if(q.rest)break;q.vy+=300*dt;if(q.gy===undefined)q.gy=this.s.lv?this.s.lv.floorAt(q.x,q.y-2):(q.y<GY+2?GY:1e9);if(q.y>q.gy-1){q.y=q.gy-1;q.vy*=-.3;q.vx*=.6;if(Math.abs(q.vy)<18){q.rest=1;q.vx=0;q.vy=0;q.m=Math.max(q.m,q.l+1)}}break;case'breath':q.vx*=.95;q.vy-=4*dt;break;
   case'snow':q.vx=Math.sin(q.l*1.6+q.ph)*10;break;case'soul':{const P=this.s.player;if(P&&q.l>.3){const dx=P.x-q.x,dy=P.y-8-q.y,d=Math.hypot(dx,dy)+1;q.vx+=dx/d*600*dt;q.vy+=dy/d*600*dt;q.vx*=.92;q.vy*=.92;if(d<5)q.l=q.m}break}}
  q.x+=q.vx*dt;q.y+=q.vy*dt}}
 draw(ga,gn){for(const q of this.p){const t=q.l/q.m;
  switch(q.k){case'ember':{if(Math.sin(q.l*40+q.ph)>.6&&t>.5)break;const c=FIRE[Math.min(4,Math.floor(t*4.5))];px(ga,q.x,q.y,c);if(t<.3)glow(ga,q.x,q.y,2,C.f2,.18);break}
   case'fire':{const c=FIRE[Math.min(4,Math.floor(t*5))];const s=t<.5?q.sz:1;ga.fillStyle(c,1);ga.fillRect(Math.round(q.x),Math.round(q.y),s,s);break}
   case'spark':{const c=t<.4?0xffffff:q.c;line(ga,q.x,q.y,q.x-q.vx*.03,q.y-q.vy*.03,c,1-t*.5);break}
   case'dust':{gn.fillStyle(t<.5?0x6b5f96:0x463c6e,.85*(1-t));gn.fillRect(Math.round(q.x),Math.round(q.y),q.sz,q.sz);break}
   case'shard':{if(q.rest){px(ga,q.x,q.y,Math.sin(q.l*14+q.x)>.7?C.ice1:C.ice3,Math.min(1,(q.m-q.l)*3));break}const c=ICE[Math.min(5,1+Math.floor(t*4))];px(ga,q.x,q.y,c);if(t<.4)px(ga,q.x-Math.sign(q.vx),q.y-1,C.ice2,.6);break}
   case'breath':px(ga,q.x,q.y,t<.4?C.ice1:C.ice3,.7*(1-t));break;
   case'snow':px(gn,q.x,q.y,0xcfe6ff,.8*(1-t*t));break;
   case'star':sparkle(ga,q.x,q.y,t<.5?2:1,q.c,1-t);break;
   case'soul':{px(ga,q.x,q.y,0xe8f6ff);glow(ga,q.x,q.y,3,0x7fb8ff,.2);break}}}}}
// ---------- effect variants (code is clay: several drafts, best one picked) ----------
const SLASH_V=[{name:'A crescent',r:13,th:3,sweep:140,dur:.11,trail:0},{name:'B wide trail',r:16,th:3,sweep:200,dur:.15,trail:1},{name:'C stab',r:11,th:4,sweep:90,dur:.08,trail:0}];
const ICE_V=[{name:'A needles',n:6,step:13,hMin:16,hMax:30,hw:2.2,grow:.10},{name:'B crown',n:8,step:11,hMin:14,hMax:40,hw:4.2,grow:.12},{name:'C wall',n:4,step:16,hMin:26,hMax:30,hw:5,grow:.16}];
const SLASH=SLASH_V[1], ICEP=ICE_V[1]; // picked after side-by-side review in ?lab
function drawSlash(ga,x,y,f,t,V,flip){// t 0..1, quantised to a 3-frame arc sprite (Tester r1)
 t=t<.34?.3:t<.67?.62:.95;const fy=flip?-1:1;
 const a0=-100,sw=V.sweep,head=a0+sw*ease(Math.min(1,t*1.15));const tail=head-(V.trail?sw*.75:sw*.5)*(1-t*.6);
 for(let a=tail;a<=head;a+=4){const k=(a-tail)/(head-tail+1e-3);const rad=a*Math.PI/180;const th=Math.max(1,Math.round(V.th*k));
  for(let r=V.r-th;r<=V.r;r++){const c=k>.85?0xffffff:k>.5?0xffe2a8:k>.25?C.f1:C.f2;px(ga,x+Math.cos(rad)*r*f,y+Math.sin(rad)*r*fy,c,Math.min(1,k*1.6)*(1-t*.4))}}
}
function drawSpike(ga,gn,x,by,h,hw,t,lean){// crystal spike, light from left
 const hh=Math.round(h);for(let i=0;i<hh;i++){const k=i/hh;const w=Math.max(0,Math.round(hw*(1-k)*(1+.15*Math.sin(k*9))));const cx=x+Math.round(lean*k*hh*.25);
  for(let dx=-w;dx<=w;dx++){let c=dx<=-w+0?C.ice1:dx<0?C.ice2:dx===0?C.ice1:dx<w?C.ice3:C.ice4;if(k>.85)c=C.ice0;ga.fillStyle(c,1);ga.fillRect(cx+dx,by-i,1,1)}}
 px(ga,x+Math.round(lean*hh*.25),by-hh,0xffffff)}
// Frost dome, matched to Hugo Duprez reference: big hemisphere (R~100 = most of the screen height), bright shell,
// thick glowing elliptical base ring and a dense crown of crystals standing on the ring.
function drawDome(ga,x,gy,r,a,t,seed){x=Math.round(x);r=Math.max(2,Math.round(r));const R=seedRand(seed);
 for(let yy=0;yy<r;yy+=2){const w=Math.round(Math.sqrt(r*r-yy*yy));ga.fillStyle(C.ice4,a*(.04+.07*(yy/r)));ga.fillRect(x-w,gy-yy-1,2*w+1,2)}
 for(let yy=4;yy<r-3;yy+=7)for(let xx=-r;xx<=r;xx+=8){const ox=xx+((yy/7|0)%2?4:0);if(ox*ox+yy*yy<(r-4)*(r-4))px(ga,x+ox,gy-yy,C.ice2,a*.28)}
 const N=Math.max(24,Math.round(r*3.4));
 for(let i=0;i<=N;i+=3){const an=Math.PI+i/N*Math.PI;glow(ga,x+Math.cos(an)*r,gy+Math.sin(an)*r,5,C.ice3,a*.12)}
 for(let i=0;i<=N;i++){const an=Math.PI+i/N*Math.PI,c=Math.cos(an),s=Math.sin(an);
  px(ga,x+c*r,gy+s*r,C.ice1,a);px(ga,x+c*(r-1),gy+s*(r-1),C.ice2,a*.8);px(ga,x+c*(r+1),gy+s*(r+1),C.ice3,a*.35);
  const tr=((i/N)+t*.6)%1;if(tr<.04||Math.abs(tr-.5)<.02)px(ga,x+c*r,gy+s*r,0xffffff,a)}
 // base ring: thick, the brightest element
 const rx=Math.round(r*1.2),ry=Math.max(4,Math.round(r*.13));glow(ga,x,gy,rx*.7,C.ice3,a*.14);
 const M=Math.round(rx*7);for(let i=0;i<M;i++){const an=i/M*Math.PI*2,front=Math.sin(an)>0;const xx=x+Math.cos(an)*rx,yy=gy-1+Math.sin(an)*ry;
  px(ga,xx,yy,front?0xffffff:C.ice1,a);px(ga,xx,yy-1,C.ice1,a*(front?.9:.6));px(ga,x+Math.cos(an)*(rx-2),yy,C.ice2,a*.6);if(i%9===0)glow(ga,xx,yy,5,C.ice2,a*.22)}
 for(let k=0;k<8;k++)glow(ga,x+Math.cos(k/8*6.283+t)*rx,gy-1+Math.sin(k/8*6.283+t)*ry,6,C.ice1,a*.25);
 // crystal crown on the ring (back half first, then front)
 const n=Math.round(r/3.2);for(let k=0;k<n;k++){const an=R()*Math.PI*2,sx=x+Math.round(Math.cos(an)*rx*(.75+R()*.25)),sy=gy-1+Math.round(Math.sin(an)*ry);
  const h=(4+R()*r*.2)*Math.min(1,a*1.4);drawSpike(ga,null,sx,sy,h,1.2+R()*1.4,1,(R()-.5)*.8)}
 for(let k=0;k<4;k++)if(R()<.7)sparkle(ga,x+(R()*2-1)*r*.8,gy-R()*r*.8,2,C.ice1,a)}
// ---------- hero: 10x16 figure rasterised per frame into a pixel buffer, then 1px dark outline (Tester r1 visual) ----------
const itemName=id=>(WEAPONS[id]||ARMORS[id]||SPELLS[id]||MIRACLES[id]||{name:id==='flask'?'EMBER FLASK':String(id).toUpperCase()}).name;
const HB_W=40,HB_H=34,HB_OX=20,HB_OY=29;
const HC={o:0x160810,b:C.pl,s:C.plS,h:C.plH,c:C.cape,c2:0x4a120c,st:C.steel,sd:0x8a84a8,gd:C.f1,eye:0x2a0e06,staff:0x6a4a3a,fl:0xffd04a};
class HeroBuf{constructor(){this.a=new Int32Array(HB_W*HB_H);this.o=new Int32Array(HB_W*HB_H)}
 clear(){this.a.fill(-1)}
 set(x,y,c){x=Math.round(x)+HB_OX;y=Math.round(y)+HB_OY;if(x>=0&&y>=0&&x<HB_W&&y<HB_H)this.a[y*HB_W+x]=c}
 rect(x,y,w,h,c){for(let j=0;j<h;j++)for(let i=0;i<w;i++)this.set(x+i,y+j,c)}
 line(x0,y0,x1,y1,c,th=1){const dx=x1-x0,dy=y1-y0,n=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))));const hz=Math.abs(dx)>Math.abs(dy);
  for(let i=0;i<=n;i++){const x=x0+dx*i/n,y=y0+dy*i/n;this.set(x,y,c);if(th>1)hz?this.set(x,y+1,c):this.set(x+1,y,c)}}
 outline(){const a=this.a,o=this.o;o.set(a);for(let j=0;j<HB_H;j++)for(let i=0;i<HB_W;i++){const k=j*HB_W+i;if(a[k]!==-1)continue;
  if((i>0&&a[k-1]!==-1)||(i<HB_W-1&&a[k+1]!==-1)||(j>0&&a[k-HB_W]!==-1)||(j<HB_H-1&&a[k+HB_W]!==-1))o[k]=HC.o}}
 rim(ga,x,y,f,c,a){const o=this.o;for(let j=0;j<HB_H;j++)for(let i=0;i<HB_W;i++)if(o[j*HB_W+i]===HC.o){ga.fillStyle(c,a);ga.fillRect(f>0?x+i-HB_OX:x-(i-HB_OX),y+j-HB_OY,1,1)}}
 blit(g,x,y,f,flash,alpha=1){const o=this.o;for(let j=0;j<HB_H;j++){let i=0;while(i<HB_W){const c=o[j*HB_W+i];if(c===-1){i++;continue}let e=i+1;while(e<HB_W&&o[j*HB_W+e]===c)e++;
   g.fillStyle(flash&&c!==HC.o?0xffffff:c,alpha);const x0=f>0?x+i-HB_OX:x-(e-1-HB_OX);g.fillRect(x0,y+j-HB_OY,e-i,1);i=e}}}}
const HERO=new HeroBuf();
const RUN_F=[[3,0],[2,-1],[0,-2],[-2,-2],[-3,-1],[-1,0]],RUN_K=[[2,-3],[2,-4],[1,-4],[0,-3],[-1,-3],[0,-3]],RUN_BOB=[0,-1,0,0,-1,0];
// pose: hy hip height, ln torso lean, bk/bf back knee/foot, fk/ff front knee/foot, ba/fa hands, sw sword angle (deg, 0=forward,-90=up) or null
const HSTY={wt:'sword',swL:9,heavy:false};const HC0={...HC};
function heroPose(st,fr,t,combo){const P={hy:-6,ln:0,bk:[-1,-3],bf:[-2,0],fk:[1,-3],ff:[1,0],ba:[-2,-7],fa:[2,-7],sw:HSTY.wt==='bow'?null:-50,swL:HSTY.swL,item:HSTY.wt==='bow'&&st!=='cast'&&st!=='drink'?'bow':null,cape:Math.sin(t*8)};
 switch(st){
  case'idle':if(fr){P.fa=[2,-6];P.sw=-45;P.hy=-6}break;
  case'run':{const a=fr,b=(fr+3)%6;P.hy=-6+RUN_BOB[fr];P.ln=1;P.fk=RUN_K[a];P.ff=RUN_F[a];P.bk=RUN_K[b];P.bf=RUN_F[b];P.fa=[2-Math.round(RUN_F[a][0]*.5),-7];P.ba=[-1+Math.round(RUN_F[a][0]*.5),-7];P.sw=-35;P.cape+=1.5;break}
  case'jump':P.fk=[2,-5];P.ff=[1,-3];P.bk=[-1,-3];P.bf=[-2,-1];P.fa=[3,-9];P.ba=[-3,-9];P.sw=-70;break;
  case'fall':P.fk=[1,-3];P.ff=[2,0];P.bk=[-1,-3];P.bf=[-3,-1];P.fa=[3,-8];P.ba=[-3,-10];P.sw=-30;P.cape+=2;break;
  case'atk':P.fk=[2,-3];P.ff=[3,0];P.bk=[-2,-3];P.bf=[-3,0];
   {const W=HSTY.wt;
   if(W==='bow'){P.fa=[[3,-9],[4,-9],[5,-9],[4,-9]][fr];P.ba=[[1,-9],[0,-9],[-1,-9],[0,-9]][fr];P.sw=null;P.item='bow';P.ln=0;break}
   if(HSTY.heavy&&W!=='axe'&&W!=='dagger'&&W!=='spear'){P.ln=[-2,0,2,2][fr];P.fa=[[-1,-13],[1,-14],[4,-6],[3,-5]][fr];P.sw=[-170,-120,60,40][fr];P.ba=[-1,-12];break}
   if(W==='dagger'||W==='spear'||(W==='staff'&&!HSTY.heavy)){P.ln=[0,2,2,1][fr];P.fa=[[0,-8],[5,-8],[6,-8],[3,-7]][fr];P.sw=[-10,-4,-2,-8][fr];if(combo===1)P.fa[1]-=2;if(combo===2)P.fa[1]+=1;P.ba=[-3,-7];break}
   if(W==='axe'&&HSTY.heavy){P.ln=[0,1,1,0][fr];P.fa=[[-2,-7],[4,-7],[-3,-7],[3,-7]][fr];P.sw=[180,0,180,20][fr];P.ba=[-3,-7];break}
   if(!combo){P.ln=[-1,1,2,1][fr];P.fa=[[-1,-11],[4,-9],[4,-6],[3,-6]][fr];P.sw=[-140,-20,45,20][fr]}
   else{P.ln=[0,1,1,0][fr];P.fa=[[2,-5],[4,-9],[3,-11],[3,-8]][fr];P.sw=[60,-30,-80,-50][fr]}P.ba=[-2,-8];break}
  case'roll':P.roll=fr;break;
  case'rollrec':P.hy=-5;P.fk=[2,-2];P.ff=[2,0];P.bk=[-1,-2];P.bf=[-3,0];P.fa=[3,-6];P.sw=-20;break;
  case'cast':P.fa=[[2,-8],[4,-10],[5,-11]][fr];P.ln=fr>1?1:0;P.item='staff';P.sw=null;P.ba=[-2,-6];break;
  case'hurt':P.ln=-2;P.fa=[3,-9];P.ba=[-4,-10];P.sw=-100;P.fk=[1,-3];P.ff=[2,0];P.bk=[-2,-3];P.bf=[-3,0];break;
  case'drink':P.hy=-6;P.fa=[1,-12];P.item='flask';P.sw=null;P.ba=[-2,-6];P.fk=[2,-3];P.ff=[2,0];break;
  case'wall':P.fk=[1,-4];P.ff=[2,-1];P.bk=[-1,-3];P.bf=[-1,0];P.fa=[3,-11];P.ba=[2,-8];P.sw=-100;P.cape+=2;break;
  case'climb':P.fa=fr?[1,-13]:[1,-10];P.ba=fr?[0,-9]:[0,-12];P.fk=fr?[1,-4]:[1,-2];P.ff=fr?[1,-2]:[1,0];P.bk=fr?[0,-2]:[0,-4];P.bf=fr?[0,0]:[0,-2];P.sw=null;P.ln=0;break;
  case'rest':P.hy=-3;P.ln=1;P.fk=[2,-3];P.ff=[3,0];P.bk=[-1,0];P.bf=[-3,0];P.fa=[3,-5];P.ba=[1,-5];P.sw=90;break;
  case'parry':P.fa=[[3,-9],[4,-8]][fr];P.sw=[-95,-70][fr];P.ba=[-2,-9];P.fk=[2,-3];P.ff=[3,0];P.bk=[-2,-3];P.bf=[-3,0];break;
  case'death':P.death=fr;P.hy=[-4,-3,-2][Math.min(2,fr)];P.ln=[1,2,3][Math.min(2,fr)];P.fk=[2,-2];P.ff=[2,0];P.bk=[-1,0];P.bf=[-3,0];P.fa=[[3,-4],[4,-2],[4,0]][Math.min(2,fr)];P.ba=[0,-3];P.sw=[80,10,0][Math.min(2,fr)];break}
 return P}
function rasterHero(B,P){B.clear();
 if(P.roll!==undefined){const a=P.roll/5*Math.PI*2;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++)if(dx*dx+dy*dy<=10)B.set(dx,-4+dy,dy>1||dx<-1?HC.s:HC.b);
  B.rect(Math.round(Math.cos(a)*3)-1,Math.round(-4+Math.sin(a)*3)-1,2,2,HC.h);B.set(Math.round(-Math.cos(a)*3),Math.round(-4-Math.sin(a)*3),HC.c);B.set(Math.round(-Math.cos(a+.6)*3),Math.round(-4-Math.sin(a+.6)*3),HC.c);B.outline();return}
 if(P.death>=3){const fade=P.death-3;// lying, then ash
  if(fade<2){B.rect(-4,-2,8,2,HC.b);B.rect(-4,-1,8,1,HC.s);B.rect(4,-3,3,3,HC.b);B.set(5,-3,HC.h);B.line(-4,-1,-7,-1,HC.c);if(fade===1)for(let i=-7;i<7;i+=2)B.set(i,-2,-1)}
  else{B.rect(-2,-1,5,1,HC.s);B.set(0,-2,HC.c)}B.outline();return}
 const hy=P.hy,ln=P.ln,cw=Math.round(P.cape);
 // cape
 B.line(ln-2,hy-5,-3-cw,hy+1,HC.c,2);B.set(-3-cw,hy+2,HC.c2);
 // back leg + back arm (shade)
 B.line(-1,hy,P.bk[0],P.bk[1],HC.s,2);B.line(P.bk[0],P.bk[1],P.bf[0],P.bf[1],HC.s,2);B.set(P.bf[0]+1,P.bf[1],HC.s);
 B.line(ln-1,hy-4,P.ba[0],P.ba[1],HC.s);
 // torso
 for(let r=0;r<5;r++){const xo=Math.round(ln*r/4),y=hy-1-r;B.set(xo-2,y,HC.s);B.rect(xo-1,y,3,1,r===0?HC.s:HC.b)}B.set(ln+1,hy-5,HC.h);
 // head (round), eye slit, highlight
 const hx=ln;B.rect(hx-1,hy-9,2,1,HC.b);B.rect(hx-2,hy-8,4,2,HC.b);B.rect(hx-1,hy-6,2,1,HC.b);B.set(hx+1,hy-8,HC.eye);B.set(hx-1,hy-9,HC.h);B.set(hx-2,hy-7,HC.s);
 // front leg
 B.line(0,hy,P.fk[0],P.fk[1],HC.b,2);B.line(P.fk[0],P.fk[1],P.ff[0],P.ff[1],HC.b,2);B.set(P.ff[0]+2,P.ff[1],HC.s);
 // front arm + held item
 B.line(ln+1,hy-4,P.fa[0],P.fa[1],HC.b);
 if(P.sw!==null){const a=P.sw*Math.PI/180,c=Math.cos(a),s=Math.sin(a);const hx0=P.fa[0],hy0=P.fa[1];
  const W=HSTY.wt,L=P.swL,tipX=hx0+c*L,tipY=hy0+s*L;
  if(W==='staff'){B.line(hx0-c*3,hy0-s*3,tipX,tipY,HC.staff);B.rect(tipX-1,tipY-1,2,2,0x9fd8ff);B.set(tipX,tipY,0xffffff)}
  else{B.set(hx0-s,hy0+c,HC.gd);B.set(hx0+s,hy0-c,HC.gd);
   if(W==='spear'){B.line(hx0-c*3,hy0-s*3,tipX,tipY,HC.staff);B.line(tipX-c*3,tipY-s*3,tipX,tipY,HC.st);B.set(tipX+c,tipY+s,0xffffff)}
   else{B.line(hx0+c,hy0+s,tipX,tipY,HC.st);if(W==='greatsword'){B.line(hx0+c-s,hy0+s+c,tipX-s,tipY+c,HC.sd);B.set(hx0-s*2,hy0+c*2,HC.gd);B.set(hx0+s*2,hy0-c*2,HC.gd)}
    if(W==='axe'){B.line(tipX-s*2,tipY+c*2,tipX+s*2,tipY-c*2,HC.st);B.line(tipX-s*2-c,tipY+c*2-s,tipX+s*2-c,tipY-c*2-s,HC.sd)}
    B.set(tipX+c,tipY+s,0xffffff)}B.set(hx0-c,hy0-s,HC.sd)}}
 if(P.item==='bow'){const x0=P.fa[0],y0=P.fa[1];for(let k=-5;k<=5;k++)B.set(x0+1+Math.round(Math.cos(k/5*1.2)*2)-2,y0+k,k===-5||k===5?HC.sd:HC.staff);B.line(x0-1,y0-5,x0-1,y0+5,0xd8d0ee)}
 if(P.item==='staff'){B.line(P.fa[0]-1,P.fa[1]+5,P.fa[0]+2,P.fa[1]-6,HC.staff);B.set(P.fa[0]+2,P.fa[1]-7,0xffffff)}
 if(P.item==='flask'){B.rect(P.fa[0],P.fa[1]-1,2,3,HC.fl);B.set(P.fa[0],P.fa[1]-2,HC.sd)}
 B.set(P.fa[0],P.fa[1],HC.h);B.outline()}
function heroStyle(wp,heavy,arm){HSTY.wt=wp?wp.type:'sword';HSTY.swL=wp?(wp.swL||9):9;HSTY.heavy=!!heavy;Object.assign(HC,HC0,arm&&arm.pal||{})}
function drawHero(g,x,y,f,st,fr,t,o={}){rasterHero(HERO,heroPose(st,fr,t,o.combo));HERO.blit(g,x,y,f,o.flash,o.alpha??1)}
// ---------- LevelKit: tile grid built from a STAGE_DEFS entry (stages.js). Shared by every stage. ----------
const TS=8,K_EMPTY=0,K_SOLID=1,K_ONEWAY=2,K_CHAIN=3,K_SPIKE=4,LEVELS={};
class Level{constructor(def){this.def=def;this.W=def.world;this.oy=def.top;this.cols=Math.ceil(def.world/TS);this.rows=Math.ceil((def.bottom-def.top)/TS);
  const n=this.cols*this.rows;this.k=new Uint8Array(n);this.back=new Uint8Array(n);
  this.fill([0,GY,this.W,def.bottom],K_SOLID);
  (def.carve||[]).forEach(r=>{this.fill(r,K_EMPTY);this.fill(r,1,this.back)});
  (def.breakables||[]).forEach(b=>{this.fill(b.r,K_EMPTY);this.fill(b.r,1,this.back)});
  (def.solid||[]).forEach(r=>this.fill(r,K_SOLID));
  (def.oneway||[]).forEach(r=>this.fill(r,K_ONEWAY));
  (def.chain||[]).forEach(r=>this.fill(r,K_CHAIN));
  (def.spikes||[]).forEach(r=>this.fill(r,K_SPIKE));
  (def.back||[]).forEach(r=>this.fill(r,1,this.back));
  (def.covers||[]).forEach(c=>this.fill(c.r,1,this.back))}
 idx(i,j){return(i<0||j<0||i>=this.cols||j>=this.rows)?-1:j*this.cols+i}
 fill([x0,y0,x1,y1],v,arr=this.k){const i0=Math.floor(x0/TS),i1=Math.ceil(x1/TS),j0=Math.floor((y0-this.oy)/TS),j1=Math.ceil((y1-this.oy)/TS);for(let j=j0;j<j1;j++)for(let i=i0;i<i1;i++){const q=this.idx(i,j);if(q>=0)arr[q]=v}}
 kAt(x,y){const q=this.idx(Math.floor(x/TS),Math.floor((y-this.oy)/TS));return q<0?K_EMPTY:this.k[q]}
 floorAt(x,y){const i=clamp(Math.floor(x/TS),0,this.cols-1);for(let j=Math.max(0,Math.floor((y-this.oy)/TS));j<this.rows;j++){const v=this.k[j*this.cols+i];if(v===K_SOLID||v===K_ONEWAY)return this.oy+j*TS}return this.oy+this.rows*TS}
 rects(kind){const out=[];let open=new Map();
  for(let j=0;j<=this.rows;j++){const next=new Map();
   if(j<this.rows){let i=0;while(i<this.cols){if(this.k[j*this.cols+i]===kind){let e=i;while(e<this.cols&&this.k[j*this.cols+e]===kind)e++;const key=i+','+e;
     if(open.has(key)){const r=open.get(key);r[3]=j+1;next.set(key,r);open.delete(key)}else next.set(key,[i,j,e,j+1]);i=e}else i++}}
   for(const r of open.values())out.push(r);open=next}
  return out.map(([a,j0,b,j1])=>[a*TS,this.oy+j0*TS,b*TS,this.oy+j1*TS])}
 // paints tiles i0..i1,j0..j1 into a canvas; force=true paints everything as brick (hidden-room covers)
 paint(rect,force){const i0=rect?Math.floor(rect[0]/TS):0,i1=rect?Math.ceil(rect[2]/TS):this.cols,j0=rect?Math.floor((rect[1]-this.oy)/TS):0,j1=rect?Math.ceil((rect[3]-this.oy)/TS):this.rows;
  const w=(i1-i0)*TS,h=(j1-j0)*TS,cv=document.createElement('canvas');cv.width=w;cv.height=h;const ctx=cv.getContext('2d'),img=ctx.createImageData(w,h),d=new Uint32Array(img.data.buffer);
  const col=c=>{c=typeof c==='string'?parseInt(c.slice(1),16):c;return((0xff<<24)|((c&0xff)<<16)|(c&0xff00)|((c>>16)&0xff))>>>0};
  const p={gTop:col(C.gTop),g1:col(C.g1),g2:col(C.g2),gM:col(C.gM),gD:col(C.gD),b0:col(C.b0||'#0d0a1e'),bM:col(C.bM||'#07050f'),bH:col(C.bH||'#14102c'),lv:!!C.lava,l0:col(0xfff0a0),l1:col(0xffa020),l2:col(0xe04a10),l3:col(0x8a1a08),ch:col(0x8b86a8),chD:col(0x4d4a7a),i1:col(C.ice1),i2:col(C.ice2),i3:col(C.ice3),i4:col(C.ice4),wh:col(0xffffff)};
  const K=this.k,cols=this.cols,inR=(i,j)=>force&&i>=i0&&i<i1&&j>=j0&&j<j1;
  const sol=(i,j)=>{if(inR(i,j))return true;const q=this.idx(i,j);return q<0?false:K[q]===K_SOLID};
  for(let j=j0;j<j1;j++)for(let i=i0;i<i1;i++){const q=this.idx(i,j);if(q<0)continue;const v=force?K_SOLID:K[q],bk=this.back[q];let tj=j;if(v===K_SOLID)while(sol(i,tj-1)&&tj>j-40)tj--;
   const lE=!sol(i-1,j),rE=!sol(i+1,j),bE=!sol(i,j+1);
   for(let vv=0;vv<TS;vv++)for(let u=0;u<TS;u++){const X=i*TS+u,Y=j*TS+vv;let c=0;
    if(bk&&v!==K_SOLID){const r=Math.floor(Y/6);c=(Y%6===5||((X+(r%2)*6)%12)===0)?p.bM:(Y%6===0?p.bH:p.b0)}
    if(v===K_SOLID){const dy=Y-tj*TS;if(dy===0)c=p.gTop;else if(dy===1)c=p.g2;else{const r=Math.floor((dy-2)/6),k=(dy-2)%6;c=(k===5||((X+(r%2?8:0))%16)===0)?p.gM:(r<=1?p.g1:p.gD)}
     if((lE&&u===0&&dy>1)||(bE&&vv===TS-1))c=p.gM;if(rE&&u===TS-1&&dy>1)c=p.gD}
    else if(v===K_ONEWAY){if(vv===0)c=p.gTop;else if(vv<5)c=p.g1;else if(vv===5)c=p.gM;else if(X%16<2)c=p.gD}
    else if(v===K_CHAIN){const cx=i*TS+3,seg=(Y>>2)&1,m=Y%4;if(seg===0&&(X===cx||X===cx+1)&&(m===0||m===3))c=p.ch;else if(seg===0&&(X===cx-1||X===cx+2)&&(m===1||m===2))c=p.chD;else if(seg===1&&X===cx&&true)c=m===0?p.chD:p.ch}
    else if(v===K_SPIKE&&p.lv){const w=Math.round(Math.sin((X*.7)+(Y>>3))*1.2),top=3+w;if(vv>=top)c=vv===top?p.l0:vv===top+1?p.l1:((X+vv)%5===0?p.l1:vv<6?p.l2:p.l3)}
    else if(v===K_SPIKE){const s=u%4,hh=[2,6,6,2][s];if(TS-1-vv<hh){c=vv===TS-1?p.i4:(TS-1-vv===hh-1?p.wh:(s<2?p.i2:p.i3))}}
    if(c)d[(Y-j0*TS)*w+(X-i0*TS)]=c}}
  ctx.putImageData(img,0,0);return cv}}
// ===================================================================
class Boot extends Phaser.Scene{constructor(){super('boot')}
 preload(){['jump','roll','slash','hit','death','bonfire','souls','charge','shot','parry','menu','pickup','chime','crumble','clang','slam','lava','heal','thunder','buff','talk','fanfare','bell'].forEach(k=>this.load.audio(k,`assets/audio/sfx_${k}.wav`))}
 create(){genTextures(this);if(Q.has('lab'))return this.scene.start('lab');if(Q.get('ending'))return this.scene.start('ending',{kind:Q.get('ending')});if(Q.get('join'))return this.scene.start('title');if(Q.has('host')){NET.startHost(Q.get('room')||undefined);return this.scene.start('stage',{fresh:!Q.has('continue')})}if(DEMO||Q.has('play'))return this.scene.start('stage',{fresh:!Q.has('continue')});this.scene.start('title')}}
// shared parallax
function makeBG(scene,sx=''){const L=[['sky',0],['far',.15],['near',.4]].map(([k,f])=>[scene.add.tileSprite(0,0,W,H,k+sx).setOrigin(0).setScrollFactor(0).setDepth(-10+f),f]);
 const fn=(cx,cy=0)=>L.forEach(([s,f])=>{s.tilePositionX=cx*f;s.y=f?clamp(Math.round(-cy*f*.6),-50,60):0});fn.L=L;return fn}
// ===================================================================
class Title extends Phaser.Scene{constructor(){super('title')}
 create(){Object.assign(C,BASEPAL);this.bg=makeBG(this);this.fx=new FX(this);this.ga=this.add.graphics().setBlendMode(Phaser.BlendModes.ADD).setDepth(5);this.gn=this.add.graphics().setDepth(4);this.gt=this.add.graphics().setDepth(6);
  this.gnd=this.add.tileSprite(0,GY,W,24,'ground').setOrigin(0);this.bgSid='ramparts';this.t=0;heroStyle(null,false,null);
  // milestone D: 3 save slots + class select
  this.saves=[0,1,2].map(i=>Save.load(i));this.mode='slots';this.sel=Save.slot;this.csel=0;this.erase=-1;
  const k=this.input.keyboard;k.on('keydown',e=>this.key(e.key));
  if(Q.get('join')){this.mode='code';this.code=Q.get('join').toUpperCase().slice(0,4);this.time.delayedCall(300,()=>this.doJoin())}
  // r5: touch. Slots act on release; holding a slot 0.6 s opens the erase prompt with ERASE / KEEP buttons. Class rows tap-select, BEGIN confirms.
  this.lastTap=0;this.input.on('pointerdown',p=>{const now=this.time.now;if(now-this.lastTap<120)return;this.lastTap=now;
   if(this.mode==='coop'){const i=Math.floor((p.y-96)/11);if(i>=0&&i<3){if(this.csel===i)this.key('Enter');else this.csel=i}return}
   if(this.mode==='code'){this.tapKeypad(p);return}
   if(this.mode==='slots'){if(this.erase>=0){if(Math.abs(p.y-155)<8&&Math.abs(p.x-128)<26){Save.clear(this.erase);this.saves[this.erase]=null}this.erase=-1;this.held=null;this.eatUp=1;return}
    const i=Math.floor((p.y-96)/11);this.held=i>=0&&i<4?{i,t0:now}:null}
   else{const i=Math.floor((p.y-50)/10);if(p.x<112&&i>=0&&i<10){this.csel=i;return}
    if(p.y>=159&&p.y<=178){if(p.x>=196&&p.x<=266)this.key('Enter');else if(p.x>=54&&p.x<=124)this.key('Escape')}}});
  this.input.on('pointerup',()=>{const h=this.held;this.held=null;if(this.eatUp){this.eatUp=0;return}if(this.mode!=='slots'||!h||h.long)return;if(this.sel===h.i)this.key('Enter');else{this.sel=h.i;this.erase=-1}})}
 // milestone F: co-op entry (host with the highlighted slot, or join with a 4-character room code; keypad works by touch)
 doJoin(){if(this.code.length<4||this.joining)return;this.joining=1;this.joinErr='';const sl=Save.load(Save.slot);let gs=null;try{gs=JSON.parse(localStorage.getItem(NET.GUEST_KEY))}catch(e){}
  const qc=CLASSES[Q.get('class')]?Q.get('class'):null;if(!gs||qc){const c=qc||(sl&&CLASSES[sl.cls]?sl.cls:'knight'),CL=CLASSES[c];gs=qc||!sl?{cls:c,stats:RPG.classStats(c),eq:{main:CL.main,off:CL.off,armor:CL.armor},inv:[CL.main,CL.off,CL.armor,...(CL.extra||[])].filter(Boolean),souls:0}:{cls:sl.cls,stats:sl.stats,eq:sl.eq,inv:sl.inv,souls:0}}
  NET.startJoin(this.code,(err,hello)=>{this.joining=0;if(err){this.joinErr=err;return}Save.write({...gs,stage:hello.sid,bonfire:!!hello.prog.bonfire,bossDown:!!hello.prog.bossDown,ng:hello.ng||0,stain:null});this.go(false)})}
 keypad(){const o=[];CODE_CHARS.split('').forEach((c,i)=>o.push({c,x:64+(i%8)*24,y:92+Math.floor(i/8)*14}));o.push({c:'BACK',x:64,y:136},{c:'DEL',x:160,y:136},{c:'JOIN',x:208,y:136});return o}
 tapKeypad(p){for(const b of this.keypad())if(Math.abs(p.x-b.x-4)<11&&Math.abs(p.y-b.y-2)<7){this.key(b.c==='DEL'?'Backspace':b.c==='JOIN'?'Enter':b.c==='BACK'?'Escape':b.c);return}}
 key(k){if(this.gone)return;const up=k==='ArrowUp',dn=k==='ArrowDown',ok=k==='Enter'||k===' '||k==='z'||k==='Z';this.eatUp=0;
  if(this.mode==='code'){if(k==='Escape'){if(!this.joining){NET.leave();this.mode='coop'}return}if(k==='Backspace'||k==='Delete'){this.code=this.code.slice(0,-1);return}if(k==='Enter'){this.doJoin();return}
   const c=String(k).toUpperCase();if(c.length===1&&CODE_CHARS.includes(c)&&this.code.length<4){this.code+=c;this.joinErr=''}return}
  if(this.mode==='coop'){if(up)this.csel=(this.csel+2)%3;if(dn)this.csel=(this.csel+1)%3;if(k==='Escape'){this.mode='slots';return}
   if(ok){if(this.csel===0){if(!this.saves[Save.slot]){const c='knight',CL=CLASSES[c];Save.write({cls:c,stats:RPG.classStats(c),eq:{main:CL.main,off:CL.off,armor:CL.armor},inv:[CL.main,CL.off,CL.armor],bonfire:false,souls:0,bossDown:false,stage:'ramparts'})}NET.startHost();this.go(false)}
    else if(this.csel===1){this.mode='code';this.code='';this.joinErr=''}else this.mode='slots'}return}
  if(this.mode==='slots'){if(up)this.sel=(this.sel+3)%4;if(dn)this.sel=(this.sel+1)%4;if(up||dn)this.erase=-1;
   if(this.sel===3){if(ok){this.mode='coop';this.csel=0}return}
   // r4 P1: erase only with Delete/Backspace, confirmed by a second Delete/Backspace; any other key cancels the prompt (X/attack never erases)
   const del=k==='Delete'||k==='Backspace';if(this.erase>=0&&!del){this.erase=-1;return}
   if(del&&this.saves[this.sel]){if(this.erase===this.sel){Save.clear(this.sel);this.saves[this.sel]=null;this.erase=-1}else this.erase=this.sel;return}
   if(ok){Save.use(this.sel);if(this.saves[this.sel])this.go(false);else{this.mode='class';this.csel=0}}}
  else{if(up)this.csel=(this.csel+9)%10;if(dn)this.csel=(this.csel+1)%10;if(k==='Escape'||k==='c'||k==='C')this.mode='slots';
   if(ok){const c=CLASS_ORDER[this.csel],CL=CLASSES[c];Save.write({cls:c,stats:RPG.classStats(c),eq:{main:CL.main,off:CL.off,armor:CL.armor},inv:[CL.main,CL.off,CL.armor,...(CL.extra||[])].filter(Boolean),bonfire:false,souls:0,bossDown:false,stage:'ramparts'});this.go(true)}}}
 go(isNew){if(this.gone)return;this.gone=1;this.cameras.main.fadeOut(400,7,5,15);this.time.delayedCall(420,()=>this.scene.start('stage',{fresh:false}))}
 // r3 P3: the title backdrop shows the highlighted save's current stage
 setBackdrop(){const s=this.mode==='slots'&&this.saves[this.sel],sid=s&&STAGE_DEFS[s.stage]?s.stage:'ramparts';if(sid===this.bgSid)return;this.bgSid=sid;const tx=sid==='ramparts'?'':'_'+sid,D=STAGE_DEFS[sid];
  genTextures(this,tx,D.pal);this.bg.L.forEach(([s],i)=>s.setTexture(['sky','far','near'][i]+tx));if(this.textures.exists('ground'+tx))this.gnd.setTexture('ground'+tx)}
 update(_,d){const dt=d/1000;this.t+=dt;this.setBackdrop();const hd=this.held;if(hd&&!hd.long&&this.time.now-hd.t0>600){hd.long=1;if(this.saves[hd.i]){this.sel=hd.i;this.erase=hd.i;this.eatUp=1}}this.bg(this.t*8);const ga=this.ga,gn=this.gn,g=this.gt;ga.clear();gn.clear();g.clear();
  // bonfire + kneeling knight silhouette
  const bx=200,by=GY;if(Math.random()<.9)this.fx.fire(bx,by-3,2,3);if(Math.random()<.2)this.fx.ember(bx,by-8,1);this.fx.update(dt);
  glow(ga,bx,by-6,26+Math.sin(this.t*9)*1.5,C.f2,.16);line(gn,bx,by-1,bx+2,by-16,0x8b86a8);line(gn,bx-2,by-13,bx+4,by-12,0x8b86a8);gn.fillStyle(0x2a2245).fillRect(bx-6,by-2,13,2);
  drawHero(gn,182,by,1,'rest',0,this.t);
  this.fx.draw(ga,gn);
  const title='ASHEN VIGIL',sc=4,tw=textW(title,sc),tx=Math.round(W/2-tw/2),ty=38;
  drawText(g,title,tx,ty+1,0x3a1a10,sc,null);drawText(g,title,tx,ty,0xffb04a,sc,0x1a0d22);
  // ember rim on title letters
  g.fillStyle(0xfff0c0,1);for(let i=0;i<title.length;i++)if(title[i]!==' ')g.fillRect(tx+i*16,ty,4,1);
  if(Math.random()<.5)this.fx.ember(rnd(tx,tx+tw),ty+20,1,.6);
  drawText(g,'A TALE OF THE LAST KINDLING',Math.round(W/2-textW('A TALE OF THE LAST KINDLING')/2),ty+26,0x8a86c0);
  if(this.mode==='slots'){const fmt=v=>{v=Math.floor(v||0);return`${Math.floor(v/60)}:${String(v%60).padStart(2,'0')}`};
   this.saves.forEach((s,i)=>{const on=this.sel===i;let str;if(!s)str='SLOT '+(i+1)+'   - NEW JOURNEY -';else{const c=CLASSES[s.cls]?s.cls:'knight';str='SLOT '+(i+1)+'  '+CLASSES[c].name+' LV '+RPG.level(c,s.stats||RPG.classStats(c))+'  '+((STAGE_DEFS[s.stage]||STAGE_DEFS.ramparts).name.replace('THE ','').split(' ')[0])+'  '+fmt(s.time)+(s.ng?'  NG+'+s.ng:'')}
    if(this.erase===i)str='ERASE SLOT '+(i+1)+'? DEL AGAIN = YES  ANY KEY = NO';const x=Math.round(W/2-textW(str)/2)-4;g.fillStyle(0x07050f,on?.7:.4);g.fillRect(x-6,96+i*11,textW(str)+16,9);drawText(g,(on?'> ':'  ')+str,x,98+i*11,this.erase===i?0xd8402a:on?0xffe2a8:0x6b67a0)});
   {const on=this.sel===3,str='CO-OP  - HOST OR JOIN ONLINE -',x=Math.round(W/2-textW(str)/2)-4;g.fillStyle(0x07050f,on?.7:.4);g.fillRect(x-6,96+33,textW(str)+16,9);drawText(g,(on?'> ':'  ')+str,x,98+33,on?0x9ff0dc:0x5d8a86)}
   if(this.erase>=0){[['ERASE',128,0xd8402a],['KEEP',192,0xd8d0ee]].forEach(([s,cx,col])=>{g.fillStyle(0x1a1028,1);g.fillRect(cx-24,148,48,14);g.lineStyle(1,col,.8);g.strokeRect(cx-24,148,48,14);drawText(g,s,cx-Math.round(textW(s)/2),153,col)})}
   else drawText(g,'HOLD A SLOT TO ERASE',Math.round(W/2-textW('HOLD A SLOT TO ERASE')/2),146,0x4a4678)}
  else if(this.mode==='coop'){const L=['HOST A ROOM WITH SLOT '+(Save.slot+1),'JOIN A ROOM WITH A CODE','BACK'];L.forEach((s,i)=>{const on=this.csel===i,x=Math.round(W/2-textW(s)/2)-4;g.fillStyle(0x07050f,on?.7:.4);g.fillRect(x-6,96+i*11,textW(s)+16,9);drawText(g,(on?'> ':'  ')+s,x,98+i*11,on?0x9ff0dc:0x6b67a0)});
   drawText(g,'TWO PLAYERS. THE HOST\'S WORLD, THE HOST\'S LORDS.',Math.round(W/2-textW('TWO PLAYERS. THE HOST\'S WORLD, THE HOST\'S LORDS.')/2),136,0x8a86c0)}
  else if(this.mode==='code'){g.fillStyle(0x07050f,1);g.fillRect(0,0,W,H);drawText(g,'JOIN A ROOM',Math.round(W/2-textW('JOIN A ROOM',2)/2),18,0x9ff0dc,2);
   for(let i=0;i<4;i++){const ch=this.code[i]||'_';g.fillStyle(0x1a2a30);g.fillRect(118+i*22,46,16,20);drawText(g,ch,121+i*22,50,0xffe2a8,2)}
   for(const b of this.keypad()){const big=b.c.length>1;g.fillStyle(0x1a2a30,.9);g.fillRect(b.x-6,b.y-3,big?textW(b.c)+12:20,12);drawText(g,b.c,b.x-(big?0:-2),b.y,big?0x9ff0dc:0xd8d0ee)}
   const st=this.joinErr||(this.joining?NET.status||'CONNECTING':'TYPE OR TAP THE HOST\'S ROOM CODE');drawText(g,st,Math.round(W/2-textW(st)/2),74,this.joinErr?0xd8402a:0x8a86c0)}
  else{g.fillStyle(0x07050f,1);g.fillRect(0,0,W,H);[['BACK  ESC',89,0x8a86c0],['BEGIN  ENTER',231,0xffe2a8]].forEach(([s,cx,col])=>{g.fillStyle(0x1a1028,1);g.fillRect(cx-34,162,68,14);g.lineStyle(1,col,.7);g.strokeRect(cx-34,162,68,14);drawText(g,s,cx-Math.round(textW(s)/2),167,col)});drawText(g,'CHOOSE YOUR ORIGIN',Math.round(W/2-textW('CHOOSE YOUR ORIGIN',2)/2),12,0xffb04a,2);
   CLASS_ORDER.forEach((c,i)=>{const on=this.csel===i;drawText(g,(on?'> ':'  ')+CLASSES[c].name,14,50+i*10,on?0xffe2a8:0x8a86c0);drawText(g,'LV '+CLASSES[c].lvl,84,50+i*10,on?0xffe2a8:0x5d5990)});
   const c=CLASS_ORDER[this.csel],CL=CLASSES[c],st=RPG.classStats(c),d=RPG.derive(st,{main:CL.main,off:CL.off,armor:CL.armor});
   STATS.forEach((k,i)=>{drawText(g,STAT_NAMES[k],118,50+i*9,0x8a86c0);drawText(g,String(st[k]),180,50+i*9,0xd8d0ee)});
   [['R',WEAPONS[CL.main].name],['L',CL.off?WEAPONS[CL.off].name:'-'],['A',ARMORS[CL.armor].name],['HP '+d.hp+'  ST '+d.st+'  FP '+d.fp,''],['ROLL '+d.roll.kind,'']].forEach(([a,b],i)=>drawText(g,a+(b?'  '+b:''),198,50+i*10,i<3?0xd8d0ee:0x9fd8ff));
   drawText(g,CL.desc,Math.round(W/2-textW(CL.desc)/2),148,0xd8d0ee);heroStyle(WEAPONS[CL.main],false,ARMORS[CL.armor]);drawHero(g,262,122,1,'idle',Math.floor(this.t*2)%2,this.t);heroStyle(null,false,null);
   }
  if(this.mode==='slots')drawText(g,'ARROWS MOVE  Z JUMP  X ATTACK  C ROLL  A PARRY  Q FLASK',Math.round(W/2-textW('ARROWS MOVE  Z JUMP  X ATTACK  C ROLL  A PARRY  Q FLASK')/2),164,0x5d5990,1,null);
  if(this.mode==='slots')drawText(g,'V FROST  S STORM  D DOME  UP REST  ESC PAUSE  M SOUND',Math.round(W/2-textW('V FROST  S STORM  D DOME  UP REST  ESC PAUSE  M SOUND')/2),171,0x5d5990,1,null)}}
// ===================================================================
class Lab extends Phaser.Scene{constructor(){super('lab')}
 create(){makeBG(this)(0);this.add.tileSprite(0,GY,W,24,'ground').setOrigin(0);this.fx=new FX(this);this.ga=this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);this.gn=this.add.graphics();this.t=0}
 update(_,d){const dt=d/1000;this.t+=dt;const ga=this.ga,gn=this.gn;ga.clear();gn.clear();
  SLASH_V.forEach((V,i)=>{const x=50+i*110,y=50,t=(this.t%0.6)/V.dur;if(t<=1)drawSlash(ga,x,y,1,t,V);drawText(gn,'SLASH '+V.name,x-30,72,V===SLASH?0xffe2a8:0x8a86c0)});
  ICE_V.forEach((V,i)=>{const x0=20+i*105,ct=this.t%1.6;for(let k=0;k<V.n;k++){const st=k*.05;const tt=clamp((ct-st)/V.grow,0,1);if(ct-st>0&&ct<1.2){const h=lerp(V.hMin,V.hMax,((k*37)%10)/10)*ease(tt);drawSpike(ga,gn,x0+k*V.step*.8,GY,h,V.hw,tt,0);glow(ga,x0+k*V.step*.8,GY-2,6,C.ice3,.15)}}
   drawText(gn,'ICE '+V.name,x0,GY+8,V===ICEP?0xffe2a8:0x8a86c0)});
  if(Q.has('bolt')){const bp=Stage.prototype.boltPath(260);for(let i=1;i<bp.pts.length;i++)line(ga,bp.pts[i-1][0],bp.pts[i-1][1],bp.pts[i][0],bp.pts[i][1],C.boltC,1)}if(Math.random()<.8)this.fx.fire(160,120,2);this.fx.update(dt);this.fx.draw(ga,gn)}}
// ===================================================================
// ---------- tuning (Tester r1 P1 #3/#4, P2 #7) ----------
const TUNE={rollT:.36,iF0:.04,iF1:.24,rollRec:.1,rollCost:25,rollV:170,atkCost:18,atkT:.34,atkHit0:.08,atkHit1:.16,regen:30,regenDelay:.9,exhaustDelay:1.3,
 flaskN:3,flaskHeal:40,flaskT:.6,parryCost:12,parryWin:.1,parryT:.42,stagT:1.5,ripMul:4,restR:28,domeCost:30,domeR:100};
window.AV={TUNE};
const EHP={hollow:4,knight:6,wraith:3,imp:2,acolyte:4,sentinel:8,chorister:4,husk:5,cinderknight:8,wisp:3,magmaw:3},ESOULS={hollow:30,knight:80,wraith:60,imp:20,acolyte:45,sentinel:120,chorister:90,husk:60,cinderknight:150,wisp:90,magmaw:40};
const EBASE={acolyte:'hollow',sentinel:'knight',chorister:'wraith',husk:'hollow',cinderknight:'knight',wisp:'wraith',magmaw:'imp'};
const ESIZE={hollow:[8,14],knight:[9,15],wraith:[10,12],imp:[7,6]};
// per-kind look: body/shade/rim/eye colours (same rig, new palette) — stage 2 frozen choir, stage 3 cinder
const ELOOK={acolyte:{c:0x8a96b8,s:0x3a4466,rim:0xd8f2ff,eye:0x9fd8ff},sentinel:{c:0x9ab0d8,s:0x46587e,rim:0xbfe4ff,eye:0xe8f6ff,sh:0xd8f2ff},
 husk:{c:0x3a2622,s:0x1a0d0a,rim:0xff7a1a,eye:0xffd04a},cinderknight:{c:0x4a2c26,s:0x22120e,rim:0xffa040,eye:0xfff0a0,sh:0xd25a1a},
 chorister:{c:0xb8c4e0,l:0xffffff,glow:0x9fa8ff,shot:'note'},wisp:{c:0xa02a08,l:0xffd04a,glow:0xff7a1a,shot:'fire'},magmaw:{c:0xffd04a,d:0x6a1408,rim:0xfff0a0}};
const TBTN=[{k:'l',x:22,y:144,r:13,lab:'<'},{k:'r',x:56,y:144,r:13,lab:'>'},{k:'up',x:39,y:120,r:10,lab:'^'},{k:'dn',x:39,y:163,r:8,lab:'V'},
 {k:'jump',x:298,y:148,r:13,lab:'JUMP'},{k:'atk',x:270,y:162,r:12,lab:'ATK'},{k:'roll',x:270,y:135,r:11,lab:'ROLL'},{k:'parry',x:244,y:162,r:10,lab:'PRY'},{k:'hvy',x:244,y:138,r:9,lab:'HVY'},
 {k:'flask',x:302,y:34,r:9,lab:'EST'},{k:'ice',x:280,y:34,r:9,lab:'ICE'},{k:'bolt',x:258,y:34,r:9,lab:'BLT'},{k:'dome',x:236,y:34,r:9,lab:'DOM'},{k:'mir',x:214,y:34,r:9,lab:'MIR'},{k:'pause',x:160,y:10,r:7,lab:'II'}];
class Stage extends Phaser.Scene{constructor(){super('stage')}
 init(d){this.fresh=d.fresh}
 create(){
  const sv=(!this.fresh&&Save.load())||{bonfire:false,souls:0,bossDown:false};sv.stage=STAGE_DEFS[sv.stage]?sv.stage:(STAGE_DEFS[Q.get('stage')]?Q.get('stage'):'ramparts');sv.deaths=sv.deaths||0;sv.time=sv.time||0;sv.ng=sv.ng||0;this.sv=sv;
  this.ng=sv.ng;this.ngMul=1+.5*this.ng;this.playT=sv.time;
  const sid=sv.stage,D=STAGE_DEFS[sid];this.sid=sid;this.def=D;Object.assign(C,BASEPAL,D.pal||{});WORLD=D.world;ARENA_L=D.arena?D.arena[0]:2980;ARENA_R=D.arena?D.arena[1]:3340;
  const tx=sid==='ramparts'?'':'_'+sid;genTextures(this,tx,D.pal);this.lv=LEVELS[sid]||(LEVELS[sid]=new Level(D));this.physics.world.setBounds(0,D.top,WORLD,D.bottom-D.top);
  sv.freed=sv.freed||[];sv.found=sv.found||[];sv.chDone=sv.chDone||[];sv.broken=sv.broken||[];
  // milestone D: character (class, stats, equipment, inventory)
  {const cls=CLASSES[sv.cls]?sv.cls:(CLASSES[Q.get('class')]?Q.get('class'):'knight'),CL=CLASSES[cls];sv.cls=cls;sv.stats=sv.stats||RPG.classStats(cls);
   sv.eq=sv.eq||{main:CL.main,off:CL.off,armor:CL.armor};sv.inv=sv.inv||[CL.main,CL.off,CL.armor,...(CL.extra||[])].filter(Boolean);sv.picked=sv.picked||[]}
  this.bgf=makeBG(this,tx);
  if(!this.textures.exists('lvl_'+sid))this.textures.addCanvas('lvl_'+sid,this.lv.paint());this.add.image(0,D.top,'lvl_'+sid).setOrigin(0).setDepth(1);
  this.gs=this.add.graphics().setDepth(0);
  this.gp=this.add.graphics().setDepth(1.5);// puddles
  this.gl=this.add.graphics().setDepth(2).setBlendMode(Phaser.BlendModes.ADD);// lighting layer
  this.gn=this.add.graphics().setDepth(3);
  this.ga=this.add.graphics().setDepth(4).setBlendMode(Phaser.BlendModes.ADD);
  this.gu=this.add.graphics().setDepth(50).setScrollFactor(0);
  this.gua=this.add.graphics().setDepth(49).setScrollFactor(0).setBlendMode(Phaser.BlendModes.ADD);
  this.fx=new FX(this);this.lights=[];this.pops=[];
  // r2 depth: foreground railings/chains at 1.3x scroll, 70% black; drifting mist bands at 0.2x lit by the FX layer
  {const fg=this.add.graphics().setDepth(7).setScrollFactor(1.3,1);fg.fillStyle(0x05040b,.7);
   for(let x=140;x<WORLD*1.3;x+=260+((x*13)%170)){const k=(x/7|0)%3;
    if(k===0){fg.fillRect(x,GY+6,90,3);for(let p=0;p<=90;p+=10){fg.fillRect(x+p,GY-6,2,14);fg.fillRect(x+p-1,GY-8,4,2)}fg.fillRect(x,GY-4,90,1)}
    else if(k===1){for(let c=0;c<2;c++){const cx=x+c*22;for(let y=-60;y<GY-10-c*30;y+=4){fg.fillRect(cx+(y/4%2?0:1),y,2,3)}}}
    else{fg.fillRect(x,GY-30,10,48);fg.fillRect(x-3,GY-32,16,4);fg.fillRect(x+10,GY-12,26,30)}}}
  const mk='mist'+tx;if(!this.textures.exists(mk))this.textures.addCanvas(mk,makeCanvas(256,40,(x,w,h)=>{const R=seedRand(5);for(let y=0;y<h;y++)for(let xx=0;xx<w;xx++){const v=Math.sin(xx/w*6.283*2+y*.3)*.5+Math.sin(xx/w*6.283*5)*.3+(1-Math.abs(y-h/2)/(h/2))*1.2-.6;const b=(BAYER[y&3][xx&3]+.5)/16;if(v>b+.2)x.fillStyle=v>b+.7?(C.mist||'rgba(120,130,200,.16)'):(C.mist2||'rgba(90,96,170,.10)'),x.fillRect(xx,y,1,1)}}));
  this.mist=[this.add.tileSprite(0,GY-34,W,40,mk).setOrigin(0).setScrollFactor(0).setDepth(1.6),this.add.tileSprite(0,GY-70,W,40,mk).setOrigin(0).setScrollFactor(0).setDepth(-9.5).setAlpha(.7)];
  this.solids=[];const solid=(x,y,w,h,oneway)=>{const r=this.add.rectangle(x+w/2,y+h/2,w,h).setVisible(false);this.physics.add.existing(r,true);if(oneway){r.body.checkCollision.down=false;r.body.checkCollision.left=false;r.body.checkCollision.right=false}this.solids.push(r);return r};
  this.oneways=[];const oneway=(x,y,w,h)=>{const r=solid(x,y,w,h,true);this.solids.pop();this.oneways.push(r);return r};
  this.lv.rects(K_SOLID).forEach(([x0,y0,x1,y1])=>solid(x0,y0,x1-x0,y1-y0));this.lv.rects(K_ONEWAY).forEach(([x0,y0,x1,y1])=>oneway(x0,y0,x1-x0,y1-y0));
  this.plats=D.plats||[];
  this.plats.forEach(([x,y,w])=>{oneway(x,y,w,6);this.add.tileSprite(x,y,w,8,'plat'+tx).setOrigin(0).setDepth(1)});
  this.gateL=solid(ARENA_L-8,0,8,GY,false);this.gateL.body.enable=false;
  // exploration objects (milestone B)
  this.breakables=(D.breakables||[]).filter(b=>!sv.broken.includes(b.id)).map(b=>({...b,hp:3,flash:0,body:solid(b.r[0],b.r[1],b.r[2]-b.r[0],b.r[3]-b.r[1])}));
  this.chs=(D.challenges||[]).map(c=>({...c,active:0,armed:1,done:sv.chDone.includes(c.id)||(c.type==='timer'&&sv.freed.includes(c.cage)),live:[],gateObjs:c.gates.map(r=>({r,closed:false,body:solid(r[0],r[1],r[2]-r[0],r[3]-r[1])}))}));
  this.chs.forEach(c=>this.setGates(c,c.type==='timer'&&!c.done));
  this.cages=(D.cages||[]).map(c=>({...c,freed:sv.freed.includes(c.id),locked:!!c.lock&&!sv.chDone.includes(c.lock),bob:rnd(0,6)}));
  // milestone G: frozen bells (collectible), chests + mimics, loot drops, consumable buffs
  sv.bells=sv.bells||[];sv.chests=sv.chests||[];this.bells=(D.bells||[]).map(b=>({...b,rung:sv.bells.includes(b.id),sw:0}));
  this.chests=(CHESTS[sid]||[]).map(c=>{const o=sv.chests.includes(c.id);return{...c,open:o,st:o?(c.mimic?'dead':'open'):'shut',hp:7*(1+.5*this.ng),t:0,f:-1,hx:c.x,cd:1,lid:o?1:0}});
  this.drops=[];this.dropN=0;this.buffs={guard:0,stam:0};
  this.covers=(D.covers||[]).map(c=>{const k='cov_'+c.id;if(!this.textures.exists(k))this.textures.addCanvas(k,this.lv.paint(c.r,true));
   const found=sv.found.includes(c.id);return{...c,found,a:1,img:this.add.image(Math.floor(c.r[0]/TS)*TS,this.lv.oy+Math.floor((c.r[1]-this.lv.oy)/TS)*TS,k).setOrigin(0).setDepth(5)}});
  const g=this.gs;for(let x=180;x<WORLD;x+=230+((x*7)%60)){const h=40+((x*13)%30);g.fillStyle(C.pil||0x110d26);g.fillRect(x,GY-h,8,h);g.fillRect(x-2,GY-h,12,3);g.fillStyle(C.pilH||0x1e1840);g.fillRect(x,GY-h+3,1,h-3);
   if((x/230|0)%2){g.fillStyle(C.pil||0x110d26);for(let a=0;a<=20;a++){const ax=x+8+a*2,ay=GY-h-Math.round(Math.sin(a/20*Math.PI)*10)+6;g.fillRect(ax,ay,2,3)}}}
  this.puddles=(D.puddles||[]).filter(([x])=>this.lv.kAt(x+4,GY+2)===K_SOLID&&this.lv.kAt(x+4,GY-2)!==K_SPIKE);
  for(const[x,w]of this.puddles){this.gp.fillStyle(0x100c24);this.gp.fillRect(x,GY,w,2);this.gp.fillRect(x+2,GY+2,w-4,1);this.gp.fillStyle(0x3d3570);this.gp.fillRect(x+2,GY,w-6,1)}
  this.braziers=[];for(let x=120;x<WORLD-200;x+=320)this.braziers.push([x,GY]);this.braziers.push([ARENA_L+30,GY],[ARENA_R-30,GY],...(D.braziers||[]));
  this.bonfire={x:D.bonfire||1600,lit:sv.bonfire};
  const sx=sv.bonfire&&!Q.get('x')?this.bonfire.x+14:START_X;
  this.pb=this.physics.add.image(sx,GY-12,'px').setVisible(false);this.pb.body.setSize(6,14);this.pb.setCollideWorldBounds(true);this.pb.body.setMaxVelocityY(330);
  this.physics.add.collider(this.pb,this.solids);this.physics.add.collider(this.pb,this.oneways,null,()=>!(this.player.dropT>0));
  this.player={x:sx,y:GY,f:1,hp:100,hpMax:100,fp:80,fpMax:80,st:100,stMax:100,stDelay:0,stFlash:0,state:'idle',t:0,inv:0,run:0,coy:0,buf:0,atkBuf:0,flash:0,dead:false,flasks:TUNE.flaskN,healLeft:0,combo:0,land:0,dropT:0,wall:0,wallC:0,wallLock:0,spikeT:0,climbCd:0,safe:{x:sx,y:GY}};
  this.souls=sv.souls||0;this.stain=sv.stain||null;this.soulPop=null;this.applyBuild(true);this.arrows=[];this.menu=null;
  this.items=(D.items||[]).filter(it=>!sv.picked.includes(it.id)).map(it=>({...it,bob:rnd(0,6)}));
  sv.lore=sv.lore||[];sv.lords=sv.lords||[];sv.endings=sv.endings||[];this.lore=(D.lore||[]).map(l=>({...l,read:sv.lore.includes(l.id)}));this.loreView=null;this.player.flasks=TUNE.flaskN+(sv.flaskBonus||0);if(D.hub){this.bonfire.lit=true;sv.bonfire=true}
  this.enemies=[];
  D.enemies.forEach(([k,x,y])=>this.spawnEnemy(k,x,y));
  this.shots=[];this.spells=[];this.bolts=[];this.novas=[];this.flames=[];
  this.boss=null;this.bossState=sv.bossDown||!D.boss?'dead':'sleep';this.cine=null;this.bars=0;this.victory=null;this.paused=false;this.flashF=0;
  this.cam=this.cameras.main;this.cam.setBounds(0,D.top,WORLD,D.bottom-D.top);this.camY=clamp(GY-156,D.top,D.bottom-H);this.camTY=this.camY;this.cam.scrollY=this.camY;this.cam.startFollow(this.pb,true,.12,0,0,0);this.camOff=0;
  this.keys=this.input.keyboard.addKeys('LEFT,RIGHT,UP,DOWN,Z,X,C,V,S,E,A,D,Q,F,W,G,T,R,SPACE,SHIFT,ENTER');
  // r6: Phaser drops JustDown when a key goes down and up inside one frame; latch presses so a quick tap (e.g. Up at the keeper) still counts
  this.kl={};this.input.keyboard.on('keydown',e=>{if(!this.menu&&!e.repeat)this.kl[e.keyCode]=1});
  this.input.keyboard.on('keydown',e=>{const V=this.victory;if(V&&V.t>=.8){const n=V.phase==='choose'?2:this.victoryOpts().length;if(e.key==='ArrowUp')V.sel=(V.sel+n-1)%n;if(e.key==='ArrowDown')V.sel=(V.sel+1)%n;if(['Enter',' ','z','x','Z','X'].includes(e.key))this.victoryGo();return}// r5: a key tapped faster than one frame still moves the menu cursor (edge detection alone could miss it)
  if(this.menu&&!this.paused){const m={ArrowUp:['up','up'],ArrowDown:['down','dn'],ArrowLeft:['left','l'],ArrowRight:['right','r']}[e.key];if(m&&!e.repeat){if(this.menu.t<.15)return;this.menuKey(m[0]);if(this.menu)this.menu.prev[m[1]]=1;return}
   const M=this.menu;if(!e.repeat&&['Enter','z','Z','x','X'].includes(e.key)&&M.t>.3){M.kOk=this.time.now;this.menuKey('ok');return}}if(this.menu&&e.key==='Escape'){this.menuKey('back');if(this.menu&&this.menu.mode==='main')this.menu=null;return}if(e.key==='Escape'||e.key==='p'||e.key==='P')this.togglePause();if(e.key==='m'||e.key==='M')this.sound.mute=!this.sound.mute});
  this.touch=Q.has('touch')||!!(this.sys.game.device.input.touch);this.tPrev={};this.tTap={};
  if(this.touch)this.input.addPointer(4);
  this.input.on('pointerdown',p=>{if(this.victory)return this.victoryTap(p);if(!this.touch)return;for(const b of TBTN){const dx=p.x-b.x,dy=p.y-b.y;if(dx*dx+dy*dy<(b.r+4)*(b.r+4))this.tTap[b.k]=1}if(this.tTap.pause){this.tTap.pause=0;this.togglePause()}});
  this.inp={};this.hs=0;this.msg=null;this.t=0;this.flashA=0;this.ai={t:0,roll:2.5,bolt:3};this.stats={dodged:0,parries:0,ripostes:0,flasks:0};
  this.cam.fadeIn(500,7,5,15);
  if(DEMO&&Q.has('boss')){this.pb.x=ARENA_L-60}
  this.say(this.ng&&sid==='ramparts'?'JOURNEY '+(this.ng+1)+' - THE RAMPARTS STIR':sv.bonfire?'RESTED AT '+D.bonfireName:D.name,2.5);NET.onStage(this)}
 // ---------------- milestone D: build, moves, menus ----------------
 applyBuild(full){const P=this.player,sv=this.sv,d=RPG.derive(sv.stats,sv.eq);this.build=d;this.wp=WEAPONS[sv.eq.main]||WEAPONS.dagger;this.spellMul=d.spell||0;this.lvl=RPG.level(sv.cls,sv.stats);
  P.hpMax=d.hp;P.stMax=d.st;P.fpMax=d.fp;if(full){P.hp=d.hp;P.st=d.st;P.fp=d.fp}else{P.hp=Math.min(P.hp,P.hpMax);P.st=Math.min(P.st,P.stMax);P.fp=Math.min(P.fp,P.fpMax)}P.poiseHP=d.poise}
 rb(){const r=this.build.roll;return r.kind==='MEDIUM'?{kind:r.kind,t:TUNE.rollT,v:TUNE.rollV,i0:TUNE.iF0,i1:TUNE.iF1,cost:TUNE.rollCost}:r}
 move(){const w=this.wp,P=this.player;const m=P.heavy?w.heavy:w.light;if(w===WEAPONS.longsword&&!P.heavy)return{...m,t:TUNE.atkT,h0:TUNE.atkHit0,h1:TUNE.atkHit1,cost:TUNE.atkCost};return m}
 startAtk(hv,combo,on){const P=this.player,b=this.pb;P.state='atk';P.t=0;P.spDone=0;P.combo=combo;P.heavy=hv;const m=this.move();this.spend(m.cost);P.hitDone=false;this.sfx(this.wp.type==='bow'?'roll':'slash',hv?.4:.3);
  if(on)b.setVelocityX(P.f*(m.lunge||0));if(m.hop&&on)b.setVelocityY(m.hop);if(hv)this.fx.dust(P.x,P.y,4,-P.f);this.stats.heavies=(this.stats.heavies||0)+(hv?1:0)}
 canCast(k){const P=this.player;if(!this.build.cat){this.pop('NO CATALYST',P.x,P.y-24,0xd8402a);return false}
  if(this.sv.stats.int<SPELLS[k].int){this.pop('NEED INT '+SPELLS[k].int,P.x,P.y-24,0xd8402a);return false}
  if(!RPG.meets(this.build.cat,this.sv.stats)){this.pop('CATALYST TOO HEAVY FOR MIND',P.x,P.y-24,0xd8402a);return false}return true}
 shootArrow(m){const P=this.player;P.hitDone=true;const ar=this.build.ar*m.mul*(P.bless>0?P.blessMul:1);this.arrows.push({x:P.x+P.f*8,y:P.y-10,vx:P.f*m.arrow,t:0,dmg:ar,pierce:!!m.pierce,hit:[]});this.sfx('shot',.3);this.fx.spark(P.x+P.f*8,P.y-10,4,0xffe2a8,40)}
 updateArrows(dt){for(let i=this.arrows.length-1;i>=0;i--){const a=this.arrows[i];a.t+=dt;a.x+=a.vx*dt;a.vy=(a.vy||0)+(a.ls?0:40)*dt;a.y+=a.vy*dt;let gone=a.t>1.4||this.lv.kAt(a.x,a.y)===K_SOLID;
   for(const e of this.enemies){if(gone||e.dead||a.hit.includes(e))continue;const bb=e.b.body;if(Math.abs(bb.center.x-a.x)<bb.width/2+2&&Math.abs(bb.center.y-a.y)<bb.height/2+2){a.hit.push(e);this.damageEnemy(e,e.state==='stag'?a.dmg*TUNE.ripMul:a.dmg,Math.sign(a.vx));if(!a.pierce)gone=true}}
   const B=this.boss;if(!gone&&B&&this.bossState==='fight'&&!a.hit.includes(B)&&Math.abs(B.x-a.x)<12&&a.y>B.y-44&&a.y<B.y){a.hit.push(B);this.damageBoss(a.dmg*1.5);if(!a.pierce)gone=true}
   for(const c of this.cages)if(!gone&&!c.freed&&Math.abs(c.x-a.x)<8&&Math.abs(c.y-8-a.y)<10){gone=true;c.locked?this.pop('SEALED',c.x,c.y-22,0x9fb8e8):this.freeCage(c)}
   if(gone){this.fx.spark(a.x,a.y,5,0xffe2a8,60);this.arrows.splice(i,1)}}}
 say(s,d=2){this.msg={s,t:d}}
 pop(s,x,y,c=0xffe2a8){this.pops.push({s,x,y,c,t:0})}
 sfx(k,v=.35){try{this.sound.play(k,{volume:v})}catch(e){}}
 light(x,y,r,c,a){this.lights.push({x,y,r,c,a})}
 togglePause(){if(this.victory||this.player.dead)return;this.paused=!this.paused;this.paused?this.physics.pause():this.physics.resume()}
 gainSouls(n,noShare){if(NET.host()&&!noShare)NET.send({t:'souls',n});n=Math.round(n*(this.build?this.build.soulMul:1));this.souls+=n;this.soulPop={n:(this.soulPop&&this.soulPop.t>0?this.soulPop.n:0)+n,t:1.4}}
 spawnEnemy(k,x,gy=GY){const base=EBASE[k]||k;const b=this.physics.add.image(x,gy-20,'px').setVisible(false);const S=ESIZE[base];b.body.setSize(S[0],S[1]);b.setCollideWorldBounds(true);
  if(base==='wraith'){b.body.setAllowGravity(false);b.y=gy-40}else{this.physics.add.collider(b,this.solids);this.physics.add.collider(b,this.oneways)}
  const e={k,base,b,x0:x,hp:EHP[k]*this.ngMul,state:'idle',t:rnd(0,1),f:-1,flash:0,dead:false,cd:rnd(1,2.5),souls:ESOULS[k]*(1+this.ng),guard:3,combo:0,gy};this.enemies.push(e);return e}
 // ---------------- input ----------------
 touchState(){const o={};if(!this.touch)return o;const held={};
  for(const p of this.input.manager.pointers){if(!p||!p.isDown)continue;for(const b of TBTN){const dx=p.x-b.x,dy=p.y-b.y;if(dx*dx+dy*dy<(b.r+4)*(b.r+4))held[b.k]=1}}
  for(const b of TBTN){o[b.k]=!!held[b.k];o[b.k+'P']=(!!held[b.k]&&!this.tPrev[b.k])||!!this.tTap[b.k]}this.tPrev=held;this.tTap={};this.tHeld=held;return o}
 readInput(){const K=this.keys,kl=this.kl||{},J=k=>Phaser.Input.Keyboard.JustDown(k)||!!kl[k.keyCode];this.kl={};
  if(window.__inp)return window.__inp(this);
  if(DEMO)return this.demoInput();
  const T=this.touchState(),sh=K.SHIFT.isDown,xP=J(K.X),upP=J(K.UP)|J(K.E);
  return{l:K.LEFT.isDown||T.l,r:K.RIGHT.isDown||T.r,up:K.UP.isDown||T.up,dn:K.DOWN.isDown||T.dn,jump:K.Z.isDown||K.SPACE.isDown||T.jump,jumpP:J(K.Z)|J(K.SPACE)|T.jumpP,
   atkP:(xP&&!sh)||T.atkP,parryP:J(K.A)||(xP&&sh)||T.parryP,rollP:J(K.C)||T.rollP,iceP:J(K.V)||T.iceP,boltP:J(K.S)||T.boltP,domeP:J(K.D)||T.domeP,
   flaskP:J(K.Q)|J(K.F)|T.flaskP,restP:upP||T.upP,heavyP:J(K.W)||T.hvyP,healP:J(K.G),lspearP:J(K.T),blessP:J(K.R),mirP:T.mirP}}
 demoInput(){const P=this.player,A=this.ai,o={};A.t+=this.dt;A.roll-=this.dt;A.bolt-=this.dt;
  let near=null,nd=1e9;for(const e of this.enemies)if(!e.dead){const d=e.b.x-P.x;if(d>-20&&d<nd){nd=d;near=e}}
  const B=this.boss&&this.bossState==='fight'?this.boss:null;
  if(this.cine)return o;
  if(P.hp<45&&P.flasks>0&&P.state!=='drink'&&(!B||Math.abs(B.x-P.x)>40))o.flaskP=1;
  if(B){const d=B.x-P.x;const dist=Math.abs(d);P.f=Math.sign(d)||1;
   if(B.state==='stag'){if(dist>18)o[d>0?'r':'l']=1;else o.atkP=1;return o}
   if(B.state==='wind'&&B.next==='slam'&&dist<30&&B.t>B.wt-.12&&Math.random()<.5){o.parryP=1;return o}
   if(B.state==='wind'&&dist<70&&A.roll<1.5&&B.t>B.wt-.15){o.rollP=1;o[d>0?'l':'r']=1;A.roll=2.2;return o}
   if(dist>26)o[d>0?'r':'l']=1;else if(Math.random()<.25)o.atkP=1;
   if(dist>50&&P.fp>=20&&A.bolt<0){o.boltP=1;A.bolt=2.4}else if(dist<90&&P.fp>=TUNE.domeCost&&Math.random()<.02)o.domeP=1;
   if(P.hp<15)P.hp=60;return o}
  o.r=1;
  if(near){const d=near.b.x-P.x,dy=Math.abs(near.b.y-P.y);if(d<20&&d>-14&&dy<26){o.r=d>8;if(near.state==='stag'||Math.random()<.35)o.atkP=1;if(near.state==='wind'&&Math.random()<.3)o.parryP=1}
   else if(d<95&&d>40&&P.fp>=15&&Math.random()<.05&&near.base!=='wraith')o.iceP=1;
   if(near.base==='wraith'&&d<150&&d>0&&P.fp>=20&&A.bolt<0){o.boltP=1;A.bolt=3}}
  if(A.roll<0&&near&&near.b.x-P.x<70&&near.b.x-P.x>40){o.rollP=1;A.roll=3.5}
  if(this.pb.body.blocked.right||Math.random()<.01){o.jumpP=1;o.jump=1;A.hold=.25}
  if(A.hold>0){A.hold-=this.dt;o.jump=1}
  if(P.x>this.bonfire.x-12&&P.x<this.bonfire.x&&!this.bonfire.lit)o.restP=1;
  if(P.hp<15)P.hp=60;
  return o}
 // ---------------- update ----------------
 update(time,delta){const dt=Math.min(delta,50)/1000;this.dt=dt;
  if(this.paused){this.touchState();this.drawHUD();return}
  if(this.victory){this.victory.t+=dt;this.victoryInput();this.fx.update(dt);this.render(dt);return}
  this.t+=dt;if(!this.cine)this.playT+=dt;
  if(this.hs>0){this.hs-=dt;if(this.hs<=0)this.physics.resume();this.render(0);return}
  const P=this.player,b=this.pb;let inp=this.cine||P.dead?{}:this.readInput();if(this.menu){this.menu.t+=dt;if(this.menu.mode==='main'&&(inp.l||inp.r)&&this.menu.t>.2)this.menu=null;else{this.menuInput(inp);inp={}}}
  else if(this.loreView){this.loreView.t+=dt;if(this.loreView.t>.35&&(inp.restP||inp.atkP||inp.jumpP||inp.rollP||inp.l||inp.r))this.loreView=null;inp={}}
  else if(inp.restP&&this.pb.body.blocked.down&&this.interact())inp={...inp,restP:0};this.inp=inp;
  P.x=b.x;P.y=b.body.bottom;
  this.updatePlayer(dt,inp);this.updateArrows(dt);this.updatePickups();this.updateLoot(dt);this.updateLevel(dt);if(NET.guest())NET.guestSim(this,dt);else{this.updateEnemies(dt);this._inE=0;this.updateBoss(dt)}NET.tick(this,dt);this.updateSpells(dt);this.updateCine(dt);
  // bloodstain: recover souls (Tester r1 P1 #2)
  const S=this.stain;if(S&&!P.dead){if(Math.random()<.5)this.fx.add({k:'soul',x:S.x+rnd(-3,3),y:(S.y||GY)-rnd(0,4),vx:rnd(-4,4),vy:rnd(-24,-10),l:.31,m:.9});
   if(Math.abs(P.x-S.x)<10&&Math.abs(P.y-(S.y||GY))<24){this.gainSouls(S.souls,1);this.fx.soul(S.x,(S.y||GY)-6,20);this.sfx('souls',.5);this.say('SOULS RETRIEVED',2);this.stain=null;this.sv.stain=null;this.sv.souls=this.souls;Save.write(this.sv)}}
  for(const[x,by]of this.braziers)if(Math.abs(x-this.cam.scrollX-160)<200&&Math.abs(by-this.cam.scrollY-90)<140){this.fx.fire(x,by-15,2,2);if(Math.random()<.06)this.fx.ember(x,by-18,1)}
  if(Math.abs(this.bonfire.x-P.x)<240){const n=this.bonfire.lit?2:1;for(let i=0;i<n;i++)this.fx.fire(this.bonfire.x,GY-3,1,this.bonfire.lit?4:2,this.bonfire.lit?1.3:.7);if(Math.random()<.15)this.fx.ember(this.bonfire.x,GY-8,1)}
  const th=this.def.theme,cX=this.cam.scrollX,cY=this.cam.scrollY;
  if(th==='cathedral'){if(Math.random()<.7)this.fx.snow(cX+rnd(-20,340),cY-2)}
  else if(th==='cinderdeep'){if(Math.random()<.45)this.fx.ember(cX+rnd(0,320),cY+H+4,1,rnd(.8,1.6));
   for(const r of this.def.spikes||[])if(r[2]>cX-20&&r[0]<cX+W+20&&r[1]>cY-20&&r[1]<cY+H+20&&Math.random()<.5)this.fx.fire(rnd(r[0],r[2]),r[1]+3,1,1,.7)}
  else if(cX>ARENA_L-320&&Math.random()<.6)this.fx.snow(cX+rnd(-20,340),cY-2);
  if(Q.get('still')==='dome'&&!this._sd&&this.t>2.5){this._sd=1;this.castDome(this.player.x,'p',1,this.player.y);setTimeout(()=>window.__dome=1,900)}
  if(Q.get('still')==='bolt'&&!this._sb&&this.t>2.5){this._sb=1;this.castBolt();setTimeout(()=>window.__bolt=1,130)}
  this.fx.update(dt);
  if(!this.cine){this.camOff=lerp(this.camOff,-P.f*36,1-Math.pow(.02,dt));this.cam.setFollowOffset(Math.round(this.camOff),0);this.updateCamY(dt)}
  this.render(dt)}
 // ---------------- exploration (milestone B): climb, wall, hazards, camera, secrets, cages, challenges ----------------
 onOneway(){const P=this.player;for(const o of this.oneways){const bd=o.body;if(bd.enable&&P.x>bd.x-3&&P.x<bd.right+3&&Math.abs(P.y-bd.y)<3)return true}return false}
 explore(dt,inp,dir,on){const P=this.player,b=this.pb,body=b.body,L=this.lv,cx=P.x,cy=P.y-7;P.dropT-=dt;P.wallLock-=dt;P.wallC-=dt;P.climbCd-=dt;
  if(!on||P.state!=='wall'){}
  // hazards: spikes hurt and return you to the last safe footing
  if((L.kAt(cx,P.y-2)===K_SPIKE||L.kAt(cx,cy)===K_SPIKE)&&P.spikeT<=0&&!P.dead){P.inv=0;this.hurtPlayer(15,cx-P.f);P.spikeT=.3;this.stats.spikes=(this.stats.spikes||0)+1}
  if(P.spikeT>0){P.spikeT-=dt;if(P.spikeT<=0&&!P.dead){b.setPosition(P.safe.x,P.safe.y-8);b.setVelocity(0,0);this.fx.ember(P.safe.x,P.safe.y-6,10,1)}}
  if(on&&!['roll','hurt'].includes(P.state)&&L.kAt(cx-3,P.y-2)!==K_SPIKE&&L.kAt(cx+3,P.y-2)!==K_SPIKE&&L.kAt(cx,P.y+3)!==K_SPIKE)P.safe={x:cx,y:P.y};
  const chainHere=L.kAt(cx,cy)===K_CHAIN,chainBelow=L.kAt(cx,P.y+4)===K_CHAIN;
  if(P.state==='climb'){body.setAllowGravity(false);const v=(inp.dn?1:0)-(inp.up?1:0);b.setVelocity(0,v*62);if(v)P.run+=dt*8;
   // r3 P1: climb-over-the-top — a ledge beside the chain near the climber's feet is mantled onto instead of bonking its underside
   if(P.buf>0||(v<0&&!chainHere)){const tx0=Math.floor(cx/TS)*TS;for(const s of dir?[dir]:[1,-1]){const ex=s>0?tx0+TS+1:tx0-2;
     for(let yy=Math.floor(P.y-34);yy<=P.y+2;yy++){if(L.kAt(ex,yy)!==K_EMPTY&&L.kAt(ex,yy)!==K_CHAIN&&L.kAt(ex,yy-1)===K_EMPTY&&L.kAt(ex,yy-14)===K_EMPTY){
      P.buf=0;body.setAllowGravity(true);b.setPosition(ex+s*4,yy-8);b.setVelocity(s*40,0);P.state='idle';P.climbCd=.3;P.f=s;this.fx.dust(ex,yy,4,s);this.stats.mantles=(this.stats.mantles||0)+1;return true}}}}
   if(P.buf>0){P.buf=0;body.setAllowGravity(true);b.setVelocity(dir*90,-230);P.state='jump';P.climbCd=.3;this.sfx('jump',.25);return true}
   if(!chainHere&&!(v>0&&chainBelow)){body.setAllowGravity(true);if(v<0){b.setVelocity(dir*60,-190);P.climbCd=.35}P.state='fall';return true}
   if(on&&v>0&&!chainBelow){body.setAllowGravity(true);P.state='idle'}
   return true}
  const free=!['roll','rollrec','atk','cast','hurt','rest','drink','parry'].includes(P.state);
  if(free&&P.climbCd<=0&&((chainHere&&(inp.up||(inp.dn&&!on)))||(on&&inp.dn&&chainBelow&&!chainHere))){
   P.state='climb';P.t=0;b.x=Math.floor(cx/TS)*TS+3;b.setVelocity(0,0);body.setAllowGravity(false);if(!chainHere){P.dropT=.3;b.y+=3}this.stats.climbs=(this.stats.climbs||0)+1;return true}
  body.setAllowGravity(true);return false}
 updateCamY(dt){const P=this.player,on=this.pb.body.blocked.down,D=this.def;let ty=this.camTY;
  if(on||P.state==='climb'||P.state==='wall')ty=P.y-156+(P.state==='climb'&&this.inp.dn?50:0);
  if(P.y-this.camY<56)ty=Math.min(ty,P.y-56);if(P.y-this.camY>170)ty=Math.max(ty,P.y-170);
  this.camTY=ty;this.camY=lerp(this.camY,ty,1-Math.pow(.004,dt));if(P.y-this.camY>176)this.camY=P.y-176;this.camY=clamp(this.camY,D.top,D.bottom-H);this.cam.scrollY=Math.round(this.camY)}
 setGates(ch,closed){for(const g of ch.gateObjs){g.closed=closed;g.body.body.enable=closed}}
 hitBreakable(k,fromNet){if(NET.guest()&&!fromNet){k.flash=.1;this.sfx('crumble',.25);NET.send({t:'brk',id:k.id});return}k.hp--;k.flash=.1;const r=k.r,mx=(r[0]+r[2])/2,my=(r[1]+r[3])/2;this.fx.dust(mx,my,8);this.fx.spark(mx,my,8,0xb0a8d8,100);this.sfx('crumble',.25);this.cam.shake(90,.008);
  if(k.hp<=0){k.body.body.enable=false;k.body.destroy();for(let i=0;i<20;i++)this.fx.add({k:'dust',x:rnd(r[0],r[2]),y:rnd(r[1],r[3]),vx:rnd(-40,40),vy:rnd(-60,-10),l:0,m:rnd(.4,.8),sz:2});this.cam.shake(200,.014);this.sfx('crumble',.5);this.pop('THE WALL GIVES WAY',mx,r[1]-8);this.sv.broken.push(k.id);Save.write(this.sv)}}
 freeCage(c,fromNet){if(NET.guest()&&!fromNet){if(!c.req){c.req=1;NET.send({t:'cage',id:c.id});setTimeout(()=>c.req=0,800)}return}c.freed=true;this.sv.freed.push(c.id);this.gainSouls(50);Save.write(this.sv);const n=this.cages.filter(q=>q.freed).length;
  this.fx.spark(c.x,c.y-8,20,C.f1,140);this.fx.spark(c.x,c.y-8,10,0x8b86a8,120);this.fx.ember(c.x,c.y-8,24,2);for(let i=0;i<30;i++)this.fx.fire(c.x+rnd(-4,4),c.y-8-i*2,1,2,1.4);
  this.novas.push({x:c.x,y:c.y-8,t:0,m:.5,parry:1});this.sfx('chime',.5);this.sfx('souls',.4);this.pop('EMBER FREED '+n+'/'+this.cages.length,c.x,c.y-26,0xffb04a);this.cam.shake(120,.008);if(this.hs<=0)this.hitstop(.06)}
 spawnWave(ch){ch.live=ch.waves[ch.wave].map(([k,x,y])=>{const e=this.spawnEnemy(k,x,y);e.temp=1;e.state=k==='imp'?'hop':'chase';this.fx.ember(x,y-8,16,1.6);this.fx.fire(x,y-2,12,4,1.2);return e});this.say(ch.name+' - WAVE '+(ch.wave+1),1.6)}
 updateLevel(dt){const P=this.player;
  for(const c of this.covers){const r=c.r,inside=P.x>r[0]-2&&P.x<r[2]+2&&P.y-7>r[1]&&P.y-7<r[3]+2;c.a=lerp(c.a,inside?0:1,1-Math.pow(.001,dt));c.img.setAlpha(c.a);
   if(inside&&!c.found){c.found=true;this.sv.found.push(c.id);Save.write(this.sv);this.pop('HIDDEN ROOM',P.x,P.y-26,0x9ff0dc);this.sfx('chime',.35)}}
  for(const k of this.breakables)k.flash-=dt;
  for(const ch of NET.guest()?[]:this.chs){const z=ch.zone,inZ=P.x>z[0]&&P.x<z[2]&&P.y>z[1]&&P.y<=z[3]+1&&!P.dead;
   if(ch.type==='timer'){if(!inZ&&!ch.active)ch.armed=1;
    if(!ch.active&&!ch.done&&inZ&&ch.armed){ch.active=1;ch.armed=0;ch.t=ch.limit;this.setGates(ch,false);this.say(ch.name+' - REACH THE CAGE',2);this.sfx('charge',.4);this.cam.shake(120,.006)}
    if(ch.active){ch.t-=dt;const cg=this.cages.find(c=>c.id===ch.cage);if(cg&&cg.freed){ch.active=0;ch.done=1;if(!this.sv.chDone.includes(ch.id))this.sv.chDone.push(ch.id);Save.write(this.sv);this.say('CHALLENGE CLEARED',2)}
     else if(ch.t<=0){ch.active=0;this.setGates(ch,true);this.say('TOO SLOW - THE GATE SEALS',2);this.sfx('clang',.45);this.cam.shake(150,.01)}}}
   else{if(!ch.active&&!ch.done&&inZ){ch.active=1;ch.wave=0;this.setGates(ch,true);this.cam.shake(220,.012);this.sfx('clang',.5);this.spawnWave(ch)}
    if(ch.active&&ch.live.every(e=>e.dead)){ch.wave++;if(ch.wave<ch.waves.length)this.spawnWave(ch);else{ch.active=0;ch.done=1;this.setGates(ch,false);this.sv.chDone.push(ch.id);Save.write(this.sv);
      for(const c of this.cages)if(c.lock===ch.id){c.locked=false;this.fx.spark(c.x,c.y-8,16,C.f1,120)}this.say('TRIAL CLEARED - THE SEAL BREAKS',2.5);this.sfx('fanfare',.45)}}}}}
 // per-stage atmosphere: stained-glass light shafts (cathedral), lava glow (cinderdeep)
 drawStageFX(g,ga){const D=this.def,t=this.t,cX=this.cam.scrollX,cY=this.cam.scrollY;
  // distinct lord arenas: cathedral rose window + choir balconies, cinder lava falls
  if(cX>ARENA_L-W){if(D.theme==='cathedral'){const rx=3160,ry=40;for(let a=0;a<48;a++){const an=a/48*6.283;px(ga,rx+Math.cos(an)*34,ry+Math.sin(an)*34,0x9fa8ff,.5)}for(let k=0;k<8;k++){const an=k/8*6.283+t*.05;line(ga,rx,ry,rx+Math.cos(an)*32,ry+Math.sin(an)*32,[0x9fd8ff,0xb8a8ff,0xd8f2ff][k%3],.18)}glow(ga,rx,ry,30,0x9fa8ff,.08);this.light(rx,ry,70,0x9fa8ff,.4)}
   if(D.theme==='cinderdeep'){for(const lx of[3000,3320]){for(let y=Math.max(cY,-60);y<GY;y+=2){const w=3+Math.round(Math.sin(y*.2+t*6));ga.fillStyle((y+Math.floor(t*40))%6<3?C.f1:C.f2,.55);ga.fillRect(lx-w,y,w*2,2)}glow(ga,lx,GY-4,14,C.f2,.3);this.light(lx,GY-20,60,C.f2,.7);if(Math.random()<.5)this.fx.fire(lx,GY-2,2,4,1.4)}}}
  if(D.theme==='belltower')this.drawBelltowerFX(g,ga,cX,cY);
  if(D.theme==='cathedral'){const cols=[0x9fd8ff,0xb8a8ff,0xd8f2ff];
   for(let si=0;si<(D.shafts||[]).length;si++){const sx=D.shafts[si];if(sx<cX-120||sx>cX+W+60)continue;const top=Math.max(cY,-200),c=cols[si%3],pulse=.8+.2*Math.sin(t*.7+si);
    for(let y=top;y<GY;y+=2){const k=(y-top)/(GY-top),x0=Math.round(sx+(y-top)*.35),w=Math.round(10+k*14);if(this.lv.kAt(x0+w/2,y)===K_SOLID)continue;ga.fillStyle(c,.045*pulse*(1-k*.4));ga.fillRect(x0,y,w,2);if((y>>1)%7===0)px(ga,x0+((y*13+Math.floor(t*8))%w),y,0xffffff,.25)}
    this.light(sx+(GY-top)*.35,GY-4,40,c,.35*pulse)}}
  if(D.lavaPits&&this.boss&&this.boss.kind==='king'){const on=this.boss.phase>=2;for(const[a,b]of D.lavaPits){if(on){g.fillStyle(0x8a1a08);g.fillRect(a,GY,b-a,3);for(let x=a;x<b;x++){const h=1+((x*7+Math.floor(t*10))%3);g.fillStyle(h>2?0xffd04a:C.f2);g.fillRect(x,GY-h+1,1,h)}glow(ga,(a+b)/2,GY,(b-a)*.6,C.f2,.25);this.light((a+b)/2,GY-4,50,C.f2,.8)}else{g.fillStyle(0x3a1008);for(let x=a+3;x<b-3;x+=7){g.fillRect(x,GY,4,1);px(g,x+2,GY+1,C.f2)}}}}
  if(D.theme==='cinderdeep'){for(const r of D.spikes||[]){if(r[2]<cX-40||r[0]>cX+W+40)continue;const mx=(r[0]+r[2])/2;glow(ga,mx,r[1]+4,14+Math.sin(t*5+mx)*2,C.f2,.18);this.light(mx,r[1],50+Math.sin(t*7+mx)*3,C.f2,.7);
    const bx=r[0]+((Math.floor(t*3+mx))%(r[2]-r[0]));px(ga,bx,r[1]+2-((t*6)%3),C.f0,.8)}}}
 drawExplore(g,ga){const t=this.t;this.drawLoot(g,ga);
  for(const k of this.breakables){if(k.hp<=0)continue;const[x0,y0,x1,y1]=k.r;g.fillStyle(k.flash>0?0xb0a8d8:C.g1);g.fillRect(x0,y0,x1-x0,y1-y0);g.fillStyle(C.gTop);g.fillRect(x0,y0,x1-x0,1);
   g.fillStyle(C.gM);for(let y=y0+6;y<y1;y+=6)g.fillRect(x0,y,x1-x0,1);for(let y=y0,r=0;y<y1;y+=6,r++)g.fillRect(x0+(r%2?4:10),y,1,6);
   g.fillStyle(0x07050f);const cr=3-k.hp;line(g,x0+3,y0+4,x0+8,y0+14,0x07050f);line(g,x0+8,y0+14,x0+5,y0+22,0x07050f);if(cr>0){line(g,x0+8,y0+14,x0+13,y0+18,0x07050f);line(g,x0+5,y0+22,x0+10,y1-2,0x07050f)}if(cr>1){line(g,x0+2,y0+16,x0+6,y0+26,0x07050f);line(g,x0+11,y0+5,x0+14,y0+11,0x07050f)}
   if(Math.floor(t*2)%3===0)px(ga,x0+8,y0+14,C.f1,.5)}
  for(const ch of this.chs)for(const gt of ch.gateObjs){if(!gt.closed)continue;const[x0,y0,x1,y1]=gt.r;g.fillStyle(0x2a2245);g.fillRect(x0,y0,x1-x0,y1-y0);g.fillStyle(0x8b86a8);for(let x=x0+1;x<x1;x+=3)g.fillRect(x,y0,1,y1-y0);for(let y=y0+4;y<y1;y+=10)g.fillRect(x0,y,x1-x0,1);
   const c=ch.type==='timer'?C.ice2:C.f2;for(let y=y0+6;y<y1;y+=14)px(ga,x0+4,y+((t*20)|0)%4,c,.8);this.light((x0+x1)/2,(y0+y1)/2,20,c,.3)}
  for(const c of this.cages){if(c.freed)continue;const x=Math.round(c.x),y=Math.round(c.y),bob=Math.round(Math.sin(t*3+c.bob)),ey=y-7+bob;
   g.fillStyle(C.f3);g.fillRect(x-2,ey-2,5,5);g.fillStyle(C.f2);g.fillRect(x-1,ey-3,3,5);px(g,x,ey-4,C.f1);px(g,x+Math.round(Math.sin(t*7)),ey-5,C.f0);px(g,x-1,ey-1,0x2a0e06);px(g,x+1,ey-1,0x2a0e06);
   glow(ga,x,ey,6+Math.sin(t*9),C.f2,.25);this.light(x,ey,30,C.f2,.5);if(Math.random()<.05)this.fx.ember(x,ey-3,1,.5);
   g.fillStyle(0x3a3060);g.fillRect(x-7,y-16,15,2);g.fillRect(x-7,y-1,15,1);g.fillStyle(0x8b86a8);for(let k=-6;k<=6;k+=3)g.fillRect(x+k,y-14,1,13);g.fillRect(x-7,y-16,15,1);g.fillRect(x,y-19,1,3);px(g,x,y-20,0xd8d0ee);
   if(c.locked){g.fillStyle(C.f1);g.fillRect(x-2,y-9,5,4);g.fillStyle(0x2a1408);px(g,x,y-8,0x2a1408);line(g,x-6,y-14,x+6,y-2,0x4d4a7a);line(g,x+6,y-14,x-6,y-2,0x4d4a7a)}}}

 canAct(){const P=this.player;if(P.st>0)return true;P.stFlash=.5;return false}
 spend(n){const P=this.player;P.st-=n;if(P.st<=0){P.st=0;P.stDelay=TUNE.exhaustDelay;P.stFlash=.6}else P.stDelay=TUNE.regenDelay}
 updatePlayer(dt,inp){const P=this.player,b=this.pb,body=b.body,on=body.blocked.down;P.t+=dt;P.inv-=dt;P.flash-=dt;P.stDelay-=dt;P.stFlash-=dt;P.land-=dt;
  if(P.dead){b.setVelocityX(0);P.deadT+=dt;if(P.deadT>2.6)this.respawn();return}
  P.poiseT=(P.poiseT||0)-dt;if(P.poiseT<=0)P.poiseHP=this.build.poise;if(P.bless>0){P.bless-=dt;if(Math.random()<.5)this.fx.spark(P.x+P.f*rnd(4,12),P.y-rnd(6,16),1,0xffe8a0,30);if(P.bless<=0)this.pop('BLESSING FADES',P.x,P.y-24,0xb8b4d8)}
  if(P.stDelay<=0)P.st=Math.min(P.stMax,P.st+TUNE.regen*dt*(this.buffs&&this.buffs.stam>0?2:1));P.fp=Math.min(P.fpMax,P.fp+2*dt);
  P.coy=on?.1:P.coy-dt;P.buf=inp.jumpP?.12:P.buf-dt;P.atkBuf=inp.atkP?.2:P.atkBuf-dt;
  const dir=(inp.r?1:0)-(inp.l?1:0);
  if(this.explore(dt,inp,dir,on)){P.wasOn=on;P.lastVy=body.velocity.y;if(P.hp<=0&&!P.dead)this.die();return}
  const busy=['roll','rollrec','atk','cast','hurt','rest','drink','parry'].includes(P.state);
  if(!busy){if(dir&&P.wallLock<=0)P.f=dir;const tv=dir*(this.build.roll.kind==='OVERLOADED'?55:100),acc=on?(dir?900:1300):600;const vx=body.velocity.x;if(P.wallLock<=0)b.setVelocityX(vx+clamp(tv-vx,-acc*dt,acc*dt));
   if(P.buf>0&&on&&inp.dn&&this.onOneway()){P.dropT=.25;P.buf=0;P.coy=0}
   if(P.buf>0&&P.coy>0){b.setVelocityY(-280);P.buf=0;P.coy=0;this.fx.dust(P.x,P.y,5);this.sfx('jump',.25)}
   if(!inp.jump&&body.velocity.y<-80)b.setVelocityY(body.velocity.y*.55);
   if(body.velocity.y>0)body.velocity.y+=500*dt;
   if(on&&dir&&Math.abs(body.velocity.x)>60){P.run+=dt*12;if(Math.random()<.08)this.fx.dust(P.x-P.f*3,P.y,1,-P.f)}
   P.state=on?(Math.abs(body.velocity.x)>8?'run':'idle'):(body.velocity.y<0?'jump':'fall');
   if(!P.wasOn&&on&&P.lastVy>160){this.fx.dust(P.x,P.y,8);P.land=.12}
   if(!on){const wl=body.blocked.left,wr=body.blocked.right;if(wl||wr){P.wall=wl?-1:1;P.wallC=.12;if((wl&&dir<0)||(wr&&dir>0)){if(body.velocity.y>40)b.setVelocityY(40);P.state='wall';P.f=P.wall;if(Math.random()<.3)this.fx.dust(P.x+P.wall*3,P.y-6,1)}}
    if(P.buf>0&&P.wallC>0&&P.coy<=0){b.setVelocity(-P.wall*140,-265);P.f=-P.wall;P.wallLock=.16;P.buf=0;P.wallC=0;this.stats.wallJumps=(this.stats.wallJumps||0)+1;this.fx.dust(P.x+P.wall*3,P.y-6,6,-P.wall);this.sfx('jump',.25)}}
   if(inp.rollP&&on){const rb=this.rb();if(rb.kind==='OVERLOADED'){this.pop('TOO HEAVY TO ROLL',P.x,P.y-24,0xd8402a)}else if(this.canAct()){P.state='roll';P.t=0;this.spend(rb.cost);b.setVelocityX(P.f*rb.v);this.fx.dust(P.x,P.y,rb.kind==='HEAVY'?10:6,-P.f);this.sfx('roll',.3);if(rb.kind==='HEAVY')this.cam.shake(60,.004)}}
   else if(P.atkBuf>0||inp.heavyP){const hv=!!inp.heavyP&&!(P.atkBuf>0);if(this.canAct())this.startAtk(hv,0,on);P.atkBuf=0}
   else if(inp.parryP){if(this.canAct()){P.state='parry';P.t=0;this.spend(TUNE.parryCost);b.setVelocityX(0);this.sfx('roll',.15)}}
   else if((inp.iceP||inp.boltP||inp.domeP)&&!this.canCast(inp.iceP?'ice':inp.boltP?'bolt':'dome')){}
   else if(inp.healP||inp.lspearP||inp.blessP||inp.mirP){const k=inp.healP?'heal':inp.lspearP?'lspear':inp.blessP?'blessed':this.touchMir();if(k&&this.canMir(k)){P.state='cast';P.spell=k;P.t=0;P.fp-=MIRACLES[k].fp;b.setVelocityX(0);this.sfx('charge',.25);this.stats.miracles=(this.stats.miracles||0)+1}}
   else if(inp.flaskP){if(P.flasks>0){P.state='drink';P.t=0;P.flasks--;P.healLeft=this.build.heal;this.stats.flasks++;b.setVelocityX(body.velocity.x*.3);this.sfx('bonfire',.25)}else{P.flaskFlash=.6;this.pop('NO FLASKS',P.x,P.y-24,0xd8402a)}}
   else if(inp.iceP&&P.fp>=15){P.state='cast';P.spell='ice';P.t=0;P.fp-=15;b.setVelocityX(0);this.sfx('charge',.25)}
   else if(inp.boltP&&P.fp>=20){P.state='cast';P.spell='bolt';P.t=0;P.fp-=20;b.setVelocityX(0);this.sfx('charge',.25)}
   else if(inp.domeP&&P.fp>=TUNE.domeCost){P.state='cast';P.spell='dome';P.t=0;P.fp-=TUNE.domeCost;b.setVelocityX(0);this.sfx('charge',.3)}
   else if(inp.restP&&on&&Math.abs(P.x-this.bonfire.x)<TUNE.restR){P.state='rest';P.t=0;b.setVelocityX(0);this.rest()}}
  else if(P.state==='roll'){if(Math.random()<.4)this.fx.dust(P.x,P.y,1,-P.f);if(Math.random()<.6)this.fx.ember(P.x-P.f*3,P.y-4,1,.4);
   if(P.t>this.rb().t){P.state='rollrec';P.t=0;b.setVelocityX(P.f*40)}}
  else if(P.state==='rollrec'){b.setVelocityX(body.velocity.x*.8);if(P.t>TUNE.rollRec)P.state='idle'}
  else if(P.state==='atk'){const m=this.move();if(m.lunge>100&&P.t<m.h1)b.setVelocityX(P.f*m.lunge*(1-P.t/m.h1*.5));else b.setVelocityX(body.velocity.x*.85);
   if(P.t>m.h0&&P.t<m.h1+.02&&!P.hitDone){if(m.arrow)this.shootArrow(m);else this.meleeHit(m)}
   if(P.heavy&&!P.spDone&&P.t>m.h0&&this.wp&&this.wp.special){P.spDone=1;this.weaponSpecial(this.wp)}
   if(m.shock&&P.t>m.h0&&!P.shockDone&&on){P.shockDone=true;this.cam.shake(220,.016);this.fx.dust(P.x-14,P.y,10,-1);this.fx.dust(P.x+14,P.y,10,1);this.fx.spark(P.x,P.y-2,14,C.f1,140)}
   if(P.t<.05)P.shockDone=false;
   if(!P.heavy&&P.t>Math.min(.2,m.t*.6)&&P.atkBuf>0&&P.combo<(m.n||1)-1&&this.canAct()){this.startAtk(false,P.combo+1,on);P.atkBuf=0;if(dir)P.f=dir}
   else if(P.t>m.t)P.state='idle'}
  else if(P.state==='parry'){if(P.t<TUNE.parryWin&&Math.random()<.5)this.fx.star(P.x+P.f*8,P.y-12,C.f0);if(P.t>TUNE.parryT)P.state='idle'}
  else if(P.state==='drink'){b.setVelocityX(body.velocity.x*.8);const h=Math.min(P.healLeft,TUNE.flaskHeal/TUNE.flaskT*dt);P.hp=Math.min(P.hpMax,P.hp+h);P.healLeft-=h;
   if(Math.random()<.5)this.fx.fire(P.x+rnd(-4,4),P.y-rnd(2,14),1,1,.5);if(P.t>TUNE.flaskT){P.state='idle';P.healLeft=0}}
  else if(P.state==='cast'){if(Math.random()<.6){const hx=P.x+P.f*7,hy=P.y-14;MIRACLES[P.spell]?this.fx.spark(hx,hy-2,1,0xffe8a0,40):P.spell==='bolt'?this.fx.spark(hx,hy,1,C.bolt,40):this.fx.star(hx+rnd(-3,3),hy+rnd(-3,3))}
   if(P.t>.22&&!P.castDone){P.castDone=true;MIRACLES[P.spell]?this.castMiracle(P.spell):P.spell==='ice'?this.castIce(P.x+P.f*16,P.f,'p',P.y):P.spell==='dome'?this.castDome(P.x,'p',0,P.y):this.castBolt()}if(P.t>.42){P.state='idle';P.castDone=false}}
  else if(P.state==='hurt'){if(P.t>.3)P.state='idle'}
  else if(P.state==='rest'){if(P.t>1.4)P.state='idle'}
  P.wasOn=on;P.lastVy=body.velocity.y;
  if(P.hp<=0&&!P.dead)this.die()}
 hurtPlayer(n,src,att){if(this._inE&&this._eRemote)return false;// co-op: the guest takes its own damage from the host's enemy state
  const P=this.player;if(P.dead||this.cine||this.victory)return false;
  if(att&&P.state==='parry'&&P.t<TUNE.parryWin&&(Math.sign(src-P.x)||P.f)===P.f){this.parried(att);return false}
  if(P.inv>0)return false;
  {const rb=this.rb();if(P.state==='roll'&&P.t>=rb.i0&&P.t<rb.i1){this.stats.dodged++;return false}}
  P.hp-=Math.round(n*(1+.3*this.ng)*(1-Math.min(.85,this.build.abs+(this.buffs&&this.buffs.guard>0?.25:0))));P.inv=.8;P.flash=.12;P.healLeft=0;P.poiseT=2.5;
  {const hyper=P.state==='atk'&&P.heavy&&(this.move().poise||0)>=2,pz=P.poiseHP*(hyper?2:1);if(pz>n*.5&&P.hp>0){P.poiseHP-=n*.5;this.stats.poised=(this.stats.poised||0)+1;this.pop(hyper?'HYPER ARMOR':'POISE',P.x,P.y-24,0x9fb8e8);this.cam.shake(90,.008);this.fx.spark(P.x,P.y-8,8,0xd8d0ee,90);this.sfx('hit',.35);return true}}
  P.poiseHP=this.build.poise;P.state='hurt';P.t=0;
  const d=Math.sign(P.x-src)||1;this.pb.setVelocity(d*120,-140);this.cam.shake(120,.012);this.fx.spark(P.x,P.y-8,10,C.f2,110);this.sfx('hit',.4);this.hitstop(.06);return true}
 parried(att){const P=this.player;this.stats.parries++;const B=att==='boss'?this.boss:null;
  if(B){B.state='stag';B.t=0}else{att.state='stag';att.t=0;att.b.setVelocityX(0)}
  const x=P.x+P.f*9,y=P.y-11;this.fx.spark(x,y,18,0xffffff,150);this.fx.spark(x,y,10,C.f1,110);this.novas.push({x,y,t:0,m:.3,parry:1});this.flashF=2;
  this.sfx('parry',.6);this.hitstop(.1);this.cam.shake(120,.01);this.pop('PARRY',x,y-10);P.inv=.3;P.pflash=4;P.state='idle';P.t=0}// successful parry cancels recovery so the riposte can follow
 hitstop(s){this.hs=s;this.physics.pause()}
 meleeHit(m){m=m||this.move();const P=this.player,ar=this.build.ar*(P.bless>0?P.blessMul:1)*(m.mul||1)*(P.heavy?1:[1,1,1.3][P.combo]||1),hw=(m.w||22)/2,hh=(m.h||18)/2,crit=this.wp.crit||1;const hx=P.x+P.f*(m.reach??12),hy=P.y-8;let any=false,rip=false;
  const hit=(x,y,w,h)=>Math.abs(x-hx)<w/2+hw&&Math.abs(y-hy)<h/2+hh;
  for(const e of this.enemies){if(e.dead)continue;const bb=e.b.body;if(!hit(bb.center.x,bb.center.y,bb.width,bb.height))continue;any=true;
   const dirE=m.aoe?(Math.sign(e.b.x-P.x)||P.f):P.f;
   if(e.state==='stag'){this.damageEnemy(e,TUNE.ripMul*ar*crit,dirE);rip=true;if(!e.dead)e.state='chase'}
   else if(e.base==='knight'&&(Math.sign(P.x-e.b.x)||1)===e.f){e.guard-=P.heavy?3:1;this.fx.spark(e.b.x+e.f*6,e.b.y-2,10,0xffffff,120);this.sfx('parry',.2);this.pop('BLOCK',e.b.x,e.b.y-16,0x9fb8e8);e.b.setVelocityX(-e.f*40);
    if(e.guard<=0){e.state='stag';e.t=0;e.guard=3;this.pop('GUARD BROKEN',e.b.x,e.b.y-24)}}
   else{this.damageEnemy(e,ar,dirE);if(P.heavy&&(m.poise||0)>=2&&!e.dead&&e.base!=='wraith'){e.state='stag';e.t=0;this.pop('STAGGER',e.b.x,e.b.y-20,0xffb04a)}}}
  for(const k of this.breakables){if(k.hp<=0)continue;const r=k.r;if(hx+hw>r[0]&&hx-hw<r[2]&&hy+hh>r[1]&&hy-hh<r[3]){any=true;this.hitBreakable(k);if(P.heavy&&k.hp>0)this.hitBreakable(k)}}
  for(const b of this.bells){if(Math.abs(b.x-hx)<hw+4&&Math.abs(b.y-20-hy)<hh+8){any=true;this.ringBell(b)}}
  for(const c of this.chests){if(c.st==='shut'&&Math.abs(c.x-hx)<hw+4&&Math.abs(c.y-5-hy)<hh+6){any=true;this.openChest(c)}else if(c.st==='awake'&&Math.abs(c.hx-hx)<hw+6&&Math.abs(c.y-6-hy)<hh+8){any=true;this.hitMimic(c,ar)}}
  for(const c of this.cages){if(c.freed)continue;if(Math.abs(c.x-hx)<hw+3&&Math.abs(c.y-8-hy)<hh+5){any=true;if(c.locked){this.pop('SEALED',c.x,c.y-22,0x9fb8e8);this.fx.spark(c.x,c.y-8,8,0x9fb8e8,90)}else this.freeCage(c)}}
  const B=this.boss;if(B&&this.bossState==='fight'&&hit(B.x,B.y-16,18,32)){if(B.state==='stag'){this.damageBoss(1.5*TUNE.ripMul*ar*crit);rip=true;B.state='walk';B.cd=1}else this.damageBoss(1.5*ar);any=true}
  if(rip){this.stats.ripostes++;this.pop('RIPOSTE',hx,hy-14,0xffb04a);this.flashF=2;this.fx.spark(hx,hy,24,C.f1,180,20)}
  if(any){P.hitDone=true;this.hitstop(rip?.14:.055);this.cam.shake(rip?200:70,rip?.016:.006)}}
 damageEnemy(e,n,dir,fromNet){if(NET.guest()&&!fromNet){e.flash=.1;this.fx.spark(e.b.x,e.b.y,10,0xffd04a,120,20);this.sfx('hit',.3);NET.send({t:'dmg',i:this.enemies.indexOf(e),n,dir});return}e.hp-=n;e.flash=.1;this.fx.spark(e.b.x,e.b.y,10,0xffd04a,120,20);this.sfx('hit',.3);if(e.base!=='wraith')e.b.setVelocity(dir*90,-60);else e.b.x+=dir*6;
  if(e.hp<=0&&!e.dead){e.dead=true;e.deadT=0;e.b.body.enable=false;this.fx.soul(e.b.x,e.b.y,8);this.gainSouls(e.souls);this.rollDrop(ETABLE[e.k]||'common',e.b.x,e.b.body.bottom);this.fx.dust(e.b.x,e.b.body.bottom,10);
   if(e.base==='imp')this.explode(e.b.x,e.b.y,false)}}
 explode(x,y,hurts){this.fx.fire(x,y,30,6,1.4);this.fx.spark(x,y,16,C.f1,150);this.fx.ember(x,y,10,2);this.novas.push({x,y,t:0,m:.25,fire:1});this.cam.shake(140,.01);
  if(hurts&&Math.hypot(this.player.x-x,this.player.y-8-y)<22)this.hurtPlayer(18,x)}
 die(){const P=this.player;P.dead=true;P.deadT=0;this.fx.ember(P.x,P.y-8,30,2);this.sfx('death',.5);this.say('EMBER EXTINGUISHED',2.4);
  // DS rule: the old stain is lost; a new one holds what you carried
  this.stain=this.souls>0?{x:Math.round(clamp(P.x,20,WORLD-20)),y:this.lv.floorAt(P.x,P.y-10),souls:this.souls}:null;this.souls=0;
  this.sv.deaths++;this.sv.stain=this.stain;this.sv.souls=0;this.sv.time=this.playT;Save.write(this.sv)}
 respawn(){this.scene.restart({fresh:false})}
 rest(){const P=this.player;P.hp=P.hpMax;P.fp=P.fpMax;P.st=P.stMax;P.flasks=TUNE.flaskN+(this.sv.flaskBonus||0);const first=!this.bonfire.lit;this.bonfire.lit=true;this.fx.ember(this.bonfire.x,GY-8,40,2.2);this.fx.spark(this.bonfire.x,GY-6,16,C.f1,90,40);
  this.sfx('bonfire',.5);this.say(first?'BONFIRE LIT - '+this.def.bonfireName:'RESTED. FLASKS REFILLED',2.4);
  this.enemies.forEach(e=>{if(e.dead&&!e.temp&&Math.abs(e.x0-P.x)>200){e.dead=false;e.hp=EHP[e.k]*this.ngMul;e.state='idle';e.guard=3;e.b.body.enable=true;e.b.setPosition(e.x0,e.base==='wraith'?e.gy-40:e.gy-20)}});
  Object.assign(this.sv,{bonfire:true,souls:this.souls,bossDown:this.bossState==='dead',time:this.playT});Save.write(this.sv);
  this.menu={mode:'main',sel:0,t:0,prev:{}}}
 // ---------------- bonfire menu: LEVEL UP / EQUIPMENT (milestone D) ----------------
 menuInput(inp){const M=this.menu,pv=M.prev,e=k=>inp[k]&&!pv[k];M.prev={up:inp.up,dn:inp.dn,l:inp.l,r:inp.r};
  // r6: the key that opened the menu (Up at the keeper / bonfire) is ignored for the first 0.15 s
  if(M.t<.15)return;
  if(e('up'))this.menuKey('up');else if(e('dn'))this.menuKey('down');else if(e('l'))this.menuKey('left');else if(e('r'))this.menuKey('right');
  else if((inp.jumpP||inp.atkP||inp.restP&&M.t>.3)&&!(M.kOk&&this.time.now-M.kOk<250))this.menuKey('ok');else if(inp.rollP)this.menuKey('back')}
 eqOpts(row){const inv=this.sv.inv;if(row===0)return inv.filter(i=>WEAPONS[i]&&WEAPONS[i].hand==='main');if(row===1)return[null,...inv.filter(i=>WEAPONS[i]&&WEAPONS[i].hand==='off')];return['none',...inv.filter(i=>ARMORS[i]&&i!=='none')]}
 menuKey(k){const M=this.menu;if(!M)return;const sv=this.sv;this.sfx('menu',.2);
  if(M.mode==='main'){const O=this.mainOpts(),n=O.length;if(k==='up')M.sel=(M.sel+n-1)%n;else if(k==='down')M.sel=(M.sel+1)%n;else if(k==='ok'){const o=O[M.sel];if(o==='LEVEL UP'){M.mode='level';M.sel=0;M.pend={...sv.stats};M.spent=0}else if(o==='EQUIPMENT'){M.mode='equip';M.sel=0}else if(o==='ITEMS AND SPELLS'){M.mode='items';M.sel=0}else if(o==='TRAVEL TO THE SHRINE'&&NET.guest()){this.menu=null;this.pop('THE HOST LEADS THE WAY',this.player.x,this.player.y-26,0x9ff0dc)}else if(o==='TRAVEL TO THE SHRINE')this.travel('shrine',{next:this.sid,bonfire:true});else this.menu=null}else this.menu=null;return}
  if(M.mode==='items'){const L=this.itemList(),n=L.length;if(k==='up')M.sel=(M.sel+n-1)%n;else if(k==='down')M.sel=(M.sel+1)%n;else if(k==='ok'||k==='back'){M.mode='main';M.sel=2}return}
  if(M.mode==='keeper'){if(k==='up')M.sel=(M.sel+2)%3;else if(k==='down')M.sel=(M.sel+1)%3;else if(k==='ok'){if(M.sel===0){M.mode='talk';M.page=0;M.t=0;sv.met=1;this.sfx('talk',.3)}else if(M.sel===1){M.mode='shop';M.sel=0;M.say=KEEPER.shop}else{this.menu=null;this.pop(KEEPER.bye,this.def.keeper,GY-34,0xd8c8b0)}}else if(k==='back')this.menu=null;return}
  if(M.mode==='talk'){const L=this.keeperLines();if(k==='ok'||k==='back'){if(M.t*45<L[M.page].length&&k==='ok'){M.t=99;return}M.page++;M.t=0;this.sfx('talk',.3);if(M.page>=L.length||k==='back'){sv.heard=Math.max(sv.heard||0,this.keeperTier()+1);Save.write(sv);M.mode='keeper';M.sel=1}}return}
  if(M.mode==='shop'){const L=this.shopList(),n=L.length+1;if(k==='up')M.sel=(M.sel+n-1)%n;else if(k==='down')M.sel=(M.sel+1)%n;else if(k==='back'||(k==='ok'&&M.sel===L.length)){M.mode='keeper';M.sel=1}
   else if(k==='ok'){const[id,price]=L[M.sel];if(this.souls<price){M.say='YOU LACK THE SOULS, ASHEN ONE.';this.sfx('clang',.2)}else{this.souls-=price;sv.souls=this.souls;if(id==='flask'){sv.flaskBonus=(sv.flaskBonus||0)+1}else sv.inv.push(id);sv.bought=(sv.bought||0)+1;Save.write(sv);M.say='A FINE CHOICE. '+itemName(id)+' IS YOURS.';this.sfx('pickup',.45);this.fx.ember(this.player.x,this.player.y-8,16,1.4);M.sel=Math.min(M.sel,this.shopList().length)}}return}
  if(M.mode==='level'){const L=RPG.level(sv.cls,M.pend);
   if(k==='up')M.sel=(M.sel+8)%9;else if(k==='down')M.sel=(M.sel+1)%9;
   else if(k==='right'&&M.sel<8){const st=STATS[M.sel],c=RPG.cost(L);if(this.souls-M.spent>=c&&M.pend[st]<99){M.pend[st]++;M.spent+=c}else this.pop('NOT ENOUGH SOULS',this.player.x,this.player.y-30,0xd8402a)}
   else if(k==='left'&&M.sel<8){const st=STATS[M.sel];if(M.pend[st]>sv.stats[st]){M.pend[st]--;M.spent-=RPG.cost(L-1)}}
   else if(k==='ok'){if(M.spent>0){this.souls-=M.spent;sv.stats={...M.pend};sv.souls=this.souls;this.applyBuild(true);Save.write(sv);this.sfx('fanfare',.4);this.fx.ember(this.player.x,this.player.y-8,30,2);this.say('LEVEL '+this.lvl,1.8);this.stats.levelUps=(this.stats.levelUps||0)+1}M.mode='main';M.sel=0}
   else if(k==='back'){M.mode='main';M.sel=0}return}
  if(M.mode==='equip'){if(k==='up')M.sel=(M.sel+2)%3;else if(k==='down')M.sel=(M.sel+1)%3;
   else if(k==='left'||k==='right'){const o=this.eqOpts(M.sel),key=['main','off','armor'][M.sel],i=o.indexOf(sv.eq[key]);sv.eq[key]=o[(i+(k==='right'?1:o.length-1))%o.length];this.applyBuild(false);Save.write(sv)}
   else{M.mode='main';M.sel=1}}}
 updatePickups(){const P=this.player;for(let i=this.items.length-1;i>=0;i--){const it=this.items[i];if(Math.abs(P.x-it.x)<10&&Math.abs(P.y-it.y)<20&&!P.dead){
   if(NET.guest()){if(!it.req){it.req=1;NET.send({t:'pick',id:it.id});setTimeout(()=>it.req=0,800)}continue}this.takeItem(it);if(NET.host())NET.send({t:'picked',id:it.id,item:it.item})}}}
 // loot: both players receive a picked item (host decides who touched it first)
 takeItem(it){const i=this.items.indexOf(it);if(i>=0)this.items.splice(i,1);
   if(!this.sv.inv.includes(it.item))this.sv.inv.push(it.item);this.sv.picked.push(it.id);Save.write(this.sv);const nm=itemName(it.item);this.pop('GOT '+nm,it.x,it.y-28,0xffe2a8);this.say(nm+' - EQUIP AT A BONFIRE',2.2);this.sfx('pickup',.45);this.fx.spark(it.x,it.y-6,14,C.f1,90)}
 // ---------------- milestone G: bells, chests, mimics, loot drops, signature weapons ----------------
 ringBell(b,fromNet){b.sw=1;this.sfx('bell',.35);this.fx.shard(b.x,b.y-20,6,80);if(b.rung)return;
  if(NET.guest()&&!fromNet){if(!b.req){b.req=1;NET.send({t:'bell',id:b.id});setTimeout(()=>b.req=0,800)}return}
  b.rung=true;if(!this.sv.bells.includes(b.id))this.sv.bells.push(b.id);const n=this.bells.filter(q=>q.rung).length;this.pop('BELL '+n+'/'+this.bells.length,b.x,b.y-36,0xd8f2ff);this.fx.ember(b.x,b.y-20,12,1.2);if(!NET.guest())this.gainSouls(100);
  if(n===this.bells.length&&this.def.bellLock&&!this.sv.chDone.includes(this.def.bellLock)){this.sv.chDone.push(this.def.bellLock);for(const c of this.cages)if(c.lock===this.def.bellLock){c.locked=false;this.fx.spark(c.x,c.y-8,16,0xd8f2ff,120)}this.say('THE FROZEN BELLS ANSWER - A SEAL BREAKS',2.5);this.sfx('fanfare',.4)}
  Save.write(this.sv)}
 openChest(c,fromNet){if(c.st!=='shut')return;if(NET.guest()&&!fromNet){if(!c.req){c.req=1;NET.send({t:'chest',id:c.id});setTimeout(()=>c.req=0,800)}return}
  c.open=true;if(!this.sv.chests.includes(c.id))this.sv.chests.push(c.id);Save.write(this.sv);c.t=0;
  if(c.mimic){c.st='awake';c.cd=.8;this.say('THE CHEST HAS TEETH',1.6);this.sfx('slam',.4);this.cam.shake(160,.012);this.fx.spark(c.x,c.y-6,12,0xd84a3a,110)}
  else{c.st='open';this.sfx('chime',.4);this.fx.spark(c.x,c.y-6,14,C.f1,100);this.rollDrop('chest',c.x,c.y,2);this.rollDrop('chest',c.x,c.y,2);if(!NET.guest())this.gainSouls(120)}}
 hitMimic(c,ar,fromNet){if(NET.guest()&&!fromNet){c.flash=.1;this.sfx('hit',.3);NET.send({t:'mhit',id:c.id,n:ar});return}
  c.hp-=ar;c.flash=.1;this.fx.spark(c.hx,c.y-6,10,0xffd04a,120);this.sfx('hit',.35);c.hx+=this.player.f*4;
  if(c.hp<=0&&c.st==='awake'){c.st='dead';this.fx.soul(c.hx,c.y-6,14);this.gainSouls(300*(1+this.ng));this.rollDrop('mimic',c.hx,c.y,1);this.rollDrop('chest',c.hx,c.y,1);this.say('MIMIC SLAIN',1.4)}}
 updateMimics(dt){for(const c of this.chests){if(c.st!=='awake')continue;c.t+=dt;c.flash=(c.flash||0)-dt;const P=NET.target(this,{b:{x:c.hx,y:c.y}}),dx=P.x-c.hx;c.f=Math.sign(dx)||1;c.cd-=dt;
   if(c.cd<0&&!c.hop){c.hop=1;c.ht=0;c.cd=1.1}
   if(c.hop){c.ht+=dt;c.hx+=c.f*70*dt;c.jy=-Math.sin(Math.min(1,c.ht/.45)*Math.PI)*14;if(c.ht>.45){c.hop=0;c.jy=0;this.fx.dust(c.hx,c.y,6)}
    if(Math.abs(dx)<12&&Math.abs(P.y-c.y)<20&&!P.remote&&!c.bit){c.bit=1;c.bites=(c.bites||0)+1;this.hurtPlayer(18,c.hx)}}else c.bit=0}}
 rollDrop(table,x,y,force){if(NET.guest())return;const k=force===1?'gear':rollTable(table);
  if(k==='none')return;let item=null;if(k==='gear'){const own=this.sv.inv,pool=GEAR_POOL.filter(i=>!own.includes(i));item=pool.length?pool[Math.floor(Math.random()*pool.length)]:null;if(!item){this.spawnDrop('soulshard',null,x,y);return}}
  this.spawnDrop(k==='gear'?'gear':k,item,x,y)}
 spawnDrop(kind,item,x,y){const d={id:'d'+(++this.dropN)+'_'+Math.floor(Math.random()*1e4),kind,item,x,y:y-4,vy:-110,vx:rnd(-40,40),t:0};this.drops.push(d);if(NET.host())NET.send({t:'drop',d});return d}
 updateLoot(dt){const P=this.player;for(const k in this.buffs)this.buffs[k]=Math.max(0,this.buffs[k]-dt);
  for(const b of this.bells)b.sw=Math.max(0,b.sw-dt*.8);
  for(const c of this.chests)if(c.st!=='shut')c.lid=Math.min(1,(c.lid||0)+dt*3);
  if(!NET.guest())this.updateMimics(dt);
  for(let i=this.drops.length-1;i>=0;i--){const d=this.drops[i];d.t+=dt;if(!d.rest){d.vy+=420*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;const fy=this.lv?this.lv.floorAt(d.x,d.y-6):GY;if(d.vy>0&&d.y>=fy){d.y=fy;d.rest=1}}
   if(d.t>.35&&!P.dead&&Math.abs(P.x-d.x)<10&&Math.abs(P.y-d.y)<20){if(NET.guest()){if(!d.req){d.req=1;NET.send({t:'dpick',id:d.id});setTimeout(()=>d.req=0,800)}}else{this.drops.splice(i,1);this.takeDrop(d);if(NET.host())NET.send({t:'dgone',id:d.id,gear:d.kind==='gear'?d.item:null})}}}}
 // what a drop does for whoever picked it up (pickup burst drawn per kind)
 takeDrop(d){const P=this.player,sv=this.sv;let nm,col;
  if(d.kind==='gear'){nm=(WEAPONS[d.item]||ARMORS[d.item]).name;col=0xffe2a8;if(!sv.inv.includes(d.item))sv.inv.push(d.item);this.say(nm+' - EQUIP AT A BONFIRE',2);this.sfx('pickup',.45);this.fx.spark(d.x,d.y-6,18,C.f1,110)}
  else{const L=CONSUMABLES[d.kind];nm=L.name;col=L.col;this.sfx(L.fx==='souls'?'souls':'heal',.35);
   if(L.hp){P.hp=Math.min(P.hpMax,P.hp+L.hp);this.fx.ember(P.x,P.y-8,14,1.4)}if(L.fp){P.fp=Math.min(P.fpMax,P.fp+L.fp);this.fx.shard(P.x,P.y-10,10,90)}
   if(L.souls)this.gainSouls(L.souls,1);if(L.guard)this.buffs.guard=L.guard;if(L.stam)this.buffs.stam=L.stam;
   this.burst={x:d.x,y:d.y-6,t:0,col,k:L.fx}}
  sv.looted=(sv.looted||0)+1;Save.write(sv);this.pop(nm,d.x,d.y-24,col)}
 awardSignature(kind,x){const w=SIGNATURE[kind];if(!w)return;const sv=this.sv,had=sv.inv.includes(w);if(!had)sv.inv.push(w);Save.write(sv);
  this.time.delayedCall(700,()=>{this.pop((had?'':'GOT ')+WEAPONS[w].name,x,GY-50,0xffe2a8);this.burst={x,y:GY-20,t:0,col:0xffe2a8,k:'sig'};this.sfx('fanfare',.4);this.fx.spark(x,GY-20,24,C.f1,130)})}
 // lord weapons: the heavy attack triggers the weapon's special (costs FP)
 weaponSpecial(wp){const P=this.player,sp=wp.special,f=P.f,dmg=this.build.ar*.9;if(P.fp<(wp.spFp||8)){this.pop('NO FP',P.x,P.y-24,0x6ab8ff);return}P.fp-=wp.spFp||8;this.stats.specials=(this.stats.specials||0)+1;
  const hitR=(x,y,R,n)=>{for(const e of this.enemies)if(!e.dead&&Math.abs(e.b.x-x)<R&&Math.abs(e.b.y-y)<R)this.damageEnemy(e,n,Math.sign(e.b.x-P.x)||f);const B=this.boss;if(B&&this.bossState==='fight'&&Math.abs(B.x-x)<R+8&&Math.abs(B.y-16-y)<R+16)this.damageBoss(n);
   for(const c of this.chests)if(c.st==='awake'&&Math.abs(c.hx-x)<R)this.hitMimic(c,n)};
  if(sp==='frost'){this.castIce(P.x+f*16,f,'p');this.sfx('bonfire',.3)}
  else if(sp==='hymn'){for(let i=0;i<8;i++){const a=i/8*6.283;this.fx.star(P.x+Math.cos(a)*30,P.y-10+Math.sin(a)*20,0xb8a8ff)}this.novas.push({x:P.x,y:P.y-10,t:0,m:.5,parry:1});hitR(P.x,P.y-10,44,dmg);this.sfx('parry',.35)}
  else if(sp==='cinder'){for(let i=1;i<=4;i++)this.time.delayedCall(i*90,()=>{const x=P.x+f*(10+i*20);this.fx.fire(x,GY-2,8,4,1.4);this.light(x,GY-8,30,C.f2,.8);hitR(x,P.y-6,14,dmg*.6)});this.cam.shake(200,.014);this.sfx('slam',.4)}
  else if(sp==='toll'){this.novas.push({dome:1,owner:'p',harmless:1,x:P.x,y:P.y,R:70,grow:.35,t:0,m:.8});hitR(P.x,P.y-8,64,dmg*.8);for(const e of this.enemies)if(!e.dead&&Math.abs(e.b.x-P.x)<64){e.state='stag';e.t=0}this.cam.shake(260,.016);this.sfx('bell',.55)}}
 drawLoot(g,ga){const t=this.t;
  for(const b of this.bells){const x=Math.round(b.x),top=b.y-34,sw=Math.sin(t*9)*b.sw*3,bx=Math.round(x+sw),by=b.y-26;// rope from above, bell body, clapper
   g.fillStyle(0x6a5a48);g.fillRect(x,top-40,1,40+(by-top-10));const body=b.rung?0xc89a4a:0x9fc8f0,hl=b.rung?0xffe2a8:0xffffff,dk=b.rung?0x6a4a1a:0x4a6a98;
   for(let i=0;i<10;i++){const w=Math.round(2+i*.45);g.fillStyle(i===0?hl:body);g.fillRect(bx-w,by+i,2*w+1,1);px(g,bx+w,by+i,dk)}g.fillStyle(dk);g.fillRect(bx-7,by+10,15,1);px(g,bx-1,by+11+Math.round(sw*.5),dk);
   if(!b.rung){for(let i=0;i<3;i++)px(g,bx-3+i*3,by+11+(i%2),0xd8f2ff);glow(ga,bx,by+5,8,0x9fd8ff,.12)}else{glow(ga,bx,by+5,10+b.sw*8,C.f2,.18);this.light(bx,by+5,30,C.f2,.4)}}
  for(const c of this.chests){if(c.st==='dead')continue;const x=Math.round(c.st==='awake'?c.hx:c.x),y=Math.round(c.y+(c.jy||0)),fl=c.flash>0;
   const wood=fl?0xffffff:c.mimic&&c.st==='awake'?0x6a2a20:0x6a4a2a,band=0xc8a050,dk=0x2a1a0e;g.fillStyle(dk);g.fillRect(x-8,y-9,17,9);g.fillStyle(wood);g.fillRect(x-7,y-8,15,7);g.fillStyle(band);g.fillRect(x-7,y-5,15,1);g.fillRect(x-1,y-6,3,3);
   const lidUp=Math.round((c.lid||0)*(c.st==='awake'?5+Math.abs(Math.sin(t*10))*3:6));g.fillStyle(dk);g.fillRect(x-8,y-12-lidUp,17,3);g.fillStyle(wood);g.fillRect(x-7,y-11-lidUp,15,2);
   if(c.st==='awake'){g.fillStyle(0x1a0806);g.fillRect(x-7,y-9-lidUp,15,lidUp+1);for(let i=-6;i<=6;i+=3){px(g,x+i,y-9-lidUp,0xe8e0d0);px(g,x+i+1,y-8,0xe8e0d0)}px(g,x-3,y-10-lidUp,0xff4a3a);px(g,x+3,y-10-lidUp,0xff4a3a);glow(ga,x,y-8,10,0xd84a3a,.12)}
   else if(c.st==='open'){glow(ga,x,y-10,8,C.f1,.12)}else if(Math.floor(t*2+c.x)%5===0)px(ga,x+1,y-5,0xfff0c0,.8)}
  for(const d of this.drops){const x=Math.round(d.x),y=Math.round(d.y)-3+Math.round(Math.sin(t*4+d.x)*(d.rest?1:0));
   if(d.kind==='gear'){g.fillStyle(0x07050f);g.fillRect(x-3,y-4,7,7);g.fillStyle(0xffe2a8);g.fillRect(x-2,y-3,5,5);px(g,x,y-5,0xffffff);glow(ga,x,y,8+Math.sin(t*6),C.f1,.25);if(Math.random()<.04)this.fx.ember(x,y-3,1,.5)}
   else{const L=CONSUMABLES[d.kind];g.fillStyle(0x07050f);g.fillRect(x-2,y-3,5,5);g.fillStyle(L.col);g.fillRect(x-1,y-2,3,3);px(g,x,y-4,0xffffff);glow(ga,x,y,6,L.col,.22)}}
  const u=this.burst;if(u){u.t+=1/60;const k=u.t/.6,r=6+k*26;for(let i=0;i<16;i++){const a=i/16*6.283+(u.k==='souls'?k*3:0);px(ga,u.x+Math.cos(a)*r,u.y+Math.sin(a)*r*(u.k==='guard'?.5:1),u.col,1-k)}
   if(u.k==='heal'||u.k==='sig')for(let i=0;i<4;i++)px(ga,u.x-6+i*4,u.y-k*20-i*2,u.col,1-k);if(k>=1)this.burst=null}}
 drawBelltowerFX(g,ga,cX,cY){const t=this.t;if(Math.random()<.6)this.fx.snow(cX+rnd(0,W),cY-4);
  // great bells hanging in the dark behind the route, ropes vanishing upward; the arena bell swings with the Toller's tolls
  for(let bx=480;bx<3000;bx+=640){if(bx<cX-60||bx>cX+W+60)continue;const by=-40,sw=Math.sin(t*.8+bx)*2;ga.fillStyle(0x9fc8f0,.05);for(let i=0;i<28;i++){const w=Math.round(4+i*.8);ga.fillRect(Math.round(bx+sw)-w,by+i,2*w,1)}line(ga,bx,by-160,Math.round(bx+sw),by,0x9fc8f0,.06)}
  if(cX>ARENA_L-W){const B=this.boss,s=B&&B.bellSw?Math.sin(t*12)*B.bellSw*6:Math.sin(t*1.2)*1.5;if(B&&B.bellSw)B.bellSw=Math.max(0,B.bellSw-.01);const ax=3170+s,ay=20;
   for(let i=0;i<34;i++){const w=Math.round(6+i*.9);g.fillStyle(i<3?0xd8f2ff:i%9===4?0x6a86b0:0x4a6488);g.fillRect(Math.round(ax)-w,ay+i,2*w+1,1)}line(g,3170,-200,Math.round(ax),ay,0x2e3c58);glow(ga,ax,ay+20,40,0x9fd8ff,.06);this.light(ax,ay+20,70,0x9fd8ff,.3)}
  // icicles along every bell-frame beam
  for(const r of this.def.oneway||[]){if(r[1]>0||r[2]<cX||r[0]>cX+W)continue;for(let x=r[0]+3;x<r[2];x+=7){const l=2+((x*13)%5);g.fillStyle(0xb8d8ff);g.fillRect(x,r[3],1,l);px(g,x,r[3]+l,0xffffff)}}}
 drawToller(g,ga,B){const rise=B.rise===undefined?1:B.rise,f=B.f,t=this.t,p=B.phase||1;const x=Math.round(B.x),y=Math.round(GY-2-(1-rise)*150-Math.sin((B.hov||0)*2)*1.5);const fl=B.flash>0;if(B.flash>0&&this.dt)B.flash--;
  const bell=fl?0xffffff:0x8aa8c8,bd=fl?0xd8f2ff:0x3e5878,hl=0xe8f6ff,robe=fl?0xd8f2ff:0x1e2a40;
  glow(ga,x,y-26,46,0x6a9ad8,.07+p*.03);this.light(x,y-26,64+p*8,0x9fd8ff,.35+p*.08);
  // the Toller: a hooded ringer whose body IS the great bell; the rope it hauls trails up into the dark
  line(g,x,y-90,x,y-44,0x6a5a48);for(let i=0;i<40;i++){const yy=y-42+i,w=Math.round(4+i*.42);g.fillStyle(i<3?hl:bell);g.fillRect(x-w,yy,2*w+1,1);px(g,x+w,yy,bd);px(g,x-w,yy,hl);if(i===14||i===30){g.fillStyle(bd);g.fillRect(x-w,yy,2*w+1,1)}}
  // rime crust + cracks (spread per phase)
  for(let i=0;i<6+p*4;i++){const cx=x-12+((i*17)%25),cy=y-30+((i*11)%26);px(g,cx,cy,0xffffff);if(p>=2)px(g,cx+1,cy+1,0x2a3a58)}
  // hooded face in the bell mouth; eyes burn brighter each phase
  g.fillStyle(robe);g.fillRect(x-7,y-12,15,10);g.fillStyle(0x05070c);g.fillRect(x-4,y-11,9,7);const ec=p>=3?0xff6a8a:0x9fe8ff,ea=(B.eyes===undefined?1:B.eyes);px(ga,x-2+f,y-8,ec,ea);px(ga,x+2+f,y-8,ec,ea);glow(ga,x+f,y-8,6,ec,.2*ea);
  // clapper arms swinging (the hands that ring)
  const wind=B.state==='wind'||B.state==='cast',a=wind?-1.6:B.state==='slam'?1.2:Math.sin(t*2)*.3;const hx=x+f*(10+Math.cos(a)*10),hy=y-20+Math.sin(a)*10;line(g,x+f*8,y-22,Math.round(hx),Math.round(hy),robe);g.fillStyle(bd);g.fillRect(Math.round(hx)-3,Math.round(hy)-3,7,7);g.fillStyle(hl);g.fillRect(Math.round(hx)-2,Math.round(hy)-2,2,2);
  ga.fillStyle(0xd8f2ff,.3);ga.fillRect(x-22,y-1,45,1);if(Math.random()<.3)this.fx.add({k:'snow',x:x+rnd(-16,16),y:y-rnd(10,44),vx:rnd(-6,6),vy:rnd(6,16),l:0,m:rnd(1,2),ph:rnd(0,6)});
  if(B.state==='wind'&&(B.next==='toll'||B.next==='peal')){const k=clamp(B.t/B.wt,0,1);for(let r=0;r<3;r++){const R=10+r*10+k*16;for(let i=0;i<20;i++){const an=i/20*6.283;px(ga,x+Math.cos(an)*R,y-24+Math.sin(an)*R*.6,0x9fd8ff,.2*k)}}}}
 // ---------------- spells ----------------
 castIce(x,f,owner,gy=GY){const V=ICEP;for(let i=0;i<V.n;i++){const sx=Math.round(x+i*V.step*f);if(this.lv&&Math.abs(this.lv.floorAt(sx,gy-6)-gy)>4)break;this.spells.push({k:'spike',gy,x:sx,t:-i*.045,h:lerp(V.hMin,V.hMax,Math.abs(Math.sin(i*2.3+x))),lean:rnd(-.4,.4),owner,hit:false})}this.cam.shake(80,.004)}
 castDome(x,owner,harmless,gy=GY){this.novas.push({dome:1,owner,harmless,x,y:gy,R:TUNE.domeR,grow:.45,t:0,m:1.8});this.cam.shake(160,.008);this.fx.shard(x,gy,20,120)}
 castBolt(){const P=this.player;let tx=P.x+P.f*90,best=null,bd=170;
  const cands=this.enemies.filter(e=>!e.dead).map(e=>({x:e.b.x,e}));if(this.boss&&this.bossState==='fight')cands.push({x:this.boss.x,boss:1});
  for(const c of cands){const d=(c.x-P.x)*P.f;if(d>0&&d<bd){bd=d;best=c}}if(best)tx=best.x;
  this.bolts.push({x:tx,gy:best&&best.e?best.e.b.body.bottom:best&&best.boss?GY:(this.lv?this.lv.floorAt(tx,P.y-10):GY),t:0,pts:null,hit:false,target:best});this.sfx('shot',.4)}
 boltPath(x,gy=GY,top=-4){top=Math.min(top,gy-80);const pts=[[x+rnd(-20,20),top]];let cx=pts[0][0];for(let y=top;y<gy;y+=ri(5,9)){cx+=rnd(-6,6);cx=lerp(cx,x,(y-top+20)/(gy-top+20)*.35);pts.push([cx,y])}pts.push([x,gy]);
  const br=[];for(let k=0;k<2&&pts.length>10;k++){const i=ri(3,pts.length-6);let [bx,by]=pts[i];const seg=[[bx,by]];const dir=Math.random()<.5?-1:1;for(let j=0;j<ri(3,6);j++){bx+=dir*rnd(3,8);by+=rnd(4,9);seg.push([bx,by])}br.push(seg)}return{pts,br}}
 updateSpells(dt){
  for(let i=this.spells.length-1;i>=0;i--){const s=this.spells[i];const was=s.t;s.t+=dt;if(s.t<0)continue;
   if(was<0){this.fx.shard(s.x,s.gy,4,60);this.fx.star(s.x+rnd(-4,4),s.gy-rnd(4,16))}
   if(s.t<.5&&Math.random()<.15)this.fx.star(s.x+rnd(-5,5),s.gy-rnd(2,s.h));
   if(!s.hit&&s.t>.03&&s.t<.3){if(s.owner==='p'){for(const e of this.enemies)if(!e.dead&&Math.abs(e.b.x-s.x)<9&&e.b.body.bottom>s.gy-s.h&&e.b.body.bottom<s.gy+8){this.damageEnemy(e,2*this.spellMul,Math.sign(e.b.x-this.player.x));s.hit=true}
     if(this.boss&&this.bossState==='fight'&&Math.abs(this.boss.x-s.x)<12&&!s.bhit){this.damageBoss(1.2*this.spellMul);s.bhit=true}}
    else if(Math.abs(this.player.x-s.x)<6)this.hurtPlayer(16,s.x)}
   if(s.t>.75){this.fx.shard(s.x,s.gy-s.h*.5,10,100);this.spells.splice(i,1)}}
  for(let i=this.bolts.length-1;i>=0;i--){const o=this.bolts[i];o.t+=dt;if(o.target&&o.target.e&&!o.target.e.dead)o.x=o.target.e.b.x;if(o.target&&o.target.boss&&this.boss)o.x=this.boss.x;
   if(!o.pts||Math.floor(o.t*14)!==o.fr){o.fr=Math.floor(o.t*14);o.pts=this.boltPath(o.x,o.gy,Math.round(this.cam.scrollY)-4)}
   if(!o.hit&&o.t>.06){o.hit=true;this.flashF=2;this.cam.shake(180,.014);this.fx.spark(o.x,o.gy-2,18,C.bolt,170,60);this.fx.spark(o.x,o.gy-2,8,0x5ad8ff,140,50);this.fx.spark(o.x,o.gy-2,6,C.f1,120,40);this.fx.dust(o.x,o.gy,8);this.novas.push({x:o.x,y:o.gy,t:0,m:.25,bolt:1});
    if(o.target&&o.target.e)this.damageEnemy(o.target.e,3*this.spellMul,this.player.f);if(o.target&&o.target.boss)this.damageBoss(3*this.spellMul);this.hitstop(.05)}
   if(o.t>.5)this.bolts.splice(i,1)}
  for(let i=this.novas.length-1;i>=0;i--){const n=this.novas[i];n.t+=dt;
   if(n.dome){const r=n.R*ease(Math.min(1,n.t/n.grow));
    if(!n.done&&n.t>n.grow*.9){n.done=true;if(!n.harmless){if(n.owner==='p'){for(const e of this.enemies)if(!e.dead&&Math.hypot(e.b.x-n.x,e.b.y-n.y)<n.R)this.damageEnemy(e,2*this.spellMul,Math.sign(e.b.x-n.x)||1);if(this.boss&&Math.abs(this.boss.x-n.x)<n.R)this.damageBoss(3*this.spellMul);for(const c of this.cages)if(!c.freed&&!c.locked&&Math.hypot(c.x-n.x,c.y-n.y)<n.R)this.freeCage(c)}
      else if(Math.hypot(this.player.x-n.x,(this.player.y-6)-n.y)<n.R)this.hurtPlayer(22,n.x)}}
    if(n.t>n.grow&&!n.burst){n.burst=true;for(let a=0;a<60;a++){const an=Math.PI+a/60*Math.PI;this.fx.add({k:'shard',x:n.x+Math.cos(an)*r,y:n.y+Math.sin(an)*r,vx:Math.cos(an)*40,vy:Math.sin(an)*40,l:0,m:rnd(.4,.8)})}this.cam.shake(160,.01)}}
   if(n.t>n.m)this.novas.splice(i,1)}
  for(let i=this.shots.length-1;i>=0;i--){const s=this.shots[i];if(s.delay>0){s.delay-=dt;continue}s.t+=dt;if(s.g)s.vy+=s.g*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;const fire=s.c==='fire';
   if(Math.random()<.6){if(fire)this.fx.fire(s.x,s.y,1,1,.5);else this.fx.add({k:'shard',x:s.x,y:s.y,vx:rnd(-8,8),vy:rnd(-8,8),l:0,m:.3})}
   const P=this.player,rr=s.r||6;if(Math.hypot(P.x-s.x,P.y-7-s.y)<rr){if(this.hurtPlayer(s.dmg||12,s.x)||P.inv>0){fire?this.fx.fire(s.x,s.y,10,3,1.2):this.fx.shard(s.x,s.y,10);this.shots.splice(i,1)}continue}
   if(this.lv.kAt(s.x,s.y)===K_SOLID||s.t>(s.life||3)){if(fire){this.fx.fire(s.x,s.y,12,4,1.2);this.fx.ember(s.x,s.y,4,1.5)}else this.fx.shard(s.x,s.y,8);if(s.g)this.cam.shake(60,.004);this.shots.splice(i,1)}}}
 clearLine(x0,y0,x1,y1){for(let k=1;k<8;k++){const x=lerp(x0,x1,k/8),y=lerp(y0,y1,k/8);if(this.lv.kAt(x,y)===K_SOLID)return false}return true}
 // ---------------- enemies ----------------
 updateEnemies(dt){this._inE=1;for(const e of this.enemies){const P=NET.target(this,e);this._eRemote=!!P.remote;if(e.dead){e.deadT+=dt;continue}const b=e.b;e.t+=dt;e.flash-=dt;e.cd-=dt;const dx=P.x-b.x,adx=Math.abs(dx);
   if(adx>260||Math.abs(P.y-b.y)>150)continue;
   if(e.base==='hollow'||e.base==='knight'){const on=b.body.blocked.down,kn=e.base==='knight';
    if(e.state==='stag'){b.setVelocityX(b.body.velocity.x*.85);if(Math.random()<.3)this.fx.star(b.x+rnd(-4,4),b.y-12,C.f1);if(e.t>TUNE.stagT){e.state='chase';e.cd=.6}}
    else if(e.state==='idle'){if(adx<110)e.state='chase';b.setVelocityX(on?b.body.velocity.x*.8:b.body.velocity.x)}
    else if(e.state==='chase'){e.f=Math.sign(dx)||1;if(on)b.setVelocityX(e.f*(kn?28:38));if(adx<22&&e.cd<0){e.state='wind';e.t=0;e.combo=0;b.setVelocityX(0)}}
    else if(e.state==='wind'){if(e.t>(e.combo?.22:kn?.55:.45)){e.state='swing';e.t=0;b.setVelocityX(e.f*(e.combo?50:70));this.sfx('slash',.2)}}
    else if(e.state==='swing'){if(e.t<.12&&adx<20&&Math.abs(P.y-b.body.bottom)<16)this.hurtPlayer(e.combo?10:kn?16:14,b.x,e);
     if(e.state==='swing'&&e.t>.35){if(!kn&&!e.combo&&adx<28){e.combo=1;e.state='wind';e.t=0;b.setVelocityX(0)}else{e.state='chase';e.cd=kn?1.6:1.4;b.setVelocityX(0)}}}
    e.run=(e.run||0)+Math.abs(b.body.velocity.x)*dt*.35}
   else if(e.base==='wraith'){e.f=Math.sign(dx)||1;const ty=e.gy-44+Math.sin(e.t*2.2)*8;b.y+=(ty-b.y)*dt*3;b.x+=clamp(dx-e.f*70,-1,1)*22*dt*(adx>50?1:-.5);
    if(Math.random()<.3){if(e.k==='wisp')this.fx.fire(b.x,b.y+4,1,3,.8);else this.fx.add({k:'shard',x:b.x+rnd(-3,3),y:b.y+6,vx:0,vy:rnd(4,12),l:0,m:.5})}
    if(e.cd<0&&adx<170&&this.clearLine(b.x,b.y,P.x,P.y-8)){e.cd=2.4;e.cast=.4}if(e.cast>0){e.cast-=dt;if(e.cast<=0){const a=Math.atan2(P.y-8-b.y,dx),L=ELOOK[e.k]||{},sp=e.k==='chorister'?[-.28,0,.28]:[0];for(const o of sp)this.shots.push({x:b.x,y:b.y,vx:Math.cos(a+o)*(L.shot?75:85),vy:Math.sin(a+o)*(L.shot?75:85),t:0,c:L.shot,dmg:e.k==='wisp'?16:12});this.sfx('shot',.15)}}}
   else if(e.k==='magmaw'){// r3 P2: magmaw has its own behaviour — lurks submerged in the cinder floor, surfaces near you, spits two arcing lava globs, sinks again
    const on=b.body.blocked.down;e.f=Math.sign(dx)||1;if(!e.mst){e.mst='sub';e.mt=0}e.mt+=dt;
    if(e.mst==='sub'){if(on)b.setVelocityX(clamp(dx,-1,1)*30*(adx>40?1:-1));if(Math.random()<.15)this.fx.fire(b.x+rnd(-4,4),b.body.bottom-1,1,2,.5);if(adx<100&&e.cd<0&&e.mt>.6){e.mst='rise';e.mt=0;b.setVelocityX(0);this.fx.dust(b.x,b.body.bottom,6)}}
    else if(e.mst==='rise'){b.setVelocityX(0);if(e.mt>.35){e.mst='spit';e.mt=0;this.sfx('lava',.35);for(const k of[.8,1.15]){const tvx=clamp(dx*k,-110,110);this.shots.push({x:b.x,y:b.y-6,vx:tvx,vy:-150,g:300,t:0,c:'fire',dmg:14})}}}
    else if(e.mst==='spit'){b.setVelocityX(0);if(e.mt>.8){e.mst='sub';e.mt=0;e.cd=rnd(1.4,2.2)}}
    e.state=e.mst==='sub'?'idle':'hop'}
   else if(e.base==='imp'){const on=b.body.blocked.down;e.f=Math.sign(dx)||1;if(Math.random()<.3)this.fx.fire(b.x,b.y-3,1,2,.6);
    if(e.state==='idle'&&adx<130)e.state='hop';
    if(e.state==='hop'&&on&&e.cd<0){b.setVelocity(e.f*rnd(50,80),-rnd(150,200));e.cd=rnd(.5,.9);this.fx.dust(b.x,b.body.bottom,3)}
    if(e.state==='hop'&&adx<16&&Math.abs(P.y-b.body.bottom)<14){e.state='fuse';e.t=0;b.setVelocityX(0)}
    if(e.state==='fuse'&&e.t>.5){e.dead=true;e.deadT=0;b.body.enable=false;this.explode(b.x,b.y,true)}}}}
 // ---------------- boss: The Frost Warden ----------------
 updateBoss(dt){const P=this.player;if(!this.def.boss)return;
  if(this.bossState==='sleep'&&P.x>ARENA_L+20){this.bossState='cine';this.startCine()}
  if(this.def.boss.kind!=='warden')return this.updateLord(dt);
  const B=this.boss;if(!B)return;B.t+=dt;B.flashCd-=dt;B.eyeFlash-=dt;
  if(this.bossState==='fight'){const dx=P.x-B.x,adx=Math.abs(dx);B.cd-=dt;
   if(Math.random()<.5)this.fx.add({k:'shard',x:B.x+rnd(-8,8),y:B.y-rnd(4,30),vx:rnd(-6,6),vy:rnd(-12,-2),l:0,m:.5});
   if(Math.random()<.25)this.fx.add({k:'breath',x:B.x+B.f*5,y:B.y-32,vx:B.f*rnd(8,18),vy:rnd(-4,2),l:0,m:rnd(.5,.9)});
   if(B.state==='stag'){if(Math.random()<.4)this.fx.star(B.x+rnd(-8,8),B.y-rnd(30,40),C.f1);if(B.t>TUNE.stagT){B.state='walk';B.cd=.6}}
   else if(B.state==='walk'){B.f=Math.sign(dx)||1;B.x+=B.f*(B.phase2?34:26)*dt;B.step+=dt*6;
    if(B.cd<0){const r=Math.random();B.next=adx<40?(r<.6?'slam':'nova'):(r<.45?'charge':r<.8?'slam':'nova');if(!B.phase2&&B.next==='nova'&&Math.random()<.5)B.next='slam';
     B.state='wind';B.t=0;B.wt=B.next==='charge'?.6:B.next==='nova'?.75:.7;B.eyeFlash=.3;this.sfx('charge',.4)}}
   else if(B.state==='wind'){if(Math.random()<.7)this.fx.star(B.x+B.f*rnd(4,16),B.y-rnd(20,36));
    if(B.t>B.wt){B.state=B.next;B.t=0;if(B.next==='slam'){this.cam.shake(220,.02);this.fx.dust(B.x+B.f*16,GY,16);this.castIce(B.x+B.f*20,B.f,'b');this.sfx('slam',.5);this.fx.shard(B.x+B.f*16,GY,16,120)}
     if(B.next==='nova'){this.novas.push({dome:1,owner:'b',x:B.x,y:GY,R:B.phase2?104:92,grow:.5,t:0,m:1.4});this.sfx('parry',.35)}
     if(B.next==='charge'){B.f=Math.sign(dx)||1}}}
   else if(B.state==='slam'){if(B.t<.1&&Math.abs(P.x-(B.x+B.f*16))<16)this.hurtPlayer(24,B.x,'boss');if(B.state==='slam'&&B.t>.6){B.state='walk';B.cd=rnd(.8,1.6)*(B.phase2?.7:1)}}
   else if(B.state==='nova'){if(B.t>1){B.state='walk';B.cd=rnd(.8,1.4)}}
   else if(B.state==='charge'){B.x+=B.f*200*dt;if(Math.random()<.9)this.fx.dust(B.x-B.f*8,GY,1,-B.f);this.fx.add({k:'shard',x:B.x-B.f*6,y:GY-rnd(2,20),vx:-B.f*30,vy:0,l:0,m:.4});
    if(Math.abs(P.x-B.x)<12&&Math.abs(P.y-GY)<26)this.hurtPlayer(20,B.x);
    if(B.x<ARENA_L+20||B.x>ARENA_R-20||B.t>.9){B.x=clamp(B.x,ARENA_L+20,ARENA_R-20);B.state='walk';B.cd=rnd(.6,1.2);this.cam.shake(150,.015);this.fx.dust(B.x,GY,12)}}
   B.x=clamp(B.x,ARENA_L+16,ARENA_R-16);
   if(!B.phase2&&B.hp<B.hpMax*.5){B.phase2=true;this.say('THE WARDEN\'S RIME DEEPENS',1.8);this.novas.push({dome:1,owner:'b',harmless:1,x:B.x,y:GY,R:120,grow:.6,t:0,m:1.6});this.cam.shake(300,.02)}
   if(B.hp<=0){this.bossState='dying';B.t=0;this.sfx('death',.6);this.say(this.def.boss.slain,3);this.cam.shake(600,.02)}}
  if(this.bossState==='dying'){if(Math.random()<.9)this.fx.shard(B.x+rnd(-10,10),B.y-rnd(0,34),2,120);if(Math.random()<.3)this.fx.spark(B.x+rnd(-8,8),B.y-rnd(0,30),4,C.ice2);
   if(B.t>2.2)this.finishBoss(B)}}
 finishBoss(B){this.bossState='dead';if(NET.host())NET.send({t:'bossdead',slain:this.def.boss.slain,kind:B.kind});this.fx.soul(B.x,B.y-16,60);this.gainSouls((B.kind==='warden'?2000:3000)*(1+this.ng));this.gateL.body.enable=false;this.shots.length=0;this.flames=[];
  const bk='ashenVigil.best.'+this.sid;// r3 P3: one naming scheme for every stage (legacy ramparts key migrated below)
  {const old=localStorage.getItem('ashenVigil.best');if(old&&!localStorage.getItem('ashenVigil.best.ramparts'))try{localStorage.setItem('ashenVigil.best.ramparts',old)}catch(e){}}
  if(!this.sv.lords.includes(B.kind))this.sv.lords.push(B.kind);this.awardSignature(B.kind,B.x);
  Object.assign(this.sv,{bonfire:this.bonfire.lit,souls:this.souls,bossDown:true,time:this.playT});{const b=+localStorage.getItem(bk)||0;this.bestNew=!b||this.playT<b;if(this.bestNew)try{localStorage.setItem(bk,String(Math.round(this.playT)))}catch(e){}this.best=this.bestNew?this.playT:b}Save.write(this.sv);this.boss=null;
  this.time.delayedCall(1600,()=>{this.victory={t:0,sel:0,clear:!!this.def.next};this.physics.pause()})}
 // ---------------- lords (milestone C): the Pale Cantor (cathedral) and Vulcrest the Cinder King (cinderdeep), 3 phases each ----------------
 pickLord(B,adx){const r=Math.random(),p=B.phase;
  if(B.kind==='toller'){if(p>=3&&r<.3)return'peal';if(p>=2&&r<.3)return'requiem';if(adx<44&&r<.5)return'slam';return r<.8?'toll':'charge'}
  if(B.kind==='cantor'){if(p>=3&&r<.3)return'requiem';if(adx<44&&r<.55)return'slam';return r<.75?'hymn':'charge'}
  if(p>=3&&r<.25)return'inferno';if(p>=2&&r<.5&&adx>40)return'meteor';if(adx<44&&r<.7)return'slam';return'charge'}
 updateLord(dt){const P=this.player,B=this.boss;if(!B)return;B.t+=dt;B.flashCd-=dt;B.eyeFlash-=dt;const K=B.kind,king=K==='king';
  this.updateFlames(dt);
  if(this.bossState==='fight'){const dx=P.x-B.x,adx=Math.abs(dx);B.cd-=dt;B.hov=(B.hov||0)+dt;
   if(king){if(Math.random()<.5)this.fx.fire(B.x+rnd(-10,10),B.y-rnd(30,44),1,2,.8);if(Math.random()<.2)this.fx.ember(B.x+rnd(-8,8),B.y-rnd(10,40),1,.8)}
   else if(Math.random()<.35)this.fx.add({k:'snow',x:B.x+rnd(-10,10),y:B.y-rnd(10,44),vx:rnd(-6,6),vy:rnd(6,16),l:0,m:rnd(1,2),ph:rnd(0,6)});
   const ph=B.hp<B.hpMax*.33?3:B.hp<B.hpMax*.66?2:1;
   if(ph>B.phase&&B.state!=='roar'&&B.hp>0){B.phase=ph;B.state='roar';B.t=0;this.shots.length=0;this.say(this.def.boss.phases[ph-2],2);this.cam.shake(500,.02);this.flashA=.22;this.sfx('death',.4);
    if(king){for(let i=0;i<6;i++)this.time.delayedCall(i*90,()=>this.explode(ARENA_L+30+i*60,GY-6,false))}else this.novas.push({dome:1,owner:'b',harmless:1,x:B.x,y:GY,R:130,grow:.6,t:0,m:1.6})}
   if(!king&&B.phase>=2&&B.state!=='perch'&&B.state!=='glide')B.loftCd=(B.loftCd??2.5)-dt;
   const spd=(king?24:30)*(1+.2*(B.phase-1)),quick=B.phase===3?.75:B.phase===2?.88:1;
   if(B.state==='stag'){if(Math.random()<.4)this.fx.star(B.x+rnd(-8,8),B.y-rnd(30,44),C.f1);if(B.t>TUNE.stagT){B.state='walk';B.cd=.6}}
   else if(B.state==='roar'){if(Math.random()<.8)king?this.fx.fire(B.x+rnd(-14,14),B.y-rnd(0,40),2,3,1.6):this.fx.star(B.x+rnd(-16,16),B.y-rnd(0,48),0xb8a8ff);if(B.t>1.3){B.state='walk';B.cd=.5}}
   else if(B.state==='glide'){const q=ease(Math.min(1,B.t/.8));B.x=lerp(B.gx0,B.gx,q);B.y=lerp(B.gy0,B.gy,q);if(Math.random()<.6)this.fx.star(B.x+rnd(-10,10),B.y-rnd(0,40),0xb8a8ff);if(B.t>.8){B.state=B.gy<GY?'perch':'walk';B.t=0;B.cd=.8;B.fire=0}}
   else if(B.state==='perch'){B.f=Math.sign(dx)||1;B.fire=(B.fire||0)-dt;if(B.fire<0&&B.t<2.2){B.fire=.7;const a=Math.atan2(P.y-8-(B.y-24),dx);for(const o of[-.25,0,.25])this.shots.push({x:B.x,y:B.y-24,vx:Math.cos(a+o)*80,vy:Math.sin(a+o)*80,t:0,c:'note',dmg:12});this.sfx('shot',.25)}
    if(B.t>2.6){B.state='glide';B.t=0;B.gx0=B.x;B.gy0=B.y;B.gx=clamp(P.x+(P.x>3170?-40:40),ARENA_L+30,ARENA_R-30);B.gy=GY}}
   else if(B.state==='walk'){B.f=Math.sign(dx)||1;if(B.y<GY)B.y=Math.min(GY,B.y+140*dt);if(adx>30)B.x+=B.f*spd*dt;B.step=(B.step||0)+dt*6;
    if(!king&&B.phase>=2){if(B.loftCd<0&&B.cd<0&&B.y>=GY){B.state='glide';B.t=0;B.gx0=B.x;B.gy0=B.y;B.gx=3170;B.gy=80;B.loftCd=8;this.say(K==='toller'?'THE TOLLER CLIMBS INTO THE BELL FRAME':'THE CANTOR ASCENDS TO THE LOFT',1.4)}}
    if(B.state==='walk'&&B.cd<0){B.next=this.pickLord(B,adx);B.state='wind';B.t=0;B.wt=({slam:.7,hymn:.75,charge:.6,requiem:.8,meteor:.8,inferno:.9,toll:.7,peal:.95})[B.next]*quick;B.eyeFlash=.3;this.sfx('charge',.4)}}
   else if(B.state==='wind'){const c=king?C.f1:0xb8a8ff;if(Math.random()<.7)king?this.fx.fire(B.x+B.f*rnd(4,18),B.y-rnd(14,34),1,2,1):this.fx.star(B.x+B.f*rnd(4,16),B.y-rnd(20,40),c);
    if(B.t>B.wt)this.lordStrike(B,dx)}
   else if(B.state==='slam'){if(B.t<.1&&Math.abs(P.x-(B.x+B.f*16))<18&&P.y>GY-30)this.hurtPlayer(king?28:24,B.x,'boss');if(B.state==='slam'&&B.t>.6){B.state='walk';B.cd=rnd(.8,1.5)*quick}}
   else if(B.state==='charge'){B.x+=B.f*(king?210:180)*dt;
    if(king){this.fx.fire(B.x-B.f*8,GY-2,2,3,1);if(Math.random()<.9)this.fx.dust(B.x-B.f*8,GY,1,-B.f)}else this.fx.add({k:'shard',x:B.x-B.f*6,y:B.y-rnd(8,36),vx:-B.f*30,vy:0,l:0,m:.4});
    if(Math.abs(P.x-B.x)<12&&Math.abs(P.y-GY)<30)this.hurtPlayer(20,B.x);
    if(B.x<ARENA_L+20||B.x>ARENA_R-20||B.t>.9){B.x=clamp(B.x,ARENA_L+20,ARENA_R-20);B.state='walk';B.cd=rnd(.6,1.2)*quick;this.cam.shake(150,.015);this.fx.dust(B.x,GY,12)}}
   else if(B.state==='cast'){if(B.t>(B.dur||1)){B.state='walk';B.cd=rnd(.7,1.3)*quick}}
   B.x=clamp(B.x,ARENA_L+16,ARENA_R-16);
   if(king&&B.phase>=2&&this.def.lavaPits){this.lavaCd=(this.lavaCd||0)-dt;for(const[a,b]of this.def.lavaPits){if(Math.random()<.25)this.fx.fire(rnd(a,b),GY-1,1,3,1);if(P.x>a&&P.x<b&&this.pb.body.blocked.down&&P.y>=GY-1&&this.lavaCd<0&&!P.dead){this.lavaCd=.7;P.inv=0;this.hurtPlayer(14,P.x<(a+b)/2?b+10:a-10);this.fx.fire(P.x,GY-2,8,4,1.2);this.sfx('lava',.4)}}}
   if(B.hp<=0){this.bossState='dying';B.t=0;this.flames=[];this.shots.length=0;this.sfx('death',.6);this.say(this.def.boss.slain,3);this.cam.shake(600,.02)}}
  if(this.bossState==='dying'){if(king){if(Math.random()<.9)this.fx.fire(B.x+rnd(-12,12),B.y-rnd(0,40),3,3,1.5);if(Math.random()<.08)this.explode(B.x+rnd(-14,14),B.y-rnd(4,36),false)}
   else{if(Math.random()<.9)this.fx.shard(B.x+rnd(-10,10),B.y-rnd(0,40),2,120);if(Math.random()<.3)this.fx.star(B.x+rnd(-12,12),B.y-rnd(0,50),0xb8a8ff)}
   if(B.t>2.2)this.finishBoss(B)}}
 lordStrike(B,dx){const P=this.player,king=B.kind==='king',p=B.phase;B.t=0;const n=B.next;
  if(n==='slam'){B.state='slam';this.cam.shake(240,.02);this.fx.dust(B.x+B.f*16,GY,16);this.sfx('slam',.5);
   if(king){for(let i=1;i<=3+p;i++)this.time.delayedCall(i*110,()=>{if(this.boss)this.explode(clamp(B.x+B.f*(14+i*24),ARENA_L+8,ARENA_R-8),GY-6,true)})}
   else{this.castIce(B.x+B.f*20,B.f,'b');if(p>=2)this.castIce(B.x-B.f*20,-B.f,'b');this.sfx('bonfire',.3)}}
  else if(n==='charge'){B.state='charge';B.f=Math.sign(dx)||1}
  else if(n==='hymn'){B.state='cast';B.dur=1.1;const ring=(N,off,sp)=>{for(let i=0;i<N;i++){const a=(i+.5)/N*(Math.PI+1.2)-.6+off;this.shots.push({x:B.x,y:B.y-30,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,t:0,c:'note',dmg:12,life:4})}};
   ring(p>=2?9:7,0,70);if(p>=2)this.time.delayedCall(380,()=>{if(this.boss&&this.bossState==='fight')ring(8,.17,85)});this.novas.push({x:B.x,y:B.y-30,t:0,m:.4,parry:1});this.sfx('parry',.35)}
  else if(n==='requiem'||n==='meteor'){B.state='cast';B.dur=1.2;const N=king?(p>=3?7:5):7;
   for(let i=0;i<N;i++){const x=clamp(P.x+rnd(-70,70)+(i===0?0:0),ARENA_L+10,ARENA_R-10),d=.55+i*.13;this.shots.push({x:i===0?P.x:x,y:this.cam.scrollY-6,vx:0,vy:40,g:king?420:520,t:0,delay:d,d0:d,c:king?'fire':'ice',r:king?9:6,dmg:king?18:16,life:3})}
   this.sfx('charge',.4);if(king)this.fx.ember(B.x,B.y-40,20,2.5)}
  else if(n==='toll'||n==='peal'){B.state='cast';B.dur=n==='peal'?2:1;const toll=()=>{if(!this.boss||this.bossState!=='fight')return;this.flames.push({x:B.x-10,dir:-1,t:0,ice:1},{x:B.x+10,dir:1,t:0,ice:1});this.novas.push({dome:1,owner:'b',harmless:1,x:B.x,y:GY,R:60,grow:.3,t:0,m:.7});this.cam.shake(220,.014);this.sfx('bell',.5);B.bellSw=1};
   toll();if(n==='peal'){this.time.delayedCall(650,toll);this.time.delayedCall(1300,toll)}}
  else if(n==='inferno'){B.state='cast';B.dur=1.6;this.flames.push({x:B.x-10,dir:-1,t:0},{x:B.x+10,dir:1,t:0});this.cam.shake(300,.015);this.sfx('death',.3)}}
 updateFlames(dt){const P=this.player;for(let i=this.flames.length-1;i>=0;i--){const f=this.flames[i];f.t+=dt;f.x+=f.dir*140*dt;if(f.ice){if(Math.random()<.8)this.fx.shard(f.x+rnd(-3,3),GY-1,1,60)}else this.fx.fire(f.x+rnd(-4,4),GY-1,3,4,1.8);
   if(Math.abs(P.x-f.x)<9&&P.y>GY-14)this.hurtPlayer(18,f.x-f.dir*10);if(f.x<ARENA_L+4||f.x>ARENA_R-4)this.flames.splice(i,1)}}
 drawCantor(g,ga,B){const rise=B.rise===undefined?1:B.rise,f=B.f,X=d=>x+d*f,t=this.t;const x=Math.round(B.x),y=Math.round(GY-4-Math.sin((B.hov||0)*2)*2-(1-rise)*130);const fl=B.flash>0;if(B.flash>0&&this.dt)B.flash--;
  const p=B.phase||1,robe=fl?0xffffff:0xc8d0e8,sh=fl?0xd8f2ff:0x7a86a8,dk=fl?0xb8c8e8:0x2a3050,eye=p>=3?0xff6a8a:0xd8c8ff;
  glow(ga,x,y-24,44,0x6a5ad8,.07+p*.03);this.light(x,y-26,60+p*8,0x9fa8ff,.35+p*.08);
  // icicle halo (spins faster each phase)
  const hr=10+p*2;for(let i=0;i<12;i++){const a=i/12*6.283+t*(.6*p);const hx=x+Math.cos(a)*hr,hy=y-40+Math.sin(a)*hr*.45;px(ga,hx,hy,i%3?0x9fd8ff:0xffffff,.8);if(i%3===0)px(ga,hx,hy+1,0x9fd8ff,.6)}
  const wind=B.state==='wind'||B.state==='cast',stg=B.state==='stag';
  // robe: tall bell shape, tattered hem (phase 3 tatters more)
  for(let i=0;i<34;i++){const yy=y-36+i,w=Math.round(3+i*.33);g.fillStyle(i<4?sh:robe);g.fillRect(x-w,yy,2*w+1,1);px(g,x-w,yy,sh);px(g,x+w,yy,dk);if(i%6===2)px(g,X(-2),yy,sh)}
  for(let k=-14;k<=14;k+=2){const hl=1+((k*7+Math.floor(t*6))%3)+(p>=3?2:0);g.fillStyle(dk);g.fillRect(x+k,y-2,1,hl)}
  ga.fillStyle(0xd8f2ff,.35);ga.fillRect(x-14,y-1,29,1);
  // sleeves: raised while singing
  const ay=wind?-14:stg?4:0;line(g,x-5,y-28,x-12,y-18+ay,sh);line(g,x+5,y-28,x+12,y-18+ay,sh);line(g,x-6,y-28,x-13,y-18+ay,robe);line(g,x+6,y-28,x+13,y-18+ay,robe);
  // bell-staff
  const sx=X(13),sy=y-18+ay;line(g,sx,sy-14,sx,sy+10,0x8b86a8);g.fillStyle(fl?0xffffff:0xb8c4e0);g.fillRect(sx-3,sy-20,7,6);g.fillRect(sx-4,sy-15,9,1);px(g,sx,sy-21,0xffffff);glow(ga,sx,sy-17,6,0x9fd8ff,.2);
  // hood + mask
  g.fillStyle(dk);g.fillRect(x-4,y-44,9,9);g.fillStyle(robe);g.fillRect(x-4,y-45,9,2);px(g,x,y-46,robe);g.fillStyle(0xe8ecff);g.fillRect(X(0)-(f<0?3:0),y-41,4,4);
  const ea=B.eyes===undefined?1:B.eyes;if(ea>0){const ef=B.eyeFlash>0;px(ga,X(1),y-40,eye,ea);px(ga,X(3),y-40,eye,ea);glow(ga,X(2),y-40,ef?12:5,ef?0xffffff:eye,(ef?.6:.35)*ea);if(ef)sparkle(ga,X(2),y-40,4,0xffffff)}
  if(B.state==='slam'&&B.t<.12)drawSlash(ga,X(10),y-20,f,B.t/.12,{r:22,th:4,sweep:150,trail:1});
  if(B.state==='wind'&&B.next==='slam'){const k=clamp(B.t/B.wt,0,1);for(let xx=0;xx<ICEP.n*ICEP.step;xx+=3){px(ga,B.x+B.f*(20+xx),GY,0xb8a8ff,.3+.6*k);if(B.phase>=2)px(ga,B.x-B.f*(20+xx),GY,0xb8a8ff,.3+.6*k)}}
  if(B.state==='roar'){glow(ga,x,y-24,30+Math.sin(t*20)*4,0xb8a8ff,.2)}}
 drawKing(g,ga,B){const rise=B.rise===undefined?1:B.rise,f=B.f,X=d=>x+d*f,t=this.t;const x=Math.round(B.x),y=Math.round(GY+(1-rise)*50);const fl=B.flash>0;if(B.flash>0&&this.dt)B.flash--;
  const p=B.phase||1,a0=fl?0xffffff:0x3a2420,a1=fl?0xffd8a0:0x5a3428,a2=fl?0xffffff:0x8a5440,mol=p>=3?C.f0:p>=2?C.f1:C.f2;
  glow(ga,x,y-22,46,C.f3,.08+p*.03);this.light(x,y-24,64+p*10,C.f2,.45+p*.08);
  const st=B.state==='walk'?Math.round(Math.sin(B.step||0)*2):0,wind=B.state==='wind',stg=B.state==='stag',cr=wind?3:stg?5:0;
  // legs
  g.fillStyle(a0);g.fillRect(X(-6+st)-(f<0?4:0),y-14,5,14);g.fillStyle(a1);g.fillRect(X(2-st)-(f<0?4:0),y-14,5,14);g.fillStyle(a0);g.fillRect(x-8,y-1,7,1);g.fillRect(x+2,y-1,7,1);
  // torso + molten cracks
  g.fillStyle(a1);g.fillRect(x-9,y-34+cr,19,20);g.fillStyle(a2);g.fillRect(x-9,y-34+cr,19,1);g.fillStyle(a0);g.fillRect(x-9,y-16+cr,19,2);
  for(const[a,b,c2,d]of[[-6,-31,-2,-24],[-2,-24,-4,-18],[3,-30,6,-22],[6,-22,2,-17]])line(ga,x+a*f,y+b+cr,x+c2*f,y+d+cr,mol,.9);glow(ga,x,y-25+cr,8,C.f2,.25);
  // pauldrons
  g.fillStyle(a1);g.fillRect(x-14,y-36+cr,7,7);g.fillRect(x+8,y-36+cr,7,7);g.fillStyle(a2);g.fillRect(x-14,y-36+cr,7,1);g.fillRect(x+8,y-36+cr,7,1);
  // head + flaming crown
  g.fillStyle(a0);g.fillRect(x-4,y-43+cr,9,8);g.fillStyle(a1);g.fillRect(x-4,y-43+cr,9,1);
  for(let k=-4;k<=4;k+=2){const fh=3+((k+Math.floor(t*12))&1)+(p-1);g.fillStyle(0xd8b060);g.fillRect(x+k,y-46+cr,1,3);ga.fillStyle(C.f2,.8);ga.fillRect(x+k,y-46-fh+cr,1,fh);px(ga,x+k,y-47-fh+cr,C.f0,.8)}
  if(Math.random()<.4)this.fx.fire(x+rnd(-4,4),y-48+cr,1,2,.8);
  const ea=B.eyes===undefined?1:B.eyes;if(ea>0){const ef=B.eyeFlash>0;px(ga,X(0),y-40+cr,C.f0,ea);px(ga,X(3),y-40+cr,C.f0,ea);glow(ga,X(2),y-40+cr,ef?12:5,ef?0xffffff:C.f1,(ef?.6:.35)*ea);if(ef)sparkle(ga,X(2),y-40+cr,4,0xffffff)}
  // great hammer
  let ang=stg?1.4:wind?(B.next==='charge'?.2:-2.0):B.state==='slam'?Math.min(1,B.t/.08)*1.4-.2:B.state==='charge'?.1:.9;
  const hx=X(12),hy=y-26+cr,L=26,ex=hx+Math.cos(ang)*L*f,ey=hy+Math.sin(ang)*L;line(g,hx,hy,ex,ey,0x6a4a3a);line(g,hx,hy+1,ex,ey+1,0x3a2420);
  g.fillStyle(fl?0xffffff:0x4a3430);g.fillRect(Math.round(ex)-5,Math.round(ey)-4,11,9);g.fillStyle(a2);g.fillRect(Math.round(ex)-5,Math.round(ey)-4,11,1);ga.fillStyle(mol,.8);ga.fillRect(Math.round(ex)-3,Math.round(ey),7,1);glow(ga,ex,ey,8,C.f2,.25);
  if(B.state==='slam'&&B.t<.12)drawSlash(ga,X(12),y-26,f,B.t/.12,{r:24,th:4,sweep:150,trail:1});
  if(B.state==='wind'&&B.next==='slam'){const k=clamp(B.t/B.wt,0,1);for(let i=1;i<=3+p;i++){const ax=B.x+B.f*(14+i*24);if(ax>ARENA_L&&ax<ARENA_R){glow(ga,ax,GY-1,4+k*4,C.f2,.2+.3*k);px(ga,ax,GY-1,C.f0,k)}}}
  if(B.state==='wind'&&B.next==='inferno'){const k=clamp(B.t/B.wt,0,1);ga.fillStyle(C.f2,.25*k);ga.fillRect(ARENA_L,GY-1,ARENA_R-ARENA_L,1)}
  if(rise<1){g.fillStyle(0x8a1a08);g.fillRect(x-18,GY,36,50);ga.fillStyle(C.f2,.7);ga.fillRect(x-18,GY,36,1);glow(ga,x,GY,20,C.f2,.25)}
  if(B.state==='roar')glow(ga,x,y-24,34+Math.sin(t*20)*4,C.f2,.22);
  for(const fl2 of this.flames){const fx=Math.round(fl2.x);glow(ga,fx,GY-6,10,C.f2,.3);this.light(fx,GY-8,30,C.f2,.7);for(let k=0;k<4;k++){ga.fillStyle(k<2?C.f1:C.f2,.8);ga.fillRect(fx-2+k,GY-4-k*3-((t*30+k*5)%4),2,4)}}}
 damageBoss(n,fromNet){if(NET.guest()&&!fromNet){const B=this.boss;if(B){B.flash=2;this.fx.spark(B.x,B.y-18,6,0xffd04a,80)}this.sfx('hit',.3);NET.send({t:'bdmg',n});return}const B=this.boss;if(!B||this.bossState!=='fight')return;if(B.state==='roar'){this.fx.spark(B.x,B.y-18,6,0xffffff,80);return}B.hp-=n;if(B.flashCd<=0){B.flash=2;B.flashCd=.15}this.fx.spark(B.x,B.y-18,12,B.kind==='king'?C.f1:C.ice1,130,30);this.sfx('hit',.35)}
 startCine(){this.gateL.body.enable=true;for(const e of this.enemies)if(!e.dead&&e.b.x<ARENA_L){e.dead=true;e.deadT=1;e.b.body.enable=false}this.shots.length=0;const BD=this.def.boss,hp=(BD.hp||40)*this.ngMul;this.flames=[];this.boss={kind:BD.kind,phase:1,x:ARENA_R-60,y:GY,f:-1,hp,hpMax:hp,t:0,state:'rise',cd:1.5,flash:0,flashCd:0,eyeFlash:0,step:0,eyes:0,rise:0,wt:.7};
  this.cine={t:0};this.cam.stopFollow();this.pb.setVelocityX(0);this.player.state='idle';this.cam.pan(ARENA_R-110,90,900,'Sine.easeInOut')}
 updateCine(dt){const c=this.cine;if(!c)return;c.t+=dt;const B=this.boss;this.bars=Math.min(1,c.t/.5);
  const K=B.kind;
  if(K==='king'&&c.t>.3&&c.t<1.6&&Math.random()<.5)this.fx.fire(ARENA_L+rnd(20,340),GY,3,3,1.6);
  if(K==='toller'){if(!c.said){c.said=1;this.say('A BELL TOLLS IN THE FROZEN DARK',1.6);this.sfx('bell',.6)}if(c.t>1.2&&!c.t2){c.t2=1;this.sfx('bell',.7);this.flashA=.18}}
  if((K==='cantor'||K==='toller')&&c.t<1.8&&Math.random()<.4)this.fx.add({k:'snow',x:B.x+rnd(-40,40),y:this.cam.scrollY,vx:rnd(-6,6),vy:rnd(20,40),l:0,m:rnd(2,4),ph:rnd(0,6)});
  if(c.t>.9&&c.t<1.6){B.rise=ease((c.t-.9)/.7);if(Math.random()<.9){if(K==='king')this.fx.fire(B.x+rnd(-16,16),GY,3,4,1.5);else if(K==='cantor')this.fx.star(B.x+rnd(-14,14),GY-rnd(10,60),0xb8a8ff);else this.fx.shard(B.x+rnd(-14,14),GY,2,80)}if(!c.shk){c.shk=1;this.cam.shake(700,.012);this.sfx(K==='cantor'?'bonfire':'charge',.5)}}
  if(c.t>1.6){B.eyes=Math.min(1,(c.t-1.6)/.3);if(!c.ign){c.ign=1;if(K==='king'){this.explode(B.x,GY-20,false);this.fx.ember(B.x,GY-40,30,2.5);this.flashA=.3}else{this.fx.spark(B.x-3,B.y-29,14,K==='cantor'?0xb8a8ff:C.ice1,90);this.novas.push({dome:1,x:B.x,y:GY,R:110,grow:.45,t:0,m:1.4,harmless:1});this.flashA=.25}}}
  if(c.t>3.8){this.bars=Math.max(0,1-(c.t-3.8)/.4)}
  if(c.t>4.2){this.cine=null;this.bars=0;this.bossState='fight';B.state='walk';B.rise=1;this.cam.startFollow(this.pb,true,.12,0,Math.round(this.camOff),0)}}
 // ---------------- victory card (Tester r1 P1 #6) ----------------
 victoryInput(){}// keys handled by the keydown listener in create() so quick taps are never missed
 victoryOpts(){const V=this.victory;if(this.def.side&&V.phase!=='choose')return['RETURN TO THE ASH SHRINE','RETURN TO TITLE'];if(V.phase==='choose')return['REKINDLE THE FIRST FLAME','LET THE FLAME FADE'];return V.clear?['ONWARD: '+STAGE_DEFS[this.def.next].name,'REST AT THE ASH SHRINE','RETURN TO TITLE']:['APPROACH THE FIRST FLAME','RETURN TO TITLE']}
 victoryTap(p){const V=this.victory;if(V.t<.8)return;const y0=V.phase==='choose'?112:121,i=Math.floor((p.y-y0)/11),n=V.phase==='choose'?2:this.victoryOpts().length;if(i<0||i>=n)return;V.sel=i;this.victoryGo()}
 victoryGo(){const V=this.victory;if(V.gone)return;
  if(this.def.side){V.gone=1;this.cam.fadeOut(500,7,5,15);this.time.delayedCall(520,()=>{if(V.sel===0){Save.write({...this.sv,stage:'shrine',retBonfire:false,bonfire:false,bossDown:false,stain:null,souls:this.souls,time:this.playT});this.scene.restart({fresh:false})}else this.scene.start('title')});return}
  if(!V.clear&&V.phase!=='choose'&&V.sel===0){V.phase='choose';V.sel=0;V.t=.8;this.sfx('chime',.4);return}
  if(V.phase==='choose'){V.gone=1;const kind=V.sel?'fade':'rekindle';this.cam.fadeOut(800,kind==='fade'?2:40,kind==='fade'?2:20,kind==='fade'?6:5);if(NET.host())NET.send({t:'ending',kind});this.time.delayedCall(820,()=>this.scene.start('ending',{kind}));return}
  if(V.clear&&V.sel===1){V.gone=1;this.cam.fadeOut(500,7,5,15);this.time.delayedCall(520,()=>{Save.write({...this.sv,stage:'shrine',hubNext:this.def.next,retBonfire:false,bonfire:false,bossDown:false,stain:null,souls:this.souls,time:this.playT});this.scene.restart({fresh:false})});return}
  if(V.clear&&V.sel===2)V.sel=1;
  V.gone=1;this.cam.fadeOut(500,7,5,15);
  this.time.delayedCall(520,()=>{if(V.sel===0&&V.clear){Save.write({...this.sv,stage:this.def.next,bonfire:false,bossDown:false,stain:null,souls:this.souls,time:this.playT});this.scene.restart({fresh:false})}
   else if(V.sel===0){const s=this.sv;Save.write({stage:'ramparts',bonfire:false,souls:this.souls,bossDown:false,deaths:s.deaths,time:this.playT,ng:this.ng+1,cls:s.cls,stats:s.stats,eq:s.eq,inv:s.inv,picked:s.picked,freed:[],found:[],chDone:[],broken:[],lore:s.lore,endings:s.endings,flaskBonus:s.flaskBonus});this.scene.restart({fresh:false})}else this.scene.start('title')})}
 // ---------------- render ----------------
 render(dt){const g=this.gn,ga=this.ga,cam=this.cam,P=this.player;g.clear();ga.clear();this.lights.length=0;this.bgf(cam.scrollX,cam.scrollY);this.mist.forEach((m,i)=>{m.tilePositionX=cam.scrollX*(.2+i*.05)+this.t*(4+i*3);m.y=Math.round(GY-34-i*36-cam.scrollY*(i?.4:1))});const t=this.t;
  for(const[x,by]of this.braziers){g.fillStyle(0x0d0a1c);g.fillRect(x-1,by-12,3,12);g.fillRect(x-4,by-14,9,2);g.fillRect(x-3,by-12,7,1);g.fillRect(x-3,by-1,7,1);
   glow(ga,x,by-17,22+Math.sin(t*11+x)*1.2,C.f3,.13);glow(ga,x,by-16,8,C.f2,.18);this.light(x,by-16,48+Math.sin(t*13+x)*2,C.f2,.5);
   for(let k=0;k<4;k++){const hy=by-24-k*7-((t*14+k*7)%7);const hx=x+Math.sin(t*5+k*1.7+x)*1.5;ga.fillStyle(0xff9040,.05);ga.fillRect(Math.round(hx)-1,Math.round(hy),3,4)}}
  {const x=this.bonfire.x,lit=this.bonfire.lit;g.fillStyle(0x2a2245);g.fillRect(x-7,GY-2,15,2);g.fillStyle(0x3a3060);g.fillRect(x-5,GY-3,11,1);line(g,x,GY-2,x+2,GY-17,0x8b86a8);line(g,x-2,GY-13,x+4,GY-12,0x8b86a8);px(g,x+2,GY-17,0xd8d0ee);
   glow(ga,x,GY-6,(lit?30:14)+Math.sin(t*9)*1.5,C.f2,lit?.17:.1);this.light(x,GY-8,(lit?74:34)+Math.sin(t*9)*2,C.f2,lit?.75:.35);
   if(Math.abs(P.x-x)<TUNE.restR&&!this.cine&&!P.dead){const bob=Math.floor(t*3)%2,tx=x-11,ty=GY-32-bob;g.fillStyle(0xffe2a8);g.fillRect(tx+2,ty,1,1);g.fillRect(tx+1,ty+1,3,1);g.fillRect(tx,ty+2,5,1);drawText(g,'REST',tx+7,ty-1,0xffe2a8)}}
  if(this.stain){const S=this.stain,sy=S.y||GY,pl=Math.sin(t*5)*.5+.5;glow(ga,S.x,sy-3,6+pl*2,0x5fe0c0,.3);px(ga,S.x,sy-2,0xffffff);px(ga,S.x-1,sy-1,0x9ff0dc);px(ga,S.x+1,sy-1,0x9ff0dc);this.light(S.x,sy-4,26,0x5fe0c0,.5)}
  this.drawStageFX(g,ga);this.drawExplore(g,ga);this.drawStory(g,ga);
  for(const s of this.spells){if(s.t<0)continue;const gt=clamp(s.t/ICEP.grow,0,1);let h=s.h*ease(gt);if(s.t>.6)h*=1-(s.t-.6)/.15;
   glow(ga,s.x,s.gy-h*.4,6+h*.45,C.ice4,.12);glow(ga,s.x,s.gy-3,8+h*.25,C.ice3,.14);drawSpike(ga,g,s.x,s.gy-1,h,ICEP.hw*(s.owner==='b'?1.3:1),gt,s.lean);ga.fillStyle(C.ice2,.7);ga.fillRect(s.x-7,s.gy-1,15,1);for(let k=0;k<3;k++)px(ga,s.x+((k*5+Math.floor(s.t*20))%14)-7,s.gy-2,C.ice1,.8);
   this.light(s.x,s.gy-h*.5,24+h,C.ice3,.55*(s.t>.6?Math.max(0,1-(s.t-.6)/.15):1))}
  // boss tells: ground frost decal showing the reach of the coming attack (Tester r1 P2 #8)
  const B=this.boss;if(B&&this.bossState==='fight'&&B.state==='wind'){const k=clamp(B.t/B.wt,0,1),bl=Math.floor(t*16)%2;
   if(B.next==='slam'){const x0=B.x+B.f*14,x1=B.x+B.f*(20+ICEP.n*ICEP.step);for(let xx=Math.min(x0,x1);xx<=Math.max(x0,x1);xx++){if((xx+Math.floor(t*30))%3===0)px(ga,xx,GY,C.ice1,.4+.5*k);if(xx%2===0&&(Math.abs(xx-x0)<lerp(0,Math.abs(x1-x0),k)))px(ga,xx,GY-1,C.ice2,.6)}}
   else if(B.next==='charge'){for(let i=0;i<8;i++){const ax=B.x+B.f*(14+i*12+((t*60)%12));px(ga,ax,GY-2,C.ice1,k);px(ga,ax-B.f,GY-3,C.ice2,k*.7);px(ga,ax-B.f,GY-1,C.ice2,k*.7)}}
   else{const R=B.phase2?104:92,rx=Math.round(R*1.2);for(let i=0;i<96;i++){const an=i/96*Math.PI*2;if((i+bl)%2)px(ga,B.x+Math.cos(an)*rx*k,GY-1+Math.sin(an)*R*.13,C.ice2,.7)}}}
  for(const n of this.novas){const k=n.t/n.m;
   if(n.dome){const r=n.R*ease(Math.min(1,n.t/n.grow)),a=n.t>n.grow?Math.max(0,1-(n.t-n.grow)/(n.m-n.grow)):1;drawDome(ga,n.x,n.y,r,a,this.t,n.seed||(n.seed=ri(1,999)));this.light(n.x,n.y-r*.4,r*1.5,C.ice3,.7*a)}
   else if(n.fire){glow(ga,n.x,n.y,6+k*16,C.f2,.35*(1-k));this.light(n.x,n.y,56,C.f2,.9*(1-k))}
   else if(n.parry){glow(ga,n.x,n.y,4+k*14,C.f1,.4*(1-k));this.light(n.x,n.y,40,C.f1,.8*(1-k))}
   else if(n.bolt){glow(ga,n.x,n.y-3,8+k*12,C.bolt,.4*(1-k))}}
  for(const o of this.bolts){if(!o.pts)continue;const fade=o.t<.3?1:1-(o.t-.3)/.2;
   const dl=(pts,c,a,off)=>{for(let i=1;i<pts.length;i++)line(ga,pts[i-1][0]+off,pts[i-1][1],pts[i][0]+off,pts[i][1],c,a)};
   const M=o.pts.pts;{const ca=Math.min(1,o.t*8)*fade;for(let xx=Math.round(this.cam.scrollX)-2;xx<this.cam.scrollX+W+2;xx+=1){const cy0=Math.round(this.cam.scrollY),yy=3+Math.round(Math.sin(xx*.21)*1.5+Math.sin(xx*.07+this.t*3)*2);this.gn.fillStyle(0x07050f,.8*ca);this.gn.fillRect(xx,cy0,1,yy);px(ga,xx,cy0+yy,0x6a58c8,.5*ca)}}glow(ga,o.x,o.gy-4,14,C.bolt,.2*fade);dl(M,C.bolt,.6*fade,-1);dl(M,C.bolt,.6*fade,1);dl(M,C.boltC,fade,0);o.pts.br.forEach(s=>dl(s,C.bolt,.8*fade,0));
   this.light(o.x,o.gy-40,130,C.bolt,.9*fade)}
  for(const s of this.shots){if(s.delay>0){const k=1-s.delay/(s.d0||1),gy=this.lv.floorAt(s.x,s.y+4);for(let i=-4;i<=4;i+=2)px(ga,s.x+i,gy-1,s.c==='fire'?C.f2:C.ice1,.3+.6*k*(Math.floor(this.t*16)%2));continue}
   const c0=s.c==='fire'?C.f2:s.c==='note'?0xb8a8ff:C.ice3,c1=s.c==='fire'?C.f1:s.c==='note'?0xe8e0ff:C.ice1,big=s.r>6?1:0;glow(ga,s.x,s.y,6+big*3,c0,.22);ga.fillStyle(c1);ga.fillRect(Math.round(s.x)-1-big,Math.round(s.y)-1-big,3+big*2,3+big*2);px(ga,s.x,s.y,0xffffff);
   if(s.c==='note'){px(ga,s.x+1,s.y-2,c1);px(ga,s.x+1,s.y-3,c1);px(ga,s.x+2,s.y-3,c1)}this.light(s.x,s.y,22+big*8,c0,.5)}
  for(const a of this.arrows){const x=Math.round(a.x),y=Math.round(a.y),d=Math.sign(a.vx);if(a.ls){for(let k=0;k<14;k++)px(ga,x-d*k,y+((k*7+Math.floor(this.t*30))%3)-1,k<3?0xffffff:0xffe08a);g.fillStyle(0xfff4c0);g.fillRect(Math.min(x,x-d*12),y,12,1);glow(ga,x,y,6,0xffd870,.35);this.light(x,y,30,0xffd870,.7);continue}g.fillStyle(0x8a6a4a);g.fillRect(Math.min(x,x-d*6),y,6,1);px(g,x,y,0xd8d0ee);px(g,x-d*6,y-1,0xd8d0ee);px(g,x-d*6,y+1,0xd8d0ee);if(a.pierce){glow(ga,x,y,4,C.f1,.3);px(ga,x+d,y,0xffffff)}}
  for(const it of this.items){const y=Math.round(it.y-4+Math.sin(this.t*3+it.bob)*1.5);g.fillStyle(0x2a2245);g.fillRect(it.x-4,it.y-2,9,2);glow(ga,it.x,y,7+Math.sin(this.t*6+it.bob),0xffe2a8,.2);sparkle(ga,it.x,y,1+(Math.floor(this.t*4+it.bob)%2),0xffe2a8);this.light(it.x,y,26,C.f1,.45)}
  for(const e of this.enemies)this.drawEnemy(g,ga,e);
  if(this.boss)this.drawBoss(g,ga,this.boss);
  this.drawPlayer(g,ga);
  this.fx.draw(ga,g);
  for(let i=this.pops.length-1;i>=0;i--){const p=this.pops[i];p.t+=this.dt||0;if(p.t>.9){this.pops.splice(i,1);continue}drawText(g,p.s,Math.round(p.x-textW(p.s)/2),Math.round(p.y-p.t*14),p.c,1,0x07050f,Math.min(1,(.9-p.t)*4))}
  this.renderLights();
  this.drawHUD()}
 // additive light layer: stepped radial pools that also light the skyline, the ground top and puddle reflections
 renderLights(){const g=this.gl;g.clear();const cx=this.cam.scrollX;
  const cyy=this.cam.scrollY;for(const L of this.lights){if(L.a<=.01||L.x+L.r<cx-10||L.x-L.r>cx+W+10||L.y+L.r<cyy-10||L.y-L.r>cyy+H+10)continue;const x=Math.round(L.x),y=Math.round(L.y);
   for(let i=4;i>=1;i--){g.fillStyle(L.c,L.a*.07*(5-i)/4);g.fillCircle(x,y,Math.round(L.r*i/4))}
   const dy=GY-L.y;if(dy<L.r&&dy>-2&&this.lv.kAt(L.x,GY+2)===K_SOLID){const gr=Math.sqrt(L.r*L.r-dy*dy);for(let i=3;i>=1;i--){const w=Math.round(gr*i/3);g.fillStyle(L.c,L.a*.32*(4-i)/3);g.fillRect(x-w,GY,2*w,1);g.fillStyle(L.c,L.a*.12*(4-i)/3);g.fillRect(x-w,GY+1,2*w,1+i*2)}
    for(const[p,w]of this.puddles){const pc=p+w/2;if(Math.abs(pc-x)<gr){const k=1-Math.abs(pc-x)/gr;g.fillStyle(L.c,L.a*.7*k);g.fillRect(p+2,GY,w-6,1);g.fillStyle(L.c,L.a*.4*k);const rx=Math.round(pc-(x-pc)*.15);g.fillRect(rx-1,GY+1,3,1);g.fillRect(rx,GY+2,1,1)}}}}}
 drawPlayer(g,ga){const P=this.player,x=Math.round(P.x),y=Math.round(P.y),f=P.f,t=this.t;
  if(P.dead){const fr=Math.min(5,Math.floor(P.deadT/.22));if(P.deadT<2)drawHero(g,x,y,f,'death',fr,t,{alpha:fr>=5?Math.max(0,1-(P.deadT-1.1)):1});if(fr>=4&&Math.random()<.3)this.fx.ember(x+rnd(-5,5),y-2,1,.5);return}
  if(P.inv>0&&P.state!=='roll'&&Math.floor(t*30)%2)return;
  glow(ga,x,y-8,14,C.f2,.05);this.light(x,y-8,26,C.f2,.22);heroStyle(this.wp,P.heavy&&P.state==='atk',ARMORS[this.sv.eq.armor]);
  let st=P.state,fr=0;
  if(st==='run')fr=Math.floor(P.run)%6;
  else if(st==='idle')fr=Math.floor(t*2)%2;
  else if(st==='atk'){const m=this.move();fr=P.t<m.h0?0:P.t<m.h1?1:P.t<(m.h1+m.t)/2?2:3}
  else if(st==='roll')fr=Math.min(4,Math.floor(P.t/this.rb().t*5));
  else if(st==='cast')fr=P.t<.1?0:P.t<.2?1:2;
  else if(st==='parry')fr=P.t<TUNE.parryWin?0:1;
  else if(st==='climb')fr=Math.floor(P.run)%2;
  if(P.land>0&&st==='idle')st='rollrec';
  const pf=P.pflash>0;if(pf)P.pflash--;NET.localStyle(this);drawHero(g,x,y,f,st,fr,t,{flash:P.flash>0||pf,combo:P.combo});this._hero={st,fr,hv:P.heavy&&P.state==='atk'};HERO.rim(ga,x,y,f,pf?0xffe2a8:this.def.theme==='cinderdeep'?0x9fe8ff:C.f2,pf?.9:this.def.theme==='cinderdeep'?.7:.32);if(this.def.theme==='cinderdeep'&&!pf)glow(ga,x,y-8,10,0x5fb8ff,.07);if(pf)glow(ga,x,y-8,16,C.f1,.3);NET.draw(this,g,ga);
  if(P.state==='atk'){const m=this.move();if(P.t>=m.h0-.02&&P.t<m.h1+.08){const k=(P.t-m.h0+.02)/(m.h1-m.h0+.1);
    if(m.arc)drawSlash(ga,x+f*2,y-10-(m.spin?0:0),f,k,this.wp===WEAPONS.longsword&&!P.heavy?SLASH:m.arc,P.combo===1);
    else if(m.stab){const L=(m.reach||12)+6,yy=y-9+(P.combo===1?-2:P.combo===2?1:0);for(let i=0;i<L;i++){const a=(1-Math.abs(i/L-k))*.8;if(a>0)px(ga,x+f*(4+i),yy,i>L-4?0xffffff:C.f1,a)}glow(ga,x+f*(4+L*k),yy,4,C.f2,.3)}
    if(m.spin){glow(ga,x,y-9,18,C.f2,.12)}}
   if(P.heavy&&P.t<m.h0){const k=P.t/m.h0;glow(ga,x+f*3,y-14,4+k*6,C.f1,.2+.3*k);if(Math.random()<.4)this.fx.ember(x+f*3,y-14,1,.5)}}
  if(P.state==='cast'){const hx=x+f*7,hy=y-18,c=P.spell==='bolt'?C.bolt:C.ice2;glow(ga,hx,hy,5+Math.sin(t*40),c,.35);px(ga,hx,hy,0xffffff);this.light(hx,hy,30,c,.6)}
  if(P.state==='drink'){glow(ga,x+f,y-18,6,C.f1,.35);this.light(x,y-14,34,C.f1,.6)}
  if(P.state==='parry'&&P.t<TUNE.parryWin){sparkle(ga,x+f*8,y-14,2,C.f0)}
  if(P.state==='rest'){glow(ga,x,y-8,12,C.f1,.15)}}
 drawHollow(g,e,x,y,f,c,s,kn){const X=d=>x+d*f;const ph=e.run||0;const la=Math.sin(ph)*2.5;const H=kn?1:0;
  line(g,X(0),y-5,X(la),y,s);line(g,X(1),y-5,X(1-la),y,c);g.fillStyle(c);g.fillRect(X(0)-(f<0?1:0),y-11-H,2+H,6+H);g.fillRect(X(1)-(f<0?2:0),y-14-H*2,3,3);px(g,X(0),y-12-H,s);
  if(kn){g.fillRect(X(0)-(f<0?2:0),y-16-H*2,3,1)}
  const stg=e.state==='stag';let ang=e.state==='wind'?(e.combo?.9-e.t*3:-2.2+e.t*.3):e.state==='swing'?(e.combo?.9-Math.min(1,e.t/.1)*3:-2.2+Math.min(1,e.t/.1)*2.8):stg?1.4:.9;
  const hx=X(1)+Math.cos(ang)*3*f,hy=y-10+Math.sin(ang)*3;line(g,X(1),y-10,hx,hy,c);line(g,hx,hy,hx+Math.cos(ang)*7*f,hy+Math.sin(ang)*7,s===c?c:0x9a92b8);
  if(kn){const sy=stg?y-6:y-12;g.fillStyle(s===c?c:0x5a587e);g.fillRect(X(3)-(f<0?2:0),sy,3,8);g.fillStyle(s===c?c:0x8a88b8);g.fillRect(X(3)-(f<0?2:0),sy,3,1)}}
 drawEnemy(g,ga,e){const b=e.b,x=Math.round(b.x),y=Math.round(b.body.bottom),f=e.f,X=d=>x+d*f;
  if(e.dead){if(e.deadT<.5&&e.base!=='imp'){const k=e.deadT/.5;g.fillStyle(0x3a3157,1-k);g.fillRect(x-4,y-2,9,2);if(Math.random()<.5)this.fx.ember(x+rnd(-3,3),y-rnd(0,8),1,.5)}return}
  const fl=e.flash>0;
  if(e.base==='hollow'||e.base==='knight'){const kn=e.base==='knight',L=ELOOK[e.k]||{},rim=L.rim||0x3fb0a8;
   for(const[ox,oy]of[[-1,0],[1,0],[0,-1],[0,1]])this.drawHollow(g,e,x+ox,y+oy,f,rim,rim,kn);// cold teal rim (stage-tinted)
   const c=fl?0xffffff:L.c||(kn?0x4f5a80:0x5b4f7a),s=fl?0xffffff:L.s||0x2e2748;this.drawHollow(g,e,x,y,f,c,s,kn);
   if(L.sh&&!fl){g.fillStyle(L.sh);g.fillRect(X(-1)-(f<0?2:0),y-15-(kn?2:0),4,1);if(e.k==='cinderknight'&&Math.random()<.15)this.fx.ember(x,y-14,1,.5)}
   const ec=L.eye||0xff5a3a,ey=e.state==='wind'||e.state==='stag';px(g,X(3),y-13-(kn?2:0),ey?0xffffff:ec);glow(ga,X(3),y-13,ey?5:2,ec,ey?.4:.2);
   if(e.state==='swing'&&e.t<.12)drawSlash(ga,X(1),y-10,f,e.t/.12,{r:10,th:2,sweep:160,trail:1},e.combo===1)}
  else if(e.base==='wraith'){const cy=Math.round(b.y),L=ELOOK[e.k]||{};const c=fl?0xffffff:L.c||0x24407a,l=fl?0xffffff:L.l||0x6fb0ff,gc=L.glow||C.ice4;glow(ga,x,cy+2,12,gc,.16);this.light(x,cy,26,gc,.45);
   if(e.k==='chorister'){g.fillStyle(0xe8ecff);g.fillRect(x-3,cy-9,7,1);px(g,x-3,cy-10,0xe8ecff);px(g,x+3,cy-10,0xe8ecff);const o=Math.sin(this.t*3)*.5+.5;px(ga,x+f*4,cy-6-Math.round(o*4),0xb8a8ff,o)}
   for(let i=0;i<12;i++){const w=Math.round(i<4?i*1.2+1:4+Math.sin(i*.6)*0.5);const wav=i>8?Math.round(Math.sin(this.t*8+i)*1):0;g.fillStyle(c);g.fillRect(x-w+wav,cy-6+i,w*2+1,1);px(g,x-w+wav,cy-6+i,l,.8)}
   for(let k=-3;k<=3;k+=2)px(g,x+k+Math.round(Math.sin(this.t*9+k)),cy+6,c);
   g.fillStyle(0x0a0818);g.fillRect(x-2+f,cy-3,4,3);px(ga,x-1+f,cy-2,0xe8f6ff);px(ga,x+1+f,cy-2,0xe8f6ff);
   if(e.cast>0){const cc=e.k==='wisp'?C.f2:e.k==='chorister'?0xb8a8ff:C.ice2;glow(ga,x+f*6,cy,4+(.4-e.cast)*10,cc,.35);sparkle(ga,x+f*6,cy,2,e.k==='wisp'?C.f0:C.ice1)}}
  else if(e.k==='magmaw'&&e.mst!=='rise'&&e.mst!=='spit'){const bl=Math.sin(this.t*9+(e.x0||0))*.5+.5;g.fillStyle(0x6a1408);g.fillRect(x-5,y-2,11,2);g.fillStyle(fl?0xffffff:0xffa040);g.fillRect(x-3,y-3-Math.round(bl),7,1+Math.round(bl));px(g,x-1+f,y-3,0xfff0a0);glow(ga,x,y-2,7,C.f2,.2);this.light(x,y-2,18,C.f2,.35)}
  else if(e.base==='imp'){const fuse=e.state==='fuse',L=ELOOK[e.k]||{};const c=fl||(fuse&&Math.floor(e.t*20)%2)?0xffffff:L.c||C.f3,l=L.rim?0xffffff:C.f2;const sq=b.body.blocked.down?0:1;
   g.fillStyle(L.rim||0xffb04a,.8);g.fillRect(x-4,y-7-sq,9,7+sq);// orange rim
   g.fillStyle(L.d||0x4a1008);g.fillRect(x-3,y-5-sq,7,5+sq);g.fillStyle(c);g.fillRect(x-3,y-6-sq,7,4+sq);g.fillStyle(l);g.fillRect(x-2,y-6-sq,5,1);px(g,x-1+f,y-4,C.f0);px(g,x+1+f,y-4,C.f0);
   glow(ga,x,y-4,fuse?6+e.t*16:6,C.f2,fuse?.3:.15);this.light(x,y-4,fuse?40:20,C.f2,fuse?.7:.35)}}
 drawBoss(g,ga,B){if(B.kind==='toller')return this.drawToller(g,ga,B);if(B.kind==='cantor')return this.drawCantor(g,ga,B);if(B.kind==='king')return this.drawKing(g,ga,B);return this.drawWarden(g,ga,B)}
 drawWarden(g,ga,B){const x=Math.round(B.x),f=B.f,rise=B.rise===undefined?1:B.rise;const y=Math.round(GY+(1-rise)*40),X=d=>x+d*f;const fl=B.flash>0;if(B.flash>0&&this.dt)B.flash--;
  const c=fl?0xbfe4ff:B.phase2?0x5a7ab8:0x4a4a78,s=fl?0x8fc8f0:0x2a2a50,h=fl?0xffffff:0x9fb8e8;
  glow(ga,x,y-18,40,C.ice4,B.phase2?.14:.09);this.light(x,y-20,56,C.ice3,B.phase2?.45:.3);
  const st=B.state==='walk'?Math.sin(B.step)*2:0;const wind=B.state==='wind',stg=B.state==='stag';const crouch=wind?2:stg?4:0;
  // pale-blue rim
  const rim=(rx,ry,rw,rh)=>{ga.fillStyle(C.ice2,.45);ga.fillRect(rx,ry,rw,1);ga.fillRect(rx,ry+rh-1,rw,1);ga.fillRect(rx,ry,1,rh);ga.fillRect(rx+rw-1,ry,1,rh)};rim(x-8,y-29+crouch,16,18);rim(x-11,y-31+crouch,22,7);rim(x-5,y-37+crouch,10,8);
  g.fillStyle(s);g.fillRect(X(-4+st)-(f<0?3:0),y-12,4,12);g.fillStyle(c);g.fillRect(X(2-st)-(f<0?3:0),y-12,4,12);
  g.fillStyle(c);g.fillRect(x-7,y-28+crouch,14,16);g.fillStyle(s);g.fillRect(x-7,y-14+crouch,14,2);g.fillStyle(h);g.fillRect(x-7,y-28+crouch,14,1);
  g.fillStyle(c);g.fillRect(x-10,y-30+crouch,6,5);g.fillRect(x+4,y-30+crouch,6,5);g.fillStyle(h);g.fillRect(x-10,y-30+crouch,6,1);g.fillRect(x+4,y-30+crouch,6,1);
  g.fillStyle(c);g.fillRect(x-4,y-36+crouch,8,7);g.fillStyle(s);g.fillRect(X(0),y-33+crouch,4*f,2);
  line(g,x-4,y-36+crouch,x-8,y-42+crouch,h);line(g,x+3,y-36+crouch,x+7,y-42+crouch,h);
  for(let i=0;i<14;i++)px(g,X(-8)-Math.round(Math.sin(this.t*4+i*.5)*1),y-28+i+crouch,0x1b1838);
  const ea=B.eyes===undefined?1:B.eyes;if(ea>0){const ef=B.eyeFlash>0;px(ga,X(1),y-32+crouch,0xe8f6ff,ea);px(ga,X(3),y-32+crouch,0xe8f6ff,ea);glow(ga,X(2),y-32+crouch,ef?12:5,ef?0xffffff:C.ice2,(ef?.6:.35)*ea);if(ef)sparkle(ga,X(2),y-32+crouch,4,0xffffff)}
  let ang=stg?1.4:B.state==='wind'?(B.next==='charge'?.1:-1.9):B.state==='slam'?Math.min(1,B.t/.08)*1.3-.2:B.state==='charge'?.05:.9;
  const hx=X(9),hy=y-24+crouch;const ex=hx+Math.cos(ang)*24*f,ey=hy+Math.sin(ang)*24;line(g,hx,hy,ex,ey,C.ice2);line(g,hx+0,hy+1,ex,ey+1,C.ice4);px(ga,ex,ey,0xffffff);glow(ga,(hx+ex)/2,(hy+ey)/2,6,C.ice3,.15);
  if(B.state==='slam'&&B.t<.12)drawSlash(ga,X(9),y-24,f,B.t/.12,{r:22,th:4,sweep:150,trail:1});
  if(rise<1){g.fillStyle(0x352c5e);g.fillRect(x-14,GY,28,40);g.fillStyle(0x4b4078);g.fillRect(x-14,GY,28,1)}}
 drawHUD(){const g=this.gu,ga=this.gua,P=this.player,t=this.t;g.clear();ga.clear();NET.hud(this,g);
  if(this.bars>0){const bh=Math.round(22*this.bars);g.fillStyle(0x05040b);g.fillRect(0,0,W,bh);g.fillRect(0,H-bh,W,bh)}
  if(this.flashA>0){ga.fillStyle(0xd8d0ff,this.flashA);ga.fillRect(0,0,W,H);this.flashA-=this.dt*2.2}
  if(this.flashF>0){ga.fillStyle(0xd8d0ff,.15);ga.fillRect(0,0,W,H);if(!this.paused)this.flashF--}
  const c=this.cine;
  if(c&&c.t>1.9&&c.t<3.9){const a=Math.min(1,(c.t-1.9)/.3)*Math.min(1,(3.9-c.t)/.3);const n=this.def.boss.name,sub=this.def.boss.sub;
   const nc=this.def.boss.kind==='toller'?0xd8f2ff:this.def.boss.kind==='king'?0xffd8a0:this.def.boss.kind==='cantor'?0xe8e0ff:0xd8f2ff;drawText(g,n,Math.round(W/2-textW(n,2)/2),130,nc,2,0x05040b,a);drawText(g,sub,Math.round(W/2-textW(sub)/2),145,0x8a86c0,1,null,a);g.fillStyle(this.def.boss.kind==='king'?C.f2:0x9fd8ff,a);const lw=Math.round(120*Math.min(1,(c.t-1.9)/.6));g.fillRect(W/2-lw/2,141,lw,1)}
  if(!c&&!this.victory){
   const bar=(y,v,m,col,dark,w,fl)=>{g.fillStyle(0x07050f);g.fillRect(4,y-2,w+4,7);g.fillStyle(0x7a5a24);g.fillRect(5,y-1,w+2,1);g.fillRect(5,y+3,w+2,1);g.fillRect(5,y-1,1,5);g.fillRect(w+6,y-1,1,5);
    g.fillStyle(0xd8b060);g.fillRect(5,y-1,1,1);g.fillRect(w+6,y-1,1,1);g.fillRect(5,y+3,1,1);g.fillRect(w+6,y+3,1,1);
    g.fillStyle(fl?0x6a1010:dark);g.fillRect(6,y,w,2+0);g.fillRect(6,y+2,w,1);g.fillStyle(col);g.fillRect(6,y,Math.max(0,Math.round(w*v/m)),2);g.fillStyle(0xffffff,.25);g.fillRect(6,y,Math.max(0,Math.round(w*v/m)),1)};
   bar(6,P.hp,P.hpMax,0xd8402a,0x3a1020,70);bar(12,P.fp,P.fpMax,0x4a8cff,0x14204a,52);bar(18,P.st,P.stMax,0x58c060,0x14341c,60,P.stFlash>0&&Math.floor(t*16)%2===0);
   // flasks (code-drawn)
   for(let i=0;i<TUNE.flaskN;i++){const fx=6+i*8,fy=25,full=i<P.flasks;g.fillStyle(0x07050f);g.fillRect(fx-1,fy-1,7,9);g.fillStyle(0x8a84a8);g.fillRect(fx+2,fy,1,2);g.fillStyle(full?C.f2:0x2a2245);g.fillRect(fx,fy+2,5,5);g.fillStyle(full?C.f0:0x3a3060);g.fillRect(fx+1,fy+3,1,2);if(full)glow(ga,fx+2,fy+4,4,C.f2,.2)}
   {const nF=this.cages.filter(c=>c.freed).length,str=nF+'/'+this.cages.length,ex=34,ey=26;g.fillStyle(0x07050f);g.fillRect(ex-2,ey-2,textW(str)+11,10);g.fillStyle(C.f2);g.fillRect(ex,ey+1,3,4);g.fillStyle(C.f1);g.fillRect(ex+1,ey,1,4);px(g,ex+1,ey-1,C.f0);glow(ga,ex+1,ey+3,4,C.f2,.25);drawText(g,str,ex+6,ey,nF===this.cages.length?0xffe2a8:0xd8d0ee);const lv='LV '+this.lvl;drawText(g,lv,ex+textW(str)+14,ey,0x8a86c0);
   if(this.bells.length){const nb=this.bells.filter(b=>b.rung).length,bs='BELLS '+nb+'/'+this.bells.length,by=ey+10;g.fillStyle(0x07050f);g.fillRect(ex-2,by-2,textW(bs)+4,10);drawText(g,bs,ex,by,nb===this.bells.length?0xffe2a8:0xb8d8ff)}
   {const bf=this.buffs||{};let bx=ex;for(const[k,c,l]of[['guard',0xd8f2ff,'RIME'],['stam',0x9fe86a,'LEAF']])if(bf[k]>0){const s=l+' '+Math.ceil(bf[k]);drawText(g,s,bx,ey+(this.bells.length?20:10),c);bx+=textW(s)+6}}}
   for(const ch of this.chs)if(ch.active){const s2=ch.type==='timer'?ch.name+' '+Math.max(0,ch.t).toFixed(1):ch.name+' - WAVE '+(ch.wave+1)+'/'+ch.waves.length;drawText(g,s2,Math.round(W/2-textW(s2)/2),this.touch?22:8,ch.type==='timer'&&ch.t<3&&Math.floor(t*8)%2?0xd8402a:0xffe2a8)}
   if(P.flaskFlash>0){P.flaskFlash-=this.dt;if(Math.floor(t*16)%2)g.fillStyle(0xd8402a).fillRect(4,34,24,1)}
   const s=String(this.souls),sw=textW(s,2);g.fillStyle(0x07050f,.72);g.fillRect(W-sw-18,3,sw+16,14);g.fillRect(W-sw-17,2,sw+14,16);g.fillStyle(0x9fd8ff);g.fillRect(W-sw-14,7,4,4);g.fillStyle(0xffffff);g.fillRect(W-sw-13,8,2,2);glow(ga,W-sw-12,9,5,C.ice3,.35);drawText(g,s,W-sw-6,5,0xd8d0ee,2);
   if(this.soulPop&&this.soulPop.t>0){const sp=this.soulPop;sp.t-=this.dt;const ps='+'+sp.n;drawText(g,ps,W-textW(ps)-6,19+Math.round((1.4-sp.t)*3),0x9fd8ff,1,0x07050f,Math.min(1,sp.t*2))}
   if(this.stain){const ds=Math.round(this.stain.x-P.x),ss='SOULS '+(ds>0?'>':'<');drawText(g,ss,W-textW(ss)-6,this.soulPop&&this.soulPop.t>0?27:20,0x5fe0c0,1,0x07050f,.6+.4*Math.sin(t*5))}
   const B=this.boss;if(B&&this.bossState==='fight'){const w=this.touch?140:180,x0=(W-w)/2,y0=H-14;drawText(g,this.def.boss.name+(this.ng?' +'+this.ng:''),x0,y0-7,0xd8d0ee);g.fillStyle(0x7a5a24);g.fillRect(x0-2,y0-2,w+4,7);g.fillStyle(0x07050f);g.fillRect(x0-1,y0-1,w+2,5);g.fillStyle(0x2a1020);g.fillRect(x0,y0,w,3);g.fillStyle(0xb8302a);g.fillRect(x0,y0,Math.max(0,Math.round(w*B.hp/B.hpMax)),3);if(B.kind!=='warden'){g.fillStyle(0xd8b060);for(const k of[.66,.33])g.fillRect(x0+Math.round(w*k),y0-1,1,5)}}
   if(this.touch&&!this.paused)this.drawTouch(g)}
  if(this.msg){this.msg.t-=this.paused?0:this.dt;const m=this.msg,a=clamp(m.t*2,0,1);const BS=(this.def.boss||{}).slain;const big=m.s==='EMBER EXTINGUISHED'||m.s===BS;const sc=big?2:1;
   if(big){g.fillStyle(0x05040b,.6*a);g.fillRect(0,78,W,22)}
   drawText(g,m.s,Math.round(W/2-textW(m.s,sc)/2),big?83:40,big?(m.s===BS?0xffe2a8:0xd8402a):0xd8d0ee,sc,0x05040b,a);if(m.t<=0)this.msg=null}
  if(this.menu&&!this.victory)this.drawMenu(g,ga);
  if(this.loreView&&!this.victory)this.drawLore(g,ga);
  if(this.paused)this.drawPause(g);
  if(this.victory)this.drawVictory(g,ga)}
 // r4 P3: level-up / equipment panels are offset so they never cover the HUD bars
 drawMenu(g,ga){const m=this.menu.mode,o=m==='level'?[118,0]:m==='equip'?[74,12]:null;if(o){g.save();g.translateCanvas(o[0],o[1])}try{this.drawMenu0(g,ga)}finally{if(o)g.restore()}}
 drawMenu0(g,ga){const M=this.menu,sv=this.sv,P=this.player;const box=(x,y,w,h)=>{g.fillStyle(0x07050f,.88);g.fillRect(x,y,w,h);g.fillStyle(0x7a5a24);g.fillRect(x,y,w,1);g.fillRect(x,y+h-1,w,1);g.fillRect(x,y,1,h);g.fillRect(x+w-1,y,1,h);g.fillStyle(0xd8b060);[[x,y],[x+w-1,y],[x,y+h-1],[x+w-1,y+h-1]].forEach(([a,b])=>g.fillRect(a,b,1,1))};
  const row=(s,x,y,on,c)=>drawText(g,(on?'> ':'  ')+s,x,y,on?0xffe2a8:(c||0xb8b4d8));const CL=CLASSES[sv.cls];
  if(M.mode==='main'){const O=this.mainOpts(),h=40+O.length*9;box(8,40,140,h);drawText(g,this.def.bonfireName,14,45,0xffb04a);drawText(g,CL.name+'  LEVEL '+this.lvl,14,54,0x8a86c0);
   O.forEach((s,i)=>row(s,14,65+i*9,M.sel===i));drawText(g,'SOULS '+this.souls,14,40+h-9,0x9fd8ff);return}
  if(M.mode==='items'){const L=this.itemList();box(6,14,308,160);drawText(g,'ITEMS AND SPELLS',12,19,0xffb04a);const top=Math.max(0,Math.min(M.sel-4,L.length-8));
   L.slice(top,top+8).forEach(([id,kind],j)=>{const i=top+j;row(itemName(id),12,30+j*9,M.sel===i);drawText(g,kind,104,30+j*9,0x6b67a0)});
   const[id,kind]=L[M.sel]||[];if(id){g.fillStyle(0x7a5a24);g.fillRect(12,104,296,1);drawText(g,itemName(id),12,109,0xffe2a8);(DESC[id]||[]).forEach((s,i)=>drawText(g,s,12,120+i*9,0xd8c8b0,1));const R=MIRACLES[id]?'REQ FTH '+MIRACLES[id].fth+'  FP '+MIRACLES[id].fp+'  KEY '+MIRACLES[id].key:SPELLS[id]?'REQ INT '+SPELLS[id].int+'  FP '+SPELLS[id].fp:WEAPONS[id]?'REQ '+RPG.reqs(WEAPONS[id]):ARMORS[id]?'WEIGHT '+ARMORS[id].w+'  POISE '+ARMORS[id].poise:'';drawText(g,R,150,109,0x8a86c0)}return}
  if(M.mode==='keeper'||M.mode==='talk'||M.mode==='shop'){this.drawKeeperUI(g,ga,M,box,row);return}
  if(M.mode==='level'){const st=M.pend,L=RPG.level(sv.cls,st),d=RPG.derive(st,sv.eq),d0=this.build;box(6,20,190,150);
   drawText(g,'LEVEL UP  '+this.lvl+(L>this.lvl?' > '+L:''),12,25,0xffb04a);drawText(g,'SOULS '+(this.souls-M.spent)+'   NEXT '+RPG.cost(L),12,34,0x9fd8ff);
   STATS.forEach((k,i)=>{const up=st[k]>sv.stats[k];row(STAT_NAMES[k],12,46+i*9,M.sel===i);drawText(g,String(st[k]),104,46+i*9,up?0x58e070:0xd8d0ee);if(M.sel===i)drawText(g,'< >',118,46+i*9,0x6b67a0)});
   row('CONFIRM',12,46+8*9+3,M.sel===8,0xffe2a8);
   const D=[['HP',d0.hp,d.hp],['FP',d0.fp,d.fp],['STAMINA',d0.st,d.st],['LOAD',d0.load,d.load],['ATTACK',(d0.ar*100)|0,(d.ar*100)|0],['SPELL',(d0.spell*100)|0,(d.spell*100)|0]];
   D.forEach(([n,a,b],i)=>{drawText(g,n,140,46+i*9,0x8a86c0);drawText(g,String(b),176,46+i*9,b>a?0x58e070:0xd8d0ee)});return}
  if(M.mode==='equip'){const d=this.build;box(6,20,240,154);drawText(g,'EQUIPMENT',12,25,0xffb04a);
   const W0=WEAPONS[sv.eq.main],W1=WEAPONS[sv.eq.off],A=ARMORS[sv.eq.armor||'none'];
   const L=[['R HAND',W0?W0.name:'-',W0?RPG.letters(W0)+'  REQ '+RPG.reqs(W0)+(RPG.meets(W0,sv.stats)?'':'  WEAK!'):''],['L HAND',W1?W1.name:'EMPTY',W1?'CATALYST  REQ '+RPG.reqs(W1):''],['ARMOR',A.name,'WEIGHT '+A.w+'  POISE '+A.poise+'  ABSORB '+Math.round(A.abs*100)+'%']];
   L.forEach(([a,b,c],i)=>{row(a,12,38+i*22,M.sel===i);drawText(g,'< '+b+' >',60,38+i*22,M.sel===i?0xffe2a8:0xd8d0ee);drawText(g,c,60,46+i*22,0x8a86c0)});
   const rc=d.roll.kind==='LIGHT'?0x58e070:d.roll.kind==='MEDIUM'?0xd8d0ee:d.roll.kind==='HEAVY'?0xffb04a:0xd8402a;
   drawText(g,'LOAD '+d.w+' / '+d.load+'  ('+Math.round(d.ratio*100)+'%)',12,108,0xd8d0ee);drawText(g,'ROLL '+d.roll.kind,12,117,rc);drawText(g,'ATTACK '+Math.round(d.ar*100)+'   SPELL '+Math.round(d.spell*100)+'   POISE '+d.poise,12,126,0xd8d0ee);
   {const id=[sv.eq.main,sv.eq.off,sv.eq.armor||'none'][M.sel];(DESC[id]||[]).slice(0,3).forEach((s,i)=>drawText(g,s,12,148+i*8,0xa89878))}
   drawText(g,'MOVESET: '+({sword:'2-HIT SLASH, OVERHEAD HEAVY',greatsword:'WIDE CLEAVE, LEAPING SLAM',dagger:'3-STAB FLURRY, LUNGE',spear:'LONG THRUST, CHARGE',axe:'CHOP, SPIN HEAVY',bow:'ARROW, CHARGED PIERCE',staff:'POKE, BASH, CASTS SPELLS'})[W0?W0.type:'dagger'],12,138,0x8a86c0)}}
 // ---------------- milestone E: hub, keeper, merchant, lore, miracles ----------------
 mainOpts(){const o=['LEVEL UP','EQUIPMENT','ITEMS AND SPELLS'];if(!this.def.hub&&this.sv.lords.length)o.push('TRAVEL TO THE SHRINE');o.push('LEAVE');return o}
 itemList(){const sv=this.sv,o=[];sv.inv.filter(i=>WEAPONS[i]).forEach(i=>o.push([i,WEAPONS[i].hand==='off'?'OFF HAND':'WEAPON']));sv.inv.filter(i=>ARMORS[i]).forEach(i=>o.push([i,'ARMOR']));
  Object.keys(SPELLS).forEach(i=>o.push([i,'SORCERY']));Object.keys(MIRACLES).filter(i=>sv.inv.includes(i)).forEach(i=>o.push([i,'MIRACLE']));o.push(['flask','x'+(TUNE.flaskN+(sv.flaskBonus||0))]);return o}
 shopList(){const sv=this.sv;return SHOP.filter(([id])=>id==='flask'?(sv.flaskBonus||0)<2:!sv.inv.includes(id))}
 keeperLines(){const sv=this.sv,B=KEEPER.bell,L=KEEPER.lines[this.keeperTier()];return[...L,...(sv.lords.includes('toller')?B.slain:sv.lords.includes('cantor')?B.open:B.sealed)]}
 keeperTier(){const sv=this.sv;return sv.endings.length?3:Math.min(2,sv.lords.length)}
 travel(to,ret){const sv=this.sv;this.menu=null;this.cam.fadeOut(500,7,5,15);this.physics.pause();this.travelling=1;
  const side=this.def.side,extra=to==='shrine'?{hubNext:side?sv.hubNext:ret.next,retBonfire:side?!!sv.retBonfire:!!ret.bonfire,bonfire:false}:STAGE_DEFS[to].side?{bonfire:false}:{bonfire:!!sv.retBonfire,retBonfire:false};
  this.time.delayedCall(520,()=>{Save.write({...sv,...extra,stage:to,bossDown:STAGE_DEFS[to].side?sv.lords.includes(STAGE_DEFS[to].boss.kind):false,stain:null,souls:this.souls,time:this.playT});this.scene.restart({fresh:false})})}
 interact(){const P=this.player,D=this.def,near=(x,r=14)=>Math.abs(P.x-x)<r;
  for(const c of this.chests)if(c.st==='shut'&&near(c.x,14)&&Math.abs(P.y-c.y)<16){this.openChest(c);return true}
  if(D.stair&&near(D.stair.x,18)){if(!this.sv.lords.includes('cantor')&&!Q.has('stairopen')){this.say('THE FROZEN STAIR IS SEALED BY RIME',2);this.sfx('clang',.3);return true}
   if(NET.guest()){this.pop('THE HOST LEADS THE WAY',P.x,P.y-26,0x9ff0dc);return true}this.say('CLIMBING THE FROZEN STAIR',1.5);this.sfx('bell',.4);this.travel('belltower');return true}
  for(const l of this.lore)if(near(l.x,12)&&Math.abs(P.y-l.y)<20){this.loreView={id:l.id,t:0};if(!l.read){l.read=true;this.sv.lore.push(l.id);Save.write(this.sv);this.pop('LORE '+this.sv.lore.length+'/'+Object.keys(LORE).length,l.x,l.y-30,0xffb04a)}this.sfx('chime',.25);this.stats.loreRead=(this.stats.loreRead||0)+1;return true}
  if(D.hub&&near(D.keeper,18)){this.menu={mode:'keeper',sel:0,t:0,prev:{}};P.f=Math.sign(D.keeper-P.x)||1;this.pb.setVelocityX(0);this.sfx('talk',.3);return true}
  if(D.hub&&near(D.exit,16)&&NET.guest()){this.pop('THE HOST LEADS THE WAY',P.x,P.y-26,0x9ff0dc);return true}
  if(D.hub&&near(D.exit,16)){const to=this.sv.hubNext&&STAGE_DEFS[this.sv.hubNext]?this.sv.hubNext:'ramparts';this.say('TRAVELLING TO '+STAGE_DEFS[to].name,1.5);this.travel(to);return true}
  return false}
 touchMir(){const inv=this.sv.inv,P=this.player;if(inv.includes('heal')&&P.hp<P.hpMax*.5)return'heal';if(inv.includes('lspear'))return'lspear';if(inv.includes('heal'))return'heal';return inv.includes('blessed')?'blessed':'heal'}
 canMir(k){const P=this.player,M=MIRACLES[k],st=this.sv.stats;
  if(!this.build.tal){this.pop('NO TALISMAN',P.x,P.y-24,0xd8402a);return false}
  if(!this.sv.inv.includes(k)){this.pop(M.name+' NOT LEARNED',P.x,P.y-24,0xd8402a);return false}
  if(st.fth<M.fth){this.pop('NEED FTH '+M.fth,P.x,P.y-24,0xd8402a);return false}
  if(!RPG.meets(this.build.tal,st)){this.pop('FAITH TOO WEAK FOR TALISMAN',P.x,P.y-24,0xd8402a);return false}
  if(P.fp<M.fp){this.pop('NOT ENOUGH FP',P.x,P.y-24,0xd8402a);return false}return true}
 castMiracle(k){const P=this.player,mm=this.build.mir;
  if(k==='heal'){const amt=Math.round(40*mm);P.hp=Math.min(P.hpMax,P.hp+amt);this.pop('+'+amt,P.x,P.y-26,0x9ff0a0);this.sfx('heal',.45);for(let i=0;i<24;i++)this.fx.spark(P.x+rnd(-10,10),P.y-rnd(0,20),1,0xffe8a0,30);this.novas.push({x:P.x,y:P.y-8,t:0,m:.5,parry:1});this.lastHeal=amt}
  if(k==='lspear'){this.arrows.push({x:P.x+P.f*8,y:P.y-11,vx:P.f*340,vy:0,t:0,dmg:2.2*mm,pierce:1,hit:[],ls:1});this.sfx('thunder',.45);this.cam.shake(90,.006);this.fx.spark(P.x+P.f*8,P.y-11,10,0xffe08a,90);this.flashF=1}
  if(k==='blessed'){P.bless=MIRACLES.blessed.dur;P.blessMul=1+.3*mm;this.sfx('buff',.45);this.say('WEAPON BLESSED',1.6);for(let i=0;i<20;i++)this.fx.spark(P.x+P.f*rnd(2,14),P.y-rnd(4,18),1,0xffe8a0,40)}}
 // world-space story props: lore stones, the keeper, the shrine exit arch
 drawStory(g,ga){const t=this.t,D=this.def,P=this.player;
  for(const l of this.lore){const x=Math.round(l.x),y=l.y,pl=Math.sin(t*3+x)*.5+.5;g.fillStyle(0x2a2436);g.fillRect(x-4,y-11,9,11);g.fillRect(x-3,y-12,7,1);g.fillStyle(0x3e3650);g.fillRect(x-4,y-11,1,11);
   const c=l.read?0x7a5a40:0xffb04a;for(let k=0;k<3;k++){px(g,x-1+(k%2)*2,y-9+k*3,c);px(g,x+(k%2?-1:1),y-8+k*3,c)}if(!l.read)glow(ga,x,y-6,6+pl*2,C.f2,.18);
   if(Math.abs(P.x-x)<12&&Math.abs(P.y-y)<20&&!this.loreView)drawText(g,'^ READ',x-11,y-22,0xffe2a8)}
  if(D.hub){const kx=D.keeper,bob=Math.round(Math.sin(t*1.6)),y=GY;// the Ash Keeper: hooded, kneeling beside a lantern
   g.fillStyle(0x1a1420);g.fillRect(kx-6,y-16+bob,12,16-bob);g.fillRect(kx-5,y-20+bob,10,4);g.fillRect(kx-4,y-23+bob,8,3);g.fillStyle(0x3a2e3e);g.fillRect(kx-6,y-16+bob,1,16-bob);g.fillRect(kx-5,y-20+bob,1,4);
   g.fillStyle(0x5a4a58);g.fillRect(kx-3,y-21+bob,6,1);g.fillStyle(0x07050f);g.fillRect(kx-2,y-20+bob,4,3);px(g,kx-1,y-19+bob,0xffb04a);px(g,kx+1,y-19+bob,0xffb04a);
   g.fillStyle(0xb8a898);g.fillRect(kx-7,y-10+bob,2,2);// hand
   const lx=kx-11,ly=y-4;g.fillStyle(0x3a2e2a);g.fillRect(lx-2,ly-5,5,6);g.fillStyle(0xffd070);g.fillRect(lx-1,ly-4,3,4);glow(ga,lx,ly-2,10+Math.sin(t*7),C.f2,.22);this.light(lx,ly-2,40,C.f2,.7);
   if(Math.abs(P.x-kx)<18&&!this.menu)drawText(g,'^ SPEAK',kx-13,y-34,0xffe2a8);
   if(D.stair){const sx=D.stair.x,open=this.sv.lords.includes('cantor')||Q.has('stairopen');// milestone G: the Frozen Stair to the bell tower
    for(let i=0;i<6;i++){g.fillStyle(i%2?0x3a4a66:0x2e3c58);g.fillRect(sx-12+i*3,GY-6-i*6,22-i*3,6);g.fillStyle(0xd8f2ff);g.fillRect(sx-12+i*3,GY-6-i*6,22-i*3,1)}
    for(let i=0;i<5;i++){const ix=sx-10+i*5,l=3+((i*7)%4);g.fillStyle(0xb8d8ff);g.fillRect(ix,GY-42,1,l);px(g,ix,GY-42+l,0xffffff)}
    if(!open){g.fillStyle(0x9fc8f0,.55);g.fillRect(sx-12,GY-40,24,40);for(let y=GY-38;y<GY;y+=5)px(ga,sx-10+((y*7)%20),y,0xffffff,.6)}else{glow(ga,sx,GY-30,16,0x9fd8ff,.12+.04*Math.sin(t*3));if(Math.random()<.2)this.fx.snow(sx+rnd(-10,10),GY-44)}
    if(Math.abs(P.x-sx)<30)drawText(g,open?'^ THE FROZEN BELL TOWER':'THE FROZEN STAIR - SEALED',Math.max(2,Math.round(sx-textW(open?'^ THE FROZEN BELL TOWER':'THE FROZEN STAIR - SEALED')/2)),GY-58,open?0xb8e0ff:0x7a86a8)}
   const ex=D.exit;// exit arch with a pale mist portal to the next road
   g.fillStyle(0x2a2232);g.fillRect(ex-14,GY-40,5,40);g.fillRect(ex+10,GY-40,5,40);for(let a=0;a<=12;a++){const an=Math.PI*a/12;g.fillRect(Math.round(ex-Math.cos(an)*12)-2,Math.round(GY-40-Math.sin(an)*10),5,3)}
   for(let yy=GY-46;yy<GY;yy+=2){const w=Math.round(9*Math.sqrt(Math.max(0,1-Math.pow((GY-yy-20)/26,2))));ga.fillStyle(0x8a9cff,.08+.04*Math.sin(t*4+yy*.3));ga.fillRect(ex-w,yy,2*w+1,2)}
   const nx=this.sv.hubNext&&STAGE_DEFS[this.sv.hubNext]?this.sv.hubNext:'ramparts',nm=STAGE_DEFS[nx].name;if(Math.abs(P.x-ex)<40)drawText(g,'^ '+nm,Math.round(ex-textW('^ '+nm)/2),GY-58,0xb8c4ff);
   // broken statue of the first lord behind the bonfire
   g.fillStyle(0x14101a);g.fillRect(136,GY-70,22,70);g.fillRect(132,GY-78,30,8);g.fillRect(140,GY-92,14,14);g.fillStyle(0x221c2a);g.fillRect(136,GY-70,2,70)}}
 drawLore(g,ga){const V=this.loreView,L=LORE[V.id]||[],a=Math.min(1,V.t/.25),h=26+L.length*9;g.fillStyle(0x05040b,.86*a);g.fillRect(24,40,272,h);g.fillStyle(0x7a5a24,a);g.fillRect(24,40,272,1);g.fillRect(24,40+h-1,272,1);
  drawText(g,'AN ENGRAVED STONE',30,45,0xffb04a,1,null,a);L.forEach((s,i)=>drawText(g,s,30,57+i*9,0xd8c8b0,1,null,a));drawText(g,'UP / X  CLOSE',226,40+h-9,0x6b67a0,1,null,a)}
 drawKeeperUI(g,ga,M,box,row){const sv=this.sv;
  if(M.mode==='keeper'){box(8,40,128,58);drawText(g,KEEPER.name,14,45,0xd8c8b0);['TALK','BUY','LEAVE'].forEach((s,i)=>row(s,14,58+i*9,M.sel===i));drawText(g,'SOULS '+this.souls,14,89,0x9fd8ff);return}
  if(M.mode==='talk'){const L=this.keeperLines(),s=L[Math.min(M.page,L.length-1)],n=Math.floor(M.t*45);box(10,126,300,46);drawText(g,KEEPER.name,16,131,0xffb04a);drawText(g,s.slice(0,n),16,144,0xd8d0ee);
   if(n>=s.length&&Math.sin(this.t*8)>0)drawText(g,'>',300,162,0xffe2a8);drawText(g,(M.page+1)+'/'+L.length,16,162,0x6b67a0);return}
  if(M.mode==='shop'){const L=this.shopList();box(6,14,308,160);drawText(g,KEEPER.name+' - WARES',12,19,0xffb04a);drawText(g,'SOULS '+this.souls,230,19,0x9fd8ff);
   L.forEach(([id,price],i)=>{row(itemName(id),12,32+i*9,M.sel===i,this.souls>=price?0xb8b4d8:0x6b4a4a);drawText(g,String(price),112,32+i*9,this.souls>=price?0x9fd8ff:0x6b4a4a)});row('LEAVE',12,32+L.length*9,M.sel===L.length);
   const it=L[M.sel];if(it){g.fillStyle(0x7a5a24);g.fillRect(140,30,1,94);(DESC[it[0]]||[]).forEach((s,i)=>drawText(g,s,12,127+i*8,0xd8c8b0));const m=MIRACLES[it[0]],wp=WEAPONS[it[0]],am=ARMORS[it[0]];drawText(g,m?'MIRACLE':wp?(wp.hand==='off'?'OFF HAND':'WEAPON'):am?'ARMOR':'',146,32,0xffe2a8);const info=m?['REQ FTH '+m.fth,'FP '+m.fp,'KEY '+m.key]:wp?['REQ '+RPG.reqs(wp),RPG.letters(wp)||(wp.mir?'POWERS MIRACLES':'CASTS SORCERY'),'WEIGHT '+wp.w]:am?['WEIGHT '+am.w,'POISE '+am.poise,'ABSORB '+Math.round(am.abs*100)+'%']:['ONE MORE FLASK','AT EVERY REST'];info.forEach((s,i)=>drawText(g,s,146,44+i*9,0x8a86c0))}
   drawText(g,M.say||'',12,160,0xd8c8b0)}}
 drawTouch(g){const h=this.tHeld||{};for(const b of TBTN){const on=h[b.k];g.fillStyle(on?0xffb04a:0x8a86c0,on?.45:.18);g.fillCircle(b.x,b.y,b.r);g.lineStyle(1,on?0xffe2a8:0x8a86c0,on?.9:.45);g.strokeCircle(b.x,b.y,b.r);
  drawText(g,b.lab,Math.round(b.x-textW(b.lab)/2),b.y-2,on?0xffffff:0xd8d0ee,1,null,on?1:.7)}}
 drawPause(g){g.fillStyle(0x05040b,.82);g.fillRect(0,0,W,H);drawText(g,'PAUSED',Math.round(W/2-textW('PAUSED',2)/2),22,0xffe2a8,2);
  const L=['ARROWS  MOVE','Z / SPACE  JUMP','X  ATTACK (TAP AGAIN: COMBO)','C  ROLL','A / SHIFT+X  PARRY','Q / F  DRINK FLASK   W  HEAVY ATTACK','V  FROST SPIKES   S  STORM   D  DOME','UP / E  REST AT BONFIRE','M  SOUND '+(this.sound.mute?'OFF':'ON'),'ESC / P  RESUME'];
  L.forEach((s,i)=>drawText(g,s,70,46+i*10,i===8?0x9fd8ff:0xd8d0ee))}
 drawVictory(g,ga){const V=this.victory,a=Math.min(1,V.t/.6);g.fillStyle(0x05040b,.78*a);g.fillRect(0,0,W,H);
  g.fillStyle(0x7a5a24,a);g.fillRect(60,30,200,1);g.fillRect(60,150,200,1);
  const hd=V.clear?'STAGE CLEAR':'VICTORY ACHIEVED';drawText(g,hd,Math.round(W/2-textW(hd,2)/2),40,0xffe2a8,2,0x1a0d22,a);glow(ga,W/2,46,50,C.f2,.08*a);
  const sub=this.def.boss.card||'THE FROST WARDEN IS ASH. THE GATE STANDS OPEN.';drawText(g,sub,Math.round(W/2-textW(sub)/2),60,0x8a86c0,1,null,a);
  const fmt=v=>{v=Math.floor(v);return`${Math.floor(v/60)}:${String(v%60).padStart(2,'0')}`},ts=`TIME ${fmt(this.playT)}   BEST ${fmt(this.best||this.playT)}${this.bestNew?' NEW!':''}`;
  [[ts,72],['DEATHS '+this.sv.deaths,81],['SOULS '+this.souls,90],['EMBERS FREED '+this.cages.filter(c=>c.freed).length+'/'+this.cages.length+(this.ng?' (NG+'+this.ng+')':''),99],['HIDDEN ROOMS '+this.covers.filter(c=>c.found).length+'/'+this.covers.length,108]].forEach(([s,y])=>drawText(g,s,Math.round(W/2-textW(s)/2),y,0xd8d0ee,1,null,a));
  if(V.phase==='choose'){g.fillStyle(0x05040b,1);g.fillRect(0,0,W,H);const k=Math.min(1,(V.t-.8)/.6);glow(ga,W/2,70,30+Math.sin(this.t*3)*3,V.sel?0x5f6cff:C.f2,.18*k);{const fh=V.sel?4+Math.sin(this.t*4)*1:12+Math.sin(this.t*11)*2;for(let yy=0;yy<fh;yy++){const w=Math.round((1-yy/fh)*4);g.fillStyle(yy<fh*.3?0xffe2a8:V.sel?0x7a86ff:C.f2,k);g.fillRect(W/2-w,78-yy,2*w+1,1)}g.fillStyle(0x2a2245,k);g.fillRect(W/2-10,78,21,3)}
   drawText(g,'THE FIRST FLAME',Math.round(W/2-textW('THE FIRST FLAME',2)/2),22,0xffe2a8,2,0x1a0d22,k);const L=['THE LAST LORD IS ASH. BEFORE YOU, THE FIRST FLAME','GUTTERS IN ITS KILN. IT WILL TAKE YOU, IF YOU OFFER.'];L.forEach((s,i)=>drawText(g,s,Math.round(W/2-textW(s)/2),40+i*9,0x8a86c0,1,null,k));
   this.victoryOpts().forEach((s,i)=>{const sel=V.sel===i,str=(sel?'> ':'  ')+s;drawText(g,str,Math.round(W/2-textW(str)/2),114+i*11,sel?(i?0x9fb8ff:0xffb04a):0x6b67a0,1,null,k)});
   const d=V.sel?'LET THE AGE OF FIRE END. WHAT COMES AFTER IS NOT YOURS TO KNOW.':'GIVE YOURSELF TO THE FLAME. THE AGE OF FIRE BURNS ON, FOR A TIME.';drawText(g,d,Math.round(W/2-textW(d)/2),146,0xd8d0ee,1,null,k);return}
  if(V.t>.8){const o=this.victoryOpts();o.forEach((s,i)=>{const sel=V.sel===i,str=(sel?'> ':'  ')+s;drawText(g,str,Math.round(W/2-textW(str)/2),124+i*11,sel?0xffe2a8:0x6b67a0)})}}}
// ---------------- milestone E: endings (rekindle / fade), each a short code-drawn cinematic + end card ----------------
const ENDINGS={rekindle:{title:'TO LINK THE FIRST FLAME',lines:['THE ASHEN ONE KNELT BEFORE THE FIRST FLAME,','AND GAVE IT EVERYTHING THAT WAS LEFT.','THE AGE OF FIRE BURNS ON. FOR A TIME.'],col:0xffb04a},
 fade:{title:'THE AGE OF DARK',lines:['THE ASHEN ONE TURNED FROM THE FIRST FLAME','AND LET IT GUTTER INTO NOTHING.','IN THE DARK, SMALL LIGHTS BEGAN TO STIR.'],col:0x9fb8ff}};
class Ending extends Phaser.Scene{constructor(){super('ending')}
 init(d){this.kind=d&&ENDINGS[d.kind]?d.kind:'rekindle'}
 create(){Object.assign(C,BASEPAL);const sv=Save.load()||{};this.sv=sv;sv.endings=sv.endings||[];if(!sv.endings.includes(this.kind))sv.endings.push(this.kind);sv.lastEnding=this.kind;Save.write(sv);this.lines=[...ENDINGS[this.kind].lines,...((sv.lords||[]).includes('toller')?[BELL_ENDING[this.kind]]:[])];
  this.fx=new FX(this);this.gn=this.add.graphics().setDepth(4);this.ga=this.add.graphics().setDepth(5).setBlendMode(Phaser.BlendModes.ADD);this.gt=this.add.graphics().setDepth(6);
  this.t=0;this.card=null;this.sel=0;heroStyle(WEAPONS[(sv.eq||{}).main],false,ARMORS[(sv.eq||{}).armor]);this.stars=[...Array(70)].map((_,i)=>[(i*73)%W,(i*41)%110,(i%5)/5]);
  this.cameras.main.fadeIn(900,this.kind==='fade'?2:40,this.kind==='fade'?2:20,this.kind==='fade'?6:5);try{this.sound.play(this.kind==='fade'?'chime':'fanfare',{volume:.4})}catch(e){}
  this.input.keyboard.on('keydown',e=>this.key(e.key));this.input.on('pointerdown',p=>{if(!this.card)return this.key('Enter');const i=Math.floor((p.y-136)/11);if(i===0||i===1){this.sel=i;this.key('Enter')}})}
 key(k){if(this.gone)return;const ok=k==='Enter'||k===' '||k==='z'||k==='Z';
  if(!this.card){if(ok){if(this.t>.15)this.showCard();else this.skipQ=1}return}
  if(this.card.t<.3)return;if(k==='ArrowUp'||k==='ArrowDown')this.sel^=1;
  if(ok){this.gone=1;this.cameras.main.fadeOut(500,7,5,15);this.time.delayedCall(520,()=>{if(this.sel===0){const s=this.sv;
    Save.write({stage:'ramparts',bonfire:false,souls:s.souls||0,bossDown:false,deaths:s.deaths||0,time:s.time||0,ng:(s.ng||0)+1,cls:s.cls,stats:s.stats,eq:s.eq,inv:s.inv,picked:s.picked,freed:[],found:[],chDone:[],broken:[],lore:s.lore,endings:s.endings,flaskBonus:s.flaskBonus,lords:[]});this.scene.start('stage',{fresh:false})}
   else this.scene.start('title')})}}
 showCard(){this.card={t:0};try{this.sound.play('chime',{volume:.35})}catch(e){}}
 update(_,d){if(this.skipQ&&!this.card&&this.t>.15){this.skipQ=0;this.showCard()}const dt=Math.min(d,50)/1000;this.t+=dt;const t=this.t,g=this.gn,ga=this.ga,gt=this.gt,R=this.kind==='rekindle',E=ENDINGS[this.kind];g.clear();ga.clear();gt.clear();
  if(!this.card&&t>11)this.showCard();if(this.card)this.card.t+=dt;
  // sky: rekindle warms to amber, fade cools to starlit black
  const k=clamp((t-4)/4,0,1);const sky=R?[0x0b081d,0x3a1406,0x8a3a10]:[0x0b081d,0x05040c,0x020206];for(let y=0;y<H;y+=4){const c=y<60?sky[0]:y<120?sky[1]:sky[2];g.fillStyle(c,R?.4+.6*k:1);g.fillRect(0,y,W,4)}
  if(!R)for(const[x,y,b]of this.stars){const a=clamp(k*1.2-b*.3,0,1)*(.6+.4*Math.sin(t*2+x));if(a>0)px(ga,x,y,b>.6?0x9fb8ff:0xd8d0ee,a)}
  g.fillStyle(0x07050f);g.fillRect(0,GY,W,H-GY);g.fillStyle(0x1a1430);g.fillRect(0,GY,W,1);
  // the kiln of the first flame
  const fx0=200;g.fillStyle(0x14101e);g.fillRect(fx0-26,GY-6,52,6);g.fillRect(fx0-18,GY-10,36,4);for(let i=0;i<5;i++)g.fillRect(fx0-40+i*20,GY-60+Math.abs(i-2)*10,4,60-Math.abs(i-2)*10);
  const walk=clamp(t/3.2,0,1),hx=Math.round(lerp(30,fx0-14,walk)),kneel=t>3.4;
  let fh=R?10+Math.sin(t*9)*2+(t>4.2?ease(clamp((t-4.2)/2.5,0,1))*70:0):Math.max(0,(10+Math.sin(t*6)*1.5)*(1-clamp((t-4)/3.5,0,1)));
  for(let yy=0;yy<fh;yy++){const w=Math.round((1-yy/fh)*(R?6+fh*.18:5));g.fillStyle(yy<fh*.25?0xffe2a8:yy<fh*.6?C.f1:C.f2);g.fillRect(fx0-w,GY-10-yy,2*w+1,1)}
  if(fh>0){glow(ga,fx0,GY-14-fh*.3,14+fh*.8,C.f2,R?.22+.2*k:.18);if(Math.random()<(R?.9:.3))this.fx.ember(fx0+rnd(-6,6),GY-12-rnd(0,fh*.6),R&&t>4.2?3:1,R?1.6:.6)}
  if(!R&&t>7.4){const ex=fx0-8+Math.sin(t*1.3)*2,ey=GY-22-Math.min(14,(t-7.4)*4);glow(ga,ex,ey,5,C.f2,.35);px(ga,ex,ey,0xffe2a8)}// the last ember, cupped
  // the ashen one: walks in, kneels; rekindle: becomes embers; fade: stands, the ember rising from their hands
  const dissolve=R?clamp((t-6.2)/2.5,0,1):0;if(dissolve<1)drawHero(g,hx,GY,1,kneel?'rest':'run',Math.floor(t*10)%6,t,{alpha:1-dissolve});
  if(R&&t>6.2&&t<9.5)for(let i=0;i<3;i++)this.fx.ember(hx+rnd(-5,5),GY-rnd(2,18),1,1.4);
  if(R&&t>5.5){ga.fillStyle(0xffb04a,clamp((t-5.5)/3,0,.55)*(this.card?.6:1));ga.fillRect(0,0,W,H)}
  this.fx.update(dt);this.fx.draw(ga,g);
  // narration
  (this.lines||E.lines).forEach((s,i)=>{const a=clamp((t-1.2-i*2.6)/.6,0,1)*(this.card?0:1);if(a>0)drawText(gt,s,Math.round(W/2-textW(s)/2),18+i*10,0xd8d0ee,1,0x05040b,a)});
  if(!this.card&&t>1)drawText(gt,'ENTER  SKIP',W-textW('ENTER  SKIP')-6,H-10,0x6b67a0,1,null,.7);
  if(this.card){const a=clamp(this.card.t/.6,0,1),s=this.sv;gt.fillStyle(0x05040b,.8*a);gt.fillRect(0,0,W,H);gt.fillStyle(0x7a5a24,a);gt.fillRect(50,40,220,1);gt.fillRect(50,156,220,1);
   drawText(gt,'ENDING',Math.round(W/2-textW('ENDING')/2),48,0x8a86c0,1,null,a);drawText(gt,E.title,Math.round(W/2-textW(E.title,2)/2),60,E.col,2,0x1a0d22,a);
   const fmt=v=>{v=Math.floor(v||0);return`${Math.floor(v/60)}:${String(v%60).padStart(2,'0')}`};const cls=CLASSES[s.cls]?CLASSES[s.cls].name:'ASHEN ONE';
   [[cls+'  LEVEL '+(CLASSES[s.cls]&&s.stats?RPG.level(s.cls,s.stats):'-')+(s.ng?'  NG+'+s.ng:''),84],['TIME '+fmt(s.time)+'   DEATHS '+(s.deaths||0),94],['LORE FOUND '+(s.lore||[]).length+'/'+Object.keys(LORE).length+'   ENDINGS SEEN '+s.endings.length+'/2',104],[R?'THE FIRE BURNS. THE WHEEL TURNS.':'THE DARK IS NOT EMPTY.',118]].forEach(([q,y])=>drawText(gt,q,Math.round(W/2-textW(q)/2),y,0xd8d0ee,1,null,a));
   if(this.card.t>.3)['JOURNEY ON (NG+'+((s.ng||0)+1)+')','RETURN TO TITLE'].forEach((q,i)=>{const on=this.sel===i,str=(on?'> ':'  ')+q;drawText(gt,str,Math.round(W/2-textW(str)/2),138+i*11,on?0xffe2a8:0x6b67a0,1,null,a)})}}}
// ===================================================================
window.__G=new Phaser.Game({type:Phaser.AUTO,width:W,height:H,pixelArt:true,roundPixels:true,backgroundColor:'#0b081d',parent:document.body,
 scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},physics:{default:'arcade',arcade:{gravity:{y:800}}},
 fps:{target:60},audio:{noAudio:Q.has('mute')},scene:[Boot,Title,Lab,Stage,Ending]});
