/**
 * Copyright (c) 2026 Tetsuya Higashi
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { describe, expect, it } from "vitest";
import { extractPage } from "../shared/ts/lib/extract";
import { isDocUrl } from "../shared/ts/lib/docUrl";
import { versionOf, withVersion } from "../shared/ts/lib/version";
import { site } from "./site";

/** 作り物の Sphinx 風のページ (ドキュメントの文章は使わない). */
const PAGE = `<html><head><title>Sample — Zephyr Project Documentation</title></head><body>
<nav>Side menu</nav>
<div class="wy-menu wy-menu-vertical"><div class="rst-versions"><dl><dt>v</dt></dl></div>
<ul class="current"><li class="toctree-l1"><a href="../intro/index.html">Introduction</a></li>
<li class="toctree-l1 current"><a href="index.html">Kernel</a><ul><li><a href="a.html">Services</a></li></ul></li></ul></div>
<div role="main"><h1>Sample</h1><p>Body text.</p></div>
<div class="rst-versions"><div class="rst-other-versions"><dl><dt>Versions</dt>
<dd><a href="/">latest</a></dd><dd><a href="/4.4.0/">4.4.0</a></dd><dd><a href="/3.7.0/">3.7.0 (LTS)</a></dd></dl>
<dl><dt>Downloads</dt><dd><a href="/latest/zephyr.pdf">PDF</a></dd></dl></div></div></body></html>`;

describe("Zephyr site profile", () => {
  it("opens only the documentation host, starting from the home page", () => {
    expect(isDocUrl(site.homeUrl, site)).toBe(true);
    expect(isDocUrl("https://example.com/", site)).toBe(false);
  });

  it("takes the main content and strips the site name from the title", () => {
    const page = extractPage(PAGE, site.homeUrl, site);
    expect(page.title).toBe("Sample");
    expect(page.html).toContain("Body text.");
    expect(page.html).not.toContain("Side menu");
  });

  it("reads the menu of the page into a tree with absolute urls", () => {
    const page = extractPage(PAGE, "https://docs.zephyrproject.org/latest/kernel/index.html", site);
    expect(page.menu.map((item) => item.title)).toEqual(["Introduction", "Kernel"]);
    expect(page.menu[0].url).toBe("https://docs.zephyrproject.org/latest/intro/index.html");
    expect(page.menu[1].children[0].title).toBe("Services");
  });

  it("starts from a fixed version and reads the version list of the page", () => {
    const pattern = site.versions?.pattern as RegExp;
    expect(versionOf(site.homeUrl, pattern)).toBe("4.4.0");
    const page = extractPage(PAGE, "https://docs.zephyrproject.org/4.4.0/kernel/index.html", site);
    // latest (リンクが `/`) と, ダウンロードの一覧は, 版の選択肢にしない
    expect(page.versions).toEqual([
      { version: "4.4.0", label: "4.4.0" },
      { version: "3.7.0", label: "3.7.0 (LTS)" },
    ]);
    expect(page.html).not.toContain("Versions");
    expect(
      withVersion("https://docs.zephyrproject.org/latest/doxygen/html/a.html", pattern, "4.4.0"),
    ).toBe("https://docs.zephyrproject.org/4.4.0/doxygen/html/a.html");
  });
});
