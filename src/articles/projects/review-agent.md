构建只读代码审查 Agent：证据、反例与不确定性|把 Pi 的只读工具、会话树与 Mock 测试组合成可验证的审查工作流。|packages/coding-agent/docs/how-pi-works.md|packages/coding-agent/src/core/sdk.ts,packages/coding-agent/docs/how-pi-works.md,packages/agent/src/types.ts|coding|高级|熟悉代码审查流程、只读工具与结构化输出。

## 适用人群与学习目标

适用人群：希望通过小型可验证项目掌握 Agent 工程方法的实践者。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「构建只读代码审查 Agent：证据、反例与不确定性」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

coding-agent 的 core/sdk.ts 导出 createReadOnlyTools、createReadTool、createGrepTool、createFindTool、createLsTool 等；how-pi-works.md 说明请求会携带系统提示、活动分支、工具定义与 skill 描述。
这些能力足以构造“只读取证型”Agent：它能收集证据，但不直接修改代码。

## 核心原理

审查 Agent 的输出不应只有“通过/不通过”，而应是三栏：结论、证据、未知。证据来自工具结果；未知必须显式保留，避免模型补全不存在的事实。
只读不是绝对安全：读取敏感文件仍可能泄露内容。因此仍要限制工作目录、输出脱敏与会话分享。

## 流程示意

上方图是“明确目标 → 只读取证 → 人审变更 → 验证输出”的 Coding Agent 教学流程；审查 Agent 停留在前三步，不执行写入。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `packages/coding-agent/src/core/sdk.ts`
- `packages/coding-agent/docs/how-pi-works.md`
- `packages/agent/src/types.ts`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```typescript
type Finding = {
  claim: string;
  evidence: string[];
  uncertainty: string;
};

function render(findings: Finding[]) {
  return findings.map(f => [
    "结论：" + f.claim,
    "证据：" + (f.evidence.join("; ") || "无"),
    "未知：" + (f.uncertainty || "无")
  ].join("\n")).join("\n\n");
}

const report = render([{
  claim: "入口函数只做参数解析",
  evidence: ["src/index.ts:parseArgs"],
  uncertainty: "未核验运行时装配顺序"
}]);
```

这是结构化输出的教学示例；真实审查需要把证据行与工具结果关联，并保留会话引用。

## 实际执行过程

1. 在 SDK 中只启用 read/grep/find/ls 等只读工具。
2. 提供明确审查范围与禁止读取路径。
3. 要求每条结论至少引用一处证据。
4. 把未知项汇总给人审。
5. 用 Mock LLM 重放同一仓库快照，检查结果稳定。

## 设计优点与局限

- 优点：副作用小；结果可复核；适合接入 CI 报告。
- 局限：只读无法验证运行结果；证据质量依赖工具与提示。

## 容易出现的问题

- 让模型“猜一下”未知项。
- 把会话导出直接分享给外部。
- 没有固定仓库快照就做对比。

## 实战案例

选择一个小型开源仓库，对一次提交做只读审查；产出三栏报告，并人工抽查证据是否真实存在。

## 最佳实践

锁定 commit；限制目录；证据与结论同行；未知不省略。

## 常见问题

### 只读 Agent 还需要沙箱吗？

需要；读取范围和会话导出仍是风险面。

### 需要 sub-agent 吗？

可选；Pi 不内置，需自行设计。

## 延伸阅读

- 本站「构建只读代码审查 Agent：证据、反例与不确定性」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
