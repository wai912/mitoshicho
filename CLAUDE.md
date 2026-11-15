# 開発メモ（Claude 向け）

- やりとりは日本語。説明は短く、決めてほしいことは番号付きの質問で示す。ユーザーは見てから決めたい
- 変更の進め方は `.claude/skills/change-flow`（実装 → スクリーンショットと試用版で見せる → OK のあと PR を squash で main へ）。main への反映で GitHub Pages に出る
- この Web 版は iOS 版（wai912/mitoshicho-ios）の仕様の正。画面と `src/domain/` を変えたら、iOS 版にも移す
- 資料は必要なところだけ grep で読む。全文は判断に迷ったときだけ
  - 考え方: `docs/concept.md`（一言でいうと「ざっくり計画して、ちゃんと振り返って、使い方を良くしていく」。細かく管理しない）
  - 使う人: `docs/personas.md`（メインは A。迷ったら A を優先）
  - 画面の仕様: `docs/design.md`、決まったことの一覧: `docs/HANDOFF.md` の2章

## 構成とコマンド

Vite + React 19 + TypeScript + MUI v7 + Dexie（IndexedDB）。静的配布、データは端末内のみ。

```sh
npm ci
npm run typecheck && npm test && npm run build
npm run build:artifact   # 試用版（claude.ai の Artifact）用の1ファイル版
```

## コードの地図

| 場所 | 中身 |
|---|---|
| `src/domain/` | 計算（純粋関数とテスト）: 月の期間 `period`、予算・カード請求 `cashflow`、ずれ `review`、給料日 `payday`、型 `types` |
| `src/db/` | Dexie のスキーマ・操作 `ops`・バックアップ `backup`・サンプルデータ `sample` |
| `src/features/` | 画面: home（ホーム・給料日）、plan、review、budget/parts（計画とふりかえりの共通部品）、welcome（ウォークスルー・案内）、receivables、settings |
| `src/components/` | 金額入力（式を計算）、月の切り替え、確認ダイアログ、メニュー、狐のイラスト |
| `src/theme.ts` | 色のトークン。直書きしない |

## 注意

- 個人情報（実際の金額、カード名・借入先・収入元の名前）をコード・テスト・コミットに入れない。テストとサンプルは架空の値
- ダークの背景は黒に近い無彩色（茶色っぽくしない）。ホーム上部の帯だけはダークでもオレンジ（`#e98b1d`）
- データの形を変えるときは、版（バックアップの `version`）を上げ、`src/db/backup.ts` に古い版から直す方法を書く。iOS 版の `DataVersion` とそろえる
- 画面の切り替えは `#home` 形式のハッシュ。`window.confirm()` は Artifact 内で使えないので `confirmDialog` を使う
- このコンテナからは github.io に届かない。デプロイの結果は Actions で見る
- `vitest@4` は依存解決が失敗するので `vitest@3`
