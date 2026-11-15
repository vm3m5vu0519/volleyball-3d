import asyncio,json,time
from playwright.async_api import async_playwright
URL='http://localhost:8787/'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader'])
    H=await (await b.new_context(viewport={'width':800,'height':450})).new_page();C=await (await b.new_context(viewport={'width':800,'height':450})).new_page()
    eh=[];ec=[];H.on('pageerror',lambda e:eh.append(str(e)[:300]));C.on('pageerror',lambda e:ec.append(str(e)[:300]))
    H.on('console',lambda m:m.type=='error' and (None if 'Failed to load' in m.text else eh.append('c:'+m.text[:200])));C.on('console',lambda m:m.type=='error' and (None if 'Failed to load' in m.text else ec.append('c:'+m.text[:200])))
    await H.goto(URL);await C.goto(URL);await H.wait_for_timeout(2500)
    await H.click('#mNet');await H.fill('#nName','房主阿明');await H.click('#nCreate');await H.wait_for_timeout(800)
    code=await H.evaluate("NET.code");print('code',code,await H.evaluate("$('nStat').textContent"))
    await C.click('#mNet');await C.fill('#nName','小美');await C.fill('#nCode',code);await C.click('#nJoin');await C.wait_for_timeout(800)
    print('client',await C.evaluate("[NET.on,NET.id,$('nStat').textContent]"))
    # client sits at blue OH (slot 4)
    await C.click('#nSlots .nTeam:nth-child(2) .nSlot:nth-child(2)');await C.wait_for_timeout(600)
    print('slots host',await H.evaluate("NET.slots.map(s=>s.owner?s.name:'AI')"))
    print('slots cli',await C.evaluate("NET.slots.map(s=>s.owner?s.name:'AI')"))
    for pg in (H,C):await pg.evaluate("render=()=>{};drawHUD=()=>{}")
    await H.click('#nGo');await H.wait_for_timeout(1500)
    print('started',await H.evaluate("[state,players.filter(p=>p.human).map(p=>p.pname+':'+p.team+p.role)]"),await C.evaluate("[state,human&&human.pname,ME,NET.q.length]"))
    # client holds W (move toward net) for 2s
    t0=await H.evaluate("(()=>{const p=players.find(x=>x.owner&&x.rc);return [p.x,p.z]})()")
    await C.keyboard.down('KeyD');await C.wait_for_timeout(2500);await C.keyboard.up('KeyD')
    t1=await H.evaluate("(()=>{const p=players.find(x=>x.owner&&x.rc);return [p.x,p.z,p.rc.held.size]})()")
    c1=await C.evaluate("[human.x,human.z,state,score.join(':')]")
    print('remote player moved on host',t0,'->',t1,' client sees',c1)
    print('held on host',await H.evaluate("[...players.find(x=>x.rc).rc.held]"),await C.evaluate("Object.entries(held).filter(x=>x[1]).map(x=>x[0])"))
    await H.evaluate("()=>{serverIdx[1]=0;setupServe(1);window.__tx=0;const ws=NET.ws,os=ws.send.bind(ws);ws.send=s=>{window.__tx+=s.length;return os(s);};}")
    srvRemote=await H.evaluate("server.owner&&!!server.rc");S=C if srvRemote else H;print('server is remote',srvRemote)
    await S.keyboard.press('KeyJ');await S.wait_for_timeout(700);await S.keyboard.press('KeyJ')
    for i in range(6):
      await H.wait_for_timeout(5000)
      print(await H.evaluate("[state,score.join(':'),Math.round(time)]"),await C.evaluate("[state,score.join(':'),Math.round(time),NET.q.length,msgs.map(m=>m.text).join('|')]"))
    print('host tx bytes/s',await H.evaluate("Math.round(__tx/ (performance.now()/1000))"))
    print('errs host',eh[:4]);print('errs cli',ec[:4])
    await b.close()
asyncio.run(main())
