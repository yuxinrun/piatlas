Provider Adapter 模式：统一接口如何容纳不同厂商|从 KnownApi、Model 与 StreamFunction 观察 pi-ai 的适配边界，区分 provider 与 api。|packages/ai/src/types.ts|packages/ai/src/types.ts,packages/ai/package.json,README.md|provider|进阶|理解接口、适配器和流式响应概念。

## 适用人群与学习目标

适用人群：需要接入多模型 Provider 的后端工程师、关心流式协议与兼容性的开发者。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「Provider Adapter 模式：统一接口如何容纳不同厂商」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

README 把 pi-ai 描述为统一多 Provider LLM API，列出 OpenAI、Anthropic、Google 等。固定快照的 packages/ai/src/types.ts 中可见 KnownApi 联合类型，包含 openai-completions、anthropic-messages、google-generative-ai 等取值。
同一文件还区分 provider 与 api：AssistantMessage 同时记录 provider、api、model 与可选 responseModel。这说明“厂商是谁”和“使用哪种协议”是两个维度。

## 核心原理

适配器的价值是把厂商差异收敛到统一消息与统一事件。上层 Agent 只看到 Message、ToolCall、AssistantMessageEvent；provider 实现负责把 HTTP/SDK 的响应转成这些类型。
从类型可见 stream 与 streamSimple 两种入口形态，以及 AssistantMessageEventStream。Adapter 不是“换个 baseUrl”这么简单，还涉及工具调用表示、思考块、停止原因与错误映射。

## 流程示意

上方图展示“统一模型描述 → 适配器路由 → 厂商事件 → 统一事件”。这是一条教学上的转换链，不代表某个具体函数的调用栈。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `packages/ai/src/types.ts`
- `packages/ai/package.json`
- `README.md`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```typescript
// 固定快照可见的类型形状（精简）
type KnownApi =
  | "openai-completions"
  | "openai-responses"
  | "anthropic-messages"
  | "google-generative-ai"
  | "google-vertex"
  | "pi-messages";

interface BaseModel {
  id: string;
  name: string;
  api: string;
  provider: string;
  baseUrl: string;
  contextWindow: number;
  maxTokens: number;
}

type StreamFunction = (
  model: Model,
  context: TranscriptContext,
  options?: SimpleStreamOptions
) => AssistantMessageEventStream;
```

这里省略了泛型与可选字段。重点是 api/provider/model 三个维度不能混成一件事。

## 实际执行过程

1. 打开 ai/src/types.ts，抄出 KnownApi 的全部可见取值。
2. 找到 AssistantMessage，确认它同时保留 provider 与 api。
3. 对比两个 provider 的工具调用事件，记录字段差异。
4. 在扩展中切换模型，观察事件名是否保持一致。

## 设计优点与局限

- 优点：上层代码不被厂商 SDK 绑定；事件模型适合流式 UI。
- 局限：兼容层越厚，边界情况越难验证；不同 provider 的能力并非完全等价。

## 容易出现的问题

- 把 provider 名当作 api 名。
- 认为所有模型都支持同样的 thinkingLevel。
- 忽略 compat 字段带来的行为差异。

## 实战案例

为两个 provider 写同一组 fixture：文本增量、工具调用、错误结束。断言统一事件序列一致，再单独记录差异字段。

## 最佳实践

新增适配器时先写事件映射表，再写网络请求；用固定 commit 的类型定义做验收。

## 常见问题

### 统一 API 是否抹平所有差异？

不会。它统一的是类型与事件；模型能力、限制和错误语义仍需分别处理。

### provider 与 api 谁决定请求协议？

从类型看两者都记录；api 更接近协议选择，provider 更接近来源标识。

## 延伸阅读

- 本站「Provider Adapter 模式：统一接口如何容纳不同厂商」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
