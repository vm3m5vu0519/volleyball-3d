熱血排球 3D（離線版）
====================

怎麼開
------
直接雙擊 index.html 就能玩（Windows、Mac 都一樣），不需要安裝任何東西、不需要連網。
建議用 Chrome 或 Edge 開；Mac 用 Safari 也可以。
如果雙擊後用了別的程式開，對 index.html 按右鍵 →「打開方式」→ 選 Chrome。

第一次進入會花幾秒載入角色模型，載完 8 個人會自動換上角色。

操作
----
WASD 移動、滑鼠轉視角、空白鍵跳、左鍵扣球／發球、Shift+左鍵跳發、F 吊球、右鍵接球（移動中按是飛撲）、E 攔網、Q 叫球。
畫質「低」會關掉觀眾和後製特效，電腦較慢時使用。

限制
----
「動作擷取」工具（用攝影機錄自己的動作）在直接雙擊開啟時不能用，瀏覽器不准本機網頁載入它需要的模型。
需要用的話，在這個資料夾開「終端機」執行：  python3 -m http.server 8765
再用瀏覽器開 http://localhost:8765/

資料夾內容
----------
index.html     遊戲本體
skins/         內建角色模型（VRM 檔轉成 base64 存在 .js 裡，讓雙擊開啟也能讀到）
pose/          動作擷取工具用的人體偵測模型（MediaPipe Pose）
lib/three/     three.js r128

角色模型授權
------------
千駄谷篠、千駄谷澀、櫻田文莉也、Vita、Vivi、Victoria、髮型範例、暗黑澀
  © pixiv Inc.，VRoid Studio 範例模型，CC0（模型檔內建授權）
三葉（three-vrm-girl）、藍葉（VRM1_Constraint_Twist_Sample）
  © pixiv Inc.，three-vrm／VRM 規格範例模型
Seed-san
  © VirtualCast, Inc.，VRM Public License 1.0
預設人體（Mannequin_F）
  Quaternius Universal Animation Library 2，CC0 1.0

程式庫
------
three.js r128（MIT，授權見 lib/three/LICENSE）
MediaPipe Pose（Apache License 2.0）
