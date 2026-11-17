
// ================= 技能樹（獨立於位置）＋屬性雷達圖 =================
// 參考 MECH-CORDON 駕駛員技能樹：分好幾欄（分支），每欄由上往下 T1 → T2 → T3，同一欄前面投夠點才開下一層。
// 技能不綁位置：任何球員都能學任何技能；主動技能挑 1 個帶上場（Q 發動），被動技能全部生效。
// 威力看能力值：每個分支綁一項能力（扣球＝力量、防守＝接球、攔網＝攔網、舉球發球＝舉球），倍率 0.7＋能力×0.06（能力 5＝×1.0、10＝×1.3）。
// 點數：每升 1 級各得 1 屬性點（加六項能力，雷達圖）和 1 技能點（點技能樹）。每個球員各自一套，存在 vb-growth。
const TIER_REQ={1:0,2:3,3:6};
const TB=[
  {id:'atk',name:'扣球',stat:'pow',col:'#ff9a3c'},
  {id:'def',name:'防守',stat:'rcv',col:'#3ee0a0'},
  {id:'blk',name:'攔網',stat:'blk',col:'#7af0c0'},
  {id:'set',name:'舉球・發球',stat:'set',col:'#ffd23f'}];
const pc=v=>Math.round(v*100)+'%';
// act：主動技能（dur＝持續秒數，0＝留到下一次用掉）；when＝HUD 上顯示什麼時候用掉
const TSK=[
  {id:'power',br:'atk',tier:1,max:3,act:1,name:'強力扣球',col:'#ff9a3c',dur:0,when:'下一次扣球',d:(r,m)=>`下一次扣球品質至少 GOOD、球速 +${pc((.05+.02*r)*m)}、攻擊力 +${(2+r*.6*m).toFixed(1)}`},
  {id:'a_pow',br:'atk',tier:1,max:3,name:'重砲',d:r=>`扣球球速 +${3*r}%、攻擊力 +${(.3*r).toFixed(1)}`},
  {id:'a_aim',br:'atk',tier:2,max:2,name:'落點控制',d:r=>`扣球落點偏差 −${10*r}%`},
  {id:'a_tool',br:'atk',tier:2,max:2,name:'打手出界',d:r=>`打到攔網手外緣時，打手出界機率 +${6*r}%`},
  {id:'precise',br:'atk',tier:3,max:1,act:1,name:'精準扣球',col:'#5ad1ff',dur:0,when:'下一次扣球',d:(r,m)=>`下一次扣球照準星落點、完全不偏，品質至少 GOOD、攻擊力 +${(1+m).toFixed(1)}`},
  {id:'eye',br:'def',tier:1,max:3,act:1,name:'鷹眼接球',col:'#3ee0a0',dur:8,when:'',d:(r,m)=>`8 秒內接球、救球品質 +${pc((.06+.04*r)*m)}`},
  {id:'d_pass',br:'def',tier:1,max:3,name:'穩定一傳',d:r=>`接發球、接扣球品質 +${2.5*r}%`},
  {id:'d_dive',br:'def',tier:2,max:2,name:'飛撲',d:r=>`飛撲救球的範圍 +${6*r}%`},
  {id:'d_float',br:'def',tier:2,max:2,name:'飄球剋星',d:r=>`飄球、跳飄球對接球的影響 −${30*r}%`},
  {id:'guard',br:'def',tier:3,max:1,act:1,name:'銅牆防守',col:'#7ad7ff',dur:10,when:'',d:(r,m)=>`10 秒內飛撲範圍 +${pc(.3*m)}，救起的球品質至少 50%`},
  {id:'wall',br:'blk',tier:1,max:3,act:1,name:'鐵壁攔網',col:'#7af0c0',dur:8,when:'',d:(r,m)=>`8 秒內攔網手寬 +${Math.round((8+3*r)*m)} 公分、攔網力量 +${((2+r)*m).toFixed(1)}`},
  {id:'b_reach',br:'blk',tier:1,max:3,name:'手長',d:r=>`攔網手的寬度 +${4*r}%`},
  {id:'b_str',br:'blk',tier:2,max:2,name:'壓網',d:r=>`攔網力量 +${(.5*r).toFixed(1)}`},
  {id:'b_soft',br:'blk',tier:2,max:2,name:'收手',d:r=>`被打手出界的機率 −${6*r}%`},
  {id:'kill',br:'blk',tier:3,max:1,act:1,name:'攔死',col:'#b6ff7a',dur:0,when:'下一次攔網',d:(r,m)=>`下一次攔網碰到球時攔網力量 +${(3*m).toFixed(1)}（很容易直接攔網得分）`},
  {id:'toss',br:'set',tier:1,max:3,act:1,name:'神準舉球',col:'#ffd23f',dur:0,when:'下一次舉球',d:(r,m)=>`下一次舉球完全不偏、不會被降級，攻手扣球品質 +${pc((.06+.04*r)*m)}`},
  {id:'s_toss',br:'set',tier:1,max:3,name:'手感',d:r=>`舉球偏差 −${12*r}%`},
  {id:'s_serve',br:'set',tier:2,max:2,name:'發球手',d:r=>`發球落點偏差 −${12*r}%、球速 +${2*r}%`},
  {id:'s_quick',br:'set',tier:2,max:2,name:'快攻節奏',d:r=>`平快、快攻的舉球偏差 −${12*r}%`},
  {id:'ace',br:'set',tier:3,max:1,act:1,name:'重砲發球',col:'#ff6b6b',dur:0,when:'下一次發球',d:(r,m)=>`下一次發球品質 PERFECT、球速 +${pc(.1*m)}，飄球飄得更兇`}];
const TS={};TSK.forEach(s=>TS[s.id]=s);
const ROLE_ACT={oh:'power',op:'power',mb:'wall',set:'toss'};
// ---------- 資料 ----------
function charRole(id){for(const r of ROLES)if(CHARS[r].some(c=>c.id===id))return r;return 'oh';}
// 舊存檔：技能點＝等級−1；送一點在原本位置的技能上並裝備，讓剛開始就有技能可以用
function treeOf(id){const g=gOf(id);if(!g.tree){g.tree={};g.sp=Math.max(0,(g.lv||1)-1);const a=ROLE_ACT[charRole(id)];g.tree[a]=1;g.eq=a;}if(g.sp==null)g.sp=0;return g;}
const brPts=(tree,br,below)=>TSK.filter(s=>s.br===br&&(!below||s.tier<below)).reduce((n,s)=>n+(tree[s.id]||0),0);
function gateReason(tree,s){if(s.tier>1){const need=TIER_REQ[s.tier],have=brPts(tree,s.br,s.tier);if(have<need)return`先在「${TB.find(b=>b.id===s.br).name}」前面投 ${need} 點（目前 ${have}）`;}return '';}
function canInvest(g,s){return g.sp>0&&(g.tree[s.id]||0)<s.max&&!gateReason(g.tree,s);}
function invest(id,sid){const g=treeOf(id),s=TS[sid];if(!canInvest(g,s))return false;g.tree[sid]=(g.tree[sid]||0)+1;g.sp--;if(s.act&&!g.eq)g.eq=sid;gSave();return true;}
// 退一點：不能讓後面已經點的技能失去門檻
function canRefund(g,s){const r=g.tree[s.id]||0;if(r<=0)return false;const t=Object.assign({},g.tree);t[s.id]=r-1;
  return !TSK.some(o=>o.br===s.br&&o.tier>s.tier&&(t[o.id]||0)>0&&gateReason(t,o));}
function refund(id,sid){const g=treeOf(id),s=TS[sid];if(!canRefund(g,s))return false;g.tree[sid]--;g.sp++;if(!g.tree[sid])delete g.tree[sid];
  if(g.eq===sid&&!g.tree[sid])g.eq=TSK.find(o=>o.act&&g.tree[o.id])?.id||null;gSave();return true;}
function treeReset(id){const g=treeOf(id);for(const k in g.tree)g.sp+=g.tree[k];g.tree={};g.eq=null;gSave();}
function equip(id,sid){const g=treeOf(id);if(!TS[sid]||!TS[sid].act||!g.tree[sid])return false;g.eq=sid;gSave();return true;}
// 自動配點：照位置的主分支 → 防守 → 其他；先主動、再被動、再下一層
const ROLE_BR={oh:['atk','def','blk','set'],op:['atk','blk','def','set'],mb:['blk','atk','def','set'],set:['set','def','blk','atk']};
function autoPlan(role){const o=[];for(const br of ROLE_BR[role]){const L=TSK.filter(s=>s.br===br).sort((a,b)=>a.tier-b.tier||(b.act|0)-(a.act|0));for(const s of L)for(let i=0;i<s.max;i++)o.push(s.id);}return o;}
function autoSpend(tree,role,n){const plan=autoPlan(role);let left=n;for(let pass=0;pass<3&&left>0;pass++)for(const sid of plan){if(left<=0)break;const s=TS[sid],g={sp:left,tree};if(canInvest(g,s)){tree[sid]=(tree[sid]||0)+1;left--;}}return left;}
function autoInvest(id){const g=treeOf(id);g.sp=autoSpend(g.tree,charRole(id),g.sp);if(!g.eq||!g.tree[g.eq])g.eq=bestAct(g.tree);gSave();}
function bestAct(tree){const L=TSK.filter(s=>s.act&&tree[s.id]).sort((a,b)=>b.tier-a.tier||(tree[b.id]-tree[a.id]));return L.length?L[0].id:null;}
// ---------- 比賽中 ----------
// 對手（和多人連線）的球員：照強度給一套自動配好的技能樹，和玩家隊伍同一套規則
function oppLevel(){if(MATCH.mode==='stage')return[1,3,6,9,12,15][MATCH.stage]||1;if(MATCH.mode==='net')return 4;const d=MATCH.diff[1-ME];return{easy:1,normal:3,hard:6,hell:9}[d]||3;}
function treeApply(){for(const p of players){if(p.team===ME&&MATCH.mode!=='net'&&p.ch&&p.ch.id){const g=treeOf(p.ch.id);p.tree=Object.assign({},g.tree);p.eq=g.eq&&g.tree[g.eq]?g.eq:bestAct(g.tree);}
    else{const t={},a=ROLE_ACT[p.role];t[a]=1;autoSpend(t,p.role,oppLevel()-1+(p.ace?2:0));p.tree=t;p.eq=bestAct(t);}}}
const pr=(p,id)=>p&&p.tree?(p.tree[id]||0):0;
const pStat=(p,k)=>p&&p.st?p.st[k]:5;
function skM(p,sid){const s=TS[sid],b=s&&TB.find(x=>x.id===s.br);return .7+pStat(p,b?b.stat:'pow')*.06;}
const skRk=(p,sid)=>Math.max(1,pr(p,sid));
// ---------- 技能樹畫面 ----------
const TV={cid:null,sel:null,hov:null,prev:null};
function openTree(cid){TV.from=PAGES.find(x=>x!=='vTree'&&!$(x).hidden)||'vPrep';TV.cid=cid||PV.cid||prep.chars[prep.role];TV.sel=null;show('vTree');$('trBack').textContent=TV.from==='vMenu'?'← 主選單':'← 賽前準備';renderTree();}
function treeChars(){return ROLES.map(r=>({r,c:charOf(r,prep.chars[r])}));}
function effSt(cid,extra){const r=charRole(cid),c=CHARS[r].find(x=>x.id===cid),g=treeOf(cid),st={};for(const k of STAT_KEYS){st[k]=Math.min(GROW_CAP,c.st[k]+(g.add[k]||0)+(extra===k?1:0));}return{base:c.st,st};}
// 六角雷達圖：灰＝原本能力、金＝加點後、虛線＝再加一點的預覽
function radarSvg(cid,prevK){const {base,st}=effSt(cid),pv=prevK?effSt(cid,prevK).st:null,K=['pow','jmp','spd','blk','set','rcv'],R=86,c=110;
  const pt=(i,v)=>{const a=-Math.PI/2+i*Math.PI/3,r=R*(.1+.9*Math.min(1,v/GROW_CAP));return[c+Math.cos(a)*r,c+Math.sin(a)*r];};
  const poly=S=>K.map((k,i)=>pt(i,S[k]).map(v=>v.toFixed(1)).join(',')).join(' ');
  const ring=s=>K.map((k,i)=>{const a=-Math.PI/2+i*Math.PI/3;return(c+Math.cos(a)*R*s).toFixed(1)+','+(c+Math.sin(a)*R*s).toFixed(1);}).join(' ');
  const lab=K.map((k,i)=>{const a=-Math.PI/2+i*Math.PI/3,x=c+Math.cos(a)*(R+16),y=c+Math.sin(a)*(R+16)+4,an=Math.abs(x-c)<4?'middle':x>c?'start':'end',ad=st[k]-base[k];
    return`<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${an}" class="rdL">${STAT[k]} <tspan class="rdV">${st[k]}</tspan>${ad?`<tspan class="rdA"> +${ad}</tspan>`:''}</text>`;}).join('');
  return`<svg viewBox="-34 -6 288 232" class="radar" role="img" aria-label="能力雷達圖">${[.25,.5,.75,1].map(s=>`<polygon points="${ring(s)}" class="rdG"/>`).join('')}
    ${K.map((k,i)=>{const p2=pt(i,GROW_CAP);return`<line x1="${c}" y1="${c}" x2="${p2[0].toFixed(1)}" y2="${p2[1].toFixed(1)}" class="rdG"/>`;}).join('')}
    <polygon points="${poly(st)}" class="rdCur"/><polygon points="${poly(base)}" class="rdBase"/>${pv?`<polygon points="${poly(pv)}" class="rdPrev"/>`:''}${lab}</svg>`;}
function nodeHTML(g,s,cid){const r=g.tree[s.id]||0,lock=gateReason(g.tree,s),can=canInvest(g,s),st=effSt(cid).st,b=TB.find(x=>x.id===s.br);
  const seg=Array.from({length:s.max},(_,i)=>`<i class="${i<r?'on':''}"></i>`).join('');
  return`<button class="tNode${s.act?' act':''}${s.tier===3?' t3':''}${lock?' lock':''}${can?' can':''}${r>=s.max?' max':''}${TV.sel===s.id?' sel':''}${g.eq===s.id?' eq':''}" data-sk="${s.id}" style="--bc:${s.col||b.col}" aria-label="${s.name} ${r}/${s.max}">
    <span class="tIc">${s.act?'◆':'●'}</span><span class="tNm">${s.name}</span><span class="tSeg">${seg}</span>${g.eq===s.id?'<em class="tEq">Q</em>':''}</button>`;}
function renderTree(){const box=$('trBody');if(!box||!TV.cid)return;const cid=TV.cid,g=treeOf(cid),role=charRole(cid),ch=CHARS[role].find(c=>c.id===cid),{st}=effSt(cid);
  $('trWho').innerHTML=treeChars().map(({r,c})=>`<button class="pill" data-tc="${c.id}" aria-pressed="${c.id===cid}">${ROLE[r].short}・${c.name}<small> Lv ${gOf(c.id).lv}</small></button>`).join('');
  $('trPts').innerHTML=`<span>Lv <b>${g.lv}</b></span><span>技能點 <b>${g.sp}</b></span><span>屬性點 <b>${g.pts}</b></span><span class="trEqN">上場技能（Q）：<b style="color:${g.eq?TS[g.eq].col:'var(--dim)'}">${g.eq?TS[g.eq].name:'沒有'}</b></span>`;
  // 技能樹：4 欄 × （T1、門檻、T2、門檻、T3）
  let h='';for(const b of TB){const n=brPts(g.tree,b.id),m=(.7+st[b.stat]*.06);
    h+=`<div class="tCol" style="--bc:${b.col}"><div class="tHd"><b>${b.name}</b><small>${n} 點・威力看${STAT[b.stat]} ${st[b.stat]}（×${m.toFixed(2)}）</small></div>`;
    for(const t of [1,2,3]){if(t>1){const need=TIER_REQ[t],have=brPts(g.tree,b.id,t);h+=`<div class="tGate${have>=need?' ok':''}">${Math.min(have,need)} / ${need}${have>=need?' ✓':''}</div>`;}
      h+=`<div class="tRow">${TSK.filter(s=>s.br===b.id&&s.tier===t).map(s=>nodeHTML(g,s,cid)).join('')}</div>`;}
    h+='</div>';}
  $('trTree').innerHTML=h;
  renderInfo();renderRadar();}
function renderInfo(){const cid=TV.cid,g=treeOf(cid),{st}=effSt(cid);
  document.querySelectorAll('#trTree .tNode').forEach(n=>n.classList.toggle('sel',n.dataset.sk===TV.sel));
  // 詳細說明
  const sid=TV.sel||TV.hov,s=sid&&TS[sid];
  if(s){const r=g.tree[s.id]||0,b=TB.find(x=>x.id===s.br),m=.7+st[b.stat]*.06,lock=gateReason(g.tree,s);
    $('trInfo').innerHTML=`<div class="tiH"><b style="color:${s.col||b.col}">${s.name}</b><span>${s.act?'主動技能（帶上場，量表滿了按 Q）':'被動技能（一直有效）'}・${b.name} 第 ${s.tier} 層・${r} / ${s.max}</span></div>
      <div class="tiE">${r?`目前：${s.d(r,m)}`:'還沒學'}${r<s.max?`<br><span class="tiN">${r?'下一級':'學會後'}：${s.d(r+1,m)}</span>`:''}</div>
      ${s.act?`<div class="tiM">威力看${STAT[b.stat]}：目前 ${st[b.stat]} → 倍率 ×${m.toFixed(2)}（能力越高，技能越強）</div>`:''}
      ${lock?`<div class="tiL">🔒 ${lock}</div>`:''}
      <div class="big2"><button class="tb" data-tact="inv" ${canInvest(g,s)?'':'disabled'}>投 1 點</button><button class="tb" data-tact="ref" ${canRefund(g,s)?'':'disabled'}>退 1 點</button>${s.act?`<button class="tb" data-tact="eq" ${r&&g.eq!==s.id?'':'disabled'}>${g.eq===s.id?'已帶上場':'帶上場（Q）'}</button>`:''}</div>`;}
  else $('trInfo').innerHTML='<div class="tiE">點一個技能看說明。雙擊（或按「投 1 點」）投點，右鍵退點。◆＝主動技能（挑一個帶上場），●＝被動技能。</div>';
}
function renderRadar(){const cid=TV.cid,g=treeOf(cid),{st}=effSt(cid);
  // 雷達圖＋屬性加點
  $('trRadar').innerHTML=radarSvg(cid,TV.prev)+`<div class="trStat">${STAT_KEYS.map(k=>{const full=st[k]>=GROW_CAP;return`<button class="tb" data-ts="${k}" ${g.pts>0&&!full?'':'disabled'}>＋ ${STAT[k]} <small>${st[k]}${full?' MAX':''}</small></button>`;}).join('')}</div>
    <p class="sub" style="font-size:12px;margin:6px 0 0">灰色＝原本能力、金色＝加點後；游標停在 ＋ 上會用虛線預覽。能力最多 ${GROW_CAP}。</p>`;}
document.addEventListener('click',e=>{if($('vTree').hidden)return;
  const w=e.target.closest('[data-tc]');if(w){TV.cid=w.dataset.tc;TV.sel=null;renderTree();return;}
  const n=e.target.closest('[data-sk]');if(n){TV.sel=n.dataset.sk;renderInfo();return;}
  const a=e.target.closest('[data-tact]');if(a&&TV.sel){const k=a.dataset.tact;if(k==='inv'?invest(TV.cid,TV.sel):k==='ref'?refund(TV.cid,TV.sel):equip(TV.cid,TV.sel)){SFX.call&&SFX.call();}renderTree();return;}
  const s=e.target.closest('[data-ts]');if(s){if(gSpend(TV.cid,s.dataset.ts)){SFX.call&&SFX.call();}renderTree();return;}
  if(e.target.id==='trAuto'){autoInvest(TV.cid);renderTree();return;}
  if(e.target.id==='trReset'){const b=e.target;if(b.dataset.arm!=='1'){b.dataset.arm='1';b.textContent='再按一次確認';setTimeout(()=>{b.dataset.arm='';b.textContent='重置技能點';},3000);return;}treeReset(TV.cid);renderTree();return;}
  if(e.target.id==='trBack'){show(TV.from||'vPrep');}});
document.addEventListener('dblclick',e=>{if($('vTree').hidden)return;const n=e.target.closest('[data-sk]');if(n&&invest(TV.cid,n.dataset.sk)){TV.sel=n.dataset.sk;SFX.call&&SFX.call();renderTree();}});
document.addEventListener('contextmenu',e=>{if($('vTree').hidden)return;const n=e.target.closest('[data-sk]');if(n){e.preventDefault();if(refund(TV.cid,n.dataset.sk)){TV.sel=n.dataset.sk;renderTree();}}});
document.addEventListener('mouseover',e=>{if($('vTree').hidden)return;const s=e.target.closest('[data-ts]'),n=e.target.closest('[data-sk]');const pk=s&&!s.disabled?s.dataset.ts:null,hv=n?n.dataset.sk:null;
  if(pk!==TV.prev){TV.prev=pk;renderRadar();}if(!TV.sel&&hv!==TV.hov){TV.hov=hv;renderInfo();}});
