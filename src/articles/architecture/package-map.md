七个核心包职责地图：名称、入口与直接依赖|把 README 的包说明与 package.json 的依赖声明交叉核对，形成可维护的阅读地图。|package.json|README.md,package.json,packages/ai/package.json,packages/durable/package.json,packages/chord/package.json,packages/telemetry/package.json|monorepo|入门|知道 npm 包名与目录名可能不同。

## 适用人群与学习目标

适用人群：希望读懂 Monorepo 边界的 TypeScript 开发者、做技术选型的架构师。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「七个核心包职责地图：名称、入口与直接依赖」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

README 给出七行包说明：pi-ai 是统一多 Provider LLM API；pi-agent-core 是带工具调用与状态管理的运行时；pi-coding-agent 是交互式 CLI；pi-tui 是差量渲染终端库；pi-durable 是持久化对话、任务和文档运行时；chord 是跨进程对象运行时；pi-telemetry 是厂商无关遥测契约。
逐包 package.json 给出更硬的边界：谁直接依赖谁。

## 核心原理

包职责与包依赖是两个维度。职责回答“它为什么存在”，依赖回答“它必须知道谁”。例如 pi-tui 在图内没有直接依赖，但 coding-agent 依赖它；这不意味着 TUI 与 Agent Runtime 没有数据流，只意味着包清单层面的依赖方向如此。

## 流程示意

上方图的每一格都来自 README 或 package.json。请以文末链接为准；本站不绘制未核验的箭头。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `README.md`
- `package.json`
- `packages/ai/package.json`
- `packages/durable/package.json`
- `packages/chord/package.json`
- `packages/telemetry/package.json`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```json
{
  "pi-ai": ["pi-telemetry"],
  "pi-agent-core": ["pi-ai"],
  "pi-coding-agent": ["pi-agent-core", "pi-ai", "pi-tui"],
  "pi-tui": [],
  "pi-durable": ["chord", "pi-ai", "pi-telemetry"],
  "chord": ["pi-telemetry"],
  "pi-telemetry": []
}
```

这是“七个研究对象之间”的直接依赖投影，不是完整 dependency 字段，也不是运行时调用图。

## 实际执行过程

1. 从 README 抄出七个包名与一句职责。
2. 打开每个 package.json，把 name 字段与目录名对齐。
3. 只筛选这七个包，记录 dependencies 中的命中项。
4. 用本项目「架构地图」点击模块，核对说明是否一致。

## 设计优点与局限

- 优点：这张地图足够小，能长期使用；每个人都能用 package.json 复核。
- 局限：不覆盖 apps、examples 与外部依赖；不能回答“谁调用了谁”。

## 容易出现的问题

- 把 pi-durable 当成 coding-agent 的直接依赖。
- 因为 telemetry 被多方依赖，就把所有数据流都画到遥测上。
- 忽略版本快照，跨版本套用依赖关系。

## 实战案例

在团队 Wiki 中维护一张“七包表”：目录、包名、职责、公开入口、图内依赖、核验日期。

## 最佳实践

每次 Pi 升级只重跑 package.json 核对，不必重写全部文章。

## 常见问题

### 为什么没有 pi-chat？

README 把它列为相关项目，不属于本次七个研究对象。

### 图内没有箭头是否代表完全独立？

只代表这七个 package.json 中没有直接依赖命中。

## 延伸阅读

- 本站「七个核心包职责地图：名称、入口与直接依赖」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
