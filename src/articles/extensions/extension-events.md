Extension 生命周期事件：从 trust 到 settled|按官方事件序列组织扩展代码，区分通知、修改、门控与最终覆盖。|packages/coding-agent/docs/extensions.md|packages/coding-agent/docs/extensions.md,packages/coding-agent/src/index.ts|extension|进阶|了解事件驱动编程与异步处理器。

## 适用人群与学习目标

适用人群：想给 Pi 增加命令、工具或 UI 的扩展作者。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「Extension 生命周期事件：从 trust 到 settled」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

extensions.md 列出四类启动/会话事件：project_trust、session_start、resources_discover、session_shutdown；运行类事件包括 before_agent_start、agent_start、turn_start、turn_end、agent_end、agent_before_settle、agent_settled。
文档还说明事件处理器按扩展加载顺序、再按注册顺序执行；部分事件支持原地修改、链式转换、门控取消或最终覆盖。

## 核心原理

事件不是同一种能力。通知型事件只观察；可修改事件能改变输入或结果；门控事件可以阻止动作；最终覆盖事件会改变最终值。写扩展前先确认你订阅的是哪一类。
资源初始化应放在 session_start 之后；昂贵或需释放的对象应在 session_shutdown 清理。异步工厂会在 session_start 前 await，适合轻量准备。

## 流程示意

上方图给出生命周期四段：装载、注册、处理、关闭。把它与事件名清单叠在一起，就能得到扩展的生命周期视图。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `packages/coding-agent/docs/extensions.md`
- `packages/coding-agent/src/index.ts`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```typescript
// 教学订阅：事件名来自固定快照文档
export default function (pi: ExtensionAPI) {
  pi.on("session_start", async () => {
    // 只在这里读取会话相关状态
  });

  pi.on("tool_execution_end", async (event) => {
    if (event.isError) {
      // 记录失败，不修改结果
    }
  });

  pi.on("agent_settled", async () => {
    // 真正空闲后再做集成层通知
  });
}
```

示例只展示事件名与处理意图；不同事件的 payload 与返回约定需查当前版本类型。

## 实际执行过程

1. 按“启动 / 运行 / 工具 / 会话”四组给事件分类。
2. 为每类事件写一个只打印类型的处理器。
3. 启动一次含工具调用的任务，观察顺序。
4. 把清理逻辑放到 session_shutdown 并验证重复执行安全。

## 设计优点与局限

- 优点：事件覆盖完整；能在多个层次介入而不改核心。
- 局限：处理器顺序会影响结果；修改型事件需非常谨慎。

## 容易出现的问题

- 在 agent_end 时释放仍被排队任务使用的资源。
- 对通知型事件返回修改对象。
- 忽略扩展加载顺序导致输出不确定。

## 实战案例

写一个只观察的扩展，把事件序列保存到本地 JSONL；再用它检查本文的顺序描述。

## 最佳实践

观察型扩展先上线；确认稳定后再加入修改型逻辑。

## 常见问题

### 哪个事件代表最终空闲？

agent_settled。

### 工具失败看哪个事件？

tool_execution_end 是观察最终结果的可靠事件。

## 延伸阅读

- 本站「Extension 生命周期事件：从 trust 到 settled」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
