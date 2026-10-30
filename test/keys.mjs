// Controller-like keyboard map: every action key under one hand position, WASD and arrows both work, W never interacts.
import { chromium } from './node_modules/playwright/index.mjs';
const B=`http://127.0.0.1:${process.env.PORT||8171}/`;let pass=0,fail=0;const ok=(n,c,d)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(d)))};
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});const pg=await br.newPage({viewport:{width:960,height:540}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto(B+'assets/README.md');await pg.evaluate(()=>localStorage.clear());await pg.goto(B+'?play&mute&slot=1&class=knight&stage=ramparts&seed=0');
await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});await pg.waitForTimeout(1200);
const S=f=>pg.evaluate(f),w=ms=>pg.waitForTimeout(ms);
await S(()=>{const s=__G.scene.getScene('stage');window.s=s;s.msg=null;s.enemies.forEach(e=>{e.dead=true;e.b.body.enable=false});s.pb.setPosition(s.bonfire.x-120,s.pb.y-4);s.player.fp=999});await w(500);
// watch for a player state while a key action runs
const watch=(pred,act)=>pg.evaluate(pred=>new Promise(r=>{const f=new Function('s','p',pred);let hit=false;const iv=setInterval(()=>{if(f(s,s.player))hit=true},5);setTimeout(()=>{clearInterval(iv);r(hit)},900)}),pred).then(async h=>h);
const run=async(pred,act)=>{const p=watch(pred);await w(30);await act();return p};
const P=()=>S(()=>({x:s.player.x,st:s.player.state}));
for(const[k,name]of[['d','D_moves_right'],['ArrowRight','arrow_moves_right']]){const a=await P();await pg.keyboard.down(k);await w(400);await pg.keyboard.up(k);const b=await P();ok(name,b.x>a.x+10,[a.x,b.x]);await w(300)}
{const a=await P();await pg.keyboard.down('a');await w(400);await pg.keyboard.up('a');const b=await P();ok('A_moves_left',b.x<a.x-10,[a.x,b.x]);await w(300)}
ok('space_jumps',await run("return s.pb.body.velocity.y<-60",()=>pg.keyboard.press('Space')));await w(800);
ok('x_tap_light',await run("return p.state==='atk'&&!p.heavy",()=>pg.keyboard.press('x')));await w(700);
ok('j_tap_light',await run("return p.state==='atk'&&!p.heavy",()=>pg.keyboard.press('j')));await w(700);
ok('hold_x_heavy',await run("return p.state==='atk'&&p.heavy",async()=>{await pg.keyboard.down('x');await w(450);await pg.keyboard.up('x')}));await w(900);
ok('c_casts',await run("return p.state==='cast'",()=>pg.keyboard.press('c')));await w(800);
ok('k_casts',await run("return p.state==='cast'",()=>pg.keyboard.press('k')));await w(800);
await S(()=>{s.player.st=s.player.stMax});
ok('shift_dodges',await run("return p.state==='roll'",()=>pg.keyboard.press('Shift')));await w(800);
ok('l_dodges',await run("return p.state==='roll'",()=>pg.keyboard.press('l')));await w(800);
ok('v_parries',await run("return p.state==='parry'",()=>pg.keyboard.press('v')));await w(800);
await S(()=>{s.player.hp=40});ok('f_drinks',await run("return p.state==='drink'",()=>pg.keyboard.press('f')));await w(1500);
{const before=await S(()=>s.pops.length);await pg.keyboard.press('q');await w(100);ok('q_cycles_spell',await S(()=>s.kSpell===1||!!s.spCycle),await S(()=>s.kSpell))}
// W near the bonfire must not open the bonfire menu; E does
await S(()=>{s.pb.setPosition(s.bonfire.x-4,s.pb.y-4);s.player.hp=1});await w(500);await pg.keyboard.down('w');await w(300);await pg.keyboard.up('w');ok('w_never_interacts',await S(()=>!s.menu&&s.player.state!=='rest'));
await pg.keyboard.press('e');await w(600);ok('e_interacts_rest',await S(()=>!!s.menu||s.player.state==='rest'));
// menus navigate with WASD and arrows
await S(()=>{s.menu={mode:'main',sel:0,t:1,prev:{}}});await pg.keyboard.press('s');await w(120);const a1=await S(()=>s.menu.sel);await pg.keyboard.press('ArrowDown');await w(120);const a2=await S(()=>s.menu.sel);await pg.keyboard.press('w');await w(120);const a3=await S(()=>s.menu.sel);
ok('menus_wasd_and_arrows',a1===1&&a2===2&&a3===1,[a1,a2,a3]);await S(()=>{s.menu=null});await w(300);
await pg.keyboard.press('Tab');await w(300);ok('tab_opens_inventory',await S(()=>s.menu&&s.menu.mode==='inv'),await S(()=>s.menu&&s.menu.mode));await pg.keyboard.press('Escape');await w(200);await S(()=>{s.menu=null});
await pg.keyboard.press('i');await w(300);ok('i_opens_inventory',await S(()=>s.menu&&s.menu.mode==='inv'));await S(()=>{s.menu=null});
await pg.keyboard.press('Escape');await w(300);ok('esc_pauses',await S(()=>s.paused));await pg.screenshot({path:'screenshots/controls_pause.png'});await pg.keyboard.press('Escape');await w(200);
ok('no_errors',errs.length===0,errs);console.log(JSON.stringify({pass,fail}));await br.close();process.exit(fail?1:0);
