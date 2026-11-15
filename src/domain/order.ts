/**
 * 並び替え: shown（画面に出ている順）の中で id を1つ上（-1）か下（+1）へ動かし、
 * all の全部に 0 からの sortOrder を振り直す。出ていないもの（アーカイブ済みを隠しているときなど）は、元の位置関係のまま残す。
 * 動かせないとき（端・見つからない）は null
 */
export function moveOrder<T extends { id: string; sortOrder: number }>(all: T[], shown: string[], id: string, dir: -1 | 1): T[] | null {
  const i = shown.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= shown.length) return null;
  const sorted = [...all].sort((a, b) => a.sortOrder - b.sortOrder);
  const a = sorted.findIndex((x) => x.id === id);
  const b = sorted.findIndex((x) => x.id === shown[j]);
  if (a < 0 || b < 0) return null;
  [sorted[a], sorted[b]] = [sorted[b], sorted[a]];
  return sorted.map((x, n) => ({ ...x, sortOrder: n }));
}
