import './styles.css';
const base = import.meta.env.BASE_URL;
const menu = document.querySelector<HTMLButtonElement>('.menu')!;
const nav = document.getElementById('top-nav')!;
function setMenu(open: boolean) { menu.setAttribute('aria-expanded',String(open)); nav.classList.toggle('open',open); }
menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { setMenu(false); menu.focus(); }
  if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || (e.target instanceof HTMLElement && (e.target.isContentEditable || !!e.target.closest('input,textarea,select')))) return;
  e.preventDefault(); const search = document.getElementById('search'); if (search) search.focus(); else location.href=`${base}search/`;
});
const notice = document.getElementById('notice')!;
let noticeTimer: ReturnType<typeof setTimeout>;
function announce(text: string) { notice.textContent = text; clearTimeout(noticeTimer); noticeTimer = setTimeout(() => { notice.textContent=''; },2600); }
document.addEventListener('click', async e => {
  if (!(e.target instanceof HTMLElement)) return;
  const button = e.target.closest<HTMLButtonElement>('[data-copy]');
  if (!button) return;
  const code = button.parentElement?.querySelector('code');
  if (!code) return;
  try { await navigator.clipboard.writeText(code.textContent || ''); announce('已复制代码'); }
  catch { const range = document.createRange(); range.selectNodeContents(code); const selection=getSelection(); selection?.removeAllRanges(); selection?.addRange(range); announce('已选中代码，请手动复制'); }
});
const page = document.body.dataset.page;
if (page === 'article') {
  const article = document.querySelector<HTMLElement>('article')!;
  const progress = document.querySelector<HTMLProgressElement>('#read-progress')!;
  const links = [...document.querySelectorAll<HTMLAnchorElement>('.toc a,.mobile-toc a')];
  const headings = [...article.querySelectorAll<HTMLElement>('.prose h2,.prose h3,.prose h4')];
  function update() {
    const position = article.getBoundingClientRect();
    progress.value = Math.max(0, Math.min(100, (75-position.top)/Math.max(1,position.height-innerHeight+75)*100));
    const active = headings.filter(el => el.getBoundingClientRect().top <= 130).at(-1);
    for (const link of links) {
      if (active && decodeURIComponent(link.hash.slice(1)) === active.id) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    }
  }
  let queued = false;
  addEventListener('scroll', () => { if (!queued) requestAnimationFrame(() => { queued = false; update(); }); queued = true; },{passive:true});
  addEventListener('resize',update); update();
  for (const link of links) link.addEventListener('click',() => { const d=link.closest('details'); if(d) d.open=false; });
}
if (page === 'search') void import('./tools/search').then(module => module.initSearch(base));
if (page === 'tools' || page === 'map') void import('./tools/labs').then(module => module.initLabs(base));
if (page === 'roadmap') {
  const key='piatlas:roadmap:v1';
  let saved: unknown;
  try { saved=JSON.parse(localStorage.getItem(key)||'[]'); } catch { saved=[]; }
  const done=new Set<number>(Array.isArray(saved)?saved.filter((x): x is number => Number.isInteger(x)&&x>=1&&x<=30):[]);
  const progress=document.querySelector<HTMLProgressElement>('#road-progress')!;
  const status=document.getElementById('road-status')!;
  const render=()=>{ progress.value=done.size; status.textContent=`${done.size} / 30`; };
  for (const checkbox of document.querySelectorAll<HTMLInputElement>('[data-day]')) {
    const day=Number(checkbox.dataset.day); checkbox.checked=done.has(day);
    checkbox.addEventListener('change',()=>{ if (checkbox.checked) done.add(day); else done.delete(day); try { localStorage.setItem(key,JSON.stringify([...done])); } catch { announce('浏览器不允许保存进度；仅本次访问有效'); } render(); });
  }
  render();
}

