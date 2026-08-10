# ADR 0001: UI のリポジトリ境界

## ステータス

承認済み

## 日付

2026-08-10

## コンテキスト

Home と Blog は表示要素を共有しながら、サイトごとに独立して検証、リリース、更新できる境界を必要とする。

## 決定

Astro コンポーネント、CSS、デザイントークンの公開契約を `ui` リポジトリが所有する。成果物は `@daiksudcom/ui` として公開し、各 consumer は選択したバージョンだけに依存する。

## 検討した選択肢

- 各サイトに UI を複製する構成
- Home、Blog、UI を同一リリース単位にする構成
- UI を独立したパッケージ境界にする構成

## 結果

UI の変更履歴と互換性がサイトのデプロイから分離される。Home と Blog は必要な時点で個別に更新できる。

## 関連文書

- [パッケージ利用仕様](../features/package-consumption.feature)
- [Home](https://github.com/daiksudcom/home)
- [Blog](https://github.com/daiksudcom/blog)
