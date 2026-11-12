# 產生離線包 熱血排球3D.7z：直接雙擊 index.html 就能玩（模型轉成 .vrm.js、程式庫放本機）
# 用法：python3 build.py && python3 tools/make_offline.py    （需要 pip install py7zr，以及 npm install 取得 three）
import base64,glob,os,re,shutil
H=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));O=os.path.join(H,'out','熱血排球3D')
shutil.rmtree(os.path.join(H,'out'),ignore_errors=True);os.makedirs(os.path.join(O,'skins'))
s=open(os.path.join(H,'dist','volleyball-3d.html'),encoding='utf-8').read()
s=s.replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','lib/three/three.min.js').replace('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/','lib/three/examples/js/')
open(os.path.join(O,'index.html'),'w',encoding='utf-8').write(s)
g8=open(os.path.join(H,'src','g8.js'),encoding='utf-8').read();ids={u:i for i,u in re.findall(r"\{id:'([^']+)',name:'[^']*',url:'([^']+)'",g8)}
for f in glob.glob(os.path.join(H,'skins','*.vrm.wasm')):
  u='skins/'+os.path.basename(f);open(os.path.join(O,'skins',os.path.basename(f).replace('.vrm.wasm','.vrm.js')),'w').write("(window.__SKB=window.__SKB||{})['%s']='%s';"%(ids[u],base64.b64encode(open(f,'rb').read()).decode()))
shutil.copytree(os.path.join(H,'pose'),os.path.join(O,'pose'))
T=os.path.join(H,'node_modules','three');L=os.path.join(O,'lib','three')
os.makedirs(L);shutil.copy(os.path.join(T,'build','three.min.js'),L);shutil.copy(os.path.join(T,'LICENSE'),L)
for f in ['loaders/GLTFLoader.js','utils/SkeletonUtils.js','shaders/CopyShader.js','shaders/LuminosityHighPassShader.js','postprocessing/EffectComposer.js','postprocessing/RenderPass.js','postprocessing/ShaderPass.js','postprocessing/UnrealBloomPass.js']:
  d=os.path.join(L,'examples','js',os.path.dirname(f));os.makedirs(d,exist_ok=True);shutil.copy(os.path.join(T,'examples','js',f),d)
shutil.copy(os.path.join(H,'docs','offline-readme.txt'),os.path.join(O,'說明.txt'))
import py7zr
with py7zr.SevenZipFile(os.path.join(H,'out','熱血排球3D.7z'),'w',filters=[{'id':py7zr.FILTER_LZMA2,'preset':7}]) as z:z.writeall(O,'熱血排球3D')
print('out/熱血排球3D.7z')
