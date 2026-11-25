自定义 Provider：在扩展边界内接入自有模型服务|基于已核验的注册 API 与导入名，设计可审计的自定义 Provider 方案。|packages/coding-agent/docs/extensions.md|packages/coding-agent/docs/extensions.md,packages/ai/src/types.ts,packages/ai/package.json|provider|高级|熟悉 TypeScript 模块导入、Provider 基本协议与最小权限原则。

## 适用人群与学习目标

适用人群：需要接入多模型 Provider 的后端工程师、关心流式协议与兼容性的开发者。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「自定义 Provider：在扩展边界内接入自有模型服务」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

extensions.md 明确列出可导入的 pi-ai 能力，包括 StringEnum、getCurrentSystemMessage、createProvider、openAICompletionsApi；同时列出 pi.registerProvider、pi.unregisterProvider、pi.registerVirtualModel 等 ExtensionAPI 方法。
types.ts 可见 Model、Api、StreamFunction、AssistantMessageEventStream 等类型。这给出“自定义 Provider 必须产出统一事件”的方向。

## 核心原理

自定义 Provider 的边界是：把自有服务翻译成 pi-ai 的统一事件，而不是让上层 Agent 理解你的私有协议。若服务兼容 OpenAI Completions，可优先复用 openAICompletionsApi；否则需要自行实现事件映射。
注册发生在扩展加载阶段；项目本地扩展只有在项目被信任后才加载。因此 Provider 代码本身也属于信任边界的一部分。

## 流程示意

上方图显示“统一模型描述 → 适配器路由 → 厂商事件 → 统一事件”。自定义 Provider 就是补上中间两格。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `packages/coding-agent/docs/extensions.md`
- `packages/ai/src/types.ts`
- `packages/ai/package.json`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```typescript
// 名称来自固定缓存文档；以下为不可直接运行的参数骨架
import {
  createProvider,
  openAICompletionsApi
} from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  // 1. 用 createProvider 组织 stream / model 解析
  // 2. 若协议兼容，复用 openAICompletionsApi
  // 3. 参数形状必须按当前版本类型系统补全
  pi.registerProvider(/* name, provider */);
}
```

本文不编造 createProvider 的完整参数；请把骨架当作“待按类型补全”的设计草图，而不是可复制的生产代码。

## 实际执行过程

1. 确认自有服务是否兼容某个已知 api。
2. 把服务响应映射到 start/text_delta/toolcall_end/done/error。
3. 在隔离目录用 pi -e 加载最小扩展测试。
4. 检查 unregisterProvider 是否有对应的清理路径。
5. 把私有可能产生的字段放在 details，不塞进标准事件。

## 设计优点与局限

- 优点：可复用 Agent 层全部能力；注册与卸载边界清晰。
- 局限：事件映射工作量大；错误语义与能力差异需要自己维护。

## 容易出现的问题

- 把未核验的参数骨架直接用于生产。
- 在 Provider 中读取额外凭据却未纳入隔离策略。
- 只实现文本流，不支持工具调用却声明支持。

## 实战案例

先做一个只读、无工具、无凭据的本地 mock provider；目标是输出稳定事件序列，而不是追求模型能力。

## 最佳实践

为每种事件写 fixture 测试；把 baseUrl 与凭据放在宿主配置；扩展只负责协议转换。

## 常见问题

### 必须写新 Provider 吗？

若服务兼容已知 api，优先复用现有适配器。

### 自定义 Provider 能绕过权限边界吗？

不能。扩展仍在 Pi 进程内运行，必须按同一信任模型处理。

## 延伸阅读

- 本站「自定义 Provider：在扩展边界内接入自有模型服务」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
