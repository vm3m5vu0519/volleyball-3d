import asyncio,json
from playwright.async_api import async_playwright
F='/tmp/claude-0/-home-claude/2a2c0e0f-d504-5de7-9431-1b0e4f342f27/scratchpad/up/MyChar.vrm'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    ctx=await b.new_context(viewport={'width':1100,'height':700});pg=await ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.add_init_script('window.__skinOnlyUsed=1')
    await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(3000)
    await pg.evaluate("openSkin()");await pg.wait_for_timeout(500)
    await pg.set_input_files('#skFile',F)
    for i in range(60):
      m=await pg.evaluate("$('skMsg').textContent")
      if '可以用了' in m or '不' in m: break
      await pg.wait_for_timeout(500)
    print('上傳訊息',m)
    sid=await pg.evaluate("Object.keys(SKINS).find(k=>!/^b-/.test(k))");print('id',sid)
    # 在外觀頁把左攻換成上傳的模型
    await pg.evaluate(f"(()=>{{const s=[...document.querySelectorAll('#skAssign select')][0];s.value='{sid}';s.onchange();}})()")
    print('指定後',await pg.evaluate("JSON.stringify({sk:prep.skins,pin:prep.skinPin})"))
    # 到選角頁點別的球員
    r0=await pg.evaluate("SK_ROLES[0]")
    await pg.evaluate(f"(()=>{{const c=CHARS['{r0}'].find(c=>c.id!==prep.chars['{r0}']);pickChar('{r0}',c.id);}})()")
    print('換球員後',await pg.evaluate(f"prep.skins['{r0}']"))
    # 重新整理
    await pg.reload();await pg.wait_for_timeout(4000)
    for i in range(30):
      ok=await pg.evaluate(f"!!SKINS['{sid}']")
      if ok:break
      await pg.wait_for_timeout(500)
    print('重新整理後',await pg.evaluate(f"JSON.stringify({{has:!!SKINS['{sid}'],gltf:!!(SKINS['{sid}']&&SKINS['{sid}'].gltf),name:SKINS['{sid}']&&SKINS['{sid}'].name,assign:prep.skins['{r0}'],pin:prep.skinPin}})"))
    # 解除鎖定
    await pg.evaluate("openSkin()");await pg.wait_for_timeout(300)
    await pg.evaluate("(()=>{const s=[...document.querySelectorAll('#skAssign select')][0];s.value='__char';s.onchange();})()")
    print('跟著球員',await pg.evaluate(f"JSON.stringify({{a:prep.skins['{r0}'],pin:prep.skinPin}})"))
    print('errs',errs);await b.close()
asyncio.run(main())
