工具执行失败处理：从 isError 到可终止策略|用 BeforeToolCallResult 与工具结果字段设计失败、拦截与重试边界。|packages/coding-agent/docs/how-pi-works.md|packages/agent/src/types.ts,packages/coding-agent/docs/extensions.md,packages/coding-agent/docs/how-pi-works.md|tool|进阶|了解错误处理、重试与中止的基本概念。

## 适用人群与学习目标

适用人群：正在实现 Agent Loop 或工具调用系统的工程师。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「工具执行失败处理：从 isError 到可终止策略」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

AgentToolResult 可见字段包括 content、details、可选 structuredContent、usage、isError、terminate；BeforeToolCallResult 可见 block、reason、terminate；AfterToolCallResult 可修改内容、结构化内容、isError 等。
extensions.md 还说明被阻止或中止的调用会跳过执行和 tool_result，但仍收到 tool_execution_end。这是观测一致性的重要细节。

## 核心原理

工具失败分三类：参数无效、执行失败、策略阻止。第一类通常不进入 execute；第二类返回 isError 结果；第三类由 before 钩子返回 block。三者都应生成可观测事件，但语义不同。
重试不是默认答案。对写文件、发网络请求等非幂等操作，重试可能造成重复副作用；应优先让 Agent 报告失败并请求人工决策。

## 流程示意

上方图把“执行策略”放在结果回填之前：这正是拦截发生的位置。不要把拦截后的空结果与正常成功混为一谈。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `packages/agent/src/types.ts`
- `packages/coding-agent/docs/extensions.md`
- `packages/coding-agent/docs/how-pi-works.md`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```typescript
// 教学拦截：返回形状来自固定快照的 BeforeToolCallResult
function beforeToolCall(args: unknown): { block: true; reason: string; terminate?: boolean } | void {
  const path = (args as { path?: unknown })?.path;
  if (typeof path === "string" && path.startsWith("/secrets/")) {
    return { block: true, reason: "敏感目录不在允许范围内" };
  }
}

const failedResult = {
  content: [{ type: "text", text: "读取失败：文件不存在" }],
  details: { code: "ENOENT" },
  isError: true
};
```

block 表示调用未执行；isError 表示调用已执行但失败。两者不能互换。

## 实际执行过程

1. 让工具读取不存在的文件，记录 tool_result 与 tool_execution_end。
2. 用 before 钩子阻止敏感路径，确认没有 tool_result。
3. 让 Agent 对失败结果给出解释，而不是盲目重试。
4. 把失败次数写入观测日志，设置上限。

## 设计优点与局限

- 优点：失败可结构化表达；拦截点明确；观测事件覆盖被阻止调用。
- 局限：钩子可以修改输入与结果，必须限制其权限；重试策略需要按工具语义定制。

## 容易出现的问题

- 把 block 当成工具失败结果。
- 替换 content 却忘记 structuredContent，导致结构化数据丢失。
- 对所有失败统一重试三次。

## 实战案例

为一个只读工具写两组 fixture：成功与 ENOENT。再写一组策略阻止，断言三种情况下的事件数量差异。

## 最佳实践

错误信息包含原因与可达的修复建议；不要暴露凭据或完整环境路径。

## 常见问题

### 被阻止的调用有 tool_result 吗？

extensions.md 说会跳过执行和 tool_result，但仍有 tool_execution_end。

### 什么时候用 terminate？

当你希望终止当前运行而非只拒绝单次调用时；具体行为以当前版本为准。

## 延伸阅读

- 本站「工具执行失败处理：从 isError 到可终止策略」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
