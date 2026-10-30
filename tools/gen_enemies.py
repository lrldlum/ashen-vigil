from gen_common import *
def hollow(d,ox,oy,f,atk=False):
    b=(f%2)
    rect(d,ox+13,oy+22,2,8,P['ash']); rect(d,ox+17,oy+22,2,8,P['ash'])
    rect(d,ox+12,oy+12+b,8,10,P['cloak']); rect(d,ox+13,oy+6+b,6,6,P['bone'])
    px(d,ox+17,oy+8+b,P['ember2'])
    if atk: rect(d,ox+20,oy+10+b,2,12,P['stone2'])
    else: rect(d,ox+20,oy+15+b,6,2,P['stone2'])
def wraith(d,ox,oy,f):
    y=oy+[0,1,2,1][f%4]
    for i in range(10): rect(d,ox+10+i%3,y+12+i,12-i%3,1,P['ice1'])
    rect(d,ox+11,y+5,10,8,P['ice2']); rect(d,ox+13,y+8,2,2,P['ice3']); rect(d,ox+18,y+8,2,2,P['ice3'])
def imp(d,ox,oy,f):
    y=oy+[0,-2,-3,-1][f%4]
    rect(d,ox+10,y+14,12,10,P['ember1']); rect(d,ox+12,y+16,8,6,P['ember2'])
    rect(d,ox+11,y+10,3,4,P['ember0']); rect(d,ox+18,y+10,3,4,P['ember0'])
    px(d,ox+13,y+18,P['ember3']); px(d,ox+18,y+18,P['ember3'])
    for i in range(3): px(d,ox+14+i*2,y+8-(f+i)%3,P['ember3'])
def sheet(name,rows,fn):
    im=img(32*4,32*len(rows)); d=ImageDraw.Draw(im)
    for r,(n,c) in enumerate(rows):
        for f in range(c): fn(d,f*32,r*32,f,n)
    im.save(f'../assets/sprites/{name}.png')
sheet('enemy_hollow',[('walk',4),('attack',4),('death',4)],lambda d,x,y,f,n: hollow(d,x,y+(f*3 if n=='death' else 0),f,n=='attack'))
sheet('enemy_wraith',[('float',4),('cast',4)],lambda d,x,y,f,n: wraith(d,x,y,f))
sheet('enemy_cinderimp',[('hop',4),('burst',4)],lambda d,x,y,f,n: imp(d,x,y,f))
# boss 64x64: rows idle4, slam4, charge4
def boss(d,ox,oy,f,n):
    up=[0,-2,-1,1][f] if n=='idle' else 0
    rx = [0,-6,-10,4][f] if n=='slam' else 0
    rect(d,ox+20,oy+44,8,18,P['stone1']); rect(d,ox+36,oy+44,8,18,P['stone1'])
    rect(d,ox+16,oy+20+up,32,26,P['stone2']); rect(d,ox+16,oy+20+up,32,3,P['stone3'])
    rect(d,ox+24,oy+6+up,16,14,P['ice2'] if n!='charge' else P['ember2'])
    rect(d,ox+28,oy+12+up,8,2,P['ember3'])
    for i in range(5): rect(d,ox+22+i*5,oy+2+up-(i%2)*2,3,5,P['gold'])
    rect(d,ox+48,oy+24+up+rx,6,22,P['stone1']); rect(d,ox+50,oy+8+up+rx,3,18,P['bone'])
    if n=='charge':
        for i in range(f*3+2):
            a=i*2.4; px(d,ox+32+int(math.cos(a)*(10+f*3)),oy+30+int(math.sin(a)*(10+f*3)),P['ember3'])
im=img(64*4,64*3); d=ImageDraw.Draw(im)
for r,n in enumerate(['idle','slam','charge']):
    for f in range(4): boss(d,f*64,r*64,f,n)
im.save('../assets/sprites/boss_frostwarden.png')
# bonfire 32x32 x6
im=img(32*6,32); d=ImageDraw.Draw(im); random.seed(3)
for f in range(6):
    ox=f*32; rect(d,ox+8,28,16,3,P['stone1']); rect(d,ox+15,8,2,20,P['steel'])
    for i in range(14):
        x=ox+11+random.randint(0,10); y=26-random.randint(0,12)
        c=[P['ember3'],P['ember2'],P['ember1']][min(2,(26-y)//5)]; px(d,x,y,c); px(d,x,y-1,c)
im.save('../assets/sprites/bonfire.png')
