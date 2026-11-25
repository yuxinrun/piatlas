工具参数 Schema：让模型意图变成可验证输入|用 TypeBox 与 AgentTool 的字段设计“先校验、后执行”的工具契约。|packages/coding-agent/docs/extensions.md|packages/coding-agent/docs/extensions.md,packages/agent/src/types.ts,packages/ai/src/types.ts|tool|进阶|了解 JSON Schema 或 TypeBox 的基本写法。

## 适用人群与学习目标

适用人群：正在实现 Agent Loop 或工具调用系统的工程师。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「工具参数 Schema：让模型意图变成可验证输入」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

extensions.md 中自定义工具注册字段包括 name、label、description、promptSnippet、promptGuidelines、parameters、prepareArguments、execute、renderCall、renderResult、defaultActive、exposure；导入示例包含 typebox 的 Type 与 Static。
agent/src/types.ts 中 AgentTool 继承 Tool，并增加 prepareArguments 与 execute；Tool 基础字段包含 name、description、parameters。

## 核心原理

Schema 不是“给模型看的说明”而已，它是宿主执行前的守门人。模型可能生成缺失字段、错误类型或越界值；prepareArguments 与参数校验应在 execute 之前运行。
description 与 promptGuidelines 影响模型是否选对工具；parameters 决定能否安全执行；两者缺一不可。

## 流程示意

上方图展示“模型意图 → 查找/校验 → 执行策略 → 结果回填”。Schema 位于第二格，是安全边界而不是装饰。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `packages/coding-agent/docs/extensions.md`
- `packages/agent/src/types.ts`
- `packages/ai/src/types.ts`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```typescript
// 教学工具：字段名来自扩展文档中可见的注册字段
import { Type } from "typebox";

const CountSchema = Type.Object({
  items: Type.Array(Type.String(), { minItems: 1 })
});

const tool = {
  name: "count_items",
  label: "统计条目",
  description: "统计给定字符串数组中的条目数量",
  parameters: CountSchema,
  async execute(toolCallId, params) {
    return {
      content: [{ type: "text", text: String(params.items.length) }],
      details: { count: params.items.length },
      isError: false
    };
  }
};
```

这是教学示例，不是 Pi 官方内置工具；实际注册请按当前版本的 ToolDefinition 类型补齐字段。

## 实际执行过程

1. 先写 parameters，再写 description，避免只靠自然语言约束。
2. 为缺少字段、类型错误、空数组分别准备拒绝样例。
3. 在 execute 前打印参数摘要，确认校验生效。
4. 让模型调用工具，检查 tool_result 是否包含结构化 details。

## 设计优点与局限

- 优点：参数可验证；错误路径可测试；模型与宿主有明确契约。
- 局限：Schema 过严会降低模型可用性；过松则把风险推给 execute。

## 容易出现的问题

- 把 promptSnippet 当成校验。
- 在 execute 中信任未校验的 unknown。
- description 写得太泛，导致工具被误选。

## 实战案例

任务：为“读取文件”工具写三个拒绝样例：缺少路径、路径不是字符串、路径包含空字符。断言三个样例都不会进入 execute。

## 最佳实践

把 schema 与拒绝样例放在同一测试文件；结果同时返回可读文本和结构化 details。

## 常见问题

### prepareArguments 是什么？

AgentTool 上可见的可选字段，用于在 execute 前整理或校验参数。

### 为什么要 details？

它让 UI 或其他工具能读取结构化结果，而不必解析文本。

## 延伸阅读

- 本站「工具参数 Schema：让模型意图变成可验证输入」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
