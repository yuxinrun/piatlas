工具调用审批：在没有内置权限系统的 Pi 上设计门控|用 tool_call 拦截、user_bash 与 UI 确认构建可审计的审批策略。|packages/coding-agent/docs/extensions.md|README.md,packages/coding-agent/docs/extensions.md,packages/coding-agent/docs/containerization.md|security|进阶|理解同步/异步钩子与用户确认交互。

## 适用人群与学习目标

适用人群：想给 Pi 增加命令、工具或 UI 的扩展作者。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「工具调用审批：在没有内置权限系统的 Pi 上设计门控」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

README 明确说明 Pi 不内置限制文件系统、进程、网络或凭据访问的权限系统。extensions.md 则提供 tool_call 拦截：可修改 event.input，或返回 block/reason/terminate。
user_bash 可拦截 ! / !! 命令；ctx.ui.confirm/select 提供交互确认；ctx.hasUI 与 ctx.mode 用于判断是否可用 UI。

## 核心原理

审批是宿主策略，不是模型能力。无 UI 环境必须采用默认拒绝或白名单，不能静默放行。
门控应发生在执行前；执行后只能观察或脱敏。对写文件、执行 shell、网络请求等高风险操作，审批策略应能区分“允许、拒绝、需要确认”。

## 流程示意

上方安全边界图展示“不可信输入 → 授权与校验 → 隔离执行 → 审计/脱敏”。审批位于第二格。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `README.md`
- `packages/coding-agent/docs/extensions.md`
- `packages/coding-agent/docs/containerization.md`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```typescript
// 教学门控：返回形状来自 tool_call 文档说明
export default function (pi: ExtensionAPI) {
  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName !== "bash") return;
    const command = String((event.input as { command?: unknown })?.command ?? "");

    if (/\b(rm|format|shutdown)\b/i.test(command)) {
      return { block: true, reason: "命令命中教学黑名单", terminate: false };
    }

    if (ctx.hasUI) {
      const ok = await ctx.ui.confirm("执行命令？", command);
      if (!ok) return { block: true, reason: "用户拒绝" };
    } else {
      return { block: true, reason: "无 UI 环境默认拒绝" };
    }
  });
}
```

这是教学黑名单，不是完整安全方案；真实策略应结合沙箱、白名单、工作目录与审计。

## 实际执行过程

1. 列出需要审批的工具：bash、write、edit、网络相关扩展工具。
2. 先实现无 UI 默认拒绝，确保 CI 不静默放行。
3. 再为 TUI 增加确认提示。
4. 记录每次拒绝原因，不记录敏感命令正文。

## 设计优点与局限

- 优点：门控点靠近执行；可与 UI 和沙箱叠加。
- 局限：黑名单容易绕过；扩展自身也在进程内，可能绕过你的门控。

## 容易出现的问题

- 只在提示词里写“不要执行危险命令”。
- 无 UI 时默认允许。
- 把 tool_result 过滤当审批。

## 实战案例

设计三条命令：只读、写入、危险；分别验证允许、确认后允许、拒绝三条路径。

## 最佳实践

默认拒绝优先；审批理由可解释；与容器边界组合使用。

## 常见问题

### Pi 自带审批系统吗？

README 明确说不内置这类权限系统。

### 拦截后还有 tool_result 吗？

extensions.md 说被阻止的调用会跳过执行和 tool_result。

## 延伸阅读

- 本站「工具调用审批：在没有内置权限系统的 Pi 上设计门控」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
