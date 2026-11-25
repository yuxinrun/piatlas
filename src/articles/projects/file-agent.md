开发文件读取 Agent：路径校验是第一道闸门|从只读工具出发，设计路径白名单、输出截断与证据引用。|packages/coding-agent/docs/extensions.md|packages/coding-agent/src/core/sdk.ts,packages/coding-agent/docs/extensions.md,packages/coding-agent/src/index.ts|coding|进阶|了解路径解析、符号链接与最小权限。

## 适用人群与学习目标

适用人群：希望通过小型可验证项目掌握 Agent 工程方法的实践者。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「开发文件读取 Agent：路径校验是第一道闸门」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

core/sdk.ts 固定导出包含 createReadTool、createReadOnlyTools、createGrepTool、createFindTool、createLsTool；coding-agent 入口还导出 truncateHead、truncateLine、truncateTail 与 DEFAULT_MAX_BYTES/DEFAULT_MAX_LINES 等工具函数。
这说明“读取”也包含边界：大小限制、行限制与输出截断是工具契约的一部分。

## 核心原理

文件读取 Agent 的目标不是“把文件都给模型”，而是把任务需要的最小片段交给模型。路径校验、大小限制、脱敏与证据引用共同构成安全边界。
符号链接可能让看似在工作目录内的路径指向外部；因此校验应基于解析后的真实路径，而非仅做字符串前缀判断。

## 流程示意

上方图展示 Coding Agent 工作流。文件读取 Agent 只做前半段：目标与只读取证，不进入写入与人审变更。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `packages/coding-agent/src/core/sdk.ts`
- `packages/coding-agent/docs/extensions.md`
- `packages/coding-agent/src/index.ts`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```typescript
// 教学路径校验：真实实现还需处理符号链接与平台差异
function assertInside(root: string, target: string) {
  const r = root.replace(/[\\/]+$/, "");
  if (!target.startsWith(r + "/") && target !== r) {
    throw new Error("路径超出工作目录");
  }
}

function readLimited(text: string, maxLines = 200) {
  const lines = text.split("\n");
  return {
    content: lines.slice(0, maxLines).join("\n"),
    truncated: lines.length > maxLines
  };
}
```

这是教学代码，不是 createReadTool 的实现；生产环境需使用平台安全 API 解析绝对路径与符号链接。

## 实际执行过程

1. 定义工作目录白名单，拒绝白名单外路径。
2. 限制单文件大小与行数，返回 truncated 标记。
3. 对含凭据的文件名与内容做脱敏。
4. 在结果中保留路径与行号作为证据。
5. 用 fixture 测试路径穿越与超长文件。

## 设计优点与局限

- 优点：输出可控；证据可追溯；与 Pi 工具边界一致。
- 局限：路径与编码跨平台复杂；过度截断会丢证据。

## 容易出现的问题

- 只做字符串前缀判断。
- 把截断后的内容当成完整文件。
- 读取 .env 后把内容放进摘要。

## 实战案例

建立三份测试文件：普通文本、超长文件、指向外部的符号链接；断言只有第一个能完整读取。

## 最佳实践

默认只读、默认截断、默认脱敏；证据带行号；失败信息不暴露绝对路径。

## 常见问题

### createReadTool 是什么？

固定快照 core/sdk.ts 的公开导出之一，用于创建读取工具。

### 为什么要截断？

控制上下文占用并降低敏感信息暴露。

## 延伸阅读

- 本站「开发文件读取 Agent：路径校验是第一道闸门」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
