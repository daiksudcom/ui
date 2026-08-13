---
type: "Architecture Decision Record"
title: "ADR 0003: GitHub Packages のパッケージ名"
description: "共有UIをdaiksudme scopeのUI packageとして命名し、GitHub Packagesへ公開することを定める。"
resource: "https://github.com/daiksudme/ui/blob/main/docs/adr/0003-github-package-name.md"
tags: [ui, adr, architecture, github-packages, package-name]
status: stable
generated:
  by: "codex/gpt-5.6-sol"
  at: 2026-08-13T00:35:00Z
---

# ADR 0003: GitHub Packages のパッケージ名

## ステータス

承認済み

## 日付

2026-08-10

## コンテキスト

共有 UI には、所有組織と責務が明確で、Home と Blog から同じ方法で取得できる配布単位が必要である。

## 決定

パッケージ名を `@daiksudme/ui` とし、`daiksudme/ui` を配布元として GitHub Packages に provenance 付きで公開する。

## 検討した選択肢

- GitHub Packages の組織スコープ
- 公開 npm registry の組織スコープ
- Git URL を直接依存にする配布

## 結果

パッケージの所有者、ソース、成果物を一つの GitHub 組織で追跡できる。consumer は認証済み registry と厳密なバージョンで取得する。

## 関連文書

- [パッケージ利用仕様](../features/package-consumption.feature)
- [UI リリース仕様](../features/ui-release.feature)
