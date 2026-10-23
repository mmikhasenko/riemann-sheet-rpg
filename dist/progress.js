export const STORAGE_KEY = 'analytic-rpg-progress-v1';
export const AWARDS = [
  { count: 2, name: 'Beyond the principal', icon: '✧', description: 'Visit 2 distinct sheets' },
  { count: 3, name: 'Sheet explorer', icon: '✦', description: 'Visit 3 distinct sheets' },
  { count: 5, name: 'Surface cartographer', icon: '❖', description: 'Visit all 5 available sheets' },
];
const validSheets = new Set(['sqrt:1', 'sqrt:-1', 'cube:0', 'cube:1', 'cube:2']);
export function readProgress(storage) {
  try {
    const saved = JSON.parse(storage.getItem(STORAGE_KEY) || '{}');
    return {
      visited: new Set(Array.isArray(saved.visited) ? saved.visited.filter(id => validSheets.has(id)) : []),
      completed: new Set(Array.isArray(saved.completed) ? saved.completed.filter(id => ['sqrt', 'cube'].includes(id)) : []),
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
  if (validSheets.has(id)) progress.visited.add(id);
  return AWARDS.filter(a => before < a.count && progress.visited.size >= a.count);
}
