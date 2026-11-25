如何阅读 Pi 源码：入口、类型、实现三层法|从公开入口建立地图，再看类型契约，最后进入实现；记录每一步的证据。|packages/coding-agent/src/index.ts|package.json,packages/coding-agent/src/index.ts,packages/coding-agent/src/core/sdk.ts,packages/agent/src/types.ts|monorepo|进阶|熟悉 rg/grep 搜索和 TypeScript 基本语法。

## 适用人群与学习目标

适用人群：希望读懂 Monorepo 边界的 TypeScript 开发者、做技术选型的架构师。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「如何阅读 Pi 源码：入口、类型、实现三层法」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

直接从上千行实现开始读 Pi，很容易陷入细节。固定快照里我们已经核验了几个高价值入口：根 package.json、coding-agent 的 index.ts 与 core/sdk.ts、agent 的 types.ts 与 agent-loop.ts、ai 的 types.ts。
这些文件分别回答：工作区怎么组织、对外暴露什么、SDK 怎么构造、类型契约是什么、循环实现在哪里。

## 核心原理

三层法是：入口层看公开面；类型层看数据结构；实现层看算法与分支。每层都记录“文件名 + 导出名 + 我不确定的点”。这样读源码出的笔记才能被别人复核。
不要从“我觉得它应该这样”开始；从“我在这个文件看到了这个导出”开始。

## 流程示意

上方图是阅读路线：根清单、包清单、公开入口、实现与测试。它不是运行流程图。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `package.json`
- `packages/coding-agent/src/index.ts`
- `packages/coding-agent/src/core/sdk.ts`
- `packages/agent/src/types.ts`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```bash
# 在本地克隆阅读时的搜索思路（命令本身不是在 Pi 内执行）
rg "export .*createAgentSession" packages/coding-agent/src
rg "type AgentEvent" packages/agent/src
rg "AssistantMessageEvent" packages/ai/src
rg "registerTool" packages/coding-agent/docs/extensions.md
```

搜索命中只是线索；最终结论仍要回到文件上下文阅读。

## 实际执行过程

1. 先读根 package.json，记下 workspaces 与 Node 版本。
2. 读 coding-agent/src/index.ts，挑选 10 个公开导出建立索引。
3. 读 agent/src/types.ts，抄出 AgentState 与 AgentEvent 的字段。
4. 再进入 agent-loop.ts，寻找与事件对应的发射点。
5. 把每一步的记录写成可点击的源码链接。

## 设计优点与局限

- 优点：三层法可复用，不容易被实现细节淹没。
- 局限：公开入口是再导出汇总，仍需跳转到真实定义。

## 容易出现的问题

- 把 export * 的再导出当成原始实现。
- 只读类型不读事件消费方，误解字段用途。
- 把当前 main 分支与固定快照混用。

## 实战案例

任务：为 createAgentSession 建立一张追踪卡：公开导出位置、真实定义文件、返回对象关键方法、相关文档、未确认问题。

## 最佳实践

每次阅读固定一个 commit；笔记标题直接写 commit 短哈希与核验日期。

## 常见问题

### 应该先读测试还是实现？

先读入口与类型；测试用于确认边界行为，不适合作为唯一架构说明。

### 遇到没见过的类名怎么办？

标记待核验，不要写进文章当作官方结论。

## 延伸阅读

- 本站「如何阅读 Pi 源码：入口、类型、实现三层法」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
