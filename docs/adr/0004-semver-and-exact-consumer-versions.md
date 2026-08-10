---
type: "Architecture Decision Record"
title: "ADR 0004: SemVer と consumer ごとの厳密なバージョン"
description: "UI packageをSemVerで公開し、HomeとBlogが検証済みの厳密なversionを個別に固定することを定める。"
resource: "https://github.com/daiksudcom/ui/blob/main/docs/adr/0004-semver-and-exact-consumer-versions.md"
tags: [ui, adr, architecture, semver, exact-consumer-versions]
timestamp: 2026-08-10T06:56:15Z
---

# ADR 0004: SemVer と consumer ごとの厳密なバージョン

## ステータス

承認済み

## 日付

2026-08-10

## コンテキスト

Home と Blog は独立した変更・ビルド・デプロイ単位であり、同じ日に同じ UI バージョンへ移行する保証を持たない。

## 決定

`@daiksudcom/ui` は SemVer で公開する。Home と Blog は範囲指定ではなく厳密なバージョンを記録し、それぞれの受け入れ検証を経て個別に更新する。公開済み成果物は不変とする。

## 検討した選択肢

- 常に最新バージョンを解決する構成
- 両サイトで単一の固定バージョンを共有する構成
- consumer ごとに厳密なバージョンを固定する構成

## 結果

サイト間の段階的な移行が可能になり、再ビルド時の依存解決も再現できる。互換性を破る変更は major version に反映される。

## 関連文書

- [パッケージ利用仕様](../features/package-consumption.feature)
- [UI リリース仕様](../features/ui-release.feature)
