# 從 CMU 動作捕捉（BVH）量真人跑步的關節角度，平均成一個步伐週期，輸出成遊戲用的表
# 角度定義（側面平面，往前為正）：大腿與垂直線的夾角、膝蓋彎曲、上臂與垂直線的夾角、手肘彎曲、軀幹前傾、兩腳都離地的高度
import numpy as np,sys,json,re
def parse(fn):
    t=open(fn).read().split('MOTION');H=t[0];M=t[1].strip().split('\n')
    joints=[];stack=[];chans=[]
    for line in H.split('\n'):
        w=line.split()
        if not w:continue
        if w[0] in('ROOT','JOINT'):joints.append({'name':w[1],'parent':stack[-1] if stack else -1,'off':None,'ch':[]});cur=len(joints)-1
        elif w[0]=='End':joints.append({'name':joints[stack[-1]]['name']+'_end','parent':stack[-1],'off':None,'ch':[]});cur=len(joints)-1
        elif w[0]=='{':stack.append(cur)
        elif w[0]=='}':stack.pop()
        elif w[0]=='OFFSET':joints[cur]['off']=np.array(list(map(float,w[1:4])))
        elif w[0]=='CHANNELS':joints[cur]['ch']=w[2:];
    dt=float(M[1].split(':')[1]);data=np.array([list(map(float,l.split())) for l in M[2:] if l.strip()])
    return joints,dt,data
def rot(axis,deg):
    a=np.radians(deg);c,s=np.cos(a),np.sin(a)
    if axis=='X':return np.array([[1,0,0],[0,c,-s],[0,s,c]])
    if axis=='Y':return np.array([[c,0,s],[0,1,0],[-s,0,c]])
    return np.array([[c,-s,0],[s,c,0],[0,0,1]])
def fk(joints,data):
    F=len(data);P=np.zeros((F,len(joints),3))
    for f in range(F):
        i=0;R=[None]*len(joints);T=[None]*len(joints)
        for j,J in enumerate(joints):
            r=np.eye(3);pos=J['off'].copy()
            for c in J['ch']:
                v=data[f,i];i+=1
                if c.endswith('position'):pos[{'X':0,'Y':1,'Z':2}[c[0]]]=v
                else:r=r@rot(c[0],v)
            if J['parent']<0:R[j]=r;T[j]=pos
            else:p=J['parent'];T[j]=T[p]+R[p]@J['off'];R[j]=R[p]@r
            P[f,j]=T[j]
    return P
def ang(v,fw):  # 與垂直往下的夾角，往前為正（只看側面平面）
    return np.arctan2(v@fw,-v[...,1]) if v.ndim==1 else np.arctan2(v@fw,-v[:,1])
def between(a,b):
    a=a/np.linalg.norm(a,axis=1,keepdims=True);b=b/np.linalg.norm(b,axis=1,keepdims=True);return np.arccos(np.clip((a*b).sum(1),-1,1))
def analyze(fn):
    J,dt,D=parse(fn);P=fk(J,D);ix={j['name']:k for k,j in enumerate(J)}
    g=lambda n:P[:,ix[n]]
    hip=g('Hips');v=np.gradient(hip,dt,axis=0);vh=v.copy();vh[:,1]=0
    fw=vh.mean(0);fw/=np.linalg.norm(fw);fw3=np.array([fw[0],0,fw[2]])
    # 每格各自的前進方向（轉彎的片段也能用）
    sp=np.linalg.norm(vh,axis=1)
    out={}
    for s in('Left','Right'):
        th=g(s+'Leg')-g(s+'UpLeg');sh=g(s+'Foot')-g(s+'Leg');ua=g(s+'ForeArm')-g(s+'Arm');fa=g(s+'Hand')-g(s+'ForeArm')
        out[s]={'th':np.arctan2(th@fw3,-th[:,1]),'knee':between(th,sh),'ua':np.arctan2(ua@fw3,-ua[:,1]),'elbow':between(ua,fa),'ankleY':g(s+'Foot')[:,1]}
    trunk=g('Neck')-g('Hips') if 'Neck' in ix else g('Head')-g('Hips')
    lean=np.arctan2(trunk@fw3,trunk[:,1])
    L=np.linalg.norm(J[ix['LeftLeg']]['off'])+np.linalg.norm(J[ix['LeftFoot']]['off'])
    return dict(dt=dt,sp=sp,L=L,lean=lean,O=out,hipY=hip[:,1])
def cycles(A,N=64):
    th=A['O']['Left']['th'];n=len(th);dt=A['dt']
    # 先用自相關估週期（0.45–1.0 秒），再找間隔約一個週期的峰值
    x=th-th.mean();ac=np.correlate(x,x,'full')[n-1:];lo,hi=int(.45/dt),min(n-2,int(1.0/dt))
    if hi<=lo+2:return []
    per=lo+int(np.argmax(ac[lo:hi]))
    pk=[];i=int(np.argmax(th[:per]))
    while i<n:
        pk.append(i);j0,j1=i+int(per*.8),min(n,i+int(per*1.2))
        if j0>=n:break
        i=j0+int(np.argmax(th[j0:j1])) if j1>j0 else n
    res=[]
    for a,b in zip(pk,pk[1:]):
        x=np.linspace(a,b,N,endpoint=False);I=lambda y:np.interp(x,np.arange(n),y)
        O=A['O'];gr=min(A['O']['Left']['ankleY'].min(),A['O']['Right']['ankleY'].min())
        res.append(dict(T=(b-a)*A['dt'],sp=float(A['sp'][a:b].mean())/A['L'],  # 速度：每秒幾個腿長
          thL=I(O['Left']['th']),thR=I(O['Right']['th']),kL=I(O['Left']['knee']),kR=I(O['Right']['knee']),uaL=I(O['Left']['ua']),uaR=I(O['Right']['ua']),
          eL=I(O['Left']['elbow']),eR=I(O['Right']['elbow']),lean=I(A['lean']),fl=I((np.minimum(O['Left']['ankleY'],O['Right']['ankleY'])-gr)/A['L'])))
    return res
if __name__=='__main__':
    allc={}
    for fn in sys.argv[1:]:
        A=analyze(fn);C=cycles(A);tag=fn.split('/')[-1]
        print(tag,'cycles',len(C),'period %.3f'%np.mean([c['T'] for c in C]) if C else '', 'speed(leglen/s) %.2f'%(np.mean([c['sp'] for c in C]) if C else 0))
        allc[tag]=C
    json.dump({k:[{kk:(vv.tolist() if hasattr(vv,'tolist') else vv) for kk,vv in c.items()} for c in v] for k,v in allc.items()},open('/tmp/gait.json','w'))
