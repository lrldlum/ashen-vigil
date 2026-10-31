// r15: lore stones show one prompt (E Read, no '^ READ'); each legacy body armor looks distinct on the pixel hero.
// usage: PORT=8171 node test/r15.mjs  -> screenshots/r15/lore_prompt.png, screenshots/r15/legacy_armor_sheet.png
import { chromium } from './node_modules/playwright/index.mjs';import fs from 'fs';import os from 'os';import path from 'path';import {execSync} from 'child_process';
const B=`http://127.0.0.1:${process.env.PORT||8171}/`,SH='screenshots/r15/';fs.mkdirSync(SH,{recursive:true});const TD=fs.mkdtempSync(path.join(os.tmpdir(),'r15-'));
let pass=0,fail=0;const ok=(n,c,d)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+n+' '+JSON.stringify(d).slice(0,400))};
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});const pg=await br.newPage({viewport:{width:960,height:540}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
const S=(f,a)=>pg.evaluate(f,a),W8=ms=>pg.waitForTimeout(ms);
await pg.goto(B+'assets/README.md');await S(()=>localStorage.clear());await pg.goto(B+'?play&mute&novideo&slot=1&class=knight&stage=ramparts');
await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').pxc,null,{timeout:30000});await W8(1000);
await S(()=>{window.s=__G.scene.getScene('stage');s.msg=null;s.player.hp=s.player.hpMax=9999;s.enemies.forEach(e=>{e.dead=true;e.b.body.enable=false})});
// 1. lore stone: only the E Read hint
const lo=await S(async()=>{const l=(s.def.lore||[])[0];s.pb.setPosition(l.x,(l.y||GY)-10);s.pb.setVelocity(0,0);s.player.state='idle';await new Promise(r=>setTimeout(r,700));
 const seen=new Set(),d0=window.drawText;window.drawText=function(g,t,...a){seen.add(String(t));return d0.call(this,g,t,...a)};await new Promise(r=>setTimeout(r,300));window.drawText=d0;return{old:[...seen].some(t=>/\^ ?READ/.test(t)),hint:s.ihint,id:l.id}});
ok('lore_stone_shows_only_E_read',!lo.old&&lo.hint==='Read',lo);await pg.screenshot({path:SH+'lore_prompt.png'});
// 2. legacy body armors: each a distinct overlay or tint on the pixel hero
const ids=['none','robe','leather','herald','knight','apron','rime','iron'];const look={};const tiles=[];
for(const id of ids){const r=await S(async id=>{s.sv.eq.armor=id==='none'?'none':id;if(!s.sv.inv.includes(id))s.sv.inv.push(id);s.pb.setPosition(400,GY-10);s.pb.setVelocity(0,0);s.player.state='idle';s.player.f=1;await new Promise(r=>setTimeout(r,500));
  const sp=s.pxc&&s.pxc.rig&&s.pxc.rig.ov.chest;const vis=!!(sp&&sp.visible);const cam=s.cam;return{key:vis?sp.texture.key:'base',tint:vis?sp.tintTopLeft:null,sx:Math.round((s.player.x-cam.scrollX)*3),sy:Math.round((s.player.y-cam.scrollY)*3)}},id);
 look[id]=r.key+'|'+r.tint;const f=`${TD}/${id}.png`;await pg.screenshot({path:f,clip:{x:Math.max(0,r.sx-60),y:Math.max(0,r.sy-150),width:120,height:170}});tiles.push(f)}
const uniq=new Set(Object.values(look)).size;ok('legacy_armors_look_distinct',uniq===ids.length,look);
try{fs.writeFileSync(TD+'/m.py',`from PIL import Image,ImageDraw
import json
fs=json.loads('${JSON.stringify(tiles)}');ims=[Image.open(f) for f in fs];W=sum(i.width for i in ims);H=max(i.height for i in ims)+16
o=Image.new('RGB',(W,H),(10,8,20));d=ImageDraw.Draw(o);x=0
for f,i in zip(fs,ims):
    o.paste(i,(x,16));d.text((x+4,2),f.split('/')[-1][:-4],fill=(255,226,168));x+=i.width
o.save('${SH}legacy_armor_sheet.png')`);execSync(`python3 ${TD}/m.py`)}catch(e){console.log('sheet fail',e.message)}
ok('no_page_errors',errs.length===0,errs.slice(0,3));fs.rmSync(TD,{recursive:true,force:true});console.log(JSON.stringify({pass,fail}));await br.close();process.exit(fail?1:0);
