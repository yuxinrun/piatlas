Skill 自动加载：为什么只把名称和描述放进上下文|从 SKILL.md frontmatter 到按需读取，理解描述是路由器而不是装饰。|packages/coding-agent/docs/skills.md|packages/coding-agent/docs/skills.md,packages/coding-agent/docs/how-pi-works.md|skills|入门|会写 Markdown frontmatter，理解提示词上下文成本。

## 适用人群与学习目标

适用人群：设计领域工作流、提示词资源和可分发 Agent 包的开发者。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「Skill 自动加载：为什么只把名称和描述放进上下文」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

skills.md 明确说明：启动时 Pi 只把每个 skill 的名称、描述和路径加入 system prompt，不加入完整指令；任务匹配时模型读取 SKILL.md 并遵循其中说明。
how-pi-works.md 也说明请求携带工具定义和 skill 描述，完整 skill 指令按需加载。

## 核心原理

Skill 的核心不是“长提示词”，而是“可路由的领域流程”。description 同时回答“做什么”和“何时使用”，决定模型是否会在合适时机加载它。
按需加载节省上下文，但把选择权交给模型。若模型没选中，用户可用 /skill:name 强制加载；若设置 disable-model-invocation，则该 skill 不参与自动选择。

## 流程示意

上方图展示“发现目录 → 读取描述 → 按需读取正文 → 应用步骤”。关键是第三步：完整正文不是启动就进入请求。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `packages/coding-agent/docs/skills.md`
- `packages/coding-agent/docs/how-pi-works.md`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```markdown
---
name: pdf-tools
description: Extract text and tables from PDF files. Use when reading, converting, or inspecting PDFs.
---

# PDF tools

Read references/formats.md before converting a document.
Run scripts relative to this skill directory.
```

示例来自官方 skills 文档的结构说明；路径必须相对 skill 目录。不要引用网络图片或外部脚本 URL。

## 实际执行过程

1. 创建一个目录并放入 SKILL.md。
2. 启动 Pi，确认 /skill:name 命令出现。
3. 给一个相关任务但不显式调用，观察是否自动加载。
4. 编辑 SKILL.md 后运行 /reload，验证变更生效。

## 设计优点与局限

- 优点：上下文成本低；领域流程可复用、可分发。
- 局限：description 写不好就不会被选中；模型可能错误判断相关性。

## 容易出现的问题

- 把完整流程写进 description。
- 用绝对路径引用附属文件。
- 加载不熟悉的 project skill 及其脚本。

## 实战案例

写两个 description：一个“Helps with PDFs”，一个官方示例式描述。让同事判断哪个更容易触发，并记录理由。

## 最佳实践

description 用“做什么 + 何时用”；正文只写步骤；脚本和参考资料分目录。

## 常见问题

### 格式错误的 skill 会加载吗？

skills.md 说格式错误或缺少 description 的 skill 不会被加载。

### 如何强制加载？

使用 /skill:name。

## 延伸阅读

- 本站「Skill 自动加载：为什么只把名称和描述放进上下文」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
