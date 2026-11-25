type Entry = {slug:string; title:string; summary:string; group:string; paths:string; text:string};
function highlight(target: HTMLElement,text: string, terms: string[]) {
  const regex=new RegExp(terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'giu');
  let cursor=0;
  for (const match of text.matchAll(regex)) {
    target.append(text.slice(cursor,match.index));
    const mark=document.createElement('mark'); mark.textContent=match[0]; target.append(mark);
    cursor=match.index+match[0].length;
  }
  target.append(text.slice(cursor));
}
export function initSearch(base: string) {
  const input=document.querySelector<HTMLInputElement>('#search')!;
  const results=document.querySelector<HTMLUListElement>('#results')!;
  const status=document.getElementById('search-status')!;
  let index: Promise<Entry[]> | undefined;
  let generation=0;
  async function find(updateUrl: boolean) {
    const token=++generation;
    const value=input.value.trim().slice(0,120);
    const terms=value.toLowerCase().split(/\s+/).filter(Boolean).slice(0,12);
    results.replaceChildren();
    if (updateUrl) history.replaceState(null,'',value?`?q=${encodeURIComponent(value)}`:location.pathname);
    if (!terms.length) { status.textContent='输入关键词，或选择上方建议。'; return; }
    status.textContent='正在检索…';
    try {
      index ??= fetch(`${base}search-index.json`).then(res=>{ if(!res.ok) throw Error('index'); return res.json(); });
      const entries=await index;
      if (token!==generation) return;
      const found=entries.map(item=>{
        const fields=[item.title,item.summary,item.group,item.paths,item.text].map(x=>x.toLowerCase());
        const positions=terms.map(term=>fields.findIndex(field=>field.includes(term)));
        return {item,score:positions.some(i=>i<0)?0:positions.reduce((score,i)=>score+[10,6,4,3,1][i],0)};
      }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
      status.textContent=found.length?`找到 ${found.length} 篇文章。`:'没有匹配结果。可缩短关键词，或尝试英文术语。';
      for (const {item} of found) {
        const li=document.createElement('li');
        const link=document.createElement('a'); link.href=`${base}articles/${item.slug}/`;
        const title=document.createElement('strong'); highlight(title,item.title,terms);
        const snippet=document.createElement('span');
        const full=`${item.summary} ${item.paths} ${item.text.replace(/\s+/g,' ')}`;
        const loc=full.toLowerCase().indexOf(terms[0]); const start=Math.max(0,loc-28);
        highlight(snippet,`${start?'…':''}${full.slice(start,start+165)}…`,terms);
        const group=document.createElement('small'); highlight(group,item.group,terms);
        link.append(title,snippet); li.append(link,group); results.append(li);
      }
    } catch { index=undefined; if (token===generation) status.textContent='搜索索引加载失败，请重试或访问全部文章。'; }
  }
  input.value=new URLSearchParams(location.search).get('q')||'';
  input.maxLength=120;
  let timer: number | undefined;
  input.addEventListener('input',()=>{ clearTimeout(timer); timer=window.setTimeout(()=>void find(true),150); });
  document.getElementById('search-form')!.addEventListener('submit',e=>{ e.preventDefault(); clearTimeout(timer); void find(true); });
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-suggestion]')) button.addEventListener('click',()=>{ input.value=button.dataset.suggestion!; input.focus(); void find(true); });
  void find(false);
}

