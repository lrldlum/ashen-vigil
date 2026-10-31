// ASHEN VIGIL — Artist's boss (signature) weapon art. Visuals only: keyed by loot.js SIGNATURE ids; stats/drops live elsewhere.
// In hand: hero_strip_noblade base + weapon_<id> 46x46x30 overlay (between armor legs/chest and hands/head).
// Icons: icon_<id> 12x12 (@2x 24x24) drawn into inventory Graphics. Heavy: heavy_<id> 6x48x48 burst at 16fps, origin .25,.75.
const WEAPART=(()=>{const DIR='assets/art/weapons_pixel/';let META=null;const ICON={};
 const ids=()=>typeof SIGNATURE!=='undefined'?Object.values(SIGNATURE):[];
 const ON=()=>typeof PIXCH!=='undefined'&&PIXCH.ON();
 function preload(L){if(!ON())return;L.spritesheet('av_hero_nb',DIR+'hero_strip_noblade.png',{frameWidth:46,frameHeight:46});
  for(const id of ids()){L.spritesheet('wp_'+id,DIR+'weapon_'+id+'.png',{frameWidth:46,frameHeight:46});L.spritesheet('wph_'+id,DIR+'heavy_'+id+'.png',{frameWidth:48,frameHeight:48});
   L.image('wpi_'+id,DIR+'icon_'+id+'.png');L.image('wpi2_'+id,DIR+'icon_'+id+'@2x.png')}}
 const has=(s,id)=>!!id&&ids().includes(id)&&s.textures.exists('wp_'+id);
 // per-rig weapon sprite; base sprite switches to the no-blade strip while a signature weapon is shown
 function wield(s,R,id,flash,tint){const B=R.base;const on=has(s,id)&&s.textures.exists('av_hero_nb')&&B.visible;
  const bk=on?'av_hero_nb':'av_hero';if(B.texture.key!==bk)B.setTexture(bk,B.frame.name);
  let w=R.wp;if(!on){if(w)w.setVisible(false);return}
  if(!w||w.texture.key!=='wp_'+id){if(w)w.destroy();w=R.wp=s.add.sprite(0,0,'wp_'+id,0).setOrigin(B.originX,B.originY)}
  w.setVisible(true).setFrame(B.frame.name).setPosition(B.x,B.y).setFlipX(B.flipX).setDepth(B.depth+.0025);
  if(flash)w.setTintFill(0xffffff);else if(tint!=null)w.setTint(tint);else w.clearTint()}
 function heavy(s,id,x,y,f){if(!has(s,id)||!s.textures.exists('wph_'+id))return null;const k='wph_'+id;
  if(!s.anims.exists(k))s.anims.create({key:k,frames:s.anims.generateFrameNumbers(k,{start:0,end:5}),frameRate:16,repeat:0});
  const sp=s.add.sprite(Math.round(x),Math.round(y),k,0).setOrigin(f<0?.75:.25,.75).setFlipX(f<0).setDepth(3.2);sp.play(k);sp.once('animationcomplete',()=>sp.destroy());return sp}
 // inventory: draw the pixel icon (1x for slots < 24px, @2x otherwise) centred in the slot, from cached pixel data
 function px(s,key){if(ICON[key]!==undefined)return ICON[key];if(!s.textures.exists(key))return null;const src=s.textures.get(key).getSourceImage();
  const cv=document.createElement('canvas');cv.width=src.width;cv.height=src.height;const x=cv.getContext('2d');x.drawImage(src,0,0);const d=x.getImageData(0,0,cv.width,cv.height).data,o=[];
  for(let j=0;j<cv.height;j++)for(let i=0;i<cv.width;i++){const k=(j*cv.width+i)*4;if(d[k+3]>40)o.push([i,j,(d[k]<<16)|(d[k+1]<<8)|d[k+2]])}return ICON[key]={w:cv.width,h:cv.height,p:o}}
 function icon(s,g,id,x,y,sz){if(!has(s,id))return false;const I=px(s,(sz>=24?'wpi2_':'wpi_')+id);if(!I)return false;const ox=x+((sz-I.w)>>1),oy=y+((sz-I.h)>>1);
  for(const [i,j,c] of I.p){g.fillStyle(c);g.fillRect(ox+i,oy+j,1,1)}return true}
 return {preload,wield,heavy,icon,has}})();
