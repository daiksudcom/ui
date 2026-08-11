---
type: "Architecture Decision Record Index"
title: "Architecture Decision Records"
description: "UI packageの責務、配布、versioning、theme、公開export、validationに関する設計判断への索引である。"
resource: "https://github.com/daiksudcom/ui/blob/main/docs/adr/README.md"
tags: [ui, adr, architecture, index]
status: stable
generated:
  by: "codex/gpt-5.6-sol"
  at: 2026-08-11T21:36:04Z
---

# Architecture Decision Records

| 番号 | 決定 | ステータス | 日付 |
| --- | --- | --- | --- |
| 0001 | [リポジトリ境界](0001-repository-boundary.md) | 承認済み | 2026-08-10 |
| 0002 | [Astro コンポーネントパッケージ](0002-astro-component-package.md) | 承認済み | 2026-08-10 |
| 0003 | [GitHub Packages のパッケージ名](0003-github-package-name.md) | 承認済み | 2026-08-10 |
| 0004 | [SemVer と consumer ごとの厳密なバージョン](0004-semver-and-exact-consumer-versions.md) | 承認済み | 2026-08-10 |
| 0005 | [テーマとデザイントークン](0005-theme-and-design-tokens.md) | 承認済み | 2026-08-10 |
| 0006 | [MDX 向け明示エクスポート](0006-explicit-mdx-component-exports.md) | 承認済み | 2026-08-10 |
| 0007 | [ツールチェーンとパッケージ検証](0007-toolchain-and-package-validation.md) | 承認済み | 2026-08-10 |

各 ADR は採用した判断の背景、選択肢、トレードオフ、結果を記録します。現在の公開名、バージョン、入出力、エラー条件などの検証可能な契約は関連する振る舞い仕様を正本とし、ADR では繰り返しません。判断を変更する場合は、新しい ADR で置き換え関係を明示します。
