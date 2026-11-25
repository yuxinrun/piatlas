export const base = '/piatlas/';
export const origin = 'https://yuxinrun.github.io';
export const revision = 'c11a73bfba1310dc4075ad836254ea87003f409b';
export const date = '2026-11-25';
export const repo = 'https://github.com/earendil-works/pi';
export const source = path => `${repo}/blob/${revision}/${path}`;
export const groups = [
 ['getting-started','Pi 入门与使用','把 Pi 跑起来，区分人机交互与自动化入口。'],['architecture','Pi 整体架构','梳理包边界，沿启动与请求流程阅读源码。'],['pi-ai','pi-ai 模型层','理解模型目录、流式事件和 Provider 转换。'],['agent-core','Agent Core','从模型意图到工具执行，再到下一轮。'],['sessions','Session 与上下文','看懂会话树、活跃分支和压缩边界。'],['extensions','Extension 扩展开发','从最小命令开始，研究事件和信任模型。'],['skills','Skills 与资源系统','将领域流程、模板和主题作为可维护资源。'],['tui','TUI、RPC 与 SDK','理解终端渲染，以及独立进程与进程内集成。'],['security','安全、测试与可观测性','以最小权限、确定性测试和有限采集构建防线。'],['projects','Agent 实战与进阶','用离线、只读案例练习状态机与产品边界。'],
];
export const modules = [
 ['ai','pi-ai','统一多 Provider 模型接口','types.ts','AssistantMessageEvent','pi-ai',['telemetry']],
 ['agent','pi-agent-core','执行模型—工具循环，管理 Agent 状态','agent-loop.ts','agentLoop','agent-core',['ai']],
 ['coding-agent','pi-coding-agent','将会话、扩展和 CLI 界面组合成产品','core/sdk.ts','createAgentSession','architecture',['agent','ai','tui']],
 ['tui','pi-tui','差量渲染和终端输入组件','tui.ts','TUI','tui',[]],
 ['durable','pi-durable','持久化对话、任务和文档运行时','index.ts','见源码导出','sessions',['chord','ai','telemetry']],
 ['chord','chord','跨进程对象运行时：契约、文档、链接与存储','index.ts','见源码导出','architecture',['telemetry']],
 ['telemetry','pi-telemetry','与厂商无关的遥测契约及参考适配器','index.ts','见源码导出','telemetry',[]],
];
export const diagrams = [
 ['architecture','Pi 总体架构（职责分层，不表示包依赖）',['用户界面','Coding Harness','Agent Runtime','模型 / 工具']],
 ['loop','Agent Loop',['输入','模型请求','工具结果','下一轮 / 结束']],
 ['tool','工具调用',['模型意图','查找 / 校验','执行策略','结果回填']],
 ['provider','Provider Adapter',['统一模型描述','适配器路由','厂商事件','统一事件']],
 ['tree','Session Tree',['根消息','共同祖先','活跃分支','备选分支']],
 ['compaction','Context Compaction',['较早历史','摘要条目','近期原文','下一次请求']],
 ['extension','扩展生命周期',['装载工厂','注册能力','处理会话事件','关闭资源']],
 ['skills','Skills 加载',['发现目录','读取描述','按需读取正文','应用步骤']],
 ['rpc','RPC 通信',['宿主客户端','stdin 命令','子进程','stdout 响应 / 事件']],
 ['tui','TUI 渲染',['终端输入','更新状态','渲染行列表','差异写入']],
 ['security','Agent 安全边界',['不可信输入','授权与校验','隔离执行','审计 / 脱敏']],
 ['subagent','Sub-agent（教学方案）',['协调者','受限任务 A','受限任务 B','审阅与汇总']],
 ['coding','Coding Agent 工作流（教学方案）',['明确目标','只读取证','人审变更','验证输出']],
 ['monorepo','Monorepo 阅读路线（非依赖图）',['根清单','包清单','公开入口','实现与测试']],
 ['roadmap','30 天学习路线',['入门与架构','模型 / 循环 / 会话','扩展与集成','安全与项目']],
];
export const events = [
 ['用户输入',{input:'统计固定清单中的条目'},['用户：统计固定清单中的条目']],['构造上下文',{tools:['count_items'],model:'mock'},['系统：只处理预设清单','用户：统计固定清单中的条目']],['模型请求',{turn:1,provider:'fixture'},['系统指令 + 用户消息 + 工具声明']],['返回工具调用',{tool:'count_items',id:'demo-1',args:{items:['甲','乙','丙']}},['用户提示','助手工具意图 demo-1']],['工具执行',{status:'running',tool:'count_items'},['上下文未更新；执行的是本地预设事件']],['工具结果',{id:'demo-1',result:{count:3}},['用户提示','助手工具意图 demo-1','工具结果 demo-1：3']],['下一轮请求',{turn:2,toolResult:'demo-1'},['系统指令、用户消息、工具意图、工具结果']],['完成任务',{text:'清单共有 3 项',stop:'complete'},['用户提示','工具意图和结果','助手：清单共有 3 项']],
];

