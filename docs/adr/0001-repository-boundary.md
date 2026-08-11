---
type: "Architecture Decision Record"
title: "ADR 0001: UI のリポジトリ境界"
description: "Astro component、CSS、design tokenをUI repositoryが所有し、独立packageとして配布することを定める。"
resource: "https://github.com/daiksudcom/ui/blob/main/docs/adr/0001-repository-boundary.md"
tags: [ui, adr, architecture, repository-boundary]
status: stable
generated:
  by: "codex/gpt-5.6-sol"
  at: 2026-08-11T21:36:04Z
---

# ADR 0001: UI のリポジトリ境界

## ステータス

承認済み

## 日付

2026-08-10

## コンテキスト

Home と Blog は表示要素を共有しながら、サイトごとに独立して検証、リリース、更新できる境界を必要とする。

## 決定

Astro コンポーネント、CSS、デザイントークンの公開契約を `ui` リポジトリが所有し、独立したバージョン付きパッケージとして配布する。配布先と公開名は [ADR 0003](0003-github-package-name.md)、consumer ごとのバージョン選択は [ADR 0004](0004-semver-and-exact-consumer-versions.md) に委ねる。

## 検討した選択肢

- 各サイトに UI を複製する構成
- Home、Blog、UI を同一リリース単位にする構成
- UI を独立したパッケージ境界にする構成

## 結果

UI の変更履歴と互換性がサイトのデプロイから分離される。Home と Blog は同時変更を必要とせず、それぞれの検証を経て個別に更新できる。

## 関連文書

- [パッケージ利用仕様](../features/package-consumption.feature)
- [ADR 0003](0003-github-package-name.md)
- [ADR 0004](0004-semver-and-exact-consumer-versions.md)
- [Home](https://github.com/daiksudcom/home)
- [Blog](https://github.com/daiksudcom/blog)
