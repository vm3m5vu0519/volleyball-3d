import asyncio,json
from playwright.async_api import async_playwright
# 1) 隊友發球還沒過網：玩家（地面接球／空中扣球）都不能碰
# 2) 舉球員空中：右鍵＝跳舉、左鍵＝扣過去；攻手空中：左鍵左旋、右鍵右旋
T1=r"""(mode)=>{newGame();window.__manual=1;let tries=0;
 for(;tries<30;tries++){serverIdx[ME]=tries;setupServe(ME);if(server!==human)break;}
 if(server===human)return 'skip';
 let k=0;while(state!=='play'&&k<900){update(1/60);k++;}
 // 等球飛到自己場上空中段
 k=0;while(state==='play'&&!(Math.sign(ball.x)===sd(ME)&&Math.abs(ball.x)>2&&Math.abs(ball.x)<6)&&k<300){update(1/60);k++;}
 if(state!=='play')return 'noplay';
 const h=human;h.x=ball.x;h.z=ball.z;h.ox=h.x;h.oz=h.z;
 if(mode.startsWith('air')){h.y=Math.max(.3,ball.y-HANDUP-.05);h.vy=0;h.hitDone=false;h.swingReq='atk';h.prevD=9;}
 else{h.y=0;h.arm='atk';h.armT=.3;ball.y=1.0;}
 if(mode.endsWith('ctrl'))ball.serve=false;
 const t0=ball.touches,lp=ball.lastP;for(let i=0;i<6;i++){update(1/60);if(state!=='play')break;}
 return JSON.stringify({touched:ball.lastP===h,serve:ball.serve,lastTeam:ball.lastTeam,ME,state});}"""
T2=r"""(btn,tc)=>{newGame();window.__manual=1;const h=human;
 // 直接造一個「隊友一傳，輪到舉球員」的局面
 state='play';ball.x=sd(ME)*1.2;ball.z=0;ball.y=3.2;ball.vx=0;ball.vz=0;ball.vy=-1;ball.lastTeam=ME;ball.touches=tc;ball.serve=false;ball.atk=false;
 const mate=team(ME).find(p=>p!==h);ball.lastP=mate;ball.setter=tc===1?h:mate;ball.cool=0;
 h.x=ball.x;h.z=ball.z;h.y=.5;h.vy=1;h.hitDone=false;h.swingReq=null;
 for(const k in hitK)delete hitK[k];hitK[btn]=true;held[btn]=true;
 humanInput(1/60);const req=h.swingReq,sp=h.spinReq;held[btn]=false;
 return JSON.stringify({role:h.role,setPhase:setPhase(h),req,sp});}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':640,'height':360});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.add_init_script('window.__skinOnlyUsed=1')
    await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(3000)
    await pg.click('#mStart');await pg.click('#pGo');await pg.wait_for_timeout(800)
    res={'ground':[], 'air':[],'groundctrl':[],'airctrl':[]}
    for m in ('ground','air','groundctrl','airctrl'):
      for i in range(4):res[m].append(await pg.evaluate("(%s)('%s')"%(T1,m)))
    print('隊友發球（碰到幾次）',{k:sum('"touched":true' in x for x in v) for k,v in res.items()})
    for role,tc in (('set',1),('set',2),('oh',2)):
      await pg.evaluate(f"prep.role='{role}';savePrep()")
      for btn in ('m:2','m:0','k:KeyJ'):
        print('空中',role,'第%d球後'%tc,btn,await pg.evaluate("(%s)('%s',%d)"%(T2,btn,tc)))
    print('errs',errs);await b.close()
asyncio.run(main())
