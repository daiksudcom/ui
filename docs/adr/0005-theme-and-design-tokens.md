---
type: "Architecture Decision Record"
title: "ADR 0005: テーマとデザイントークン"
description: "semantic CSS custom propertiesとdata-themeでtheme選択とsite固有調整を行うことを定める。"
resource: "https://github.com/daiksudme/ui/blob/main/docs/adr/0005-theme-and-design-tokens.md"
tags: [ui, adr, architecture, theme, design-tokens]
status: stable
generated:
  by: "codex/gpt-5.6-sol"
  at: 2026-08-13T00:35:00Z
---

# ADR 0005: テーマとデザイントークン

## ステータス

承認済み

## 日付

2026-08-10

## コンテキスト

Home と Blog は視覚的一貫性を共有しつつ、利用者環境に応じた複数の配色とサイト固有の調整を提供する必要がある。

## 決定

意味ベースの CSS custom properties をテーマの公開境界とし、ルート要素の data 属性でテーマを選択する。サイト固有の調整は公開 token の上書きに限定する。対応するテーマ値、アクセシビリティ条件、上書き結果は関連する振る舞い仕様を正本とする。

## 検討した選択肢

- コンポーネント内へ色を直接記述する構成
- ビルド時にテーマ別 CSS を生成する構成
- semantic token と data 属性を組み合わせる構成

## 結果

テーマ選択とブランド調整がコンポーネント実装から分離される。公開 token の互換性を維持する責務が生じる。

## 関連文書

- [テーマ仕様](../features/theme.feature)
