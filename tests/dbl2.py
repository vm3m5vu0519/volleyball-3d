import asyncio,json
from playwright.async_api import async_playwright
# 玩家一直按住接球姿勢並追著球跑：記錄同一人連續碰球（不含攔網後）與連擊犯規
JS=r"""()=>{window.__manual=1;const h=human;const ev=[],faults={};let n=0,last=null;
 const oT=touch;touch=function(p,z,it){const prev=ball.lastP,pt=ball.lastTeam,bt=ball.blockTouch,tc=ball.touches,ser=ball.serial;const r=oT.apply(this,arguments);n++;
   if(prev===p&&pt===p.team&&!bt)ev.push({who:p===h?'玩家':p.role,tc,z:z.k,it,ready:p.ready,y:+p.y.toFixed(2),st:state});return r;};
 const oP=point;point=function(w,why){if(state==='play'&&why)faults[why]=(faults[why]||0)+1;return oP.apply(this,arguments);};
 for(let i=0;i<60*900;i++){
  if(state==='serve'&&server===h&&i%40===0)hitK['m:0']=true;
  if(state==='play'){const L=predict(BUMPY);held['m:2']=true;
    if(L&&Math.sign(L.x)===sd(h.team)){const dx=L.x-Math.sin(h.yaw)*.3-h.x,dz=L.z-Math.cos(h.yaw)*.3-h.z,d=Math.hypot(dx,dz);if(d>.2){h.vx=dx/d*6;h.vz=dz/d*6;}}
    if(i%20===0)hitK['m:2']=true;}
  else held['m:2']=false;
  update(1/60);for(const k in hitK)delete hitK[k];if(state==='over')newGame(),window.__manual=1;}
 held['m:2']=false;return JSON.stringify({n,cnt:ev.length,ev:ev.slice(0,12),faults});}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':480,'height':270});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.add_init_script('window.__skinOnlyUsed=1')
    await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(3000)
    await pg.click('#mStart');await pg.evaluate("prep.role='oh';setTimeout(()=>$('pGo').click())");await pg.wait_for_timeout(4000)
    print(await pg.evaluate("(%s)()"%JS))
    print(errs);await b.close()
asyncio.run(main())
