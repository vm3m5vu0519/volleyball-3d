import asyncio,json
from playwright.async_api import async_playwright
JS=r"""()=>{window.__manual=1;human.human=false;humanAir=()=>0;
 const ids=['power','precise','eye','guard','wall','kill','toss','ace'],A={},T={};
 // 每個人帶一種主動技能（舉球員一定帶舉球技能才用得到）
 const order=players.slice().sort((a,b)=>(a.role==='set')-(b.role==='set'));let i=0;
 const pool=ids.filter(x=>x!=='toss');
 for(const p of players){const id=p.role==='set'?(p.team?'toss':'ace'):pool[i++%pool.length];p.tree=Object.assign({},p.tree);p.tree[id]=1;p.eq=id;}
 const oA=skActivate;skActivate=function(p){const r=oA(p);if(r)A[p.eq]=(A[p.eq]||0)+1;return r;};
 const oT=skTake;skTake=function(p,k){const r=oT(p,k);if(r)T[r]=(T[r]||0)+1;return r;};
 for(let f=0;f<60*480;f++){if(f%600===0)for(const p of players)if(!p.skOn)p.sk=100;update(1/60);if(state==='over'){break;}}
 return JSON.stringify({eq:players.map(p=>p.role+':'+p.eq),act:A,take:T,score});}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':480,'height':270});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.add_init_script('window.__skinOnlyUsed=1')
    await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(3000)
    await pg.click('#mStart');await pg.evaluate("prep.role='oh';setTimeout(()=>$('pGo').click())");await pg.wait_for_timeout(4000)
    print(await pg.evaluate("JSON.stringify(players.map(p=>({r:p.role,t:p.team,eq:p.eq,tree:p.tree})))"))
    print(await pg.evaluate("(%s)()"%JS))
    print(errs);await b.close()
asyncio.run(main())
