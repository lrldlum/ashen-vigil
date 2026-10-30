from gen_common import *
import glob,os
from PIL import ImageFont
A='../assets/'
c=Image.open(A+'bg/bg_burning_far.png').convert('RGBA')
for l in ['bg_stone_mid','bg_stone_near']: c.alpha_composite(Image.open(A+f'bg/{l}.png'))
d=ImageDraw.Draw(c)
bf=Image.open(A+'sprites/bonfire.png').crop((0,0,32,32)).resize((64,64),Image.NEAREST); c.alpha_composite(bf,(128,110))
pl=Image.open(A+'sprites/player.png').crop((0,0,32,32)).resize((64,64),Image.NEAREST); c.alpha_composite(pl,(176,110))
# blocky pixel font 3x5
F={'A':'010101111101101','S':'111100111001111','H':'101101111101101','E':'111100110100111','N':'101111111101101','V':'101101101101010','I':'111010010010111','G':'111100101101111','L':'100100100100111',' ':'000000000000000'}
def text(s,x,y,sc,col):
    for i,ch in enumerate(s):
        g=F[ch]
        for j,b in enumerate(g):
            if b=='1': rect(d,x+i*4*sc+(j%3)*sc,y+(j//3)*sc,sc,sc,col)
t='ASHEN VIGIL'; sc=5; w=len(t)*4*sc; x=(320-w)//2
text(t,x+2,24,sc,P['void']); text(t,x,22,sc,P['ember3'])
for i in range(w): px(d,x+i,52,P['ember1'])
c.save(A+'cover.png')
# contact sheet
files=sorted(glob.glob(A+'**/*.png',recursive=True)); tiles=[]
for f in files:
    im=Image.open(f).convert('RGBA'); s=max(1,min(3,480//max(im.size)))
    tiles.append((os.path.relpath(f,A),im.resize((im.width*s,im.height*s),Image.NEAREST)))
W=1500; x=y=10; rowh=0; pos=[]
for n,im in tiles:
    if x+im.width>W: x=10; y+=rowh+24; rowh=0
    pos.append((n,im,x,y)); x+=im.width+16; rowh=max(rowh,im.height)
sheet=Image.new('RGBA',(W,y+rowh+30),P['ink']+(255,)); dd=ImageDraw.Draw(sheet)
for n,im,x,y in pos: sheet.alpha_composite(im,(x,y+12)); dd.text((x,y),n,fill=(230,220,200,255))
sheet.save('../preview.png'); print(sheet.size)
