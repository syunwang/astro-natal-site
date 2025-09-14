
# Astro Natal Site — 修正版（一次打包）

包含：前端（24h 时间、手动经纬度、内嵌SVG）、`/geo` 与 `/natal` Netlify Functions。

## 部署
1) 覆盖到仓库根目录；2) push；3) Netlify 环境变量：`FREEASTRO_API_KEY`（必填）、`FREEASTRO_API_URL`（可选）；4) 触发部署。

## 自检
主页点“检查 Functions”→ `geo: 200 / natal: 200` 表示可达。生成失败可展开原始返回排错。
