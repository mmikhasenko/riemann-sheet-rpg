import { levels } from './math.js';
export const STORAGE_KEY = 'analytic-rpg-progress-v1';
export const AWARDS = [
  { count: 2, name: 'Beyond the principal', icon: '✧', description: 'Enter 2 sheets across levels' },
  { count: 3, name: 'Sheet explorer', icon: '✦', description: 'Enter 3 sheets across levels' },
  { count: 5, name: 'Surface cartographer', icon: '❖', description: 'Enter 5 sheets across levels' },
  { count: 7, name: 'Branch-point voyager', icon: '✺', description: 'Enter 7 sheets across levels' },
  { count: 11, name: 'Independent-root navigator', icon: '✥', description: 'Enter 11 sheets across levels' },
  {count:15,name:'Beyond the finite',icon:'∞',description:'Enter 15 sheets across levels'},
  {count:25,name:'Endless explorer',icon:'✧',description:'Enter 25 sheets across levels'},
];
const validSheets = new Set(levels.flatMap(level => (level.labels ?? []).map(label => `${level.id}:${label}`)));
export const TOTAL_SHEETS = levels.some(level=>level.labels===null) ? Infinity : validSheets.size;
function validSheet(id){
  if(validSheets.has(id))return true;
  if(typeof id!=='string')return false;
  const colon=id.indexOf(':'),levelId=id.slice(0,colon),label=id.slice(colon+1);
  const level=levels.find(level=>level.id===levelId&&level.labels===null);
  if(level?.validLabel)return level.validLabel(label);
  if(!level||!/^-?\d+$/.test(label))return false;
  const n=Number(label);return Number.isSafeInteger(n)&&`${levelId}:${n}`===id;
}
const validLevels = new Set(levels.map(level => level.id));
export function readProgress(storage) {
  try {
    const saved = JSON.parse(storage.getItem(STORAGE_KEY) || '{}');
    return {
      visited: new Set(Array.isArray(saved.visited) ? saved.visited.filter(id => validSheet(id)) : []),
      completed: new Set(Array.isArray(saved.completed) ? saved.completed.filter(id => validLevels.has(id)) : []),
    };
  } catch { return { visited: new Set(), completed: new Set() }; }
}
export function saveProgress(storage, progress) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ visited: [...progress.visited], completed: [...progress.completed] }));
    return true;
  } catch { return false; }
}
export function visitSheet(progress, levelId, label) {
  const id = `${levelId}:${label}`, before = progress.visited.size;
  if (validSheet(id)) progress.visited.add(id);
  return AWARDS.filter(a => before < a.count && progress.visited.size >= a.count);
}

export function exploredInLevel(progress, level) {
  return [...progress.visited].filter(id=>id.startsWith(`${level.id}:`) && validSheet(id)).length;
}
