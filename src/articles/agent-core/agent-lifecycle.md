Agent 生命周期：before_agent_start 到 agent_settled|理解运行结束与真正空闲的区别，避免集成层提前释放会话。|packages/coding-agent/docs/extensions.md|packages/coding-agent/docs/extensions.md,packages/coding-agent/docs/sdk.md,packages/agent/src/types.ts|extension|进阶|理解事件订阅和异步任务状态。

## 适用人群与学习目标

适用人群：正在实现 Agent Loop 或工具调用系统的工程师。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「Agent 生命周期：before_agent_start 到 agent_settled」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

extensions.md 给出的主流程为：扩展命令与输入处理、skill/template 展开、before_agent_start、agent_start、turn 循环、agent_end、agent_before_settle、agent_settled。
sdk.md 明确提醒：agent_end 表示一次低层 agent run 结束，排队工作可能继续；agent_settled 才表示 Pi 不会再自动继续。

## 核心原理

生命周期分三层：一次输入准备、一次低层运行、整个会话稳定。集成层要等待的是第三层；UI 层可以在第一、二层给出即时反馈。
同样，session_shutdown 与新的 session_start 可能由 /new、/resume、/fork、/clone、/reload 触发。订阅关系与资源清理必须按会话替换重新绑定。

## 流程示意

上方图用“装载工厂 → 注册能力 → 处理会话事件 → 关闭资源”表示扩展生命周期；Agent 生命周期则是其中一段更细的事件序列。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `packages/coding-agent/docs/extensions.md`
- `packages/coding-agent/docs/sdk.md`
- `packages/agent/src/types.ts`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```typescript
// 教学订阅：事件名来自固定快照文档
const seen: string[] = [];

function onEvent(event: { type: string }) {
  seen.push(event.type);
  if (event.type === "agent_end") {
    console.log("低层运行结束，但可能仍有排队工作");
  }
  if (event.type === "agent_settled") {
    console.log("可以安全释放集成层资源");
  }
}

// 期望序列片段：
// before_agent_start -> agent_start -> turn_start -> ...
// -> agent_end -> agent_before_settle -> agent_settled
```

这是事件顺序教学重排；具体订阅 API 请查看 ExtensionAPI.on 与 SDK session.subscribe。

## 实际执行过程

1. 写一个扩展订阅运行类事件并打印顺序。
2. 发送一条会触发工具调用的输入，观察 turn_start/turn_end。
3. 在流式中途发送 steer，观察是否仍在同一运行内。
4. 等待 agent_settled 后再 dispose 会话。

## 设计优点与局限

- 优点：细粒度事件让 UI 与宿主解耦；明确的 settled 信号减少竞态。
- 局限：事件多，消费者容易误判结束；会话替换后订阅需要重新绑定。

## 容易出现的问题

- 收到 agent_end 就关闭进程。
- 在 session_shutdown 后保留旧扩展状态。
- fork 后忘记重新订阅新 session。

## 实战案例

任务：用本地事件重放脚本模拟“工具调用 + 排队 follow-up”，断言 agent_end 出现一次而 agent_settled 只在最后出现一次。

## 最佳实践

把清理逻辑绑定到 settled 与 shutdown 两条路径，并确保可重复执行。

## 常见问题

### agent_end 之后还能继续吗？

可以；sdk.md 明确说排队工作可能继续。

### 会话替换后订阅怎么办？

旧订阅属于旧会话；需要给新会话重新绑定。

## 延伸阅读

- 本站「Agent 生命周期：before_agent_start 到 agent_settled」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
