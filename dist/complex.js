// Shared float64 complex arithmetic. Exact negative-axis values use the upper bank.
export function sqrt(z, label = 1) {
  const r = Math.hypot(z.x, z.y);
  const re = z.x >= 0 ? Math.sqrt((r + z.x) / 2) : Math.abs(z.y) / Math.sqrt(2 * (r - z.x));
  const im = z.x >= 0 ? (re ? z.y / (2 * re) : 0) : (z.y < 0 ? -1 : 1) * Math.sqrt((r - z.x) / 2);
  return { x: label * re, y: label * im };
}
export const multiply=(a,b)=>({x:a.x*b.x-a.y*b.y,y:a.x*b.y+a.y*b.x});
export function divide(a,b){const d=b.x*b.x+b.y*b.y;return {x:(a.x*b.x+a.y*b.y)/d,y:(a.y*b.x-a.x*b.y)/d};}
