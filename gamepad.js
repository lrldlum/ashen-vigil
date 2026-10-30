// ASHEN VIGIL — Gamepad API support (standard / Xbox mapping). Polls navigator.getGamepads() every animation frame,
// listens for gamepadconnected / gamepaddisconnected, and exposes:
//  - PAD.take(slot): gameplay state for the player using that pad slot (held + latched presses), merged into Stage.readInput
//  - menu navigation: in any menu (title, slots, class pick, pause, level-up / upgrade menus, victory, ending) pad edges are
//    replayed as the same keys the keyboard uses (arrows, Enter, Escape, T), so every screen the keyboard reaches is pad-navigable
//  - a small DOM toast ("Controller connected") and a "Press any button" hint until a pad is seen
// Button map (W3C standard mapping, Xbox labels):
//  A(0) jump / confirm   B(1) dodge roll / back   X(2) attack   Y(3) heavy attack
//  LB(4) parry/block     RB(5) bolt spell         LT(6) ice spell   RT(7) dome spell
//  View(8) flask         Start(9) pause           L3(10) heal spell  R3(11) bless
//  D-pad(12-15) / left stick: move, up = interact/rest, down = drop; in menus: navigate
'use strict';
const PAD=(()=>{
 const DZ=0.2,B={A:0,B:1,X:2,Y:3,LB:4,RB:5,LT:6,RT:7,VIEW:8,START:9,L3:10,R3:11,UP:12,DN:13,L:14,R:15};
 const slots=[];// slot -> gamepad index (first pad = slot 0 = this machine's player; in co-op each client's own pad drives its own player)
 const prev={},latch={},rep={};let seen=false,hintEl=null,toastEl=null,toastT=0;
 const KC={ArrowUp:38,ArrowDown:40,ArrowLeft:37,ArrowRight:39,Enter:13,Escape:27,t:84};
 const key=(k)=>{for(const type of['keydown','keyup']){const e=new KeyboardEvent(type,{key:k,bubbles:true,cancelable:true});Object.defineProperty(e,'keyCode',{get:()=>KC[k]});Object.defineProperty(e,'which',{get:()=>KC[k]});window.dispatchEvent(e)}PAD.synth.push(k)};
 const pads=()=>{try{return Array.from((navigator.getGamepads&&navigator.getGamepads())||[]).filter(Boolean)}catch(e){return[]}};
 const pressed=(g,i)=>{const b=g.buttons[i];return!!b&&(typeof b==='object'?(b.pressed||b.value>.5):b>.5)};
 const read=g=>{const ax=g.axes[0]||0,ay=g.axes[1]||0,o={};for(const k in B)o[k]=pressed(g,B[k]);
  o.l=o.L||ax<-DZ;o.r=o.R||ax>DZ;o.up=o.UP||ay<-.5;o.dn=o.DN||ay>.5;o.mUp=o.UP||ay<-.5;o.mDn=o.DN||ay>.5;o.mL=o.L||ax<-.5;o.mR=o.R||ax>.5;o.any=g.buttons.some((b,i)=>pressed(g,i))||Math.abs(ax)>DZ||Math.abs(ay)>DZ;return o};
 const ui=()=>{if(hintEl||!document.body)return;const css='position:fixed;left:50%;transform:translateX(-50%);font:12px monospace;color:#f0e6c8;background:rgba(10,8,20,.85);border:1px solid #6a5a8a;padding:3px 8px;pointer-events:none;z-index:50;';
  hintEl=document.createElement('div');hintEl.id='padHint';hintEl.style.cssText=css+'top:6px;opacity:.75;display:none';hintEl.textContent='Controller? Press any button';document.body.appendChild(hintEl);
  toastEl=document.createElement('div');toastEl.id='padToast';toastEl.style.cssText=css+'top:8px;display:none';document.body.appendChild(toastEl)};
 const toast=(m)=>{ui();if(!toastEl)return;toastEl.textContent=m;toastEl.style.display='block';toastT=performance.now()+2500;PAD.lastToast=m};
 const connect=g=>{if(slots.includes(g.index))return;slots.push(g.index);seen=true;if(hintEl)hintEl.style.display='none';toast('Controller connected'+(slots.length>1?' (P'+slots.length+')':''))};
 const disconnect=idx=>{const i=slots.indexOf(idx);if(i<0)return;slots.splice(i,1);delete prev[idx];toast('Controller disconnected');if(!slots.length&&hintEl)hintEl.style.display='block'};
 window.addEventListener('gamepadconnected',e=>e.gamepad&&connect(e.gamepad));
 window.addEventListener('gamepaddisconnected',e=>e.gamepad&&disconnect(e.gamepad.index));
 // menu mode = anything except live gameplay in the stage
 const mode=()=>{const G=window.__G;if(!G)return'menu';const s=G.scene.getScene('stage');if(s&&s.sys.isActive()){if(s.paused)return'pause';if(s.menu||s.victory)return'menu';return'game'}return'menu'};
 const edge=(id,k,on,now,repeat)=>{const r=rep[id+k]||(rep[id+k]={on:false,t:0});if(on&&!r.on){r.on=true;r.t=now+380;return true}if(!on){r.on=false;return false}if(repeat&&now>r.t){r.t=now+140;return true}return false};
 function poll(){const now=performance.now();const list=pads();
  for(const g of list){if(!slots.includes(g.index)){const s=read(g);if(s.any||g.connected)connect(g)}}
  for(const idx of slots.slice())if(!list.some(g=>g.index===idx))disconnect(idx);
  const md=mode();PAD.modeNow=md;
  slots.forEach((idx,slot)=>{const g=list.find(g=>g.index===idx);if(!g)return;const s=read(g),p=prev[idx]||{},L=latch[slot]||(latch[slot]={});
   for(const k of['A','B','X','Y','LB','RB','LT','RT','VIEW','START','L3','R3','up'])if(s[k]&&!p[k])L[k]=1;
   L.held=s;prev[idx]=s;
   if(slot!==0)return;// menus follow the first pad
   if(md==='menu'){if(edge(idx,'u',s.mUp,now,1))key('ArrowUp');if(edge(idx,'d',s.mDn,now,1))key('ArrowDown');if(edge(idx,'l',s.mL,now,1))key('ArrowLeft');if(edge(idx,'r',s.mR,now,1))key('ArrowRight');
    if(edge(idx,'a',s.A,now))key('Enter');if(edge(idx,'b',s.B,now))key('Escape');if(edge(idx,'s',s.START,now))key('Enter');for(const k in L)if(k!=='held')delete L[k]}
   else if(md==='pause'){if(edge(idx,'s',s.START,now)||edge(idx,'b',s.B,now))key('Escape');if(edge(idx,'y',s.Y,now))key('t');for(const k in L)if(k!=='held')delete L[k]}
   else{for(const k of['u','d','l','r','a','b'])edge(idx,k,s[{u:'mUp',d:'mDn',l:'mL',r:'mR',a:'A',b:'B'}[k]],now);if(edge(idx,'s',s.START,now)){key('Escape');delete L.START}}});
  if(toastEl&&toastT&&now>toastT){toastEl.style.display='none';toastT=0}
  ui();if(hintEl){const G=window.__G,t=G&&G.scene.getScene('title');hintEl.style.display=(!slots.length&&t&&t.sys.isActive())?'block':'none'}requestAnimationFrame(poll)}
 const PAD={synth:[],slots,lastToast:null,modeNow:null,
  connected:()=>slots.length,
  // gameplay state for a slot; presses are latched until read so a tap between frames is never lost
  take(slot=0){const L=latch[slot];if(!L||!L.held||slots[slot]===undefined)return null;const h=L.held,o={l:h.l,r:h.r,up:h.up,dn:h.dn,jump:h.A,jumpP:!!L.A,atkP:!!L.X,heavyP:!!L.Y,rollP:!!L.B,parryP:!!L.LB,boltP:!!L.RB,iceP:!!L.LT,domeP:!!L.RT,flaskP:!!L.VIEW,upP:!!L.up,healP:!!L.L3,blessP:!!L.R3};
   for(const k in L)if(k!=='held')delete L[k];return o}};
 requestAnimationFrame(poll);
 return PAD})();
