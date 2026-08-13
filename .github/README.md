# GitHub と package release の運用

## 操作モデル

`@daiksudme/ui` はWorkerを持たず、Deployもfeature flagも持ちません。このrepositoryで起こるproduction操作はGitHub Packagesへのpackage公開だけです。

- **Tag**: PRがmergeされるたびに必ず打つ。mainのどのrevisionが検証済みかを記録する。
- **Publish**: SemVer coreが上がったときだけ実施する。GitHub Packagesへ公開しGitHub Releaseを作る。
- **Consumer adoption**: HomeとBlogが自身の判断で厳密なversionを更新すること。**公開しただけでは誰の表示も変わりません。**

`Release` workflowはrepository全体で直列化されています。実行中runは完了させ、concurrency queueには最新のpending runだけを残します。

## Version、tag、公開の関係

PRがmergeされると、単一のRelease workflowが次を順に実行します。

1. PRタイトルの型に対して `package.json#version` が正しいかを検証し、tagを解決する
2. tagが未作成なら打ってpushする
3. SemVer coreが上がっていればbuild、pack、smoke、GitHub Packagesへの公開を行う
4. 同じtagのGitHub Releaseを作る

tag打ちと公開を別workflowに分けていないのは、`GITHUB_TOKEN` によるpushが新しいworkflow runを起動しないためです。分離するとPATが必要になります。

| PRタイトル | 必須bump | 打たれるtag | 公開 | GitHub Release |
| --- | --- | --- | --- | --- |
| `feat:` / `perf:` | minor | `vX.Y.Z` | する | 作る |
| `fix:` / `revert:` | patch | `vX.Y.Z` | する | 作る |
| breaking change | major（`0.x` の間はminor） | `vX.Y.Z` | する | 作る |
| `docs:` `chore:` `ci:` `test:` `build:` `refactor:` `style:` | なし | `vX.Y.Z+YYYYMMDDHHmmss` | しない | 作らない |

ビルド番号 `+YYYYMMDDHHmmss` はmerge commitのcommitter時刻をUTC変換したものです。実行時刻ではなくcommitの属性なので、**再実行しても同じtagになります**。これがリトライでtagを打ち直さないことを構造的に保証します。

SemVerはbuild metadataを優先順位の比較に使いません。したがって最新tagを辞書順で判定してはなりません。

## 不変条件: 公開済みversionは書き換えない

公開前に `npm view @daiksudme/ui@<version> dist.integrity` を確認します。

- 未公開: そのまま公開する
- 同じSHA-512 integrityで公開済み: 中断したreleaseの継続として扱い、不足しているmetadataだけを作る
- 異なるintegrityで公開済み: immutable violationとして停止する。**自動修復はしません。**

**tagは削除も移動もしません。** 失敗したtagはそのまま残し、外部要因なら `workflow_dispatch` で**同じtagのまま**再実行、内部要因なら新しいversionとtagでfix-forwardします。

## 公開のリトライ

外部要因と判断できる失敗だけを**最大3回**リトライします。

| 分類 | 例 | 挙動 |
| --- | --- | --- |
| 外部要因 | registryの5xx、429、タイムアウト、接続リセット、DNS解決失敗 | 指数バックオフで最大3回 |
| 内部要因 | build失敗、test失敗、version不一致、401/403、429以外の4xx | 即座にfailしfix-forward |

リトライは公開のみを再試行し、tagには触れません。

## Branchとlabel

versionへの影響は**PRタイトル**から決まります。squash mergeによりタイトルがcommit件名として履歴に残るためです。branch名はlabel付けの補助にのみ使います。

Dependabot branchだけはbranch規約を免除します。Labelerは `pull_request_target` でbase側の設定だけをAPIから読み、PRコードをcheckoutしません。

## Workflow

| Workflow | 契機 | 役割 |
| --- | --- | --- |
| `ci.yml` の `Policy success` | PR、merge queue、mainへのpush | policy testと、PRタイトルに対するversion bumpの検証 |
| `ci.yml` の `CI success` | PR、merge queue、mainへのpush | commit規約、整形、lint、型検査、ビルド |
| `release.yml` | mainへのpush、`workflow_dispatch` | tagの作成と、coreが上がったときの公開 |
| `labeler.yml` | `pull_request_target` | branch名と変更pathからのlabel付与 |

`.github/scripts/` の役割は次のとおりです。

| Script | 役割 |
| --- | --- |
| `policy-lib.mjs` | version影響、必要bump、tag解決、失敗分類、公開済みdigestの判定 |
| `policy.mjs` | `pull-request` でPRを検証し、`revision` で `{tag, version, coreChanged}` を出力する |
| `publish-package.mjs` | digestの照合と、外部要因だけを最大3回リトライする公開 |
| `package-smoke.mjs` | tarball内容と clean consumer 導入の検査 |
| `*.test.mjs` | 上記とworkflow、labeler設定の不変条件のtest |

## 初期設定

公開は初期状態で停止します。次の順序で有効化します。

1. この変更をmergeし、`CI success` と `Policy success` のcheck名をGitHubへ登録する。
2. `gh infra validate .github/settings.yml` と `gh infra plan .github/settings.yml` をreviewしてからapplyする。labelとrulesetはadditive reconciliationなので、未宣言の既存設定を削除しない。
3. merge queueを有効化しsquashを選択する。**同時mergeによるversion衝突はmerge queueの再検証だけが防げます。**
4. package実装、public exports、`files` allowlist、license、repository metadataを完成させ、`private` を `false` にする。
5. reviewerを追加しない `github-packages` Environmentを作る。PRのmergeを公開承認として扱う。
6. `PUBLISH_ENABLED=true` にする。

Repository variables:

| 名前 | 用途 |
| --- | --- |
| `PUBLISH_ENABLED` | `true` のときだけpackageを公開する。`false` でもtagは打たれる |

Environment:

| Environment | 用途 | 権限 |
| --- | --- | --- |
| `github-packages` | 公開jobの実行範囲 | `packages: write`、`contents: write`、`id-token: write`、`attestations: write` |

公開には `GITHUB_TOKEN` だけを使い、追加のregistry secretは持ちません。GitHub workflowのdefault permissionはreadで、すべてのthird-party ActionはfullのcommitSHAで固定します。`v*` tagはGitHub Actionsだけが作成できます。

## 関連文書

- [ADR 0009: Labeler と package release](../docs/adr/0009-labeler-and-package-release.md)
- [UI リリース仕様](../docs/features/ui-release.feature)
