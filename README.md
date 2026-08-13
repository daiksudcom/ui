# @daiksudme/ui

`@daiksudme/ui` は、Home と Blog が利用する Astro コンポーネント、CSS、デザイントークンの公開契約を定義するリポジトリです。

## 現在の状態

公開パッケージの実装開始前の基準として、観測可能な振る舞いを Gherkin、技術的な決定を Architecture Decision Records（ADR）で確定しています。実装を開始できるよう、開発・検査・ビルドの共通ツールチェーンは整備済みです。

## 仕様書

- [文書の案内](docs/README.md)
- [振る舞い仕様](docs/features/README.md)
- [Architecture Decision Records](docs/adr/README.md)

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

コミット件名と Pull Request タイトルには Conventional Commits 形式を使います。

```text
feat(components): add card component
fix(tokens): correct dark theme contrast
docs: describe component usage
```

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

`.vscode/` には推奨拡張とformatter / lint設定があります。ほかのエディターでも `.editorconfig` と上記コマンドを使って同じ規約を適用してください。現在は公開ソースを追加する前のため、Astroの開発サーバーとビルドはツールチェーンの起動確認として動作します。

## 関連リポジトリ

- [Home](https://github.com/daiksudme/home)
- [Blog](https://github.com/daiksudme/blog)
- [Content](https://github.com/daiksudme/content)
