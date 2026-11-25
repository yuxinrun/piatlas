type Fixture = [string, unknown, string[]];
const byId = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
function line(text: string) { const li=document.createElement('li'); li.textContent=text; return li; }
function map() {
  const tabs=[...document.querySelectorAll<HTMLButtonElement>('[data-module]')];
  const panels=[...document.querySelectorAll<HTMLElement>('[data-module-panel]')];
  function select(id: string) {
    for (const button of tabs) button.setAttribute('aria-pressed',String(button.dataset.module===id));
    for (const panel of panels) panel.hidden=panel.dataset.modulePanel!==id;
  }
  const initial=location.hash.slice(1); select(tabs.some(x=>x.dataset.module===initial)?initial:'coding-agent');
  for (const tab of tabs) tab.addEventListener('click',()=>select(tab.dataset.module!));
}
async function loop(base: string) {
  const status=byId('loop-status'); const steps=byId('loop-steps');
  const buttons=[...document.querySelectorAll<HTMLButtonElement>('#loop [data-action]')];
  let position=0, timer: number | undefined;
  let events: Fixture[];
  for (const button of buttons) button.disabled=true;
  status.textContent='正在读取预设事件…';
  try { const result=await fetch(`${base}loop-events.json`); if(!result.ok) throw Error('fixture'); events=await result.json(); }
  catch { status.textContent='预设事件加载失败，请刷新页面。'; return; }
  const sequence=events.map(([title],i)=>{ const el=document.createElement('button'); el.type='button'; el.textContent=`${i+1}. ${title}`; el.addEventListener('click',()=>{ pause(); position=i; render(); }); steps.append(el); return el; });
  function pause(){ clearInterval(timer); timer=undefined; }
  function render(){
    const [title,event,context]=events[position];
    status.textContent=`${position+1} / ${events.length} · ${title}${timer===undefined?'':' · 播放中'}`;
    byId('loop-event').textContent=JSON.stringify(event,null,2);
    byId('loop-context').replaceChildren(...context.map(line));
    sequence.forEach((el,i)=>{ if(i===position) el.setAttribute('aria-current','step'); else el.removeAttribute('aria-current'); });
    for(const b of buttons) b.disabled=(({prev:position===0,next:position===events.length-1,play:timer!==undefined||position===events.length-1,pause:timer===undefined}) as Record<string,boolean>)[b.dataset.action!]||false;
  }
  for(const button of buttons) button.addEventListener('click',()=>{
    switch(button.dataset.action){
      case 'next': pause(); position++; break;
      case 'prev': pause(); position--; break;
      case 'reset': pause(); position=0; break;
      case 'pause': pause(); break;
      case 'play': timer=window.setInterval(()=>{ position++; if(position>=events.length-1) pause(); render(); },1050); break;
    }
    render();
  });
  addEventListener('pagehide',()=>{pause(); render();}); render();
}
function tree(){
  const nodes=[{parent:-1,text:'用户：整理需求'},{parent:0,text:'助手：分为两项'},{parent:1,text:'用户：优先考虑兼容性'},{parent:1,text:'用户：改为优先考虑性能'}];
  const holder=byId('tree-nodes'); const history=byId('branch-history'); const active=byId('active-node');
  let current=2;
  function path(id:number){ const chain:number[]=[]; for(let n=id;n>=0;n=nodes[n].parent) chain.unshift(n); return chain; }
  function show(){
    const chain=path(current);
    const group=(parent:number): HTMLUListElement => {
      const ul=document.createElement('ul');
      for (const [i,node] of nodes.entries()) if (node.parent===parent) {
        const li=document.createElement('li');const b=document.createElement('button');b.type='button';b.dataset.node=String(i);
        b.textContent=`#${i+1} ${node.text}`; b.setAttribute('aria-pressed',String(i===current));
        if(chain.includes(i)) b.classList.add('on-branch');
        b.addEventListener('click',()=>{current=i; show(); holder.querySelector<HTMLButtonElement>(`[data-node="${i}"]`)?.focus();}); li.append(b);
        if(nodes.some(x=>x.parent===i)) li.append(group(i)); ul.append(li);
      }
      return ul;
    };
    holder.replaceChildren(group(-1)); active.textContent=`活跃分支：${chain.map(i=>`#${i+1}`).join(' → ')}`;
    history.replaceChildren(...chain.map(i=>line(nodes[i].text)));
  }
  const input=byId<HTMLInputElement>('branch');
  byId('branch-form').addEventListener('submit',e=>{e.preventDefault(); const text=input.value.trim(); if(!text) return; if(nodes.length>=80){active.textContent='已达 80 节点演示上限，刷新可重置。';return;} nodes.push({parent:current,text}); current=nodes.length-1; input.value=''; show(); input.focus();});
  show();
}
function compact(){
  const messages=['用户：生成项目说明，只读处理，保留兼容性约束。','助手：已检查临时目录，存在三份不同格式的示例与一份旧版清单。','用户：旧版清单不能作为最终依据，但要在说明中标记版本差异。','助手：已确认不需要编辑文件。','用户：下一步列出最重要的两项检查。'];
  const summary='摘要：任务为只读说明；保留兼容性与版本差异，不依赖旧清单。';
  const cost=(text:string)=>Math.ceil([...text].length/2)+2;
  const sum=(xs:string[])=>xs.reduce((a,b)=>a+cost(b),0);
  const slider=byId<HTMLInputElement>('budget');
  byId('original').replaceChildren(...messages.map(x=>line(`${x} · ${cost(x)} tokens`)));
  function render(){
    const budget=Number(slider.value); byId('budget-label').textContent=`${budget} tokens`;
    const total=sum(messages); const prefix=total>budget?messages.length-2:0;
    const retained=messages.slice(prefix);const next=prefix?[summary,...retained]:retained;
    const fit=sum(next)<=budget;
    byId('compact-output').textContent=`${total} → ${sum(next)} 模拟 tokens。${prefix?`替换 ${prefix} 条较早记录；示例文件数量未进入摘要。`: '预算充足，无需压缩。'}${fit?'':' 仍超预算；演示不会继续删减。'}`;
    byId('projected').replaceChildren(...next.map(x=>line(x)));
  }
  slider.addEventListener('input',render); render();
}
export function initLabs(base: string){
  map(); if (!byId('loop')) return;
  void loop(base); tree(); compact();
  const filter=byId<HTMLSelectElement>('comparison');
  filter.addEventListener('change',()=>{ for(const row of document.querySelectorAll<HTMLTableRowElement>('#compare tbody tr')) row.hidden=filter.value!=='全部'&&row.cells[0].textContent!==filter.value; });
}

