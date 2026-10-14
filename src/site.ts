/**
 * Copyright (c) 2026 Tetsuya Higashi
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { SiteProfile } from "../shared/ts/lib/profile";

/** Zephyr のドキュメント (Sphinx + Read the Docs テーマ) の設定. */
export const site: SiteProfile = {
  name: "Zephyr Doc",
  host: "docs.zephyrproject.org",
  pathPrefix: "/",
  homeUrl: "https://docs.zephyrproject.org/latest/index.html",
  contentSelectors: ['[role="main"]', "main"],
  removeSelectors: [".rst-versions"],
  titleSuffix: / [—–-] .*Documentation$/,
};
