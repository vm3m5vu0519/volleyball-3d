import asyncio,json
from playwright.async_api import async_playwright
JS=r"""(N)=>{const st=window.__ST||(window.__ST={phases:0,res:{},pick:{ok:0,n:0},last:-1,cur:null});
 if(!window.__wrapped){window.__wrapped=1;const ob=blockFx;blockFx=function(){const c=window.__ST.cur;if(c&&c.spiked&&!c.done){c.blocked=1;}return ob.apply(this,arguments);};}
 const TY=['high','fast','quick'],RO=['oh','mb','op'];
 for(let f=0;f<N;f++){if(hitstop>0){hitstop-=1/60;continue;}
  const h=human;
  if(state==='play'&&setPhase(h)){
    if(st.last!==ball.serial){st.last=ball.serial;st.phases++;h.setType=TY[st.phases%3];h.setPick={s:ball.passSer,r:RO[Math.floor(st.phases/3)%3]};}
    const L=predict(OVERY);if(L&&L.t<.9){h.x=L.x;h.z=L.z;h.vx=h.vz=0;}
    if(L&&L.t<.12&&!h.arm){h.arm='atk';h.armT=.3;}}
  const bser=ball.serial,prevState=state,sc0=score[0]+score[1],myT=h.team;
  snap();update(1/60);
  if(ball.lastP===h&&ball.serial!==bser&&ball.touches===2&&ball.setInfo){const c={want:h.setType,got:ball.setInfo.type,role:ball.setInfo.hitter.role,spiked:0,blocked:0,kill:0,done:0};st.cur=c;
    st.pick.n++;if(ball.setInfo.hitter.role===h.setPick.r)st.pick.ok++;}
  const c=st.cur;if(c&&!c.done){if(ball.lastTeam===myT&&ball.touches===3&&ball.atk)c.spiked=1;
    if(prevState==='play'&&state==='point'){c.done=1;if(c.spiked&&score[myT]+score[1-myT]>sc0&&window.ptWin===myT&&!c.opTouched)c.kill=1;const k=c.got,r=st.res[k]||(st.res[k]={n:0,spike:0,block:0,kill:0});r.n++;r.spike+=c.spiked;r.block+=c.blocked;r.kill+=c.kill;}
    else if(c.spiked&&ball.lastTeam===1-myT&&!c.blocked){c.opTouched=1;}
    if(c.opTouched&&!c.done&&ball.lastTeam===myT&&ball.touches===1){c.done=1;const k=c.got,r=st.res[k]||(st.res[k]={n:0,spike:0,block:0,kill:0});r.n++;r.spike+=c.spiked;r.block+=c.blocked;}}
 }
 return st;}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader'])
    pg=await b.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.add_init_script("window.__skinOnlyUsed=1;")
    await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    await pg.evaluate("prep.role='set';savePrep()")
    await pg.click('#mStart');await pg.wait_for_timeout(500);await pg.click('#pGo');await pg.wait_for_timeout(800)
    await pg.evaluate("window.__manual=1;")
    for c in range(110):st=await pg.evaluate("(%s)(120)"%JS)
    st.pop('cur',None);print(json.dumps(st,ensure_ascii=False));print('score',await pg.evaluate("score"),'errs',errs[:3])
    await b.close()
asyncio.run(main())
