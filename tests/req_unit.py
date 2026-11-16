import asyncio,json
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader']);pg=await b.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    # 1) 要球：每種球種各試，看 AI 舉球員舉給誰、舉什麼
    r=await pg.evaluate("""()=>{S.win=999;prep.role='oh';newGame();window.__manual=1;const h=human;const R={};let cur=null,ser=-1,n=0;
      for(let f=0;f<60*900&&n<60;f++){if(hitstop>0){hitstop-=1/60;continue;}
        if(state==='serve'&&server===h&&stT>.8)hitK[KB.atk[0]]=true;
        if(state==='play'&&ball.lastTeam===h.team&&ball.touches===1&&ser!==ball.serial&&ball.setter&&!ball.setter.human){ser=ball.serial;cur=['auto','high','fast','quick'][n%4];h.reqType=cur;h.calledAt=time;n++;}
        const s0=ball?ball.serial:-1;snap();update(1/60);
        if(cur&&ball.serial!==s0&&ball.lastTeam===h.team&&ball.touches===2&&ball.setInfo){const k=cur+'→'+(ball.setInfo.hitter===h?ball.setInfo.type:'給別人');R[k]=(R[k]||0)+1;cur=null;}}
      return R;}""")
    print('要球',json.dumps(r,ensure_ascii=False))
    # 2) 滑鼠左右鍵旋球
    r=await pg.evaluate("""()=>{newGame();window.__manual=1;state='play';const h=human,o={};for(const [name,key] of [['左鍵','m:0'],['右鍵','m:2'],['J','k:KeyJ']]){
      h.y=.8;h.vy=0;h.hitDone=false;h.swingReq=null;h.spinReq=0;ball.lastTeam=h.team;ball.touches=2;ball.x=sd(h.team)*1.5;ball.y=3.3;
      for(const k in hitK)delete hitK[k];hitK[key]=true;held[key]=true;humanInput(1/60);held[key]=false;for(const k in hitK)delete hitK[k];
      const sp=spinFrom(h,h.team);o[name]={swing:h.swingReq,spin:+sp.s.toFixed(2)};}return o;}""")
    print('旋球',json.dumps(r,ensure_ascii=False))
    print('errs',errs);await b.close()
asyncio.run(main())
