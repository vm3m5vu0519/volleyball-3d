import asyncio,json
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader']);pg=await b.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    await pg.evaluate("localStorage.removeItem('vb-growth');GROW={}")
    # 1) 三種訓練各跑 60 秒（玩家由 AI 代打）
    for k in ['spike','recv','block']:
      r=await pg.evaluate("""(k)=>{prep.role='oh';trainStart(k);window.__manual=1;human.human=false;for(let f=0;f<60*75;f++){if(state==='over')break;if(hitstop>0){hitstop-=1/60;continue;}snap();update(1/60);}
        return {drill:k,state,n:MATCH.trainN,tries:MATCH.trainTry,res:$('resN').textContent,char:human.ch.id,g:GROW[human.ch.id]};}""",k)
      print(json.dumps(r,ensure_ascii=False))
    # 2) 比賽結算經驗值＋升級＋加點＋套用
    r=await pg.evaluate("""()=>{MATCH.mode='free';S.win=11;prep.role='oh';newGame();window.__manual=1;human.human=false;for(let f=0;f<60*600;f++){if(state==='over')break;if(hitstop>0){hitstop-=1/60;continue;}snap();update(1/60);}
      const id=human.ch.id,g=JSON.parse(JSON.stringify(GROW[id]));return {score:score.join(':'),resG:$('resG').textContent,g,perf:PERF};}""")
    print(json.dumps(r,ensure_ascii=False))
    r=await pg.evaluate("""()=>{const id=prep.chars.oh;const g=gOf(id);g.pts=Math.max(g.pts,2);const b0=gBase(id,'pow')+(g.add.pow||0);const ok=gSpend(id,'pow');
      MATCH.mode='free';newGame();const p=team(ME).find(x=>x.ch.id===id);return {spent:ok,powBefore:b0,powInGame:p.st.pow,ace:p.ace,stored:JSON.parse(localStorage.getItem('vb-growth'))[id].add};}""")
    print(json.dumps(r,ensure_ascii=False))
    print('errs',errs);await b.close()
asyncio.run(main())
