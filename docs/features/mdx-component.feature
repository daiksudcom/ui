@ui @mdx @accessibility
Feature: UI コンポーネントを MDX から明示的に利用する
  記事の著者として
  依存する表示要素をソースから判別できるように
  使用する Astro コンポーネントを明示的に import したい

  Rule: 各コンポーネントは独立した公開エクスポートと意味的契約を持つ

    Scenario: MDX がコンポーネントを描画する
      Given MDX が "@daiksudme/ui/components/Callout" から Callout を import している
      When Content のビルドが MDX をコンパイルする
      Then Callout は静的 HTML に描画される
      And ブラウザーへ見出しと本文の意味的な構造が渡される
      And コンポーネントのアクセシビリティ契約が満たされる

    Scenario: 公開エクスポート単位で依存を選ぶ
      Given パッケージが Callout と Figure を個別に公開している
      When MDX が Figure だけを明示的に import する
      Then MDX の依存関係には Figure の公開エクスポートが現れる
