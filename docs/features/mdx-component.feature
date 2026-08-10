# language: ja
@ui @mdx @accessibility
機能: UI コンポーネントを MDX から明示的に利用する
  記事の著者として
  依存する表示要素をソースから判別できるように
  使用する Astro コンポーネントを明示的に import したい

  ルール: 各コンポーネントは独立した公開エクスポートと意味的契約を持つ

    シナリオ: MDX がコンポーネントを描画する
      前提MDX が "@daiksudcom/ui/components/Callout" から Callout を import している
      もしContent のビルドが MDX をコンパイルする
      ならばCallout は静的 HTML に描画される
      かつブラウザーへ見出しと本文の意味的な構造が渡される
      かつコンポーネントのアクセシビリティ契約が満たされる

    シナリオ: 公開エクスポート単位で依存を選ぶ
      前提パッケージが Callout と Figure を個別に公開している
      もしMDX が Figure だけを明示的に import する
      ならばMDX の依存関係には Figure の公開エクスポートが現れる
