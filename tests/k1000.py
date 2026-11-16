# 1000 球測試：AI 對 AI 連續打到指定分數總數，統計結局並偵測異常
import asyncio,json,sys,time
from playwright.async_api import async_playwright
TOTAL=int(sys.argv[1]);TAG=sys.argv[2];OUT=sys.argv[3]
SETUP=r"""()=>{window.__K={pts:0,matches:0,why:{},end:{},len:[],dur:[],kill:0,ace:0,spk:0,tip:0,dive:0,digT:0,digQ:0,skill:0,anom:[],win:[0,0],aceP:0,rallyT:0,stuckServe:0,maxLen:0,maxDur:0,cord:0,jset:0,dump:0,read:{}};
 const K=__K;
 const oS=doSpike;doSpike=function(p){K.spk++;return oS.apply(this,arguments);};
 const oTp=doTip;doTip=function(){K.tip++;return oTp.apply(this,arguments);};
 const oD=startDive;startDive=function(){K.dive++;return oD.apply(this,arguments);};
 const oT=touch;touch=function(p,z){K.rt=(K.rt||0)+1;if(z&&z.k==='dig'){K.digT++;K.digQ+=z.q;}return oT.apply(this,arguments);};
 const oA=skActivate;skActivate=function(p){const r=oA.apply(this,arguments);if(r)K.skill++;return r;};
 const oP=point;point=function(w,why){if(state==='play'){K.pts++;
   let e=why||'?';if(!why){if(ball.lastTeam===w&&!ball.blockTouch){e=ball.serve?'發球得分':ball.atk?'扣球得分':ball.tip?'吊球得分':'其他落地得分';if(ball.atk)K.kill++;if(ball.serve)K.ace++;}
     else if(ball.lastTeam===w&&ball.blockTouch)e='攔網後落地';else e='對方回球落地失分';}
   K.end[e]=(K.end[e]||0)+1;K.len.push(K.rt||0);K.dur.push(+K.rallyT.toFixed(1));K.maxLen=Math.max(K.maxLen,K.rt||0);K.maxDur=Math.max(K.maxDur,K.rallyT);
   if(ball.attacker&&ball.attacker.ace&&ball.atk&&ball.lastTeam===w)K.aceP++;}
   K.rt=0;K.rallyT=0;return oP.apply(this,arguments);};
 BSTAT={};RSTAT={};NSTAT={};for(const k in JSTAT)delete JSTAT[k];}"""
NEWM="()=>{S.win=25;MATCH.mode='free';S.diff='normal';prep.role=['oh','mb','op','set'][__K.matches%4];prep.side=__K.matches%2;newGame();window.__manual=1;human.human=false;humanAir=()=>0;__K.matches++;}"
STEP=r"""(N)=>{const K=__K;for(let f=0;f<N;f++){if(state==='over'){K.win[score[0]>score[1]?0:1]++;return 'over';}if(hitstop>0){hitstop-=1/60;continue;}
  snap();update(1/60);if(state==='play')K.rallyT+=1/60;else if(state==='serve'){K.serveT=(K.serveT||0)+1/60;}else K.serveT=0;
  if(state==='play')K.serveT=0;
  // 異常偵測
  const bad=v=>!isFinite(v);
  if(ball&&(bad(ball.x)||bad(ball.y)||bad(ball.z)))K.anom.push(['ballNaN',score.join(':')]);
  if(ball&&state==='play'&&(ball.y<-.6||Math.abs(ball.x)>40||Math.abs(ball.z)>40))K.anom.push(['ballFar',+ball.x.toFixed(1),+ball.y.toFixed(1),+ball.z.toFixed(1)]);
  for(const p of players)if(bad(p.x)||bad(p.z)||bad(p.y)||p.y<-.01)K.anom.push(['playerBad',p.role,p.team]);
  if(K.rallyT>30){K.anom.push(['rallyStuck>30s',score.join(':'),ball.lastTeam,ball.touches,+ball.x.toFixed(1),+ball.y.toFixed(1)]);K.rallyT=0;state='point';stT=0;}
  if((K.serveT||0)>12){K.stuckServe++;K.anom.push(['serveStuck',server&&server.role]);K.serveT=0;}
  if(K.anom.length>60)K.anom.length=60;
  if(K.pts>=__TOTAL)return 'done';}return 'run';}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader']);pg=await b.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    await pg.evaluate(f"window.__TOTAL={TOTAL}");await pg.evaluate(SETUP);await pg.evaluate(NEWM)
    t0=time.time();last=0
    while True:
      r=await pg.evaluate("(%s)(1200)"%STEP)
      if r=='over':await pg.evaluate(NEWM)
      pts=await pg.evaluate("__K.pts")
      if pts-last>=50:last=pts;print(TAG,pts,round(time.time()-t0),flush=True)
      if r=='done':break
    K=await pg.evaluate("()=>{const K=__K;K.B=BSTAT;K.R=RSTAT;K.N=NSTAT;K.J=Object.assign({},JSTAT);return K;}")
    K['errs']=errs[:5];json.dump(K,open(OUT,'w'),ensure_ascii=False)
    print(TAG,'done',round(time.time()-t0),'errs',len(errs),flush=True)
    await b.close()
asyncio.run(main())
