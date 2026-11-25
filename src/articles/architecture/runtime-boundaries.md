运行时职责边界：把故障归到正确的层|用消息类型、工具钩子与事件名建立诊断框架，避免把 TUI 问题误判为模型问题。|packages/agent/src/types.ts|packages/agent/src/types.ts,packages/ai/src/types.ts,packages/coding-agent/src/index.ts|architecture|进阶|理解 TypeScript 类型别名和事件驱动架构。

## 适用人群与学习目标

适用人群：希望读懂 Monorepo 边界的 TypeScript 开发者、做技术选型的架构师。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「运行时职责边界：把故障归到正确的层」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

packages/agent/src/types.ts 可见 AgentState、AgentTool、AgentToolResult、BeforeToolCallResult、AfterToolCallResult、AgentEvent 等类型；packages/ai/src/types.ts 可见 Message、AssistantMessageEvent、Model、Tool 等类型。
coding-agent 的公开入口又暴露了 AgentSession、ExtensionRunner、SessionManager、runRpcMode 等更高层对象。三层名字相近，但职责不同。

## 核心原理

诊断 Agent 系统时先问四个问题：① 请求里有什么？② 模型返回了什么？③ 工具是否执行？④ 会话记录了什么？对应到 pi-ai、agent core、工具实现与 coding-agent 会话层。
事件是跨层观察点：message_update 属于模型流式输出；tool_execution_start/end 属于工具生命周期；session_start/resources_discover 属于宿主准备阶段。

## 流程示意

上方图是职责分层，不是依赖图。用颜色区分“做什么”和“依赖谁”是两件不同的事。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `packages/agent/src/types.ts`
- `packages/ai/src/types.ts`
- `packages/coding-agent/src/index.ts`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```typescript
// 固定快照中可见的类型形状（精简摘录）
interface AgentState {
  readonly systemPrompt: string;
  model: Model;
  thinkingLevel: ThinkingLevel;
  tools: AgentTool[];
  messages: AgentMessage[];
  readonly isStreaming: boolean;
  readonly pendingToolCalls: ReadonlySet<unknown>;
}

type AgentEvent =
  | { type: "agent_start" }
  | { type: "turn_start" }
  | { type: "message_update"; message: AgentMessage; assistantMessageEvent: AssistantMessageEvent }
  | { type: "tool_execution_end"; toolCallId: string; toolName: string; result: unknown; isError: boolean }
```

摘录省略了泛型细节；请以固定快照原文为准。重点是通过字段归属判断问题所在层。

## 实际执行过程

1. 复现一个问题，先保存事件序列。
2. 按“模型事件 / 工具事件 / 会话事件”给每条记录分类。
3. 检查请求投影是否缺少系统提示或历史消息。
4. 检查工具结果是否 isError，以及是否被扩展改写。
5. 最后才检查 TUI 渲染。

## 设计优点与局限

- 优点：类型与事件命名较明确；可把观察点放在层边界。
- 局限：部分事件名称相似；agent_end 与 agent_settled 语义不同但容易混淆。

## 容易出现的问题

- 看到终端显示异常就说模型失败。
- 看到工具结果为空就跳过 isError 检查。
- 把 before/after 钩子的修改能力当成无需校验的信任来源。

## 实战案例

设计四种故障：模型超时、工具参数无效、扩展拦截、TUI 渲染错位。为每种故障写出第一个应该检查的事件名。

## 最佳实践

日志中记录事件类型、时间戳、工具名与结果状态；避免记录完整正文与凭据。

## 常见问题

### pendingToolCalls 在哪一层？

它在 AgentState 中可见，属于 agent core 的状态面。

### 工具结果被改写了怎么看？

比较 tool_result 与 tool_execution_end；extensions.md 说明前者可修改结果。

## 延伸阅读

- 本站「运行时职责边界：把故障归到正确的层」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
