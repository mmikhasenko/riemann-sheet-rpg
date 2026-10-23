import test from 'node:test';
import assert from 'node:assert/strict';
import { readProgress, saveProgress, visitSheet, STORAGE_KEY } from '../dist/progress.js';
const memory = () => { const entries=new Map(); return { getItem:k=>entries.get(k),setItem:(k,v)=>entries.set(k,v) }; };
test('awards count distinct level/sheet pairs, never repeated crossings or replays',()=>{
 const p=readProgress(memory());
 assert.deepEqual(visitSheet(p,'sqrt',1),[]);
 assert.equal(visitSheet(p,'sqrt',-1)[0].count,2);
 for(let i=0;i<10;i++){assert.deepEqual(visitSheet(p,'sqrt',1),[]);assert.deepEqual(visitSheet(p,'sqrt',-1),[]);}
 assert.equal(p.visited.size,2);
 assert.equal(visitSheet(p,'cube',0)[0].count,3);
 assert.deepEqual(visitSheet(p,'cube',1),[]);
 assert.equal(visitSheet(p,'cube',2)[0].count,5);
 assert.deepEqual(visitSheet(p,'cube',2),[]);
});
test('awards and completed levels survive save/reload without being awarded twice',()=>{
 const store=memory(),p=readProgress(store);visitSheet(p,'sqrt',1);visitSheet(p,'sqrt',-1);p.completed.add('sqrt');
 assert.ok(saveProgress(store,p));const loaded=readProgress(store);
 assert.equal(loaded.visited.size,2);assert.ok(loaded.completed.has('sqrt'));assert.deepEqual(visitSheet(loaded,'sqrt',-1),[]);
 assert.equal(visitSheet(loaded,'cube',0)[0].count,3);
});
test('corrupt or unavailable browser storage does not break gameplay',()=>{
 const store=memory();store.setItem(STORAGE_KEY,'broken');assert.equal(readProgress(store).visited.size,0);
 store.setItem(STORAGE_KEY,JSON.stringify({visited:['sqrt:1','sqrt:1','cube:99','fake:0'],completed:['sqrt','invalid']}));
 const p=readProgress(store);assert.deepEqual([...p.visited],['sqrt:1']);assert.deepEqual([...p.completed],['sqrt']);
 assert.equal(readProgress(null).visited.size,0);assert.equal(saveProgress(null,p),false);
});
