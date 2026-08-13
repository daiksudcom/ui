---
type: "Documentation Index"
title: "文書"
description: "UI packageの受け入れ基準となる振る舞い仕様と技術判断への入口を提供する。"
resource: "https://github.com/daiksudme/ui/blob/main/docs/README.md"
tags: [ui, documentation, index]
status: stable
generated:
  by: "codex/gpt-5.6-sol"
  at: 2026-08-13T00:35:00Z
---

# 文書

このディレクトリは `@daiksudme/ui` の受け入れ基準と、実装を拘束する技術判断を管理します。

## 文書の責務

- [振る舞い仕様](features/README.md)は、現在有効な、利用者と consumer から観測・検証できる契約の正本です。公開名、バージョン、入出力、エラー条件、境界例を Gherkin で定義します。
- [Architecture Decision Records](adr/README.md)は、技術的判断の背景、採用理由、代替案、トレードオフ、結果を記録します。受け入れ条件を繰り返さず、対応する振る舞い仕様を参照します。

観測可能な契約について両者の記述が異なる場合は、振る舞い仕様を現在の仕様として扱います。判断を変更する場合は新しい ADR で置き換え、現在の契約も変わる場合は対応する振る舞い仕様を更新します。

Home と Blog は、それぞれが選択した厳密なパッケージバージョンの公開契約を基準に実装します。
