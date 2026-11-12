import json,numpy as np
D=json.load(open('/tmp/gait.json'));C=[c for v in D.values() for c in v]
def grp(lo,hi):
    S=[c for c in C if lo<=c['sp']<hi];M={k:np.mean([np.array(c[k]) for c in S],0) for k in ['thL','thR','kL','kR','uaL','uaR','eL','eR','lean','fl']};M['T']=np.mean([c['T'] for c in S]);M['n']=len(S);M['sp']=np.mean([c['sp'] for c in S]);return M
J=grp(0,3.95);R=grp(3.95,9)
for nm,M in [('jog',J),('run',R)]:
    d=np.degrees
    print(nm,'n',M['n'],'speed %.2f leg/s'%M['sp'],'stride %.2fs'%M['T'])
    for k in ['thL','kL','uaL','eL','lean']:print('  %-5s min %6.1f max %6.1f mean %6.1f'%(k,d(M[k].min()),d(M[k].max()),d(M[k].mean())))
    print('  flight(max min-ankle height /leg) %.3f, frac of cycle airborne %.2f'%(M['fl'].max(),(M['fl']>0.04).mean()))
    # 相位關係：膝蓋最彎、上臂最前 相對大腿最前
    print('  knee max at phase %.2f, arm fwd max at %.2f, R thigh max at %.2f'%(np.argmax(M['kL'])/64,np.argmax(M['uaL'])/64,np.argmax(M['thR'])/64))
def ser(M):
    sm=lambda a:np.round(np.convolve(np.r_[a[-2:],a,a[:2]],np.ones(5)/5,'valid'),3)[::2].tolist()  # 32 點、平滑
    return {k:sm(M[k]) for k in ['thL','thR','kL','kR','uaL','uaR','eL','eR','lean','fl']}|{'T':round(float(M['T']),3),'sp':round(float(M['sp']),2)}
json.dump({'jog':ser(J),'run':ser(R)},open('/home/claude/vb/gait_cmu.json','w'))
