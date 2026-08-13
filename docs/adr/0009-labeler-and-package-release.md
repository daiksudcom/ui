---
type: "Architecture Decision Record"
title: "ADR 0009: Labeler と package release"
description: "PRタイトルからversion bumpを強制し、merge時に打たれるtagを起点としてUI packageを安全かつ再開可能に公開することを定める。"
resource: "https://github.com/daiksudme/ui/blob/main/docs/adr/0009-labeler-and-package-release.md"
tags: [ui, adr, architecture, github-actions, labeler, release]
status: stable
generated:
  by: "codex/gpt-5.6-sol"
  at: 2026-08-13T08:30:00Z
---

# ADR 0009: Labeler と package release

## ステータス

承認済み

## 日付

2026-08-13

## コンテキスト

Pull Requestの分類、SemVerへの影響、release noteの表示を一貫させる必要がある。一方、GitHub labelは後から変更できるため、公開versionを決める信頼できる入力にはできない。package公開はregistry、tag、GitHub Releaseという複数の外部状態を変更するため、途中失敗から安全に再開できなければならない。

当初は `.github/releases/vX.Y.Z.json` のimmutable descriptorを公開の起点にしていた。しかしこの方式は実装PRとrelease準備PRという二段階のmergeを要求し、mainの状態とは別にrelease chainという状態を保守する必要があった。descriptorの `kind` は型の宣言だけで振る舞いを持たず、`smoke` は常に `["package", "consumer"]` を要求する一方でworkflowは両方を無条件に実行していた。さらにworkflowは存在しない `.github/releases/` を読んでいた。

tag打ちと公開を別workflowへ分ける案は採れない。`GITHUB_TOKEN` によるpushは新しいworkflow runを起動しないため、分離するとPATが必要になる。

## 決定

versionへの影響はPull Requestタイトルのconventional commit typeから決まる。squash mergeによりタイトルがcommit件名として履歴へ残るためである。`feat:` と `perf:` はminor、`fix:` と `revert:` はpatch、breaking changeはmajor（`0.x` の間はminor）を要求し、`docs:` `chore:` `ci:` `test:` `build:` `refactor:` `style:` はversionを変えてはならない。CIの `policy` jobがこの規約を検証する。

release descriptorは廃止する。`.github/release.schema.json` と `.github/releases/` の契約を削除し、公開はmergeによって打たれるtagから駆動する。mainへのmerge時、単一のRelease workflowがrevisionからtagを解決し、tagが未作成なら作成する。SemVer coreが上がっていればGitHub Packagesへ公開してGitHub Releaseを作り、上がっていなければ `vX.Y.Z+YYYYMMDDHHmmss` のtagだけを打って公開もReleaseも行わない。build識別子はmerge commitのcommitter時刻をUTC変換したものであり、実行時刻ではなくcommitの属性なので再実行しても同じtagになる。

公開は外部要因と判断できる失敗だけを最大3回リトライする。5xx、429、タイムアウト、接続リセット、DNS解決失敗が対象であり、build失敗、test失敗、401/403、429以外の4xxは即座にfailする。リトライはtagを打ち直さない。公開済みversionはimmutableであり、同一SHA-512 integrityなら中断したreleaseの継続として扱い、異なるintegrityならimmutable violationとして停止する。

変更分類の補助としてbranch名を使い、labelerはその分類をlabelへ反映する。labelはrelease noteの表示に使い、version判定の正本にはしない。GitHub上のlabel定義とrulesetは `.github/settings.yml` からgh-infraのadditive modeで管理する。repository variable `PUBLISH_ENABLED` が厳密に `true` でなければ公開しない。

## 検討した選択肢

- main上のimmutable descriptorを公開の起点にする
- GitHub labelからversionを計算する
- tag作成workflowと公開workflowを分離する
- `workflow_dispatch` だけでpackageを公開する
- PRタイトルからversion bumpを強制し、merge時のtagから公開する

## 結果

公開に必要な状態はmainの履歴とtagだけになり、release準備PRとrelease chainの保守がなくなる。実装PRのタイトルがそのままversionの根拠になるため、意図と結果の乖離が起きない。versionを変えない変更もtagで記録されるため、mainのどのrevisionが検証済みかを追跡できる。

tagは削除も移動もしない。失敗した実行はfix-forwardで解消し、外部要因であれば `workflow_dispatch` で同じtagのまま再実行する。SemVerはbuild metadataを優先順位の比較に使わないため、最新tagを辞書順で判定してはならない。

policy検査は独立したworkflowではなくCIの `policy` jobとして実行し、merge queueが要求するcheckを `CI success` と `Policy success` の2つに保つ。merge queue自体は現在のgh-infra schemaでは管理できないためGitHub UIで有効化する。

## 関連文書

- [UI リリース仕様](../features/ui-release.feature)
- [パッケージ利用](../features/package-consumption.feature)
- [SemVer と consumer ごとの厳密なバージョン](0004-semver-and-exact-consumer-versions.md)
- [ツールチェーンとパッケージ検証](0007-toolchain-and-package-validation.md)
