import asyncio,json
from playwright.async_api import async_playwright
JS=r"""(SK)=>{newGame();players.forEach(p=>{if(p.ace){p.ace=false;p.st=Object.assign({},p.ch.st);}});window.__manual=1;state='play';const say0=say;say=()=>{};freeze=()=>{};slowmo=()=>{};
 const a=team(0).find(p=>p.role==='oh');a.human=false;const B=team(1).filter(p=>p.role==='mb'||p.role==='op');B.forEach(b=>{b.st=Object.assign({},b.st,{blk:8});b.jumpH=1;});a.st=Object.assign({},a.st,{pow:8});a.jumpH=1;const R={};let inC=0,outC=0;
 for(let i=0;i<300;i++){BSTAT={};a.x=-1.6;a.z=-2.5;a.y=a.jumpH*.95;a.vy=0;a.app=.7;a.skOn=SK||null;a.plan={k:'power',B:{up:true}};
  ball.x=a.x+.3;ball.y=a.y+HANDUP+.1;ball.z=a.z;ball.vx=ball.vy=ball.vz=0;ball.lastTeam=0;ball.lastP=null;ball.touches=2;ball.atk=false;
  doSpike(a,.7);PC={};
  // 攔網手站在預估過網點附近（誤差 ±0.4m），時機在最高點
  const f=(0-ball.x)/ball.vx,zc=ball.z+ball.vz*f;B.forEach((b,j)=>{b.x=.45;b.z=zc+(j?.45:-.45)+(rnd()-.5)*.8;b.y=b.jumpH*.78;b.vy=0;b.stun=0;b.skOn=null;});
  let res='?';for(let s=0;s<200;s++){const px=ball.x,py=ball.y,pz=ball.z;stepB(ball,1/60);if(Math.sign(px)!==Math.sign(ball.x)&&px!==0){crossNet(px,py,pz);}
    if(Object.keys(BSTAT).length){res=Object.keys(BSTAT)[0];break;}if(ball.y<=0){res=(Math.abs(ball.x)<=M.half&&Math.abs(ball.z)<=M.wid&&Math.sign(ball.x)>0)?'in':'out';break;}}
  R[res]=(R[res]||0)+1;}
 say=say0;return R;}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader']);pg=await b.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    for sk in ['','power','precise']:print(sk or 'none',await pg.evaluate("(%s)('%s')"%(JS,sk)))
    print(errs);await b.close()
asyncio.run(main())
