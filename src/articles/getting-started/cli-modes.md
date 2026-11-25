交互式、print、JSON 与 RPC：同一套 Agent，不同入口|理解四种使用模式的语义边界；具体 CLI flags 未从已核验页面取得，因此不杜撰参数。|packages/coding-agent/docs/how-pi-works.md|packages/coding-agent/docs/how-pi-works.md,packages/coding-agent/src/index.ts|rpc|入门|知道什么是标准输入输出，理解 JSONL 基本概念。

## 适用人群与学习目标

适用人群：AI Agent 初学者、刚接触 Pi 的 Node.js 开发者、需要评估 CLI 工具的工程师。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「交互式、print、JSON 与 RPC：同一套 Agent，不同入口」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

how-pi-works.md 明确说明所有接口使用相同的 agent 与 session 机制：Interactive 在终端渲染会话与事件；Print 运行一个 prompt 并写最终响应；JSON 把 agent 事件写成 JSONL；RPC 从 stdin 接受 JSONL 命令并向 stdout 写响应和事件。
usage.md 只确认了交互式入口与若干命令，没有给出 print/JSON 的具体 flags。因此本站只讲语义，不把猜测的参数写成事实。

## 核心原理

模式差异主要在“输入输出契约”和“谁拥有进程”。交互模式由 TUI 负责呈现；自动化模式把结果交给管道；RPC 把 Pi 当作可控制子进程；SDK 则在同进程内创建会话。
底层共同点是事件驱动：消息开始、文本增量、工具开始、工具结果、运行结束等事件都可以被不同前端消费。

## 流程示意

上方 RPC 图强调命令、响应与事件三类记录。不要把事件当作命令回执：事件描述过程，响应描述某个请求的结果。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `packages/coding-agent/docs/how-pi-works.md`
- `packages/coding-agent/src/index.ts`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```json
// JSONL 事件形态的教学示意；字段名来自已核验的 AgentEvent 名称
{"type":"agent_start"}
{"type":"message_update","assistantMessageEvent":{"type":"text_delta","delta":"正在"}}
{"type":"tool_execution_start","toolName":"read","toolCallId":"demo-1"}
{"type":"tool_execution_end","toolName":"read","toolCallId":"demo-1","isError":false}
{"type":"agent_end"}
```

这只是事件名与形状的教学重排，不是 Pi RPC 线协议。真实字段请以固定快照的 types.ts 与 RPC 文档为准。

## 实际执行过程

1. 先在交互模式完成一次只读任务，记录看到的事件阶段。
2. 切换到自动化模式时，只关注“最终输出”与“事件流”的差异。
3. 用 JSONL 解析器逐行读取事件，确认每行都能独立处理。
4. 设计 RPC 集成时，把命令超时、事件积压与进程退出分开处理。

## 设计优点与局限

- 优点：同一会话机制降低多入口维护成本；事件流适合做可观测性与 UI 渲染。
- 局限：不同模式的参数与事件细节需分别核验；JSONL 消费端必须处理乱序或缺失事件。

## 容易出现的问题

- 把演示 JSON 当成生产协议。
- 在 RPC 中只等待事件，不处理显式响应。
- 把 agent_end 当作“绝不会再继续”的信号；应关注 agent_settled。

## 实战案例

任务：用任意脚本逐行读取一组预设事件，统计 tool_execution_start 与 tool_execution_end 的数量。若数量不一致，说明有工具被中止或事件缺失。

## 最佳实践

为每种模式写一条最小冒烟测试；把事件 Schema 校验放在消费端边界。

## 常见问题

### 四种模式是否共用会话？

官方 how-pi-works.md 说它们使用相同的 agent 和 session 机制。

### 哪里查具体 flags？

请查对应版本的 usage / cli 文档；本文不编造未核验参数。

## 延伸阅读

- 本站「交互式、print、JSON 与 RPC：同一套 Agent，不同入口」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
