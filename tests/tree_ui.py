import asyncio,json
from playwright.async_api import async_playwright
SP='/tmp/claude-0/-home-claude/2a2c0e0f-d504-5de7-9431-1b0e4f342f27/scratchpad/'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':1280,'height':860});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.add_init_script('window.__skinOnlyUsed=1;localStorage.removeItem("vb-growth")')
    await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(3000)
    await pg.click('#mTree');await pg.wait_for_timeout(500)
    cid=await pg.evaluate("TV.cid")
    # 給一些點數來測
    await pg.evaluate(f"(()=>{{const g=treeOf('{cid}');g.lv=9;g.sp=8;g.pts=3;gSave();renderTree();}})()")
    print('初始',await pg.evaluate(f"JSON.stringify({{tree:treeOf('{cid}').tree,eq:treeOf('{cid}').eq,sp:treeOf('{cid}').sp}})"))
    # T2 鎖住
    print('T2 鎖',await pg.evaluate(f"invest('{cid}','a_aim')"))
    for i in range(2):await pg.dblclick('[data-sk="power"]')
    await pg.dblclick('[data-sk="a_pow"]')
    print('T2 開',await pg.evaluate(f"invest('{cid}','a_aim')"),await pg.evaluate(f"invest('{cid}','a_aim')"))
    # 退點會破壞門檻：不行
    print('退 power（會破壞門檻）',await pg.evaluate(f"refund('{cid}','power')"))
    await pg.click('[data-sk="a_pow"]');await pg.hover('[data-ts="pow"]');await pg.wait_for_timeout(200)
    await pg.screenshot(path=SP+'tree1.png')
    await pg.click('[data-ts="pow"]')
    print('之後',await pg.evaluate(f"JSON.stringify({{tree:treeOf('{cid}').tree,eq:treeOf('{cid}').eq,sp:treeOf('{cid}').sp,pts:treeOf('{cid}').pts,add:treeOf('{cid}').add}})"))
    await pg.set_viewport_size({'width':400,'height':860});await pg.wait_for_timeout(300);await pg.screenshot(path=SP+'tree_m.png',full_page=False)
    sw=await pg.evaluate("document.querySelector('#vTree').scrollWidth>document.querySelector('#vTree').clientWidth+2")
    print('手機橫向溢出',sw);print(errs);await b.close()
asyncio.run(main())
