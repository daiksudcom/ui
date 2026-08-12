# @daiksudcom/ui

`@daiksudcom/ui` は、Home と Blog が利用する Astro コンポーネント、CSS、デザイントークンの公開契約を定義するリポジトリです。

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

| ツール | 担当範囲 | 実行コマンド |
| --- | --- | --- |
| Astro | 型とAstroコンポーネントの検査 | `pnpm check` |
| Biome | JavaScript / TypeScript / JSON / CSS の整形と構文lint | `pnpm lint:biome` |
| rumdl | Markdown / MDX のlintと整形 | `pnpm lint:rumdl`、`pnpm format`、`pnpm format:check` |
| Prettier | Astro / YAML の整形 | `pnpm format`、`pnpm format:check` |
| ESLint | 型情報を使うTypeScriptとAstroの意味的検査 | `pnpm lint:eslint` |
| Stylelint | CSSとAstroの `<style>` ブロックの検査 | `pnpm lint:stylelint` |
| Knip | 未使用の依存関係、export、fileの検出 | `pnpm lint:knip` |

`.vscode/` には推奨拡張とformatter / lint設定があります。ほかのエディターでも `.editorconfig` と上記コマンドを使って同じ規約を適用してください。現在は公開ソースを追加する前のため、Astroの開発サーバーとビルドはツールチェーンの起動確認として動作します。

## 関連リポジトリ

- [Home](https://github.com/daiksudcom/home)
- [Blog](https://github.com/daiksudcom/blog)
- [Content](https://github.com/daiksudcom/content)
