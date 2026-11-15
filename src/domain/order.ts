/**
 * 並び替え: shown（画面に出ている順の ID）の中で id を to 番目へ動かし、all の全部に 0 からの sortOrder を振り直す。
 * 出ていないもの（アーカイブ済みを隠しているとき・ほかの種類のカテゴリ）は、元の位置のまま残す
 * （出ているものが入っていた場所に、新しい順で入れ直す）。動かないとき（見つからない・同じ場所）は null
 */
export function moveOrderTo<T extends { id: string; sortOrder: number }>(all: T[], shown: string[], id: string, to: number): T[] | null {
  const from = shown.indexOf(id);
  if (from < 0 || to < 0 || to >= shown.length || to === from) return null;
  const next = [...shown];
  next.splice(from, 1);
  next.splice(to, 0, id);
  const sorted = [...all].sort((a, b) => a.sortOrder - b.sortOrder);
  const inShown = new Set(shown);
  const byId = new Map(all.map((x) => [x.id, x]));
  let k = 0;
  const placed = sorted.map((x) => (inShown.has(x.id) ? byId.get(next[k++])! : x));
  return placed.map((x, n) => ({ ...x, sortOrder: n }));
}
