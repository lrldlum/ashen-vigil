// tiles pass: every zone has its own ground/wall material, with no shared tile; checks synthetic patches and the live level texture
import { chromium } from './node_modules/playwright/index.mjs';
import { createHash } from 'crypto';
const B=`http://127.0.0.1:${process.env.PORT||8171}/`;let pass=0,fail=0;const ok=(c,m)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+m)};
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});const pg=await br.newPage({viewport:{width:1280,height:720}});
const errs=[];pg.on('pageerror',e=>errs.push(e.message));
const S=['ramparts','cathedral','cinderdeep','belltower','catacomb','drowned','keep','spire','cloister','throne'],HS={},HB={},HO={},COL={};
for(const st of S){await pg.goto(B+'assets/README.md');await pg.evaluate(()=>localStorage.clear());await pg.goto(B+`?play&mute&slot=1&class=knight&stage=${st}&seed=0`);
 await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});await pg.waitForTimeout(500);
 const r=await pg.evaluate(sid=>{const M=TILEMAT[sid];if(!M)return null;const sol=[],bk=[],one=[];for(let y=0;y<32;y++)for(let x=0;x<64;x++){sol.push(M.c[M.solid({X:x+1000,Y:y,dy:y,u:x&7,vv:y&7,i:x>>3,j:y>>3,lE:false,rE:false,bE:false})]);bk.push(M.c[M.back(x+1000,y+40)]);if(y<8)one.push(M.c[M.one(x,y,x&7,y)])}
  const s=__G.scene.getScene('stage'),cv=s.textures.get('lvl_'+sid).getSourceImage(),d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data,set=new Set();for(let i=0;i<d.length;i+=16)if(d[i+3])set.add((d[i]<<16)|(d[i+1]<<8)|d[i+2]);
  const pal=new Set(M.pal.map(c=>parseInt(c.slice(1),16)));let hit=0;for(const c of set)if(pal.has(c))hit++;return{sol:sol.join(','),bk:bk.join(','),one:one.join(','),cols:[...set],hit,solids:s.solids.length}},st);
 ok(!!r,`${st}: has its own material`);if(!r)continue;HS[st]=createHash('md5').update(r.sol).digest('hex');HB[st]=createHash('md5').update(r.bk).digest('hex');HO[st]=createHash('md5').update(r.one).digest('hex');COL[st]=new Set(r.cols);
 ok(r.hit>=5,`${st}: level texture painted with its material (${r.hit} palette colours present)`);ok(r.solids>0,`${st}: collision bodies built (${r.solids})`)}
for(const[n,H]of[['ground',HS],['wall',HB],['ledge',HO]]){const v=Object.values(H);ok(new Set(v).size===S.length,`${n} tile hash unique per zone (${new Set(v).size}/${S.length})`)}
let maxJ=0;for(const a of S)for(const b of S)if(a<b){let i=0;for(const c of COL[a])if(COL[b].has(c))i++;maxJ=Math.max(maxJ,i/(COL[a].size+COL[b].size-i))}
ok(maxJ<.25,`no two zones share a tile palette (max colour overlap ${maxJ.toFixed(2)})`);
ok(errs.length===0,'no page errors '+errs.join('|'));
console.log(`\n${pass} passed, ${fail} failed`);console.log(JSON.stringify({pass,fail}));await br.close();process.exit(fail?1:0);
