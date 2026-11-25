Pi 沙箱与容器化：四种边界怎么选|按官方 containerization 文档比较 Plain Docker、Docker Sandboxes、OpenShell 与 Gondolin。|packages/coding-agent/docs/containerization.md|README.md,packages/coding-agent/docs/containerization.md|security|进阶|了解容器、挂载、环境变量与网络策略。

## 适用人群与学习目标

适用人群：在真实项目中部署 Coding Agent、关注权限与可观测性的团队。

前置知识已在页面顶部列出。阅读后你应当能够：

- 用可核验的边界解释「Pi 沙箱与容器化：四种边界怎么选」在 Pi 中处于哪一层。
- 把官方说明、源码观察和教学模拟区分开。
- 在隔离环境里完成一次最小验证，并知道升级后要复核什么。

> 本文中的「官方事实」来自固定快照的上游文档；「源码观察」只描述可见导出与声明；「教学示例」不是 Pi 官方 API。升级 Pi 后请重新核验。

## 技术背景

README 明确说 Pi 不内置权限系统，默认继承启动用户与进程权限，需要更强边界时应容器化或沙箱化。containerization.md 给出四种方式：Plain Docker、Docker Sandboxes、OpenShell、Gondolin extension。
文档强调最小挂载、只读优先、限制网络目标，并避免随意挂载宿主机 ~/.pi/agent。

## 核心原理

四种方式的区别在“谁在边界内”和“凭据在哪里”。完整进程隔离时 Pi、工具、! 命令与扩展都在边界内；Gondolin 则只把部分内置工具放入微 VM，Pi 与多数扩展仍在宿主机。
因此“工具进了 VM”不等于“凭据安全”：Gondolin 的 VM 命令继承宿主机环境变量，官方文档明确说它不适合作为凭据边界。

## 流程示意

上方图表达“不可信输入 → 授权与校验 → 隔离执行 → 审计/脱敏”。选择沙箱时，要逐层确认文件系统、进程、网络、凭据和工具范围。

上方 SVG 是 PiAtlas 根据已核验职责绘制的教学示意，不代表包依赖图或官方线协议。

## 关键源码路径

- `README.md`
- `packages/coding-agent/docs/containerization.md`

这些路径都指向同一个固定 commit；它们用于定位事实，不是稳定 API 承诺。

## 核心代码解释

```json
{
  "plainDocker": { "pi": "inside", "credentials": "inside", "bestFor": "简单本地边界" },
  "dockerSandbox": { "pi": "inside", "credentials": "hostProxy", "bestFor": "避免暴露真实 Key" },
  "openShell": { "pi": "inside", "credentials": "policy", "bestFor": "策略控制与远程沙箱" },
  "gondolin": { "pi": "host", "credentials": "hostEnv", "bestFor": "只隔离内置工具" }
}
```

这是官方说明的结构化摘要，不是配置文件。具体镜像、命令与策略请按固定快照文档核验。

## 实际执行过程

1. 列出任务需要访问的最小目录与网络目标。
2. 选择四种边界之一，并写明凭据放在哪里。
3. 先只读挂载试运行，确认无越界写入。
4. 检查扩展是否绕过工具级边界。
5. 把挂载清单与网络策略纳入代码审查。

## 设计优点与局限

- 优点：官方提供多种粒度；可按凭据暴露程度选型。
- 局限：边界配置错误仍会暴露文件或凭据；工具级隔离覆盖有限。

## 容易出现的问题

- 把宿主机 ~/.pi/agent 整个挂载进容器。
- 在 Docker Sandboxes 内执行 /login。
- 以为 Gondolin 限制所有扩展工具。

## 实战案例

为一个只读代码审查任务设计沙箱：只挂载目标仓库，禁用网络，凭据通过代理注入；写出你得不到的能力清单。

## 最佳实践

默认只读、最小挂载、最小网络；高风险任务使用完整进程隔离。

## 常见问题

### 哪种最安全？

取决于边界目标；避免凭据暴露优先看 Docker Sandboxes / OpenShell，工具级隔离看 Gondolin。

### Pi 自己会限制权限吗？

不会，README 明确说不会。

## 延伸阅读

- 本站「Pi 沙箱与容器化：四种边界怎么选」所在专题的相邻文章。
- 上游固定快照的对应文档与源码入口。
- 交互式实验室中的同类本地模拟；请先阅读其“非官方协议”说明。

## 版本与核验说明

本文对应 Pi 包版本 1.6.0 与 commit `c11a73bfba1310dc4075ad836254ea87003f409b`，核验日期 2026-11-25。文末「版本与来源」给出可点击的固定快照链接；滚动更新的官方文档可能与本文不同。
