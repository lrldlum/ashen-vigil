// ASHEN VIGIL — milestone F: 2-player co-op over PeerJS (WebRTC data channel) with a 4-character room code.
// Uses the free public PeerJS broker (0.peerjs.com) only for signalling; no accounts, no TURN. Strict NATs may fail.
// Host is authoritative: it simulates enemies, lords, challenges and loot and streams snapshots; the guest simulates only
// its own knight, sends hits/requests to the host, and takes damage locally from the host's enemy/boss/shot state.
'use strict';
const CODE_CHARS='ACDEFHJKLMNPRTUVWXY3479';
const NET={role:null,code:null,peer:null,conn:null,status:'',remote:null,scene:null,last:0,sendT:0,snapT:0,snapN:0,pending:null,err:'',
 GUEST_KEY:'ashenVigil.coop.guest',TINT:{b:0x3ab0a0,s:0x1a6058,h:0x9ff0dc,c:0x22406a},
 host(){return this.role==='host'},guest(){return this.role==='guest'},on(){return this.role==='host'||this.role==='guest'},
 linked(){return !!(this.conn&&this.conn.open)},
 opts(){const Qp=new URLSearchParams(location.search),o={debug:+(Qp.get('peerdebug')||0)};if(Qp.get('peerhost')){o.host=Qp.get('peerhost');o.port=+(Qp.get('peerport')||9000);o.path='/';o.secure=false}return o},
 newCode(){let s='';for(let i=0;i<4;i++)s+=CODE_CHARS[Math.floor(Math.random()*CODE_CHARS.length)];return s},
 pid(c){return'ashenvigil-'+c.toLowerCase()},
 startHost(code){if(typeof Peer==='undefined'){this.err='PEERJS MISSING';return}this.role='host';this.code=code||this.newCode();this.status='OPENING ROOM';
  this.peer=new Peer(this.pid(this.code),this.opts());
  this.peer.on('open',()=>{this.status='WAITING FOR A COMPANION'});
  this.peer.on('connection',c=>{if(this.linked()){c.on('open',()=>{c.send({t:'full'});setTimeout(()=>c.close(),300)});return}this.bind(c)});
  this.peer.on('error',e=>{if(e.type==='unavailable-id'){this.peer.destroy();this.startHost(this.newCode());return}this.err=String(e.type||e).toUpperCase();this.status='ROOM ERROR: '+this.err});
  this.peer.on('disconnected',()=>{try{this.peer.reconnect()}catch(e){}})},
 startJoin(code,cb){if(typeof Peer==='undefined'){cb&&cb('PEERJS MISSING');return}this.role='guest';this.code=code.toUpperCase();this.status='CONNECTING TO '+this.code;this.joinCb=cb;
  this.peer=new Peer(undefined,this.opts());
  this.peer.on('open',()=>{this.bind(this.peer.connect(this.pid(this.code),{reliable:true,serialization:'json'}))});
  this.peer.on('error',e=>{const m=e.type==='peer-unavailable'?'NO ROOM WITH THAT CODE':String(e.type||e).toUpperCase();this.status=m;this.err=m;if(this.joinCb){this.joinCb(m);this.joinCb=null;this.leave(true)}})},
 bind(c){this.conn=c;c.on('open',()=>{this.last=performance.now();if(this.host()){this.status='COMPANION JOINED';this.helloTo()}else this.send({t:'ready',p:this.me()})});
  c.on('data',d=>{if(this.conn!==c)return;this.last=performance.now();try{this.recv(d)}catch(e){console.warn('net',e)}});
  c.on('close',()=>{if(this.conn===c)this.dropped('closed')});c.on('error',()=>{if(this.conn===c)this.dropped('error')})},
 send(m){if(this.linked())try{this.conn.send(m)}catch(e){}},
 leave(silent){try{this.conn&&this.conn.close()}catch(e){}try{this.peer&&this.peer.destroy()}catch(e){}this.conn=null;this.peer=null;this.remote=null;if(!silent)this.role=null},
 // graceful disconnects: host keeps the room open; guest keeps playing alone with local simulation
 dropped(why){if(!this.conn)return;const S=this.scene;this.conn=null;this.remote=null;
  if(this.host()){this.status='WAITING FOR A COMPANION';S&&S.sys.isActive()&&S.say&&S.say('YOUR COMPANION HAS FADED',2.4)}
  else if(this.guest()){this.role='lost';this.status='HOST LOST';try{this.peer&&this.peer.destroy()}catch(e){}if(S&&S.sys.isActive()&&S.enemies){S.enemies.forEach(e=>{if(e.b.body)e.b.body.moves=true});if(S.boss&&S.bossState==='fight')S.bossState='fight';S.say('THE HOST IS GONE - YOU WALK ALONE',3)}}
  this.lostAt=performance.now()},
 me(){const S=this.scene;if(!S||!S.player)return null;const P=S.player,h=S._hero||{};return{x:Math.round(P.x),y:Math.round(P.y),f:P.f,st:h.st||P.state,fr:h.fr||0,c:P.combo,hv:h.hv?1:0,fl:P.flash>0?1:0,hp:Math.round(P.hp),hm:P.hpMax,dead:P.dead?1:0,
  cls:S.sv.cls,main:S.sv.eq.main,arm:S.sv.eq.armor,lv:S.lvl,sid:S.sid}},
 prog(S){const sv=S.sv;return{freed:sv.freed,found:sv.found,chDone:sv.chDone,broken:sv.broken,bossDown:S.bossState==='dead',bonfire:S.bonfire.lit,picked:sv.picked}},
 helloTo(){const S=this.scene;if(!S||!S.sv||!this.linked())return;this.send({t:'hello',sid:S.sid,prog:this.prog(S),ng:S.ng})},
 // ---------- called from Stage ----------
 onStage(S){this.scene=S;if(this.host())this.helloTo();if(this.guest()){this.send({t:'ready',p:this.me()});S.enemies.forEach(e=>{e.b.body.moves=false})}},
 target(S,e){const P=S.player,R=this.remote;if(!this.host()||!R||R.dead||R.sid!==S.sid)return P;const b=e.b;return Math.hypot(R.x-b.x,R.y-b.y)<Math.hypot(P.x-b.x,P.y-b.y)?{x:R.x,y:R.y,remote:1,dead:false,state:R.st}:P},
 tick(S,dt){if(!this.on())return;const now=performance.now();
  if(this.linked()&&now-this.last>7000)this.dropped('timeout');
  this.sendT-=dt;if(this.sendT<=0&&this.linked()){this.sendT=.05;this.send({t:'p',p:this.me()})}
  if(this.host()&&this.linked()){this.snapT-=dt;if(this.snapT<=0){this.snapT=1/15;this.snapN++;this.send(this.snap(S,this.snapN%15===1))}}
  const R=this.remote;if(R){R.rx=R.rx==null?R.x:lerp(R.rx,R.x,Math.min(1,dt*14));R.ry=R.ry==null?R.y:lerp(R.ry,R.y,Math.min(1,dt*14))}},
 snap(S,full){const m={t:'s',sid:S.sid,bs:S.bossState,
  e:S.enemies.map(e=>[e.k,Math.round(e.b.x),Math.round(e.b.y),e.f,e.state,+e.hp.toFixed(2),e.dead?1:0,+e.t.toFixed(2),e.combo?1:0,e.mst||0,e.flash>0?1:0]),
  sh:S.shots.map(s=>[Math.round(s.x),Math.round(s.y),Math.round(s.vx),Math.round(s.vy),s.c||0,s.dmg||12,s.g||0,s.delay||0]),
  g:S.chs.map(c=>c.gateObjs.map(g=>g.closed?1:0)),ch:S.chs.map(c=>[c.active?1:0,+(c.t||0).toFixed(1),c.wave||0])};
  const B=S.boss;if(B){const o={};for(const k of['kind','x','y','f','hp','hpMax','state','t','phase','rise','eyes','next','wt','step','hov','flash','cd'])o[k]=typeof B[k]==='number'?+B[k].toFixed(2):B[k];m.b=o}
  if(full)m.prog=this.prog(S);return m},
 recv(d){const S=this.scene,live=S&&S.sys&&S.sys.isActive()&&S.player;
  if(d.t==='p'){const was=this.remote;this.remote={...d.p,rx:was?was.rx:d.p.x,ry:was?was.ry:d.p.y};return}
  if(d.t==='full'){this.status='ROOM IS FULL';this.err='ROOM IS FULL';if(this.joinCb){this.joinCb('ROOM IS FULL');this.joinCb=null}this.leave();return}
  if(this.host()){if(d.t==='ready'){this.remote=d.p?{...d.p,rx:d.p.x,ry:d.p.y}:this.remote;this.helloTo();if(live)S.say('A COMPANION ARRIVES',2);return}
   if(!live)return;
   if(d.t==='dmg'){const e=S.enemies[d.i];if(e&&!e.dead)S.damageEnemy(e,d.n,d.dir,1)}
   else if(d.t==='bdmg')S.damageBoss(d.n,1);
   else if(d.t==='cage'){const c=S.cages.find(c=>c.id===d.id);if(c&&!c.freed&&!c.locked)S.freeCage(c,1)}
   else if(d.t==='brk'){const k=S.breakables.find(k=>k.id===d.id);if(k&&k.hp>0)S.hitBreakable(k,1)}
   else if(d.t==='pick'){const it=S.items.find(i=>i.id===d.id);if(it){S.takeItem(it,1);this.send({t:'picked',id:it.id,item:it.item})}}
   else if(d.t==='parry'){const e=S.enemies[d.i];if(e&&!e.dead){e.state='stag';e.t=0}}
   return}
  // ---------- guest ----------
  if(d.t==='hello'){if(this.joinCb){const cb=this.joinCb;this.joinCb=null;this.status='JOINED ROOM '+this.code;cb(null,d);return}
   if(live&&S.sid!==d.sid)this.follow(d.sid,d.prog);else if(live)this.applyProg(S,d.prog);return}
  if(!live)return;
  if(d.t==='s'){if(d.sid!==S.sid){this.follow(d.sid,d.prog);return}this.applySnap(S,d)}
  else if(d.t==='souls')S.gainSouls(d.n,1);
  else if(d.t==='hurt'){}// guest takes damage locally from the host's state
  else if(d.t==='picked'){const i=S.items.findIndex(x=>x.id===d.id);const it=i>=0?S.items[i]:{id:d.id,item:d.item,x:S.player.x,y:S.player.y};S.takeItem(it,1)}
  else if(d.t==='bossdead'){S.bossState='dead';S.boss=null;S.gateL.body.enable=false;S.shots.length=0;S.flames=[];S.say(d.slain||'LORD FELLED',3);S.sv.bossDown=true}
  else if(d.t==='ending'){Save.write({...S.sv,souls:S.souls});S.scene.start('ending',{kind:d.kind})}},
 follow(sid,prog){const S=this.scene;if(!S)return;if(this._following===sid)return;this._following=sid;const sv=S.sv||{};
  Save.write({...sv,stage:sid,souls:S.souls,bonfire:!!(prog&&prog.bonfire),bossDown:!!(prog&&prog.bossDown),stain:null});setTimeout(()=>{this._following=null},1500);
  if(S.scene.key==='stage')S.scene.restart({fresh:false});else S.scene.start('stage',{fresh:false})},
 applyProg(S,p){if(!p)return;const sv=S.sv;
  for(const c of S.cages)if(p.freed.includes(c.id)&&!c.freed){c.freed=true;S.fx.spark(c.x,c.y-8,14,C.f1,120);S.fx.ember(c.x,c.y-8,16,1.6)}
  for(const c of S.covers)if(p.found.includes(c.id)&&!c.found){c.found=true}
  for(const k of S.breakables)if(p.broken.includes(k.id)&&k.hp>0){k.hp=0;try{k.body.body.enable=false;k.body.destroy()}catch(e){}}
  for(const ch of S.chs)if(p.chDone.includes(ch.id)&&!ch.done){ch.done=1;ch.active=0;S.setGates(ch,false)}
  for(const c of S.cages)if(c.lock&&p.chDone.includes(c.lock))c.locked=false;
  S.items=S.items.filter(it=>!p.picked.includes(it.id));
  if(p.bonfire)S.bonfire.lit=true;if(p.bossDown&&S.bossState!=='dead'){S.bossState='dead';S.boss=null}
  sv.freed=[...p.freed];sv.found=[...p.found];sv.chDone=[...p.chDone];sv.broken=[...p.broken];sv.bonfire=p.bonfire||sv.bonfire},
 applySnap(S,d){if(d.prog)this.applyProg(S,d.prog);
  d.e.forEach((s,i)=>{let e=S.enemies[i];const[k,x,y,f,st,hp,dead,t,combo,mst,fl]=s;
   if(!e||e.k!==k){if(e){e.dead=true;try{e.b.body.enable=false}catch(_){}}e=S.spawnEnemy(k,x,y+10);e.temp=1;S.enemies[i]=e;e.b.body.moves=false}
   e.b.body.moves=false;e.nx=x;e.ny=y;if(Math.abs(e.b.x-x)>40||Math.abs(e.b.y-y)>40)e.b.setPosition(x,y);e.f=f;e.state=st;e.hp=hp;e.t=t;e.combo=combo;e.mst=mst||undefined;if(fl)e.flash=.1;
   if(dead&&!e.dead){e.dead=true;e.deadT=0;e.b.body.enable=false;S.fx.soul(e.b.x,e.b.y,8)}
   if(!dead&&e.dead){e.dead=false;e.b.body.enable=true;e.b.setPosition(x,y)}});
  for(let i=d.e.length;i<S.enemies.length;i++){const e=S.enemies[i];if(!e.dead){e.dead=true;e.deadT=1;e.b.body.enable=false}}
  S.shots=d.sh.map(([x,y,vx,vy,c,dmg,g,delay])=>({x,y,vx,vy,c:c||undefined,dmg,g:g||undefined,delay,t:0,net:1}));
  d.g.forEach((gs,i)=>{const ch=S.chs[i];if(ch)ch.gateObjs.forEach((g,j)=>{const c=!!gs[j];if(g.closed!==c){g.closed=c;g.body.body.enable=c}})});
  d.ch.forEach(([a,tt,w],i)=>{const ch=S.chs[i];if(ch){ch.active=a;ch.t=tt;ch.wave=w;ch.netLive=1}});
  if(d.b){if(!S.boss)S.boss={...d.b,flashCd:0,eyeFlash:0};else Object.assign(S.boss,d.b);if(d.bs==='fight'&&S.bossState!=='dead')S.bossState='fight';if(d.bs==='dying')S.bossState='dying'}
  else if(S.boss&&d.bs!=='fight'){S.boss=null}},
 // guest-side local simulation: smooth enemies toward host positions, take damage from host enemies/boss locally
 guestSim(S,dt){const P=S.player;
  for(const e of S.enemies){if(e.dead){e.deadT+=dt;continue}e.flash-=dt;e.t+=dt;if(e.nx!=null){e.b.x=lerp(e.b.x,e.nx,Math.min(1,dt*12));e.b.y=lerp(e.b.y,e.ny,Math.min(1,dt*12))}
   e.run=(e.run||0)+dt*8;
   if(P.dead)continue;const adx=Math.abs(P.x-e.b.x),kn=e.base==='knight';
   if((e.base==='hollow'||kn)&&e.state==='swing'&&e.t<.12&&adx<20&&Math.abs(P.y-e.b.body.bottom)<16&&!e.netHit){e.netHit=1;if(S.hurtPlayer(e.combo?10:kn?16:14,e.b.x,e)===false&&S.player.state==='parry')this.send({t:'parry',i:S.enemies.indexOf(e)})}
   if(e.state!=='swing')e.netHit=0;
   if(e.base==='imp'&&e.state==='fuse'&&e.t>.45&&adx<22&&!e.netHit){e.netHit=1;S.hurtPlayer(18,e.b.x)}}
  const B=S.boss;if(B&&S.bossState==='fight'&&!P.dead){B.flash=Math.max(0,(B.flash||0)-1);const near=Math.abs(P.x-(B.x+B.f*16))<18&&P.y>GY-30;
   if(B.state==='slam'&&B.t<.12&&near&&!B.netHit){B.netHit=1;S.hurtPlayer(B.kind==='king'?28:24,B.x,'boss')}
   if(B.state==='charge'&&Math.abs(P.x-B.x)<12&&Math.abs(P.y-GY)<30)S.hurtPlayer(20,B.x);if(B.state!=='slam')B.netHit=0}},
 // ---------- drawing ----------
 draw(S,g,ga){const R=this.remote;if(!R||R.sid!==S.sid)return;const x=Math.round(R.rx),y=Math.round(R.ry);
  heroStyle(WEAPONS[R.main]||WEAPONS.longsword,!!R.hv,{pal:this.TINT});if(!R.dead)drawHero(g,x,y,R.f,R.st,R.fr,S.t,{flash:!!R.fl,combo:R.c});else{g.fillStyle(0x3a6a64,.6);g.fillRect(x-5,y-2,11,2)}
  HERO.rim(ga,x,y,R.f,0x9ff0dc,.45);glow(ga,x,y-8,12,0x5fe0c0,.08);S.light(x,y-8,24,0x5fe0c0,.3);
  const tag=this.host()?'P2':'P1',w=16;drawText(g,tag,x-3,y-31,0x9ff0dc);g.fillStyle(0x07050f);g.fillRect(x-w/2-1,y-24,w+2,3);g.fillStyle(0x5fe0c0);g.fillRect(x-w/2,y-23,Math.max(0,Math.round(w*R.hp/(R.hm||100))),1);
  heroStyle(S.wp,S.player.heavy&&S.player.state==='atk',ARMORS[S.sv.eq.armor])},
 hud(S,g){if(!this.role)return;let s;if(this.host())s='ROOM '+this.code+(this.linked()?'  P2 '+(this.remote?CLASSES[this.remote.cls]?.name||'':''):'  '+this.status);else if(this.guest())s='CO-OP ROOM '+this.code+'  P2';else if(this.role==='lost')s='HOST LOST - SOLO';else return;
  const w=textW(s);g.fillStyle(0x07050f,.7);g.fillRect(Math.round(W/2-w/2)-3,2,w+6,8);drawText(g,s,Math.round(W/2-w/2),3,this.linked()?0x9ff0dc:0xb8b4d8)}};
// guest characters live in their own save so a co-op visit never overwrites the guest's solo slot progress
{const oKey=Save.key.bind(Save),oLoad=Save.load.bind(Save);
 Save.key=function(){return NET.role==='guest'||NET.role==='lost'?NET.GUEST_KEY:oKey()};
 Save.load=function(i){if(i===undefined&&(NET.role==='guest'||NET.role==='lost')){try{return JSON.parse(localStorage.getItem(NET.GUEST_KEY))||null}catch(e){return null}}return oLoad(i)}}
window.NET=NET;
