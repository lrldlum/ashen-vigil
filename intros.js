// Boss intros r2: every lord gets its own in-engine entrance tied to its element, then shows its signature weapon (its drop) and its
// main attack, all as flat 2D pixel code effects (no glow) drawn on the normal layer. Replaces the pre-rendered Cantor video.
// Timeline (seconds of c.it): 0-2.4 entrance, 2.4-3.6 weapon, 3.6-4.8 attack; then the existing name card beat (c.t 1.6 -> 4.2).
// The host still owns the intro (a guest skip is a request) and it still plays in full once per save; all motion is a pure function
// of c.it so host and guest draw the same scene. Each arena also gets its own lair props/ambient (drawLair), drawn behind the fight.
const INTRO_LEN=4.8;
const INTRO_SPEC={
 warden:{ent:'ice_block_shatter',wpn:'blade_drawn_from_ice',atk:'rime_slam_spikes',lair:'frozen_ramparts',w:'frostbrand',t:'sword',c:[0xd8f2ff,0x6ab8e8],atkName:'RIME SLAM'},
 cantor:{ent:'descend_from_rose_window',wpn:'pike_lowered_like_baton',atk:'hymn_rings',lair:'choir_pews_organ',w:'requiemspear',t:'spear',c:[0xe8e0ff,0x9a88e8],atkName:'HYMN'},
 king:{ent:'rise_from_lava',wpn:'greatsword_cooled_from_lava',atk:'meteor_rain',lair:'basalt_throne_embers',w:'crownbreaker',t:'greatsword',c:[0x3a2a2a,0xff8a2a],atkName:'METEOR'},
 toller:{ent:'bell_drop_reveal',wpn:'clapper_torn_from_bell',atk:'toll_shockwave_icicles',lair:'rafter_bells_shutters',w:'clapper',t:'axe',c:[0xa8c8d8,0x5a7a8a],atkName:'TOLL'},
 smith:{ent:'forge_doors_blast',wpn:'maul_hammered_on_anvil',atk:'bellows_fire_jet',lair:'forge_anvil_chains',w:'ashmaul',t:'greatsword',c:[0x5a5048,0xffa040],atkName:'BELLOWS'},
 abbess:{ent:'rise_from_flood',wpn:'crook_swung_water_arc',atk:'rolling_wave',lair:'sunken_kelp_crypt',w:'tidecrook',t:'spear',c:[0x9ff0e8,0x2a8a98],atkName:'TIDE WAVE'},
 marshal:{ent:'burst_from_earth',wpn:'halberd_planted_hefted',atk:'rubble_slam',lair:'siege_ruins_banners',w:'halberd',t:'axe',c:[0xc8c0b0,0x7a6a50],atkName:'RUBBLE SLAM'},
 astronomer:{ent:'ride_planet_from_sky',wpn:'lance_from_three_stars',atk:'comet_strike',lair:'orrery_starfield',w:'starlance',t:'spear',c:[0xd8d0ff,0x6a5ad8],atkName:'COMET'},
 prioress:{ent:'woven_from_thorn_vines',wpn:'brand_grown_from_vine',atk:'thorn_lash',lair:'blighted_garden',w:'thornbrand',t:'sword',c:[0xc8e890,0x4a7a2a],atkName:'THORN LASH'},
 heir:{ent:'crown_descends_armor_assembles',wpn:'brand_from_void_shards',atk:'void_pull_volley',lair:'hollow_dais_void',w:'hollowbrand',t:'greatsword',c:[0xe8d0a8,0x3a2448],atkName:'VOID PULL'}};
const I_={clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),ez:k=>{k=Math.max(0,Math.min(1,k));return k*k*(3-2*k)},
 h:(i,s=1)=>{const x=Math.sin(i*127.1+s*311.7)*43758.5453;return x-Math.floor(x)},
 lerpC(a,b,k){const r=((a>>16)&255)+(((b>>16)&255)-((a>>16)&255))*k,g=((a>>8)&255)+(((b>>8)&255)-((a>>8)&255))*k,bl=(a&255)+((b&255)-(a&255))*k;return(Math.round(r)<<16)|(Math.round(g)<<8)|Math.round(bl)},
 R(g,c,x,y,w,h,a=1){g.fillStyle(c,a);g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))},
 ring(g,x,y,r,c,a=1,n){n=n||Math.max(12,Math.round(r*4));for(let i=0;i<n;i++){const an=i/n*6.283;px(g,x+Math.cos(an)*r,y+Math.sin(an)*r,c,a)}},
 ell(g,x,y,rx,ry,c,a=1,n=40,rot=0){for(let i=0;i<n;i++){const an=i/n*6.283+rot;px(g,x+Math.cos(an)*rx,y+Math.sin(an)*ry,c,a)}},
 disc(g,x,y,r,c,a=1){for(let dy=-r;dy<=r;dy++){const w=Math.round(Math.sqrt(r*r-dy*dy));I_.R(g,c,x-w,y+dy,w*2+1,1,a)}},
 tri(g,x,y,w,h,c){for(let i=0;i<h;i++){const ww=Math.max(1,Math.round(w*(i+1)/h));I_.R(g,c,x-Math.floor(ww/2),y-h+i,ww,1)}}};
// signature weapon, pointing up with its base at (x,y); clipTop 0..1 draws only the lower part (growing in)
function drawSigWeapon(g,type,x,y,c,o={}){const R=I_.R,bl=o.blade??c[0],ac=o.accent??c[1],cl=o.clip??1,horiz=o.h;
 const parts=[];// [dx,dy,w,h,col] in an up-pointing frame, dy measured upward from the base
 if(type==='sword')parts.push([-1,6,3,20,bl],[0,26,1,2,bl],[-4,5,9,2,ac],[0,0,1,5,0x4a3430],[-1,-1,3,1,ac]);
 if(type==='greatsword')parts.push([-2,8,5,26,bl],[-1,34,3,2,bl],[-6,6,13,2,ac],[0,0,1,6,0x4a3430],[-1,-2,3,2,ac],[-1,10,1,22,0xffffff]);
 if(type==='spear')parts.push([0,0,1,30,0x6a4a3a],[-1,30,3,4,bl],[-2,30,5,1,ac],[0,34,1,3,bl],[-1,28,3,1,ac]);
 if(type==='axe')parts.push([0,0,1,28,0x6a4a3a],[1,18,7,8,bl],[1,18,7,1,ac],[7,17,2,10,bl],[-3,20,3,4,ac],[0,28,1,2,ac]);
 const top=Math.max(...parts.map(p=>p[1]+p[3]));
 for(const[dx,dy,w,h,col]of parts){let y0=dy,hh=h;if(y0>top*cl)continue;hh=Math.min(hh,top*cl-y0);if(hh<=0)continue;
  if(horiz)R(g,col===0xffffff?bl:col,x+y0,y+dx,hh,w);else R(g,col===0xffffff?bl:col,x+dx,y-y0-hh,w,hh)}return top}
const INTROS={len:INTRO_LEN,spec:INTRO_SPEC,
 start(s,c){c.it=0;const B=s.boss;Object.assign(B,{rise:1,eyes:1});c.bx=B.x;window.__introLog=window.__introLog||{};const S=INTRO_SPEC[c.kind];
  window.__introLog[c.kind]={...S,started:performance.now()};window.__introPhase={kind:c.kind,phase:'entrance'}},
 phase(c){return c.it<2.4?'entrance':c.it<3.6?'weapon':c.it<INTRO_LEN?'attack':'done'},
 // per-frame sound/shake/particles keyed to beats (flags on c so each fires once)
 update(s,c,dt){const K=c.kind,t=c.it,B=s.boss,bx=c.bx,once=(k,at,f)=>{if(t>=at&&!c['b_'+k]){c['b_'+k]=1;f()}};const ph=this.phase(c);if(window.__introPhase)window.__introPhase.phase=ph;
  once('say',0,()=>s.say({warden:'THE RAMPART ICE GROANS',cantor:'THE ROSE WINDOW OPENS',king:'THE LAVA STIRS',toller:'THE GREAT BELL FALLS',smith:'THE FORGE DOORS SHAKE',abbess:'THE SEA COMES IN',marshal:'THE GROUND SPLITS',astronomer:'A STAR FALLS',prioress:'THE THORNS AWAKEN',heir:'THE EMPTY CROWN DESCENDS'}[K],1.8));
  const hit={warden:1.4,cantor:1.9,king:1.5,toller:.7,smith:.5,abbess:.8,marshal:1,astronomer:1,prioress:1.4,heir:1.8}[K];
  once('hit',hit,()=>{s.cam.shake(260,.012);s.sfx({warden:'slam',cantor:'bell',king:'thunder',toller:'bell',smith:'slam',abbess:'roll',marshal:'slam',astronomer:'charge',prioress:'slash',heir:'fanfare'}[K]||'slam',.5);
   if(K==='warden')s.fx.shard(bx,GY-24,24,120);if(K==='marshal'){s.fx.dust(bx,GY,20);s.fx.shard(bx,GY-6,14,140)}if(K==='king')s.fx.ember(bx,GY-6,14,2);if(K==='astronomer')s.fx.dust(bx,GY,18)});
  once('wpn',2.4,()=>{s.sfx('chime',.5)});once('atk',3.6,()=>{s.sfx(K==='king'||K==='smith'?'explode':'charge',.45)});
  if(K==='smith'&&ph==='weapon'){const k=Math.floor((t-2.4)/.3);if(k!==c.strk){c.strk=k;s.fx.spark(bx-14,GY-20,6,0xffc060,90);s.sfx('clang',.35)}}
  if(K==='king'&&t<2&&Math.random()<.3)s.fx.ember(bx+((Math.random()-.5)*40),GY-2,1,1.5)},
 // boss transform for the entrance; hide=true skips drawing the lord
 xf(c){const K=c.kind,t=c.it,ez=I_.ez;let dx=0,dy=0,hide=false;
  if(K==='warden')hide=t<1.4;
  if(K==='cantor')dy=-(1-ez(t/1.9))*150;
  if(K==='king')dy=(1-ez((t-.3)/1.6))*56;
  if(K==='toller')hide=t<1.45;
  if(K==='smith')dx=(1-ez((t-.6)/1.2))*46;
  if(K==='abbess')dy=(1-ez((t-.8)/.8))*56;
  if(K==='marshal'){if(t<1)dy=60;else{const k=I_.clamp((t-1)/.6,0,1);dy=-Math.sin(k*Math.PI)*34+(1-k)*0}}
  if(K==='astronomer'){const k=I_.clamp(t/1,0,1);dx=-(1-k)*-150;dy=-(1-ez(k))*170-(t<1.2?28:Math.max(0,28-(t-1.2)*120))}
  if(K==='prioress')hide=t<1.4;
  if(K==='heir')hide=t<1.8;
  return{dx,dy,hide}},
 drawBoss(s,g,ga,B){const c=s.cine,{dx,dy,hide}=this.xf(c);if(hide)return;g.save();ga.save();g.translateCanvas(Math.round(dx),Math.round(dy));ga.translateCanvas(Math.round(dx),Math.round(dy));
  s.drawBoss(g,ga,B);g.restore();ga.restore()},
 // scene layers: 'back' (before the lord) and 'front' (covers, weapon, attack)
 draw(s,g,layer){const c=s.cine,K=c.kind,t=c.it,bx=c.bx,R=I_.R,ez=I_.ez,h=I_.h,S=INTRO_SPEC[K],top=s.cam.scrollY;
  if(layer==='back'){
   if(K==='cantor'){for(let i=0;i<40;i++){const y=((h(i)*200+t*40*(0.6+h(i,2)))%190)+top-10,x=bx-70+h(i,3)*140+Math.sin(t*2+i)*4;px(g,x,y,0xf0ecff,.9);px(g,x+1,y,0xc8c0e8,.7)}
    R(g,0xb8a8ff,bx-10,top,20,Math.max(0,(GY-top)*Math.min(1,t/.4)),.12)}
   if(K==='astronomer'&&t<1.2){const k=I_.clamp(t,0,1),px0=bx+150*(1-k),py=GY-14-(1-ez(k))*170;for(let i=1;i<18;i++)px(g,px0+i*5,py-i*6,i%3?0xd8d0ff:0xffffff,1-i/18);I_.disc(g,px0,py,14,0x4a3a8a);for(let j=-12;j<=12;j+=6)I_.R(g,0x6a5ab8,px0-Math.round(Math.sqrt(196-j*j)),py+j,Math.round(Math.sqrt(196-j*j))*2,1);I_.R(g,0xd8d0ff,px0-6,py-12,5,1)}
   if(K==='astronomer'&&t>=1.2){const k=I_.clamp((t-1.2)/1,0,1);I_.disc(g,bx+k*60,GY-14-k*80,Math.max(3,Math.round(14-k*9)),0x4a3a8a,1-k*.4)}
   if(K==='heir'){// the crown, then armour pieces converge from six bearings
    const cy=GY-60+ (1-ez(t/1))*-90,cx=bx;R(g,0xd8b060,cx-6,cy,13,4);for(let i=0;i<4;i++)R(g,0xd8b060,cx-6+i*4,cy-3,1,3);px(g,cx,cy+1,0x8a2030);
    if(t>.8&&t<1.9){const k=ez((t-.8)/1);for(let i=0;i<6;i++){const an=i/6*6.283,r=(1-k)*110;R(g,0x2a2238,cx+Math.cos(an)*r-4,GY-30+Math.sin(an)*r*.6-4,8,8);R(g,0x5a4a6a,cx+Math.cos(an)*r-4,GY-30+Math.sin(an)*r*.6-4,8,1)}}}
   return}
  // ---- front: entrance covers ----
  if(K==='warden'&&t<1.6){if(t<1.4){R(g,0x9fd8f0,bx-16,GY-48,32,48);R(g,0xd8f2ff,bx-16,GY-48,32,2);R(g,0xd8f2ff,bx-16,GY-48,2,48);R(g,0x6ab8e8,bx+12,GY-46,4,46);
     const k=I_.clamp((t-.5)/.9,0,1);for(let j=0;j<4;j++){let x=bx-8+j*5,y=GY-46;for(let i=0;i<Math.round(16*k);i++){x+=((i+j)%3)-1;y+=3;px(g,x,y,0xffffff)}}}
   else for(let i=0;i<20;i++){const k=(t-1.4)/.2;R(g,0xd8f2ff,bx+(h(i)-.5)*80*k,GY-48+h(i,2)*48+k*20,2,2)}}
  if(K==='king'&&t<2.2){R(g,0x8a1a08,bx-26,GY,52,40);R(g,0xff6a20,bx-26,GY,52,2);for(let i=0;i<8;i++){const x=bx-24+i*6,b=Math.round(Math.abs(Math.sin(t*6+i))*3);R(g,0xffa040,x,GY-b,3,b+1)}
   for(let i=0;i<6;i++){const y=GY-40+((t*50+i*13)%40);px(g,bx-12+i*5,y,0xff8a2a)}}
  if(K==='toller'){const by=t<.7?top-60+(GY-50-top+60)*ez(t/.7):t<1.45?GY-50:GY-50-ez((t-1.45)/.6)*(GY-50-top+10);if(t<2.1){const w=40;R(g,0x4a6a7a,bx-w/2,by,w,50);R(g,0x8aaabb,bx-w/2,by,w,2);R(g,0x2a3a48,bx-w/2-3,by+46,w+6,4);R(g,0x6a8a9a,bx-6,by-6,12,6);line(g,bx,by-6,bx,top,0x8a7a5a)}}
  if(K==='smith'){const dk=ez((t-.4)/.3),fx=bx+8;// furnace mouth and doors swinging open
   if(t<2.4){R(g,0x2a1a14,fx-24,GY-60,48,60,1-I_.clamp((t-1.8)/.6,0,1));if(t<1.8)R(g,0xffa040,fx-14,GY-46,28,46,.0+(t>.4?.6:0));R(g,0x4a3a30,fx-14-dk*12,GY-46,14-dk*10,46);R(g,0x4a3a30,fx+dk*10,GY-46,14-dk*10,46)}
   if(t>.4&&t<1.2)for(let i=0;i<10;i++)R(g,0xd8c8b0,fx-30-((t-.4)*200+i*13)%90,GY-40+i*3,4,1,.8);
   R(g,0x3a3434,bx-24,GY-10,18,4);R(g,0x3a3434,bx-20,GY-6,10,6)}
  if(K==='abbess'&&t<2.6){const lv=t<.8?ez(t/.8)*52:t<1.6?52:52*(1-ez((t-1.6)/.8));const L=ARENA_L,Wd=ARENA_R-ARENA_L;R(g,0x1a5a6a,L,GY-lv,Wd,lv+20,.9);
   for(let x=L;x<ARENA_R;x+=2)px(g,x,GY-lv+Math.round(Math.sin(x*.15+t*6)*1.5),0x9ff0e8);if(t<.9){const cx=L+(t/.9)*Wd;for(let i=0;i<10;i++)R(g,0xd8fff8,cx-i*3,GY-lv-8+Math.abs(i-5),3,2)}}
  if(K==='marshal'){if(t<1.05){const k=I_.clamp(t/.9,0,1);for(const d of[-1,1]){let x=bx,y=GY;for(let i=0;i<Math.round(30*k);i++){x+=d*3;y=GY+((i%2)?1:0);R(g,0x2a1a10,x,y-1,3,2)}}R(g,0x5a4430,bx-16,GY-2,32,2)}}
  if(K==='prioress'&&t<1.6){const k=I_.clamp(t/1,0,1);for(let v=0;v<7;v++){const x0=bx-18+v*6,hh=Math.round(k*(40+h(v)*12));for(let i=0;i<hh;i+=1){const x=x0+Math.round(Math.sin(i*.25+v)*3*(1-I_.clamp((t-1)/.4,0,1))),y=GY-i;px(g,x,y,0x3a6a24);if(i%5===0)px(g,x+1,y,0x8ab050)}}
   if(t>1)for(let i=0;i<12;i++){const r=Math.round((t-1)*6);I_.R(g,0xc83048,bx-14+h(i)*28-r/2,GY-48+h(i,2)*44-r/2,Math.max(1,r),Math.max(1,r))}}
  // ---- weapon showcase ----
  if(t>=2.4&&t<3.8){const w=I_.clamp((t-2.4)/1.2,0,1),wx=bx-30,c2=S.c;let base=GY-24,o={};
   if(K==='warden'){base=GY-(ez(w/.5))*28;for(let i=0;i<Math.round(w*20);i++)px(g,wx+1,base-6-i,0xffffff)}
   if(K==='cantor'){o.h=1;base=GY-60+ez(w)*20}
   if(K==='king'){base=GY+30-ez(w/.6)*56;o.blade=I_.lerpC(0xffa040,0x2a1a1a,I_.clamp((w-.3)/.6,0,1));if(w<.6){R(g,0x8a1a08,wx-10,GY,20,30);R(g,0xff6a20,wx-10,GY,20,1)}}
   if(K==='toller'){base=Math.min(GY-24,GY-70+ez(w/.4)*46);R(g,0x4a6a7a,wx-16,GY-100,32,30,1-w)}
   if(K==='smith'){base=GY-12;o.blade=Math.floor(t*8)%2?0xffa040:0xff6020;R(g,0x3a3434,wx-10,GY-12,22,5);R(g,0x3a3434,wx-5,GY-7,12,7);o.h=1}
   if(K==='abbess'){o.h=Math.floor(w*3)%2===0;base=GY-40;for(let i=0;i<14;i++){const an=Math.PI+i/13*Math.PI*w;px(g,wx+Math.cos(an)*26,base+Math.sin(an)*20,0x9ff0e8)}}
   if(K==='marshal'){base=w<.5?GY+6:GY+6-ez((w-.5)/.4)*34;if(w<.55)s.fx&&0}
   if(K==='astronomer'){if(w<.4){for(let i=0;i<3;i++){const k=w/.4;px(g,wx-30+i*30+(1-k)*0+k*(30-i*30),GY-110+k*80+i*0,0xffffff);R(g,0xd8d0ff,wx-31+i*30+k*(30-i*30),GY-111+k*80,3,3,.6)}base=GY-999}else base=GY-28}
   if(K==='prioress'){o.clip=ez(w/.7);base=GY-8;for(let i=0;i<Math.round((1-o.clip)*30);i++)px(g,wx+Math.round(Math.sin(i*.4)*2),GY-i,0x3a6a24)}
   if(K==='heir'){o.clip=1;if(w<.5){const k=ez(w/.5);for(let i=0;i<14;i++){const an=h(i)*6.283,r=(1-k)*90;R(g,0x3a2448,wx+Math.cos(an)*r-1,GY-40+Math.sin(an)*r-1,3,3);px(g,wx+Math.cos(an)*r,GY-40+Math.sin(an)*r,0x8a6aa8)}base=GY-999}else base=GY-14}
   if(base>-500&&base<GY+60){const tp=drawSigWeapon(g,S.t,wx,base,c2,o);}
   const nm=(typeof WEAPONS!=='undefined'&&WEAPONS[S.w]&&WEAPONS[S.w].name)||S.w.toUpperCase();const ty=s.cam.scrollY+54;drawText(g,nm,Math.round(s.cam.scrollX+W/2-textW(nm)/2),ty,c2[0]===0x3a2a2a?0xffa040:c2[0],1,0x07050f,Math.min(1,w*4))}
  // ---- main attack ----
  if(t>=3.6&&t<INTRO_LEN){const a=I_.clamp((t-3.6)/1.2,0,1),L=ARENA_L+10,dirL=-1;
   if(K==='warden'){for(let i=0;i<9;i++){const x=bx-24-i*24,k=I_.clamp(a*10-i,0,1);if(k>0)I_.tri(g,x,GY,7,Math.round(16*k),i%2?0xd8f2ff:0x9fd8f0)}}
   if(K==='cantor'){for(let r=0;r<4;r++){const rr=(a*120-r*26);if(rr>0)I_.ring(g,bx,GY-26,rr,0xb8a8ff,Math.max(0,1-rr/130))}for(let i=0;i<5;i++){const x=bx-20-a*140-i*16,y=GY-40-Math.sin(a*8+i)*10;R(g,0xe8e0ff,x,y,2,2);R(g,0xe8e0ff,x+2,y-5,1,5)}}
   if(K==='king'){for(let i=0;i<3;i++){const k=I_.clamp(a*1.6-i*.3,0,1),x=bx-60-i*80,y=top-10+(GY-top)*k;if(k<1){I_.disc(g,x+ (1-k)*30,y,4,0xff8a2a);R(g,0xffd060,x+(1-k)*30-1,y-1,2,2)}else for(let j=0;j<6;j++)R(g,j%2?0xff6a20:0xffd060,x-8+j*3,GY-((j*3)%9)-2,2,(j*3)%9+2)}}
   if(K==='toller'){const r=a*220;for(const d of[-1,1])for(let k=0;k<3;k++)R(g,0xd8f2ff,bx+d*(r-k*10),GY-6-k*4,2,6+k*4,1-a);for(let i=0;i<6;i++){const y=top+((a*1.4-i*.1)*(GY-top));if(y<GY&&y>top)I_.tri(g,bx-40-i*36,y+8,3,8,0xd8f2ff)}}
   if(K==='smith'){const len=a*170;for(let x=0;x<len;x+=3){const sp=x/170*12,c=x<len*.3?0xffe080:x<len*.7?0xffa040:0xd8401a;R(g,c,bx-20-x,GY-28-sp/2+Math.sin(x*.3+t*30)*sp/3,3,Math.max(2,sp))}}
   if(K==='abbess'){const x=bx-20-a*260;R(g,0x1a6a7a,x-30,GY-20,30,20);for(let i=0;i<30;i++)px(g,x-30+i,GY-20-Math.round(Math.sin(i/30*Math.PI)*6),0xd8fff8);R(g,0x9ff0e8,x-30,GY-21,30,1)}
   if(K==='marshal'){for(let i=0;i<8;i++){const k=a*9-i;if(k>0&&k<1.5){const x=bx-24-i*28,y=GY-Math.sin(Math.min(1,k)*Math.PI)*22;R(g,0x6a6660,x-3,y-6,7,6);R(g,0x9a9688,x-3,y-6,7,1)}}}
   if(K==='astronomer'){const k=I_.clamp(a/.6,0,1),x0=bx+40,y0=top,x1=bx-140,y1=GY;const x=x0+(x1-x0)*k,y=y0+(y1-y0)*k;for(let i=0;i<20;i++)px(g,x-(x1-x0)*i/80,y-(y1-y0)*i/80,i<4?0xffffff:0xb8a8ff,1-i/20);
    if(k>=1){I_.ell(g,x1,GY,10+a*20,3,0xd8d0ff,1-a);R(g,0x2a2248,x1-8,GY-1,16,2)}}
   if(K==='prioress'){const len=a*180;for(let i=0;i<len;i+=1){const x=bx-16-i,y=GY-30+Math.sin(i*.08-t*14)*12*(i/180);px(g,x,y,0x3a6a24);px(g,x,y+1,0x2a4a1a);if(i%9===0){px(g,x,y-1,0xc8e890);px(g,x,y+2,0xc8e890)}}}
   if(K==='heir'){if(a<.55){const k=a/.55;for(let i=0;i<24;i++){const an=h(i)*6.283+k*4,r=(1-k)*120*(.5+h(i,4)*.5);R(g,0x3a2448,bx+Math.cos(an)*r,GY-30+Math.sin(an)*r*.6,2,2)}}else{const k=(a-.55)/.45;for(let i=0;i<5;i++){const x=bx-20-k*200-i*10,y=GY-50+i*8;R(g,0x2a1838,x-5,y-1,8,3);px(g,x-5,y,0xe8d0a8)}}}
   const nm=S.atkName,ty=s.cam.scrollY+54;drawText(g,nm,Math.round(s.cam.scrollX+W/2-textW(nm)/2),ty,0xd8d0ee,1,0x07050f,Math.min(1,a*4))}},
 // ---------- lairs: one prop set + ambient motion per arena (flat, no glow), drawn behind the fight ----------
 lair(s,g,cX,cY){const D=s.def,th=D.theme,t=s.t,L=ARENA_L,Rr=ARENA_R,R=I_.R,h=I_.h,mid=(L+Rr)/2,top=-60;if(cX<=L-W||!D.boss)return;
  const lit=s.cine&&s.cine.it!=null?s.cine.it:9;window.__lair=th;
  if(th==='ramparts'){for(let x=L;x<Rr;x+=24){R(g,0x2a3448,x,top+40,14,10);R(g,0xe8f4ff,x,top+40,14,2)}
   for(let i=0;i<14;i++){const x=L+10+i*25,hh=4+Math.round(h(i)*8);for(let k=0;k<hh;k++)R(g,0xb8e0f8,x+Math.floor(k/3)*0,top+50+k,Math.max(1,3-Math.floor(k/3)),1)}
   const gx=Rr-14;for(let y=GY-70;y<GY;y+=6)R(g,0x3a4a5a,gx-10,y,22,1);for(let x=gx-10;x<=gx+12;x+=5)R(g,0x4a5a6a,x,GY-70,1,70);R(g,0xd8f2ff,gx-10,GY-70,22,2);
   for(let i=0;i<30;i++){const x=L+((h(i)*360+t*(6+h(i,2)*8))%360),y=top+((h(i,3)*220+t*(14+h(i,5)*10))%220);px(g,x,y,0xf0f8ff,.8)}}
  if(th==='cathedral'){for(let i=0;i<6;i++){const x=L+30+i*44,on=lit>.2+i*.25;R(g,0x2a2238,x,GY-10,30,3);R(g,0x2a2238,x+2,GY-7,2,7);R(g,0x2a2238,x+26,GY-7,2,7);R(g,on?0xd8d0ff:0x4a4060,x,GY-11,30,1)}
   for(let i=0;i<9;i++){const x=L+8+i*6,hh=40+Math.round(Math.abs(Math.sin(i*.9))*30),p=.5+.5*Math.sin(t*3+i);R(g,0x3a3458,x,GY-hh,4,hh);R(g,p>.7?0xb8a8ff:0x6a5a90,x+1,GY-hh,2,2)}
   for(const cx of[mid-60,mid+60]){const an=Math.sin(t*1.6+cx)*.5,ex=cx+Math.sin(an)*26,ey=top+60+Math.cos(an)*26;line(g,cx,top+60,ex,ey,0x6a6080);R(g,0x8a7a5a,ex-2,ey,5,4);px(g,ex,ey-2,0xd8d0ee,.6+.4*Math.sin(t*5))}}
  if(th==='cinderdeep'){const tx=Rr-40;R(g,0x1a1416,tx-16,GY-56,32,56);R(g,0x2a2024,tx-20,GY-20,40,20);for(let i=0;i<5;i++)R(g,0x1a1416,tx-14+i*7,GY-64,4,8);for(let i=0;i<4;i++)R(g,0xd8401a,tx-12+((i*9)%24),GY-50+i*11,1,6)
   for(let i=0;i<26;i++){const x=L+h(i)*360+Math.sin(t*2+i)*3,y=GY-((h(i,2)*200+t*(20+h(i,3)*20))%200);px(g,x,y,i%3?0xff8a2a:0xffd060)}
   for(let k=0;k<4;k++){const y=GY-30-k*18;for(let x=L;x<Rr;x+=18)R(g,0x8a3a1a,x+Math.round(Math.sin(t*4+k+x*.05)*3),y,8,1,.5)}}
  if(th==='belltower'){R(g,0x2a2a38,L,top+20,Rr-L,4);for(let x=L+20;x<Rr;x+=60)R(g,0x2a2a38,x,top+20,3,40);
   for(const[bx,ph] of[[L+70,0],[L+170,1.3],[L+270,2.1]]){const an=Math.sin(t*1.1+ph)*.35,ex=bx+Math.sin(an)*20,ey=top+24+Math.cos(an)*20;line(g,bx,top+24,ex,ey,0x6a6a7a);R(g,0x3a5060,ex-7,ey,14,12);R(g,0x6a8a9a,ex-7,ey,14,1);R(g,0x2a3a48,ex-8,ey+11,16,2)}
   for(const sx of[L+120,L+230]){R(g,0x1a1a26,sx,GY-90,10,30);for(let i=0;i<8;i++){const y=GY-90+((t*30+i*11)%60);px(g,sx+4+Math.round(Math.sin(y*.2)*3)+(y-GY+90)*.3,y,0xf0f8ff)}}
   for(let x=L;x<Rr;x+=4)px(g,x,GY-1,0xd8f2ff,.6)}
  if(th==='catacomb'){const fx=Rr-52;R(g,0x2a1a14,fx-26,GY-64,52,64);R(g,0x3a2a20,fx-30,GY-68,60,6);R(g,0x1a0e0a,fx-14,GY-46,28,40);R(g,Math.floor(t*6)%2?0xd8601a:0xffa040,fx-12,GY-14,24,8)
   for(let i=0;i<5;i++){const cx=L+40+i*50;for(let y=top+10;y<top+50+i*6;y+=3)R(g,0x5a5048,cx+Math.round(Math.sin(t+i)*(y-top)/40),y,2,2)}
   R(g,0x3a302a,L+20,GY-40,40,2);for(let i=0;i<4;i++)R(g,0x6a6058,L+24+i*10,GY-38,2,14+i*2);for(let i=0;i<3;i++){R(g,0x1a1416,L+90+i*16,GY-5,12,5);px(g,L+94+i*16,GY-5,0xd8401a,.5+.5*Math.sin(t*4+i))}}
  if(th==='drowned'){for(const[x,hh] of[[L+40,80],[L+150,60],[L+300,90]]){R(g,0x1a3a44,x,GY-hh,14,hh);R(g,0x2a5a64,x,GY-hh,14,2);R(g,0x0e2a30,x+11,GY-hh,3,hh)}
   for(let k=0;k<9;k++){const x0=L+20+k*38;for(let i=0;i<34;i++)px(g,x0+Math.round(Math.sin(i*.2+t*1.5+k)*3*(i/34)),GY-i,i%4?0x2a6a3a:0x4a8a4a)}
   for(let i=0;i<16;i++){const x=L+h(i)*360+Math.sin(t*2+i)*2,y=GY-((h(i,2)*160+t*24)%160);I_.ring(g,x,y,1.5,0x9ff0e8,.8,6)}
   R(g,0x2a4a50,mid-14,GY-14,28,14);R(g,0x4a7a80,mid-14,GY-14,28,1);R(g,0x0e2a30,mid-16,GY-2,32,2)}
  if(th==='keep'){const tx=L+60;R(g,0x3a2a1a,tx-20,GY-6,40,6);line(g,tx-14,GY-6,tx,GY-50,0x4a3a24);line(g,tx+14,GY-6,tx,GY-50,0x4a3a24);const an=-.6+Math.sin(t*.4)*.05;line(g,tx,GY-50,tx+Math.cos(an)*44,GY-50+Math.sin(an)*44,0x5a4a30);
   for(const bx of[mid,Rr-40]){for(let y=0;y<34;y++){const w=10-Math.floor(y/12)*2+Math.round(Math.sin(t*3+y*.2+bx)*1);R(g,y>26&&y%3?0x2a1a14:0x7a2a24,bx+Math.round(Math.sin(t*2+y*.15)*2),top+40+y,Math.max(2,w),1)}R(g,0x5a4a30,bx-1,top+38,12,2)}
   for(let i=0;i<3;i++){const p=(t*.5+i*.33)%1,x=L+80+i*100;if(p<.5){const y=top+20+p*2*(GY-top-20);R(g,0x6a6660,x-2,y,5,4);R(g,0x9a9688,x-2,y,5,1)}}}
  if(th==='spire'){for(let i=0;i<40;i++){if((Math.floor(t*2+i*7))%5)px(g,L+h(i)*360-(t*2)%4,top+h(i,2)*120,i%4?0xb8b0e8:0xffffff)}
   const ox=mid,oy=top+70;I_.ell(g,ox,oy,60,14,0x5a4aa8,.9,70,0);I_.ell(g,ox,oy,40,9,0x7a6ad8,.9,50,0);I_.disc(g,ox,oy,5,0xd8b060);for(const[r,ry,sp,c] of[[60,14,.3,0xd8d0ff],[40,9,.5,0x9ff0e8],[40,9,.5+Math.PI,0xc8a0ff]]){const an=t*sp+(c&7);I_.disc(g,ox+Math.cos(an)*r,oy+Math.sin(an)*ry,2,c)}
   const tx=L+40;R(g,0x3a3458,tx,GY-30,3,30);R(g,0x3a3458,tx-6,GY-4,15,4);line(g,tx,GY-30,tx+24,GY-46,0x6a5a90);line(g,tx,GY-29,tx+24,GY-45,0x6a5a90)}
  if(th==='cloister'){for(let i=0;i<4;i++){const x=L+20+i*80;R(g,0x3a2a1a,x,GY-6,50,6);for(let j=0;j<6;j++){const hh=4+Math.round(h(i*9+j)*6);R(g,0x5a5a2a,x+4+j*8,GY-6-hh,1,hh);px(g,x+4+j*8,GY-6-hh,0x8a6a3a)}}
   const ax=mid;for(let i=0;i<40;i++){const an=Math.PI+i/39*Math.PI;px(g,ax+Math.cos(an)*40,GY-40+Math.sin(an)*40,0x3a5a24);if(i%4===0)px(g,ax+Math.cos(an)*42,GY-40+Math.sin(an)*42,0x8ab050)}R(g,0x3a5a24,ax-41,GY-40,2,40);R(g,0x3a5a24,ax+39,GY-40,2,40);
   for(let i=0;i<14;i++){const y=top+((h(i)*220+t*(12+h(i,2)*6))%220),x=L+h(i,3)*360+Math.sin(t*1.5+i)*8;R(g,i%3?0xb87890:0x9aa860,x,y,2,1)}}
  if(th==='throne'){for(let k=0;k<3;k++)R(g,0x2a2230+k*0x020202,mid-60+k*14,GY-4-k*4,120-k*28,4);for(const x of[L+40,Rr-50]){R(g,0x4a3a2a,x,top+30,2,70);for(let y=0;y<50;y++)R(g,y%9<1?0xd8b060:0x5a3a48,x+2+Math.round(Math.sin(t*1.5+y*.12)*1),top+32+y,12-Math.floor(y/25)*2,1)}
   for(let i=0;i<20;i++){const x=L+h(i)*360+Math.sin(t+i)*4,y=GY-((h(i,2)*200+t*(10+h(i,4)*8))%200);R(g,0x3a2448,x,y,2,2);px(g,x,y,0x8a6aa8)}}}};
if(typeof module!=='undefined')module.exports={INTROS,INTRO_SPEC};
