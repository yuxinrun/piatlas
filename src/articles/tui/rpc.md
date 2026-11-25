RPC 工作机制：把 Pi 当作可控制的子进程|理解 stdin 命令、stdout 响应与事件三类 JSONL 记录，避免把事件当回执。|packages/coding-agent/docs/how-pi-works.md|packages/coding-agent/docs/how-pi-works.md,packages/coding-agent/src/index.ts|rpc|进阶|熟悉子进程、标准输入输出与 JSONL。

## 适用人群与学习目标

适用人群：构建终端交互、RPC 服务或进程内 SDK 集成的工程师。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「RPC 工作机制：把 Pi 当作可控制的子进程」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

how-pi-works.md 明确说明：RPC 模式从 stdin 接受 JSONL 命令，并向 stdout 写出响应和事件。coding-agent 公开入口包含 runRpcMode、RpcClient、RpcCommand、RpcResponse、RpcSessionState。
usage.md 没有给出 print/JSON 的具体 flags；同样，本文不编造 RPC 命令字段。

## 核心原理

RPC 把控制权交给外部宿主：宿主发送命令，Pi 子进程维护会话并返回事件流。命令有明确请求语义；事件是过程通知；响应是命令结果。
设计客户端时，三类记录必须分路处理。若把事件当响应，会导致超时判断错误；若忽略事件，就失去流式 UI 与观测能力。

## 流程示意

上方图中“宿主客户端 → stdin 命令 → 子进程 → stdout 响应/事件”是 RPC 的教学骨架。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `packages/coding-agent/docs/how-pi-works.md`
- `packages/coding-agent/src/index.ts`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```typescript
// 教学 JSONL 记录分类；字段不是 Pi RPC 协议
const lines = [
  { channel: "command", id: "c1", method: "prompt" },
  { channel: "event", type: "message_update" },
  { channel: "response", id: "c1", ok: true }
];

for (const record of lines) {
  if (record.channel === "command") continue;
  if (record.channel === "event") renderEvent(record);
  if (record.channel === "response") resolveCommand(record.id);
}
```

真实 RpcCommand/RpcResponse 字段必须按当前版本类型定义核验；本例只展示三类记录的处理模式。

## 实际执行过程

1. 启动 RPC 子进程并保存 stdout 原始行。
2. 把每行按“命令/响应/事件”分类。
3. 为响应维护 pending map，避免事件误触发 resolve。
4. 处理进程退出与超时，确保 pending 全部 reject。

## 设计优点与局限

- 优点：语言无关；进程隔离天然；事件流可复用。
- 局限：协议字段需要版本管理；客户端要处理背压与超时。

## 容易出现的问题

- 把每一行都当命令响应。
- 不处理 stderr 与进程退出。
- 假设事件顺序在跨进程场景下完全相同。

## 实战案例

用本地脚本模拟三条 JSONL 记录；故意让事件先于响应到达，断言客户端不会提前结束等待。

## 最佳实践

为命令编号；响应与事件分流；记录原始行用于调试但脱敏。

## 常见问题

### RPC 与 SDK 谁更适合隔离？

RPC 是子进程边界；SDK 是进程内集成。

### 事件是回执吗？

不是。事件描述过程，响应才是命令结果。

## 延伸阅读

- 本站「RPC 工作机制：把 Pi 当作可控制的子进程」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
