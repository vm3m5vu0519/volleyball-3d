import asyncio,json
from playwright.async_api import async_playwright
JS=r"""(()=>{window.__manual=1;human.human=false;S.win=999;
const ev=[];let T=0;const st={};
const wrap=(n,f)=>{const o=window[n];window[n]=function(...a){f(...a);return o.apply(this,a);};};
// touch(p,z,intent) -> categorize by touches before
const oTouch=touch;touch=function(p,z,it){const fresh=ball.lastTeam!==p.team,n=fresh?1:ball.touches+1;ev.push({t:T,k:'touch',n,team:p.team,air:z.k==='air'});return oTouch.apply(this,arguments);};
window.SRVX=[0,0,0];const oServe=doServe;doServe=function(p,kind){ev.push({t:T,k:'serve',team:p.team});const r=oServe.apply(this,arguments);SRVX[0]++;const so=sd(1-p.team);let ok=false;const b={x:ball.x,y:ball.y,z:ball.z,vx:ball.vx,vy:ball.vy,vz:ball.vz};for(let i=0;i<400&&b.y>0;i++){b.vy-=G/120;b.x+=b.vx/120;b.y+=b.vy/120;b.z+=b.vz/120;if(Math.sign(b.x)===so&&b.y>NETH){ok=true;break;}}if(ok)SRVX[1]++;if(kind==='stand')SRVX[2]++;return r;};
const oPoint=point;point=function(w,why){if(state==='play')ev.push({t:T,k:'point',why:(why||'')+'|w'+w+'|last'+ball.lastTeam+'|n'+ball.touches+(ball.serve?'S':'')+(ball.atk?'A':'')+(ball.tip?'T':'')+(ball.free?'F':'')+'|'+(ball.setInfo?ball.setInfo.type+':'+ball.setInfo.hitter.role+(ball.setInfo.hitter===human?'H':''):'-')+'|'+ball.x.toFixed(1)+','+ball.z.toFixed(1)+'|d'+Math.min(...team(ball.x<0?0:1).map(q=>Math.hypot(q.x-ball.x,q.z-ball.z))).toFixed(1)+'|roll'+team(ball.x<0?0:1).some(q=>q.rolls[ball.serial])+'|v'+Math.hypot(ball.vx,ball.vy,ball.vz).toFixed(0)+'|call'+(()=>{const t=ball.x<0?0:1,c=ball.call[t];return c?c.role+':'+Math.hypot(c.x-ball.x,c.z-ball.z).toFixed(1)+(c.dive>0||c.rec>0?'D':'')+(c.y>0?'J':''):'none'})()});return oPoint.apply(this,arguments);};
window.BFX=0;const oB=blockFx;blockFx=function(){BFX++;return oB.apply(this,arguments);};window.LFX=0;const oL=landFx;landFx=function(){LFX++;return oL.apply(this,arguments);};window.HFX=0;const oH=hitFx;hitFx=function(){HFX++;return oH.apply(this,arguments);};
const oSpike=doSpike;doSpike=function(p){ev.push({t:T,k:'spike'});return oSpike.apply(this,arguments);};
let maxBlk=0,idle=0,idleChk=0;const lastPos=new Map();
for(let i=0;i<60*60*12;i++){if(hitstop>0){hitstop-=1/60;T+=1/60;continue;}snap();update(1/60);T+=1/60;
  if(state==='play'){for(const t of [0,1]){const n=team(t).filter(p=>p.y>.3&&Math.abs(p.x)<1.3&&ball.lastTeam!==t).length;maxBlk=Math.max(maxBlk,n);}}
  if(state==='over')break;}
return JSON.stringify({ev,maxBlk,score,fx:[BFX,LFX,HFX,FX2.live.length],srv:SRVX});})()"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader'])
    pg=await b.new_page(viewport={'width':640,'height':360});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.add_init_script('window.__skinOnlyUsed=1');await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    await pg.click('#mStart');await pg.click('#pGo');await pg.wait_for_timeout(200)
    r=json.loads(await pg.evaluate(JS));print('errs',errs,'fx block/land/hit/live',r.get('fx'),'serves total/crossNet/stand',r.get('srv'))
    ev=r['ev'];json.dump(r,open('/tmp/ev.json','w'))
    # analysis
    import statistics as S
    seg={'serve':[], 'pass':[], 'set':[], 'spike':[]};rallies=[];cur=0;p2s=[];touchesR=[]
    lastPoint=None
    for i,e in enumerate(ev):
      nx=ev[i+1] if i+1<len(ev) else None
      if e['k']=='serve':
        if lastPoint is not None:p2s.append(e['t']-lastPoint)
        cur=0
        if nx and nx['k'] in('touch',): seg['serve'].append(nx['t']-e['t'])
      if e['k']=='touch':
        cur+=1
        if nx and nx['k']=='touch':
          d=nx['t']-e['t']
          if e['n']==1 and nx['team']==e['team']: seg['pass'].append(d)
          elif e['n']==2 and nx['team']==e['team']: seg['set'].append(d)
        if e['air'] and nx and nx['k'] in('spike',):pass
      if e['k']=='spike':
        # next touch or point
        if nx: seg['spike'].append(nx['t']-e['t'])
      if e['k']=='point': touchesR.append(cur);lastPoint=e['t']
    for k,v in seg.items():
      if v: print(k,'n=%d median=%.2f p10=%.2f p90=%.2f'%(len(v),S.median(v),sorted(v)[len(v)//10],sorted(v)[len(v)*9//10]))
    print('rallies',len(touchesR),'avg touches/rally %.2f'%(sum(touchesR)/max(1,len(touchesR))))
    print('point->serve median %.2f'%S.median(p2s) if p2s else '')
    print('max simultaneous blockers',r['maxBlk'],'score',r['score'])
    from collections import Counter
    print(Counter(e['why'] for e in ev if e['k']=='point').most_common(8))
    await b.close()
asyncio.run(main())
