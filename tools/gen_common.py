from PIL import Image, ImageDraw
import math, random
P = {
 'void':(13,10,18),'ink':(26,22,34),'stone0':(42,40,52),'stone1':(66,63,78),'stone2':(98,94,110),'stone3':(140,134,150),
 'bone':(214,204,180),'ash':(170,160,150),'ember0':(90,24,20),'ember1':(170,48,28),'ember2':(232,110,40),'ember3':(255,200,90),
 'ice0':(30,48,80),'ice1':(60,100,150),'ice2':(120,170,210),'ice3':(210,240,255),'soul':(150,230,210),'plasma':(120,200,255),
 'blood':(120,20,30),'gold':(200,160,60),'moss':(60,80,50),'steel':(150,155,170),'cloak':(70,50,60)}
def img(w,h): return Image.new('RGBA',(w,h),(0,0,0,0))
def rect(d,x,y,w,h,c): d.rectangle([x,y,x+w-1,y+h-1],fill=c+(255,) if len(c)==3 else c)
def px(d,x,y,c): d.point((x,y),fill=c+(255,))
