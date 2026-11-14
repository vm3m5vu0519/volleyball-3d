import asyncio,json,sys
from playwright.async_api import async_playwright
JS=r"""(N)=>{const st=window.__B||(window.__B={sp:0,blk:{},pending:0,ser:-1});const h=human,myT=h.team,sdt=sd(myT);
 if(!window.__w){window.__w=1;const o=crossNet;crossNet=function(px,py,pz){const s0=ball.serial,lt=ball.lastTeam,atk=ball.atk;o.apply(this,arguments);if(lt===1-myT&&atk){window.__B.sp++;if(ball.serial!==s0&&human.touchN==='攔'&&human.touchFx>.7){window.__B.tch=(window.__B.tch||0)+1;window.__B.k=window.__B.k||{};const k=window.__B.last||'?';}}};
  const os=say;say=function(t){if(human.touchN==='攔'&&human.touchFx>.75)window.__B.blk[t]=(window.__B.blk[t]||0)+1;return os.apply(this,arguments);};}
 for(let f=0;f<N;f++){if(hitstop>0){hitstop-=1/60;continue;}
  h.human=(state==='play'&&ball.lastTeam===1-myT&&ball.touches>=1);
  if(state==='play'&&ball.lastTeam===1-myT&&ball.touches===2&&ball.setInfo){const H=ball.setInfo.hitter;
    if(h.y===0&&h.stun<=0){h.x=sdt*.5;h.z=0;h.vx=h.vz=0;}
    if(H.y>.15&&h.y===0&&st.ser!==ball.serial){st.pending=(st.pending||0)+1/60;if(st.pending>.12){st.ser=ball.serial;st.pending=0;doJump(h,false);}}}
  snap();update(1/60);}
 return st;}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader']);pg=await b.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
    await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    await pg.evaluate("prep.role='mb';savePrep()");await pg.click('#mStart');await pg.wait_for_timeout(500);await pg.click('#pGo');await pg.wait_for_timeout(800)
    await pg.evaluate("window.__manual=1")
    for c in range(int(sys.argv[1]) if len(sys.argv)>1 else 90):st=await pg.evaluate("(%s)(120)"%JS)
    print(json.dumps(st,ensure_ascii=False),errs[:2])
    await b.close()
asyncio.run(main())
