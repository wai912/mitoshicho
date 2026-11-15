import { describe, expect, it } from 'vitest';
import { moveOrder } from './order';

const list = [
  { id: 'a', sortOrder: 0 },
  { id: 'b', sortOrder: 1 },
  { id: 'c', sortOrder: 5 },
  { id: 'd', sortOrder: 7 },
];
const ids = (xs: { id: string }[] | null) => xs?.map((x) => x.id);

describe('moveOrder', () => {
  it('1つ上・下へ動かし、0 から振り直す', () => {
    const up = moveOrder(list, ['a', 'b', 'c', 'd'], 'c', -1);
    expect(ids(up)).toEqual(['a', 'c', 'b', 'd']);
    expect(up?.map((x) => x.sortOrder)).toEqual([0, 1, 2, 3]);
    expect(ids(moveOrder(list, ['a', 'b', 'c', 'd'], 'a', 1))).toEqual(['b', 'a', 'c', 'd']);
  });

  it('端からは動かせない', () => {
    expect(moveOrder(list, ['a', 'b', 'c', 'd'], 'a', -1)).toBeNull();
    expect(moveOrder(list, ['a', 'b', 'c', 'd'], 'd', 1)).toBeNull();
    expect(moveOrder(list, ['a', 'b'], 'x', 1)).toBeNull();
  });

  it('出ていないものは飛ばして、となりの出ているものと入れかえる', () => {
    // b を隠しているとき、c を上へ → a と入れかわる。b の位置はそのまま
    expect(ids(moveOrder(list, ['a', 'c', 'd'], 'c', -1))).toEqual(['c', 'b', 'a', 'd']);
  });

  it('並びの番号が同じでも、元の並びを保つ', () => {
    const same = [{ id: 'a', sortOrder: 0 }, { id: 'b', sortOrder: 0 }, { id: 'c', sortOrder: 0 }];
    expect(ids(moveOrder(same, ['a', 'b', 'c'], 'c', -1))).toEqual(['a', 'c', 'b']);
  });
});
