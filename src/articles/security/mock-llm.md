Mock LLM 与确定性测试：不访问网络也能验证 Agent|用固定事件重放测试流式、工具与失败路径。|packages/coding-agent/docs/sdk.md|packages/ai/src/types.ts,packages/agent/src/types.ts,packages/coding-agent/docs/sdk.md|loop|进阶|了解单元测试、fixture 与异步测试。

## 适用人群与学习目标

适用人群：在真实项目中部署 Coding Agent、关注权限与可观测性的团队。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「Mock LLM 与确定性测试：不访问网络也能验证 Agent」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

ai/src/types.ts 给出 AssistantMessageEvent 的事件形态；agent/src/types.ts 给出 AgentEvent；sdk.md 说明 SDK 可订阅事件并用内存会话运行。
这些类型让“重放事件”成为可行测试策略：不必调用真实 provider，也能验证 UI 和状态机如何处理文本增量、工具调用与错误。

## 核心原理

Mock LLM 不是假装有智能，而是把外部不确定性替换成可重复的协议行为。测试关注三件事：请求构造是否正确、事件消费是否完整、终止条件是否成立。
成功 fixture 与失败 fixture 都要有；只测 happy path 会漏掉 toolcall 参数不完整、error 事件和 abort。

## 流程示意

上方图展示 Agent Loop 的八步模拟。预设事件重放就是本地实验室做的事，它不调用真实模型。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `packages/ai/src/types.ts`
- `packages/agent/src/types.ts`
- `packages/coding-agent/docs/sdk.md`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```typescript
type Event = { type: string; delta?: string; toolCall?: { name: string } };

const fixture: Event[] = [
  { type: "start" },
  { type: "text_delta", delta: "我先" },
  { type: "text_delta", delta: "统计" },
  { type: "toolcall_end", toolCall: { name: "count_items" } },
  { type: "done" }
];

function replay(events: Event[]) {
  let text = "";
  const tools: string[] = [];
  for (const event of events) {
    if (event.type === "text_delta") text += event.delta ?? "";
    if (event.type === "toolcall_end" && event.toolCall) tools.push(event.toolCall.name);
  }
  return { text, tools };
}

console.log(replay(fixture));
```

这是教学事件重放；字段名来自固定快照但形状被简化。真实测试应直接使用当前版本的类型。

## 实际执行过程

1. 准备成功、工具失败、流式中止三组 fixture。
2. 用同一 fixture 重放两次，断言输出一致。
3. 断言 toolcall_end 才触发工具执行。
4. 断言 done/error 后状态机不再继续。

## 设计优点与局限

- 优点：快、稳定、可离线；适合 CI。
- 局限：无法覆盖真实模型行为漂移；fixture 需要随版本维护。

## 容易出现的问题

- Mock 只覆盖文本，不覆盖工具。
- 测试断言依赖真实时间戳。
- 把 Mock 输出当成模型质量证据。

## 实战案例

为本站的 Agent Loop 实验室写三条断言：事件数量、上下文最终内容、终止状态。

## 最佳实践

fixture 与断言同仓库版本化；每次升级先跑确定性测试，再做真实冒烟。

## 常见问题

### Mock 能替代端到端测试吗？

不能；它验证协议与状态机，真实集成仍需少量受控端到端测试。

### 为什么要失败 fixture？

因为失败路径最容易在升级后静默变化。

## 延伸阅读

- 本站「Mock LLM 与确定性测试：不访问网络也能验证 Agent」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
