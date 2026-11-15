// 熱血排球 多人連線伺服器（不需要安裝任何套件，Node.js 18 以上直接執行）
//   node server.js            → http://localhost:8787
//   cloudflared tunnel --url http://localhost:8787   → 給朋友 https://xxxx.trycloudflare.com
// 這個伺服器只做兩件事：
//   1. 提供遊戲網頁（同一個資料夾的 index.html、lib/）
//   2. WebSocket 轉送（/ws）：房主的瀏覽器負責跑整場比賽，其他人只送按鍵、收畫面狀態
'use strict';
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const PORT=+(process.env.PORT||process.argv[2]||8787),ROOT=__dirname;
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.vrm':'model/gltf-binary','.wasm':'application/wasm'};

// ---------- 靜態檔案 ----------
const server=http.createServer((req,res)=>{
  let u=decodeURIComponent((req.url||'/').split('?')[0]);if(u==='/')u='/index.html';
  const f=path.normalize(path.join(ROOT,u));
  if(!f.startsWith(ROOT+path.sep)&&f!==ROOT){res.writeHead(403);return res.end();}
  if(path.basename(f)==='server.js'){res.writeHead(404);return res.end();}
  fs.stat(f,(e,st)=>{if(e||!st.isFile()){res.writeHead(404,{'content-type':'text/plain; charset=utf-8'});return res.end('找不到檔案');}
    res.writeHead(200,{'content-type':MIME[path.extname(f).toLowerCase()]||'application/octet-stream','cache-control':'no-cache'});fs.createReadStream(f).pipe(res);});
});

// ---------- 最小的 WebSocket 實作（RFC 6455，只用文字訊息） ----------
function wsAccept(key){return crypto.createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');}
function frame(op,buf){const n=buf.length;let h;
  if(n<126){h=Buffer.alloc(2);h[1]=n;}else if(n<65536){h=Buffer.alloc(4);h[1]=126;h.writeUInt16BE(n,2);}else{h=Buffer.alloc(10);h[1]=127;h.writeBigUInt64BE(BigInt(n),2);}
  h[0]=0x80|op;return Buffer.concat([h,buf]);}
class Conn{
  constructor(sock){this.sock=sock;this.buf=Buffer.alloc(0);this.frag=null;this.open=true;this.onmsg=()=>{};this.onclose=()=>{};
    sock.setNoDelay(true);
    sock.on('data',d=>{this.buf=Buffer.concat([this.buf,d]);this.parse();});
    sock.on('close',()=>this.end());sock.on('error',()=>this.end());}
  parse(){for(;;){const b=this.buf;if(b.length<2)return;const fin=b[0]&0x80,op=b[0]&15,masked=b[1]&0x80;let len=b[1]&127,o=2;
    if(len===126){if(b.length<4)return;len=b.readUInt16BE(2);o=4;}else if(len===127){if(b.length<10)return;len=Number(b.readBigUInt64BE(2));o=10;}
    if(len>4*1024*1024){this.close();return;}
    const mo=o;if(masked)o+=4;if(b.length<o+len)return;let p=b.subarray(o,o+len);
    if(masked){const m=b.subarray(mo,mo+4);p=Buffer.from(p);for(let i=0;i<p.length;i++)p[i]^=m[i&3];}
    this.buf=b.subarray(o+len);
    if(op===8){this.close();return;}
    if(op===9){this.raw(10,p);continue;}
    if(op===10)continue;
    if(op===0){if(this.frag){this.frag.push(p);if(fin){const all=Buffer.concat(this.frag);this.frag=null;this.onmsg(all.toString('utf8'));}}continue;}
    if(op===1||op===2){if(fin)this.onmsg(p.toString('utf8'));else this.frag=[p];}}}
  raw(op,p){if(!this.open)return;try{this.sock.write(frame(op,p));}catch(e){this.end();}}
  send(s){this.raw(1,Buffer.from(s,'utf8'));}
  close(){if(this.open){this.raw(8,Buffer.alloc(0));}this.end();}
  end(){if(!this.open)return;this.open=false;try{this.sock.destroy();}catch(e){}this.onclose();}}

// ---------- 房間 ----------
// 訊息都是 JSON：{t:'create'|'join', name, code}；之後房主送的訊息帶 to＝某個人，不帶 to＝全部人；其他人送的訊息一律轉給房主（加上 from）
const rooms=new Map();let NID=1;
const code4=()=>{const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s;do{s='';for(let i=0;i<4;i++)s+=A[Math.random()*A.length|0];}while(rooms.has(s));return s;};
server.on('upgrade',(req,sock)=>{
  if((req.url||'').split('?')[0]!=='/ws'||(req.headers.upgrade||'').toLowerCase()!=='websocket'){sock.destroy();return;}
  const key=req.headers['sec-websocket-key'];if(!key){sock.destroy();return;}
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+wsAccept(key)+'\r\n\r\n');
  const c=new Conn(sock);c.id=NID++;c.room=null;
  const ka=setInterval(()=>c.raw(9,Buffer.alloc(0)),20000); // 保持連線（cloudflared 閒置會斷）
  c.onmsg=s=>{let m;try{m=JSON.parse(s);}catch(e){return;}
    if(!c.room){
      if(m.t==='create'){const code=code4(),r={code,host:c,peers:new Map()};rooms.set(code,r);c.room=r;c.name=String(m.name||'房主').slice(0,16);
        c.send(JSON.stringify({t:'room',code,id:c.id,host:true}));log('建立房間',code,c.name);}
      else if(m.t==='join'){const r=rooms.get(String(m.code||'').toUpperCase());
        if(!r){c.send(JSON.stringify({t:'err',msg:'找不到這個房間代碼'}));return;}
        if(r.peers.size>=7){c.send(JSON.stringify({t:'err',msg:'房間已滿（最多 8 人）'}));return;}
        if(r.locked){c.send(JSON.stringify({t:'err',msg:'比賽已經開始，等這場打完再加入'}));return;}
        c.room=r;c.name=String(m.name||'玩家').slice(0,16);r.peers.set(c.id,c);
        c.send(JSON.stringify({t:'room',code:r.code,id:c.id,host:false,hostId:r.host.id}));
        r.host.send(JSON.stringify({t:'peer+',id:c.id,name:c.name}));log('加入房間',r.code,c.name);}
      return;}
    const r=c.room;
    if(c===r.host){
      if(m.t==='lock'){r.locked=!!m.v;return;}
      if(m.to!==undefined){const p=r.peers.get(m.to);if(p)p.send(s);}
      else for(const p of r.peers.values())p.send(s);}
    else{m.from=c.id;r.host.send(JSON.stringify(m));}};
  c.onclose=()=>{clearInterval(ka);const r=c.room;if(!r)return;
    if(r.host===c){for(const p of r.peers.values()){p.send(JSON.stringify({t:'closed'}));p.close();}rooms.delete(r.code);log('房間關閉',r.code);}
    else{r.peers.delete(c.id);r.host.send(JSON.stringify({t:'peer-',id:c.id}));log('離開房間',r.code,c.name);}};
});
function log(...a){console.log(new Date().toLocaleTimeString(),...a);}
server.listen(PORT,()=>{
  console.log(`\n熱血排球 多人連線伺服器已啟動： http://localhost:${PORT}`);
  console.log('給朋友連：另開一個視窗執行  cloudflared tunnel --url http://localhost:'+PORT);
  console.log('         然後把出現的 https://xxxx.trycloudflare.com 網址傳給朋友\n');});
