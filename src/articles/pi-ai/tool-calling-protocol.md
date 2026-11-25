Tool Calling 协议：意图、参数与结果如何闭环|用 ToolCall 与 ToolResultMessage 的真实字段解释工具调用不是普通文本。|packages/ai/src/types.ts|packages/ai/src/types.ts,packages/agent/src/types.ts,packages/coding-agent/docs/how-pi-works.md|tool|进阶|理解 JSON Schema 或 TypeBox 参数描述。

## 适用人群与学习目标

适用人群：需要接入多模型 Provider 的后端工程师、关心流式协议与兼容性的开发者。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「Tool Calling 协议：意图、参数与结果如何闭环」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

packages/ai/src/types.ts 中 ToolCall 包含 id、name、arguments、可选 namespace 与 argumentsError；ToolResultMessage 包含 toolCallId、toolName、content、details、usage、nestedCalls、isError 与 durationMs。
Agent 层的 AgentTool 增加 label、prepareArguments、execute、replay 与 executionMode，说明“模型意图”和“宿主执行策略”是两个层次。

## 核心原理

一次工具调用闭环是：模型在 assistant content 中产生 ToolCall；宿主按 id 找到工具并校验参数；工具执行返回 ToolResultMessage；结果被写回会话并进入下一轮请求。
id 是关联意图与结果的关键。没有 id，就无法在并行工具或多次调用中确定结果归属。

## 流程示意

上方图按“模型意图 → 查找/校验 → 执行策略 → 结果回填”展开。它是协议视角，不承诺 Pi 内部函数按这个顺序逐行执行。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `packages/ai/src/types.ts`
- `packages/agent/src/types.ts`
- `packages/coding-agent/docs/how-pi-works.md`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```typescript
// 字段来自固定快照；这是教学用结构示意
type ToolCallShape = {
  type: "toolCall";
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

type ToolResultShape = {
  role: "toolResult";
  toolCallId: string;
  toolName: string;
  content: Array<{ type: "text"; text: string }>;
  details?: unknown;
  isError: boolean;
  durationMs?: number;
};
```

真实类型还包含思考签名、usage、nestedCalls 等；这里只保留闭环必需字段。

## 实际执行过程

1. 观察一次工具调用，记录 ToolCall.id。
2. 找到对应 ToolResultMessage.toolCallId，确认一致。
3. 检查 isError 与 usage，再看正文内容。
4. 若启用并行执行，确认每个结果都能匹配到唯一意图。

## 设计优点与局限

- 优点：结构化意图与结果便于校验、重试与观测。
- 局限：模型可能生成无效参数；不同 provider 对工具调用的表达不完全一致。

## 容易出现的问题

- 用工具名而非 id 关联结果。
- 忽略 argumentsError。
- 把工具返回的文本当作一定成功。

## 实战案例

设计一个计数工具，故意给出缺少必填参数的意图；断言宿主不会执行，并记录应该产生的错误路径。

## 最佳实践

参数校验在执行前完成；结果保留结构化 details；错误信息要足够具体但不泄露凭据。

## 常见问题

### 工具结果一定进入下一条消息吗？

how-pi-works.md 说 Pi 记录工具结果；是否需要新模型请求取决于结果与排队消息。

### isError 为 true 时还能继续吗？

可以，但必须由 Agent 策略决定是否重试或停止。

## 延伸阅读

- 本站「Tool Calling 协议：意图、参数与结果如何闭环」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
