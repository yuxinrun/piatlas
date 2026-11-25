Context Compaction：摘要替换历史，而不是删除历史|理解摘要条目、原始树和下一次请求投影三者的关系。|packages/coding-agent/docs/how-pi-works.md|packages/coding-agent/src/index.ts,packages/coding-agent/docs/how-pi-works.md|compaction|进阶|了解上下文窗口、token 与对话摘要。

## 适用人群与学习目标

适用人群：需要长任务状态管理、会话恢复和上下文控制的开发者。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「Context Compaction：摘要替换历史，而不是删除历史」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

how-pi-works.md 明确说明：compaction 插入一个摘要条目；该摘要条目在后续模型请求中替换较旧消息；原始条目仍保留在会话树中。
coding-agent 的公开入口包含 compact、shouldCompact、generateSummary、findCutPoint、prepareBranchEntries、DEFAULT_COMPACTION_SETTINGS 等导出，说明压缩是一个有策略与切点判断的子系统。

## 核心原理

压缩解决的是“请求投影太大”而不是“存储太大”。它把较早历史换成摘要，保留近期原文，从而让下一次模型请求 fits budget。
风险在于摘要不是无损压缩。工具错误细节、精确路径、用户约束可能丢失；因此压缩策略必须决定“什么必须保留”。本站交互实验室用字符预算模拟，不模拟真实 tokenizer。

## 流程示意

上方图展示“较早历史 → 摘要条目 → 近期原文 → 下一次请求”。注意原始历史仍留在树中，只是不进入这一次请求。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `packages/coding-agent/src/index.ts`
- `packages/coding-agent/docs/how-pi-works.md`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```typescript
// 教学投影：字段为演示，不代表 Pi 压缩条目 Schema
type Entry = { id: string; text: string; kind: "old" | "recent" | "summary" };

function project(entries: Entry[]) {
  const summary = entries.find(e => e.kind === "summary");
  const recent = entries.filter(e => e.kind === "recent");
  return summary ? [summary, ...recent] : entries;
}

const before = [
  { id: "a", text: "早期约束", kind: "old" },
  { id: "b", text: "摘要：保留目标与已验证事实", kind: "summary" },
  { id: "c", text: "最近一次工具结果", kind: "recent" }
] as Entry[];

// project(before) 只包含 b 与 c；原始 a 仍在会话文件中。
```

真实切点与摘要生成请使用固定快照中的 compact 相关导出；本例只用于理解“替换投影”的概念。

## 实际执行过程

1. 在「Context Compaction 实验室」调低预算，观察哪些消息被摘要替换。
2. 对照“原始历史”面板，确认原文没有被删除。
3. 从较早节点继续，检查分支是否仍可访问。
4. 写出你认为摘要必须保留的三类信息。

## 设计优点与局限

- 优点：延长任务寿命；保留审计轨迹；对模型请求大小有直接控制。
- 局限：摘要有信息损失；不同模型的压缩质量不同；策略错误会丢失关键约束。

## 容易出现的问题

- 把压缩理解为删除旧消息。
- 认为摘要里的数字一定准确。
- 在压缩前不保存关键文件路径与验收标准。

## 实战案例

给一段包含目标、约束、失败记录、最新结果的历史写摘要；让同事只依据摘要复述任务，检查遗漏。

## 最佳实践

摘要中固定保留目标、不可变约束、当前状态、下一步；最近原文尽量完整。

## 常见问题

### 压缩后还能回到旧消息吗？

可以，原始条目仍在会话树中。

### 本站实验室的 token 准确吗？

不准确；它按字符模拟，仅用于理解机制。

## 延伸阅读

- 本站「Context Compaction：摘要替换历史，而不是删除历史」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
