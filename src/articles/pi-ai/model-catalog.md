模型目录与 Model 对象：配置不是模型能力说明书|从 BaseModel/Model 字段理解模型注册、成本与上下文预算的边界。|packages/ai/src/types.ts|packages/ai/src/types.ts,packages/ai/package.json|provider|进阶|了解 contextWindow、maxTokens 与 token 计费的基本含义。

## 适用人群与学习目标

适用人群：需要接入多模型 Provider 的后端工程师、关心流式协议与兼容性的开发者。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「模型目录与 Model 对象：配置不是模型能力说明书」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

packages/ai/src/types.ts 中可见 BaseModel 字段：id、name、api、provider、baseUrl、input、inputLimits、cost、headers；Model 又扩展 reasoning、thinkingLevelMap、promptCache、contextWindow、maxTokens、samplingParams 与 compat。
这些字段说明模型目录不仅是“可选模型列表”，还承载协议、能力、成本与兼容策略。

## 核心原理

Model 对象是请求构造的输入，也是预算判断的依据。contextWindow 决定历史投影能放多少内容；maxTokens 约束输出；cost 影响统计；compat 处理厂商差异。
不要把模型显示名当成稳定标识。id + provider + api 的组合才更接近可复现配置。

## 流程示意

上方图展示统一模型描述进入适配器，再映射到厂商事件。模型目录位于这条链路的入口。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `packages/ai/src/types.ts`
- `packages/ai/package.json`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```typescript
// 教学示例：字段来自固定快照，模型 ID 为占位
const model = {
  id: "example-model",
  name: "Example Model",
  api: "openai-completions",
  provider: "example-provider",
  baseUrl: "https://example.invalid/v1",
  contextWindow: 128000,
  maxTokens: 8192,
  reasoning: false,
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }
};
```

cost 的具体子字段可能随版本变化；这里只为说明“成本属于模型描述”，不要照抄为生产配置。

## 实际执行过程

1. 在 Pi 中用 /model 选择模型，记录 provider 与 id。
2. 对照 types.ts 找出该模型可能使用的 api 字段。
3. 检查 contextWindow 与压缩策略的关系。
4. 升级版本后重新核对模型目录 pin。

## 设计优点与局限

- 优点：模型配置集中，便于统一预算与成本统计。
- 局限：字段多且部分可选；同名模型可能因 provider 不同而能力不同。

## 容易出现的问题

- 只看模型名，不看 provider。
- 把 contextWindow 当成可用 token 数；系统提示和工具定义也占空间。
- 假设所有模型支持相同 thinkingLevel。

## 实战案例

建立一张模型表：id、provider、api、contextWindow、maxTokens、是否支持工具、核验日期。

## 最佳实践

在团队配置中固定 provider + id；把模型目录变更纳入升级检查清单。

## 常见问题

### 模型目录会随版本变化吗？

会。Nix 构建还使用固定 pin；升级后应复核。

### contextWindow 越大越好吗？

不一定，还要看成本、延迟与实际上下文策略。

## 延伸阅读

- 本站「模型目录与 Model 对象：配置不是模型能力说明书」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
