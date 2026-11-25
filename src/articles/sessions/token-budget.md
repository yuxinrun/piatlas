Token Budget：把上下文预算当作工程约束|区分模型 contextWindow、估算函数与请求投影里的真实占用。|packages/ai/src/types.ts|packages/ai/src/types.ts,packages/coding-agent/src/index.ts|compaction|进阶|了解 token 与上下文窗口概念。

## 适用人群与学习目标

适用人群：需要长任务状态管理、会话恢复和上下文控制的开发者。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「Token Budget：把上下文预算当作工程约束」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

packages/ai/src/types.ts 中 Model 可见 contextWindow 与 maxTokens；coding-agent 的公开入口包含 estimateTokens、calculateContextTokens、getLastAssistantUsage 与 DEFAULT_COMPACTION_SETTINGS。
这些名字说明预算分为两层：模型层描述窗口大小，宿主层估算当前上下文与统计实际使用。

## 核心原理

预算不是“消息字数”。系统提示、工具定义、skill 描述、近期原文、摘要与模型专用消息都可能占用窗口。输出还需要 maxTokens 空间。
工程上应把预算视为可观测指标：估算值用于决定是否压缩，实际 usage 用于复盘与成本分析。两者不能互相替代。

## 流程示意

上方图中“摘要 + 近期原文”进入下一次请求。预算判断发生在构造请求之前，而不是模型返回之后。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `packages/ai/src/types.ts`
- `packages/coding-agent/src/index.ts`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```typescript
// 教学估算：真实环境请使用公开导出并按模型校准
type ModelBudget = { contextWindow: number; maxTokens: number };

function remaining(model: ModelBudget, estimatedInput: number) {
  return model.contextWindow - estimatedInput - model.maxTokens;
}

const model = { contextWindow: 128000, maxTokens: 8192 };
const estimatedInput = 40000;

console.log(remaining(model, estimatedInput)); // 教学值，不是真实 tokenizer 结果
```

字符数估算在不同语言与模型上误差很大；生产环境应使用与模型匹配的计数方式。

## 实际执行过程

1. 记录当前模型的 contextWindow 与 maxTokens。
2. 统计系统提示、工具定义与历史消息的估算占用。
3. 为输出预留 maxTokens，再决定是否需要压缩。
4. 用实际 usage 对照估算误差，修正策略。

## 设计优点与局限

- 优点：预算显式化后，长任务更可控；压缩触发条件可测试。
- 局限：估算与真实 token 有偏差；不同内容类型占用差异大。

## 容易出现的问题

- 把 contextWindow 全部留给历史。
- 忽略工具定义与 skill 描述。
- 用中文字符数直接等同 token 数。

## 实战案例

构造三条不同长度的历史，分别计算“是否触发压缩”；再用实验室滑块验证趋势而不是绝对值。

## 最佳实践

设定安全余量；把 usage 写入观测；对长工具输出做截断与分页。

## 常见问题

### estimateTokens 准确吗？

名字表示估算；实际使用应看 usage 统计。

### 压缩阈值固定吗？

固定快照有 DEFAULT_COMPACTION_SETTINGS，具体值请按版本核验。

## 延伸阅读

- 本站「Token Budget：把上下文预算当作工程约束」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
