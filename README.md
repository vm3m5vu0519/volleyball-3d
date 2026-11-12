# 熱血排球 3D

瀏覽器 3D 排球遊戲（4 對 4），玩法參考 Free Ball。three.js r128，單一網頁，不需要安裝。

## 怎麼玩
- **線上／單檔：** 打開 `dist/volleyball-3d.html`（需要連網載入 three.js 和角色模型；角色模型要和 `skins/` 放在同一層，用網址開啟）。
- **離線包：** `python3 build.py && python3 tools/make_offline.py` 產生 `out/熱血排球3D.7z`，解壓後直接雙擊 `index.html`。

操作：WASD 移動、滑鼠轉視角、空白鍵跳、左鍵扣球／發球、Shift+左鍵跳發、F 吊球、右鍵接球（移動中按是飛撲）、E 攔網、Q 叫球。

## 專案結構
| 路徑 | 內容 |
|---|---|
| `src/shell.html` | 網頁外殼（選單、設定、介面） |
| `src/g1.js` | 設定、輸入、音效合成 |
| `src/g2.js` | 球的物理、擊球判定、發球、扣球、AI 落點 |
| `src/g3.js` | 球員移動、跳躍、飛撲、AI 站位、攔網對決、回合流程 |
| `src/g4.js` | 場景、角色骨架、動作（慣性過渡、腳步鎖定、手指） |
| `src/g5.js` | 鏡頭、介面（HUD）、主迴圈 |
| `src/g6.js`、`g7.js` | 動作擷取工具 |
| `src/g8.js` | 角色（套皮）編輯器、內建角色清單 |
| `src/g9.js` | VRM 搖擺骨（頭髮）與節點約束 |
| `src/g10.js` | 球和場景的互動（彈跳、滾動、撞網、撞牆） |
| `src/g11.js` | 觀眾、大螢幕、球網擺動、後製（光暈、調色） |
| `src/g12.js` | 打擊、接球、攔網、落地特效 |
| `skins/` | 內建角色（VRM，副檔名 .vrm.wasm 只是為了讓網頁伺服器能傳送） |
| `pose/` | 動作擷取用的 MediaPipe Pose 模型 |
| `tools/` | `vrmshrink.py`（縮小 VRM 貼圖、去掉表情資料）、`make_offline.py`（產生離線包） |
| `tests/` | 自動測試（見下方） |
| `docs/SPEC.md` | 設計規格與每次修改紀錄 |

## 建置與測試
```bash
npm install                      # 取得 three（測試用 test.html 讀本機程式庫）
pip install playwright py7zr && python3 -m playwright install chromium
python3 build.py                 # 產生 dist/volleyball-3d.html 與 test.html
python3 -m http.server 8765 &    # 測試都連 http://localhost:8765/test.html
python3 tests/humsrv.py          # 玩家用滑鼠實際點擊發球，球要過網
python3 tests/t4.py              # 攔網連跳、飛撲 48 種情境、發球 40 種瞄準×時機
python3 tests/spec_test.py       # AI 對打 12 分鐘：節奏、每顆發球是否過網、特效有無錯誤
```
每次修改後三項都要通過再發佈。

## 素材授權
- 千駄谷篠、千駄谷澀、櫻田文莉也、Vita、Vivi、Victoria、髮型範例、暗黑澀：© pixiv Inc.，VRoid Studio 範例模型，CC0
- 三葉（three-vrm-girl）、藍葉（VRM1_Constraint_Twist_Sample）：© pixiv Inc.，three-vrm／VRM 規格範例模型
- Seed-san：© VirtualCast, Inc.，VRM Public License 1.0
- Mannequin_F：Quaternius Universal Animation Library 2，CC0 1.0
- three.js（MIT）、MediaPipe Pose（Apache License 2.0）
