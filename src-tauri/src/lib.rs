// Copyright (c) 2026 Tetsuya Higashi
//
// SPDX-License-Identifier: GPL-3.0-or-later

//! Zephyr のドキュメントを, 開いたときに翻訳して表示するアプリ. 中身は, 共通のコード (shared).

use doc_translator_core::Site;

/// 取得するサイト (TypeScript 側の `src/site.ts` と, ホストを同じにする).
const SITE: Site = Site {
    host: "docs.zephyrproject.org",
    alt_host: None,
    user_agent: "zephyr-doc-trans/0.1 (+https://github.com/sluchin/zephyr-doc-trans)",
};

/// アプリを起動する.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    doc_translator_core::builder(SITE)
        .plugin(tauri_plugin_mlkit::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
