import { mkdirSync, rmSync, writeFileSync, readFileSync, globSync } from 'node:fs';
import { dirname, basename } from 'node:path';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import ts from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import { base, origin, repo, groups, modules, diagrams, events, source, revision, date } from '../src/data/catalog.mjs';
import { days } from '../src/data/roadmap.mjs';
import { examples, skill, toy } from '../src/data/examples.mjs';
const dir = '.generated';
rmSync(dir, { recursive:true, force:true });
const write = (path, content) => { const file = `${dir}/${path}`; mkdirSync(dirname(file), {recursive:true}); writeFileSync(file,content); };
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url = path => base + path;
const art = slug => url(`articles/${slug}/`);
const a = (path,text) => `<a href="${url(path)}">${escape(text)}</a>`;
const ext = (path,text) => `<a href="${escape(path)}">${escape(text)}</a>`;
const cta = (path,text,kind='') => `<a class="button ${kind}" href="${url(path)}">${escape(text)} <span aria-hidden="true">↗</span></a>`;
for (const [name,grammar] of [['bash',bash],['typescript',ts],['json',json]]) hljs.registerLanguage(name,grammar);
const md = new MarkdownIt({highlight: (code, lang) => hljs.getLanguage(lang) ? hljs.highlight(code,{language:lang}).value : escape(code)});
const fence = md.renderer.rules.fence;
md.renderer.rules.fence = (...args) => `<div class="code-frame"><button type="button" data-copy>复制代码</button>${fence(...args)}</div>`;
const headings = [];
md.core.ruler.push('piatlas', state => {
  const used = new Map();
  for (let i=0;i<state.tokens.length;i++) {
    const token = state.tokens[i];
    if (token.type === 'heading_open') {
      const title = state.tokens[i+1].content;
      const prefix = title.toLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu,'-').replace(/^-|-$/g,'') || 'section';
      const n = (used.get(prefix) || 0) + 1; used.set(prefix,n);
      const id = n === 1 ? prefix : `${prefix}-${n}`;
      token.attrSet('id',id); headings.push({id,title,level:token.tag});
    }
    if (token.type === 'blockquote_open') {
      const text = state.tokens[i+2]?.content || '';
      if (/^\[!WARNING\]/.test(text)) token.attrSet('class','warning');
    }
    for (const child of token.children || []) {
      if (child.type === 'image') child.attrSet('loading','lazy');
      for (const attr of ['src','href']) {
        const value = child.attrGet(attr);
        if (value?.startsWith('@site/')) child.attrSet(attr,url(value.slice(6)));
      }
    }
  }
});
const articles = globSync('src/articles/*/*.md').map(file => {
  let [line, ...rest] = readFileSync(file,'utf8').split(/\r?\n/);
  const [title, summary, doc, paths, diagram, difficulty='进阶', prerequisites='能阅读 TypeScript 与 JSON'] = line.split('|');
  if (!title || !summary || !doc || !paths || !diagram) throw Error(`缺少元数据：${file}`);
  return {slug:basename(file,'.md'), group:file.split(/[\\/]/)[2], title, summary, doc, paths:paths.split(','), diagram, difficulty, prerequisites, body:rest.join('\n').trim()};
}).sort((x,y) => groups.findIndex(g=>g[0]===x.group)-groups.findIndex(g=>g[0]===y.group) || (Math.max(0,days.findIndex(d=>d[1]===x.slug)+1)||99)-(Math.max(0,days.findIndex(d=>d[1]===y.slug)+1)||99) || x.slug.localeCompare(y.slug));
const bySlug = Object.fromEntries(articles.map(x=>[x.slug,x]));
if (Object.keys(bySlug).length !== articles.length) throw Error('文章 slug 重复');
const nav = [['','首页'],['getting-started/','Pi 入门'],['architecture/','架构解析'],['agent-core/','Agent Core'],['extensions/','Extensions'],['projects/','实战教程'],['resources/','资源中心'],['search/','⌕ 搜索']];
const brand = `<a class="brand" href="${base}"><img src="${url('favicon.svg')}" width="33" height="33" alt="">PI<span>ATLAS</span></a>`;
const groupLinks = groups.map(([id,title]) => a(`${id}/`,title)).join('');
const footer = `<footer><div class="wrap footer"><div>${brand}<p>Understand. Build. Extend. Engineer.</p></div><div>${a('about/','关于 PiAtlas')}${a('roadmap/','30 天学习路线')}${a('source-map/','源码地图')}</div><div>${ext('https://docs.pi.dev/','Pi 官方文档 ↗')}${ext(repo,'Pi 源码 ↗')}${ext('https://github.com/yuxinrun/piatlas','本站仓库 ↗')}</div></div></footer>`;
const routes = [];
function page(path,title,desc,body,{kind='',crumb='',article=null}={}) {
  if (path !== '404.html') routes.push(path);
  const canonical = `${origin}${url(path)}`;
  const schema = { '@context':'https://schema.org', '@graph': [
    {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'首页',item:origin+base},...(crumb?[{'@type':'ListItem',position:2,name:crumb,item:canonical}]:[]),...(article?[{'@type':'ListItem',position:3,name:title,item:canonical}]:[])]},
    ...(article?[{'@type':'TechArticle',headline:title,description:desc,inLanguage:'zh-CN',dateModified:date,mainEntityOfPage:canonical,author:{'@type':'Organization',name:'PiAtlas'}}]:[]),
  ]};
  if (article) schema['@graph'][0].itemListElement[1].item = `${origin}${url(article.group+'/')}`;
  const full = title === '首页' ? 'PiAtlas - AI Agent 深度技术学院' : `${title} | PiAtlas`;
  write(path.endsWith('.html') ? path : path+'index.html', `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escape(desc)}"><title>${escape(full)}</title><link rel="canonical" href="${canonical}"><meta property="og:type" content="${article?'article':'website'}"><meta property="og:title" content="${escape(full)}"><meta property="og:description" content="${escape(desc)}"><meta property="og:url" content="${canonical}"><meta property="og:site_name" content="PiAtlas"><link rel="icon" href="${url('favicon.svg')}"><script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script><script type="module" src="/site.ts"></script></head><body data-page="${kind}"><a href="#main" class="skip">跳到正文</a><header class="top"><div class="wrap top-inner">${brand}<button class="menu" type="button" aria-expanded="false" aria-controls="top-nav">☰ 菜单</button><nav id="top-nav" aria-label="主导航">${nav.map(([p,t])=>`<a href="${url(p)}" ${p===path?'aria-current="page"':''}>${t}</a>`).join('')}</nav></div>${article?'<progress id="read-progress" max="100" value="0" aria-label="阅读进度"></progress>':''}</header><main id="main" tabindex="-1">${body}</main>${footer}<div id="notice" class="notice" role="status"></div></body></html>`);
}
const lead = (label,title,desc) => `<div class="page-lead"><p class="eyebrow">${label}</p><h1>${escape(title)}</h1><p>${escape(desc)}</p></div>`;
const section = (id,label,title,body) => `<section class="home-section wrap" id="${id}"><p class="eyebrow">${label}</p><h2>${title}</h2>${body}</section>`;
const list = xs => `<ul class="article-list">${xs.map(x=>`<li><a href="${art(x.slug)}"><strong>${escape(x.title)}</strong><span>${escape(x.summary)}</span></a><small>${x.difficulty}</small></li>`).join('')}</ul>`;
const figure = (id,alt) => `<figure class="diagram"><img src="${url(`diagrams/${id}.svg`)}" alt="${escape(alt)}" loading="lazy"><figcaption>${escape(alt)} · PiAtlas 原创示意</figcaption></figure>`;
const groupCards = `<div class="group-grid">${groups.map(([id,title,desc],i)=>`<a href="${url(`${id}/`)}"><span class="index">${String(i+1).padStart(2,'0')}</span><h3>${title}</h3><p>${desc}</p></a>`).join('')}</div>`;
page('','首页','深入 Pi 的架构、源码与扩展机制，掌握现代 AI Agent 的核心工程方法。',`<section class="hero"><div class="wrap hero-inner"><div><p class="eyebrow"><span class="status-dot"></span> PIATLAS / AI AGENT 深度技术学院</p><h1>从理解 Agent，<br>到构建<span>自己的 Agent。</span></h1><p class="hero-copy">深入 Pi 的架构、源码与扩展机制，掌握现代 AI Agent 的核心工程方法。</p><div class="actions">${cta('getting-started/','开始学习 Pi','primary')}${cta('architecture/','探索核心架构','outline')}</div></div><img class="hero-art" src="${url('hero.svg')}" alt="教学架构：模型与工具连接 Agent Runtime，扩展、技能和会话分布于下方" width="640" height="430"></div><div class="wrap hero-meta"><span>⌘ &nbsp; Understand. Build. Extend. Engineer.</span><span>UPSTREAM / PI 1.6.0 · ${revision.slice(0,7)}</span></div></section><div class="wrap stats"><div><b>${articles.length}</b><span>中文技术教程</span></div><div><b>10</b><span>知识专题</span></div><div><b>06</b><span>交互式实验</span></div><div><b>30</b><span>天学习路线</span></div></div>
${section('intro','01 / WHAT IS PI','先认识 Pi，再拆解 Agent',`<div class="split"><p class="big-body">Pi 是一个精简、可扩展的 Coding Agent Harness：它让模型、工具、上下文与会话在同一个执行循环中协作。PiAtlas 用可追溯的快照和离线实验，面向 Agent 初学者、TypeScript 开发者和架构师拆解这一过程。</p>${figure('architecture',diagrams[0][1])}</div><div class="module-strip">${modules.map(m=>a(`source-map/#map-${m[0]}`,m[1])).join('')}</div>`)}
${section('topics','02 / KNOWLEDGE SYSTEM','十个板块，从第一条命令到运行时',groupCards)}
${section('path','03 / LEARNING PATH','找到适合你的学习路径',`<div class="paths"><div><h3>从零上手</h3>${a('roadmap/','30 天学习中心 ↗')}<p>每天一个实践任务；进度保存在当前浏览器。</p></div><div><h3>从源码出发</h3>${a('source-map/','探索源码与交互架构地图 ↗')}<p>从包清单、公开类型和主要实现三处交叉定位。</p></div><div><h3>从模型到工具</h3>${a('tools/#loop','打开 Agent Loop 实验室 ↗')}<p>单步观察模型意图、工具执行和结果回填。</p></div></div>`)}
${section('features','04 / DEEP DIVES','核心技术专题',list(['agent-loop','session-tree','compaction','provider-adapters','extension-basics','rpc'].map(s=>bySlug[s]).filter(Boolean)))}
${section('practice','05 / PRACTICE','把原理变成自己的代码',`${list(articles.filter(x=>x.group==='projects'))}${cta('tools/','进入交互实验室')}`)}
${section('latest','06 / READING ROOM','首批教程与官方资源',`${list(articles.slice(0,4))}<div class="actions">${cta('articles/','全部教程')}${cta('resources/','资源中心')}${ext('https://docs.pi.dev/','Pi 官方文档 ↗')}${ext(repo,'查看上游 GitHub ↗')}</div>`)}`);
for (const [id,title,desc] of groups) page(`${id}/`,title,desc,`<div class="wrap directory">${lead('ATLAS / 知识专题',title,desc)}<div class="directory-layout"><nav aria-label="知识分类" class="side">${groupLinks}</nav><div>${list(articles.filter(x=>x.group===id))}${id==='tui'?cta('integration/','RPC 与 SDK'):''}${id==='security'?cta('telemetry/','遥测与指标'):''}</div></div></div>`,{crumb:title});
page('articles/','全部文章','按十大知识板块浏览 PiAtlas 教程。',`<div class="wrap directory">${lead('ATLAS / INDEX','全部文章',`${articles.length} 篇教程，按知识板块组织。`)}${groups.map(([id,title])=>`<section><h2>${a(`${id}/`,title)}</h2>${list(articles.filter(x=>x.group===id))}</section>`).join('')}</div>`,{crumb:'全部文章'});
const tocLinks = hs => hs.filter(x=>x.level!=='h1').map(x=>`<a class="${x.level}" href="#${encodeURIComponent(x.id)}">${escape(x.title)}</a>`).join('');
for (const [idx,x] of articles.entries()) {
  headings.length=0;
  const body=md.render(x.body);
  const toc=tocLinks(headings);
  const [g,title]=groups.find(y=>y[0]===x.group);
  const nearby=articles.filter(y=>y.group===g&&y!==x).slice(0,3);
  const diagram=diagrams.find(d=>d[0]===x.diagram);
  if (!diagram) throw Error(`未知图表 ${x.diagram}`);
  const minutes=Math.max(2,Math.ceil(x.body.length/390));
  const docPath=x.doc.includes('/')||x.doc.endsWith('.md')?x.doc:`packages/coding-agent/docs/${x.doc}.md`;
  const docLabel=x.doc.includes('/')||x.doc.endsWith('.md')?'对应源码 / 文档（快照）':'对应官方文档（快照）';
  page(`articles/${x.slug}/`,x.title,x.summary,`<div class="wrap reading"><nav class="side reading-side" aria-label="知识导航"><b>知识导航</b>${groupLinks}<hr>${articles.filter(y=>y.group===g).map(y=>`<a href="${art(y.slug)}" ${y===x?'aria-current="page"':''}>${escape(y.title)}</a>`).join('')}</nav><article class="article"><div class="breadcrumbs">${a('','首页')} <span>/</span> ${a(`${g}/`,title)}</div>${lead('PIATLAS / 教程',x.title,x.summary)}<div class="meta">${x.difficulty} · 约 ${minutes} 分钟 · 核验 ${date}</div><p class="prereq"><b>前置知识：</b>${escape(x.prerequisites)}</p><details class="mobile-toc"><summary>打开章节目录</summary><nav aria-label="移动目录">${toc}</nav></details>${figure(diagram[0],diagram[1])}<div class="prose">${body}</div><section class="references"><h2>版本与来源</h2><p>Pi 包版本：1.6.0（此处指快照中 package.json，非最新发布保证）。核验日期：${date}。</p><p>快照：${ext(`${repo}/commit/${revision}`,revision)}</p><p>${ext('https://docs.pi.dev/','官方文档站')} · ${ext(source(docPath),docLabel)}</p><ul>${x.paths.map(p=>`<li>${ext(source(p),p)}</li>`).join('')}</ul><p>升级后请复核示例使用的 CLI flags、事件字段与公共签名；内部实现路径不是兼容承诺。</p></section><section><h2>相关教程</h2>${list(nearby)}</section><nav class="pager" aria-label="前后文章">${articles[idx-1]?cta(`articles/${articles[idx-1].slug}/`,'上一篇：'+articles[idx-1].title):''}${articles[idx+1]?cta(`articles/${articles[idx+1].slug}/`,'下一篇：'+articles[idx+1].title):''}</nav><a href="#main">↑ 返回顶部</a></article><aside class="toc"><b>本页内容</b><nav aria-label="文章目录">${toc}</nav></aside></div>`,{kind:'article',crumb:title,article:x});
}
const box = (id,title,body) => `<section class="lab" id="${id}"><h2>${title}</h2>${body}</section>`;
const buttons = (...items) => `<div class="actions">${items.map(([id,title])=>`<button type="button" data-action="${id}">${title}</button>`).join('')}</div>`;
const map = `<div class="map-grid" aria-label="模块选择">${modules.map(([id,name])=>`<button type="button" data-module="${id}" aria-controls="map-${id}">${name}</button>`).join('')}</div>${modules.map(([id,name,desc,file,api,topic,deps])=>`<section id="map-${id}" data-module-panel="${id}" class="map-panel"><h3>${name}</h3><p>${desc}</p><p>关键文件：${ext(source(`packages/${id}/src/${file}`),file)} · API：<code>${api}</code></p><p>依赖的图内包：${deps.map(d=>modules.find(m=>m[0]===d)[1]).join('、')||'无'}</p><p>依赖它的图内包：${modules.filter(m=>m[6].includes(id)).map(m=>m[1]).join('、')||'无'}</p>${ext(source(`packages/${id}/package.json`),'包清单')} · ${a(`${topic}/`,'相关教程')}</section>`).join('')}<p class="muted">仅显示七个研究对象间 package.json 的直接依赖；不显示传递依赖或其他包。尤其不要把 durable 或 chord 误画为 CLI 的直接依赖。</p>`;
page('source-map/','Pi 架构与源码地图','逐包查看 Pi 快照已核验的职责、公开入口和直接依赖。',`<div class="wrap directory">${lead('RESEARCH / SOURCE MAP','Pi 架构与源码地图','点击模块查看包边界和源码入口；图中不推断调用关系。')}${figure('monorepo',diagrams[13][1])}${box('map','模块关系',map)}<section><h2>源码阅读清单</h2><ol><li>${ext(source('README.md'),'上游 README：定位与包目录')}</li><li>${ext(source('package.json'),'根清单：工作区与 Node 要求')}</li><li>${ext(source('packages/coding-agent/src/index.ts'),'CLI 包公开入口')}</li><li>${ext(source('packages/agent/src/types.ts'),'事件、状态与工具签名')}</li></ol></section></div>`,{kind:'map',crumb:'源码地图'});
const benchmark = [
 ['核心架构','CLI Harness 与分包运行时','宿主 CLI 与配置','Agent / Runner'],['Agent Loop','模型、工具结果与排队消息','托管于 CLI；不在本文推断内部实现','Runner 管理循环'],['模型适配','pi-ai 统一类型，多 provider','支持的模型与提供方见官方配置','模型接口与 provider 配置'],['工具系统','内置工具与扩展注册','CLI 工具由权限与项目配置控制','函数工具和宿主管理工具'],['Session','树形 JSONL','通过 CLI 会话管理','提供 session 抽象'],['Context Management','活跃分支与 compaction','使用官方会话／上下文命令','宿主决定输入与历史策略'],['Extension','进程内 TypeScript 模块','可配置扩展与集成，非同一机制','在应用代码中组合能力'],['Skills','按需读取 SKILL.md','官方 Agent Skills 机制','不能从框架核心推断自动发现'],['RPC','stdin / stdout JSONL','另有集成协议与执行接口，非 Pi RPC','SDK 本身不是 CLI RPC 协议'],['SDK','进程内 TypeScript SDK','独立 SDK 集成入口','应用框架，本身即 SDK'],['安全模型','OS 权限、项目授权、外部隔离','参照官方沙箱和审批','应用需配置自身工具权限与隔离'],
];
const compare = `<div class="table-scroll"><table><thead><tr><th>维度</th><th>Pi</th><th>OpenAI Codex CLI</th><th>OpenAI Agents SDK</th></tr></thead><tbody>${benchmark.map(row=>`<tr>${row.map((v,i)=>`<${i?'td':'th'}>${v}</${i?'td':'th'}>`).join('')}</tr>`).join('')}</tbody></table></div><p>官方入口：${ext(source('packages/coding-agent/docs/how-pi-works.md'),'Pi 机制')} · ${ext('https://developers.openai.com/codex/','Codex 文档（滚动更新）')} · ${ext('https://openai.github.io/openai-agents-js/','Agents SDK 文档（滚动更新）')}。非性能或优劣结论；外部项目逐项版本核验待补。</p>`;
page('tools/','交互式实验室','六个本地实验：模块、循环、会话、压缩、扩展与比较。',`<div class="wrap directory">${lead('ATLAS / INTERACTIVE','交互式实验室','浏览器内运行；不调用模型、不执行工具、不上传输入。')}<div class="module-strip"><a href="#map">架构地图</a><a href="#loop">Agent Loop</a><a href="#tree">会话树</a><a href="#compact">上下文压缩</a><a href="#exercise">扩展练习</a><a href="#compare">架构比较</a></div>${box('map','A · Pi 架构地图',map)}${box('loop','B · Agent Loop 实验室',`<p>预设 JSON 事件，仅用于教学，不是 Pi 线协议。</p><div id="loop-steps" class="loop-steps"></div>${buttons(['prev','上一步'],['next','下一步'],['play','自动播放'],['pause','暂停'],['reset','重置'])}<p id="loop-status" role="status"></p><div class="split"><div><h3>事件数据</h3><pre id="loop-event"></pre></div><div><h3>当前上下文</h3><ul id="loop-context"></ul></div></div>`)}${box('tree','C · Session Tree',`<p>选中任意节点，输入消息创建支线。节点 ID 与父引用仅在页面内有效。</p><div id="tree-nodes"></div><form id="branch-form"><label for="branch">新分支消息</label> <input id="branch" required maxlength="100"><button>从当前节点分支</button></form><p id="active-node" role="status"></p><ol id="branch-history"></ol>`)}${box('compact','D · Context Compaction',`<p>预算按字符换算，非 Provider 的实际 tokenizer。原文始终可见。</p><label for="budget">模拟上下文预算 <output id="budget-label"></output></label> <input id="budget" type="range" min="18" max="100" value="35"><div class="split"><div><h3>原始历史</h3><ul id="original"></ul></div><div><h3>下一次请求 / 差异</h3><p id="compact-output" role="status"></p><ul id="projected"></ul></div></div>`)}${box('exercise','E · Extension 开发练习',`<p>各例独立保存。放在隔离目录后，可用 <code>pi -e ./example.ts</code> 加载。Sub-agent 片段是本地模拟，不是 Pi API。</p>${examples.map(([name,code],i)=>`<details ${i===0?'open':''}><summary>${name}</summary>${md.render('```typescript\n'+code+'\n```')}</details>`).join('')}`)}${box('compare','F · 架构比较',`<label for="comparison">按维度筛选</label> <select id="comparison"><option>全部</option>${benchmark.map(x=>`<option>${x[0]}</option>`).join('')}</select>${compare}`)}</div>`,{kind:'tools',crumb:'交互式实验室'});
page('roadmap/','30 天学习路线','通过 30 个可验收的小任务理解并构建 Agent。',`<div class="wrap directory">${lead('ATLAS / 30 DAYS','30 天学习中心','按九阶段推进；完成记录只保存在此浏览器。')}${figure('roadmap',diagrams.at(-1)[1])}<div class="road-progress"><progress max="30" value="0" id="road-progress" aria-label="学习进度"></progress> <span id="road-status" role="status">0 / 30</span></div>${[['Pi 入门',0],['整体架构',4],['模型层',7],['Agent Core',10],['Session 与上下文',13],['Extension 与 Skills',16],['TUI、RPC 与 SDK',21],['安全与工程化',24],['完整 Agent 实战',27]].map(([phase,start],i,phases)=>`<section><h2>${i+1} · ${phase}</h2><ol start="${start+1}" class="days">${days.slice(start,phases[i+1]?.[1]??30).map(([title,slug,task,result],j)=>`<li><h3>${title}</h3><p>学习内容：${escape(bySlug[slug]?.summary||'')}</p><p>推荐：${cta(`articles/${slug}/`,bySlug[slug]?.title||slug)}</p><p>实践：${task}</p><p>验收：${result}</p><label><input type="checkbox" data-day="${start+j+1}"> 标记完成</label></li>`).join('')}</ol></section>`).join('')}</div>`,{kind:'roadmap',crumb:'学习路线'});
for (const [path,title,desc,slugs] of [['integration','RPC 与 SDK','从进程协议到进程内生命周期。',['json-stream','rpc','sdk','tui-rendering']],['telemetry','可观测性','只采集可解释、可控的观测数据。',['telemetry','mock-llm','tool-errors']]]) page(`${path}/`,title,desc,`<div class="wrap directory">${lead('ATLAS / ENGINEERING',title,desc)}${list(slugs.map(slug=>bySlug[slug]).filter(Boolean))}</div>`,{crumb:title});
const downloads = [['atlas-extension.ts',examples[0][1]],['SKILL.md',skill],['toy-loop.mjs',toy]];
for (const [name,data] of downloads) write(`downloads/${name}`,data);
page('resources/','资源中心','官方入口、术语、速查表、代码模板和本地 SVG 下载。',`<div class="wrap directory">${lead('ATLAS / RESOURCES','资源中心','从上游文档进入源码；在本地下载练习素材。')}<div class="split"><section><h2>官方资料与清单</h2><ul><li>${ext('https://docs.pi.dev/','Pi 官方文档')}</li><li>${ext(repo,'Pi 官方 GitHub')}</li><li>${a('source-map/','源码地图与阅读清单')}</li><li>${a('roadmap/','30 天学习计划')}</li><li>${ext('https://agentskills.io/','Agent Skills 规范')}</li></ul><h2>代码下载</h2><ul>${downloads.map(([name])=>`<li><a download href="${url(`downloads/${name}`)}">${name}</a></li>`).join('')}</ul></section><section><h2>术语与 API 速查</h2><dl><dt>Harness</dt><dd>协调模型、工具、上下文及存储的宿主。</dd><dt>Compaction</dt><dd>用摘要替代请求投影里的较早消息；不是删除日志。</dd><dt><code>createAgentSession()</code></dt><dd>构造 SDK 会话；用完要 dispose。</dd><dt><code>pi.registerCommand()</code></dt><dd>注册用户触发的命令，不等价于模型工具。</dd><dt><code>pi.registerTool()</code></dt><dd>注册参数 schema 与工具执行逻辑。</dd></dl></section></div><h2>SVG 架构图下载</h2><ul class="diagram-links">${diagrams.map(([id,name])=>`<li><a download href="${url(`diagrams/${id}.svg`)}">${escape(name)}</a></li>`).join('')}</ul></div>`,{crumb:'资源中心'});
page('about/','关于 PiAtlas','独立维护的中文 Pi 技术研究和教学项目。',`<div class="wrap directory">${lead('ATLAS / ABOUT','关于 PiAtlas','从理解 Agent，到构建自己的 Agent。')}<p>PiAtlas 并非 Pi 官方文档。文章用标签区分官方说明、源码观察、工程建议和教学模拟。以可复现快照而非滚动最新版为准。</p><p>源码快照：${ext(`${repo}/commit/${revision}`,revision)}；核验日期 ${date}。架构关系仅报告指定范围内直接依赖。</p><p>${a('source-map/','阅读源码地图')} · ${ext('https://github.com/yuxinrun/piatlas','反馈与勘误')}</p></div>`,{crumb:'关于'});
page('search/','全站搜索','检索教程标题、正文、分类、术语和源码路径。',`<div class="wrap directory">${lead('ATLAS / LOCAL SEARCH','全站搜索','在浏览器本地查找文章。按斜杠 / 可快速进入搜索。')}<form id="search-form"><label for="search">关键词</label> <input id="search" name="q" type="search" autocomplete="off" placeholder="例如：Agent Loop、会话、.ts"><button>搜索</button></form><div id="suggestions" class="actions">${['Agent Loop','Provider','Session','RPC','源码'].map(t=>`<button type="button" data-suggestion="${t}">${t}</button>`).join('')}</div><p id="search-status" role="status"></p><ul id="results" class="article-list"></ul><noscript>${a('articles/','JavaScript 已关闭，浏览全部文章')}</noscript></div>`,{kind:'search',crumb:'搜索'});
page('404.html','页面不存在','回到首页或搜索所需内容。',`<div class="wrap directory">${lead('ATLAS / 404','这个页面不存在','请返回首页或通过搜索继续。')}${cta('','返回首页')}${cta('search/','搜索文章')}</div>`);
write('search-index.json',JSON.stringify(articles.map(x=>({title:x.title,summary:x.summary,slug:x.slug,group:groups.find(g=>g[0]===x.group)[1],paths:x.paths.join(' '),text:x.body.replace(/^```.*$/gm,'').replace(/[#*`]/g,'')}))));
write('loop-events.json',JSON.stringify(events));
write('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(path=>`<url><loc>${origin}${url(path)}</loc></url>`).join('')}</urlset>`);
write('robots.txt',`User-agent: *\nAllow: /\nSitemap: ${origin}${base}sitemap.xml\n`);
write('.nojekyll','');
const C={bg:'#0b1a30',panel:'#132c47',panel2:'#1a3b58',purple:'#2c2a4d',stroke:'#5e91a0',accent:'#63e6c8',mint:'#9ef0dc',violet:'#b4a4f4',text:'#eef8ff',muted:'#a8c3d4'};
const txt=(x,y,s,size=14,fill=C.muted,anchor='start')=>`<text x="${x}" y="${y}" fill="${fill}" font-family="system-ui,-apple-system,sans-serif" font-size="${size}" text-anchor="${anchor}">${escape(s)}</text>`;
const node=(x,y,label,{w=156,h=52,fill=C.panel,stroke=C.stroke,size}={})=>{const fs=size||(label.length>10?13:15);return `<g><rect x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" rx="9" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/><text x="${x}" y="${y+5}" fill="${C.text}" font-family="system-ui,-apple-system,sans-serif" font-size="${fs}" text-anchor="middle">${escape(label)}</text></g>`;};
const arrow=(d,label='',dash='')=>`<path d="${d}" fill="none" stroke="${C.accent}" stroke-width="2" ${dash?`stroke-dasharray="${dash}"`:''} marker-end="url(#arrow)"/>${label?txt(0,0,'',0):''}`;
const note=(x,y,s)=>txt(x,y,s,13,C.muted);
function diagramBody(id,n){
  const h=(x,y,w,label,extra={})=>`<rect x="${x}" y="${y}" width="${w}" height="44" rx="8" fill="${extra.fill||C.panel}" stroke="${extra.stroke||C.stroke}"/>${txt(x+w/2,y+28,label,14,C.text,'middle')}`;
  if(id==='architecture') return `${h(350,74,200,n[0])}${h(330,142,240,n[1],{fill:C.panel2})}${h(330,210,240,n[2],{fill:C.panel2,stroke:C.accent})}${h(260,278,380,n[3],{fill:C.purple,stroke:C.violet})}${arrow('M450 118 L450 140')}${arrow('M450 186 L450 208')}${arrow('M450 254 L450 276')}${note(72,100,'交互层')}${note(72,168,'宿主层')}${note(72,236,'核心层')}${note(72,304,'能力层')}${note(700,168,'职责分层')}${note(700,188,'不表示依赖')}`;
  if(id==='loop') return `${node(150,180,n[0])}${node(360,100,n[1],{fill:C.panel2,stroke:C.accent})}${node(610,100,n[2])}${node(760,245,n[3],{fill:C.purple,stroke:C.violet})}${arrow('M225 165 L300 115')}${arrow('M425 120 L535 120')}${arrow('M675 130 L742 215')}${arrow('M700 270 C500 330 300 300 225 205','', '6 6')}${node(460,215,'上下文',{w:120,h:44,fill:'#0f2439',stroke:C.violet,size:14})}${note(300,320,'有未完成工作时继续；完成的轮次必须能终止')}`;
  if(id==='tool') return `${node(120,150,n[0])}${node(330,150,n[1],{fill:C.panel2})}${node(540,150,n[2])}${node(760,150,n[3],{fill:C.purple,stroke:C.violet})}${arrow('M198 150 L252 150')}${arrow('M408 150 L462 150')}${arrow('M618 150 L682 150')}${h(300,230,180,'Schema 校验',{fill:'#0f2439'})}${h(520,230,180,'isError / usage',{fill:'#0f2439'})}${note(120,300,'意图不等于执行；结果必须关联到唯一 ToolCall.id')}`;
  if(id==='provider') return `${node(110,180,n[0],{w:170})}${node(360,90,'Provider A')}${node(360,180,'Provider B')}${node(360,270,'Provider C')}${node(660,180,n[3],{fill:C.purple,stroke:C.violet,w:180})}${arrow('M195 180 C245 180 250 90 282 90')}${arrow('M195 180 L282 180')}${arrow('M195 180 C245 180 250 270 282 270')}${arrow('M438 90 C520 90 540 165 570 165')}${arrow('M438 180 L570 180')}${arrow('M438 270 C520 270 540 195 570 195')}${note(250,330,'厂商差异在适配层收敛为统一事件')}`;
  if(id==='tree') return `${node(120,180,n[0])}${node(330,180,n[1],{fill:C.panel2})}${node(600,100,n[2],{fill:C.purple,stroke:C.violet})}${node(600,260,n[3])}${arrow('M198 180 L252 180')}${arrow('M408 165 L522 115')}${arrow('M408 195 L522 245')}${note(120,315,'高亮路径是活动分支；灰色路径仍保留在会话文件中')}`;
  if(id==='compaction') return `${[0,1,2,3].map(i=>`<rect x="${60+i*78}" y="105" width="64" height="120" rx="7" fill="#10253a" stroke="#3d6477" opacity="${i<2?.45:.9}"/>${txt(92+i*78,165,i<2?'旧':'近',13,C.muted,'middle')}`).join('')}${arrow('M380 165 L430 165')}${node(520,165,n[1],{w:160,fill:C.purple,stroke:C.violet})}${node(710,165,n[2],{w:150})}${node(850,165,n[3],{w:120,fill:'#0f2439',stroke:C.accent,size:13})}${arrow('M600 165 L635 165')}${arrow('M785 165 L788 165')}${note(60,270,'摘要替换请求投影中的较早消息')}${note(60,295,'原始条目仍留在会话树中')}`;
  if(id==='extension') return `${[n[0],n[1],n[2],n[3]].map((label,i)=>node(300,80+i*78,label,{w:250,fill:i===3?C.purple:C.panel,stroke:i===3?C.violet:C.stroke})).join('')}${[0,1,2].map(i=>arrow(`M300 ${106+i*78} L300 ${154+i*78}`)).join('')}${note(500,92,'extension factory')}${note(500,170,'registerTool / registerCommand')}${note(500,248,'tool_call / message_update')}${note(500,326,'session_shutdown 清理')}`;
  if(id==='skills') return `${node(115,160,n[0])}${node(330,160,'名称 / 描述 / 路径',{w:190,fill:C.panel2})}${node(560,160,n[2])}${node(790,160,n[3],{fill:C.purple,stroke:C.violet})}${arrow('M195 160 L232 160')}${arrow('M428 160 L482 160')}${arrow('M640 160 L710 160')}${h(240,245,190,'system prompt',{fill:'#0f2439'})}${note(120,310,'完整正文只在任务匹配后读取')}`;
  if(id==='rpc') return `${node(120,180,n[0],{w:170})}${node(330,105,n[1],{w:160})}${node(550,180,n[2],{w:180,fill:C.panel2})}${node(790,180,n[3],{w:190,fill:C.purple,stroke:C.violet})}${arrow('M205 165 L252 120')}${arrow('M410 125 L490 165')}${arrow('M640 180 L692 180')}${arrow('M640 195 C700 245 760 245 790 220','', '5 5')}${note(250,300,'命令有响应；事件描述过程')}${note(250,325,'不要把事件当成命令回执')}`;
  if(id==='tui') return `${node(115,150,n[0])}${node(330,150,n[1])}${node(545,150,n[2])}${node(760,150,n[3],{fill:C.purple,stroke:C.violet})}${arrow('M193 150 L252 150')}${arrow('M408 150 L467 150')}${arrow('M623 150 L682 150')}${arrow('M760 185 C760 265 330 265 330 185','', '6 6')}${note(300,310,'只写入变化的行；真实实现还处理宽度与 ANSI')}`;
  if(id==='security') return `<rect x="55" y="80" width="790" height="200" rx="16" fill="none" stroke="${C.violet}" stroke-width="1.5" stroke-dasharray="8 6"/>${node(150,180,n[0],{w:160})}${node(360,180,n[1],{w:170,fill:C.panel2})}${node(570,180,n[2],{w:160})}${node(780,180,n[3],{w:160,fill:C.purple,stroke:C.violet})}${arrow('M230 180 L272 180')}${arrow('M445 180 L488 180')}${arrow('M650 180 L698 180')}${note(75,105,'边界：最小挂载 / 最小网络 / 默认拒绝')}${note(300,330,'本体权限不等于工具权限；审计需要脱敏')}`;
  if(id==='subagent') return `${node(450,85,'协调者',{w:190,fill:C.panel2,stroke:C.accent})}${node(230,225,n[1],{w:190})}${node(450,290,n[3],{w:190,fill:C.purple,stroke:C.violet})}${node(670,225,n[2],{w:190})}${arrow('M385 115 L275 198')}${arrow('M515 115 L625 198')}${arrow('M300 248 L405 280')}${arrow('M600 248 L495 280')}${note(70,335,'教学方案：Pi 默认不内置 sub-agent')}`;
  if(id==='coding') return `${node(115,160,n[0])}${node(330,160,n[1],{fill:C.panel2})}${node(545,160,n[2])}${node(760,160,n[3],{fill:C.purple,stroke:C.violet})}${arrow('M193 160 L252 160')}${arrow('M408 160 L467 160')}${arrow('M623 160 L682 160')}${arrow('M760 195 C760 285 115 285 115 195','', '6 6')}${note(300,320,'验证失败则回到目标；不自动写入生产仓库')}`;
  if(id==='monorepo') return `${node(120,170,n[0])}${node(340,170,n[1])}${node(560,170,n[2],{fill:C.panel2,stroke:C.accent})}${node(790,170,n[3],{fill:C.purple,stroke:C.violet})}${arrow('M198 170 L262 170')}${arrow('M418 170 L482 170')}${arrow('M638 170 L712 170')}${note(120,255,'package.json')}${note(340,255,'包清单')}${note(560,255,'src/index.ts')}${note(790,255,'实现与测试')}${note(120,320,'阅读路线，不是运行时调用图')}`;
  if(id==='roadmap') return `${[0,1,2,3].map((i)=>`<rect x="${70+i*205}" y="100" width="180" height="150" rx="12" fill="${i===3?C.purple:C.panel}" stroke="${i===3?C.violet:C.stroke}"/>${txt(160+i*205,145,n[i],15,C.text,'middle')}${[0,1,2,3,4,5,6].map(j=>`<circle cx="${105+i*205+j*21}" cy="205" r="5" fill="${j<4?C.accent:'#34536a'}"/>`).join('')}`).join('')}${note(70,300,'30 天 · 九阶段 · 进度保存在本地浏览器')}`;
  return `${node(200,180,n[0])}${arrow('M278 180 L622 180')}${node(700,180,n[3])}`;
}
for (const [id,title,nodes] of diagrams) {
  const body=diagramBody(id,nodes);
  const foot=id==='architecture'||id==='monorepo'||id==='roadmap'?'职责与阅读路线示意 · 非依赖图':'教学示意 · 不是 Pi 线协议或官方 UI';
  write(`diagrams/${id}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 360" role="img" aria-labelledby="title desc"><title id="title">${escape(title)}</title><desc id="desc">PiAtlas 本地绘制的教学示意图</desc><defs><marker id="arrow" markerWidth="10" markerHeight="9" refX="9" refY="4.5" orient="auto"><path d="M0 0L10 4.5L0 9z" fill="${C.accent}"/></marker></defs><rect width="900" height="360" rx="14" fill="${C.bg}"/><g opacity="0.16" stroke="${C.stroke}">${[150,300,450,600,750].map(x=>`<path d="M${x} 0V360"/>`).join('')}${[90,180,270].map(y=>`<path d="M0 ${y}H900"/>`).join('')}</g>${txt(28,42,title,21,C.text)}<path d="M28 58H872" stroke="${C.stroke}" opacity="0.6"/>${body}${txt(28,342,'PIATLAS / '+foot,12,C.muted)}</svg>`);
}
console.log(`Generated ${routes.length} routes, ${articles.length} articles and ${diagrams.length} diagrams`);


