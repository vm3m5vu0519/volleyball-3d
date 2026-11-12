# 組裝：把 src/ 裡的程式片段串成單一網頁 dist/volleyball-3d.html（線上版，程式庫走 CDN）
# 另外產生根目錄 test.html（測試用，程式庫改讀 node_modules/three）
import base64,os
H=os.path.dirname(os.path.abspath(__file__));S=os.path.join(H,'src')
sh=open(os.path.join(S,'shell.html'),encoding='utf-8').read()
js=''.join(open(os.path.join(S,f),encoding='utf-8').read() for f in ['g1.js','g2.js','g3.js','g4.js','g6.js','g7.js','g8.js','g9.js','g10.js','g11.js','g12.js','g5.js'])
b=base64.b64encode(open(os.path.join(S,'Mannequin_F.glb'),'rb').read()).decode()
out=sh.replace('<script>/*GLB*/</script>','<script>/* CC0 模型：Quaternius Universal Animation Library 2 — Mannequin_F（CC0 1.0） */window.GLB_B64="'+b+'";</script>').replace('<script>/*GAME*/</script>','<script>\n'+js+'\n</script>')
os.makedirs(os.path.join(H,'dist'),exist_ok=True)
open(os.path.join(H,'dist','volleyball-3d.html'),'w',encoding='utf-8').write(out)
t=out.replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','node_modules/three/build/three.min.js').replace('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/','node_modules/three/examples/js/')
open(os.path.join(H,'test.html'),'w',encoding='utf-8').write(t)
print('dist/volleyball-3d.html',len(out))
