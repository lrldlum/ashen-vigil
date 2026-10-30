// Headless checks for the text-readability pass: the original mixed-case "Vigil 5x7" pixel font at integer scale with a 1px outline,
// sentence/title case instead of all-caps blocks, panels behind messages, longer on-screen times, and the TEXT SIZE option (saved).
// usage: node test/textfix.mjs   (server on :8171). Writes screenshots/text/test/*.png
import { chromium } from './node_modules/playwright/index.mjs';import fs from 'fs';
const B='http://127.0.0.1:8171/',SH='screenshots/text/test/';fs.mkdirSync(SH,{recursive:true});
let pass=0,fail=0;const ok=(n,c,v)=>{c?pass++:fail++;console.error((c?'PASS ':'FAIL ')+n+' '+JSON.stringify(v).slice(0,400))};
const br=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader']});const pg=await br.newPage({viewport:{width:1280,height:720}});
const errs=[];pg.on('pageerror',e=>errs.push(e.message));const ev=(f,a)=>pg.evaluate(f,a),wait=ms=>pg.waitForTimeout(ms);
const go=async q=>{await pg.goto(B+q);await pg.waitForFunction(()=>window.__G&&__G.scene.getScene('stage')&&__G.scene.getScene('stage').player&&__G.scene.getScene('stage').sys.isActive(),null,{timeout:30000});await wait(800);await ev(()=>{window.S=()=>__G.scene.getScene('stage')})};
await pg.goto(B+'assets/README.md');await ev(()=>localStorage.clear());await go('?play&mute&slot=1&class=knight&stage=ramparts');
// 1. font: every printable glyph exists, 5 wide, caps 7 rows, lowercase present, integer advance 6
const f=await ev(()=>{const ks=Object.keys(FONT2),miss=[...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:;!?\'-+/()<>%'].filter(c=>!FONT2[c]);return{n:ks.length,miss,adv:textW('ab')-textW('a'),big:TXT.big}});
ok('vigil_font_complete_mixed_case_integer_advance',f.n>=80&&!f.miss.length&&f.adv===6&&f.big===1,f);
// 2. sentence / title case instead of all-caps blocks; names and key letters stay capitalised
const c=await ev(()=>({a:nice('RESTED. FLASKS REFILLED'),b:nice('BONFIRE LIT - GATE VIGIL'),c:nice('X  ATTACK (TAP AGAIN: COMBO)'),d:nice('THE ASH KEEPER'),e:nice('Already mixed'),f:nice('LV 9')}));
ok('mixed_case_not_all_caps',c.a==='Rested. Flasks refilled'&&/^Bonfire lit - Gate Vigil$/.test(c.b)&&c.c.startsWith('X  Attack')&&c.d==='The Ash Keeper'&&c.e==='Already mixed'&&c.f==='LV 9',c);
// 3. crisp: pixel-art rendering with rounded pixels; glyph runs are whole-pixel rects at integer scale
const crisp=await ev(()=>({pixelArt:__G.config.pixelArt,round:__G.config.roundPixels,runs:glyphRuns(1,'a').every(r=>r.every(Number.isInteger))}));
ok('pixel_art_integer_rendering',crisp.pixelArt&&crisp.round&&crisp.runs,crisp);
// 4. messages stay up longer and sit on a panel
const m=await ev(()=>{S().say('THE GATE STANDS OPEN',2);return S().msg.t});ok('messages_stay_longer',m>=3.5,{t:m});await wait(300);await pg.screenshot({path:SH+'say_panel.png'});
const pl=await ev(async()=>{const s=S();s.pops=[];s.pop('+ EMBER',s.player.x,s.player.y-20);await new Promise(r=>setTimeout(r,1200));return s.pops.length});ok('pickup_text_lingers',pl===1,{left:pl});
// 5. text size option in the pause menu, toggled with T, saved in the save and restored on reload
await ev(()=>S().togglePause());await wait(200);await pg.keyboard.press('t');await wait(200);await pg.screenshot({path:SH+'pause_small.png'});
const s1=await ev(()=>({big:TXT.big,sv:S().sv.textSize,saved:Save.load().textSize}));ok('text_size_toggle_saved',s1.big===0&&s1.sv==='small'&&s1.saved==='small',s1);
await go('?play&mute&slot=1&class=knight&stage=ramparts');const s2=await ev(()=>({big:TXT.big,w:textW('abc')}));ok('text_size_restored_from_save',s2.big===0&&s2.w===11,s2);
await ev(()=>S().togglePause());await pg.keyboard.press('t');await wait(200);await pg.screenshot({path:SH+'pause_large.png'});const s3=await ev(()=>({big:TXT.big,saved:Save.load().textSize}));ok('text_size_back_to_large',s3.big===1&&s3.saved==='large',s3);
// 6. lore wraps inside its panel at the large size
await go('?play&mute&slot=1&class=knight&stage=shrine');const lw=await ev(()=>{const L=wrapText(nice(LORE.shrine1.join(' ')),258);return{n:L.length,max:Math.max(...L.map(l=>textW(l)))}});ok('lore_wraps_inside_panel',lw.max<=258&&lw.n>=3,lw);
ok('no_page_errors',errs.length===0,errs);
console.log(JSON.stringify({pass,fail}));await br.close();process.exit(fail?1:0);
