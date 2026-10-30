// ASHEN VIGIL — per-stage parallax backdrops, all code-drawn (no images). Each theme paints three tileable layers
// (sky 320, far 640, near 800) in its own palette and silhouettes, plus a screen-space ambient layer animated every frame.
'use strict';
const BGART=(()=>{
 const H_=180,G_=156;
 const rnd=s=>{let a=s>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}};
 const BY=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
 const sky=(x,w,bands,stars,seed=7)=>{for(let y=0;y<H_;y++){const t=Math.min(.999,y/150)*(bands.length-1),i=Math.floor(t),f=t-i;for(let xx=0;xx<w;xx++){x.fillStyle=bands[Math.min(bands.length-1,i+(f>(BY[y&3][xx&3]+.5)/16?1:0))];x.fillRect(xx,y,1,1)}}
  const R=rnd(seed);for(let i=0;i<stars;i++){x.fillStyle=R()>.85?'#f0ecff':'#7a76a8';x.fillRect(Math.floor(R()*w),Math.floor(R()*110),1,1)}};
 const rect=(x,c,a,b,w,h)=>{x.fillStyle=c;x.fillRect(Math.round(a),Math.round(b),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))};
 const tri=(x,c,cx,base,h,half)=>{x.fillStyle=c;for(let i=0;i<h;i++){const hw=Math.round(half*i/h);x.fillRect(cx-hw,base-h+i,2*hw+1,1)}};
 const disc=(x,c,cx,cy,r)=>{x.fillStyle=c;for(let dy=-r;dy<=r;dy++){const hw=Math.round(Math.sqrt(r*r-dy*dy));x.fillRect(cx-hw,cy+dy,2*hw+1,1)}};
 const arch=(x,c,cx,top,hw,bottom,th=3)=>{x.fillStyle=c;for(let a=0;a<=40;a++){const an=Math.PI*a/40;x.fillRect(Math.round(cx-Math.cos(an)*hw),Math.round(top+hw-Math.sin(an)*hw),th,th)}x.fillRect(cx-hw,top+hw,th,bottom-top-hw);x.fillRect(cx+hw-th+1,top+hw,th,bottom-top-hw)};
 const wrap=(w,fn)=>{for(const o of[-w,0,w])fn(o)};// draw twice across the seam so layers tile
 const T={};
 // ---- THE PALE CATHEDRAL: moonlit nave, needle spires, flying buttresses, rose windows; ambient light shafts + motes
 T.cathedral={sky:['#0a0f1c','#101a2e','#18263e','#22344e','#2c4260'],
  skyX(x,w){disc(x,'#cfe0f0',240,40,13);disc(x,'#22344e',245,37,11)},
  far(x,w){const R=rnd(3);for(let xx=0;xx<w;xx+=70){const h=60+R()*40;wrap(w,o=>{rect(x,'#121c32',o+xx+10,G_-h,30,h);tri(x,'#121c32',o+xx+25,G_-h,46,15);rect(x,'#2a3d63',o+xx+22,G_-h+14,6,14)})}},
  near(x,w){for(let xx=0;xx<w;xx+=100){wrap(w,o=>{rect(x,'#0a0f1e',o+xx,G_-70,40,70);tri(x,'#0a0f1e',o+xx+20,G_-70,30,20);arch(x,'#0a0f1e',o+xx+70,G_-60,30,G_,4);disc(x,'#2e4a78',o+xx+20,G_-48,7);disc(x,'#0a0f1e',o+xx+20,G_-48,4);x.fillStyle='#5a7aaa';x.fillRect(o+xx+19,G_-49,3,3)})}},
  amb(g,t,cx){for(let i=0;i<4;i++){const sx=((i*97-cx*.2)%400+400)%400-40;g.fillStyle(0xaac8f0,.05+.02*Math.sin(t+i));g.fillTriangle(sx,0,sx+24,0,sx+60,180)}for(let i=0;i<24;i++){g.fillStyle(0xdfe8ff,.5);g.fillRect(((i*53+t*6)%320),((i*37+Math.sin(t+i)*8)%170),1,1)}}};
 // ---- THE BURNING CINDERDEEP: a magma cavern: stalactites, a lava-lit horizon, basalt columns; ambient rising embers + heat haze
 T.cinderdeep={sky:['#140404','#200806','#300c08','#4a140a','#6a200c'],
  skyX(x,w){const R=rnd(5);for(let xx=0;xx<w;xx+=9)tri(x,'#0e0303',xx,10+R()*30,10+R()*30,4);for(let xx=0;xx<w;xx++){x.fillStyle='#000';x.fillRect(xx,0,1,3+Math.floor(R()*4))}},
  far(x,w){const R=rnd(11);rect(x,'#a83810',0,G_-18,w,2);for(let xx=0;xx<w;xx+=24){const h=24+R()*40;wrap(w,o=>{tri(x,'#1c0907',o+xx+12,G_,h,14);rect(x,'#c04a14',o+xx+11,G_-h+4,2,2)})}},
  near(x,w){const R=rnd(13);for(let xx=0;xx<w;xx+=60){const h=50+R()*60;wrap(w,o=>{rect(x,'#100404',o+xx+8,G_-h,18,h);for(let k=0;k<h;k+=10)rect(x,'#2a0c08',o+xx+8,G_-h+k,18,1);rect(x,'#5a2010',o+xx+26,G_-h,1,h)})}},
  amb(g,t){for(let i=0;i<30;i++){const y=180-((t*30+i*41)%190),xx=(i*67+Math.sin(t*2+i)*6)%320;g.fillStyle(i%3?0xff8a3a:0xffd080,.8);g.fillRect(xx,y,1,1)}g.fillStyle(0xff5a1a,.06+.03*Math.sin(t*3));g.fillRect(0,130,320,26)}};
 // ---- THE FROZEN BELL TOWER: jagged frozen peaks, a ridge of belfries with hanging bells; ambient snowstorm + swinging great bells
 T.belltower={sky:['#070b14','#0e1828','#16243c','#203450','#2c4466'],
  skyX(x,w){},
  far(x,w){const R=rnd(21);for(let xx=0;xx<w;xx+=48){const h=60+R()*60,hw=30+R()*20;wrap(w,o=>{tri(x,'#1a2a44',o+xx+24,G_,h,hw);tri(x,'#e8f4ff',o+xx+24,G_-h+16,16,hw*16/h);tri(x,'#b8d0f0',o+xx+30,G_-h+20,12,hw*10/h)})}},
  near(x,w){for(let xx=0;xx<w;xx+=160){wrap(w,o=>{rect(x,'#09101c',o+xx+20,G_-96,26,96);tri(x,'#09101c',o+xx+33,G_-96,24,16);rect(x,'#2c4a70',o+xx+24,G_-80,18,1);arch(x,'#09101c',o+xx+33,G_-82,8,G_-62,2);rect(x,'#09101c',o+xx+80,G_-40,60,40)})}},
  amb(g,t,cx){for(let k=0;k<3;k++){const bx=((k*140+60-cx*.4)%480+480)%480-80,ang=Math.sin(t*1.6+k)*.45,L=26,px=bx+Math.sin(ang)*L,py=40+Math.cos(ang)*L;g.lineStyle(1,0x2c4a70,.8);g.lineBetween(bx,40,px,py);g.fillStyle(0x3a5a80,.9);g.fillTriangle(px-7,py+9,px+7,py+9,px,py-3);g.fillRect(px-7,py+8,15,2)}
   for(let i=0;i<70;i++){const xx=((i*41+t*(40+i%5*8))%340)-10,yy=((i*29+t*(55+i%7*6))%190)-5;g.fillStyle(0xf0f6ff,i%4?.55:.9);g.fillRect(xx,yy,i%6?1:2,1)}}};
 // ---- THE CATACOMB FORGE: smoke-stack chimneys, foundry walls with lava falls; ambient pouring lava + rolling smoke
 T.catacomb={sky:['#0e0606','#180a08','#22100a','#30160c','#44200e'],
  skyX(x,w){},
  far(x,w){const R=rnd(31);for(let xx=0;xx<w;xx+=80){const h=80+R()*50;wrap(w,o=>{rect(x,'#170807',o+xx+30,G_-h,12,h);rect(x,'#2a100a',o+xx+28,G_-h,16,4);rect(x,'#170807',o+xx,G_-40,80,40)})}},
  near(x,w){for(let xx=0;xx<w;xx+=200){wrap(w,o=>{rect(x,'#0c0404',o+xx,G_-110,70,110);rect(x,'#e06a1a',o+xx+50,G_-100,6,100);rect(x,'#ffc060',o+xx+52,G_-100,2,100);rect(x,'#0c0404',o+xx+120,G_-60,50,60);rect(x,'#c04a14',o+xx+130,G_-30,30,2)})}},
  amb(g,t,cx){for(let k=0;k<4;k++){const sx=((k*160+36-cx*.15)%640+640)%640-160;for(let j=0;j<6;j++){const ph=(t*.3+j/6)%1;g.fillStyle(0x3a2a26,.35*(1-ph));g.fillCircle(sx+Math.sin(ph*6+k)*6,60-ph*60-((k*13)%30),4+ph*10)}}
   for(let k=0;k<3;k++){const lx=((k*200+52-cx*.4)%600+600)%600-100;for(let y=56;y<156;y+=6){g.fillStyle((y/6+Math.floor(t*12))%2?0xffd080:0xff7a2a,.7);g.fillRect(lx,y,2,3)}}}};
 // ---- THE DROWNED CRYPT: a sunken nave under green water: drowned arches, stacked coffins, kelp; ambient caustics + bubbles
 T.drowned={sky:['#03090e','#06121a','#0a1c24','#0e2830','#14363e'],
  skyX(x,w){},
  far(x,w){for(let xx=0;xx<w;xx+=64)wrap(w,o=>{arch(x,'#0c2028',o+xx+32,G_-110,22,G_,5);rect(x,'#0c2028',o+xx+4,G_-110,56,4)})},
  near(x,w){const R=rnd(41);for(let xx=0;xx<w;xx+=90){wrap(w,o=>{for(let k=0;k<3;k++){const cy=G_-12-k*13,cw=26-k*2;x.fillStyle='#071318';x.beginPath();x.moveTo(o+xx+10,cy);x.lineTo(o+xx+10+cw*.3,cy-10);x.lineTo(o+xx+10+cw,cy-8);x.lineTo(o+xx+10+cw,cy);x.closePath();x.fill();rect(x,'#1c3a44',o+xx+12,cy-6,cw-4,1)}
   for(let k=0;k<4;k++){const kx=o+xx+60+k*6;for(let y=G_-30-R()*30;y<G_;y+=2)rect(x,'#0e2a26',kx+Math.round(Math.sin(y*.3+k)*2),y,2,2)}})}},
  amb(g,t){for(let i=0;i<14;i++){g.lineStyle(1,0x7ad8d0,.08+.04*Math.sin(t*2+i));g.beginPath();for(let xx=0;xx<=320;xx+=16){const y=8+i*9+Math.sin(xx*.05+t*1.5+i)*3;xx?g.lineTo(xx,y):g.moveTo(xx,y)}g.strokePath()}
   for(let i=0;i<16;i++){const y=180-((t*18+i*23)%180);g.fillStyle(0xbff0ea,.5);g.fillRect((i*71+Math.sin(t*2+i)*3)%320,y,2,2)}}};
 // ---- THE RUINED RAMPART KEEP: a storm front, far curtain walls with towers and banners; ambient racing clouds, lightning, flapping banners
 T.keep={sky:['#0a0a12','#14141e','#1e1e2a','#2a2a36','#383844'],
  skyX(x,w){const R=rnd(51);for(let i=0;i<22;i++)disc(x,'#24242e',Math.floor(R()*w),20+Math.floor(R()*50),6+Math.floor(R()*12))},
  far(x,w){rect(x,'#141418',0,G_-44,w,44);for(let xx=0;xx<w;xx+=8)rect(x,'#141418',xx,G_-48,4,4);for(let xx=0;xx<w;xx+=128)wrap(w,o=>{rect(x,'#141418',o+xx+50,G_-80,24,80);for(let k=0;k<24;k+=6)rect(x,'#141418',o+xx+50+k,G_-84,4,4);rect(x,'#3a3a48',o+xx+60,G_-70,3,5)})},
  near(x,w){const R=rnd(53);for(let xx=0;xx<w;xx+=110){const h=40+R()*50;wrap(w,o=>{rect(x,'#0a0a10',o+xx,G_-h,50,h);for(let k=0;k<50;k+=10)rect(x,'#0a0a10',o+xx+k,G_-h-5,6,5);rect(x,'#0a0a10',o+xx+50,G_-h*.5,30,h*.5);tri(x,'#16151a',o+xx+60,G_-h*.5,8,8)})}},
  amb(g,t,cx){for(let i=0;i<6;i++){const xx=((i*80-t*14-cx*.05)%480+480)%480-80;g.fillStyle(0x30303c,.55);g.fillEllipse(xx,18+(i%3)*12,90,16)}
   const L=(t%7);if(L<.18){g.fillStyle(0xdfe4ff,.35*(1-L/.18));g.fillRect(0,0,320,180);const lx=((Math.floor(t/7)*97)%260)+30;g.lineStyle(1,0xf0f4ff,.9);g.beginPath();g.moveTo(lx,0);let y=0,xx=lx;while(y<90){y+=12;xx+=((y*7)%11)-5;g.lineTo(xx,y)}g.strokePath()}
   for(let k=0;k<5;k++){const bx=((k*128+62-cx*.15)%640+640)%640-160;const by=G_-84-22;g.lineStyle(1,0x5a5650,1);g.lineBetween(bx,by,bx,by+22);for(let s=0;s<8;s++){const wv=Math.sin(t*6+s*.8+k)*1.5;g.fillStyle(k%2?0x8a2a24:0x6a5a24,1);g.fillRect(bx+1+s*2,by+1+wv,2,7)}}}};
 // ---- THE ASTRAL SPIRE: nebulae, ringed planets, needle observatories, floating stones; ambient bobbing stones + twinkles
 T.spire={sky:['#05041a','#0c0828','#140e38','#1e1648','#2a205a'],
  skyX(x,w){const R=rnd(61);for(let i=0;i<9;i++){const cx=R()*w,cy=10+R()*80,c=['#3a1e5a','#1e2a5a','#4a2050'][i%3];for(let k=0;k<5;k++)disc(x,c,Math.round(cx+R()*30-15),Math.round(cy+R()*14-7),6+Math.floor(R()*8))}for(let i=0;i<90;i++){x.fillStyle=R()>.8?'#ffffff':'#a8a0e8';x.fillRect(Math.floor(R()*w),Math.floor(R()*130),1,1)}},
  far(x,w){disc(x,'#6a5aa8',120,48,16);disc(x,'#8a7ac8',116,44,10);x.fillStyle='#c8b8ff';for(let a=-28;a<=28;a++)x.fillRect(120+a,48+Math.round(a*.12),1,1);disc(x,'#b87a5a',470,30,7);
   for(let xx=0;xx<w;xx+=90)wrap(w,o=>{rect(x,'#0c0a1e',o+xx+40,G_-90,10,90);tri(x,'#0c0a1e',o+xx+45,G_-90,30,6);disc(x,'#0c0a1e',o+xx+45,G_-60,9)})},
  near(x,w){rect(x,'#06051a',0,G_-14,w,14);for(let xx=0;xx<w;xx+=160)wrap(w,o=>{rect(x,'#06051a',o+xx+20,G_-50,30,50);arch(x,'#06051a',o+xx+90,G_-46,18,G_,4)})},
  amb(g,t,cx){for(let k=0;k<7;k++){const sx=((k*70+20-cx*.3)%490+490)%490-80,sy=50+((k*37)%60)+Math.sin(t*1.2+k)*5,s=6+(k%3)*4;g.fillStyle(0x2a2648,1);g.fillRect(sx-s,sy,2*s,s*.6);g.fillTriangle(sx-s,sy+s*.6,sx+s,sy+s*.6,sx,sy+s*1.6);g.fillStyle(0x8a80c8,.7);g.fillRect(sx-s,sy,2*s,1)}
   for(let i=0;i<14;i++){g.fillStyle(0xffffff,.4+.6*Math.abs(Math.sin(t*2+i*1.7)));g.fillRect((i*83)%320,(i*47)%120,1,1)}}};
 // ---- THE BLIGHTED CLOISTER: a cloister wall of stained glass, rotted trees in the garth; ambient drifting spores + glass glints
 T.cloister={sky:['#06100a','#0c180e','#122214','#1a2c1a','#243822'],
  skyX(x,w){},
  far(x,w){rect(x,'#0c140c',0,G_-90,w,90);const cs=['#a8c890','#c86a5a','#6a8ac8','#d8b860'];for(let xx=0;xx<w;xx+=64)wrap(w,o=>{arch(x,'#2e3e26',o+xx+32,G_-80,12,G_-40,2);for(let r=0;r<3;r++)for(let c=0;c<3;c++)rect(x,cs[(r+c+xx/64)%4],o+xx+24+c*6,G_-66+r*8,4,6)})},
  near(x,w){const R=rnd(71);for(let xx=0;xx<w;xx+=120){wrap(w,o=>{const bx=o+xx+40;let tx=bx,ty=G_;for(let y=0;y<70;y++){tx+=Math.round(Math.sin(y*.15+xx)*.8);rect(x,'#060c06',tx-3+Math.floor(y/30),G_-y,7-Math.floor(y/12),1)}
   for(let b=0;b<5;b++){let bx2=tx,by2=G_-50-b*4;const d=b%2?1:-1;for(let k=0;k<16+R()*10;k++){bx2+=d;by2-=k%3===0?1:0;by2+=k>12?1:0;rect(x,'#060c06',bx2,by2,2,1)}}})}},
  amb(g,t){for(let i=0;i<40;i++){const xx=((i*59+t*(6+i%4*3))%340)-10,yy=180-((t*(8+i%5*2)+i*31)%190);g.fillStyle(i%3?0xb8e070:0xe0f0a0,.55);g.fillRect(xx+Math.sin(t*2+i)*3,yy,i%5?1:2,i%5?1:2)}
   for(let i=0;i<4;i++){g.fillStyle([0xc86a5a,0x6a8ac8,0xd8b860,0xa8c890][i],.05+.05*Math.sin(t*1.5+i*1.3));g.fillRect(i*80+10,40,40,100)}}};
 // ---- THE HOLLOW THRONE: a starless void, a broken colossus kneeling at the edge of the world, toppled pillars; ambient ash rising + void ripple
 T.throne={sky:['#030202','#070505','#0c0908','#120e0b','#1a140f'],
  skyX(x,w){const R=rnd(81);for(let i=0;i<30;i++){x.fillStyle='#3a3026';x.fillRect(Math.floor(R()*w),Math.floor(R()*120),1,1)}},
  far(x,w){const cx=320;rect(x,'#120e0a',cx-40,G_-70,80,70);rect(x,'#120e0a',cx-30,G_-100,60,30);rect(x,'#120e0a',cx-70,G_-95,34,16);rect(x,'#120e0a',cx-74,G_-95,10,60);rect(x,'#120e0a',cx+36,G_-92,20,14);
   for(let k=0;k<6;k++)rect(x,'#030202',cx-30+k*10,G_-104+((k*7)%6),8,6);disc(x,'#120e0a',cx+120,G_-12,18);rect(x,'#3a3026',cx+113,G_-18,4,3);rect(x,'#3a3026',cx+124,G_-18,4,3);rect(x,'#d8b890',cx-2,G_-84,4,1)},
  near(x,w){const R=rnd(83);for(let xx=0;xx<w;xx+=100){const h=40+R()*70;wrap(w,o=>{rect(x,'#080604',o+xx+10,G_-h,16,h);rect(x,'#080604',o+xx+6,G_-h,24,5);for(let k=0;k<5;k++)rect(x,'#080604',o+xx+26+k*5,G_-k*3-4,6,4+k*3)})}},
  amb(g,t){for(let i=0;i<36;i++){const y=180-((t*(10+i%4*4)+i*37)%190);g.fillStyle(i%4?0x8a7a66:0xd8b890,.5);g.fillRect((i*71+Math.sin(t+i)*5)%320,y,1,1)}
   const r=(t*20)%140;g.lineStyle(1,0xd8b890,.12*(1-r/140));g.strokeEllipse(160,60,r*2,r*.6)}};
 // ramparts keeps its gothic city (the original backdrop); the shrine keeps its hub sky
 T.ramparts=null;
 return T})();
