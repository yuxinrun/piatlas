什么是 Agent Loop：把一次回答变成可终止的循环|用 turn、工具结果和排队消息解释 Agent 的执行生命周期。|packages/coding-agent/docs/how-pi-works.md|packages/coding-agent/docs/how-pi-works.md,packages/agent/src/agent-loop.ts,packages/agent/src/types.ts|loop|进阶|理解请求、响应、工具调用三者的关系。

## 适用人群与学习目标

适用人群：正在实现 Agent Loop 或工具调用系统的工程师。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「什么是 Agent Loop：把一次回答变成可终止的循环」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

how-pi-works.md 明确描述：用户消息加入活动分支；Pi 构造模型请求；provider 流式返回文本与工具调用；Pi 记录 assistant 响应、执行工具并记录结果；一个 turn 完成。若工具结果或排队消息需要新请求，则开启另一个 turn；否则运行结束。
agent/src/agent-loop.ts 的公开导出包含 agentLoop、agentLoopContinue、runAgentLoop、runToolCall，说明循环与工具执行在 agent 包中有明确实现入口。

## 核心原理

Agent Loop 和普通 LLM 调用的区别有三点：① 结果会进入下一轮上下文；② 工具执行由宿主负责；③ 必须有终止条件。终止条件既可能是模型给出最终文本，也可能是策略判定不再继续。
types.ts 中 AgentTurnDecision 的可见取值为 continue 与 end；ToolExecutionMode 为 sequential 或 parallel；QueueMode 为 all 或 one-at-a-time。这三个类型共同描述“怎么继续”。

## 流程示意

上方图有一个虚线回环：有未完成工作时继续。真正的 Agent Loop 必须有出口；没有出口的循环是缺陷而非特性。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `packages/coding-agent/docs/how-pi-works.md`
- `packages/agent/src/agent-loop.ts`
- `packages/agent/src/types.ts`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```typescript
// 教学状态机：用于解释 continue / end，不是 Pi 官方循环实现
type Decision = { action: "continue" } | { action: "end" };

function decide(hasToolResult: boolean, hasQueued: boolean, stop: string): Decision {
  if (stop === "error" || stop === "aborted") return { action: "end" };
  if (hasToolResult || hasQueued) return { action: "continue" };
  return { action: "end" };
}

let decision: Decision = { action: "continue" };
while (decision.action === "continue") {
  // 发送一次模型请求，执行返回的工具调用，收集排队消息
  decision = decide(false, false, "toolUse");
}
```

这个循环刻意简化；Pi 的真实循环还要处理流式事件、abort、错误和会话持久化。

## 实际执行过程

1. 打开「Agent Loop 实验室」，逐项执行八个预设事件。
2. 在“工具结果”步骤观察上下文如何变化。
3. 把 stopReason 改为终止，观察循环应停止的位置。
4. 对照 agent-loop.ts 导出名，找出与“继续”相关的实现入口。

## 设计优点与局限

- 优点：循环结构让工具结果能影响后续决策；事件化便于观测。
- 局限：终止条件设计不当会造成重复调用或无限循环；排队消息增加状态复杂度。

## 容易出现的问题

- 把 toolUse 当作“任务已完成”。
- 忽略 abort 后排队消息应返回编辑器。
- 把 agent_end 与 agent_settled 混用。

## 实战案例

写一个最多三轮的教学循环：第一轮请求工具，第二轮处理结果，第三轮必须给出最终答案。超过三轮强制结束并记录原因。

## 最佳实践

给每次循环记录 turn 编号、工具名与停止原因；把最大轮数作为防御性上限。

## 常见问题

### Agent Loop 是 while(true) 吗？

不是。它必须有明确终止条件；Pi 文档还区分 turn 与最终 settled。

### 工具失败会一定结束吗？

不会；由策略决定是否重试或终止。

## 延伸阅读

- 本站「什么是 Agent Loop：把一次回答变成可终止的循环」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
