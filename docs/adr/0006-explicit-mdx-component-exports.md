---
type: "Architecture Decision Record"
title: "ADR 0006: MDX 向け明示エクスポート"
description: "MDXで使うAstro componentへ安定した個別public exportを設け、記事側で明示importすることを定める。"
resource: "https://github.com/daiksudcom/ui/blob/main/docs/adr/0006-explicit-mdx-component-exports.md"
tags: [ui, adr, architecture, mdx, component-exports]
status: stable
generated:
  by: "codex/gpt-5.6-sol"
  at: 2026-08-10T07:07:01Z
---

# ADR 0006: MDX 向け明示エクスポート

## ステータス

承認済み

## 日付

2026-08-10

## コンテキスト

記事ソースから依存コンポーネントを読み取れ、ビルド時に存在と型を検証できる契約が必要である。

## 決定

MDX で利用可能な各 Astro コンポーネントに安定した個別の public export を設ける。記事は使用する export を MDX 冒頭で明示的に import し、Content のビルドが静的 HTML へ解決する。

## 検討した選択肢

- MDX へのグローバル登録
- ビルドプラグインによる自動 import
- ソース上の明示 import と個別 export

## 結果

記事ごとの依存関係が明瞭になり、export の変更を型検査とビルドで検出できる。コンポーネント追加は public export とアクセシビリティ契約の追加を伴う。

## 関連文書

- [MDX コンポーネント仕様](../features/mdx-component.feature)
- [Content](https://github.com/daiksudcom/content)
