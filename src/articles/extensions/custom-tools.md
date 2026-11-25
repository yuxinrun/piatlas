注册自定义工具：从参数到渲染的完整契约|用 ExtensionAPI.registerTool 设计一个只读、可验证、可观测的工具。|packages/coding-agent/docs/extensions.md|packages/coding-agent/docs/extensions.md,packages/coding-agent/src/core/sdk.ts,packages/agent/src/types.ts|extension|高级|熟悉 TypeBox、异步函数与工具权限设计。

## 适用人群与学习目标

适用人群：想给 Pi 增加命令、工具或 UI 的扩展作者。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「注册自定义工具：从参数到渲染的完整契约」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

extensions.md 中自定义工具字段齐全：name、label、description、promptSnippet、promptGuidelines、parameters、prepareArguments、execute、renderCall、renderResult、defaultActive、exposure。
fixed snapshot 的 coding-agent 公开入口还导出 withFileMutationQueue，文档建议文件修改类工具使用它，避免与内置 edit/write 并行覆盖。

## 核心原理

自定义工具不是“包一个函数”就结束。你要同时设计：模型何时选择它（description/promptSnippet）、参数如何校验（parameters/prepareArguments）、执行副作用（execute）、结果如何呈现（renderResult）以及与其他工具的并发关系。
只读工具 safest：它仍可读取敏感文件，因此参数和路径限制不能省略。写工具还必须考虑队列与幂等性。

## 流程示意

上方图把工具放在“执行策略”位置。注册是能力供给，调用时才进入执行策略与结果回填。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `packages/coding-agent/docs/extensions.md`
- `packages/coding-agent/src/core/sdk.ts`
- `packages/agent/src/types.ts`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```typescript
// 教学工具骨架：字段名来自扩展文档，不可直接运行
import { Type } from "typebox";

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "count_lines",
    label: "统计行数",
    description: "统计指定文本的行数，不读取文件",
    parameters: Type.Object({ text: Type.String() }),
    async execute(_id, params) {
      const count = params.text.split("\n").length;
      return {
        content: [{ type: "text", text: `行数：${count}` }],
        details: { count },
        isError: false
      };
    }
  });
}
```

这里刻意不读写文件；若实现文件修改工具，请使用文档推荐的 withFileMutationQueue 处理并发。

## 实际执行过程

1. 先用纯函数实现 execute 逻辑，单独测试。
2. 补齐 TypeBox schema 与两个拒绝样例。
3. 注册工具并用 pi -e 启动，观察模型是否正确选择。
4. 增加 renderCall/renderResult，确认 TUI 输出可读。

## 设计优点与局限

- 优点：完整契约让工具可测、可解释、可审查。
- 局限：字段多，初始成本高；渲染层与执行层需要同步维护。

## 容易出现的问题

- description 写成“做点事情”。
- execute 直接信任 params。
- 文件写入工具忽略并发队列。

## 实战案例

实现一个 count_lines 只读工具；再实现 file_write 的“设计稿”，列出为什么它需要额外审批与队列。

## 最佳实践

先从纯函数工具开始；把 schema 与测试放在注册代码旁边。

## 常见问题

### 命令和工具有什么区别？

命令由用户 /name 触发；工具由模型按工具协议调用。

### 为什么要 renderResult？

它让结果在 TUI 中可读；结构化 details 仍保留给程序消费。

## 延伸阅读

- 本站「注册自定义工具：从参数到渲染的完整契约」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
