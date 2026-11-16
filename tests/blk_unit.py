import asyncio,json
from playwright.async_api import async_playwright
JS=r"""()=>{newGame();window.__manual=1;state='play';const atkT=0,defT=1;const b=team(defT).find(p=>p.role==='mb');
 team(defT).forEach(p=>{if(p!==b){p.x=sd(defT)*6;}});
 const out={};const say0=say;say=()=>{};const fz=freeze,sm=slowmo;freeze=()=>{};slowmo=()=>{};
 function trial(P,u,yz,blk,N){const k=`P${P}|${u}|${yz}`;const R={};for(let i=0;i<N;i++){
   b.x=sd(defT)*.35;b.z=0;b.y=.8;b.vy=0;b.stun=0;b.st=Object.assign({},b.st,{blk});b.skOn=null;
   ball.lastTeam=atkT;ball.atk=true;ball.tip=false;ball.power=P;ball.toolAim=false;ball.x=-.2;ball.y=3;ball.z=0;ball.vx=20;ball.vy=-6;ball.vz=0;
   const r=blockRects(defT)[0];const zc=r.cz+u*r.hw;const yc=yz==='tip'?r.top+.04:yz==='hand'?r.top-.2:yz==='arm'?(r.hb+NETH)/2:r.top+.3;
   BSTAT={};const hit=blockResolve(zc,yc,atkT,defT);const o=hit?Object.keys(BSTAT)[0]:'clean';R[o]=(R[o]||0)+1;}
   out[k]=R;}
 for(const P of [7,10,13])for(const u of [0,.5,.85,1.2])trial(P,u,'hand',8,200);
 for(const P of [7,10,13]){trial(P,0,'tip',8,200);trial(P,0,'arm',8,200);trial(P,0,'over',8,100);}
 const r=blockRects(defT)[0];out.rect={hw:+r.hw.toFixed(2),top:+r.top.toFixed(2),hb:+r.hb.toFixed(2),aw:+r.aw.toFixed(2),NETH};
 say=say0;freeze=fz;slowmo=sm;return out;}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader']);pg=await b.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    r=await pg.evaluate(JS)
    for k,v in r.items():print(k,v)
    print('errs',errs);await b.close()
asyncio.run(main())
