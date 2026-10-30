// ASHEN VIGIL — vertical slice. All art & VFX drawn in code (pixel-snapped), original content.
// TODO (later passes, see game_design.md): Pale Choir (frozen) + Cinderdeep (burning) stages, 8 DS3-style classes,
// leveling at bonfires, weapons/armor/catalyst inventory, PeerJS host/join co-op, 3 save slots, more bosses.
'use strict';
const W=320,H=180,GY=156,WORLD=3360,ARENA_L=2980,ARENA_R=3340;
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
   for(let wy=top+5;wy<GY-4;wy+=4)for(let wx=xx+2;wx<xx+bw-2;wx+=3){const v=R();if(v<.3){x.fillStyle=v<.06?C.farW2:C.farW;x.fillRect(wx,wy,1,2)}}
   xx+=bw+Math.floor(R()*6)-2}
  // horizon haze: 2 stepped tones (Tester r1 visual: depth)
  x.fillStyle='rgba(30,24,66,.55)';x.fillRect(0,GY-26,w,12);x.fillStyle='rgba(38,30,80,.65)';x.fillRect(0,GY-14,w,14)}));
 // near layer: cathedral facades, buttresses, rose windows, darker
 T.addCanvas('near',makeCanvas(800,H,(x,w)=>{const R=seedRand(9);let xx=0;
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
 T.addCanvas('ground',makeCanvas(96,24,(x)=>{for(let v=0;v<3;v++){const o=v*32;x.fillStyle=C.g1;x.fillRect(o,0,32,24);x.fillStyle=C.gTop;x.fillRect(o,0,32,1);x.fillStyle=C.g2;x.fillRect(o,1,32,1);
  for(let r=0;r<4;r++){const y=2+r*6;x.fillStyle=C.gM;x.fillRect(o,y+5,32,1);const off=r%2?8:0;for(let k=0;k<2;k++)x.fillRect(o+(off+k*16)%32,y,1,5);
   x.fillStyle=r>1?C.gD:C.g2;if(r>1)x.fillRect(o,y,32,5)}
  x.fillStyle=C.gM;x.fillRect(o,23,32,1);
  // variants: 1 = cracked brick, 2 = chipped edge + darker brick
  if(v===1){x.fillStyle=C.gM;[[20,2],[21,3],[21,4],[22,5],[22,6],[23,7]].forEach(([a,b])=>x.fillRect(o+a,b,1,1));x.fillStyle=C.gD;x.fillRect(o+3,8,12,5)}
  if(v===2){x.fillStyle=C.gM;x.fillRect(o+9,0,4,1);x.fillRect(o+10,1,2,1);x.fillStyle=C.g2;x.fillRect(o+17,2,15,5);x.fillStyle=C.gM;x.fillRect(o+25,9,1,3)}}}));
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
   case'spark':q.vy+=260*dt;q.vx*=.93;break;case'dust':q.vx*=.9;q.vy*=.92;break;case'shard':if(q.rest)break;q.vy+=300*dt;if(q.y>GY-1){q.y=GY-1;q.vy*=-.3;q.vx*=.6;if(Math.abs(q.vy)<18){q.rest=1;q.vx=0;q.vy=0;q.m=Math.max(q.m,q.l+1)}}break;case'breath':q.vx*=.95;q.vy-=4*dt;break;
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
 blit(g,x,y,f,flash,alpha=1){const o=this.o;for(let j=0;j<HB_H;j++){let i=0;while(i<HB_W){const c=o[j*HB_W+i];if(c===-1){i++;continue}let e=i+1;while(e<HB_W&&o[j*HB_W+e]===c)e++;
   g.fillStyle(flash&&c!==HC.o?0xffffff:c,alpha);const x0=f>0?x+i-HB_OX:x-(e-1-HB_OX);g.fillRect(x0,y+j-HB_OY,e-i,1);i=e}}}}
const HERO=new HeroBuf();
const RUN_F=[[3,0],[2,-1],[0,-2],[-2,-2],[-3,-1],[-1,0]],RUN_K=[[2,-3],[2,-4],[1,-4],[0,-3],[-1,-3],[0,-3]],RUN_BOB=[0,-1,0,0,-1,0];
// pose: hy hip height, ln torso lean, bk/bf back knee/foot, fk/ff front knee/foot, ba/fa hands, sw sword angle (deg, 0=forward,-90=up) or null
function heroPose(st,fr,t,combo){const P={hy:-6,ln:0,bk:[-1,-3],bf:[-2,0],fk:[1,-3],ff:[1,0],ba:[-2,-7],fa:[2,-7],sw:-50,swL:9,item:null,cape:Math.sin(t*8)};
 switch(st){
  case'idle':if(fr){P.fa=[2,-6];P.sw=-45;P.hy=-6}break;
  case'run':{const a=fr,b=(fr+3)%6;P.hy=-6+RUN_BOB[fr];P.ln=1;P.fk=RUN_K[a];P.ff=RUN_F[a];P.bk=RUN_K[b];P.bf=RUN_F[b];P.fa=[2-Math.round(RUN_F[a][0]*.5),-7];P.ba=[-1+Math.round(RUN_F[a][0]*.5),-7];P.sw=-35;P.cape+=1.5;break}
  case'jump':P.fk=[2,-5];P.ff=[1,-3];P.bk=[-1,-3];P.bf=[-2,-1];P.fa=[3,-9];P.ba=[-3,-9];P.sw=-70;break;
  case'fall':P.fk=[1,-3];P.ff=[2,0];P.bk=[-1,-3];P.bf=[-3,-1];P.fa=[3,-8];P.ba=[-3,-10];P.sw=-30;P.cape+=2;break;
  case'atk':P.fk=[2,-3];P.ff=[3,0];P.bk=[-2,-3];P.bf=[-3,0];
   if(!combo){P.ln=[-1,1,2,1][fr];P.fa=[[-1,-11],[4,-9],[4,-6],[3,-6]][fr];P.sw=[-140,-20,45,20][fr]}
   else{P.ln=[0,1,1,0][fr];P.fa=[[2,-5],[4,-9],[3,-11],[3,-8]][fr];P.sw=[60,-30,-80,-50][fr]}P.ba=[-2,-8];break;
  case'roll':P.roll=fr;break;
  case'rollrec':P.hy=-5;P.fk=[2,-2];P.ff=[2,0];P.bk=[-1,-2];P.bf=[-3,0];P.fa=[3,-6];P.sw=-20;break;
  case'cast':P.fa=[[2,-8],[4,-10],[5,-11]][fr];P.ln=fr>1?1:0;P.item='staff';P.sw=null;P.ba=[-2,-6];break;
  case'hurt':P.ln=-2;P.fa=[3,-9];P.ba=[-4,-10];P.sw=-100;P.fk=[1,-3];P.ff=[2,0];P.bk=[-2,-3];P.bf=[-3,0];break;
  case'drink':P.hy=-6;P.fa=[1,-12];P.item='flask';P.sw=null;P.ba=[-2,-6];P.fk=[2,-3];P.ff=[2,0];break;
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
  B.set(hx0-s,hy0+c,HC.gd);B.set(hx0+s,hy0-c,HC.gd);B.line(hx0+c,hy0+s,hx0+c*P.swL,hy0+s*P.swL,HC.st);B.set(hx0+c*(P.swL+1),hy0+s*(P.swL+1),0xffffff);B.set(hx0-c,hy0-s,HC.sd)}
 if(P.item==='staff'){B.line(P.fa[0]-1,P.fa[1]+5,P.fa[0]+2,P.fa[1]-6,HC.staff);B.set(P.fa[0]+2,P.fa[1]-7,0xffffff)}
 if(P.item==='flask'){B.rect(P.fa[0],P.fa[1]-1,2,3,HC.fl);B.set(P.fa[0],P.fa[1]-2,HC.sd)}
 B.set(P.fa[0],P.fa[1],HC.h);B.outline()}
function drawHero(g,x,y,f,st,fr,t,o={}){rasterHero(HERO,heroPose(st,fr,t,o.combo));HERO.blit(g,x,y,f,o.flash,o.alpha??1)}
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
  const k=this.input.keyboard;k.on('keydown',e=>{if(this.save&&(e.key==='ArrowUp'||e.key==='ArrowDown'))this.sel^=1;if(e.key==='Enter'||e.key===' '||e.key==='z'){this.go()}});
  this.input.on('pointerdown',p=>{if(this.save){if(p.y>=108&&p.y<119)this.sel=0;else if(p.y>=119&&p.y<132)this.sel=1;else return}this.go()})}
 go(){if(this.gone)return;this.gone=1;const cont=this.save&&this.sel===0;if(!cont)Save.clear();this.cameras.main.fadeOut(400,7,5,15);this.time.delayedCall(420,()=>this.scene.start('stage',{fresh:!cont}))}
 update(_,d){const dt=d/1000;this.t+=dt;this.bg(this.t*8);const ga=this.ga,gn=this.gn,g=this.gt;ga.clear();gn.clear();g.clear();
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
  const blink=Math.floor(this.t*2)%2===0;
  if(this.save){drawText(g,(this.sel===0?'> ':'  ')+'CONTINUE',118,111,this.sel===0?0xffe2a8:0x6b67a0);drawText(g,(this.sel===1?'> ':'  ')+'NEW GAME',118,121,this.sel===1?0xffe2a8:0x6b67a0)}
  else if(blink)drawText(g,'PRESS ENTER',Math.round(W/2-textW('PRESS ENTER')/2),116,0xffe2a8);
  drawText(g,'ARROWS MOVE  Z JUMP  X ATTACK  C ROLL  A PARRY  Q FLASK',Math.round(W/2-textW('ARROWS MOVE  Z JUMP  X ATTACK  C ROLL  A PARRY  Q FLASK')/2),164,0x5d5990,1,null);
  drawText(g,'V FROST  S STORM  D DOME  UP REST  ESC PAUSE  M SOUND',Math.round(W/2-textW('V FROST  S STORM  D DOME  UP REST  ESC PAUSE  M SOUND')/2),171,0x5d5990,1,null)}}
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
const EHP={hollow:4,knight:6,wraith:3,imp:2},ESOULS={hollow:30,knight:80,wraith:60,imp:20},ESIZE={hollow:[8,14],knight:[9,15],wraith:[10,12],imp:[7,6]};
const TBTN=[{k:'l',x:22,y:152,r:13,lab:'<'},{k:'r',x:56,y:152,r:13,lab:'>'},{k:'up',x:39,y:127,r:10,lab:'^'},
 {k:'jump',x:298,y:148,r:13,lab:'JUMP'},{k:'atk',x:270,y:162,r:12,lab:'ATK'},{k:'roll',x:270,y:135,r:11,lab:'ROLL'},{k:'parry',x:244,y:162,r:10,lab:'PRY'},
 {k:'flask',x:302,y:34,r:9,lab:'EST'},{k:'ice',x:280,y:34,r:9,lab:'ICE'},{k:'bolt',x:258,y:34,r:9,lab:'BLT'},{k:'dome',x:236,y:34,r:9,lab:'DOM'},{k:'pause',x:160,y:10,r:7,lab:'II'}];
class Stage extends Phaser.Scene{constructor(){super('stage')}
 init(d){this.fresh=d.fresh}
 create(){
  const sv=(!this.fresh&&Save.load())||{bonfire:false,souls:0,bossDown:false};sv.deaths=sv.deaths||0;sv.time=sv.time||0;sv.ng=sv.ng||0;this.sv=sv;
  this.ng=sv.ng;this.ngMul=1+.5*this.ng;this.playT=sv.time;
  this.physics.world.setBounds(0,-60,WORLD,H+60);
  this.bgf=makeBG(this);
  this.add.tileSprite(0,GY,WORLD,24,'ground').setOrigin(0).setDepth(1);
  this.gs=this.add.graphics().setDepth(0);
  this.gp=this.add.graphics().setDepth(1.5);// puddles
  this.gl=this.add.graphics().setDepth(2).setBlendMode(Phaser.BlendModes.ADD);// lighting layer
  this.gn=this.add.graphics().setDepth(3);
  this.ga=this.add.graphics().setDepth(4).setBlendMode(Phaser.BlendModes.ADD);
  this.gu=this.add.graphics().setDepth(50).setScrollFactor(0);
  this.gua=this.add.graphics().setDepth(49).setScrollFactor(0).setBlendMode(Phaser.BlendModes.ADD);
  this.fx=new FX(this);this.lights=[];this.pops=[];
  this.solids=[];const solid=(x,y,w,h,oneway)=>{const r=this.add.rectangle(x+w/2,y+h/2,w,h).setVisible(false);this.physics.add.existing(r,true);if(oneway){r.body.checkCollision.down=false;r.body.checkCollision.left=false;r.body.checkCollision.right=false}this.solids.push(r);return r};
  solid(0,GY,WORLD,30);
  this.plats=[[430,128,48],[540,108,40],[1000,124,64],[1110,100,48],[1820,126,56],[1930,104,40],[2160,118,48],[2290,96,48],[2400,120,40]];
  this.plats.forEach(([x,y,w])=>{solid(x,y,w,6,true);this.add.tileSprite(x,y,w,8,'plat').setOrigin(0).setDepth(1)});
  this.gateL=solid(ARENA_L-8,0,8,GY,false);this.gateL.body.enable=false;
  const g=this.gs;for(let x=180;x<WORLD;x+=230+((x*7)%60)){const h=40+((x*13)%30);g.fillStyle(0x110d26);g.fillRect(x,GY-h,8,h);g.fillRect(x-2,GY-h,12,3);g.fillStyle(0x1e1840);g.fillRect(x,GY-h+3,1,h-3);
   if((x/230|0)%2){g.fillStyle(0x110d26);for(let a=0;a<=20;a++){const ax=x+8+a*2,ay=GY-h-Math.round(Math.sin(a/20*Math.PI)*10)+6;g.fillRect(ax,ay,2,3)}}}
  this.puddles=[[262,18],[702,14],[1250,22],[1676,16],[2082,20],[2552,14],[3080,24],[3236,16]];
  for(const[x,w]of this.puddles){this.gp.fillStyle(0x100c24);this.gp.fillRect(x,GY,w,2);this.gp.fillRect(x+2,GY+2,w-4,1);this.gp.fillStyle(0x3d3570);this.gp.fillRect(x+2,GY,w-6,1)}
  this.braziers=[];for(let x=120;x<WORLD-200;x+=320)this.braziers.push(x);this.braziers.push(ARENA_L+30,ARENA_R-30);
  this.bonfire={x:1600,lit:sv.bonfire};
  const sx=sv.bonfire&&!Q.get('x')?this.bonfire.x+14:START_X;
  this.pb=this.physics.add.image(sx,GY-12,'px').setVisible(false);this.pb.body.setSize(6,14);this.pb.setCollideWorldBounds(true);this.pb.body.setMaxVelocityY(330);
  this.physics.add.collider(this.pb,this.solids);
  this.player={x:sx,y:GY,f:1,hp:100,hpMax:100,fp:80,fpMax:80,st:100,stMax:100,stDelay:0,stFlash:0,state:'idle',t:0,inv:0,run:0,coy:0,buf:0,atkBuf:0,flash:0,dead:false,flasks:TUNE.flaskN,healLeft:0,combo:0,land:0};
  this.souls=sv.souls||0;this.stain=sv.stain||null;this.soulPop=null;
  this.enemies=[];
  [['hollow',360],['imp',520],['hollow',720],['wraith',900],['knight',1180],['imp',1260],['wraith',1380],['imp',1900],['hollow',2020],['wraith',2250],['knight',2460],['imp',2600],['hollow',2760],['wraith',2850]].forEach(([k,x])=>this.spawnEnemy(k,x));
  this.shots=[];this.spells=[];this.bolts=[];this.novas=[];
  this.boss=null;this.bossState=sv.bossDown?'dead':'sleep';this.cine=null;this.bars=0;this.victory=null;this.paused=false;this.flashF=0;
  this.cam=this.cameras.main;this.cam.setBounds(0,0,WORLD,H);this.cam.startFollow(this.pb,true,.12,0,0,0);this.camOff=0;
  this.keys=this.input.keyboard.addKeys('LEFT,RIGHT,UP,DOWN,Z,X,C,V,S,E,A,D,Q,F,SPACE,SHIFT,ENTER');
  this.input.keyboard.on('keydown',e=>{const V=this.victory;if(V&&V.t>=.8){if(e.key==='ArrowUp'||e.key==='ArrowDown')V.sel^=1;if(['Enter',' ','z','x','Z','X'].includes(e.key))this.victoryGo();return}if(e.key==='Escape'||e.key==='p'||e.key==='P')this.togglePause();if(e.key==='m'||e.key==='M')this.sound.mute=!this.sound.mute});
  this.touch=Q.has('touch')||!!(this.sys.game.device.input.touch);this.tPrev={};this.tTap={};
  if(this.touch)this.input.addPointer(4);
  this.input.on('pointerdown',p=>{if(this.victory)return this.victoryTap(p);if(!this.touch)return;for(const b of TBTN){const dx=p.x-b.x,dy=p.y-b.y;if(dx*dx+dy*dy<(b.r+4)*(b.r+4))this.tTap[b.k]=1}if(this.tTap.pause){this.tTap.pause=0;this.togglePause()}});
  this.inp={};this.hs=0;this.msg=null;this.t=0;this.flashA=0;this.ai={t:0,roll:2.5,bolt:3};this.stats={dodged:0,parries:0,ripostes:0,flasks:0};
  this.cam.fadeIn(500,7,5,15);
  if(DEMO&&Q.has('boss')){this.pb.x=ARENA_L-60}
  this.say(this.ng?'JOURNEY '+(this.ng+1)+' - THE RAMPARTS STIR':sv.bonfire?'RESTED AT GATE VIGIL':'THE ASHEN RAMPARTS',2.5)}
 say(s,d=2){this.msg={s,t:d}}
 pop(s,x,y,c=0xffe2a8){this.pops.push({s,x,y,c,t:0})}
 sfx(k,v=.35){try{this.sound.play(k,{volume:v})}catch(e){}}
 light(x,y,r,c,a){this.lights.push({x,y,r,c,a})}
 togglePause(){if(this.victory||this.player.dead)return;this.paused=!this.paused;this.paused?this.physics.pause():this.physics.resume()}
 gainSouls(n){this.souls+=n;this.soulPop={n:(this.soulPop&&this.soulPop.t>0?this.soulPop.n:0)+n,t:1.4}}
 spawnEnemy(k,x){const b=this.physics.add.image(x,GY-20,'px').setVisible(false);const S=ESIZE[k];b.body.setSize(S[0],S[1]);b.setCollideWorldBounds(true);
  if(k==='wraith'){b.body.setAllowGravity(false);b.y=GY-40}else this.physics.add.collider(b,this.solids);
  const e={k,b,x0:x,hp:EHP[k]*this.ngMul,state:'idle',t:rnd(0,1),f:-1,flash:0,dead:false,cd:rnd(1,2.5),souls:ESOULS[k]*(1+this.ng),guard:3,combo:0};this.enemies.push(e);return e}
 // ---------------- input ----------------
 touchState(){const o={};if(!this.touch)return o;const held={};
  for(const p of this.input.manager.pointers){if(!p||!p.isDown)continue;for(const b of TBTN){const dx=p.x-b.x,dy=p.y-b.y;if(dx*dx+dy*dy<(b.r+4)*(b.r+4))held[b.k]=1}}
  for(const b of TBTN){o[b.k]=!!held[b.k];o[b.k+'P']=(!!held[b.k]&&!this.tPrev[b.k])||!!this.tTap[b.k]}this.tPrev=held;this.tTap={};this.tHeld=held;return o}
 readInput(){const K=this.keys,J=Phaser.Input.Keyboard.JustDown;
  if(DEMO)return this.demoInput();
  const T=this.touchState(),sh=K.SHIFT.isDown,xP=J(K.X),upP=J(K.UP)|J(K.E);
  return{l:K.LEFT.isDown||T.l,r:K.RIGHT.isDown||T.r,up:K.UP.isDown||T.up,jump:K.Z.isDown||K.SPACE.isDown||T.jump,jumpP:J(K.Z)|J(K.SPACE)|T.jumpP,
   atkP:(xP&&!sh)||T.atkP,parryP:J(K.A)||(xP&&sh)||T.parryP,rollP:J(K.C)||T.rollP,iceP:J(K.V)||T.iceP,boltP:J(K.S)||T.boltP,domeP:J(K.D)||T.domeP,
   flaskP:J(K.Q)|J(K.F)|T.flaskP,restP:upP||T.upP}}
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
   else if(d<95&&d>40&&P.fp>=15&&Math.random()<.05&&near.k!=='wraith')o.iceP=1;
   if(near.k==='wraith'&&d<150&&d>0&&P.fp>=20&&A.bolt<0){o.boltP=1;A.bolt=3}}
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
  const P=this.player,b=this.pb,inp=this.cine||P.dead?{}:this.readInput();this.inp=inp;
  P.x=b.x;P.y=b.body.bottom;
  this.updatePlayer(dt,inp);this.updateEnemies(dt);this.updateBoss(dt);this.updateSpells(dt);this.updateCine(dt);
  // bloodstain: recover souls (Tester r1 P1 #2)
  const S=this.stain;if(S&&!P.dead){if(Math.random()<.5)this.fx.add({k:'soul',x:S.x+rnd(-3,3),y:GY-rnd(0,4),vx:rnd(-4,4),vy:rnd(-24,-10),l:.31,m:.9});
   if(Math.abs(P.x-S.x)<10&&P.y>GY-30){this.gainSouls(S.souls);this.fx.soul(S.x,GY-6,20);this.sfx('souls',.5);this.say('SOULS RETRIEVED',2);this.stain=null;this.sv.stain=null;this.sv.souls=this.souls;Save.write(this.sv)}}
  for(const x of this.braziers)if(Math.abs(x-this.cam.scrollX-160)<200){this.fx.fire(x,GY-15,2,2);if(Math.random()<.06)this.fx.ember(x,GY-18,1)}
  if(Math.abs(this.bonfire.x-P.x)<240){const n=this.bonfire.lit?2:1;for(let i=0;i<n;i++)this.fx.fire(this.bonfire.x,GY-3,1,this.bonfire.lit?4:2,this.bonfire.lit?1.3:.7);if(Math.random()<.15)this.fx.ember(this.bonfire.x,GY-8,1)}
  if(this.cam.scrollX>ARENA_L-320&&Math.random()<.6)this.fx.snow(this.cam.scrollX+rnd(-20,340),-2);
  if(Q.get('still')==='dome'&&!this._sd&&this.t>2.5){this._sd=1;this.castDome(this.player.x,'p',1);setTimeout(()=>window.__dome=1,900)}
  if(Q.get('still')==='bolt'&&!this._sb&&this.t>2.5){this._sb=1;this.castBolt();setTimeout(()=>window.__bolt=1,130)}
  this.fx.update(dt);
  if(!this.cine){this.camOff=lerp(this.camOff,-P.f*36,1-Math.pow(.02,dt));this.cam.setFollowOffset(Math.round(this.camOff),0)}
  this.render(dt)}
 canAct(){const P=this.player;if(P.st>0)return true;P.stFlash=.5;return false}
 spend(n){const P=this.player;P.st-=n;if(P.st<=0){P.st=0;P.stDelay=TUNE.exhaustDelay;P.stFlash=.6}else P.stDelay=TUNE.regenDelay}
 updatePlayer(dt,inp){const P=this.player,b=this.pb,body=b.body,on=body.blocked.down;P.t+=dt;P.inv-=dt;P.flash-=dt;P.stDelay-=dt;P.stFlash-=dt;P.land-=dt;
  if(P.dead){b.setVelocityX(0);P.deadT+=dt;if(P.deadT>2.6)this.respawn();return}
  if(P.stDelay<=0)P.st=Math.min(P.stMax,P.st+TUNE.regen*dt);P.fp=Math.min(P.fpMax,P.fp+2*dt);
  P.coy=on?.1:P.coy-dt;P.buf=inp.jumpP?.12:P.buf-dt;P.atkBuf=inp.atkP?.2:P.atkBuf-dt;
  const busy=['roll','rollrec','atk','cast','hurt','rest','drink','parry'].includes(P.state);
  const dir=(inp.r?1:0)-(inp.l?1:0);
  if(!busy){if(dir)P.f=dir;const tv=dir*100,acc=on?(dir?900:1300):600;const vx=body.velocity.x;b.setVelocityX(vx+clamp(tv-vx,-acc*dt,acc*dt));
   if(P.buf>0&&P.coy>0){b.setVelocityY(-280);P.buf=0;P.coy=0;this.fx.dust(P.x,P.y,5);this.sfx('jump',.25)}
   if(!inp.jump&&body.velocity.y<-80)b.setVelocityY(body.velocity.y*.55);
   if(body.velocity.y>0)body.velocity.y+=500*dt;
   if(on&&dir&&Math.abs(body.velocity.x)>60){P.run+=dt*12;if(Math.random()<.08)this.fx.dust(P.x-P.f*3,P.y,1,-P.f)}
   P.state=on?(Math.abs(body.velocity.x)>8?'run':'idle'):(body.velocity.y<0?'jump':'fall');
   if(!P.wasOn&&on&&P.lastVy>160){this.fx.dust(P.x,P.y,8);P.land=.12}
   if(inp.rollP&&on){if(this.canAct()){P.state='roll';P.t=0;this.spend(TUNE.rollCost);b.setVelocityX(P.f*TUNE.rollV);this.fx.dust(P.x,P.y,6,-P.f);this.sfx('roll',.3)}}
   else if(P.atkBuf>0){if(this.canAct()){P.state='atk';P.t=0;P.combo=0;P.atkBuf=0;this.spend(TUNE.atkCost);P.hitDone=false;this.sfx('slash',.3);if(on)b.setVelocityX(P.f*30)}}
   else if(inp.parryP){if(this.canAct()){P.state='parry';P.t=0;this.spend(TUNE.parryCost);b.setVelocityX(0);this.sfx('roll',.15)}}
   else if(inp.flaskP){if(P.flasks>0){P.state='drink';P.t=0;P.flasks--;P.healLeft=TUNE.flaskHeal;this.stats.flasks++;b.setVelocityX(body.velocity.x*.3);this.sfx('bonfire',.25)}else{P.flaskFlash=.6;this.pop('NO FLASKS',P.x,P.y-24,0xd8402a)}}
   else if(inp.iceP&&P.fp>=15){P.state='cast';P.spell='ice';P.t=0;P.fp-=15;b.setVelocityX(0);this.sfx('charge',.25)}
   else if(inp.boltP&&P.fp>=20){P.state='cast';P.spell='bolt';P.t=0;P.fp-=20;b.setVelocityX(0);this.sfx('charge',.25)}
   else if(inp.domeP&&P.fp>=TUNE.domeCost){P.state='cast';P.spell='dome';P.t=0;P.fp-=TUNE.domeCost;b.setVelocityX(0);this.sfx('charge',.3)}
   else if(inp.restP&&on&&Math.abs(P.x-this.bonfire.x)<TUNE.restR){P.state='rest';P.t=0;b.setVelocityX(0);this.rest()}}
  else if(P.state==='roll'){if(Math.random()<.4)this.fx.dust(P.x,P.y,1,-P.f);if(Math.random()<.6)this.fx.ember(P.x-P.f*3,P.y-4,1,.4);
   if(P.t>TUNE.rollT){P.state='rollrec';P.t=0;b.setVelocityX(P.f*40)}}
  else if(P.state==='rollrec'){b.setVelocityX(body.velocity.x*.8);if(P.t>TUNE.rollRec)P.state='idle'}
  else if(P.state==='atk'){b.setVelocityX(body.velocity.x*.85);if(P.t>TUNE.atkHit0&&P.t<TUNE.atkHit1&&!P.hitDone)this.meleeHit();
   if(P.t>.2&&P.atkBuf>0&&P.combo<1&&this.canAct()){P.combo=1;P.t=0;P.atkBuf=0;this.spend(TUNE.atkCost);P.hitDone=false;this.sfx('slash',.3);if(dir)P.f=dir}
   else if(P.t>TUNE.atkT)P.state='idle'}
  else if(P.state==='parry'){if(P.t<TUNE.parryWin&&Math.random()<.5)this.fx.star(P.x+P.f*8,P.y-12,C.f0);if(P.t>TUNE.parryT)P.state='idle'}
  else if(P.state==='drink'){b.setVelocityX(body.velocity.x*.8);const h=Math.min(P.healLeft,TUNE.flaskHeal/TUNE.flaskT*dt);P.hp=Math.min(P.hpMax,P.hp+h);P.healLeft-=h;
   if(Math.random()<.5)this.fx.fire(P.x+rnd(-4,4),P.y-rnd(2,14),1,1,.5);if(P.t>TUNE.flaskT){P.state='idle';P.healLeft=0}}
  else if(P.state==='cast'){if(Math.random()<.6){const hx=P.x+P.f*7,hy=P.y-14;P.spell==='bolt'?this.fx.spark(hx,hy,1,C.bolt,40):this.fx.star(hx+rnd(-3,3),hy+rnd(-3,3))}
   if(P.t>.22&&!P.castDone){P.castDone=true;P.spell==='ice'?this.castIce(P.x+P.f*16,P.f,'p'):P.spell==='dome'?this.castDome(P.x,'p'):this.castBolt()}if(P.t>.42){P.state='idle';P.castDone=false}}
  else if(P.state==='hurt'){if(P.t>.3)P.state='idle'}
  else if(P.state==='rest'){if(P.t>1.4)P.state='idle'}
  P.wasOn=on;P.lastVy=body.velocity.y;
  if(P.hp<=0&&!P.dead)this.die()}
 hurtPlayer(n,src,att){const P=this.player;if(P.dead||this.cine||this.victory)return false;
  if(att&&P.state==='parry'&&P.t<TUNE.parryWin&&(Math.sign(src-P.x)||P.f)===P.f){this.parried(att);return false}
  if(P.inv>0)return false;
  if(P.state==='roll'&&P.t>=TUNE.iF0&&P.t<TUNE.iF1){this.stats.dodged++;return false}
  P.hp-=Math.round(n*(1+.3*this.ng));P.inv=.8;P.flash=.12;P.state='hurt';P.t=0;P.healLeft=0;
  const d=Math.sign(P.x-src)||1;this.pb.setVelocity(d*120,-140);this.cam.shake(120,.012);this.fx.spark(P.x,P.y-8,10,C.f2,110);this.sfx('hit',.4);this.hitstop(.06);return true}
 parried(att){const P=this.player;this.stats.parries++;const B=att==='boss'?this.boss:null;
  if(B){B.state='stag';B.t=0}else{att.state='stag';att.t=0;att.b.setVelocityX(0)}
  const x=P.x+P.f*9,y=P.y-11;this.fx.spark(x,y,18,0xffffff,150);this.fx.spark(x,y,10,C.f1,110);this.novas.push({x,y,t:0,m:.3,parry:1});this.flashF=2;
  this.sfx('parry',.6);this.hitstop(.1);this.cam.shake(120,.01);this.pop('PARRY',x,y-10);P.inv=.3;P.state='idle';P.t=0}// successful parry cancels recovery so the riposte can follow
 hitstop(s){this.hs=s;this.physics.pause()}
 meleeHit(){const P=this.player;const hx=P.x+P.f*12,hy=P.y-8;let any=false,rip=false;
  const hit=(x,y,w,h)=>Math.abs(x-hx)<w/2+11&&Math.abs(y-hy)<h/2+9;
  for(const e of this.enemies){if(e.dead)continue;const bb=e.b.body;if(!hit(bb.center.x,bb.center.y,bb.width,bb.height))continue;any=true;
   if(e.state==='stag'){this.damageEnemy(e,TUNE.ripMul,P.f);rip=true;if(!e.dead)e.state='chase'}
   else if(e.k==='knight'&&(Math.sign(P.x-e.b.x)||1)===e.f){e.guard--;this.fx.spark(e.b.x+e.f*6,e.b.y-2,10,0xffffff,120);this.sfx('parry',.2);this.pop('BLOCK',e.b.x,e.b.y-16,0x9fb8e8);e.b.setVelocityX(-e.f*40);
    if(e.guard<=0){e.state='stag';e.t=0;e.guard=3;this.pop('GUARD BROKEN',e.b.x,e.b.y-24)}}
   else this.damageEnemy(e,1,P.f)}
  const B=this.boss;if(B&&this.bossState==='fight'&&hit(B.x,B.y-16,18,32)){if(B.state==='stag'){this.damageBoss(1.5*TUNE.ripMul);rip=true;B.state='walk';B.cd=1}else this.damageBoss(1.5);any=true}
  if(rip){this.stats.ripostes++;this.pop('RIPOSTE',hx,hy-14,0xffb04a);this.flashF=2;this.fx.spark(hx,hy,24,C.f1,180,20)}
  if(any){P.hitDone=true;this.hitstop(rip?.14:.055);this.cam.shake(rip?200:70,rip?.016:.006)}}
 damageEnemy(e,n,dir){e.hp-=n;e.flash=.1;this.fx.spark(e.b.x,e.b.y,10,0xffd04a,120,20);this.sfx('hit',.3);if(e.k!=='wraith')e.b.setVelocity(dir*90,-60);else e.b.x+=dir*6;
  if(e.hp<=0&&!e.dead){e.dead=true;e.deadT=0;e.b.body.enable=false;this.fx.soul(e.b.x,e.b.y,8);this.gainSouls(e.souls);this.fx.dust(e.b.x,GY,10);
   if(e.k==='imp')this.explode(e.b.x,e.b.y,false)}}
 explode(x,y,hurts){this.fx.fire(x,y,30,6,1.4);this.fx.spark(x,y,16,C.f1,150);this.fx.ember(x,y,10,2);this.novas.push({x,y,t:0,m:.25,fire:1});this.cam.shake(140,.01);
  if(hurts&&Math.hypot(this.player.x-x,this.player.y-8-y)<22)this.hurtPlayer(18,x)}
 die(){const P=this.player;P.dead=true;P.deadT=0;this.fx.ember(P.x,P.y-8,30,2);this.sfx('death',.5);this.say('EMBER EXTINGUISHED',2.4);
  // DS rule: the old stain is lost; a new one holds what you carried
  this.stain=this.souls>0?{x:Math.round(clamp(P.x,20,WORLD-20)),souls:this.souls}:null;this.souls=0;
  this.sv.deaths++;this.sv.stain=this.stain;this.sv.souls=0;this.sv.time=this.playT;Save.write(this.sv)}
 respawn(){this.scene.restart({fresh:false})}
 rest(){const P=this.player;P.hp=P.hpMax;P.fp=P.fpMax;P.st=P.stMax;P.flasks=TUNE.flaskN;const first=!this.bonfire.lit;this.bonfire.lit=true;this.fx.ember(this.bonfire.x,GY-8,40,2.2);this.fx.spark(this.bonfire.x,GY-6,16,C.f1,90,40);
  this.sfx('bonfire',.5);this.say(first?'BONFIRE LIT - GATE VIGIL':'RESTED. FLASKS REFILLED',2.4);
  this.enemies.forEach(e=>{if(e.dead&&Math.abs(e.x0-P.x)>200){e.dead=false;e.hp=EHP[e.k]*this.ngMul;e.state='idle';e.guard=3;e.b.body.enable=true;e.b.setPosition(e.x0,e.k==='wraith'?GY-40:GY-20)}});
  Object.assign(this.sv,{bonfire:true,souls:this.souls,bossDown:this.bossState==='dead',time:this.playT});Save.write(this.sv)}
 // ---------------- spells ----------------
 castIce(x,f,owner){const V=ICEP;for(let i=0;i<V.n;i++)this.spells.push({k:'spike',x:Math.round(x+i*V.step*f),t:-i*.045,h:lerp(V.hMin,V.hMax,Math.abs(Math.sin(i*2.3+x))),lean:rnd(-.4,.4),owner,hit:false});this.cam.shake(80,.004)}
 castDome(x,owner,harmless){this.novas.push({dome:1,owner,harmless,x,y:GY,R:TUNE.domeR,grow:.45,t:0,m:1.8});this.cam.shake(160,.008);this.fx.shard(x,GY,20,120)}
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
  for(let i=this.bolts.length-1;i>=0;i--){const o=this.bolts[i];o.t+=dt;if(o.target&&o.target.e&&!o.target.e.dead)o.x=o.target.e.b.x;if(o.target&&o.target.boss&&this.boss)o.x=this.boss.x;
   if(!o.pts||Math.floor(o.t*14)!==o.fr){o.fr=Math.floor(o.t*14);o.pts=this.boltPath(o.x)}
   if(!o.hit&&o.t>.06){o.hit=true;this.flashF=2;this.cam.shake(180,.014);this.fx.spark(o.x,GY-2,18,C.bolt,170,60);this.fx.spark(o.x,GY-2,8,0x5ad8ff,140,50);this.fx.spark(o.x,GY-2,6,C.f1,120,40);this.fx.dust(o.x,GY,8);this.novas.push({x:o.x,y:GY,t:0,m:.25,bolt:1});
    if(o.target&&o.target.e)this.damageEnemy(o.target.e,3,this.player.f);if(o.target&&o.target.boss)this.damageBoss(3);this.hitstop(.05)}
   if(o.t>.5)this.bolts.splice(i,1)}
  for(let i=this.novas.length-1;i>=0;i--){const n=this.novas[i];n.t+=dt;
   if(n.dome){const r=n.R*ease(Math.min(1,n.t/n.grow));
    if(!n.done&&n.t>n.grow*.9){n.done=true;if(!n.harmless){if(n.owner==='p'){for(const e of this.enemies)if(!e.dead&&Math.hypot(e.b.x-n.x,e.b.y-n.y)<n.R)this.damageEnemy(e,2,Math.sign(e.b.x-n.x)||1);if(this.boss&&Math.abs(this.boss.x-n.x)<n.R)this.damageBoss(3)}
      else if(Math.hypot(this.player.x-n.x,(this.player.y-6)-n.y)<n.R)this.hurtPlayer(22,n.x)}}
    if(n.t>n.grow&&!n.burst){n.burst=true;for(let a=0;a<60;a++){const an=Math.PI+a/60*Math.PI;this.fx.add({k:'shard',x:n.x+Math.cos(an)*r,y:n.y+Math.sin(an)*r,vx:Math.cos(an)*40,vy:Math.sin(an)*40,l:0,m:rnd(.4,.8)})}this.cam.shake(160,.01)}}
   if(n.t>n.m)this.novas.splice(i,1)}
  for(let i=this.shots.length-1;i>=0;i--){const s=this.shots[i];s.t+=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;if(Math.random()<.6)this.fx.add({k:'shard',x:s.x,y:s.y,vx:rnd(-8,8),vy:rnd(-8,8),l:0,m:.3});
   const P=this.player;if(Math.hypot(P.x-s.x,P.y-7-s.y)<6){if(this.hurtPlayer(12,s.x)||P.inv>0){this.fx.shard(s.x,s.y,10);this.shots.splice(i,1)}continue}
   if(s.y>GY||s.t>3){this.fx.shard(s.x,s.y,8);this.shots.splice(i,1)}}}
 // ---------------- enemies ----------------
 updateEnemies(dt){const P=this.player;for(const e of this.enemies){if(e.dead){e.deadT+=dt;continue}const b=e.b;e.t+=dt;e.flash-=dt;e.cd-=dt;const dx=P.x-b.x,adx=Math.abs(dx);
   if(adx>260)continue;
   if(e.k==='hollow'||e.k==='knight'){const on=b.body.blocked.down,kn=e.k==='knight';
    if(e.state==='stag'){b.setVelocityX(b.body.velocity.x*.85);if(Math.random()<.3)this.fx.star(b.x+rnd(-4,4),b.y-12,C.f1);if(e.t>TUNE.stagT){e.state='chase';e.cd=.6}}
    else if(e.state==='idle'){if(adx<110)e.state='chase';b.setVelocityX(on?b.body.velocity.x*.8:b.body.velocity.x)}
    else if(e.state==='chase'){e.f=Math.sign(dx)||1;if(on)b.setVelocityX(e.f*(kn?28:38));if(adx<22&&e.cd<0){e.state='wind';e.t=0;e.combo=0;b.setVelocityX(0)}}
    else if(e.state==='wind'){if(e.t>(e.combo?.22:kn?.55:.45)){e.state='swing';e.t=0;b.setVelocityX(e.f*(e.combo?50:70));this.sfx('slash',.2)}}
    else if(e.state==='swing'){if(e.t<.12&&adx<20&&Math.abs(P.y-b.body.bottom)<16)this.hurtPlayer(e.combo?10:kn?16:14,b.x,e);
     if(e.state==='swing'&&e.t>.35){if(!kn&&!e.combo&&adx<28){e.combo=1;e.state='wind';e.t=0;b.setVelocityX(0)}else{e.state='chase';e.cd=kn?1.6:1.4;b.setVelocityX(0)}}}
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
  const B=this.boss;if(!B)return;B.t+=dt;B.flashCd-=dt;B.eyeFlash-=dt;
  if(this.bossState==='fight'){const dx=P.x-B.x,adx=Math.abs(dx);B.cd-=dt;
   if(Math.random()<.5)this.fx.add({k:'shard',x:B.x+rnd(-8,8),y:B.y-rnd(4,30),vx:rnd(-6,6),vy:rnd(-12,-2),l:0,m:.5});
   if(Math.random()<.25)this.fx.add({k:'breath',x:B.x+B.f*5,y:B.y-32,vx:B.f*rnd(8,18),vy:rnd(-4,2),l:0,m:rnd(.5,.9)});
   if(B.state==='stag'){if(Math.random()<.4)this.fx.star(B.x+rnd(-8,8),B.y-rnd(30,40),C.f1);if(B.t>TUNE.stagT){B.state='walk';B.cd=.6}}
   else if(B.state==='walk'){B.f=Math.sign(dx)||1;B.x+=B.f*(B.phase2?34:26)*dt;B.step+=dt*6;
    if(B.cd<0){const r=Math.random();B.next=adx<40?(r<.6?'slam':'nova'):(r<.45?'charge':r<.8?'slam':'nova');if(!B.phase2&&B.next==='nova'&&Math.random()<.5)B.next='slam';
     B.state='wind';B.t=0;B.wt=B.next==='charge'?.6:B.next==='nova'?.75:.7;B.eyeFlash=.3;this.sfx('charge',.4)}}
   else if(B.state==='wind'){if(Math.random()<.7)this.fx.star(B.x+B.f*rnd(4,16),B.y-rnd(20,36));
    if(B.t>B.wt){B.state=B.next;B.t=0;if(B.next==='slam'){this.cam.shake(220,.02);this.fx.dust(B.x+B.f*16,GY,16);this.castIce(B.x+B.f*20,B.f,'b');this.sfx('death',.25);this.fx.shard(B.x+B.f*16,GY,16,120)}
     if(B.next==='nova'){this.novas.push({dome:1,owner:'b',x:B.x,y:GY,R:B.phase2?104:92,grow:.5,t:0,m:1.4});this.sfx('parry',.35)}
     if(B.next==='charge'){B.f=Math.sign(dx)||1}}}
   else if(B.state==='slam'){if(B.t<.1&&Math.abs(P.x-(B.x+B.f*16))<16)this.hurtPlayer(24,B.x,'boss');if(B.state==='slam'&&B.t>.6){B.state='walk';B.cd=rnd(.8,1.6)*(B.phase2?.7:1)}}
   else if(B.state==='nova'){if(B.t>1){B.state='walk';B.cd=rnd(.8,1.4)}}
   else if(B.state==='charge'){B.x+=B.f*200*dt;if(Math.random()<.9)this.fx.dust(B.x-B.f*8,GY,1,-B.f);this.fx.add({k:'shard',x:B.x-B.f*6,y:GY-rnd(2,20),vx:-B.f*30,vy:0,l:0,m:.4});
    if(Math.abs(P.x-B.x)<12&&Math.abs(P.y-GY)<26)this.hurtPlayer(20,B.x);
    if(B.x<ARENA_L+20||B.x>ARENA_R-20||B.t>.9){B.x=clamp(B.x,ARENA_L+20,ARENA_R-20);B.state='walk';B.cd=rnd(.6,1.2);this.cam.shake(150,.015);this.fx.dust(B.x,GY,12)}}
   B.x=clamp(B.x,ARENA_L+16,ARENA_R-16);
   if(!B.phase2&&B.hp<B.hpMax*.5){B.phase2=true;this.say('THE WARDEN\'S RIME DEEPENS',1.8);this.novas.push({dome:1,owner:'b',harmless:1,x:B.x,y:GY,R:120,grow:.6,t:0,m:1.6});this.cam.shake(300,.02)}
   if(B.hp<=0){this.bossState='dying';B.t=0;this.sfx('death',.6);this.say('WARDEN SLAIN',3);this.cam.shake(600,.02)}}
  if(this.bossState==='dying'){if(Math.random()<.9)this.fx.shard(B.x+rnd(-10,10),B.y-rnd(0,34),2,120);if(Math.random()<.3)this.fx.spark(B.x+rnd(-8,8),B.y-rnd(0,30),4,C.ice2);
   if(B.t>2.2){this.bossState='dead';this.fx.soul(B.x,B.y-16,60);this.gainSouls(2000*(1+this.ng));this.gateL.body.enable=false;
    Object.assign(this.sv,{bonfire:this.bonfire.lit,souls:this.souls,bossDown:true,time:this.playT});Save.write(this.sv);this.boss=null;
    this.time.delayedCall(1600,()=>{this.victory={t:0,sel:0};this.physics.pause()})}}}
 damageBoss(n){const B=this.boss;if(!B||this.bossState!=='fight')return;B.hp-=n;if(B.flashCd<=0){B.flash=2;B.flashCd=.15}this.fx.spark(B.x,B.y-18,12,C.ice1,130,30);this.sfx('hit',.35)}
 startCine(){this.gateL.body.enable=true;this.boss={x:ARENA_R-60,y:GY,f:-1,hp:40*this.ngMul,hpMax:40*this.ngMul,t:0,state:'rise',cd:1.5,flash:0,flashCd:0,eyeFlash:0,step:0,eyes:0,rise:0,wt:.7};
  this.cine={t:0};this.cam.stopFollow();this.pb.setVelocityX(0);this.player.state='idle';this.cam.pan(ARENA_R-110,90,900,'Sine.easeInOut')}
 updateCine(dt){const c=this.cine;if(!c)return;c.t+=dt;const B=this.boss;this.bars=Math.min(1,c.t/.5);
  if(c.t>.9&&c.t<1.6){B.rise=ease((c.t-.9)/.7);if(Math.random()<.9)this.fx.shard(B.x+rnd(-14,14),GY,2,80);if(!c.shk){c.shk=1;this.cam.shake(700,.012);this.sfx('charge',.5)}}
  if(c.t>1.6){B.eyes=Math.min(1,(c.t-1.6)/.3);if(!c.ign){c.ign=1;this.fx.spark(B.x-3,B.y-29,14,C.ice1,90);this.novas.push({dome:1,x:B.x,y:GY,R:110,grow:.45,t:0,m:1.4,harmless:1});this.flashA=.25}}
  if(c.t>3.8){this.bars=Math.max(0,1-(c.t-3.8)/.4)}
  if(c.t>4.2){this.cine=null;this.bars=0;this.bossState='fight';B.state='walk';B.rise=1;this.cam.startFollow(this.pb,true,.12,0,Math.round(this.camOff),0)}}
 // ---------------- victory card (Tester r1 P1 #6) ----------------
 victoryInput(){}// keys handled by the keydown listener in create() so quick taps are never missed
 victoryTap(p){const V=this.victory;if(V.t<.8)return;if(p.y>=118&&p.y<129)V.sel=0;else if(p.y>=129&&p.y<140)V.sel=1;else return;this.victoryGo()}
 victoryGo(){const V=this.victory;if(V.gone)return;V.gone=1;this.cam.fadeOut(500,7,5,15);
  this.time.delayedCall(520,()=>{if(V.sel===0){Save.write({bonfire:false,souls:this.souls,bossDown:false,deaths:this.sv.deaths,time:this.playT,ng:this.ng+1});this.scene.restart({fresh:false})}else this.scene.start('title')})}
 // ---------------- render ----------------
 render(dt){const g=this.gn,ga=this.ga,cam=this.cam,P=this.player;g.clear();ga.clear();this.lights.length=0;this.bgf(cam.scrollX);const t=this.t;
  for(const x of this.braziers){g.fillStyle(0x0d0a1c);g.fillRect(x-1,GY-12,3,12);g.fillRect(x-4,GY-14,9,2);g.fillRect(x-3,GY-12,7,1);g.fillRect(x-3,GY-1,7,1);
   glow(ga,x,GY-17,22+Math.sin(t*11+x)*1.2,C.f3,.13);glow(ga,x,GY-16,8,C.f2,.18);this.light(x,GY-16,48+Math.sin(t*13+x)*2,C.f2,.5);
   for(let k=0;k<4;k++){const hy=GY-24-k*7-((t*14+k*7)%7);const hx=x+Math.sin(t*5+k*1.7+x)*1.5;ga.fillStyle(0xff9040,.05);ga.fillRect(Math.round(hx)-1,Math.round(hy),3,4)}}
  {const x=this.bonfire.x,lit=this.bonfire.lit;g.fillStyle(0x2a2245);g.fillRect(x-7,GY-2,15,2);g.fillStyle(0x3a3060);g.fillRect(x-5,GY-3,11,1);line(g,x,GY-2,x+2,GY-17,0x8b86a8);line(g,x-2,GY-13,x+4,GY-12,0x8b86a8);px(g,x+2,GY-17,0xd8d0ee);
   glow(ga,x,GY-6,(lit?30:14)+Math.sin(t*9)*1.5,C.f2,lit?.17:.1);this.light(x,GY-8,(lit?74:34)+Math.sin(t*9)*2,C.f2,lit?.75:.35);
   if(Math.abs(P.x-x)<TUNE.restR&&!this.cine&&!P.dead){const bob=Math.floor(t*3)%2,tx=x-11,ty=GY-32-bob;g.fillStyle(0xffe2a8);g.fillRect(tx+2,ty,1,1);g.fillRect(tx+1,ty+1,3,1);g.fillRect(tx,ty+2,5,1);drawText(g,'REST',tx+7,ty-1,0xffe2a8)}}
  if(this.stain){const S=this.stain,pl=Math.sin(t*5)*.5+.5;glow(ga,S.x,GY-3,6+pl*2,0x5fe0c0,.3);px(ga,S.x,GY-2,0xffffff);px(ga,S.x-1,GY-1,0x9ff0dc);px(ga,S.x+1,GY-1,0x9ff0dc);this.light(S.x,GY-4,26,0x5fe0c0,.5)}
  for(const s of this.spells){if(s.t<0)continue;const gt=clamp(s.t/ICEP.grow,0,1);let h=s.h*ease(gt);if(s.t>.6)h*=1-(s.t-.6)/.15;
   glow(ga,s.x,GY-h*.4,6+h*.45,C.ice4,.12);glow(ga,s.x,GY-3,8+h*.25,C.ice3,.14);drawSpike(ga,g,s.x,GY-1,h,ICEP.hw*(s.owner==='b'?1.3:1),gt,s.lean);ga.fillStyle(C.ice2,.7);ga.fillRect(s.x-7,GY-1,15,1);for(let k=0;k<3;k++)px(ga,s.x+((k*5+Math.floor(s.t*20))%14)-7,GY-2,C.ice1,.8);
   this.light(s.x,GY-h*.5,24+h,C.ice3,.55*(s.t>.6?Math.max(0,1-(s.t-.6)/.15):1))}
  // boss tells: ground frost decal showing the reach of the coming attack (Tester r1 P2 #8)
  const B=this.boss;if(B&&this.bossState==='fight'&&B.state==='wind'){const k=clamp(B.t/B.wt,0,1),bl=Math.floor(t*16)%2;
   if(B.next==='slam'){const x0=B.x+B.f*14,x1=B.x+B.f*(20+ICEP.n*ICEP.step);for(let xx=Math.min(x0,x1);xx<=Math.max(x0,x1);xx++){if((xx+Math.floor(t*30))%3===0)px(ga,xx,GY,C.ice1,.4+.5*k);if(xx%2===0&&(Math.abs(xx-x0)<lerp(0,Math.abs(x1-x0),k)))px(ga,xx,GY-1,C.ice2,.6)}}
   else if(B.next==='charge'){for(let i=0;i<8;i++){const ax=B.x+B.f*(14+i*12+((t*60)%12));px(ga,ax,GY-2,C.ice1,k);px(ga,ax-B.f,GY-3,C.ice2,k*.7);px(ga,ax-B.f,GY-1,C.ice2,k*.7)}}
   else{const R=B.phase2?104:92,rx=Math.round(R*1.2);for(let i=0;i<96;i++){const an=i/96*Math.PI*2;if((i+bl)%2)px(ga,B.x+Math.cos(an)*rx*k,GY-1+Math.sin(an)*R*.13,C.ice2,.7)}}}
  for(const n of this.novas){const k=n.t/n.m;
   if(n.dome){const r=n.R*ease(Math.min(1,n.t/n.grow)),a=n.t>n.grow?Math.max(0,1-(n.t-n.grow)/(n.m-n.grow)):1;drawDome(ga,n.x,GY,r,a,this.t,n.seed||(n.seed=ri(1,999)));this.light(n.x,GY-r*.4,r*1.5,C.ice3,.7*a)}
   else if(n.fire){glow(ga,n.x,n.y,6+k*16,C.f2,.35*(1-k));this.light(n.x,n.y,56,C.f2,.9*(1-k))}
   else if(n.parry){glow(ga,n.x,n.y,4+k*14,C.f1,.4*(1-k));this.light(n.x,n.y,40,C.f1,.8*(1-k))}
   else if(n.bolt){glow(ga,n.x,n.y-3,8+k*12,C.bolt,.4*(1-k))}}
  for(const o of this.bolts){if(!o.pts)continue;const fade=o.t<.3?1:1-(o.t-.3)/.2;
   const dl=(pts,c,a,off)=>{for(let i=1;i<pts.length;i++)line(ga,pts[i-1][0]+off,pts[i-1][1],pts[i][0]+off,pts[i][1],c,a)};
   const M=o.pts.pts;{const ca=Math.min(1,o.t*8)*fade;for(let xx=Math.round(this.cam.scrollX)-2;xx<this.cam.scrollX+W+2;xx+=1){const yy=3+Math.round(Math.sin(xx*.21)*1.5+Math.sin(xx*.07+this.t*3)*2);this.gn.fillStyle(0x07050f,.8*ca);this.gn.fillRect(xx,0,1,yy);px(ga,xx,yy,0x6a58c8,.5*ca)}}glow(ga,o.x,GY-4,14,C.bolt,.2*fade);dl(M,C.bolt,.6*fade,-1);dl(M,C.bolt,.6*fade,1);dl(M,C.boltC,fade,0);o.pts.br.forEach(s=>dl(s,C.bolt,.8*fade,0));
   this.light(o.x,GY-40,130,C.bolt,.9*fade)}
  for(const s of this.shots){glow(ga,s.x,s.y,6,C.ice3,.22);ga.fillStyle(C.ice1);ga.fillRect(Math.round(s.x)-1,Math.round(s.y)-1,3,3);px(ga,s.x,s.y,0xffffff);this.light(s.x,s.y,22,C.ice3,.5)}
  for(const e of this.enemies)this.drawEnemy(g,ga,e);
  if(this.boss)this.drawBoss(g,ga,this.boss);
  this.drawPlayer(g,ga);
  this.fx.draw(ga,g);
  for(let i=this.pops.length-1;i>=0;i--){const p=this.pops[i];p.t+=this.dt||0;if(p.t>.9){this.pops.splice(i,1);continue}drawText(g,p.s,Math.round(p.x-textW(p.s)/2),Math.round(p.y-p.t*14),p.c,1,0x07050f,Math.min(1,(.9-p.t)*4))}
  this.renderLights();
  this.drawHUD()}
 // additive light layer: stepped radial pools that also light the skyline, the ground top and puddle reflections
 renderLights(){const g=this.gl;g.clear();const cx=this.cam.scrollX;
  for(const L of this.lights){if(L.a<=.01||L.x+L.r<cx-10||L.x-L.r>cx+W+10)continue;const x=Math.round(L.x),y=Math.round(L.y);
   for(let i=4;i>=1;i--){g.fillStyle(L.c,L.a*.07*(5-i)/4);g.fillCircle(x,y,Math.round(L.r*i/4))}
   const dy=GY-L.y;if(dy<L.r){const gr=Math.sqrt(L.r*L.r-dy*dy);for(let i=3;i>=1;i--){const w=Math.round(gr*i/3);g.fillStyle(L.c,L.a*.32*(4-i)/3);g.fillRect(x-w,GY,2*w,1);g.fillStyle(L.c,L.a*.12*(4-i)/3);g.fillRect(x-w,GY+1,2*w,1+i*2)}
    for(const[p,w]of this.puddles){const pc=p+w/2;if(Math.abs(pc-x)<gr){const k=1-Math.abs(pc-x)/gr;g.fillStyle(L.c,L.a*.7*k);g.fillRect(p+2,GY,w-6,1);g.fillStyle(L.c,L.a*.4*k);const rx=Math.round(pc-(x-pc)*.15);g.fillRect(rx-1,GY+1,3,1);g.fillRect(rx,GY+2,1,1)}}}}}
 drawPlayer(g,ga){const P=this.player,x=Math.round(P.x),y=Math.round(P.y),f=P.f,t=this.t;
  if(P.dead){const fr=Math.min(5,Math.floor(P.deadT/.22));if(P.deadT<2)drawHero(g,x,y,f,'death',fr,t,{alpha:fr>=5?Math.max(0,1-(P.deadT-1.1)):1});if(fr>=4&&Math.random()<.3)this.fx.ember(x+rnd(-5,5),y-2,1,.5);return}
  if(P.inv>0&&P.state!=='roll'&&Math.floor(t*30)%2)return;
  glow(ga,x,y-8,14,C.f2,.05);this.light(x,y-8,26,C.f2,.22);
  let st=P.state,fr=0;
  if(st==='run')fr=Math.floor(P.run)%6;
  else if(st==='idle')fr=Math.floor(t*2)%2;
  else if(st==='atk')fr=P.t<TUNE.atkHit0?0:P.t<TUNE.atkHit1?1:P.t<.24?2:3;
  else if(st==='roll')fr=Math.min(4,Math.floor(P.t/TUNE.rollT*5));
  else if(st==='cast')fr=P.t<.1?0:P.t<.2?1:2;
  else if(st==='parry')fr=P.t<TUNE.parryWin?0:1;
  if(P.land>0&&st==='idle')st='rollrec';
  drawHero(g,x,y,f,st,fr,t,{flash:P.flash>0,combo:P.combo});
  if(P.state==='atk'&&P.t>=TUNE.atkHit0-.02&&P.t<TUNE.atkHit1+.08)drawSlash(ga,x+f*2,y-10,f,(P.t-TUNE.atkHit0+.02)/.18,SLASH,P.combo===1);
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
  if(e.dead){if(e.deadT<.5&&e.k!=='imp'){const k=e.deadT/.5;g.fillStyle(0x3a3157,1-k);g.fillRect(x-4,y-2,9,2);if(Math.random()<.5)this.fx.ember(x+rnd(-3,3),y-rnd(0,8),1,.5)}return}
  const fl=e.flash>0;
  if(e.k==='hollow'||e.k==='knight'){const kn=e.k==='knight',rim=0x3fb0a8;
   for(const[ox,oy]of[[-1,0],[1,0],[0,-1],[0,1]])this.drawHollow(g,e,x+ox,y+oy,f,rim,rim,kn);// cold teal rim
   const c=fl?0xffffff:kn?0x4f5a80:0x5b4f7a,s=fl?0xffffff:0x2e2748;this.drawHollow(g,e,x,y,f,c,s,kn);
   const ey=e.state==='wind'||e.state==='stag';px(g,X(3),y-13-(kn?2:0),ey?0xffffff:0xff5a3a);glow(ga,X(3),y-13,ey?5:2,0xff5a3a,ey?.4:.2);
   if(e.state==='swing'&&e.t<.12)drawSlash(ga,X(1),y-10,f,e.t/.12,{r:10,th:2,sweep:160,trail:1},e.combo===1)}
  else if(e.k==='wraith'){const cy=Math.round(b.y);const c=fl?0xffffff:0x24407a,l=fl?0xffffff:0x6fb0ff;glow(ga,x,cy+2,12,C.ice4,.16);this.light(x,cy,26,C.ice4,.45);
   for(let i=0;i<12;i++){const w=Math.round(i<4?i*1.2+1:4+Math.sin(i*.6)*0.5);const wav=i>8?Math.round(Math.sin(this.t*8+i)*1):0;g.fillStyle(c);g.fillRect(x-w+wav,cy-6+i,w*2+1,1);px(g,x-w+wav,cy-6+i,l,.8)}
   for(let k=-3;k<=3;k+=2)px(g,x+k+Math.round(Math.sin(this.t*9+k)),cy+6,c);
   g.fillStyle(0x0a0818);g.fillRect(x-2+f,cy-3,4,3);px(ga,x-1+f,cy-2,0xe8f6ff);px(ga,x+1+f,cy-2,0xe8f6ff);
   if(e.cast>0){glow(ga,x+f*6,cy,4+(.4-e.cast)*10,C.ice2,.35);sparkle(ga,x+f*6,cy,2,C.ice1)}}
  else if(e.k==='imp'){const fuse=e.state==='fuse';const c=fl||(fuse&&Math.floor(e.t*20)%2)?0xffffff:C.f3,l=C.f2;const sq=b.body.blocked.down?0:1;
   g.fillStyle(0xffb04a,.8);g.fillRect(x-4,y-7-sq,9,7+sq);// orange rim
   g.fillStyle(0x4a1008);g.fillRect(x-3,y-5-sq,7,5+sq);g.fillStyle(c);g.fillRect(x-3,y-6-sq,7,4+sq);g.fillStyle(l);g.fillRect(x-2,y-6-sq,5,1);px(g,x-1+f,y-4,C.f0);px(g,x+1+f,y-4,C.f0);
   glow(ga,x,y-4,fuse?6+e.t*16:6,C.f2,fuse?.3:.15);this.light(x,y-4,fuse?40:20,C.f2,fuse?.7:.35)}}
 drawBoss(g,ga,B){const x=Math.round(B.x),f=B.f,rise=B.rise===undefined?1:B.rise;const y=Math.round(GY+(1-rise)*40),X=d=>x+d*f;const fl=B.flash>0;if(B.flash>0&&this.dt)B.flash--;
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
 drawHUD(){const g=this.gu,ga=this.gua,P=this.player,t=this.t;g.clear();ga.clear();
  if(this.bars>0){const bh=Math.round(22*this.bars);g.fillStyle(0x05040b);g.fillRect(0,0,W,bh);g.fillRect(0,H-bh,W,bh)}
  if(this.flashA>0){ga.fillStyle(0xd8d0ff,this.flashA);ga.fillRect(0,0,W,H);this.flashA-=this.dt*2.2}
  if(this.flashF>0){ga.fillStyle(0xd8d0ff,.15);ga.fillRect(0,0,W,H);if(!this.paused)this.flashF--}
  const c=this.cine;
  if(c&&c.t>1.9&&c.t<3.9){const a=Math.min(1,(c.t-1.9)/.3)*Math.min(1,(3.9-c.t)/.3);const n='FROST WARDEN',sub='KEEPER OF THE ASHEN RAMPARTS';
   drawText(g,n,Math.round(W/2-textW(n,2)/2),130,0xd8f2ff,2,0x05040b,a);drawText(g,sub,Math.round(W/2-textW(sub)/2),145,0x8a86c0,1,null,a);g.fillStyle(0x9fd8ff,a);const lw=Math.round(120*Math.min(1,(c.t-1.9)/.6));g.fillRect(W/2-lw/2,141,lw,1)}
  if(!c&&!this.victory){
   const bar=(y,v,m,col,dark,w,fl)=>{g.fillStyle(0x07050f);g.fillRect(4,y-2,w+4,7);g.fillStyle(0x7a5a24);g.fillRect(5,y-1,w+2,1);g.fillRect(5,y+3,w+2,1);g.fillRect(5,y-1,1,5);g.fillRect(w+6,y-1,1,5);
    g.fillStyle(0xd8b060);g.fillRect(5,y-1,1,1);g.fillRect(w+6,y-1,1,1);g.fillRect(5,y+3,1,1);g.fillRect(w+6,y+3,1,1);
    g.fillStyle(fl?0x6a1010:dark);g.fillRect(6,y,w,2+0);g.fillRect(6,y+2,w,1);g.fillStyle(col);g.fillRect(6,y,Math.max(0,Math.round(w*v/m)),2);g.fillStyle(0xffffff,.25);g.fillRect(6,y,Math.max(0,Math.round(w*v/m)),1)};
   bar(6,P.hp,P.hpMax,0xd8402a,0x3a1020,70);bar(12,P.fp,P.fpMax,0x4a8cff,0x14204a,52);bar(18,P.st,P.stMax,0x58c060,0x14341c,60,P.stFlash>0&&Math.floor(t*16)%2===0);
   // flasks (code-drawn)
   for(let i=0;i<TUNE.flaskN;i++){const fx=6+i*8,fy=25,full=i<P.flasks;g.fillStyle(0x07050f);g.fillRect(fx-1,fy-1,7,9);g.fillStyle(0x8a84a8);g.fillRect(fx+2,fy,1,2);g.fillStyle(full?C.f2:0x2a2245);g.fillRect(fx,fy+2,5,5);g.fillStyle(full?C.f0:0x3a3060);g.fillRect(fx+1,fy+3,1,2);if(full)glow(ga,fx+2,fy+4,4,C.f2,.2)}
   if(P.flaskFlash>0){P.flaskFlash-=this.dt;if(Math.floor(t*16)%2)g.fillStyle(0xd8402a).fillRect(4,34,24,1)}
   const s=String(this.souls),sw=textW(s,2);g.fillStyle(0x9fd8ff);g.fillRect(W-sw-14,7,4,4);g.fillStyle(0xffffff);g.fillRect(W-sw-13,8,2,2);glow(ga,W-sw-12,9,5,C.ice3,.35);drawText(g,s,W-sw-6,5,0xd8d0ee,2);
   if(this.soulPop&&this.soulPop.t>0){const sp=this.soulPop;sp.t-=this.dt;const ps='+'+sp.n;drawText(g,ps,W-textW(ps)-6,19+Math.round((1.4-sp.t)*3),0x9fd8ff,1,0x07050f,Math.min(1,sp.t*2))}
   if(this.stain){const ds=Math.round(this.stain.x-P.x),ss='SOULS '+(ds>0?'>':'<');drawText(g,ss,W-textW(ss)-6,this.soulPop&&this.soulPop.t>0?27:20,0x5fe0c0,1,0x07050f,.6+.4*Math.sin(t*5))}
   const B=this.boss;if(B&&this.bossState==='fight'){const w=this.touch?140:180,x0=(W-w)/2,y0=H-14;drawText(g,'FROST WARDEN'+(this.ng?' +'+this.ng:''),x0,y0-7,0xd8d0ee);g.fillStyle(0x7a5a24);g.fillRect(x0-2,y0-2,w+4,7);g.fillStyle(0x07050f);g.fillRect(x0-1,y0-1,w+2,5);g.fillStyle(0x2a1020);g.fillRect(x0,y0,w,3);g.fillStyle(0xb8302a);g.fillRect(x0,y0,Math.max(0,Math.round(w*B.hp/B.hpMax)),3)}
   if(this.touch&&!this.paused)this.drawTouch(g)}
  if(this.msg){this.msg.t-=this.paused?0:this.dt;const m=this.msg,a=clamp(m.t*2,0,1);const big=m.s==='EMBER EXTINGUISHED'||m.s==='WARDEN SLAIN';const sc=big?2:1;
   if(big){g.fillStyle(0x05040b,.6*a);g.fillRect(0,78,W,22)}
   drawText(g,m.s,Math.round(W/2-textW(m.s,sc)/2),big?83:40,big?(m.s==='WARDEN SLAIN'?0xffe2a8:0xd8402a):0xd8d0ee,sc,0x05040b,a);if(m.t<=0)this.msg=null}
  if(this.paused)this.drawPause(g);
  if(this.victory)this.drawVictory(g,ga)}
 drawTouch(g){const h=this.tHeld||{};for(const b of TBTN){const on=h[b.k];g.fillStyle(on?0xffb04a:0x8a86c0,on?.45:.18);g.fillCircle(b.x,b.y,b.r);g.lineStyle(1,on?0xffe2a8:0x8a86c0,on?.9:.45);g.strokeCircle(b.x,b.y,b.r);
  drawText(g,b.lab,Math.round(b.x-textW(b.lab)/2),b.y-2,on?0xffffff:0xd8d0ee,1,null,on?1:.7)}}
 drawPause(g){g.fillStyle(0x05040b,.82);g.fillRect(0,0,W,H);drawText(g,'PAUSED',Math.round(W/2-textW('PAUSED',2)/2),22,0xffe2a8,2);
  const L=['ARROWS  MOVE','Z / SPACE  JUMP','X  ATTACK (TAP AGAIN: COMBO)','C  ROLL','A / SHIFT+X  PARRY','Q / F  DRINK FLASK','V  FROST SPIKES   S  STORM   D  DOME','UP / E  REST AT BONFIRE','M  SOUND '+(this.sound.mute?'OFF':'ON'),'ESC / P  RESUME'];
  L.forEach((s,i)=>drawText(g,s,70,46+i*10,i===8?0x9fd8ff:0xd8d0ee))}
 drawVictory(g,ga){const V=this.victory,a=Math.min(1,V.t/.6);g.fillStyle(0x05040b,.78*a);g.fillRect(0,0,W,H);
  g.fillStyle(0x7a5a24,a);g.fillRect(60,30,200,1);g.fillRect(60,150,200,1);
  drawText(g,'VICTORY ACHIEVED',Math.round(W/2-textW('VICTORY ACHIEVED',2)/2),40,0xffe2a8,2,0x1a0d22,a);glow(ga,W/2,46,50,C.f2,.08*a);
  const sub='THE FROST WARDEN IS ASH. THE GATE STANDS OPEN.';drawText(g,sub,Math.round(W/2-textW(sub)/2),60,0x8a86c0,1,null,a);
  const tm=Math.floor(this.playT),ts=`TIME ${Math.floor(tm/60)}:${String(tm%60).padStart(2,'0')}`;
  [[ts,78],['DEATHS '+this.sv.deaths,88],['SOULS '+this.souls,98]].forEach(([s,y])=>drawText(g,s,Math.round(W/2-textW(s)/2),y,0xd8d0ee,1,null,a));
  if(V.t>.8){const o=['JOURNEY ON (NG+'+(this.ng+1)+')','RETURN TO TITLE'];o.forEach((s,i)=>{const sel=V.sel===i,str=(sel?'> ':'  ')+s;drawText(g,str,Math.round(W/2-textW(str)/2),120+i*11,sel?0xffe2a8:0x6b67a0)})}}}
// ===================================================================
window.__G=new Phaser.Game({type:Phaser.AUTO,width:W,height:H,pixelArt:true,roundPixels:true,backgroundColor:'#0b081d',parent:document.body,
 scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},physics:{default:'arcade',arcade:{gravity:{y:800}}},
 fps:{target:60},audio:{noAudio:Q.has('mute')},scene:[Boot,Title,Lab,Stage]});
