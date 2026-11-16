import asyncio,json
from playwright.async_api import async_playwright
SP='/tmp/claude-0/-home-claude/2a2c0e0f-d504-5de7-9431-1b0e4f342f27/scratchpad/'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader']);pg=await b.new_page(viewport={'width':1280,'height':720});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    await pg.evaluate("prep.role='set';savePrep()");await pg.click('#mStart');await pg.wait_for_timeout(500);await pg.click('#pGo');await pg.wait_for_timeout(500)
    r=await pg.evaluate("""()=>{window.__manual=1;const R={log:[],phases:0,jset:0,dump:0,spikeAfter:0,inAir:0};const h=human;let mode=0,last=-1,cur=null;
      for(let f=0;f<60*240;f++){if(hitstop>0){hitstop-=1/60;continue;}
        if(state==='serve'&&server===h&&stT>.8){hitK[KB.atk[0]]=true;}
        if(state==='play'&&setPhase(h)){if(last!==ball.serial){if(cur)R.log.push(cur);cur={j:0,my:0,sw:0,d:9};last=ball.serial;R.phases++;mode=R.phases%3;}if(cur){cur.my=Math.max(cur.my,+h.y.toFixed(2));if(h.swingReq)cur.sw=1;const hy=h.y+HANDUP+.05;cur.d=Math.min(cur.d,+Math.hypot(ball.x-h.x,ball.y-hy,ball.z-h.z).toFixed(2));}
          const L=predict(OVERY+.5);if(L){h.x+=clamp(L.x-h.x,-.12,.12);h.z+=clamp(L.z-h.z,-.12,.12);}
          const J=jumpProf(h,0);if(L&&h.y===0&&L.t<=J.tApex+.02&&h.__j!==ball.serial){h.__j=ball.serial;doJump(h,false,0);if(cur)cur.j=1;}
          if(h.y>.3&&ball.lastTeam===h.team&&ball.touches===1){hitK[KB[mode===2?'tip':'atk'][0]]=true;}}
        const s0=ball&&ball.serial,lt=ball&&ball.lastP;snap();update(1/60);
        if(ball&&ball.serial!==s0&&ball.lastP===h&&ball.touches===2){if(h.y>.2)R.inAir++;if(ball.setInfo)R.jset++;else if(ball.tip)R.dump++;}
        if(ball&&ball.serial!==s0&&ball.atk&&ball.lastTeam===h.team&&ball.touches===3)R.spikeAfter++;}
      return R;}""")
    r.pop("log");print(json.dumps(r));print('errs',errs);await b.close()
asyncio.run(main())
