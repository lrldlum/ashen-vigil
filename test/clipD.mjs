// usage: node test/clipD.mjs <framedir> — class select, bonfire level-up, weapon heavies, bow, wand cast, armor rolls, new arenas
import { chromium } from 'playwright';import fs from 'fs';
const B='http://127.0.0.1:8171/',D=process.argv[2];fs.mkdirSync(D,{recursive:true});
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const pg=await (await br.newContext({viewport:{width:960,height:540}})).newPage();const cdp=await pg.context().newCDPSession(pg);
let n=0;const list=[];cdp.on('Page.screencastFrame',async f=>{const fn=`${D}/f${String(n++).padStart(5,'0')}.jpg`;fs.writeFileSync(fn,Buffer.from(f.data,'base64'));list.push([fn,f.metadata.timestamp]);cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId}).catch(()=>{})});
const rec=()=>cdp.send('Page.startScreencast',{format:'jpeg',quality:90,everyNthFrame:1}),stop=()=>cdp.send('Page.stopScreencast');
const W=ms=>pg.waitForTimeout(ms),K=async(k,ms=220)=>{await pg.keyboard.press(k);await W(ms)};
const ready=async()=>{await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive());await W(700);
 await pg.evaluate(()=>{window.S=()=>__G.scene.getScene('stage');window.press=k=>{let n=0;window.__inp=()=>(n++===0?{[k]:1}:{})};
  window.arena=()=>{const s=S();s.enemies.forEach(e=>{e.dead=true;e.b.body.enable=false});s.pb.setPosition(700,148);s.pb.setVelocity(0,0);s.player.f=1;s.player.state='idle';s.player.inv=99;s.player.st=999;s.player.stMax=999;s.camY=s.camTY=0};
  window.dummy=dx=>{const s=S(),e=s.spawnEnemy('hollow',s.player.x+dx,156);e.hp=99;e.state='idle';e.cd=99;e.temp=1;e.b.y=148;e.b.body.moves=false;return e};
  window.equip=eq=>{const s=S();Object.assign(s.sv.eq,eq);eq.main&&!s.sv.inv.includes(eq.main)&&s.sv.inv.push(eq.main);s.applyBuild(true)}})};
await pg.goto(B+'assets/README.md');await pg.evaluate(()=>localStorage.clear());
await pg.goto(B+'?mute');await W(1500);await rec();await W(600);await K('Enter',500);
for(let i=0;i<9;i++)await K('ArrowDown',380);for(let i=0;i<7;i++)await K('ArrowUp',250);await K('Enter');await ready();
await pg.evaluate(()=>{const s=S();s.souls=4000;s.pb.setPosition(1600,148);s.camY=s.camTY=0;window.__inp=()=>S().menu?{}:{restP:1}});await W(900);
await pg.evaluate(()=>S().menuKey('ok'));await W(400);
for(let i=0;i<4;i++){await pg.evaluate(()=>S().menuKey('right'));await W(300)}
await pg.evaluate(()=>{S().menuKey('down');S().menuKey('down');S().menuKey('down')});await W(200);for(let i=0;i<3;i++){await pg.evaluate(()=>S().menuKey('right'));await W(300)}
await pg.evaluate(()=>{const s=S();s.menu.sel=8;s.menuKey('ok')});await W(600);
await pg.evaluate(()=>{const s=S();s.menuKey('down');s.menuKey('ok')});await W(500);for(let i=0;i<4;i++){await pg.evaluate(()=>S().menuKey('right'));await W(450)}
await K('Escape',300);await K('Escape',300);await K('ArrowLeft',400);
for(const w of ['longsword','greatsword','dagger','spear','axe']){await pg.evaluate(w=>{arena();equip({main:w,off:null,armor:'leather'});dummy(22);let n=0;window.__inp=()=>{n++;return n===2||n===22?{atkP:1}:n===60?{heavyP:1}:{}}},w);await W(1700);await pg.evaluate(()=>S().enemies.forEach(e=>{e.dead=true;e.b.body.enable=false}))}
await pg.evaluate(()=>{arena();equip({main:'bow',off:null,armor:'leather'});dummy(110);dummy(140);let n=0;window.__inp=()=>{n++;return n===2?{atkP:1}:n===60?{heavyP:1}:{}}});await W(2200);
await pg.evaluate(()=>{arena();S().sv.stats.int=20;equip({main:'longsword',off:'wand',armor:'robe'});dummy(80);S().player.fp=999;press('iceP')});await W(1600);
for(const a of ['none','herald','iron']){await pg.evaluate(a=>{arena();S().pb.setPosition(560,148);equip({main:'dagger',off:null,armor:a});press('rollP')},a);await W(900)}
await stop();
for(const s of ['cathedral','cinderdeep']){await pg.goto(B+'?demo&boss&mute&stage='+s);await W(400);await rec();await W(7000);await stop()}
let txt='';for(let i=0;i<list.length;i++){const d=i<list.length-1?Math.min(.2,Math.max(.001,list[i+1][1]-list[i][1])):.04;txt+=`file '${list[i][0]}'\nduration ${d.toFixed(4)}\n`}
fs.writeFileSync(D+'/list.txt',txt);console.log('frames',list.length,'span',(list.at(-1)[1]-list[0][1]).toFixed(1));await br.close();
