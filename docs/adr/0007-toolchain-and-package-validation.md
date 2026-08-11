---
type: "Architecture Decision Record"
title: "ADR 0007: ツールチェーンとパッケージ検証"
description: "toolchainを固定し、package単体の検証をrelease条件にすることを定める。"
resource: "https://github.com/daiksudcom/ui/blob/main/docs/adr/0007-toolchain-and-package-validation.md"
tags: [ui, adr, architecture, toolchain, package-validation]
status: stable
generated:
  by: "codex/gpt-5.6-sol"
  at: 2026-08-11T21:36:04Z
---

# ADR 0007: ツールチェーンとパッケージ検証

## ステータス

承認済み

## 日付

2026-08-10

## コンテキスト

独立して公開するパッケージには、開発環境と registry に置かれる tarball の双方を再現可能に検証する基準が必要である。

## 決定

Node.js 24、pnpm 11、Astro 7、Vite+ を標準ツールチェーンとする。採用するパッチ版はマニフェストと lockfile へ正確に固定する。Cloudflare consumer の互換スモークテストには Wrangler `4.107.0` を固定する。公開は package 単体の検証を通過した成果物に限定し、現在の検証項目と公開結果は関連する振る舞い仕様を正本とする。ツール実装は Web 標準 API を基準にする。

## 検討した選択肢

- major version だけを指定する構成
- consumer の検証だけに委ねる構成
- ツールを固定し package 単体で公開前検証する構成

## 結果

同じソースから同じ package 内容を生成でき、公開前に契約違反を検出できる。依存更新と検証基準の変更は意図した変更としてレビューされる。

## 関連文書

- [UI リリース仕様](../features/ui-release.feature)
- [Home](https://github.com/daiksudcom/home)
- [Blog](https://github.com/daiksudcom/blog)
