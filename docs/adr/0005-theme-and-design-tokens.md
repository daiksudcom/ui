---
type: "Architecture Decision Record"
title: "ADR 0005: テーマとデザイントークン"
description: "semantic CSS custom propertiesとdata-themeでtheme選択とsite固有調整を行うことを定める。"
resource: "https://github.com/daiksudcom/ui/blob/main/docs/adr/0005-theme-and-design-tokens.md"
tags: [ui, adr, architecture, theme, design-tokens]
timestamp: 2026-08-10T06:56:15Z
---

# ADR 0005: テーマとデザイントークン

## ステータス

承認済み

## 日付

2026-08-10

## コンテキスト

Home と Blog は視覚的一貫性を共有しつつ、system、light、dark の表示とサイト固有の調整を提供する必要がある。

## 決定

色、文字、余白、境界、focus、motion を意味ベースの CSS custom properties として公開する。consumer はルートの `data-theme` で `system`、`light`、`dark` を選択し、公開 token の上書きで調整する。

## 検討した選択肢

- コンポーネント内へ色を直接記述する構成
- ビルド時にテーマ別 CSS を生成する構成
- semantic token と data 属性を組み合わせる構成

## 結果

テーマ選択とブランド調整がコンポーネント実装から分離される。コントラスト、focus、reduced motion は token 契約の受け入れ基準になる。

## 関連文書

- [テーマ仕様](../features/theme.feature)
