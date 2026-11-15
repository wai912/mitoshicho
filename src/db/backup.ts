import { db, migrateLegacy, TABLES } from './db';
import { DATA_VERSION } from '../domain/types';

const FORMAT = 'mitoshicho-backup';

export async function exportJson(): Promise<string> {
  const tables: Record<string, unknown[]> = {};
  for (const t of TABLES) tables[t] = await db.table(t).toArray();
  return JSON.stringify({ format: FORMAT, version: DATA_VERSION, exportedAt: new Date().toISOString(), tables }, null, 2);
}

export async function downloadBackup(): Promise<void> {
  const json = await exportJson();
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  a.href = URL.createObjectURL(blob);
  a.download = `mitoshicho-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  await db.settings.update('app', { lastBackupAt: d.toISOString() });
}

/** バックアップで全データを置き換える */
export async function importJson(text: string): Promise<void> {
  const parsed = JSON.parse(text);
  if (parsed?.format !== FORMAT || typeof parsed.tables !== 'object') {
    throw new Error('家計の見通し帳のバックアップファイルではありません');
  }
  // 新しい版の形は読まない（古いアプリで読んで書き戻すと、新しい項目が消えるため）。版がなければ 1
  const version = typeof parsed.version === 'number' ? parsed.version : 1;
  if (version > DATA_VERSION) {
    throw new Error('新しいバージョンのアプリで作ったバックアップです。アプリをアップデートしてから読み込んでね');
  }
  const tables = { ...parsed.tables };
  if (Array.isArray(tables.entries) && Array.isArray(tables.items)) {
    const m = migrateLegacy({ items: tables.items, entries: tables.entries, records: tables.records });
    tables.entries = m.entries;
    tables.categoryActuals = [...(Array.isArray(tables.categoryActuals) ? tables.categoryActuals : []), ...m.categoryActuals];
  }
  // 以前のバッファの下限（使わなくなった値）は捨てる
  if (Array.isArray(tables.settings)) {
    tables.settings = tables.settings.map(({ bufferThreshold: _old, ...rest }: Record<string, unknown>) => rest);
  }
  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const t of TABLES) {
      await db.table(t).clear();
      const rows = tables[t];
      if (Array.isArray(rows)) await db.table(t).bulkAdd(rows);
    }
  });
}

export async function clearAll(): Promise<void> {
  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const t of TABLES) await db.table(t).clear();
  });
}
