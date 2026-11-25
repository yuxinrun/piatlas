Pi 启动流程：从 CLI 入口到会话可用|沿已核验的公开导出理解启动阶段，不把事件顺序写成未经证实的调用栈。|packages/coding-agent/src/index.ts|packages/coding-agent/src/index.ts,packages/coding-agent/docs/how-pi-works.md,packages/coding-agent/docs/extensions.md|architecture|进阶|能阅读 TypeScript export 语句与异步函数。

## 适用人群与学习目标

适用人群：希望读懂 Monorepo 边界的 TypeScript 开发者、做技术选型的架构师。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「Pi 启动流程：从 CLI 入口到会话可用」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

coding-agent 的 src/index.ts 是一个汇总入口，公开导出 parseArgs、AgentSession、createAgentSession、createAgentSessionRuntime、DefaultResourceLoader、SessionManager、SettingsManager、loadSkills 以及 runPrintMode/runRpcMode 等。
extensions.md 给出了启动相关事件顺序：进程启动后解析 project_trust，然后 session_start，再 resources_discover；异步扩展工厂会在这些阶段之前被 await。

## 核心原理

启动的本质是“组装依赖”：解析参数与设置，建立会话管理器，发现资源与扩展，选择模型与工具，最后进入某种前端模式。
这里要区分两类事实：公开导出说明“能构造什么”，事件顺序说明“外部观察者何时收到通知”。二者不能拼成未经证明的逐行调用栈。

## 流程示意

上方图描述职责从上到下流动：用户界面、Coding Harness、Agent Runtime、模型/工具。启动就是把这些层连接起来的过程。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `packages/coding-agent/src/index.ts`
- `packages/coding-agent/docs/how-pi-works.md`
- `packages/coding-agent/docs/extensions.md`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```typescript
// 来自固定快照公开入口的名称组合；不是完整启动源码
import {
  parseArgs,
  createAgentSession,
  createAgentSessionRuntime,
  DefaultResourceLoader,
  SessionManager,
  SettingsManager
} from "@earendil-works/pi-coding-agent";

// 教学示意：展示“谁拥有什么”，不替代官方初始化参数
// args <- parseArgs(...)
// settings <- SettingsManager
// session <- createAgentSession(...)
// runtime <- createAgentSessionRuntime(...)
```

固定快照确实导出了这些名称；具体参数形状请查看 CreateAgentSessionOptions 与 SDK 文档。

## 实际执行过程

1. 打开 index.ts，搜索 createAgentSession 的导出来源。
2. 在 extensions.md 中圈出 project_trust、session_start、resources_discover 三个事件。
3. 启动 Pi 时观察先出现信任提示还是资源加载结果。
4. 把“公开导出”和“事件通知”分成两列记录。

## 设计优点与局限

- 优点：公开入口集中，便于定位；关键生命周期事件对扩展作者可见。
- 局限：入口文件是再导出汇总，直接读它看不到完整实现。

## 容易出现的问题

- 把事件名顺序当作函数逐行执行顺序。
- 认为 SDK session 会自动拥有 CLI 的全部内置扩展。
- 在 session_start 之前假设 MCP server 已连接。

## 实战案例

写一个最小扩展，在 project_trust、session_start、resources_discover 三个事件中各打印一条标记，观察实际顺序。

## 最佳实践

扩展初始化只做轻量工作；昂贵资源放到对应事件后再准备，并确保关闭路径可重复调用。

## 常见问题

### 异步扩展工厂何时完成？

extensions.md 说会在 session_start、resources_discover 与 provider 注册生效之前被 await。

### agent_end 代表空闲吗？

不代表；agent_settled 才表示 Pi 不会自动继续运行。

## 延伸阅读

- 本站「Pi 启动流程：从 CLI 入口到会话可用」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
