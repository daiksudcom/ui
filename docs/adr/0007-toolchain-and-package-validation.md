---
type: "Architecture Decision Record"
title: "ADR 0007: ツールチェーンとパッケージ検証"
description: "Node.js、pnpm、Astroと品質ツールを固定し、package単体の検証をrelease条件にすることを定める。"
resource: "https://github.com/daiksudme/ui/blob/main/docs/adr/0007-toolchain-and-package-validation.md"
tags: [ui, adr, architecture, toolchain, package-validation]
status: stable
generated:
  by: "codex/gpt-5.6-sol"
  at: 2026-08-13T00:35:00Z
---

# ADR 0007: ツールチェーンとパッケージ検証

## ステータス

承認済み

## 日付

2026-08-10

## コンテキスト

独立して公開するパッケージには、開発環境と registry に置かれる tarball の双方を再現可能に検証する基準が必要である。

## 決定

Node.js 24.16.0 以降、pnpm 11、Astro 7を標準ツールチェーンとし、pnpmを直接使って依存取得とpackage scriptの実行を行う。pnpm自体と直接依存するツールのパッチ版はマニフェストへ正確に指定し、解決結果はリポジトリ単位のlockfileへ固定する。JavaScript、TypeScript、JSON、CSSはBiome、MarkdownとMDXはrumdl、AstroとYAMLはPrettierで整形し、意味的検査はAstro、ESLint、Stylelint、rumdl、Knipへ分担する。Cloudflare consumerの互換スモークテストを実装するときはWrangler `4.107.0`を固定する。公開はpackage単体の検証を通過した成果物に限定し、現在の検証項目と公開結果は関連する振る舞い仕様を正本とする。ツール実装はWeb標準APIを基準にする。

## 検討した選択肢

- major version だけを指定する構成
- Vite+にpackage管理とscript実行を委ねる構成
- consumer の検証だけに委ねる構成
- pnpmと個別ツールを固定し、package単体で公開前検証する構成

## 結果

ローカルとCIは同じpnpm scriptを実行し、同じソースから同じpackage内容を生成できる。各ツールの責務が重ならず、公開前に型、構文、スタイル、文書、未使用コードの問題を検出できる。依存更新と検証基準の変更は意図した差分としてレビューされる。

## 関連文書

- [UI リリース仕様](../features/ui-release.feature)
- [Home](https://github.com/daiksudme/home)
- [Blog](https://github.com/daiksudme/blog)
