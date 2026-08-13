@ui @package @release
Feature: UI パッケージを独立したバージョンで利用する
  Home と Blog の保守者として
  各サイトに適した UI 契約を選択するために
  GitHub Packages から厳密なバージョンを導入したい

  Rule: 公開パッケージは再現可能な利用契約を提供する

    Scenario: 公開エクスポートを導入する
      Given GitHub Packages に "@daiksudme/ui" のバージョン "2.3.1" が公開されている
      When 利用者が "@daiksudme/ui@2.3.1" を導入する
      Then Astro コンポーネントの型付き公開エクスポートを利用できる
      And CSS エントリーポイントを利用できる
      And パッケージの provenance から公開元とビルドを検証できる

    Scenario: Home と Blog が異なるバージョンを選択する
      Given Home は "@daiksudme/ui@2.3.1" を厳密に指定している
      And Blog は "@daiksudme/ui@2.4.0" を厳密に指定している
      When Blog が自身の依存関係だけを更新する
      Then Home の解決バージョンは "2.3.1" のままである
      And Blog の解決バージョンは "2.4.0" である
