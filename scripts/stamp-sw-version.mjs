#!/usr/bin/env node
/**
 * Stamps the service worker with a content-derived cache version so that
 * deploys automatically invalidate stale caches without requiring a manual
 * CACHE_NAME bump.
 *
 * Run as part of `pnpm build` (before `next build`).
 *
 * Strategy: hash the concatenated content of all precacheable assets that the
 * SW manages (its own source + the precache list entries that exist on disk).
 * On every build, Next.js generates new chunk hashes in `_next/static/`, so
 * we only need to hash the SW source itself — the SW already uses a
 * network-first strategy for navigation and stale-while-revalidate for
 * `_next/static/` chunks, so the SW version only needs to change when *the
 * SW logic itself* changes or the precache manifest changes.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SW_PATH = resolve("public/sw.js");

const source = readFileSync(SW_PATH, "utf-8");

// Derive a short hex hash from the SW source
const hash = createHash("sha256").update(source).digest("hex").slice(0, 8);
const versionedName = `gitopsy-${hash}`;

// Replace the existing CACHE_NAME value
const updated = source.replace(
  /const CACHE_NAME = "[^"]+";/,
  `const CACHE_NAME = "${versionedName}";`
);

if (updated !== source) {
  writeFileSync(SW_PATH, updated, "utf-8");
  console.log(`[sw-version] CACHE_NAME stamped: ${versionedName}`);
} else {
  console.log(`[sw-version] CACHE_NAME already up to date: ${versionedName}`);
}
