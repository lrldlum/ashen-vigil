// bg pass: every stage gets its own background (sky, far and near layers hashed from the live textures)
import { chromium } from './node_modules/playwright/index.mjs';
import { createHash } from 'crypto';
const B=`http://127.0.0.1:${process.env.PORT||8171}/`;let pass=0,fail=0;const ok=(c,m)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+m)};
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});const pg=await br.newPage({viewport:{width:1280,height:720}});
const errs=[];pg.on('pageerror',e=>errs.push(e.message));
const S=['ramparts','cathedral','cinderdeep','belltower','catacomb','drowned','keep','spire','cloister','throne'],H={};
for(const st of S){await pg.goto(B+'assets/README.md');await pg.evaluate(()=>localStorage.clear());await pg.goto(B+`?play&mute&novideo&slot=1&class=knight&stage=${st}&seed=0`);
 await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});await pg.waitForTimeout(800);
 const r=await pg.evaluate(sid=>{const s=__G.scene.getScene('stage'),tx=sid==='ramparts'?'':'_'+sid;const out={};for(const k of['sky','far','near'])out[k]=s.textures.get(k+tx).getSourceImage().toDataURL();out.amb=!!s.gamb;out.layers=s.children.list.filter(o=>o.depth<=-9.5).length;return out},st);
 H[st]=Object.fromEntries(['sky','far','near'].map(k=>[k,createHash('md5').update(r[k]).digest('hex')]));
 ok(r.layers>=3,`${st}: ${r.layers} parallax layers`);if(st!=='ramparts')ok(r.amb,`${st}: ambient motion layer`)}
for(const k of['far','near','sky']){const v=S.map(s=>H[s][k]);ok(new Set(v).size===S.length,`${k} layer hash unique per stage (${new Set(v).size}/${S.length})`)}
ok(errs.length===0,'no page errors '+errs.join('|'));
console.log(`\n${pass} passed, ${fail} failed`);await br.close();process.exit(fail?1:0);
