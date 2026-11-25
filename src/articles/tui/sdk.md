TypeScript SDK：进程内集成的所有权与清理|用 createAgentSession、subscribe、prompt 与 dispose 构建可靠的宿主集成。|packages/coding-agent/docs/sdk.md|packages/coding-agent/docs/sdk.md,packages/coding-agent/src/core/sdk.ts|rpc|高级|熟悉 async/await、try/finally 与事件订阅。

## 适用人群与学习目标

适用人群：构建终端交互、RPC 服务或进程内 SDK 集成的工程师。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「TypeScript SDK：进程内集成的所有权与清理」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

sdk.md 明确说明 SDK 用于在 Node.js 或 Bun 进程内嵌入 Pi，提供对 agent、sessions、tools、models、resources 的 TypeScript 访问。真实 API 包括 createAgentSession、session.prompt、session.subscribe、session.dispose 等。
固定快照的 core/sdk.ts 导出 createAgentSession、createCodingTools、createReadOnlyTools 与 withFileMutationQueue，说明 SDK 层负责组合工具与会话。

## 核心原理

SDK 集成的第一原则是所有权：谁创建 session，谁负责 dispose。dispose 会中止工作、使 extension contexts 失效、断开 agent 并移除监听。
第二原则是运行语义：streaming 期间直接 prompt 会 reject；要影响当前运行用 steer，要在完成后追加用 followUp。等待最终空闲应看 agent_settled。

## 流程示意

上方图展示 stdin/stdout 的子进程协议；SDK 则把这条边界移到进程内API。两者共享 agent/session 机制，但所有权模型不同。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `packages/coding-agent/docs/sdk.md`
- `packages/coding-agent/src/core/sdk.ts`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```typescript
import { createAgentSession } from "@earendil-works/pi-coding-agent";

const { session } = await createAgentSession();
const unsubscribe = session.subscribe((event) => {
  if (event.type === "message_update" &&
      event.assistantMessageEvent.type === "text_delta") {
    process.stdout.write(event.assistantMessageEvent.delta);
  }
});

try {
  await session.prompt("用中文说明这个目录的用途");
  console.log(session.getLastAssistantText());
} finally {
  unsubscribe();
  session.dispose();
}
```

这是 sdk.md 给出的真实用法组合；实际项目还需按需要配置 cwd、sessionManager、tools 与 resourceLoader。

## 实际执行过程

1. 创建 session 后立刻订阅事件。
2. 在 try 中 prompt，在 finally 中 unsubscribe 与 dispose。
3. streaming 期间改用 steer/followUp。
4. 需要 MCP 时调用 session.bindExtensions。
5. 会话替换后重新绑定订阅。

## 设计优点与局限

- 优点：类型安全；无需序列化；与 Pi 共享会话机制。
- 局限：与 Pi 同进程，隔离需外部设计；生命周期错误会造成资源泄漏。

## 容易出现的问题

- 忘记 dispose。
- 把 agent_end 当最终完成。
- SDK session 默认就拥有 CLI 全部内置扩展。

## 实战案例

写一个最小脚本：订阅 text_delta、发送一次只读 prompt、finally 清理；重复运行十次确认无句柄泄漏。

## 最佳实践

把 session 创建封装在一个工厂函数中；订阅与清理成对出现；内存会话用于测试。

## 常见问题

### 如何不写会话文件？

sdk.md 给出 SessionManager.inMemory()。

### SDK 会自动加载 MCP 吗？

不会；文档说需要显式加入 MCP extension 并 bindExtensions。

## 延伸阅读

- 本站「TypeScript SDK：进程内集成的所有权与清理」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
