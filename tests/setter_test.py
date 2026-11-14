# 玩家當舉球手：每次輪到舉球就站到球下方、鏡頭對準輪流的攻手、按擊球鍵；檢查托給的人、之後有沒有扣球
import asyncio,json
from playwright.async_api import async_playwright
JS=r"""(N)=>{const st=window.__ST||(window.__ST={sets:0,match:0,byRole:{},spikesAfter:0,tips:0,q:[],errs:0,phases:0,want:null,lastSerial:-1,mode:0});
 for(let f=0;f<N;f++){if(hitstop>0){hitstop-=1/60;continue;}
  const h=human;
  if(state==='play'&&setPhase(h)){
    if(st.lastSerial!==ball.serial){st.lastSerial=ball.serial;st.phases++;const c=team(h.team).filter(x=>x!==h);st.want=c[st.phases%c.length];st.mode=st.phases%7===0?'tip':'atk';}
    const L=predict(OVERY);if(L&&L.t<.9){h.x=L.x;h.z=L.z;h.vx=h.vz=0;}
    // 鏡頭對準要托的人
    const a=spot(st.want,'a');cam.position.set(h.x-(sd(h.team)*a.d-h.x)*.4,2,h.z-(a.z-h.z)*.4);cam.lookAt(sd(h.team)*a.d,1.2,a.z);cam.updateMatrixWorld();
    if(L&&L.t<.12&&!h.arm){h.arm=st.mode;h.armT=.3;st.pending=st.want;st.pmode=st.mode;}
  }
  const before=ball.setInfo,bt=ball.touches,bl=ball.lastTeam,bser=ball.serial;
  snap();update(1/60);
  if(ball.lastP===h&&ball.serial!==bser&&ball.touches===2){if(ball.setInfo&&ball.setInfo.hitter){st.sets++;const r=ball.setInfo.hitter.role;st.byRole[r]=(st.byRole[r]||0)+1;if(ball.setInfo.hitter===st.pending)st.match++;st.q.push(ball.setInfo.type);}}
  if(ball.lastP===h&&ball.tip&&ball.serial!==bser)st.tips++;
  if(bl===h.team&&bt===2&&ball.touches===3&&ball.lastTeam===h.team&&ball.atk)st.spikesAfter++;
 }
 return st;}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader'])
    pg=await b.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.add_init_script("window.__skinOnlyUsed=1;localStorage.setItem('fb-prep',JSON.stringify(Object.assign(JSON.parse(localStorage.getItem('fb-prep')||'{}'),{role:'set'})));")
    await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    print('prep key',await pg.evaluate("Object.keys(localStorage)"))
    await pg.evaluate("prep.role='set';savePrep()")
    await pg.click('#mStart');await pg.wait_for_timeout(500);await pg.click('#pGo');await pg.wait_for_timeout(800)
    print('human role',await pg.evaluate("human.role"))
    await pg.evaluate("window.__manual=1;")
    # 發球輪到玩家時讓 AI 發（玩家是舉球手不發球）；其他時候玩家不動
    for c in range(60):st=await pg.evaluate("(%s)(120)"%JS)
    st.pop('want',None);st.pop('pending',None);st['q']={k:st['q'].count(k) for k in set(st['q'])}
    print(json.dumps(st,ensure_ascii=False));print('score',await pg.evaluate("score"),'errs',errs[:3])
    await b.close()
asyncio.run(main())
