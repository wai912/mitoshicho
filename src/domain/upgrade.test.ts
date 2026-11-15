import { describe, expect, it } from 'vitest';
import { upgradeCategory } from './upgrade';

describe('古い版のデータを直す', () => {
  it('版 1 の「返済」は支出にする', () => {
    expect(upgradeCategory({ id: 'x', name: 'ローン', kind: 'debt', sortOrder: 0, archived: false }, 1).kind).toBe('expense');
    expect(upgradeCategory({ id: 'x', name: '食費', kind: 'expense', sortOrder: 0, archived: false }, 1).kind).toBe('expense');
    expect(upgradeCategory({ id: 'x', name: '給料', kind: 'income', sortOrder: 0, archived: false }, 1).kind).toBe('income');
  });

  it('版 2 のデータはそのまま', () => {
    const c = { id: 'x', name: '食費', kind: 'expense', sortOrder: 0, archived: false } as const;
    expect(upgradeCategory(c, 2)).toBe(c);
  });
});
