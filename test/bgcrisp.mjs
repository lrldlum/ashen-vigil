// bg crisp: every non-transparent pixel in the Bell Tower far/near mountain textures is fully opaque (no anti-aliased rows)
import { chromium } from './node_modules/playwright/index.mjs';
const B=`http://127.0.0.1:${process.env.PORT||8171}/`;let pass=0,fail=0;const ok=(c,m)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+m)};
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});const pg=await br.newPage({viewport:{width:1280,height:720}});
const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await pg.goto(B+'?play&mute&novideo&slot=1&class=knight&stage=belltower&seed=0');
await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player,null,{timeout:30000});await pg.waitForTimeout(800);
const r=await pg.evaluate(()=>{const s=__G.scene.getScene('stage'),o={};for(const k of['far','near']){const c=s.textures.get(k+'_belltower').getSourceImage(),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0,bad=0;for(let i=3;i<d.length;i+=4)if(d[i]){n++;if(d[i]!==255)bad++}o[k]={w:c.width,n,bad}}return o});
for(const k of['far','near'])ok(r[k].n>0&&r[k].bad===0,`${k}_belltower (${r[k].w}px): ${r[k].n} opaque px, ${r[k].bad} partial-alpha px`);
ok(!errs.length,'no page/console errors '+errs.join('|'));console.log(`\n${pass} passed, ${fail} failed`);await br.close();process.exit(fail?1:0);
