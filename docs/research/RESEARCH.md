# PiAtlas 上游研究笔记

- 研究对象：`https://github.com/earendil-works/pi`
- 官方文档：`https://docs.pi.dev/`
- 固定快照 commit：`c11a73bfba1310dc4075ad836254ea87003f409b`
- 包版本：七个研究对象在快照中的版本为 `1.6.0`；这不是“永远最新”的承诺。
- 核验日期：2026-11-25
- 核验方式：逐文件读取上述 commit 的 GitHub raw 内容；未执行上游代码，也未把滚动更新的文档当作固定事实。

## 一、事实分层

本网站文章把结论分为四类，写作时必须显式区分：

1. **官方事实**：README 或 `packages/coding-agent/docs/` 中明确写出的内容。
2. **源码观察**：固定 commit 中可见的类型、导出名、依赖声明和目录结构。
3. **工程分析**：PiAtlas 作者基于上述事实做出的架构解释，不冒称官方意图。
4. **教学模拟**：本地 SVG、交互实验室和最小 Agent 示例；它们不是 Pi 的真实线协议或官方 API。

## 二、已核验的官方事实

### 2.1 定位与边界（README.md）

- 官方定位：“minimal, extensible agent harness”；强调让工作流适配用户，而不是相反。
- 支持扩展、Skills、prompt templates、themes；可打包为 Pi packages，通过 npm 或 git 分发。
- 官方明确说明 Pi **不内置**限制文件系统、进程、网络或凭据访问的权限系统；默认继承启动用户与进程的权限，需要更强边界时应容器化或沙箱化。
- Pi 默认精简：官方 README 明确说“不内置 sub-agents 与 plan mode”，因此本站相关章节必须标注为“自行设计/扩展方案”。
- 使用入口包括交互式、print、JSON、RPC、TypeScript SDK。
- Node.js 要求：`>=22.19.0`。
- 官方安装命令：Unix/macOS/Linux 使用 `curl -fsSL https://pi.dev/install.sh | sh`；Windows 使用 powershell 安装脚本；npm 方式为 `npm install -g --ignore-scripts @earendil-works/pi-coding-agent`。
- 供应链声明：直接外部依赖固定版本；`package-lock.json` 是依赖真实来源；安装脚本使用锁定安装。

### 2.2 工作机制（how-pi-works.md）

- Pi 协调模型请求、工具执行、上下文组装与会话存储。
- 会话中的消息与事件构成一棵树；每条路径是一个分支；以当前条目结尾的路径是活动分支。
- 活动分支提供下一次模型请求的历史记录。
- 持久化会话是 JSONL；每个条目有 ID 并指向父条目。
- 从较早条目继续会在同一文件中创建新分支；fork/clone 会复制到新会话文件。
- 一次 turn 的顺序：用户消息进入活动分支；Pi 根据系统提示、活动分支、工具和模型设置构造请求；provider 流式返回文本与工具调用；Pi 记录 assistant 响应、执行工具并记录结果。若工具结果或排队消息需要继续，则开启下一轮。
- steering message 在当前 assistant turn 后进入；follow-up message 在 agent 完成待处理工作后进入；abort 停止当前运行并把排队消息返回编辑器。
- 系统提示基于基础指令和发现的 context files；请求携带工具定义和 skill 描述，完整 skill 指令按需加载；扩展可注入指令或转换上下文。
- compaction 插入摘要条目，该条目在后续请求中替换较旧消息；原始条目仍留在会话树中。
- 所有接口（interactive / print / JSON / RPC / SDK）使用相同的 agent 和 session 机制。

### 2.3 扩展（extensions.md）

- Extension 是加载到 Pi 进程中的 TypeScript 模块，工厂函数形态为 `export default function (pi: ExtensionAPI) {}` 或异步版本。
- 自动发现位置：全局 `~/.pi/agent/extensions/...`、项目 `.pi/extensions/...`；项目本地扩展仅在项目被信任后加载；`pi -e ./path.ts` 仅适合快速测试；自动发现的扩展可用 `/reload` 热重载。
- 真实 API 名称包括：`ExtensionAPI`、`ExtensionContext`、`ExtensionCommandContext`、`ExtensionToolContext`、`SessionManager`、`pi.on()`、`pi.registerTool()`、`pi.registerCommand()`、`pi.registerShortcut()`、`pi.registerProvider()`、`pi.registerVirtualModel()`、`pi.registerMcpServer()`、`pi.registerMessageRenderer()`、`pi.registerEntryRenderer()`、`pi.registerToolRenderer()`、`pi.registerMarkdownTransformer()`、`pi.appendEntry()`、`pi.sendMessage()`、`pi.exec()` 等。
- 生命周期包含 `project_trust`、`session_start`、`resources_discover`、`before_agent_start`、`agent_start`、`turn_start`、`tool_execution_start`、`tool_call`、`tool_execution_update`、`tool_result`、`tool_execution_end`、`turn_end`、`agent_end`、`agent_before_settle`、`agent_settled`、`session_shutdown` 等。
- `agent_end` 不是最终空闲信号；`agent_settled` 才表示 Pi 不会自动继续运行。
- `tool_call` 发生在工具真正执行前，可修改 `event.input` 或返回 `{ block: true, reason, terminate }`；`tool_result` 可修改结果；`tool_execution_end` 是观察最终工具结果的可靠事件。
- `ctx.ui` 可用 `notify`、`confirm`、`select`、`input`、`editor`、`custom`、`setStatus`、`setWidget` 等；完整 TUI 能力以 `ctx.mode === "tui"` 为前提。

### 2.4 Skills（skills.md）

- Skill 是包含 `SKILL.md` 的目录，可带 `scripts/`、`references/`、`assets/`；引用附属文件使用相对 skill 目录的路径。
- frontmatter 关键字段：`name`、`description`、`license`、`compatibility`、`metadata`、`allowed-tools`、`disable-model-invocation`。
- 名称只允许小写字母、数字、连字符，最多 64 字符；description 最多 1024 字符；缺少 description 或格式错误的 skill 不会被加载。
- 启动时只把每个 skill 的名称、描述和路径加入 system prompt；任务匹配时才读取完整 instructions。
- `/skill:name` 可强制加载；`disable-model-invocation: true` 会禁止模型自动选择；`/reload` 可在编辑后重载。
- 发现位置包括用户 skills、项目 skills、`~/.agents/skills/`、`.agents/skills/`；项目 `.agents/skills/` 会向上查找至仓库根目录。

### 2.5 SDK（sdk.md）

- SDK 定位是 Node.js / Bun 进程内嵌入；跨语言或隔离子进程场景应使用 CLI Integration。
- 真实 API：`createAgentSession()`、`AgentSession`、`session.prompt()`、`session.steer()`、`session.followUp()`、`session.abort()`、`session.waitForIdle()`、`session.subscribe()`、`session.dispose()`、`session.getLastAssistantText()`、`session.getActiveToolNames()`、`session.bindExtensions()`、`SessionManager.inMemory()`、`AgentSessionRuntime` 等。
- `dispose()` 会中止工作、使 extension contexts 失效、断开 agent 并移除监听；应放在 `finally` 中。
- streaming 期间直接再次 `prompt()` 会 reject；应明确使用 `steer()` 或 `followUp()`，返回值为 `"queued"` 或 `"handled"`。
- 默认 SDK session 不会加载 CLI 的 codemode、tool_search、MCP 内置扩展，需要显式加入；MCP extension 在 `session_start` 连接 servers，因此需要 `session.bindExtensions()`。
- `agent_end` 不等于整个流程结束；`agent_settled` 才表示不会再自动继续。

### 2.6 终端使用（usage.md）

- 主入口是 `pi`；`pi --continue` 恢复同一目录最近会话；`--tui-mode` 选择 TUI 模式。
- 交互输入：`Enter` 发送、`Shift+Enter` 换行、`Ctrl+G` 外部编辑、`@` 搜索文件、`Tab` 补全路径。
- 运行中执行中输入会在当前响应和工具结束后影响下一步；`Alt+Enter` 排队 follow-up；`Alt+Up` 取回排队消息；`Escape` 停止。
- 常用命令：`/model`、`/thinking`、`/login`、`/logout`、`/settings`、`/new`、`/resume`、`/name`、`/session`、`/tree`、`/fork`、`/clone`、`/compact`、`/copy`、`/export`、`/share`、`/hotkeys`、`/debug`。
- `!命令` 输出会加入对话；`!!命令` 输出不会发给模型。
- 本页未确认具体 print/JSON CLI flags，因此本站不在教程里杜撰 flags。

### 2.7 容器化（containerization.md）

- 官方列出四种边界：Plain Docker、Docker Sandboxes、OpenShell、Gondolin extension。
- Plain Docker：Pi 与扩展都在容器内，凭据作为环境变量进入容器，可用命名卷保存容器本地配置。
- Docker Sandboxes：真实凭据留在宿主机，由代理替换占位符；不要在沙箱内 `/login`。
- OpenShell：对文件系统、进程、网络、凭据、推理路由有策略控制。
- Gondolin：Pi 在宿主机，内置工具与 `!` 命令进入本地 Linux 微 VM；VM 内命令继承宿主机环境变量，不适合作为凭据边界。
- 通用建议：最小挂载、只读优先、限制网络目标、避免挂载宿主机 `~/.pi/agent`。

## 三、已核验的源码观察

### 3.1 包清单与直接依赖

根 `package.json`：包名 `pi-monorepo`，版本 `0.0.3`，Node `>=22.19.0`，workspaces 包含 `packages/*`、`apps/*` 及若干 examples。

七个对象的直接依赖（仅统计这七个包之间）：

| 包 | 图内直接依赖 |
|---|---|
| `pi-ai` | `pi-telemetry` |
| `pi-agent-core` | `pi-ai` |
| `pi-coding-agent` | `pi-agent-core`、`pi-ai`、`pi-tui` |
| `pi-tui` | 无 |
| `pi-durable` | `chord`、`pi-ai`、`pi-telemetry` |
| `chord` | `pi-telemetry` |
| `pi-telemetry` | 无 |

**重要边界**：这不是完整依赖图，也不表示运行时调用关系；不能据此把 durable 或 chord 说成 CLI 的直接依赖。

### 3.2 关键公开入口

- `packages/coding-agent/src/index.ts` 存在；公开导出包括 `parseArgs`、`AgentSession`、`compact`、`shouldCompact`、`generateSummary`、`estimateTokens`、`ExtensionAPI`、`ExtensionRunner`、`defineTool`、`SessionManager`、`SettingsManager`、`loadSkills`、`createAgentSession`、`AgentSessionRuntime`、`createReadOnlyTools`、`createCodingTools`、`runPrintMode`、`runRpcMode`、`RpcClient` 等。
- `packages/coding-agent/src/core/sdk.ts` 存在；公开导出包括 `createAgentSession`、`createCodingTools`、`createReadOnlyTools`、`createReadTool`、`createBashTool`、`createEditTool`、`createWriteTool`、`createGrepTool`、`createFindTool`、`createLsTool`、`createPowerShellTool`、`withFileMutationQueue` 等。
- `packages/agent/src/types.ts` 存在；可见真实类型/名称包括 `StreamFn`、`ToolExecutionMode = "sequential" | "parallel"`、`QueueMode = "all" | "one-at-a-time"`、`AgentTurnDecision`、`AgentState`、`AgentTool`、`AgentToolResult`、`BeforeToolCallResult`、`AfterToolCallResult`、`AgentEvent`、`AgentLoopConfig` 等。
- `packages/agent/src/agent-loop.ts` 存在；导出 `agentLoop`、`agentLoopContinue`、`runAgentLoop`、`runAgentLoopContinue`、`runToolCall` 等。
- `packages/ai/src/types.ts` 存在；可见 `AssistantMessageEvent`、`TextContent`、`ThinkingContent`、`ToolCall`、`ToolResultMessage`、`Message`、`Context`、`Model`、`BaseModel`、`Tool`、`KnownApi` 等；流式事件包含 `start`、`text_start`、`text_delta`、`text_end`、`thinking_*`、`toolcall_start`、`toolcall_delta`、`toolcall_end`、`done`、`error`。
- `packages/tui/src/tui.ts` 存在；导出 `TUI`、`ViewportTUI`、`Component`、`Container`、`TuiBase`、`dispatchMouseEvent`、`visibleWidth` 等。
- `packages/durable/src/index.ts` 存在；导出 `Harness`、`ConversationTranscript`、`CompactionTask`、`GenerationTask`、`ToolTask`、`createSession`、`defineDoc`、`defineTask`、`defineTool` 等。
- `packages/chord/src/index.ts` 存在；导出 `ChordStore`、`applyBatch`、`loadDocument`、`writeContent`、`CHORD_TELEMETRY_SCHEMA` 等。
- `packages/telemetry/src/index.ts` 存在；导出 `createTypedMetrics`、`defineTelemetrySchema`、`NOOP_TELEMETRY_CONTEXT`、`InMemoryTelemetryContext`、`telemetryNow` 等。

## 四、待核验或必须谨慎表达的内容

- print/JSON 的具体 CLI flags 未从 `usage.md` 取得；文章只描述模式语义，不编造参数。
- compaction 的摘要算法、阈值和切点策略未从文档中确认；本站实验室明确标注为“模拟”。
- 项目信任的具体判定规则未在已读文档中展开；只写“先解析信任状态，再加载项目资源”。
- sub-agent、plan mode 不是 Pi 官方内置能力；文章中必须写作“扩展/宿主自实现方案”。
- 其他 Coding Agent 与框架的比较是滚动文档，本站只写结构性差异，不做无依据的性能或优劣评价，并标注需要按版本复核。

## 五、首篇文章地图（45 篇）

- `getting-started`：what-is-pi、install-pi、credentials、cli-modes、first-run
- `architecture`：monorepo、startup、runtime-boundaries、package-map、source-reading
- `pi-ai`：provider-adapters、streaming、model-catalog、tool-calling-protocol、custom-provider
- `agent-core`：agent-loop、tool-schema、tool-errors、agent-lifecycle
- `sessions`：session-tree、session-jsonl、compaction、token-budget、branch-switch
- `extensions`：extension-basics、extension-events、approval、custom-tools
- `skills`：skill-loading、packages、prompt-templates、skill-design
- `tui`：tui-rendering、rpc、sdk、json-stream、terminal-interaction
- `security`：sandbox、mock-llm、telemetry、api-keys
- `projects`：toy-loop、subagent、review-agent、file-agent

每篇文章首行元数据格式：`标题|摘要|官方文档 stem|源码路径逗号列表|SVG ID|难度|前置知识`。所有文章都指向固定 commit，并在文末显示核验日期。
