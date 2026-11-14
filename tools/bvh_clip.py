# 把 CMU 動作捕捉（BVH）轉成遊戲「動作擷取」片段（17 點、公釐、骨盆中心為原點、面向 +Z、左手 +X、腿長縮放成遊戲人物 0.9 m）
# 用法：python3 bvh_clip.py run  <bvh> <out.json>   → 取一個完整步伐（從左大腿往前最大那一格開始），首尾接得起來
#       python3 bvh_clip.py stand <bvh> <out.json>  → 取 4 秒站立，頭尾交叉淡化成循環
import sys,json,numpy as np
sys.path.insert(0,__file__.rsplit('/',1)[0])
from bvh_gait import parse,fk
NAMES=['Head','LeftArm','RightArm','LeftForeArm','RightForeArm','LeftHand','RightHand','LeftHandIndex1','RightHandIndex1','LeftUpLeg','RightUpLeg','LeftLeg','RightLeg','LeftFoot','RightFoot','LeftToeBase','RightToeBase']
def load(fn):
  J,dt,D=parse(fn);P=fk(J,D);ix={j['name']:k for k,j in enumerate(J)}
  pts=np.stack([P[:,ix[n]] for n in NAMES],1)   # F×17×3
  # 腳尖用 ToeBase 的末端
  for s,i in (('LeftToeBase',15),('RightToeBase',16)):
    if s+'_end' in ix:pts[:,i]=P[:,ix[s+'_end']]
  return pts,dt
def frame_basis(p,fw=None):
  lat=p[9]-p[10];lat[1]=0;lat/=np.linalg.norm(lat);up=np.array([0,1.,0])
  if fw is None:fw=np.cross(lat,up)
  fw=fw.copy();fw[1]=0;fw/=np.linalg.norm(fw);lat=np.cross(up,fw)
  return np.stack([lat,up,fw])          # 列：x(左)、y、z(前)
def to_game(pts,fws):
  out=[]
  leg=np.mean([np.linalg.norm(f[9]-f[11])+np.linalg.norm(f[11]-f[13]) for f in pts]+[np.linalg.norm(f[10]-f[12])+np.linalg.norm(f[12]-f[14]) for f in pts])
  sc=.9/leg
  for f,fw in zip(pts,fws):
    B=frame_basis(f,fw);hm=(f[9]+f[10])/2;q=(f-hm)@B.T*sc
    # 鼻子：頭關節往前 9 cm、往上 3 cm（遊戲比例）
    q[0]=q[0]+np.array([0,.03,.09])
    out.append(q)
  return np.array(out)
def resample(a,src_dt,fps):
  n=len(a);T=(n-1)*src_dt;m=int(round(T*fps))+1;t=np.linspace(0,T,m);x=t/src_dt;i=np.clip(np.floor(x).astype(int),0,n-2);u=(x-i)[:,None,None]
  return a[i]*(1-u)+a[i+1]*u
def smooth(a,k=2):
  b=a.copy()
  for _ in range(k):b[1:-1]=(b[:-2]+2*b[1:-1]+b[2:])/4
  return b
mode,fn,out=sys.argv[1:4]
P,dt=load(fn)
if mode=='run':
  hip=(P[:,9]+P[:,10])/2;v=np.gradient(hip,dt,axis=0);v[:,1]=0;sp=np.linalg.norm(v,axis=1)
  vs=np.array([np.convolve(v[:,c],np.ones(15)/15,'same') for c in range(3)]).T
  fws=[vs[i] if np.linalg.norm(vs[i])>.1 else None for i in range(len(P))]
  G=to_game(P,fws)
  th=np.arctan2(G[:,11,2]-G[:,9,2],-(G[:,11,1]-G[:,9,1]))      # 左大腿往前角度
  thS=np.convolve(th,np.ones(7)/7,'same')
  W=int(.2/dt);pk=[i for i in range(W,len(thS)-W) if thS[i]==thS[i-W:i+W+1].max() and thS[i]>.25]
  spd=sp*(.9/np.mean([np.linalg.norm(f[9]-f[11])+np.linalg.norm(f[11]-f[13]) for f in P]))
  # 選速度最穩、在片段中段的週期
  best=None
  for a,b in zip(pk,pk[1:]):
    if a<len(P)*.1 or b>len(P)*.92 or not (.5<(b-a)*dt<.95):continue
    s=spd[a:b];sc=s.std()/s.mean()
    if best is None or sc<best[0]:best=(sc,a,b,s.mean())
  _,a,b,ms=best;cyc=G[a:b+1].copy()
  drift=cyc[-1]-cyc[0];n=len(cyc)
  for i in range(n):cyc[i]-=drift*(i/(n-1))      # 首尾接起來
  cyc=cyc[:-1];cyc=np.concatenate([cyc,cyc[:1]])
  R=resample(cyc,dt,60);R=smooth(np.concatenate([R[-4:-1],R,R[1:4]]))[3:-3]
  meta=dict(speed=round(float(ms),2),period=round((b-a)*dt,3))
  key=0
else:
  fws=[None]*len(P);G=to_game(P,[None]*len(P))
  # 用第一格的身體方向（站立不會轉）
  s0=int(1.0/dt);B0=frame_basis(P[s0]);G=to_game(P,[B0[2]]*len(P))
  n=int(4.0/dt);seg=G[s0:s0+n];X=int(.6/dt)
  for i in range(X):w=i/X;seg[i]=seg[i]*w+seg[n-X+i]*(1-w)   # 頭尾交叉淡化
  seg=seg[:n-X];seg=np.concatenate([seg,seg[:1]])
  R=resample(seg,dt,30);R=smooth(R,1)
  meta=dict(dur=round((len(R)-1)/30,2));key=0
fps=60 if mode=='run' else 30
clip=dict(slot=mode,name={'run':'跑步','stand':'站立'}[mode],fps=fps,key=key,builtin=True,src='CMU Graphics Lab Motion Capture Database '+fn.rsplit('/',1)[-1],f=np.round(R*1000).astype(int).tolist(),meta=meta)
json.dump(clip,open(out,'w'),separators=(',',':'))
print(mode,len(R),'frames',meta,'feetY',R[:,13:15,1].min().round(3),'hipToShoulder',np.round(R[0,1]-0,3))
