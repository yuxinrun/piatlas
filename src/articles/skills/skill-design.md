如何设计一个专业 Agent Skill：触发、证据与可维护性|用 description 路由、相对路径引用、脚本边界和审阅清单设计长期可用的 Skill。|packages/coding-agent/docs/skills.md|packages/coding-agent/docs/skills.md,packages/coding-agent/docs/containerization.md|skills|进阶|已写过至少一个 SKILL.md 或领域提示词。

## 适用人群与学习目标

适用人群：设计领域工作流、提示词资源和可分发 Agent 包的开发者。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「如何设计一个专业 Agent Skill：触发、证据与可维护性」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

skills.md 建议目录形式：SKILL.md 加 scripts/、references/、assets/；引用附属文件使用相对路径。description 最多 1024 字符，名称最多 64 字符；格式错误或没有描述不会被加载。
文档还强调项目 skill 可指示模型运行脚本或修改文件，应审查不熟悉的 skill 及附属文件。

## 核心原理

好 Skill 有三个特征：可被准确触发、步骤可执行、边界可审计。触发靠 description；可执行靠清晰步骤与相对路径；可审计靠最小权限和脚本审阅。
不要把 Skill 当作权限系统。若工作流涉及 shell 或网络，应把它放进沙箱，而不是靠“skill 里写了不要乱来”。

## 流程示意

上方图中“读取描述 → 按需读取正文 → 应用步骤”对应 Skill 的全部运行路径。脚本属于正文之后的可选动作。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `packages/coding-agent/docs/skills.md`
- `packages/coding-agent/docs/containerization.md`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```markdown
---
name: offline-review
description: Review a fixed set of notes without modifying files. Use when asked to verify claims or summarize evidence.
allowed-tools: read,grep
---

# Offline review

1. Read references/checklist.md.
2. Collect evidence for each claim.
3. Report claim / evidence / unknown separately.
4. Do not run scripts or modify files.
```

allowed-tools 在官方文档中标注为实验性字段；使用前请核验当前版本支持情况。示例仍以“不执行脚本”为安全默认。

## 实际执行过程

1. 先写一句话 description，包含做什么和何时用。
2. 把详细步骤写进正文，附相对路径引用。
3. 为脚本建立单独审阅清单。
4. 用相近但不相关的任务测试是否会误触发。
5. 用 /reload 验证修改。

## 设计优点与局限

- 优点：领域知识可沉淀；触发成本低；易于团队共享。
- 局限：描述质量决定命运；脚本与资源扩大信任面。

## 容易出现的问题

- description 写成营销语。
- SKILL.md 里引用外部 URL 图片。
- 把敏感数据放进 assets 后分发。

## 实战案例

设计一个“只读架构评审”Skill：输出结论、证据、未知三项；在末尾声明不涉及写入与网络。

## 最佳实践

默认只读；脚本明示；引用本地资源；定期复核 description 的触发准确率。

## 常见问题

### 名称必须等于目录名吗？

Pi 不强制，但官方建议与其他实现保持一致。

### 能禁止模型自动调用吗？

可以设置 disable-model-invocation: true。

## 延伸阅读

- 本站「如何设计一个专业 Agent Skill：触发、证据与可维护性」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
