# language: ja
@ui @package @release
機能: UI パッケージを独立したバージョンで利用する
  Home と Blog の保守者として
  各サイトに適した UI 契約を選択するために
  GitHub Packages から厳密なバージョンを導入したい

  ルール: 公開パッケージは再現可能な利用契約を提供する

    シナリオ: 公開エクスポートを導入する
      前提GitHub Packages に "@daiksudcom/ui" のバージョン "2.3.1" が公開されている
      もし利用者が "@daiksudcom/ui@2.3.1" を導入する
      ならばAstro コンポーネントの型付き公開エクスポートを利用できる
      かつCSS エントリーポイントを利用できる
      かつパッケージの provenance から公開元とビルドを検証できる

    シナリオ: Home と Blog が異なるバージョンを選択する
      前提Home は "@daiksudcom/ui@2.3.1" を厳密に指定している
      かつBlog は "@daiksudcom/ui@2.4.0" を厳密に指定している
      もしBlog が自身の依存関係だけを更新する
      ならばHome の解決バージョンは "2.3.1" のままである
      かつBlog の解決バージョンは "2.4.0" である
