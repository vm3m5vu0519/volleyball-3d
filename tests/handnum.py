import asyncio,json,sys
from playwright.async_api import async_playwright
IDS=sys.argv[1].split(',')
JS="""((sid,mode)=>{SKX.sel=sid;skRig();SKX.mode=mode;SKX.t=0;for(let i=0;i<60;i++){SKX.orbit=0;skFrame(1/60);}
 const R=SKX.rig,B=R.glb.B,m=R.glb.m||R.g;const V=n=>{const b=B[n]||findBone(R.g,n);return b?b.getWorldPosition(new THREE.Vector3()):null;};
 // 角色的前方：兩腳中點指向…用骨盆的世界方向
 const lr=V('LeftUpLeg').sub(V('RightUpLeg')).normalize(),up=new THREE.Vector3(0,1,0),fw=new THREE.Vector3().crossVectors(lr,up).normalize();
 const out={};for(const s of ['Left','Right']){const h=V(s+'Hand'),fi=B[s+'HandMiddle1'];let th=null;B[s+'Hand'].traverse(o=>{if(!th&&o!==B[s+'Hand']&&/thumb/i.test(o.name))th=o;});if(!th){const ch=B[s+'Hand'].children.filter(c=>c.isBone);th=ch.sort((a,b)=>a.position.y-b.position.y)[0];}out[s+'_tn']=th&&th.name;
   if(!fi||!th){out[s]='nobones';continue;}const f=fi.getWorldPosition(new THREE.Vector3()).sub(h).normalize(),t=th.getWorldPosition(new THREE.Vector3()).sub(h).normalize();
   const side=V(s+'Arm').sub(V(s==='Left'?'RightArm':'LeftArm')).normalize();
   out[s]={fingerDown:+(-f.y).toFixed(2),thumbFwd:+t.dot(fw).toFixed(2),thumbOut:+t.dot(side).toFixed(2),thumbUp:+t.y.toFixed(2),handSideOfBody:+h.clone().sub(V('Hips')).dot(lr).toFixed(2)};}
 return {lrCheck:+V('LeftArm').sub(V('RightArm')).dot(lr).toFixed(2),...out};})"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':800,'height':600});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.add_init_script('window.__skinOnlyUsed=1');await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2000)
    for k in range(90):
      n=await pg.evaluate("%s.filter(i=>i=='__none'||SKINS[i]&&SKINS[i].gltf).length"%json.dumps(IDS))
      if n==len(IDS):break
      await pg.wait_for_timeout(1000)
    await pg.click('#mSkin');await pg.wait_for_timeout(500)
    print(await pg.evaluate("Object.keys(SKX.rig&&SKX.rig.glb&&SKX.rig.glb.B||{}).join(',')"))
    for sid in IDS:
      for mode in ['stand','run','ready']:
        print(sid,mode,json.dumps(await pg.evaluate(JS+f"('{sid}','{mode}')")))
    print(errs);await b.close()
asyncio.run(main())
