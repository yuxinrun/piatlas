TUI 差量渲染：终端并不是一块简单画布|从 TUI 公开组件与差量渲染目标出发，理解行列表、状态更新与写入范围。|packages/coding-agent/docs/usage.md|README.md,packages/tui/src/tui.ts,packages/coding-agent/docs/usage.md|tui|进阶|了解终端转义序列、行缓冲区与事件循环。

## 适用人群与学习目标

适用人群：构建终端交互、RPC 服务或进程内 SDK 集成的工程师。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「TUI 差量渲染：终端并不是一块简单画布」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

README 把 pi-tui 描述为具有差量渲染的终端 UI 库。packages/tui/src/tui.ts 可见 TUI、ViewportTUI、Component、Container、TuiBase、renderChildLines、compositeTuiLine、visibleWidth 等导出。
usage.md 说明交互界面包含 transcript、编辑器、工具调用与结果、footer 状态区，并可通过 /settings 或 --tui-mode 选择 fullscreen/regular 模式。

## 核心原理

终端渲染的核心约束是“重画成本高、光标状态易错”。差量渲染把当前行列表与上一次行列表比较，只写入变化区域，从而减少闪烁与滚动问题。
组件化不等于浏览器 DOM：Component 更接近“产生一组行”的状态对象；Container 负责组合；TUI 负责输入输出与视口。

## 流程示意

上方图按“终端输入 → 更新状态 → 渲染行列表 → 差异写入”展开。差量写入发生在最后一步。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `README.md`
- `packages/tui/src/tui.ts`
- `packages/coding-agent/docs/usage.md`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```typescript
// 教学差量：只比较可见行，不模拟真实终端转义
type Frame = string[];

function diffLines(prev: Frame, next: Frame) {
  const changes: Array<{ index: number; line: string }> = [];
  for (let i = 0; i < next.length; i++) {
    if (prev[i] !== next[i]) changes.push({ index: i, line: next[i] });
  }
  return changes;
}

const before = ["状态：运行中", "工具：read"];
const after = ["状态：空闲", "工具：read"];
console.log(diffLines(before, after)); // 只更新第 0 行
```

真实 TUI 还需处理宽度、ANSI 样式、滚动视口与鼠标事件；本例只解释“差量”思想。

## 实际执行过程

1. 启动 TUI，观察工具输出展开时是否只刷新局部。
2. 用 Ctrl+O 折叠工具输出，比较行列表变化。
3. 用 /debug 收集渲染诊断信息，注意脱敏。
4. 在自己的组件里保持 render 输出稳定顺序。

## 设计优点与局限

- 优点：降低闪烁；适合长 transcript；组件边界清楚。
- 局限：实现复杂度高；宽字符与 ANSI 会带来边界问题。

## 容易出现的问题

- 每次状态变化都清空全屏。
- 把 Unicode 宽度当 char 数。
- 在非 TUI 模式调用完整 UI 能力。

## 实战案例

用两个字符串数组模拟帧更新，写 diff 函数只输出变化行；再改变一行中的中文，观察按字符切分的问题。

## 最佳实践

渲染函数保持纯粹；差量结果可打印；UI 能力用 ctx.hasUI 探测。

## 常见问题

### 全屏模式一定更好吗？

不一定；usage.md 说明可切换到 regular 模式使用终端 scrollback。

### TUI 与 Agent 在同一包吗？

不是；pi-tui 是独立包，coding-agent 直接依赖它。

## 延伸阅读

- 本站「TUI 差量渲染：终端并不是一块简单画布」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
