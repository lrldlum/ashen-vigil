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
const BOSS_VIDEO={cantor:{mp4:'assets/cine/cantor.mp4',muted:'assets/cine/cantor_muted.mp4'}};
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
// text readability: "Vigil 5x7", an original mixed-case pixel font drawn for this game (caps 7 rows, 2-row descenders, 6px advance).
// TXT.big=1 (Large, default) uses it for all 1x text; Small keeps the classic 3x5 caps font. Both draw with a 1px dark outline.
const FONT2={"A":"0e11111f1111110000","B":"1e11111e11111e0000","C":"0e11101010110e0000","D":"1e11111111111e0000","E":"1f10101e10101f0000","F":"1f10101e1010100000","G":"0e11101711110f0000","H":"1111111f1111110000","I":"0e04040404040e0000","J":"0702020202120c0000","K":"111214181412110000","L":"1010101010101f0000","M":"111b15151111110000","N":"111915131111110000","O":"0e11111111110e0000","P":"1e11111e1010100000","Q":"0e11111115120d0000","R":"1e11111e1412110000","S":"0f10100e01011e0000","T":"1f0404040404040000","U":"1111111111110e0000","V":"11111111110a040000","W":"11111115151b110000","X":"11110a040a11110000","Y":"11110a040404040000","Z":"1f01020408101f0000","a":"00000e010f110f0000","b":"10101e1111111e0000","c":"00000e1010100e0000","d":"01010f1111110f0000","e":"00000e111f100e0000","f":"0608081e0808080000","g":"00000f11110f01010e","h":"10101e111111110000","i":"04000c0404040e0000","j":"02000602020202120c","k":"101012141814120000","l":"0c04040404040e0000","m":"00001a151515110000","n":"00001e111111110000","o":"00000e1111110e0000","p":"00001e11111e101010","q":"00000f11110f010101","r":"000016191010100000","s":"00000f100e011e0000","t":"08081e080809060000","u":"0000111111130d0000","v":"00001111110a040000","w":"0000111115150a0000","x":"0000110a040a110000","y":"00001111110f01010e","z":"00001f0204081f0000","0":"0e11131519110e0000","1":"040c040404040e0000","2":"0e11010204081f0000","3":"1e01010e01011e0000","4":"02060a121f02020000","5":"1f101e0101110e0000","6":"0e10101e11110e0000","7":"1f0102040808080000","8":"0e11110e11110e0000","9":"0e11110f01010e0000"," ":"000000000000000000",".":"000000000000040000",",":"000000000004040800",":":"000400000004000000",";":"000400000004040800","!":"040404040400040000","?":"0e1101020400040000","'":"040408000000000000","\"":"0a0a00000000000000","-":"0000000e0000000000","+":"0004041f0404000000","=":"00001f001f00000000","/":"010102040810100000","(":"020408080804020000",")":"080402020204080000","<":"020408100804020000",">":"080402010204080000","^":"040a11000000000000","%":"191a0204080b130000","_":"0000000000001f0000","*":"00150e1f0e15000000","#":"0a1f0a0a1f0a000000","&":"0c120c0815120d0000"};
const TXT={big:(()=>{try{return localStorage.getItem('ashenVigil.text')!=='small'?1:0}catch(e){return 1}})(),
 set(big,sv){this.big=big?1:0;try{localStorage.setItem('ashenVigil.text',big?'large':'small')}catch(e){}if(sv){sv.textSize=big?'large':'small';Save.write(sv)}}};
const RUNS=new Map();
function glyphRuns(big,ch){const key=(big?'b':'s')+ch;let r=RUNS.get(key);if(r)return r;r=[];
 if(big){const h=FONT2[ch]||FONT2[' '];for(let y=0;y<9;y++){const v=parseInt(h.substr(y*2,2),16);let x=0;while(x<5){if(v&(16>>x)){let e=x;while(e<5&&v&(16>>e))e++;r.push([x,y,e-x]);x=e}else x++}}}
 else{const f=FONT[ch]||FONT[' '];for(let y=0;y<5;y++){let x=0;while(x<3){if(f[y*3+x]==='1'){let e=x;while(e<3&&f[y*3+e]==='1')e++;r.push([x,y,e-x]);x=e}else x++}}}
 RUNS.set(key,r);return r}
const ACR=new Set(['HP','FP','NG','UP','ESC','LV','FTH','STR','DEX','INT','VIT','END','ARC','OK','II','III','IV','VI','PVP','WASD','AI']);
const SMALLW=new Set(['of','the','a','an','and','to','in','at','on','for','is','by','or']);
const COMMONW=new Set(['ASH','FLAME','FIRE','DARK','FIRST','LAST','STAR','STARS','BELL','BELLS','TIDE']);// lowercase inside sentences
let PROPER=null;
function properNouns(){if(PROPER)return PROPER;PROPER=new Set();const add=n=>{if(typeof n==='string')n.split(/[^A-Z']+/).forEach(w=>{if(w.length>2&&!SMALLW.has(w.toLowerCase()))PROPER.add(w)})};
 try{for(const k in STAGE_DEFS){const d=STAGE_DEFS[k];add(d.name);add(d.bonfireName);if(d.boss)add(d.boss.name)}}catch(e){}
 try{add(KEEPER.name)}catch(e){}try{for(const k in CLASSES)add(CLASSES[k].name)}catch(e){}
 for(const w of['ASHEN','KEEPER','VIGIL','FLAME','CASTELLAN','ASTRONOMER','PRIORESS','HEIR','WARDEN','SHRINE'])PROPER.add(w);return PROPER}
const NICE=new Map();
// fewer all-caps blocks: short labels become Title Case, sentences become sentence case (names, acronyms and key letters stay capitalised)
// r9 P3: sentence case everywhere; only whole names from an allow-list (stages, bosses, the keeper, classes, a few titles) keep capitals
let NAMES=null;
function nameList(){if(NAMES)return NAMES;const L=new Set(['ASHEN ONE','FIRST FLAME','VIGIL','EMBER KNIGHT','ASHEN VIGIL']);const add=n=>{if(typeof n==='string'&&n.trim())L.add(n.trim().replace(/^THE\s+/,''))};
 try{for(const k in WEAPONS)add(WEAPONS[k].name)}catch(e){}try{for(const k in STAGE_DEFS){const d=STAGE_DEFS[k];add(d.name);if(!d.boss||d.boss.name!==d.name){const w=(d.name||'').replace(/^THE\s+/,'').split(/\s+/);if(w.length>=3&&!/ OF /.test(d.name))add(w.slice(1).join(' '))}add(d.bonfireName);if(d.boss){add(d.boss.name)}}}catch(e){}try{add(KEEPER.name)}catch(e){}try{for(const k in CLASSES)add(CLASSES[k].name)}catch(e){}
 NAMES=[...L].filter(n=>n.length>2).sort((x,y)=>y.length-x.length).map(n=>({re:new RegExp('\\b'+n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\s+/g,'\\s+')+'\\b','gi'),to:n.toLowerCase().replace(/(^|[\s-])([a-z])/g,(m,p,c)=>p+c.toUpperCase()).replace(/\b(Of|The|And|In)\b/g,w=>w.toLowerCase())}));return NAMES}
// description blocks are cased as one text, so a line that continues a sentence starts lower-case
const DESC_N=new Map();function descLines(id){const a=(typeof DESC!=='undefined'&&DESC[id])||[];if(!TXT.big)return a;let r=DESC_N.get(id);if(!r){r=nice(a.join(' \n ')).split(' \n ');DESC_N.set(id,r)}return r}
function nice(s){if(!/[A-Z]{2}/.test(s)||/[a-z]/.test(s))return s;let r=NICE.get(s);if(r!==undefined)return r;
 let start=true;r=s.replace(/[A-Z][A-Z']*/g,(w,i)=>{const pre=s.slice(0,i);if(w.length===1&&w!=='A'||ACR.has(w))return w;const sent=start||/[.!?:]\s+$|[(]\s*$/.test(pre);start=false;const lw=w.toLowerCase();return sent?lw[0].toUpperCase()+lw.slice(1):lw});
 for(const N of nameList())r=r.replace(N.re,(m,off)=>{const t=N.to;return off===0||/[.!?:]\s+$/.test(r.slice(0,off))?t[0].toUpperCase()+t.slice(1):t});
 if(NICE.size>4000)NICE.clear();NICE.set(s,r);return r}
function textW(s,sc=1){return sc===1&&TXT.big?s.length*6-1:s.length*4*sc-sc}
function drawText(g,s,x,y,col,sc=1,shadow=0x07050f,alpha=1){s=String(s);const big=sc===1&&TXT.big;
 if(big){s=nice(s);y-=1}else s=s.toUpperCase();const adv=big?6:4*sc;
 const pass=(c,o)=>{g.fillStyle(c,alpha);for(let i=0;i<s.length;i++){const ox=x+i*adv;for(const[gx,gy,w]of glyphRuns(big,s[i]))
  if(o)g.fillRect(ox+gx*sc-sc,y+gy*sc-sc,(w+2)*sc,3*sc);else g.fillRect(ox+gx*sc,y+gy*sc,w*sc,sc)}};
 if(sc>1){if(shadow!==null){g.fillStyle(shadow,alpha);for(let i=0;i<s.length;i++)for(const[gx,gy,w]of glyphRuns(0,s[i]))g.fillRect(x+i*adv+gx*sc+sc,y+gy*sc+sc,w*sc,sc)}}
 else pass(shadow===null?0x05040b:shadow,1);
 pass(col,0)}
// r7: mimic positions per save seed — same number of mimics as authored, drawn from the stage's visible chests (seed 0 = authored set)
function mimicIds(sid,seed){const L=(typeof CHESTS!=='undefined'&&CHESTS[sid])||[],n=L.filter(c=>c.mimic).length;if(!seed||!n)return new Set(L.filter(c=>c.mimic).map(c=>c.id));
 let h=(seed>>>0)^2166136261;for(const ch of sid){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0}const r=()=>{h=(Math.imul(h^(h>>>15),2246822507)+0x9e3779b9)>>>0;return h/4294967296};
 const pool=L.filter(c=>!c.hidden&&!c.sunk).map(c=>c.id);for(let i=pool.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}return new Set(pool.slice(0,n))}
// wrap a paragraph to a pixel width in the current font
function wrapText(str,w){const out=[];let cur='';for(const wd of String(str).split(/\s+/).filter(Boolean)){const t=cur?cur+' '+wd:wd;if(cur&&textW(t)>w){out.push(cur);cur=wd}else cur=t}if(cur)out.push(cur);return out}
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
function genTextures(scene,sx='',pal=null,theme=null){
 const T=scene.textures;
 if(T.exists('sky'+sx))return;
 const keep={...C};if(pal)Object.assign(C,pal);try{genTex(T,sx)}finally{Object.assign(C,keep)}
 // bg pass: a stage with its own art (bg.js) replaces the shared city skyline with its own sky, far and near layers
 const A=theme&&typeof BGART!=='undefined'&&BGART[theme];if(A){for(const[k,w,fn]of[['sky',W,(x,w)=>{BGART_sky(x,w,A)}],['far',640,(x,w)=>A.far(x,w)],['near',800,(x,w)=>A.near(x,w)]]){T.remove(k+sx);T.addCanvas(k+sx,makeCanvas(w,H,fn))}}}
function BGART_sky(x,w,A){const b=A.sky;for(let y=0;y<H;y++){const t=Math.min(.999,y/150)*(b.length-1),i=Math.floor(t),f=t-i;for(let xx=0;xx<w;xx++){x.fillStyle=b[Math.min(b.length-1,i+(f>(BAYER[y&3][xx&3]+.5)/16?1:0))];x.fillRect(xx,y,1,1)}}A.skyX&&A.skyX(x,w)}
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
function drawHero(g,x,y,f,st,fr,t,o={}){rasterHero(HERO,heroPose(st,fr,t,o.combo));if(o.outline)for(const[dx,dy]of[[-1,0],[1,0],[0,-1],[0,1]])HERO.blit(g,x+dx,y+dy,f,true,o.outline);/* r9: 1px pale outline, old procedural hero art only */HERO.blit(g,x,y,f,o.flash,o.alpha??1)}
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
  const TM=typeof TILEMAT!=='undefined'&&TILEMAT[this.sid]||null;// tiles pass: per-zone material (colour only)
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
    if(TM&&c){if(v===K_SOLID){const dy=Y-tj*TS;c=TM.c[TM.solid({X,Y,dy,u,vv,i,j,lE,rE,bE})];if(dy>1&&((lE&&u===0)||(bE&&vv===TS-1&&!(this.sid==='belltower'))))c=TM.c[TM.dark]}
     else if(v===K_ONEWAY){const ix=TM.one(X,Y,u,vv);c=(vv>5&&ix===0)?0:TM.c[ix]}
     else if(bk&&!(v===K_CHAIN||v===K_SPIKE))c=TM.c[TM.back(X,Y)]}
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
  genTextures(this,tx,D.pal,sid);this.bg.L.forEach(([s],i)=>s.setTexture(['sky','far','near'][i]+tx));if(this.textures.exists('ground'+tx))this.gnd.setTexture('ground'+tx)}
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
  {const l1='KEYS: ARROWS/WASD  SPACE JUMP  X/J ATK  C/K MAGIC  SHIFT/L DODGE',l2='XBOX PAD: A JUMP/USE  B ROLL  X ATK  START PAUSE';if(this.mode==='slots'){drawText(g,l1,Math.round(W/2-textW(l1)/2),164,0x5d5990,1,null);drawText(g,l2,Math.round(W/2-textW(l2)/2),171,0x7a76b0,1,null)}}}}
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
  const tx=sid==='ramparts'?'':'_'+sid;genTextures(this,tx,D.pal,sid);this.lv=LEVELS[sid]||(LEVELS[sid]=Object.assign(new Level(D),{sid}));this.physics.world.setBounds(0,D.top,WORLD,D.bottom-D.top);
  sv.freed=sv.freed||[];sv.found=sv.found||[];sv.chDone=sv.chDone||[];sv.broken=sv.broken||[];
  // milestone D: character (class, stats, equipment, inventory)
  {const cls=CLASSES[sv.cls]?sv.cls:(CLASSES[Q.get('class')]?Q.get('class'):'knight'),CL=CLASSES[cls];sv.cls=cls;sv.stats=sv.stats||RPG.classStats(cls);
   sv.eq=sv.eq||{main:CL.main,off:CL.off,armor:CL.armor};sv.inv=sv.inv||[CL.main,CL.off,CL.armor,...(CL.extra||[])].filter(Boolean);sv.picked=sv.picked||[]}
  this.bgf=makeBG(this,tx);this.bgArt=typeof BGART!=='undefined'&&BGART[sid]||null;this.gamb=this.bgArt?this.add.graphics().setScrollFactor(0).setDepth(-9.7):null;
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
  // r7 P2 #5: thorn brakes are a solid 12px hedge (jump it; touching it hurts and knocks you back)
  this.thornBodies=(D.thorns||[]).map(th=>solid(th[0],th[2]-12,th[1]-th[0],12));
  this.gateL=solid(ARENA_L-8,0,8,GY,false);this.gateL.body.enable=false;
  // exploration objects (milestone B)
  this.breakables=(D.breakables||[]).filter(b=>!sv.broken.includes(b.id)).map(b=>({...b,hp:3,flash:0,body:solid(b.r[0],b.r[1],b.r[2]-b.r[0],b.r[3]-b.r[1])}));
  this.chs=(D.challenges||[]).map(c=>({...c,active:0,armed:1,done:sv.chDone.includes(c.id)||(c.type==='timer'&&sv.freed.includes(c.cage)),live:[],gateObjs:c.gates.map(r=>({r,closed:false,body:solid(r[0],r[1],r[2]-r[0],r[3]-r[1])}))}));
  this.chs.forEach(c=>this.setGates(c,c.type==='timer'&&!c.done));
  this.cages=(D.cages||[]).map(c=>({...c,freed:sv.freed.includes(c.id),locked:!!c.lock&&!sv.chDone.includes(c.lock),bob:rnd(0,6)}));
  // milestone G: frozen bells (collectible), chests + mimics, loot drops, consumable buffs
  sv.bells=sv.bells||[];sv.chests=sv.chests||[];this.bells=(D.bells||[]).map(b=>({...b,rung:sv.bells.includes(b.id),sw:0}));
  // milestone I: water volumes (swim), some drain when a puzzle lock is solved; the arena pool can rise (tide)
  this.waters=(D.water||[]).map(w=>{const dr=!!(w.drain&&sv.chDone.includes(w.drain));return{...w,r:[...w.r],dy:dr?w.r[3]-w.r[1]:0,drained:dr}});this.tideY=null;this.bubbles=[];
  // r7 P1 #1: which chests are mimics is rolled per save (sv.seed; ?seed=N pins it, seed 0 keeps the authored set); the host's seed rides in co-op prog
  if(Q.has('seed'))sv.seed=+Q.get('seed')||0;else if(sv.seed==null){sv.seed=1+Math.floor(Math.random()*1e9);Save.write(sv)}
  const mim=mimicIds(sid,sv.seed);
  // r7 P1 #2: pre-boss shortcut doors (solid until their lever is pulled from the far side; remembered in the save)
  sv.shortcuts=sv.shortcuts||[];this.shortcuts=(D.shortcuts||[]).map(c=>{const open=sv.shortcuts.includes(c.id),body=solid(c.x,-204,12,360);body.body.enable=!open;return{...c,open,body,t:open?1:0}});
  this.chests=(CHESTS[sid]||[]).map(c=>{const o=sv.chests.includes(c.id);c={...c,mimic:mim.has(c.id)?1:0};return{...c,open:o,st:o?(c.mimic?'dead':'open'):'shut',hp:7*(1+.5*this.ng),t:0,f:-1,hx:c.x,cd:1,lid:o?1:0}});
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
  if(sv.textSize)TXT.big=sv.textSize==='small'?0:1;sv.lore=sv.lore||[];sv.lords=sv.lords||[];sv.endings=sv.endings||[];this.lore=(D.lore||[]).map(l=>({...l,read:sv.lore.includes(l.id)}));this.loreView=null;this.player.flasks=TUNE.flaskN+(sv.flaskBonus||0);if(D.hub){this.bonfire.lit=true;sv.bonfire=true}
  this.enemies=[];
  D.enemies.forEach(([k,x,y])=>this.spawnEnemy(k,x,y));
  this.shots=[];this.spells=[];this.bolts=[];this.novas=[];this.flames=[];
  this.boss=null;this.bossState=sv.bossDown||!D.boss?'dead':'sleep';this.cine=null;this.bars=0;this.victory=null;this.paused=false;this.flashF=0;
  this.cam=this.cameras.main;this.cam.setBounds(0,D.top,WORLD,D.bottom-D.top);this.camY=clamp(GY-156,D.top,D.bottom-H);this.camTY=this.camY;this.cam.scrollY=this.camY;this.cam.startFollow(this.pb,true,.12,0,0,0);this.camOff=0;
  this.keys=this.input.keyboard.addKeys('LEFT,RIGHT,UP,DOWN,Z,X,C,V,S,E,A,D,Q,F,W,G,T,R,SPACE,SHIFT,ENTER,J,K,L,U,I,H,TAB');this.kHold={};
  // r6: Phaser drops JustDown when a key goes down and up inside one frame; latch presses so a quick tap (e.g. Up at the keeper) still counts
  // boss intros: any confirm key or Esc skips (touch: tap); pads are polled in updateCine
  // r10: only Enter/Esc (pad: A/Start, touch: the Skip button) skip, and not in the first 0.7 s, so mashed attack/jump/taps don't eat the intro
  this.input.keyboard.on('keydown',e=>{if(this.cine&&!e.repeat&&['Enter','Escape'].includes(e.key))this.skipCine()});this.events.once('shutdown',()=>{this.endVideo();this.skipBtn(0)});
  this.kl={};this.input.keyboard.on('keydown',e=>{if(!this.menu&&!e.repeat)this.kl[e.keyCode]=1});
  this.input.keyboard.on('keydown',e=>{const V=this.victory;if(V&&V.t>=.8){const n=V.phase==='choose'?2:this.victoryOpts().length;if(e.key==='ArrowUp')V.sel=(V.sel+n-1)%n;if(e.key==='ArrowDown')V.sel=(V.sel+1)%n;if(['Enter',' ','z','x','Z','X'].includes(e.key))this.victoryGo();return}// r5: a key tapped faster than one frame still moves the menu cursor (edge detection alone could miss it)
  if(this.menu&&!this.paused){const m={ArrowUp:['up','up'],ArrowDown:['down','dn'],ArrowLeft:['left','l'],ArrowRight:['right','r'],w:['up','up'],s:['down','dn'],a:['left','l'],d:['right','r'],W:['up','up'],S:['down','dn'],A:['left','l'],D:['right','r']}[e.key];if(m&&!e.repeat){if(this.menu.t<.15)return;this.menuKey(m[0]);if(this.menu)this.menu.prev[m[1]]=1;return}
   const M=this.menu;if(!e.repeat&&['Enter','z','Z','x','X','j','J',' '].includes(e.key)&&M.t>.3){M.kOk=this.time.now;this.menuKey('ok');return}}if(this.menu&&e.key==='Escape'){this.menuKey('back');if(this.menu&&this.menu.mode==='main')this.menu=null;return}if(e.key==='Escape'||e.key==='p'||e.key==='P')this.togglePause();if(e.key==='m'||e.key==='M')this.sound.mute=!this.sound.mute;if(this.paused&&(e.key==='t'||e.key==='T'))TXT.set(!TXT.big,this.sv)});
  this.touch=Q.has('touch')||!!(this.sys.game.device.input.touch);this.tPrev={};this.tTap={};
  if(this.touch)this.input.addPointer(4);
  this.input.on('pointerdown',p=>{if(this.victory)return this.victoryTap(p);if(!this.touch)return;if(this.menu||this.quitQ)return;if(this.paused&&Math.abs(p.y-(40+6*12+3))<6){this.sound.mute=!this.sound.mute;return}for(const b of TBTN){const dx=p.x-b.x,dy=p.y-b.y;if(dx*dx+dy*dy<(b.r+4)*(b.r+4))this.tTap[b.k]=1}if(this.paused&&Math.abs(p.y-(40+7*12+3))<6){TXT.set(!TXT.big,this.sv);return}if(this.tTap.pause){this.tTap.pause=0;this.togglePause()}});
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
 say(s,d=2){this.msg={s,t:d+1.2+String(s).length*.03}}// text readability: messages stay up longer
 pop(s,x,y,c=0xffe2a8){this.pops.push({s,x,y,c,t:0})}
 sfx(k,v=.35){try{this.sound.play(k,{volume:v})}catch(e){}}
 light(x,y,r,c,a){this.lights.push({x,y,r,c,a})}
 togglePause(){if(this.victory||this.player.dead||this.cine)return;this.paused=!this.paused;this.paused?this.physics.pause():this.physics.resume()}
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
  // keyboard map (controller-like; see README): move arrows / WASD, jump Space / Z, weapon X / J (tap light, hold heavy),
  // magic C / K (selected spell), dodge Shift / L, parry V / U, flask F / R, interact E (or Up arrow), cycle spells Q,
  // inventory Tab / I, pause Esc / P. W is up (climb) only and never interacts; S is down.
  const T=this.touchState(),upP=J(K.UP)|J(K.E),wDown=K.X.isDown||K.J.isDown,kh=this.kHold||(this.kHold={});let atkP=false,heavyP=J(K.H);
  if(wDown){if(kh.w==null)kh.w=0;else kh.w+=this.dt||.016;if(kh.w>=.32&&!kh.wFired){kh.wFired=1;heavyP=true}}else{if(kh.w!=null&&!kh.wFired)atkP=true;kh.w=null;kh.wFired=0}
  if(J(K.X)||J(K.J)){if(!wDown)atkP=true}// a press+release inside one frame still counts as a tap
  const cyc=J(K.Q),inv=J(K.TAB)|J(K.I),mag=J(K.C)|J(K.K);if(inv&&!this.menu&&!this.paused&&this.menuKey){this.menu={mode:'main',sel:1,t:1,prev:{}};this.menuKey('ok')}
  if(cyc&&!this.spCycle){const L=['bolt','ice','dome',...['heal','lspear','blessed'].filter(k=>this.sv.inv.includes(k))];this.kSpell=((this.kSpell||0)+1)%L.length;this.pop(L[this.kSpell]==='bolt'?'STORM':itemName(L[this.kSpell]),this.player.x,this.player.y-26,0x9fd8ff)}
  const kSel=['bolt','ice','dome',...['heal','lspear','blessed'].filter(k=>this.sv.inv.includes(k))][this.kSpell||0]||'bolt';
  const o={l:K.LEFT.isDown||K.A.isDown||T.l,r:K.RIGHT.isDown||K.D.isDown||T.r,up:K.UP.isDown||K.W.isDown||T.up,dn:K.DOWN.isDown||K.S.isDown||T.dn,jump:K.Z.isDown||K.SPACE.isDown||T.jump,jumpP:J(K.Z)|J(K.SPACE)|T.jumpP,
   atkP:atkP||T.atkP,parryP:J(K.V)||J(K.U)||T.parryP,rollP:J(K.SHIFT)||J(K.L)||T.rollP,iceP:T.iceP,boltP:T.boltP,domeP:T.domeP,
   flaskP:J(K.F)|J(K.R)|T.flaskP,restP:upP||T.upP,heavyP:heavyP||T.hvyP,mirP:T.mirP};
  if(mag){if(this.spCycle)o.spellP=true;else o[{bolt:'boltP',ice:'iceP',dome:'domeP',heal:'healP',lspear:'lspearP',blessed:'blessP'}[kSel]]=true}
  if(cyc&&this.spCycle)o.cycR=true;const G=typeof PAD!=='undefined'&&PAD.take(0);if(G){// context A: near an interactable (on the ground) A interacts instead of jumping; held A stays a non-jump until released
   if(G.jumpP&&!this.menu&&!this.loreView&&this.interactHint()){G.jumpP=false;G.upP=true;this.aCtx=1}if(this.aCtx){if(G.jump)G.jump=false;else this.aCtx=0}
   for(const k in G)if(G[k])o[k]=true;if(G.upP)o.restP=true}return o}
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
  else if(th==='throne'){if(Math.random()<.35)this.fx.add({k:'shard',x:cX+rnd(0,W),y:cY-4,vx:rnd(-6,6),vy:rnd(10,24),l:0,m:.6})}
  else if(th==='cloister'){if(Math.random()<.3)this.fx.add({k:'shard',x:cX+rnd(0,W),y:cY+rnd(0,H),vx:rnd(-8,8),vy:rnd(4,14),l:0,m:.5})}
  else if(th==='spire'){if(Math.random()<.25)this.fx.add({k:'shard',x:cX+rnd(0,W),y:cY+H,vx:rnd(-6,6),vy:-rnd(20,50),l:0,m:.4})}
  else if(th==='keep'){const w=(this.def.wind||[]).find(z=>this.gustOn(z));if(Math.random()<.3)this.fx.add({k:'shard',x:cX+rnd(0,W),y:cY+rnd(0,H),vx:(w?w.dir:1)*rnd(60,120),vy:rnd(-5,10),l:0,m:.5})}
  else if(th==='drowned'){if(Math.random()<.35)this.fx.add({k:'shard',x:cX+rnd(0,W),y:cY+rnd(-4,40),vx:0,vy:rnd(60,90),l:0,m:.6})}
  else if(th==='cinderdeep'||th==='catacomb'){if(Math.random()<.45)this.fx.ember(cX+rnd(0,320),cY+H+4,1,rnd(.8,1.6));
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
   if(D.theme==='cinderdeep'||D.theme==='catacomb'){for(const lx of[ARENA_L+20,ARENA_L+340]){for(let y=Math.max(cY,-60);y<GY;y+=2){const w=3+Math.round(Math.sin(y*.2+t*6));ga.fillStyle((y+Math.floor(t*40))%6<3?C.f1:C.f2,.55);ga.fillRect(lx-w,y,w*2,2)}glow(ga,lx,GY-4,14,C.f2,.3);this.light(lx,GY-20,60,C.f2,.7);if(Math.random()<.5)this.fx.fire(lx,GY-2,2,4,1.4)}}}
  if(D.theme==='belltower')this.drawBelltowerFX(g,ga,cX,cY);
  if(D.theme==='catacomb')this.drawCatacombFX(g,ga,cX,cY);
  if(D.theme==='drowned')this.drawDrownedFX(g,ga,cX,cY);
  if(D.theme==='keep')this.drawKeepFX(g,ga,cX,cY);
  if(D.theme==='spire')this.drawSpireFX(g,ga,cX,cY);
  if(D.theme==='cloister')this.drawCloisterFX(g,ga,cX,cY);
  if(D.theme==='throne')this.drawThroneFX(g,ga,cX,cY);
  if(this.pBrambles&&this.pBrambles.length)this.drawPBrambles(g,ga);
  if(this.pNovas&&this.pNovas.length)this.drawPNovas(g,ga);
  if(this.pBolts&&this.pBolts.length)this.drawPBolts(g,ga);
  if(this.tideCrests&&this.tideCrests.length)this.drawTideCrests(g,ga);
  if(this.forgeCols&&this.forgeCols.length)this.drawForgeCols(ga);
  if(D.theme==='cathedral'){const cols=[0x9fd8ff,0xb8a8ff,0xd8f2ff];
   for(let si=0;si<(D.shafts||[]).length;si++){const sx=D.shafts[si];if(sx<cX-120||sx>cX+W+60)continue;const top=Math.max(cY,-200),c=cols[si%3],pulse=.8+.2*Math.sin(t*.7+si);
    for(let y=top;y<GY;y+=2){const k=(y-top)/(GY-top),x0=Math.round(sx+(y-top)*.35),w=Math.round(10+k*14);if(this.lv.kAt(x0+w/2,y)===K_SOLID)continue;ga.fillStyle(c,.045*pulse*(1-k*.4));ga.fillRect(x0,y,w,2);if((y>>1)%7===0)px(ga,x0+((y*13+Math.floor(t*8))%w),y,0xffffff,.25)}
    this.light(sx+(GY-top)*.35,GY-4,40,c,.35*pulse)}}
  if(D.lavaPits&&this.boss&&this.boss.kind==='king'){const on=this.boss.phase>=2;for(const[a,b]of D.lavaPits){if(on){g.fillStyle(0x8a1a08);g.fillRect(a,GY,b-a,3);for(let x=a;x<b;x++){const h=1+((x*7+Math.floor(t*10))%3);g.fillStyle(h>2?0xffd04a:C.f2);g.fillRect(x,GY-h+1,1,h)}glow(ga,(a+b)/2,GY,(b-a)*.6,C.f2,.25);this.light((a+b)/2,GY-4,50,C.f2,.8)}else{g.fillStyle(0x3a1008);for(let x=a+3;x<b-3;x+=7){g.fillRect(x,GY,4,1);px(g,x+2,GY+1,C.f2)}}}}
  if(D.theme==='cinderdeep'||D.theme==='catacomb'){for(const r of D.spikes||[]){if(r[2]<cX-40||r[0]>cX+W+40)continue;const mx=(r[0]+r[2])/2;glow(ga,mx,r[1]+4,14+Math.sin(t*5+mx)*2,C.f2,.18);this.light(mx,r[1],50+Math.sin(t*7+mx)*3,C.f2,.7);
    const bx=r[0]+((Math.floor(t*3+mx))%(r[2]-r[0]));px(ga,bx,r[1]+2-((t*6)%3),C.f0,.8)}}}
 drawExplore(g,ga){const t=this.t;this.drawLoot(g,ga);{const h=this.interactHint();this.ihint=h;if(h&&h!=='Rest'&&h!=='Pull'){const P=this.player;this.keyGlyph(g,Math.round(P.x)-14,Math.round(P.y)-40,h)}}
  for(const k of this.breakables){if(k.hp<=0)continue;const[x0,y0,x1,y1]=k.r;g.fillStyle(k.flash>0?0xb0a8d8:C.g1);g.fillRect(x0,y0,x1-x0,y1-y0);g.fillStyle(C.gTop);g.fillRect(x0,y0,x1-x0,1);
   g.fillStyle(C.gM);for(let y=y0+6;y<y1;y+=6)g.fillRect(x0,y,x1-x0,1);for(let y=y0,r=0;y<y1;y+=6,r++)g.fillRect(x0+(r%2?4:10),y,1,6);
   g.fillStyle(0x07050f);const cr=3-k.hp;line(g,x0+3,y0+4,x0+8,y0+14,0x07050f);line(g,x0+8,y0+14,x0+5,y0+22,0x07050f);if(cr>0){line(g,x0+8,y0+14,x0+13,y0+18,0x07050f);line(g,x0+5,y0+22,x0+10,y1-2,0x07050f)}if(cr>1){line(g,x0+2,y0+16,x0+6,y0+26,0x07050f);line(g,x0+11,y0+5,x0+14,y0+11,0x07050f)}
   if(Math.floor(t*2)%3===0)px(ga,x0+8,y0+14,C.f1,.5)}
  // r7 P3: warning posts (a scorched stake with a skull) before deadly low routes; the text shows when you are close
  for(const w of this.def.warns||[]){const P=this.player;g.fillStyle(0x3a2a20);g.fillRect(w.x-1,w.y-18,3,18);g.fillStyle(0xd8c8b0);g.fillRect(w.x-3,w.y-24,7,6);g.fillStyle(0x1a0d0a);g.fillRect(w.x-2,w.y-22,2,2);g.fillRect(w.x+1,w.y-22,2,2);
   g.fillStyle(0xd8402a);g.fillRect(w.x-5,w.y-13,11,2);if(Math.abs(P.x-w.x)<80&&Math.abs(P.y-w.y)<40)drawText(g,w.t,Math.round(w.x-textW(w.t)/2),w.y-38,0xff8a4a)}
  // r7: shortcut doors (an iron-bound bulkhead in a stone pier; the lever sits on the far side)
  for(const c of this.shortcuts||[]){const x=c.x;c.t=c.open?Math.min(1,c.t+.04):0;g.fillStyle(0x221c24);g.fillRect(x-2,-204,16,GY-36+204);g.fillStyle(0x3a3240);for(let y=-200;y<GY-36;y+=12)g.fillRect(x-2,y,16,1);
   g.fillStyle(0x4a4250);g.fillRect(x-3,GY-38,18,3);const dh=Math.round(34*(1-c.t));if(dh>0){g.fillStyle(0x2a2430);g.fillRect(x,GY-35+(34-dh),12,dh);g.fillStyle(0x7a6a50);for(let y=GY-32+(34-dh);y<GY;y+=8)g.fillRect(x,y,12,1);g.fillStyle(0xb89a60);g.fillRect(x+8,GY-18,2,3)}
   else{g.fillStyle(0x0a080c);g.fillRect(x,GY-35,12,35)}
   const lx=c.lever,ang=c.open?.7:-.7;g.fillStyle(0x3a3240);g.fillRect(lx-3,GY-4,7,4);line(g,lx,GY-4,Math.round(lx+Math.sin(ang)*10),Math.round(GY-4-Math.cos(ang)*10),0x8a7a60);g.fillStyle(c.open?0x9fe86a:0xd8402a);g.fillRect(Math.round(lx+Math.sin(ang)*10)-1,Math.round(GY-4-Math.cos(ang)*10)-1,3,3);
   const P=this.player;if(!c.open&&Math.abs(P.y-GY)<24){if(Math.abs(P.x-c.lever)<14&&P.x>c.x)this.keyGlyph(g,lx-14,GY-22,'Pull');else if(P.x<c.x&&P.x>c.x-60)drawText(g,'BARRED - DROP BELOW',x-110,GY-46,0xd8c8b0)}}
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
   if(body.velocity.y>0&&!P.swim)body.velocity.y+=500*dt;
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
   else if(inp.flaskP&&(P.blight||0)>.5){this.pop('BLIGHTED - NO FLASK',P.x,P.y-24,0xb8e070)}
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
   if(P.t>.22&&!P.castDone){P.castDone=true;typeof SPELLBOOK!=='undefined'&&SPELLBOOK[P.spell]&&!SPELLBOOK[P.spell].legacy?this.spFire(P.spell):MIRACLES[P.spell]?this.castMiracle(P.spell):P.spell==='ice'?this.castIce(P.x+P.f*16,P.f,'p',P.y):P.spell==='dome'?this.castDome(P.x,'p',0,P.y):this.castBolt()}if(P.t>.42){P.state='idle';P.castDone=false}}
  else if(P.state==='hurt'){if(P.t>.3)P.state='idle'}
  else if(P.state==='rest'){if(P.t>1.4)P.state='idle'}
  this.swimStep(dt,inp,dir,on);this.windStep(dt,on);this.gravStep(dt,on);this.blightStep(dt);
  P.wasOn=on;P.lastVy=body.velocity.y;
  if(P.hp<=0&&!P.dead)this.die()}
 // ---------------- milestone I: water + swimming ----------------
 // ---------------- milestone J: wind on the battlements (zones gust on/off; the Castellan's gale) ----------------
 // ---------------- milestone K: gravity tides (pulsing low-gravity zones; the Astronomer's arena in phase 3) and flickering star platforms ----------------
 // ---------------- milestone L: poison spores (pulsing clouds; the Prioress's rot in phase 3) and thorn brakes ----------------
 // milestone M: a relic altar answers only if the one who strikes it (the host, in co-op) carries that lord's signature weapon
 relicOk(b){return Q.has('relicall')||Object.values(this.sv.eq||{}).includes(b.w)}// r7 P3: the altar takes only the weapon in your hand
 sporeAt(x,y){for(const z of this.def.spores||[]){const r=z.r;if(x>r[0]&&x<r[2]&&y>r[1]&&y<r[3]&&this.gustOn(z))return 1}
  const B=this.boss;if(B&&(B.kind==='prioress'||B.kind==='heir')&&this.bossState==='fight'&&B.phase>=3&&x>ARENA_L){const s=Math.sin(this.t*1.2);if(Math.abs(s)>.3&&(s>0?x<(ARENA_L+ARENA_R)/2:x>=(ARENA_L+ARENA_R)/2))return 1}return 0}
 blightStep(dt){const P=this.player;if(P.dead||this.cine||this.victory)return;
  if(this.sporeAt(P.x,P.y-8)){P.blight=Math.min(1,(P.blight||0)+dt*.8);{const fl=P.hp>P.hpMax*.25?1:0;if(P.hp>fl)P.hp=Math.max(fl,P.hp-dt*(4+P.blight*6))}this.stats.poisoned=(this.stats.poisoned||0)+dt;if(Math.random()<.2)this.fx.spark(P.x+rnd(-5,5),P.y-12,1,0xb8e070,30)}else P.blight=Math.max(0,(P.blight||0)-dt*.5);
  for(const th of this.def.thorns||[]){if(P.x>th[0]-7&&P.x<th[1]+7&&P.y>th[2]-15&&P.y<th[2]+4&&P.inv<=0){const away=P.x<(th[0]+th[1])/2?-1:1;if(this.hurtPlayer(12,P.x-away*8)){this.stats.thorned=(this.stats.thorned||0)+1;P.thornKb=.3;this.pb.setVelocity(away*160,-170)}}}
  if(P.thornKb>0){P.thornKb-=dt;this.pb.setVelocityX(Math.sign(this.pb.body.velocity.x||1)*Math.max(Math.abs(this.pb.body.velocity.x),90))}}
 starOn(s){return((this.t+s[0]*.01)%s[3])<s[3]*.62}
 gravAt(x,y){for(const z of this.def.lowg||[]){const r=z.r;if(x>r[0]&&x<r[2]&&y>r[1]&&y<r[3]&&this.gustOn(z))return 1}
  const B=this.boss;if(B&&B.kind==='astronomer'&&this.bossState==='fight'&&B.phase>=3&&x>ARENA_L)return 1;return 0}
 gravStep(dt,on){const P=this.player;if(P.dead||P.swim||P.state==='climb')return;const b=this.pb,vy=b.body.velocity.y;
  if(this.gravAt(P.x,P.y-8)){P.float=1;b.setVelocityY(Math.max(-330,vy-600*dt));this.stats.floated=(this.stats.floated||0)+dt}else P.float=0;
  for(const s of this.def.stars||[]){if(!this.starOn(s))continue;if(P.x>s[0]&&P.x<s[0]+s[2]&&vy>=0&&P.y>=s[1]-3&&P.y<=s[1]+6){b.setY(s[1]-8);b.setVelocityY(Math.min(0,vy));P.onStar=s;this.stats.starStands=(this.stats.starStands||0)+dt}}}
 gustOn(z){return((this.t+(z.off||0))%z.period)<z.period*.5}
 windAt(x,y){for(const z of this.def.wind||[]){const r=z.r;if(x>r[0]&&x<r[2]&&y>r[1]&&y<r[3]&&this.gustOn(z))return z.dir}
  const B=this.boss;if(B&&B.kind==='heir'&&this.bossState==='fight'&&B.state==='cast'){if(B.next==='gust')return 1.6*(Math.sign(x-B.x)||1);if(B.next==='pull')return-1.2*(Math.sign(x-B.x)||1)}if(B&&B.kind==='astronomer'&&this.bossState==='fight'&&B.state==='cast'&&B.next==='pull')return-1.2*(Math.sign(x-B.x)||1);if(B&&B.kind==='marshal'&&this.bossState==='fight'){if(B.state==='cast'&&B.next==='gust')return 1.6*(Math.sign(x-B.x)||1);if(B.phase>=3){const s=Math.sin(this.t*1.1);if(Math.abs(s)>.45)return Math.sign(s)*.9}}return 0}
 windStep(dt,on){const P=this.player;if(P.dead||P.swim||P.state==='climb')return;const w=this.windAt(P.x,P.y-8);P.wind=w;if(!w)return;const b=this.pb;b.setVelocityX(b.body.velocity.x+w*(on?1500:1100)*dt);this.stats.gusted=(this.stats.gusted||0)+dt}
 waterTop(w){return(w.arena&&this.tideY!=null?this.tideY:w.r[1])+(w.dy||0)}
 waterAt(x,y){for(const w of this.waters||[]){if(w.drained)continue;const r=w.r;if(x>r[0]&&x<r[2]&&y>this.waterTop(w)&&y<r[3])return w}return null}
 splash(x,y,n=8){for(let i=0;i<n;i++)this.fx.add({k:'shard',x:x+rnd(-4,4),y,vx:rnd(-40,40),vy:rnd(-90,-30),l:0,m:rnd(.3,.6)});this.sfx('roll',.2)}
 swimStep(dt,inp,dir,on){const P=this.player,b=this.pb,body=b.body;P.airMax=12;if(P.air==null)P.air=12;
  const w=P.dead?null:this.waterAt(P.x,P.y-6);
  if(!w){if(P.swim){P.swim=0;if(P.state!=='climb')body.setAllowGravity(true)}P.air=Math.min(P.airMax,P.air+dt*6);return}
  if(!P.swim){P.swim=1;this.splash(P.x,this.waterTop(w));this.stats.swims=(this.stats.swims||0)+1;if(body.velocity.y>0)b.setVelocityY(body.velocity.y*.35)}
  if(P.state==='climb')return;
  body.setAllowGravity(false);const top=this.waterTop(w),head=P.y-14<top;let vy=body.velocity.y;
  if(inp.jump||inp.up)vy=Math.max(-110,vy-520*dt);else if(inp.dn)vy=Math.min(90,vy+300*dt);else vy+=(-18-vy)*Math.min(1,4*dt);
  if(vy>90)vy+=(90-vy)*Math.min(1,6*dt);
  if((inp.jumpP||inp.jump)&&P.y-6-top<9&&P.y-6-top>-1&&!['atk','roll','hurt','cast','drink'].includes(P.state)){vy=-275;body.setAllowGravity(true);this.splash(P.x,top);this.sfx('jump',.25);this.stats.leaps=(this.stats.leaps||0)+1}
  b.setVelocityY(vy);if(!['roll','atk'].includes(P.state)){const vx=body.velocity.x;b.setVelocityX(vx+clamp(dir*72-vx,-420*dt,420*dt))}
  if(!head){P.air-=dt;if(Math.random()<dt*4)this.bubbles.push({x:P.x+P.f*3,y:P.y-14,t:0,top})}else P.air=Math.min(P.airMax,P.air+dt*6);
  if(P.air<=0){P.air=0;P.airHurt=(P.airHurt||0)-dt;if(P.airHurt<=0){P.airHurt=1;P.inv=0;this.hurtPlayer(8,P.x);this.pop('DROWNING',P.x,P.y-26,0x9ff0e8)}}}
 drawWaters(g,ga){const t=this.t,cX=this.cam.scrollX;
  for(const w of this.waters||[]){const r=w.r;if(r[2]<cX-10||r[0]>cX+W+10)continue;const top=Math.round(this.waterTop(w)),x0=Math.max(r[0],Math.floor(cX)-2),x1=Math.min(r[2],Math.ceil(cX)+W+2);
   if(w.dy>0){g.fillStyle(0x2a3a34,.5);g.fillRect(x0,r[3]-2,x1-x0,2);for(let x=x0;x<x1;x+=5)px(g,x,r[3]-3,0x4a6a60)}// wet silt where the water drained
   if(w.drained||top>=r[3])continue;
   g.fillStyle(0x0e3a48,.42);g.fillRect(x0,top,x1-x0,r[3]-top);g.fillStyle(0x062430,.25);g.fillRect(x0,Math.round((top+r[3])/2),x1-x0,Math.round((r[3]-top)/2));
   for(let x=x0;x<x1;x++){const h=Math.round(Math.sin(x*.25+t*3)*1+Math.sin(x*.11-t*2));px(g,x,top+h,0x9ff0e8);if((x+Math.floor(t*10))%9===0)px(ga,x,top+h-1,0xffffff,.5)}
   for(let k=0;k<6;k++){const cx=x0+((k*53+Math.floor(t*12))%Math.max(1,x1-x0)),cy=top+4+((k*29)%Math.max(4,r[3]-top-6));line(ga,cx,cy,cx+6,cy+2,0x4ad8d8,.14)}// caustics
   glow(ga,(x0+x1)/2,top,Math.min(60,(x1-x0)/2),0x4ac8d8,.05)}
  for(let i=this.bubbles.length-1;i>=0;i--){const q=this.bubbles[i];q.t+=this.dt||.016;q.y-=22*(this.dt||.016);q.x+=Math.sin(q.t*8)*.3;if(q.y<q.top||q.t>3){this.bubbles.splice(i,1);continue}px(ga,q.x,q.y,0xd8ffff,.7);px(g,q.x+1,q.y,0x6ac8d0)}
  const P=this.player;if(P.swim&&P.air<P.airMax){/* breath drawn in HUD */}}

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
  if(M.mode==='shop'){const L=this.shopList(),n=L.length+1;if(k==='up')M.sel=(M.sel+n-1)%n;else if(k==='down')M.sel=(M.sel+1)%n;else if(k==='back'||(k==='ok'&&M.sel===L.length)){if(M.pedlar){this.menu=null;return}M.mode='keeper';M.sel=1}
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
 ringBell(b,fromNet){b.sw=1;if(this.def.bellKind==='relic'){this.sfx('bell',.3);this.fx.ember(b.x,b.y-16,4,1)}else if(this.def.bellKind==='bloom'){this.sfx('slash',.5);this.fx.spark(b.x,b.y-10,14,0xb8e070,90)}else if(this.def.bellKind==='lens'){this.sfx('chime',.4);this.fx.spark(b.x,b.y-14,12,0xd8d0ff,90)}else if(this.def.bellKind==='ballista'){this.sfx('clang',.4);this.fx.shard(b.x,b.y-8,6,90)}else if(this.def.bellKind==='sigil'){this.sfx('chime',.35);this.fx.star(b.x,b.y-14,0x9ff0e8)}else if(this.def.bellKind==='anvil'){this.sfx('clang',.4);this.fx.spark(b.x,b.y-8,6,C.f1,90)}else{this.sfx('bell',.35);this.fx.shard(b.x,b.y-20,6,80)}if(b.rung)return;
  if(NET.guest()&&!fromNet){if(!b.req){b.req=1;NET.send({t:'bell',id:b.id});setTimeout(()=>b.req=0,800)}return}
  if(this.def.bellKind==='relic'&&!this.relicOk(b)){this.pop('WIELD '+(WEAPONS[b.w]?WEAPONS[b.w].name:b.w)+' TO OFFER IT',b.x,b.y-34,0xa89880);this.sfx('clang',.2);this.stats.relicRefused=(this.stats.relicRefused||0)+1;return}
   const ord=this.def.bellOrder;if(ord){const n0=this.bells.filter(q=>q.rung).length;if(ord[n0]!==b.id){// milestone I: the sisters must be struck in the order they drowned
    if(n0>0){for(const q of this.bells)q.rung=false;this.sv.bells=this.sv.bells.filter(id=>!this.bells.some(q=>q.id===id));this.say('THE SIGILS SINK BACK - NOT IN THAT ORDER',2);this.stats.sigilResets=(this.stats.sigilResets||0)+1}
    else this.pop('THE SIGIL IS SILENT',b.x,b.y-30,0x6a9aa0);this.sfx('clang',.25);Save.write(this.sv);return}}
  b.rung=true;if(!this.sv.bells.includes(b.id))this.sv.bells.push(b.id);const n=this.bells.filter(q=>q.rung).length;const anv=this.def.bellKind==='anvil',sig=this.def.bellKind==='sigil',bal=this.def.bellKind==='ballista',lens=this.def.bellKind==='lens',blm=this.def.bellKind==='bloom',rel=this.def.bellKind==='relic';this.pop(rel?'RELIC OFFERED '+n+'/'+this.bells.length:blm?'BLOOM CUT '+n+'/'+this.bells.length:lens?'STAR LENS '+n+'/'+this.bells.length:bal?'BALLISTA WRECKED '+n+'/'+this.bells.length:(sig?'SIGIL ':anv?'ANVIL ':'BELL ')+n+'/'+this.bells.length,b.x,b.y-36,bal?0xe8d8b8:sig?0x9ff0e8:anv?0xffc080:0xd8f2ff);if(bal){this.fx.dust(b.x,b.y,14);this.fx.spark(b.x,b.y-8,10,0xe8d8b8,100)}if(anv)this.fx.spark(b.x,b.y-8,14,C.f1,120,30);this.fx.ember(b.x,b.y-20,12,1.2);if(!NET.guest())this.gainSouls(100);
  if(n===this.bells.length&&this.def.bellLock&&!this.sv.chDone.includes(this.def.bellLock)){this.sv.chDone.push(this.def.bellLock);for(const c of this.cages)if(c.lock===this.def.bellLock){c.locked=false;this.fx.spark(c.x,c.y-8,16,0xd8f2ff,120)}this.say(rel?'SIX RELICS ANSWER - THE HOLLOW VAULT OPENS':blm?'THE BLIGHT RECOILS - THE RELIQUARY OPENS':lens?'THE LENSES FIND THE STARS - THE ORRERY OPENS':bal?'THE BALLISTAE ARE SILENT - A SEAL BREAKS':sig?'THE SISTERS ANSWER - THE CISTERN DRAINS':anv?'THE FORGE ANVILS ANSWER - A SEAL BREAKS':'THE FROZEN BELLS ANSWER - A SEAL BREAKS',2.5);this.sfx('fanfare',.4)}
  Save.write(this.sv)}
 openChest(c,fromNet){if(c.st!=='shut')return;if(c.sunk&&this.waterAt(c.x,c.y-3)){if(!fromNet){this.say('THE CHEST IS SUNK FAST IN THE SILT',1.6);this.sfx('clang',.2)}return}if(NET.guest()&&!fromNet){if(!c.req){c.req=1;NET.send({t:'chest',id:c.id});setTimeout(()=>c.req=0,800)}return}
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
  for(const w of this.waters||[]){if(w.drain&&!w.drained&&this.sv.chDone.includes(w.drain)){w.dy=(w.dy||0)+dt*14;if(Math.random()<.3)this.bubbles.push({x:rnd(w.r[0],w.r[2]),y:w.r[3]-2,t:0,top:this.waterTop(w)});if(w.dy>=w.r[3]-w.r[1]){w.drained=true;this.sfx('chime',.3)}}}
  if(this.def.bellKind==='ballista'){for(const b of this.bells){b.rec=Math.max(0,(b.rec||0)-dt*3);if(b.rung||NET.guest())continue;b.cd=(b.cd??rnd(.6,1.6))-dt;const Q=NET.target(this,{b:{x:b.x,y:b.y}}),dx=Q.x-b.x;
    if(b.cd<0&&Math.abs(dx)<170&&Math.abs(dx)>14&&Math.abs(Q.y-b.y)<24){b.cd=2.2;b.aim=Math.sign(dx);b.rec=1;this.shots.push({x:b.x+b.aim*12,y:b.y-9,vx:b.aim*170,vy:0,t:0,c:'bolt',dmg:14,r:5,life:1.4});this.sfx('shot',.3);this.stats.ballistaShots=(this.stats.ballistaShots||0)+1}}}
  if(this.def.starfall&&!NET.guest()&&this.bossState!=='fight'){const P=this.player;this.starT=(this.starT||{});for(const mx of this.def.starfall){this.starT[mx]=(this.starT[mx]??rnd(.5,2))-dt;if(this.starT[mx]<0&&Math.abs(P.x-mx)<150){this.starT[mx]=rnd(2.5,4);const x=mx+rnd(-24,24);this.shots.push({x,y:this.cam.scrollY-6,vx:rnd(-20,20),vy:40,g:300,t:0,delay:.8,d0:.8,c:'star',r:6,dmg:14,life:3});this.stats.starfall=(this.stats.starfall||0)+1}}}
  if(this.def.masonry&&!NET.guest()&&this.bossState!=='fight'){const P=this.player;this.masonT=(this.masonT||{});for(const mx of this.def.masonry){this.masonT[mx]=(this.masonT[mx]??rnd(.5,2))-dt;if(this.masonT[mx]<0&&Math.abs(P.x-mx)<150&&P.y>100){this.masonT[mx]=rnd(2.5,4);const x=mx+rnd(-24,24);this.shots.push({x,y:this.cam.scrollY-6,vx:0,vy:30,g:420,t:0,delay:.8,d0:.8,c:'stone',r:6,dmg:16,life:3});this.stats.masonry=(this.stats.masonry||0)+1}}}
  if(this.def.theme==='drowned'){const B=this.boss,want=B&&B.kind==='abbess'&&B.phase>=3&&(this.bossState==='fight'||this.bossState==='dying')&&this.bossState!=='dead'?GY-30:null;
   if(want!=null)this.tideY=Math.max(want,(this.tideY??151)-12*dt);else if(this.tideY!=null){this.tideY+=16*dt;if(this.tideY>=151)this.tideY=null}}
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
  // the weapon is in the inventory + save right away (never lost); the world shows it dropping from the boss, flying to the
  // player, and a big HUD banner names it before the victory card (it used to be a small world-space pop hidden by the card)
  this.sigDrop={w,x:this.player?clamp(x,this.player.x-90,this.player.x+90):x,y:GY-40,vy:-150,t:0,got:false,had};this.stats.sigDrops=(this.stats.sigDrops||0)+1}
 sigStep(dt){if(this.sigBanner&&!this.sigDrop){this.sigBanner.t+=dt;if(this.sigBanner.t>2.6)this.sigBanner=null}const d=this.sigDrop;if(!d)return;d.t+=dt;const P=this.player;
  if(!d.got){if(d.t<1.1){d.vy+=420*dt;d.y=Math.min(GY-10,d.y+d.vy*dt)}else{const k=Math.min(1,(d.t-1.1)/.45);d.x+=(P.x-d.x)*k;d.y+=(P.y-14-d.y)*k}
   if(d.t>1.1&&(Math.abs(d.x-P.x)<10&&Math.abs(d.y-P.y+14)<14||d.t>1.7)){d.got=true;d.gt=d.t;this.sigBanner={w:d.w,t:0,had:d.had};this.sfx('fanfare',.45);this.fx.spark(P.x,P.y-14,26,0xffe2a8,140);this.cam.flash(120,255,226,168)}}
  if(this.sigBanner){this.sigBanner.t+=dt;if(this.sigBanner.t>2.6)this.sigBanner=null}if(d.got&&d.t-d.gt>.2)this.sigDrop=null}
 drawSigDrop(g){const d=this.sigDrop;if(!d||d.got)return;const x=Math.round(d.x),y=Math.round(d.y),W0=WEAPONS[d.w]||{},t=this.t;
  // flat pillar of light + a bold weapon silhouette, gold rim (no glow)
  g.fillStyle(0xffe2a8,.35);g.fillRect(x-3,y-120,6,120);g.fillStyle(0xffffff,.6);g.fillRect(x-1,y-120,2,120);
  const L=W0.type==='spear'||W0.type==='halberd'?30:W0.type==='hammer'||W0.type==='axe'?20:24,r=Math.sin(t*6)*.3-.6;
  g.save&&0;const cx=Math.cos(r),sy=Math.sin(r);for(let i=-6;i<L;i++){const px0=Math.round(x+cx*i),py0=Math.round(y+sy*i);g.fillStyle(0x0a0612);g.fillRect(px0-2,py0-2,4,4);}
  for(let i=-6;i<L;i++){const px0=Math.round(x+cx*i),py0=Math.round(y+sy*i);g.fillStyle(i<0?0x8a5a24:i>L-6&&(W0.type==='hammer'||W0.type==='axe')?0xd8d0ee:0xe8ecff);g.fillRect(px0-1,py0-1,i>L-6&&(W0.type==='hammer'||W0.type==='axe')?4:2,i>L-6&&(W0.type==='hammer'||W0.type==='axe')?4:2)}
  g.fillStyle(0xffd04a);g.fillRect(Math.round(x-sy*3)-1,Math.round(y+cx*3)-1,3,3);g.fillRect(Math.round(x+sy*3)-1,Math.round(y-cx*3)-1,3,3)}
 drawSigBanner(g){const b=this.sigBanner;if(!b)return;const a=Math.min(1,b.t*4,(2.6-b.t)*3),W0=WEAPONS[b.w]||{name:b.w};if(a<=0)return;
  const t1=b.title||(b.had?'BOSS WEAPON (ALREADY OWNED)':'BOSS WEAPON ACQUIRED'),t2=W0.name,w=Math.max(textW(t1),textW(t2))+40,x=Math.round(W/2-w/2),y=48;
  g.fillStyle(0x07050f,.9*a);g.fillRect(x,y,w,30);g.fillStyle(0xffd04a,a);g.fillRect(x,y,w,2);g.fillRect(x,y+28,w,2);g.fillRect(x,y,2,30);g.fillRect(x+w-2,y,2,30);
  drawText(g,t1,Math.round(W/2-textW(t1)/2),y+6,0xffd04a,1,0x07050f,a);drawText(g,t2,Math.round(W/2-textW(t2)/2),y+17,0xffffff,1,0x07050f,a)}
 // lord weapons: the heavy attack triggers the weapon's special (costs FP)
 // milestone H: every signature special shares one power budget, independent of catalysts and of the wielded weapon's stat requirements:
 // pw = half the attack rating FROSTBRAND would have for this build; each special strikes every target it reaches ONCE for ~4*pw (toll 3.5*pw + stun)
 // r7 P2 #4: a special scales from the HELD weapon's own attack rating, capped near 1.4x that weapon's light DPS (special ~2.5 pw per 1.5 s cooldown)
 specialPower(wp){const ar=this.build.ar||1;if(wp&&wp.spMul)return ar*wp.spMul;const L=(wp||WEAPONS[this.sv.eq.main]||{}).light||{t:.34,mul:1,n:1},lightDps=ar*(L.mul||1)*Math.min(2,L.n||1)/(L.t||.34);return Math.min(.5*ar,.84*lightDps)}
 weaponSpecial(wp){const P=this.player,sp=wp.special,f=P.f,pw=this.specialPower(wp),hitSet=new Set(),cost=Math.max(14,wp.spFp||8);if((P.spCd||0)>this.t){this.pop('NOT READY',P.x,P.y-24,0x6ab8ff);return}if(P.fp<cost){this.pop('NO FP',P.x,P.y-24,0x6ab8ff);return}P.fp-=cost;P.spCd=this.t+(wp.spMul?1.1:1.5);this.stats.specials=(this.stats.specials||0)+1;const SR=wp.spR||1;if(wp.spMul){this.cam.shake(180,.012);this.novas.push({dome:1,owner:'p',harmless:1,x:P.x,y:P.y,R:34*SR,grow:.18,t:0,m:.35});this.fx.spark(P.x,P.y-12,30,0xffe2a8,170)}
  // each target is struck once per special (no multi-hit stacking); lords take the frost-row share (60%)
  const hitR=(x,y,R0,n)=>{const R=R0*SR;for(const e of this.enemies)if(!e.dead&&!hitSet.has(e)&&Math.abs(e.b.x-x)<R&&Math.abs(e.b.y-y)<R){hitSet.add(e);this.damageEnemy(e,n,Math.sign(e.b.x-P.x)||f)}const B=this.boss;if(B&&!hitSet.has(B)&&this.bossState==='fight'&&Math.abs(B.x-x)<R+8&&Math.abs(B.y-16-y)<R+16){hitSet.add(B);this.damageBoss(n*.6)}
   for(const c of this.chests)if(c.st==='awake'&&!hitSet.has(c)&&Math.abs(c.hx-x)<R){hitSet.add(c);this.hitMimic(c,n)}};
  if(sp==='frost'){this.castIce(P.x+f*16,f,'p',GY,4*pw,hitSet);this.sfx('bonfire',.3)}
  else if(sp==='hymn'){for(let i=0;i<8;i++){const a=i/8*6.283;this.fx.star(P.x+Math.cos(a)*30,P.y-10+Math.sin(a)*20,0xb8a8ff)}this.novas.push({x:P.x,y:P.y-10,t:0,m:.5,parry:1});hitR(P.x,P.y-10,44,4*pw);this.sfx('parry',.35)}
  else if(sp==='cinder'){const x0=P.x;for(let i=0;i<4;i++)this.time.delayedCall(i*90,()=>{const x=x0+f*(14+i*20);this.fx.fire(x,GY-2,8,4,1.4);this.light(x,GY-8,30,C.f2,.8);hitR(x,P.y-6,18,4*pw)});this.cam.shake(200,.014);this.sfx('slam',.4)}
  else if(sp==='toll'){this.novas.push({dome:1,owner:'p',harmless:1,x:P.x,y:P.y,R:70,grow:.35,t:0,m:.8});hitR(P.x,P.y-8,64,3.5*pw);for(const e of this.enemies)if(!e.dead&&Math.abs(e.b.x-P.x)<64){e.state='stag';e.t=0}this.cam.shake(260,.016);this.sfx('bell',.55)}
  else if(sp==='echo'){const x0=P.x,y0=P.y-9;this.pNovas=(this.pNovas||[]).concat([{x:x0,y:y0+1,t:0}]);this.pBolts=(this.pBolts||[]).concat([{x:x0+f*8,y:y0,f,t:0}]);this.sfx('bell',.5);this.cam.shake(140,.01);// every lord at once: a ring and a bolt
   hitR(x0,y0+1,30,4*pw);for(let i=0;i<3;i++)this.time.delayedCall(i*45,()=>hitR(x0+f*(30+i*22),y0+1,16,4*pw))}
  else if(sp==='bramble'){const x0=P.x;this.pBrambles=(this.pBrambles||[]).concat([{x:x0,f,t:0,y:P.y}]);this.sfx('roll',.5);this.cam.shake(100,.008);// thorns erupt in a row ahead
   for(let i=0;i<4;i++)this.time.delayedCall(i*55,()=>hitR(x0+f*(14+i*18),P.y-10,16,4*pw))}
  else if(sp==='nova'){const x0=P.x,y0=P.y-8;this.pNovas=(this.pNovas||[]).concat([{x:x0,y:y0,t:0}]);this.sfx('chime',.6);this.flashA=.06;
   for(let i=0;i<3;i++)this.time.delayedCall(i*70,()=>hitR(x0,y0,22+i*14,4*pw))}
  else if(sp==='bolt'){const x0=P.x,y0=P.y-9;this.pBolts=(this.pBolts||[]).concat([{x:x0+f*8,y:y0,f,t:0}]);this.sfx('shot',.5);this.cam.shake(120,.008);// a ballista bolt that pierces its whole line
   for(let i=0;i<4;i++)this.time.delayedCall(i*45,()=>hitR(x0+f*(16+i*22),P.y-8,16,4*pw))}
  else if(sp==='tide'){const x0=P.x;this.tideCrests=(this.tideCrests||[]).concat([{x:x0+f*8,f,t:0}]);this.splash(x0+f*10,GY-2,10);this.sfx('roll',.45);this.cam.shake(150,.01);// a tide-crest rolls forward 4 steps
   for(let i=0;i<4;i++)this.time.delayedCall(i*80,()=>hitR(x0+f*(16+i*22),P.y-8,16,4*pw))}
  else if(sp==='forge'){this.cam.shake(240,.018);this.sfx('slam',.45);this.fx.dust(P.x+f*14,GY,12);// the anvil comes down: three molten pillars walk forward
   const x0=P.x;for(let i=0;i<3;i++)this.time.delayedCall(80+i*110,()=>{const x=x0+f*(18+i*22);this.fx.fire(x,GY-2,10,5,1.6);this.fx.ember(x,GY-10,6,1.4);this.light(x,GY-14,36,C.f2,.9);this.forgeCols=(this.forgeCols||[]).concat([{x,t:0}]);hitR(x,P.y-8,16,4*pw)})}}
 drawLoot(g,ga){const t=this.t;
  if(this.def.bellKind==='relic')for(const b of this.bells){const x=Math.round(b.x),y=b.y,lit=b.rung,tt=this.t,has=this.relicOk(b);// an ash altar with the lord's sigil; offered = the weapon laid on it, burning pale
   const cl={toller:0xd8f2ff,smith:0xffa060,abbess:0x9ff0e8,marshal:0xe8d8b8,astronomer:0xd8d0ff,prioress:0xc8e890}[b.lord]||0xffffff;
   g.fillStyle(0x3a3026);g.fillRect(x-8,y-10,16,10);g.fillStyle(0x5a4a3a);g.fillRect(x-9,y-12,18,2);g.fillStyle(0x221a14);g.fillRect(x-6,y-8,12,6);px(g,x,y-5,lit?cl:has?0x8a7a6a:0x4a3a2a);
   if(lit){line(g,x-7,y-15,x+7,y-13,0xb8b0a8);px(g,x+7,y-13,0xffffff);glow(ga,x,y-16,10+Math.sin(tt*3),cl,.3);if(Math.random()<.15)this.fx.spark(x+rnd(-5,5),y-18,1,cl,30)}
   else if(has)glow(ga,x,y-6,6+Math.sin(tt*4),cl,.12)}
  else if(this.def.bellKind==='bloom')for(const b of this.bells){const x=Math.round(b.x),y=b.y,cut=b.rung,tt=this.t;// a blighted bloom: a swollen, pulsing pod on a thorny stalk, venting spores; cut = a withered stump
   line(g,x,y,x,y-(cut?4:12),0x3a5a2a);px(g,x-1,y-6,0x6a8a40);px(g,x+1,y-9,0x6a8a40);
   if(cut){g.fillStyle(0x4a3a2a);g.fillRect(x-2,y-5,5,2);px(g,x-3,y-1,0x5a4a30)}
   else{const pu=Math.round(Math.sin(tt*3+x)*1);g.fillStyle(0x6a2a4a);g.fillRect(x-4-pu,y-19-pu,9+pu*2,8+pu*2);g.fillStyle(0xa84a6a);g.fillRect(x-3,y-18,7,2);g.fillStyle(0xd8e890);px(g,x-1,y-15,0xd8e890);px(g,x+2,y-14,0xd8e890);
    glow(ga,x,y-15,8,0xb8e070,.18);if(Math.random()<.1)this.fx.spark(x+rnd(-4,4),y-20,1,0xb8e070,20)}}
  else if(this.def.bellKind==='lens')for(const b of this.bells){const x=Math.round(b.x),y=b.y,up=b.rung,tt=this.t;// a brass star lens on a tripod: face-down (dark) until struck, then turned to the sky and shining
   const br=0x8a7a4a,bh=0xd8c080;line(g,x,y-12,x-6,y,br);line(g,x,y-12,x+6,y,br);line(g,x,y-12,x,y,br);g.fillStyle(br);g.fillRect(x-3,y-15,7,4);
   if(up){g.fillStyle(bh);g.fillRect(x-1,y-22,3,8);g.fillStyle(0xd8d0ff);g.fillRect(x-2,y-25,5,3);glow(ga,x,y-26,9+Math.sin(tt*3),0xb8b0ff,.3);line(ga,x,y-28,x,y-120,0xb8b0ff,.12)}
   else{g.fillStyle(bh);g.fillRect(x-5,y-13,10,2);g.fillStyle(0x2a2648);g.fillRect(x-4,y-11,8,2);px(ga,x+Math.round(Math.sin(tt*2)*3),y-14,0xd8d0ff,.4)}}
  else if(this.def.bellKind==='ballista')for(const b of this.bells){const x=Math.round(b.x),y=b.y,f=b.aim||b.f||1,wr=b.rung,rc=Math.round((b.rec||0)*3);// siege ballista: trestle, stock, bow arms, loaded bolt; wrecked = snapped and tilted
   const wd=0x5a3e26,wh=0x8a6a44,ir=0x5a5a62;g.fillStyle(wd);g.fillRect(x-8,y-6,3,6);g.fillRect(x+5,y-6,3,6);g.fillRect(x-9,y-7,18,2);
   if(wr){g.fillStyle(wd);g.fillRect(x-10,y-10,14,2);g.fillRect(x+3,y-12,2,4);g.fillStyle(ir);g.fillRect(x-6,y-3,3,1);px(g,x+7,y-2,wh);px(g,x-11,y-1,wh)}
   else{g.fillStyle(wd);g.fillRect(x-10-f*rc,y-11,20,3);g.fillStyle(wh);g.fillRect(x-10-f*rc,y-11,20,1);const ax=x+f*7-f*rc;g.fillStyle(ir);g.fillRect(ax-1,y-17,2,13);line(g,ax,y-17,x-f*6-f*rc,y-10,0xb8b0a0);line(g,ax,y-4,x-f*6-f*rc,y-10,0xb8b0a0);
    if((b.cd||0)>.6){g.fillStyle(0x8a7a5a);g.fillRect(Math.min(x-f*6,x+f*10)-f*rc,y-10,16,1);px(g,x+f*11-f*rc,y-10,0xd8d8e0)}if(rc>0)glow(ga,x+f*12,y-10,6,0xffe2a8,.2)}}
  else if(this.def.bellKind==='sigil')for(const b of this.bells){const x=Math.round(b.x),y=b.y,lit=b.rung,i=this.def.bellOrder.indexOf(b.id);// a sister's grave-slab; her glyph glows once struck in turn
   const st=lit?0x4a7a78:0x2e3e40,hl=lit?0x9ff0e8:0x5a7070;g.fillStyle(st);g.fillRect(x-5,y-18,11,18);g.fillRect(x-4,y-20,9,2);g.fillStyle(hl);g.fillRect(x-4,y-20,9,1);px(g,x-5,y-18,hl);
   const gc=lit?0xd8ffff:0x7a9a9a;for(let k=0;k<=i;k++){g.fillStyle(gc);g.fillRect(x-3+k*2,y-14,1,6)}g.fillStyle(gc);g.fillRect(x-3,y-7,7,1);// glyph: tally of her place in the drowning
   if(lit){glow(ga,x,y-11,10+b.sw*8,0x4ad8d8,.2);this.light(x,y-11,30,0x4ad8d8,.45)}else if(Math.floor(t*2+x)%4===0)px(ga,x+rnd(-4,4),y-rnd(4,16),0x4ad8d8,.5)}
  else if(this.def.bellKind==='anvil')for(const b of this.bells){const x=Math.round(b.x),y=b.y,j=Math.round(Math.sin(t*40)*b.sw*1.5),hot=b.rung;// forge anvil: horn, face, waist, foot; struck = glowing
   const body=hot?0x8a3a1a:0x3a3436,hl=hot?0xffc070:0x8a8088,dk=hot?0x4a1a0a:0x18141a;g.fillStyle(dk);g.fillRect(x-7+j,y-3,15,3);g.fillStyle(body);g.fillRect(x-3+j,y-8,7,5);g.fillRect(x-8+j,y-12,17,4);g.fillRect(x-12+j,y-11,4,2);px(g,x-13+j,y-11,body);
   g.fillStyle(hl);g.fillRect(x-8+j,y-12,17,1);px(g,x-12+j,y-11,hl);if(hot){glow(ga,x,y-10,10+b.sw*8,C.f2,.22);this.light(x,y-10,34,C.f2,.5);if(Math.random()<.08)this.fx.ember(x,y-12,1,.6)}else{if(Math.floor(t*2+x)%3===0)px(ga,x+rnd(-6,6),y-13,C.f1,.7);glow(ga,x,y-10,6,C.f2,.08)}}
  else for(const b of this.bells){const x=Math.round(b.x),top=b.y-34,sw=Math.sin(t*9)*b.sw*3,bx=Math.round(x+sw),by=b.y-26;// rope from above, bell body, clapper
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
   for(let i=0;i<34;i++){const w=Math.round(6+i*.9);g.fillStyle(i<3?0xd8f2ff:i%9===4?0x6a86b0:0x4a6488);g.fillRect(Math.round(ax)-w,ay+i,2*w+1,1)}line(g,ARENA_L+190,-200,Math.round(ax),ay,0x2e3c58);glow(ga,ax,ay+20,40,0x9fd8ff,.06);this.light(ax,ay+20,70,0x9fd8ff,.3)}
  // icicles along every bell-frame beam
  for(const r of this.def.oneway||[]){if(r[1]>0||r[2]<cX||r[0]>cX+W)continue;for(let x=r[0]+3;x<r[2];x+=7){const l=2+((x*13)%5);g.fillStyle(0xb8d8ff);g.fillRect(x,r[3],1,l);px(g,x,r[3]+l,0xffffff)}}}
 drawCatacombFX(g,ga,cX,cY){const t=this.t;
  // stacked skull niches in the dark behind the route; hanging crucibles on chains, glowing; a furnace mouth + great anvil in the arena
  for(let nx=Math.floor((cX*.7-60)/96)*96;nx<cX*.7+W+60;nx+=96){const sx=Math.round(nx+cX*.3);for(let r=0;r<3;r++){const y=40+r*34;ga.fillStyle(0x2a120c,.5);ga.fillRect(sx,y,22,14);for(let k=0;k<3;k++){ga.fillStyle(0xb8a08a,.14);ga.fillRect(sx+3+k*6,y+6,4,4);ga.fillStyle(0x0a0403,.3);px(ga,sx+4+k*6,y+7,0x0a0403,.4);px(ga,sx+6+k*6,y+7,0x0a0403,.4)}}}
  for(let hx=520;hx<3000;hx+=560){if(hx<cX-60||hx>cX+W+60)continue;const sw=Math.sin(t*.9+hx)*2,by=-20;line(ga,hx,by-180,Math.round(hx+sw),by,0x8a5a3a,.15);const cx=Math.round(hx+sw);ga.fillStyle(0x3a1a10,.6);ga.fillRect(cx-6,by,13,8);ga.fillStyle(C.f2,.5);ga.fillRect(cx-5,by,11,2);glow(ga,cx,by+2,14+Math.sin(t*5+hx)*2,C.f2,.15);
   if(Math.random()<.03)this.fx.ember(cx,by+4,1,1.2)}
  if(cX>ARENA_L-W){const B=this.boss,pf=B&&B.puff?B.puff:0;if(B&&B.puff)B.puff=Math.max(0,B.puff-.02);const fx=3170,fy=GY-70;
   g.fillStyle(0x1a0c08);g.fillRect(fx-34,fy-30,68,70);g.fillStyle(0x2a140c);for(let a=0;a<=10;a++){const an=Math.PI*a/10;g.fillRect(Math.round(fx-Math.cos(an)*24)-2,Math.round(fy-Math.sin(an)*14),5,3)}
   for(let yy=fy;yy<fy+36;yy+=2){const w=20-Math.abs(yy-fy-18)*.3;ga.fillStyle((yy+Math.floor(t*30))%6<3?C.f1:C.f2,.35+.3*pf);ga.fillRect(Math.round(fx-w),yy,Math.round(2*w),2)}glow(ga,fx,fy+18,40+pf*30,C.f2,.18+pf*.2);this.light(fx,fy+18,90+pf*40,C.f2,.7)}
  }
 drawForgeCols(ga){const t=this.t;// the ASHWROUGHT MAUL's molten pillars (any stage)
  for(let i=(this.forgeCols||[]).length-1;i>=0;i--){const c=this.forgeCols[i];c.t+=this.dt||.016;const h=Math.round(30*Math.sin(Math.min(1,c.t/.5)*Math.PI));if(c.t>.5){this.forgeCols.splice(i,1);continue}for(let y=0;y<h;y+=2){ga.fillStyle(y%4?C.f1:C.f2,.7);ga.fillRect(c.x-3+Math.round(Math.sin(y*.5+t*20)),GY-y-2,6,2)}glow(ga,c.x,GY-h/2,12,C.f2,.3)}}
 drawThroneFX(g,ga,cX,cY){const t=this.t;
  // the ashen sanctum: tall ash-grey colonnades, six lords' banners hanging faded, ash falling; each echo hall tinted by its lord
  const ec=[0xd8f2ff,0xffa060,0x9ff0e8,0xe8d8b8,0xd8d0ff,0xc8e890];
  for(let wx=Math.floor((cX*.5-60)/100)*100;wx<cX*.5+W+60;wx+=100){const x=Math.round(wx+cX*.5),k=((wx/100)%6+6)%6;ga.fillStyle(0x3a3026,.14);ga.fillRect(x,30,10,150);ga.fillRect(x-4,26,18,4);
   for(let i=0;i<12;i++)px(ga,x+16+(i%3),40+i,ec[k],.12)}
  for(const z of this.def.wind||[]){if(!this.gustOn(z)||z.r[2]<cX||z.r[0]>cX+W)continue;for(let i=0;i<12;i++){const sx=z.r[0]+((i*97+Math.floor(t*240*z.dir))%(z.r[2]-z.r[0])+(z.r[2]-z.r[0]))%(z.r[2]-z.r[0]),sy=z.r[1]+((i*41)%(z.r[3]-z.r[1]));line(ga,sx,sy,sx-z.dir*10,sy,0xe8d8b8,.2)}}
  for(const z of this.def.lowg||[]){if(z.r[2]<cX||z.r[0]>cX+W)continue;const on=this.gustOn(z);for(let i=0;i<14;i++){const sx=z.r[0]+((i*97)%(z.r[2]-z.r[0])),sy=z.r[3]-((i*41+Math.floor(t*(on?60:10)))%(z.r[3]-z.r[1]));px(ga,sx,sy,0xd8d0ff,on?.45:.12)}}
  for(const z of this.def.spores||[]){if(z.r[2]<cX||z.r[0]>cX+W)continue;const on=this.gustOn(z);for(let i=0;i<(on?22:6);i++){const sx=z.r[0]+((i*61+Math.floor(t*12))%(z.r[2]-z.r[0])),sy=z.r[3]-((i*37+Math.floor(t*(on?18:6)))%(z.r[3]-z.r[1]));px(ga,sx,sy,0xc8e890,on?.5:.15)}}
  for(const th of this.def.thorns||[]){if(th[1]<cX||th[0]>cX+W)continue;for(let x=th[0];x<th[1];x+=3){const h=8+((x*7)%5);line(g,x,th[2],x+1,th[2]-h,0x3a3a24);px(g,x+1,th[2]-h,0xc8c090)}}
  if(cX>ARENA_L-W){// the arena: the hollow throne itself at the far wall, six oath-flames above it
   const tx=3300;g.fillStyle(0x2a241e);g.fillRect(tx-14,GY-56,28,56);g.fillStyle(0x3a3026);g.fillRect(tx-18,GY-20,36,20);g.fillRect(tx-12,GY-70,4,14);g.fillRect(tx+8,GY-70,4,14);
   for(let i=0;i<6;i++){const fx=ARENA_L+40+i*56,fy=GY-110+Math.round(Math.sin(t*2+i)*2);glow(ga,fx,fy,5,ec[i],.35);px(g,fx,fy,ec[i])}
   const B=this.boss;if(B&&B.kind==='heir'&&this.bossState==='fight'&&B.phase>=3){const s=Math.sin(t*1.2);if(Math.abs(s)>.3){const x0=s>0?ARENA_L:(ARENA_L+ARENA_R)/2;for(let i=0;i<36;i++)px(ga,x0+((i*29+Math.floor(t*20))%((ARENA_R-ARENA_L)/2)),GY-((i*17+Math.floor(t*14))%80),i%3?0xc8e890:0xe8d0a8,.45)}}}}
 drawHeir(g,ga,B){const rise=B.rise===undefined?1:B.rise,f=B.f,t=this.t,p=B.phase||1;const x=Math.round(B.x),y=Math.round(GY-(1-rise)*60);const fl=B.flash>0;if(B.flash>0&&this.dt)B.flash--;
  const ash=fl?0xffffff:0x6a6058,ah=fl?0xffffff:0x9a8e80,ad=fl?0xd8d0c8:0x2a241e;this.light(x,y-30,64+p*10,0xe8d0a8,.3+p*.06);
  // a gaunt ash-grey knight in a tattered royal mantle and an empty crown; six oath-motes orbit him, one per lord (they burn brighter each phase)
  const ec=[0xd8f2ff,0xffa060,0x9ff0e8,0xe8d8b8,0xd8d0ff,0xc8e890];
  for(let i=0;i<24;i++){const w=10+Math.floor(i/2);g.fillStyle(i%5===0?0x5a2a24:0x3a1a18);g.fillRect(x-Math.floor(w/2)-f*2,y-28+i,w,1)}
  const st=Math.round(Math.sin(B.step||0));g.fillStyle(ad);g.fillRect(x-6,y-12,4,12+st);g.fillRect(x+2,y-12,4,12-st);
  g.fillStyle(ash);g.fillRect(x-8,y-36,17,24);g.fillStyle(ah);g.fillRect(x-8,y-36,17,1);g.fillStyle(ad);g.fillRect(x-8,y-24,17,1);
  g.fillStyle(ash);g.fillRect(x-5,y-46,11,10);g.fillStyle(0x05050a);g.fillRect(x-3+(f>0?1:0),y-42,7,3);const ea=B.eyes===undefined?1:B.eyes;px(ga,x+f*2,y-41,0xe8d0a8,ea);px(ga,x,y-41,0xe8d0a8,ea);
  g.fillStyle(0x8a7a5a);g.fillRect(x-6,y-49,13,2);for(let k=0;k<4;k++)g.fillRect(x-6+k*4,y-52,1,3);
  for(let i=0;i<6;i++){const an=t*1.4+i*Math.PI/3,ox=x+Math.cos(an)*16,oy=y-30+Math.sin(an)*6;px(g,ox,oy,ec[i]);glow(ga,ox,oy,2+p*.6,ec[i],.25+p*.08)}
  const a=B.state==='wind'?-1.8:B.state==='cast'?-1:.3+Math.sin(t*1.2)*.1,bx=x+f*9+Math.round(f*Math.cos(a)*28),by=y-28+Math.round(Math.sin(a)*28);line(g,x+f*9,y-28,bx,by,0xa89880);line(g,x+f*9,y-27,bx,by+1,0x6a6058);px(g,bx,by,0xffffff);
  if(B.state==='wind'){const k=clamp(B.t/B.wt,0,1),i=(['volley','gust','rubble'].includes(B.next)?3:['pull','comet'].includes(B.next)?4:['lash','bramble','rot'].includes(B.next)?5:B.next==='wave'?2:1);glow(ga,x,y-30,10+k*14,ec[i],.25*k)}}
 drawPBrambles(g,ga){const dt=this.dt||.016;for(let i=this.pBrambles.length-1;i>=0;i--){const b=this.pBrambles[i];b.t+=dt;if(b.t>.5){this.pBrambles.splice(i,1);continue}
   for(let k=0;k<4;k++){const tk=b.t-k*.055;if(tk<0)continue;const h=Math.round(Math.min(1,tk*8)*(14-k)*(1-Math.max(0,b.t-.35)/.15)),x=Math.round(b.x+b.f*(14+k*18)),y=Math.round(b.y);
    for(let s=-1;s<=1;s++){line(g,x+s*4,y,x+s*5,y-h+Math.abs(s)*3,0x4a6a2a);px(g,x+s*5,y-h+Math.abs(s)*3,0xa8c870)}glow(ga,x,y-h/2,6,0xb8e070,.12)}}}
 drawCloisterFX(g,ga,cX,cY){const t=this.t;
  // cloister arcade behind (round arches on columns), vines hanging over everything, spore clouds that bloom pale and fade, thorn brakes on the walks
  for(let wx=Math.floor((cX*.5-60)/80)*80;wx<cX*.5+W+60;wx+=80){const x=Math.round(wx+cX*.5),top=60;ga.fillStyle(0x2a3a24,.14);ga.fillRect(x,top,8,110);for(let a=0;a<=8;a++){const an=Math.PI*a/8;ga.fillRect(Math.round(x+40-Math.cos(an)*36),Math.round(top-Math.sin(an)*24),4,4)}
   for(let k=0;k<6;k++){const vx=x+10+k*11,vl=18+((k*13+wx)%30);for(let j=0;j<vl;j+=3)px(ga,vx+Math.round(Math.sin(t*1.2+j*.2+k)*1.5),top-8+j,0x4a6a3a,.25)}}
  for(const vx of this.def.vines||[]){if(vx<cX-40||vx>cX+W+40)continue;for(let j=0;j<200;j+=4){const y=-200+j,x=vx+Math.round(Math.sin(j*.08+t*.8)*3);px(g,x,y,0x3a5a2a);if(j%12===0){px(g,x+1,y,0x6a8a40);px(g,x-1,y+1,0x6a8a40)}}}
  for(const z of this.def.spores||[]){if(z.r[2]<cX||z.r[0]>cX+W)continue;const on=this.gustOn(z),cx=(z.r[0]+z.r[2])/2,cy=(z.r[1]+z.r[3])/2;
   for(let i=0;i<(on?26:8);i++){const sx=z.r[0]+((i*61+Math.floor(t*12))%(z.r[2]-z.r[0])),sy=z.r[3]-((i*37+Math.floor(t*(on?18:6)))%(z.r[3]-z.r[1]));px(ga,sx,sy,i%3?0xb8e070:0xe8f0b0,on?.55:.15)}
   if(on)glow(ga,cx,cy,(z.r[2]-z.r[0])*.35,0x9ac050,.1)}
  for(const th of this.def.thorns||[]){if(th[1]<cX||th[0]>cX+W)continue;for(let x=th[0];x<th[1];x+=3){const h=8+((x*7)%5);line(g,x,th[2],x+1,th[2]-h,0x3a4a24);px(g,x+1,th[2]-h,0xc8c090)}}
  if(cX>ARENA_L-W){// the arena: a rose window choked by vines; in phase 3 the rot rolls from one side of the garden to the other
   const cx=3160,cy=-20;for(let a=0;a<16;a++){const an=a/16*Math.PI*2;line(ga,cx,cy,cx+Math.cos(an)*34,cy+Math.sin(an)*34,0x6a8a40,.2)}glow(ga,cx,cy,30,0xb8e070,.06);
   const B=this.boss;if(B&&B.kind==='prioress'&&this.bossState==='fight'&&B.phase>=3){const s=Math.sin(t*1.2);if(Math.abs(s)>.3){const x0=s>0?ARENA_L:(ARENA_L+ARENA_R)/2;for(let i=0;i<40;i++)px(ga,x0+((i*29+Math.floor(t*20))%((ARENA_R-ARENA_L)/2)),GY-((i*17+Math.floor(t*14))%80),i%3?0xb8e070:0xe8f0b0,.5)}}}}
 drawPrioress(g,ga,B){const rise=B.rise===undefined?1:B.rise,f=B.f,t=this.t,p=B.phase||1;const x=Math.round(B.x),y=Math.round(GY-(1-rise)*60);const fl=B.flash>0;if(B.flash>0&&this.dt)B.flash--;
  const rb=fl?0xffffff:0x2a3a24,rh=fl?0xffffff:0x4a6a3a,sk=fl?0xffffff:0xd8d0c0;this.light(x,y-28,56+p*8,0xb8e070,.28+p*.06);
  // a tall wimpled prioress grown through with briar: green habit, a crown of thorns and roses (more blooms each phase), thorn tendrils trailing, the thornbrand
  for(let i=0;i<26;i++){const w=8+Math.floor(i/2.5);g.fillStyle(i%6===0?rh:rb);g.fillRect(x-Math.floor(w/2),y-26+i,w,1)}
  for(let k=0;k<5;k++){const tx=x-f*(6+k*3),ty=y-2-k;line(g,x-f*4,y-6,tx-f*Math.round(Math.sin(t*2+k)*3),ty,0x3a5a2a);px(g,tx,ty-1,0xc8c090)}
  g.fillStyle(rb);g.fillRect(x-6,y-42,12,16);g.fillStyle(sk);g.fillRect(x-4,y-48,9,7);g.fillStyle(0xe8e0d8);g.fillRect(x-5,y-49,11,2);g.fillStyle(0x05050a);px(g,x+f*1,y-45,0x05050a);px(g,x+f*3,y-45,0x05050a);
  const ea=B.eyes===undefined?1:B.eyes;px(ga,x+f,y-45,0xc8f080,ea);px(ga,x+f*3,y-45,0xc8f080,ea);
  for(let k=0;k<7;k++){const cx=x-5+k*2,cy=y-51-(k%2);px(g,cx,cy,0x4a6a2a);px(g,cx,cy-1,0xc8c090)}for(let k=0;k<p+1;k++)px(g,x-4+k*3,y-52,0xc84a5a);
  const a=B.state==='wind'?-1.6:B.state==='cast'?-.9:.35+Math.sin(t*1.5)*.1,bx=x+f*7+Math.round(f*Math.cos(a)*18),by=y-28+Math.round(Math.sin(a)*18);line(g,x+f*7,y-28,bx,by,0xa8b8a0);px(g,bx,by,0xffffff);for(let k=0;k<3;k++)px(g,x+f*(9+k*4),y-28+Math.round(Math.sin(a)*(k*4+4))-1,0x4a6a2a);
  if(B.state==='wind'&&(B.next==='lash'||B.next==='bramble'||B.next==='rot')){const k=clamp(B.t/B.wt,0,1);for(let i=0;i<10;i++)px(ga,x-30+i*6,GY-Math.round(k*10*((i%3)+1)),0xb8e070,.5*k)}}
 drawPNovas(g,ga){const dt=this.dt||.016;for(let i=this.pNovas.length-1;i>=0;i--){const n=this.pNovas[i];n.t+=dt;if(n.t>.4){this.pNovas.splice(i,1);continue}const R=10+n.t*120,a=1-n.t/.4;
   for(let k=0;k<20;k++){const an=k/20*Math.PI*2;px(ga,n.x+Math.cos(an)*R,n.y+Math.sin(an)*R*.8,k%2?0xd8d0ff:0xffffff,a)}glow(ga,n.x,n.y,R*.5,0xb8b0ff,.2*a)}}
 drawSpireFX(g,ga,cX,cY){const t=this.t;
  // gothic observatory: lancet windows and ribbed domes behind, a slowly turning star field, constellation lines; gravity tides shimmer; star platforms flicker
  for(let i=0;i<60;i++){const sx=((i*137+Math.floor(t*4))%(W+40))+cX-20,sy=cY+((i*71)%H);px(ga,sx,sy,i%7?0xb8b0e8:0xffffff,.3+.3*Math.sin(t*2+i))}
  for(let wx=Math.floor((cX*.5-80)/140)*140;wx<cX*.5+W+80;wx+=140){const x=Math.round(wx+cX*.5),top=20+((wx/140*29)%24|0);ga.fillStyle(0x2a2458,.14);ga.fillRect(x,top+20,90,160);
   for(let a=0;a<=10;a++){const an=Math.PI*a/10;ga.fillRect(Math.round(x+45-Math.cos(an)*45)-2,Math.round(top+20-Math.sin(an)*26),5,4)}ga.fillStyle(0x8a80e8,.08);ga.fillRect(x+30,top+30,8,30);ga.fillRect(x+52,top+30,8,30)}
  for(const z of this.def.lowg||[]){if(z.r[2]<cX||z.r[0]>cX+W)continue;const on=this.gustOn(z);for(let i=0;i<16;i++){const sx=z.r[0]+((i*97)%(z.r[2]-z.r[0])),sy=z.r[3]-((i*41+Math.floor(t*(on?60:10)))%(z.r[3]-z.r[1]));px(ga,sx,sy,0xb8b0ff,on?.45:.12)}}
  for(const s of this.def.stars||[]){const on=this.starOn(s),ph=((this.t+s[0]*.01)%s[3])/s[3];const warn=on&&ph>.5;for(let k=0;k<s[2];k+=3)px(on?g:ga,s[0]+k,s[1]+(k%6?0:-1),warn&&(Math.floor(t*12)%2)?0x5a5490:0xd8d0ff,on?1:.2);if(on)glow(ga,s[0]+s[2]/2,s[1],s[2]*.4,0xb8b0ff,.12)}
  if(cX>ARENA_L-W){// the arena: a great orrery overhead and the open dome; it turns faster in each phase
   const B=this.boss,ph=B?B.phase||1:1,cx=3160,cy=-10;for(let k=0;k<5;k++){const an=t*(.3+ph*.2)+k*1.26,R=30+k*14;const ox=cx+Math.cos(an)*R,oy=cy+Math.sin(an)*R*.35;line(ga,cx,cy,ox,oy,0x8a7a4a,.25);glow(ga,ox,oy,3+k%2,0xd8d0ff,.35)}
   if(this.gravAt(this.player.x,this.player.y-8))for(let i=0;i<14;i++){const sx=ARENA_L+((i*53)%360),sy=GY-((i*29+Math.floor(t*40))%110);px(ga,sx,sy,0xd8d0ff,.4)}}}
 drawAstronomer(g,ga,B){const rise=B.rise===undefined?1:B.rise,f=B.f,t=this.t,p=B.phase||1;const x=Math.round(B.x),y=Math.round(GY-(1-rise)*60+Math.sin(t*2)*2);const fl=B.flash>0;if(B.flash>0&&this.dt)B.flash--;
  const rb=fl?0xffffff:0x2a2458,rh=fl?0xffffff:0x4a40a0,gd=fl?0xffffff:0xd8c080;this.light(x,y-28,60+p*10,0xb8b0ff,.32+p*.06);
  // star-sewn robe, tall hood, a crown of orbiting stars (one per phase), brass astrolabe and the starlance
  for(let i=0;i<22;i++){const w=6+Math.floor(i/2);g.fillStyle(i%5===0?rh:rb);g.fillRect(x-Math.floor(w/2),y-24+i,w,1)}for(let k=0;k<6;k++)px(g,x-6+((k*5)%12),y-18+((k*7)%18),0xd8d0ff);
  g.fillStyle(rb);g.fillRect(x-5,y-40,11,16);g.fillStyle(rh);g.fillRect(x-4,y-46,9,6);g.fillRect(x-2,y-50,5,4);g.fillStyle(0x05050a);g.fillRect(x-3+(f>0?1:0),y-38,6,5);const ea=B.eyes===undefined?1:B.eyes;px(ga,x+f,y-36,0xd8d0ff,ea);px(ga,x+f-f*2,y-36,0xd8d0ff,ea);
  for(let k=0;k<2+p;k++){const an=t*2+k*Math.PI*2/(2+p);glow(ga,x+Math.cos(an)*12,y-46+Math.sin(an)*4,2,0xffffff,.5);px(g,x+Math.cos(an)*12,y-46+Math.sin(an)*4,0xffffff)}
  const ax=x-f*9;g.fillStyle(gd);for(let a=0;a<12;a++){const an=a/12*Math.PI*2+t;px(g,ax+Math.cos(an)*4,y-26+Math.sin(an)*4,gd)}
  const a=B.state==='wind'?-1.8:B.state==='cast'?-1.1:.2+Math.sin(t*1.3)*.1,lx=x+f*8+Math.round(f*Math.cos(a)*24),ly=y-28+Math.round(Math.sin(a)*24);line(g,x+f*8,y-28,lx,ly,0x8a80c8);glow(ga,lx,ly,4,0xffffff,.4);px(g,lx,ly,0xffffff);
  if(B.state==='wind'&&(B.next==='lance'||B.next==='pull'||B.next==='comet')){const k=clamp(B.t/B.wt,0,1);for(let i=0;i<12;i++){const an=i/12*Math.PI*2-t*3;px(ga,x+Math.cos(an)*30*(1-k),y-28+Math.sin(an)*30*(1-k),0xd8d0ff,.6*k)}}}
 drawPBolts(g,ga){const dt=this.dt||.016;for(let i=this.pBolts.length-1;i>=0;i--){const b=this.pBolts[i];b.t+=dt;b.x+=b.f*480*dt;if(b.t>.3){this.pBolts.splice(i,1);continue}const x=Math.round(b.x),y=Math.round(b.y);
   g.fillStyle(0x6a4a2a);g.fillRect(x-b.f*16,y,16,1);g.fillStyle(0xd8d8e0);px(g,x,y,0xd8d8e0);px(g,x+b.f,y,0xffffff);px(g,x-b.f*16,y-1,0xd8d0c0);px(g,x-b.f*16,y+1,0xd8d0c0);for(let k=1;k<6;k++)px(ga,x-b.f*(16+k*3),y,0xffe2a8,.3-k*.05)}}
 drawKeepFX(g,ga,cX,cY){const t=this.t;
  // ruined curtain walls behind the route: crenellations with gaps, cracks, a broken tower every few spans; torn banners whip in the wind
  for(let wx=Math.floor((cX*.5-80)/120)*120;wx<cX*.5+W+80;wx+=120){const x=Math.round(wx+cX*.5),top=34+((wx/120*37)%20|0),broken=(wx/120)%3===1;ga.fillStyle(0x3a3a48,.1);ga.fillRect(x,top,110,140);
   for(let k=0;k<110;k+=12){if(broken&&k>40&&k<80)continue;ga.fillRect(x+k,top-6,7,6)}if(broken){for(let k=0;k<5;k++)ga.fillRect(x+44+k*7,top+((k*13)%9),5,4)}
   for(let k=0;k<3;k++)line(ga,x+20+k*30,top+10,x+26+k*30,top+40,0x0a0a10,.12)}
  const gust=(this.def.wind||[]).find(z=>this.gustOn(z));const wd=gust?gust.dir:Math.sin(t*.5)>0?1:-1;
  for(let bx=300;bx<3000;bx+=420){if(bx<cX-40||bx>cX+W+40)continue;const by=-120;line(g,bx,by,bx,by+60,0x3a3630);for(let i=0;i<14;i++){const wv=Math.sin(t*(gust?12:4)+i*.6)*(gust?3:1.5);g.fillStyle(i%5===0?0x8a2a24:0x6a2a24);g.fillRect(bx+wd*i,by+2+Math.round(wv),1,10-Math.floor(i/3))}}
  // wind streaks inside the gusting battlement zones
  for(const z of this.def.wind||[]){if(!this.gustOn(z)||z.r[2]<cX||z.r[0]>cX+W)continue;for(let i=0;i<14;i++){const sx=z.r[0]+((i*97+Math.floor(t*240*z.dir))%(z.r[2]-z.r[0])+(z.r[2]-z.r[0]))%(z.r[2]-z.r[0]),sy=z.r[1]+((i*41)%(z.r[3]-z.r[1]));line(ga,sx,sy,sx-z.dir*10,sy,0xd8d8e8,.18)}}
  if(cX>ARENA_L-W){// the arena: a broken portcullis over the far gate, a gale when he calls it
   g.fillStyle(0x2a2830);g.fillRect(ARENA_L+320,GY-70,30,70);g.fillStyle(0x5a5660);for(let i=0;i<6;i++)g.fillRect(ARENA_L+322+i*5,GY-70,1,48+((i*7)%14));for(let y=GY-66;y<GY-24;y+=8)g.fillRect(3302,y,26,1);
   const w=this.windAt(this.player.x,this.player.y-8);if(w){for(let i=0;i<18;i++){const sx=ARENA_L+((i*53+Math.floor(t*300*Math.sign(w)))%360+360)%360,sy=GY-6-((i*29)%90);line(ga,sx,sy,sx-Math.sign(w)*14,sy,0xe8e8f0,.22)}}}}
 drawMarshal(g,ga,B){const rise=B.rise===undefined?1:B.rise,f=B.f,t=this.t,p=B.phase||1,X=d=>x+d*f;const x=Math.round(B.x),y=Math.round(GY-(1-rise)*60);const fl=B.flash>0;if(B.flash>0&&this.dt)B.flash--;
  const ar=fl?0xffffff:0x5a5a66,ah=fl?0xffffff:0x9a9aa8,ad=fl?0xd8d8e0:0x2a2a34,cl=fl?0xffffff:0x6a2a24;
  this.light(x,y-26,56+p*8,0xd8d0c0,.3+p*.06);
  // banner-cape whipping behind him (wind side), plate body, great helm with a slit, tower shield, halberd
  const wd=(this.windAt(x,y-20)||-f)>0?1:-1;for(let i=0;i<18;i++){const wv=Math.round(Math.sin(t*8+i*.5)*2);g.fillStyle(i%6===0?0x8a3a2a:cl);g.fillRect(x-wd*2+wd*i,y-34+wv+Math.floor(i/2),1,18-Math.floor(i/2))}
  const st=Math.round(Math.sin(B.step||0));g.fillStyle(ad);g.fillRect(x-7,y-12,5,12+st);g.fillRect(x+2,y-12,5,12-st);
  g.fillStyle(ar);g.fillRect(x-9,y-34,19,22);g.fillStyle(ah);g.fillRect(x-9,y-34,19,1);g.fillRect(x-9,y-34,1,22);g.fillStyle(ad);g.fillRect(x-9,y-23,19,1);for(let k=0;k<p;k++)px(g,x-6+k*3,y-28,0xb8b0a0);
  g.fillStyle(ar);g.fillRect(x-5,y-44,11,10);g.fillStyle(ah);g.fillRect(x-5,y-44,11,1);g.fillStyle(0x05050a);g.fillRect(x-4+(f>0?2:0),y-40,7,2);const ec=p>=3?0xffd890:0xd8d0c0,ea=B.eyes===undefined?1:B.eyes;px(ga,x+f*2,y-40,ec,ea);px(ga,x+f*2-f*2,y-40,ec,ea);
  g.fillStyle(0x8a3a2a);g.fillRect(x-1,y-48,3,4);
  const sx=X(-11);g.fillStyle(0x4a4a56);g.fillRect(sx-3,y-36,7,26);g.fillStyle(ah);g.fillRect(sx-3,y-36,7,1);g.fillStyle(0x8a3a2a);g.fillRect(sx-1,y-30,3,12);px(g,sx,y-33,0xe8d8b8);
  const wind=B.state==='wind',a=wind?-2:B.state==='slam'?.8:B.state==='cast'?-1.3:.35+Math.sin(t*1.4)*.1,hx=X(10)+Math.round(f*Math.cos(a)*26),hy=y-26+Math.round(Math.sin(a)*26);line(g,X(10),y-26,hx,hy,0x6a5040);
  g.fillStyle(0xb8b8c8);g.fillRect(hx-2,hy-3,5,6);px(g,hx+f*3,hy-4,0xffffff);if(B.state==='wind')glow(ga,hx,hy,8,0xffe2a8,.22);
  if(B.state==='wind'&&(B.next==='volley'||B.next==='gust'||B.next==='rubble')){const k=clamp(B.t/B.wt,0,1);for(let i=0;i<10;i++)line(ga,x-30+i*6,y-60+((i*13)%20),x-24+i*6,y-60+((i*13)%20),0xe8e8f0,.3*k)}}
 drawTideCrests(g,ga){const dt=this.dt||.016;for(let i=this.tideCrests.length-1;i>=0;i--){const c=this.tideCrests[i];c.t+=dt;c.x+=c.f*240*dt;if(c.t>.4){this.tideCrests.splice(i,1);continue}
   const h=Math.round(16*Math.sin(Math.min(1,c.t/.4)*Math.PI)),x=Math.round(c.x);for(let k=0;k<14;k++){const yy=GY-1-Math.round(h*Math.sin((k/14)*Math.PI));g.fillStyle(k%3?0x2a9aa8:0x9ff0e8,.8);g.fillRect(x-c.f*k,yy,1,GY-yy)}
   for(let k=0;k<4;k++)px(ga,x-c.f*k,GY-1-h,0xffffff,.8);glow(ga,x,GY-h/2,12,0x4ac8d8,.2)}}
 drawDrownedFX(g,ga,cX,cY){const t=this.t;
  // drowned arches behind the route, their lower halves under a slow water line; shafts of pale light through the water
  for(let ax=Math.floor((cX*.6-80)/160)*160;ax<cX*.6+W+80;ax+=160){const x=Math.round(ax+cX*.4);ga.fillStyle(0x1a4a50,.12);for(let a=0;a<=12;a++){const an=Math.PI*a/12;ga.fillRect(Math.round(x-Math.cos(an)*28),Math.round(60-Math.sin(an)*30),3,3)}ga.fillRect(x-30,60,4,90);ga.fillRect(x+26,60,4,90);
   ga.fillStyle(0x2a8a90,.05);ga.fillRect(x-30,100+Math.round(Math.sin(t+ax)*2),60,50)}
  for(let i=0;i<3;i++){const sx=Math.round(cX+60+i*110+Math.sin(t*.3+i)*20);for(let y=cY;y<cY+H;y+=3)px(ga,sx+(y-cY)*.3,y,0x9ff0e8,.05)}
  if(cX>ARENA_L-W){for(const q of this.geysers||[]){q.t+=this.dt||.016}this.geysers=(this.geysers||[]).filter(q=>q.t<.6);
   for(const q of this.geysers){const h=Math.round(40*Math.sin(Math.min(1,q.t/.6)*Math.PI));for(let y=0;y<h;y+=2){g.fillStyle(y%4?0x2a9aa8:0x9ff0e8,.75);g.fillRect(q.x-2+Math.round(Math.sin(y*.4+t*20)),GY-y-2,5,2)}glow(ga,q.x,GY-h/2,10,0x4ac8d8,.25)}}}
 drawAbbess(g,ga,B){const rise=B.rise===undefined?1:B.rise,f=B.f,t=this.t,p=B.phase||1;const x=Math.round(B.x),y=Math.round(GY-2-(1-rise)*70-Math.sin((B.hov||0)*2)*2);const fl=B.flash>0;if(B.flash>0&&this.dt)B.flash--;
  const robe=fl?0xffffff:0x1e3a42,rh=fl?0xd8ffff:0x3a6a70,veil=fl?0xffffff:0x8ab8b8,sk=fl?0xffffff:0x9ab0a8;
  glow(ga,x,y-26,46,0x2a8a90,.07+p*.03);this.light(x,y-26,62+p*8,0x4ad8d8,.35+p*.08);
  // the Abbess: a tall drowned nun, robe streaming as if underwater, a veil of kelp, the crook she hooked her sisters with
  for(let i=0;i<36;i++){const yy=y-36+i,w=Math.round(3+i*.3+Math.sin(t*2+i*.3)*1.2);g.fillStyle(i<3?rh:robe);g.fillRect(x-w,yy,2*w+1,1);px(g,x-w,yy,rh)}
  for(let k=-11;k<=11;k+=3){const l=2+Math.round(2+Math.sin(t*3+k)*2)+(p>=3?2:0);g.fillStyle(robe);g.fillRect(x+k,y,1,l)}
  g.fillStyle(sk);g.fillRect(x-3,y-44,7,8);g.fillStyle(0x05080a);g.fillRect(x-2,y-41,5,3);const ec=p>=3?0xffffff:0x6af0e8,ea=B.eyes===undefined?1:B.eyes;px(ga,x-1+f,y-40,ec,ea);px(ga,x+1+f,y-40,ec,ea);glow(ga,x+f,y-40,5,0x4ad8d8,.25*ea);
  g.fillStyle(veil);g.fillRect(x-5,y-46,11,2);for(let k=0;k<5;k++){const vx=x-5+k*2-f*Math.round(2+Math.sin(t*2+k)*2);line(g,x-5+k*2,y-45,vx,y-30+((k*3)%5),0x4a7a70)}
  // crook: a long staff ending in a hook, lowered on slam, raised to call the tide
  const up=B.state==='wind'||B.state==='cast',sx=x+f*9,top=up?y-62:B.state==='slam'?y-30:y-52,hx=sx+f*(B.state==='slam'?16:0);line(g,sx,y-4,hx,top,0x6a5a48);g.fillStyle(0x9ab0a8);g.fillRect(hx,top-3,f*5,1);g.fillRect(hx+f*5,top-3,1,5);g.fillRect(hx+f*3,top+2,f*2,1);if(up)glow(ga,hx,top,8,0x4ad8d8,.3);
  if(Math.random()<.2)this.bubbles&&this.bubbles.push({x:x+rnd(-10,10),y:y-rnd(10,40),t:0,top:y-70});
  for(const fl2 of this.flames)if(fl2.water){const fx=Math.round(fl2.x);for(let k=0;k<8;k++){const h=8-Math.abs(k-4)*2;g.fillStyle(k%2?0x2a9aa8:0x9ff0e8,.85);g.fillRect(fx-fl2.dir*k,GY-h,1,h)}glow(ga,fx,GY-4,8,0x4ac8d8,.25)}
  if(B.state==='wind'&&(B.next==='wave'||B.next==='bubbles'||B.next==='deluge')){const k=clamp(B.t/B.wt,0,1);for(let i=0;i<16;i++){const an=i/16*6.283-t*2;px(ga,x+Math.cos(an)*(10+k*16),y-26+Math.sin(an)*(6+k*10),0x9ff0e8,.4*k)}}}
 drawSmith(g,ga,B){const rise=B.rise===undefined?1:B.rise,f=B.f,t=this.t,p=B.phase||1,X=d=>x+d*f;const x=Math.round(B.x),y=Math.round(GY-(1-rise)*80);const fl=B.flash>0;if(B.flash>0&&this.dt)B.flash--;
  if(rise<1){g.fillStyle(0x8a1a08);g.fillRect(x-20,GY,40,50);ga.fillStyle(C.f2,.7);ga.fillRect(x-20,GY,40,1);glow(ga,x,GY,22,C.f2,.25)}
  const skin=fl?0xffffff:0x5a3a30,sd=fl?0xffd8b0:0x2e1a14,ap=fl?0xffe2c0:0x3a2418,aph=fl?0xffffff:0x6a4228,iron=fl?0xffffff:0x4a4448,ih=0x9a9098;
  glow(ga,x,y-24,48,C.f2,.06+p*.03);this.light(x,y-24,64+p*10,C.f2,.4+p*.08);
  // hulking smith: broad shoulders, a leather apron, a forge-heart burning through the ribs (hotter each phase), chains on the wrists
  const st=Math.round(Math.sin((B.step||0))*1);g.fillStyle(sd);g.fillRect(x-9,y-12,6,12+st);g.fillRect(x+3,y-12,6,12-st);
  g.fillStyle(skin);g.fillRect(x-13,y-38,27,26);g.fillRect(x-16,y-38,5,8);g.fillRect(x+12,y-38,5,8);g.fillStyle(sd);g.fillRect(x-13,y-38,27,1);
  g.fillStyle(ap);g.fillRect(x-10,y-28,21,22);g.fillStyle(aph);g.fillRect(x-10,y-28,21,1);for(let i=0;i<3;i++)px(g,x-7+i*7,y-22+i*4,0x1a0c08);
  const hc=p>=3?0xffe08a:p>=2?0xffb04a:C.f2,hr=3+p;g.fillStyle(0x1a0a06);g.fillRect(x-4,y-36,9,7);ga.fillStyle(hc,.9);ga.fillRect(x-hr+1,y-34,2*hr-1,3);glow(ga,x,y-33,8+p*3+Math.sin(t*9)*1.5,hc,.3);
  // head: soot-black hood, ember eyes
  g.fillStyle(0x1e1210);g.fillRect(x-5,y-46,11,9);g.fillStyle(0x07050f);g.fillRect(x-3,y-44,7,5);const ec=p>=3?0xffffff:C.f1,ea=B.eyes===undefined?1:B.eyes;px(ga,x-2+f,y-42,ec,ea);px(ga,x+2+f,y-42,ec,ea);glow(ga,x+f,y-42,5,C.f2,.25*ea);
  // the great hammer: raised in wind, slammed down on slam
  const wind=B.state==='wind',a=wind?-2.2:B.state==='slam'?.9:B.state==='cast'?-1.2:Math.sin(t*1.5)*.15+.4;const sx=X(14),sy=y-30,hx=Math.round(sx+f*Math.cos(a)*22),hy=Math.round(sy+Math.sin(a)*22);
  line(g,sx,sy,hx,hy,0x5a3a24);g.fillStyle(iron);g.fillRect(hx-5,hy-4,11,9);g.fillStyle(ih);g.fillRect(hx-5,hy-4,11,1);if(B.state!=='walk'){glow(ga,hx,hy,8,C.f2,.25);ga.fillStyle(C.f1,.6);ga.fillRect(hx-5,hy+4,11,1)}
  g.fillStyle(iron);g.fillRect(X(-16)-1,y-30,3,3);line(g,X(-16),y-28,X(-20),y-14+Math.round(Math.sin(t*3)*2),0x4a4448);
  if(Math.random()<.25)this.fx.ember(x+rnd(-12,12),y-rnd(20,44),1,.9);
  if(B.state==='wind'&&(B.next==='bellows'||B.next==='anvil'||B.next==='pour')){const k=clamp(B.t/B.wt,0,1);for(let i=0;i<14;i++){const an=i/14*6.283+t*3;px(ga,x+Math.cos(an)*(12+k*14),y-30+Math.sin(an)*(8+k*8),C.f1,.4*k)}}}
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
 castIce(x,f,owner,gy=GY,dmg,grp){const V=ICEP;for(let i=0;i<V.n;i++){const sx=Math.round(x+i*V.step*f);if(this.lv&&Math.abs(this.lv.floorAt(sx,gy-6)-gy)>4)break;this.spells.push({k:'spike',gy,x:sx,t:-i*.045,h:lerp(V.hMin,V.hMax,Math.abs(Math.sin(i*2.3+x))),lean:rnd(-.4,.4),owner,hit:false,dmg,grp})}this.cam.shake(80,.004)}
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
   if(!s.hit&&s.t>.03&&s.t<.3){if(s.owner==='p'){for(const e of this.enemies)if(!e.dead&&!(s.grp&&s.grp.has(e))&&Math.abs(e.b.x-s.x)<9&&e.b.body.bottom>s.gy-s.h&&e.b.body.bottom<s.gy+8){if(s.grp)s.grp.add(e);this.damageEnemy(e,s.dmg??2*this.spellMul,Math.sign(e.b.x-this.player.x));s.hit=true}
     if(this.boss&&this.bossState==='fight'&&Math.abs(this.boss.x-s.x)<12&&!s.bhit&&!(s.grp&&s.grp.has(this.boss))){if(s.grp)s.grp.add(this.boss);this.damageBoss(s.dmg!=null?s.dmg*.6:1.2*this.spellMul);s.bhit=true}}
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
  for(let i=this.shots.length-1;i>=0;i--){const s=this.shots[i];if(s.delay>0){s.delay-=dt;continue}s.t+=dt;if(s.g)s.vy+=s.g*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;const fire=s.c==='fire';if(s.home&&s.t>.4){const Q=this.player,a=Math.atan2(Q.y-8-s.y,Q.x-s.x);s.vx+=Math.cos(a)*70*dt;s.vy+=Math.sin(a)*70*dt;const sp=Math.hypot(s.vx,s.vy);if(sp>70){s.vx*=70/sp;s.vy*=70/sp}}
   if(Math.random()<.6){if(fire)this.fx.fire(s.x,s.y,1,1,.5);else this.fx.add({k:'shard',x:s.x,y:s.y,vx:rnd(-8,8),vy:rnd(-8,8),l:0,m:.3})}
   const P=this.player,rr=s.r||6;if(Math.hypot(P.x-s.x,P.y-7-s.y)<rr){if(this.hurtPlayer(s.dmg||12,s.x)||P.inv>0){fire?this.fx.fire(s.x,s.y,10,3,1.2):this.fx.shard(s.x,s.y,10);this.shots.splice(i,1)}continue}
   if(this.lv.kAt(s.x,s.y)===K_SOLID||s.t>(s.life||3)){if(fire){this.fx.fire(s.x,s.y,12,4,1.2);this.fx.ember(s.x,s.y,4,1.5)}else this.fx.shard(s.x,s.y,8);if(s.g)this.cam.shake(60,.004);this.shots.splice(i,1)}}}
 clearLine(x0,y0,x1,y1){for(let k=1;k<8;k++){const x=lerp(x0,x1,k/8),y=lerp(y0,y1,k/8);if(this.lv.kAt(x,y)===K_SOLID)return false}return true}
 // ---------------- enemies ----------------
 updateEnemies(dt){this._inE=1;for(const e of this.enemies){const P=NET.target(this,e);this._eRemote=!!P.remote;if(e.dead){e.deadT+=dt;continue}const b=e.b;e.t+=dt;e.flash-=dt;e.cd-=dt;const dx=P.x-b.x,adx=Math.abs(dx);
   // r7 P1 #3: a melee foe must never keep its lunge velocity: retarget on a teleporting target, leave swing/wind when out of range, and time swing out
   const gnd=e.base==='hollow'||e.base==='knight',jump=e.tgx!=null&&Math.abs(P.x-e.tgx)>200;e.tgx=P.x;
   if(gnd&&(jump||((e.state==='swing'||e.state==='wind')&&e.t>.9))){e.state='chase';e.cd=Math.max(e.cd,.8);e.combo=0;b.setVelocityX(0);this.stats.swingFix=(this.stats.swingFix||0)+1}
   if(adx>260||Math.abs(P.y-b.y)>150){if(gnd){if(e.state==='swing'||e.state==='wind'){e.state='idle';e.combo=0}b.setVelocityX(0)}continue}
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
  this.time.delayedCall(this.sigDrop?4400:1600,()=>{this.victory={t:0,sel:0,clear:!!this.def.next};this.physics.pause()})}
 // ---------------- lords (milestone C): the Pale Cantor (cathedral) and Vulcrest the Cinder King (cinderdeep), 3 phases each ----------------
 pickLord(B,adx){const r=Math.random(),p=B.phase;
  if(B.kind==='heir'){const o=p>=3?['comet','rot','rubble','bramble','pull','volley']:p>=2?['pull','wave','gust','bramble','lash']:['volley','lash','charge'];return o[Math.floor(r*o.length)%o.length]}
  if(B.kind==='prioress'){if(p>=3&&r<.3)return'rot';if(p>=2&&r<.35)return'bramble';return r<.6?'lash':'charge'}
  if(B.kind==='astronomer'){if(p>=3&&r<.3)return'comet';if(p>=2&&r<.3)return'pull';return r<.65?'lance':'charge'}
  if(B.kind==='marshal'){if(p>=3&&r<.3)return'rubble';if(p>=2&&r<.3)return'gust';if(adx<44&&r<.5)return'slam';return r<.7?'volley':'charge'}
  if(B.kind==='abbess'){if(p>=3&&r<.3)return'deluge';if(p>=2&&r<.35)return'bubbles';if(adx<44&&r<.5)return'slam';return r<.75?'wave':'charge'}
  if(B.kind==='smith'){if(p>=3&&r<.3)return'pour';if(p>=2&&r<.35)return'anvil';if(adx<44&&r<.5)return'slam';return r<.75?'bellows':'charge'}
  if(B.kind==='toller'){if(p>=3&&r<.3)return'peal';if(p>=2&&r<.3)return'requiem';if(adx<44&&r<.5)return'slam';return r<.8?'toll':'charge'}
  if(B.kind==='cantor'){if(p>=3&&r<.3)return'requiem';if(adx<44&&r<.55)return'slam';return r<.75?'hymn':'charge'}
  if(p>=3&&r<.25)return'inferno';if(p>=2&&r<.5&&adx>40)return'meteor';if(adx<44&&r<.7)return'slam';return'charge'}
 updateLord(dt){const P=this.player,B=this.boss;if(!B)return;B.t+=dt;B.flashCd-=dt;B.eyeFlash-=dt;const K=B.kind,king=K==='king',hot=king||K==='smith';
  this.updateFlames(dt);
  if(this.bossState==='fight'){const dx=P.x-B.x,adx=Math.abs(dx);B.cd-=dt;B.hov=(B.hov||0)+dt;
   if(hot){if(Math.random()<.5)this.fx.fire(B.x+rnd(-10,10),B.y-rnd(30,44),1,2,.8);if(Math.random()<.2)this.fx.ember(B.x+rnd(-8,8),B.y-rnd(10,40),1,.8)}
   else if(Math.random()<.35)this.fx.add({k:'snow',x:B.x+rnd(-10,10),y:B.y-rnd(10,44),vx:rnd(-6,6),vy:rnd(6,16),l:0,m:rnd(1,2),ph:rnd(0,6)});
   const ph=B.hp<B.hpMax*.33?3:B.hp<B.hpMax*.66?2:1;
   if(ph>B.phase&&B.state!=='roar'&&B.hp>0){B.phase=ph;B.state='roar';B.t=0;this.shots.length=0;this.say(this.def.boss.phases[ph-2],2);this.cam.shake(500,.02);this.flashA=.22;this.sfx('death',.4);
    if(hot){for(let i=0;i<6;i++)this.time.delayedCall(i*90,()=>this.explode(ARENA_L+30+i*60,GY-6,false))}else this.novas.push({dome:1,owner:'b',harmless:1,x:B.x,y:GY,R:130,grow:.6,t:0,m:1.6})}
   if(!king&&B.phase>=2&&B.state!=='perch'&&B.state!=='glide')B.loftCd=(B.loftCd??2.5)-dt;
   const spd=(king?24:30)*(1+.2*(B.phase-1)),quick=B.phase===3?.75:B.phase===2?.88:1;
   if(B.state==='stag'){if(Math.random()<.4)this.fx.star(B.x+rnd(-8,8),B.y-rnd(30,44),C.f1);if(B.t>TUNE.stagT){B.state='walk';B.cd=.6}}
   else if(B.state==='roar'){if(Math.random()<.8)hot?this.fx.fire(B.x+rnd(-14,14),B.y-rnd(0,40),2,3,1.6):this.fx.star(B.x+rnd(-16,16),B.y-rnd(0,48),0xb8a8ff);if(B.t>1.3){B.state='walk';B.cd=.5}}
   else if(B.state==='glide'){const q=ease(Math.min(1,B.t/.8));B.x=lerp(B.gx0,B.gx,q);B.y=lerp(B.gy0,B.gy,q);if(Math.random()<.6)hot?this.fx.ember(B.x+rnd(-10,10),B.y-rnd(0,40),1,1):this.fx.star(B.x+rnd(-10,10),B.y-rnd(0,40),0xb8a8ff);if(B.t>.8){B.state=B.gy<GY?'perch':'walk';B.t=0;B.cd=.8;B.fire=0}}
   else if(B.state==='perch'){B.f=Math.sign(dx)||1;B.fire=(B.fire||0)-dt;if(B.fire<0&&B.t<2.2){B.fire=.7;const a=Math.atan2(P.y-8-(B.y-24),dx);for(const o of[-.25,0,.25])this.shots.push({x:B.x,y:B.y-24,vx:Math.cos(a+o)*80,vy:Math.sin(a+o)*80,t:0,c:hot?'fire':K==='abbess'?'water':K==='marshal'?'bolt':K==='astronomer'?'star':K==='prioress'?'thorn':K==='heir'?'star':'note',dmg:12});this.sfx('shot',.25)}
    if(B.t>2.6){B.state='glide';B.t=0;B.gx0=B.x;B.gy0=B.y;B.gx=clamp(P.x+(P.x>ARENA_L+190?-40:40),ARENA_L+30,ARENA_R-30);B.gy=GY}}
   else if(B.state==='walk'){B.f=Math.sign(dx)||1;if(B.y<GY)B.y=Math.min(GY,B.y+140*dt);if(adx>30)B.x+=B.f*spd*dt;B.step=(B.step||0)+dt*6;
    if(!king&&B.phase>=2){if(B.loftCd<0&&B.cd<0&&B.y>=GY){B.state='glide';B.t=0;B.gx0=B.x;B.gy0=B.y;B.gx=ARENA_L+190;B.gy=80;B.loftCd=8;this.say(K==='heir'?'THE HEIR ASCENDS THE HOLLOW THRONE':K==='prioress'?'THE PRIORESS CLIMBS HER TRELLIS':K==='astronomer'?'THE ASTRONOMER RISES TO HER TELESCOPE':K==='marshal'?'THE CASTELLAN MOUNTS THE BROKEN WALL':K==='abbess'?'THE ABBESS RISES TO THE DROWNED CHOIR':K==='smith'?'THE SMITH CLIMBS THE CRUCIBLE GANTRY':K==='toller'?'THE TOLLER CLIMBS INTO THE BELL FRAME':'THE CANTOR ASCENDS TO THE LOFT',1.4)}}
    if(B.state==='walk'&&B.cd<0){B.next=this.pickLord(B,adx);B.state='wind';B.t=0;B.wt=({slam:.7,hymn:.75,charge:.6,requiem:.8,meteor:.8,inferno:.9,toll:.7,peal:.95,bellows:.7,anvil:.75,pour:.9,wave:.7,bubbles:.75,deluge:.9,volley:.75,gust:.7,rubble:.9,lance:.7,pull:.7,comet:.9,lash:.7,bramble:.75,rot:.9})[B.next]*quick;B.eyeFlash=.3;this.sfx('charge',.4)}}
   else if(B.state==='wind'){const c=hot?C.f1:0xb8a8ff;if(Math.random()<.7)hot?this.fx.fire(B.x+B.f*rnd(4,18),B.y-rnd(14,34),1,2,1):this.fx.star(B.x+B.f*rnd(4,16),B.y-rnd(20,40),c);
    if(B.t>B.wt)this.lordStrike(B,dx)}
   else if(B.state==='slam'){if(B.t<.1&&Math.abs(P.x-(B.x+B.f*16))<18&&P.y>GY-30)this.hurtPlayer(king?28:24,B.x,'boss');if(B.state==='slam'&&B.t>.6){B.state='walk';B.cd=rnd(.8,1.5)*quick}}
   else if(B.state==='charge'){B.x+=B.f*(king?210:180)*dt;
    if(hot){this.fx.fire(B.x-B.f*8,GY-2,2,3,1);if(Math.random()<.9)this.fx.dust(B.x-B.f*8,GY,1,-B.f)}else this.fx.add({k:'shard',x:B.x-B.f*6,y:B.y-rnd(8,36),vx:-B.f*30,vy:0,l:0,m:.4});
    if(Math.abs(P.x-B.x)<12&&Math.abs(P.y-GY)<30)this.hurtPlayer(20,B.x);
    if(B.x<ARENA_L+20||B.x>ARENA_R-20||B.t>.9){B.x=clamp(B.x,ARENA_L+20,ARENA_R-20);B.state='walk';B.cd=rnd(.6,1.2)*quick;this.cam.shake(150,.015);this.fx.dust(B.x,GY,12)}}
   else if(B.state==='cast'){if(B.t>(B.dur||1)){B.state='walk';B.cd=rnd(.7,1.3)*quick}}
   B.x=clamp(B.x,ARENA_L+16,ARENA_R-16);
   if(king&&B.phase>=2&&this.def.lavaPits){this.lavaCd=(this.lavaCd||0)-dt;for(const[a,b]of this.def.lavaPits){if(Math.random()<.25)this.fx.fire(rnd(a,b),GY-1,1,3,1);if(P.x>a&&P.x<b&&this.pb.body.blocked.down&&P.y>=GY-1&&this.lavaCd<0&&!P.dead){this.lavaCd=.7;P.inv=0;this.hurtPlayer(14,P.x<(a+b)/2?b+10:a-10);this.fx.fire(P.x,GY-2,8,4,1.2);this.sfx('lava',.4)}}}
   if(B.hp<=0){this.bossState='dying';B.t=0;this.flames=[];this.shots.length=0;this.sfx('death',.6);this.say(this.def.boss.slain,3);this.cam.shake(600,.02)}}
  if(this.bossState==='dying'){if(hot){if(Math.random()<.9)this.fx.fire(B.x+rnd(-12,12),B.y-rnd(0,40),3,3,1.5);if(Math.random()<.08)this.explode(B.x+rnd(-14,14),B.y-rnd(4,36),false)}
   else{if(Math.random()<.9)this.fx.shard(B.x+rnd(-10,10),B.y-rnd(0,40),2,120);if(Math.random()<.3)this.fx.star(B.x+rnd(-12,12),B.y-rnd(0,50),0xb8a8ff)}
   if(B.t>2.2)this.finishBoss(B)}}
 lordStrike(B,dx){let P=this.player,king=B.kind==='king',smith=B.kind==='smith',abb=B.kind==='abbess',mar=B.kind==='marshal',p=B.phase;B.t=0;const n=B.next;
  if(n==='slam'){B.state='slam';this.cam.shake(240,.02);this.fx.dust(B.x+B.f*16,GY,16);this.sfx('slam',.5);
   if(king||smith){if(smith)this.sfx('clang',.5);for(let i=1;i<=3+p;i++)this.time.delayedCall(i*110,()=>{if(this.boss)this.explode(clamp(B.x+B.f*(14+i*24),ARENA_L+8,ARENA_R-8),GY-6,true)})}
   else if(mar){for(let i=0;i<3+(p>=2?1:0);i++)this.time.delayedCall(100+i*110,()=>{if(!this.boss||this.bossState!=='fight')return;const x=clamp(B.x+B.f*(20+i*24),ARENA_L+8,ARENA_R-8);this.fx.dust(x,GY,10);this.fx.shard(x,GY-4,6,120);this.cam.shake(90,.008);const Q=this.player;if(Math.abs(Q.x-x)<11&&Q.y>GY-30)this.hurtPlayer(20,x,'boss')});this.sfx('clang',.4)}
   else if(abb){this.geysers=this.geysers||[];for(let i=0;i<3+(p>=2?1:0);i++)this.time.delayedCall(120+i*120,()=>{if(!this.boss||this.bossState!=='fight')return;const x=clamp(B.x+B.f*(22+i*26),ARENA_L+8,ARENA_R-8);this.geysers.push({x,t:0});this.splash(x,GY-2,10);const Q=this.player;if(Math.abs(Q.x-x)<10&&Q.y>GY-46)this.hurtPlayer(20,x,'boss')})}
   else{this.castIce(B.x+B.f*20,B.f,'b');if(p>=2)this.castIce(B.x-B.f*20,-B.f,'b');this.sfx('bonfire',.3)}}
  else if(n==='charge'){B.state='charge';B.f=Math.sign(dx)||1}
  else if(n==='hymn'){B.state='cast';B.dur=1.1;const ring=(N,off,sp)=>{for(let i=0;i<N;i++){const a=(i+.5)/N*(Math.PI+1.2)-.6+off;this.shots.push({x:B.x,y:B.y-30,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,t:0,c:'note',dmg:12,life:4})}};
   ring(p>=2?9:7,0,70);if(p>=2)this.time.delayedCall(380,()=>{if(this.boss&&this.bossState==='fight')ring(8,.17,85)});this.novas.push({x:B.x,y:B.y-30,t:0,m:.4,parry:1});this.sfx('parry',.35)}
  else if(n==='requiem'||n==='meteor'||n==='pour'||n==='deluge'||n==='rubble'||n==='comet'||n==='rot'){B.state='cast';B.dur=1.2;const N=king?(p>=3?7:5):7;king=king||smith;
   for(let i=0;i<N;i++){const x=clamp(P.x+rnd(-70,70)+(i===0?0:0),ARENA_L+10,ARENA_R-10),d=.55+i*.13;this.shots.push({x:i===0?P.x:x,y:this.cam.scrollY-6,vx:0,vy:40,g:king?420:520,t:0,delay:d,d0:d,c:king?'fire':n==='deluge'?'water':n==='rubble'?'stone':n==='comet'?'star':n==='rot'?'spore':'ice',r:king||n==='rubble'||n==='comet'||n==='rot'?9:6,dmg:king?18:16,life:3})}
   this.sfx('charge',.4);if(king)this.fx.ember(B.x,B.y-40,20,2.5)}
  else if(n==='toll'||n==='peal'){B.state='cast';B.dur=n==='peal'?2:1;const toll=()=>{if(!this.boss||this.bossState!=='fight')return;this.flames.push({x:B.x-10,dir:-1,t:0,ice:1},{x:B.x+10,dir:1,t:0,ice:1});this.novas.push({dome:1,owner:'b',harmless:1,x:B.x,y:GY,R:60,grow:.3,t:0,m:.7});this.cam.shake(220,.014);this.sfx('bell',.5);B.bellSw=1};
   toll();if(n==='peal'){this.time.delayedCall(650,toll);this.time.delayedCall(1300,toll)}}
  // milestone H: the Smith — molten ingots lobbed at you (anvil), a bellows-blast of ground fire both ways (twice from phase 2)
  // milestone I: the Abbess — a tide-wave along the floor both ways (twice from phase 2), slow homing drowned-breath bubbles
  // milestone J: the Castellan — ballista volleys from the walls, a gale that hurls you away (his shield-wind), rubble when the walls come down
  // milestone K: the Astronomer — star lances along the floor and the air, a gravity well that drags you in, comets when the sky falls
  // milestone L: the Prioress — vine lashes along the walk, bramble rows erupting from the soil, rotting spore pods when the garden breathes
  else if(n==='lash'){B.state='cast';B.dur=1;const N=p>=3?5:p>=2?4:3;for(let i=0;i<N;i++)this.shots.push({x:B.x+B.f*10,y:GY-6-(i%2)*16,vx:B.f*(150+i*12),vy:0,t:0,delay:.12+i*.14,d0:.3,c:'thorn',dmg:13,r:5,life:2.4});this.sfx('slash',.4)}
  else if(n==='bramble'){B.state='cast';B.dur=1.3;const N=p>=3?7:5;for(let i=0;i<N;i++){const x=clamp(P.x+(i-(N>>1))*26,ARENA_L+8,ARENA_R-8);this.shots.push({x,y:GY+4,vx:0,vy:-200,g:300,t:0,delay:.35+Math.abs(i-(N>>1))*.1,d0:.5,c:'thorn',dmg:14,r:6,life:1.1})}this.sfx('roll',.4)}
  else if(n==='lance'){B.state='cast';B.dur=1;const N=p>=3?7:p>=2?5:3;for(let i=0;i<N;i++){const a=-.5+i/(N-1||1);this.shots.push({x:B.x,y:B.y-30,vx:B.f*170*Math.cos(a),vy:120*Math.sin(a)+40,t:0,delay:.15+i*.08,d0:.3,c:'star',dmg:13,r:5,life:2.4})}this.sfx('chime',.4)}
  else if(n==='pull'){B.state='cast';B.dur=1.4;this.novas.push({dome:1,owner:'b',harmless:1,x:B.x,y:GY-20,R:70,grow:.3,t:0,m:.9});this.sfx('charge',.5)}
  else if(n==='volley'){B.state='cast';B.dur=1;const N=p>=3?6:p>=2?4:3;for(let i=0;i<N;i++){const side=i%2?1:-1,x=side<0?ARENA_L+6:ARENA_R-6,y=i%4<2?GY-8:GY-30;this.shots.push({x,y,vx:-side*160,vy:0,t:0,delay:.25+i*.22,d0:.4,c:'bolt',dmg:14,r:5,life:2.6})}this.sfx('charge',.4)}
  else if(n==='gust'){B.state='cast';B.dur=1.3;this.novas.push({dome:1,owner:'b',harmless:1,x:B.x,y:GY,R:90,grow:.4,t:0,m:.9});this.cam.shake(220,.012);this.sfx('roll',.5)}
  else if(n==='wave'){B.state='cast';B.dur=p>=2?1.4:1;const wave=()=>{if(!this.boss||this.bossState!=='fight')return;this.flames.push({x:B.x-10,dir:-1,t:0,water:1},{x:B.x+10,dir:1,t:0,water:1});this.splash(B.x,GY-2,12);this.cam.shake(180,.01);this.sfx('roll',.45)};wave();if(p>=2)this.time.delayedCall(650,wave)}
  else if(n==='bubbles'){B.state='cast';B.dur=1.1;const N=p>=3?7:5;for(let i=0;i<N;i++){const a=-Math.PI/2+(i-(N-1)/2)*.45;this.shots.push({x:B.x,y:B.y-30,vx:Math.cos(a)*45,vy:Math.sin(a)*45,t:0,c:'water',home:1,r:6,dmg:12,life:4.5})}this.sfx('chime',.35)}
  else if(n==='anvil'){B.state='cast';B.dur=1;const T=1.05;for(const k of p>=3?[.7,.85,1,1.15,1.3]:[.8,1,1.2]){const vx=(P.x-B.x)/T*k;this.shots.push({x:B.x+B.f*10,y:B.y-34,vx,vy:-160,g:300,t:0,c:'fire',r:7,dmg:16,life:3})}this.sfx('clang',.45);this.fx.spark(B.x+B.f*10,B.y-34,10,C.f1,100)}
  else if(n==='bellows'){B.state='cast';B.dur=p>=2?1.4:1;const blast=()=>{if(!this.boss||this.bossState!=='fight')return;this.flames.push({x:B.x-10,dir:-1,t:0},{x:B.x+10,dir:1,t:0});this.fx.ember(B.x,B.y-20,14,1.6);this.cam.shake(200,.012);this.sfx('lava',.4);B.puff=1};
   blast();if(p>=2)this.time.delayedCall(600,blast)}
  else if(n==='inferno'){B.state='cast';B.dur=1.6;this.flames.push({x:B.x-10,dir:-1,t:0},{x:B.x+10,dir:1,t:0});this.cam.shake(300,.015);this.sfx('death',.3)}}
 updateFlames(dt){const P=this.player;for(let i=this.flames.length-1;i>=0;i--){const f=this.flames[i];f.t+=dt;f.x+=f.dir*140*dt;if(f.water){if(Math.random()<.8)this.fx.add({k:'shard',x:f.x+rnd(-3,3),y:GY-rnd(2,12),vx:-f.dir*rnd(10,40),vy:rnd(-60,-20),l:0,m:.4})}else if(f.ice){if(Math.random()<.8)this.fx.shard(f.x+rnd(-3,3),GY-1,1,60)}else this.fx.fire(f.x+rnd(-4,4),GY-1,3,4,1.8);
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
 damageBoss(n,fromNet){if(NET.guest()&&!fromNet){const B=this.boss;if(B){B.flash=2;this.fx.spark(B.x,B.y-18,6,0xffd04a,80)}this.sfx('hit',.3);NET.send({t:'bdmg',n});return}const B=this.boss;if(!B||this.bossState!=='fight')return;if(B.state==='roar'){this.fx.spark(B.x,B.y-18,6,0xffffff,80);return}B.hp-=n;if(B.flashCd<=0){B.flash=2;B.flashCd=.15}this.fx.spark(B.x,B.y-18,12,B.kind==='king'||B.kind==='smith'?C.f1:C.ice1,130,30);this.sfx('hit',.35)}
 startCine(){this.gateL.body.enable=true;for(const e of this.enemies)if(!e.dead&&e.b.x<ARENA_L){e.dead=true;e.deadT=1;e.b.body.enable=false}this.shots.length=0;const BD=this.def.boss,hp=(BD.hp||40)*this.ngMul;this.flames=[];this.boss={kind:BD.kind,phase:1,x:ARENA_R-60,y:GY,f:-1,hp,hpMax:hp,t:0,state:'rise',cd:1.5,flash:0,flashCd:0,eyeFlash:0,step:0,eyes:0,rise:0,wt:.7};
  // intros play in full once per save (and per session for co-op guests); on later attempts (after a death) only a short beat
  const K=BD.kind,SI=this.sv.seenIntro=this.sv.seenIntro||{},seen=!!(SI[K]||(window.__seenIntro||{})[K])&&!Q.has('intro');(window.__seenIntro=window.__seenIntro||{})[K]=1;
  if(!seen){SI[K]=1;if(!NET.guest())Save.write(this.sv)}
  this.cine={t:0,kind:K,short:seen,pad:this.padSnap(),t0:performance.now()};if(!seen)this.skipBtn(1);this.cam.stopFollow();this.pb.setVelocityX(0);this.player.state='idle';this.cam.pan(ARENA_R-110,90,seen?300:900,'Sine.easeInOut');
  if(seen){this.cine.t=4.2;Object.assign(this.cine,{said:1,t2:1,h1:1,shk:1,ign:1});Object.assign(this.boss,{rise:1,eyes:1});this.bars=1}
  else if(BOSS_VIDEO[K]&&!Q.has('novideo')&&!DEMO)this.playVideo(BOSS_VIDEO[K])}
 padSnap(){try{return Array.from((navigator.getGamepads&&navigator.getGamepads())||[]).map(g=>g?g.buttons.map(b=>typeof b==='object'?b.pressed||b.value>.5:b>.5):[])}catch(e){return[]}}
 padEdge(c){const now=this.padSnap(),pv=c.pad||[];c.pad=now;return now.some((bs,i)=>bs.some((b,j)=>(j===0||j===9)&&b&&!(pv[i]&&pv[i][j])))}// A or Start only
 skipBtn(on){let b=document.getElementById('skipIntro');if(!on){if(b)b.remove();return}if(b||!(('ontouchstart' in window)||navigator.maxTouchPoints>0||Q.has('touch')))return;b=document.createElement('button');b.id='skipIntro';b.textContent='Skip';b.style.cssText='position:fixed;right:12px;bottom:12px;z-index:30;padding:6px 14px;font:bold 14px monospace;color:#ffe2a8;background:rgba(26,13,34,.8);border:2px solid #ffe2a8;border-radius:4px';b.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();this.skipCine()});document.body.appendChild(b)}
 // pre-rendered intro (Pale Cantor): a <video> over the canvas; sound first, muted file if autoplay with sound is refused
 playVideo(V){const c=this.cine,cv=this.sys.game.canvas,v=document.createElement('video'),r=cv.getBoundingClientRect();
  v.id='bossVideo';v.playsInline=true;v.setAttribute('playsinline','');v.preload='auto';v.style.cssText=`position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;background:#000;object-fit:contain;z-index:20;pointer-events:none`;
  // r10: keep the overlay on the canvas through resize, rotation and fullscreen
  const fit=()=>{const q=cv.getBoundingClientRect();Object.assign(v.style,{left:q.left+'px',top:q.top+'px',width:q.width+'px',height:q.height+'px'})};v._fit=fit;for(const ev of['resize','orientationchange','fullscreenchange','webkitfullscreenchange'])(ev.includes('fullscreen')?document:window).addEventListener(ev,fit);this.scale.on('resize',fit);
  const muted=Q.has('mute')||this.sound.mute;const go=(src,m)=>{v.muted=m;v.src=src;return v.play()};
  const done=()=>{if(c.video===v)this.endVideo()};v.onended=()=>{if(c.video===v)this.endVideo(1)};v.onerror=()=>{if(!v.muted)go(V.muted,true).catch(done);else done()};
  document.body.appendChild(v);c.video=v;c.vt=0;window.__bossVideo={src:V.mp4,state:'playing'};
  go(muted?V.muted:V.mp4,muted).catch(()=>go(V.muted,true).catch(done))}
 endVideo(full){const c=this.cine,v=c&&c.video||document.getElementById('bossVideo');if(v){try{v.pause()}catch(e){}if(v._fit){for(const ev of['resize','orientationchange'])window.removeEventListener(ev,v._fit);for(const ev of['fullscreenchange','webkitfullscreenchange'])document.removeEventListener(ev,v._fit);this.scale.off('resize',v._fit)}v.remove()}if(c&&c.video){c.video=null;c.t=.9;if(full){c.t=4.2;Object.assign(c,{said:1,t2:1,h1:1,shk:1,ign:1});if(this.boss)Object.assign(this.boss,{rise:1,eyes:1})}// r10: a video that played to its end already showed the rise
  if(window.__bossVideo)window.__bossVideo.state='done'}}
 skipCine(){const c=this.cine;if(!c||c.skipT>this.t-.15||performance.now()-(c.t0||0)<700)return;if(NET.guest()&&NET.linked()){c.skipT=this.t;NET.send({t:'skipreq'});return}/* co-op: the host owns the intro; a guest skip is a request */c.skipT=this.t;c.skipped=1;window.__introSkipped=(window.__introSkipped||0)+1;if(c.video){this.endVideo();c.t=4.2;Object.assign(c,{said:1,t2:1,h1:1,shk:1,ign:1});Object.assign(this.boss,{rise:1,eyes:1});return}if(c.t<4.2){c.t=4.2;Object.assign(c,{said:1,t2:1,h1:1,shk:1,ign:1});Object.assign(this.boss,{rise:1,eyes:1})}}
 updateCine(dt){const c=this.cine;if(!c)return;const B=this.boss;if(this.padEdge(c))this.skipCine();if(c&&NET.guest()&&this.bossState==='fight'&&this.cine){this.endVideo();c.t=Math.max(c.t,4.2)}// co-op guest: the host's fight has begun
  if(c.video){c.vt+=dt;this.bars=1;if(c.vt>25)this.endVideo();return}c.t+=dt;this.bars=c.short?Math.max(this.bars,1):Math.min(1,c.t/.5);
  const K=B.kind;
  if(K==='king'&&c.t>.3&&c.t<1.6&&Math.random()<.5)this.fx.fire(ARENA_L+rnd(20,340),GY,3,3,1.6);
  if(K==='heir'){if(!c.said){c.said=1;this.say('SIX OATHS STIR IN THE ASH',1.6);this.sfx('bell',.5)}const ec=[0xd8f2ff,0xffa060,0x9ff0e8,0xe8d8b8,0xd8d0ff,0xc8e890];for(let i=0;i<6;i++)if(c.t>.3+i*.22&&!(c['e'+i])){c['e'+i]=1;this.fx.spark(ARENA_L+30+i*60,GY-70,8,ec[i],80);this.sfx('chime',.25)}if(c.t>1.7&&!c.t2){c.t2=1;this.sfx('fanfare',.4);this.cam.shake(260,.012);this.flashA=.15}}
  if(K==='prioress'){if(!c.said){c.said=1;this.say('THE GARDEN STIRS AROUND YOU',1.6);this.sfx('roll',.5)}if(c.t>.6&&!c.h1){c.h1=1;this.sfx('slash',.5);this.cam.shake(220,.01);for(let i=0;i<7;i++)this.fx.spark(ARENA_L+30+i*50,GY-4,5,0x8ab050,70)}if(c.t>1.3&&!c.t2){c.t2=1;this.sfx('fanfare',.35);this.flashA=.1}if(c.t<1.8&&Math.random()<.5)this.fx.spark(B.x+rnd(-30,30),GY-rnd(0,50),1,0xb8e070,25)}
  if(K==='astronomer'){if(!c.said){c.said=1;this.say('THE STARS WHEEL ABOUT THE SPIRE',1.6);this.sfx('chime',.6)}if(c.t>.6&&!c.h1){c.h1=1;this.sfx('charge',.5);this.flashA=.12;for(let i=0;i<8;i++)this.fx.spark(ARENA_L+20+i*45,GY-90,4,0xd8d0ff,60)}if(c.t>1.3&&!c.t2){c.t2=1;this.sfx('fanfare',.4);this.cam.shake(200,.008)}if(c.t<1.8&&Math.random()<.4)this.fx.spark(B.x+rnd(-30,30),GY-rnd(0,60),1,0xd8d0ff,30)}
  if(K==='marshal'){if(!c.said){c.said=1;this.say('A WAR HORN SOUNDS FROM THE RUINED KEEP',1.6);this.sfx('charge',.6)}if(c.t>.6&&!c.h1){c.h1=1;this.sfx('slam',.5);this.cam.shake(300,.014);for(let i=0;i<5;i++)this.fx.shard(ARENA_L+40+i*70,GY-60,6,80)}if(c.t>1.3&&!c.t2){c.t2=1;this.sfx('clang',.7);this.flashA=.15}if(c.t<1.8&&Math.random()<.4)this.fx.dust(B.x+rnd(-30,30),GY,2)}
  if(K==='abbess'){if(!c.said){c.said=1;this.say('THE WATER REMEMBERS A HYMN',1.6);this.sfx('chime',.6)}if(c.t>.7&&!c.h1){c.h1=1;this.splash(B.x,GY-2,20)}if(c.t>1.3&&!c.t2){c.t2=1;this.sfx('chime',.8);this.flashA=.18;this.tideFlash=1}if(c.t<1.8&&Math.random()<.5)this.bubbles.push({x:B.x+rnd(-30,30),y:GY-2,t:0,top:GY-90})}
  if(K==='smith'){if(!c.said){c.said=1;this.say('AN ANVIL RINGS IN THE BURNING DARK',1.6);this.sfx('clang',.6)}if(c.t>.6&&!c.h1){c.h1=1;this.sfx('clang',.7);this.fx.spark(B.x,GY-4,16,C.f1,140)}if(c.t>1.2&&!c.t2){c.t2=1;this.sfx('clang',.8);this.flashA=.2;this.cam.shake(300,.016)}if(c.t<1.8&&Math.random()<.5)this.fx.ember(B.x+rnd(-40,40),GY-rnd(0,20),1,1.6)}
  if(K==='warden'){if(!c.said){c.said=1;this.say('FROST CREEPS OVER THE RAMPARTS',1.6);this.sfx('bell',.5)}if(c.t>.6&&!c.h1){c.h1=1;this.sfx('slam',.4);this.cam.shake(220,.008);for(let i=0;i<6;i++)this.fx.shard(ARENA_L+40+i*55,GY-2,4,90)}if(c.t>1.3&&!c.t2){c.t2=1;this.sfx('bell',.7);this.flashA=.16}if(c.t<1.8&&Math.random()<.5)this.fx.add({k:'snow',x:B.x+rnd(-60,60),y:this.cam.scrollY,vx:rnd(-10,-2),vy:rnd(25,45),l:0,m:rnd(2,4),ph:rnd(0,6)})}
  if(K==='king'){if(!c.said){c.said=1;this.say('THE DEEP BURNS AWAKE',1.6);this.sfx('thunder',.5)}if(c.t>.6&&!c.h1){c.h1=1;this.sfx('slam',.6);this.cam.shake(320,.014);for(let i=0;i<6;i++)this.fx.ember(ARENA_L+30+i*55,GY-4,6,2)}if(c.t>1.3&&!c.t2){c.t2=1;this.sfx('fanfare',.45);this.flashA=.18}}
  if(K==='cantor'){if(!c.said){c.said=1;this.say('A HYMN RISES FROM THE PALE CHOIR',1.6);this.sfx('chime',.6)}if(c.t>1.2&&!c.t2){c.t2=1;this.sfx('bell',.6);this.flashA=.15}}
  if(K==='toller'){if(!c.said){c.said=1;this.say('A BELL TOLLS IN THE FROZEN DARK',1.6);this.sfx('bell',.6)}if(c.t>1.2&&!c.t2){c.t2=1;this.sfx('bell',.7);this.flashA=.18}}
  if((K==='cantor'||K==='toller')&&c.t<1.8&&Math.random()<.4)this.fx.add({k:'snow',x:B.x+rnd(-40,40),y:this.cam.scrollY,vx:rnd(-6,6),vy:rnd(20,40),l:0,m:rnd(2,4),ph:rnd(0,6)});
  if(c.t>.9&&c.t<1.6){B.rise=ease((c.t-.9)/.7);if(Math.random()<.9){if(K==='king'||K==='smith')this.fx.fire(B.x+rnd(-16,16),GY,3,4,1.5);else if(K==='cantor')this.fx.star(B.x+rnd(-14,14),GY-rnd(10,60),0xb8a8ff);else this.fx.shard(B.x+rnd(-14,14),GY,2,80)}if(!c.shk){c.shk=1;this.cam.shake(700,.012);this.sfx(K==='cantor'?'bonfire':'charge',.5)}}
  if(c.t>1.6){B.eyes=Math.min(1,(c.t-1.6)/.3);if(!c.ign){c.ign=1;if(K==='king'||K==='smith'){this.explode(B.x,GY-20,false);this.fx.ember(B.x,GY-40,30,2.5);this.flashA=.3}else{this.fx.spark(B.x-3,B.y-29,14,K==='cantor'?0xb8a8ff:C.ice1,90);this.novas.push({dome:1,x:B.x,y:GY,R:110,grow:.45,t:0,m:1.4,harmless:1});this.flashA=.25}}}
  if(c.t>3.8){this.bars=Math.max(0,1-(c.t-3.8)/.4)}
  if(c.t>4.2&&NET.guest()&&NET.linked()&&this.bossState!=='fight')c.t=4.2;// co-op guest: hold the last beat until the host's fight starts
  if(c.t>4.2){this.cine=null;this.skipBtn(0);this.bars=0;this.bossState='fight';B.state='walk';B.rise=1;this.cam.startFollow(this.pb,true,.12,0,Math.round(this.camOff),0)}}
 // ---------------- victory card (Tester r1 P1 #6) ----------------
 victoryInput(){}// keys handled by the keydown listener in create() so quick taps are never missed
 victoryOpts(){const V=this.victory;if(V.guest)return['THE HOST CHOOSES THE PATH'];if(this.def.finale&&V.phase!=='choose')return['CLAIM THE HOLLOW THRONE','RETURN TO THE ASH SHRINE','RETURN TO TITLE'];if(this.def.side&&V.phase!=='choose')return['RETURN TO THE ASH SHRINE','RETURN TO TITLE'];if(V.phase==='choose')return['REKINDLE THE FIRST FLAME','LET THE FLAME FADE'];return V.clear?['ONWARD: '+STAGE_DEFS[this.def.next].name,'REST AT THE ASH SHRINE','RETURN TO TITLE']:['APPROACH THE FIRST FLAME','RETURN TO TITLE']}
 victoryTap(p){const V=this.victory;if(V.t<.8||V.guest)return;const y0=V.phase==='choose'?112:121,i=Math.floor((p.y-y0)/11),n=V.phase==='choose'?2:this.victoryOpts().length;if(i<0||i>=n)return;V.sel=i;this.victoryGo()}
 victoryGo(){const V=this.victory;if(V.gone||V.guest)return;// co-op guest: read-only card, follows the host's choice
  if(this.def.finale&&V.sel===0){V.gone=1;const kind='usurp';this.cam.fadeOut(900,30,24,16);if(NET.host())NET.send({t:'ending',kind});this.time.delayedCall(920,()=>this.scene.start('ending',{kind}));return}
  if(this.def.side){V.gone=1;const sel=this.def.finale?V.sel-1:V.sel;this.cam.fadeOut(500,7,5,15);this.time.delayedCall(520,()=>{if(sel===0){Save.write({...this.sv,stage:'shrine',retBonfire:false,bonfire:false,bossDown:false,stain:null,souls:this.souls,time:this.playT});this.scene.restart({fresh:false})}else this.scene.start('title')});return}
  if(!V.clear&&V.phase!=='choose'&&V.sel===0){V.phase='choose';V.sel=0;V.t=.8;this.sfx('chime',.4);return}
  if(V.phase==='choose'){V.gone=1;const kind=V.sel?'fade':'rekindle';this.cam.fadeOut(800,kind==='fade'?2:40,kind==='fade'?2:20,kind==='fade'?6:5);if(NET.host())NET.send({t:'ending',kind});this.time.delayedCall(820,()=>this.scene.start('ending',{kind}));return}
  if(V.clear&&V.sel===1){V.gone=1;this.cam.fadeOut(500,7,5,15);this.time.delayedCall(520,()=>{Save.write({...this.sv,stage:'shrine',hubNext:this.def.next,retBonfire:false,bonfire:false,bossDown:false,stain:null,souls:this.souls,time:this.playT});this.scene.restart({fresh:false})});return}
  if(V.clear&&V.sel===2)V.sel=1;
  V.gone=1;this.cam.fadeOut(500,7,5,15);
  this.time.delayedCall(520,()=>{if(V.sel===0&&V.clear){Save.write({...this.sv,stage:this.def.next,bonfire:false,bossDown:false,stain:null,souls:this.souls,time:this.playT});this.scene.restart({fresh:false})}
   else if(V.sel===0){const s=this.sv;Save.write({stage:'ramparts',bonfire:false,souls:this.souls,bossDown:false,deaths:s.deaths,time:this.playT,ng:this.ng+1,cls:s.cls,stats:s.stats,eq:s.eq,inv:s.inv,picked:s.picked,freed:[],found:[],chDone:[],broken:[],lore:s.lore,endings:s.endings,flaskBonus:s.flaskBonus});this.scene.restart({fresh:false})}else this.scene.start('title')})}
 // ---------------- render ----------------
 render(dt){const g=this.gn,ga=this.ga,cam=this.cam,P=this.player;g.clear();ga.clear();this.lights.length=0;this.bgf(cam.scrollX,cam.scrollY);if(this.gamb){this.gamb.clear();this.bgArt.amb(this.gamb,this.t,cam.scrollX)}this.mist.forEach((m,i)=>{m.tilePositionX=cam.scrollX*(.2+i*.05)+this.t*(4+i*3);m.y=Math.round(GY-34-i*36-cam.scrollY*(i?.4:1))});const t=this.t;
  for(const[x,by]of this.braziers){g.fillStyle(0x0d0a1c);g.fillRect(x-1,by-12,3,12);g.fillRect(x-4,by-14,9,2);g.fillRect(x-3,by-12,7,1);g.fillRect(x-3,by-1,7,1);
   glow(ga,x,by-17,22+Math.sin(t*11+x)*1.2,C.f3,.13);glow(ga,x,by-16,8,C.f2,.18);this.light(x,by-16,48+Math.sin(t*13+x)*2,C.f2,.5);
   for(let k=0;k<4;k++){const hy=by-24-k*7-((t*14+k*7)%7);const hx=x+Math.sin(t*5+k*1.7+x)*1.5;ga.fillStyle(0xff9040,.05);ga.fillRect(Math.round(hx)-1,Math.round(hy),3,4)}}
  {const x=this.bonfire.x,lit=this.bonfire.lit;g.fillStyle(0x2a2245);g.fillRect(x-7,GY-2,15,2);g.fillStyle(0x3a3060);g.fillRect(x-5,GY-3,11,1);line(g,x,GY-2,x+2,GY-17,0x8b86a8);line(g,x-2,GY-13,x+4,GY-12,0x8b86a8);px(g,x+2,GY-17,0xd8d0ee);
   glow(ga,x,GY-6,(lit?30:14)+Math.sin(t*9)*1.5,C.f2,lit?.17:.1);this.light(x,GY-8,(lit?74:34)+Math.sin(t*9)*2,C.f2,lit?.75:.35);
   if(Math.abs(P.x-x)<TUNE.restR&&!this.cine&&!P.dead&&!this.menu){const bob=Math.floor(t*3)%2,tx=x-14,ty=GY-32-bob;this.keyGlyph(g,tx,ty-1,'Rest')}}
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
   const c0=s.c==='fire'?C.f2:s.c==='note'?0xb8a8ff:s.c==='water'?0x2a9aa8:s.c==='bolt'?0x8a6a44:s.c==='stone'?0x6a6660:s.c==='star'?0x8a80e8:s.c==='spore'?0x8aa840:s.c==='thorn'?0x4a6a2a:C.ice3,c1=s.c==='fire'?C.f1:s.c==='note'?0xe8e0ff:s.c==='water'?0xb8f8f0:s.c==='bolt'?0xd8d8e0:s.c==='stone'?0xb8b0a0:s.c==='star'?0xf0ecff:s.c==='spore'?0xd8f0a0:s.c==='thorn'?0xa8c870:C.ice1,big=s.r>6?1:0;glow(ga,s.x,s.y,6+big*3,c0,.22);ga.fillStyle(c1);ga.fillRect(Math.round(s.x)-1-big,Math.round(s.y)-1-big,3+big*2,3+big*2);px(ga,s.x,s.y,0xffffff);
   if(s.c==='bolt'){const d=Math.sign(s.vx)||1;g.fillStyle(0x6a4a2a);g.fillRect(Math.round(s.x)-d*12,Math.round(s.y),12,1);px(g,s.x-d*12,s.y-1,0xd8d0c0);px(g,s.x-d*12,s.y+1,0xd8d0c0)}
   if(s.c==='note'){px(ga,s.x+1,s.y-2,c1);px(ga,s.x+1,s.y-3,c1);px(ga,s.x+2,s.y-3,c1)}this.light(s.x,s.y,22+big*8,c0,.5)}
  for(const a of this.arrows){const x=Math.round(a.x),y=Math.round(a.y),d=Math.sign(a.vx);if(a.ls){for(let k=0;k<14;k++)px(ga,x-d*k,y+((k*7+Math.floor(this.t*30))%3)-1,k<3?0xffffff:0xffe08a);g.fillStyle(0xfff4c0);g.fillRect(Math.min(x,x-d*12),y,12,1);glow(ga,x,y,6,0xffd870,.35);this.light(x,y,30,0xffd870,.7);continue}g.fillStyle(0x8a6a4a);g.fillRect(Math.min(x,x-d*6),y,6,1);px(g,x,y,0xd8d0ee);px(g,x-d*6,y-1,0xd8d0ee);px(g,x-d*6,y+1,0xd8d0ee);if(a.pierce){glow(ga,x,y,4,C.f1,.3);px(ga,x+d,y,0xffffff)}}
  for(const it of this.items){const y=Math.round(it.y-4+Math.sin(this.t*3+it.bob)*1.5);g.fillStyle(0x2a2245);g.fillRect(it.x-4,it.y-2,9,2);glow(ga,it.x,y,7+Math.sin(this.t*6+it.bob),0xffe2a8,.2);sparkle(ga,it.x,y,1+(Math.floor(this.t*4+it.bob)%2),0xffe2a8);this.light(it.x,y,26,C.f1,.45)}
  for(const e of this.enemies)this.drawEnemy(g,ga,e);
  if(this.boss)this.drawBoss(g,ga,this.boss);
  this.drawPlayer(g,ga);
  if(this.waters&&this.waters.length)this.drawWaters(g,ga);
  this.fx.draw(ga,g);
  for(let i=this.pops.length-1;i>=0;i--){const p=this.pops[i];p.t+=this.dt||0;if(p.t>1.6){this.pops.splice(i,1);continue}const pa=Math.min(1,(1.6-p.t)*4),pw=textW(p.s),px=Math.round(p.x-pw/2),py=Math.round(p.y-Math.min(p.t,.6)*14);g.fillStyle(0x05040b,.55*pa);g.fillRect(px-3,py-3,pw+6,TXT.big?12:9);drawText(g,p.s,px,py,p.c,1,0x07050f,pa)}
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
  const pf=P.pflash>0;if(pf)P.pflash--;NET.localStyle(this);drawHero(g,x,y,f,st,fr,t,{flash:P.flash>0||pf,combo:P.combo,outline:this.def.theme==='cinderdeep'?.22:.4});this._hero={st,fr,hv:P.heavy&&P.state==='atk'};HERO.rim(ga,x,y,f,pf?0xffe2a8:this.def.theme==='cinderdeep'?0x9fe8ff:C.f2,pf?.9:this.def.theme==='cinderdeep'?.7:.55);if(this.def.theme==='cinderdeep'&&!pf)glow(ga,x,y-8,10,0x5fb8ff,.07);if(pf)glow(ga,x,y-8,16,C.f1,.3);NET.draw(this,g,ga);
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
 drawBoss(g,ga,B){if(B.kind==='heir')return this.drawHeir(g,ga,B);if(B.kind==='prioress')return this.drawPrioress(g,ga,B);if(B.kind==='astronomer')return this.drawAstronomer(g,ga,B);if(B.kind==='marshal')return this.drawMarshal(g,ga,B);if(B.kind==='abbess')return this.drawAbbess(g,ga,B);if(B.kind==='smith')return this.drawSmith(g,ga,B);if(B.kind==='toller')return this.drawToller(g,ga,B);if(B.kind==='cantor')return this.drawCantor(g,ga,B);if(B.kind==='king')return this.drawKing(g,ga,B);return this.drawWarden(g,ga,B)}
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
 drawHUD(){const g=this.gu,ga=this.gua,P=this.player,t=this.t;g.clear();ga.clear();NET.hud(this,g);this.drawSigBanner(g);
  if(this.bars>0){const bh=Math.round(22*this.bars);g.fillStyle(0x05040b);g.fillRect(0,0,W,bh);g.fillRect(0,H-bh,W,bh)}
  if(this.flashA>0){ga.fillStyle(0xd8d0ff,this.flashA);ga.fillRect(0,0,W,H);this.flashA-=this.dt*2.2}
  if(this.flashF>0){ga.fillStyle(0xd8d0ff,.15);ga.fillRect(0,0,W,H);if(!this.paused)this.flashF--}
  const c=this.cine;
  if(c&&c.t>1.9&&c.t<3.9){const a=Math.min(1,(c.t-1.9)/.3)*Math.min(1,(3.9-c.t)/.3);const n=this.def.boss.name,sub=this.def.boss.sub;
   const nc=this.def.boss.kind==='heir'?0xe8d0a8:this.def.boss.kind==='prioress'?0xc8e890:this.def.boss.kind==='astronomer'?0xd8d0ff:this.def.boss.kind==='marshal'?0xe8d8b8:this.def.boss.kind==='abbess'?0xa8f0e8:this.def.boss.kind==='smith'?0xffc080:this.def.boss.kind==='toller'?0xd8f2ff:this.def.boss.kind==='king'?0xffd8a0:this.def.boss.kind==='cantor'?0xe8e0ff:0xd8f2ff;drawText(g,n,Math.round(W/2-textW(n,2)/2),130,nc,2,0x05040b,a);drawText(g,sub,Math.round(W/2-textW(sub)/2),145,0x8a86c0,1,null,a);g.fillStyle(this.def.boss.kind==='king'||this.def.boss.kind==='smith'?C.f2:0x9fd8ff,a);const lw=Math.round(120*Math.min(1,(c.t-1.9)/.6));g.fillRect(W/2-lw/2,141,lw,1)}
  if(!c&&!this.victory){
   const bar=(y,v,m,col,dark,w,fl)=>{g.fillStyle(0x07050f);g.fillRect(4,y-2,w+4,7);g.fillStyle(0x7a5a24);g.fillRect(5,y-1,w+2,1);g.fillRect(5,y+3,w+2,1);g.fillRect(5,y-1,1,5);g.fillRect(w+6,y-1,1,5);
    g.fillStyle(0xd8b060);g.fillRect(5,y-1,1,1);g.fillRect(w+6,y-1,1,1);g.fillRect(5,y+3,1,1);g.fillRect(w+6,y+3,1,1);
    g.fillStyle(fl?0x6a1010:dark);g.fillRect(6,y,w,2+0);g.fillRect(6,y+2,w,1);g.fillStyle(col);g.fillRect(6,y,Math.max(0,Math.round(w*v/m)),2);g.fillStyle(0xffffff,.25);g.fillRect(6,y,Math.max(0,Math.round(w*v/m)),1)};
   if(P.swim&&P.air<P.airMax-.05){const n=Math.ceil(P.air/P.airMax*8);for(let i=0;i<8;i++){const bx=82+i*6,by=7;if(i<n){g.fillStyle(0x9ff0e8);g.fillRect(bx,by,4,4);px(g,bx+1,by+1,0xffffff)}else{g.fillStyle(0x1a3a44);g.fillRect(bx+1,by+1,2,2)}}if(P.air<3&&Math.floor(this.t*6)%2)drawText(g,'AIR',82,14,0xd8402a)}
   bar(6,P.hp,P.hpMax,0xd8402a,0x3a1020,70);bar(12,P.fp,P.fpMax,0x4a8cff,0x14204a,52);bar(18,P.st,P.stMax,0x58c060,0x14341c,60,P.stFlash>0&&Math.floor(t*16)%2===0);
   // flasks (code-drawn)
   for(let i=0;i<TUNE.flaskN;i++){const fx=6+i*8,fy=25,full=i<P.flasks;g.fillStyle(0x07050f);g.fillRect(fx-1,fy-1,7,9);g.fillStyle(0x8a84a8);g.fillRect(fx+2,fy,1,2);g.fillStyle(full?C.f2:0x2a2245);g.fillRect(fx,fy+2,5,5);g.fillStyle(full?C.f0:0x3a3060);g.fillRect(fx+1,fy+3,1,2);if(full)glow(ga,fx+2,fy+4,4,C.f2,.2)}
   {const nF=this.cages.filter(c=>c.freed).length,str=nF+'/'+this.cages.length,ex=34,ey=26;g.fillStyle(0x07050f);g.fillRect(ex-2,ey-2,textW(str)+11,10);g.fillStyle(C.f2);g.fillRect(ex,ey+1,3,4);g.fillStyle(C.f1);g.fillRect(ex+1,ey,1,4);px(g,ex+1,ey-1,C.f0);glow(ga,ex+1,ey+3,4,C.f2,.25);drawText(g,str,ex+6,ey,nF===this.cages.length?0xffe2a8:0xd8d0ee);const lv='LV '+this.lvl;drawText(g,lv,ex+textW(str)+14,ey,0x8a86c0);
   if(this.bells.length){const nb=this.bells.filter(b=>b.rung).length,bs=(this.def.bellKind==='relic'?'RELICS ':this.def.bellKind==='bloom'?'BLOOMS ':this.def.bellKind==='lens'?'LENSES ':this.def.bellKind==='ballista'?'BALLISTAE ':this.def.bellKind==='sigil'?'SIGILS ':this.def.bellKind==='anvil'?'ANVILS ':'BELLS ')+nb+'/'+this.bells.length,by=ey+10;g.fillStyle(0x07050f);g.fillRect(ex-2,by-2,textW(bs)+4,10);drawText(g,bs,ex,by,nb===this.bells.length?0xffe2a8:0xb8d8ff)}
   {const bf=this.buffs||{};let bx=ex;for(const[k,c,l]of[['guard',0xd8f2ff,'RIME'],['stam',0x9fe86a,'LEAF']])if(bf[k]>0){const s=l+' '+Math.ceil(bf[k]);drawText(g,s,bx,ey+(this.bells.length?20:10),c);bx+=textW(s)+6}}}
   for(const ch of this.chs)if(ch.active){const s2=ch.type==='timer'?ch.name+' '+Math.max(0,ch.t).toFixed(1):ch.name+' - WAVE '+(ch.wave+1)+'/'+ch.waves.length;drawText(g,s2,Math.round(W/2-textW(s2)/2),this.touch?22:8,ch.type==='timer'&&ch.t<3&&Math.floor(t*8)%2?0xd8402a:0xffe2a8)}
   if(P.flaskFlash>0){P.flaskFlash-=this.dt;if(Math.floor(t*16)%2)g.fillStyle(0xd8402a).fillRect(4,34,24,1)}
   const s=String(this.souls),sw=textW(s,2);g.fillStyle(0x07050f,.72);g.fillRect(W-sw-18,3,sw+16,14);g.fillRect(W-sw-17,2,sw+14,16);g.fillStyle(0x9fd8ff);g.fillRect(W-sw-14,7,4,4);g.fillStyle(0xffffff);g.fillRect(W-sw-13,8,2,2);glow(ga,W-sw-12,9,5,C.ice3,.35);drawText(g,s,W-sw-6,5,0xd8d0ee,2);
   if(this.soulPop&&this.soulPop.t>0){const sp=this.soulPop;sp.t-=this.dt;const ps='+'+sp.n;drawText(g,ps,W-textW(ps)-6,19+Math.round((1.4-sp.t)*3),0x9fd8ff,1,0x07050f,Math.min(1,sp.t*2))}
   if(this.stain){const ds=Math.round(this.stain.x-P.x),ss='SOULS '+(ds>0?'>':'<');drawText(g,ss,W-textW(ss)-6,this.soulPop&&this.soulPop.t>0?27:20,0x5fe0c0,1,0x07050f,.6+.4*Math.sin(t*5))}
   const B=this.boss;if(B&&this.bossState==='fight'){const w=this.touch?140:180,x0=(W-w)/2,y0=H-14;{const bn=this.def.boss.name+(this.ng?' +'+this.ng:''),by=y0-(TXT.big?11:8);g.fillStyle(0x05040b,.6);g.fillRect(x0-2,by-2,textW(bn)+5,TXT.big?11:9);drawText(g,bn,x0,by,0xf0e8ff)}g.fillStyle(0x7a5a24);g.fillRect(x0-2,y0-2,w+4,7);g.fillStyle(0x07050f);g.fillRect(x0-1,y0-1,w+2,5);g.fillStyle(0x2a1020);g.fillRect(x0,y0,w,3);g.fillStyle(0xb8302a);g.fillRect(x0,y0,Math.max(0,Math.round(w*B.hp/B.hpMax)),3);if(B.kind!=='warden'){g.fillStyle(0xd8b060);for(const k of[.66,.33])g.fillRect(x0+Math.round(w*k),y0-1,1,5)}}
   if(this.touch&&!this.paused&&!this.menu&&!this.quitQ)this.drawTouch(g)}
  if(this.msg){this.msg.t-=this.paused?0:this.dt;const m=this.msg,a=clamp(m.t*2,0,1);const BS=(this.def.boss||{}).slain;const big=m.s==='EMBER EXTINGUISHED'||m.s===BS;const sc=big?2:1;
   if(big){g.fillStyle(0x05040b,.6*a);g.fillRect(0,78,W,22)}
   if(!big){const mw=textW(m.s);g.fillStyle(0x05040b,.6*a);g.fillRect(Math.round(W/2-mw/2)-5,36,mw+10,TXT.big?13:11)}
   drawText(g,m.s,Math.round(W/2-textW(m.s,sc)/2),big?83:40,big?(m.s===BS?0xffe2a8:0xd8402a):0xd8d0ee,sc,0x05040b,a);if(m.t<=0)this.msg=null}
  if(this.menu&&!this.victory)this.drawMenu(g,ga);
  if(this.loreView&&!this.victory)this.drawLore(g,ga);
  if(this.paused)this.drawPause(g);
  if(this.victory)this.drawVictory(g,ga)}
 // r4 P3: level-up / equipment panels are offset so they never cover the HUD bars
 drawMenu(g,ga){const m=this.menu.mode,o=m==='level'?[118,0]:null;if(o){g.save();g.translateCanvas(o[0],o[1])}try{this.drawMenu0(g,ga)}finally{if(o)g.restore()}}
 drawMenu0(g,ga){const M=this.menu,sv=this.sv,P=this.player;const box=(x,y,w,h)=>{g.fillStyle(0x07050f,.88);g.fillRect(x,y,w,h);g.fillStyle(0x7a5a24);g.fillRect(x,y,w,1);g.fillRect(x,y+h-1,w,1);g.fillRect(x,y,1,h);g.fillRect(x+w-1,y,1,h);g.fillStyle(0xd8b060);[[x,y],[x+w-1,y],[x,y+h-1],[x+w-1,y+h-1]].forEach(([a,b])=>g.fillRect(a,b,1,1))};
  const row=(s,x,y,on,c)=>drawText(g,(on?'> ':'  ')+s,x,y,on?0xffe2a8:(c||0xb8b4d8));const CL=CLASSES[sv.cls];
  if(M.mode==='main'){const O=this.mainOpts(),h=40+O.length*9;box(8,40,140,h);drawText(g,this.def.bonfireName,14,45,0xffb04a);drawText(g,CL.name+'  LEVEL '+this.lvl,14,54,0x8a86c0);
   O.forEach((s,i)=>row(s,14,65+i*9,M.sel===i));drawText(g,'SOULS '+this.souls,14,40+h-9,0x9fd8ff);return}
  if(M.mode==='items'){const L=this.itemList();box(6,14,308,160);drawText(g,'ITEMS AND SPELLS',12,19,0xffb04a);const top=Math.max(0,Math.min(M.sel-4,L.length-8));
   L.slice(top,top+8).forEach(([id,kind],j)=>{const i=top+j;row(itemName(id),12,30+j*9,M.sel===i);drawText(g,kind,104,30+j*9,0x6b67a0)});
   const[id,kind]=L[M.sel]||[];if(id){g.fillStyle(0x7a5a24);g.fillRect(12,104,296,1);drawText(g,itemName(id),12,109,0xffe2a8);descLines(id).forEach((s,i)=>drawText(g,s,12,120+i*9,0xd8c8b0,1));const R=MIRACLES[id]?'REQ FTH '+MIRACLES[id].fth+'  FP '+MIRACLES[id].fp+'  KEY '+MIRACLES[id].key:SPELLS[id]?'REQ INT '+SPELLS[id].int+'  FP '+SPELLS[id].fp:WEAPONS[id]?'REQ '+RPG.reqs(WEAPONS[id]):ARMORS[id]?'WEIGHT '+ARMORS[id].w+'  POISE '+ARMORS[id].poise:'';drawText(g,R,150,109,0x8a86c0)}return}
  if(M.mode==='keeper'||M.mode==='talk'||M.mode==='shop'){this.drawKeeperUI(g,ga,M,box,row);return}
  if(M.mode==='level'){const st=M.pend,L=RPG.level(sv.cls,st),d=RPG.derive(st,sv.eq),d0=this.build;box(6,20,190,150);
   drawText(g,'LEVEL UP  '+this.lvl+(L>this.lvl?' > '+L:''),12,25,0xffb04a);drawText(g,'SOULS '+(this.souls-M.spent)+'   NEXT '+RPG.cost(L),12,34,0x9fd8ff);
   STATS.forEach((k,i)=>{const up=st[k]>sv.stats[k];row(STAT_NAMES[k],12,46+i*9,M.sel===i);drawText(g,String(st[k]),104,46+i*9,up?0x58e070:0xd8d0ee);if(M.sel===i)drawText(g,'< >',118,46+i*9,0x6b67a0)});
   row('CONFIRM',12,46+8*9+3,M.sel===8,0xffe2a8);
   const D=[['HP',d0.hp,d.hp],['FP',d0.fp,d.fp],['STAMINA',d0.st,d.st],['LOAD',d0.load,d.load],['ATTACK',(d0.ar*100)|0,(d.ar*100)|0],['SPELL',(d0.spell*100)|0,(d.spell*100)|0]];
   D.forEach(([n,a,b],i)=>{drawText(g,n,140,46+i*9,0x8a86c0);drawText(g,String(b),176,46+i*9,b>a?0x58e070:0xd8d0ee)});return}
  if(M.mode==='equip'){const d=this.build;box(4,4,312,172);drawText(g,'EQUIPMENT',10,9,0xffb04a);drawText(g,'UP/DOWN SLOT  LEFT/RIGHT CHANGE',316-6-textW('UP/DOWN SLOT  LEFT/RIGHT CHANGE'),9,0x6a6490);
   // equip GUI fix: fits 320x180 in both text sizes, labels never collide with values, long lines wrap or trim
   const fit=(t,w)=>{t=String(t);while(t.length>1&&textW(t)>w)t=t.slice(0,-1);return t},wrap=(t,w,n)=>{const o=[];let l='';for(const wd of String(t).split(' ')){const c=l?l+' '+wd:wd;if(textW(c)>w&&l){o.push(l);l=wd}else l=c}if(l)o.push(l);return o.slice(0,n)};
   const W0=WEAPONS[sv.eq.main],W1=WEAPONS[sv.eq.off],A=ARMORS[sv.eq.armor||'none'];
   const L=[['R HAND',W0?W0.name:'-',W0?RPG.letters(W0)+'  REQ '+RPG.reqs(W0)+(RPG.meets(W0,sv.stats)?'':'  WEAK!'):''],['L HAND',W1?W1.name:'EMPTY',W1?(W1.mir?'TALISMAN':'CATALYST')+'  REQ '+RPG.reqs(W1):''],['ARMOR',A.name,'WEIGHT '+A.w+'  POISE '+A.poise+'  ABSORB '+Math.round(A.abs*100)+'%']];
   const vx=TXT.big?66:58;L.forEach(([a,b,c],i)=>{const y=22+i*21,on=M.sel===i;if(on){g.fillStyle(0x2a2245);g.fillRect(7,y-2,306,19)}drawText(g,(on?'> ':'  ')+a,9,y,on?0xffe2a8:0xb8b4d8);
    const n=this.eqOpts(i).length;drawText(g,fit((n>1?'< ':'')+b+(n>1?' >':''),310-vx),vx,y,on?0xffe2a8:0xd8d0ee);drawText(g,fit(c,310-vx),vx,y+8,0x8a86c0)});
   const rc=d.roll.kind==='LIGHT'?0x58e070:d.roll.kind==='MEDIUM'?0xd8d0ee:d.roll.kind==='HEAVY'?0xffb04a:0xd8402a;
   drawText(g,'LOAD '+d.w+' / '+d.load+' ('+Math.round(d.ratio*100)+'%)',10,88,0xd8d0ee);drawText(g,'ROLL '+d.roll.kind,180,88,rc);drawText(g,fit('ATTACK '+Math.round(d.ar*100)+'   SPELL '+Math.round(d.spell*100)+'   POISE '+d.poise,300),10,98,0xd8d0ee);
   drawText(g,fit('MOVESET: '+({sword:'2-HIT SLASH, OVERHEAD HEAVY',greatsword:'WIDE CLEAVE, LEAPING SLAM',dagger:'3-STAB FLURRY, LUNGE',spear:'LONG THRUST, CHARGE',axe:'CHOP, SPIN HEAVY',bow:'ARROW, CHARGED PIERCE',staff:'POKE, BASH, CASTS SPELLS'})[W0?W0.type:'dagger'],300),10,110,0x8a86c0);
   {const id=[sv.eq.main,sv.eq.off,sv.eq.armor||'none'][M.sel];wrap(descLines(id).join(' '),300,TXT.big?5:6).forEach((t,i)=>drawText(g,t,10,124+i*(TXT.big?10:8),0xa89878))}}}
 // ---------------- milestone E: hub, keeper, merchant, lore, miracles ----------------
 mainOpts(){const o=['LEVEL UP','EQUIPMENT','ITEMS AND SPELLS'];if(!this.def.hub&&this.sv.lords.length)o.push('TRAVEL TO THE SHRINE');o.push('LEAVE');return o}
 itemList(){const sv=this.sv,o=[];sv.inv.filter(i=>WEAPONS[i]).forEach(i=>o.push([i,WEAPONS[i].hand==='off'?'OFF HAND':'WEAPON']));sv.inv.filter(i=>ARMORS[i]).forEach(i=>o.push([i,'ARMOR']));
  Object.keys(SPELLS).forEach(i=>o.push([i,'SORCERY']));Object.keys(MIRACLES).filter(i=>sv.inv.includes(i)).forEach(i=>o.push([i,'MIRACLE']));o.push(['flask','x'+(TUNE.flaskN+(sv.flaskBonus||0))]);return o}
 shopList(){const sv=this.sv;return SHOP.filter(([id])=>id==='flask'?(sv.flaskBonus||0)<2:!sv.inv.includes(id))}
 keeperLines(){const sv=this.sv,B=KEEPER.bell,F=KEEPER.forge,Cr=KEEPER.crypt,Kp=KEEPER.keep,Sp=KEEPER.spire,Cl=KEEPER.cloister,Th=KEEPER.throne,six=THRONE_LORDS.every(l=>sv.lords.includes(l)),L=KEEPER.lines[this.keeperTier()];return[...L,...(sv.lords.includes('toller')?B.slain:sv.lords.includes('cantor')?B.open:B.sealed),...(sv.lords.includes('smith')?F.slain:sv.lords.includes('toller')?F.open:sv.lords.includes('cantor')?F.sealed:[]),...(sv.lords.includes('abbess')?Cr.slain:sv.lords.includes('smith')?Cr.open:sv.lords.includes('toller')?Cr.sealed:[]),...(sv.lords.includes('marshal')?Kp.slain:sv.lords.includes('abbess')?Kp.open:sv.lords.includes('smith')?Kp.sealed:[]),...(sv.lords.includes('astronomer')?Sp.slain:sv.lords.includes('marshal')?Sp.open:sv.lords.includes('abbess')?Sp.sealed:[]),...(sv.lords.includes('prioress')?Cl.slain:sv.lords.includes('astronomer')?Cl.open:sv.lords.includes('marshal')?Cl.sealed:[]),...(sv.lords.includes('heir')?Th.slain:six?Th.open:sv.lords.includes('astronomer')?Th.sealed:[])]}
 keeperTier(){const sv=this.sv;return sv.endings.length?3:Math.min(2,sv.lords.length)}
 travel(to,ret){const sv=this.sv;this.menu=null;this.cam.fadeOut(500,7,5,15);this.physics.pause();this.travelling=1;
  const side=this.def.side,extra=to==='shrine'?{hubNext:side?sv.hubNext:ret.next,retBonfire:side?!!sv.retBonfire:!!ret.bonfire,bonfire:false}:STAGE_DEFS[to].side?{bonfire:false}:{bonfire:!!sv.retBonfire,retBonfire:false};
  this.time.delayedCall(520,()=>{Save.write({...sv,...extra,stage:to,bossDown:STAGE_DEFS[to].side?sv.lords.includes(STAGE_DEFS[to].boss.kind):false,stain:null,souls:this.souls,time:this.playT});this.scene.restart({fresh:false})})}
 openShortcut(c,fromNet){if(c.open)return;if(NET.guest()&&!fromNet){NET.send({t:'sc',id:c.id});return}c.open=true;c.body.body.enable=false;if(!this.sv.shortcuts.includes(c.id))this.sv.shortcuts.push(c.id);Save.write(this.sv);
  this.say('SHORTCUT OPENED',1.6);this.sfx('clang',.6);this.cam.shake(200,.01);this.fx.spark(c.x+6,GY-14,12,0xd8b060,90);this.stats.shortcuts=(this.stats.shortcuts||0)+1}
 // context interact (pad A): the label of what Up/E/A would do here, or null. Mirrors interact() + bonfire rest; proximity only.
 interactHint(){const P=this.player,D=this.def;if(!P||P.dead||this.cine||this.menu||!this.pb.body.blocked.down)return null;const near=(x,r=14)=>x!=null&&Math.abs(P.x-x)<r;
  for(const c of this.shortcuts||[]){if(c.open||Math.abs(P.y-GY)>24)continue;if(near(c.lever,14)&&P.x>c.x)return'Pull';if(P.x<c.x&&near(c.x-6,16))return'Inspect'}
  for(const c of this.chests||[])if(c.st==='shut'&&near(c.x,14)&&Math.abs(P.y-c.y)<16)return'Open';
  if(D.stair&&near(D.stair.x,18))return'Climb';for(const k of['sanctum','arch','lift','gate','well'])if(D[k]&&near(D[k].x,14))return'Enter';if(D.descent&&near(D.descent.x,16))return'Descend';
  for(const l of this.lore||[])if(near(l.x,12)&&Math.abs(P.y-l.y)<20)return'Read';
  if(D.hub&&near(D.keeper,18))return'Talk';if(D.hub&&near(D.exit,16))return'Travel';
  if(this.bonfire&&Math.abs(P.x-this.bonfire.x)<TUNE.restR)return'Rest';return null}
 // button glyph: Xbox A (green disc) when a pad is connected, else the keyboard key [E]
 keyGlyph(g,x,y,label,col=0xffe2a8){if(this.touch&&!(typeof PAD!=='undefined'&&PAD.connected()))return drawText(g,label,x+2,y,col);const pad=typeof PAD!=='undefined'&&PAD.connected();if(pad){g.fillStyle(0x1e1a12);g.fillRect(x,y-1,9,9);g.fillStyle(0x3fb950);g.fillRect(x+1,y-1,7,9);g.fillRect(x,y,9,7);drawText(g,'A',x+2,y,0x0b2a12,1,0x3fb950);return drawText(g,label,x+12,y,col)}g.fillStyle(0x1e1a12);g.fillRect(x,y-1,9,9);g.fillStyle(0xd8d0ee);g.fillRect(x+1,y-1,7,1);g.fillRect(x+1,y+7,7,1);g.fillRect(x,y,1,7);g.fillRect(x+8,y,1,7);drawText(g,'E',x+2,y,0xffe2a8,1,0x1e1a12);return drawText(g,label,x+12,y,col)}
 interact(){const P=this.player,D=this.def,near=(x,r=14)=>Math.abs(P.x-x)<r;
  for(const c of this.shortcuts||[]){if(c.open||Math.abs(P.y-GY)>24)continue;if(near(c.lever,14)&&P.x>c.x){this.openShortcut(c);return true}if(P.x<c.x&&near(c.x-6,16)){this.say('BARRED FROM THE FAR SIDE - FIND A WAY AROUND',1.4);this.sfx('clang',.2);return true}}
  for(const c of this.chests)if(c.st==='shut'&&near(c.x,14)&&Math.abs(P.y-c.y)<16){this.openChest(c);return true}
  if(D.stair&&near(D.stair.x,18)){if(!this.sv.lords.includes('cantor')&&!Q.has('stairopen')){this.say('THE FROZEN STAIR IS SEALED BY RIME',2);this.sfx('clang',.3);return true}
   if(NET.guest()){this.pop('THE HOST LEADS THE WAY',P.x,P.y-26,0x9ff0dc);return true}this.say('CLIMBING THE FROZEN STAIR',1.5);this.sfx('bell',.4);this.travel('belltower');return true}
  if(D.sanctum&&near(D.sanctum.x,14)){if(!THRONE_LORDS.every(l=>this.sv.lords.includes(l))&&!Q.has('throneopen')){const left=THRONE_LORDS.filter(l=>!this.sv.lords.includes(l)).length;this.say('THE HOLLOW DOOR HOLDS - '+left+' OATH'+(left===1?'':'S')+' REMAIN',2);this.sfx('clang',.3);return true}
   if(NET.guest()){this.pop('THE HOST LEADS THE WAY',P.x,P.y-26,0x9ff0dc);return true}this.say('THE HOLLOW DOOR CRUMBLES TO ASH',1.5);this.sfx('bell',.5);this.travel('throne');return true}
  if(D.arch&&near(D.arch.x,14)){if(!this.sv.lords.includes('astronomer')&&!Q.has('cloisteropen')){this.say('THORNS CHOKE THE ARCH',2);this.sfx('slash',.3);return true}
   if(NET.guest()){this.pop('THE HOST LEADS THE WAY',P.x,P.y-26,0x9ff0dc);return true}this.say('THROUGH THE OVERGROWN ARCH',1.5);this.sfx('roll',.4);this.travel('cloister');return true}
  if(D.lift&&near(D.lift.x,14)){if(!this.sv.lords.includes('marshal')&&!Q.has('spireopen')){this.say('THE STAR LIFT WILL NOT RISE',2);this.sfx('clang',.3);return true}
   if(NET.guest()){this.pop('THE HOST LEADS THE WAY',P.x,P.y-26,0x9ff0dc);return true}this.say('THE STAR LIFT RISES',1.5);this.sfx('chime',.5);this.travel('spire');return true}
  if(D.gate&&near(D.gate.x,14)){if(!this.sv.lords.includes('abbess')&&!Q.has('keepopen')){this.say('THE KEEP GATE IS BARRED FROM THIS SIDE',2);this.sfx('clang',.3);return true}
   if(NET.guest()){this.pop('THE HOST LEADS THE WAY',P.x,P.y-26,0x9ff0dc);return true}this.say('THROUGH THE KEEP GATE',1.5);this.sfx('clang',.4);this.travel('keep');return true}
  if(D.well&&near(D.well.x,14)){if(!this.sv.lords.includes('smith')&&!Q.has('wellopen')){this.say('THE DROWNED WELL IS SEALED - THE FORGE STILL BURNS',2);this.sfx('clang',.3);return true}
   if(NET.guest()){this.pop('THE HOST LEADS THE WAY',P.x,P.y-26,0x9ff0dc);return true}this.say('DIVING INTO THE DROWNED WELL',1.5);this.sfx('chime',.4);this.travel('drowned');return true}
  if(D.descent&&near(D.descent.x,16)){if(!this.sv.lords.includes('toller')&&!Q.has('descentopen')){this.say('THE EMBER DESCENT IS BARRED WHILE THE BELLS RING',2);this.sfx('clang',.3);return true}
   if(NET.guest()){this.pop('THE HOST LEADS THE WAY',P.x,P.y-26,0x9ff0dc);return true}this.say('DESCENDING INTO THE CATACOMB FORGE',1.5);this.sfx('clang',.4);this.travel('catacomb');return true}
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
 drawStory(g,ga){const t=this.t,D=this.def,P=this.player;this.sigStep(Math.min(this.dt||.016,.05));this.drawSigDrop(g);
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
   if(D.sanctum){const sx=D.sanctum.x,n=THRONE_LORDS.filter(l=>this.sv.lords.includes(l)).length,open=n===6||Q.has('throneopen');// milestone M: the Hollow Door, six oath-seals that burn out one per beaten lord
    const ec=[0xd8f2ff,0xffa060,0x9ff0e8,0xe8d8b8,0xd8d0ff,0xc8e890];g.fillStyle(0x2a241e);g.fillRect(sx-12,GY-40,24,40);g.fillStyle(open?0x0a0806:0x3a3026);g.fillRect(sx-9,GY-37,18,37);
    for(let a=0;a<=8;a++){const an=Math.PI*a/8;g.fillRect(Math.round(sx-Math.cos(an)*12)-1,Math.round(GY-40-Math.sin(an)*7),3,3)}
    THRONE_LORDS.forEach((l,i)=>{const done=this.sv.lords.includes(l)||open,cx=sx-6+(i%3)*6,cy=GY-30+Math.floor(i/3)*8;px(g,cx,cy,done?ec[i]:0x4a3a2a);if(done)glow(ga,cx,cy,3,ec[i],.2)});
    if(open){glow(ga,sx,GY-18,12,0xe8d0a8,.1);if(Math.random()<.1)this.fx.ember(sx+rnd(-6,6),GY-4,1,.8)}
    if(Math.abs(P.x-sx)<22){const s=open?'^ THE HOLLOW THRONE':'THE HOLLOW DOOR - '+n+'/6 OATHS';drawText(g,s,Math.max(2,Math.min(638-textW(s),Math.round(sx-textW(s)/2))),GY-74,open?0xe8d0a8:0x8a8690)}}
   if(D.arch){const sx=D.arch.x,open=this.sv.lords.includes('astronomer')||Q.has('cloisteropen');// milestone L: the Overgrown Arch, a trellis door choked with thorns until the stars go dark
    g.fillStyle(0x3a3428);g.fillRect(sx-13,GY-36,3,36);g.fillRect(sx+10,GY-36,3,36);for(let a=0;a<=8;a++){const an=Math.PI*a/8;g.fillRect(Math.round(sx-Math.cos(an)*11)-1,Math.round(GY-36-Math.sin(an)*8),3,3)}
    g.fillStyle(open?0x0c140a:0x1a2414);g.fillRect(sx-10,GY-36,20,36);
    for(let i=0;i<(open?8:22);i++){const vx=sx-12+((i*7)%25),vy=GY-44+((i*11)%44);px(g,vx,vy,i%3?0x3a5a2a:0x6a8a40);if(!open&&i%4===0)px(g,vx+1,vy-1,0xa8a070)}
    if(open){for(let k=0;k<3;k++)px(g,sx-6+k*6,GY-30+k*5,0xe8e0e8);glow(ga,sx,GY-18,12,0xb8e070,.08)}
    if(Math.abs(P.x-sx)<22){const s=open?'^ THE BLIGHTED CLOISTER':'THE OVERGROWN ARCH - THORNED';drawText(g,s,Math.max(2,Math.min(638-textW(s),Math.round(sx-textW(s)/2))),GY-74,open?0xc8e890:0x8a8690)}}
   if(D.lift){const sx=D.lift.x,open=this.sv.lords.includes('marshal')||Q.has('spireopen');// milestone K: the Star Lift, a brass orrery cage that climbs to the spire
    g.fillStyle(0x4a4260);g.fillRect(sx-12,GY-44,2,44);g.fillRect(sx+10,GY-44,2,44);g.fillRect(sx-12,GY-46,24,2);line(g,sx,GY-46,sx,GY-120,0x3a3450);
    g.fillStyle(open?0x8a7a4a:0x4a4232);for(let y=GY-40;y<GY;y+=10)g.fillRect(sx-10,y,20,1);const a=t*(open?1.2:.1);for(let k=0;k<3;k++){const ax=sx+Math.round(Math.cos(a+k*2.1)*8),ay=GY-24+Math.round(Math.sin(a+k*2.1)*4);px(g,ax,ay,open?0xd8d0ff:0x5a5470)}
    if(open)glow(ga,sx,GY-24,14,0xb8b0ff,.12);
    if(Math.abs(P.x-sx)<22){const s=open?'^ THE ASTRAL SPIRE':'THE STAR LIFT - STILL';drawText(g,s,Math.max(2,Math.min(638-textW(s),Math.round(sx-textW(s)/2))),GY-74,open?0xd8d0ff:0x8a8690)}}
   if(D.gate){const sx=D.gate.x,open=this.sv.lords.includes('abbess')||Q.has('keepopen');// milestone J: the Keep Gate (postern) to the ruined keep
    g.fillStyle(0x3a3640);g.fillRect(sx-14,GY-38,4,38);g.fillRect(sx+10,GY-38,4,38);for(let a=0;a<=8;a++){const an=Math.PI*a/8;g.fillRect(Math.round(sx-Math.cos(an)*12)-2,Math.round(GY-38-Math.sin(an)*8),4,3)}
    g.fillStyle(open?0x14121a:0x2a2630);g.fillRect(sx-10,GY-38,20,38);
    if(!open){g.fillStyle(0x6a6670);for(let i=-8;i<=8;i+=4)g.fillRect(sx+i,GY-38,1,38);for(let y=GY-34;y<GY;y+=8)g.fillRect(sx-10,y,20,1);g.fillStyle(0x4a2a1a);g.fillRect(sx-11,GY-20,22,3)}
    else{const fl=Math.sin(t*3)*2;g.fillStyle(0x6a2a24);g.fillRect(sx-3,GY-36,7,14);for(let i=0;i<7;i++)px(g,sx-3+i,GY-22+((i+Math.floor(fl))%2),0x6a2a24);glow(ga,sx,GY-12,12,0xb8b0d8,.08)}
    if(Math.abs(P.x-sx)<22){const s=open?'^ THE RUINED RAMPART KEEP':'THE KEEP GATE - BARRED';drawText(g,s,Math.max(2,Math.min(638-textW(s),Math.round(sx-textW(s)/2))),GY-74,open?0xe8d8b8:0x8a8690)}}
   if(D.well){const sx=D.well.x,open=this.sv.lords.includes('smith')||Q.has('wellopen');// milestone I: the Drowned Well down to the crypt
    g.fillStyle(0x2a2a32);g.fillRect(sx-11,GY-10,22,10);g.fillStyle(0x4a4a56);g.fillRect(sx-11,GY-10,22,1);g.fillRect(sx-11,GY-10,1,10);g.fillRect(sx+10,GY-10,1,10);
    g.fillStyle(0x3a2e2a);g.fillRect(sx-12,GY-30,2,20);g.fillRect(sx+10,GY-30,2,20);g.fillRect(sx-12,GY-31,24,2);line(g,sx,GY-29,sx,GY-16,0x6a5a48);g.fillStyle(0x4a3a2a);g.fillRect(sx-2,GY-16,5,4);
    if(open){g.fillStyle(0x0e3a48);g.fillRect(sx-9,GY-9,18,3);for(let x=sx-9;x<sx+9;x++)px(g,x,GY-9+Math.round(Math.sin(x*.6+t*3)*.6),0x9ff0e8);glow(ga,sx,GY-8,12+Math.sin(t*2),0x4ac8d8,.18);if(Math.random()<.06)this.bubbles&&this.bubbles.push({x:sx+rnd(-6,6),y:GY-6,t:0,top:GY-10})}
    else{g.fillStyle(0x5a5a64);for(let i=-9;i<=9;i+=3)g.fillRect(sx+i,GY-10,1,4);g.fillRect(sx-10,GY-8,20,1)}
    if(Math.abs(P.x-sx)<24){const s=open?'^ THE DROWNED CRYPT':'THE DROWNED WELL - SEALED';drawText(g,s,Math.max(2,Math.round(sx-textW(s)/2)),GY-66,open?0xa8f0e8:0x7a8a8a)}}
   if(D.descent){const sx=D.descent.x,open=this.sv.lords.includes('toller')||Q.has('descentopen');// milestone H: the Ember Descent to the catacomb forge
    g.fillStyle(0x1a1012);g.fillRect(sx-14,GY-2,28,3);for(let i=0;i<7;i++){g.fillStyle(open?0x3a1a10:0x2a2226);g.fillRect(sx-12+i*4,GY-2,2,2)}
    g.fillStyle(0x3a2a2a);g.fillRect(sx-15,GY-12,3,10);g.fillRect(sx+13,GY-12,3,10);px(g,sx-14,GY-13,0x8a6a5a);px(g,sx+14,GY-13,0x8a6a5a);
    if(open){glow(ga,sx,GY-2,14+Math.sin(t*4)*2,C.f2,.22);this.light(sx,GY-4,40,C.f2,.6);if(Math.random()<.15)this.fx.ember(sx+rnd(-10,10),GY-2,1,1.1)}else{for(let i=-12;i<=12;i+=4){g.fillStyle(0x6a6068);g.fillRect(sx+i,GY-12,1,10)}}
    if(Math.abs(P.x-sx)<30){const s=open?'^ THE BURNING CATACOMB FORGE':'THE EMBER DESCENT - BARRED';drawText(g,s,Math.max(2,Math.min(W*0+640-textW(s)-2,Math.round(sx-textW(s)/2))),GY-58,open?0xffc080:0x8a7a78)}}
   const ex=D.exit;// exit arch with a pale mist portal to the next road
   g.fillStyle(0x2a2232);g.fillRect(ex-14,GY-40,5,40);g.fillRect(ex+10,GY-40,5,40);for(let a=0;a<=12;a++){const an=Math.PI*a/12;g.fillRect(Math.round(ex-Math.cos(an)*12)-2,Math.round(GY-40-Math.sin(an)*10),5,3)}
   for(let yy=GY-46;yy<GY;yy+=2){const w=Math.round(9*Math.sqrt(Math.max(0,1-Math.pow((GY-yy-20)/26,2))));ga.fillStyle(0x8a9cff,.08+.04*Math.sin(t*4+yy*.3));ga.fillRect(ex-w,yy,2*w+1,2)}
   const nx=this.sv.hubNext&&STAGE_DEFS[this.sv.hubNext]?this.sv.hubNext:'ramparts',nm=STAGE_DEFS[nx].name;if(Math.abs(P.x-ex)<40)drawText(g,'^ '+nm,Math.round(ex-textW('^ '+nm)/2),GY-58,0xb8c4ff);
   // broken statue of the first lord behind the bonfire
   g.fillStyle(0x14101a);g.fillRect(136,GY-70,22,70);g.fillRect(132,GY-78,30,8);g.fillRect(140,GY-92,14,14);g.fillStyle(0x221c2a);g.fillRect(136,GY-70,2,70)}}
 drawLore(g,ga){const V=this.loreView,L=wrapText((TXT.big?nice:String)((LORE[V.id]||[]).join(' ')),258),a=Math.min(1,V.t/.25),h=28+L.length*(TXT.big?10:9);g.fillStyle(0x05040b,.86*a);g.fillRect(24,40,272,h);g.fillStyle(0x7a5a24,a);g.fillRect(24,40,272,1);g.fillRect(24,40+h-1,272,1);
  drawText(g,'AN ENGRAVED STONE',30,45,0xffb04a,1,null,a);L.forEach((s,i)=>drawText(g,s,30,57+i*(TXT.big?10:9),0xd8c8b0,1,null,a));drawText(g,'UP / X  CLOSE',290-textW('UP / X  CLOSE'),40+h-9,0x6b67a0,1,null,a)}
 drawKeeperUI(g,ga,M,box,row){const sv=this.sv;
  if(M.mode==='keeper'){box(8,40,128,58);drawText(g,KEEPER.name,14,45,0xd8c8b0);['TALK','BUY','LEAVE'].forEach((s,i)=>row(s,14,58+i*9,M.sel===i));drawText(g,'SOULS '+this.souls,14,89,0x9fd8ff);return}
  if(M.mode==='talk'){const L=this.keeperLines(),s=L[Math.min(M.page,L.length-1)],n=Math.floor(M.t*45);box(10,114,300,58);drawText(g,KEEPER.name,16,119,0xffb04a);{let k=n;wrapText(TXT.big?nice(s):s,286).forEach((ln,i)=>{if(k>0)drawText(g,ln.slice(0,k),16,132+i*10,0xf0e8ff);k-=ln.length+1})}
   if(n>=s.length&&Math.sin(this.t*8)>0)drawText(g,'>',300,162,0xffe2a8);drawText(g,(M.page+1)+'/'+L.length,16,162,0x6b67a0);return}
  if(M.mode==='shop'){const L=this.shopList();box(6,14,308,160);drawText(g,KEEPER.name+' - WARES',12,19,0xffb04a);drawText(g,'SOULS '+this.souls,230,19,0x9fd8ff);
   L.forEach(([id,price],i)=>{const ps=String(price),px0=136-textW(ps);let nm=itemName(id);while(nm.length>3&&12+10+textW(nm)>px0-4)nm=nm.slice(0,-1);if(nm!==itemName(id))nm=nm.replace(/\s+$/,'')+'.';/* r9: names never run into the price */row(nm,12,32+i*9,M.sel===i,this.souls>=price?0xb8b4d8:0x6b4a4a);drawText(g,ps,px0,32+i*9,this.souls>=price?0x9fd8ff:0x6b4a4a)});row('LEAVE',12,32+L.length*9,M.sel===L.length);
   const it=L[M.sel];if(it){g.fillStyle(0x7a5a24);g.fillRect(140,30,1,94);descLines(it[0]).forEach((s,i)=>drawText(g,s,12,127+i*8,0xd8c8b0));const m=MIRACLES[it[0]],wp=WEAPONS[it[0]],am=ARMORS[it[0]];drawText(g,m?'MIRACLE':wp?(wp.hand==='off'?'OFF HAND':'WEAPON'):am?'ARMOR':'',146,32,0xffe2a8);const info=m?['REQ FTH '+m.fth,'FP '+m.fp,'KEY '+m.key]:wp?['REQ '+RPG.reqs(wp),RPG.letters(wp)||(wp.mir?'POWERS MIRACLES':'CASTS SORCERY'),'WEIGHT '+wp.w]:am?['WEIGHT '+am.w,'POISE '+am.poise,'ABSORB '+Math.round(am.abs*100)+'%']:['ONE MORE FLASK','AT EVERY REST'];info.forEach((s,i)=>drawText(g,s,146,44+i*9,0x8a86c0))}
   drawText(g,M.say||'',12,160,0xd8c8b0)}}
 drawTouch(g){const h=this.tHeld||{};for(const b of TBTN){const on=h[b.k];g.fillStyle(on?0xffb04a:0x8a86c0,on?.45:.18);g.fillCircle(b.x,b.y,b.r);g.lineStyle(1,on?0xffe2a8:0x8a86c0,on?.9:.45);g.strokeCircle(b.x,b.y,b.r);
  drawText(g,b.lab,Math.round(b.x-textW(b.lab)/2),b.y-2,on?0xffffff:0xd8d0ee,1,null,on?1:.7)}}
 drawPause(g){g.fillStyle(0x05040b,.82);g.fillRect(0,0,W,H);drawText(g,'PAUSED',Math.round(W/2-textW('PAUSED',2)/2),22,0xffe2a8,2);
  const L=['ARROWS / WASD  MOVE      SPACE / Z  JUMP','X / J  WEAPON (TAP LIGHT, HOLD HEAVY)','C / K  MAGIC (SELECTED SPELL)   Q  NEXT SPELL','SHIFT / L  DODGE      V / U  PARRY','F / R  FLASK          E / UP  INTERACT','TAB / I  INVENTORY    ESC / P  PAUSE','M  SOUND '+(this.sound.mute?'OFF':'ON'),'T  TEXT SIZE '+(TXT.big?'LARGE':'SMALL'),'ESC / P  RESUME','PAD: A JUMP/USE  B DODGE  X ATTACK  Y HEAVY','LB PARRY  RB MAGIC  VIEW FLASK  START PAUSE'];
  // r9: on touch there are no keys - show only the tappable rows (sound, text size) and how to resume; no key/pad hints
  if(this.touch){const T=[null,null,null,null,null,null,'SOUND '+(this.sound.mute?'OFF':'ON')+'  (TAP)','TEXT SIZE '+(TXT.big?'LARGE':'SMALL')+'  (TAP)','TAP PAUSE AGAIN TO RESUME'];T.forEach((s,i)=>s&&drawText(g,s,20,40+i*12,i===6||i===7?0x9fd8ff:0xd8d0ee));return}
  L.forEach((s,i)=>drawText(g,s,20,40+i*12,i===6||i===7?0x9fd8ff:0xd8d0ee))}
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
 usurp:{title:'THE HOLLOW THRONE',lines:['THE ASHEN ONE SAT UPON THE HOLLOW THRONE,','AND SIX LORDS KNELT IN THE ASH BEFORE THEM.','NEITHER FLAME NOR DARK. AN AGE OF ASH.'],col:0xe8d0a8},
 fade:{title:'THE AGE OF DARK',lines:['THE ASHEN ONE TURNED FROM THE FIRST FLAME','AND LET IT GUTTER INTO NOTHING.','IN THE DARK, SMALL LIGHTS BEGAN TO STIR.'],col:0x9fb8ff}};
class Ending extends Phaser.Scene{constructor(){super('ending')}
 init(d){this.kind=d&&ENDINGS[d.kind]?d.kind:'rekindle'}
 create(){Object.assign(C,BASEPAL);const sv=Save.load()||{};this.sv=sv;sv.endings=sv.endings||[];if(!sv.endings.includes(this.kind))sv.endings.push(this.kind);sv.lastEnding=this.kind;Save.write(sv);this.lines=[...ENDINGS[this.kind].lines,...((sv.lords||[]).includes('toller')?[BELL_ENDING[this.kind]]:[]),...((sv.lords||[]).includes('smith')?[FORGE_ENDING[this.kind]]:[]),...((sv.lords||[]).includes('abbess')?[CRYPT_ENDING[this.kind]]:[]),...((sv.lords||[]).includes('marshal')?[KEEP_ENDING[this.kind]]:[]),...((sv.lords||[]).includes('astronomer')?[SPIRE_ENDING[this.kind]]:[]),...((sv.lords||[]).includes('prioress')?[CLOISTER_ENDING[this.kind]]:[]),...((sv.lords||[]).includes('heir')?[THRONE_ENDING[this.kind]]:[])].filter(Boolean);
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
 // r7 P2 #6: the usurp ending's own scene: the Hollow Throne on its dais, the six lords kneeling as coloured silhouettes, the ashen one
 // climbing the steps and taking the seat while the crown of ash kindles
 drawUsurp(g,ga,t){this.usurpDrawn=(this.usurpDrawn||0)+1;const tx=200,LC=[['toller',0x9fd8ff],['smith',0xff8a4a],['abbess',0x5fe0c0],['marshal',0xc8c0b0],['astronomer',0xb8a8ff],['prioress',0x9fe86a]];
  for(let i=0;i<4;i++){g.fillStyle(i%2?0x1a1410:0x221a14);g.fillRect(tx-44+i*8,GY-4-i*4,88-i*16,4)}// dais steps
  const ty=GY-16;g.fillStyle(0x16100c);g.fillRect(tx-14,ty-50,28,50);g.fillRect(tx-18,ty-8,36,8);for(const sx of[-16,13])g.fillRect(tx+sx,ty-60,3,60);g.fillStyle(0x6a5030);g.fillRect(tx-14,ty-50,28,1);for(const sx of[-16,13])g.fillRect(tx+sx,ty-61,3,1);
  for(let i=0;i<5;i++){g.fillStyle(0x5a4228);g.fillRect(tx-10+i*5,ty-56-(i%2)*3,2,6)}// crown spikes on the back
  glow(ga,tx,ty-30,40,0xd8b890,.06+.04*Math.sin(t*2));
  LC.forEach(([k,c],i)=>{const side=i<3?-1:1,j=i%3,x=tx+side*(56+j*24),y=GY,a=clamp((t-.6-i*.35)/.8,0,1);if(a<=0)return;
   g.fillStyle(0x2a2226,a);g.fillRect(x-4,y-10,9,10);g.fillRect(x-3,y-15,7,5);g.fillRect(x-side*5,y-3,6,3);// kneeling body facing the throne
   g.fillStyle(c,a*.9);g.fillRect(x+side*4,y-15,1,13);g.fillRect(x-3,y-16,7,1);px(g,x+side*2,y-13,c,a);glow(ga,x,y-8,10,c,.12*a);
   if(k==='smith')g.fillStyle(c,a).fillRect(x-side*7,y-12,2,10);if(k==='astronomer')px(ga,x,y-20,c,a*(.5+.5*Math.sin(t*3+i)));if(k==='marshal')g.fillStyle(c,a).fillRect(x-side*6,y-22,1,20)});
  const walk=clamp(t/3.4,0,1),climb=clamp((t-3.4)/1.2,0,1),seated=t>4.6,hx=Math.round(lerp(20,tx-34,walk)+climb*34),hy=Math.round(GY-climb*16);
  drawHero(g,hx,seated?ty:hy,1,seated?'rest':walk<1?'run':'idle',Math.floor(t*10)%6,t,{});
  if(seated){const k2=clamp((t-5.2)/2,0,1);glow(ga,tx,ty-24,10+k2*10,0xd8b890,.25*k2);for(let i=0;i<3;i++){g.fillStyle(0xd8b890,k2);g.fillRect(tx-3+i*3,ty-27-(i%2)*2,1,3)}if(Math.random()<.4*k2)this.fx.ember(tx+rnd(-6,6),ty-24,1,.6)}
  if(t>6){ga.fillStyle(0xd8b890,clamp((t-6)/4,0,.25)*(this.card?.5:1));ga.fillRect(0,0,W,H)}}
 showCard(){this.card={t:0};try{this.sound.play('chime',{volume:.35})}catch(e){}}
 update(_,d){if(this.skipQ&&!this.card&&this.t>.15){this.skipQ=0;this.showCard()}const dt=Math.min(d,50)/1000;this.t+=dt;const t=this.t,g=this.gn,ga=this.ga,gt=this.gt,R=this.kind==='rekindle',E=ENDINGS[this.kind];g.clear();ga.clear();gt.clear();
  if(!this.card&&t>11)this.showCard();if(this.card)this.card.t+=dt;
  // sky: rekindle warms to amber, fade cools to starlit black
  const k=clamp((t-4)/4,0,1);const sky=R?[0x0b081d,0x3a1406,0x8a3a10]:[0x0b081d,0x05040c,0x020206];for(let y=0;y<H;y+=4){const c=y<60?sky[0]:y<120?sky[1]:sky[2];g.fillStyle(c,R?.4+.6*k:1);g.fillRect(0,y,W,4)}
  if(!R)for(const[x,y,b]of this.stars){const a=clamp(k*1.2-b*.3,0,1)*(.6+.4*Math.sin(t*2+x));if(a>0)px(ga,x,y,b>.6?0x9fb8ff:0xd8d0ee,a)}
  g.fillStyle(0x07050f);g.fillRect(0,GY,W,H-GY);g.fillStyle(0x1a1430);g.fillRect(0,GY,W,1);
  if(this.kind==='usurp')this.drawUsurp(g,ga,t);else{
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
  }
  this.fx.update(dt);this.fx.draw(ga,g);
  // narration
  (this.lines||E.lines).forEach((s,i)=>{const a=clamp((t-1.2-i*2.6)/.6,0,1)*(this.card?0:1);if(a>0)drawText(gt,s,Math.round(W/2-textW(s)/2),18+i*10,0xd8d0ee,1,0x05040b,a)});
  if(!this.card&&t>1)drawText(gt,'ENTER  SKIP',W-textW('ENTER  SKIP')-6,H-10,0x6b67a0,1,null,.7);
  if(this.card){const a=clamp(this.card.t/.6,0,1),s=this.sv;gt.fillStyle(0x05040b,.8*a);gt.fillRect(0,0,W,H);gt.fillStyle(0x7a5a24,a);gt.fillRect(50,40,220,1);gt.fillRect(50,156,220,1);
   drawText(gt,'ENDING',Math.round(W/2-textW('ENDING')/2),48,0x8a86c0,1,null,a);drawText(gt,E.title,Math.round(W/2-textW(E.title,2)/2),60,E.col,2,0x1a0d22,a);
   const fmt=v=>{v=Math.floor(v||0);return`${Math.floor(v/60)}:${String(v%60).padStart(2,'0')}`};const cls=CLASSES[s.cls]?CLASSES[s.cls].name:'ASHEN ONE';
   [[cls+'  LEVEL '+(CLASSES[s.cls]&&s.stats?RPG.level(s.cls,s.stats):'-')+(s.ng?'  NG+'+s.ng:''),84],['TIME '+fmt(s.time)+'   DEATHS '+(s.deaths||0),94],['LORE FOUND '+(s.lore||[]).length+'/'+Object.keys(LORE).length+'   ENDINGS SEEN '+s.endings.length+'/'+Object.keys(ENDINGS).length,104],[R?'THE FIRE BURNS. THE WHEEL TURNS.':'THE DARK IS NOT EMPTY.',118]].forEach(([q,y])=>drawText(gt,q,Math.round(W/2-textW(q)/2),y,0xd8d0ee,1,null,a));
   if(this.card.t>.3)['JOURNEY ON (NG+'+((s.ng||0)+1)+')','RETURN TO TITLE'].forEach((q,i)=>{const on=this.sel===i,str=(on?'> ':'  ')+q;drawText(gt,str,Math.round(W/2-textW(str)/2),138+i*11,on?0xffe2a8:0x6b67a0,1,null,a)})}}}
// ===================================================================
window.__G=new Phaser.Game({type:Phaser.AUTO,width:W,height:H,pixelArt:true,roundPixels:true,backgroundColor:'#0b081d',parent:document.body,
 scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},physics:{default:'arcade',arcade:{gravity:{y:800}}},
 fps:{target:60},audio:{noAudio:Q.has('mute')},scene:[Boot,Title,Lab,Stage,Ending]});
