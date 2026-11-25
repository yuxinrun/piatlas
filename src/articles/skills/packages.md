Pi Packages 与资源配置：npm 与 Git 分发边界|把 README 的分发说明与 settings 中的 packages/extensions 字段组合成安装前审阅清单。|packages/coding-agent/docs/skills.md|README.md,packages/coding-agent/docs/extensions.md,packages/coding-agent/docs/skills.md|skills|进阶|了解 npm 包与 git 仓库的基本分发方式。

## 适用人群与学习目标

适用人群：设计领域工作流、提示词资源和可分发 Agent 包的开发者。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「Pi Packages 与资源配置：npm 与 Git 分发边界」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

README 明确说明扩展、skills、prompt templates、themes 可打包为 Pi packages，通过 npm 或 git 分享。
extensions.md 的 settings 示例包含 packages（如 npm:@foo/bar@1.0.0、git:github.com/user/repo@v1）与 extensions 本地路径字段；skills.md 也说明 Pi package 可分发一个或多个 skills。

## 核心原理

分发单位不是“一个文件”，而是一组可发现资源。安装前要审阅的不只是 SKILL.md，还包括脚本、扩展入口、依赖声明与自动加载行为。
版本固定是供应链安全的一部分。示例中的包名带版本，git 源带 tag；实际项目应尽量使用可复现引用。

## 流程示意

上方图展示发现目录与按需读取。Package 只是把这些资源放到可发现位置，并不改变加载机制。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `README.md`
- `packages/coding-agent/docs/extensions.md`
- `packages/coding-agent/docs/skills.md`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```json
{
  "packages": [
    "npm:@foo/bar@1.0.0",
    "git:github.com/user/repo@v1"
  ],
  "extensions": [
    "/path/to/local/extension.ts",
    "/path/to/local/extension/dir"
  ]
}
```

这是 extensions.md 中的配置形态示例；包名与仓库为占位，使用前请替换为已审阅来源。

## 实际执行过程

1. 列出包内所有 SKILL.md、扩展入口与脚本。
2. 检查是否有网络请求、shell 执行或读取凭据。
3. 用版本或 tag 固定来源。
4. 在隔离目录安装并观察发现日志。
5. 卸载后确认没有残留全局扩展。

## 设计优点与局限

- 优点：资源可复用、可版本化；团队能共享领域工作流。
- 局限：扩展在进程内执行；包内容变化可能引入新权限。

## 容易出现的问题

- 只审阅 README 不审阅 scripts。
- 使用无 tag 的 git main 分支作为长期依赖。
- 把测试包安装到存有生产凭据的 Pi 配置目录。

## 实战案例

制作一个只含一个 SKILL.md 的本地包，先以本地路径测试，再用私有 git tag 分发给同事。

## 最佳实践

在团队中维护“允许的包来源”清单；升级包时重复安全审阅。

## 常见问题

### Package 能包含多个 skill 吗？

skills.md 说可以。

### 安装后一定自动加载全部正文吗？

不会；skill 仍按名称、描述、路径的路由机制按需加载。

## 延伸阅读

- 本站「Pi Packages 与资源配置：npm 与 Git 分发边界」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
