---
type: "Architecture Decision Record"
title: "ADR 0008: Git コミット品質ゲート"
description: "Conventional Commits、Git hook、CIによってコミットとPull Requestの品質を検証する。"
resource: "https://github.com/daiksudme/ui/blob/main/docs/adr/0008-git-commit-quality-gates.md"
tags: [ui, adr, architecture, git, quality-gate]
status: stable
generated:
  by: "codex/gpt-5.6-sol"
  at: 2026-08-13T00:35:00Z
---

# ADR 0008: Git コミット品質ゲート

## ステータス

承認済み

## 日付

2026-08-13

## コンテキスト

リポジトリ全体の品質検査は整備されているが、コミット直前の局所的な検査とコミット件名の規約は自動化されていない。ローカル hook は省略できるため、Pull Request と main の履歴でも同じ規約を検証する必要がある。

## 決定

コミット件名と Pull Request タイトルには Conventional Commits を採用し、commitlint で検証する。Husky の `pre-commit` hook は lint-staged を実行し、staged 済みファイルを担当 tool で整形してから lint する。`commit-msg` hook は作成中のコミット件名を検証する。CI は Pull Request タイトル、Pull Request に含まれる全コミット、main へ追加されたコミットを検証する。main の履歴が non-fast-forward push で置き換えられた場合は、新しい HEAD から到達可能な全履歴を検証する。GitHub 形式の件名と two-parent topology を持つ Pull Request merge commit 本体だけは、検証済みタイトルを含む merge metadata として除外する。

staged ファイルの検査は高速な局所フィードバックに限定する。リポジトリ全体の整形確認、lint、型検査、未使用検査、build は既存の CI 品質ゲートを正本とする。

## 検討した選択肢

- 開発者の運用だけでコミット規約を維持する構成
- Git hook だけで規約と品質を検証する構成
- Pull Request タイトルだけを検証し、個々のコミットは許容する構成
- Git hook と CI の両方でタイトルと全コミットを検証する構成

## 結果

コミット前に対象ファイルへ短いフィードバックを返し、整形済みの内容だけを stage できる。ローカル hook を省略したコミットも CI が検出する。Pull Request タイトルも規約に含めるため、squash merge 後の履歴を同じ形式に保てる。完全な品質保証は引き続き CI の全体検証に依存する。

## 関連文書

- [ADR 0007: ツールチェーンとパッケージ検証](0007-toolchain-and-package-validation.md)
