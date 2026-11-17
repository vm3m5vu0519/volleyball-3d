import asyncio,json
from playwright.async_api import async_playwright
# 每種發球各 40 球：過網率、出界、對方一傳品質；玩家跳飄（右鍵拋球→空中再按）也試幾次
JS=r"""(K)=>{window.__manual=1;human.human=false;humanAir=()=>0;const oS=startToss;startToss=function(p,k){if(!p.human){p.tk=K;k=K;}return oS(p,k);};
 const R={n:0,net:0,out:0,in:0,touched:0,pq:0,maxY:0,flat:0,spd:0};const oP=point;let cur=null;
 const oT=touch;touch=function(p,z,it){const r=oT.apply(this,arguments);if(cur&&!cur.t&&p.team!==cur.team){cur.t=1;R.touched++;R.pq+=ball.passQ;}return r;};
 for(let i=0;i<40;i++){setupServe(1-ME);cur={team:1-ME,crossed:0,t:0};let k=0,my=0,sp=0;
  while(state!=='point'&&k<60*12){update(1/60);k++;if(state==='play'&&!cur.t){my=Math.max(my,ball.y);if(!cur.crossed&&Math.sign(ball.x)===sd(ME)){cur.crossed=1;sp=Math.hypot(ball.vx,ball.vz);}}if(cur.t)break;}
  R.n++;R.maxY+=my;R.spd+=sp;if(!cur.crossed)R.net++;else if(!cur.t){const inside=Math.abs(ball.x)<=M.half+BR&&Math.abs(ball.z)<=M.wid+BR;inside?R.in++:R.out++;}
  state='point';}
 startToss=oS;touch=oT;R.pq=+(R.pq/Math.max(1,R.touched)).toFixed(2);R.maxY=+(R.maxY/R.n).toFixed(2);R.spd=+(R.spd/Math.max(1,R.n-R.net)).toFixed(1);return JSON.stringify(R);}"""
HUM=r"""()=>{window.__manual=1;human.human=true;const out=[];
 const hi=team(ME).indexOf(human);for(let i=0;i<6;i++){serverIdx[ME]=hi;setupServe(ME);
  for(const k in hitK)delete hitK[k];hitK['m:2']=true;update(1/60);for(const k in hitK)delete hitK[k];const kind=ball.tossKind;let k=0,hitT=null;
  while(state==='serve'&&k<240){update(1/60);k++;if(human.y>.2&&ball.vy<0&&Math.abs(ball.y-(human.y+HANDUP+.12))<.25&&hitT===null){hitT=k;hitK['m:0']=true;update(1/60);for(const q in hitK)delete hitK[q];}}
  let crossed=0,j=0;while(state==='play'&&j<300){update(1/60);j++;if(Math.sign(ball.x)!==sd(ME)){crossed=1;break;}}
  out.push({kind,state,crossed,jumpedY:+human.y.toFixed(2)});state='point';}
 return JSON.stringify(out);}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':480,'height':270});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.add_init_script('window.__skinOnlyUsed=1')
    await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(3000)
    await pg.click('#mStart');await pg.evaluate("prep.role='oh';setTimeout(()=>$('pGo').click())");await pg.wait_for_timeout(4000)
    for K in ('stand','jf'):print(K,await pg.evaluate("(%s)('%s')"%(JS,K)))
    await pg.reload();await pg.wait_for_timeout(3000);await pg.click('#mStart');await pg.evaluate("setTimeout(()=>$('pGo').click())");await pg.wait_for_timeout(4000)
    print('玩家跳飄',await pg.evaluate("(%s)()"%HUM))
    print(errs);await b.close()
asyncio.run(main())
