Session Tree：为什么 Agent 需要一棵树|用条目 ID、父引用和活动分支解释会话树，而不是把它当成线性聊天记录。|packages/coding-agent/docs/how-pi-works.md|packages/coding-agent/docs/how-pi-works.md,packages/coding-agent/src/index.ts|tree|进阶|理解树结构、父子节点与路径概念。

## 适用人群与学习目标

适用人群：需要长任务状态管理、会话恢复和上下文控制的开发者。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「Session Tree：为什么 Agent 需要一棵树」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

how-pi-works.md 明确说明：会话中的消息和事件构成一棵树；树中每条路径是一个分支；以当前条目结尾的路径是活动分支；活动分支提供下一次模型请求的历史。
持久化会话是 JSONL，每个条目有 ID 并指向父条目。从较早条目继续会在同一文件中创建新分支；fork 与 clone 会把选定历史复制到新文件。

## 核心原理

树不是装饰，而是“可回退计算”的存储形态。一次工具失败、一个错误提示或一次不同策略尝试，都可以从旧节点重新出发，而不必破坏原路径。
上下文投影只沿活动分支的祖先链构造。因此切换当前条目会改变下一次请求看到的历史； abandoned branches 仍被保留，便于审计与恢复。

## 流程示意

上方图中“共同祖先 → 活跃分支/备选分支”是关键。切换分支不是删除历史，而是改变当前叶子。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `packages/coding-agent/docs/how-pi-works.md`
- `packages/coding-agent/src/index.ts`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```typescript
// 教学用 JSONL 条目：字段语义来自 how-pi-works.md
type Entry = { id: string; parentId: string | null; kind: string; text: string };

const entries: Entry[] = [
  { id: "e0", parentId: null, kind: "user", text: "统计清单" },
  { id: "e1", parentId: "e0", kind: "assistant", text: "我需要一个工具" },
  { id: "e2", parentId: "e1", kind: "toolResult", text: "3" },
  { id: "e3", parentId: "e1", kind: "assistant", text: "换一种实现方式" }
];

function ancestors(entries: Entry[], leafId: string) {
  const byId = new Map(entries.map(e => [e.id, e]));
  const path: Entry[] = [];
  let cur = byId.get(leafId);
  while (cur) { path.unshift(cur); cur = cur.parentId ? byId.get(cur.parentId) : undefined; }
  return path;
}
```

这是教学结构，不是 Pi JSONL 的完整 Schema。真实条目还包含时间戳、消息内容和压缩记录等字段。

## 实际执行过程

1. 在一次会话中发送两个不同方向的提示，形成两条分支。
2. 使用 /tree 查看分支，记录当前叶子。
3. 切换回较早节点并继续，确认同一文件中出现新分支。
4. 用 /fork 复制一条路径到新会话，比较两者历史。

## 设计优点与局限

- 优点：支持探索式工作流；错误尝试不必删除；审计轨迹完整。
- 局限：线性聊天 UI 难以表达；分支多了以后导航复杂。

## 容易出现的问题

- 把 abandoned branch 当成已删除。
- 认为 /fork 只是切换分支。
- 在压缩后仍把所有原始条目放入每次请求。

## 实战案例

在本地模拟四条记录：根、助手、两条工具结果。写函数输出两个叶子的祖先链，比较差异。

## 最佳实践

给重要节点命名；在长任务开始前先 /fork；切换分支后立刻确认活动历史。

## 常见问题

### 活动分支是什么？

以当前条目结尾、沿父引用回溯得到的路径。

### 压缩会删除旧条目吗？

不会；how-pi-works.md 说原始条目仍保留在会话树中。

## 延伸阅读

- 本站「Session Tree：为什么 Agent 需要一棵树」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
