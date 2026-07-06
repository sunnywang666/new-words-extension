# new-words-extension (Vocab Acquisition)

Chrome 扩展:网页(含 YouTube 字幕)选中英文单词弹气泡查释义、听美音、带上下文例句存生词本;附带 Vite+React 在线演示页发布到 GitHub Pages。已归档完结。

## 技术栈

- 扩展本体(`public/extension/`):纯原生 JS,Manifest V3,零构建;chrome.storage.local 持久化,Shadow DOM 样式隔离,数据源 Free Dictionary API
- 演示页(`src/` + index.html):TypeScript + React 19 + Vite 6 + Tailwind v4;App.tsx 用 mock chrome API 复用扩展代码
- CI:推 main 自动构建部署 GitHub Pages(Node 22)

## 常用命令

- `npm install` / `npm run dev`(端口 3000)/ `npm run build` / `npm run preview`
- `npm run lint` — 实为 `tsc --noEmit` 类型检查,无 ESLint
- `npm run clean` — 删 dist/
- 加载扩展:chrome://extensions → 开发者模式 → Load unpacked → 选 `public/extension`(无需构建)
- 无测试框架

## 目录导览

- `public/extension/manifest.json` — MV3 清单,权限 activeTab/scripting/storage
- `public/extension/background.js` — Service Worker:词形还原(内置不规则动词表)、按上下文词重叠选最佳释义、API 缓存(5s 超时)
- `public/extension/content.js` — 选词监听、上下文提取、Shadow DOM 气泡、YouTube 字幕 Alt+Click
- `public/extension/popup.*` — 生词本弹窗(列表/播音/删除/JSON 导入导出)
- `src/App.tsx` — 演示页,注入 mock chrome.runtime/storage
- `CHANGELOG.md` — v1.1→v2.3 版本历史

## 架构要点

- **同一份扩展代码双用**:public/extension/ 既是真扩展又被演示页原样加载,改扩展逻辑同时影响 Pages 演示
- 消息流:content.js 选词 → sendMessage(fetchDefinition) → background.js 词形还原+缓存/API+选释义 → 回传渲染气泡
- 构建只服务演示页;扩展改完直接重新加载即生效

## 约定与雷区

- 存储 `vocabList` 有新旧两种 schema(扁平 → 嵌套 entries/sentences),content.js 和 popup.js 都有迁移代码——任何读写改动必须保留迁移分支
- vite.config 的 base 依赖 GITHUB_ACTIONS 环境变量切换(本地 `/`,CI `/new-words-extension/`)
- background.js 约 78 行有 TODO:释义匹配拟换 LLM,当前是启发式词重叠
