/**
 * Copyright (c) 2026 Tetsuya Higashi
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { describe, expect, it } from "vitest";
import { extractPage } from "../shared/ts/lib/extract";
import { isDocUrl } from "../shared/ts/lib/docUrl";
import { site } from "./site";

/** 作り物の Sphinx 風のページ (ドキュメントの文章は使わない). */
const PAGE = `<html><head><title>Sample — Zephyr Project Documentation</title></head><body>
<nav>Side menu</nav>
<div role="main"><h1>Sample</h1><p>Body text.</p></div>
<div class="rst-versions">Versions</div></body></html>`;

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
});
