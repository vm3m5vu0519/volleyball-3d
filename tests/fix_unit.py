import asyncio,json
from playwright.async_api import async_playwright
JS=r"""(kind)=>{const R={n:0,saved:0,touchedBy:{},lost:0};
 for(let i=0;i<40;i++){S.win=99;newGame();window.__manual=1;human.human=false;humanAir=()=>0;state='play';const defT=1,atkT=0;
  players.forEach(p=>{const s=spot(p,'r');p.x=sd(p.team)*s.d;p.z=s.z;p.y=p.vy=p.vx=p.vz=0;});
  team(defT).filter(p=>p.role==='mb'||p.role==='op').forEach((b,j)=>{b.x=sd(defT)*.5;b.z=(j?.5:-.5)+(rnd()-.5)*2;});
  ball=newBall();ball.lastTeam=defT;ball.lastP=team(defT)[1];ball.touches=0;ball.blockTouch=true;ball.atk=false;ball.serial=++SERIAL;ball.x=sd(defT)*.15;ball.y=2.9;ball.z=(rnd()-.5)*4;
  if(kind==='soft'){ball.vx=sd(defT)*(1+rnd()*1.5);ball.vy=2+rnd()*2;ball.vz=(rnd()-.5)*2;}
  else{lobTo(sd(defT)*(4.5+rnd()*9),0,(rnd()<.5?-1:1)*(M.wid+.8+rnd()*1.6),3.5+rnd()*.8);}
  PC={};R.n++;let touched=null;
  for(let f=0;f<60*4;f++){const sr=ball.serial;snap();update(1/60);if(ball.serial!==sr&&ball.lastTeam===defT&&ball.touches===1){touched=ball.lastP.role;break;}if(state!=='play')break;}
  if(touched){R.saved++;R.touchedBy[touched]=(R.touchedBy[touched]||0)+1;}else R.lost++;}
 return R;}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader']);pg=await b.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    for k in ['soft','toolout']:print(k,json.dumps(await pg.evaluate("(%s)('%s')"%(JS,k)),ensure_ascii=False))
    print('net',await pg.evaluate("""()=>{const out=[];for(const tc of [0,1,2]){S.win=99;newGame();window.__manual=1;human.human=false;state='play';ball=newBall();ball.lastTeam=0;ball.touches=tc;ball.serial=++SERIAL;ball.x=-1.5;ball.y=2.0;ball.z=0;ball.vx=8;ball.vy=1;ball.vz=0;PC={};
      for(let f=0;f<60;f++){snap();update(1/60);if(state!=='play')break;}out.push([tc,state,score.join(':')]);}return JSON.stringify(out);}"""))
    print('times',await pg.evaluate("""()=>{newGame();window.__manual=1;state='play';const p=team(0)[1];p.human=false;startDive(p,{x:p.x+2,z:p.z},5);let t=0;while((p.dive>0||p.rec>0)&&t<3){updatePlayer(p,1/60);t+=1/60;}
      const b=team(1)[1];b.x=sd(1)*.5;ball.lastTeam=0;b.blkKey=true;doJump(b,false,0);let a=0;while((b.y>0||b.vy>0)&&a<3){b.vy-=PG*pGravK(b.vy,0,b.jk)*(1/60);b.y+=b.vy/60;a+=1/60;}return JSON.stringify({dive:+t.toFixed(2),blockAir:+a.toFixed(2),jk:b.jk});}"""))
    print('errs',errs);await b.close()
asyncio.run(main())
