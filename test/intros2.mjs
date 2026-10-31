// r12 boss intros: every lord has its own in-engine entrance / weapon / attack / lair, all distinct; deliberate skip; once per save.
// usage: PORT=8192 PW=.../playwright/index.mjs node test/intros2.mjs [shotsDir]   (CLIPDIR=dir also saves frames for a clip)
const {chromium}=await import(process.env.PW||'playwright');import fs from 'fs';
const B=`http://127.0.0.1:${process.env.PORT||8171}/`,SD=process.argv[2]||'screenshots/intros2';fs.mkdirSync(SD,{recursive:true});const CD=process.env.CLIPDIR;if(CD)fs.mkdirSync(CD,{recursive:true});
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const errs=[];let pass=0,fail=0;const ok=(n,c,v)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+n+' '+JSON.stringify(v??'').slice(0,300))};
const BOSSES={ramparts:'warden',cathedral:'cantor',cinderdeep:'king',belltower:'toller',catacomb:'smith',drowned:'abbess',keep:'marshal',spire:'astronomer',cloister:'prioress',throne:'heir'};
const ctx=await br.newContext({viewport:{width:1280,height:720}});const pg=await ctx.newPage();pg.on('pageerror',e=>errs.push(e.message));
const S=(f,a)=>pg.evaluate(f,a),wait=ms=>pg.waitForTimeout(ms);
const load=async(stage,clear=true)=>{if(clear){await pg.goto(B+'assets/README.md');await S(()=>localStorage.clear())}
 await pg.goto(B+`?play&mute&class=knight&stage=${stage}`);await pg.waitForFunction(()=>{const s=window.__G&&__G.scene.getScene('stage');return s&&s.player&&s.sys.isActive()},null,{timeout:30000});await wait(500)};
const enter=()=>S(()=>{const s=__G.scene.getScene('stage');s.player.inv=99;s.pb.setPosition(ARENA_L+40,140);s.pb.setVelocity(0,0)});
const st=()=>S(()=>{const s=__G.scene.getScene('stage'),c=s.cine;return{bs:s.bossState,cine:!!c,it:c&&c.it!=null?+c.it.toFixed(2):null,t:c?+c.t.toFixed(2):null,short:c?!!c.short:null,vid:!!document.getElementById('bossVideo'),ph:window.__introPhase&&__introPhase.phase}});
const until=async(f,ms=9000)=>{const t0=Date.now();while(Date.now()-t0<ms){const r=await st();if(f(r))return r;await wait(40)}return await st()};
const sig={};let frame=0;
const grab=async(name)=>{const b=await pg.screenshot({path:`${SD}/${name}.png`});return b.toString('base64')};
const rec=async(ms)=>{if(!CD)return wait(ms);const t0=Date.now();while(Date.now()-t0<ms){await pg.screenshot({path:`${CD}/${String(frame++).padStart(5,'0')}.jpg`,type:'jpeg',quality:80})}};
for(const[stage,kind] of Object.entries(BOSSES)){await load(stage);await enter();
 const a=await until(r=>r.cine);ok(`${kind}_in_engine_intro`,a.cine&&a.it!=null&&!a.vid&&!a.short,a);
 if(CD){await rec(5000)}else{
 await until(r=>r.it>=1.2);sig[kind+'_ent']=await grab(`${kind}_1_entrance`);
 await until(r=>r.it>=3.0);sig[kind+'_wpn']=await grab(`${kind}_2_weapon`);
 await until(r=>r.it>=4.1);sig[kind+'_atk']=await grab(`${kind}_3_attack`);}
 const e=await until(r=>r.bs==='fight'&&!r.cine,6000);ok(`${kind}_runs_to_fight`,e.bs==='fight',e);
 // lair: the arena with the fight on, camera centred on the arena
 await S(()=>{const s=__G.scene.getScene('stage');s.boss.cd=99;s.boss.state='stag';s.boss.t=-99;s.cam.stopFollow();s.cam.setScroll(Math.round((ARENA_L+ARENA_R)/2-160),s.cam.scrollY)});await wait(300);if(!CD)sig[kind+'_lair']=await grab(`${kind}_4_lair`);
 const lg=await S(()=>({log:window.__introLog&&__introLog[__G.scene.getScene('stage').def.boss.kind],lair:window.__lair}));ok(`${kind}_logged`,lg.log&&lg.lair,lg)}
// every spec field is unique across bosses
const specs=await S(()=>INTRO_SPEC);for(const f of['ent','wpn','atk','lair','atkName']){const v=Object.values(specs).map(s=>s[f]);ok(`spec_${f}_unique`,new Set(v).size===10,v)}
// pixel distinctness: downscale each beat and compare pairwise (mean abs diff over 64x36)
if(!CD){const p2=await ctx.newPage();await p2.goto(B+'assets/README.md');
 const small=await p2.evaluate(async(m)=>{const o={};for(const[k,b64]of Object.entries(m)){const im=new Image();im.src='data:image/png;base64,'+b64;await im.decode();const c=document.createElement('canvas');c.width=64;c.height=36;const x=c.getContext('2d');x.drawImage(im,0,0,64,36);o[k]=Array.from(x.getImageData(0,0,64,36).data)}return o},sig);
 const diff=(a,b)=>{let s=0;for(let i=0;i<a.length;i++)if(i%4!==3)s+=Math.abs(a[i]-b[i]);return s/(a.length*.75)};
 for(const beat of['ent','wpn','atk','lair']){let min=1e9,pair='';const ks=Object.values(BOSSES);for(let i=0;i<10;i++)for(let j=i+1;j<10;j++){const d=diff(small[ks[i]+'_'+beat],small[ks[j]+'_'+beat]);if(d<min){min=d;pair=ks[i]+'/'+ks[j]}}ok(`${beat}_frames_distinct`,min>3,{min:+min.toFixed(2),pair})}
 await p2.close()}
// deliberate skip: nothing in the first 0.7 s; attack/jump/click never skip; Enter skips to the fight
await load('keep');await enter();await until(r=>r.cine);await pg.keyboard.press('Enter');await wait(120);ok('early_enter_ignored',(await st()).cine);
await wait(700);for(const k of['x','z',' ','j'])await pg.keyboard.press(k);await pg.mouse.click(640,360);await wait(150);ok('attack_jump_click_no_skip',(await st()).cine);
await pg.keyboard.press('Enter');const sk=await until(r=>r.bs==='fight'&&!r.cine,600);ok('enter_skips_scene',sk.bs==='fight'&&!sk.cine,sk);
// once per save: after a death the next attempt only gets the short beat (no scene)
const seen=await S(()=>Save.load().seenIntro);await S(()=>{const s=__G.scene.getScene('stage');s.hurtPlayer(9999,s.player.x+10)});await pg.waitForFunction(()=>__G.scene.getScene('stage').player.dead,null,{timeout:5000}).catch(()=>{});
await S(()=>__G.scene.getScene('stage').respawn());await wait(1200);await enter();const r2=await until(r=>r.bs==='fight',1500);ok('once_per_save',seen&&seen.marshal&&r2.bs==='fight'&&r2.it==null,{seen,r2});
// ?video still plays the old file for the Cantor (fallback kept)
ok('no_page_errors',errs.length===0,errs.slice(0,3));console.log(`${pass} passed, ${fail} failed`);await br.close();process.exit(fail?1:0);
