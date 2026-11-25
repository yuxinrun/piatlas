Sub-agent 设计：在“不内置”的前提下自己实现分工|把 sub-agent 视为宿主策略：任务边界、工具白名单、结果验收与审计。|packages/coding-agent/docs/extensions.md|README.md,packages/coding-agent/docs/extensions.md,packages/coding-agent/docs/sdk.md|subagent|高级|已理解 Agent Loop、工具白名单与会话边界。

## 适用人群与学习目标

适用人群：希望通过小型可验证项目掌握 Agent 工程方法的实践者。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「Sub-agent 设计：在“不内置”的前提下自己实现分工」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

README 明确说明 Pi 默认不内置 sub-agents。extensions.md 提供注册工具、事件、UI 与上下文能力；sdk.md 提供进程内 createAgentSession 与会话管理。
因此“给 Pi 加 sub-agent”属于扩展/宿主开发，而不是调用某个官方内置 API。

## 核心原理

Sub-agent 的核心不是“多开几个模型”，而是缩小权限与任务面。每个子任务应有明确输入、允许工具、输出格式与验收条件。
父 agent 负责分解与汇总；子 agent 不应继承父进程的全部工具。尤其在写文件、shell 与网络方面，默认应最小权限。

## 流程示意

上方图标记“教学方案”：协调者、两个受限任务与审阅汇总。不要把它误读为 Pi 官方架构。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `README.md`
- `packages/coding-agent/docs/extensions.md`
- `packages/coding-agent/docs/sdk.md`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```typescript
// 教学分工：不是 Pi 官方 sub-agent API
type SubTask = {
  name: string;
  input: string;
  allowedTools: string[];
  accept: (result: string) => boolean;
};

const tasks: SubTask[] = [
  {
    name: "collect-evidence",
    input: "列出只读证据",
    allowedTools: ["read", "grep"],
    accept: (r) => r.includes("evidence")
  },
  {
    name: "check-claims",
    input: "逐条核对结论",
    allowedTools: ["read"],
    accept: (r) => r.includes("unknown")
  }
];

for (const task of tasks) {
  // 在真实宿主中：为 task 构造受限 session，并单独记录事件
  console.log(task.name, task.allowedTools.join(","));
}
```

真实实现可用 SDK 创建独立 session 并限制 tools，也可用扩展注册受控工具；具体实现需按当前版本 API 核验。

## 实际执行过程

1. 把一个任务拆成两个互不依赖的子任务。
2. 为每个子任务写 allowedTools 与验收函数。
3. 用 Mock LLM 跑通父/子消息流。
4. 确认子任务失败不会污染父会话的活动分支。
5. 汇总时保留每个子任务的证据来源。

## 设计优点与局限

- 优点：权限可缩小；任务可并行；失败隔离更好。
- 局限：实现复杂；结果汇总本身需要判断；Pi 不提供内置方案。

## 容易出现的问题

- 称为 Pi 官方 sub-agent。
- 让子任务继承全部工具。
- 汇总时丢掉证据与失败信息。

## 实战案例

设计“只读代码审查”分工：一个子任务列证据，一个子任务找反例，父任务只汇总并标注不确定处。

## 最佳实践

默认只读；输出格式固定；每个子任务都有独立 trace。

## 常见问题

### Pi 支持 sub-agent 吗？

README 明确说默认不内置；可通过扩展或宿主自行实现。

### 子任务能共享会话吗？

可以设计共享证据，但建议保留独立 trace 便于审计。

## 延伸阅读

- 本站「Sub-agent 设计：在“不内置”的前提下自己实现分工」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
