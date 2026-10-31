// autotile pass (render-only foreground): for every stage, collision grid + static bodies are byte-identical with ?tiles=0 and on,
// the level texture changes, painting is deterministic, the PNG-atlas loader works (served via route), no page errors.
// usage: PORT=8437 node test/tiles.mjs (static server on $PORT, default 8437). EVID=dir for before_/after_ screenshots + atlases.
import { chromium } from './node_modules/playwright/index.mjs';
import { createHash } from 'crypto';import fs from 'fs';
const B=`http://127.0.0.1:${process.env.PORT||8437}/`,EV=process.env.EVID||'screenshots/tiles/';fs.mkdirSync(EV,{recursive:true});
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+m)};
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});
const H=s=>createHash('md5').update(s).digest('hex').slice(0,12);
async function run(st,q,route){const pg=await br.newPage({viewport:{width:960,height:540}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));const reqs=[];pg.on('request',r=>{if(r.url().includes('/assets/art/tiles/'))reqs.push(performance.now())});
 if(route)await route(pg);
 await pg.goto(B+'assets/README.md');await pg.evaluate(()=>localStorage.clear());
 await pg.goto(B+`?play&mute&novideo&slot=1&class=knight&stage=${st}&seed=0${q}`);
 await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:40000});await pg.waitForFunction(()=>typeof AUTOTILE==='undefined'||AUTOTILE.pending()===0,null,{timeout:20000});await pg.waitForTimeout(700);
 const r=await pg.evaluate(()=>{const s=__G.scene.getScene('stage'),lv=s.lv,sid=s.sid;
  const bodies=(s.physics.world.staticBodies.entries||[...s.physics.world.staticBodies]).map(b=>[b.x,b.y,b.width,b.height,b.checkCollision.up,b.checkCollision.down].join(',')).sort().join(';');
  const rects=[1,2,3,4].map(k=>JSON.stringify(lv.rects(k))).join('|');
  const tex=c=>{const x=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let h=0;for(let i=0;i<x.length;i+=7)h=(h*31+x[i])|0;return h};
  const t1=tex(s.textures.get('lvl_'+sid).getSourceImage()),t2=tex(lv.paint()),cov=(s.def.covers||[]).map(c=>tex(lv.paint(c.r,true))).join(',');
  return{sid,k:Array.from(lv.k).join(''),back:Array.from(lv.back).join(''),bodies,rects,t1,t2,cov,on:typeof AUTOTILE!=='undefined'&&AUTOTILE.ON,stats:typeof AUTOTILE!=='undefined'?AUTOTILE.stats[sid]:null,plats:typeof AUTOTILE!=='undefined'?AUTOTILE.stats[sid+'_plats']|0:0,nplat:s.children.list.filter(o=>o.type==='TileSprite'&&/^plat/.test((o.displayTexture||o.texture).key)).length}});
 return{pg,errs,r}}
const stages=await (async()=>{const pg=await br.newPage();await pg.goto(B+'?play&mute&novideo&slot=1&stage=ramparts');await pg.waitForFunction(()=>typeof STAGE_DEFS!=='undefined');const s=await pg.evaluate(()=>Object.keys(STAGE_DEFS));await pg.close();return s})();
console.log('stages:',stages.join(' '));
for(const st of stages){
 const A=await run(st,'&tiles=0');await A.pg.screenshot({path:EV+`before_${st}.png`});
 const Bq=await run(st,'');await Bq.pg.screenshot({path:EV+`after_${st}.png`});
 if(st===stages[0]||process.env.ATLAS){// dump code-drawn placeholder atlases (reference for Artist)
  const u=await Bq.pg.evaluate(sid=>{const S=AUTOTILE.atlas(sid);const png=A=>{if(!A)return null;const c=document.createElement('canvas');c.width=A.w;c.height=A.h;const x=c.getContext('2d'),im=x.createImageData(A.w,A.h);new Uint32Array(im.data.buffer).set(A.d);x.putImageData(im,0,0);return c.toDataURL()};return{t:png(S.tiles),o:png(S.one),d:png(S.decor)}},st);
  for(const[k,v] of Object.entries(u))if(v)fs.writeFileSync(EV+`atlas_${st}_${k}.png`,Buffer.from(v.split(',')[1],'base64'))}
 const a=A.r,b=Bq.r;
 if(fs.existsSync(`assets/art/tiles/${st}/manifest.json`))ok(b.stats&&b.stats.src==='png',`${st}: Artist art in assets/art/tiles/${st}/ is the default (src ${b.stats&&b.stats.src})`);
 ok(!a.on&&b.on,`${st}: ?tiles=0 off switch works (off=${!a.on}, on=${b.on})`);
 ok(a.k===b.k&&a.back===b.back,`${st}: tile grid identical (k ${H(a.k)} = ${H(b.k)}, back ${H(a.back)})`);
 ok(a.rects===b.rects,`${st}: collision rects identical for solid/oneway/chain/spike (${H(a.rects)})`);
 ok(a.bodies===b.bodies&&a.bodies.length>0,`${st}: static physics bodies identical (${a.bodies.split(';').length} bodies, ${H(a.bodies)})`);
 ok(a.t1!==b.t1&&b.stats&&b.stats.tiles>0,`${st}: autotiles rendered (${b.stats&&b.stats.tiles} tiles, ${b.stats&&b.stats.props} props, src ${b.stats&&b.stats.src})`);
 if(b.nplat)ok(b.plats===b.nplat,`${st}: floating plats decorated from oneway atlas (${b.plats}/${b.nplat})`);
 ok(b.t1===b.t2&&a.t1===a.t2,`${st}: painting deterministic (repaint hash equal)`);
 ok(A.errs.length===0&&Bq.errs.length===0,`${st}: no page errors ${[...A.errs,...Bq.errs].slice(0,2).join(' | ')}`);
 await A.pg.close();await Bq.pg.close()}
// PNG loader: serve the dumped ramparts placeholder as an Artist atlas (replace a colour so it is distinguishable)
{const st=stages[0],f=n=>fs.readFileSync(EV+`atlas_${st}_${n}.png`);
 const route=async pg=>{await pg.route('**/assets/art/tiles/index.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({stages:[st]})}));
  await pg.route(`**/assets/art/tiles/${st}/manifest.json`,r=>r.fulfill({contentType:'application/json',body:JSON.stringify({stage:st,tile:8,mode:'overlay',variants:4,tiles:'tiles.png',oneway:'oneway.png',decor:'decor.png',decorCount:5,decorDensity:.2})}));
  for(const[n,k] of [['tiles','t'],['oneway','o'],['decor','d']])await pg.route(`**/assets/art/tiles/${st}/${n}.png`,r=>r.fulfill({contentType:'image/png',body:f(k)}))};
 const none=async pg=>pg.route('**/assets/art/tiles/index.json',r=>r.fulfill({contentType:'application/json',body:'{"stages":[]}'}));
 const P=await run(st,'',route),Q=await run(st,'',none);
 ok(Q.r.stats&&Q.r.stats.src==='code',`fallback: with no art listed, ${st} uses code-drawn placeholders (src ${Q.r.stats&&Q.r.stats.src})`);
 ok(P.r.stats&&P.r.stats.src==='png'&&P.r.t1!==Q.r.t1,`png loader: ${st} uses PNG atlas from assets/art/tiles/${st}/ (src ${P.r.stats&&P.r.stats.src})`);
 ok(P.r.k===Q.r.k&&P.r.bodies===Q.r.bodies,`png loader: collision unchanged with PNG atlas`);
 ok(P.r.stats.props>Q.r.stats.props,`png loader: manifest decorDensity honoured (${P.r.stats.props} > ${Q.r.stats.props} props)`);
 ok(P.errs.length===0,'png loader: no page errors '+P.errs.join('|'));await P.pg.close();await Q.pg.close()}
// r20 P3-2: no tile art is requested before the title is ready; it arrives lazily after
{const pg=await br.newPage();const rq=[];pg.on('request',r=>{if(r.url().includes('/assets/art/tiles/'))rq.push(r.url())});await pg.goto(B+'assets/README.md');await pg.evaluate(()=>localStorage.clear());
 await pg.goto(B+'?mute');await pg.waitForFunction(()=>performance.getEntriesByName('title-ready').length,null,{timeout:20000});const atReady=rq.length;
 await pg.waitForFunction(()=>Object.keys(AUTOTILE.LOADED).length>=10,null,{timeout:20000}).catch(()=>{});const later=await pg.evaluate(()=>Object.keys(AUTOTILE.LOADED).length);
 ok(atReady===0,`lazy: no tile-art requests before title-ready (${atReady})`);ok(later>=10,`lazy: title idles in all atlases afterwards (${later} stages, ${rq.length} requests)`);await pg.close()}
await br.close();console.log(`\nTILES ${pass}/${pass+fail}`);process.exit(fail?1:0)
