Telemetry 设计：记录状态，不泄露会话正文|以 pi-telemetry 的公开契约为参照，设计最小化、可控的观测数据。|packages/telemetry/src/index.ts|packages/telemetry/src/index.ts,packages/telemetry/package.json,README.md|security|进阶|了解指标、Span、属性与脱敏基本原则。

## 适用人群与学习目标

适用人群：在真实项目中部署 Coding Agent、关注权限与可观测性的团队。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「Telemetry 设计：记录状态，不泄露会话正文」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

packages/telemetry/src/index.ts 存在，导出 createTypedMetrics、defineTelemetrySchema、NOOP_TELEMETRY_CONTEXT、InMemoryTelemetryContext、telemetryNow 等；README 把 pi-telemetry 描述为厂商无关遥测契约、参考适配器与一致性测试。
这说明遥测层关注“契约与类型”，而不是绑定某个 SaaS 后端。

## 核心原理

Agent 遥测最敏感的不是耗时，而是正文和工具参数。推荐只记录事件类型、阶段、状态、延迟、usage 分类与非敏感标识；正文、路径、凭据、命令参数默认不记录。
Typed schema 的价值是让字段可审计：字段有名字、类型和含义，减少“临时加一个字段”造成的数据泄露。

## 流程示意

上方安全边界图的最右端是“审计/脱敏”。遥测应位于这里，而不是把原始会话直接上传。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `packages/telemetry/src/index.ts`
- `packages/telemetry/package.json`
- `README.md`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```typescript
// 教学事件：字段刻意不包含正文与路径
type AgentMetric = {
  event: "turn_start" | "tool_execution_end" | "agent_settled";
  durationMs?: number;
  isError?: boolean;
  toolName?: string;
  tokenClass?: "input" | "output" | "cache";
};

const metric: AgentMetric = {
  event: "tool_execution_end",
  durationMs: 120,
  isError: false,
  toolName: "count_items"
};
```

这不是 pi-telemetry 的 Schema 定义；实际项目可用 defineTelemetrySchema 等公开能力建立类型化契约。

## 实际执行过程

1. 列出你要回答的运维问题：失败率、延迟、成本还是卡顿。
2. 为每个问题选最小字段。
3. 对正文、路径、命令、凭据设置默认不采集。
4. 在测试环境检查导出数据是否含敏感信息。

## 设计优点与局限

- 优点：契约清晰；可替换后端；默认 NOOP 便于离线运行。
- 局限：类型化 schema 需要维护；过度采集风险高。

## 容易出现的问题

- 把工具参数写入 span 属性。
- 记录完整用户消息用于调试。
- 把遥测开关默认打开且不可关闭。

## 实战案例

任务：设计一份“只读文件工具”指标：事件名、结果状态、耗时、错误类别。明确写出你不采集文件路径和文件内容。

## 最佳实践

默认关闭或默认最小；字段白名单；导出前做脱敏测试。

## 常见问题

### pi-telemetry 是上传服务吗？

从公开导出看它是契约与参考实现；具体后端由宿主决定。

### 能记录 token 数吗？

可以记录分类与聚合值，但不要把正文一起写入。

## 延伸阅读

- 本站「Telemetry 设计：记录状态，不泄露会话正文」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
