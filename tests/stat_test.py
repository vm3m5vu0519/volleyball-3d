import asyncio,json,sys
from playwright.async_api import async_playwright
N=int(sys.argv[1]) if len(sys.argv)>1 else 2
SETUP=r"""()=>{window.__S={spk:0,kill:0,dive:0,digT:0,digQ:0,dug:0,pts:0,touch:0,rallies:0,skill:0,plans:{},netcord:0,jset:0,dump:0,faults:{}};const S=__S;
 const w=(n,f)=>{const o=window[n];window[n]=function(){f.apply(this,arguments);return o.apply(this,arguments);};};
 const oS=doSpike;doSpike=function(p,q){S.spk++;return oS.apply(this,arguments);};
 const oD=startDive;startDive=function(){S.dive++;return oD.apply(this,arguments);};
 const oT=touch;touch=function(p,z){S.touch++;if(z&&z.k==='dig'){S.digT++;S.digQ+=z.q;}if(ball.atk&&ball.lastTeam!==p.team)S.dug++;return oT.apply(this,arguments);};
 const oP=point;point=function(w,why){if(state==='play'){S.pts++;if(why)S.faults[why]=(S.faults[why]||0)+1;if(ball.atk&&ball.lastTeam===w&&!ball.blockTouch)S.kill++;}return oP.apply(this,arguments);};
 const oA=skActivate;skActivate=function(p){const r=oA.apply(this,arguments);if(r)S.skill++;return r;};
 const oPl=aiPlan;aiPlan=function(p){const r=oPl.apply(this,arguments);S.plans[r.k]=(S.plans[r.k]||0)+1;return r;};
 BSTAT={};RSTAT={};NSTAT={};for(const k in JSTAT)delete JSTAT[k];}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader']);pg=await b.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    await pg.evaluate(SETUP)
    for m in range(N):
      await pg.evaluate("()=>{S.win=15;MATCH.mode='free';S.diff='normal';prep.role='oh';newGame();window.__manual=1;human.human=false;humanAir=()=>0;}")
      for i in range(400):
        if await pg.evaluate("()=>{for(let f=0;f<600;f++){if(state==='over')return 1;if(hitstop>0){hitstop-=1/60;continue;}snap();update(1/60);}return 0}"):break
      print('match',m,await pg.evaluate("score.join(':')"),flush=True)
    r=await pg.evaluate("()=>({S:__S,B:BSTAT,R:RSTAT,N:NSTAT,J:JSTAT,aces:players.filter(p=>p.ace).map(p=>p.team+p.role)})")
    S=r['S'];S['digQavg']=round(S['digQ']/max(1,S['digT']),2);del S['digQ']
    print(json.dumps(r,ensure_ascii=False))
    sp=S['spk'];bt=sum(r['B'].values())
    print(f"每分碰球 {S['touch']/S['pts']:.1f}｜扣球 {sp}，扣球得分率 {S['kill']/max(1,sp):.0%}｜攔網接觸 {bt/max(1,sp):.0%}，攔網得分 {r['B'].get('stuff',0)/max(1,sp):.0%}｜撲球 {S['dive']} 次/每分 {S['dive']/S['pts']:.2f}，撲到 {S['digT']}，品質 {S['digQavg']}｜技能 {S['skill']}")
    print('errs',errs[:3]);await b.close()
asyncio.run(main())
