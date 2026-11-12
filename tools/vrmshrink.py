# 縮小 VRM/GLB 內嵌貼圖：最大邊 MAX px；沒有透明的貼圖改存 JPEG
import json,struct,sys,io
from PIL import Image
src,dst=sys.argv[1],sys.argv[2];MAX=int(sys.argv[3]) if len(sys.argv)>3 else 1024
b=open(src,'rb').read();jl=struct.unpack('<I',b[12:16])[0];j=json.loads(b[20:20+jl]);bo=20+jl;bl=struct.unpack('<I',b[bo:bo+4])[0];bin_=b[bo+8:bo+8+bl]
# 去掉表情用的 morph target（遊戲沒用到，佔檔案大半）
for m in j.get('meshes',[]):
  m.pop('weights',None);(m.get('extras') or {}).pop('targetNames',None)
  for p in m['primitives']:p.pop('targets',None);(p.get('extras') or {}).pop('targetNames',None)
vx=j.get('extensions',{}).get('VRM',{})
if 'blendShapeMaster' in vx:vx['blendShapeMaster']={'blendShapeGroups':[]}
used=set(range(len(j['accessors'])))
# 只保留還有人用的 accessor
ref=set()
def walk(o):
  if isinstance(o,dict):
    for k,v in o.items():
      if k in('indices','inverseBindMatrices','input','output') and isinstance(v,int):ref.add(v)
      elif k=='attributes':ref.update(v.values())
      else:walk(v)
  elif isinstance(o,list):[walk(x) for x in o]
walk({k:v for k,v in j.items() if k!='accessors'})
amap={};acc=[]
for i,a in enumerate(j['accessors']):
  if i in ref:amap[i]=len(acc);acc.append(a)
def remap(o):
  if isinstance(o,dict):
    for k,v in list(o.items()):
      if k in('indices','inverseBindMatrices','input','output') and isinstance(v,int):o[k]=amap[v]
      elif k=='attributes':o[k]={kk:amap[vv] for kk,vv in v.items()}
      else:remap(v)
  elif isinstance(o,list):[remap(x) for x in o]
remap({k:v for k,v in j.items() if k!='accessors'});j['accessors']=acc
# 臉和眼睛的貼圖保留 MAX，其餘（衣服、頭髮、身體）縮到一半，省下顯示卡記憶體
faceimg=set()
for m in j.get('materials',[]):
  if any(k in m.get('name','') for k in ('Face','EYE','Eye')):
    t=m.get('pbrMetallicRoughness',{}).get('baseColorTexture')
    if t:faceimg.add(j['textures'][t['index']]['source'])
for mp in j.get('extensions',{}).get('VRM',{}).get('materialProperties',[]):
  if any(k in mp.get('name','') for k in ('Face','EYE','Eye')):
    for v in mp.get('textureProperties',{}).values():faceimg.add(j['textures'][v]['source'])
bvs=j['bufferViews'];imgbv={im['bufferView']:i for i,im in enumerate(j.get('images',[])) if 'bufferView' in im}
usedbv={a['bufferView'] for a in acc if 'bufferView' in a}|set(imgbv)
bvmap={};out=bytearray();nb=[]
for i,bv in enumerate(bvs):
  if i not in usedbv:continue
  bvmap[i]=len(nb)
  data=bin_[bv.get('byteOffset',0):bv.get('byteOffset',0)+bv['byteLength']]
  if i in imgbv:
    im=Image.open(io.BytesIO(data));im.load()
    lim=MAX if imgbv[i] in faceimg else MAX//2
    if max(im.size)>lim:
      s=lim/max(im.size);im=im.resize((max(1,int(im.width*s)),max(1,int(im.height*s))),Image.LANCZOS)
    hasA=im.mode in('RGBA','LA','P') and im.convert('RGBA').getextrema()[3][0]<250
    o=io.BytesIO()
    if hasA:im.convert('RGBA').save(o,'PNG',optimize=True);mt='image/png'
    else:im.convert('RGB').save(o,'JPEG',quality=88);mt='image/jpeg'
    data=o.getvalue();j['images'][imgbv[i]]['mimeType']=mt
  while len(out)%4:out.append(0)
  nbv=dict(bv);nbv['byteOffset']=len(out);nbv['byteLength']=len(data);nbv['buffer']=0;out+=data;nb.append(nbv)
while len(out)%4:out.append(0)
for a in acc:
  if 'bufferView' in a:a['bufferView']=bvmap[a['bufferView']]
for im in j.get('images',[]):
  if 'bufferView' in im:im['bufferView']=bvmap[im['bufferView']]
j['bufferViews']=nb;j['buffers']=[{'byteLength':len(out)}]
js=json.dumps(j,separators=(',',':')).encode();js+=b' '*((4-len(js)%4)%4)
tot=12+8+len(js)+8+len(out)
open(dst,'wb').write(struct.pack('<III',0x46546C67,2,tot)+struct.pack('<II',len(js),0x4E4F534A)+js+struct.pack('<II',len(out),0x004E4942)+out)
print(dst,len(b)//1024,'->',tot//1024,'KB')
