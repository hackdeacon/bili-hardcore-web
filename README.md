# Bilibili Hardcore Web

B 站硬核会员自动答题工具的网页版本，基于 [Karben233/bili-hardcore](https://github.com/Karben233/bili-hardcore) 项目重新实现。

> 致谢：本项目的全部核心逻辑（B站 API 签名、答题流程、LLM 调用方案）均来自原作者 [Karben233](https://github.com/Karben233) 的优秀开源工作，本项目仅将其从 Python 命令行工具迁移为可在线使用的 Web 版本。如有任何权益问题，请联系删除。

## 功能

- 支持 DeepSeek / Gemini / OpenAI 兼容 API
- 扫码登录 B站
- 自动选择答题分类 + 验证码处理
- AI 自动答题（100 题）
- 实时显示答题进度与正确率
- 登录状态持久化（7 天有效期内免重复扫码）
- 检测进行中的答题会话，支持断点续答

## 在线使用

直接访问：**https://bili-hardcore-web.vercel.app**

## 本地运行

```bash
git clone git@github.com:hackdeacon/bili-hardcore-web.git
cd bili-hardcore-web
npm install
npm start
```

浏览器打开 `http://localhost:3000`

## 使用流程

1. 选择 AI 模型，填入 API Key
2. 点击「下一步 - 登录」，扫码登录 B站
3. 选择答题分类（最多 3 个），输入验证码
4. 点击「开始答题」，等待 AI 自动完成 100 题
5. 查看得分结果

## 注意事项

- B站账号需达到 Lv.6 才可参与答题
- 每日限 3 次答题机会，提交全部 100 题或在 APP 手动结束算一次
- 本工具仅在本地调用 API，不会上传登录信息和 API Key
- 不建议使用思考模型（思维链过长可能导致超时）

## License

MIT
