export const examples = [
 ['命令',`import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
export default function (pi: ExtensionAPI) {
  pi.registerCommand('atlas', {
    description: '显示学习站状态',
    handler: async (_args, ctx) => {
      if (ctx.hasUI) ctx.ui.notify('PiAtlas 已就绪', 'info');
    },
  });
}`],
 ['工具',`import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { Type } from 'typebox';
export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: 'count_items', label: '统计条目', description: '统计字符串数组的长度',
    parameters: Type.Object({ items: Type.Array(Type.String(), { maxItems: 20 }) }),
    async execute(_id, { items }) {
      return { content: [{ type: 'text', text: String(items.length) }], details: {} };
    },
  });
}`],
 ['事件',`import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
export default function (pi: ExtensionAPI) {
  pi.on('session_start', (_event, ctx) => {
    if (ctx.hasUI) ctx.ui.notify('会话已启动', 'info');
  });
}`],
 ['UI',`import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
export default function (pi: ExtensionAPI) {
  pi.registerCommand('atlas-status', {
    description: '显示运行模式提示',
    handler: async (_args, ctx) => {
      if (ctx.hasUI) ctx.ui.notify('状态：等待输入', 'info');
    },
  });
}`],
 ['拦截',`import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
export default function (pi: ExtensionAPI) {
  pi.on('tool_call', async (event, ctx) => {
    if (event.toolName !== 'count_items') return;
    if (!ctx.hasUI || !(await ctx.ui.confirm('批准计数？', '仅处理当前输入列表'))) {
      return { block: true, reason: '没有人工批准' };
    }
  });
}`],
 ['Sub-agent（模拟）',`// 教学模拟，不是 Pi API；不启动进程、不调用模型。
const jobs = [{ id: 'summary', text: '甲乙' }, { id: 'count', text: '甲乙丙' }];
const results = jobs.map(({ id, text }) => ({ id, chars: Array.from(text).length }));
console.log(JSON.stringify(results));`],
];
export const skill = `---
name: atlas-review
description: 在用户要求只读文档评审时，按证据清单输出意见。
---

# 只读文档评审

1. 确认用户指定的文件范围，不修改文件。
2. 逐条列出位置、观察与建议，明确未验证部分。
3. 不输出凭据或无关正文。
`;
export const toy = `// 教学模拟，可直接用 Node.js 运行。不是 Pi API。
const history = [{ role: 'user', text: '统计固定清单' }];
for (let turn = 0; turn < 2; turn++) {
  if (turn === 0) {
    history.push({ role: 'assistant', callId: 'fixed-1', tool: 'count' });
    history.push({ role: 'tool', callId: 'fixed-1', count: ['甲', '乙', '丙'].length });
  } else {
    const result = history.find(x => x.role === 'tool' && x.callId === 'fixed-1');
    history.push({ role: 'assistant', text: \`共 \${result.count} 项\` });
  }
}
console.log(history.at(-1).text);`;

