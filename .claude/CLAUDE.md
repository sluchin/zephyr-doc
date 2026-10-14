# プロジェクト設定

Zephyr のドキュメント (https://docs.zephyrproject.org/) を、リンクを開いたときに取得して、日本語に翻訳して表示するアプリ。原文 (英語) に戻せる。PC (Linux, Windows, macOS) と Android。Tauri 2 (Rust) + React (TypeScript)。

```
リンクを開く ─> Rust (docs.rs): ページを取得 (docs.zephyrproject.org だけ)
            ─> React (lib/extract.ts, lib/segments.ts): 本文を取り出し、段落に分ける
            ─> Rust (translate.rs): 段落 (HTML の断片) を翻訳 + キャッシュ
            ─> React (lib/translatePage.ts): 翻訳を差し込む ─> DOMPurify ─> 表示
```

- **共通のコードは、サブモジュール `shared/`** (リポジトリ [doc-translator-core](https://github.com/sluchin/doc-translator-core)) にある。画面 (`shared/ts/ui/`)、HTML の取り出しと翻訳の組み立て (`shared/ts/lib/`)、Rust の取得と翻訳とキャッシュ (`shared/rust/`)、ML Kit のプラグイン (`shared/plugins/tauri-plugin-mlkit/`)、開発用のイメージ (`shared/docker/`)。**共通のコードの変更は、共通のリポジトリで行う** (このリポジトリの `shared/` の中で、直接直さない)。変えたら、共通のリポジトリをコミットして push してから、ここで、サブモジュールの参照を更新してコミットする。
- このリポジトリにあるもの: サイトの設定 (`src/site.ts` の `SiteProfile`。`src-tauri/src/lib.rs` の `Site`。ホストは、両方で同じにする)、`src/main.tsx`、サイトの設定のテスト (`src/site.test.ts`)、`src-tauri/` の設定とアイコン、`assets/` (アイコンの素材)。
- 翻訳のバックエンド (Google Cloud Translation、Gemini API、ML Kit) と、API キーの扱いは、共通のコードの `.claude/CLAUDE.md` と README.md を見る。

**Android Studio は使わない。** ビルド、テスト、整形、静的解析は、全て、Docker の中で実行する。

## セキュリティの決まり (守ること)

- 取得するのは `https://docs.zephyrproject.org/` だけ (`docs.rs` の `is_doc_url`、`lib/docUrl.ts` の `isDocUrl`)。リダイレクトも、そのホストの中だけ。ほかのリンクは、ブラウザで開く。
- 表示する HTML は、取得したものも、翻訳されたものも、必ず `sanitize()` (DOMPurify) を通す。`dangerouslySetInnerHTML` に渡すのは、その結果だけ。
- CSP (`tauri.conf.json`) は、画像を `docs.zephyrproject.org` と `data:` だけに限る。広げない。
- ドキュメントの文章を、リポジトリに置かない (テストの HTML は、作り物)。ページの取得は、利用者がリンクを開いたときだけ (事前の取得、巡回はしない)。名前を名乗る User-Agent を付ける。

## コマンド

- `docker compose run` には、必ず `--rm` を付ける。`UID` と `GID` を、シェルでエクスポートしておく。
- 依存関係: `install` / テスト: `test` (サイトの設定のテストと cargo test。共通のコードのテストと 100% のカバレッジは、共通のリポジトリで) / 整形の確認: `format` / 整形: `format-fix` / 静的解析: `analyze` (tsc, ESLint, Clippy) / PC のビルド: `build-desktop` / Android の APK: `build-android` / 生成物の削除: `clean`。
- Windows と macOS のビルドは、それぞれの OS で行う。画面の確認は、ホストの `npx tauri dev` か、実機。

## コーディング規約

- Prettier (TypeScript, CSS, JSON, Markdown) と rustfmt に従う。手で整形しない。ESLint と Clippy の警告を、ゼロにする (`-D warnings`)。
- **ファイルの先頭に、著作権とライセンスを書く** (`Copyright (c) 2026 Tetsuya Higashi` と `SPDX-License-Identifier: GPL-3.0-or-later`)。
- **コメントは、日本語。** 句読点は、「, 」(カンマと空白) と「.」(ピリオド) にする (「、」と「。」は使わない)。読点は、必要なところだけに打つ。ログとエラーのメッセージ、識別子は、英語。画面に出す文字は、日本語 (句読点は「、」「。」でよい)。
- 関数には、TSDoc / rustdoc の説明を付ける (`@param` `@returns`)。
- `!` (非 null の表明) は使わず、`as` は、直前に型が保証されているときだけ使う。`unwrap()` は、テスト以外で使わない。

## 開発フロー

1. 機能開発は、`ccr-*` ブランチで行う。
2. Push 時に GitHub Actions (`.github/workflows/build.yml`) が、`test` `format` `analyze` `build-desktop` `build-android` (チェックアウトは、サブモジュールも取る) を実行する。
3. コードを修正したら、`format-fix` → `format` → `analyze` → `test` を、全て成功させる。共通のコードを変えたら、共通のリポジトリでも、`coverage` まで、成功させる。`tauri.conf.json`、`Cargo.toml`、Android の設定を変えたら、`build-desktop` と `build-android` も実行する。
4. ビルドやテストを実行できなかったときは、そのことを報告する。ユーザーに依頼されない限り、`git commit` / `git push` は行わない。

## 実機で未確認

画面の見た目、翻訳の品質 (Google, Gemini, ML Kit の結果。特に ML Kit の目印が残るか)、Gemini のモデルの名前と無料枠、ML Kit のモデルの取得、Android の APK の動作 (インストール、リンク、設定、戻るボタン)、Windows と macOS のビルド。

## アイコン

`assets/` の SVG (`icon.svg` デスクトップ、`icon-bg.svg` と `icon-fg.svg` Android の背景と前景、`icon-mono.svg` テーマアイコン) と、PNG (SVG から作った 1024 px) と、`icon.json` (マニフェスト)。作り直すときは、SVG から PNG を作り (`npx tauri icon assets/<名前>.svg -p 1024 -o <一時のディレクトリ>`)、`npx tauri icon assets/icon.json` を実行する (`src-tauri/icons/` と、Android の `mipmap-*` が更新される)。`tauri android init` のあとにも、必ず実行する (初期化が、Tauri の既定のアイコンに戻すため)。

## コミットガイドライン

- コミットメッセージは英語。件名は Conventional Commits の `type(scope): description` (type: `feat` `fix` `docs` `style` `refactor` `test` `build` `ci` `chore`。scope: `app` `rust` `android` `docker`)。description は、英語で、命令形。
- 件名のあとに空行を 1 行入れて、本文を書く。本文はハイフンで始まる箇条書き。
- コミットメッセージに `Co-Authored-By` または Claude 帰属行を含めない。
- rebase のあとの push は、`git push --force-with-lease --force-if-includes origin <ブランチ名>`。
