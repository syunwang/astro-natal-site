# Astro Natal Site

一个基于 **Netlify Functions + FreeAstrology API** 的出生星盘生成器。  
支持 Classic 风格渲染，前端直接内嵌 SVG。

---

## 📂 项目结构
astro-natal-site/
│
├─ index.html # 主页面（内嵌CSS/JS）
├─ netlify.toml # Netlify 配置文件
├─ README.md # 项目说明
│
└─ netlify/
└─ functions/
├─ geo.js # 地理位置API 代理(Open-Meteo Geocoding)
└─ natal.js # 星盘生成API 代理(FreeAstrology API)

---

## 🚀 部署步骤

### 1. 推送到 GitHub
```bash
git add .
git commit -m "Clean project structure for Netlify deploy"
git push origin main
2. 连接Netlify

在Netlify 后台创建站点或绑定已有仓库

部署时会自动识别netlify.toml

3. 设置环境变量

进入Netlify → Site configuration → Environme
添加：

FREEASTRO_API_KEY = <你的 FreeAstrology API key>

4. 自动部署

每次推送到GitHub 的main分支，Netlify 都会自动重新部署。
完成后访问：

https://<你的站点名>.netlify.app

🛠️ 开发说明

前端通过fetch('/.netlify/functions/geo')和`fetch('/.netlify/functions/natal')调用函数

函数在服务端代理外部API，避免前端直接暴露API key

如果要更换API，只需修改geo.js或natal.js即可

📜 License

MIT

---

📌 这样一来，目录说明、部署步骤和维护指南都清晰了，不会混淆临时测试说明。  

要不要我再帮你把 **geo.js / natal.js 最终版（含容错处理）** 一起写好，这样你的整个 repo 就真正“production ready”？
