# Astro Natal Site (FreeAstrologyAPI + Netlify)

一個最小可用的單頁網站：輸入出生日期/時間/地點 → 後端呼叫 FreeAstrologyAPI → 顯示 SVG 出生星盤。

## 快速部署（Netlify）
1. 把整個資料夾上傳到 GitHub。
2. 在 Netlify 建立 **New site from Git**，Build command 留空、Publish 設為 `.`。
3. 到 **Site configuration → Environment variables** 新增：
   - `FREEASTRO_API_KEY` = 你的 API 金鑰
4. 部署完成後開啟網站測試。

## 本機測試
- 安裝 Netlify CLI：`npm i -g netlify-cli`
- 在專案根目錄執行：`netlify dev`
- 在 Netlify 專案上設定好環境變數後，再執行本機開發會自動提供函式的金鑰。

## 結構
- `index.html` 前端表單 + 呼叫 `/api/geo` 和 `/api/natal`。
- `netlify/functions/geo.js` 代理 `POST https://json.freeastrologyapi.com/geo-details`
- `netlify/functions/natal.js` 代理 `POST https://json.freeastrologyapi.com/western/natal-wheel-chart`
- `public/style.css` 基本樣式
- `netlify.toml` Functions 與路由設定

> 安全性：API 金鑰只存在 Netlify 環境變數與函式內，不會暴露在前端。
