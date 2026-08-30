import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("PWA Manifest & Service Worker Specifications", () => {
  it("should have a valid public/favicon/site.webmanifest conforming to PWA standards", () => {
    const manifestPath = path.resolve(process.cwd(), "public/favicon/site.webmanifest");
    expect(fs.existsSync(manifestPath)).toBe(true);

    const raw = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(raw);

    expect(manifest.name).toBeDefined();
    expect(manifest.short_name).toBe("Gitopsy");
    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toBe("#FFDC58");
    expect(manifest.background_color).toBe("#F4EFE6");
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);

    const has192 = manifest.icons.some((i: any) => i.sizes === "192x192");
    const has512 = manifest.icons.some((i: any) => i.sizes === "512x512");
    expect(has192).toBe(true);
    expect(has512).toBe(true);
  });

  it("should have a valid public/manifest.webmanifest root alias", () => {
    const manifestPath = path.resolve(process.cwd(), "public/manifest.webmanifest");
    expect(fs.existsSync(manifestPath)).toBe(true);

    const raw = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(raw);

    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("standalone");
  });

  it("should have a valid public/sw.js service worker with precache list", () => {
    const swPath = path.resolve(process.cwd(), "public/sw.js");
    expect(fs.existsSync(swPath)).toBe(true);

    const swContent = fs.readFileSync(swPath, "utf-8");
    expect(swContent).toContain("CACHE_NAME");
    expect(swContent).toContain("PRECACHE_ASSETS");
    expect(swContent).toContain("addEventListener(\"install\"");
    expect(swContent).toContain("addEventListener(\"fetch\"");
  });
});
