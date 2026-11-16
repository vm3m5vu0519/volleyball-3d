# 局面測試：從「玩家操作的那個人」的角度，把每一球遇到的局面分類，算出總共有幾種、各多常見、結果如何
import asyncio,json,sys,time
from playwright.async_api import async_playwright
TOTAL=int(sys.argv[1]);OUT=sys.argv[2]
SETUP=r"""()=>{window.__G={pts:0,matches:0,sit:{},bad:[],lastResp:-1,pend:[],aiRead:null};const G=__G;
 const SRCN={'serve:jump':'跳發','serve:stand':'飄球發球','serve:jfloat':'平飄發球','spike':'扣球','spike+sk':'技能扣球','tip':'吊球','dump':'二次球','over':'過網球（free ball）','cord':'擦網球',
   'block:stuff':'被攔死（球彈回我方）','block:back':'被攔回','block:soft':'我方攔網撐起','block:tip':'我方攔網擦手','block:through':'打穿我方攔網','block:toolIn':'打手亂彈','block:toolOut':'打手飛出場外'};
 const oSv=doServe;doServe=function(p,kind){const r=oSv.apply(this,arguments);ball._src='serve:'+kind;G.stag=G.stag||{};const tg=(kind)+'/'+(ball.serveTag||'玩家');G.stag[tg]=(G.stag[tg]||0)+1;ball._by=p;G.srv={p,kind,ser:ball.serial};return r;};
 const oS=doSpike;doSpike=function(p,q){G.aiRead=null;const r=oS.apply(this,arguments);if(!ball.tip)ball._src=ball.trailC?'spike+sk':'spike';ball._by=p;ball._read=G.aiRead;return r;};
 const oR=aiReadBlock;aiReadBlock=function(){const r=oR.apply(this,arguments);G.aiRead=r.k;return r;};
 const oTp=doTip;doTip=function(p){const r=oTp.apply(this,arguments);ball._src=(p.role==='set'&&ball.touches===2)?'dump':'tip';ball._by=p;return r;};
 const oO=doOver;doOver=function(p){G.free=(G.free||0)+1;const r=oO.apply(this,arguments);ball._src='over';ball._by=p;return r;};
 const oB=blockResolve;blockResolve=function(){const k0=Object.assign({},BSTAT);const r=oB.apply(this,arguments);if(r){const k=Object.keys(BSTAT).find(x=>(BSTAT[x]||0)>(k0[x]||0));ball._src='block:'+k;ball._blocker=ball.lastP;}return r;};
 const oC=netCord;netCord=function(){const r=oC.apply(this,arguments);if(r==='over')ball._src='cord';return r;};
 // 解決待定局面：碰球或得分時
 const oT=touch;touch=function(p,z){const H=human.team;for(const s of G.pend){if(s.done)continue;
     if(s.cat==='接球'&&p.team===H){s.res=p===human?'玩家接到':'隊友接到';s.done=1;}
     else if(s.cat==='進攻'&&p===human&&s.ser===ball.serial&&!s.hit){s.hit=1;const n=blockRects(1-H).length;s.key+='｜出手時'+(n===0?'沒人攔':n===1?'單人攔網':'雙人攔網');}
     else if(s.cat==='舉球'&&p.team===H&&ball.touches===1&&ball.lastTeam===H){s.res=p===human?(human.y>.2?'玩家跳舉/二次':'玩家舉球'):'隊友代舉';s.done=1;}}
   return oT.apply(this,arguments);};
 const oP=point;point=function(w,why){if(state==='play'){G.pts++;const H=human.team;
     for(const s of G.pend){if(s.done)continue;s.done=1;
       if(s.cat==='接球'){s.res=w===H?(why?'對方失誤':'球出界（放掉）'):'落地失分';
         if(w!==H&&!why){const L={x:ball.x,z:ball.z};const near=team(H).reduce((m,p)=>Math.min(m,Math.hypot(p.x-L.x,p.z-L.z)),99);
           if(near<1.3&&s.t>.9)G.bad.push({k:s.key,near:+near.toFixed(2),t:s.t,score:score.join(':')});}}
       else if(s.cat==='進攻'){if(!s.hit)s.key+='｜沒出手';s.res=w===H?(ball.lastP===human&&!why?'扣球得分':'得分（其他）'):(why||'失分');}
       else if(s.cat==='攔網')s.res=w===H?'得分':'失分';
       else if(s.cat==='發球')s.res=w===H?(ball.serve?'發球得分':'贏得回合'):(why||'失分');
       else s.res=w===H?'得分':'失分';}
     for(const s of G.pend)G.flush(s);G.pend=[];}
   return oP.apply(this,arguments);};
 G.flush=s=>{const k=s.cat+'｜'+s.key,o=G.sit[k]||(G.sit[k]={n:0,res:{},role:{}});o.n++;o.res[s.res||'未定']=(o.res[s.res||'未定']||0)+1;o.role[s.role]=(o.role[s.role]||0)+1;};
 G.SRCN=SRCN;}"""
# 每一步檢查：有沒有新的局面出現
STEP=r"""(N)=>{const G=__G;const h=human,H=h.team,s=sd(H);
 const dirOf=(x,z)=>{const f=(x-h.x)*(-s),l=(z-h.z)*(-s),d=Math.hypot(f,l);if(d<1)return'身邊';const a=Math.abs(f)>Math.abs(l)?(f>0?'前方':'後方'):(l>0?'右側':'左側');return a+(d<2.5?'一步':d<4?'要跑/撲':'遠處');};
 const tB=t=>t<.6?'反應極短':t<1.2?'反應短':'時間充裕';
 const qB=q=>q>.75?'一傳好':q>.45?'一傳普通':'一傳差';
 const row=()=>Math.abs(h.x)<3?'前排':'後排';
 for(let f=0;f<N;f++){if(state==='over')return'over';if(hitstop>0){hitstop-=1/60;continue;}
  const ser0=ball?ball.serial:-1;snap();update(1/60);
  if(state!=='play'||!ball)continue;
  // 1) 來球：球到我方這邊、輪到我方處理（對方打過來，或攔網碰到後 0 次觸球）
  const resp=Math.sign(ball.x)===s&&(ball.lastTeam!==H||ball.touches===0)&&ball.lastTeam!==null;
  if(resp&&G.lastResp!==ball.serial){G.lastResp=ball.serial;PC={};const L=predict(0)||predict(BUMPY);
    if(L){const src=G.SRCN[ball._src]||ball._src||'其他';const inC=Math.abs(L.x)<=M.half&&Math.abs(L.z)<=M.wid;
      const key=`${src}｜${row()}｜${dirOf(L.x,L.z)}｜${tB(L.t)}｜${inC?'場內':'場外'}`;G.pend.push({cat:'接球',key,role:h.role,t:+L.t.toFixed(2)});}}
  // 2) 進攻：舉球給玩家
  if(ball.serial!==ser0&&ball.lastTeam===H&&ball.touches===2&&ball.setInfo&&ball.setInfo.hitter===h){const nb=readRects(1-H).length;
    G.pend.push({cat:'進攻',key:`${{high:'高球',fast:'平快',quick:'快攻',safe:'修正球'}[ball.setInfo.type]||ball.setInfo.type}｜${qB(ball.passQ||0)}${ball.setInfo.boost?'｜神準舉球':''}`,role:h.role,ser:ball.serial});}
  // 3) 舉球：玩家是舉球員、一傳過來（舉球員是一傳之後才指定的，所以每個 serial 檢查一次）
  if(ball.lastTeam===H&&ball.touches===1&&ball.setter===h&&G.setSer!==ball.serial){G.setSer=ball.serial;const Ls=predict(OVERY);const dd=Ls?Math.hypot(Ls.x-h.x,Ls.z-h.z):9,nearNet=Ls&&Math.abs(Ls.x)<2;
    G.pend.push({cat:'舉球',key:`${qB(ball.passQ||0)}｜${dd<1?'到位':dd<2.5?'要移動':'很遠'}｜${nearNet?'靠網（可跳舉）':'離網'}`,role:h.role});}
  // 4) 攔網：對方舉球、玩家在前排
  if(ball.serial!==ser0&&ball.lastTeam===1-H&&ball.touches===2&&ball.setInfo&&Math.abs(h.x)<2.5){const hz=ball.setInfo.hitter.z,dz=Math.abs(hz-h.z);
    G.pend.push({cat:'攔網',key:`${{high:'高球',fast:'平快',quick:'快攻',safe:'修正球'}[ball.setInfo.type]||'其他'}｜${dz<1.2?'攻手在我前面':dz<2.6?'攻手在旁邊一格':'攻手在遠側'}${ball.setInfo.hitter.ace?'｜對方王牌':''}`,role:h.role});}
  // 5) 發球
  if(G.srv&&G.srv.p===h&&G.srv.ser===ball.serial&&!G.srv.rec){G.srv.rec=1;G.pend.push({cat:'發球',key:{jump:'跳發',jfloat:'平飄發球',stand:'飄球發球'}[G.srv.kind]||G.srv.kind,role:h.role});}
  if(G.pts>=__TOTAL)return'done';}
 return'run';}"""
NEWM="()=>{S.win=25;MATCH.mode='free';S.diff='normal';prep.role=['oh','mb','op','set'][Math.floor(__G.pts/(__TOTAL/4))%4];prep.side=__G.matches%2;newGame();window.__manual=1;human.human=false;humanAir=()=>0;__G.matches++;__G.pend=[];}"
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader']);pg=await b.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    await pg.evaluate(f"window.__TOTAL={TOTAL}");await pg.evaluate(SETUP);await pg.evaluate(NEWM)
    t0=time.time();lastRole=None
    while True:
      r=await pg.evaluate("(%s)(1200)"%STEP)
      role=await pg.evaluate("['oh','mb','op','set'][Math.floor(__G.pts/(__TOTAL/4))%4]")
      if r=='over' or (role!=lastRole and lastRole is not None):await pg.evaluate(NEWM)
      lastRole=role
      if r=='done':break
    G=await pg.evaluate("()=>({sit:__G.sit,bad:__G.bad,pts:__G.pts,matches:__G.matches,stag:__G.stag,free:__G.free||0})")
    G['errs']=errs[:5];json.dump(G,open(OUT,'w'),ensure_ascii=False);print('done',round(time.time()-t0),'errs',len(errs),'kinds',len(G['sit']))
    await b.close()
asyncio.run(main())
