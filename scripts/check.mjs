import { cpSync, globSync, existsSync, readFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { base } from '../src/data/catalog.mjs';
for (const path of ['diagrams','downloads','search-index.json','loop-events.json','sitemap.xml','robots.txt','.nojekyll']) cpSync(`.generated/${path}`,`dist/${path}`,{recursive:true});
const files=globSync('dist/**/*.html');
const broken=[];
for (const file of files) {
  const html=readFileSync(file,'utf8');
  for (const [,target] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (!target.startsWith(base) && !target.startsWith('#')) continue;
    const [path,hash]=target.split('#');
    const dest=path ? resolve('dist',path.slice(base.length),path.endsWith('/')?'index.html':'') : resolve(file);
    if (!existsSync(dest)) { broken.push(`${file}: ${target}`); continue; }
    if (hash && dest.endsWith('.html') && !readFileSync(dest,'utf8').includes(`id="${decodeURIComponent(hash)}"`)) broken.push(`${file}: ${target}`);
  }
}
if (broken.length) throw Error(broken.join('\n'));
const count=files.filter(f=>relative('dist',f).split(/[\\/]/).length===3).length;
if (count<40) throw Error(`Expected 40 article routes, found ${count}`);
console.log(`Validated ${files.length} HTML files and all generated local links.`);

