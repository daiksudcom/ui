@ui @theme @accessibility
Feature: セマンティックなデザイントークンでテーマを表現する
  サイト利用者として
  環境と自分の選択に合う表示を得るために
  system、light、dark のテーマを利用したい

  Background:
    Given UI の色、余白、文字、focus は CSS custom properties で公開されている

  Scenario Outline: 利用者がテーマを選択する
    When consumer がルート要素の data-theme を "<theme>" にする
    Then semantic color token は "<result>" の配色を表す
    And 読みやすいコントラストと明瞭な focus 表示を保つ

    Examples:
      | theme  | result                     |
      | system | OS の prefers-color-scheme |
      | light  | 明色                       |
      | dark   | 暗色                       |

  Scenario: 動きを抑える設定を尊重する
    Given 利用者が prefers-reduced-motion を有効にしている
    When UI コンポーネントが状態を切り替える
    Then 装飾的な動きは reduced-motion token に従う

  Scenario: consumer がブランド値を調整する
    When consumer が公開された semantic token を上書きする
    Then コンポーネントは上書き後の値を一貫して使用する
