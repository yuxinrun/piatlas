流式事件处理：从 text_delta 到权威消息|用 AssistantMessageEvent 的可见变体建立事件处理模型，区分增量片段与最终记录。|packages/ai/src/types.ts|packages/ai/src/types.ts,packages/agent/src/types.ts|loop|进阶|理解异步迭代或事件流的基本概念。

## 适用人群与学习目标

适用人群：需要接入多模型 Provider 的后端工程师、关心流式协议与兼容性的开发者。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「流式事件处理：从 text_delta 到权威消息」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

packages/ai/src/types.ts 中可见 AssistantMessageEvent 的变体：start、text_start、text_delta、text_end、thinking_*、toolcall_start、toolcall_delta、toolcall_end、done、error。每个变体带 partial，done 带完整 message。
agent 层又把 message_update 包装成 AgentEvent，并把 assistantMessageEvent 作为字段暴露。这解释了为什么 UI 能同时看到“哪条消息在变”和“增量内容是什么”。

## 核心原理

流式处理有三条规则：① 增量只用于呈现，不应当作最终事实；② 完整消息以 message_end 或 done 中的权威对象为准；③ 工具调用通常经历 start/delta/end，参数在 end 时才稳定。
把 partial 当作可变的草稿，把 message 当作已提交记录，能避免大量状态同步错误。

## 流程示意

上方图强调“有未完成工作时继续”的回环。流式事件本身不等于 Agent Loop；它只是循环中的模型响应阶段。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `packages/ai/src/types.ts`
- `packages/agent/src/types.ts`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```typescript
// 教学消费者：事件名与字段来自固定快照的类型
type AssistantEvent =
  | { type: "text_delta"; contentIndex: number; delta: string; partial: unknown }
  | { type: "toolcall_end"; contentIndex: number; toolCall: { id: string; name: string }; partial: unknown }
  | { type: "done"; reason: string; message: unknown };

function consume(event: AssistantEvent) {
  switch (event.type) {
    case "text_delta":
      process.stdout.write(event.delta);
      break;
    case "toolcall_end":
      console.log("完整工具意图", event.toolCall.name);
      break;
    case "done":
      console.log("权威消息已到达");
      break;
  }
}
```

这是最小消费者示例；真实事件还包含 thinking、error 等分支，必须补齐穷尽处理。

## 实际执行过程

1. 准备一组固定事件 fixture，包含文本与工具调用。
2. 先只渲染 text_delta，确认增量顺序。
3. 增加 toolcall_end 处理，确认只在参数完整后执行工具。
4. 用 done 中的 message 覆盖草稿状态，检查一致性。

## 设计优点与局限

- 优点：低延迟反馈；事件粒度足以驱动精细 UI。
- 局限：消费者必须处理乱序、重复与错误结束；草稿状态管理复杂。

## 容易出现的问题

- 每收到 text_delta 就写会话文件。
- 在 toolcall_delta 阶段执行工具。
- 只监听 text_delta，漏掉 error 与 done。

## 实战案例

用本地 JSONL 重放同一组事件两次，确保渲染结果一致；再故意删掉 done，观察系统是否还能终止。

## 最佳实践

把 partial 与 committed 分开存储；在事件处理器中做 Schema 校验；对未知事件类型显式忽略并记录。

## 常见问题

### text_delta 能拼接成最终回答吗？

可用于显示，但最终应以 done 的 message 或 message_end 为准。

### 工具参数什么时候可信？

从 toolcall_end 的 toolCall 读取更稳妥。

## 延伸阅读

- 本站「流式事件处理：从 text_delta 到权威消息」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
