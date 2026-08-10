@ui @release @package
Feature: 検証済み UI パッケージをリリースする
  パッケージ保守者として
  consumer が同じ成果物を再現できるように
  検証済みの SemVer リリースを不変の成果物として公開したい

  Rule: 公開前にパッケージの契約と内容を検証する

    Scenario: 検証を通過したバージョンを公開する
      Given 変更内容に対応する SemVer が選択されている
      When Astro 型検査、公開エクスポート検査、意味的描画検査、tarball 内容検査が成功する
      Then "@daiksudcom/ui" は GitHub Packages に provenance 付きで公開される
      And 公開済みバージョンの成果物は不変である

    Scenario: consumer が明示的に更新する
      Given consumer は公開済みの厳密なバージョンを利用している
      When consumer が検証済みの次バージョンへ依存指定を変更する
      Then その consumer の検証とリリースだけが新しい UI 契約を採用する
