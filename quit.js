// ASHEN VIGIL — Quit to Main Menu from the pause screen.
// Pause, then Enter / pad A / tap "QUIT TO MAIN MENU" -> Yes/No confirm (No is preselected). A / Enter / Y confirms the
// highlighted choice, B / Esc / N cancels; arrows / D-pad switch; touch taps YES or NO.
// Quitting saves first (souls, bonfire, unlocks, play time), then returns to the title.
// Co-op: a quitting host sends 'bye' so the guest sees "Host left" and goes to the title; a quitting guest just disconnects.
'use strict';
const QUIT_GUARD_MS=600;const QUIT_ROW={x:206,y:6,w:110,h:10};
const dropJoin=()=>{try{Q.delete('join');Q.delete('host');const u=new URL(location.href);u.searchParams.delete('join');u.searchParams.delete('host');history.replaceState(null,'',u)}catch(e){}};
const quitToast=m=>{try{let el=document.getElementById('quitToast');if(!el){el=document.createElement('div');el.id='quitToast';el.style.cssText='position:fixed;left:50%;top:40%;transform:translateX(-50%);font:16px monospace;color:#f0e6c8;background:rgba(10,8,20,.9);border:1px solid #8a6a3a;padding:6px 14px;pointer-events:none;z-index:60';document.body.appendChild(el)}el.textContent=m;el.style.display='block';clearTimeout(el._t);el._t=setTimeout(()=>el.style.display='none',3500)}catch(e){}};
(()=>{const SP=Stage.prototype;
 const tp=SP.togglePause;SP.togglePause=function(){if(this.quitQ){this.quitQ=null;this.sfx('menu',.2);return}return tp.call(this)};
 SP.quitOpen=function(){if(!this.paused||this.quitQ)return;this.quitQ={sel:1,t:0,at:performance.now()};this.sfx('menu',.2)};
 SP.quitPick=function(yes){if(!this.quitQ)return;if(yes&&performance.now()-this.quitQ.at<QUIT_GUARD_MS){this.quitQ.sel=1;this.quitQ.at=performance.now();this.sfx('menu',.1);return}// r12: YES only counts after a 0.6 s calm on the dialog, so mashed keys can't quit
 if(!yes){this.quitQ=null;this.sfx('menu',.2);return}this.quitNow()};
 SP.quitNow=function(){const sv=this.sv;this.quitQ=null;this.quitting=1;
  try{Save.write({...sv,souls:this.souls,time:this.playT,stain:sv.stain||null})}catch(e){}
  try{if(NET.host()&&NET.linked()){NET.send({t:'bye'});setTimeout(()=>NET.leave(),250)}else if(!NET.host()&&(NET.peer||NET.conn))NET.leave()}catch(e){}
  dropJoin();this.paused=false;try{this.physics.resume()}catch(e){}this.stats.quits=(this.stats.quits||0)+1;window.__quitAt=Date.now();this.scene.start('title')};
 const cr=SP.create;SP.create=function(...a){this.quitQ=null;this.quitting=0;const r=cr.apply(this,a);
  this.input.keyboard.on('keydown',e=>{if(!this.paused||e.repeat)return;const Q=this.quitQ;
   if(!Q){if(e.key==='Enter'||e.key==='q'||e.key==='Q')this.quitOpen();return}
   if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){Q.sel^=1;Q.at=performance.now();this.sfx('menu',.15)}
   else if(e.key==='Enter'||e.key==='z'||e.key==='Z'||e.key===' ')this.quitPick(Q.sel===0);else if(e.key==='y'||e.key==='Y')this.quitPick(true);else if(e.key==='n'||e.key==='N')this.quitPick(false)});
  this.input.on('pointerdown',p=>{if(!this.paused)return;const Q=this.quitQ,x=p.x,y=p.y;
   if(!Q){if(x>=QUIT_ROW.x&&x<QUIT_ROW.x+QUIT_ROW.w&&y>=QUIT_ROW.y-2&&y<QUIT_ROW.y+QUIT_ROW.h)this.quitOpen();return}
   if(y>=96&&y<112){if(x>=104&&x<152)this.quitPick(true);else if(x>=168&&x<216)this.quitPick(false)}});
  return r};
 const dp=SP.drawPause;SP.drawPause=function(g){dp.call(this,g);const pad=typeof PAD!=='undefined'&&PAD.connected();
  {const ql=this.touch&&!pad?'QUIT TO MENU':(pad?'A':'ENTER')+'  QUIT TO MENU',qw=textW(ql);QUIT_ROW.x=W-6-qw;QUIT_ROW.w=qw;drawText(g,ql,QUIT_ROW.x,QUIT_ROW.y,0xffb04a)}const Q=this.quitQ;if(!Q)return;
  g.fillStyle(0x05040b,.9);g.fillRect(0,0,W,H);g.fillStyle(0x07050f);g.fillRect(80,62,160,58);g.fillStyle(0x7a5a24);g.fillRect(80,62,160,1);g.fillRect(80,119,160,1);g.fillRect(80,62,1,58);g.fillRect(239,62,1,58);
  const t1='QUIT TO THE MAIN MENU?',t2='PROGRESS IS SAVED'+(NET.host()&&NET.linked()?' - YOUR COMPANION LEAVES':'');drawText(g,t1,Math.round(W/2-textW(t1)/2),70,0xffe2a8);drawText(g,t2.length>36?'PROGRESS IS SAVED':t2,Math.round(W/2-textW(t2.length>36?'PROGRESS IS SAVED':t2)/2),82,0x8a86c0);
  [['YES',104],['NO',168]].forEach(([s,x],i)=>{const on=Q.sel===i;g.fillStyle(on?0x3a2e58:0x15112a);g.fillRect(x,96,48,16);if(on){g.fillStyle(0xffe2a8);g.fillRect(x,96,48,1);g.fillRect(x,111,48,1)}drawText(g,s,x+24-Math.round(textW(s)/2),100,on?0xffe2a8:0xa8a0c8)});
  const h=pad?'A CHOOSE   B CANCEL':'ENTER CHOOSE   ESC CANCEL';drawText(g,h,Math.round(W/2-textW(h)/2),124,0x6a6490)};
 // the guest hears the host leave
 const rv=NET.recv.bind(NET);NET.recv=function(d){if(d&&d.t==='bye'&&this.guest()){const S=this.scene;this.leave();dropJoin();quitToast('Host left');window.__hostLeft=Date.now();try{if(S&&S.sys.isActive()){S.paused=false;S.scene.start('title')}}catch(e){}return}return rv(d)};
})();
