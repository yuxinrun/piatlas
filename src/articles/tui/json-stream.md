JSONL 事件流：让机器消费 Agent 过程|把消息、工具与停止原因映射到可重放的 JSONL 记录，建立消费端契约。|packages/coding-agent/docs/how-pi-works.md|packages/coding-agent/docs/how-pi-works.md,packages/ai/src/types.ts,packages/coding-agent/src/index.ts|rpc|进阶|熟悉逐行解析、错误恢复与 Schema 校验。

## 适用人群与学习目标

适用人群：构建终端交互、RPC 服务或进程内 SDK 集成的工程师。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「JSONL 事件流：让机器消费 Agent 过程」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

how-pi-works.md 明确说明 JSON 模式把 agent 事件写成 JSONL。ai/src/types.ts 中可见 AssistantMessageEvent 与 AgentEvent 的多种事件名，coding-agent 公开入口包含 RpcResponse 等类型。
JSONL 的优点是每行独立；缺点是消费端必须自己处理缺失、乱序与版本变化。

## 核心原理

事件流应按“可重放”设计：每条记录自带类型、时间与足够上下文；不依赖前一条记录的内部状态。
消费端应把“未知事件”作为兼容信号，而不是崩溃原因；同时保留原始行用于排查。

## 流程示意

上方图中 stdout 同时产生响应与事件。JSONL 消费者要先分流，再决定是否呈现。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `packages/coding-agent/docs/how-pi-works.md`
- `packages/ai/src/types.ts`
- `packages/coding-agent/src/index.ts`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```typescript
import { createInterface } from "node:readline";

const rl = createInterface({ input: process.stdin });

rl.on("line", (line) => {
  if (!line.trim()) return;
  try {
    const event = JSON.parse(line) as { type?: string };
    switch (event.type) {
      case "message_update":
      case "tool_execution_end":
      case "agent_end":
        handle(event);
        break;
      default:
        recordUnknown(event);
    }
  } catch {
    recordMalformed(line);
  }
});
```

事件名来自已核验类型；字段与完整 Schema 需按当前版本校验。

## 实际执行过程

1. 保存一份原始 JSONL fixture。
2. 写解析器逐行处理，不缓存整段文本。
3. 为未知事件与坏行分别计数。
4. 用同一 fixture 重放两次，断言结果一致。

## 设计优点与局限

- 优点：流式友好；可与文件、管道、RPC 共用。
- 局限：无全局 Schema 时容易漂移；坏行会影响后续解析。

## 容易出现的问题

- 等到进程结束才解析。
- 把未知类型当致命错误。
- 把原始正文写入公开日志。

## 实战案例

构造十行 fixture，其中一行坏 JSON、一行未知事件。要求解析器继续处理其余八行并输出统计。

## 最佳实践

使用可版本化的事件 Schema；解析器向前兼容；日志脱敏。

## 常见问题

### JSONL 与 JSON 数组有什么区别？

JSONL 每行独立，适合追加与流式读取。

### 事件缺行怎么办？

消费端应记录缺口，不假设流完整。

## 延伸阅读

- 本站「JSONL 事件流：让机器消费 Agent 过程」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
