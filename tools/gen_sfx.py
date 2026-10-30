import wave,struct,math,random
R=22050
def save(n,s):
    w=wave.open(f'../assets/audio/{n}.wav','wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(R)
    w.writeframes(b''.join(struct.pack('<h',int(max(-1,min(1,x))*28000)) for x in s)); w.close()
def tone(f0,f1,dur,wave_='sq',noise=0,dec=3):
    out=[];ph=0;N=int(R*dur)
    for i in range(N):
        t=i/N; f=f0+(f1-f0)*t; ph+=f/R
        v=(1 if ph%1<.5 else -1) if wave_=='sq' else math.sin(ph*6.283)
        v=v*(1-noise)+random.uniform(-1,1)*noise
        out.append(v*(1-t)**dec*.6)
    return out
random.seed(1)
save('sfx_jump',tone(300,700,.15))
save('sfx_slash',tone(900,200,.12,noise=.7))
save('sfx_hit',tone(200,60,.18,noise=.5))
save('sfx_shot',tone(1200,400,.15))
save('sfx_charge',tone(200,900,.8,'sin',dec=.3))
save('sfx_roll',tone(150,90,.2,noise=.9))
save('sfx_parry',tone(1800,1700,.3,'sin',dec=2))
save('sfx_death',tone(400,40,.9,noise=.3,dec=1.5))
save('sfx_bonfire',tone(80,60,1.2,'sin',noise=.6,dec=.8))
save('sfx_souls',tone(600,1400,.4,'sin'))
