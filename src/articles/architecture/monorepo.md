Pi Monorepo 架构：从工作区清单读起|用根 package.json 与七个包清单建立可靠目录观，不把目录名直接等同于 npm 包名。|package.json|package.json,README.md,packages/ai/package.json,packages/agent/package.json,packages/coding-agent/package.json|monorepo|入门|了解 npm workspace 的基本概念。

## 适用人群与学习目标

适用人群：希望读懂 Monorepo 边界的 TypeScript 开发者、做技术选型的架构师。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「Pi Monorepo 架构：从工作区清单读起」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

固定快照的根 package.json 名为 pi-monorepo，版本 0.0.3，私有包，workspaces 包含 packages/*、apps/* 及若干示例目录。README 列出了七个核心包及其职责。
目录名与包名并不总是一字不差：packages/ai 对应 @earendil-works/pi-ai，packages/agent 对应 @earendil-works/pi-agent-core。阅读源码时同时看目录与 package.json 才能避免混淆。

## 核心原理

Monorepo 的首要价值是“边界可见”：包清单把依赖关系显式化，公开入口把可消费 API 显式化。Pi 的七个对象可以按职责分层阅读，但分层不等于依赖图。
本站源码地图只统计这七个包之间的直接依赖；它明确排除传递依赖、外部依赖和未研究对象。

## 流程示意

上方图给出“根清单 → 包清单 → 公开入口 → 实现与测试”的阅读路线。它是一条阅读路径，不是运行时调用图。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `package.json`
- `README.md`
- `packages/ai/package.json`
- `packages/agent/package.json`
- `packages/coding-agent/package.json`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```json
{
  "name": "pi-monorepo",
  "version": "0.0.3",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.19.0" },
  "workspaces": [
    "packages/*",
    "apps/*"
  ]
}
```

这是根清单的精简摘录，workspaces 还包含若干 example 路径；完整内容请点击文末固定快照链接。

## 实际执行过程

1. 打开根 package.json，记录 Node 版本与 workspaces。
2. 逐一打开七个包的 package.json，记录 name 与直接依赖。
3. 打开每个包的 src/index.ts，区分“公开导出”和“内部实现”。
4. 把发现写进自己的包边界表，而不是背诵目录名。

## 设计优点与局限

- 优点：包边界清楚；能让扩展作者只依赖公开包而不深入内部路径。
- 局限：包数量与职责分层不完全一一对应；只读目录名容易误判。

## 容易出现的问题

- 把 packages/agent 称为 @earendil-works/agent。
- 把 pi-durable 或 chord 误写成 CLI 的直接依赖。
- 从传递依赖推断官方架构意图。

## 实战案例

制作一张两列表：左列目录名，右列 package.json 中的 name。再增加第三列“图内直接依赖”，用七个 package.json 校验。

## 最佳实践

阅读任何 Monorepo 都从清单开始，再从入口文件确认公开面；最后才进入实现细节。

## 常见问题

### 七个包是否构成一条依赖链？

不是。已核验结果是分叉结构：telemetry 是底层，coding-agent 依赖 agent/ai/tui。

### pi-chat 是否属于这 Seven 包？

README 把它列为相关项目，不属于本次七个研究对象。

## 延伸阅读

- 本站「Pi Monorepo 架构：从工作区清单读起」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
