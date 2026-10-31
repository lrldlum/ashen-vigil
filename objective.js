// ASHEN VIGIL — "what's next": the next stage and lord are always obvious.
// HUD: a small 'Next: <stage>, <lord>' line under the souls counter (hidden in menus, intros, lord fights and victory cards).
// Pause: the same line plus 'The road' - every lord in order, cleared ones dimmed with a check and the name struck through, the next one gold.
// Home (the Ash Shrine): a bobbing marker over the door or road that leads to the next lord; cleared doors carry a small check.
// Co-op: the guest follows the host's progress (NET.prog carries the host's lords).
(()=>{const SP=Stage.prototype;
 const OBJ=[['ramparts','warden'],['cathedral','cantor'],['cinderdeep','king'],['belltower','toller'],['catacomb','smith'],['drowned','abbess'],['keep','marshal'],['spire','astronomer'],['cloister','prioress'],['throne','heir']];
 const DOOR={belltower:'stair',catacomb:'descent',drowned:'well',keep:'gate',spire:'lift',cloister:'arch',throne:'sanctum'};
 const short=n=>String(n).replace(/^THE /,'').replace(/^VULCREST THE /,'');
 window.OBJECTIVE_ORDER=OBJ;
 SP.objLords=function(){return(NET.guest()&&this.hostLords)||(this.sv&&this.sv.lords)||[]};
 SP.nextObj=function(){const L=this.objLords(),o=OBJ.find(([s,k])=>!L.includes(k));if(!o)return null;const d=STAGE_DEFS[o[0]];return{sid:o[0],kind:o[1],stage:d.name,boss:d.boss.name}};
 SP.objText=function(){const o=this.nextObj();return o?'NEXT: '+o.stage+', '+short(o.boss):'ALL LORDS ARE ASH'};
 const hud=SP.drawHUD;SP.drawHUD=function(){const r=hud.apply(this,arguments);
  if(!this.def||this.victory||this.menu||this.paused||this.cine||this.bossState==='fight'||this.bossState==='dying'||this.quitQ||this.loreView)return r;
  const g=this.gu,s=this.objText(),sw=textW(s),y=H-(TXT.big?12:10),x=Math.round(W/2-sw/2);g.fillStyle(0x07050f,.5);g.fillRect(x-3,y-2,sw+6,TXT.big?11:9);drawText(g,s,x,y,0xb8a878,1,0x07050f,.8);return r};
 const pz=SP.drawPause;SP.drawPause=function(g){pz.call(this,g);const o=this.nextObj(),L=this.objLords(),t=this.t||0;
  // the road: one node per lord in order - cleared dimmed with a check, the next one gold; the line below names the next stage and lord
  const n=OBJ.length,x0=Math.round(W/2-(n-1)*10),y=H-(TXT.big?27:24);g.fillStyle(0x3a3657);g.fillRect(x0,y,(n-1)*20,1);
  OBJ.forEach(([sid,k],i)=>{const x=x0+i*20,done=L.includes(k),nx=o&&o.kind===k;
   if(done){g.fillStyle(0x4a4868);g.fillRect(x-3,y-3,7,7);g.fillStyle(0x7ad07a);g.fillRect(x-2,y,1,1);g.fillRect(x-1,y+1,1,1);g.fillRect(x,y,1,1);g.fillRect(x+1,y-1,1,1);g.fillRect(x+2,y-2,1,1)}
   else if(nx){const p=Math.sin(t*6)>0?1:0;g.fillStyle(0xffd27a);g.fillRect(x-3-p,y-3-p,7+2*p,7+2*p);g.fillStyle(0x07050f);g.fillRect(x-1,y-1,3,3)}
   else{g.fillStyle(0x2a2640);g.fillRect(x-2,y-2,5,5);g.fillStyle(0x6b67a0);g.fillRect(x-1,y-1,3,3)}});
  const s=this.objText();drawText(g,s,Math.round(W/2-textW(s)/2),H-(TXT.big?14:12),0xffe2a8);
  if(L.length){const last=OBJ.filter(([,k])=>L.includes(k)).pop(),cw=TXT.big?6:4;let ln=short(STAGE_DEFS[last[0]].boss.name);while(ln.length>3&&textW(ln)>x0-12)ln=ln.slice(0,-1);const lw=textW(ln),lx=x0-lw-8;drawText(g,ln,lx,y-3,0x5a5878);g.fillStyle(0x7a7898);g.fillRect(lx,y+(TXT.big?1:0),lw,1)}};
 const ds=SP.drawStory;SP.drawStory=function(g,ga){const r=ds.apply(this,arguments);const D=this.def;if(!D||!D.hub)return r;const L=this.objLords(),o=this.nextObj(),t=this.t;
  for(const[sid,k]of OBJ){const dk=DOOR[sid];if(dk&&D[dk]&&L.includes(k)){const x=D[dk].x;g.fillStyle(0x7ad07a);g.fillRect(x-3,GY-50,2,2);g.fillRect(x-1,GY-48,2,2);g.fillRect(x+1,GY-50,2,2);g.fillRect(x+3,GY-52,2,2)}}
  if(o){const dk=DOOR[o.sid],x=dk&&D[dk]?D[dk].x:D.exit,b=Math.round(Math.sin(t*4)*2),y=GY-96+b;g.fillStyle(0xffd27a);for(let i=0;i<5;i++)g.fillRect(x-4+i,y+i,9-2*i,1);g.fillRect(x-1,y-6,3,6);if(ga)glow(ga,x,y,10,0xffb04a,.35);
   const s='NEXT';drawText(g,s,Math.round(x-textW(s)/2),y-12,0xffe2a8)}return r};
})();
