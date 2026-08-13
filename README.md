# @daiksudme/ui

`@daiksudme/ui` は、Home と Blog が利用する Astro コンポーネント、CSS、デザイントークンの公開契約を定義するリポジトリです。

## 現在の状態

公開パッケージの実装開始前の基準として、観測可能な振る舞いを Gherkin、技術的な決定を Architecture Decision Records（ADR）で確定しています。実装を開始できるよう、開発・検査・ビルドの共通ツールチェーンとリリース制御は整備済みです。リポジトリの初期バージョンは `0.1.0` ですが、`private: true` かつ公開gateが閉じている現在の状態は公開候補ではありません。

## 仕様書

- [文書の案内](docs/README.md)
- [振る舞い仕様](docs/features/README.md)
- [Architecture Decision Records](docs/adr/README.md)
- [GitHub と package release の運用](.github/README.md)

## ローカル開発

Node.js 24.16.0 以降と pnpm 11 を使います。`.nvmrc`、`package.json` の `engines`、`packageManager` が必要なバージョンを宣言しています。

```sh
pnpm install
pnpm dev
```

型検査、lint、整形確認は個別に実行できます。

```sh
pnpm check
pnpm lint
pnpm format:check
```

整形を適用するには `pnpm format`、すべての品質検査とビルドをまとめて実行するには `pnpm validate` を使います。本番用の成果物を確認する場合は、ビルド後にプレビューします。

```sh
pnpm build
pnpm preview
```

コミット件名と Pull Request タイトルには Conventional Commits 形式を使います。squash merge により Pull Request タイトルがコミット件名として履歴に残るため、**タイトルの型が必要なバージョン bump を決めます**。

```text
feat(components): add card component
fix(tokens): correct dark theme contrast
docs: describe component usage
```

Pull Request のbranch名にも変更種別を記録します。通常は `<type>/<slug>`、破壊的変更は `breaking-change/<type>/<slug>`、非推奨化は `deprecated/<type>/<slug>` を使います。`<type>` は `feat`、`fix`、`perf`、`revert`、`docs`、`refactor`、`style`、`test`、`build`、`ci`、`chore` のいずれかです。Dependabot branchだけはこの規則の対象外です。branch名はlabel付けの補助であり、バージョン判定の正本ではありません。

`pnpm install` は Husky の Git hook を準備します。commit 前には staged 済みの対応ファイルだけを整形して lint し、変更されたファイルを再度 stage します。`commit-msg` hook はコミット件名を検証します。Pull Request の CI はタイトルと含まれる全コミットを同じ規約で検証するため、`--no-verify` で省略したローカル検査も共有前に検出できます。main の通常 push では追加されたコミットを、履歴書き換えを含む non-fast-forward push では新しい HEAD から到達可能な全履歴を検証します。GitHub 形式の two-parent pull request merge commit 本体だけは検証対象から除きます。

hook と同じコマンドを個別に確認する場合は、次を使います。

```sh
pnpm lint:staged
printf '%s\n' 'chore(tooling): verify commit policy' | pnpm lint:commit
```

| ツール | 担当範囲 | 実行コマンド |
| --- | --- | --- |
| Astro | 型とAstroコンポーネントの検査 | `pnpm check` |
| Biome | JavaScript / TypeScript / JSON / CSS の整形と構文lint | `pnpm lint:biome` |
| rumdl | Markdown / MDX のlintと整形 | `pnpm lint:rumdl`、`pnpm format`、`pnpm format:check` |
| Prettier | Astro / YAML の整形 | `pnpm format`、`pnpm format:check` |
| ESLint | 型情報を使うTypeScriptとAstroの意味的検査 | `pnpm lint:eslint` |
| Stylelint | CSSとAstroの `<style>` ブロックの検査 | `pnpm lint:stylelint` |
| Knip | 未使用の依存関係、export、fileの検出 | `pnpm lint:knip` |
| commitlint | コミット件名とPull Requestタイトルの検証 | `pnpm lint:commit` |
| lint-staged | stagedファイルの整形とlint | `pnpm lint:staged` |
| node:test | release policy と workflow 不変条件の検査 | `pnpm policy:test` |

`.vscode/` には推奨拡張とformatter / lint設定があります。ほかのエディターでも `.editorconfig` と上記コマンドを使って同じ規約を適用してください。現在は公開ソースを追加する前のため、Astroの開発サーバーとビルドはツールチェーンの起動確認として動作します。

## パッケージリリース

バージョンは Pull Request タイトルの型から決まります。`feat:` と `perf:` は minor、`fix:` と `revert:` は patch、破壊的変更は major（`0.x` の間は minor）を要求し、`docs:` `chore:` `ci:` `test:` `build:` `refactor:` `style:` はバージョンを変えてはいけません。同じ Pull Request で `package.json` の SemVer core を更新します。CI の `Policy success` がこの規約を検証します。

main へ merge されると、`Release` workflow が単独で tag の作成と公開を行います。SemVer core が上がった場合は `vX.Y.Z` の annotated tag を打ち、GitHub Packages へ公開して同じ tag の GitHub Release を作ります。バージョンを変えない変更は `vX.Y.Z+YYYYMMDDHHmmss` の tag だけを打ち、公開も GitHub Release も行いません。ビルド番号は merge commit の committer 時刻を UTC 変換したもので、再実行しても同じ tag に解決されます。

公開は `PUBLISH_ENABLED` が厳密に `true` の場合だけ実行します。workflow は tag の revision を build して package 内容と clean consumer 導入を検証し、artifact attestation を発行してから公開します。同じバージョンがすでに公開されている場合、SHA-512 integrity が一致するときだけ中断した処理を継続し、異なるときは immutable violation として停止します。公開の失敗は 5xx、429、タイムアウトなどの外部要因だけを最大 3 回リトライし、build 失敗や 401 / 403 は即座に失敗します。**tag は削除も移動もしません。** 失敗した実行は同じ tag のまま `workflow_dispatch` で再開するか、新しいバージョンで fix-forward します。

公開を有効にする前に、次の条件をすべて満たします。

- package実装、public exports、`files` allowlist、license、repository metadataを完成させ、`private` を `false` にする
- `github-packages` Environmentを作成し、release workflowだけに利用を限定する
- repository variable `PUBLISH_ENABLED` を `true` にする
- `.github/settings.yml` を `gh infra plan` で確認してapplyし、GitHub UIでmerge queueを有効にする

`.github/settings.yml` はlabelとrulesetをadditiveに管理し、既存設定を削除しません。現在のgh-infra schemaはmerge queue ruleを管理しないため、queue自体はGitHub UIで有効化します。CIは `merge_group` eventへ対応済みです。運用の詳細は [GitHub と package release の運用](.github/README.md) を参照してください。

## 関連リポジトリ

- [Home](https://github.com/daiksudme/home)
- [Blog](https://github.com/daiksudme/blog)
- [Content](https://github.com/daiksudme/content)
