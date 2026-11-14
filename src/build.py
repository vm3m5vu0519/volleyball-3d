import base64,sys
sh=open('shell.html').read()
js=''.join(open(f).read() for f in ['g1.js','g2.js','g3.js','g4.js','g6.js','g7.js','g8.js','g9.js','g10.js','g11.js','g12.js','g5.js'])
b=base64.b64encode(open('Mannequin_F.glb','rb').read()).decode()
out=sh.replace('<script>/*GLB*/</script>','<script>/* CC0 模型：Quaternius Universal Animation Library 2 — Mannequin_F（CC0 1.0） */window.GLB_B64="'+b+'";</script>').replace('<script>/*GAME*/</script>','<script>\n'+js+'\n</script>')
open('volleyball-3d.html','w').write(out)
# test copy with local three
t=out.replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','node_modules/three/build/three.min.js').replace('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/','node_modules/three/examples/js/')
open('test.html','w').write(t)
print(len(out))
