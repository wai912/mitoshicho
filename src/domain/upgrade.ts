import type { Category } from './types';

/**
 * 古い版のデータを今の形に直す（バックアップの復元と、ブラウザの中のデータの移行で使う）。iOS 版の
 * Backup.appData(from:)・RowCoding.upgrade と同じ直し方。
 *
 * - 1 → 2（2026-11-15）: カテゴリの種類「返済」（debt）をなくし、支出（expense）にする
 */
export function upgradeCategory<T extends Pick<Category, 'kind'> | { kind: string }>(c: T, fromVersion: number): T {
  if (fromVersion < 2 && c.kind === 'debt') return { ...c, kind: 'expense' };
  return c;
}
