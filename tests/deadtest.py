import asyncio,json
from playwright.async_api import async_playwright
JS=r"""(()=>{window.__manual=1;human.human=false;const out={};
 const run=(name,setup,N=200)=>{setupServe(0);state='play';ball=newBall();ball.held=null;ball.toss=false;ball.lastTeam=0;setup();const tr=[];let pts=null;
  for(let i=0;i<N;i++){snap();update(1/60);if(state==='point'&&!pts)pts=[+ball.x.toFixed(2),+ball.z.toFixed(2)];if(i%10==0)tr.push([+ball.x.toFixed(2),+ball.y.toFixed(2),+ball.z.toFixed(2)]);}
  out[name]={state,pts,tr};};
 run('spike',()=>{ball.x=-.5;ball.y=3;ball.z=0;driveTo(5,1,22);ball.atk=true;});
 run('lob',()=>{ball.x=-2;ball.y=2;ball.z=0;lobTo(6,0,2,5);});
 run('outWall',()=>{ball.x=-2;ball.y=1.5;ball.z=2;ball.vx=1;ball.vy=1;ball.vz=11;});
 run('toNet',()=>{ball.x=4;ball.y=1;ball.z=0;ball.vx=-8;ball.vy=1;ball.vz=0;state='point';stT=0;},120);
 return out;})()"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader'])
    pg=await b.new_page(viewport={'width':400,'height':300});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.add_init_script('window.__skinOnlyUsed=1');await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    await pg.click('#mStart');await pg.click('#pGo');await pg.wait_for_timeout(200)
    r=await pg.evaluate(JS)
    for k,v in r.items():print(k,v['state'],'pt',v['pts']);print('  ',v['tr'])
    print('errs',errs);await b.close()
asyncio.run(main())
