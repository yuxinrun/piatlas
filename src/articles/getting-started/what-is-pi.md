Pi 是什么：从聊天工具到 Agent Harness|Pi 是最小化、可扩展的 Coding Agent Harness。本文用可核验边界解释模型、工具、会话与宿主的关系。|README.md|README.md,packages/coding-agent/docs/how-pi-works.md|architecture|入门|无需 Pi 使用经验，能理解“程序调用 API”即可。

## 适用人群与学习目标

适用人群：AI Agent 初学者、刚接触 Pi 的 Node.js 开发者、需要评估 CLI 工具的工程师。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「Pi 是什么：从聊天工具到 Agent Harness」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

官方 README 把 Pi 定义为 minimal, extensible agent harness，并强调“让工作流适配你，而不是相反”。这句话的工程含义是：Pi 不是把一次 LLM 回答包装成聊天窗口，而是提供让模型、工具、上下文和会话持续协作的宿主。
要避免一个常见误解：模型本身不会直接修改文件。模型只产生文本、工具调用意图或结构化参数；真正执行 read、edit、bash 等操作的是 Pi 进程中的工具实现。
官方还明确说明 Pi 不内置限制文件系统、进程、网络或凭据访问的权限系统，默认继承启动用户的权限。这是理解 Pi 定位的关键边界。

## 核心原理

可以把 Pi 拆成四个观察面：① 模型面负责请求与流式响应；② 工具面负责执行被模型请求的操作；③ 上下文面决定下一次请求包含哪些消息；④ 会话面持久化事件树并支持分支。
Pi 把这四面放进同一运行循环。上游 how-pi-works.md 明确说活动分支提供下一次模型请求的历史；工具结果与排队消息可能触发下一轮。于是“Agent”不是某个神秘对象，而是一个受控的循环状态机。

## 流程示意

阅读上方图时按“用户界面 → Coding Harness → Agent Runtime → 模型/工具”的顺序理解。它描述职责分层，不表示四个包之间的依赖方向。
真正的依赖边界请到「源码地图」查看逐包 package.json 核验结果。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `README.md`
- `packages/coding-agent/docs/how-pi-works.md`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```typescript
// 教学模型：说明职责边界，不是 Pi 的官方接口
type ToolIntent = { name: string; arguments: Record<string, unknown> };

type TurnResult =
  | { kind: "text"; text: string }
  | { kind: "tool"; intent: ToolIntent };

interface Harness {
  ask(model: string, history: string[], tools: string[]): Promise<TurnResult>;
  execute(intent: ToolIntent): Promise<string>;
  append(event: unknown): void;
}
```

这段代码只用于说明“模型产生意图、宿主执行工具、事件被记录”的三段边界。Pi 的真实类型请查看 packages/ai/src/types.ts 与 packages/agent/src/types.ts。

## 实际执行过程

1. 在隔离目录运行 pi，先只提问“这个目录有哪些文件”，观察回答是否等同于工具执行结果。
2. 输入 `!git status`，确认终端命令输出进入对话；这体现宿主收集证据，而不是模型自行访问仓库。
3. 切换到「Agent Loop 实验室」，用预设事件走完一次工具回填。

## 设计优点与局限

- 优点：默认精简，扩展点明确；同一套会话机制贯穿交互、自动化与 SDK。
- 局限：没有内置细粒度权限系统；使用者必须自己准备隔离环境与信任策略。

## 容易出现的问题

- 把“模型说要改文件”误认为“文件已经改了”。
- 把 Pi 的精简默认为“功能缺失”；官方设计是让你按需扩展。
- 在未信任的项目目录加载扩展或 context files。

## 实战案例

任务：在临时目录创建两个文本文件，让 Pi 统计行数。要求你记录三个证据：模型请求中包含的工具名、工具返回内容、最终回答中引用证据的句子。
这个练习的价值不在于统计结果，而在于你能把“语言生成”和“工具执行”分开。

## 最佳实践

1. 新目录先问“有哪些资源会被加载”。
2. 把涉及写入、网络、凭据的任务放进沙箱。
3. 记录会话路径，便于复盘和分支切换。

## 常见问题

### Pi 是模型吗？

不是。官方把 Pi 定义为 harness；模型由 provider 提供，Pi 负责组织请求、工具和会话。

### Pi 自带 plan mode 吗？

README 明确说默认不内置 sub-agents 和 plan mode；本站相关章节是自行设计方案。

## 延伸阅读

- 本站「Pi 是什么：从聊天工具到 Agent Harness」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
