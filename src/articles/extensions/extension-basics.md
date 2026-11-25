Extension 开发入门：最小命令、工具与加载方式|从默认导出工厂到 pi -e /reload，建立可重复的扩展开发循环。|packages/coding-agent/docs/extensions.md|packages/coding-agent/docs/extensions.md,packages/coding-agent/src/core/sdk.ts|extension|入门|会写 TypeScript 模块，知道 npm 包导入的基本概念。

## 适用人群与学习目标

适用人群：想给 Pi 增加命令、工具或 UI 的扩展作者。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「Extension 开发入门：最小命令、工具与加载方式」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

extensions.md 明确说明 Extension 是加载到 Pi 进程中的 TypeScript 模块，工厂函数形态为默认导出的同步或异步函数。工厂可以注册工具、命令、快捷键、provider、事件处理器、renderers 与终端 UI。
自动发现位置包括全局 ~/.pi/agent/extensions 与项目 .pi/extensions；项目本地扩展仅在项目被信任后加载；pi -e ./path.ts 适合快速测试；自动发现的扩展可 /reload 热重载。

## 核心原理

Extension 的边界是“注册能力”，不是“替模型思考”。命令由用户触发，不等价于模型可调用工具；工具需要参数 schema 与 execute；事件处理器观察或转换会话流程。
因为扩展在 Pi 进程内运行，它拥有与 Pi 相同的系统权限。写扩展前先确定它是否需要读文件、执行命令或访问网络。

## 流程示意

上方图展示“装载工厂 → 注册能力 → 处理会话事件 → 关闭资源”。最简单的扩展也可以只完成前两步。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `packages/coding-agent/docs/extensions.md`
- `packages/coding-agent/src/core/sdk.ts`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```typescript
// 最小命令扩展：API 名称来自固定快照文档
export default function (pi: ExtensionAPI) {
  pi.registerCommand("hello-atlas", {
    description: "输出 PiAtlas 教学标记",
    handler: async (_args, ctx) => {
      ctx.ui?.notify("PiAtlas extension loaded");
    }
  });
}
```

这是最小教学扩展；参数细节按当前版本 ExtensionAPI 类型补全。命令不会自动成为模型工具。

## 实际执行过程

1. 在隔离目录新建 example.ts，写入最小扩展。
2. 用 pi -e ./example.ts 启动，输入 /hello-atlas 验证。
3. 把文件移动到 .pi/extensions，确认项目信任后再用 /reload。
4. 为扩展添加关闭清理，确保重复加载不会重复注册。

## 设计优点与局限

- 优点：入口简单；命令、工具、事件共享同一注册模型。
- 局限：进程内权限大；热重载需要谨慎处理状态与资源。

## 容易出现的问题

- 把 slash 命令当成模型工具。
- 在全局目录放未审阅的扩展。
- 假设 -e 加载的扩展也会自动热重载。

## 实战案例

写一个“统计当前目录 md 文件数”的命令扩展，只使用只读 API；记录它不会被模型自动调用的原因。

## 最佳实践

先写最小命令，再加工具；每个注册能力都配一个卸载或幂等检查。

## 常见问题

### -e 适合生产吗？

文档说它适合快速测试；自动发现的扩展才支持 /reload。

### 扩展能否访问网络？

可以，因为它在 Pi 进程内；这正是需要审阅与隔离的原因。

## 延伸阅读

- 本站「Extension 开发入门：最小命令、工具与加载方式」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
