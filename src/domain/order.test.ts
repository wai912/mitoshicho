import { describe, expect, it } from 'vitest';
import { moveOrderTo } from './order';

const list = [
  { id: 'a', sortOrder: 0 },
  { id: 'b', sortOrder: 1 },
  { id: 'c', sortOrder: 5 },
  { id: 'd', sortOrder: 7 },
];
const ids = (xs: { id: string }[] | null) => xs?.map((x) => x.id);
const all = ['a', 'b', 'c', 'd'];

describe('moveOrderTo', () => {
  it('指定した場所へ動かし、0 から振り直す', () => {
    const r = moveOrderTo(list, all, 'd', 0);
    expect(ids(r)).toEqual(['d', 'a', 'b', 'c']);
    expect(r?.map((x) => x.sortOrder)).toEqual([0, 1, 2, 3]);
    expect(ids(moveOrderTo(list, all, 'a', 2))).toEqual(['b', 'c', 'a', 'd']);
    expect(ids(moveOrderTo(list, all, 'c', 1))).toEqual(['a', 'c', 'b', 'd']);
  });

  it('動かないときは null', () => {
    expect(moveOrderTo(list, all, 'a', 0)).toBeNull();
    expect(moveOrderTo(list, all, 'a', 4)).toBeNull();
    expect(moveOrderTo(list, all, 'x', 1)).toBeNull();
  });

  it('出ていないものは元の場所のまま', () => {
    // b を出していないとき、d を先頭へ → 出ているものの場所（0・2・3）に d・a・c が入る。b は 1 のまま
    expect(ids(moveOrderTo(list, ['a', 'c', 'd'], 'd', 0))).toEqual(['d', 'b', 'a', 'c']);
  });

  it('並びの番号が同じでも、元の並びを保つ', () => {
    const same = [{ id: 'a', sortOrder: 0 }, { id: 'b', sortOrder: 0 }, { id: 'c', sortOrder: 0 }];
    expect(ids(moveOrderTo(same, ['a', 'b', 'c'], 'c', 1))).toEqual(['a', 'c', 'b']);
  });
});
