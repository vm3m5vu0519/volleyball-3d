import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    for (w,h,nm) in ((1280,900,'pc'),(420,860,'ph')):
      pg=await b.new_page(viewport={'width':w,'height':h});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
      await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2000)
      for k in range(120):
        n=await pg.evaluate("Object.values(CHAR_SKIN).filter((v,i,a)=>a.indexOf(v)===i).every(i=>SKINS[i]&&SKINS[i].gltf)")
        if n:break
        await pg.wait_for_timeout(1000)
      await pg.click('#mStart');
      for k in range(80):
        n=await pg.evaluate("Object.keys(PV.thumbs).length")
        if n>=12:break
        await pg.wait_for_timeout(500)
      await pg.evaluate("document.querySelector('#pChars').scrollIntoView()")
      await pg.wait_for_timeout(1200);await pg.screenshot(path=f'prep_{nm}.png',full_page=False)
      # 點舉球手的第二位
      await pg.evaluate("[...document.querySelectorAll('#pChars .line')][3].querySelectorAll('.cc')[1].click()");await pg.wait_for_timeout(1500)
      await pg.screenshot(path=f'prep_{nm}2.png')
      print(nm,errs[:2],await pg.evaluate("[Object.keys(PV.thumbs).length,prep.chars.set,prep.skins.set]"));await pg.close()
    await b.close()
asyncio.run(main())
