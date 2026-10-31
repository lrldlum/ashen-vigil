const {chromium}=await import(process.env.PW||'playwright');import {execSync} from 'child_process';import fs from 'fs';
const B=`http://127.0.0.1:${process.env.PORT||8171}/`,SH=(process.argv[2]||'screenshots/coop')+'/';fs.mkdirSync(SH,{recursive:true});
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const errs=[],ext=new Set();let pass=0,fail=0;const ok=(n,c,v)=>{c?pass++:fail++;console.error((c?'PASS ':'FAIL ')+n+' '+JSON.stringify(v).slice(0,500))};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const VD=process.env.VD||'/tmp/coopboss_vid';fs.rmSync(VD,{recursive:true,force:true});const FRS={};
const RELAY=process.env.RELAY!=='0',pages={},q={};
const relayInit=()=>{const h=new Map();window.__fake=(remote)=>{const ev={};const c={open:false,peer:remote,
  on(e,f){(ev[e]=ev[e]||[]).push(f);return c},emit(e,a){(ev[e]||[]).forEach(f=>f(a))},
  send(m){if(c.open)__relaySend(JSON.stringify({to:remote,from:NET.peer.id,m}))},close(){if(!c.open)return;c.open=false;__relaySend(JSON.stringify({to:remote,from:NET.peer.id,close:1}));c.emit('close')}};h.set(remote,c);return c};
 window.__relayRecv=d=>{let c=h.get(d.from);if(d.conn){c=__fake(d.from);NET.peer.emit('connection',c);c.open=true;__relaySend(JSON.stringify({to:d.from,from:NET.peer.id,opened:1}));c.emit('open');return}
  if(!c)return;if(d.opened){c.open=true;c.emit('open')}else if(d.close){if(c.open){c.open=false;c.emit('close')}}else if(d.m&&c.open)c.emit('data',d.m)};
 const patch=()=>{if(!window.Peer)return setTimeout(patch,20);Peer.prototype.connect=function(id){const c=__fake(id);__relaySend(JSON.stringify({to:id,from:this.id,conn:1}));return c}};patch()};
const mk=async(rec)=>{const ctx=await br.newContext({viewport:{width:1280,height:720}});
 await ctx.exposeBinding('__relaySend',(src,s)=>{const d=JSON.parse(s);pages[d.from]=src.page;const p=pages[d.to];if(!p)return;q[d.to]=(q[d.to]||Promise.resolve()).then(()=>p.evaluate(x=>window.__relayRecv&&__relayRecv(x),d)).catch(()=>{})});await ctx.addInitScript(relayInit);
 const pg=await ctx.newPage();pg.on('pageerror',e=>errs.push(e.message));pg.on('request',r=>{const u=r.url();if(!u.startsWith(B)&&!/^(data|blob):/.test(u))ext.add(new URL(u).host)});
 pg.on('close',()=>{for(const[id,p] of Object.entries(pages))if(p===pg){delete pages[id];for(const op of Object.values(pages))op.evaluate(x=>window.__relayRecv&&__relayRecv(x),{from:id,close:1}).catch(()=>{})}});// a closed page drops its link, like a real disconnect
 if(rec){const FR=FRS[rec]=[],VD2=VD+'/'+rec;fs.mkdirSync(VD2,{recursive:true});const s=await ctx.newCDPSession(pg);s.on('Page.screencastFrame',f=>{fs.writeFileSync(`${VD2}/${String(FR.length).padStart(5,'0')}.jpg`,Buffer.from(f.data,'base64'));FR.push(Date.now());s.send('Page.screencastFrameAck',{sessionId:f.sessionId}).catch(()=>{})});await s.send('Page.startScreencast',{format:'jpeg',quality:80,maxWidth:640,maxHeight:360,everyNthFrame:2})}
 const ev=(f,a)=>pg.evaluate(f,a);
 const go=async q=>{await pg.goto(B+q.replace('?','?seed=0&'));await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});await wait(700);
  await ev(()=>{window.S=()=>__G.scene.getScene('stage');window.idle=()=>{window.__inp=()=>({})};window.press=k=>{let n=0;window.__inp=()=>(n++===0?{[k]:1}:{})};window.hold=(o,n)=>{let i=0;window.__inp=()=>(i++<n?o:{})};
   window.tp=(x,y=156)=>{const s=S();s.pb.setPosition(x,y-8);s.pb.setVelocity(0,0);s.player.state='idle';s.player.inv=99;s.camY=s.camTY=y-156};
   window.clear=()=>{const s=S();s.enemies.forEach(e=>{e.dead=true;e.b.body.enable=false})};
   window.until=(f,ms)=>new Promise(r=>{const t0=performance.now(),g=()=>{if(f())r(true);else if(performance.now()-t0>ms)r(false);else requestAnimationFrame(g)};g()})})};
 return{ctx,pg,ev,go,shot:n=>pg.screenshot({path:SH+n+'.png'})}};
// ---------- co-op through boss 1 (Frost Warden, ramparts): intro is host-owned, the guest's kill counts on the host, both get the drop,
// and the guest follows the host's victory choice into the next area at the host's position. usage: PORT=8171 node test/coopboss.mjs [shotsDir]
const st=p=>p.ev(()=>{const s=S();return{sid:s.sid,bs:s.bossState,cine:!!s.cine,vic:!!s.victory,x:Math.round(s.player.x),y:Math.round(s.player.y),inv:s.sv.inv.slice(),linked:NET.linked(),role:NET.role,vid:!!document.getElementById('bossVideo'),vg:!!(s.victory&&s.victory.guest)}});
const until=async(p,f,ms=8000)=>{const t0=Date.now();while(Date.now()-t0<ms){const r=await st(p);if(f(r))return r;await wait(100)}return await st(p)};
const H=await mk(process.env.CLIP?'host':0);await H.pg.goto(B+'assets/README.md');await H.ev(()=>localStorage.clear());await H.go('?host&mute&stage=ramparts&class=knight');
await H.pg.waitForFunction(()=>NET.peer&&NET.peer.open,null,{timeout:20000}).catch(()=>{});const code=await H.ev(()=>NET.code);pages[await H.ev(()=>NET.peer.id)]=H.pg;
const G=await mk(process.env.CLIP?'guest':0);await G.pg.goto(B+'assets/README.md');await G.ev(()=>localStorage.clear());await G.pg.goto(B+'?seed=0&mute&class=pyromancer&join='+code);
await G.pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});await wait(1500);
const gh=()=>G.ev(()=>{window.S=()=>__G.scene.getScene('stage');window.tp=(x,y=156)=>{const s=S();s.pb.setPosition(x,y-8);s.pb.setVelocity(0,0);s.player.inv=99;s.camY=s.camTY=y-156};window.press=k=>{let n=0;window.__inp=()=>(n++===0?{[k]:1}:{})}});await gh();
ok('linked_in_ramparts',(await st(G)).sid==='ramparts'&&(await st(G)).linked,await st(G));
// both walk into the arena; the host starts the intro and the guest mirrors it
await H.ev(()=>{tp(ARENA_L+40)});await G.ev(()=>{tp(ARENA_L+30)});const hc=await until(H,r=>r.cine,5000),gc=await until(G,r=>r.cine,5000);
ok('intro_mirrored_on_guest',hc.cine&&gc.cine,{hc,gc});await H.shot('c1_host_intro');await G.shot('c2_guest_intro');
// guest skip input does not end the host's intro on the guest alone (it is a request to the host, past the 0.7 s guard)
await wait(900);await G.pg.keyboard.press('x');await G.pg.keyboard.press(' ');await wait(200);const ga=await st(G),ha=await st(H);
ok('guest_attack_jump_do_not_skip',ga.cine&&ha.cine,{ga,ha});
await G.pg.keyboard.press('Enter');const hs=await until(H,r=>r.bs==='fight'&&!r.cine,1500),gs=await until(G,r=>r.bs==='fight'&&!r.cine,1500);
ok('guest_skip_request_skips_both',hs.bs==='fight'&&gs.bs==='fight'&&!gs.cine,{hs,gs});
// the guest lands the killing blow; the host owns the death, the drop and the victory card
await H.ev(()=>{S().boss.hp=3});await G.ev(()=>{S().damageBoss(10)});const hd=await until(H,r=>r.bs==='dead',8000),gd=await until(G,r=>r.bs==='dead',8000);
ok('boss_dies_on_both',hd.bs==='dead'&&gd.bs==='dead',{hd:hd.bs,gd:gd.bs});
const sig=await H.ev(()=>Object.keys(SIGNATURE||{}).length?SIGNATURE.warden:null).catch(()=>null);
const hv=await until(H,r=>r.vic,9000),gv=await until(G,r=>r.vic,3000);await H.shot('c3_host_victory');await G.shot('c4_guest_victory');
ok('both_get_boss_drop',sig?hv.inv.includes(sig)&&gv.inv.includes(sig):hv.inv.length>0&&JSON.stringify(hv.inv.filter(i=>!gv.inv.includes(i)))==='[]',{sig,h:hv.inv,g:gv.inv});
ok('guest_sees_readonly_victory',hv.vic&&gv.vic&&gv.vg,{hv:hv.vic,gv:gv.vic});
// the guest tries to pick something else (Down + Enter = rest at the shrine): ignored; the host picks ONWARD and both go
await G.pg.keyboard.press('ArrowDown');await G.pg.keyboard.press('Enter');await wait(800);const gx=await st(G);ok('guest_cannot_leave_alone',gx.sid==='ramparts',gx);
await H.ev(()=>{S().victory.sel=0});await H.pg.keyboard.press('Enter');
const hn=await until(H,r=>r.sid!=='ramparts'&&!r.vic,10000);await wait(2500);await gh();const gn=await until(G,r=>r.sid===hn.sid,10000);await wait(1500);
const hn2=await st(H),gn2=await st(G);await H.shot('c5_host_next');await G.shot('c6_guest_next');
ok('same_next_area',hn2.sid!=='ramparts'&&gn2.sid===hn2.sid&&gn2.linked&&hn2.linked,{h:hn2.sid,g:gn2.sid,linked:[hn2.linked,gn2.linked]});
ok('same_position',Math.abs(hn2.x-gn2.x)<48&&Math.abs(hn2.y-gn2.y)<48,{h:[hn2.x,hn2.y],g:[gn2.x,gn2.y]});
// still in sync: the guest sees the host's enemies and remote position
const sync=await G.ev(()=>({r:!!NET.remote,rx:NET.remote&&Math.round(NET.remote.x),n:S().enemies.length}));const hx=await H.ev(()=>({x:Math.round(S().player.x),n:S().enemies.length}));
ok('not_desynced',sync.r&&Math.abs(sync.rx-hx.x)<24&&sync.n===hx.n,{sync,hx});
// r11: the host drops while the guest is on the read-only card -> the card unlocks and the guest can choose
await H.ev(()=>{tp(ARENA_L+40)});await G.ev(()=>{tp(ARENA_L+30)});await until(H,r=>r.cine,5000);await wait(900);await H.pg.keyboard.press('Enter');await until(H,r=>r.bs==='fight',3000);
await H.ev(()=>{S().boss.hp=1;S().damageBoss(10)});const gr=await until(G,r=>r.vg,12000);ok('guest_readonly_card_boss2',gr.vg,gr);
await H.pg.close();const gl=await until(G,r=>!r.vg&&r.role==='lost',8000);await G.shot('c7_guest_card_unlocked');ok('host_drop_unlocks_guest_card',gl.vic&&!gl.vg,gl);
await wait(900);await G.ev(()=>{S().victory.sel=0});await G.pg.keyboard.press('Enter');const gm=await until(G,r=>r.sid!==gl.sid&&!r.vic,10000);ok('guest_chooses_after_host_drop',gm.sid!==gl.sid,{from:gl.sid,to:gm.sid});
ok('no_page_errors',errs.length===0,errs.slice(0,3));
if(process.env.CLIP&&FRS.host){for(const n of['host','guest']){const FR=FRS[n],d=VD+'/'+n;fs.writeFileSync(d+'/l.txt',FR.map((t,i)=>`file '${d}/${String(i).padStart(5,'0')}.jpg'\nduration ${(((FR[i+1]||t+50)-t)/1000).toFixed(3)}`).join('\n'));
 execSync(`ffmpeg -y -loglevel error -f concat -safe 0 -i ${d}/l.txt -vf "scale=640:360,fps=30,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${n==='host'?'P1 HOST':'P2 GUEST'}':x=8:y=8:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.5" -c:v libx264 -pix_fmt yuv420p -crf 26 ${d}.mp4`)}
 execSync(`ffmpeg -y -loglevel error -i ${VD}/host.mp4 -i ${VD}/guest.mp4 -filter_complex "[0:v][1:v]hstack=shortest=0" -c:v libx264 -pix_fmt yuv420p -crf 26 ${process.env.CLIP}`)}
console.log(JSON.stringify({pass,fail}));await br.close();process.exit(fail?1:0);
