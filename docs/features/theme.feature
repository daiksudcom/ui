# language: ja
@ui @theme @accessibility
機能: セマンティックなデザイントークンでテーマを表現する
  サイト利用者として
  環境と自分の選択に合う表示を得るために
  system、light、dark のテーマを利用したい

  背景:
    前提UI の色、余白、文字、focus は CSS custom properties で公開されている

  シナリオアウトライン: 利用者がテーマを選択する
    もしconsumer がルート要素の data-theme を "<theme>" にする
    ならばsemantic color token は "<result>" の配色を表す
    かつ読みやすいコントラストと明瞭な focus 表示を保つ

    例:
      | theme  | result                     |
      | system | OS の prefers-color-scheme |
      | light  | 明色                       |
      | dark   | 暗色                       |

  シナリオ: 動きを抑える設定を尊重する
    前提利用者が prefers-reduced-motion を有効にしている
    もしUI コンポーネントが状態を切り替える
    ならば装飾的な動きは reduced-motion token に従う

  シナリオ: consumer がブランド値を調整する
    もしconsumer が公開された semantic token を上書きする
    ならばコンポーネントは上書き後の値を一貫して使用する
