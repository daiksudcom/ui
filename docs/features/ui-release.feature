@ui @release @package
Feature: 検証済み UI パッケージをリリースする
  パッケージ保守者として
  consumer が同じ成果物を再現できるように
  検証済みの SemVer リリースを不変の成果物として公開したい

  Rule: バージョンは Pull Request タイトルから決まる

    Scenario Outline: タイトルの型が必要な bump を決める
      Given main の現在のバージョンは "0.1.0" である
      When Pull Request タイトルが "<title>" である
      Then 必要なバージョンは "<version>" である
      And ほかのバージョンでは policy 検査が失敗する

      Examples:
        | title                        | version |
        | feat: add card               | 0.2.0   |
        | perf: shrink tokens          | 0.2.0   |
        | fix: correct contrast        | 0.1.1   |
        | revert: undo card export     | 0.1.1   |
        | feat!: drop the legacy token | 0.2.0   |
        | docs: describe usage         | 0.1.0   |
        | chore: update metadata       | 0.1.0   |

  Rule: merge で打たれる tag が公開を駆動する

    Scenario: バージョンを上げた変更を公開する
      Given package 公開が明示的に有効化されている
      When SemVer core を上げた Pull Request が main へ squash merge される
      And 整形検査、lint、policy test、Astro 型検査、ビルド、tarball 内容検査、clean consumer 導入検査が成功する
      Then merge commit へ annotated tag "vX.Y.Z" が作成される
      And "@daiksudme/ui" は GitHub Packages に公開される
      And package tarball の GitHub artifact attestation が記録される
      And 同じ tag の immutable GitHub Release が作成される

    Scenario: バージョンを変えない変更は公開しない
      Given main の更新が SemVer core を変えていない
      When release workflow が更新を検査する
      Then merge commit の committer 時刻から "vX.Y.Z+YYYYMMDDHHmmss" の tag が作成される
      And package は公開されない
      And GitHub Release は作成されない

    Scenario: 公開gateが閉じている
      Given SemVer core を上げた変更が main へ merge されている
      And package 公開が有効化されていない
      When release workflow が更新を検査する
      Then tag は作成される
      And package と GitHub Release は作成されない

  Rule: 失敗した公開は同じ tag のまま再開できる

    Scenario: 途中で失敗した公開を再開する
      Given 同じ version と SHA-512 integrity の package がすでに公開されている
      And tag または GitHub Release の作成が完了していない
      When 同じ revision から release workflow を再実行する
      Then 同じ tag が再利用され、二つ目の tag は作成されない
      And package は再公開されない
      And 不足しているrelease metadataだけが作成される

    Scenario: 公開済み version の内容が異なる
      Given 同じ versionで異なるSHA-512 integrityのpackageが公開されている
      When release workflow を再実行する
      Then workflow は immutable violation として停止する
      And tag は移動も削除もされない

    Scenario Outline: 失敗の原因だけがリトライを決める
      Given 公開が "<cause>" で失敗する
      When release workflow が失敗を分類する
      Then workflow は "<behaviour>"
      And tag は打ち直されない

      Examples:
        | cause                                  | behaviour                    |
        | registry の 5xx、429、タイムアウト     | 最大 3 回まで再試行する      |
        | build 失敗、test 失敗、401 / 403、409 | 即座に失敗し fix-forward する |

    Scenario: consumer が明示的に更新する
      Given consumer は公開済みの厳密なバージョンを利用している
      When consumer が検証済みの次バージョンへ依存指定を変更する
      Then その consumer の検証とリリースだけが新しい UI 契約を採用する
