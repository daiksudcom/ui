# ADR 0002: Astro コンポーネントパッケージ

## ステータス

承認済み

## 日付

2026-08-10

## コンテキスト

Home と Blog は Astro で構築され、記事の MDX もビルド時に静的 HTML へ解決される。共有 UI はこの描画モデルと型検査に直接適合する必要がある。

## 決定

公開コンポーネントを `.astro` ファイルとして実装し、Astro の型情報と CSS をパッケージ契約に含める。コンポーネントは意味的な静的 HTML を生成し、対話性は Web 標準 API と段階的拡張で表現する。

## 検討した選択肢

- Astro コンポーネントを公開する構成
- HTML テンプレート断片を公開する構成
- ブラウザー UI ランタイムをパッケージ契約に含める構成

## 結果

consumer は Astro のコンパイル、型検査、CSS 処理を一貫して利用でき、配信 HTML の意味構造を検証できる。

## 関連文書

- [MDX コンポーネント仕様](../features/mdx-component.feature)
- [ADR 0006](0006-explicit-mdx-component-exports.md)
