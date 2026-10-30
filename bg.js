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
 // ===== bg pass 2: bold full-frame compositions. Each theme overrides sky/skyX/far/near; the ambient layers above stay.
 const poly=(x,c,p)=>{x.fillStyle=c;x.beginPath();x.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)x.lineTo(p[i],p[i+1]);x.closePath();x.fill()};
 const glow=(x,cx,cy,r,c0,c1='rgba(0,0,0,0)')=>{const g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,c0);g.addColorStop(1,c1);x.fillStyle=g;x.fillRect(cx-r,cy-r,2*r,2*r)};
 const dith=(x,w,fn,c,seed=1)=>{for(let y=0;y<H_;y++)for(let xx=0;xx<w;xx++){const v=fn(xx,y);if(v>(BY[y&3][xx&3]+.5)/16){x.fillStyle=c;x.fillRect(xx,y,1,1)}}};
 const stars=(x,w,n,seed,ymax=H_,cols=['#ffffff','#a8a0ff'])=>{const R=rnd(seed);for(let i=0;i<n;i++){x.fillStyle=cols[i%cols.length];x.fillRect(Math.floor(R()*w),Math.floor(R()*ymax),1,1)}};
 const spike=(x,c,cx,top,len,hw,up=false)=>{x.fillStyle=c;for(let i=0;i<len;i++){const h=Math.round(hw*(1-i/len));x.fillRect(cx-h,up?top-i:top+i,2*h+1,1)}};
 const O=(k,o)=>Object.assign(T[k],o);
 // CATHEDRAL — violet nave lit by a giant rose window, ranks of buttresses
 O('cathedral',{sky:['#140e30','#22184a','#32225e','#3e2a6a','#2a1c50'],
  skyX(x,w){const cx=160,cy=74;glow(x,cx,cy,110,'rgba(200,150,255,.35)');disc(x,'#1a1030',cx,cy,64);disc(x,'#d8b860',cx,cy,60);disc(x,'#1a1030',cx,cy,57);
   const cols=['#d83a4a','#3a6ad8','#e8c050','#3aa86a','#9a4ad8','#e86a2a'];for(let r=54;r>8;r-=1){for(let a=0;a<360;a+=2){const k=Math.floor(a/30)+(r<30?1:0);const rad=a*Math.PI/180;x.fillStyle=(r%12<2||a%30<3)?'#1a1030':cols[(k+(r<30?2:0))%6];x.fillRect(Math.round(cx+Math.cos(rad)*r),Math.round(cy+Math.sin(rad)*r),2,2)}}
   disc(x,'#f8e8a0',cx,cy,9);disc(x,'#1a1030',cx,cy,3);rect(x,'#1a1030',cx-70,cy+62,140,4)},
  far(x,w){for(let xx=0;xx<w;xx+=80)wrap(w,o=>{const b=o+xx;rect(x,'#2a1e52',b,30,22,G_-30);tri(x,'#2a1e52',b+11,30,22,11);rect(x,'#4a3a8a',b+9,50,4,60);rect(x,'#f0c870',b+10,54,2,50);
    for(let a=0;a<=40;a++){const t=a/40;x.fillStyle='#2a1e52';x.fillRect(Math.round(b+22+t*58),Math.round(60+Math.sin(t*Math.PI)*-24+t*20),3,4)}})},
  near(x,w){for(let xx=0;xx<w;xx+=200)wrap(w,o=>{rect(x,'#0e0820',o+xx,0,34,G_);rect(x,'#2a1e52',o+xx+32,0,2,G_);rect(x,'#0e0820',o+xx-6,0,46,10);arch(x,'#0e0820',o+xx+100,-30,66,10,6)})}});
 // CINDERDEEP — a cavern: ceiling teeth, jagged walls, a magma glow rising from below
 O('cinderdeep',{sky:['#120402','#2a0a04','#541608','#9a3010','#e0601a'],
  skyX(x,w){glow(x,160,180,200,'rgba(255,140,40,.55)');const R=rnd(91);poly(x,'#1c0805',[0,0,w,0,w,26,0,30]);for(let xx=0;xx<w;xx+=9){spike(x,'#1c0805',xx+4,24,14+R()*50,4+R()*4)}},
  far(x,w){const R=rnd(93);for(let xx=0;xx<w;xx+=22)wrap(w,o=>{const h=20+R()*70;spike(x,'#3a1208',o+xx+11,0,h,9);rect(x,'#e0601a',o+xx+11,h-2,1,2);const g=18+R()*50;spike(x,'#3a1208',o+xx+11,G_,g,10,true)})},
  near(x,w){const R=rnd(95);for(let xx=0;xx<w;xx+=70)wrap(w,o=>{const h=40+R()*80;spike(x,'#120403',o+xx+20,0,h,18);rect(x,'#ff9a3a',o+xx+20,h,1,3);spike(x,'#120403',o+xx+55,G_,30+R()*40,14,true);rect(x,'#c84a14',o+xx+41,G_-12,28,1)})}});
 // BELL TOWER — moonlit snow peaks under an icy sky
 O('belltower',{sky:['#0e1a3e','#1e3266','#34508e','#5a7ab4','#90b0d8'],
  skyX(x,w){glow(x,236,46,70,'rgba(220,235,255,.45)');disc(x,'#eef4ff',236,46,24);disc(x,'#c8d6ee',228,40,5);disc(x,'#c8d6ee',244,54,4);disc(x,'#d8e2f4',240,36,3);stars(x,w,60,5,90,['#ffffff','#c8dcff'])},
  far(x,w){const R=rnd(97);for(let xx=0;xx<w;xx+=90)wrap(w,o=>{const h=90+R()*40,hw=70;tri(x,'#3a5486',o+xx+45,G_,h,hw);tri(x,'#f4f8ff',o+xx+45,G_-h+30,30,hw*30/h);tri(x,'#c8d8f0',o+xx+52,G_-h+40,20,hw*18/h)})},
  near(x,w){const R=rnd(99);for(let xx=0;xx<w;xx+=110)wrap(w,o=>{const h=60+R()*30;tri(x,'#1a2850',o+xx+55,G_,h,80);tri(x,'#e8f0ff',o+xx+55,G_-h+18,18,80*18/h);for(let p=0;p<3;p++){const px=o+xx+10+p*34;tri(x,'#0c1430',px,G_,24,6);rect(x,'#e8f0ff',px-4,G_-10,9,1)}});rect(x,'#e8f0ff',0,G_-4,w,4)}});
 // FORGE — a lava sea under chimney smoke
 O('catacomb',{sky:['#140606','#3a0c06','#7a1a08','#d04a10','#ffa030'],
  skyX(x,w){glow(x,160,150,220,'rgba(255,190,60,.5)');for(let y=104;y<H_;y++){const t=(y-104)/76;for(let xx=0;xx<w;xx++){const v=Math.sin(xx*.09+y*.7)*.5+.5;x.fillStyle=v>.75-t*.2?'#ffe070':(v>.35?'#ff8a20':'#c83a0c');x.fillRect(xx,y,1,1)}}rect(x,'#fff0a0',0,104,w,1)},
  far(x,w){for(let xx=0;xx<w;xx+=160)wrap(w,o=>{const b=o+xx;poly(x,'#2a0c06',[b+10,G_,b+30,96,b+70,92,b+90,G_]);rect(x,'#1c0804',b+40,30,14,66);rect(x,'#1c0804',b+37,28,20,5);rect(x,'#ff7020',b+44,32,6,2);rect(x,'#1c0804',b+110,60,10,G_-60)})},
  near(x,w){for(let xx=0;xx<w;xx+=260)wrap(w,o=>{const b=o+xx;poly(x,'#100403',[b,G_,b,40,b+30,30,b+56,50,b+60,G_]);rect(x,'#ffd050',b+56,50,7,G_-50);rect(x,'#ff7a1a',b+62,50,3,G_-50);rect(x,'#fff4b0',b+57,50,2,G_-50);poly(x,'#100403',[b+180,G_,b+190,110,b+220,104,b+240,G_])})}});
 // DROWNED — underwater teal, sun shafts, kelp, sunken arches
 O('drowned',{sky:['#3ab8b0','#1a8a8e','#0c6068','#073e48','#04262e'],
  skyX(x,w){for(let k=0;k<6;k++){const sx=20+k*56;poly(x,'rgba(200,255,240,.14)',[sx,0,sx+18,0,sx+70,H_,sx+34,H_])}for(let xx=0;xx<w;xx+=2)rect(x,'#c8fff0',xx,4+Math.round(Math.sin(xx*.2)*2),1,1)},
  far(x,w){for(let xx=0;xx<w;xx+=128)wrap(w,o=>{const b=o+xx;arch(x,'#0a5058',b+64,60,40,G_,8);rect(x,'#0a5058',b+20,52,88,8);poly(x,'#0a5058',[b+100,52,b+128,40,b+128,52])})},
  near(x,w){const R=rnd(77);for(let xx=0;xx<w;xx+=26)wrap(w,o=>{const h=50+R()*90,ph=R()*6;for(let y=0;y<h;y++){const sx=o+xx+Math.round(Math.sin(y*.08+ph)*4);rect(x,'#0a3a30',sx,G_-y,3,1);if(y%9===0)rect(x,'#1a6a50',sx+3,G_-y,4,2)}});
   for(let xx=0;xx<w;xx+=200)wrap(w,o=>{poly(x,'#052228',[o+xx+120,G_,o+xx+124,G_-10,o+xx+150,G_-14,o+xx+156,G_])})}});
 // KEEP — a towering storm: heavy cloud banks, a frozen bolt, red banners on far walls
 O('keep',{sky:['#16161e','#262634','#3a3a4e','#4e4e66','#2a2a3a'],
  skyX(x,w){const R=rnd(55);for(let k=0;k<26;k++){const cx=R()*w,cy=10+R()*70,r=20+R()*24;disc(x,k%2?'#5a5a74':'#44445a',Math.round(cx),Math.round(cy),Math.round(r))}for(let k=0;k<18;k++)disc(x,'#2c2c3c',Math.round(R()*w),Math.round(70+R()*20),Math.round(14+R()*12));
   let lx=200,ly=30;x.fillStyle='#e8eaff';while(ly<130){const nx=lx+Math.round((R()-.5)*16);for(let i=0;i<8;i++)x.fillRect(Math.round(lx+(nx-lx)*i/8),ly+i,2,1);lx=nx;ly+=8}glow(x,200,40,60,'rgba(200,210,255,.3)')},
  far(x,w){rect(x,'#1e1e28',0,G_-56,w,56);for(let xx=0;xx<w;xx+=8)rect(x,'#1e1e28',xx,G_-60,5,4);for(let xx=0;xx<w;xx+=96)wrap(w,o=>{rect(x,'#1e1e28',o+xx+30,G_-96,26,96);for(let k=0;k<26;k+=7)rect(x,'#1e1e28',o+xx+30+k,G_-101,4,5);rect(x,'#b81c24',o+xx+36,G_-88,12,30);tri(x,'#16161e',o+xx+42,G_-58,6,6)})},
  near(x,w){const R=rnd(57);for(let i=0;i<260;i++){const a=R()*w,b=R()*H_;rect(x,'rgba(170,180,220,.35)',a,b,1,5)}}});
 // SPIRE — open space: nebulae, a ringed planet, drifting rock islands
 O('spire',{sky:['#04020e','#0a0620','#120a30','#0a0620','#04020e'],
  skyX(x,w){glow(x,80,60,110,'rgba(220,60,200,.45)');glow(x,250,120,110,'rgba(60,120,255,.45)');glow(x,170,80,60,'rgba(255,140,220,.25)');stars(x,w,180,9,H_,['#ffffff','#ffd0f8','#a0c0ff']);
   disc(x,'#d88a4a',250,54,30);for(let y=-30;y<=30;y+=4)rect(x,'#b0602a',250-Math.round(Math.sqrt(900-y*y)),54+y,Math.round(2*Math.sqrt(900-y*y)),2);x.strokeStyle='#f0d0a0';x.lineWidth=2;x.beginPath();x.ellipse(250,54,50,9,-.25,0,Math.PI*2);x.stroke();disc(x,'#c8b8ff',60,30,6)},
  far(x,w){const R=rnd(61);for(let xx=0;xx<w;xx+=110)wrap(w,o=>{const cy=40+R()*70,s=10+R()*14;rect(x,'#3a2e6a',o+xx+20-s,cy,s*2,4);spike(x,'#2a2050',o+xx+20,cy+4,s*1.6,s)})},
  near(x,w){const R=rnd(63);for(let xx=0;xx<w;xx+=200)wrap(w,o=>{const cy=60+R()*60,s=20+R()*10;rect(x,'#4a3a8a',o+xx+40-s,cy-2,s*2,3);rect(x,'#160f30',o+xx+40-s,cy,s*2,5);spike(x,'#160f30',o+xx+40,cy+5,s*1.8,s)})}});
 // CLOISTER — a rotting garden under towering stained glass
 O('cloister',{sky:['#1a2a12','#2e4418','#4a6020','#6a7a2a','#2a3814'],
  skyX(x,w){const cs=['#e04a3a','#3a7ae0','#f0c040','#5ac060','#b05ae0'];for(let k=0;k<3;k++){const cx=50+k*110,top=14;rect(x,'#141c0c',cx-34,top-4,68,130);arch(x,'#141c0c',cx,top-4,34,top+126,4);for(let yy=top+30;yy<top+120;yy+=8)for(let xx=cx-28;xx<cx+28;xx+=8)rect(x,cs[((xx+yy)/8+k)%5|0],xx+1,yy+1,6,6);
   for(let yy=top;yy<top+30;yy+=6)for(let xx=cx-28;xx<cx+28;xx+=6){const d=Math.hypot(xx+3-cx,yy+3-(top+30));if(d<28)rect(x,cs[(k+((xx+yy)/6|0))%5],xx+1,yy+1,4,4)}glow(x,cx,top+60,70,'rgba(255,230,140,.18)')}},
  far(x,w){for(let xx=0;xx<w;xx+=40)wrap(w,o=>{arch(x,'#24341a',o+xx+20,G_-58,16,G_,4);rect(x,'#24341a',o+xx,G_-62,40,4)});rect(x,'#2e4a1a',0,G_-10,w,10)},
  near(x,w){const R=rnd(65);for(let xx=0;xx<w;xx+=130)wrap(w,o=>{const bx=o+xx+40;for(let y=0;y<110;y++)rect(x,'#0c140a',bx+Math.round(Math.sin(y*.07)*3),G_-y,Math.max(3,10-y/12),1);for(let b=0;b<4;b++){const by=G_-50-b*14,d=b%2?1:-1;for(let i=0;i<26;i++)rect(x,'#0c140a',bx+d*i,by-i*.4+i*i*.02,2,2)}
   for(let i=0;i<9;i++)disc(x,['#c03a5a','#e0c040','#80d060'][i%3],o+xx+80+i*5,G_-3-(i%2)*3,2)})}});
 // THRONE — the void: a broken colossus fills the frame between rifts
 O('throne',{sky:['#020104','#08040e','#120818','#1a0a22','#0a0410'],
  skyX(x,w){stars(x,w,140,13,H_,['#ffffff','#e0a0ff']);for(const[rx,ry,s]of[[40,30,1],[290,90,-1],[60,130,1]]){let a=rx,b=ry;x.fillStyle='#ff4ad8';for(let i=0;i<30;i++){a+=2*s;b+=Math.round(Math.sin(i*1.7)*2);x.fillRect(a,b,2,2)}glow(x,rx+30*s,ry,40,'rgba(255,80,220,.35)')}
   const c='#3c2258',e='#b08ae0';glow(x,160,80,170,'rgba(200,70,230,.55)');x.save();x.translate(160,190);x.scale(1.9,1.9);x.translate(-160,-180);poly(x,c,[100,180,96,120,110,96,132,88,188,88,214,98,226,124,230,180]);poly(x,c,[130,90,134,44,146,26,174,26,186,44,190,90]);
   poly(x,'#08040e',[146,26,160,60,152,90,140,90]);rect(x,'#ff6af0',150,52,6,3);rect(x,'#ff6af0',166,52,6,3);poly(x,c,[214,98,250,110,262,150,248,152,238,124,226,124]);poly(x,c,[100,104,76,118,70,128,96,124]);rect(x,'#08040e',66,128,14,4);
   rect(x,e,134,44,1,46);rect(x,e,96,120,1,60);rect(x,e,110,96,22,1);poly(x,'#0a0410',[180,120,196,140,188,180,170,180]);x.restore()},
  far(x,w){const R=rnd(67);for(let i=0;i<14;i++){const a=R()*w,b=20+R()*120,s=2+R()*5;poly(x,'#3a2450',[a,b,a+s*2,b-s,a+s*3,b+s,a+s,b+s*1.5])}},
  near(x,w){for(let xx=0;xx<w;xx+=260)wrap(w,o=>{const b=o+xx;rect(x,'#0c0614',b+10,G_-70,20,70);poly(x,'#0c0614',[b+10,G_-70,b+18,G_-84,b+30,G_-74]);rect(x,'#0c0614',b+150,G_-40,16,40)})}});
 // ramparts keeps its gothic city (the original backdrop); the shrine keeps its hub sky
 T.ramparts=null;
 return T})();
