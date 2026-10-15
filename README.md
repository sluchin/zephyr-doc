# zephyr-doc

Zephyr のドキュメント (https://docs.zephyrproject.org/) を、**リンクを開いたときに** 取得して、日本語に翻訳して表示するアプリです (事前に翻訳したものは、ありません)。「原文に戻す」で、英語に戻せます。PC (Linux, Windows, macOS) と Android で動きます。

- **Tauri 2** (Rust) + **React** (TypeScript)。
- 翻訳のサービスは、設定で選びます。**Google Cloud Translation** (Basic, v2)、**Gemini API**、**ML Kit** (Android のみ。端末の中で翻訳。オフライン)、**Google 翻訳 (無料)** (キー不要。非公式の入口)。API キーは、使う人が自分のものを、アプリの設定に入れます (キーは、アプリに含めません)。
- 翻訳の結果は、端末にキャッシュします (同じ文章を、もう一度翻訳しないため。翻訳の費用を減らします)。

## 仕組み

```
リンクを開く ─> Rust: ドキュメントのページを取得 (docs.zephyrproject.org だけ)
            ─> React: 本文を取り出し (リンクと画像は絶対 URL に)、段落ごとに分ける
            ─> Rust: 段落 (HTML の断片) を翻訳 (コードには「翻訳しない」印を付ける) ─> キャッシュ
               (Google / Gemini: HTML のまま。ML Kit と無料の Google 翻訳: タグを目印 `[[0]]` に置き換えて翻訳し、戻す)
            ─> React: 翻訳を差し込んで表示 (リンクは、アプリの中で開く)
```

- コードのブロック、関数のシグネチャ、文中のコード (`code` など) は、翻訳しません。
- 翻訳の結果で、コードの印やリンクの数が変わった段落は、英語のまま残します (画面に件数を出します)。
- 表示する HTML は、取得したものも、翻訳されたものも、必ず `DOMPurify` を通します (スクリプトなどを除きます)。
- 取得できるのは、`https://docs.zephyrproject.org/` のページだけです。ほかのリンクは、ブラウザで開きます。

## 使い方

1. アプリを起動して、右上の ⚙ から、翻訳のサービスを選んで、API キーを入れます (ML Kit と無料の Google 翻訳は、キーが要りません)。
2. トップが開きます。リンクを押すと、そのページを取得して、翻訳して表示します。
3. 左上の ☰ で、**メニュー (ナビゲーションドロワー)** を開きます。左のメニュー (目次) は、各ページの HTML から読みます (今の位置の枝が開いた形)。ページを進めても、いつでも開けます。日本語の表示のときは、開いたときに、項目の名前も翻訳します (キャッシュされます)。項目を押すと、そのページを開いて、閉じます。
4. **読んだ場所**: 右端に、スクロールバーを出します。つまみを押して動かすと、つまみの横に、今のページの、読み進めた場所 / ページ全体 (「3 / 12 画面 (25%)」) が出ます。最後に開いたページと、ページごとの読んだ位置を、端末に覚えて、次の起動で戻します。
5. **トップとしおり**: ツールバーの ⌂ (と、メニューの「トップ」) でトップのページに戻ります。☆ で今のページにしおりを付けて、メニューの「しおり」から開きます (外すのは ✕)。
6. 「原文に戻す」で英語、「日本語に翻訳」で、もう一度日本語にします。

| サービス                 | キー                                                                            | 特徴                                                                                                                                                            |
| :----------------------- | :------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google Cloud Translation | Google Cloud で「Cloud Translation API」を有効にして、「API キー」を作る        | 速くて安定。Basic (v2) は、月 50 万文字まで無料 (超えると有料)                                                                                                  |
| Gemini API               | Google AI Studio で作る                                                         | 指示で、コードや用語を訳さないようにできる。自然な訳になりやすい。無料枠には、リクエストの上限がある。モデルは、設定で変えられる (既定は `gemini-flash-latest`) |
| ML Kit                   | 要らない (設定の「動作を確認する」で、モデルの取得と、短い文章の翻訳を試せます) | Android だけ。初めてのときに、モデル (約 30 MB) を取得。そのあとは、通信しない。品質は、クラウドより低め                                                        |
| Google 翻訳 (無料)       | 要らない                                                                        | Web の翻訳と同じ入口 (非公式)。ML Kit より速い。仕様が変わったり、短い時間に多く送ると、断られたりすることがある。文章は、Google に送られる。個人が読む用       |

キーは、サービスごとに保存します。サービスを切り替えても、別のサービスのキーは、残ります (戻したとき、入れ直す必要はありません。アプリを消すと、消えます)。長いページは、数万文字になるので、翻訳の結果のキャッシュが効きます。サービスごとに、別のキャッシュです。

## 共通のコード (サブモジュール)

画面、HTML の取り出し、翻訳、取得、キャッシュ、ML Kit のプラグインは、**共通のリポジトリ** [doc-translator-core](https://github.com/sluchin/doc-translator-core) に、あります (サブモジュール `shared/`)。このリポジトリには、Zephyr だけの設定 (`src/site.ts` と `src-tauri/src/lib.rs` の `SITE`) と、アイコンと、アプリの設定だけがあります。姉妹アプリは、[kotlin-doc](https://github.com/sluchin/kotlin-doc) (Kotlin のドキュメント) です。

```bash
git clone --recurse-submodules git@github.com:sluchin/zephyr-doc.git   # 取り込み済みなら: git submodule update --init
```

## 開発 (Docker)

ビルドと検査は、全て Docker の中で行います (ホストに、Node.js や Rust は要りません)。`UID` と `GID` を、シェルでエクスポートしておきます。

```bash
export UID GID=$(id -g)
docker compose run --rm install          # 依存関係 (npm ci)
docker compose run --rm test             # サイトの設定のテストと cargo test (共通のコードのテストは shared で)
docker compose run --rm format           # 整形の確認 (format-fix で整形)
docker compose run --rm analyze          # tsc, ESLint, Clippy
docker compose run --rm build-desktop    # PC (Linux) のデバッグ版
docker compose run --rm build-android    # Android のデバッグ版 APK
```

- Android の APK: `src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk` (arm64)。
- Windows と macOS は、それぞれの OS で `npm ci && npx tauri build` を実行します (Rust, Node.js, 各 OS の Tauri の前提が要ります。https://tauri.app/start/prerequisites/)。
- 画面の確認 (`npx tauri dev`) は、ホストで行います。

## リリース

`v0.1.0` のようなタグを push すると、GitHub Actions の `release.yml` が、PC (Windows、macOS、Linux のインストーラ。Windows は exe 単体の zip も) と Android の APK を作って、GitHub Releases の**ドラフト**に載せます (中身を確かめて、手で公開します)。APK は、デバッグ鍵で署名したデバッグ版です。タグを打たずに試すときは、Actions の Release を手動で実行します (成果物は、Artifacts に保存されます)。

## ライセンス

GPL-3.0-or-later。Zephyr のドキュメントは、Zephyr Project のものです (Apache-2.0)。このリポジトリには、ドキュメントの文章を、含めません (実行のときに、取得します)。
