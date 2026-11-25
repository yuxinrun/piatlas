从零实现一个简易 Agent Loop：离线、可重放、可终止|用教学版 loop 理解上下文、模型意图、工具结果与最大轮数。|packages/coding-agent/docs/how-pi-works.md|packages/coding-agent/docs/how-pi-works.md,packages/agent/src/agent-loop.ts,packages/agent/src/types.ts|loop|进阶|能写基础 TypeScript 或 JavaScript 异步函数。

## 适用人群与学习目标

适用人群：希望通过小型可验证项目掌握 Agent 工程方法的实践者。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「从零实现一个简易 Agent Loop：离线、可重放、可终止」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

how-pi-works.md 给出真实循环语义：请求、流式响应、工具执行、结果记录、条件继续。agent-loop.ts 的公开导出包括 agentLoop 与 runToolCall。
本项目的目标不是重写 Pi，而是用最小离线模型把“为什么需要循环”讲清楚。

## 核心原理

最小循环需要四件事：上下文、模型函数、工具表、终止策略。模型函数返回文本或工具意图；工具表负责执行；终止策略限制轮数并处理错误。
离线模型可以是一个固定函数。这样你能把注意力放在状态转移上，而不是 provider 细节。

## 流程示意

上方图八步流程与本项目的状态转移一一对应：输入、上下文、请求、意图、执行、结果、下一轮、结束。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `packages/coding-agent/docs/how-pi-works.md`
- `packages/agent/src/agent-loop.ts`
- `packages/agent/src/types.ts`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```javascript
const tools = {
  count_items: ({ items }) => ({ count: items.length })
};

function fakeModel(context) {
  if (context.length === 1) {
    return { tool: "count_items", args: { items: ["甲", "乙", "丙"] } };
  }
  return { text: "清单共有 3 项" };
}

export function toyLoop(input, maxTurns = 3) {
  const context = [{ role: "user", text: input }];
  for (let turn = 1; turn <= maxTurns; turn++) {
    const out = fakeModel(context);
    if (out.text) return { text: out.text, turn, context };
    const result = tools[out.tool](out.args);
    context.push({ role: "assistant", tool: out.tool, args: out.args });
    context.push({ role: "toolResult", result });
  }
  throw new Error("超过最大轮数");
}

console.log(toyLoop("统计固定清单"));
```

这是教学模拟，不是 Pi API。它没有流式事件、真实 Schema 校验和会话持久化。

## 实际执行过程

1. 运行代码，观察 turn=1 返回工具意图而 turn=2 返回文本。
2. 把 maxTurns 改为 1，观察强制终止。
3. 把工具改成返回失败，观察如何结束或重试。
4. 把 fakeModel 换成 fixture 文件，确认可重放。

## 设计优点与局限

- 优点：代码短；能覆盖循环本质；完全离线。
- 局限：没有真实模型不确定性；不能验证 Provider 兼容性。

## 容易出现的问题

- 没有最大轮数。
- 把工具结果放在工具意图之前。
- 让 fakeModel 读取真实文件。

## 实战案例

给 toyLoop 加一个 trace 数组，记录每轮输入与输出；用两次运行比较 trace 是否一致。

## 最佳实践

先保证终止，再增加能力；每一步都留下可打印的状态。

## 常见问题

### 这是 Pi 的真实实现吗？

不是，是教学模拟；真实实现见固定快照的 agent-loop.ts。

### 为什么要最大轮数？

防御性终止，避免错误策略造成无限调用。

## 延伸阅读

- 本站「从零实现一个简易 Agent Loop：离线、可重放、可终止」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
