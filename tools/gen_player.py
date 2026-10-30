from gen_common import *
# rows: idle4 run6 jump2 fall2 roll5 attack5 shoot3 ; 32x32, sheet 6 cols? use 6 cols x 7 rows
ROWS=[('idle',4),('run',6),('jump',2),('fall',2),('roll',5),('attack',5),('shoot',3)]
def knight(d,ox,oy,bob=0,leg=0,arm=0,crouch=0,sword=None,gun=False):
    y=oy+bob+crouch
    # legs
    rect(d,ox+12-leg,y+22,3,8-crouch//2,P['stone0']); rect(d,ox+17+leg,y+22,3,8-crouch//2,P['stone0'])
    # body/cloak
    rect(d,ox+11,y+13,10,10,P['steel']); rect(d,ox+11,y+13,10,2,P['stone3'])
    rect(d,ox+9,y+14,3,9,P['cloak'])
    # head/helm
    rect(d,ox+12,y+6,8,7,P['stone2']); rect(d,ox+16,y+9,4,1,P['ember3']); rect(d,ox+12,y+6,8,1,P['stone3'])
    # plume
    rect(d,ox+11,y+4,3,3,P['ember1'])
    # arm
    rect(d,ox+20,y+15+arm,3,5,P['stone2'])
    if sword is not None:
        a=math.radians(sword); cx,cy=ox+22,y+17+arm
        for r in range(2,13): px(d,int(cx+math.cos(a)*r),int(cy+math.sin(a)*r),P['bone'] if r<12 else P['ice3'])
    if gun: rect(d,ox+22,y+16,6,2,P['ice1']); px(d,ox+28,y+16,P['plasma'])
def build():
    W,H=32,32; im=img(W*6,H*len(ROWS)); d=ImageDraw.Draw(im)
    for r,(n,c) in enumerate(ROWS):
        for f in range(c):
            ox,oy=f*W,r*H
            if n=='idle': knight(d,ox,oy,bob=(1 if f in(1,2) else 0))
            elif n=='run': knight(d,ox,oy,bob=(f%3==1)*-1,leg=[-2,-1,1,2,1,-1][f],arm=[1,0,-1,-1,0,1][f])
            elif n=='jump': knight(d,ox,oy,bob=-1,leg=2-f,arm=-2)
            elif n=='fall': knight(d,ox,oy,leg=1,arm=-3+f)
            elif n=='roll':
                t=img(W,H); knight(ImageDraw.Draw(t),0,0,crouch=4)
                t=t.rotate(-72*f,center=(16,20)); im.alpha_composite(t,(ox,oy))
            elif n=='attack': knight(d,ox,oy,arm=[-2,-3,0,1,0][f],sword=[-120,-90,-10,30,50][f])
            elif n=='shoot': knight(d,ox,oy,gun=True,bob=[0,1,0][f])
    im.save('../assets/sprites/player.png')
build()
